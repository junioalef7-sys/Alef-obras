(()=>{
'use strict';
if(window.__OBRIX_SUPORTE_ADMIN_NOTIF)return;window.__OBRIX_SUPORTE_ADMIN_NOTIF=true;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function abrirNotificacao(id){
  try{
    const sb=await window.OBRIX_BACKEND?.init?.(),u=await window.OBRIX_BACKEND?.currentUser?.();
    if(!sb||!u?.id)return false;
    const {data:n,error}=await sb.from('notificacoes').select('id,alvo,dados,lida_em').eq('id',id).eq('usuario_id',u.id).maybeSingle();
    if(error||!n||n.alvo!=='suporte_admin')return false;
    if(!n.lida_em){await sb.from('notificacoes').update({lida_em:new Date().toISOString()}).eq('id',n.id).eq('usuario_id',u.id)}
    document.getElementById('obrixNotifOverlay')?.classList.add('hidden');await window.OBRIX_SUPORTE?.open?.();const tab=document.getElementById('supAdminTab');if(tab&&!tab.classList.contains('hidden'))tab.click();const chamadoId=String(n.dados?.chamado_id||'');if(chamadoId){for(let i=0;i<12;i++){const ticket=document.querySelector(`#supLista [data-ticket="${CSS.escape(chamadoId)}"]`);if(ticket){ticket.click();break}await sleep(120)}}await window.OBRIX_NOTIFICACOES?.load?.(true);return true;
  }catch(e){console.warn('OBRIX suporte admin notif:',e);return false}
}
document.addEventListener('click',async e=>{const b=e.target.closest?.('.obrixNotifCard[data-notif]');if(!b)return;const original=b.onclick;if(typeof original!=='function')return;e.preventDefault();e.stopImmediatePropagation();const handled=await abrirNotificacao(b.dataset.notif);if(!handled)original.call(b,e)},true);
function loadLightV4(){if(!navigator.onLine||window.__OBRIX_FORCE_OFFLINE===true||document.documentElement.dataset.obrixOfflineV3==='1'||window.__OBRIX_LIGHT_UI_REQUESTED_V4)return;if([...document.scripts].some(s=>/obrix-light-ui-requested-v4\.js(?:\?|$)/.test(String(s.src||''))))return;const s=document.createElement('script');s.src='./obrix-light-ui-requested-v4.js?v=20261025-darkbutton-deletefix1';s.async=false;s.dataset.obrixLightV4='1';document.body.appendChild(s)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(loadLightV4,80),{once:true});else setTimeout(loadLightV4,80);window.addEventListener('online',()=>setTimeout(loadLightV4,80));window.addEventListener('pageshow',()=>setTimeout(loadLightV4,80));
})();