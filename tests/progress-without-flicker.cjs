const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const base=process.env.OBRIX_TEST_ROOT||'.';
function sandbox(){
 const timers=new Map(),frames=new Map(),events=[];let serial=0;
 const c={console,Promise,Map,Set,Date,Event:class{constructor(type){this.type=type}},CustomEvent:class{constructor(type,init){this.type=type;Object.assign(this,init)}},navigator:{onLine:true},document:{hidden:false,addEventListener(){},getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null},addEventListener(){},dispatchEvent:e=>events.push(e.type),setTimeout(fn,ms){timers.set(++serial,{fn,ms});return serial},clearTimeout:id=>timers.delete(id),setInterval(fn,ms){timers.set(++serial,{fn,ms,interval:true});return serial},requestAnimationFrame(fn){frames.set(++serial,fn);return serial},localStorage:{getItem:()=>null,setItem(){}},MutationObserver:class{constructor(fn){this.fn=fn}observe(){}}};c.window=c;vm.createContext(c);return {c,timers,frames,events,run(file){vm.runInContext(fs.readFileSync(base+'/'+file,'utf8'),c)}};
}
test('unchanged progress writes nothing over 36000 paints and still updates changed data',async()=>{
 const h=sandbox();let writes=0,text='0%',width='0%',value=50;
 const label={get textContent(){return text},set textContent(v){writes++;text=v}};
 const bar={style:{get width(){return width},set width(v){writes++;width=v}}};
 const row={querySelector:()=>bar,querySelectorAll:()=>[label]};const card={dataset:{id:'one'},querySelector:()=>row};h.c.document.querySelectorAll=()=>[card];
 h.c.obras=[{id:'one'}];h.c.OBRIX_BACKEND={profile:async()=>({empresa_id:'test'}),init:async()=>({from:()=>({select:()=>({eq:async()=>({data:[{obra_id:'one',progresso:value}]})})})})};h.run('obrix-checklist-progress-core.js');await h.c.OBRIX_PROGRESS_CORE.refresh();const initial=writes;for(let i=0;i<36000;i++)h.c.OBRIX_PROGRESS_CORE.paint();assert.equal(writes,initial);assert.equal(text,'50%');await h.c.OBRIX_PROGRESS_CORE.refresh();assert.equal(h.events.length,1);value=75;await h.c.OBRIX_PROGRESS_CORE.refresh();assert.equal(text,'75%');assert.equal(h.events.length,2);
});
