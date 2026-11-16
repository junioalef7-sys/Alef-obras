'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const sql=read('database/release/obrix_backend_release_candidate_20261116.sql');
const team=read('obrix-equipe-liquidacao-segura.js');
const account=read('supabase/functions/obrix-delete-account/account-deletion-workflow.mjs');
const edge=read('supabase/functions/obrix-delete-account/index.ts');
const storage=read('supabase/functions/obrix-delete-account/storage-cleanup.mjs');
function expect(text,need){assert.ok(text.includes(need),'Missing required condition: '+need)}

test('release SQL is guarded against accidental production execution',()=>{
 expect(sql,"BEGIN;\nDO $block$ BEGIN");
 expect(sql,"RAISE EXCEPTION 'OBRIX RELEASE BLOCKED");
 expect(sql,'CREATE SCHEMA IF NOT EXISTS obrix_conta_interna');
 expect(sql,'REVOKE ALL ON SCHEMA obrix_conta_interna FROM PUBLIC,anon,authenticated');
 assert.equal(sql.includes('CREATE OR REPLACE FUNCTION public.obrix_storage_upload_permitido'),false);
 for(const old of ['obrix_operacional_lab','obrix_exclusao_hml_20261116','obrix_seg_hml_20261116']){
  assert.equal(sql.includes(old),false,'Unexpected lab reference '+old);
 }
});

test('privileged account deletion is available only to service role',()=>{
 for(const name of ['obrix_excluir_empresa_dados_v1','obrix_reservar_exclusao_v1',
                    'obrix_avancar_exclusao_v1','obrix_consultar_exclusao_v1']){
   expect(sql,'CREATE OR REPLACE FUNCTION public.'+name+'(');
   expect(sql,'REVOKE ALL ON FUNCTION public.'+name+'(');
 }
 expect(sql,'GRANT EXECUTE ON FUNCTION public.obrix_consultar_exclusao_v1(uuid) TO service_role');
 expect(sql,'obrix_conta_interna.contexto');
 expect(sql,'obrix_conta_interna.solicitacoes');
 expect(sql,'obrix_exclusao_bloquear_gravacoes');
});

test('upload blocking policies restrict existing bucket permissions',()=>{
 expect(sql,'AS RESTRICTIVE FOR INSERT');
 expect(sql,'AS RESTRICTIVE FOR UPDATE');
 for(const bucket of ['obrix-documentos','obrix-fotos','relatorio-fotografico'])expect(sql,bucket);
 expect(sql,'obrix_conta_interna.obrix_storage_upload_permitido');
 expect(sql,'GRANT USAGE ON SCHEMA obrix_conta_interna TO authenticated');
});

test('payment function uses one transaction with all approved financial links',()=>{
 expect(sql,'CREATE OR REPLACE FUNCTION public.obrix_pagar_equipe_transacional_v2(');
 for(const p of ['for update','cancelada_em is null','estornado_em is null','checklist_valores','p_liquido_esperado'])expect(sql.toLowerCase(),p.toLowerCase());
 expect(sql,'GRANT EXECUTE ON FUNCTION public.obrix_pagar_equipe_transacional_v2');
});

test('test payment RPC remains opt-in and cannot target official backend',()=>{
 expect(team,'__OBRIX_PAGAMENTO_ATOMICO_HML===true');
 expect(team,'https://mjzlwnuklfopdmgcvdcs.supabase.co');
 expect(team,'Ambiente diferente do banco de testes');
});

test('physical files are removed and verified only through Storage API',()=>{
 expect(storage,'.remove(batch)');
 expect(storage,'remaining.totalFiles!==0');
 assert.equal(storage.toLowerCase().includes('delete from storage.objects'),false);
});

test('deletion endpoint verifies caller and never uses artificial reversal',()=>{
 expect(edge,'userClient.auth.getUser()');
 expect(edge,'EXCLUIR CONTA');
 expect(edge,'excluirContaVerificada');
 assert.equal(edge.includes('status_lancamento:"estornado"'),false);
 assert.equal(edge.includes('admin.from("empresas").delete()'),false);
});

test('account deletion has journal and safe recovery behavior',()=>{
 for(const name of ['obrix_reservar_exclusao_v1','obrix_avancar_exclusao_v1','obrix_consultar_exclusao_v1'])expect(account,name);
 expect(account,'confirmarLoginRemovido');
 expect(account,'banco_concluido');
 expect(account,'storage_concluido');
});


test('cadastro de perfis e notificacoes sem empresa continua funcionando',()=>{
 const triggerStart=sql.indexOf('CREATE OR REPLACE FUNCTION obrix_conta_interna.bloquear_gravacoes_empresa()');
 const triggerEnd=sql.indexOf('CREATE OR REPLACE FUNCTION obrix_conta_interna.obrix_storage_upload_permitido(',triggerStart);
 assert.ok(triggerStart>=0&&triggerEnd>triggerStart);
 const trigger=sql.slice(triggerStart,triggerEnd);
 expect(trigger,'IF v_empresa IS NULL THEN');
 expect(trigger,'IF v_destino IS NULL THEN');
 expect(trigger,"RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END");
 expect(trigger,'WHERE empresa_id=v_destino');
 expect(trigger,"USING ERRCODE='42501'");
 assert.equal(trigger.includes("IF v_empresa IS NULL THEN RAISE EXCEPTION 'Empresa obrigatória.'"),false);
 const suite=read('database/release/obrix_hml_regressao_empresa_nula_20261116.sql');
 expect(suite,"to_regnamespace('obrix_exclusao_hml_20261116')");
 expect(suite,'empresa_id uuid NULL');
 expect(suite,'UPDATE obrix_nullable_regressao SET empresa_id=e1');
 expect(suite,'INSERT INTO obrix_nullable_regressao');
 expect(suite,'ROLLBACK;');
});


test('baseline do banco reconstruído está protegida',()=>{
 const baseline=read('database/release/obrix_hml_baseline_schema_sem_dados_20261116.sql');
 expect(baseline,"OBRIX_BASELINE_REFUSED");
 expect(baseline,"current_setting('obrix.allow_baseline_hml', true)");
 expect(baseline,'CREATE TABLE "public"."empresas"');
 expect(baseline,'CREATE TABLE "public"."financeiro"');
 expect(baseline,'CREATE TABLE "public"."documentos"');
 expect(baseline,'CREATE TABLE "private"."pagamento_eventos"');
 expect(baseline,'CREATE POLICY');
 expect(baseline,'CREATE TRIGGER');
 expect(baseline,'-- Independent indexes required by composite FKs');
 const pos=baseline.indexOf('-- Independent indexes required by composite FKs');
 const fk=baseline.indexOf('-- Foreign keys');
 assert.ok(pos>0 && fk>pos,'Índices devem anteceder chaves estrangeiras');
});

test('papel administrador verdadeiro é aceito nos controles de pagamentos',()=>{
 const match=sql.match(/\('proprietario','administrador'\)/g)||[];
 assert.equal(match.length,4,'Os quatro controles precisam aceitar o papel do esquema oficial');
 assert.equal(sql.includes("('proprietario','admin')"),false);
});

test('ensaio E2E é restrito a uma branch efêmera e não contém credenciais',()=>{
 const runtime=read('tests/obrix-e2e-runtime-hml-branch-20261116.mjs');
 expect(runtime,'OBRIX_HML_PROJECT_REF');
 expect(runtime,'PROJETO_VALIDO');
 expect(runtime,'REFS_BLOQUEADOS');
 expect(runtime,'obrix_hml_claim_once_v1');
 expect(runtime,'excluirContaVerificada');
 assert.equal(runtime.includes('const PROJECT="ygcwnozfseojqronhaan"'),false);
 const claim=read('database/release/obrix_hml_fixture_executor_one_shot_20261116.sql');
 expect(claim,'OBRIX_HML_FIXTURE_BLOCKED');
 expect(claim,'obrix_hml_claim_once_v1');
 expect(claim,'SELECT 1 FROM auth.users');
 expect(claim,'SELECT 1 FROM storage.objects');
 assert.equal(/eyJ[A-Za-z0-9_-]{60,}|sb_secret_[A-Za-z0-9]{20,}/.test(runtime),false);
});
