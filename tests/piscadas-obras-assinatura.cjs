const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit,devices}=require('playwright');
const variants=['.','obrix-android-inicial'];
const profiles=[['iPhone-WebKit',webkit,devices['iPhone 13']],['Android-Chromium',chromium,devices['Pixel 7']],['Desktop-Chromium',chromium,{viewport:{width:1366,height:768}}]];
const read=(root,p)=>fs.readFileSync(root+'/'+p,'utf8');
const html='<!doctype html><html data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div class="wrap"><section id="app"><div class="top"><div class="brand">OBRIX</div></div><main id="inicio" class="hidden"></main><main id="obras"><div class="hero"><h1>Obras</h1></div><div class="sectionHead"><strong>Obras</strong></div><div id="listaObras"></div></main><main id="equipe" class="hidden"></main><main id="menuMain" class="hidden"></main><div class="bottom"><button>Início</button><button>Financeiro</button><button>Equipe</button><button>Menu</button></div></section></div></body></html>';
async function run(engine,profile,device,root,theme){
 const browser=await engine.launch();
 try{
  const page=await browser.newPage(device),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(html);
  await page.evaluate(theme=>{
    document.documentElement.dataset.theme=theme;
    window.obras=[{id:'work-1',nome:'Escola',cliente:'Cliente',local:'Centro',status:'andamento',valor_contrato:25000,progresso:45},{id:'work-2',nome:'Refeitório',cliente:'Cliente',local:'Centro',status:'andamento',valor_contrato:18000,progresso:20}];
    window.financeiro=[];window.extras=[];window.profile={empresa_id:'test-company'};
    window.OBRIX_BACKEND={
      init:async()=>({from(name){return {select(){return this},eq(){return this},order(){return name==='planos_assinatura'?Promise.resolve({data:[{codigo:'mensal',nome:'Mensal',descricao:'Plano',valor:39.9,periodo:'mensal'}],error:null}):this},limit(){return Promise.resolve({data:[{status:'teste',trial_fim:'2026-11-20'}],error:null})}}}}),
      currentUser:async()=>({id:'test-user'}),profile:async()=>window.profile
    };
    window.OBRIX_MENU={open(){}};
  },theme);
  await page.addScriptTag({content:read(root,'obrix-obras-fiel.js')});
  const r=await page.evaluate(()=>{
    const mod=window.OBRIX_OBRAS_FIEL;
    if(!mod?.open('work-1'))throw Error('could not open detail');
    const oldRoot=document.querySelector('#listaObras>.obxDetalhe');
    const cover=oldRoot.querySelector('.obrixCapaHero>img');
    const goBack=oldRoot.querySelector('#obxVoltarObras');
    cover.src='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    const src=cover.src;
    let replaced=0;
    const watcher=new MutationObserver(events=>{replaced+=events.filter(e=>e.type==='childList').length});
    watcher.observe(document.getElementById('listaObras'),{childList:true});
    for(let i=0;i<40;i++){
      window.obras[0].progresso=46+i;
      window.financeiro=[{obra_id:'work-1',tipo:'receita',valor:100+i}];
      mod.refresh();
    }
    return new Promise(resolve=>setTimeout(()=>{
      watcher.disconnect();
      const last=document.querySelector('#listaObras>.obxDetalhe');
      const same=last===oldRoot;
      const imagePreserved=last.querySelector('.obrixCapaHero>img')===cover;
      const imageUrlPreserved=cover.src===src;
      const arrowPreserved=last.querySelector('#obxVoltarObras')===goBack;
      const progress=last.querySelector('.obxProg b')?.textContent;
      const actions=last.querySelectorAll('.obxAcao').length;
      const okOther=mod.open('work-2');
      const otherId=document.querySelector('.obrixCapaHero')?.dataset.obrixCapaId;
      mod.list();
      const listRoot=document.querySelector('#listaObras>.obxCards');
      const firstCard=listRoot?.querySelector('.obxObraCard[data-id="work-1"]');
      let listReplaced=0;
      const listWatcher=new MutationObserver(events=>{listReplaced+=events.filter(e=>e.type==='childList').length});
      listWatcher.observe(document.getElementById('listaObras'),{childList:true});
      for(let j=0;j<20;j++){
        window.obras[0].progresso=20+j;
        window.financeiro=[{obra_id:'work-1',tipo:'receita',valor:200+j}];
        mod.refresh();
      }
      setTimeout(()=>{
        listWatcher.disconnect();
        const listPreserved=document.querySelector('#listaObras>.obxCards')===listRoot&&
          listRoot.querySelector('.obxObraCard[data-id="work-1"]')===firstCard;
        resolve({same,imagePreserved,imageUrlPreserved,arrowPreserved,replaced,progress,actions,okOther,otherId,listReplaced,listPreserved});
      },40);
    },50));
  });
  assert.equal(r.replaced,0,'Obras detail was rebuilt during repeated progress/finance updates');
  assert.equal(r.listReplaced,0,'Obras list was rebuilt during repeated updates');
  assert.ok(r.listPreserved,'Obras cards lost DOM identity despite same IDs');
  assert.ok(r.same&&r.imagePreserved&&r.imageUrlPreserved&&r.arrowPreserved,'cover or navigation replaced');
  assert.equal(r.progress,'85%','progress update not visible');
  assert.ok(r.actions>=5,'Obras action buttons lost');
  assert.ok(r.okOther&&r.otherId==='work-2','opening a different work kept stale action targets');
  await page.addScriptTag({content:read(root,'obrix-assinaturas-main.js')});
  await page.addScriptTag({content:read(root,'obrix-assinaturas-economia-anual.js')});
  await page.evaluate(async()=>{await window.OBRIX_ASSINATURA.load();window.OBRIX_ASSINATURA.open();});
  await page.addScriptTag({content:read(root,'obrix-assinaturas-cobrancas-efi.js')});
  await page.addScriptTag({content:read(root,'obrix-visual-padrao-final.js')});
  await page.waitForTimeout(1620);
  const sub=await page.evaluate(async()=>{
    const box=document.getElementById('assPlanos');
    const first=box.querySelector('.assPlano');
    const pix=first.querySelector('[data-ass-plano]');
    const baseline=getComputedStyle(pix).backgroundColor;
    const initial=pix.style.getPropertyValue('background');
    window.OBRIX_VISUAL_PADRAO_FINAL.refresh();
    await new Promise(r=>setTimeout(r,100));
    const after=getComputedStyle(pix).backgroundColor;
    let reloads=0;
    const orig=window.OBRIX_ASSINATURA.load;
    window.OBRIX_ASSINATURA.load=function(){reloads++;return orig()};
    let mutations=0;
    const obs=new MutationObserver(recs=>{mutations+=recs.filter(m=>m.type==='childList').length});
    obs.observe(box,{childList:true,subtree:false});
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('pageshow'));
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise(r=>setTimeout(r,150));
    obs.disconnect();window.OBRIX_ASSINATURA.load=orig;
    return {initial,baseline,after,reloads,mutations,preserved:box.querySelector('.assPlano')===first,
      pay:box.querySelectorAll('[data-ass-plano],[data-ass-boleto],[data-ass-cob-efi]').length,
      footer:getComputedStyle(document.querySelector('#app>.bottom')).position};
  });
  assert.equal(sub.initial,'','global style override present on payment button');
  assert.equal(sub.baseline,sub.after,'payment button color oscillated');
  assert.equal(sub.mutations,0,'subscription cards replaced on redundant reconciliation');
  assert.ok(sub.preserved,'subscription card node identity not preserved');
  assert.ok(sub.reloads<=1,'duplicate focus/pageshow/visibility refresh calls');
  assert.ok(sub.pay>=4,'payment methods missing');
  assert.deepEqual(errors,[],'browser errors');
  console.log(JSON.stringify({profile,root,theme,obras:{rebuilds:r.replaced,imageStable:r.imagePreserved,progress:r.progress},assinatura:{themeStable:sub.baseline===sub.after,refreshes:sub.reloads,cardRebuilds:sub.mutations,paymentOptions:sub.pay},pass:true}));
 }finally{await browser.close()}
}
(async()=>{
  for(const root of variants)for(const theme of ['light','dark'])for(const [profile,engine,device] of profiles)
    await run(engine,profile,device,root,theme);
})().catch(e=>{console.error(e);process.exitCode=1});
