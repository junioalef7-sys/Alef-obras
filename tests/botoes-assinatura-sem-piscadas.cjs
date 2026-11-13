const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit,devices}=require('playwright');
const roots=['.','obrix-android-inicial'];
const browsers=[['iPhone-WebKit',webkit,devices['iPhone 13']],['Android-Chromium',chromium,devices['Pixel 7']],['Desktop-Chromium',chromium,{viewport:{width:1366,height:768}}]];
async function run(browserType,name,device,root){
 const browser=await browserType.launch();
 try{
  const page=await browser.newPage(device);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<!DOCTYPE html><html data-theme="light"><body><section id="app"><div id="inicio"></div><div id="obras" class="hidden"></div><div id="equipe" class="hidden"></div><div id="menuMain" class="hidden"><button id="nav" data-go="documentos"><b>Documentos</b><span>Ícone</span></button></div><div class="bottom"><button>Início</button></div></section></body></html>');
  await page.evaluate(()=>{
    window.profile={empresa_id:'co1'};
    let calls=0;
    window.testBackend={calls:0};
    const sb={from(table){
      window.testBackend.calls++;
      const c={select(){return this},eq(){return this},order(){if(table==='planos_assinatura')return Promise.resolve({data:[{codigo:'mensal',nome:'Mensal',descricao:'Teste',valor:39.9,periodo:'mensal',destaque:false}],error:null});return this},limit(){return Promise.resolve({data:[{status:'teste',trial_fim:'2026-11-20'}],error:null})}};
      return c;
    }};
    window.OBRIX_BACKEND={init:async()=>sb,profile:async()=>window.profile};
    window.OBRIX_POS_LOGIN_LOADER={
      loadFeature(name){
        if(name==='documentos'){
          window.testFeatureDone=false;
          setTimeout(()=>{window.OBRIX_DOCUMENTOS={open(){window.testOpenedAt=performance.now()}}},80);
          return new Promise(resolve=>setTimeout(()=>{window.testFeatureDone=true;resolve(true)},1200));
        }
        return Promise.resolve(true);
      },loadGroup:async()=>true
    };
    window.scrollTo=()=>{};
  });
  await page.addScriptTag({content:fs.readFileSync(root+'/obrix-ui-stability.js','utf8')});
  await page.addScriptTag({content:fs.readFileSync(root+'/obrix-assinaturas-main.js','utf8')});
  await page.evaluate(()=>{document.getElementById('app').classList.remove('hidden')});
  const n=page.locator('#nav'),old=await n.innerHTML();
  const started=Date.now();
  const opened=await page.evaluate(async()=>{
    const btn=document.querySelector('#nav');
    const t=performance.now();const ok=await window.OBRIX_UI_STABILITY.openOnline('documentos',btn);
    return {ok,elapsed:performance.now()-t,featureDone:window.testFeatureDone,openedAt:window.testOpenedAt,html:btn.innerHTML};
  });
  assert.equal(opened.ok,true,'document module did not open');
  assert.equal(opened.featureDone,false,'opened only after background supplements');
  assert.ok(opened.elapsed<750,'feature waited for supplements instead of main module');
  assert.equal(opened.html,old,'button markup/icon changed during opening');
  // Avoid leaked background work across scenario.
  await page.waitForTimeout(1250);
  const sub=await page.evaluate(async()=>{
    await window.OBRIX_ASSINATURA.load();
    const box=document.querySelector('#assPlanos');
    const old=box.firstElementChild;
    let changes=0;const obs=new MutationObserver(recs=>{changes+=recs.filter(r=>r.type==='childList').length});obs.observe(box,{childList:true,subtree:false});
    const before=getComputedStyle(old).backgroundColor;
    await window.OBRIX_ASSINATURA.load();
    await new Promise(r=>setTimeout(r,50));
    obs.disconnect();
    const same=box.firstElementChild===old;
    const after=getComputedStyle(box.firstElementChild).backgroundColor;
    return {same,changes,before,after,paymentButtons:box.querySelectorAll('[data-ass-plano],[data-ass-boleto]').length,backendQueries:window.testBackend.calls};
  });
  assert.ok(sub.same,'subscription plan DOM replaced despite equal data');
  assert.equal(sub.changes,0,'subscription cards mutated unnecessarily');
  assert.equal(sub.before,sub.after,'light theme plan background changed');
  assert.equal(sub.paymentButtons,2,'Pix or boleto payment actions lost');
  assert.deepEqual(errors,[],'browser JavaScript errors');
  console.log(JSON.stringify({profile:name,root,openMs:Math.round(opened.elapsed),supplementsDeferred:!opened.featureDone,menuIconPreserved:true,planRepaints:sub.changes,paymentButtons:2,passed:true}));
 }finally{await browser.close()}
}
(async()=>{
 for(const root of roots)for(const [name,engine,device] of browsers)await run(engine,name,device,root);
})().catch(e=>{console.error(e);process.exitCode=1});
