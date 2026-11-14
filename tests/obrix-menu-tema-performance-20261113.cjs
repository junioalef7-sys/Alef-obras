'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit,devices}=require('playwright');
const prefixes=['','obrix-android-inicial/'];
const profiles=[
 ['iPhone WebKit',webkit,devices['iPhone 13']],
 ['Android Chromium',chromium,devices['Pixel 7']],
 ['Desktop Chromium',chromium,{viewport:{width:1366,height:768}}]
];
const read=p=>fs.readFileSync(p,'utf8');
const origin='https://obrix-nav-theme.invalid/';
function fixture(prefix){
 const live=read(prefix+'obrix.html');
 const start=live.indexOf('<div class="top">');
 const end=live.indexOf('</div><main id="inicio">',start);
 assert.ok(start>=0&&end>start,'Cabeçalho da versão '+prefix);
 const header=live.slice(start,end+6);
 const style=live.match(/<style id="obrixNavHeaderTeste20261113">([\s\S]*?)<\/style>/);
 assert.ok(style,'Estilo do menu superior '+prefix);
 return '<!doctype html><html data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"/><style>'+
   style[1]+'</style></head><body><div id="login" class="hidden"></div><section id="app">'+header+
   '<main id="inicio" class="hidden"></main><main id="obras"><div class="hero"><h1>Obras</h1></div>'+
   '<div class="sectionHead"><strong>Obras</strong></div><div id="listaObras"></div></main>'+
   '<div class="bottom"><button id="bInicio">Início</button><button id="bObras">Obras</button>'+
   '<button id="bFinanceiro">Financeiro</button><button id="bEquipe">Equipe</button></div></section></body></html>';
}
function channel(v){
 const m=String(v).match(/[\d.]+/g)||[];
 return m.slice(0,3).map(Number);
}
function verifySurfaces(result,theme,place){
 for(const [name,color] of Object.entries(result.surfaces)){
  const rgb=channel(color);
  assert.equal(rgb.length,3,place+' superfície sem RGB: '+name+' '+color);
  if(theme==='dark')assert.ok(rgb.every(n=>n<100),place+' superfície clara no modo escuro: '+name+' '+color);
  else assert.ok(rgb.every(n=>n>190),place+' superfície escura no modo claro: '+name+' '+color);
 }
 assert.equal(result.statusColor,'rgb(255, 255, 255)',place+' status Em andamento perdeu contraste');
}
(async()=>{
 for(const prefix of prefixes){
  for(const [name,engine,device] of profiles){
   const browser=await engine.launch();
   try{
    const page=await browser.newPage(device);
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route(origin+'**',route=>route.fulfill({status:200,contentType:'text/html',body:fixture(prefix)}));
    await page.goto(origin+'fixture');
    await page.evaluate(()=>{
      localStorage.setItem('obrix_theme','light');
      window.obras=[{id:'a',nome:'Obra de teste',cliente:'Cliente de teste',status:'andamento',progresso:45,valor_contrato:25000}];
      window.financeiro=[];window.extras=[];
      window.__menuClicks=0;
      window.OBRIX_MENU={open(){window.__menuClicks++}};
    });
    await page.addScriptTag({content:read(prefix+'obrix-theme-main.js')});
    await page.addScriptTag({content:read(prefix+'obrix-obras-fiel.js')});
    await page.evaluate(()=>{
      const a=document.createElement('button');a.type='button';a.className='obxAcao';
      a.innerHTML='<span><b>Checklist</b><small>Etapas</small></span>';
      document.getElementById('obras').appendChild(a);
    });
    const header=await page.evaluate(()=>{
      const menu=document.getElementById('bMenu'),brand=document.querySelector('#app>.top .brand');
      const mr=menu.getBoundingClientRect(),br=brand.getBoundingClientRect();
      return {first:document.querySelector('#app>.top').firstElementChild?.id,
        beforeLogo:mr.right<=br.left+1,visible:getComputedStyle(menu).display!=='none'};
    });
    assert.deepEqual(header,{first:'bMenu',beforeLogo:true,visible:true},prefix+name+' menu não está antes da logo');
    await page.locator('#bMenu').click();
    assert.equal(await page.evaluate(()=>window.__menuClicks),1,prefix+name+' Menu não abriu');
    const before=await page.evaluate(()=>{
      window.__originalCard=document.querySelector('#listaObras .obxObraCard');
      return !!window.__originalCard;
    });
    assert.ok(before,prefix+name+' obra não renderizou');
    for(const theme of ['light','dark','light']){
      const outcome=await page.evaluate(theme=>{
        window.OBRIX_THEME.apply(theme);
        for(let i=0;i<20;i++)window.OBRIX_OBRAS_FIEL.render();
        const get=sel=>getComputedStyle(document.querySelector(sel));
        return {
          surfaces:{
            card:get('#obras .obxObraCard').backgroundColor,
            busca:get('#obras .obxBusca').backgroundColor,
            acao:get('#obras .obxAcao').backgroundColor
          },
          statusColor:get('#obras .obxStatus.andamento').color,
          sameCard:document.querySelector('#listaObras .obxObraCard')===window.__originalCard,
          theme:document.documentElement.dataset.theme
        };
      },theme);
      assert.equal(outcome.theme,theme,prefix+name+' tema não permaneceu aplicado');
      assert.ok(outcome.sameCard,prefix+name+' cartão de Obras remontado sem alteração');
      verifySurfaces(outcome,theme,prefix+name);
    }
    assert.deepEqual(errors,[],prefix+name+' erros JavaScript');
    console.log(JSON.stringify({variant:prefix||'root',profile:name,menuBeforeLogo:true,menuClickable:true,themeLightDarkLight:true,stableCards:true,pass:true}));
    await page.close();
   }finally{await browser.close()}
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1});
