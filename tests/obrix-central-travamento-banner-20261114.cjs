'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
const read=p=>fs.readFileSync(p,'utf8');
(async()=>{
 for(const pre of ['','obrix-android-inicial/']){
  const h=read(pre+'obrix.html'),legacy=read(pre+'obrix-ui-ajustes-20261020.js'),central=read(pre+'obrix-offline-central-lite.js');
  const prep=read(pre+'obrix-offline-preparo.js');
  assert.ok(!legacy.includes('function installCard('),'Instalador legado ainda presente '+pre);
  assert.ok(legacy.includes('function apply(){notas()}'),'Notas alteradas '+pre);
  assert.ok(!prep.includes('observe(document.documentElement,{childList:true,subtree:true})'),'Observador global ainda ativo '+pre);
  const start=h.indexOf('<style id="obrixSemAvisoInstalacaoCompacto20261114">'),end=h.indexOf('</style>',start);
  assert.ok(start>=0&&end>start,'Sem regra anti-cache '+pre);
  const css=h.slice(start,end+8);
  for(const [name,engine,device] of [['Desktop',chromium,{viewport:{width:1280,height:740}}],['Android',chromium,devices['Pixel 7']],['iPhone',webkit,devices['iPhone 13']]]){
   const browser=await engine.launch();
   try{
    const page=await browser.newPage(device);
    const html='<!doctype html><html data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1">'+css+'</head><body><div id="app"><main id="inicio"></main><main id="notasMain"><button class="notaPdf">Antigo</button></main><div class="bottom"></div></div></body></html>';
    await page.route('https://obrix-load-test.invalid/**',r=>r.fulfill({status:200,contentType:'text/html',body:html}));
    await page.goto('https://obrix-load-test.invalid/main');
    await page.addScriptTag({content:legacy});
    assert.equal(await page.locator('#obrixInstallCompact').count(),0,'Cartão criado '+name+pre);
    await page.evaluate(()=>{const n=document.createElement('div');n.id='obrixInstallCompact';n.textContent='Instalar OBRIX';document.body.appendChild(n)});
    for(const mode of ['light','dark']){
     await page.evaluate(mode=>document.documentElement.dataset.theme=mode,mode);
     assert.equal(await page.locator('#obrixInstallCompact').evaluate(el=>getComputedStyle(el).display),'none','Aviso legado não oculto '+name+mode);
    }
    await page.evaluate(()=>{window.__calls=0;for(const key of ['OBRIX_OFFLINE_OBRAS','OBRIX_OFFLINE_EQUIPE','OBRIX_OFFLINE_ESTOQUE','OBRIX_OFFLINE_DIARIO','OBRIX_OFFLINE_NOTAS','OBRIX_OFFLINE_CHECKLIST'])window[key]={status:()=>{window.__calls++;return {pendentes:0,conflitos:0,syncing:false}}}});
    await page.addScriptTag({content:central});
    await page.evaluate(()=>window.OBRIX_OFFLINE_CENTRAL.open());
    assert.ok(await page.locator('#offlineCentralLista .offlineCentralCard').count()>0,'Central não abriu '+name);
    await page.evaluate(()=>{window.__first=document.querySelector('#offlineCentralLista .offlineCentralCard');window.__before=window.__calls;for(let i=0;i<120;i++)window.dispatchEvent(new Event('obrix:obras-sincronizadas'))});
    await page.waitForTimeout(400);
    const state=await page.evaluate(()=>({delta:window.__calls-window.__before,identity:window.__first===document.querySelector('#offlineCentralLista .offlineCentralCard')}));
    assert.ok(state.delta<=12,'Renderizações em cascata '+name+JSON.stringify(state));
    assert.ok(state.identity,'Remontagem desnecessária '+name);
    await page.evaluate(()=>{document.querySelector('#offlineCentralMain').classList.add('hidden');window.__hiddenBefore=window.__calls;for(let i=0;i<120;i++)window.dispatchEvent(new Event('obrix:obras-sincronizadas'))});
    await page.waitForTimeout(400);
    const after=await page.evaluate(()=>window.__calls-window.__hiddenBefore);
    assert.equal(after,0,'Central oculta continua atualizando '+name);
    console.log(JSON.stringify({variant:pre||'root',device:name,banner:false,renderCoalesced:true,hiddenIdle:true}));
   }finally{await browser.close()}
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1});