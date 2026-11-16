
import {createClient} from "npm:@supabase/supabase-js@2.117.1";
import {excluirContaVerificada} from "./account-deletion-workflow.mjs";
import {excluirArquivosEmpresa} from "./storage-cleanup.mjs";
// Somente uma branch efêmera explícita, nunca produção nem auditoria preexistente.
const PROJECT=String(Deno.env.get("OBRIX_HML_PROJECT_REF")||"").trim();
const REFS_BLOQUEADOS=new Set(["gnvclctqnwxnjxydzhwc","mjzlwnuklfopdmgcvdcs"]);
const PROJETO_VALIDO=/^[a-z]{20}$/.test(PROJECT)&&!REFS_BLOQUEADOS.has(PROJECT);
const ORIGIN="https://"+PROJECT+".supabase.co";
const out=(status,body)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
const unwrap=(r,msg)=>{if(r?.error)throw Error(msg+": "+String(r.error.message||r.error));return r.data};
Deno.serve(async req=>{
 if(req.method!=="POST")return out(405,{ok:false,error:"Método recusado"});
 let host="";try{host=new URL(Deno.env.get("SUPABASE_URL")||"http://invalid").hostname}catch{}
 if(!PROJETO_VALIDO||host!==PROJECT+".supabase.co")return out(403,{ok:false,error:"Executor restrito a branch fictícia de homologação"});
 const senhaE2E=String(Deno.env.get("OBRIX_HML_E2E_TOKEN")||"");
 const apresentada=String(req.headers.get("x-obrix-hml-e2e-token")||"");
 if(!/^[A-Za-z0-9_-]{32,128}$/.test(senhaE2E)||apresentada!==senhaE2E){
   return out(403,{ok:false,error:"Execução de homologação não autorizada"});
 }
 const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||(()=>{try{return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default||""}catch{return""}})();
 const pub=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"";
 if(!secret||!pub)return out(503,{ok:false,error:"Chaves de homologação não configuradas"});
 const admin=createClient(ORIGIN,secret,{auth:{autoRefreshToken:false,persistSession:false}});
 const claim=await admin.rpc("obrix_hml_claim_once_v1");
 if(claim.error||claim.data!==true)return out(409,{ok:false,error:"Teste já consumido ou não autorizado"});
 const checks={auth:false,signup:false,trial:false,login:false,obras:false,equipe:false,meias:false,vales_bonus:false,pagamento:false,rateio:false,duplicado:false,estorno:false,documento:false,url_assinada:false,exclusao:false,storage_limpo:false,banco_limpo:false,auth_removido:false,token_antigo:false};
 const errors=[];
 let userId=null,empresaId=null,bucket=false,token="",client=null;
 try{
  const email="obrix-e2e-branch-"+crypto.randomUUID()+"@example.com";
  const senha=crypto.randomUUID()+crypto.randomUUID();
  const u=unwrap(await admin.auth.admin.createUser({email,password:senha,email_confirm:true,user_metadata:{nome:"HML FICTICIO",empresa_nome:"HML EMPRESA FICTICIA"}}),"Auth");
  userId=u.user?.id;if(!userId)throw Error("Auth não retornou UUID");
  checks.auth=true;
  const profile=unwrap(await admin.from("perfis").select("id,empresa_id,papel").eq("id",userId).single(),"Perfil");
  empresaId=profile.empresa_id;
  checks.signup=!!empresaId&&profile.papel==="proprietario";
  const subscription=unwrap(await admin.from("assinaturas").select("status,trial_fim").eq("empresa_id",empresaId).single(),"Trial");
  checks.trial=subscription.status==="teste"&&new Date(subscription.trial_fim).getTime()>Date.now();
  client=createClient(ORIGIN,pub,{auth:{autoRefreshToken:false,persistSession:false}});
  const login=unwrap(await client.auth.signInWithPassword({email,password:senha}),"Login");
  token=login.session?.access_token||"";
  checks.login=!!token&&login.user?.id===userId;
  if(!checks.signup||!checks.trial||!checks.login)throw Error("Cadastro, trial ou login não confirmado");
  const a=unwrap(await client.from("obras").insert({empresa_id:empresaId,nome:"OBRA HML A",status:"andamento"}).select("id").single(),"Obra A").id;
  const b=unwrap(await client.from("obras").insert({empresa_id:empresaId,nome:"OBRA HML B",status:"andamento"}).select("id").single(),"Obra B").id;
  checks.obras=!!a&&!!b&&a!==b;
  const f=unwrap(await client.from("funcionarios").insert({empresa_id:empresaId,nome:"EQUIPE HML",valor_diaria:200}).select("id").single(),"Funcionário").id;
  checks.equipe=!!f;
  const d=unwrap(await client.from("diarias").insert([
    {empresa_id:empresaId,funcionario_id:f,obra_id:a,quantidade:0.5,valor_unitario:200,valor_total:100},
    {empresa_id:empresaId,funcionario_id:f,obra_id:b,quantidade:0.5,valor_unitario:200,valor_total:100}
  ]).select("id,quantidade"),"Duas meias diárias");
  checks.meias=d.length===2&&d.every(x=>Number(x.quantidade)===0.5);
  const v=unwrap(await client.from("vales").insert({empresa_id:empresaId,funcionario_id:f,obra_id:b,valor:30}).select("id").single(),"Vale").id;
  const bonus=unwrap(await client.from("bonus_extras").insert({empresa_id:empresaId,funcionario_id:f,obra_id:a,valor:40,tipo:"bonus"}).select("id").single(),"Bônus").id;
  checks.vales_bonus=!!v&&!!bonus;
  const args={p_funcionario_id:f,p_data_pagamento:"2026-11-16",p_diaria_ids:d.map(x=>x.id),p_vale_ids:[v],p_bonus_ids:[bonus],p_obra_pagamento_id:a,p_liquido_esperado:210};
  const pago=unwrap(await client.rpc("obrix_pagar_equipe_transacional_v2",args),"Pagamento");
  checks.pagamento=pago?.ok===true&&Number(pago.valor_liquido)===210;
  const rateio=unwrap(await client.from("financeiro").select("obra_id,valor").eq("pagamento_equipe_id",pago.pagamento_id),"Rateio");
  checks.rateio=rateio.length===2&&rateio.reduce((s,x)=>s+Number(x.valor),0)===210;
  const repeat=await client.rpc("obrix_pagar_equipe_transacional_v2",args);
  checks.duplicado=!!repeat.error;
  const rev=await client.rpc("obrix_estornar_pagamento_equipe",{p_pagamento_id:pago.pagamento_id,p_motivo:"Estorno HML"});
  if(rev.error)throw Error("Estorno: "+rev.error.message);
  const abertas=unwrap(await admin.from("diarias").select("id,paga").in("id",d.map(x=>x.id)),"Diárias estornadas");
  checks.estorno=abertas.length===2&&abertas.every(x=>!x.paga);
  const existingBuckets=unwrap(await admin.storage.listBuckets(),"Inventário de buckets");
  const existingDocBucket=existingBuckets.find(b=>b.id==="obrix-documentos");
  if(existingDocBucket){
    if(existingDocBucket.public===true)throw Error("Bucket de documentos inesperadamente público");
  }else{
    unwrap(await admin.storage.createBucket("obrix-documentos",{public:false}),"Bucket de homologação");
    bucket=true;
  }
  const file=empresaId+"/obra-a/documento-hml.pdf";
  unwrap(await client.storage.from("obrix-documentos").upload(file,new Blob(["%PDF-1.1\n%%EOF\n"],{type:"application/pdf"}),{contentType:"application/pdf",upsert:false}),"Upload PDF");
  const doc=unwrap(await client.from("documentos").insert({empresa_id:empresaId,obra_id:a,titulo:"HML PDF",nome_arquivo:"documento-hml.pdf",caminho_arquivo:file,tipo_arquivo:"application/pdf"}).select("id").single(),"Documento");
  checks.documento=!!doc.id;
  const signed=unwrap(await client.storage.from("obrix-documentos").createSignedUrl(file,60),"Link assinado");
  checks.url_assinada=!!signed.signedUrl;
  const deletion=await excluirContaVerificada({admin,userId,perfil:profile,limparStorage:excluirArquivosEmpresa});
  checks.exclusao=deletion?.ok===true&&deletion.escopo==="empresa";
  const files=unwrap(await admin.storage.from("obrix-documentos").list(empresaId,{limit:50}),"Checar Storage");
  checks.storage_limpo=files.length===0;
  const journal=unwrap(await admin.rpc("obrix_consultar_exclusao_v1",{p_usuario_id:userId}),"Checar journal");
  checks.banco_limpo=journal?.encontrado===true&&journal?.etapa==="finalizado";
  const auth=await admin.auth.admin.getUserById(userId);
  checks.auth_removido=!!auth.error&&(Number(auth.error.status)===404||auth.error.code==="user_not_found");
  const stale=await client.auth.getUser(token);
  checks.token_antigo=!!stale.error||!stale.data?.user;
  if(bucket){
    unwrap(await admin.storage.deleteBucket("obrix-documentos"),"Excluir bucket temporário");
    bucket=false;
  }
  const success=Object.values(checks).every(Boolean);
  return out(success?200:422,{ok:success,checks,errors:success?[]:["Verificações incompletas"]});
 }catch(e){
  errors.push(String(e?.message||e).slice(0,380));
  if(bucket){
   try{await admin.storage.emptyBucket("obrix-documentos");await admin.storage.deleteBucket("obrix-documentos")}catch{}
  }
  return out(500,{ok:false,checks,errors});
 }
});