(()=>{'use strict';
if(window.__OBRIX_OFFLINE_V2)return;window.__OBRIX_OFFLINE_V2=true;

const VERSION=2;
const BASE_KEY='obrix_offline_base_v3';
const DB_PREFIX='obrix_offline_v2_db:';
const QUEUE_PREFIX='obrix_offline_v2_queue:';
const META_PREFIX='obrix_offline_v2_meta:';
const OP_TABLES=[
  'obras','servicos_extras','checklist_itens','funcionarios','diarias','faltas','vales','bonus_extras','financeiro',
  'pagamentos_equipe','pagamento_diarias','pagamento_vales','pagamento_bonus_extras','orcamentos','orcamento_itens',
  'materiais','estoques','estoque_saldos','estoque_movimentacoes','relatorios_fotograficos','fotos_obra','diarios_obra',
  'diario_equipe','diario_atividades','documentos','relatorios','clientes','fornecedores','compras','compra_itens','relatorio_fotos','notas'
];
const CREATED_EM=new Set(['obras','servicos_extras','checklist_itens','funcionarios','diarias','faltas','vales','bonus_extras','financeiro','pagamentos_equipe','pagamento_diarias','pagamento_vales','pagamento_bonus_extras','orcamentos','orcamento_itens','materiais','estoques','estoque_movimentacoes','relatorios_fotograficos','fotos_obra','diarios_obra','diario_equipe','diario_atividades','clientes','fornecedores','compras','compra_itens','relatorio_fotos','notas']);
const UPDATED_EM=new Set(['obras','servicos_extras','checklist_itens','funcionarios','financeiro','orcamentos','materiais','estoque_saldos','relatorios_fotograficos','fotos_obra','diarios_obra','clientes','fornecedores','compras','relatorio_fotos','notas']);
const CREATED_AT=new Set(['documentos','relatorios']);
const UPDATED_AT=new Set(['documentos']);

const read=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(_){return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};
const now=()=>new Date().toISOString();
const uuid=()=>{try{return crypto.randomUUID()}catch(_){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)})}};
const same=(a,b)=>a===b||(a!=null&&b!=null&&String(a)===String(b));

let nativeOnlineGetter=null;
try{let p=Object.getPrototypeOf(navigator);while(p&&!nativeOnlineGetter){const d=Object.getOwnPropertyDescriptor(p,'onLine');if(d?.get)nativeOnlineGetter=d.get;p=Object.getPrototypeOf(p)}}catch(_){}
const realOnline=()=>{try{return nativeOnlineGetter?!!nativeOnlineGetter.call(navigator):!!navigator.onLine}catch(_){return !!navigator.onLine}};
const base=()=>read(BASE_KEY,null);
const profileLocal=()=>base()?.profile||null;
const empresa=()=>profileLocal()?.empresa_id||null;
const dbKey=()=>empresa()?DB_PREFIX+empresa():null;
const queueKey=()=>empresa()?QUEUE_PREFIX+empresa():null;
const metaKey=()=>empresa()?META_PREFIX+empresa():null;
function getDb(){const k=dbKey();if(!k)return{version:VERSION,tables:{},savedAt:null};const d=read(k,null);return d&&typeof d==='object'?{version:VERSION,tables:d.tables||{},savedAt:d.savedAt||null}:{version:VERSION,tables:{},savedAt:null}}
function putDb(d){const k=dbKey();if(!k)return false;d.version=VERSION;d.savedAt=now();return write(k,d)}
function tableRows(table){const d=getDb();const rows=d.tables?.[table];return Array.isArray(rows)?rows.map(x=>({...x})):[]}
function saveTable(table,rows){const d=getDb();d.tables[table]=Array.isArray(rows)?rows.map(x=>({...x})):[];const ok=putDb(d);if(ok)mirrorLegacy(table,d.tables[table]);return ok}
function getQueue(){const k=queueKey();const q=k?read(k,[]):[];return Array.isArray(q)?q:[]}
function putQueue(q){const k=queueKey();if(!k)return false;const ok=write(k,Array.isArray(q)?q:[]);if(ok)window.dispatchEvent(new CustomEvent('obrix:offline-v2-queue',{detail:{pending:q.length}}));return ok}
function enqueue(op){const q=getQueue();q.push({qid:uuid(),at:now(),...op});putQueue(q)}
function getMeta(){const k=metaKey();return k?read(k,{}):{}}
function putMeta(m){const k=metaKey();return k?write(k,m):false}

function mirrorLegacy(table,rows){
  const b=base(),e=empresa();if(!b?.profile?.empresa_id||!e)return;
  const next={...b,updatedAt:now()};
  if(table==='obras'){next.obras=rows;write('obrix_obras_cache_v1:'+e,rows)}
  if(table==='funcionarios')next.funcionarios=rows;
  if(table==='diarias')next.diarias=rows;
  if(table==='vales')next.vales=rows;
  if(table==='bonus_extras')next.bonus=rows;
  if(table==='financeiro')next.financeiro=rows;
  if(table==='servicos_extras')next.extras=rows;
  if(['funcionarios','diarias','faltas'].includes(table)){
    const old=read('obrix_equipe_cache_v1:'+e,{funcionarios:next.funcionarios||b.funcionarios||[],diarias:next.diarias||b.diarias||[],faltas:[]});
    write('obrix_equipe_cache_v1:'+e,{funcionarios:table==='funcionarios'?rows:(next.funcionarios||old.funcionarios||[]),diarias:table==='diarias'?rows:(next.diarias||old.diarias||[]),faltas:table==='faltas'?rows:(old.faltas||[]),savedAt:now()});
  }
  if(['financeiro','servicos_extras','checklist_itens'].includes(table)){
    const old=read('obrix_financeiro_cache_v1:'+e,{financeiro:next.financeiro||b.financeiro||[],extras:next.extras||b.extras||[],checklists:[]});
    write('obrix_financeiro_cache_v1:'+e,{financeiro:table==='financeiro'?rows:(next.financeiro||old.financeiro||[]),extras:table==='servicos_extras'?rows:(next.extras||old.extras||[]),checklists:table==='checklist_itens'?rows:(old.checklists||[]),savedAt:now()});
  }
  write(BASE_KEY,next);
  window.dispatchEvent(new CustomEvent('obrix:offline-v2-change',{detail:{table,count:rows.length}}));
}

function seedLegacy(){
  const e=empresa(),b=base();if(!e||!b?.profile)return false;
  const d=getDb(),t=d.tables;
  const setIfEmpty=(name,rows)=>{if(!Array.isArray(t[name])||!t[name].length){if(Array.isArray(rows)&&rows.length)t[name]=rows.map(x=>({...x}))}};
  setIfEmpty('obras',b.obras);setIfEmpty('funcionarios',b.funcionarios);setIfEmpty('financeiro',b.financeiro);setIfEmpty('servicos_extras',b.extras);setIfEmpty('diarias',b.diarias);setIfEmpty('vales',b.vales);setIfEmpty('bonus_extras',b.bonus);
  const ec=read('obrix_equipe_cache_v1:'+e,null);if(ec){setIfEmpty('funcionarios',ec.funcionarios);setIfEmpty('diarias',ec.diarias);setIfEmpty('faltas',ec.faltas)}
  const fc=read('obrix_financeiro_cache_v1:'+e,null);if(fc){setIfEmpty('financeiro',fc.financeiro);setIfEmpty('servicos_extras',fc.extras);setIfEmpty('checklist_itens',fc.checklists)}
  putDb(d);return true;
}

function defaults(table,row){
  const x={...row};if(!x.id)x.id=uuid();
  if(CREATED_EM.has(table)&&!x.criado_em)x.criado_em=now();
  if(UPDATED_EM.has(table)&&!x.atualizado_em)x.atualizado_em=now();
  if(CREATED_AT.has(table)&&!x.created_at)x.created_at=now();
  if(UPDATED_AT.has(table)&&!x.updated_at)x.updated_at=now();
  if(table==='orcamentos'&&x.numero==null){const max=Math.max(0,...tableRows(table).map(r=>Number(r.numero||0)));x.numero=max+1}
  if(table==='compras'&&x.numero_pedido==null){const max=Math.max(0,...tableRows(table).map(r=>Number(r.numero_pedido||0)));x.numero_pedido=max+1}
  return x;
}
function testFilter(row,f){
  const a=row?.[f.col],v=f.val;
  if(f.op==='eq')return same(a,v);if(f.op==='neq')return !same(a,v);if(f.op==='in')return (v||[]).some(x=>same(a,x));if(f.op==='is')return a===v;
  if(f.op==='gte')return a>=v;if(f.op==='lte')return a<=v;if(f.op==='gt')return a>v;if(f.op==='lt')return a<v;
  if(f.op==='like'||f.op==='ilike'){const s=String(a??''),p=String(v??'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/%/g,'.*').replace(/_/g,'.');return new RegExp('^'+p+'$',f.op==='ilike'?'i':'').test(s)}
  if(f.op==='contains'){if(Array.isArray(a))return (Array.isArray(v)?v:[v]).every(x=>a.some(y=>same(y,x)));if(a&&typeof a==='object'&&v&&typeof v==='object')return Object.entries(v).every(([k,x])=>same(a[k],x));return false}
  if(f.op==='not'){const inner={col:f.col,op:f.inner||'eq',val:v};return !testFilter(row,inner)}
  return true;
}
function parseOr(expr,row){try{return String(expr||'').split(',').some(part=>{const m=part.match(/^([^\.]+)\.(eq|neq|gte|lte|gt|lt|like|ilike|is)\.(.*)$/);if(!m)return false;let val=m[3];if(val==='null')val=null;else if(val==='true')val=true;else if(val==='false')val=false;return testFilter(row,{col:m[1],op:m[2],val})})}catch(_){return true}}

class LocalQuery{
  constructor(table){this.table=table;this.action='select';this.payload=null;this.filters=[];this.orders=[];this._limit=null;this._range=null;this._single=false;this._maybe=false;this._head=false;this._count=null;this._select='*';this._upsertOptions=null;this._or=[]}
  select(cols='*',opts={}){this._select=cols||'*';this._head=!!opts?.head;this._count=opts?.count||null;return this}
  insert(v){this.action='insert';this.payload=v;return this}
  update(v){this.action='update';this.payload=v||{};return this}
  delete(){this.action='delete';return this}
  upsert(v,opts={}){this.action='upsert';this.payload=v;this._upsertOptions=opts||{};return this}
  eq(c,v){this.filters.push({col:c,op:'eq',val:v});return this} neq(c,v){this.filters.push({col:c,op:'neq',val:v});return this}
  in(c,v){this.filters.push({col:c,op:'in',val:Array.isArray(v)?v:[]});return this} is(c,v){this.filters.push({col:c,op:'is',val:v});return this}
  gte(c,v){this.filters.push({col:c,op:'gte',val:v});return this} lte(c,v){this.filters.push({col:c,op:'lte',val:v});return this}
  gt(c,v){this.filters.push({col:c,op:'gt',val:v});return this} lt(c,v){this.filters.push({col:c,op:'lt',val:v});return this}
  like(c,v){this.filters.push({col:c,op:'like',val:v});return this} ilike(c,v){this.filters.push({col:c,op:'ilike',val:v});return this}
  contains(c,v){this.filters.push({col:c,op:'contains',val:v});return this} not(c,op,v){this.filters.push({col:c,op:'not',inner:op,val:v});return this}
  match(obj={}){Object.entries(obj).forEach(([c,v])=>this.eq(c,v));return this} or(expr){this._or.push(expr);return this}
  filter(c,op,v){const map={eq:'eq',neq:'neq',gte:'gte',lte:'lte',gt:'gt',lt:'lt',like:'like',ilike:'ilike',is:'is',in:'in'};const m=map[op]||'eq';return this[m](c,v)}
  order(c,o={}){this.orders.push({col:c,ascending:o?.ascending!==false});return this} limit(n){this._limit=Number(n);return this}
  range(a,b){this._range=[Number(a),Number(b)];return this} single(){this._single=true;return this} maybeSingle(){this._maybe=true;return this}
  then(resolve,reject){return this.execute().then(resolve,reject)}
  async execute(){
    try{
      let rows=tableRows(this.table),changed=[];
      const matches=r=>this.filters.every(f=>testFilter(r,f))&&this._or.every(x=>parseOr(x,r));
      if(this.action==='insert'){
        const xs=(Array.isArray(this.payload)?this.payload:[this.payload]).filter(Boolean).map(x=>defaults(this.table,x));rows.push(...xs);saveTable(this.table,rows);enqueue({type:'insert',table:this.table,rows:xs});changed=xs;
      }else if(this.action==='update'){
        const stamp=UPDATED_EM.has(this.table)?{atualizado_em:now()}:UPDATED_AT.has(this.table)?{updated_at:now()}:{};
        rows=rows.map(r=>{if(!matches(r))return r;const n={...r,...this.payload,...stamp};changed.push(n);return n});saveTable(this.table,rows);enqueue({type:'update',table:this.table,payload:{...this.payload,...stamp},filters:this.filters});
      }else if(this.action==='delete'){
        const keep=[];for(const r of rows){if(matches(r))changed.push(r);else keep.push(r)}rows=keep;saveTable(this.table,rows);enqueue({type:'delete',table:this.table,filters:this.filters});
      }else if(this.action==='upsert'){
        const xs=(Array.isArray(this.payload)?this.payload:[this.payload]).filter(Boolean).map(x=>defaults(this.table,x));const keys=String(this._upsertOptions?.onConflict||'id').split(',').map(x=>x.trim()).filter(Boolean);
        for(const x of xs){const i=rows.findIndex(r=>keys.every(k=>same(r[k],x[k])));if(i>=0){rows[i]={...rows[i],...x};changed.push(rows[i])}else{rows.push(x);changed.push(x)}}saveTable(this.table,rows);enqueue({type:'upsert',table:this.table,rows:xs,options:this._upsertOptions||{}});
      }else changed=rows.filter(matches);
      let out=this.action==='select'?changed:changed;
      for(let i=this.orders.length-1;i>=0;i--){const o=this.orders[i];out=out.slice().sort((a,b)=>{const av=a?.[o.col],bv=b?.[o.col];if(same(av,bv))return 0;if(av==null)return 1;if(bv==null)return-1;return(av>bv?1:-1)*(o.ascending?1:-1)})}
      const count=out.length;if(this._range)out=out.slice(this._range[0],this._range[1]+1);if(Number.isFinite(this._limit))out=out.slice(0,this._limit);
      if(this._head)return{data:null,error:null,count};
      if(this._single){if(out.length!==1)return{data:null,error:{message:out.length?'JSON object requested, multiple rows returned':'JSON object requested, no rows returned'},count};return{data:out[0],error:null,count}}
      if(this._maybe){if(out.length>1)return{data:null,error:{message:'JSON object requested, multiple rows returned'},count};return{data:out[0]||null,error:null,count}}
      return{data:out,error:null,count:this._count?count:null};
    }catch(e){return{data:null,error:{message:e?.message||String(e)}}}
  }
}

let originals=null;
function localUser(){const m=getMeta(),p=profileLocal();return m.user||{id:m.user_id||null,email:p?.email||null}}
const noopChannel=()=>{const c={on(){return c},subscribe(cb){try{cb?.('SUBSCRIBED')}catch(_){}return c},unsubscribe(){return Promise.resolve('ok')}};return c};
const localClient={
  from:t=>new LocalQuery(t),
  auth:{
    getUser:async()=>({data:{user:localUser()},error:null}),
    getSession:async()=>({data:{session:{user:localUser(),access_token:'offline-local'}},error:null}),
    signInWithPassword:async()=>({data:{user:localUser(),session:{user:localUser()}},error:null}),
    signOut:async()=>({error:null}),
    onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})
  },
  channel:()=>noopChannel(),removeChannel:async()=>true,
  rpc:async(name,args)=>localRpc(name,args||{}),
  functions:{invoke:async()=>({data:null,error:{message:'Este recurso exige internet.'}})},
  storage:{from:()=>({upload:async()=>({data:null,error:{message:'Envio de arquivos exige internet.'}}),remove:async()=>({data:null,error:{message:'Remoção de arquivos exige internet.'}}),getPublicUrl:path=>({data:{publicUrl:path||''}}),createSignedUrl:async()=>({data:null,error:{message:'Visualização remota exige internet.'}})})}
};

async function localRpc(name,a){
  try{
    const e=empresa();if(!e)throw new Error('Conta offline não preparada neste aparelho.');
    const q=t=>localClient.from(t);
    const one=(t,pred)=>tableRows(t).find(pred);
    const saldoRow=(mat,est)=>one('estoque_saldos',x=>same(x.material_id,mat)&&same(x.estoque_id,est));
    const setSaldo=async(mat,est,qty)=>{const s=saldoRow(mat,est);if(s)return await q('estoque_saldos').update({quantidade:Math.max(0,Number(qty||0)),atualizado_em:now()}).eq('id',s.id);return await q('estoque_saldos').insert({empresa_id:e,material_id:mat,estoque_id:est,quantidade:Math.max(0,Number(qty||0)),atualizado_em:now()})};
    if(name==='obrix_registrar_entrada_estoque'){
      const qty=Number(a.p_quantidade||0),cost=Number(a.p_custo_unitario||0),old=saldoRow(a.p_material_id,a.p_estoque_id);if(qty<=0)throw new Error('Quantidade inválida.');await setSaldo(a.p_material_id,a.p_estoque_id,Number(old?.quantidade||0)+qty);await q('estoque_movimentacoes').insert({empresa_id:e,material_id:a.p_material_id,estoque_destino_id:a.p_estoque_id,tipo:'entrada',quantidade:qty,custo_unitario:cost||null,valor_total:cost?qty*cost:null,data:a.p_data||new Date().toISOString().slice(0,10),documento:a.p_documento||null,observacoes:a.p_observacoes||null});if(cost>0){const m=one('materiais',x=>same(x.id,a.p_material_id));if(m)await q('materiais').update({custo_medio:cost}).eq('id',m.id)}return{data:true,error:null};
    }
    if(name==='obrix_registrar_saida_estoque'){
      const qty=Number(a.p_quantidade||0),old=saldoRow(a.p_material_id,a.p_estoque_id),have=Number(old?.quantidade||0);if(qty<=0||qty>have)throw new Error('Saldo insuficiente.');await setSaldo(a.p_material_id,a.p_estoque_id,have-qty);await q('estoque_movimentacoes').insert({empresa_id:e,material_id:a.p_material_id,estoque_origem_id:a.p_estoque_id,obra_id:a.p_obra_id||null,tipo:'saida',quantidade:qty,data:a.p_data||new Date().toISOString().slice(0,10),documento:a.p_documento||null,observacoes:a.p_observacoes||null});return{data:true,error:null};
    }
    if(name==='obrix_transferir_estoque'){
      const qty=Number(a.p_quantidade||0),o=saldoRow(a.p_material_id,a.p_estoque_origem_id),d=saldoRow(a.p_material_id,a.p_estoque_destino_id),have=Number(o?.quantidade||0);if(qty<=0||qty>have)throw new Error('Saldo insuficiente.');await setSaldo(a.p_material_id,a.p_estoque_origem_id,have-qty);await setSaldo(a.p_material_id,a.p_estoque_destino_id,Number(d?.quantidade||0)+qty);await q('estoque_movimentacoes').insert({empresa_id:e,material_id:a.p_material_id,estoque_origem_id:a.p_estoque_origem_id,estoque_destino_id:a.p_estoque_destino_id,tipo:'transferencia',quantidade:qty,data:a.p_data||new Date().toISOString().slice(0,10),documento:a.p_documento||null,observacoes:a.p_observacoes||null});return{data:true,error:null};
    }
    if(name==='obrix_ajustar_estoque'){
      const qty=Number(a.p_quantidade_real||0),old=saldoRow(a.p_material_id,a.p_estoque_id),prev=Number(old?.quantidade||0);if(qty<0)throw new Error('Quantidade inválida.');await setSaldo(a.p_material_id,a.p_estoque_id,qty);await q('estoque_movimentacoes').insert({empresa_id:e,material_id:a.p_material_id,estoque_destino_id:a.p_estoque_id,tipo:'ajuste',quantidade:Math.abs(qty-prev),data:a.p_data||new Date().toISOString().slice(0,10),documento:a.p_documento||null,observacoes:a.p_observacoes||`Ajuste local: ${prev} → ${qty}`});return{data:true,error:null};
    }
    if(name==='obrix_criar_reposicao_estoque'){
      let fid=a.p_fornecedor_id||null;if(!fid&&a.p_fornecedor_nome){const rr=await q('fornecedores').insert({empresa_id:e,nome:a.p_fornecedor_nome,ativo:true}).select('id').single();if(rr.error)throw new Error(rr.error.message);fid=rr.data.id}const qty=Number(a.p_quantidade||0),vu=Number(a.p_valor_unitario||0),total=qty*vu;const cr=await q('compras').insert({empresa_id:e,fornecedor_id:fid,status:'rascunho',subtotal:total,valor_total:total,estoque_processado:false,financeiro_processado:false,observacoes:a.p_observacoes||null}).select('id').single();if(cr.error)throw new Error(cr.error.message);const mat=one('materiais',x=>same(x.id,a.p_material_id));await q('compra_itens').insert({empresa_id:e,compra_id:cr.data.id,material_id:a.p_material_id,descricao:mat?.nome||'Material',quantidade:qty,unidade:mat?.unidade||'un',valor_unitario:vu,valor_total:total});return{data:{id:cr.data.id},error:null};
    }
    if(name==='obrix_receber_compra'){
      const c=one('compras',x=>same(x.id,a.p_compra_id));if(!c)throw new Error('Compra não encontrada.');const its=tableRows('compra_itens').filter(x=>same(x.compra_id,c.id));for(const i of its){if(!i.material_id)continue;const old=saldoRow(i.material_id,a.p_estoque_id);await setSaldo(i.material_id,a.p_estoque_id,Number(old?.quantidade||0)+Number(i.quantidade||0));await q('estoque_movimentacoes').insert({empresa_id:e,material_id:i.material_id,estoque_destino_id:a.p_estoque_id,tipo:'entrada',quantidade:Number(i.quantidade||0),custo_unitario:Number(i.valor_unitario||0),valor_total:Number(i.valor_total||0),data:new Date().toISOString().slice(0,10),compra_id:c.id,documento:a.p_numero_documento||null})}await q('compras').update({status:'recebida',estoque_processado:true,nota_fiscal:a.p_nota_fiscal||null,numero_documento:a.p_numero_documento||null}).eq('id',c.id);return{data:true,error:null};
    }
    if(name==='obrix_pagar_compra'){
      const c=one('compras',x=>same(x.id,a.p_compra_id));if(!c)throw new Error('Compra não encontrada.');await q('compras').update({status:'paga',financeiro_processado:true,forma_pagamento:a.p_forma_pagamento||null}).eq('id',c.id);await q('financeiro').insert({empresa_id:e,obra_id:c.obra_id||null,tipo:'despesa',categoria:'material',descricao:`Compra #${c.numero_pedido||''}`.trim(),valor:Number(c.valor_total||0),data:a.p_data_pagamento||new Date().toISOString().slice(0,10),origem:'compra',compra_id:c.id,status_lancamento:'ativo',forma_pagamento:a.p_forma_pagamento||null,observacoes:a.p_numero_documento||null});return{data:true,error:null};
    }
    if(name==='cancelar_compra'){
      const c=one('compras',x=>same(x.id,a.p_compra_id));if(!c)throw new Error('Compra não encontrada.');await q('compras').update({status:'cancelada',cancelamento_processado:true,cancelada_em:now(),motivo_cancelamento:a.p_motivo||null}).eq('id',c.id);const fins=tableRows('financeiro').filter(x=>same(x.compra_id,c.id)&&x.status_lancamento!=='estornado');for(const f of fins)await q('financeiro').update({status_lancamento:'estornado'}).eq('id',f.id);return{data:true,error:null};
    }
    if(name==='obrix_pagar_funcionario_seguro'){
      const ds=tableRows('diarias').filter(x=>(a.p_diaria_ids||[]).some(id=>same(id,x.id))),vs=tableRows('vales').filter(x=>(a.p_vale_ids||[]).some(id=>same(id,x.id))),bs=tableRows('bonus_extras').filter(x=>(a.p_bonus_ids||[]).some(id=>same(id,x.id)));const td=ds.reduce((s,x)=>s+Number(x.valor_total||0),0),tv=vs.reduce((s,x)=>s+Number(x.valor||0),0),tb=bs.reduce((s,x)=>s+Number(x.valor||0),0),liq=td+tb-tv;const pr=await q('pagamentos_equipe').insert({empresa_id:e,funcionario_id:a.p_funcionario_id,valor_diarias:td,valor_bonus_extras:tb,valor_vales:tv,valor_bruto:td+tb,valor_liquido:liq,data_pagamento:a.p_data_pagamento||new Date().toISOString().slice(0,10)}).select('id').single();if(pr.error)throw new Error(pr.error.message);const pid=pr.data.id;if(ds.length){await q('pagamento_diarias').insert(ds.map(i=>({empresa_id:e,pagamento_id:pid,diaria_id:i.id,obra_id:i.obra_id,valor:Number(i.valor_total||0)})));await q('diarias').update({paga:true,pago_em:now()}).in('id',ds.map(x=>x.id))}if(vs.length){await q('pagamento_vales').insert(vs.map(i=>({empresa_id:e,pagamento_id:pid,vale_id:i.id,valor:Number(i.valor||0)})));await q('vales').update({quitado:true,quitado_em:now()}).in('id',vs.map(x=>x.id))}if(bs.length){await q('pagamento_bonus_extras').insert(bs.map(i=>({empresa_id:e,pagamento_id:pid,bonus_extra_id:i.id,valor:Number(i.valor||0)})));await q('bonus_extras').update({pago:true,pago_em:now()}).in('id',bs.map(x=>x.id))}const f=one('funcionarios',x=>same(x.id,a.p_funcionario_id));const por={};ds.forEach(i=>por[i.obra_id]=(por[i.obra_id]||0)+Number(i.valor_total||0));bs.forEach(i=>por[i.obra_id]=(por[i.obra_id]||0)+Number(i.valor||0));vs.forEach(i=>por[i.obra_id]=(por[i.obra_id]||0)-Number(i.valor||0));const rows=Object.entries(por).filter(([,v])=>v>0).map(([obra_id,valor])=>({empresa_id:e,obra_id,tipo:'despesa',categoria:'mao_de_obra',descricao:'Pagamento de equipe - '+(f?.nome||'Funcionário'),valor,data:a.p_data_pagamento||new Date().toISOString().slice(0,10),origem:'pagamento_equipe',pagamento_equipe_id:pid,status_lancamento:'ativo'}));if(rows.length)await q('financeiro').insert(rows);return{data:{id:pid},error:null};
    }
    return{data:null,error:{message:'Esta ação ainda exige internet.'}};
  }catch(err){return{data:null,error:{message:err?.message||String(err)}}}
}

function activate(){seedLegacy();window.__OBRIX_OFFLINE_V2_ACTIVE=true;document.documentElement.dataset.obrixOfflineV2='1';document.documentElement.dataset.obrixOffline='1';window.dispatchEvent(new CustomEvent('obrix:offline-v2-active'));return true}
function deactivate(){window.__OBRIX_OFFLINE_V2_ACTIVE=false;document.documentElement.removeAttribute('data-obrix-offline-v2');return true}
function active(){return !!window.__OBRIX_OFFLINE_V2_ACTIVE}

function patchBackend(){
  if(!window.OBRIX_BACKEND||window.OBRIX_BACKEND.__offlineV2Patched)return false;
  const b=window.OBRIX_BACKEND;
  originals={init:b.init.bind(b),profile:b.profile.bind(b),currentUser:b.currentUser.bind(b),readTable:b.readTable.bind(b)};
  b.init=async()=>active()?localClient:originals.init();
  b.profile=async(force=false)=>active()?(profileLocal()||Promise.reject(new Error('Perfil offline não disponível.'))):originals.profile(force);
  b.currentUser=async(force=false)=>active()?localUser():originals.currentUser(force);
  b.readTable=async(table,orderColumn)=>{if(!active())return originals.readTable(table,orderColumn);let q=localClient.from(table).select('*');if(orderColumn)q=q.order(orderColumn,{ascending:false});const r=await q;if(r.error)throw new Error(r.error.message);return r.data||[]};
  Object.defineProperty(b,'__offlineV2Patched',{value:true,configurable:true});
  return true;
}

let preparing=false,syncing=false,lastPrepare=0;
async function prepare(force=false){
  if(preparing||active()||!realOnline()||!originals)return false;const e=empresa();if(!e)return false;
  const meta=getMeta();if(!force&&Date.now()-Number(meta.snapshotMs||0)<120000)return true;
  preparing=true;
  try{
    await sync();
    const sb=await originals.init(),p=await originals.profile();let user=null;try{user=await originals.currentUser()}catch(_){}
    const d=getDb();
    for(const table of OP_TABLES){try{const r=await sb.from(table).select('*').eq('empresa_id',e);if(!r.error&&Array.isArray(r.data))d.tables[table]=r.data}catch(err){console.warn('OBRIX offline v2: snapshot',table,err)}}
    putDb(d);putMeta({...meta,user:user?{id:user.id,email:user.email}:meta.user||null,snapshotAt:now(),snapshotMs:Date.now(),profile:p||profileLocal()});
    seedLegacy();lastPrepare=Date.now();window.dispatchEvent(new CustomEvent('obrix:offline-v2-prepared',{detail:{tables:Object.keys(d.tables).length}}));return true;
  }catch(e2){console.warn('OBRIX offline v2: preparo indisponível',e2);return false}finally{preparing=false}
}
function applyRemoteFilters(q,filters=[]){for(const f of filters){if(f.op==='eq')q=q.eq(f.col,f.val);else if(f.op==='neq')q=q.neq(f.col,f.val);else if(f.op==='in')q=q.in(f.col,f.val||[]);else if(f.op==='is')q=q.is(f.col,f.val);else if(f.op==='gte')q=q.gte(f.col,f.val);else if(f.op==='lte')q=q.lte(f.col,f.val);else if(f.op==='gt')q=q.gt(f.col,f.val);else if(f.op==='lt')q=q.lt(f.col,f.val)}return q}
async function sync(){
  if(syncing||!realOnline()||!originals)return false;const q0=getQueue();if(!q0.length)return true;syncing=true;const remain=[];
  try{const sb=await originals.init();for(const op of q0){try{let r;if(op.type==='insert')r=await sb.from(op.table).upsert(op.rows||[],{onConflict:'id'});else if(op.type==='upsert')r=await sb.from(op.table).upsert(op.rows||[],op.options||{onConflict:'id'});else if(op.type==='update')r=await applyRemoteFilters(sb.from(op.table).update(op.payload||{}),op.filters);else if(op.type==='delete')r=await applyRemoteFilters(sb.from(op.table).delete(),op.filters);else continue;if(r?.error)throw r.error}catch(err){remain.push(op);console.warn('OBRIX offline v2: sync pendente',op.table,err)}}putQueue(remain);window.dispatchEvent(new CustomEvent('obrix:offline-v2-synced',{detail:{pending:remain.length,synced:q0.length-remain.length}}));return !remain.length}finally{syncing=false}}

function status(){const d=getDb(),q=getQueue(),m=getMeta();return{version:VERSION,active:active(),realOnline:realOnline(),empresa_id:empresa(),prepared:!!m.snapshotAt,snapshotAt:m.snapshotAt||null,tables:Object.keys(d.tables||{}).length,pending:q.length,preparing,syncing,lastPrepare}}

patchBackend();seedLegacy();if(!realOnline())activate();
window.addEventListener('obrix:offline-base-atualizada',()=>setTimeout(()=>prepare(false),700));
window.addEventListener('obrix:modules-ready',()=>setTimeout(()=>prepare(false),1200));
window.addEventListener('online',()=>{setTimeout(()=>sync().then(()=>prepare(true)),1200)});
window.addEventListener('pageshow',()=>{if(realOnline()&&!active())setTimeout(()=>prepare(false),1800)});
setTimeout(()=>{if(realOnline()&&!active())prepare(false)},2800);
window.OBRIX_OFFLINE_V2={activate,deactivate,active,prepare,sync,status,client:localClient,realOnline,seedLegacy,table:tableRows};
})();
