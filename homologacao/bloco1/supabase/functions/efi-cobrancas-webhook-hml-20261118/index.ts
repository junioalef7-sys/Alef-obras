import { syncCharge } from '../_shared/recebimento.mjs'
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'
import { timingSafeEqual } from 'node:crypto'

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
  const basic=btoa(`${required('EFI_COBRANCAS_CLIENT_ID')}:${required('EFI_COBRANCAS_CLIENT_SECRET')}`)
  const r=await fetch(`${base}/v1/authorize`,{method:'POST',headers:{Authorization:`Basic ${basic}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({grant_type:'client_credentials'})})
  const d=await r.json().catch(()=>({}))
  if(!r.ok||!d?.access_token)throw new Error(`Falha na autenticação Efí Cobranças (${r.status}).`)
  return String(d.access_token)
}
function safeEqual(a:string,b:string){
  const aa=new TextEncoder().encode(a),bb=new TextEncoder().encode(b)
  return aa.length===bb.length && timingSafeEqual(aa,bb)
}
function webhookHmac(){return required('EFI_COBRANCAS_WEBHOOK_HMAC')}

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
  if(req.method!=='POST')return new Response('Método não permitido',{status:405})
  const supabaseUrl=Deno.env.get('SUPABASE_URL')!,serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  // Fail closed: função exclusiva do projeto de homologação isolado.
  if(new URL(supabaseUrl).hostname!=='xavwkfgrnowmusbkbiea.supabase.co') return new Response('Ambiente isolado obrigatório',{status:503})
  if(!serviceKey) return new Response('Configuração indisponível',{status:503})
  let expected=''
  try{expected=webhookHmac()}catch{return new Response('Webhook não configurado',{status:503})}
  const got=new URL(req.url).searchParams.get('hmac')||''
  if(!got||!safeEqual(got,expected))return new Response('unauthorized',{status:401})
  const notification=await extractNotification(req)
  if(!notification)return new Response('Token ausente',{status:400})
  const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
  // Guardar antes do GET: para a Efí, consultar o token equivale a recebê-lo.
  const {data:novo,error:reserveError}=await admin.rpc('obrix_hml_efi_reservar_notificacao',{p_token:notification})
  if(reserveError)return new Response('Não foi possível registrar notificação',{status:503})
  if(!novo)return new Response(null,{status:204})
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
    let pagamentosLocalizados=0
    for(const [chargeId,ev] of latest.entries()){
      const {data:p,error:findError}=await admin.from('pagamentos_assinatura').select('id,empresa_id,status,valor,metodo,moeda,provedor_pagamento_id,detalhes').eq('provedor','efi').in('provedor_recurso_tipo',['payment_link','payment']).eq('provedor_pagamento_id',chargeId).maybeSingle()
      if(findError)throw new Error('Erro ao localizar cobrança no OBRIX')
      if(!p?.id)continue
      pagamentosLocalizados++
      const providerStatus=String(ev?.status?.current||'').toLowerCase(),localStatus=mapStatus(providerStatus)
      if(!localStatus)continue
      const expectedCents=Math.round(Number(p.valor)*100),paidValue=ev?.value!=null?Number(ev.value):null
      if(providerStatus==='paid'&&(!Number.isFinite(paidValue))){
        throw new Error('Valor confirmado ausente na notificação da Efí; necessária reconciliação')
      }
      if(providerStatus==='paid'&&paidValue!==expectedCents){
        // Divergência financeira não deve ser resolvida marcando o pagamento como rejeitado.
        throw new Error('Valor confirmado pela Efí diferente do valor esperado: exigir revisão')
      }
      if(localStatus==='pendente' && ['aprovado','reembolsado','estornado'].includes(p.status))continue
      // HML: record verified provider events for sandbox charges without granting access.
      const teste = ['true','1','sim','yes'].includes(String(p.detalhes?.homologacao_teste??false).toLowerCase()) || ['true','1','sim','yes'].includes(String(p.detalhes?.simulado??false).toLowerCase())
      if(p.detalhes?.serie==='bloco1-hml-v1'){
        const detail=await fetch(base+'/v1/charge/'+encodeURIComponent(chargeId),{headers:{Authorization:'Bearer '+token,Accept:'application/json'}})
        if(!detail.ok)throw new Error('Consulta financeira indisponível')
        await syncCharge(admin,p,(await detail.json()).data,providerStatus==='paid'?paidValue:undefined)
        continue
      }
      if(teste){
        const {error:te}=await admin.from('pagamentos_assinatura').update({detalhes:{...(p.detalhes||{}),ultima_notificacao_hml:ev,status_provedor_hml:localStatus,notificacao_hml_em:new Date().toISOString()}}).eq('id',p.id)
        if(te)throw new Error('Falha ao registrar notificação de homologação')
        continue
      }
      const update:any={status:localStatus,detalhes:{...(p.detalhes||{}),ultima_notificacao:ev,notification_token:notification}}
      if(localStatus==='aprovado')update.aprovado_em=new Date().toISOString()
      const {data:saved,error:ue}=await admin.from('pagamentos_assinatura').update(update).eq('id',p.id).select('id')
      if(ue || !Array.isArray(saved) || saved.length!==1)throw new Error('Falha ao atualizar status do pagamento')
      if(localStatus==='aprovado'){
        const {error:applyError}=await admin.rpc('obrix_hml_aplicar_pagamento_assinatura',{p_pagamento_id:p.id})
        if(applyError)throw new Error('Falha ao aplicar o pagamento confirmado')
      }else if(deveReverter(localStatus)){
        const {error:reverseError}=await admin.rpc('obrix_hml_reverter_pagamento_assinatura',{p_pagamento_id:p.id,p_motivo:`Efí Cobranças: ${providerStatus}`})
        if(reverseError)throw new Error('Falha ao registrar estorno no sistema')
      }
    }
    if(latest.size>0 && pagamentosLocalizados===0)throw new Error('Notificação sem cobranças OBRIX correspondentes')
    const {error:doneError}=await admin.rpc('obrix_hml_efi_finalizar_notificacao',{p_token:notification,p_erro:null})
    if(doneError)throw new Error('Falha ao concluir notificação no registro interno')
  }catch(e){
    const errorMsg=e instanceof Error?e.message:'erro inesperado'
    console.error('Webhook Efí: falha na conciliação',errorMsg)
    // Registrar para replay. HTTP 503 isoladamente NÃO garante reenvio pela Efí após GET.
    const {error:logError}=await admin.rpc('obrix_hml_efi_finalizar_notificacao',{p_token:notification,p_erro:errorMsg})
    if(logError)console.error('Webhook Efí: falha ao registrar pendência')
    return new Response('Falha temporária na conciliação',{status:503})
  }
  return new Response('ok',{status:200})
})
