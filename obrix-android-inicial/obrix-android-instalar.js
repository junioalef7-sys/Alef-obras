(()=>{
'use strict';
if(!/Android/i.test(navigator.userAgent||'')||window.__OBRIX_ANDROID_INSTALACAO)return;
window.__OBRIX_ANDROID_INSTALACAO=true;
const KEY='obrix_android_install_', $=id=>document.getElementById(id);
const OFFICIAL_ORIGIN='https://alef-obras-obrix3.vercel.app';
const OFFICIAL_PATH='/obrix-android-inicial/obrix.html';
const installUrl=()=>new URL(OFFICIAL_PATH,OFFICIAL_ORIGIN);
const isOfficial=()=>location.origin===OFFICIAL_ORIGIN||location.origin==='https://alef-obras.vercel.app';
const isPreview=()=>!isOfficial();
const samsung=/SamsungBrowser\//i.test(navigator.userAgent||'');
const handedFromSamsung=(()=>{try{return ['samsung','preview'].includes(new URLSearchParams(location.search).get('obrix_install_from'))}catch(_){return false}})();
function openInChrome(){
  const dest=installUrl();
  dest.searchParams.set('obrix_install_from','samsung');
  const intent='intent://'+dest.host+dest.pathname+dest.search+'#Intent;scheme=https;package=com.android.chrome;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url='+encodeURIComponent(dest.href)+';end';
  // Somente por clique do usuário; nunca tenta instalar pelo Samsung Internet.
  location.href=intent;
}
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
 e.preventDefault();
 if(samsung){deferred=null;schedule();return}
 deferred=e;closedFor='';schedule();
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
function introVisible(){
 const ov=$('obrixOnboarding');return !!(ov&&!ov.classList.contains('hidden'));
}
function introLast(){
 if(!introVisible())return false;
 const value=$('obxOnboardStep')?.textContent||'',parts=value.match(/^Etapa (\d+) de (\d+)/);
 return !!(parts&&Number(parts[1])===Number(parts[2]));
}
function eligible(){
 return !!($('app')&&!$('app').classList.contains('hidden')&&$('login')?.classList.contains('hidden'));
}
function card(target){
 if(!target)return;
 if(target.querySelector('.obrixAndroidInstallCard'))return;
 const box=document.createElement('section');box.className='obrixAndroidInstallCard';
 box.setAttribute('role','group');box.setAttribute('aria-label','Instalar OBRIX');
 const title=document.createElement('strong');title.textContent='OBRIX no seu Android';
 const desc=document.createElement('span');
 desc.textContent=standalone()?'O OBRIX já está instalado neste aparelho. Você pode abrir pelo ícone do aplicativo.':samsung?'A instalação é feita pelo Chrome no endereço OFICIAL do OBRIX, não na prévia da Vercel.':isPreview()?'Esta é uma versão de teste. Abra o OBRIX oficial no Chrome para instalar.':'Instale o OBRIX como aplicativo no Chrome e abra sem a barra do navegador.';
 const actions=document.createElement('div');actions.className='obrixAndroidInstallActions';
 const install=document.createElement('button');install.type='button';install.className='obrixAndroidInstallStart';
 install.textContent=standalone()?'OBRIX já instalado':samsung?'Abrir OBRIX oficial no Chrome':isPreview()?'Abrir OBRIX oficial para instalar':'Instalar aplicativo';
 install.disabled=standalone();
 if(standalone())install.setAttribute('aria-label','OBRIX já está instalado');
 const close=document.createElement('button');close.type='button';close.className='obrixAndroidInstallDismiss';close.textContent='Agora não';
 const info=document.createElement('p');info.className='obrixAndroidInstallHelp';info.hidden=true;
 install.onclick=async()=>{
   if(standalone()){remove();return}
   if(samsung){
     if(activeUid)write('samsungChromeFixShown_'+activeUid);
     info.hidden=false;
     info.textContent='Abrindo o OBRIX oficial no Chrome. Se não aparecer a instalação, toque em ⋮ → Instalar app no Chrome. Não desative o Play Protect.';
     openInChrome();
     return;
   }
   if(isPreview()){
     info.hidden=false;
     info.textContent='Abrindo o site oficial do OBRIX, sem a tela de proteção da Vercel. No Chrome, use ⋮ → Instalar app se necessário.';
     const target=installUrl();target.searchParams.set('obrix_install_from','preview');
     location.assign(target.href);
     return;
   }
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
 close.onclick=()=>{if(samsung&&activeUid)write('samsungChromeFixShown_'+activeUid);closedFor=activeUid;remove()};
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
  // O aviso de compatibilidade no Samsung Internet requer um novo convite
  // mesmo para quem já viu o botão de instalação em versões anteriores.
  const samsungFix=samsung&&!read('samsungChromeFixShown_'+current);
  const chromeHandoff=!samsung&&handedFromSamsung&&!read('chromeHandoffSeen_'+current);
  const endOfPresentation=introLast();
  if(!activeUid){
    if(closedFor===current&&!endOfPresentation)return;
    if(!first&&!reinstall&&!samsungFix&&!chromeHandoff&&!endOfPresentation)return;
    if(!homeVisible()&&!endOfPresentation)return;
    activeUid=current;activeType=samsungFix?'samsung-chrome':chromeHandoff?'chrome-install':first?'first':reinstall?'reinstall':'manual';
    if(first)write('seen_'+current);
    if(reinstall&&!first)write('reinstallSeen_'+current);
    if(chromeHandoff)write('chromeHandoffSeen_'+current);
  }
  if(closedFor===current){remove();return}
  injectCSS();
  if(endOfPresentation){
    const holder=$('obxOnboardBody');
    if(holder&&!holder.querySelector('.obrixAndroidInstallCard')){remove();card(holder)}
  }else if(introVisible()){
    remove(); // A apresentação mostra o botão somente na última etapa.
  }else if(activeType==='reinstall'&&homeVisible()){
    card($('inicio'));
  }else{
    remove();
  }
 }finally{busy=false}
}
function boot(){
 // Even installed PWAs can revisit the final installation explanation.
 // Only the actual browser installation action should be disabled.
 if(standalone())installed=true;
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
window.OBRIX_ANDROID_INSTALL={check:schedule,reopen:()=>{closedFor='';schedule()},isInstalled:standalone,status:()=>({promptAvailable:!!deferred,installed:standalone(),account:lastUid?'logged-in':'unknown'})};
})();
