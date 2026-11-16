/**
 * OBRIX: testar o fluxo da Edge Function com clientes simulados.
 * Executar: node --test tests/obrix-excluir-conta-fluxo-seguro.cjs
 * NÃO exclui contas reais e não requer credenciais Supabase.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const url=pathToFileURL(path.join(__dirname,'../supabase/functions/obrix-delete-account/account-deletion-workflow.mjs')).href;
const USER='11111111-1111-4111-8111-111111111111';
const EMPRESA='22222222-2222-4222-8222-222222222222';
const perfil=(papel='proprietario')=>({id:USER,empresa_id:EMPRESA,papel});

function preparar({count=1,preflight=true,commit=true,authDelete=true,profileDelete=true,storage=true}={}){
 const events=[];
 const admin={
  storage:{},
  from(table){assert.equal(table,'perfis');return{
   select(){return{eq:async()=>{events.push('contagem');return{count,error:null}}}},
   delete(){return{eq(){return{eq:async()=>{events.push('excluir_perfil');return{error:profileDelete?null:Error('falha perfil')}}}}}}
  }},
  rpc:async (name,args)=>{
   assert.equal(name,'obrix_excluir_empresa_dados_v1');
   assert.equal(args.p_empresa_id,EMPRESA);assert.equal(args.p_usuario_id,USER);
   events.push(args.p_simular?'simulacao':'excluir_empresa');
   const allowed=args.p_simular?preflight:commit;
   return{data:allowed?{ok:true,simulacao:args.p_simular}:{ok:false},error:allowed?null:Error('Falha controlada')};
  },
  auth:{admin:{deleteUser:async id=>{assert.equal(id,USER);events.push('excluir_login');return{error:authDelete?null:Error('Falha auth')}}}}
 };
 async function limparStorage(){events.push('limpar_storage');if(!storage)throw Error('Falha no Storage');return{arquivosRemovidos:3,bytesEstimados:100}}
 return{admin,events,limparStorage};
}

test('único titular: valida antes de Storage, exclui banco e só depois Auth',async()=>{
 const {excluirContaVerificada}=await import(url);
 const m=preparar();
 const res=await excluirContaVerificada({...m,admin:m.admin,userId:USER,perfil:perfil()});
 assert.deepEqual(m.events,['contagem','simulacao','limpar_storage','excluir_empresa','excluir_login']);
 assert.equal(res.escopo,'empresa');assert.equal(res.arquivosRemovidos,3);
});
test('pré-validação falha: nenhum arquivo, dado ou login é excluído',async()=>{
 const {excluirContaVerificada}=await import(url);
 const m=preparar({preflight:false});
 await assert.rejects(excluirContaVerificada({admin:m.admin,userId:USER,perfil:perfil(),limparStorage:m.limparStorage}),/não está preparada/);
 assert.deepEqual(m.events,['contagem','simulacao']);
});
test('falha no banco não autoriza apagar login e identifica etapa parcial',async()=>{
 const {excluirContaVerificada}=await import(url);
 const m=preparar({commit:false});
 await assert.rejects(excluirContaVerificada({admin:m.admin,userId:USER,perfil:perfil(),limparStorage:m.limparStorage}),/Arquivos foram processados/);
 assert.deepEqual(m.events,['contagem','simulacao','limpar_storage','excluir_empresa']);
});
test('empresa com múltiplos usuários: preserva Storage e dados compartilhados',async()=>{
 const {excluirContaVerificada}=await import(url);
 const m=preparar({count:2});
 const res=await excluirContaVerificada({admin:m.admin,userId:USER,perfil:perfil(),limparStorage:m.limparStorage});
 assert.deepEqual(m.events,['contagem','excluir_perfil','excluir_login']);
 assert.equal(res.escopo,'usuario');assert.equal(res.arquivosRemovidos,0);
});
test('último perfil sem permissão de administrador não apaga empresa',async()=>{
 const {excluirContaVerificada}=await import(url);
 const m=preparar();
 await assert.rejects(excluirContaVerificada({admin:m.admin,userId:USER,perfil:perfil('funcionario'),limparStorage:m.limparStorage}),/Somente o titular/);
 assert.deepEqual(m.events,['contagem']);
});
test('perfil de outro usuário nunca autoriza exclusão',async()=>{
 const {excluirContaVerificada}=await import(url);
 const m=preparar();
 await assert.rejects(excluirContaVerificada({admin:m.admin,userId:USER,perfil:{...perfil(),id:EMPRESA},limparStorage:m.limparStorage}),/não correspondem/);
 assert.deepEqual(m.events,[]);
});
test('sem perfil em uma retomada: remove somente o login',async()=>{
 const {excluirContaVerificada}=await import(url);
 const m=preparar();
 const res=await excluirContaVerificada({admin:m.admin,userId:USER,perfil:null,limparStorage:m.limparStorage});
 assert.deepEqual(m.events,['excluir_login']);assert.equal(res.escopo,'usuario');
});
test('falha do Auth não retorna sucesso de exclusão',async()=>{
 const {excluirContaVerificada}=await import(url);
 const m=preparar({authDelete:false});
 await assert.rejects(excluirContaVerificada({admin:m.admin,userId:USER,perfil:perfil(),limparStorage:m.limparStorage}),/login não foi confirmada/);
 assert.deepEqual(m.events,['contagem','simulacao','limpar_storage','excluir_empresa','excluir_login']);
});
