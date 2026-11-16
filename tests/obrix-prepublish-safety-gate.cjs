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
