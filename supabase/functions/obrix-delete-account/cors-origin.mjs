/**
 * CORS para homologação da exclusão de conta.
 * Além dos domínios oficiais, somente UM domínio Preview explicitamente
 * informado em OBRIX_HML_ALLOWED_ORIGIN pode acessar uma Edge Function de
 * uma branch Supabase isolada. Nunca aceitar produção/auditoria.
 */
const PROD_REF="gnvclctqnwxnjxydzhwc";
const AUDIT_REF="mjzlwnuklfopdmgcvdcs";
export function previewHmlPermitida(origin,configOrigin,supabaseUrl){
 if(typeof origin!=="string"||!origin||origin!==configOrigin)return false;
 if(!/^https:\/\/alef-obras-[a-z0-9-]+\.vercel\.app$/.test(origin))return false;
 if(["https://alef-obras-obrix3.vercel.app","https://alef-obras.vercel.app"].includes(origin))
   return false;
 let host="";
 try{host=new URL(supabaseUrl).hostname}catch{return false}
 const ref=host.endsWith(".supabase.co")?host.slice(0,-".supabase.co".length):"";
 if(!/^[a-z]{20}$/.test(ref)||[PROD_REF,AUDIT_REF].includes(ref))return false;
 return true;
}
