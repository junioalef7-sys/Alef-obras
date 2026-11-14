'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
const read=p=>fs.readFileSync(p,'utf8');
assert.equal(read('obrix-install-card-home.js'),read('obrix-android-inicial/obrix-install-card-home.js'),'Instalador divergente entre plataformas');
const loader=read('obrix-pos-login-loader.js'),team=read('obrix-equipe-folha-install.js'),installer=read('obrix-install-card-home.js');
assert.ok(!loader.split('const BASE=')[1].split('const BASE_OFFLINE=')[0].includes('obrix-equipe-folha-install.js'));
assert.ok(!team.includes('obrixInstalarApp'),'Instalação ainda acoplada à Equipe');
for(const prefix of ['','obrix-android-inicial/'])assert.ok(read(prefix+'obrix.html').includes('obrix-install-card-home.js?v=20261114-home-independent1'));
const home='<div id="obpHome"><div class="obp-greeting">Olá</div><div class="obp-shortcuts"><button>Diário</button><button>Notas</button><button>Relatórios</button><button>Foto</button></div><div class="obp-heading">Obras</div><div id="obpObras"><div style="height:100px">Escola Rio do Peixe</div></div></div>';
(async()=>{
for(const [label,type,profile] of [['computador',chromium,{viewport:{width:1200,height:740}}],['Android',chromium,devices['Pixel 7']],['iPhone',webkit,devices['iPhone 13']]]){
const browser=await type.launch();
try{
 const page=await browser.newPage(profile);
 const html='<!doctype html><html data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>.hidden{display:none!important}html,body{margin:0;font:16px system-ui}.obp-shortcuts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.obp-shortcuts button{min-height:95px}.bottom{position:fixed;bottom:0;left:0;right:0;height:75px;z-index:99999;background:#fff}#inicio{padding:14px}</style></head><body><div id="app" class="hidden"><main id="inicio"></main><main id="equipe" class="hidden"></main><div class="bottom">Início · Obras · Financeiro · Equipe</div></div></body></html>';
 await page.route('https://obrix-standalone-test.invalid/**',route=>route.fulfill({status:200,contentType:'text/html',body:html}));
 await page.goto('https://obrix-standalone-test.invalid/home');
 await page.addScriptTag({content:installer});
 assert.equal(await page.locator('#obrixInstalarApp').count(),0,'Não deve abrir antes do login '+label);
 await page.evaluate(home=>{document.querySelector('#inicio').innerHTML=home;document.querySelector('#app').classList.remove('hidden')},home);
 await page.locator('#obrixInstalarApp').waitFor({timeout:3500});
 const info=await page.evaluate(()=>{const card=document.querySelector('#obrixInstalarApp'),rect=card.getBoundingClientRect();return{parent:card.parentElement.id,previous:card.previousElementSibling.className,bottom:rect.bottom,footer:document.querySelector('.bottom').getBoundingClientRect().top,equipe:!!window.__OBRIX_EQUIPE_FOLHA_INSTALL}});
 assert.equal(info.parent,'obpHome');assert.equal(info.previous,'obp-shortcuts');
 assert.ok(info.bottom<info.footer-5,'Oculto no rodapé '+label+JSON.stringify(info));
 assert.ok(!info.equipe,'Equipe carregada apenas para exibir instalação '+label);
 await page.evaluate(home=>document.querySelector('#inicio').innerHTML=home,home);
 await page.locator('#obrixInstalarApp').waitFor({timeout:2000});
 await page.locator('.obrix-instalar-btn').click();
 assert.ok(await page.locator('details.obrix-instrucoes-install').evaluate(el=>el.open),'Instalar sem resposta '+label);
 await page.locator('.obrix-instalar-fechar').click();
 await page.waitForTimeout(90);
 assert.equal(await page.locator('#obrixInstalarApp').count(),0,'Fechar falhou '+label);
 console.log(JSON.stringify({device:label,loginLazy:true,installWithoutTeam:true,aboveFooter:true,closed:true}));
}finally{await browser.close()}
}
})().catch(e=>{console.error(e);process.exitCode=1});