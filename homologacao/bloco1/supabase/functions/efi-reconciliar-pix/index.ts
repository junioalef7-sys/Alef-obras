import { syncPix } from '../_shared/recebimento.mjs'
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type':'application/json' } })
}
function required(name: string) { const value=(Deno.env.get(name)||'').trim(); if(!value) throw new Error(`${name} não configurado.`); return value }
function pem(name:string) {
    if(name==='EFI_PIX_CERT_PEM'){
      const cert=(Deno.env.get(name)||'').trim();
      if(cert)return cert.replace(/\\n/g,'\n');
      const b64=(Deno.env.get('EFI_PIX_CERT_B64')||'').trim();
      if(!b64||!/^[A-Za-z0-9+/]*={0,2}$/.test(b64))throw Error('Certificado sandbox ausente')
      return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(b64),c=>c.charCodeAt(0))).trim()
    }
    return required(name).replace(/\\n/g,'\n');
  }
function baseUrl() { return (Deno.env.get('EFI_PIX_BASE_URL')||'https://pix-h.api.efipay.com.br').replace(/\/$/,'') }
function makeClient() { return Deno.createHttpClient({ cert:pem('EFI_PIX_CERT_PEM'), key:pem('EFI_PIX_KEY_PEM') }) }
async function token(base:string,client:Deno.HttpClient){
  const basic=btoa(`${required('EFI_PIX_CLIENT_ID')}:${required('EFI_PIX_CLIENT_SECRET')}`)
  const r=await fetch(`${base}/oauth/token`,{method:'POST',client,headers:{Authorization:`Basic ${basic}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({grant_type:'client_credentials'})})
  const d=await r.json().catch(()=>({}))
  if(!r.ok||!d?.access_token) throw new Error(`Falha na autenticação Efí (${r.status}).`)
  return String(d.access_token)
}
async function getCharge(base:string,client:Deno.HttpClient,accessToken:string,txid:string){
  const r=await fetch(`${base}/v2/cob/${encodeURIComponent(txid)}`,{client,headers:{Authorization:`Bearer ${accessToken}`,Accept:'application/json'}})
  const d=await r.json().catch(()=>({}))
  return {r,d}
}
function refundTotal(d:any){
  const pix=Array.isArray(d?.pix)?d.pix:[]
  let total=0
  for(const p of pix){
    const ds=Array.isArray(p?.devolucoes)?p.devolucoes:[]
    for(const dev of ds) if(String(dev?.status||'').toUpperCase()==='DEVOLVIDO') total+=Number(dev?.valor||0)
  }
  return total
}

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
  const accessToken=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'').trim()
  if(!accessToken)return json({error:'Não autenticado.'},401)

  const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:userData,error:userError}=await admin.auth.getUser(accessToken); const user=userData?.user
  if(userError||!user)return json({error:'Sessão inválida.'},401)
  if(!['231e8d54-eee8-4ba9-b632-077c38179706','cf50c1d8-6c07-468d-92d0-e2291325bd02'].includes(user.id)) return json({error:'Acesso reservado a testers HML.'},403)

  let body:any={};try{body=await req.json()}catch{body={}}
  const {data:perfil,error:perfilError}=await admin.from('perfis').select('empresa_id').eq('id',user.id).single()
  if(perfilError||!perfil?.empresa_id)return json({error:'Perfil sem empresa vinculada.'},403)

  let query=admin.from('pagamentos_assinatura').select('*').eq('empresa_id',perfil.empresa_id).eq('provedor','efi').eq('metodo','pix').order('criado_em',{ascending:false}).limit(1)
  if(body?.pagamentoId)query=query.eq('id',String(body.pagamentoId))
  const {data:pagamentos,error:pagError}=await query
  const pagamento=Array.isArray(pagamentos)?pagamentos[0]:null
  if(pagError||!pagamento)return json({error:'Pagamento Efí não encontrado.'},404)
  const txid=String(pagamento.provedor_preferencia_id||'')
  if(!txid)return json({error:'Cobrança Pix Efí não localizada.'},409)

  let client:Deno.HttpClient|null=null
  try{
    const base=baseUrl();client=makeClient();const access=await token(base,client)
    const {r,d}=await getCharge(base,client,access,txid)
    if(!r.ok)return json({error:'Falha ao consultar a cobrança na Efí.',httpStatus:r.status},502)

    const providerStatus=String(d?.status||'').toUpperCase()
    const expected=Number(pagamento.detalhes?.efi_valor_cobrado??pagamento.valor)
    const returned=Number(d?.valor?.original||0)
    if(expected.toFixed(2)!==returned.toFixed(2))return json({error:'Valor da cobrança não confere com o pagamento OBRIX.'},409)

    const devolvido=refundTotal(d)
    const fullRefund=devolvido+0.000001>=expected && devolvido>0
    let nextStatus=pagamento.status
    if(fullRefund)nextStatus='reembolsado'
    else if(providerStatus==='CONCLUIDA')nextStatus='aprovado'
    else if(providerStatus==='ATIVA')nextStatus='pendente'
    else if(providerStatus==='REMOVIDA_PELO_USUARIO_RECEBEDOR'||providerStatus==='REMOVIDA_PELO_PSP')nextStatus='cancelado'

    if (pagamento.detalhes?.serie === 'bloco1-hml-v1') {
      const status = await syncPix(admin,pagamento,d,required('EFI_PIX_CHAVE'))
      return json({pagamentoId:pagamento.id,status,aplicado:status==='aprovado',homologacao:true})
    }
    // HML: consulta e classifica, mas nunca grava nem libera plano.
    return json({pagamentoId:pagamento.id,status:nextStatus,aplicado:false,revertido:false,txid,efiStatus:providerStatus,modo:'somente_leitura',homologacao:true})
  }catch(err){return json({error:err instanceof Error?err.message:String(err)},503)}finally{client?.close()}
})
