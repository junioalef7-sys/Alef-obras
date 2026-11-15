import {createClient} from "npm:@supabase/supabase-js@2.117.1";
import {excluirArquivosEmpresa} from "./storage-cleanup.mjs";

const allowedOrigins=new Set([
  "https://obrix.junioalef7.workers.dev",
  "https://junioalef7-sys.github.io",
  "https://alef-obras-obrix3.vercel.app",
  "https://alef-obras.vercel.app",
  // Prévia isolada já aprovada para validações do OBRIX.
  "https://alef-obras-git-test-obrix-diarias-config-diario-e-296b55-obrix3.vercel.app"
]);
function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  return {
    "Access-Control-Allow-Origin":allowedOrigins.has(origin)?origin:"",
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
  if(origin&&!allowedOrigins.has(origin))return response(headers,403,{error:"Origem não permitida."});
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
    let arquivosRemovidos=0,bytesEstimados=0;
    if(perfil?.empresa_id){
      const empresaId=perfil.empresa_id;
      const {count,error:countErr}=await admin.from("perfis")
        .select("id",{count:"exact",head:true}).eq("empresa_id",empresaId);
      if(countErr||count==null)throw Error("Não foi possível verificar os usuários da empresa.");
      if(count===1){
        // Não começar a excluir registros financeiros ou o login antes de limpar e verificar o Storage.
        const limpeza=await excluirArquivosEmpresa(admin.storage,empresaId);
        arquivosRemovidos=limpeza.arquivosRemovidos;
        bytesEstimados=limpeza.bytesEstimados;
        // Tabelas legadas sem FK de empresa ON DELETE CASCADE.
        // Remover explicitamente para impedir registros órfãos após a exclusão.
        for(const tabela of ["relatorio_fotos","notas"]){
          const {error:residuoErr}=await admin.from(tabela).delete().eq("empresa_id",empresaId);
          if(residuoErr)throw Error("Não foi possível limpar todos os registros da empresa. Tente novamente.");
        }
        const {error:estornoErr}=await userClient.from("financeiro")
          .update({status_lancamento:"estornado"})
          .eq("empresa_id",empresaId).neq("origem","manual").eq("status_lancamento","ativo");
        if(estornoErr)throw Error("Não foi possível preparar o Financeiro. Tente novamente.");
        const {error:finErr}=await userClient.from("financeiro").delete().eq("empresa_id",empresaId);
        if(finErr)throw Error("Não foi possível remover o Financeiro. Tente novamente.");
        const {error:empresaErr}=await admin.from("empresas").delete().eq("id",empresaId);
        if(empresaErr)throw Error("Não foi possível remover os dados da empresa. Tente novamente.");
      }else{
        // Se houver outros membros, a empresa e todos os arquivos compartilhados precisam continuar intactos.
        const {error:perfilDeleteError}=await admin.from("perfis").delete().eq("id",user.id);
        if(perfilDeleteError)throw Error("Não foi possível remover o perfil. Tente novamente.");
      }
    }
    const {error:userDeleteErr}=await admin.auth.admin.deleteUser(user.id);
    if(userDeleteErr)throw Error("Os dados da empresa foram processados, mas não foi possível excluir o login. Tente novamente.");
    return response(headers,200,{ok:true,arquivosRemovidos,bytesEstimados});
  }catch(error){
    const msg=mensagemSegura(error);
    console.error("obrix-delete-account",error);
    return response(headers,500,{ok:false,error:msg});
  }
});