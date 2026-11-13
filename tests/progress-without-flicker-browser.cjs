// Real browser regression checks with synthetic data; no production account access.
const {chromium,webkit,devices}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
async function run(engine,device,root){
 const browser=await engine.launch();
 try{
  const page=await browser.newPage(device||{viewport:{width:1366,height:768}});
  await page.setContent('<main id="app"><section id="inicio" class="hidden"></section><section id="obras"><div id="listaObras"><div class="obxObraCard" data-id="one"><div class="obxStatusLinha"><div class="obxBar"><i style="width:0%"></i></div><b>0%</b></div></div></div></section></main>');
  await page.evaluate(()=>{
   window.paintWrites=0;window.reads=0;window.progressEvents=0;
   new MutationObserver(ms=>window.paintWrites+=ms.length).observe(document.querySelector('#listaObras'),{subtree:true,childList:true,attributes:true});
   window.addEventListener('obrix:progresso-atualizado',()=>window.progressEvents++);
   window.obras=[{id:'one'}];window.testProgress=50;
   const sb={from(){return {select(){return {eq:async()=>{window.reads++;return {data:[{obra_id:'one',progresso:window.testProgress}]}}}}}},channel(){return {on(){return this},subscribe(){return this}}}};
   window.OBRIX_BACKEND={profile:async()=>({empresa_id:'test'}),init:async()=>sb};
  });
  await page.addScriptTag({content:fs.readFileSync(root+'/obrix-checklist-progress-core.js','utf8')});
  await page.waitForTimeout(1800);
  assert.equal(await page.locator('b').textContent(),'50%');
  const before=await page.evaluate(()=>paintWrites);
  // Sustained real elapsed time; recurring timers continue running.
  await page.waitForTimeout(65000);
  const after=await page.evaluate(()=>({writes:paintWrites,reads,events:progressEvents,nodes:document.querySelectorAll('*').length}));
  assert.equal(after.writes,before,'unchanged DOM must remain idle');
  assert.ok(after.reads<=4,'periodic reconciliation must stay bounded');
  assert.equal(after.events,1,'unchanged progress must not repeatedly rebuild home');
  await page.evaluate(async()=>{window.testProgress=75;await OBRIX_PROGRESS_CORE.refresh()});
  assert.equal(await page.locator('b').textContent(),'75%');
  console.log(JSON.stringify({profile:device?.defaultBrowserType||'desktop',root,...after,changedProgress:'75%',pass:true}));
 }finally{await browser.close()}
}
Promise.all([run(chromium,null,'.'),run(chromium,devices['Pixel 7'],'obrix-android-inicial'),run(webkit,devices['iPhone 13'],'.')]).catch(e=>{console.error(e);process.exitCode=1});
