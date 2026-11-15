'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const daily=read('obrix-diarias-limite.js'),orange=read('obrix-acoes-laranja.js');
function regra(){
 const dados=new Map(),window={diarias:[],OBRIX_PT_ERROR:e=>e?.message||String(e)};
 const localStorage={getItem:k=>dados.get(k)||null};
 vm.runInNewContext(daily,{window,localStorage,console:{warn(){}}});
 return{api:window.OBRIX_DIARIA_LIMITE,dados,window};
}
test('uma diária inteira sem outras',()=>{
 const r=regra();assert.equal(r.api.avaliar([],1).ok,true);
});
test('segunda meia diária em outra obra permitida',()=>{
 const r=regra();assert.equal(r.api.avaliar([{quantidade:.5,obra_id:'A'}],.5).ok,true);
});
test('segunda meia diária na mesma obra permitida',()=>{
 const r=regra();assert.equal(r.api.avaliar([{quantidade:.5,obra_id:'A'}],.5).ok,true);
});
test('terceira meia diária bloqueada',()=>{
 const r=regra();assert.equal(r.api.avaliar([{quantidade:.5},{quantidade:.5}],.5).ok,false);
});
test('diária inteira após meia bloqueada',()=>{
 const r=regra();assert.equal(r.api.avaliar([{quantidade:.5}],1).ok,false);
});
test('meia após inteira bloqueada',()=>{
 const r=regra();assert.equal(r.api.avaliar([{quantidade:1}],.5).ok,false);
});
test('segunda inteira bloqueada',()=>{
 const r=regra();assert.equal(r.api.avaliar([{quantidade:1}],1).ok,false);
});
test('não permite quartos ou quantidades inválidas',()=>{
 const r=regra();assert.equal(r.api.avaliar([],.25).ok,false);assert.equal(r.api.avaliar([],2).ok,false);
});
const empresa='760a3847-fba3-40cf-bf5b-444c6f8305eb',funcionario='func-1',data='2026-11-15';
function servidor(rows){
 return{from:table=>{assert.equal(table,'diarias');return{select:()=>({eq(){return this},is:async()=>({data:rows,error:null})})}}};
}
test('consulta online valida registros em obras diferentes',async()=>{
 const r=regra(),base=[{id:'1',quantidade:.5,empresa_id:empresa,funcionario_id:funcionario,data}];
 assert.equal((await r.api.validar({empresa_id:empresa,funcionario_id:funcionario,data,quantidade:.5,sb:servidor(base)})).ok,true);
 assert.equal((await r.api.validar({empresa_id:empresa,funcionario_id:funcionario,data,quantidade:1,sb:servidor(base)})).ok,false);
});
test('em falha da rede bloqueia gravação sem verificação',async()=>{
 const r=regra(),sb={from:()=>({select:()=>({eq(){return this},is:async()=>({error:{message:'offline'}})})})};
 assert.equal((await r.api.validar({empresa_id:empresa,funcionario_id:funcionario,data,quantidade:1,sb})).ok,false);
});
test('fila offline impede diária extra e aceita segunda meia',async()=>{
 const r=regra();
 r.dados.set('obrix_equipe_offline_v1',JSON.stringify([{type:'diaria',payload:{id:'f1',empresa_id:empresa,funcionario_id:funcionario,data,quantidade:.5}}]));
 assert.equal((await r.api.validar({empresa_id:empresa,funcionario_id:funcionario,data,quantidade:.5,offline:true})).ok,true);
 assert.equal((await r.api.validar({empresa_id:empresa,funcionario_id:funcionario,data,quantidade:1,offline:true})).ok,false);
});
function estilos(nomes){
 const elements=nomes.map(label=>{
  const classes=new Set();
  return{tagName:'BUTTON',textContent:label,getAttribute:()=>null,matches:s=>s.includes('button'),querySelectorAll:()=>[],
   classList:{toggle:(id,ok)=>ok?classes.add(id):classes.delete(id),contains:id=>classes.has(id)}};
 });
 const head={appendChild:s=>head.style=s};
 const document={readyState:'complete',head,body:{matches:()=>false,querySelectorAll:()=>elements},createElement:()=>({id:'',textContent:''}),addEventListener:()=>{}};
 class MutationObserver{observe(){}}
 vm.runInNewContext(orange,{window:{addEventListener:()=>{}},document,MutationObserver,setTimeout:()=>1});
 return{elements,css:head.style.textContent};
}
test('ações positivas recebem laranja',()=>{
 const labels=['Salvar','Registrar diária','Confirmar pagamento','Adicionar obra','+ Adicionar','💾 Salvar'];
 const out=estilos(labels);out.elements.forEach((e,i)=>assert.equal(e.classList.contains('obrix-acao-laranja'),true,labels[i]));
});
test('ações destrutivas e cancelamento não ficam laranja',()=>{
 const labels=['Excluir','Confirmar exclusão','Cancelar','Estornar','Salvar e excluir','Desativar'];
 const out=estilos(labels);out.elements.forEach((e,i)=>assert.equal(e.classList.contains('obrix-acao-laranja'),false,labels[i]));
});
test('cor funciona sem depender do tema claro ou escuro',()=>{
 const out=estilos(['Salvar']);assert.ok(out.css.includes('background-color:#e97712!important'));
 assert.ok(out.css.includes('color:#fff!important'));
});
test('iPhone, Android e computador carregam os dois scripts',()=>{
 for(const base of ['obrix.html','obrix-android-inicial/obrix.html']){
  const s=read(base);
  assert.ok(s.includes('obrix-diarias-limite.js?v=20261115-regra1'));
  assert.ok(s.includes('obrix-acoes-laranja.js?v=20261115-temas1'));
 }
});
test('o PWA atualiza o cache de scripts e recebe versão nova',()=>{
 for(const file of ['obrix-sw.js','obrix-android-inicial/obrix-sw.js']){
  const s=read(file);assert.ok(s.includes('obrix-offline-v85-diarias-acoes-laranja-20261115'));
 }
});
