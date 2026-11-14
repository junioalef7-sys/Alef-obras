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
  assert.ok(html.includes('obrix-confirmar-acoes.js?v=20261114-modal-texto-obrix1'),'Diálogo padrão antigo '+prefix);
  assert.ok(read(prefix+'obrix-confirmar-acoes.js').includes('OBRIX_PEDIR_TEXTO'),'Input próprio inexistente '+prefix);
  const audited=['obrix-obras-fiel.js','obrix-estoque-estorno-final.js','obrix-equipe-historico-pagamentos.js','obrix-estoque-main.js','obrix-checklist-v2.js','obrix-notas-offline.js','obrix-offline-central-lite.js','obrix-backup-import-run.js','obrix-backup-completo.js','obrix-config-main.js'];
  for(const f of audited){
    const js=read(prefix+f);
    assert.ok(!/(?<![\w.])(confirm|prompt)\s*\(/.test(js),'Ainda há confirmação/prompt nativo em '+prefix+f);
  }
  assert.ok(read('obrix-install-card-home.js').includes('obrix-instalar-fechar'),'Cartão sem botão de fechar '+prefix);
  assert.ok(read('obrix-install-card-home.js').includes('obrix_instalar_card_dispensado_sessao_v2'),'Cartão de instalação pode reaparecer após dispensar '+prefix);
  for(const [device,engine,profile] of platforms){
   const browser=await engine.launch();
   try{
    const page=await browser.newPage(profile);
    let native=0;page.on('dialog',async d=>{native++;await d.dismiss()});
    const fixture='<!doctype html><html lang="pt-BR" data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>.hidden{display:none!important}</style></head><body><div id="login" class="hidden"></div><section id="app"><main id="inicio"><div id="obpHome"><div class="obp-shortcuts"><button>Diário</button><button>Notas</button><button>Relatórios</button><button>Foto</button></div><div class="obp-heading">Obras</div></div></main></section></body></html>';
    // Abertura em origem HTTPS realista: about:blank não possui storage utilizável,
    // e a apresentação não consegue registrar o fechamento por usuário nesse caso.
    await page.route('https://obrix-instalacao.invalid/**',route=>route.fulfill({status:200,contentType:'text/html',body:fixture}));
    await page.goto('https://obrix-instalacao.invalid/fixture');
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
    // O segundo cartão de instalação, dentro do Início, precisa abrir ajuda e fechar.
    await page.evaluate(()=>window.OBRIX_ONBOARDING.close(true));
    await page.addScriptTag({content:read('obrix-install-card-home.js')});
    await page.locator('#obrixInstalarApp').waitFor({timeout:5000});
    await page.locator('#obrixInstalarApp .obrix-instalar-btn').click();
    assert.ok(await page.locator('#obrixInstalarApp details').evaluate(el=>el.open),'Botão Instalar sem orientação '+device);
    await page.locator('#obrixInstalarApp .obrix-instalar-fechar').click();
    assert.equal(await page.locator('#obrixInstalarApp').count(),0,'Instalação permaneceu após fechar '+prefix+device);
    await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
    await page.waitForTimeout(360);
    assert.equal(await page.locator('#obrixInstalarApp').count(),0,'Cartão recriado depois de fechar '+prefix+device);
    assert.equal(native,0,'O navegador ainda mostra mensagem nativa em '+prefix+device);
    console.log(JSON.stringify({variant:prefix||'root',device,nativeDialogs:0,alertsInObrix:true,installationCloses:true}));
    await page.close();
   }finally{await browser.close()}
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1});