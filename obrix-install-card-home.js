/* OBRIX — instalação na Início, sem depender do carregamento da Equipe. */
(()=>{'use strict';
 if(window.__OBRIX_HOME_INSTALL_V1)return;window.__OBRIX_HOME_INSTALL_V1=true;
 const KEY='obrix_instalar_card_dispensado_sessao_v2';
 let fechado=false,promptInstalacao=null,pendente=false,observando=false;
 function instalado(){return !!(window.matchMedia?.('(display-mode: standalone)')?.matches||navigator.standalone===true)}
 function dispensado(){if(fechado)return true;try{return sessionStorage.getItem(KEY)==='1'}catch(_){return false}}
 function remover(){document.getElementById('obrixInstalarApp')?.remove()}
 function fechar(){fechado=true;try{sessionStorage.setItem(KEY,'1')}catch(_){}remover()}
 function estilo(){
  if(document.getElementById('obrixHomeInstallCss'))return;
  const el=document.createElement('style');el.id='obrixHomeInstallCss';
  el.textContent=[
   '#inicio #obpHome>#obrixInstalarApp{display:block!important;visibility:visible!important;opacity:1!important;position:relative!important;z-index:1!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-height:0!important;padding:15px!important;margin:12px 0 17px!important;border:1px solid var(--obp-border,var(--ob-border,#cbd5e1))!important;border-radius:15px!important;background:var(--obp-panel,var(--ob-surface,#fff))!important;color:var(--obp-text,var(--ob-text,#0f172a))!important}',
   '#obrixInstalarApp .obrix-instalar-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:9px!important}',
   '#obrixInstalarApp .obrix-instalar-head h2{font-size:18px!important;line-height:1.25!important;margin:0!important}',
   '#obrixInstalarApp .obrix-instalar-fechar{flex:none!important;width:38px!important;height:38px!important;border:1px solid var(--ob-border,#cbd5e1)!important;background:var(--ob-surface-2,#e5eaf0)!important;color:var(--ob-text,#0f172a)!important;-webkit-text-fill-color:var(--ob-text,#0f172a)!important;border-radius:9px!important;font-size:24px!important;cursor:pointer!important}',
   '#obrixInstalarApp>p{margin:6px 0 9px!important;line-height:1.4!important}',
   '#obrixInstalarApp .obrix-instalar-btn{width:100%!important;min-height:46px!important;background:var(--ob-accent,#ff5a00)!important;border:1px solid var(--ob-accent,#ff5a00)!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-radius:11px!important;font-weight:800!important;cursor:pointer!important}',
   '#obrixInstalarApp .obrix-instrucoes-install{border-top:1px solid var(--ob-border,#cbd5e1)!important;margin-top:10px!important;padding-top:9px!important}',
   '#obrixInstalarApp .obrix-instrucoes-install summary{cursor:pointer!important;font-weight:750!important;color:inherit!important;-webkit-text-fill-color:inherit!important}',
   '#obrixInstalarApp .obrix-instrucoes-install p{margin:8px 0!important;line-height:1.45!important}',
   'html[data-theme="dark"] #inicio #obpHome>#obrixInstalarApp{background:var(--obp-panel,#101f2e)!important;color:var(--obp-text,#f8fafc)!important;border-color:var(--obp-border,#334155)!important}'
  ].join('\n');document.head.appendChild(el);
 }
 function criar(){
  const e=document.createElement('section');e.id='obrixInstalarApp';e.className='card obrix-instalar-card';
  e.innerHTML='<div class="obrix-instalar-head"><h2>Instalar o OBRIX</h2><button type="button" class="obrix-instalar-fechar" aria-label="Fechar instalação" title="Fechar">×</button></div>'+
  '<p class="muted">Tenha o aplicativo na tela inicial para abrir mais rápido.</p>'+
  '<button type="button" class="btn obrix-instalar-btn">Instalar aplicativo</button>'+
  '<details class="obrix-instrucoes-install"><summary>Ver instruções de instalação</summary><div>'+
  '<p><b>Computador — Chrome:</b> menu ⋮ → Transmitir, salvar e compartilhar → Instalar página como app (ou ícone de instalação na barra).</p>'+
  '<p><b>iPhone — Safari:</b> Compartilhar → Adicionar à Tela de Início → Adicionar.</p>'+
  '<p><b>Android — Chrome:</b> menu ⋮ → Instalar aplicativo.</p></div></details>';
  e.querySelector('.obrix-instalar-fechar').onclick=fechar;
  e.querySelector('.obrix-instalar-btn').onclick=async()=>{
   if(promptInstalacao&&typeof promptInstalacao.prompt==='function'){
    const evento=promptInstalacao;promptInstalacao=null;
    try{await evento.prompt();const resposta=await evento.userChoice;if(resposta?.outcome==='accepted'){fechar();return}}catch(_){}
   }
   // Se o navegador não disponibilizar a instalação automática, abrir orientação.
   const guia=e.querySelector('details');guia.open=true;
   guia.scrollIntoView({block:'nearest',behavior:'instant'});
  };
  return e;
 }
 function atualizar(){
  const app=document.getElementById('app'),inicio=document.getElementById('inicio');
  if(!app||!inicio)return;
  if(instalado()||dispensado()){remover();return}
  if(app.classList.contains('hidden')||inicio.classList.contains('hidden'))return;
  // O Início Premium monta o HTML depois do login. Não usar o rodapé como
  // fallback quando .obp-shortcuts ainda não existe.
  const atalhos=inicio.querySelector('#obpHome .obp-shortcuts');
  if(!atalhos)return;
  estilo();
  let card=document.getElementById('obrixInstalarApp');
  if(!card)card=criar();
  if(card.parentElement!==atalhos.parentElement||card.previousElementSibling!==atalhos)
   atalhos.insertAdjacentElement('afterend',card);
 }
 function agendar(){if(pendente)return;pendente=true;queueMicrotask(()=>{pendente=false;atualizar()})}
 function iniciar(){
  if(observando)return;
  const app=document.getElementById('app'),inicio=document.getElementById('inicio');
  if(!app||!inicio)return;observando=true;
  new MutationObserver(agendar).observe(app,{attributes:true,attributeFilter:['class']});
  new MutationObserver(agendar).observe(inicio,{childList:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('pageshow',agendar);
  window.addEventListener('obrix:modules-ready',agendar);
  window.addEventListener('obrix:offline-core-restaurado',agendar);
  agendar();
 }
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptInstalacao=event;agendar()});
 window.addEventListener('appinstalled',()=>{fechado=true;remover()});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
 window.OBRIX_INSTALL_HOME={refresh:agendar,close:fechar};
})();