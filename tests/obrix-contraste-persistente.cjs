const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit,devices}=require('playwright');
const scenarios=[['iPhone WebKit',webkit,devices['iPhone 13']],['Android Chromium',chromium,devices['Pixel 7']],['Desktop Chromium',chromium,{viewport:{width:1366,height:768}}]];
const variants=['.','obrix-android-inicial'];
const origin='https://obrix-contrast-test.invalid/';
const source=(dir,p)=>fs.readFileSync(dir+'/'+p,'utf8');
const html='<!doctype html><html data-theme="light"><head></head><body><div id="app"><div class="top"><span>OBRIX</span></div><main id="inicio" class="hidden"></main><main id="obras"><div class="hero"><h1>Obras</h1></div><div class="sectionHead"><strong>Lista de Obras</strong></div><div class="obxFiltros"><button type="button" class="ativo" data-filtro="andamento">Em andamento</button></div><div id="listaObras"><div class="obxCards"><article class="obxObraCard"><span class="obxStatus andamento">Em andamento</span><span class="obxStatus em_andamento">Em andamento</span></article></div></div></main><main id="equipe" class="hidden"></main><main id="menuMain" class="hidden"></main><div class="bottom"><button>Início</button><button>Financeiro</button><button>Equipe</button><button>Menu</button></div></div></body></html>';
async function run(browserType,deviceName,device,variant,theme){
 const browser=await browserType.launch();
 try{
  const page=await browser.newPage(device);
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.route(origin+'**',route=>route.fulfill({status:200,contentType:'text/html',body:html}));
  await page.goto(origin+'obrix.html');
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;window.scrollTo=()=>{};window.OBRIX_MENU={open(){}};},theme);
  const h=source(variant,'obrix.html');
  const css=h.match(/<style id="obrixObrasHistoricoEstabilidade20261112">([\s\S]*?)<\/style>/);
  if(!css)throw Error('Original Obras CSS missing');
  await page.addStyleTag({content:css[1]});
  await page.addScriptTag({content:source(variant,'obrix-visual-padrao-final.js')});
  // Legacy V4 writes an important green value on the real status in earlier versions.
  await page.addScriptTag({content:source(variant,'obrix-light-ui-requested-v4.js')});
  await page.evaluate(()=>window.OBRIX_LIGHT_UI_REQUESTED_V4.apply());
  const snap=()=>page.evaluate(()=>[...document.querySelectorAll('#obras .obxStatus,#obras button[data-filtro="andamento"]')].map(e=>({
    color:getComputedStyle(e).color,fill:getComputedStyle(e).webkitTextFillColor,
    inline:e.style.getPropertyValue('color'),
    text:e.textContent.trim()
  })));
  await page.waitForTimeout(70);
  let states=await snap();
  assert.ok(states.length===3);
  for(const item of states){
    assert.equal(item.color,'rgb(255, 255, 255)','white text lost after legacy UI initialization');
    assert.equal(item.fill,'rgb(255, 255, 255)','WebKit text fill is not white');
  }
  const delayed=await page.evaluate(async()=>{
    const nodes=[...document.querySelectorAll('#obras .obxStatus,#obras button[data-filtro="andamento"]')];
    let transitions=0;
    const observer=new MutationObserver(records=>{transitions+=records.filter(r=>r.attributeName==='style').length});
    observer.observe(document.getElementById('obras'),{subtree:true,attributes:true,attributeFilter:['style']});
    for(let i=0;i<12;i++){
      for(const node of nodes){
        // Simulates a cached visual module writing green inline with !important
        node.style.setProperty('color','#15803D','important');
        node.style.setProperty('-webkit-text-fill-color','#15803D','important');
      }
      await new Promise(r=>requestAnimationFrame(()=>r()));
      const colors=nodes.map(n=>[getComputedStyle(n).color,getComputedStyle(n).webkitTextFillColor]);
      if(colors.some(row=>row.some(v=>v!=='rgb(255, 255, 255)')))throw Error('white text not preserved during late visual updates');
    }
    observer.disconnect();
    return {transitions,styleWrites:nodes.every(n=>n.style.getPropertyValue('color')==='#fff')};
  });
  assert.ok(delayed.styleWrites,'native style override not corrected');
  await page.evaluate(()=>{
    document.getElementById('listaObras').innerHTML='<div class="obxCards"><article><span class="obxStatus andamento">Em andamento</span></article></div>';
    window.dispatchEvent(new Event('obrix:grupo-pronto'));
  });
  await page.waitForTimeout(50);
  const newNode=await snap();
  assert.equal(newNode.length,2);
  for(const node of newNode){assert.equal(node.color,'rgb(255, 255, 255)');assert.equal(node.fill,'rgb(255, 255, 255)');}
  // No changes outside Obras: startup V4 is allowed to style its existing targets.
  const footer=await page.locator('#app .bottom').count();
  assert.equal(footer,1);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({device:deviceName,variant,theme,legacyColorWritesCorrected:delayed.transitions,newNodes:white(newNode),footerPreserved:footer===1,passed:true}));
 }finally{await browser.close()}
}
function white(nodes){return nodes.every(n=>n.color==='rgb(255, 255, 255)'&&n.fill==='rgb(255, 255, 255)')}
(async()=>{for(const variant of variants)for(const theme of ['light','dark'])for(const [name,engine,device] of scenarios)await run(engine,name,device,variant,theme)})().catch(err=>{console.error(err);process.exitCode=1});
