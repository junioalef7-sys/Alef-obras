const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit,devices}=require('playwright');
const scenarios=[['iPhone WebKit',webkit,devices['iPhone 13']],['Android Chromium',chromium,devices['Pixel 7']],['Desktop Chromium',chromium,{viewport:{width:1366,height:768}}]];
const variants=['.','obrix-android-inicial'];
const origin='https://obrix-test.invalid/';
const html='<!doctype html><html data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><section id="app"><div class="top"><span class="brand">OBRIX</span></div><main id="inicio" class="hidden"></main><main id="obras"><div class="hero"><h1>Obras</h1></div><div class="sectionHead"><strong>Obras</strong></div><div class="obxFiltros"><button data-filtro="andamento" class="ativo">Em andamento</button></div><div id="listaObras"></div></main><main id="equipe" class="hidden"></main><main id="financeiroMain" class="hidden"></main><main id="estoqueMain" class="hidden"></main><main id="menuMain" class="hidden"></main><div class="bottom"><button>Início</button><button>Financeiro</button><button>Equipe</button><button>Menu</button></div></section></body></html>';
const read=(dir,p)=>fs.readFileSync(dir+'/'+p,'utf8');
async function scenario(engine,profile,device,dir,theme){
 const browser=await engine.launch();
 try{
  const page=await browser.newPage(device);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(origin+'**',route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));
  await page.goto(origin+'index.html');
  const h=read(dir,'obrix.html');
  const headRule=h.match(/<style id="obrixObrasHistoricoEstabilidade20261112">([\s\S]*?)<\/style>/);
  assert.ok(headRule);
  await page.addStyleTag({content:headRule[1]});
  await page.evaluate(theme=>{
    document.documentElement.dataset.theme=theme;
    localStorage.setItem('obrix_theme',theme);
    window.scrollTo=()=>{};
    window.obras=[{id:'a',nome:'Refeitório',cliente:'Cliente',local:'Centro',status:'andamento',valor_contrato:30000,progresso:67}];
    window.financeiro=[];window.extras=[];
    window.OBRIX_MENU={open(){}};
    window.OBRIX_BACKEND={
      profile:async()=>({empresa_id:'company'}),
      init:async()=>({
        from:()=>({select(){return this},eq(){return new Promise(resolve=>setTimeout(()=>resolve({data:[{obra_id:'a',progresso:73}],error:null}),550))}}),
        channel:()=>({on(){return this},subscribe(){return this}}),
        removeChannel(){}
      })
    };
  },theme);
  await page.addScriptTag({content:read(dir,'obrix-obras-fiel.js')});
  await page.addScriptTag({content:read(dir,'obrix-theme-main.js')});
  await page.addScriptTag({content:read(dir,'obrix-config-claro-perigo-20261030.js')});
  await page.addScriptTag({content:read(dir,'obrix-visual-padrao-final.js')});
  await page.evaluate(t=>window.OBRIX_THEME?.apply(t),theme);
  await page.addScriptTag({content:read(dir,'obrix-checklist-progress-core.js')});
  const initial=await page.evaluate(()=>{
    window.OBRIX_PROGRESS_CORE.paint();
    const status=document.querySelector('#listaObras .obxStatus.andamento');
    const filter=document.querySelector('#obras .obxFiltros button[data-filtro="andamento"]');
    const read=e=>({color:getComputedStyle(e).color,fill:getComputedStyle(e).webkitTextFillColor,
      bg:getComputedStyle(e).backgroundColor});
    return {model:window.obras[0].progresso,pct:document.querySelector('.obxStatusLinha>b')?.textContent,status:read(status),filter:read(filter)};
  });
  assert.equal(initial.model,67,'progress overwritten before checklist snapshot');
  assert.equal(initial.pct,'67%','progress bar flashed to zero before snapshot');
  const white='rgb(255, 255, 255)';
  if(theme==='light'){
    assert.equal(initial.status.color,white,'status Em andamento is not white');
    assert.equal(initial.status.fill,white,'status text fill is not white');
    assert.equal(initial.filter.color,white,'filter Em andamento is not white');
    assert.equal(initial.filter.fill,white,'filter text fill is not white');
  }
  await page.waitForTimeout(760);
  const after=await page.evaluate(()=>{
    const m=window.OBRIX_OBRAS_FIEL;
    const first=document.querySelector('#listaObras .obxObraCard');
    const image=first.querySelector('img');
    const status=first.querySelector('.obxStatus');
    for(let i=0;i<25;i++)m.refresh();
    return {pct:document.querySelector('.obxStatusLinha>b')?.textContent,model:window.obras[0].progresso,
      sameCard:document.querySelector('#listaObras .obxObraCard')===first,
      sameImage:document.querySelector('#listaObras .obxObraCard img')===image,
      status:getComputedStyle(status).color,fill:getComputedStyle(status).webkitTextFillColor};
  });
  assert.equal(after.model,73,'progress snapshot not applied');
  assert.equal(after.pct,'73%','progress was not painted');
  assert.ok(after.sameCard&&after.sameImage,'Obras re-mounted cards on no-op refresh');
  if(theme==='light'){assert.equal(after.status,white);assert.equal(after.fill,white)}

  await page.evaluate(()=>{
    window.__mockLoads=0;
    window.OBRIX_POS_LOGIN_LOADER={loadGroup:()=>{window.__mockLoads++;return new Promise(r=>setTimeout(()=>r(true),1100));}};
    window.OBRIX_FIN={open(){window.__finOpened=true}};
    window.OBRIX_EST={open(){window.__estOpened=true}};
  });
  await page.addScriptTag({content:read(dir,'obrix-ui-stability.js')});
  const latency=await page.evaluate(async()=>{
    const start=performance.now();
    const result=await window.OBRIX_UI_STABILITY.openOnline('financeiro',null);
    const first=performance.now()-start;
    const secondStart=performance.now();
    const result2=await window.OBRIX_UI_STABILITY.openOnline('estoque',null);
    const second=performance.now()-secondStart;
    return {first,second,result,result2,fin:window.__finOpened,est:window.__estOpened,loads:window.__mockLoads};
  });
  assert.ok(latency.result&&latency.result2&&latency.fin&&latency.est,'finance/stock screens not opened');
  assert.ok(latency.first<250&&latency.second<250,'opening delayed by background extensions');
  assert.deepEqual(errors,[],'JS errors in UI/progress scenario');
  console.log(JSON.stringify({device:profile,variant:dir,theme,color:white,
    beforeSnapshot:initial.pct,afterSnapshot:after.pct,
    cardKept:after.sameCard,financeMs:Math.round(latency.first),stockMs:Math.round(latency.second),pass:true}));
  await page.close();

  // Teste de download paralelo com ordem preservada: segundo arquivo chega antes,
  // mas não pode executar antes do primeiro módulo.
  const work=await browser.newPage(device);
  const calls=[];
  await work.route(origin+'**',async route=>{
    const u=route.request().url();
    if(u.includes('obrix-documentos-main.js')){
      calls.push({file:'main',time:Date.now()});await new Promise(r=>setTimeout(r,370));
      return route.fulfill({status:200,contentType:'text/javascript',body:"window.__order.push('main');window.OBRIX_DOCUMENTOS={open(){}};"});
    }
    if(u.includes('obrix-documentos-direto.js')){
      calls.push({file:'complement',time:Date.now()});await new Promise(r=>setTimeout(r,145));
      return route.fulfill({status:200,contentType:'text/javascript',body:"if(!window.OBRIX_DOCUMENTOS)throw Error('out of order');window.__order.push('complement');"});
    }
    return route.fulfill({status:200,contentType:'text/html',body:'<html><body><section id="app" class="hidden"></section></body></html>'});
  });
  await work.goto(origin+'app.html');
  await work.evaluate(()=>{window.__order=[];});
  await work.addScriptTag({content:read(dir,'obrix-pos-login-loader.js')});
  const loaded=await work.evaluate(async()=>{
    const t=performance.now();
    const ok=await window.OBRIX_POS_LOGIN_LOADER.loadFeature('documentos');
    return {ok,ms:performance.now()-t,order:window.__order};
  });
  assert.equal(loaded.ok,true,'document scripts did not load');
  assert.deepEqual(loaded.order,['main','complement'],'dependency order changed');
  assert.ok(loaded.ms<530,'document downloads serialized; slow first click');
  console.log(JSON.stringify({device:profile,variant:dir,parallelLoadMs:Math.round(loaded.ms),order:loaded.order,pass:true}));
  await work.close();
 }finally{await browser.close()}
}
(async()=>{
for(const dir of variants)for(const theme of ['light','dark'])
for(const [profile,engine,device] of scenarios)await scenario(engine,profile,device,dir,theme);
})().catch(e=>{console.error(e);process.exitCode=1});
