'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const SCRIPT=fs.readFileSync(path.join(__dirname,'../obrix-equipe-liquidacao-segura.js'),'utf8');
const EMPRESA='11111111-1111-4111-8111-111111111111';
const FUNCIONARIO='22222222-2222-4222-8222-222222222222';
const OBRA1='33333333-3333-4333-8333-333333333333';
const OBRA2='44444444-4444-4444-8444-444444444444';
const DIARIA='55555555-5555-4555-8555-555555555555';
const VALE='66666666-6666-4666-8666-666666666666';
const RESPOSTAS={
 funcionarios:{id:FUNCIONARIO,nome:'Funcionário de teste'},
 diarias:[{id:DIARIA,obra_id:OBRA1,valor_total:200}],
 vales:[{id:VALE,obra_id:OBRA2,valor:80}],
 bonus_extras:[]
};
const ARG={funcionarioId:FUNCIONARIO,data:'2026-11-16',obraPagamentoId:OBRA1,esperado:120};

function cliente(url,chamadas){
 function from(table){
  return {
   select(){return this},
   eq(){return this},
   is(){return this},
   maybeSingle:async()=>({data:RESPOSTAS[table],error:null}),
   then(onFulfilled,onRejected){return Promise.resolve({data:RESPOSTAS[table],error:null}).then(onFulfilled,onRejected)}
  };
 }
 return {
  supabaseUrl:url,
  from,
  rpc:async(name,args)=>{
   chamadas.push({name,args});
   return {data:{ok:true,pagamento_id:DIARIA,valor_bruto:200,valor_vales:80,valor_liquido:120},error:null};
  }
 };
}
function harness(origin){
 const calls=[];
 const window={__OBRIX_PAGAMENTO_ATOMICO_PRODUCAO:true};
 vm.runInNewContext(SCRIPT,{window,navigator:{onLine:true},URL,setTimeout,clearTimeout},{
  filename:'obrix-equipe-liquidacao-segura.js',timeout:3000
 });
 if(origin)window.OBRIX_BACKEND={
  init:async()=>cliente(origin,calls),
  profile:async()=>({empresa_id:EMPRESA})
 };
 return {window,calls};
}
test('bloqueia chamada sem backend configurado',async()=>{
 const h=harness();
 await assert.rejects(()=>h.window.OBRIX_LIQUIDACAO_SEGURA.registrar(ARG),/não foi configurado/);
 assert.equal(h.calls.length,0);
});
test('impede o caminho de produção de usar o Supabase de auditoria',async()=>{
 const h=harness('https://mjzlwnuklfopdmgcvdcs.supabase.co');
 await assert.rejects(()=>h.window.OBRIX_LIQUIDACAO_SEGURA.registrar(ARG),/diferente do OBRIX oficial/);
 assert.equal(h.calls.length,0);
});
test('usa a RPC única e transmite dados de duas obras',async()=>{
 const h=harness('https://gnvclctqnwxnjxydzhwc.supabase.co');
 const r=await h.window.OBRIX_LIQUIDACAO_SEGURA.registrar(ARG);
 assert.equal(r.ok,true);
 assert.equal(r.liquido,120);
 assert.equal(r.homologacao,false);
 assert.equal(h.calls.length,1);
 assert.equal(h.calls[0].name,'obrix_pagar_equipe_transacional_v2');
 assert.deepEqual(Array.from(h.calls[0].args.p_diaria_ids),[DIARIA]);
 assert.deepEqual(Array.from(h.calls[0].args.p_vale_ids),[VALE]);
 assert.equal(h.calls[0].args.p_obra_pagamento_id,OBRA1);
 assert.equal(h.calls[0].args.p_liquido_esperado,120);
});
test('recusa folha com valor esperado desatualizado antes de gravar',async()=>{
 const h=harness('https://gnvclctqnwxnjxydzhwc.supabase.co');
 await assert.rejects(()=>h.window.OBRIX_LIQUIDACAO_SEGURA.registrar({...ARG,esperado:119}),/mudou/);
 assert.equal(h.calls.length,0);
});
test('o caminho de produção permanece desligado por padrão',()=>{
 const window={};
 vm.runInNewContext(SCRIPT,{window,navigator:{onLine:true},URL,setTimeout,clearTimeout},{
  filename:'obrix-equipe-liquidacao-segura.js',timeout:3000
 });
 assert.equal(window.__OBRIX_PAGAMENTO_ATOMICO_PRODUCAO,undefined);
 assert.equal(typeof window.OBRIX_LIQUIDACAO_SEGURA.registrar,'function');
});


test('prévia HML usa RPC atômica no banco isolado sem ativar produção',async()=>{
 const calls=[];
 const window={
   location:{hostname:'alef-obras-hml-obrix3.vercel.app'},
   __OBRIX_HML_PROJECT_REF:'xnvjqolbvzgozlmuagpi'
 };
 vm.runInNewContext(SCRIPT,{window,navigator:{onLine:true},URL,setTimeout,clearTimeout},{
   filename:'obrix-equipe-liquidacao-segura.js',timeout:3000
 });
 window.OBRIX_BACKEND={
   init:async()=>cliente('https://xnvjqolbvzgozlmuagpi.supabase.co',calls),
   profile:async()=>({empresa_id:EMPRESA})
 };
 const result=await window.OBRIX_LIQUIDACAO_SEGURA.registrar(ARG);
 assert.equal(result.ok,true);
 assert.equal(result.homologacao,true);
 assert.equal(calls.length,1);
 assert.equal(calls[0].name,'obrix_pagar_equipe_transacional_v2');
 assert.equal(window.__OBRIX_PAGAMENTO_ATOMICO_PRODUCAO,undefined);
});

test('prévia HML recusa cliente apontando para banco oficial sem gravar',async()=>{
 const calls=[];
 const window={
   location:{hostname:'alef-obras-hml-obrix3.vercel.app'},
   __OBRIX_HML_PROJECT_REF:'xnvjqolbvzgozlmuagpi'
 };
 vm.runInNewContext(SCRIPT,{window,navigator:{onLine:true},URL,setTimeout,clearTimeout},{
   filename:'obrix-equipe-liquidacao-segura.js',timeout:3000
 });
 window.OBRIX_BACKEND={
   init:async()=>cliente('https://gnvclctqnwxnjxydzhwc.supabase.co',calls),
   profile:async()=>({empresa_id:EMPRESA})
 };
 await assert.rejects(
   ()=>window.OBRIX_LIQUIDACAO_SEGURA.registrar(ARG),
   /Banco de dados diferente do ambiente autorizado/
 );
 assert.equal(calls.length,0);
});
