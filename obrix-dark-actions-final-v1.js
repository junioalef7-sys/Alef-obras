(()=>{'use strict';
if(window.__OBRIX_DARK_ACTIONS_FINAL_V1)return;window.__OBRIX_DARK_ACTIONS_FINAL_V1=true;
const STYLE_ID='obrixDarkActionsFinalV1';
const CSS=`
:root{--obrix-action-card:#0f1720;--obrix-action-border:#2a3948;--obrix-action-text:#eef2f7;--obrix-action-red:#ff7878;--obrix-action-red-solid:#b91c1c}

/* Vale, Cancelar, Registrar Diaria/Diario e Registrar Falta. */
html[data-theme="dark"] body #app button.obrixAcaoOriginalFinal,body.dark #app button.obrixAcaoOriginalFinal,
html[data-theme="dark"] body .modalBack button.obrixAcaoOriginalFinal,body.dark .modalBack button.obrixAcaoOriginalFinal,
html[data-theme="dark"] body button.obrixAcaoOriginalFinal.obrixAcaoOriginalFinal,body.dark button.obrixAcaoOriginalFinal.obrixAcaoOriginalFinal{
background:var(--obrix-action-card)!important;background-color:var(--obrix-action-card)!important;background-image:none!important;color:var(--obrix-action-text)!important;-webkit-text-fill-color:var(--obrix-action-text)!important;border:1px solid var(--obrix-action-border)!important;box-shadow:none!important;text-shadow:none!important}

/* Excluir comum: fundo original, borda vermelha e letras vermelhas. */
html[data-theme="dark"] body #app button.obrixExcluirFinal,body.dark #app button.obrixExcluirFinal,
html[data-theme="dark"] body .modalBack button.obrixExcluirFinal,body.dark .modalBack button.obrixExcluirFinal,
html[data-theme="dark"] body button.obrixExcluirFinal.obrixExcluirFinal,body.dark button.obrixExcluirFinal.obrixExcluirFinal{
background:var(--obrix-action-card)!important;background-color:var(--obrix-action-card)!important;background-image:none!important;color:var(--obrix-action-red)!important;-webkit-text-fill-color:var(--obrix-action-red)!important;border:1px solid var(--obrix-action-red)!important;box-shadow:none!important;text-shadow:none!important}
html[data-theme="dark"] body button.obrixExcluirFinal *,body.dark button.obrixExcluirFinal *{color:var(--obrix-action-red)!important;-webkit-text-fill-color:var(--obrix-action-red)!important}

/* Excluir Conta e apagamentos gerais: vermelho cheio, letras brancas. */
html[data-theme="dark"] body #app button.obrixDestrutivoFinal,body.dark #app button.obrixDestrutivoFinal,
html[data-theme="dark"] body .modalBack button.obrixDestrutivoFinal,body.dark .modalBack button.obrixDestrutivoFinal,
html[data-theme="dark"] body button.obrixDestrutivoFinal.obrixDestrutivoFinal,body.dark button.obrixDestrutivoFinal.obrixDestrutivoFinal{
background:var(--obrix-action-red-solid)!important;background-color:var(--obrix-action-red-solid)!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border:1px solid #991b1b!important;box-shadow:none!important;text-shadow:none!important}
html[data-theme="dark"] body button.obrixDestrutivoFinal *,body.dark button.obrixDestrutivoFinal *{color:#fff!important;-webkit-text-fill-color:#fff!important}
`;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
function style(){let s=document.getElementById(STYLE_ID);if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s)}if(s.textContent!==CSS)s.textContent=CSS;if(document.head.lastElementChild!==s)document.head.appendChild(s)}
function clearOld(b){b.classList.remove('obrixApprovedGold','obrixApprovedSecondary','obrixEquipeAzulClaro');b.removeAttribute('data-obrix-approved-color')}
function scan(){document.querySelectorAll('button').forEach(b=>{const t=norm(b.textContent);const destructive=/^(excluir conta|apagar tudo|apagar (a )?(obras|equipe|financeiro))\b/.test(t);const exclude=/\b(excluir|remover|apagar|deletar)\b/.test(t)||b.matches('.danger,.perigo,.orcPerigo,.diarioPerigo,[data-cmd="excluir"],[data-acao="excluir"]');const neutral=/\bvale\b/.test(t)||/registrar (diaria|diario)/.test(t)||/registrar falta/.test(t)||/^cancelar\b/.test(t);if(destructive){b.classList.add('obrixDestrutivoFinal');b.classList.remove('obrixExcluirFinal','obrixAcaoOriginalFinal');clearOld(b);return}else b.classList.remove('obrixDestrutivoFinal');if(exclude){b.classList.add('obrixExcluirFinal');b.classList.remove('obrixAcaoOriginalFinal');clearOld(b);return}else b.classList.remove('obrixExcluirFinal');if(neutral){b.classList.add('obrixAcaoOriginalFinal');clearOld(b)}else b.classList.remove('obrixAcaoOriginalFinal')})}
let timer=0;function apply(){style();scan()}function schedule(){clearTimeout(timer);timer=setTimeout(apply,40)}
function start(){apply();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});new MutationObserver(()=>{const s=document.getElementById(STYLE_ID);if(s&&document.head.lastElementChild!==s)setTimeout(style,0)}).observe(document.head,{childList:true});['pageshow','obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:theme-changed'].forEach(n=>window.addEventListener(n,schedule));document.addEventListener('click',()=>setTimeout(schedule,0),true);setTimeout(apply,150);setTimeout(apply,700);setTimeout(apply,1500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();