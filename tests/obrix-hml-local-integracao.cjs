'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {createClient}=require('@supabase/supabase-js');

const API_URL='http://127.0.0.1:54321';
function loadLocalCredentials(){
  const filename=process.env.OBRIX_LOCAL_SUPABASE_STATUS;
  if(!filename)throw Error('Teste não pode executar sem arquivo de credenciais locais');
  const c=JSON.parse(fs.readFileSync(filename,'utf8'));
  const endpoint=c.API_URL||c.api_url;
  if(endpoint!==API_URL)throw Error('E2E rejeitado: URL não é a pilha Supabase local');
  const anon=c.ANON_KEY||c.anon_key;
  const admin=c.SERVICE_ROLE_KEY||c.service_role_key;
  if(!anon||!admin)throw Error('Credenciais locais de teste ausentes');
  return {anon,admin};
}
function must(result,operation){
  if(result?.error)throw Error(operation+': '+result.error.message);
  return result?.data;
}

test('integração real em Supabase LOCAL — Auth, trial, pagamentos, documentos e exclusão',async()=>{
  const {anon,admin:serviceKey}=loadLocalCredentials();
  const admin=createClient(API_URL,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const client=createClient(API_URL,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {excluirContaVerificada}=await import(pathToFileURL(path.resolve(__dirname,'../supabase/functions/obrix-delete-account/account-deletion-workflow.mjs')).href);
  const {excluirArquivosEmpresa}=await import(pathToFileURL(path.resolve(__dirname,'../supabase/functions/obrix-delete-account/storage-cleanup.mjs')).href);

  const email='obrix-ci-'+crypto.randomUUID()+'@example.com';
  const password=crypto.randomUUID()+'aA1!';
  assert.ok(Buffer.byteLength(password,'utf8')<=72,'Senha fictícia excede o limite do bcrypt');
  const created=must(await admin.auth.admin.createUser({
    email,password,email_confirm:true,
    user_metadata:{nome:'OBRIX TESTE LOCAL',empresa_nome:'EMPRESA DE HOMOLOGAÇÃO'}
  }),'Auth Admin');
  const userId=created.user?.id;
  assert.ok(userId,'Auth não devolveu o identificador de teste');
  const perfil=must(await admin.from('perfis').select('id,empresa_id,papel').eq('id',userId).single(),'Perfil criado pelo Auth');
  assert.equal(perfil.papel,'proprietario');
  const empresaId=perfil.empresa_id;
  assert.match(empresaId,/^[0-9a-f-]{36}$/);
  const assinaturas=must(await admin.from('assinaturas').select('status,trial_fim').eq('empresa_id',empresaId).single(),'Assinatura');
  assert.equal(assinaturas.status,'teste');
  assert.ok(new Date(assinaturas.trial_fim).getTime()>Date.now(),'trial já expirado');

  const logged=must(await client.auth.signInWithPassword({email,password}),'Login real');
  assert.equal(logged.user?.id,userId);
  assert.ok(logged.session?.access_token);

  const obraA=must(await client.from('obras').insert({
    empresa_id:empresaId,nome:'OBRA A DE TESTES',status:'andamento'
  }).select('id').single(),'Obra A').id;
  const obraB=must(await client.from('obras').insert({
    empresa_id:empresaId,nome:'OBRA B DE TESTES',status:'andamento'
  }).select('id').single(),'Obra B').id;
  assert.notEqual(obraA,obraB);

  const funcionario=must(await client.from('funcionarios').insert({
    empresa_id:empresaId,nome:'TRABALHADOR FICTÍCIO',valor_diaria:200
  }).select('id').single(),'Funcionário').id;
  const diarias=must(await client.from('diarias').insert([
    {empresa_id:empresaId,funcionario_id:funcionario,obra_id:obraA,quantidade:0.5,valor_unitario:200,valor_total:100},
    {empresa_id:empresaId,funcionario_id:funcionario,obra_id:obraB,quantidade:0.5,valor_unitario:200,valor_total:100}
  ]).select('id,quantidade'),'Duas meias diárias');
  assert.equal(diarias.length,2);
  assert.ok(diarias.every(x=>Number(x.quantidade)===0.5));

  const vale=must(await client.from('vales').insert({
    empresa_id:empresaId,funcionario_id:funcionario,obra_id:obraB,valor:30
  }).select('id').single(),'Vale').id;
  const bonus=must(await client.from('bonus_extras').insert({
    empresa_id:empresaId,funcionario_id:funcionario,obra_id:obraA,valor:40,tipo:'bonus'
  }).select('id').single(),'Bônus').id;
  const args={
    p_funcionario_id:funcionario,p_data_pagamento:'2026-11-16',
    p_diaria_ids:diarias.map(x=>x.id),p_vale_ids:[vale],p_bonus_ids:[bonus],
    p_obra_pagamento_id:obraA,p_liquido_esperado:210
  };
  const pago=must(await client.rpc('obrix_pagar_equipe_transacional_v2',args),'Pagamento atômico');
  assert.equal(pago.ok,true);
  assert.equal(Number(pago.valor_liquido),210);
  assert.ok(pago.pagamento_id);
  const rateio=must(await client.from('financeiro').select('obra_id,valor').eq('pagamento_equipe_id',pago.pagamento_id),'Rateio de duas obras');
  assert.equal(rateio.length,2);
  assert.equal(rateio.reduce((a,x)=>a+Number(x.valor),0),210);
  assert.ok(rateio.some(x=>x.obra_id===obraA));
  assert.ok(rateio.some(x=>x.obra_id===obraB));
  const duplicate=await client.rpc('obrix_pagar_equipe_transacional_v2',args);
  assert.ok(duplicate.error,'Pagamento duplicado foi aceito');
  must(await client.rpc('obrix_estornar_pagamento_equipe',{
    p_pagamento_id:pago.pagamento_id,p_motivo:'ESTORNO DE TESTE'
  }),'Estornar folha');
  const abertas=must(await client.from('diarias').select('id,paga').in('id',diarias.map(x=>x.id)),'Conferir reabertura de diárias');
  assert.equal(abertas.length,2);
  assert.ok(abertas.every(x=>!x.paga));

  const bucket='obrix-documentos';
  const buckets=must(await admin.storage.listBuckets(),'Listar buckets');
  const existing=buckets.find(x=>x.id===bucket);
  if(existing){
    assert.equal(existing.public,false,'Bucket de documentos não pode ser público');
  }else{
    must(await admin.storage.createBucket(bucket,{public:false}),'Criar bucket fictício');
  }
  const file=empresaId+'/'+obraA+'/documento-ci.pdf';
  const bytes=Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n');
  must(await client.storage.from(bucket).upload(file,bytes,{
    contentType:'application/pdf',upsert:false
  }),'Upload de PDF');
  const doc=must(await client.from('documentos').insert({
    empresa_id:empresaId,obra_id:obraA,titulo:'Documento CI',
    nome_arquivo:'documento-ci.pdf',tipo_arquivo:'application/pdf',caminho_arquivo:file
  }).select('id').single(),'Cadastro Documento');
  assert.ok(doc.id);
  const signed=must(await client.storage.from(bucket).createSignedUrl(file,120),'URL assinada');
  assert.ok(signed.signedUrl);

  const result=await excluirContaVerificada({admin,userId,perfil,limparStorage:excluirArquivosEmpresa});
  assert.equal(result.ok,true);
  assert.equal(result.escopo,'empresa');
  const rest=must(await admin.storage.from(bucket).list(empresaId,{limit:20}),'Verificar limpeza física');
  assert.equal(rest.length,0);
  const journal=must(await admin.rpc('obrix_consultar_exclusao_v1',{p_usuario_id:userId}),'Consultar journal');
  assert.equal(journal.encontrado,true);
  assert.equal(journal.etapa,'finalizado');
  const auth=await admin.auth.admin.getUserById(userId);
  assert.ok(auth.error,'Auth ainda retornou usuário excluído');
  assert.ok(Number(auth.error.status)===404||auth.error.code==='user_not_found');
  const stale=await client.auth.getUser(logged.session.access_token);
  assert.ok(stale.error||!stale.data?.user,'getUser do token antigo deveria falhar');
});
