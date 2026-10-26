(()=>{'use strict';
const $=s=>document.querySelector(s);
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fechar(){document.querySelector('.accountDeleteBack')?.remove()}
function abrirConfirmacao(){
  fechar();
  const b=document.createElement('div');
  b.className='modalBack accountDeleteBack';
  b.innerHTML=`<div class="modal accountDeleteModal">
    <h2>Excluir conta</h2>
    <p class="accountDeleteWarn"><b>Atenção:</b> esta ação é permanente.</p>
    <p>Seu login será excluído. Se você for o único usuário da empresa, também serão apagados os dados do OBRIX vinculados à conta.</p>
    <p class="muted">Para confirmar, digite <b>EXCLUIR CONTA</b>.</p>
    <input class="accountDeleteText" autocomplete="off" placeholder="EXCLUIR CONTA">
    <div class="accountDeleteError"></div>
    <div class="modalActions"><button type="button" class="btn cancelar">Cancelar</button><button type="button" class="btn excluir">Excluir conta definitivamente</button></div>
  </div>`;
  document.body.appendChild(b);
  b.querySelector('.cancelar').onclick=fechar;
  b.querySelector('.excluir').onclick=()=>excluirConta(b);
  setTimeout(()=>b.querySelector('.accountDeleteText')?.focus(),50);
}
async function excluirConta(back){
  const input=back.querySelector('.accountDeleteText'),btn=back.querySelector('.excluir'),err=back.querySelector('.accountDeleteError');
  err.textContent='';
  if(String(input?.value||'').trim().toUpperCase()!=='EXCLUIR CONTA'){err.textContent='Digite EXCLUIR CONTA exatamente para confirmar.';return}
  btn.disabled=true;btn.textContent='Excluindo...';
  try{
    const sb=await OBRIX_BACKEND.init();
    const {data,error}=await sb.functions.invoke('obrix-delete-account',{body:{confirmacao:'EXCLUIR CONTA'}});
    if(error){let msg=data?.error||error.message||'Não foi possível excluir a conta.';try{const j=await error.context?.json?.();if(j?.error)msg=j.error}catch(_){}throw new Error(msg)}
    if(!data?.ok)throw new Error(data?.error||'Não foi possível excluir a conta.');
    try{await sb.auth.signOut({scope:'local'})}catch(_){}try{sessionStorage.clear()}catch(_){}location.replace(location.origin+location.pathname+'?conta=excluida');
  }catch(e){console.warn('Exclusão de conta OBRIX',e);err.textContent=e?.message||'Não foi possível excluir a conta.';btn.disabled=false;btn.textContent='Excluir conta definitivamente'}
}
function instalar(){const sair=$('#cfgSair');if(!sair||$('#cfgExcluirConta'))return false;const card=sair.closest('.card');if(!card)return false;const info=document.createElement('p');info.className='muted accountDeleteInfo';info.textContent='Exclua permanentemente seu acesso e, quando aplicável, todos os dados vinculados à conta.';const btn=document.createElement('button');btn.type='button';btn.id='cfgExcluirConta';btn.className='btn cfgFull accountDeleteBtn';btn.textContent='Excluir conta';btn.onclick=abrirConfirmacao;card.appendChild(info);card.appendChild(btn);return true}
const css=document.createElement('style');css.textContent=`
.accountDeleteInfo{margin:16px 0 8px}.accountDeleteBtn,.accountDeleteModal .excluir{background:transparent!important;background-color:transparent!important;background-image:none!important;color:#b91c1c!important;-webkit-text-fill-color:#b91c1c!important;border:1.5px solid #dc2626!important;box-shadow:none!important;filter:none!important;transition:none!important;animation:none!important}.accountDeleteBtn:is(:hover,:focus,:active),.accountDeleteModal .excluir:is(:hover,:focus,:active){background:transparent!important;background-color:transparent!important;color:#b91c1c!important;-webkit-text-fill-color:#b91c1c!important;border-color:#dc2626!important;box-shadow:none!important;filter:none!important}.accountDeleteModal{max-width:520px}.accountDeleteModal h2{margin-top:0}.accountDeleteWarn{color:#991b1b;background:#fff!important;border:1px solid #fecaca;border-radius:11px;padding:10px 12px}.accountDeleteText{width:100%;padding:13px;border:1px solid var(--border,#cbd5e1);border-radius:11px;font-size:16px;margin:8px 0 10px}.accountDeleteError{min-height:20px;color:#b91c1c;font-weight:800;font-size:13px;margin-bottom:8px}.accountDeleteModal .excluir:disabled{opacity:.55}html[data-theme="dark"] .accountDeleteWarn,body.dark .accountDeleteWarn{background:#0d1722!important;color:#fecdd3;border-color:#7f1d1d}
`;document.head.appendChild(css);
const obs=new MutationObserver(()=>instalar());obs.observe(document.body,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,250));else setTimeout(instalar,250);window.OBRIX_ACCOUNT_DELETE={open:abrirConfirmacao};
})();