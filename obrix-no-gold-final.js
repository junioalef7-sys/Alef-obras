(()=>{'use strict';
if(window.__OBRIX_NO_GOLD_FINAL)return;window.__OBRIX_NO_GOLD_FINAL=true;
const STYLE_ID='obrixNoGoldFinalCss';
const CSS=`
:root{--obrix-final-card:#0f1720;--obrix-final-bg:#0A1018;--obrix-final-border:#2a3948;--obrix-final-text:#eef2f7;--obrix-final-red:#ff7878;--obrix-final-red-solid:#b91c1c;--obrix-final-green:#65d99b;--obrix-final-blue:#4da3ff}

html:not([data-theme="dark"]) body #app .btn:not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo):not(.obrixExcluirAprovado):not(.obrixPermanentNeutral):not(.obrixPayMethod):not(.obrixPagarSemFundo),
html:not([data-theme="dark"]) body #app button.obrixApprovedGold:not(.obrixExcluirAprovado):not(.obrixPermanentNeutral):not(.obrixPayMethod):not(.obrixPagarSemFundo){background:#0f172a!important;background-color:#0f172a!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#0f172a!important;box-shadow:none!important;text-shadow:none!important}

html[data-theme="dark"] body,body.dark{background:var(--obrix-final-bg)!important;background-color:var(--obrix-final-bg)!important;background-image:none!important}

html[data-theme="dark"] #app .card,html[data-theme="dark"] #app .kpi,html[data-theme="dark"] #app .mini,html[data-theme="dark"] #app .obrix-resumo-grid>div,html[data-theme="dark"] #app #menuMain .opmGrid article,html[data-theme="dark"] #app #menuMain .opmVersion,html[data-theme="dark"] #app #menuMain .opmProfile,html[data-theme="dark"] #app .offFastResumo>div,html[data-theme="dark"] #app .offFastGrid article,
body.dark #app .card,body.dark #app .kpi,body.dark #app .mini,body.dark #app .obrix-resumo-grid>div,body.dark #app #menuMain .opmGrid article,body.dark #app #menuMain .opmVersion,body.dark #app #menuMain .opmProfile,body.dark #app .offFastResumo>div,body.dark #app .offFastGrid article{background:var(--obrix-final-card)!important;background-color:var(--obrix-final-card)!important;background-image:none!important}

html[data-theme="dark"] body #app button:not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo):not(.obrixExcluirAprovado):not(.obrixPermanentNeutral):not(.obrixPayMethod):not(.obrixPagarSemFundo):not(.obrixDestrutivoCheio),
body.dark #app button:not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo):not(.obrixExcluirAprovado):not(.obrixPermanentNeutral):not(.obrixPayMethod):not(.obrixPagarSemFundo):not(.obrixDestrutivoCheio){background:var(--obrix-final-card)!important;background-color:var(--obrix-final-card)!important;background-image:none!important;color:var(--obrix-final-text)!important;-webkit-text-fill-color:var(--obrix-final-text)!important;border-color:var(--obrix-final-border)!important;box-shadow:none!important;text-shadow:none!important}

html[data-theme="dark"] body #app button.active:not(.obrixExcluirAprovado):not(.obrixPayMethod):not(.obrixDestrutivoCheio),html[data-theme="dark"] body #app button.selected:not(.obrixExcluirAprovado):not(.obrixPayMethod):not(.obrixDestrutivoCheio),html[data-theme="dark"] body #app button.selecionado:not(.obrixExcluirAprovado):not(.obrixPayMethod):not(.obrixDestrutivoCheio),html[data-theme="dark"] body #app button[aria-pressed="true"]:not(.obrixExcluirAprovado):not(.obrixPayMethod):not(.obrixDestrutivoCheio),html[data-theme="dark"] body #app button[aria-selected="true"]:not(.obrixExcluirAprovado):not(.obrixPayMethod):not(.obrixDestrutivoCheio),
body.dark #app button.active:not(.obrixExcluirAprovado):not(.obrixPayMethod):not(.obrixDestrutivoCheio),body.dark #app button.selected:not(.obrixExcluirAprovado):not(.obrixPayMethod):not(.obrixDestrutivoCheio),body.dark #app button.selecionado:not(.obrixExcluirAprovado):not(.obrixPayMethod):not(.obrixDestrutivoCheio),body.dark #app button[aria-pressed="true"]:not(.obrixExcluirAprovado):not(.obrixPayMethod):not(.obrixDestrutivoCheio),body.dark #app button[aria-selected="true"]:not(.obrixExcluirAprovado):not(.obrixPayMethod):not(.obrixDestrutivoCheio){background:#17212b!important;background-color:#17212b!important;background-image:none!important;color:#f8fafc!important;-webkit-text-fill-color:#f8fafc!important;border-color:#334155!important;box-shadow:none!important}

html[data-theme="dark"] #app .opmSide nav button.active i,html[data-theme="dark"] #app .opmSide nav button.active span,body.dark #app .opmSide nav button.active i,body.dark #app .opmSide nav button.active span{color:#f8fafc!important;-webkit-text-fill-color:#f8fafc!important}

#app #assPlanos button[data-ass-plano],#app #assPlanos button[data-ass-cob-efi],#app #assPlanos button.obrixPayMethod{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;text-shadow:none!important}
html:not([data-theme="dark"]) body #app #assPlanos button[data-ass-plano],html:not([data-theme="dark"]) body #app #assPlanos button[data-ass-cob-efi],html:not([data-theme="dark"]) body #app #assPlanos button.obrixPayMethod{color:#334155!important;-webkit-text-fill-color:#334155!important;border-color:#cbd5e1!important}
html[data-theme="dark"] body #app #assPlanos button[data-ass-plano],html[data-theme="dark"] body #app #assPlanos button[data-ass-cob-efi],html[data-theme="dark"] body #app #assPlanos button.obrixPayMethod,body.dark #app #assPlanos button[data-ass-plano],body.dark #app #assPlanos button[data-ass-cob-efi],body.dark #app #assPlanos button.obrixPayMethod{color:var(--obrix-final-text)!important;-webkit-text-fill-color:var(--obrix-final-text)!important;border-color:var(--obrix-final-border)!important}

/* Vale, Cancelar, Registrar Diaria/Diario e Registrar Falta: fundo original aprovado. */
html[data-theme="dark"] body #app button.obrixAcaoOriginal,body.dark #app button.obrixAcaoOriginal,
html[data-theme="dark"] body .modalBack button.obrixAcaoOriginal,body.dark .modalBack button.obrixAcaoOriginal,
html[data-theme="dark"] body button.obrixAcaoOriginal.obrixAcaoOriginal,body.dark button.obrixAcaoOriginal.obrixAcaoOriginal{
background:var(--obrix-final-card)!important;background-color:var(--obrix-final-card)!important;background-image:none!important;color:var(--obrix-final-text)!important;-webkit-text-fill-color:var(--obrix-final-text)!important;border:1px solid var(--obrix-final-border)!important;box-shadow:none!important;text-shadow:none!important}

/* Pagar da Equipe: fundo original aprovado. */
html[data-theme="dark"] body #app #equipe button.obrixPagarOriginalBg,body.dark #app #equipe button.obrixPagarOriginalBg,
html[data-theme="dark"] body #app #equipe button.obrix-pagar-equipe-topo,body.dark #app #equipe button.obrix-pagar-equipe-topo{
background:var(--obrix-final-card)!important;background-color:var(--obrix-final-card)!important;background-image:none!important;color:var(--obrix-final-text)!important;-webkit-text-fill-color:var(--obrix-final-text)!important;border:1px solid var(--obrix-final-border)!important;box-shadow:none!important;text-shadow:none!important}

/* Excluir comum em todo o aplicativo: fundo original, borda e letras vermelhas. */
#app button.obrixExcluirAprovado{color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;border:1px solid #dc2626!important;box-shadow:none!important;text-shadow:none!important;background:#fff!important;background-color:#fff!important;background-image:none!important}
html[data-theme="dark"] body #app button.obrixExcluirAprovado,body.dark #app button.obrixExcluirAprovado,
html[data-theme="dark"] body .modalBack button.obrixExcluirAprovado,body.dark .modalBack button.obrixExcluirAprovado,
html[data-theme="dark"] body button.obrixExcluirAprovado.obrixExcluirAprovado,body.dark button.obrixExcluirAprovado.obrixExcluirAprovado{
background:var(--obrix-final-card)!important;background-color:var(--obrix-final-card)!important;background-image:none!important;color:var(--obrix-final-red)!important;-webkit-text-fill-color:var(--obrix-final-red)!important;border:1px solid var(--obrix-final-red)!important;box-shadow:none!important;text-shadow:none!important}

/* Excluir Conta e apagamentos gerais: vermelho cheio com letras brancas. */
html[data-theme="dark"] body #app button.obrixDestrutivoCheio,body.dark #app button.obrixDestrutivoCheio,
html[data-theme="dark"] body .modalBack button.obrixDestrutivoCheio,body.dark .modalBack button.obrixDestrutivoCheio,
html[data-theme="dark"] body button.obrixDestrutivoCheio.obrixDestrutivoCheio,body.dark button.obrixDestrutivoCheio.obrixDestrutivoCheio{
background:var(--obrix-final-red-solid)!important;background-color:var(--obrix-final-red-solid)!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border:1px solid #991b1b!important;box-shadow:none!important;text-shadow:none!important}
html[data-theme="dark"] body button.obrixDestrutivoCheio *,body.dark button.obrixDestrutivoCheio *{color:#fff!important;-webkit-text-fill-color:#fff!important}

#app .obrixGoldCardNeutral{background:#fff!important;background-color:#fff!important;background-image:none!important;border-color:#cbd5e1!important;box-shadow:none!important}
html[data-theme="dark"] #app .obrixGoldCardNeutral,body.dark #app .obrixGoldCardNeutral{background:var(--obrix-final-card)!important;background-color:var(--obrix-final-card)!important;background-image:none!important;border-color:var(--obrix-final-border)!important;box-shadow:none!important;color:var(--obrix-final-text)!important;-webkit-text-fill-color:var(--obrix-final-text)!important}

#app #menuSair,#app #cfgSair{color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;box-shadow:none!important}
html[data-theme="dark"] #app #menuSair,html[data-theme="dark"] #app #cfgSair,body.dark #app #menuSair,body.dark #app #cfgSair{background:var(--obrix-final-card)!important;background-color:var(--obrix-final-card)!important;color:var(--obrix-final-red)!important;-webkit-text-fill-color:var(--obrix-final-red)!important;border-color:var(--obrix-final-border)!important}

#app .obrixValorReceita{color:var(--obrix-final-green)!important;-webkit-text-fill-color:var(--obrix-final-green)!important}
#app .obrixValorDespesa{color:var(--obrix-final-red)!important;-webkit-text-fill-color:var(--obrix-final-red)!important}
#app .obrixValorResultado{color:var(--obrix-final-blue)!important;-webkit-text-fill-color:var(--obrix-final-blue)!important}

html:not([data-theme="dark"]) body #login #entrar{background:#0f172a!important;background-color:#0f172a!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#0f172a!important;box-shadow:none!important}
html[data-theme="dark"] body #login #entrar,body.dark #login #entrar{background:var(--obrix-final-card)!important;background-color:var(--obrix-final-card)!important;background-image:none!important;color:var(--obrix-final-text)!important;-webkit-text-fill-color:var(--obrix-final-text)!important;border:1px solid var(--obrix-final-border)!important;box-shadow:none!important}
`;

const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
function install(){let s=document.getElementById(STYLE_ID);if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s)}if(s.textContent!==CSS)s.textContent=CSS;if(document.head.lastElementChild!==s)document.head.appendChild(s)}
function clearColorMarks(b){b.classList.remove('obrixApprovedGold','obrixApprovedSecondary','obrixEquipeAzulClaro');b.removeAttribute('data-obrix-approved-color')}
function markButtons(root=document){
  root.querySelectorAll?.('button').forEach(b=>{
    const t=norm(b.textContent);
    const full=/^(excluir conta|apagar tudo|apagar (a )?(obras|equipe|financeiro))\b/.test(t);
    const del=/\b(excluir|remover|apagar|deletar)\b/.test(t)||b.matches('.danger,.perigo,.orcPerigo,.diarioPerigo,[data-cmd="excluir"],[data-acao="excluir"]');
    const neutral=/\bvale\b/.test(t)||/registrar (diaria|diario)/.test(t)||/registrar falta/.test(t)||/^cancelar\b/.test(t);
    const pagar=/\bpagar\b/.test(t)||b.classList.contains('obrix-pagar-equipe-topo');
    if(full){b.classList.add('obrixDestrutivoCheio');b.classList.remove('obrixExcluirAprovado','obrixAcaoOriginal','obrixPagarOriginalBg');clearColorMarks(b);return}
    b.classList.remove('obrixDestrutivoCheio');
    if(del){b.classList.add('obrixExcluirAprovado');b.classList.remove('obrixAcaoOriginal','obrixPagarOriginalBg');clearColorMarks(b);return}
    b.classList.remove('obrixExcluirAprovado');
    if(neutral){b.classList.add('obrixAcaoOriginal');clearColorMarks(b)}
    if(pagar&&b.closest?.('#equipe')){b.classList.add('obrixPagarOriginalBg');clearColorMarks(b)}
  })
}
function isGold(el){const c=getComputedStyle(el).backgroundColor,m=c&&c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(!m)return false;const r=+m[1],g=+m[2],b=+m[3];return r>=140&&g>=90&&g<=215&&b<=115&&r>=g}
function neutralGoldCards(root=document){const app=root.querySelector?.('#app')||document.getElementById('app');if(!app)return;app.querySelectorAll('.card,.kpi,.mini,article,[class*="card"],[class*="Card"],[data-card]').forEach(el=>{if(el.classList.contains('obrixExcluirAprovado')||el.classList.contains('obrixDestrutivoCheio'))return;if(isGold(el)||el.classList.contains('obrixApprovedGold')||el.hasAttribute('data-obrix-approved-color'))el.classList.add('obrixGoldCardNeutral')})}
let timer=0;function apply(){install();markButtons(document);neutralGoldCards(document)}function schedule(){clearTimeout(timer);timer=setTimeout(apply,60)}
function start(){apply();const target=document.getElementById('app')||document.body;if(target)new MutationObserver(schedule).observe(target,{childList:true,subtree:true,characterData:true});new MutationObserver(schedule).observe(document.body,{childList:true,subtree:false});window.addEventListener('obrix:theme-changed',schedule);window.addEventListener('pageshow',schedule);['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto'].forEach(n=>window.addEventListener(n,schedule));document.addEventListener('click',()=>setTimeout(schedule,0),true);setTimeout(apply,150);setTimeout(apply,600);setTimeout(apply,1500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_NO_GOLD_FINAL={apply:schedule};
})();