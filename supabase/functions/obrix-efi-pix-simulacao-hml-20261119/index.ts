import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

// OBRIX | Ensaio Efí Pix exclusivo de homologação | Sem qualquer ativação.
// Emite no máximo UMA cobrança simulada de R$ 1,00 por usuário/empresa de teste.
// Não grava no Supabase e não cria assinaturas ou pagamentos reais.
const HML_REF='xavwkfgrnowmusbkbiea'
const PIX='https://pix-h.api.efipay.com.br'
const AMOUNT='1.00'
const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info',
  'Access-Control-Allow-Methods':'POST,OPTIONS',
  'Cache-Control':'no-store'
}
const env=(key:string)=>String(Deno.env.get(key)||'').trim()
function result(body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8'}})
}
const multiline=(s:string)=>s.replace(/\\r\\n/g,'\n').replace(/\\n/g,'\n').replace(/\r\n/g,'\n')
function certificado():string{
  const b64=env('EFI_PIX_CERT_B64')
  if(b64){
    if(b64.length>32768||b64.length<160||b64.length%4!==0||
       !/^[A-Za-z0-9+/]*={0,2}$/.test(b64))throw Error('certificado_invalido')
    const bytes=Uint8Array.from(atob(b64),ch=>ch.charCodeAt(0))
    return multiline(new TextDecoder('utf-8',{fatal:true}).decode(bytes)).trim()
  }
  return multiline(env('EFI_PIX_CERT_PEM'))
}
function verificarPem(s:string,part:string){
  return s.includes('-----BEGIN '+part+'-----')&&s.includes('-----END '+part+'-----')
}
async function txidFor(userId:string,empresaId:string):Promise<string>{
  const material=new TextEncoder().encode('OBRIX_HML_PIX_TESTE_UNICO_20261119:'+userId+':'+empresaId)
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',material))
  const hex=Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('')
  return 'obrixhml'+hex.slice(0,27) // 35 caracteres e estável
}
function errorCategory(status:number):string{
  if(status===401)return 'efi_credenciais_rejeitadas'
  if(status===403)return 'efi_escopo_cob_insuficiente'
  if(status===429)return 'efi_limite_requisicoes'
  if(status>=500)return 'efi_indisponivel'
  return 'efi_resposta_inesperada'
}
async function efirequest(client:Deno.HttpClient,token:string,method:string,path:string,body?:unknown){
  const init={
    method,client,
    headers:{
      Authorization:'Bearer '+token,
      Accept:'application/json',
      'Content-Type':'application/json',
    },
    signal:AbortSignal.timeout(12000),
    ...(body!==undefined?{body:JSON.stringify(body)}:{})
  }
  const response=await fetch(PIX+path,init)
  const dados=await response.json().catch(()=>null)
  return {status:response.status,ok:response.ok,data:dados}
}
function validateCharge(d:any,txid:string){
  if(!d || d.txid!==txid || Number(d?.valor?.original)!==1)
    return {ok:false,estado:'cobranca_diferente_do_teste'}
  const status=String(d.status||'').toUpperCase()
  if(!['ATIVA','CONCLUIDA','REMOVIDA_PELO_USUARIO_RECEBEDOR','REMOVIDA_PELO_PSP'].includes(status))
    return {ok:false,estado:'status_nao_previsto'}
  return {ok:true,estado:status,confirmacaoSimulada:status==='CONCLUIDA'}
}
Deno.serve(async (req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors})
  if(req.method!=='POST')return result({ok:false,erro:'Método não permitido'},405)
  const url=env('SUPABASE_URL'),serviceKey=env('SUPABASE_SERVICE_ROLE_KEY')
  let host=''
  try{host=new URL(url).hostname}catch{/* bloquear por padrão */}
  if(host!==HML_REF+'.supabase.co' || !serviceKey ||
     env('EFI_PIX_BASE_URL')!==PIX)
    return result({ok:false,erro:'Simulação disponível apenas no ambiente isolado'},503)
  const tokenJwt=req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]||''
  if(!tokenJwt)return result({ok:false,erro:'Sessão obrigatória'},401)
  let body:any=null
  try{body=await req.json()}catch{return result({ok:false,erro:'JSON inválido'},400)}
  const action=String(body?.acao||'')
  if(!['criar','consultar','webhook-status'].includes(action))return result({ok:false,erro:'Ação inválida'},400)
  const admin=createClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}})
  try{
    const {data:u,error:e}=await admin.auth.getUser(tokenJwt)
    if(e||!u?.user)return result({ok:false,erro:'Sessão inválida'},401)
    const {data:p,error:pe}=await admin.from('perfis')
      .select('empresa_id,papel').eq('id',u.user.id).maybeSingle()
    if(pe||!p?.empresa_id||!['proprietario','administrador'].includes(p.papel))
      return result({ok:false,erro:'Acesso reservado ao administrador de homologação'},403)
    // Apenas usuários previamente usados nos testes isolados. Limite adicional.
    if(![
      '231e8d54-eee8-4ba9-b632-077c38179706',
      'cf50c1d8-6c07-468d-92d0-e2291325bd02'
    ].includes(u.user.id))
      return result({ok:false,erro:'Conta não autorizada para o ensaio controlado'},403)
    const id=env('EFI_PIX_CLIENT_ID'),secret=env('EFI_PIX_CLIENT_SECRET')
    const chavePix=env('EFI_PIX_CHAVE')
    if(!id||!secret||!chavePix||!env('EFI_PIX_KEY_PEM'))
      return result({ok:false,erro:'Configuração Pix incompleta'},503)
    const cert=certificado(),key=multiline(env('EFI_PIX_KEY_PEM'))
    if(!verificarPem(cert,'CERTIFICATE')||!verificarPem(key,'PRIVATE KEY'))
      return result({ok:false,erro:'Certificado ou chave privada não reconhecidos'},503)
    let client:Deno.HttpClient|null=null
    try{
      client=Deno.createHttpClient({cert,key})
      const auth=await fetch(PIX+'/oauth/token',{
        method:'POST',client,
        headers:{Authorization:'Basic '+btoa(id+':'+secret),'Content-Type':'application/json',Accept:'application/json'},
        body:JSON.stringify({grant_type:'client_credentials'}),
        signal:AbortSignal.timeout(12000)
      })
      const data=await auth.json().catch(()=>null)
      if(!auth.ok||!data?.access_token)
        return result({ok:false,erro:errorCategory(auth.status)},502)
      const accessToken=String(data.access_token)
      // Inspeciona apenas a configuração atual do webhook Efí. NÃO cadastra,
      // substitui nem remove URLs. Nunca devolve webhookUrl ou chave Pix.
      if(action==='webhook-status'){
        const check=await efirequest(client,accessToken,'GET',
          '/v2/webhook/'+encodeURIComponent(chavePix))
        if(check.status===404)
          return result({ok:true,ambiente:'homologacao',acao:'webhook-status',
            configuracao:'nao_configurado',assinaturaAlterada:false})
        if(check.status===403)
          return result({ok:false,erro:'sem_permissao_webhook_read',httpEfipay:403},403)
        if(!check.ok){
          // Somente codigo HTTP numerico recebido da Efí; nao repassar
          // corpo de erro, identificadores, URL, chave ou token.
          const httpEfipay=Number(check.status)
          return result({ok:false,erro:'falha_consulta_webhook_pix',
            httpEfipay:Number.isInteger(httpEfipay) && httpEfipay>=400 && httpEfipay<=599
              ?httpEfipay:null},502)
        }
        const raw=String(check.data?.webhookUrl||'')
        if(!raw)
          return result({ok:false,erro:'resposta_webhook_sem_url'},502)
        let hostAtual=''
        try{hostAtual=new URL(raw).hostname}catch{
          return result({ok:false,erro:'endereco_webhook_invalido'},502)
        }
        return result({ok:true,ambiente:'homologacao',acao:'webhook-status',
          configuracao:hostAtual===HML_REF+'.supabase.co'
            ?'configurado_no_projeto_isolado':'configurado_em_outro_endereco',
          assinaturaAlterada:false,
          mensagem:'Consulta somente leitura. Nenhuma configuração da Efí foi alterada.'})
      }
      const txid=await txidFor(u.user.id,String(p.empresa_id))
      const path='/v2/cob/'+txid
      let resposta=await efirequest(client,accessToken,'GET',path)
      let reused=resposta.ok
      if(!resposta.ok){
        const notFound=(resposta.status===404 || (resposta.status===400 && resposta.data?.nome==='cobranca_nao_encontrada'))
        if(!notFound) return result({ok:false,erro:errorCategory(resposta.status)},502)
        if(action==='consultar')
          return result({ok:true,ambiente:'homologacao',criacao:false,
            valorSimulado:AMOUNT,estado:'nao_criado',assinaturaAlterada:false})
        const cobranca={
          calendario:{expiracao:3600},
          valor:{original:AMOUNT},
          chave:chavePix,
          solicitacaoPagador:'OBRIX - Simulacao técnica de homologacao sem valor real',
          infoAdicionais:[{nome:'Ambiente',valor:'HOMOLOGACAO - NAO PAGAR'}]
        }
        resposta=await efirequest(client,accessToken,'PUT',path,cobranca)
        reused=false
        if(resposta.status===409){
          resposta=await efirequest(client,accessToken,'GET',path)
          reused=true
        }
        if(!resposta.ok)
          return result({ok:false,erro:errorCategory(resposta.status)},502)
      }
      const check=validateCharge(resposta.data,txid)
      if(!check.ok)return result({ok:false,erro:check.estado},409)
      return result({ok:true,ambiente:'homologacao',criacao:action==='criar',
        reutilizado:reused,valorSimulado:AMOUNT,estado:check.estado,
        confirmacaoSimulada:check.confirmacaoSimulada,
        assinaturaAlterada:false,
        mensagem:'Cobrança simulada da Efí. Nenhuma assinatura OBRIX foi ativada.'})
    }finally{try{client?.close()}catch{/* best effort */}}
  }catch{
    // Não retornar Error.message, requisição, payload, access_token ou segredos.
    return result({ok:false,erro:'Falha técnica no teste Pix de homologação'},503)
  }
})
