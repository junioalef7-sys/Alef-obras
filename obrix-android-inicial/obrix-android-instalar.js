(()=>{
'use strict';
if(!/Android/i.test(navigator.userAgent||'')||window.__OBRIX_ANDROID_INSTALACAO)return;
window.__OBRIX_ANDROID_INSTALACAO=true;
const KEY='obrix_android_install_', $=id=>document.getElementById(id);
let deferred=null, installed=false, activeUid='', activeType='', closedFor='', lastUid='', busy=false, scheduled=false;
const read=k=>{try{return localStorage.getItem(KEY+k)==='1'}catch(_){return false}};
const write=(k,v=true)=>{try{v?localStorage.setItem(KEY+k,'1'):localStorage.removeItem(KEY+k)}catch(_){}};
const standalone=()=>installed||navigator.standalone===true||!!window.matchMedia?.('(display-mode: standalone)')?.matches;
function remove(){
 document.querySelectorAll('.obrixAndroidInstallCard').forEach(e=>e.remove());
}
function schedule(){
 if(scheduled)return;scheduled=true;
 setTimeout(()=>{scheduled=false;void sync()},130);
}
window.addEventListener('beforeinstallprompt',e=>{
 e.preventDefault();deferred=e;closedFor='';schedule();
});
window.addEventListener('appinstalled',()=>{
 installed=true;deferred=null;
 if(lastUid){write('installed_'+lastUid);write('seen_'+lastUid);write('reinstallSeen_'+lastUid,false)}
 remove();
});
async function uid(){
 try{const u=await window.OBRIX_BACKEND?.currentUser?.();if(u?.id)return String(u.id)}catch(_){}
 return '';
}
function homeVisible(){
 const el=$('inicio');return !!(el&&!el.classList.contains('hidden')&&el.style.display!=='none');
}
function introFirst(){
 const ov=$('obrixOnboarding'),step=$('obxOnboardStep');
 return !!(ov&&!ov.classList.contains('hidden')&&/^Etapa 1 de /.test(step?.textContent||''));
}
function eligible(){
 return !!($('app')&&!$('app').classList.contains('hidden')&&$('login')?.classList.contains('hidden')&&!standalone());
}
function card(target){
 if(!target)return;
 if(target.querySelector('.obrixAndroidInstallCard'))return;
 const box=document.createElement('section');box.className='obrixAndroidInstallCard';
 box.setAttribute('role','group');box.setAttribute('aria-label','Instalar OBRIX');
 const title=document.createElement('strong');title.textContent='OBRIX no seu Android';
 const desc=document.createElement('span');desc.textContent='Instale como aplicativo e abra sem a barra do navegador.';
 const actions=document.createElement('div');actions.className='obrixAndroidInstallActions';
 const install=document.createElement('button');install.type='button';install.className='obrixAndroidInstallStart';install.textContent='Instalar aplicativo';
 const close=document.createElement('button');close.type='button';close.className='obrixAndroidInstallDismiss';close.textContent='Agora não';
 const info=document.createElement('p');info.className='obrixAndroidInstallHelp';info.hidden=true;
 install.onclick=async()=>{
   if(standalone()){remove();return}
   if(!deferred){
     info.hidden=false;
     info.textContent='Para instalar como aplicativo, abra o endereço oficial no Google Chrome e escolha ⋮ → Instalar app. Se aparecer somente “Adicionar à tela inicial”, isso pode criar apenas um atalho. A instalação direta depende da opção oferecida pelo navegador.';
     return;
   }
   const prompt=deferred;deferred=null;install.disabled=true;
   try{
     await prompt.prompt();
     const result=await prompt.userChoice;
     if(result?.outcome==='accepted'){info.hidden=false;info.textContent='Instalação aceita. Abra o OBRIX pelo novo ícone do aplicativo.'}
     else{info.hidden=false;info.textContent='Instalação cancelada. Você pode usar a opção “Instalar app” no menu do Chrome.'}
   }catch(_){
     info.hidden=false;info.textContent='O navegador não conseguiu abrir a instalação. No Chrome, abra ⋮ e procure “Instalar app”.';
   }finally{install.disabled=false}
 };
 close.onclick=()=>{closedFor=activeUid;remove()};
 actions.append(install,close);box.append(title,desc,actions,info);
 target.prepend(box);
}
function injectCSS(){
 if($('obrixAndroidInstallCSS'))return;
 const st=document.createElement('style');st.id='obrixAndroidInstallCSS';
 st.textContent=`
 .obrixAndroidInstallCard{display:flex;flex-direction:column;gap:9px;margin:12px 0;padding:13px 14px;border:1px solid #fdba74;border-radius:14px;background:#fff7ed;color:#1f2937;font-family:Arial,sans-serif;box-shadow:none}
 .obrixAndroidInstallCard strong{font-size:16px;font-weight:800;color:#111827}
 .obrixAndroidInstallCard span{font-size:13px;line-height:1.4;color:#374151}
 .obrixAndroidInstallActions{display:flex;flex-wrap:wrap;gap:8px}
 .obrixAndroidInstallCard button{min-height:40px;border-radius:9px;border:1px solid #cbd5e1;padding:9px 12px;font-weight:700;font-size:13px}
 .obrixAndroidInstallStart{background:#ff5a00;color:#fff;border-color:#ff5a00!important}
 .obrixAndroidInstallDismiss{background:#fff;color:#111827}
 .obrixAndroidInstallHelp{font-size:12px;line-height:1.55;margin:0;color:#334155}
 `;
 document.head.appendChild(st);
}
async function sync(){
 if(busy)return;busy=true;
 try{
  if(!eligible()){remove();return}
  const current=await uid();if(!current)return;
  if(activeUid&&activeUid!==current){activeUid='';activeType='';closedFor='';remove()}
  lastUid=current;
  const first=!read('seen_'+current);
  const reinstall=read('installed_'+current)&&!!deferred&&!read('reinstallSeen_'+current);
  if(!activeUid){
    if(closedFor===current||(!first&&!reinstall))return;
    if(!homeVisible()&&!introFirst())return;
    activeUid=current;activeType=first?'first':'reinstall';
    if(first)write('seen_'+current);
    else write('reinstallSeen_'+current);
  }
  if(closedFor===current){remove();return}
  injectCSS();
  const home=$('inicio');
  if(homeVisible())card(home);
  if(introFirst())card($('obxOnboardBody'));
  if(!introFirst())$('obxOnboardBody')?.querySelector('.obrixAndroidInstallCard')?.remove();
 }finally{busy=false}
}
function boot(){
 if(standalone()){installed=true;return}
 injectCSS();
 const app=$('app');
 if(app)new MutationObserver(schedule).observe(app,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
 function watchIntroduction(){
   const intro=$('obrixOnboarding');if(!intro)return false;
   new MutationObserver(schedule).observe(intro,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
   return true;
 }
 if(!watchIntroduction()){
   const bodyObserver=new MutationObserver(()=>{
     if($('obrixOnboarding')){bodyObserver.disconnect();watchIntroduction();schedule()}
   });
   bodyObserver.observe(document.body,{childList:true,subtree:true});
 }
 schedule();
 window.addEventListener('pageshow',schedule);
 window.addEventListener('focus',schedule);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.OBRIX_ANDROID_INSTALL={check:schedule,isInstalled:standalone,status:()=>({promptAvailable:!!deferred,installed:standalone(),account:lastUid?'logged-in':'unknown'})};
})();
