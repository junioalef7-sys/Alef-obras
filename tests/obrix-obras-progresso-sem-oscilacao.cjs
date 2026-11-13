const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit,devices}=require('playwright');
const roots=['.','obrix-android-inicial'];
const profiles=[['iPhone WebKit',webkit,devices['iPhone 13']],['Android Chromium',chromium,devices['Pixel 7']],['Desktop Chromium',chromium,{viewport:{width:1366,height:768}}]];
const origin='https://obrix-progress-test.invalid/';
const html='<!doctype html><html data-theme="light"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="app"><main id="inicio" class="hidden"></main><main id="obras"><div class="hero"><h1>Obras</h1></div><div class="sectionHead"><strong>Obras</strong></div><div id="listaObras"></div></main><div class="bottom"><button>Início</button><button>Obras</button><button>Financeiro</button><button>Equipe</button></div></div></body></html>';
const source=(root,file)=>fs.readFileSync(root+'/'+file,'utf8');
async function run(engine,label,device,root,theme){
 const browser=await engine.launch();
 try{
  const page=await browser.newPage(device),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(origin+'**',route=>route.fulfill({status:200,contentType:'text/html',body:html}));
  await page.goto(origin+'index.html');
  await page.evaluate(theme=>{
    document.documentElement.dataset.theme=theme;
    window.obras=[
      {id:'a',nome:'Refeitório',cliente:'Cliente 1',status:'andamento',progresso:67,valor_contrato:50000},
      {id:'b',nome:'Escola',cliente:'Cliente 2',status:'andamento',progresso:40,valor_contrato:45000}
    ];
    window.financeiro=[];window.extras=[];
    window.__rows=[{obra_id:'a',progresso:70}];
    window.OBRIX_BACKEND={
      profile:async()=>({empresa_id:'company'}),
      init:async()=>({
        from:()=>({select(){return this},eq(){return Promise.resolve({data:window.__rows,error:null})}}),
        channel:()=>({on(){return this},subscribe(){return this}}),
        removeChannel(){}
      })
    };
  },theme);
  await page.addScriptTag({content:source(root,'obrix-obras-fiel.js')});
  const start=await page.evaluate(()=>[...document.querySelectorAll('#listaObras .obxStatusLinha>b')].map(n=>n.textContent));
  assert.deepEqual(start,['67%','40%'],'initial work percentages should remain until checklist snapshot');
  await page.addScriptTag({content:source(root,'obrix-checklist-progress-core.js')});
  const result=await page.evaluate(async()=>{
    const cards=[...document.querySelectorAll('#listaObras .obxObraCard')];
    let cardReplacements=0,progressWobbles=[];
    const container=document.querySelector('#listaObras .obxCards');
    const observer=new MutationObserver(records=>{
      for(const record of records){
        if(record.type==='childList'&&(record.target===container)&&(record.addedNodes.length||record.removedNodes.length))
          cardReplacements++;
      }
      progressWobbles.push([document.querySelectorAll('#listaObras .obxStatusLinha>b')[0]?.textContent,
        document.querySelectorAll('#listaObras .obxStatusLinha>b')[1]?.textContent]);
    });
    observer.observe(document.getElementById('listaObras'),{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style']});
    await window.OBRIX_PROGRESS_CORE.refresh();
    window.OBRIX_OBRAS_FIEL.render();
    const first=[...document.querySelectorAll('#listaObras .obxStatusLinha>b')].map(x=>x.textContent);
    window.__rows=[];await window.OBRIX_PROGRESS_CORE.refresh();
    window.OBRIX_OBRAS_FIEL.render();
    const second=[...document.querySelectorAll('#listaObras .obxStatusLinha>b')].map(x=>x.textContent);
    window.obras[0].cliente='Cliente atualizado';
    for(let i=0;i<40;i++)window.OBRIX_OBRAS_FIEL.render();
    await new Promise(r=>setTimeout(r,90));
    observer.disconnect();
    const last=[...document.querySelectorAll('#listaObras .obxStatusLinha>b')].map(x=>x.textContent);
    const sameCards=cards.every((c,i)=>document.querySelectorAll('#listaObras .obxObraCard')[i]===c);
    const statuses=[...document.querySelectorAll('#listaObras .obxStatus')].map(e=>({color:getComputedStyle(e).color,fill:getComputedStyle(e).webkitTextFillColor}));
    return {first,second,last,cardReplacements,sameCards,statuses,
      secondWorkEverZero:progressWobbles.some(row=>row[1]==='0%'),
      cacheProgress:window.obras[1].progresso};
  });
  assert.deepEqual(result.first,['70%','40%'],'unknown checklist incorrectly reset second work to zero');
  assert.deepEqual(result.second,['0%','40%'],'deleting a previously known checklist must reset only its own work');
  assert.deepEqual(result.last,['0%','40%'],'remote updates must not change unrelated progress');
  assert.equal(result.secondWorkEverZero,false,'unrelated work flashed to zero during updates');
  assert.equal(result.cardReplacements,0,'works cards were re-mounted');
  assert.ok(result.sameCards,'same work card identities changed');
  assert.equal(result.cacheProgress,40);
  for(const status of result.statuses){assert.equal(status.color,'rgb(255, 255, 255)');assert.equal(status.fill,'rgb(255, 255, 255)')}
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({device:label,variant:root,theme,
    initial:start,afterChecklist:result.first,afterDeletion:result.second,
    cardReplacements:result.cardReplacements,unrelatedWorkStable:!result.secondWorkEverZero,pass:true}));
 }finally{await browser.close()}
}
(async()=>{for(const root of roots)for(const theme of ['light','dark'])for(const [label,engine,device] of profiles)await run(engine,label,device,root,theme)})().catch(e=>{console.error(e);process.exitCode=1});
