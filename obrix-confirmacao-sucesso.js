/* OBRIX — confirmação de gravação. Exibir apenas após persistência confirmada. */
(()=>{'use strict';
 if(window.OBRIX_SUCESSO)return;
 let timer=0,active=null,previous='',lastAt=0;
 const show=(message)=>{
  const msg=String(message||'Registro salvo com sucesso.').trim().slice(0,180);
  const now=Date.now();
  // Evitar repetições de chamadas da mesma ação, sem esconder outra confirmação.
  if(msg===previous&&now-lastAt<850)return;
  previous=msg;lastAt=now;
  if(active){active.remove();active=null}
  clearTimeout(timer);
  const el=document.createElement('div');
  el.className='obrixSuccessNotice';
  el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  el.textContent='✓ '+msg;
  if(!document.getElementById('obrixSuccessNoticeStyle')){
   const style=document.createElement('style');style.id='obrixSuccessNoticeStyle';
   style.textContent='.obrixSuccessNotice{position:fixed!important;z-index:2147483000!important;left:12px!important;right:12px!important;bottom:calc(95px + env(safe-area-inset-bottom,0px))!important;box-sizing:border-box!important;width:min(440px,calc(100% - 24px))!important;margin:auto!important;min-height:42px!important;padding:11px 15px!important;background:#142435!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border:1px solid #64748b!important;border-radius:12px!important;box-shadow:0 5px 20px #0004!important;font-size:14px!important;font-weight:700!important;line-height:1.4!important;text-align:center!important;pointer-events:none!important;white-space:normal!important;overflow-wrap:break-word!important}';
   document.head.appendChild(style);
  }
  document.body.appendChild(el);
  active=el;
  timer=setTimeout(()=>{if(active===el){active=null;el.remove()}},2100);
 };
 window.OBRIX_SUCESSO=show;
})();