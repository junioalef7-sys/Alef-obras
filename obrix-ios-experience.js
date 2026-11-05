(()=>{
'use strict';
if(window.__OBRIX_IOS_PULL_V1)return;
window.__OBRIX_IOS_PULL_V1=true;
const ios=/iPad|iPhone|iPod/i.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!ios)return;
let closing=false;
function hideSplash(){
 if(closing)return;closing=true;document.documentElement.classList.remove('obrixIosLaunchReady');
 const el=document.getElementById('obrixIosLaunch');
 if(el){el.setAttribute('aria-hidden','true');setTimeout(()=>el.remove(),450)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(hideSplash,1300),{once:true});else setTimeout(hideSplash,1300);
setTimeout(hideSplash,8000);
function boot(){
 const standalone=navigator.standalone===true||window.matchMedia?.('(display-mode: standalone)')?.matches===true;
 if(!standalone||!document.body)return;
 const style=document.createElement('style');style.id='obrixIosPullStyle';style.textContent="\n#obrixIosPull{position:fixed;top:max(8px,env(safe-area-inset-top));left:50%;z-index:2147483000;display:flex;align-items:center;gap:8px;padding:11px 14px;max-width:calc(100vw - 26px);border:1px solid #cbd5e1;border-radius:30px;background:#fff;color:#101820;box-shadow:0 5px 24px #0f172a26;font:700 13px -apple-system,BlinkMacSystemFont,sans-serif;white-space:nowrap;opacity:0;pointer-events:none;transform:translate(-50%,-85px);transition:opacity .18s,transform .18s}\n#obrixIosPull.show{opacity:1}#obrixIosPull .glyph{font-size:22px;color:#ff5a00;line-height:1}#obrixIosPull.busy .glyph{animation:obrixIosSpin .8s linear infinite}@keyframes obrixIosSpin{to{transform:rotate(360deg)}}html[data-theme=\"dark\"] #obrixIosPull{background:#111e2c;border-color:#334155;color:#f8fafc}\n@media(prefers-reduced-motion:reduce){#obrixIosPull.busy .glyph{animation:none}}\n";document.head.appendChild(style);
 const indicator=document.createElement('div');indicator.id='obrixIosPull';indicator.setAttribute('role','status');indicator.setAttribute('aria-live','polite');indicator.innerHTML='<span class="glyph" aria-hidden="true">↻</span><span class="text">Puxe para atualizar</span>';document.body.appendChild(indicator);
 const label=indicator.querySelector('.text');
 const limit=88;let startY=0,startX=0,pull=0,ready=false,updating=false,last=0,timer=null;
 function show(message,d=43){clearTimeout(timer);label.textContent=message;indicator.classList.add('show');indicator.style.transform='translate(-50%,'+Math.min(60,Math.max(0,d))+'px)'}
 function hide(delay=0){clearTimeout(timer);timer=setTimeout(()=>{indicator.classList.remove('show','busy');indicator.style.transform='translate(-50%,-85px)'},delay)}
 function top(target){
  const app=document.getElementById('app');
  if(!app||app.classList.contains('hidden')||!app.contains(target))return false;
  if(document.querySelector('.modalBack:not(.hidden),.obxOnboarding:not(.hidden),.obrix-pessoal2-screen,.obrix-diretorio-back'))return false;
  if(target.closest?.('input,textarea,select,button,a,[contenteditable="true"],[role="dialog"],[role="slider"]'))return false;
  if(window.scrollY>2||document.scrollingElement?.scrollTop>2)return false;
  let node=target;
  while(node&&node!==document.body){if(node.scrollTop>2&&node.scrollHeight>node.clientHeight+3)return false;node=node.parentElement}
  return true;
 }
 function touchStart(e){
  ready=false;pull=0;
  if(updating||Date.now()-last<900||e.touches?.length!==1||!top(e.target))return;
  ready=true;startY=e.touches[0].clientY;startX=e.touches[0].clientX;
 }
 function touchMove(e){
  if(!ready||updating||e.touches?.length!==1)return;
  const y=e.touches[0].clientY-startY,x=Math.abs(e.touches[0].clientX-startX);
  if(y<=8){if(y< -12)ready=false;return}
  if(x>y*.75){ready=false;return}
  if(!top(e.target)){ready=false;hide();return}
  if(e.cancelable)e.preventDefault();
  pull=Math.min(y,160);show(pull>=limit?'Solte para atualizar':'Puxe para atualizar',pull*.35);
 }
 async function refresh(){
  if(updating)return;updating=true;last=Date.now();indicator.classList.add('busy');show('Atualizando...',45);
  try{
   if(!navigator.onLine||window.__OBRIX_FORCE_OFFLINE||document.documentElement.dataset.obrixOffline==='1'){show('Sem internet — dados preservados',45);return}
   const timeout=new Promise((_,reject)=>setTimeout(()=>reject(Error('timeout')),19000));
   if(typeof window.OBRIX_REFRESH_ALL==='function'){
    await Promise.race([Promise.resolve(window.OBRIX_REFRESH_ALL()),timeout]);
   }else if(typeof window.carregar==='function'){
    const result=await Promise.race([Promise.resolve(window.carregar()),timeout]);
    if(result===false)throw Error('no data');
    await Promise.allSettled([Promise.resolve().then(()=>window.OBRIX_FIN?.render?.(true)),Promise.resolve().then(()=>window.OBRIX_EQUIPE?.refresh?.()),Promise.resolve().then(()=>window.OBRIX_OBRAS_FIEL?.refresh?.()),Promise.resolve().then(()=>window.OBRIX_DASH?.paint?.())]);
   }else throw Error('update unavailable');
   show('Atualização concluída',45);
  }catch(e){console.warn('OBRIX iOS: falha na atualização',e?.name||'erro');show('Não foi possível atualizar',45)}
  finally{indicator.classList.remove('busy');updating=false;hide(1250)}
 }
 function touchEnd(){if(ready&&pull>=limit&&!updating)void refresh();else if(!updating)hide();ready=false;pull=0}
 document.addEventListener('touchstart',touchStart,{passive:true});
 document.addEventListener('touchmove',touchMove,{passive:false});
 document.addEventListener('touchend',touchEnd,{passive:true});
 document.addEventListener('touchcancel',()=>{ready=false;pull=0;if(!updating)hide()},{passive:true});
 window.addEventListener('pagehide',()=>{ready=false;pull=0});
 window.OBRIX_IOS_PULL_REFRESH={refresh};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();