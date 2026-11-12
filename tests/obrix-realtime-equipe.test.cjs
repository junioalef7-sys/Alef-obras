'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const script=readFileSync(require('node:path').join(__dirname,'../obrix-equipe-realtime-sync.js'),'utf8');

function ambiente({hidden=false}={}){
  let id=0,refreshes=0,paints=0;
  const timers=new Map(),frames=[],handlers={};
  const vis={classList:{contains:()=>false}};
  const document={
    hidden,
    visibilityState:hidden?'hidden':'visible',
    getElementById:key=>key==='app'||key==='equipe'?vis:key==='funcs'?{textContent:''}:null,
    addEventListener:()=>{}
  };
  const channel={
    on(_event,filter,fn){handlers[filter.table]=fn;return this;},
    subscribe(){return this;}
  };
  const sb={channel:()=>channel,removeChannel:async()=>{}};
  const window={
    OBRIX_BACKEND:{profile:async()=>({empresa_id:'empresa-teste'}),init:async()=>sb},
    OBRIX_EQUIPE:{refresh:async()=>{refreshes++;}},
    OBRIX_EQUIPE_MODELO:{render:()=>{paints++;}},
    addEventListener:()=>{},
    dispatchEvent:()=>{}
  };
  const context={
    document,window,navigator:{onLine:true},
    funcionarios:[],diarias:[],vales:[],bonus:[],
    setTimeout:(fn,ms)=>{const key=++id;timers.set(key,{fn,ms});return key;},
    clearTimeout:key=>timers.delete(key),
    requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},
    Event:class Event{constructor(type){this.type=type;}},
    CustomEvent:class CustomEvent{constructor(type,init){this.type=type;this.detail=init?.detail;}},
    console:{warn:()=>{}}
  };
  vm.runInNewContext(script,context,{filename:'obrix-equipe-realtime-sync.js'});
  return {
    window,document,
    async iniciar(){await window.OBRIX_EQUIPE_REALTIME_SYNC.start();},
    emitir(table,id){
      assert.equal(typeof handlers[table],'function','Assinatura Realtime ausente: '+table);
      handlers[table]({eventType:'INSERT',new:{id,empresa_id:'empresa-teste',funcionario_id:'f1'}});
    },
    quadrosPendentes:()=>frames.length,
    pintarQuadros(){for(const fn of frames.splice(0))fn();},
    executarTimers(){
      const jobs=[...timers];
      for(const [key,t] of jobs){timers.delete(key);t.fn();}
    },
    async estabilizar(){for(let i=0;i<8;i++)await Promise.resolve();},
    refreshes:()=>refreshes,
    paints:()=>paints
  };
}

test('rajada de eventos Realtime gera uma pintura por frame e uma consulta completa',async()=>{
  const h=ambiente();await h.iniciar();
  for(let i=0;i<15;i++)h.emitir('diarias','diaria-'+i);
  assert.equal(h.quadrosPendentes(),1,'deve reagrupar repinturas');
  h.pintarQuadros();
  assert.equal(h.paints(),1);
  h.executarTimers();await h.estabilizar();
  assert.equal(h.refreshes(),1,'apenas uma consulta completa para a rajada');
  h.pintarQuadros();
  assert.equal(h.paints(),2,'uma pintura após reconciliar dados');
});
test('aba oculta não executa consultas nem redesenha equipe',async()=>{
  const h=ambiente();await h.iniciar();
  h.document.hidden=true;h.document.visibilityState='hidden';
  h.emitir('diarias','d-1');
  h.executarTimers();await h.estabilizar();
  assert.equal(h.refreshes(),0);
  assert.equal(h.quadrosPendentes(),0);
  assert.equal(h.paints(),0);
});
test('eventos de pagamento mantêm a reconciliação sem pintura provisória',async()=>{
  const h=ambiente();await h.iniciar();
  h.emitir('pagamentos_equipe','pg-1');
  assert.equal(h.quadrosPendentes(),0);
  h.executarTimers();await h.estabilizar();
  assert.equal(h.refreshes(),1);
  h.pintarQuadros();
  assert.equal(h.paints(),1);
});
