(()=>{
'use strict';
if(window.__OBRIX_SUPORTE_PERMISSOES_UI)return;window.__OBRIX_SUPORTE_PERMISSOES_UI=true;

const $=id=>document.getElementById(id);
let applying=false,lastUserId='',lastAdmin=false,observer=null;

function norm(v){return String(v||'').trim().toLocaleLowerCase('pt-BR').replace(/\s+/g,' ')}
function dedupeIdentity(el){
  if(!el)return;
  const txt=String(el.textContent||'').trim();
  if(!txt.includes('·'))return;
  const parts=txt.split('·').map(x=>x.trim()).filter(Boolean);
  if(parts.length===2&&norm(parts[0])===norm(parts[1]))el.textContent=parts[0];
}

async function adminState(){
  try{
    const user=await window.OBRIX_BACKEND?.currentUser?.();
    if(!user?.id)return {user:null,isAdmin:false};
    if(user.id===lastUserId)return {user,isAdmin:lastAdmin};
    const sb=await window.OBRIX_BACKEND.init();
    const {data,error}=await sb.from('obrix_admins').select('user_id').eq('user_id',user.id).maybeSingle();
    if(error)throw error;
    lastUserId=user.id;lastAdmin=!!data;
    return {user,isAdmin:lastAdmin};
  }catch(_){return {user:null,isAdmin:false}}
}

async function apply(){
  if(applying)return;applying=true;
  try{
    const main=$('suporteMain');if(!main)return;
    const {isAdmin}=await adminState();
    const meus=main.querySelector('[data-sup-tab="meus"]');
    if(meus)meus.classList.toggle('hidden',!isAdmin);
    const adminTab=main.querySelector('[data-sup-tab="admin"]');
    if(adminTab)adminTab.classList.toggle('hidden',!isAdmin);

    if(!isAdmin){
      main.querySelectorAll('.supAdminActions,[data-status="em_atendimento"],[data-status="fechado"]').forEach(el=>el.remove());
    }

    main.querySelectorAll('.supAdminWho').forEach(dedupeIdentity);
    main.querySelectorAll('#supConversa .supConvHead p.muted').forEach(dedupeIdentity);
  }finally{applying=false}
}

function install(){
  const main=$('suporteMain');
  if(!main)return setTimeout(install,250);
  if(!observer){observer=new MutationObserver(()=>queueMicrotask(apply));observer.observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}
  apply();
}

document.addEventListener('click',e=>{
  if(e.target.closest?.('[data-obrix-suporte-menu],#obrixNotifBell,[data-sup-tab]'))setTimeout(apply,80);
},true);
window.addEventListener('pageshow',()=>{lastUserId='';setTimeout(apply,120)});
window.addEventListener('focus',()=>setTimeout(apply,120));
setTimeout(install,300);setTimeout(apply,1200);
})();