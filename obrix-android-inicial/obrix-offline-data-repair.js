(()=>{'use strict';
if(window.__OBRIX_OFFLINE_DATA_REPAIR)return;window.__OBRIX_OFFLINE_DATA_REPAIR=true;
const BASE='obrix_offline_base_v3',OB='obrix_obras_cache_v1:',EQ='obrix_equipe_cache_v1:',FI='obrix_financeiro_cache_v1:';
const read=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch{return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const arr=v=>Array.isArray(v)?v:[];
function choose(primary,fallback){const a=arr(primary),b=arr(fallback);if(a.length)return a;if(b.length)return b;return[]}
function repair(){const b=read(BASE,null);if(!b?.profile?.empresa_id)return null;const e=b.profile.empresa_id,oc=read(OB+e,[]),ec=read(EQ+e,{funcionarios:[],diarias:[],faltas:[]}),fc=read(FI+e,{financeiro:[],extras:[],checklists:[]});
 const next={...b,obras:choose(b.obras,oc),funcionarios:choose(b.funcionarios,ec?.funcionarios),diarias:choose(b.diarias,ec?.diarias),financeiro:choose(b.financeiro,fc?.financeiro),extras:choose(b.extras,fc?.extras),vales:arr(b.vales),bonus:arr(b.bonus)};
 write(BASE,next);
 write(OB+e,next.obras);
 write(EQ+e,{funcionarios:next.funcionarios,diarias:next.diarias,faltas:arr(ec?.faltas),savedAt:b.updatedAt||ec?.savedAt||new Date().toISOString()});
 write(FI+e,{financeiro:next.financeiro,extras:next.extras,checklists:arr(fc?.checklists),savedAt:b.updatedAt||fc?.savedAt||new Date().toISOString()});
 window.__OBRIX_OFFLINE_BOOTSTRAP_BASE=next;window.obras=next.obras;window.funcionarios=next.funcionarios;window.diarias=next.diarias;window.financeiro=next.financeiro;window.extras=next.extras;window.vales=next.vales;window.bonus=next.bonus;
 window.dispatchEvent(new CustomEvent('obrix:offline-data-repaired',{detail:{empresa_id:e,obras:next.obras.length,funcionarios:next.funcionarios.length,financeiro:next.financeiro.length,diarias:next.diarias.length}}));return next}
repair();window.addEventListener('offline',repair);window.addEventListener('obrix:offline-bootstrap',repair);window.OBRIX_OFFLINE_DATA_REPAIR={repair,status:()=>{const b=read(BASE,null);return{empresa_id:b?.profile?.empresa_id||null,obras:arr(b?.obras).length,funcionarios:arr(b?.funcionarios).length,financeiro:arr(b?.financeiro).length,diarias:arr(b?.diarias).length}}};
})();