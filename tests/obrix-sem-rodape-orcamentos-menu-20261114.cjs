'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium,webkit,devices}=require('playwright');
const read=p=>fs.readFileSync(p,'utf8');
(async()=>{
for(const pre of ['','obrix-android-inicial/']){
 const html=read(pre+'obrix.html'),mark='<style id="obrixSemBarraInferior20261114">';
 const start=html.indexOf(mark),end=html.indexOf('</style>',start);
 assert.ok(start>=0&&end>start,'Ocultação de barra ausente '+pre);
 const css=html.slice(start+mark.length,end),menu=read(pre+'obrix-menu-main.js'),budgets=read(pre+'obrix-orcamentos-main.js'),watch=read(pre+'obrix-orcamentos-itens-topo.js');
 assert.ok(menu.includes("['dashboard','⌂','Início']"),'Menu ainda diz Dashboard '+pre);
 assert.ok(menu.includes("if(k==='dashboard')return window.abrir?.('inicio')"),'Rota Início alterada '+pre);
 assert.ok(budgets.includes('if(box.__obrixMarkup===html'),'Lista de Orçamentos ainda reconstruída '+pre);
 assert.ok(!watch.includes("attributeFilter:['class']"),'Observer global de classes ainda ativo '+pre);
 assert.ok(!watch.includes('setInterval(()=>{if(!salvando)'), 'Atualização periódica agressiva '+pre);
 for(const [name,engine,profile] of [['computador',chromium,{viewport:{width:1280,height:760}}],['Android',chromium,devices['Pixel 7']],['iPhone',webkit,devices['iPhone 13']]]){
  const browser=await engine.launch();
  try{
   const page=await browser.newPage(profile);
   const fixture='<!doctype html><html data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>.hidden{display:none!important}body{margin:0;background:#f1f5f9}#app>.top{height:52px;display:flex}#app>.bottom{display:grid;position:fixed;bottom:0;left:0;right:0;height:72px;background:#fff}</style><style>'+css+'</style></head><body><section id="app"><div class="top"><button id="bMenu">Menu</button></div><main id="orcamentosMain"><span id="orcKTotal"></span><span id="orcKAprov"></span><span id="orcKValor"></span><div id="orcLista"></div><div id="orcItens"></div></main><main id="menuMain" class="hidden">Início · Obras · Financeiro · Equipe</main><div class="bottom"><button>Início</button><button>Obras</button><button>Financeiro</button><button>Equipe</button></div></section></body></html>';
   await page.setContent(fixture);
   await page.locator('#bMenu').evaluate(b=>b.onclick=()=>document.getElementById('menuMain').classList.remove('hidden'));
   for(const theme of ['light','dark']){
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme},theme);
    assert.equal(await page.locator('#app>.bottom').evaluate(el=>getComputedStyle(el).display),'none','Barra inferior visível em '+pre+name+theme);
    assert.ok(await page.locator('#bMenu').isVisible(),'Menu superior inacessível '+pre+name+theme);
    await page.locator('#bMenu').click();
    assert.ok(await page.locator('#menuMain').isVisible(),'Menu não abre '+pre+name+theme);
   }
   const fragment=budgets.slice(budgets.indexOf('function render(){'),budgets.indexOf('function itemTemplate'));
   assert.ok(fragment.startsWith('function render(){'),'Função render não localizada');
   const harness="let orcamentos=[{id:'a1',numero:1,status:'aprovado',cliente_nome:'Cliente',titulo:'Original',valor_total:1200,materiais:'sim'}];const $=id=>document.getElementById(id);const num=Number;const money=x=>'R$ '+x;const esc=String;const fmtDate=x=>x||'';const materialLabel=x=>x;const statusLabel=x=>x;const rowsFor=()=>[];const edit=()=>{};const printSaved=()=>{};const removeO=()=>{};"+fragment+";window.__teste={render,orcamentos};";
   await page.addScriptTag({content:harness});
   await page.evaluate(()=>{window.__teste.render();window.__card=document.querySelector('.orcCard');window.__card.querySelector('.orcCardBody').classList.remove('hidden')});
   await page.evaluate(()=>window.__teste.render());
   assert.ok(await page.evaluate(()=>window.__card===document.querySelector('.orcCard')),'Cartão piscou sem alteração '+pre+name);
   await page.evaluate(()=>{window.__teste.orcamentos[0].titulo='Novo título';window.__teste.render()});
   assert.equal(await page.locator('.orcResumo b').first().textContent(),'Novo título','Novo dado não renderizado '+pre+name);
   assert.ok(await page.locator('.orcCardBody').evaluate(el=>!el.classList.contains('hidden')),'Cartão expandido fechado após atualização '+pre+name);
   console.log(JSON.stringify({variant:pre||'root',device:name,theme:'light and dark',footerRemoved:true,menu:true,budgetStable:true}));
  }finally{await browser.close()}
 }
}
})().catch(e=>{console.error(e);process.exitCode=1});