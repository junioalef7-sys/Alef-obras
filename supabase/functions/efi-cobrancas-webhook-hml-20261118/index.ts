import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

function required(name:string){const v=(Deno.env.get(name)||'').trim();if(!v)throw new Error(`${name} não configurado.`);return v}
function baseUrl(){
  const explicit=(Deno.env.get('EFI_COBRANCAS_BASE_URL')||'').trim().replace(/\/$/,'')
  if(explicit && explicit.replace(/\/$/,'')!=='https://cobrancas-h.api.efipay.com.br')throw new Error('Configuração Efí fora de homologação')
  if(explicit)return explicit
  const pix=(Deno.env.get('EFI_PIX_BASE_URL')||'').trim()
  if(pix!=='https://pix-h.api.efipay.com.br')throw new Error('Endereço Pix de homologação obrigatório')
  return 'https://cobrancas-h.api.efipay.com.br'
}
async function authToken(base:string){
  const basic=btoa(`${required('EFI_CLIENT_ID')}:${required('EFI_CLIENT_SECRET')}`)
  const r=await fetch(`${base}/v1/authorize`,{method:'POST',headers:{Authorization:`Basic ${basic}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({grant_type:'client_credentials'})})
  const d=await r.json().catch(()=>({}))
  if(!r.ok||!d?.access_token)throw new Error(`Falha na autenticação Efí Cobranças (${r.status}).`)
  return String(d.access_token)
}
async function webhookHmac(serviceKey:string){
  const configured=(Deno.env.get('EFI_COBRANCAS_WEBHOOK_HMAC')||'').trim()
  if(configured)return configured
  const enc=new TextEncoder(),key=await crypto.subtle.importKey('raw',enc.encode(serviceKey),{name:'HMAC',hash:'SHA-256'},false,['sign'])
  const sig=await crypto.subtle.sign('HMAC',key,enc.encode('OBRIX_EFI_COBRANCAS_WEBHOOK_V1'))
  return Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,'0')).join('')
}
function mapStatus(s:string){
  switch(String(s||'').toLowerCase()){
    case 'paid': return 'aprovado'
    case 'refunded': return 'reembolsado'
    case 'contested': return 'estornado'
    case 'canceled': return 'cancelado'
    case 'unpaid':
    case 'expired': return 'expirado'
    case 'identified':
    case 'approved': return 'processando'
    case 'waiting':
    case 'link':
    case 'new':
    case 'settled': return 'pendente'
    default: return null
  }
}
function deveReverter(status:string){return ['reembolsado','estornado','cancelado','expirado'].includes(status)}
async function extractNotification(req:Request){
  const ct=(req.headers.get('content-type')||'').toLowerCase()
  try{
    if(ct.includes('application/x-www-form-urlencoded')||ct.includes('multipart/form-data')){
      const f=await req.formData();return String(f.get('notification')||'').trim()
    }
    if(ct.includes('application/json')){const j=await req.json();return String(j?.notification||'').trim()}
    const t=await req.text();const p=new URLSearchParams(t);return String(p.get('notification')||'').trim()
  }catch{return ''}
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return new Response('ok',{status:200})
  const supabaseUrl=Deno.env.get('SUPABASE_URL')!,serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  // Fail closed: função exclusiva do projeto de homologação isolado.
  if(new URL(supabaseUrl).hostname!=='xavwkfgrnowmusbkbiea.supabase.co') return new Response('Ambiente isolado obrigatório',{status:503})
  if(!serviceKey) return new Response('Configuração indisponível',{status:503})
  const expected=await webhookHmac(serviceKey),got=new URL(req.url).searchParams.get('hmac')||''
  if(!got||got!==expected)return new Response('unauthorized',{status:401})
  const notification=await extractNotification(req)
  if(!notification)return new Response('ok',{status:200})
  const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
  try{
    const base=baseUrl(),token=await authToken(base)
    const r=await fetch(`${base}/v1/notification/${encodeURIComponent(notification)}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}})
    const d=await r.json().catch(()=>({}))
    if(!r.ok||!Array.isArray(d?.data)) throw new Error('Falha ao validar notificação no provedor Efí')

    const latest=new Map<string,any>()
    for(const ev of d.data){
      const chargeId=ev?.identifiers?.charge_id
      if(!chargeId)continue
      const key=String(chargeId),prev=latest.get(key)
      if(!prev||Number(ev?.id||0)>=Number(prev?.id||0))latest.set(key,ev)
    }
    for(const [chargeId,ev] of latest.entries()){
      const {data:p}=await admin.from('pagamentos_assinatura').select('id,status,valor,detalhes').eq('provedor','efi').eq('provedor_recurso_tipo','payment_link').eq('provedor_pagamento_id',chargeId).maybeSingle()
      if(!p?.id)continue
      const providerStatus=String(ev?.status?.current||'').toLowerCase(),localStatus=mapStatus(providerStatus)
      if(!localStatus)continue
      const expectedCents=Math.round(Number(p.valor)*100),paidValue=ev?.value!=null?Number(ev.value):null
      if(providerStatus==='paid'&&(!Number.isFinite(paidValue))){
        throw new Error('Valor confirmado ausente na notificação da Efí; necessária reconciliação')
      }
      if(providerStatus==='paid'&&paidValue!==expectedCents){
        await admin.from('pagamentos_assinatura').update({status:'rejeitado',detalhes:{...(p.detalhes||{}),notificacao:ev,erro:'Valor confirmado pela Efí diferente do valor esperado.'}}).eq('id',p.id)
        continue
      }
      const update:any={status:localStatus,detalhes:{...(p.detalhes||{}),ultima_notificacao:ev,notification_token:notification}}
      if(localStatus==='aprovado')update.aprovado_em=new Date().toISOString()
      const {error:ue}=await admin.from('pagamentos_assinatura').update(update).eq('id',p.id)
      if(ue)throw new Error('Falha ao atualizar status do pagamento')
      if(localStatus==='aprovado'){
        const {error:applyError}=await admin.rpc('obrix_aplicar_pagamento_assinatura',{p_pagamento_id:p.id})
        if(applyError)throw new Error('Falha ao aplicar o pagamento confirmado')
      }else if(deveReverter(localStatus)){
        const {error:reverseError}=await admin.rpc('obrix_reverter_pagamento_assinatura',{p_pagamento_id:p.id,p_motivo:`Efí Cobranças: ${providerStatus}`})
        if(reverseError)throw new Error('Falha ao registrar estorno no sistema')
      }
    }
  }catch(e){
    console.error('Webhook Efí: falha na conciliação',e instanceof Error?e.message:'erro sem detalhes')
    // Retornar 503 permite que o provedor tente novamente quando suportado.
    // Um job periódico de conciliação deverá cobrir falhas sem reenvio.
    return new Response('Falha temporária na conciliação',{status:503})
  }
  return new Response('ok',{status:200})
})
