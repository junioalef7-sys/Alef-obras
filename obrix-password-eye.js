(()=>{'use strict';
function eyeSvg(open){return open?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.5-6 9-6c2.1 0 4 .9 5.5 2M21 12s-3.5 6-9 6c-2.1 0-4-.9-5.5-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4 4l16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'}
function enhance(input){if(!input||input.dataset.obrixEye==='1')return;input.dataset.obrixEye='1';const wrap=document.createElement('div');wrap.className='obrixPasswordWrap';input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);const btn=document.createElement('button');btn.type='button';btn.className='obrixPasswordEye';btn.setAttribute('aria-label','Mostrar senha');btn.setAttribute('title','Mostrar senha');btn.innerHTML=eyeSvg(true);btn.onclick=()=>{const showing=input.type==='text';input.type=showing?'password':'text';btn.setAttribute('aria-label',showing?'Mostrar senha':'Ocultar senha');btn.setAttribute('title',showing?'Mostrar senha':'Ocultar senha');btn.innerHTML=eyeSvg(showing);input.focus({preventScroll:true});try{input.setSelectionRange(input.value.length,input.value.length)}catch(_){}};wrap.appendChild(btn)}
function scan(root=document){root.querySelectorAll?.('input[type="password"]:not([data-obrix-eye="1"])').forEach(enhance)}
const style=document.createElement('style');style.textContent=`.obrixPasswordWrap{position:relative;width:100%;display:block}.obrixPasswordWrap input{padding-right:48px!important;width:100%!important}.obrixPasswordEye{position:absolute;right:7px;top:50%;transform:translateY(-50%);width:38px;height:38px;display:grid;place-items:center;border:0;border-radius:9px;background:transparent;color:var(--muted,#64748b);padding:8px;z-index:2}.obrixPasswordEye:hover{background:rgba(100,116,139,.10)}.obrixPasswordEye:focus-visible{outline:2px solid #ff5a00;outline-offset:1px}.obrixPasswordEye svg{width:21px;height:21px;display:block}html[data-theme="dark"] .obrixPasswordEye{color:#cbd5e1}html[data-theme="dark"] .obrixPasswordEye:hover{background:rgba(255,255,255,.08)}`;document.head.appendChild(style);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>scan());else scan();new MutationObserver(m=>{for(const x of m)for(const n of x.addedNodes)if(n.nodeType===1)scan(n)}).observe(document.documentElement,{childList:true,subtree:true});
function load(src,key){if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.setAttribute(`data-${key}`,'1');s.src=src;document.head.appendChild(s)}
load('./obrix-backup-completo.js?v=20261020full2','obrix-backup-completo');
load('./obrix-notas-main.js?v=20261020notas3','obrix-notas-main');
load('./obrix-checklist-offline.js?v=20261021offline3','obrix-checklist-offline');
load('./obrix-obras-offline.js?v=20261021offlineobras1','obrix-obras-offline');
load('./obrix-equipe-offline.js?v=20261021offlineequipe1','obrix-equipe-offline');
load('./obrix-estoque-offline.js?v=20261021offlineestoque1','obrix-estoque-offline');
load('./obrix-financeiro-offline.js?v=20261021offlinefin1','obrix-financeiro-offline');
load('./obrix-home-offline.js?v=20261021offlinehome1','obrix-home-offline');
load('./obrix-offline-conflicts.js?v=20261021resolve1','obrix-offline-conflicts');
load('./obrix-offline-central.js?v=20261021central6','obrix-offline-central');
load('./obrix-offline-diagnostico.js?v=20261021diag3','obrix-offline-diagnostico');
load('./obrix-offline-preparo.js?v=20261021prep3','obrix-offline-preparo');
load('./obrix-offline-teste.js?v=20261021test2','obrix-offline-teste');
load('./obrix-offline-acoes-teste.js?v=20261021actions1','obrix-offline-acoes-teste');
load('./obrix-offline-historico.js?v=20261021history1','obrix-offline-historico');
load('./obrix-offline-aprovacao.js?v=20261021approval3','obrix-offline-aprovacao');
})();