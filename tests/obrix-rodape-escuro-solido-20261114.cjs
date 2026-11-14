'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium,webkit,devices}=require('playwright');
function css(path){
 const html=fs.readFileSync(path,'utf8');
 const start=html.indexOf('<style id="obrixRodapeDesktopSemCartaoFix20261109">');
 const end=html.indexOf('</style>',start);
 assert.ok(start>=0&&end>start,'Estilo do rodapé ausente '+path);
 const src=html.slice(start,end);
 assert.ok(src.includes('html[data-theme="dark"] body #app>.bottom'),'Correção do tema escuro ausente '+path);
 return src.slice(src.indexOf('>')+1);
}
(async()=>{
 for(const path of ['obrix.html','obrix-android-inicial/obrix.html']){
  const style=css(path);
  for(const [device,engine,profile] of [
   ['desktop',chromium,{viewport:{width:1260,height:760}}],
   ['Android',chromium,devices['Pixel 7']],['iPhone',webkit,devices['iPhone 13']]
  ]){
   const browser=await engine.launch();
   try{
    const page=await browser.newPage(profile);
    const fixture='<!doctype html><html data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#07111b}.bottom{position:fixed;inset:auto 0 0 0;background:#142536;display:grid;grid-template-columns:repeat(4,1fr);padding:7px;z-index:99999}.bottom button{min-height:45px}</style><style>'+style+'</style></head><body><section id="app"><main style="height:1400px"></main><div class="bottom"><button>Início</button><button>Obras</button><button>Financeiro</button><button>Equipe</button></div></section></body></html>';
    await page.setContent(fixture);
    const get=()=>page.evaluate(()=>{const n=document.querySelector('#app>.bottom');const cs=getComputedStyle(n);return{bg:cs.backgroundColor,border:cs.borderTopColor,pos:cs.position,bottom:n.getBoundingClientRect().bottom,viewport:innerHeight}});
    const light=await get();
    await page.evaluate(()=>{document.documentElement.dataset.theme='dark'});
    const dark=await get();
    if(device==='desktop'){
     assert.equal(light.bg,'rgba(0, 0, 0, 0)','Modo claro mudou '+path);
     assert.equal(dark.bg,'rgb(13, 23, 34)','Rodapé transparente no escuro '+path);
     assert.equal(dark.border,'rgb(41, 59, 77)','Borda escura incorreta '+path);
    }else{
     assert.equal(light.bg,'rgb(20, 37, 54)','Celular claro mudou '+path+device);
     assert.equal(dark.bg,'rgb(20, 37, 54)','Celular escuro mudou '+path+device);
    }
    assert.equal(dark.pos,'fixed','Rodapé perdeu posição fixa');
    assert.ok(Math.abs(dark.bottom-dark.viewport)<1.1,'Rodapé deslocado '+path+device);
    console.log(JSON.stringify({path,device,light:light.bg,dark:dark.bg,result:'PASS'}));
   }finally{await browser.close()}
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1});