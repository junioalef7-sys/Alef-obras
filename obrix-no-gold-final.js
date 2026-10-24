(()=>{'use strict';
if(window.__OBRIX_NO_GOLD_FINAL)return;window.__OBRIX_NO_GOLD_FINAL=true;
const STYLE_ID='obrixNoGoldFinalCss';
const CSS=`
:root{--obrix-final-card:#0f1720;--obrix-final-bg:#070b10;--obrix-final-border:#2a3948;--obrix-final-text:#eef2f7;--obrix-final-red:#ff7878;--obrix-final-green:#65d99b;--obrix-final-blue:#4da3ff}

/* Modo claro: remove qualquer dourado/amarelo legado dos botoes principais. */
html:not([data-theme="dark"]) body #app .btn:not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo):not(.obrixExcluirAprovado):not(.obrixPermanentNeutral):not(.obrixPayMethod):not(.obrixPagarSemFundo),
html:not([data-theme="dark"]) body #app button.obrixApprovedGold:not(.obrixExcluirAprovado):not(.obrixPermanentNeutral):not(.obrixPayMethod):not(.obrixPagarSemFundo){background:#0f172a!important;background-color:#0f172a!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#0f172a!important;box-shadow:none!important;text-shadow:none!important}

/* Modo escuro aprovado: fundo geral preto e cartoes no tom original. */
html[data-theme="dark"] body,body.dark{background:var(--obrix-final-bg)!important;background-color:var(--obrix-final-bg)!important;background-image:none!important}
html[data-theme="dark"] #app .card,html[data-theme="dark"] #app .kpi,html[data-theme="dark"] #app .mini,html[data-theme="dark"] #app .obrix-resumo-grid>div,html[data-theme="dark"] #app #menuMain .opmGrid article,html[data-theme="dark"] #app #menuMain .opmVersion,html[data-theme="dark"] #app #menuMain .opmProfile,html[data-theme="dark"] #app .offFastResumo>div,html[data-theme="dark"] #app .offFastGrid article,
body.dark #app .card,body.dark #app .kpi,body.dark #app .mini,body.dark #app .obrix-resumo-grid>div,body.dark #app #menuMain .opmGrid article,body.dark #app #menuMain .opmVersion,body.dark #app #menuMain .opmProfile,body.dark #app .offFastResumo>div,body.dark #app .offFastGrid article{background:var(--obrix-final-card)!important;background-color:var(--obrix-final-card)!important;background-image:none!important}

/* Nenhum botao do app volta a dourado/amarelo/azul no modo escuro. */
html[data-theme="dark"] body #app button:not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo):not(.obrixExcluirAprovado):not(.obrixPermanentNeutral):not(.obrixPayMethod):not(.obrixPagarSemFundo),
body.dark #app button:not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo):not(.obrixExcluirAprovado):not(.obrixPermanentNeutral):not(.obrixPayMethod):not(.obrixPagarSemFundo){background:var(--obrix-final-card)!important;background-color:var(--obrix-final-card)!important;background-image:none!important;color:var(--obrix-final-text)!important;-webkit-text-fill-color:var(--obrix-final-text)!important;border-color:var(--obrix-final-border)!important;box-shadow:none!important;text-shadow:none!important}

/* Estados ativos continuam neutros, sem dourado e sem azul. */
html[data-theme="dark"] body #app button.active:not(.obrixExcluirAprovado):not(.obrixPayMethod),html[data-theme="dark"] body #app button.selected:not(.obrixExcluirAprovado):not(.obrixPayMethod),html[data-theme="dark"] body #app button.selecionado:not(.obrixExcluirAprovado):not(.obrixPayMethod),html[data-theme="dark"] body #app button[aria-pressed="true"]:not(.obrixExcluirAprovado):not(.obrixPayMethod),html[data-theme="dark"] body #app button[aria-selected="true"]:not(.obrixExcluirAprovado):not(.obrixPayMethod),
body.dark #app button.active:not(.obrixExcluirAprovado):not(.obrixPayMethod),body.dark #app button.selected:not(.obrixExcluirAprovado):not(.obrixPayMethod),body.dark #app button.selecionado:not(.obrixExcluirAprovado):not(.obrixPayMethod),body.dark #app button[aria-pressed="true"]:not(.obrixExcluirAprovado):not(.obrixPayMethod),body.dark #app button[aria-selected="true"]:not(.obrixExcluirAprovado):not(.obrixPayMethod){background:#17212b!important;background-color:#17212b!important;background-image:none!important;color:#f8fafc!important;-webkit-text-fill-color:#f8fafc!important;border-color:#334155!important;box-shadow:none!important}
html[data-theme="dark"] #app .opmSide nav button.active i,html[data-theme="dark"] #app .opmSide nav button.active span,body.dark #app .opmSide nav button.active i,body.dark #app .opmSide nav button.active span{color:#f8fafc!important;-webkit-text-fill-color:#f8fafc!important}

/* Pix, boleto e cartao: alinhados e sem fundo colorido nos dois modos. */
#app #assPlanos button[data-ass-plano],#app #assPlanos button[data-ass-cob-efi],#app #assPlanos button.obrixPayMethod{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;text-shadow:none!important}
html:not([data-theme="dark"]) body #app #assPlanos button[data-ass-plano],html:not([data-theme="dark"]) body #app #assPlanos button[data-ass-cob-efi],html:not([data-theme="dark"]) body #app #assPlanos button.obrixPayMethod{color:#334155!important;-webkit-text-fill-color:#334155!important;border-color:#cbd5e1!important}
html[data-theme="dark"] body #app #assPlanos button[data-ass-plano],html[data-theme="dark"] body #app #assPlanos button[data-ass-cob-efi],html[data-theme="dark"] body #app #assPlanos button.obrixPayMethod,body.dark #app #assPlanos button[data-ass-plano],body.dark #app #assPlanos button[data-ass-cob-efi],body.dark #app #assPlanos button.obrixPayMethod{color:var(--obrix-final-text)!important;-webkit-text-fill-color:var(--obrix-final-text)!important;border-color:var(--obrix-final-border)!important}

/* Excluir / remover / apagar: fundo original, texto vermelho e borda vermelha. */
#app button.obrixExcluirAprovado{color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;border:1px solid #dc2626!important;box-shadow:none!important;text-shadow:none!important;background:#fff!important;background-color:#fff!important;background-image:none!important}
html[data-theme="dark"] body #app button.obrixExcluirAprovado,body.dark #app button.obrixExcluirAprovado{background:var(--obrix-final-card)!important;background-color:var(--obrix-final-card)!important;background-image:none!important;color:var(--obrix-final-red)!important;-webkit-text-fill-color:var(--obrix-final-red)!important;border:1px solid var(--obrix-final-red)!important;box-shadow:none!important;text-shadow:none!important}

/* Sair da conta sempre em vermelho, sem preenchimento chamativo. */
#app #menuSair,#app #cfgSair{color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;box-shadow:none!important}
html[data-theme="dark"] #app #menuSair,html[data-theme="dark"] #app #cfgSair,body.dark #app #menuSair,body.dark #app #cfgSair{background:var(--obrix-final-card)!important;background-color:var(--obrix-final-card)!important;color:var(--obrix-final-red)!important;-webkit-text-fill-color:var(--obrix-final-red)!important;border-color:var(--obrix-final-border)!important}

/* Valores financeiros: somente os numeros recebem cor. */
#app .obrixValorReceita{color:var(--obrix-final-green)!important;-webkit-text-fill-color:var(--obrix-final-green)!important}
#app .obrixValorDespesa{color:var(--obrix-final-red)!important;-webkit-text-fill-color:var(--obrix-final-red)!important}
#app .obrixValorResultado{color:var(--obrix-final-blue)!important;-webkit-text-fill-color:var(--obrix-final-blue)!important}

/* Login: apenas aparencia; nenhuma regra de clique ou entrada e alterada. */
html:not([data-theme="dark"]) body #login #entrar{background:#0f172a!important;background-color:#0f172a!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#0f172a!important;box-shadow:none!important}
html[data-theme="dark"] body #login #entrar,body.dark #login #entrar{background:var(--obrix-final-card)!important;background-color:var(--obrix-final-card)!important;background-image:none!important;color:var(--obrix-final-text)!important;-webkit-text-fill-color:var(--obrix-final-text)!important;border:1px solid var(--obrix-final-border)!important;box-shadow:none!important}
`;
function install(){let s=document.getElementById(STYLE_ID);if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s)}if(s.textContent!==CSS)s.textContent=CSS;if(document.head.lastElementChild!==s)document.head.appendChild(s)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.addEventListener('obrix:theme-changed',install);window.addEventListener('pageshow',install);
window.OBRIX_NO_GOLD_FINAL={apply:install};
})();
