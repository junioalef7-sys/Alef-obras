const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit,devices}=require('playwright');
const origin='https://obrix-layout.invalid/';
const variants=['.','obrix-android-inicial'];
const scenarios=[['iPhone/WebKit',webkit,devices['iPhone 13']],['Android/Chromium',chromium,devices['Pixel 7']],['Desktop/Chromium',chromium,{viewport:{width:1366,height:768}}]];
const read=(d,f)=>fs.readFileSync(d+'/'+f,'utf8');
const html='<!doctype html><html lang="pt-BR" data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}#app{width:100%;padding:12px;box-sizing:border-box;max-width:100vw}.hidden{display:none!important}.bottom{position:fixed;bottom:0;left:0;right:0}</style></head><body><div id="app"><div class="top"></div><main id="inicio" class="hidden"></main><main id="obras"><div class="hero"><h1>Obras</h1></div><div class="sectionHead"></div><div id="listaObras"></div></main><main id="equipe" class="hidden"></main><div class="bottom"><button>Início</button><button>Obras</button><button>Equipe</button><button>Menu</button></div></div></body></html>';
async function scenario(profile,engine,device,variant,theme){
 const browser=await engine.launch();
 try{
  const page=await browser.newPage(device);const errs=[];
  page.on('pageerror',e=>errs.push(e.message));
  await page.route(origin+'**',route=>route.fulfill({status:200,contentType:'text/html',body:html}));
  await page.goto(origin+'app.html');
  await page.evaluate(theme=>{
    document.documentElement.dataset.theme=theme;
    document.body.classList.toggle('dark',theme==='dark');
    window.scrollTo=()=>{};
    window.OBRIX_MENU={open(){}};
    window.obras=[{id:'1',nome:'Obra de teste',status:'andamento',cliente:'Cliente',local:'Centro',progresso:65,valor_contrato:12000}];
    window.financeiro=[];window.extras=[];
    window.OBRIX_BACKEND={profile:async()=>({nome:'Teste',email:'teste@obrix.invalid',empresa_id:'simulacao'}),currentUser:async()=>({email:'teste@obrix.invalid'}),init:async()=>({})};
  },theme);
  await page.addScriptTag({content:read(variant,'obrix-obras-fiel.js')});
  await page.evaluate(()=>window.OBRIX_OBRAS_FIEL.render());
  const b=await page.evaluate(()=>{
    const row=document.querySelector('#listaObras .obxStatusLinha'),e=row?.querySelector('.obxStatus.andamento');
    const bar=row?.querySelector('.obxBar'),pct=row?.querySelector(':scope > b');
    if(!e||!bar||!pct)throw Error('row absent');
    const be=e.getBoundingClientRect(),br=bar.getBoundingClientRect(),pc=pct.getBoundingClientRect();
    return {text:e.textContent.trim(),whiteSpace:getComputedStyle(e).whiteSpace,fill:getComputedStyle(e).webkitTextFillColor,
      height:be.height,labelsHorizontal:Math.abs((be.top+be.height/2)-(br.top+br.height/2))<7&&Math.abs((be.top+be.height/2)-(pc.top+pc.height/2))<7,
      noWrap:e.scrollHeight<=e.clientHeight+1,labelWidth:be.width,rowWidth:row.getBoundingClientRect().width,
      noXOverflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+2};
  });
  assert.equal(b.text,'Em andamento');
  assert.equal(b.whiteSpace,'nowrap','Em andamento wrapped');
  assert.ok(b.noWrap&&b.labelsHorizontal&&b.noXOverflow,'status row is not in one horizontal line');
  assert.equal(b.fill,'rgb(255, 255, 255)','approved white letters lost');
  await page.addScriptTag({content:read(variant,'obrix-config-main.js')});
  await page.evaluate(()=>window.OBRIX_CONFIG.open());
  await page.addScriptTag({content:read(variant,'obrix-config-claro-perigo-20261030.js')});
  await page.addScriptTag({content:read(variant,'obrix-visual-padrao-final.js')});
  await page.addScriptTag({content:read(variant,'obrix-ui-cleanup-v5.js')});
  await page.waitForTimeout(550);
  const state=()=>page.evaluate(()=>{
    const nodes=[...document.querySelectorAll('#configMain .cfgDeleteGrid button')];
    return {n:nodes.length,buttons:nodes.map(n=>{
      const c=getComputedStyle(n);
      return {label:n.textContent.trim(),border:c.borderTopWidth,text:c.color,fill:c.webkitTextFillColor,
        hasClick:typeof n.onclick==='function',bg:c.backgroundColor};
    }),footerCount:document.querySelectorAll('#app>.bottom').length,
    horizontalOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2};
  });
  let v=await state();
  assert.equal(v.n,4);
  assert.deepEqual(v.buttons.map(x=>x.label),['Apagar Equipe','Apagar Obras','Apagar Financeiro','Apagar tudo']);
  const expected=theme==='dark'?'rgb(248, 250, 252)':'rgb(15, 23, 42)';
  for(const x of v.buttons){
    assert.equal(x.border,'0px','border visible on '+x.label);
    assert.ok(x.text===expected || (theme==='dark'&&x.text==='rgb(238, 242, 247)'),'wrong text '+x.label+':'+x.text);
    assert.notEqual(x.fill,'rgb(220, 38, 38)','red text fill on '+x.label);
    assert.ok(x.hasClick,'delete action lost on '+x.label);
  }
  assert.equal(v.footerCount,1);
  assert.equal(v.horizontalOverflow,false);
  for(let i=0;i<15;i++){await page.evaluate(()=>{
    window.OBRIX_VISUAL_PADRAO_FINAL?.refresh?.();
    window.OBRIX_UI_CLEANUP_V5?.scan?.();
    window.OBRIX_TESTE_AJUSTES_GERAIS_3110?.refresh?.();
    window.dispatchEvent(new Event('focus'));
  });}
  await page.waitForTimeout(900);
  v=await state();
  assert.ok(v.buttons.every(x=>x.border==='0px'&&x.hasClick),'style returned after module refresh');
  assert.equal(v.horizontalOverflow,false);
  assert.deepEqual(errs,[],'JS errors');
  console.log(JSON.stringify({variant,device:profile,theme,statusInOneRow:b.labelsHorizontal,
    statusUnwrapped:b.noWrap,statusWhite:true,deleteButtons:4,bordersRemoved:true,
    labelsNeutral:true,deleteActionsPreserved:true,footerPreserved:true,pass:true}));
 }finally{await browser.close()}
}
(async()=>{for(const variant of variants)for(const theme of ['light','dark'])for(const [profile,engine,device] of scenarios)await scenario(profile,engine,device,variant,theme)})().catch(e=>{console.error(e);process.exitCode=1});
