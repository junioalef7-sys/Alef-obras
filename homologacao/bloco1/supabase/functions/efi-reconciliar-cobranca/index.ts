import { syncCharge } from '../_shared/recebimento.mjs'
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

const corsHeaders={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}
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
function mapStatus(s:string){
  switch(String(s||'').toLowerCase()){
    case 'paid': return 'aprovado'
    case 'refunded': return 'reembolsado'
    case 'contested': return 'estornado'
    case 'canceled': return 'cancelado'
    case 'unpaid': return 'rejeitado'
    case 'expired': return 'expirado'
    case 'identified':
    case 'approved': return 'processando'
    case 'waiting':
    case 'link':
    case 'new':
    case 'settled': return 'pendente'
    default: return 'pendente'
  }
}
function deveReverter(status:string){return ['reembolsado','estornado','cancelado','expirado'].includes(status)}
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
  const pagamentoId=String(body?.pagamentoId||'').trim();if(!pagamentoId)return json({error:'Pagamento não informado.'},400)
  const {data:perfil}=await admin.from('perfis').select('empresa_id').eq('id',user.id).single()
  if(!perfil?.empresa_id)return json({error:'Perfil sem empresa vinculada.'},403)
  const {data:p,error:pe}=await admin.from('pagamentos_assinatura').select('id,empresa_id,status,valor,metodo,moeda,provedor_pagamento_id,provedor_recurso_tipo,detalhes').eq('id',pagamentoId).eq('empresa_id',perfil.empresa_id).eq('provedor','efi').single()
  if(pe||!p)return json({error:'Pagamento não encontrado.'},404)
  if(!['payment_link','payment'].includes(p.provedor_recurso_tipo)||!p.provedor_pagamento_id)return json({error:'Cobrança Efí inválida para esta verificação.'},400)
  try{
    const base=baseUrl(),token=await authToken(base)
    const r=await fetch(`${base}/v1/charge/${encodeURIComponent(String(p.provedor_pagamento_id))}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}})
    const d=await r.json().catch(()=>({}));const charge=d?.data||d
    if(!r.ok||!charge?.charge_id)return json({error:'Não foi possível consultar a cobrança na Efí.'},502)
    const expected=Math.round(Number(p.valor)*100),total=Number(charge?.total||0)
    if(total!==expected)return json({error:'Valor da cobrança diferente do valor esperado.'},409)
    const providerStatus=String(charge?.status||'').toLowerCase(),localStatus=mapStatus(providerStatus)
    if (String(charge.charge_id)!==String(p.provedor_pagamento_id)) return json({error:'Identificador divergente'},409)
    if (p.detalhes?.serie==='bloco1-hml-v1') {
      const aplicado=await syncCharge(admin,p,charge,undefined)
      return json({pagamentoId:p.id,status:localStatus,aplicado,homologacao:true})
    }
    // Consulta de homologacao NAO ativa planos ou grava pagamentos.
    return json({pagamentoId:p.id,status:localStatus,provedorStatus:String(charge?.status||''),aplicado:false,revertido:false,modo:'somente_leitura'})
  }catch(err){return json({error:err instanceof Error?err.message:String(err)},503)}
})
