import {createClient} from "npm:@supabase/supabase-js@2.117.1";
import {excluirArquivosEmpresa} from "./storage-cleanup.mjs";
import {excluirContaVerificada} from "./account-deletion-workflow.mjs";
import {previewHmlPermitida} from "./cors-origin.mjs";

const allowedOrigins=new Set([
  "https://obrix.junioalef7.workers.dev",
  "https://junioalef7-sys.github.io",
  "https://alef-obras-obrix3.vercel.app",
  "https://alef-obras.vercel.app",
  // Prévia isolada já aprovada para validações do OBRIX.
  "https://alef-obras-git-test-obrix-diarias-config-diario-e-296b55-obrix3.vercel.app"
]);
function origemPermitida(origin:string){
  return allowedOrigins.has(origin)||previewHmlPermitida(
    origin,
    Deno.env.get("OBRIX_HML_ALLOWED_ORIGIN")||"",
    Deno.env.get("SUPABASE_URL")||""
  );
}
function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  return {
    "Access-Control-Allow-Origin":origemPermitida(origin)?origin:"",
    "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Cache-Control":"no-store",
    "Vary":"Origin",
    "Content-Type":"application/json; charset=utf-8"
  };
}
function response(headers:Record<string,string>,status:number,body:object){
  return new Response(JSON.stringify(body),{status,headers});
}
function mensagemSegura(error:unknown){
  const msg=error instanceof Error?error.message:"Não foi possível excluir a conta.";
  if(/^(Não |A |Ainda |Foi |Quantidade |Repositório |Ocorreu |Os |Sua |Esta )/.test(msg))return msg;
  console.error("OBRIX_DELETE_ACCOUNT_INTERNAL",error);
  return "Não foi possível concluir a exclusão. Seus dados podem não ter sido totalmente removidos. Tente novamente ou contate o suporte.";
}
Deno.serve(async (req:Request)=>{
  const headers=cors(req),origin=req.headers.get("origin")||"";
  if(req.method==="OPTIONS")return response(headers,200,{ok:true});
  if(req.method!=="POST")return response(headers,405,{error:"Método não permitido."});
  if(origin&&!origemPermitida(origin))return response(headers,403,{error:"Origem não permitida."});
  try{
    const authHeader=req.headers.get("authorization")||"";
    if(!/^Bearer\s+\S+$/i.test(authHeader)){
      return response(headers,401,{error:"Sessão inválida. Entre novamente."});
    }
    const body=await req.json().catch(()=>({}));
    if(String(body?.confirmacao||"").trim().toUpperCase()!=="EXCLUIR CONTA"){
      return response(headers,400,{error:"Digite EXCLUIR CONTA para confirmar."});
    }
    const url=Deno.env.get("SUPABASE_URL")||"";
    const anon=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"";
    let serviceSecret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
    if(!serviceSecret){
      try{serviceSecret=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default||""}catch{}
    }
    if(!url||!anon||!serviceSecret)throw Error("Configuração do servidor indisponível.");
    const admin=createClient(url,serviceSecret,{auth:{autoRefreshToken:false,persistSession:false}});
    const userClient=createClient(url,anon,{
      global:{headers:{Authorization:authHeader}},
      auth:{autoRefreshToken:false,persistSession:false}
    });
    const {data:who,error:authError}=await userClient.auth.getUser();
    if(authError||!who?.user)return response(headers,401,{error:"Sessão inválida. Entre novamente."});
    const user=who.user;
    const {data:perfil,error:perfilErr}=await admin.from("perfis")
      .select("id,empresa_id,papel").eq("id",user.id).maybeSingle();
    if(perfilErr)throw perfilErr;
    // Operação parcial protegida: sem RPC de exclusão autorizada, falha antes de remover arquivos.
    const resultado=await excluirContaVerificada({
      admin,userId:user.id,perfil,limparStorage:excluirArquivosEmpresa
    });
    return response(headers,200,resultado);
  }catch(error){
    const msg=mensagemSegura(error);
    console.error("obrix-delete-account",error);
    return response(headers,500,{ok:false,error:msg});
  }
});