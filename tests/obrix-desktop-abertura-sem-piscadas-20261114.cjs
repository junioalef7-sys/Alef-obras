'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');

async function testeRotas(prefix){
  const menu=read(prefix+'obrix-menu-main.js');
  const start=menu.indexOf('async function garantir(k){'),end=menu.indexOf('function dadosContaLocal(){',start);
  assert.ok(start>=0&&end>start,prefix+' rotas não encontradas');
  const events=[],messages=[];
  const window={
    OBRIX_POS_LOGIN_LOADER:{
      loadFeature:async key=>{events.push('loading:'+key);await new Promise(r=>setTimeout(r,1500));return false}
    }
  };
  const sandbox={window,events,console,setTimeout,Promise,Date,alert:m=>messages.push(m)};
  vm.createContext(sandbox);
  vm.runInContext("let navegacaoId=0;const map={notas:'OBRIX_NOTAS',relatorios:'OBRIX_RELATORIOS'};"+
    "const featureKeys=new Set(['notas','relatorios']);const items=[['notas','✎','Notas'],['relatorios','▤','Relatórios']];"+
    "const timeout=p=>Promise.resolve(p);function openOffline(){};"+
    menu.slice(start,end)+"globalThis.testGo=go;",sandbox,{timeout:1000});
  for(const [key,name] of [['notas','OBRIX_NOTAS'],['relatorios','OBRIX_RELATORIOS']]){
    setTimeout(()=>{window[name]={open:()=>{events.push('opened:'+key)}}},45);
    const began=Date.now();
    await sandbox.testGo(key);
    assert.ok(Date.now()-began<900,prefix+key+' bloqueado por complementos opcionais');
    assert.ok(events.includes('opened:'+key),prefix+key+' não abriu');
  }
  assert.deepEqual(messages,[],prefix+' alerta falso ao abrir módulo');
}
async function testeEstoque(prefix){
  const loader=read(prefix+'obrix-pos-login-loader.js');
  const start=loader.indexOf('async function loadStockOperations(){');
  const end=loader.indexOf('async function loadFeature(name){',start);
  assert.ok(start>=0&&end>start,prefix+' carregador de operação ausente');
  const window={},seen=[];
  const sandbox={window,GROUPS:{estoque:['./obrix-estoque-operacoes-main.js?v=teste']},loadOne:async src=>{
    seen.push(src);window.OBRIX_EST_OP={abrir:(k)=>seen.push(k)};return true;
  }};
  vm.createContext(sandbox);
  vm.runInContext(loader.slice(start,end)+"globalThis.testStock=loadStockOperations;",sandbox);
  assert.equal(await sandbox.testStock(),true,prefix+' operação primária não carregou');
  window.OBRIX_EST_OP.abrir('transferencia');
  assert.deepEqual(seen,['./obrix-estoque-operacoes-main.js?v=teste','transferencia']);
  assert.equal(await sandbox.testStock(),true,prefix+' operação não foi reutilizada');
  assert.equal(seen.length,2,prefix+' módulo carregou repetidamente');
}
function testeSemLoopDeNavegacao(){
  const preview=read('obrix-preview-inicio-equipe-20261104.js');
  const start=preview.indexOf("  let inicioAnterior=secaoVisivel('inicio')");
  const end=preview.indexOf("  ['obrix:offline-base-atualizada'",start);
  assert.ok(start>=0&&end>start,'proteção contra render de navegação não encontrada');
  const listeners=[];let inicio=true,equipe=false,count=0;
  class MutationObserver{
    constructor(callback){this.callback=callback;listeners.push(this)}
    observe(){}
  }
  const sandbox={MutationObserver,app:{},ini:{},team:{},secaoVisivel:id=>id==='inicio'?inicio:equipe,atualizar:()=>count++};
  vm.createContext(sandbox);
  vm.runInContext(preview.slice(start,end),sandbox);
  for(let i=0;i<20;i++)listeners.forEach(l=>l.callback([]));
  assert.equal(count,0,'observer agendou renders sem mudança de tela');
  inicio=false;equipe=true;
  listeners.forEach(l=>l.callback([]));
  assert.equal(count,1,'navegação deve atualizar uma única vez');
  listeners.forEach(l=>l.callback([]));
  assert.equal(count,1,'navegação duplicada causou piscada na Equipe');
}
function testeProtecaoVisual(prefix){
  const ui=read(prefix+'obrix-ui-stability.js');
  const equipe=read(prefix+'obrix-equipe-main.js');
  const loader=read(prefix+'obrix-pos-login-loader.js');
  assert.ok(ui.includes('O refresh já atualiza a Equipe Premium'),prefix+' UI faz segundo render legada');
  assert.ok(equipe.includes('if(window.OBRIX_PREVIEW?.refresh)window.OBRIX_PREVIEW.refresh()'),prefix+' Equipe força lista legada');
  assert.ok(loader.includes("window.OBRIX_OBRAS_FIEL?.render?.(),50"),prefix+' Obras remonta cabeçalho durante complemento');
  assert.ok(!loader.includes("if(name==='obras')setTimeout(()=>window.OBRIX_OBRAS_FIEL?.refresh?.(),50)"),prefix+' refresh de Obras legado permaneceu');
  assert.ok(loader.includes('loadStockOperations,status:'),prefix+' API de estoque não exposta');
  const stock=read(prefix+'obrix-estoque-main.js');
  assert.ok(stock.includes('loadStockOperations?.()'),prefix+' clique do estoque ainda espera todos os módulos');
}
(async()=>{
  for(const prefix of ['','obrix-android-inicial/']){
    await testeRotas(prefix);
    await testeEstoque(prefix);
    testeProtecaoVisual(prefix);
    console.log(JSON.stringify({platform:prefix||'root',notesReports:true,stockPrimary:true,teamSinglePaint:true,worksNoHeaderReset:true}));
  }
  testeSemLoopDeNavegacao();
  console.log('OBRIX: rotas funcionais e observadores de Equipe/Obras aprovados');
})().catch(e=>{console.error(e);process.exitCode=1});
