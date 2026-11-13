const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root=process.env.OBRIX_TEST_ROOT||'.';
const core=fs.readFileSync(root+'/obrix-core-main.js','utf8');
const offline=fs.readFileSync(root+'/obrix-obras-offline.js','utf8');
function helper(s){
  const fn=s.match(/^function obrasIguaisSemProgresso\(a,b\)\{[\s\S]*?^\}/m);
  assert.ok(fn,'comparison function must exist');
  return vm.runInNewContext('('+fn[0]+')');
}
for(const [name,src] of [['core',core],['offline',offline]]){
  test(name+': derived checklist progress does not invalidate works',()=>{
    const eq=helper(src);
    const local=[{id:'a',nome:'Escola',status:'andamento',progresso:65,atualizado_em:'2026-11-13'}];
    const remote=[{status:'andamento',id:'a',atualizado_em:'2026-11-13',nome:'Escola'}];
    assert.equal(eq(local,remote),true,'different key order and derived progress should not re-render');
    assert.equal(eq(local,[{...remote,nome:'Escola reformada'}]),false,'real edits must refresh');
    assert.equal(eq(local,[{...remote,status:'concluida'}]),false,'status changes must refresh');
    assert.equal(eq(local,[]),false,'deleted works must refresh');
    assert.equal(eq(local,[{...remote,atualizado_em:'2026-11-14'}]),false,'timestamp changes must refresh');
  });
}
test('offline refresh with unchanged remote data retains progress and avoids repaint',async()=>{
  const store=new Map(),works=[{id:'a',nome:'Escola',status:'andamento',progresso:65,atualizado_em:'2026-11-13'}];
  let remote=[{id:'a',nome:'Escola',status:'andamento',atualizado_em:'2026-11-13'}],renders=0;
  const c={console,Promise,Map,Set,Date,JSON,Array,profile:{empresa_id:'company'},obras:works,
    navigator:{onLine:true},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
    document:{createElement:()=>({}),head:{appendChild(){}},documentElement:{},addEventListener(){},getElementById(){return null},querySelector(){return null},querySelectorAll(){return []}},
    MutationObserver:class{observe(){}},setTimeout(){return 0},clearTimeout(){},setInterval(){return 0},
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},
    addEventListener(){},dispatchEvent(){},
  };
  c.window=c;c.OBRIX_DASH={sync(){}};c.OBRIX_OBRAS={render(){renders++}};
  c.OBRIX_BACKEND={init:async()=>({from:()=>({select(){return this},eq(){return this},order:async()=>({data:remote,error:null})})})};
  vm.createContext(c);vm.runInContext(offline,c);
  const ok=await c.OBRIX_OFFLINE_OBRAS.refresh();
  assert.equal(ok,true);assert.equal(renders,0);assert.equal(c.window.obras[0].progresso,65);
  remote=[{...remote[0],nome:'Escola reformada'}];
  await c.OBRIX_OFFLINE_OBRAS.refresh();
  assert.equal(renders,1);assert.equal(c.window.obras[0].nome,'Escola reformada');
  await c.OBRIX_OFFLINE_OBRAS.refresh();
  assert.equal(renders,1,'unchanged refresh must not re-render again');
});
test('core retains checklist progress when only extra-service records change',()=>{
  assert.ok(core.includes('const mesmasObras=obrasIguaisSemProgresso(obras,novos)'));
  assert.ok(core.includes('if(!mesmasObras)obras=novos'));
  assert.ok(core.includes('if(!mesmosExtras)extras=novosExtras'));
});
