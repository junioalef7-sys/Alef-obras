import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'
import { X509Certificate, createPrivateKey, createPublicKey } from 'node:crypto'

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
const pem=(name:string)=>env(name).replace(/\\r\\n/g,'\n').replace(/\\n/g,'\n').replace(/\r\n/g,'\n')
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
function validarBlocoPem(texto:string,tipo:'CERTIFICATE'|'PRIVATE KEY',prefixo:string):string{
  const inicio='-----BEGIN '+tipo+'-----'
  const fim='-----END '+tipo+'-----'
  const posInicio=texto.indexOf(inicio)
  if(posInicio<0)return prefixo+'_sem_cabecalho'
  const posFim=texto.indexOf(fim,posInicio+inicio.length)
  if(posFim<0)return prefixo+'_sem_rodape'
  const payload=texto.slice(posInicio+inicio.length,posFim).replace(/\s+/g,'')
  if(payload.length<160)return prefixo+'_incompleto'
  if(!/^[A-Za-z0-9+/]*={0,2}$/.test(payload))return prefixo+'_caracteres_invalidos'
  if(payload.length%4!==0)return prefixo+'_base64_incompleto'
  try{
    const der=atob(payload)
    if(der.length<100||der.charCodeAt(0)!==0x30)return prefixo+'_der_invalido'
  }catch{return prefixo+'_base64_ilegivel'}
  return 'ok'
}
function verificarEstruturaPem(cert:string,key:string):string{
  // Retorna somente classes de erro: NUNCA retorna Base64, partes do PEM
  // ou valores das variáveis de ambiente.
  if(/-----BEGIN (?:RSA|EC) PRIVATE KEY-----/.test(key))
    return 'formato_chave_privada_legado'
  if(!key.includes('-----BEGIN PRIVATE KEY-----'))
    return 'chave_privada_sem_cabecalho_pkcs8'
  const c=validarBlocoPem(cert,'CERTIFICATE','certificado')
  if(c!=='ok')return c
  return validarBlocoPem(key,'PRIVATE KEY','chave_privada')
}
function verificarParQuandoSuportado(cert:string,key:string):string{
  // O node:crypto no Supabase Edge pode ter métodos X509 indisponíveis.
  // Se a biblioteca não suportar a análise, não declarar a chave inválida:
  // o mTLS do Deno será a verificação determinante da conexão.
  try{
    const pubCert=new Uint8Array(new X509Certificate(cert).publicKey.export({format:'der',type:'spki'}))
    const priv=createPrivateKey(key)
    const pubChave=new Uint8Array(createPublicKey(priv).export({format:'der',type:'spki'}))
    if(pubCert.length!==pubChave.length)return 'chave_nao_corresponde_ao_certificado'
    let diferenca=0
    for(let i=0;i<pubCert.length;i++)diferenca|=pubCert[i]^pubChave[i]
    return diferenca===0?'ok':'chave_nao_corresponde_ao_certificado'
  }catch{
    return 'analise_criptografica_indisponivel'
  }
}
async function testarPix():Promise<Resultado>{
  if(env('EFI_PIX_BASE_URL')!==PIX)return {ok:false,estado:'endereco_de_homologacao_incorreto'}
  const id=env('EFI_PIX_CLIENT_ID'),secret=env('EFI_PIX_CLIENT_SECRET')
  const cert=pem('EFI_PIX_CERT_PEM'),key=pem('EFI_PIX_KEY_PEM')
  if(!id||!secret||!cert||!key)return {ok:false,estado:'configuracao_pix_incompleta'}
  // Identificar separadamente certificado e chave; a validação estrutural
  // abaixo retorna o motivo sem expor os conteúdos dos segredos.
  const estrutura=verificarEstruturaPem(cert,key)
  if(estrutura!=='ok')return {ok:false,estado:estrutura}
  const par=verificarParQuandoSuportado(cert,key)
  if(par==='chave_nao_corresponde_ao_certificado')return {ok:false,estado:par}
  // Quando a biblioteca de X509 não é compatível, testar mTLS diretamente
  // com a chave PKCS#8 validada, sem ignorar erros da conexão.

  let client:Deno.HttpClient|null=null
  let etapa='inicializar_cliente_tls'
  try{
    client=Deno.createHttpClient({cert,key})
    etapa='conectar_ao_servidor_pix'
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
    etapa='interpretar_resposta_oauth'
    if(!resp.ok)return {ok:false,estado:classify(resp.status)}
    const data=await resp.json().catch(()=>null)
    return data && typeof data.access_token==='string' && data.access_token.length>10
      ?{ok:true,estado:'autenticacao_confirmada'}
      :{ok:false,estado:'resposta_sem_token'}
  }catch(e){
    // Somente a etapa, jamais Error.message, stack ou conteúdo dos Secrets.
    return {ok:false,estado:
      etapa==='inicializar_cliente_tls'?'falha_ao_inicializar_cliente_tls':
      etapa==='conectar_ao_servidor_pix'?
        (e instanceof DOMException && e.name==='TimeoutError'?
          'tempo_limite_na_conexao_tls':'falha_na_conexao_tls_com_efi'):
      'erro_ao_interpretar_resposta_oauth'}
  }finally{try{client?.close()}catch{/* melhor esforço */}}
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
