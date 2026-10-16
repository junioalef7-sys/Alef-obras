(function(){
'use strict';
if(window.__EDIFIQ_PHOTO_PURGE83)return;window.__EDIFIQ_PHOTO_PURGE83=true;
const q=id=>document.getElementById(id);
function client83(){
 try{if(typeof sb!=='undefined'&&sb?.auth&&sb?.functions)return sb}catch(_){}
 const c=window.supabaseClient||window.sb;
 return c?.auth&&c?.functions?c:null;
}
function say83(msg){try{if(typeof window.toast==='function')window.toast(msg);else alert(msg)}catch(_){}}
async function purge83(btn){
 if(!confirm('Excluir permanentemente todas as fotos antigas desta empresa? Esta ação não pode ser desfeita.'))return;
 const typed=prompt('Para confirmar, digite exatamente: EXCLUIR FOTOS');
 if(String(typed||'').trim()!=='EXCLUIR FOTOS'){say83('Exclusão cancelada.');return}
 const c=client83();if(!c){say83('Conexão do Edific indisponível. Reabra o aplicativo e tente novamente.');return}
 if(btn){btn.disabled=true;btn.textContent='Excluindo fotos...'}
 try{
  const r=await c.auth.getSession(),session=r?.data?.session;if(!session?.user?.id)throw new Error('Faça login novamente para excluir as fotos.');
  const out=await c.functions.invoke('edifiq-purge-minhas-fotos',{body:{confirm:true}});
  if(out?.error)throw out.error;
  const d=out?.data||{};
  if(!d.ok||Number(d.storage_remaining||0)!==0||Number(d.db_remaining||0)!==0)throw new Error('O servidor não confirmou a exclusão completa.');
  localStorage.setItem('edifiq_photo_purge83_'+session.user.id,'done');
  if(btn){btn.textContent='Fotos antigas excluídas';btn.disabled=true}
  say83('Fotos antigas excluídas com sucesso.');
  try{window.dispatchEvent(new CustomEvent('edifiq:photos-purged',{detail:d}))}catch(_){}
 }catch(e){console.error('EDIFIQ photo purge83:',e);if(btn){btn.disabled=false;btn.textContent='Excluir todas as fotos antigas'}say83(e?.message||'Não foi possível excluir as fotos.')}
}
function install83(){
 const menu=q('menuPasta');if(!menu)return;
 let btn=q('edifiqPurgePhotos83');
 if(btn)return;
 btn=document.createElement('button');btn.id='edifiqPurgePhotos83';btn.type='button';
 const anchor=[...menu.querySelectorAll('button')].find(b=>/backup/i.test(String(b.textContent||'')))||menu.querySelector('button:last-of-type');
 btn.className=anchor?.className||'';
 btn.innerHTML='<span>🗑️</span><b>Excluir todas as fotos antigas</b><span class="edifiqChevron">›</span>';
 btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();purge83(btn)});
 if(anchor)anchor.insertAdjacentElement('afterend',btn);else menu.appendChild(btn);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install83();setTimeout(install83,1200)},{once:true});else{install83();setTimeout(install83,1200)}
document.addEventListener('click',()=>setTimeout(install83,20),true);
})();