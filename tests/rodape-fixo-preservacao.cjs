const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium, webkit, devices } = require('playwright');

const paths = ['obrix.html', 'obrix-android-inicial/obrix.html'];
function footerRule(source) {
  const match=source.match(/html body #app > \.bottom:not\(#obrixOfflineV3Bottom\)\{[^}]+\}/g)||[];
  assert.equal(match.length,1,'exactly one fixed footer rule');
  assert.match(match[0],/position:fixed!important/);
  assert.match(match[0],/inset:auto 0 0 0!important/);
  return match[0];
}

async function check(engine, options, deviceName, path) {
  const browser=await engine.launch();
  try {
    const page=await browser.newPage(options||{viewport:{width:1366,height:768}});
    const original=['Início','Financeiro','Equipe','Menu'];
    const source=fs.readFileSync(path,'utf8'),rule=footerRule(source);
    const fixture='<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
      +'<style>body{margin:0}#app{min-height:2400px}main{height:1800px;padding:20px;}'
      +'.bottom{margin-top:16px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}'
      +'.bottom button{min-height:48px;}'+rule+'</style></head><body>'
      +'<section id="app"><main id="obras"><h1>Obras</h1><p>Conteúdo para rolar</p></main>'
      +'<div class="bottom"><button>Início</button><button>Financeiro</button><button>Equipe</button><button>Menu</button></div></section>'
      +'</body></html>';
    await page.setContent(fixture);
    const initial=await page.evaluate(()=>{
      const nav=document.querySelector('#app>.bottom'),rect=nav.getBoundingClientRect();
      return {top:rect.top,bottom:rect.bottom,viewport:innerHeight,position:getComputedStyle(nav).position,
        labels:[...nav.querySelectorAll('button')].map(x=>x.textContent),height:rect.height};
    });
    assert.equal(initial.position,'fixed');
    assert.deepEqual(initial.labels,original,'navigation labels preserved');
    assert.ok(Math.abs(initial.viewport-initial.bottom)<1.1,'navigation must touch viewport bottom');
    await page.evaluate(()=>scrollTo(0,Math.round(document.body.scrollHeight*0.6)));
    await page.waitForTimeout(100);
    const after=await page.evaluate(()=>{
      const nav=document.querySelector('#app>.bottom'),r=nav.getBoundingClientRect();
      return {top:r.top,bottom:r.bottom,viewport:innerHeight,scrollY,labels:[...nav.querySelectorAll('button')].map(x=>x.textContent)};
    });
    assert.ok(after.scrollY>100,'page scrolled');
    assert.ok(Math.abs(after.bottom-initial.bottom)<1.1,'footer moved while scrolling');
    assert.ok(Math.abs(after.top-initial.top)<1.1,'footer top moved while scrolling');
    assert.deepEqual(after.labels,original,'visual labels changed');
    await page.locator('#app>.bottom button').nth(1).click();
    assert.equal(await page.locator('#app>.bottom button').count(),4,'navigation must remain interactive');
    console.log(JSON.stringify({device:deviceName,file:path,position:'fixed',scrolled:Math.round(after.scrollY),bottomDelta:Math.round((after.bottom-initial.bottom)*100)/100,buttons:4,passed:true}));
  } finally {await browser.close();}
}
(async()=>{
  for(const path of paths){
    await Promise.all([
      check(webkit,devices['iPhone 13'],'iPhone-WebKit',path),
      check(chromium,devices['Pixel 7'],'Android-Chromium',path),
      check(chromium,null,'Desktop-Chromium',path)
    ]);
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
