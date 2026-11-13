(()=>{'use strict';
const $=s=>document.querySelector(s);
function fechar(){document.querySelector('.accountDeleteBack')?.remove()}
function abrirConfirmacao(){fechar();const b=document.createElement('div');b.className='modalBack accountDeleteBack';b.innerHTML=`<div class="modal accountDeleteModal"><button type="button" class="accountDeleteClose" aria-label="Fechar">×</button><h2>Excluir conta</h2><p class="accountDeleteWarn"><b>Atenção:</b> esta ação é permanente.</p><p>Seu login será excluído. Se você for o único usuário da empresa, também serão apagados os dados do OBRIX vinculados à conta.</p><p class="muted">Para confirmar, digite <b>EXCLUIR CONTA</b>.</p><input class="accountDeleteText" autocomplete="off" placeholder="EXCLUIR CONTA"><div class="accountDeleteError"></div><div class="modalActions"><button type="button" class="btn excluir">Excluir conta definitivamente</button></div></div>`;document.body.appendChild(b);b.querySelector('.accountDeleteClose').onclick=fechar;b.querySelector('.excluir').onclick=()=>excluirConta(b);setTimeout(()=>b.querySelector('.accountDeleteText')?.focus(),50)}
async function excluirConta(back){const input=back.querySelector('.accountDeleteText'),btn=back.querySelector('.excluir'),err=back.querySelector('.accountDeleteError');err.textContent='';if(String(input?.value||'').trim().toUpperCase()!=='EXCLUIR CONTA'){err.textContent='Digite EXCLUIR CONTA exatamente para confirmar.';return}btn.disabled=true;btn.textContent='Excluindo...';try{const sb=await OBRIX_BACKEND.init();const {data,error}=await sb.functions.invoke('obrix-delete-account',{body:{confirmacao:'EXCLUIR CONTA'}});if(error){let msg=data?.error||error.message||'Não foi possível excluir a conta.';try{const j=await error.context?.json?.();if(j?.error)msg=j.error}catch(_){}throw new Error(msg)}if(!data?.ok)throw new Error(data?.error||'Não foi possível excluir a conta.');try{await sb.auth.signOut({scope:'local'})}catch(_){}try{sessionStorage.clear()}catch(_){}location.replace(location.origin+location.pathname+'?conta=excluida')}catch(e){console.warn('Exclusão de conta OBRIX',e);err.textContent=e?.message||'Não foi possível excluir a conta.';btn.disabled=false;btn.textContent='Excluir conta definitivamente'}}
// Estilo exclusivo do botão. Evitar reescrever style quando o valor já é igual:
 // isso disparava MutationObservers e alternava cores de outros módulos.
const modelosVisualConta=new Map();
function estiloEsperado(tema){
 if(modelosVisualConta.has(tema))return modelosVisualConta.get(tema);
 const cor=tema==='dark'?'#fff':'#0f172a';
 const declaracoes=[
   ['background','transparent'],['background-color','transparent'],
   ['background-image','none'],['color',cor],['-webkit-text-fill-color',cor],
   ['border','0'],['outline','0'],['box-shadow','none'],['filter','none']
 ];
 const simulado=document.createElement('button').style;
 for(const [prop,valor] of declaracoes)simulado.setProperty(prop,valor,'important');
 const esperado=declaracoes.map(([prop])=>[prop,simulado.getPropertyValue(prop),simulado.getPropertyPriority(prop)]);
 modelosVisualConta.set(tema,esperado);return esperado;
}
function neutralizarBotao(btn){
 if(!btn)return;
 const tema=document.documentElement.dataset.theme==='dark'?'dark':'light';
 for(const [prop,valor,prioridade] of estiloEsperado(tema)){
   if(btn.style.getPropertyValue(prop)!==valor||btn.style.getPropertyPriority(prop)!==prioridade)
     btn.style.setProperty(prop,valor,prioridade);
 }
 for(const cls of ['danger','dangerAll','dangerBtn','btnDanger','destructive'])
   if(btn.classList.contains(cls))btn.classList.remove(cls);
}
function instalar(){const sair=$('#cfgSair');if(!sair)return false;let btn=$('#cfgExcluirConta');if(!btn){const card=sair.closest('.card');if(!card)return false;const info=document.createElement('p');info.className='muted accountDeleteInfo';info.textContent='Exclua permanentemente seu acesso e, quando aplicável, todos os dados vinculados à conta.';btn=document.createElement('button');btn.type='button';btn.id='cfgExcluirConta';btn.className='btn cfgFull accountDeleteBtn';btn.textContent='Excluir conta';btn.onclick=abrirConfirmacao;card.appendChild(info);card.appendChild(btn)}neutralizarBotao(btn);
 if(!btn.__obrixDeleteVisualObserver){
   btn.__obrixDeleteVisualObserver=true;
   // Somente mudanças de aparência deste botão, nunca o aplicativo inteiro.
   // Uma rotina antiga em cache não pode deixar o botão piscando.
   const obsBotao=new MutationObserver(()=>queueMicrotask(()=>neutralizarBotao(btn)));
   obsBotao.observe(btn,{attributes:true,attributeFilter:['style','class']});
 }
 return true}
const css=document.createElement('style');css.textContent=`html[data-theme="light"] #cfgExcluirConta,html[data-theme="light"] .accountDeleteBtn,html[data-theme="light"] #cfgExcluirConta:is(:hover,:focus,:active),html[data-theme="light"] .accountDeleteBtn:is(:hover,:focus,:active),body:not(.dark) #cfgExcluirConta,body:not(.dark) .accountDeleteBtn{background:transparent!important;background-color:transparent!important;background-image:none!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;border:0!important;outline:0!important;box-shadow:none!important;filter:none!important;transition:none!important;animation:none!important}html[data-theme="light"] #cfgExcluirConta::before,html[data-theme="light"] #cfgExcluirConta::after,html[data-theme="light"] .accountDeleteBtn::before,html[data-theme="light"] .accountDeleteBtn::after{background:transparent!important;background-color:transparent!important;background-image:none!important;border:0!important;box-shadow:none!important}.accountDeleteModal{max-width:520px;position:relative}.accountDeleteModal h2{margin-top:0;padding-right:42px}.accountDeleteClose,.accountDeleteClose:is(:hover,:focus,:active){position:absolute;top:12px;right:14px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;border:0!important;border-radius:50%;padding:0!important;margin:0!important;background:transparent!important;background-color:transparent!important;background-image:none!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;font-size:30px!important;font-weight:400!important;line-height:1!important;box-shadow:none!important;filter:none!important;transition:none!important;animation:none!important}.accountDeleteWarn{color:#0f172a!important;background:#fff!important;background-color:#fff!important;background-image:none!important;border:1px solid #cbd5e1!important;border-radius:11px;padding:10px 12px}.accountDeleteText{width:100%;padding:13px;border:1px solid var(--border,#cbd5e1);border-radius:11px;font-size:16px;margin:8px 0 10px}.accountDeleteError{min-height:20px;color:#0f172a!important;font-weight:800;font-size:13px;margin-bottom:8px}.accountDeleteModal .modalActions{display:flex!important;justify-content:flex-end!important}.accountDeleteModal .modalActions::before{display:none!important;content:none!important}.accountDeleteModal .excluir{min-width:220px!important;background:#fff!important;background-color:#fff!important;background-image:none!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;border:1px solid #cbd5e1!important;box-shadow:none!important}.accountDeleteModal .excluir:disabled{opacity:.55}html[data-theme="dark"] .accountDeleteBtn,body.dark .accountDeleteBtn,html[data-theme="dark"] .accountDeleteWarn,body.dark .accountDeleteWarn,html[data-theme="dark"] .accountDeleteModal .excluir,body.dark .accountDeleteModal .excluir{background:transparent!important;background-color:transparent!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#475569!important;box-shadow:none!important}html[data-theme="dark"] .accountDeleteError,body.dark .accountDeleteError{color:#fff!important}html[data-theme="dark"] .accountDeleteClose,html[data-theme="dark"] .accountDeleteClose:is(:hover,:focus,:active),body.dark .accountDeleteClose,body.dark .accountDeleteClose:is(:hover,:focus,:active){background:transparent!important;background-color:transparent!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;box-shadow:none!important}`;document.head.appendChild(css);const obs=new MutationObserver(muts=>{
 // Instalar só quando a tela de Configurações surgir; nenhuma varredura
 // em mudanças de cartões, registros e textos do restante do OBRIX.
 if(muts.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&
   (n.matches?.('#configMain,#cfgSair')||n.querySelector?.('#cfgSair')))))instalar();
});
obs.observe(document.body,{childList:true,subtree:true});
new MutationObserver(()=>neutralizarBotao($('#cfgExcluirConta')))
 .observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,250));else setTimeout(instalar,250);window.OBRIX_ACCOUNT_DELETE={open:abrirConfirmacao};
})();