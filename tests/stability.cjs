const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const base=process.env.OBRIX_TEST_ROOT||'.';
function sandbox(){
 const timers=new Map(),frames=new Map(),events=[];let serial=0;
 const c={console,Promise,Map,Set,Date,Event:class{constructor(type){this.type=type}},CustomEvent:class{constructor(type,init){this.type=type;Object.assign(this,init)}},navigator:{onLine:true},document:{hidden:false,addEventListener(){},getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null},addEventListener(){},dispatchEvent:e=>events.push(e.type),setTimeout(fn,ms){timers.set(++serial,{fn,ms});return serial},clearTimeout:id=>timers.delete(id),setInterval(fn,ms){timers.set(++serial,{fn,ms,interval:true});return serial},requestAnimationFrame(fn){frames.set(++serial,fn);return serial},localStorage:{getItem:()=>null,setItem(){}},MutationObserver:class{constructor(fn){this.fn=fn}observe(){}}};c.window=c;vm.createContext(c);return {c,timers,frames,events,run(file){vm.runInContext(fs.readFileSync(base+'/'+file,'utf8'),c)}};
}
test('100 simultaneous initializations share one client and auth listener',async()=>{
 const h=sandbox();let clients=0,listeners=0,fetches=0;
 h.c.fetch=async()=>{fetches++;await Promise.resolve();return {ok:true,json:async()=>({url:'https://test.invalid',publishableKey:'test'})}};
 h.c.supabase={createClient(){clients++;return {auth:{onAuthStateChange(){listeners++}}}}};h.run('obrix-backend-adapter.js');
 const all=await Promise.all(Array.from({length:100},()=>h.c.OBRIX_BACKEND.init()));assert.equal(clients,1);assert.equal(listeners,1);assert.equal(fetches,1);assert.ok(all.every(x=>x===all[0]));
});
test('failed configuration can retry initialization',async()=>{
 const h=sandbox();let count=0;h.c.fetch=async()=>{if(++count===1)throw Error('offline');return {ok:true,json:async()=>({url:'test',publishableKey:'test'})}};h.c.supabase={createClient:()=>({auth:{onAuthStateChange(){}}})};h.run('obrix-backend-adapter.js');await assert.rejects(h.c.OBRIX_BACKEND.init());assert.ok(await h.c.OBRIX_BACKEND.init());
});
test('unchanged progress writes nothing over 36000 paints and still updates changed data',async()=>{
 const h=sandbox();let writes=0,text='0%',width='0%',value=50;
 const label={get textContent(){return text},set textContent(v){writes++;text=v}};
 const bar={style:{get width(){return width},set width(v){writes++;width=v}}};
 const row={querySelector:()=>bar,querySelectorAll:()=>[label]};const card={dataset:{id:'one'},querySelector:()=>row};h.c.document.querySelectorAll=()=>[card];
 h.c.obras=[{id:'one'}];h.c.OBRIX_BACKEND={profile:async()=>({empresa_id:'test'}),init:async()=>({from:()=>({select:()=>({eq:async()=>({data:[{obra_id:'one',progresso:value}]})})})})};h.run('obrix-checklist-progress-core.js');await h.c.OBRIX_PROGRESS_CORE.refresh();const initial=writes;for(let i=0;i<36000;i++)h.c.OBRIX_PROGRESS_CORE.paint();assert.equal(writes,initial);assert.equal(text,'50%');await h.c.OBRIX_PROGRESS_CORE.refresh();assert.equal(h.events.length,1);value=75;await h.c.OBRIX_PROGRESS_CORE.refresh();assert.equal(text,'75%');assert.equal(h.events.length,2);
});
test('realtime removal cannot recurse and late CLOSED cannot remove replacement',async()=>{
 const h=sandbox();let removed=0;const channels=[];const sb={channel(){const ch={on(){return this},subscribe(cb){this.cb=cb;return this}};channels.push(ch);return ch},removeChannel(ch){if(++removed>10)throw Error('recursive removal');ch.cb('CLOSED');return Promise.resolve()}};h.c.OBRIX_BACKEND={profile:async()=>({empresa_id:'test'}),init:async()=>sb};h.run('obrix-equipe-realtime-sync.js');await h.c.OBRIX_EQUIPE_REALTIME_SYNC.start();channels[0].cb('CHANNEL_ERROR');assert.equal(removed,1);await h.c.OBRIX_EQUIPE_REALTIME_SYNC.start();channels[0].cb('CLOSED');assert.equal(removed,1);assert.equal(h.c.OBRIX_EQUIPE_REALTIME_SYNC.status().ativo,true);
});
