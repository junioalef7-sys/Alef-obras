'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit,devices}=require('playwright');
const host='https://alef-obras-fkibfgjio-obrix3.vercel.app';
const variants=['/obrix.html?obrix_auditoria=1','/obrix-android-inicial/obrix.html?obrix_auditoria=1'];
const profiles=[['iPhone WebKit',webkit,devices['iPhone 13']],['Android Chromium',chromium,devices['Pixel 7']]];
function output(s){process.stdout.write(JSON.stringify(s)+'\n')}
(async()=>{
 for(const [device,engine,profile] of profiles){
  const browser=await engine.launch({headless:true});
  try{
   for(const variant of variants){
    const page=await browser.newPage({...profile,serviceWorkers:'block'});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e.message).slice(0,180)));
    const start=Date.now(),url=host+variant;
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:50000});
    const http=response?.status();
    if(http!==200)throw Error(device+variant+' página real indisponível HTTP '+http);
    await page.waitForTimeout(800);
    const init=await page.evaluate(async()=>{
      // Não usar conta, banco de dados ou dados do usuário neste teste.
      document.getElementById('app')?.classList.remove('hidden');
      document.getElementById('login')?.classList.add('hidden');
      const loader=window.OBRIX_POS_LOGIN_LOADER;
      const has=typeof window.OBRIX_CONFIG?.open==='function';
      const started=performance.now();
      let loaded=has;
      try{
       if(!loaded)loaded=await Promise.race([
        loader?.loadFeature?.('config')||Promise.resolve(false),
        new Promise(resolve=>setTimeout(()=>resolve(false),9000))
       ]);
      }catch(e){}
      const loadMs=Math.round(performance.now()-started);
      window.OBRIX_CONFIG?.open?.();
      document.documentElement.dataset.theme='dark';
      document.body.classList.remove('dark');
      return {apiBefore:has,loaded,loadMs,configPresent:!!document.getElementById('configMain'),
        accountScript:!!window.OBRIX_ACCOUNT_DELETE,
        loaderScript:[...document.scripts].filter(s=>/obrix-pos-login-loader/.test(s.src)).map(s=>s.src)};
    });
    await page.waitForTimeout(500);
    const read=await page.evaluate(()=>{
      const c=document.getElementById('configMain');
      const values=[...(c?.querySelectorAll('.cfgDeleteGrid button[data-del]')||[])].map(b=>{
       const s=getComputedStyle(b);
       return {label:b.textContent.trim(),border:s.borderTopWidth,color:s.color,fill:s.webkitTextFillColor,
          inline:b.getAttribute('style'),classes:b.className};
      });
      const b=document.getElementById('cfgExcluirConta'),s=b?getComputedStyle(b):null;
      return {configVisible:!!c&&!c.classList.contains('hidden'),
        values,account:b?{background:s.backgroundColor,border:s.borderTopWidth,
        color:s.color,style:b.getAttribute('style')}:null,theme:document.documentElement.dataset.theme,
        diagnostic:window.OBRIX_AUDITORIA_PREVIEW?.status?.()};
    });
    const result={device,variant,http,timeToDOM:Date.now()-start,init,read,pageErrors:errors.slice(0,8)};
    output(result);
    assert.equal(init.configPresent,true,'Config screen did not mount on actual deployed HTML');
    assert.equal(read.values.length,4,'4 Apagar buttons are missing on actual HTML');
    for(const b of read.values){
      assert.equal(b.border,'0px','RED BORDER '+b.label);
      assert.equal(b.color,'rgb(248, 250, 252)','TEXT COLOR '+b.label);
      assert.equal(b.fill,'rgb(248, 250, 252)','TEXT FILL '+b.label);
    }
    assert.equal(read.account?.background,'rgb(17, 30, 44)','Excluir conta card not visible');
    assert.equal(read.account?.border,'1px','Excluir conta card border missing');
    assert.ok(init.loadMs<10000,'Config opening slow');
    await page.close();
   }
  }finally{await browser.close()}
 }
})().catch(e=>{console.error('REAL_PAGE_FAILURE',e);process.exitCode=1});
