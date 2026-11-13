const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit,devices}=require('playwright');
const roots=['.','obrix-android-inicial'];
const profiles=[['iPhone/WebKit',webkit,devices['iPhone 13']],['Android/Chromium',chromium,devices['Pixel 7']],['Computador/Chromium',chromium,{viewport:{width:1366,height:768}}]];
const origin='https://obrix-config-card-test.invalid/';
const pageHTML='<!doctype html><html data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="app"><div class="top"></div><main id="inicio" class="hidden"></main><main id="obras" class="hidden"></main><main id="equipe" class="hidden"></main><main id="configMain"><div class="hero"><h1>Configurações</h1></div><div class="card"><h3>Dados do aplicativo</h3><div class="cfgDeleteGrid"><button data-del="equipe">Apagar Equipe</button><button data-del="obras">Apagar Obras</button><button data-del="financeiro">Apagar Financeiro</button><button class="dangerAll" data-del="tudo">Apagar tudo</button></div></div><div class="card"><h3>Conta</h3><button id="cfgSair" class="btn cfgFull" type="button">Sair da conta</button></div></main><div class="bottom"><button>Início</button><button>Obras</button><button>Equipe</button><button>Menu</button></div></div></body></html>';
const source=(root,file)=>fs.readFileSync(root+'/'+file,'utf8');
function rgb(theme){return theme==='light'?'rgb(15, 23, 42)':'rgb(248, 250, 252)'}
function fundo(theme){return theme==='light'?'rgb(229, 234, 240)':'rgb(17, 30, 44)'}
async function run(browserType,profile,device,root,theme){
 const browser=await browserType.launch();
 try{
  const page=await browser.newPage(device),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(origin+'**',route=>{const isScript=/\.js(?:\?|$)/.test(route.request().url());return route.fulfill({status:200,contentType:isScript?'text/javascript':'text/html; charset=utf-8',body:isScript?'void 0;':pageHTML});});
  await page.goto(origin+'app.html');
  await page.evaluate(theme=>{
    document.documentElement.dataset.theme=theme;
    document.body.classList.toggle('dark',theme==='dark');
    document.documentElement.style.setProperty('--ob-text',theme==='dark'?'#f8fafc':'#0f172a');
    document.documentElement.style.setProperty('--ob-surface-2',theme==='dark'?'#111e2c':'#e5eaf0');
    window.OBRIX_MENU={open(){}};
    window.scrollTo=()=>{};
  },theme);
  for(const file of ['obrix-config-main.js','obrix-account-delete.js','obrix-config-claro-perigo-20261030.js','obrix-ui-final-fix-20261101.js','obrix-visual-padrao-final.js','obrix-light-ui-final-v3.js','obrix-ui-cleanup-v5.js']){
    await page.addScriptTag({content:source(root,file)});
  }
  await page.waitForTimeout(550);
  const first=await page.evaluate(()=>{
    const btn=document.getElementById('cfgExcluirConta');
    if(!btn)throw Error('Excluir conta button was not installed');
    return {node:!!btn,onclick:typeof btn.onclick==='function',text:btn.textContent.trim()};
  });
  assert.ok(first.node&&first.onclick);
  assert.equal(first.text,'Excluir conta');
  const baseline=await page.evaluate(()=>{
    const b=document.getElementById('cfgExcluirConta'),cs=getComputedStyle(b);
    const others=[...document.querySelectorAll('#configMain .cfgDeleteGrid button[data-del]')].map(btn=>{
      const s=getComputedStyle(btn);
      return {text:btn.textContent.trim(),border:s.borderTopWidth,color:s.color,fill:s.webkitTextFillColor};
    });
    return {bg:cs.backgroundColor,color:cs.color,fill:cs.webkitTextFillColor,
      border:cs.borderTopWidth,radius:cs.borderTopLeftRadius,
      style:b.getAttribute('style'),footer:document.querySelector('#app>.bottom')?.tagName,others};
  });
  assert.equal(baseline.color,rgb(theme),'unexpected button text color');
  assert.equal(baseline.fill,rgb(theme),'unexpected text fill color');
  assert.equal(baseline.bg,fundo(theme),'Excluir conta is not a filled card');
  assert.equal(baseline.border,'1px','Excluir conta should have subtle card border');
  assert.equal(baseline.radius,'12px','Excluir conta card radius');
  assert.equal(baseline.others.length,4);
  if(theme==='dark')for(const btn of baseline.others){
    assert.equal(btn.border,'0px',btn.text+': red border persists');
    assert.equal(btn.color,rgb(theme),btn.text+': text should be neutral white');
    assert.equal(btn.fill,rgb(theme),btn.text+': WebKit text fill should be neutral white');
  }
  assert.equal(baseline.footer,'DIV');
  const stability=await page.evaluate(async()=>{
    const b=document.getElementById('cfgExcluirConta');
    let replacements=0,styling=0;
    const node=b;
    const watcher=new MutationObserver(records=>records.forEach(r=>{
      if(r.type==='attributes'&&r.attributeName==='style'&&r.target===node)styling++;
      if(r.type==='childList'&&[...r.removedNodes].includes(node))replacements++;
    }));
    watcher.observe(document.body,{subtree:true,attributes:true,attributeFilter:['style'],childList:true});
    for(let n=0;n<35;n++){
      window.OBRIX_VISUAL_PADRAO_FINAL?.refresh?.();
      window.OBRIX_LIGHT_UI_FINAL_V3?.apply?.();
      window.OBRIX_UI_CLEANUP_V5?.scan?.();
      window.dispatchEvent(new Event('focus'));
      const item=document.createElement('span');item.textContent='atualizacao '+n;
      document.querySelector('#app').appendChild(item);
      item.remove();
    }
    await new Promise(r=>setTimeout(r,2100));
    watcher.disconnect();
    const cs=getComputedStyle(b);
    return {styling,replacements,stillSame:document.getElementById('cfgExcluirConta')===node,
      color:cs.color,fill:cs.webkitTextFillColor,bg:cs.backgroundColor};
  });
  assert.equal(stability.replacements,0,'delete account button DOM node replaced');
  assert.ok(stability.stillSame);
  assert.equal(stability.color,rgb(theme),'delete account color changed after events');
  assert.equal(stability.fill,rgb(theme),'delete account fill changed after events');
  assert.equal(stability.bg,fundo(theme),'Excluir conta card background changed');
  assert.ok(stability.styling<=3,'delete button style still being rewritten/pulsing: '+stability.styling);
  // Alternar temas sem desmontar os cartões nem aplicar estilo vermelho.
  const switched=await page.evaluate(async theme=>{
    const next=theme==='dark'?'light':'dark';
    document.documentElement.dataset.theme=next;
    document.body.classList.toggle('dark',next==='dark');
    document.documentElement.style.setProperty('--ob-text',next==='dark'?'#f8fafc':'#0f172a');
    document.documentElement.style.setProperty('--ob-surface-2',next==='dark'?'#111e2c':'#e5eaf0');
    await new Promise(r=>setTimeout(r,100));
    const b=document.getElementById('cfgExcluirConta'),s=getComputedStyle(b);
    return {next,bg:s.backgroundColor,color:s.color,
      others:[...document.querySelectorAll('#configMain .cfgDeleteGrid button[data-del]')].map(x=>{
        const c=getComputedStyle(x);return {border:c.borderTopWidth,color:c.color}
      })};
  },theme);
  assert.equal(switched.bg,fundo(switched.next),'card background after theme switch');
  assert.equal(switched.color,rgb(switched.next),'card text after theme switch');
  if(switched.next==='dark')for(const b of switched.others){
    assert.equal(b.border,'0px','theme switch reintroduced red border');
    assert.equal(b.color,rgb(switched.next),'theme switch reintroduced red letters');
  }
  const modal=await page.evaluate(()=>{
    document.getElementById('cfgExcluirConta').click();
    const m=document.querySelector('.accountDeleteModal');
    if(!m)return{open:false};
    const confirmation=m.querySelector('input.accountDeleteText');
    const action=m.querySelector('button.excluir');
    const before=m.textContent;
    m.querySelector('button.accountDeleteClose')?.click();
    return {open:true,confirmation:!!confirmation,action:!!action,warning:before.includes('EXCLUIR CONTA'),closed:!document.querySelector('.accountDeleteModal')};
  });
  assert.ok(modal.open&&modal.confirmation&&modal.action&&modal.warning&&modal.closed,'delete confirmation broken');
  assert.deepEqual(errors,[],'browser errors in Config');
  console.log(JSON.stringify({variant:root,device:profile,theme,
    styleMutations:stability.styling,nodePreserved:stability.stillSame,
    colorStable:stability.color===rgb(theme),cardBackground:stability.bg,
    buttonsNeutral:baseline.others.every(b=>theme!=='dark'||b.border==='0px'),
    modalWorked:modal.closed,pass:true}));
 }finally{await browser.close()}
}
(async()=>{for(const root of roots)for(const theme of ['light','dark'])for(const [profile,engine,device] of profiles)await run(engine,profile,device,root,theme)})().catch(e=>{console.error(e);process.exitCode=1});
