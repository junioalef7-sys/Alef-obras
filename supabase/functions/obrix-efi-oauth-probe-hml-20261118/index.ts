import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

// OBRIX | Homologação isolada | Teste apenas OAuth; não gera cobranças.
// Nenhuma credencial, certificado, chave privada ou access_token sai na resposta.
const HML_REF='xavwkfgrnowmusbkbiea'
const PIX='https://pix-h.api.efipay.com.br'
const COB='https://cobrancas-h.api.efipay.com.br'
const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info',
  'Access-Control-Allow-Methods':'POST,OPTIONS',
  'Cache-Control':'no-store'
}
type Resultado={ok:boolean;estado:string}
function respond(body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8'}})
}
const env=(name:string)=>String(Deno.env.get(name)||'').trim()
const pem=(name:string)=>env(name).replace(/\\n/g,'\n')
function basic(id:string,secret:string){
  return 'Basic '+btoa(id+':'+secret)
}
function classify(code:number){
  if(code===400||code===401||code===403)return 'credenciais_ou_permissoes_recusadas'
  if(code===408||code===429||code>=500)return 'servico_indisponivel'
  return 'resposta_nao_autorizada'
}
function failFromError(_e:unknown):Resultado{
  // Não incluir e.message: exceções TLS/network podem trazer dados sensíveis.
  return {ok:false,estado:'falha_na_conexao_ou_certificado'}
}
async function testarPix():Promise<Resultado>{
  if(env('EFI_PIX_BASE_URL')!==PIX)return {ok:false,estado:'endereco_de_homologacao_incorreto'}
  const id=env('EFI_PIX_CLIENT_ID'),secret=env('EFI_PIX_CLIENT_SECRET')
  const cert=pem('EFI_PIX_CERT_PEM'),key=pem('EFI_PIX_KEY_PEM')
  if(!id||!secret||!cert||!key)return {ok:false,estado:'configuracao_pix_incompleta'}
  if(!cert.includes('-----BEGIN CERTIFICATE-----') ||
     !/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/.test(key)){
    return {ok:false,estado:'certificado_ou_chave_invalida'}
  }
  let client:Deno.HttpClient|null=null
  try{
    client=Deno.createHttpClient({cert,key})
    const resp=await fetch(PIX+'/oauth/token',{
      method:'POST',client,
      headers:{
        Authorization:basic(id,secret),
        'Content-Type':'application/json',
        Accept:'application/json'
      },
      body:JSON.stringify({grant_type:'client_credentials'}),
      signal:AbortSignal.timeout(12000)
    })
    if(!resp.ok)return {ok:false,estado:classify(resp.status)}
    const data=await resp.json().catch(()=>null)
    return data && typeof data.access_token==='string' && data.access_token.length>10
      ?{ok:true,estado:'autenticacao_confirmada'}
      :{ok:false,estado:'resposta_sem_token'}
  }catch(e){return failFromError(e)}
  finally{try{client?.close()}catch{/* close is best effort */}}
}
async function testarCobrancas():Promise<Resultado>{
  if(env('EFI_COBRANCAS_BASE_URL')!==COB)return {ok:false,estado:'endereco_de_homologacao_incorreto'}
  const id=env('EFI_COBRANCAS_CLIENT_ID'),secret=env('EFI_COBRANCAS_CLIENT_SECRET')
  if(!id||!secret)return {ok:false,estado:'configuracao_cobrancas_incompleta'}
  try{
    const resp=await fetch(COB+'/v1/authorize',{
      method:'POST',
      headers:{
        Authorization:basic(id,secret),
        'Content-Type':'application/json',
        Accept:'application/json'
      },
      body:JSON.stringify({grant_type:'client_credentials'}),
      signal:AbortSignal.timeout(12000)
    })
    if(!resp.ok)return {ok:false,estado:classify(resp.status)}
    const data=await resp.json().catch(()=>null)
    return data && typeof data.access_token==='string' && data.access_token.length>10
      ?{ok:true,estado:'autenticacao_confirmada'}
      :{ok:false,estado:'resposta_sem_token'}
  }catch(e){return failFromError(e)}
}
Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors})
  if(req.method!=='POST')return respond({ok:false,erro:'Método não permitido'},405)
  const url=env('SUPABASE_URL'),service=env('SUPABASE_SERVICE_ROLE_KEY')
  let host=''
  try{host=new URL(url).hostname}catch{/* fail closed */}
  if(host!==HML_REF+'.supabase.co'||!service)return respond({ok:false,erro:'Ambiente isolado obrigatório'},503)
  const jwt=req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]||''
  if(!jwt)return respond({ok:false,erro:'Sessão obrigatória'},401)
  try{
    const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}})
    const {data,error}=await admin.auth.getUser(jwt)
    if(error||!data?.user)return respond({ok:false,erro:'Sessão inválida'},401)
    const {data:perfil,error:perr}=await admin.from('perfis')
      .select('papel,empresa_id').eq('id',data.user.id).maybeSingle()
    if(perr||!perfil?.empresa_id||
      !['proprietario','administrador'].includes(String(perfil.papel)))
      return respond({ok:false,erro:'Permissão insuficiente'},403)
    // Somente solicita tokens OAuth nos hosts fixos de HOMOLOGAÇÃO.
    // Sem criação de cobranças, sem gravação no banco e sem retorno de tokens.
    const [pix,cobrancas]=await Promise.all([testarPix(),testarCobrancas()])
    return respond({ok:true,ambiente:'homologacao_isolada',pix,cobrancas,
      observacao:'Autenticação OAuth apenas. Nenhum Pix, boleto ou pagamento foi emitido.'})
  }catch{
    return respond({ok:false,erro:'Falha interna no diagnóstico de autenticação'},500)
  }
})
