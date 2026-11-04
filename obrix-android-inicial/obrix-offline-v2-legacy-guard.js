(()=>{'use strict';
if(window.__OBRIX_OFFLINE_V2_LEGACY_GUARD)return;window.__OBRIX_OFFLINE_V2_LEGACY_GUARD=true;
const FLAGS=['__OBRIX_FIN_OFFLINE_BASEFIX','__OBRIX_FINANCEIRO_OFFLINE','__OBRIX_EQUIPE_OFFLINE','__OBRIX_ESTOQUE_OFFLINE','__OBRIX_OBRAS_OFFLINE','__OBRIX_CHECKLIST_OFFLINE'];
function block(){if(!window.OBRIX_OFFLINE_V2?.active?.()&&!window.__OBRIX_FORCE_OFFLINE)return false;FLAGS.forEach(k=>{try{window[k]=true}catch(_){}});return true}
block();window.addEventListener('offline',block);window.addEventListener('obrix:offline-v2-active',block);
window.OBRIX_OFFLINE_V2_LEGACY_GUARD={block,status:()=>({blocked:FLAGS.filter(k=>window[k]===true)})};
})();
