'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
const read=p=>fs.readFileSync(p,'utf8');
const platforms=[
 ['Computador Chrome',chromium,{viewport:{width:1366,height:768}}],
 ['Android Chrome',chromium,devices['Pixel 7']],
 ['iPhone Safari',webkit,devices['iPhone 13']]
];
(async()=>{
 const notices=read('obrix-alertas-global.js');
 const success=read('obrix-confirmacao-sucesso.js');
 assert.match(notices,/window\.alert=function\(mensagem\)/);
 assert.ok(!notices.includes('window.confirm='),'Confirmar ou cancelar ações não pode ser automatizado');
 for(const prefix of ['','obrix-android-inicial/']){
  const html=read(prefix+'obrix.html');
  assert.ok(html.includes((prefix?'../':'./')+'obrix-alertas-global.js?v=20261114-alertas-visual1'),'Avisos sem versão nova em '+prefix);
  assert.ok(html.includes('obrix-onboarding.js?v=20261114-instalacao-desbloqueada2'),'Instalação antiga em '+prefix);
  for(const [device,engine,profile] of platforms){
   const browser=await engine.launch();
   try{
    const page=await browser.newPage(profile);
    let native=0;page.on('dialog',async d=>{native++;await d.dismiss()});
    await page.setContent('<!doctype html><html lang="pt-BR" data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>.hidden{display:none!important}</style></head><body><div id="login" class="hidden"></div><section id="app"><main id="inicio"></main></section></body></html>');
    await page.evaluate(()=>{
      window.__confirmOriginal=window.confirm;
      window.OBRIX_BACKEND={currentUser:async()=>({id:'conta_teste'})};
    });
    await page.addScriptTag({content:success});
    await page.addScriptTag({content:notices});
    const confirmationPreserved=await page.evaluate(()=>window.confirm===window.__confirmOriginal);
    assert.ok(confirmationPreserved,'Confirmação destrutiva não pode ser alterada');
    await page.evaluate(()=>alert('Diária registrada'));
    assert.equal(await page.locator('.obrixSuccessNotice').count(),1,'Diária precisa do padrão OBRIX em '+prefix+device);
    await page.evaluate(()=>alert('Não foi possível salvar o documento.'));
    assert.equal(await page.locator('#obrixAvisoGlobal[data-tipo="erro"]').count(),1,'Erro precisa da mensagem OBRIX em '+prefix+device);
    await page.locator('.obrixAvisoGlobalClose').click();
    assert.equal(await page.locator('#obrixAvisoGlobal').count(),0,'Fechar aviso ficou travado');
    await page.addScriptTag({content:read(prefix+'obrix-confirmar-acoes.js')});
    await page.addScriptTag({content:read(prefix+'obrix-onboarding.js')});
    const root=prefix==='';
    await page.evaluate(root=>window.OBRIX_ONBOARDING.open(true,root),root);
    await page.locator('#obxOnboardNext').waitFor();
    if(root){
      assert.equal(await page.locator('#obxInstallAction').count(),1,'Faltou opção do guia '+device);
      await page.locator('#obxInstallAction').click();
      await page.locator('#obrixAvisoTitulo').waitFor();
      const instr=await page.locator('#obrixAvisoTitulo').textContent();
      assert.ok(/Como instalar o OBRIX/i.test(instr),'Botão de instruções não abriu');
      await page.locator('#obrixAvisoTitulo').locator('..').locator('button').click();
      await page.locator('#obxOnboardNext').click();
    }else{
      await page.locator('#obxOnboardSkip').click();
    }
    assert.ok(await page.locator('#obrixOnboarding').evaluate(e=>e.classList.contains('hidden')),'Apresentação não fechou: '+prefix+device);
    assert.equal(await page.locator('#obrixOnboarding').evaluate(e=>getComputedStyle(e).display),'none','Card ainda visível após fechar: '+prefix+device);
    assert.equal(native,0,'O navegador ainda mostra mensagem nativa em '+prefix+device);
    console.log(JSON.stringify({variant:prefix||'root',device,nativeDialogs:0,alertsInObrix:true,installationCloses:true}));
    await page.close();
   }finally{await browser.close()}
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1});