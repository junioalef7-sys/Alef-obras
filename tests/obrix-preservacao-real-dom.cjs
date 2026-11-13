const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit,devices}=require('playwright');
const FILES=['obrix.html','obrix-android-inicial/obrix.html'];
const CASES=[['iPhone-WebKit',webkit,devices['iPhone 13']],['Android-Chromium',chromium,devices['Pixel 7']],['Desktop-Chromium',chromium,{viewport:{width:1366,height:768}}]];
const themeSource=fs.readFileSync('obrix-theme-main.js','utf8');
const themeCSS=themeSource.match(new RegExp('css\\.textContent=\\x60([\\s\\S]*?)\\x60;\\s*document\\.head'));
assert.ok(themeCSS,'real OBRIX theme stylesheet not found');
const stripScripts=s=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
function cssFiles(html,filename){
  const root=filename.includes('android-inicial/')?'obrix-android-inicial/':'';
  return [...html.matchAll(/<link\b[^>]*href="([^"]+\.css[^"]*)"/gi)].map(x=>
    path.normalize(path.join(root,x[1].split('?')[0]))
  ).filter(p=>fs.existsSync(p));
}
async function check(engine,profile,device,htmlFile,theme){
  const browser=await engine.launch();
  try{
    const page=await browser.newPage(device);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const html=fs.readFileSync(htmlFile,'utf8');
    const markup=stripScripts(html).replace(/<link\b[^>]*href="[^"]+\.css[^"]*"[^>]*>/gi,'');
    await page.setContent(markup,{waitUntil:'domcontentloaded'});
    for(const css of cssFiles(html,htmlFile))await page.addStyleTag({content:fs.readFileSync(css,'utf8')});
    await page.addStyleTag({content:themeCSS[1]});
    await page.evaluate(theme=>{
      document.documentElement.dataset.theme=theme;
      document.getElementById('login')?.classList.add('hidden');
      document.getElementById('app')?.classList.remove('hidden');
      document.querySelectorAll('#app>main').forEach(m=>m.classList.toggle('hidden',m.id!=='obras'));
      document.querySelector('#obras').style.minHeight='1900px';
      window.obras=[
        {id:'work-1',nome:'Escola',cliente:'Teste',status:'andamento',valor_contrato:25000,progresso:65},
        {id:'work-2',nome:'Refeitório',cliente:'Teste',status:'andamento',valor_contrato:40000,progresso:30}
      ];
      window.financeiro=[];window.extras=[];window.testClicks=0;
      window.abrir=()=>{window.testClicks++};
      window.OBRIX_FIN={open(){window.testClicks++}};
    },theme);
    await page.addScriptTag({content:fs.readFileSync('obrix-obras-fiel.js','utf8')});
    await page.addScriptTag({content:fs.readFileSync('obrix-preview-card-contours-icons-v2.js','utf8')});
    await page.waitForTimeout(120);
    const take=()=>page.evaluate(()=>{
      const nav=document.querySelector('#app>.bottom');
      const r=nav.getBoundingClientRect(),s=getComputedStyle(nav);
      const buttons=[...nav.querySelectorAll(':scope>button')];
      return {top:r.top,bottom:r.bottom,innerHeight,scrollY,position:s.position,
        style:buttons.map(b=>{const c=getComputedStyle(b);return{
          text:b.textContent.trim(),background:c.backgroundColor,color:c.color,
          fontSize:c.fontSize,borderRadius:c.borderRadius,padding:c.padding
        }}),count:buttons.length,cards:document.querySelectorAll('#obras .obxObraCard').length};
    });
    const before=await take();
    assert.equal(before.position,'fixed',profile+' '+htmlFile+': footer is not fixed');
    assert.ok(Math.abs(before.bottom-before.innerHeight)<1.1,'footer not at viewport bottom');
    assert.equal(before.count,4,'number of navigation buttons changed');
    assert.ok(before.cards>=2,'approved Obras layout did not render');
    await page.evaluate(()=>window.scrollTo(0,850));
    await page.waitForTimeout(120);
    const middle=await take();
    assert.ok(middle.scrollY>300,'page did not scroll');
    assert.ok(Math.abs(middle.bottom-before.bottom)<1.1,'footer moved while scrolling');
    assert.deepEqual(middle.style,before.style,'visual style changed on scroll');
    await page.evaluate(()=>{
      document.getElementById('obras').classList.add('hidden');
      document.getElementById('equipe')?.classList.remove('hidden');
    });
    await page.waitForTimeout(120);
    const next=await take();
    assert.equal(next.position,'fixed','footer position changed after page switch');
    assert.ok(Math.abs(next.bottom-next.innerHeight)<1.1,'footer detached after page switch');
    assert.deepEqual(next.style,before.style,'visual style changed after page switch');
    await page.locator('#app>.bottom>button').first().click();
    await page.locator('#app>.bottom>button').nth(1).click();
    await page.locator('#app>.bottom>button').nth(2).click();
    assert.equal(await page.evaluate(()=>window.testClicks),3,'navigation handlers lost');
    assert.deepEqual(errors,[],'browser JavaScript errors');
    console.log(JSON.stringify({profile,htmlFile,theme,footerMovement:Math.round((middle.bottom-before.bottom)*100)/100,
      buttons:4,cards:before.cards,screenSwitch:true,navClicks:3,pass:true}));
  }finally{await browser.close()}
}
(async()=>{
  for(const html of FILES)for(const theme of ['light','dark'])
    for(const [profile,engine,device] of CASES)await check(engine,profile,device,html,theme);
})().catch(e=>{console.error(e);process.exitCode=1});
