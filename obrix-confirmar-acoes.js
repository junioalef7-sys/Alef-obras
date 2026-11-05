(()=>{'use strict';
  if(window.OBRIX_CONFIRMAR_EXCLUSAO)return;
  const ensureStyle=()=>{
    if(document.getElementById('obrixConfirmDialogStyle'))return;
    const s=document.createElement('style');s.id='obrixConfirmDialogStyle';
    s.textContent=`
      .obrixConfirmOverlay{position:fixed!important;inset:0!important;z-index:2147482700!important;background:rgba(5,14,26,.68)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;box-sizing:border-box!important}
      .obrixConfirmBox{width:min(100%,430px)!important;background:var(--ob-surface,#fff)!important;color:var(--ob-text,#111827)!important;border:1px solid var(--ob-border,#cbd5e1)!important;border-radius:17px!important;padding:22px!important;box-shadow:0 16px 50px rgba(0,0,0,.3)!important;font-family:inherit!important}
      .obrixConfirmBox h2{font-size:20px!important;line-height:1.2!important;margin:0 0 12px!important;font-weight:850!important;color:inherit!important}
      .obrixConfirmBox p{font-size:15px!important;line-height:1.5!important;color:inherit!important;margin:0 0 18px!important;white-space:pre-wrap!important;overflow-wrap:break-word!important}
      .obrixConfirmActions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}
      .obrixConfirmActions button{min-height:46px!important;border-radius:11px!important;font-size:15px!important;font-weight:800!important;padding:9px!important}
      .obrixConfirmCancel{background:var(--ob-surface-2,#f1f5f9)!important;color:var(--ob-text,#111827)!important;border:1px solid var(--ob-border,#cbd5e1)!important}
      .obrixConfirmDelete{background:#b91c1c!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border:1px solid #991b1b!important}
    `;document.head.appendChild(s);
  };
  window.OBRIX_CONFIRMAR_EXCLUSAO=({titulo='Confirmar exclusão',mensagem='Deseja continuar?',confirmar='Excluir',cancelar='Cancelar'}={})=>new Promise(resolve=>{
    ensureStyle();
    const back=document.createElement('div');back.className='obrixConfirmOverlay';back.setAttribute('role','presentation');
    back.innerHTML='<div class="obrixConfirmBox" role="dialog" aria-modal="true" aria-labelledby="obrixConfirmTitle"><h2 id="obrixConfirmTitle"></h2><p></p><div class="obrixConfirmActions"><button type="button" class="obrixConfirmCancel"></button><button type="button" class="obrixConfirmDelete"></button></div></div>';
    back.querySelector('h2').textContent=String(titulo);
    back.querySelector('p').textContent=String(mensagem);
    const cancel=back.querySelector('.obrixConfirmCancel'),yes=back.querySelector('.obrixConfirmDelete');
    cancel.textContent=String(cancelar);yes.textContent=String(confirmar);
    let done=false;
    const esc=e=>{if(e.key==='Escape'){e.preventDefault();finish(false)}};
    function finish(ok){if(done)return;done=true;document.removeEventListener('keydown',esc,true);back.remove();resolve(ok)}
    cancel.onclick=()=>finish(false);yes.onclick=()=>finish(true);
    back.onclick=e=>{if(e.target===back)finish(false)};
    document.body.appendChild(back);document.addEventListener('keydown',esc,true);cancel.focus();
  });
  // Non-destructive in-app notice. Used also when deletion is blocked by linked
  // records; avoids browser-native "vercel.app diz" alert headers.
  window.OBRIX_AVISO=(mensagem,titulo='Atenção')=>new Promise(resolve=>{
    ensureStyle();
    const overlay=document.createElement('div');overlay.className='obrixConfirmOverlay';
    overlay.innerHTML='<div class="obrixConfirmBox" role="alertdialog" aria-modal="true" aria-labelledby="obrixAvisoTitulo"><h2 id="obrixAvisoTitulo"></h2><p></p><div class="obrixConfirmActions" style="grid-template-columns:1fr!important"><button type="button" class="obrixConfirmCancel">OK</button></div></div>';
    overlay.querySelector('h2').textContent=String(titulo);
    overlay.querySelector('p').textContent=String(mensagem);
    let done=false;
    const key=e=>{if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();close()}};
    function close(){if(done)return;done=true;document.removeEventListener('keydown',key,true);overlay.remove();resolve()}
    overlay.querySelector('button').onclick=close;
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    document.body.appendChild(overlay);document.addEventListener('keydown',key,true);
    overlay.querySelector('button').focus();
  });

})();