'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit,devices}=require('playwright');
const read=p=>fs.readFileSync(p,'utf8');
const devicesToTest=[
 ['Computador',chromium,{viewport:{width:1150,height:740}}],
 ['Android',chromium,devices['Pixel 7']],
 ['iPhone',webkit,devices['iPhone 13']]
];
function home(){
 return '<div id="obpHome">'+
  '<div class="obp-greeting"><h1>Olá</h1></div>'+
  '<div class="obp-shortcuts">'+
  '<button data-short="diario">Diário</button><button data-short="notas">Notas</button>'+
  '<button data-short="relatorios">Relatórios</button><button data-short="foto">Foto</button></div>'+
  '<div class="obp-heading"><h2>Obras</h2><button>Ver todas</button></div>'+
  '<div id="obpObras"><div class="obp-work">Escola Rio do peixe</div><div class="obp-work">Construção do refeitório</div></div>'+
  '<div class="obp-heading"><h2>Últimas atualizações</h2></div><div id="obpAtividades"></div></div>';
}
(async()=>{
 for(const prefix of ['','obrix-android-inicial/']){
  const moduleSource=read(prefix+'obrix-equipe-folha-install.js');
  assert.ok(moduleSource.includes("inicio.querySelector('#obpHome .obp-shortcuts')"),'Código não posiciona após os atalhos');
  assert.ok(moduleSource.includes('observarInicioInstalacao'),'Recriação da Home não observada');
  assert.ok(moduleSource.includes('<details class="obrix-instrucoes-install">'),'Instruções não compactadas');
  for(const [device,engine,profile] of devicesToTest){
    const browser=await engine.launch();
    try{
      const page=await browser.newPage(profile);
      const fixture='<!doctype html><html data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+
        '*{box-sizing:border-box}.hidden{display:none!important}html,body{margin:0;font:16px system-ui;color:#1b293b;background:#f5f7fa}'+
        '#app{max-width:1000px;margin:auto}#inicio{padding:10px}#obpHome{max-width:900px;margin:auto;padding:10px}'+
        '.obp-greeting{padding:15px 0 20px}.obp-shortcuts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;max-width:480px}'+
        '.obp-shortcuts button{height:105px;border:1px solid #eee;border-radius:12px;background:#fff}'+
        '.obp-heading{margin:18px 0 10px;display:flex;justify-content:space-between}'+
        '.obp-work{background:#fff;margin:10px 0;padding:18px;border-radius:12px}'+
        '#obrixInstalarApp{padding:16px;background:#fff;border:1px solid #cbd5e1;border-radius:13px}'+
        '.bottom{height:72px;position:fixed;inset:auto 0 0;background:#fff;border-top:1px solid #ddd;z-index:99999}'+
        '</style></head><body><div id="app"><main id="inicio">'+home()+'</main><main id="equipe" class="hidden"></main><div class="bottom">Início · Obras · Financeiro · Equipe</div></div></body></html>';
      await page.route('https://obrix-home-layout.invalid/**',route=>route.fulfill({status:200,contentType:'text/html',body:fixture}));
      await page.goto('https://obrix-home-layout.invalid/test');
      await page.evaluate(()=>{window.__originalHome=document.getElementById('inicio').innerHTML});
      await page.addScriptTag({content:moduleSource});
      await page.locator('#obrixInstalarApp').waitFor({timeout:6500});
      const info=await page.evaluate(()=>{
       const c=document.getElementById('obrixInstalarApp'),r=c.getBoundingClientRect(),f=document.querySelector('.bottom').getBoundingClientRect();
       return{parent:c.parentElement.id,previous:c.previousElementSibling?.className,next:c.nextElementSibling?.className,top:r.top,bottom:r.bottom,footer:f.top,details:c.querySelector('details')?.open,count:document.querySelectorAll('#obrixInstalarApp').length};
      });
      assert.equal(info.parent,'obpHome',device+' não está na Início Premium');
      assert.equal(info.previous,'obp-shortcuts',device+' não está abaixo dos atalhos');
      assert.equal(info.next,'obp-heading',device+' não está antes das obras');
      assert.equal(info.details,false,device+' não exibiu cartão compacto');
      assert.ok(info.bottom<=info.footer-6,device+' cartão continua sob rodapé: '+JSON.stringify(info));
      await page.evaluate(()=>{document.getElementById('inicio').innerHTML=window.__originalHome});
      await page.locator('#obrixInstalarApp').waitFor({timeout:2500});
      assert.equal(await page.locator('#obrixInstalarApp').count(),1,device+' cartão não retornou após render da Home');
      assert.equal(await page.locator('#obrixInstalarApp').evaluate(el=>el.previousElementSibling?.className),'obp-shortcuts',device+' cartão voltou para o rodapé');
      await page.locator('.obrix-instalar-fechar').click();
      assert.equal(await page.locator('#obrixInstalarApp').count(),0,'Fechar do cartão travado: '+device);
      await page.evaluate(()=>{document.getElementById('inicio').innerHTML=window.__originalHome});
      await page.waitForTimeout(90);
      assert.equal(await page.locator('#obrixInstalarApp').count(),0,device+' cartão reapareceu após fechar');
      console.log(JSON.stringify({variant:prefix||'root',device,cardBetweenShortcutsAndWorks:true,aboveFooter:true,staysClosed:true}));
    }finally{await browser.close()}
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1});