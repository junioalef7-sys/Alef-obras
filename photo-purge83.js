(function(){
'use strict';
if(window.__EDIFIQ_PHOTO_PURGE83)return;window.__EDIFIQ_PHOTO_PURGE83=true;
function client83(){
 try{if(typeof sb!=='undefined'&&sb?.auth&&sb?.functions)return sb}catch(_){}
 const c=window.supabaseClient||window.sb;
 return c?.auth&&c?.functions?c:null;
}
async function run83(){
 try{
  const c=client83();if(!c){setTimeout(run83,1800);return}
  const r=await c.auth.getSession(),session=r?.data?.session;if(!session?.user?.id){setTimeout(run83,2500);return}
  const flag='edifiq_photo_purge83_'+session.user.id;
  if(localStorage.getItem(flag)==='done')return;
  const out=await c.functions.invoke('edifiq-purge-minhas-fotos',{body:{confirm:true}});
  if(out?.error)throw out.error;
  const d=out?.data||{};
  if(!d.ok||Number(d.storage_remaining||0)!==0||Number(d.db_remaining||0)!==0)throw new Error('Limpeza de fotos não confirmou estado zerado.');
  localStorage.setItem(flag,'done');
  console.info('EDIFIQ: fotos antigas removidas',d);
  try{window.dispatchEvent(new CustomEvent('edifiq:photos-purged',{detail:d}))}catch(_){}
 }catch(e){console.warn('EDIFIQ photo purge83:',e);setTimeout(run83,10000)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run83,1200),{once:true});else setTimeout(run83,1200);
})();