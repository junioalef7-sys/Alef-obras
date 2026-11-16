/**
 * OBRIX — regressão da exclusão de conta com checkpoints retomáveis.
 * Banco, Storage e Auth são simulados; este arquivo NUNCA exclui dados reais.
 * Executar: node --test tests/obrix-excluir-conta-fluxo-seguro.cjs
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const url=pathToFileURL(path.join(__dirname,'../supabase/functions/obrix-delete-account/account-deletion-workflow.mjs')).href;
const USER='11111111-1111-4111-8111-111111111111';
const EMPRESA='22222222-2222-4222-8222-222222222222';
const perfil=(papel='proprietario')=>({id:USER,empresa_id:EMPRESA,papel});

function ambiente(opts={}){
  const eventos=[];
  let etapa=opts.etapa??null;
  let usuarioExiste=opts.usuarioExiste??true;
  let temPerfil=opts.temPerfil??true;
  let arquivos=opts.arquivos??3;
  const quantidade=opts.usuarios??1;
  const admin={
    storage:{},
    from(tabela){
      assert.equal(tabela,'perfis');
      return{
        select(){return{eq:async()=>{
          eventos.push('contagem');
          return{count:quantidade,error:opts.erroContagem?Error('indisponível'):null};
        }}},
        delete(){return{eq(){return{eq:async()=>{
          eventos.push('perfil');
          if(opts.erroPerfil)return{error:Error('erro de perfil')};
          temPerfil=false;return{error:null};
        }}}}}
      };
    },
    rpc:async (nome,args)=>{
      if(nome==='obrix_reservar_exclusao_v1'){
        eventos.push('reserva');
        assert.equal(args.p_usuario_id,USER);
        assert.equal(args.p_empresa_id,EMPRESA);
        if(opts.erroReserva)return{data:null,error:Error('pré-validação falhou')};
        const retomada=etapa!==null;
        if(!etapa)etapa='preparado';
        return{data:{ok:true,etapa,retomada},error:null};
      }
      if(nome==='obrix_consultar_exclusao_v1'){
        eventos.push('consulta');
        if(opts.erroConsulta)return{data:null,error:Error('consulta indisponível')};
        return{data:etapa?{ok:true,encontrado:true,empresa_id:EMPRESA,etapa}:{ok:false,encontrado:false},error:null};
      }
      assert.equal(nome,'obrix_avancar_exclusao_v1');
      assert.equal(args.p_usuario_id,USER);
      assert.equal(args.p_empresa_id,EMPRESA);
      eventos.push('avancar:'+args.p_etapa);
      if(opts.erroAvanco===args.p_etapa)return{data:null,error:Error('etapa falhou')};
      const jaAplicado=etapa===args.p_etapa;
      etapa=args.p_etapa;
      if(etapa==='banco_concluido')temPerfil=false;
      return{data:{ok:true,etapa,ja_aplicado:jaAplicado},error:null};
    },
    auth:{admin:{
      deleteUser:async id=>{
        assert.equal(id,USER);
        eventos.push('auth');
        if(opts.erroAuth)return{error:Error('falha no Auth')};
        if(opts.authJaRemovido)return{error:{status:404,code:'user_not_found'}};
        usuarioExiste=false;
        return{error:null};
      },
      getUserById:async id=>{
        assert.equal(id,USER);
        eventos.push('verificar-auth');
        if(opts.erroVerificacao)return{data:null,error:{status:500}};
        return usuarioExiste?{data:{user:{id:USER}},error:null}:{data:{user:null},error:{status:404}};
      }
    }}
  };
  async function limparStorage(){
    eventos.push('storage');
    if(opts.erroStorage)throw Error('Falha no Storage');
    const result={arquivosRemovidos:arquivos,bytesEstimados:arquivos*100};
    arquivos=0;
    return result;
  }
  return{
    admin,eventos,limparStorage,
    perfil:()=>temPerfil?perfil(opts.papel||'proprietario'):null,
    etapa:()=>etapa,usuarioExiste:()=>usuarioExiste
  };
}
async function executar(opts={},p){
  const {excluirContaVerificada}=await import(url);
  const m=ambiente(opts);
  let resultado,erro;
  try{
    resultado=await excluirContaVerificada({
      admin:m.admin,userId:USER,perfil:p===undefined?m.perfil():p,limparStorage:m.limparStorage
    });
  }catch(e){erro=e}
  return {...m,resultado,erro};
}

test('último titular: Storage > banco > Auth > checkpoint final',async()=>{
  const r=await executar();
  assert.ifError(r.erro);
  assert.equal(r.resultado.escopo,'empresa');
  assert.deepEqual(r.eventos,['contagem','reserva','storage','avancar:storage_concluido','avancar:banco_concluido','auth','avancar:finalizado']);
  assert.equal(r.etapa(),'finalizado');assert.equal(r.usuarioExiste(),false);
});
test('pré-validação falha: não toca Storage, banco ou Auth',async()=>{
  const r=await executar({erroReserva:true});
  assert.match(r.erro.message,/Falha de segurança/);
  assert.deepEqual(r.eventos,['contagem','reserva']);
});
test('falha no Storage deixa checkpoint preparado e nenhum login excluído',async()=>{
  const r=await executar({erroStorage:true});
  assert.match(r.erro.message,/Storage/);
  assert.equal(r.etapa(),'preparado');
  assert.deepEqual(r.eventos,['contagem','reserva','storage']);
});
test('falha no banco preserva estado para repetição e não apaga Auth',async()=>{
  const r=await executar({erroAvanco:'banco_concluido'});
  assert.match(r.erro.message,/retomada/);
  assert.equal(r.etapa(),'storage_concluido');
  assert.deepEqual(r.eventos,['contagem','reserva','storage','avancar:storage_concluido','avancar:banco_concluido']);
});
test('falha no Auth mantém banco concluído para retomada',async()=>{
  const r=await executar({erroAuth:true});
  assert.match(r.erro.message,/retomada/);
  assert.equal(r.etapa(),'banco_concluido');
  assert.equal(r.usuarioExiste(),true);
});
test('retomar após remoção do banco não apaga arquivos novamente',async()=>{
  const r=await executar({etapa:'banco_concluido',temPerfil:false});
  assert.ifError(r.erro);
  assert.deepEqual(r.eventos,['consulta','auth','avancar:finalizado']);
});
test('retomar Storage confirmado repete verificação sem duplicar checkpoint',async()=>{
  const r=await executar({etapa:'storage_concluido'});
  assert.ifError(r.erro);
  assert.deepEqual(r.eventos,['contagem','reserva','storage','avancar:banco_concluido','auth','avancar:finalizado']);
});
test('sem perfil, com banco ainda pendente, bloqueia exclusão do login',async()=>{
  const r=await executar({etapa:'preparado',temPerfil:false});
  assert.match(r.erro.message,/não terminou/);
  assert.deepEqual(r.eventos,['consulta']);
});
test('sem perfil e sem solicitação anterior, remove só o login',async()=>{
  const r=await executar({temPerfil:false});
  assert.ifError(r.erro);assert.equal(r.resultado.escopo,'usuario');
  assert.deepEqual(r.eventos,['consulta','auth']);
});
test('empresa com outros membros preserva Storage e dados compartilhados',async()=>{
  const r=await executar({usuarios:2});
  assert.ifError(r.erro);assert.equal(r.resultado.escopo,'usuario');
  assert.deepEqual(r.eventos,['contagem','perfil','auth']);
});
test('funcionário não pode excluir a última empresa',async()=>{
  const r=await executar({papel:'funcionario'});
  assert.match(r.erro.message,/titular ou administrador/);
  assert.deepEqual(r.eventos,['contagem']);
});
test('perfil de terceiro é rejeitado antes da contagem',async()=>{
  const r=await executar({},{...perfil(),id:EMPRESA});
  assert.match(r.erro.message,/não correspondem/);
  assert.deepEqual(r.eventos,[]);
});
test('finalizado e Auth ausente: confirma somente com 404 real',async()=>{
  const r=await executar({etapa:'finalizado',temPerfil:false,usuarioExiste:false});
  assert.ifError(r.erro);assert.equal(r.resultado.jaConcluida,true);
  assert.deepEqual(r.eventos,['consulta','verificar-auth']);
});
test('marcado finalizado, mas login ainda existe: não informa sucesso',async()=>{
  const r=await executar({etapa:'finalizado',temPerfil:false,usuarioExiste:true});
  assert.match(r.erro.message,/login ainda existe/);
  assert.deepEqual(r.eventos,['consulta','verificar-auth']);
});
test('erro de verificação do Auth não é tratado como usuário removido',async()=>{
  const r=await executar({etapa:'finalizado',temPerfil:false,erroVerificacao:true});
  assert.match(r.erro.message,/Não foi possível verificar/);
  assert.deepEqual(r.eventos,['consulta','verificar-auth']);
});
test('deleteUser respondeu 404, Auth ausente: retoma checkpoint final',async()=>{
  const r=await executar({etapa:'banco_concluido',temPerfil:false,usuarioExiste:false,authJaRemovido:true});
  assert.ifError(r.erro);assert.equal(r.etapa(),'finalizado');
  assert.deepEqual(r.eventos,['consulta','auth','verificar-auth','avancar:finalizado']);
});
test('deleteUser respondeu 404, mas Auth ainda existe: falha fechada',async()=>{
  const r=await executar({etapa:'banco_concluido',temPerfil:false,usuarioExiste:true,authJaRemovido:true});
  assert.match(r.erro.message,/login não foi removido/);
  assert.deepEqual(r.eventos,['consulta','auth','verificar-auth']);
});
test('falha na consulta da solicitação não permite exclusão órfã',async()=>{
  const r=await executar({temPerfil:false,erroConsulta:true});
  assert.match(r.erro.message,/exclusão anterior/);
  assert.deepEqual(r.eventos,['consulta']);
});
