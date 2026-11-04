(()=>{'use strict';
if(window.__OBRIX_OFFLINE_V3_GUARD)return;window.__OBRIX_OFFLINE_V3_GUARD=true;
let leaving=false;
async function safeLogout(e){
 const el=e.target?.closest?.('#sair,#menuSair');if(!el||!navigator.onLine||leaving)return;
 leaving=true;e.preventDefault();e.stopImmediatePropagation();
 try{window.OBRIX_OFFLINE_V3?.capture?.('pre-online-logout')}catch(_){}
 try{const sb=await window.OBRIX_BACKEND?.init?.();await Promise.race([Promise.resolve(sb?.auth?.signOut?.()),new Promise(r=>setTimeout(r,1800))])}catch(_){}
 location.reload();
}
document.addEventListener('click',safeLogout,true);
})();