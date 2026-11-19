import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

// OBRIX, homologação isolada. Reprocessa notificações Efí previamente guardadas.
// Não emite cobrança nem trabalha com informações da base oficial.
const REF='xavwkfgrnowmusbkbiea'
function response(body:unknown,status=200){
  return new Response(JSON.stringify(body),{
    status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
  })
}
Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return response({ok:false,error:'Método não permitido'},405)
  const url=String(Deno.env.get('SUPABASE_URL')||'')
  const key=String(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'')
  let hostname=''
  try{hostname=new URL(url).hostname}catch{/* fail closed */}
  if(hostname!==REF+'.supabase.co'||!key)return response({ok:false,error:'Ambiente de homologação indisponível'},503)
  const bearer=req.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]||''
  if(!bearer)return response({ok:false,error:'Autenticação necessária'},401)
  const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:ident,error:userError}=await admin.auth.getUser(bearer)
  if(userError||!ident?.user)return response({ok:false,error:'Sessão inválida'},401)
  const {data:perfil,error:perfilError}=await admin.from('perfis').select('papel,empresa_id').eq('id',ident.user.id).maybeSingle()
  if(perfilError||!perfil?.empresa_id||!['proprietario','administrador'].includes(String(perfil.papel)))
    return response({ok:false,error:'Permissão insuficiente'},403)

  const pix=(Deno.env.get('EFI_PIX_BASE_URL')||'').trim()
  const cob=(Deno.env.get('EFI_COBRANCAS_BASE_URL')||'').trim().replace(/\/$/,'')
  const hmac=(Deno.env.get('EFI_COBRANCAS_WEBHOOK_HMAC')||'').trim()
  if(!hmac||!((pix==='https://pix-h.api.efipay.com.br')&&(cob==='https://cobrancas-h.api.efipay.com.br')))
    return response({ok:false,error:'Credenciais ou endereços Efí de homologação incompletos'},503)

  const {data:pending,error:fetchError}=await admin.rpc('obrix_hml_efi_listar_notificacoes_pendentes',{p_limite:10})
  if(fetchError)return response({ok:false,error:'Falha ao consultar notificações pendentes'},503)

  const callback=url+'/functions/v1/efi-cobrancas-webhook-hml-20261118?hmac='+encodeURIComponent(hmac)
  let processados=0,falhas=0
  for(const item of pending||[]){
    const token=String(item?.token||'')
    if(!token)continue
    try{
      const r=await fetch(callback,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:new URLSearchParams({notification:token})})
      if(r.status>=200&&r.status<300)processados++
      else falhas++
    }catch{falhas++}
  }
  return response({ok:falhas===0,ambiente:'homologacao',tentativas:(pending||[]).length,
    processados,falhas,mensagem:falhas?'Revisar pendências na conciliação':'Conciliação concluída'})
})
