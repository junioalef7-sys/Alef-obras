import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

// OBRIX HML - SOMENTE INBOX. Requer um relay externo que validou mTLS
// e assinou o corpo HTTP com HMAC. Não concilia, não aplica plano.
// FAIL-CLOSED até que o segredo seja configurado no Supabase isolado.
const REF='xavwkfgrnowmusbkbiea'
const MAX_BODY=32768
const TOLERANCE_SEC=300
function send(json:unknown,status:number){
  return new Response(JSON.stringify(json),{status,headers:{
    'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'
  }})
}
function hexToBytes(hex:string):Uint8Array|null{
  if(!/^[0-9a-f]{64}$/.test(hex))return null
  return Uint8Array.from(hex.match(/../g)!,b=>parseInt(b,16))
}
function equalConstantTime(a:Uint8Array,b:Uint8Array):boolean{
  if(a.length!==b.length)return false
  let diff=0
  for(let i=0;i<a.length;i++)diff|=a[i]^b[i]
  return diff===0
}
async function authorizedRelay(req:Request,body:Uint8Array,secret:string){
  const rawTimestamp=req.headers.get('x-obrix-hml-relay-timestamp')||''
  const rawSignature=req.headers.get('x-obrix-hml-relay-signature')||''
  if(!/^\d{10}$/.test(rawTimestamp))return false
  if(Math.abs(Math.floor(Date.now()/1000)-Number(rawTimestamp))>TOLERANCE_SEC)
    return false
  if(!/^sha256=[0-9a-f]{64}$/.test(rawSignature))return false
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),
    {name:'HMAC',hash:'SHA-256'},false,['sign'])
  const prefix=new TextEncoder().encode(rawTimestamp+'.')
  const message=new Uint8Array(prefix.length+body.length)
  message.set(prefix,0);message.set(body,prefix.length)
  const calculated=new Uint8Array(await crypto.subtle.sign('HMAC',key,message))
  return equalConstantTime(calculated,hexToBytes(rawSignature.slice(7))!)
}
Deno.serve(async (req:Request)=>{
  if(req.method!=='POST')return send({ok:false,erro:'metodo_invalido'},405)
  const serverUrl=String(Deno.env.get('SUPABASE_URL')||'')
  let serverHost=''
  try{serverHost=new URL(serverUrl).hostname}catch{/* fail-closed */}
  const secret=String(Deno.env.get('OBRIX_HML_EFI_PIX_RELAY_HMAC_KEY')||'')
  const serviceKey=String(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'')
  if(serverHost!==REF+'.supabase.co'||secret.length<32||!serviceKey)
    return send({ok:false,erro:'receptor_nao_habilitado'},503)
  // Na Efí /pix é acrescentado à URL: aceitar apenas os dois caminhos fixos.
  const pathname=new URL(req.url).pathname
  if(!pathname.endsWith('/obrix-hml-pix-webhook-inbox-20261119')&&
     !pathname.endsWith('/obrix-hml-pix-webhook-inbox-20261119/pix'))
    return send({ok:false,erro:'rota_invalida'},404)
  if(Number(req.headers.get('content-length')||0)>MAX_BODY)
    return send({ok:false,erro:'corpo_grande'},413)
  const raw=new Uint8Array(await req.arrayBuffer())
  if(raw.length===0||raw.length>MAX_BODY)
    return send({ok:false,erro:'corpo_invalido'},413)
  if(!await authorizedRelay(req,raw,secret))
    return send({ok:false,erro:'relay_nao_autenticado'},401)
  let payload:any
  try{payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw))}
  catch{return send({ok:false,erro:'json_invalido'},400)}
  // Somente eventos Pix RECEBIDOS do ensaio de um real.
  if(!payload||!Array.isArray(payload.pix)||payload.pix.length<1||payload.pix.length>10)
    return send({ok:false,erro:'evento_nao_suportado'},422)
  const entries:{txid:string,e2e:string,valor:number}[]=[]
  for(const item of payload.pix){
    const txid=String(item?.txid||'')
    const e2e=String(item?.endToEndId||'')
    const valor=String(item?.valor||'')
    if(!/^obrixhml[0-9a-f]{27}$/.test(txid)||!/^[a-zA-Z0-9]{16,40}$/.test(e2e)||
       !/^1(?:\.0{1,2})?$/.test(valor))
      return send({ok:false,erro:'pix_fora_escopo_ensaio'},422)
    entries.push({txid,e2e,valor:1})
  }
  const admin=createClient(serverUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
  try{
    let inserted=0
    for(const entry of entries){
      const {data,error}=await admin.rpc('obrix_hml_inbox_pix_receber',{
        p_txid:entry.txid,p_end_to_end_id:entry.e2e,p_valor:entry.valor
      })
      if(error||data?.ok!==true)
        return send({ok:false,erro:'falha_inbox'},503)
      if(data.inserido)inserted++
    }
    return send({ok:true,ambiente:'homologacao',recebidos:entries.length,
      novos:inserted,assinaturas_ativadas:0,conciliacao:'pendente'},202)
  }catch{
    // Não responder corpo de erros DB, URL, identificadores ou segredos.
    return send({ok:false,erro:'falha_tecnica_inbox'},503)
  }
})
