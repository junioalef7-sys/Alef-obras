'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const script=fs.readFileSync(path.resolve(__dirname,'../obrix-documentos-direto.js'),'utf8');
const loader=fs.readFileSync(path.resolve(__dirname,'../obrix-offline-v3.js'),'utf8');

test('o visualizador mantém sintaxe JavaScript válida',()=>{
 assert.doesNotThrow(()=>new vm.Script(script));
});
test('o carregador inclui a nova versão do visualizador',()=>{
 assert.ok(loader.includes('obrix-documentos-direto.js?v=20261116-pdf-integral1'));
});
test('frame usa altura dinâmica e permite ocupar o espaço completo',()=>{
 assert.ok(script.includes('height:min(94dvh,950px)'));
 assert.ok(script.includes('height:100dvh'));
 assert.ok(script.includes('flex:1 1 auto;min-height:0'));
 assert.ok(script.includes('Abrir completo'));
 assert.ok(script.includes("document.getElementById('docViewerFull').onclick=abrirCompleto"));
});
test('visualização móvel prioriza o PDF nativo e conserva opção de janela completa',()=>{
 assert.ok(script.includes("const mobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent||'')"));
 assert.ok(script.includes("const popup=mobile?window.open('about:blank','_blank'):null"));
 assert.ok(script.includes('popup.location.replace(x.url)'));
 assert.ok(script.includes("const win=window.open(link,'_blank')"));
 assert.ok(script.includes('if(!win)window.location.assign(link)'));
});
test('url assinada vem do Storage e a consulta limita-se à empresa autenticada',async()=>{
 const popup={closed:false,document:{title:''},location:{replace(url){this.opened=url}}};
 const document={addEventListener(){}};
 const window={open(){return popup}};
 const id='11111111-1111-4111-8111-111111111111';
 const company='22222222-2222-4222-8222-222222222222';
 const queried=[];
 const sb={
  from(name){assert.equal(name,'documentos');return{
   select(){return this},eq(k,v){queried.push([k,v]);return this},
   maybeSingle:async()=>({data:{id,caminho_arquivo:company+'/obra1/contrato.pdf',
    tipo_arquivo:'application/pdf',nome_arquivo:'contrato.pdf'},error:null})
  }},
  storage:{from(name){assert.equal(name,'obrix-documentos');return{
   createSignedUrl:async()=>({data:{signedUrl:'https://example.invalid/signed?test=1'},error:null})
  }}}
 };
 vm.runInNewContext(script,{window,document,navigator:{userAgent:'iPhone'},OBRIX_BACKEND:{
  init:async()=>sb,profile:async()=>({empresa_id:company})
 },alert:()=>{throw Error('unexpected viewer error')}});
 await window.OBRIX_DOC_VIEWER.abrir(id);
 assert.equal(popup.location.opened,'https://example.invalid/signed?test=1');
 assert.deepEqual(queried,[['id',id],['empresa_id',company]]);
});
