import { syncPix, syncCharge } from '../_shared/recebimento.mjs'
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

const REF='xavwkfgrnowmusbkbiea'
const BASE='https://cobrancas-h.api.efipay.com.br'
const PIX='https://pix-h.api.efipay.com.br'
const LIMIT=50
const env=(key:string)=>String(Deno.env.get(key)||'').trim()
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
})
function validHost(){
  try{return new URL(env('SUPABASE_URL')).hostname===REF+'.supabase.co' &&
    env('EFI_PIX_BASE_URL')===PIX &&
    (!env('EFI_COBRANCAS_BASE_URL') || env('EFI_COBRANCAS_BASE_URL').replace(/\/$/,'')===BASE)
  }catch{return false}
}
async function oauth(){
  const id=env('EFI_COBRANCAS_CLIENT_ID'),secret=env('EFI_COBRANCAS_CLIENT_SECRET')
  if(!id||!secret)throw Error('configuracao_cobrancas_incompleta')
  const r=await fetch(BASE+'/v1/authorize',{
    method:'POST',
    headers:{'Authorization':'Basic '+btoa(id+':'+secret),
      'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify({grant_type:'client_credentials'}),
    signal:AbortSignal.timeout(12000)
  })
  if(!r.ok)throw Error('autenticacao_efi_rejeitada')
  const d=await r.json().catch(()=>null)
  if(typeof d?.access_token!=='string'||d.access_token.length<10)
    throw Error('token_efi_ausente')
  return d.access_token as string
}
async function consultar(token:string,chargeId:string){
  const r=await fetch(BASE+'/v1/charge/'+encodeURIComponent(chargeId),{
    method:'GET',headers:{Authorization:'Bearer '+token,Accept:'application/json'},
    signal:AbortSignal.timeout(12000)
  })
  if(!r.ok)throw Error('consulta_efi_http_'+r.status)
  const body=await r.json().catch(()=>null)
  if(body?.code!==200 || !body?.data)throw Error('resposta_efi_invalida')
  return body.data
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
function makeClient() { return Deno.createHttpClient({ cert:pem('EFI_PIX_CERT_PEM'), key:pem('EFI_PIX_KEY_PEM') }) }
async function pixToken(base:string,client:Deno.HttpClient){
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

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return reply({ok:false,erro:'metodo_invalido'},405)
  if(!validHost())return reply({ok:false,erro:'fora_da_homologacao'},503)
  const token=req.headers.get('x-obrix-hml-cron-token')||''
  if(!/^[0-9a-f]{64}$/.test(token))return reply({ok:false,erro:'sem_autorizacao'},401)
  const svc=env('SUPABASE_SERVICE_ROLE_KEY')
  if(!svc)return reply({ok:false,erro:'backend_indisponivel'},503)
  const admin=createClient(env('SUPABASE_URL'),svc,{auth:{
    autoRefreshToken:false,persistSession:false}})
  const auth=await admin.rpc('obrix_hml_efi_cron_autorizar',{p_token:token})
  if(auth.error || auth.data!==true)return reply({ok:false,erro:'sem_autorizacao'},401)
  let body:any=null
  try{body=await req.json()}catch{return reply({ok:false,erro:'corpo_invalido'},400)}
  if(body?.acao!=='conferir')return reply({ok:false,erro:'acao_nao_permitida'},400)

  let cursor='00000000-0000-0000-0000-000000000000', inspected=0, failures=0
  let client:Deno.HttpClient|null=null, pixAccess='', chargeAccess=''
  try {
    for (;;) {
      const {data:rows,error}=await admin.from('pagamentos_assinatura').select('id,empresa_id,metodo,valor,moeda,provedor_pagamento_id,provedor_preferencia_id')
        .eq('provedor','efi').contains('detalhes',{serie:'bloco1-hml-v1',homologacao_teste:true})
        .in('status',['pendente','processando','aprovado','expirado','rejeitado']).gt('id',cursor).order('id').limit(LIMIT)
      if(error)throw Error('Leitura indisponível')
      for(const row of rows||[]){
        try{
          if(row.metodo==='pix'){
            if(!client)client=makeClient()
            if(!pixAccess)pixAccess=await pixToken(PIX,client)
            const {r,d}=await getCharge(PIX,client,pixAccess,row.provedor_preferencia_id)
            if(!r.ok)throw Error('Consulta Pix indisponível')
            await syncPix(admin,row,d,required('EFI_PIX_CHAVE'))
          }else{
            if(!chargeAccess)chargeAccess=await oauth()
            const detail=await consultar(chargeAccess,row.provedor_pagamento_id)
            await syncCharge(admin,row,detail,undefined)
          }
          inspected++
        }catch{failures++}
        cursor=row.id
      }
      if(!rows||rows.length<LIMIT)break
    }
    return reply({inspecionados:inspected,pendentes_de_revisao:failures},failures?503:200)
  } catch { return reply({erro:'conciliação indisponível'},503) }
  finally { client?.close() }
})

