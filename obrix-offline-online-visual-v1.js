(()=>{'use strict';
if(window.__OBRIX_OFFLINE_ONLINE_VISUAL_V1)return;window.__OBRIX_OFFLINE_ONLINE_VISUAL_V1=true;
let timer=0,headMo=null,bodyMo=null;
const EXTRA_STYLE=`html[data-obrix-offline="1"] #offlineQuickMenu,html[data-obrix-offline="1"] #financeiroOfflineStatus,html[data-obrix-offline="1"] #financeiroOfflineResumoExtra,html[data-obrix-offline="1"] .offlineBadge{display:none!important}`;
const BASE_KEY='obrix_offline_base_v3',OLD_BASE_KEY='obrix_offline_base_v2',IDENTITY_KEY='obrix_offline_identity_v1',DB_PREFIX='obrix_offline_v2_db:',OBRAS_PREFIX='obrix_obras_cache_v1:',EQUIPE_PREFIX='obrix_equipe_cache_v1:',FIN_PREFIX='obrix_financeiro_cache_v1:';
const read=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(_){return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};
const arr=v=>Array.isArray(v)?v:[];
const has=v=>Array.isArray(v)&&v.length>0;
function offlineNow(){return !navigator.onLine||window.__OBRIX_FORCE_OFFLINE===true||document.documentElement.dataset.obrixOffline==='1'||document.documentElement.dataset.obrixOfflineV2==='1'}
function onlyCachedEmpresa(){try{const ids=new Set(),ps=[DB_PREFIX,OBRAS_PREFIX,EQUIPE_PREFIX,FIN_PREFIX];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'';for(const p of ps)if(k.startsWith(p)&&k.length>p.length)ids.add(k.slice(p.length))}return ids.size===1?[...ids][0]:null}catch(_){return null}}
function recoverOfflineData(){
 if(!offlineNow())return false;
 const b3=read(BASE_KEY,null),b2=read(OLD_BASE_KEY,null),ident=read(IDENTITY_KEY,null);
 const eid=b3?.profile?.empresa_id||b2?.profile?.empresa_id||ident?.empresa_id||onlyCachedEmpresa();if(!eid)return false;
 const same=b=>b?.profile?.empresa_id&&String(b.profile.empresa_id)===String(eid);
 const base=same(b3)?{...b3}:same(b2)?{...b2}:{profile:{empresa_id:eid,nome:ident?.nome||'',email:ident?.email||'',papel:ident?.papel||''}};
 const db=read(DB_PREFIX+eid,null),tables=db&&typeof db==='object'&&db.tables&&typeof db.tables==='object'?db.tables:{};
 const oc=read(OBRAS_PREFIX+eid,[]),ec=read(EQUIPE_PREFIX+eid,null)||{},fc=read(FIN_PREFIX+eid,null)||{};
 const pick=(canonical,current,legacy)=>has(canonical)?canonical:has(current)?current:arr(legacy);
 const obras=pick(tables.obras,base.obras,oc),funcionarios=pick(tables.funcionarios,base.funcionarios,ec.funcionarios),financeiro=pick(tables.financeiro,base.financeiro,fc.financeiro),extras=pick(tables.servicos_extras,base.extras,fc.extras),diarias=pick(tables.diarias,base.diarias,ec.diarias),vales=pick(tables.vales,base.vales,[]),bonus=pick(tables.bonus_extras,base.bonus,[]),faltas=pick(tables.faltas,base.faltas,ec.faltas),checklists=pick(tables.checklist_itens,base.checklist_itens||base.checklists,fc.checklists);
 const recovered=obras.length||funcionarios.length||financeiro.length||extras.length||diarias.length||vales.length||bonus.length||faltas.length||checklists.length;if(!recovered)return false;
 const profile={...(same(b2)?b2.profile:{}),...(ident?.empresa_id&&String(ident.empresa_id)===String(eid)?ident:{}),...(base.profile||{}),empresa_id:eid};
 const next={...base,profile,obras,funcionarios,financeiro,extras,diarias,vales,bonus,faltas,checklist_itens:checklists,checklists,updatedAt:base.updatedAt||db?.savedAt||ec?.savedAt||fc?.savedAt||new Date().toISOString(),cacheRecovered:true};
 write(BASE_KEY,next);
 const nextDb=db&&typeof db==='object'?{...db,tables:{...tables}}:{version:2,tables:{}};
 const seed=(name,rows)=>{if(!has(nextDb.tables[name])&&has(rows))nextDb.tables[name]=rows.map(x=>({...x}))};
 seed('obras',obras);seed('funcionarios',funcionarios);seed('financeiro',financeiro);seed('servicos_extras',extras);seed('diarias',diarias);seed('vales',vales);seed('bonus_extras',bonus);seed('faltas',faltas);seed('checklist_itens',checklists);
 nextDb.version=2;nextDb.savedAt=nextDb.savedAt||new Date().toISOString();write(DB_PREFIX+eid,nextDb);
 if(has(obras))write(OBRAS_PREFIX+eid,obras);
 if(has(funcionarios)||has(diarias)||has(faltas))write(EQUIPE_PREFIX+eid,{...ec,funcionarios,diarias,faltas,savedAt:new Date().toISOString()});
 if(has(financeiro)||has(extras)||has(checklists))write(FIN_PREFIX+eid,{...fc,financeiro,extras,checklists,savedAt:new Date().toISOString()});
 window.__OBRIX_OFFLINE_BOOTSTRAP_BASE=next;window.obras=obras;window.funcionarios=funcionarios;window.financeiro=financeiro;window.extras=extras;window.diarias=diarias;window.vales=vales;window.bonus=bonus;
 window.dispatchEvent(new CustomEvent('obrix:offline-data-recovered',{detail:{empresa_id:eid,obras:obras.length,funcionarios:funcionarios.length,financeiro:financeiro.length,diarias:diarias.length}}));
 setTimeout(()=>{try{window.OBRIX_HOME?.sync?.()}catch(_){}try{window.OBRIX_BUTTON_COLORS?.scan?.()}catch(_){}},0);
 return true;
}
function removeLegacy(){
 const s=document.getElementById('obrixOfflineParityCss');
 if(s&&s.textContent.includes('#app>.bottom'))s.remove();
}
function extraCss(){
 let s=document.getElementById('obrixOfflineOnlineVisualV1');
 if(!s){s=document.createElement('style');s.id='obrixOfflineOnlineVisualV1';document.head.appendChild(s)}
 if(s.textContent!==EXTRA_STYLE)s.textContent=EXTRA_STYLE;
 if(s!==document.head.lastElementChild)document.head.appendChild(s);
}
function repaint(){
 if(offlineNow())recoverOfflineData();
 removeLegacy();extraCss();
 try{window.OBRIX_BUTTON_COLORS?.scan?.()}catch(_){}
 try{window.OBRIX_UI_CLEANUP_V5?.scan?.()}catch(_){}
}
function schedule(){clearTimeout(timer);timer=setTimeout(repaint,20)}
function start(){
 if(offlineNow())recoverOfflineData();
 repaint();
 if(document.head&&!headMo){headMo=new MutationObserver(schedule);headMo.observe(document.head,{childList:true})}
 if(document.body&&!bodyMo){bodyMo=new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'||m.attributeName==='class'||m.attributeName==='style'))schedule()});bodyMo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']})}
 ['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:offline-bootstrap','obrix:offline-core-restaurado','obrix:offline-v2-change','pageshow','focus','offline'].forEach(n=>window.addEventListener(n,schedule));
 window.addEventListener('online',()=>{document.getElementById('obrixOfflineOnlineVisualV1')?.remove();removeLegacy();setTimeout(()=>{try{window.OBRIX_UI_CLEANUP_V5?.scan?.()}catch(_){}},30)});
 document.addEventListener('click',()=>setTimeout(schedule,0),true);
 setTimeout(repaint,120);setTimeout(repaint,500);setTimeout(repaint,1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_OFFLINE_ONLINE_VISUAL={repaint:schedule,recoverData:recoverOfflineData};
})();
