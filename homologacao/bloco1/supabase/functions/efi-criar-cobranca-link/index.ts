import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
}
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})}
function required(name:string){const v=(Deno.env.get(name)||'').trim();if(!v)throw new Error(`${name} não configurado.`);return v}
function baseUrl(){
  const explicit=(Deno.env.get('EFI_COBRANCAS_BASE_URL')||'').trim().replace(/\/$/,'')
  if(explicit)return explicit
  const pix=(Deno.env.get('EFI_PIX_BASE_URL')||'').trim()
  return pix.includes('pix-h.api.efipay.com.br')?'https://cobrancas-h.api.efipay.com.br':'https://cobrancas.api.efipay.com.br'
}
async function authToken(base:string){
  const basic=btoa(`${required('EFI_COBRANCAS_CLIENT_ID')}:${required('EFI_COBRANCAS_CLIENT_SECRET')}`)
  const r=await fetch(`${base}/v1/authorize`,{method:'POST',headers:{Authorization:`Basic ${basic}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({grant_type:'client_credentials'})})
  const d=await r.json().catch(()=>({}))
  if(!r.ok||!d?.access_token)throw new Error(`Falha na autenticação Efí Cobranças (${r.status}).`)
  return String(d.access_token)
}
async function api(base:string,token:string,path:string,init:RequestInit={}){
  const r=await fetch(`${base}${path}`,{...init,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',Accept:'application/json',...(init.headers||{})}})
  const d=await r.json().catch(()=>({}))
  return {r,d}
}
async function webhookHmac(serviceKey:string){
  const configured=(Deno.env.get('EFI_COBRANCAS_WEBHOOK_HMAC')||'').trim()
  if(configured)return configured
  const enc=new TextEncoder(),key=await crypto.subtle.importKey('raw',enc.encode(serviceKey),{name:'HMAC',hash:'SHA-256'},false,['sign'])
  const sig=await crypto.subtle.sign('HMAC',key,enc.encode('OBRIX_EFI_COBRANCAS_WEBHOOK_V1'))
  return Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,'0')).join('')
}
function datePlus(days:number){const d=new Date();d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders})
  if(req.method!=='POST')return json({error:'Método não permitido.'},405)
  const supabaseUrl=Deno.env.get('SUPABASE_URL')!,serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  // Fail-closed: nunca executar fora do banco e das APIs de homologacao.
  let host='';try{host=new URL(supabaseUrl).hostname}catch{}
  if(host!=='xavwkfgrnowmusbkbiea.supabase.co'
     || (Deno.env.get('EFI_PIX_BASE_URL')||'').trim()!=='https://pix-h.api.efipay.com.br'
     || ((Deno.env.get('EFI_COBRANCAS_BASE_URL')||'').trim().replace(/\/$/,'') && (Deno.env.get('EFI_COBRANCAS_BASE_URL')||'').trim().replace(/\/$/,'')!=='https://cobrancas-h.api.efipay.com.br'))
    return json({error:'Ambiente nao autorizado para a funcao de teste.'},503)
  const access=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'').trim()
  if(!access)return json({error:'Não autenticado.'},401)
  const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:u,error:ue}=await admin.auth.getUser(access);const user=u?.user
  if(ue||!user)return json({error:'Sessão inválida.'},401)
  if(!['231e8d54-eee8-4ba9-b632-077c38179706','cf50c1d8-6c07-468d-92d0-e2291325bd02'].includes(user.id)) return json({error:'Acesso reservado a testers HML.'},403)

  let body:any={};try{body=await req.json()}catch{return json({error:'JSON inválido.'},400)}
  const plano=String(body?.plano||'').toLowerCase(),metodo=String(body?.metodo||'').toLowerCase()
  const direct = metodo==='boleto' && body.forma==='direto'
  const integral = direct || metodo==='cartao' || body.serie==='bloco1-hml-v1'
  if (integral && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(body.requestId || '')) return json({error:'Pedido inválido'},400)
  const requestId=integral ? `bloco1_${direct?'direto':metodo}_${body.requestId}` : `hml_link_${user.id}_${plano}_${metodo}_unico`
  if(!['mensal','anual'].includes(plano))return json({error:'Plano inválido.'},400)
  if(!['boleto','cartao'].includes(metodo))return json({error:'Homologacao permite apenas boleto nesta rota.'},400)

  const {data:perfil,error:pe}=await admin.from('perfis').select('empresa_id').eq('id',user.id).single()
  if(pe||!perfil?.empresa_id)return json({error:'Perfil sem empresa vinculada.'},403)
  const {data:assinatura,error:ae}=await admin.from('assinaturas').select('id').eq('empresa_id',perfil.empresa_id).single()
  if(ae||!assinatura?.id)return json({error:'Assinatura não encontrada.'},404)
  const {data:planoDb,error:ple}=await admin.from('planos_assinatura').select('codigo,nome,valor,periodo,ativo').eq('codigo',plano).eq('ativo',true).single()
  if(ple||!planoDb)return json({error:'Plano indisponível.'},404)

  const baseKey=`${perfil.empresa_id}:${metodo}:${plano}:${requestId}`
  const {data:historico,error:he}=await admin.from('pagamentos_assinatura').select('id,status,checkout_url,vencimento,provedor_pagamento_id,detalhes,idempotency_key').eq('provedor','efi').eq('empresa_id',perfil.empresa_id).eq('metodo',metodo).eq('plano',plano).order('criado_em',{ascending:false})
  if(he)return json({error:'Não foi possível consultar cobranças anteriores.'},503)
  const existente=(historico||[]).find(x=>x.idempotency_key===baseKey||x.idempotency_key.startsWith(baseKey+':renovacao:'))
  let idempotencyKey=baseKey
  if(existente){
    if(integral && existente.checkout_url)return json({pagamentoId:existente.id,status:existente.status,checkoutUrl:existente.checkout_url,vencimento:existente.vencimento,reutilizado:true,metodo})
    if(integral)return json({error:'Pedido registrado. Aguarde a conciliação antes de repetir.'},409)
    const status=String(existente.status),venc=Date.parse(existente.vencimento||'')
    const reutilizar=()=>json({pagamentoId:existente.id,status:existente.status,checkoutUrl:existente.checkout_url,vencimento:existente.vencimento,chargeId:existente.provedor_pagamento_id,reutilizado:true,metodo})
    if(status==='pendente'&&Number.isFinite(venc)&&venc>Date.now()&&existente.checkout_url)return reutilizar()
    if(!['pendente','expirado','cancelado'].includes(status))return json({error:'Cobrança anterior exige conferência antes de nova emissão.'},409)
    if(existente.detalhes?.homologacao_teste!==true||!existente.provedor_pagamento_id)return json({error:'Cobrança anterior não confirmada como teste.'},409)
    if(status==='pendente'&&(!Number.isFinite(venc)||venc>Date.now()))return json({error:'Validade anterior não confirmada.'},409)
    try{
      const base=baseUrl(),token=await authToken(base)
      const {r,d}=await api(base,token,'/v1/charge/'+encodeURIComponent(String(existente.provedor_pagamento_id)))
      const anterior=d?.data||d
      if(!r.ok||String(anterior?.charge_id)!==String(existente.provedor_pagamento_id)||!['link','expired','canceled','unpaid'].includes(String(anterior.status)))return json({error:'Situação da cobrança anterior exige revisão na Efí.'},409)
      if(String(anterior.status)==='link'&&(!Number.isFinite(venc)||venc>Date.now()))return json({error:'Link anterior ainda válido.'},409)
    }catch{return json({error:'Não foi possível confirmar a cobrança anterior na Efí.'},503)}
    idempotencyKey=baseKey+':renovacao:'+existente.id
  }
  const {data:pagamento,error:e}=await admin.from('pagamentos_assinatura').insert({empresa_id:perfil.empresa_id,assinatura_id:assinatura.id,provedor:'efi',metodo,plano,status:'criado',valor:planoDb.valor,moeda:'BRL',idempotency_key:idempotencyKey,detalhes:{...(integral?{serie:'bloco1-hml-v1'}:{}),homologacao_teste:true,ambiente:'homologacao',cobranca_anterior_id:existente?.id||null}}).select('id').single()
  if(e||!pagamento)return json({error:'Não foi possível iniciar a cobrança. Verifique se outra emissão está em andamento.'},409)

  try{
    const base=baseUrl(),token=await authToken(base),hmac=required('EFI_COBRANCAS_WEBHOOK_HMAC')
    const notificationUrl=`${supabaseUrl}/functions/v1/efi-cobrancas-webhook-hml-20261118?hmac=${encodeURIComponent(hmac)}`
    const cents=Math.round(Number(planoDb.valor)*100)
    const paymentMethod=metodo==='boleto'?'banking_billet':'credit_card'
    const expireAt=datePlus(metodo==='boleto'?3:2)
    const payload={
      items:[{name:`OBRIX - ${planoDb.nome||plano}`.slice(0,255),value:cents,amount:1}],
      metadata:{custom_id:(integral?'obrix_hml_':'obrix_hml_boleto_')+String(pagamento.id),notification_url:notificationUrl},
      ...(!integral && user.email?{customer:{email:user.email}}:{}),
      settings:{payment_method:paymentMethod,expire_at:expireAt,request_delivery_address:false,message:'Assinatura OBRIX'}
    }
    // Dados fictícios do exemplo oficial da Efí para emissão direta no sandbox.
    const directPayload = {items:payload.items,metadata:payload.metadata,payment:{banking_billet:{
      expire_at:expireAt,customer:{name:'Gorbadoc Oldbuck',cpf:'94271564656'}
    }}}
    const {r,d}=await api(base,token,direct?'/v1/charge/one-step':'/v1/charge/one-step/link',{method:'POST',body:JSON.stringify(direct?directPayload:payload)})
    const out=d?.data||d
    const checkoutUrl = direct ? out?.link : out?.payment_url
    if(!r.ok||!out?.charge_id||!checkoutUrl || (integral && (out.total!==cents || !String(checkoutUrl).startsWith('https://')))){
      await admin.from('pagamentos_assinatura').update({status:'rejeitado',detalhes:{homologacao_teste:true,httpStatus:r.status,metodo}}).eq('id',pagamento.id).eq('empresa_id',perfil.empresa_id)
      return json({error:'A Efí não conseguiu gerar a página de pagamento.',httpEfipay:r.status},502)
    }
    const venc=new Date(`${expireAt}T23:59:59-03:00`).toISOString()
    const {error:saveErr}=await admin.from('pagamentos_assinatura').update({
      status:'pendente',provedor_recurso_tipo:direct?'payment':'payment_link',provedor_pagamento_id:String(out.charge_id),checkout_url:String(checkoutUrl),vencimento:venc,
      detalhes:{...(integral?{serie:'bloco1-hml-v1'}:{efi_cobrancas:out}),metodo,valor_centavos:cents,notification_url_configurada:true,cobranca_anterior_id:existente?.id||null,homologacao_teste:true,ambiente:'homologacao'}
    }).eq('id',pagamento.id).eq('empresa_id',perfil.empresa_id)
    if(saveErr)return json({error:'Cobrança criada, mas houve falha ao salvar localmente.'},500)
    return json({pagamentoId:pagamento.id,status:'pendente',metodo,checkoutUrl:String(checkoutUrl),chargeId:String(out.charge_id),vencimento:venc,homologacao:base.includes('cobrancas-h.')})
  }catch(err){
    const msg='Não foi possível concluir a comunicação com a Efí. Consulte o pedido antes de repetir.'
    await admin.from('pagamentos_assinatura').update({status:'rejeitado',detalhes:{erro:msg,metodo}}).eq('id',pagamento.id).eq('empresa_id',perfil.empresa_id)
    return json({error:msg},503)
  }
})
