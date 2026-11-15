'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../obrix-sync-geral-leve-20261108.js'),'utf8');
const COMPANY='760a3847-fba3-40cf-bf5b-444c6f8305eb';
function device(mod='notas'){
 let active=mod,clock=100000,id=0,focused=null;const timers=new Map(),calls=[],channels=[],events={window:new Map(),document:new Map()};
 const ids={notas:'notasMain',orcamentos:'orcamentosMain',documentos:'documentosMain',diario:'diarioMain',equipe:'equipe',obras:'obras',financeiro:'financeiroMain',estoque:'estoqueMain',relatorios:'relatoriosMain'};
 const sections=Object.fromEntries(Object.entries(ids).map(([k,v])=>[v,{id:v,contains:x=>x?.section===v,classList:{contains:what=>what==='hidden'&&active!==k}}]));
 const app={classList:{contains:()=>false}},finForm={classList:{contains:()=>true}};
 const listen=where=>(name,fn)=>{const arr=events[where].get(name)||[];arr.push(fn);events[where].set(name,arr)};
 const document={hidden:false,get activeElement(){return focused},getElementById:name=>name==='app'?app:name==='fmForm'?finForm:sections[name]||null,addEventListener:listen('document')};
 const window={addEventListener:listen('window'),dispatchEvent:()=>{}},navigator={onLine:true};
 const timeout=(fn,delay=0)=>{const key=++id;timers.set(key,{at:clock+delay,fn});return key};
 const interval=(fn,delay)=>{const key=++id;timers.set(key,{at:clock+delay,fn,every:delay});return key};
 const supabase={channel(name){const c={name,events:[],on(_,params,fn){this.events.push({params,fn});return this},subscribe(status){this.status=status;channels.push(this);timeout(()=>status('SUBSCRIBED'),10);return this}};return c},removeChannel:async()=>{}};
 window.OBRIX_BACKEND={profile:async()=>({empresa_id:COMPANY}),init:async()=>supabase};
 const modules={notas:'OBRIX_NOTAS',orcamentos:'OBRIX_ORCAMENTOS',documentos:'OBRIX_DOCUMENTOS',diario:'OBRIX_DIARIO',equipe:'OBRIX_EQUIPE',obras:'OBRIX_OBRAS_DADOS',financeiro:'OBRIX_FIN',estoque:'OBRIX_EST'};
 for(const [key,which] of Object.entries(modules))window[which]={load:async()=>{calls.push(key)},refresh:async()=>{calls.push(key)},render:async()=>{calls.push(key)},sync:async()=>{calls.push(key)}};
 const context={window,document,navigator,console:{warn(){}},setTimeout:timeout,clearTimeout:id=>timers.delete(id),setInterval:interval,Date:{now:()=>clock},CustomEvent:class{constructor(name,options){this.type=name;this.detail=options?.detail}}};
 vm.runInNewContext(source,context,{filename:'obrix-sync-geral-leve-20261108.js'});
 async function advance(ms){
  const until=clock+ms;let steps=0;
  while(true){
   const n=[...timers.entries()].filter(([,t])=>t.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];
   if(!n)break;
   assert.ok(++steps<1000,'Temporizadores em loop');
   const [key,t]=n;clock=t.at;if(t.every)t.at+=t.every;else timers.delete(key);
   t.fn();for(let j=0;j<8;j++)await Promise.resolve();
  }
  clock=until;for(let j=0;j<8;j++)await Promise.resolve();
 }
 function event(name,where='window',data={}){for(const fn of events[where].get(name)||[])fn(data)}
 function remote(table){
  for(const c of channels)for(const e of c.events)if(e.params.table===table)e.fn({eventType:'INSERT',new:{empresa_id:COMPANY}});
 }
 return{advance,event,remote,calls,channels,focus:v=>{focused=v},screen:page=>{active=page},finForm};
}
test('segundo registro remoto aparece sem fechar nem recarregar',async()=>{
 const d=device();await d.advance(1000);
 const b=d.calls.length;d.remote('notas');await d.advance(1000);const first=d.calls.length;
 d.remote('notas');await d.advance(1000);
 assert.ok(first>b && d.calls.length>first);
});
test('campo de busca focado nao impede registros seguintes',async()=>{
 const d=device();d.focus({tagName:'INPUT',type:'search',id:'notaBusca',section:'notasMain',closest:()=>null});
 await d.advance(1000);const b=d.calls.length;
 d.remote('notas');await d.advance(1000);d.remote('notas');await d.advance(1100);
 assert.ok(d.calls.length>=b+2);
});
test('texto em edicao aguarda perder foco antes de recarregar',async()=>{
 const d=device(),field={tagName:'TEXTAREA',id:'notaConteudo',section:'notasMain',closest:()=>null};
 d.focus(field);await d.advance(1000);const b=d.calls.length;
 d.remote('notas');await d.advance(1000);assert.equal(d.calls.length,b);
 d.focus(null);d.event('focusout','document',{target:field});await d.advance(1000);
 assert.ok(d.calls.length>b);
});
test('alteracao recebida em tela oculta atualiza ao retornar',async()=>{
 const d=device('documentos');await d.advance(1000);
 d.remote('notas');await d.advance(1000);
 const b=d.calls.filter(x=>x==='notas').length;
 d.screen('notas');d.event('focus');await d.advance(1000);
 assert.ok(d.calls.filter(x=>x==='notas').length>b);
});
test('sem WebSocket novo, reconcilia a tela visivel em menos de 20s',async()=>{
 const d=device();await d.advance(1000);const b=d.calls.length;
 await d.advance(18500);assert.ok(d.calls.length>b);
});
test('reconecta apos CHANNEL_ERROR e aceita novo registro',async()=>{
 const d=device();await d.advance(1000);d.channels.at(-1).status('CHANNEL_ERROR');
 await d.advance(5000);assert.ok(d.channels.length>1);
 const b=d.calls.length;d.remote('notas');await d.advance(1100);assert.ok(d.calls.length>b);
});
test('tres sessoes recebem duas atualizacoes independentes',async()=>{
 const ds=[device(),device(),device()];await Promise.all(ds.map(d=>d.advance(1000)));
 const previous=ds.map(d=>d.calls.length);
 for(let i=0;i<2;i++){ds.forEach(d=>d.remote('notas'));await Promise.all(ds.map(d=>d.advance(1000)))}
 ds.forEach((d,i)=>assert.ok(d.calls.length>=previous[i]+2));
});
test('formulario financeiro aberto nao e substituido',async()=>{
 const d=device('financeiro');d.finForm.classList.contains=()=>false;
 await d.advance(1000);assert.ok(!d.calls.includes('financeiro'));
});
