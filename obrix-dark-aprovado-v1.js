(()=>{'use strict';
const STYLE_ID='obrixDarkAprovadoV1';
const CARD_BG='#0f1720',APP_BG='#0A1018',BORDER='#2a3948',TEXT='#eef2f7',GREEN='#65d99b',RED='#ff7878',RED_SOLID='#b91c1c',BLUE='#4da3ff';
const CSS=`
html[data-theme="dark"] body,body.dark{background:${APP_BG}!important;background-color:${APP_BG}!important;background-image:none!important}

html[data-theme="dark"] #app .card,html[data-theme="dark"] #app .kpi,html[data-theme="dark"] #app .mini,html[data-theme="dark"] #app .obrix-resumo-grid>div,html[data-theme="dark"] #app #menuMain .opmGrid article,html[data-theme="dark"] #app #menuMain .opmVersion,html[data-theme="dark"] #app #menuMain .opmProfile,html[data-theme="dark"] #app .offFastResumo>div,html[data-theme="dark"] #app .offFastGrid article,
body.dark #app .card,body.dark #app .kpi,body.dark #app .mini,body.dark #app .obrix-resumo-grid>div,body.dark #app #menuMain .opmGrid article,body.dark #app #menuMain .opmVersion,body.dark #app #menuMain .opmProfile,body.dark #app .offFastResumo>div,body.dark #app .offFastGrid article{background:${CARD_BG}!important;background-color:${CARD_BG}!important;background-image:none!important}

html[data-theme="dark"] body #app button:not(.obrixExcluirFinal):not(.obrixDestrutivoFinal):not(.obrixPayMethod),body.dark #app button:not(.obrixExcluirFinal):not(.obrixDestrutivoFinal):not(.obrixPayMethod){background:${CARD_BG}!important;background-color:${CARD_BG}!important;background-image:none!important;color:${TEXT}!important;-webkit-text-fill-color:${TEXT}!important;border-color:${BORDER}!important;box-shadow:none!important;text-shadow:none!important}

html[data-theme="dark"] body #login #entrar,body.dark #login #entrar{background:${CARD_BG}!important;background-color:${CARD_BG}!important;background-image:none!important;color:${TEXT}!important;-webkit-text-fill-color:${TEXT}!important;border:1px solid ${BORDER}!important;box-shadow:none!important}

/* Pagamentos da assinatura continuam sem preenchimento. */
#app #assPlanos button[data-ass-plano],#app #assPlanos button[data-ass-cob-efi],#app #assPlanos button.obrixPayMethod{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;text-shadow:none!important}
html[data-theme="dark"] #app #assPlanos button[data-ass-plano],html[data-theme="dark"] #app #assPlanos button[data-ass-cob-efi],html[data-theme="dark"] #app #assPlanos button.obrixPayMethod,body.dark #app #assPlanos button[data-ass-plano],body.dark #app #assPlanos button[data-ass-cob-efi],body.dark #app #assPlanos button.obrixPayMethod{color:${TEXT}!important;-webkit-text-fill-color:${TEXT}!important;border-color:${BORDER}!important}

/* Vale, Cancelar, Registrar Diaria/Diario, Registrar Falta e Pagar da equipe: fundo original. */
html[data-theme="dark"] body #app button.obrixAcaoOriginalFinal,body.dark #app button.obrixAcaoOriginalFinal,
html[data-theme="dark"] body .modalBack button.obrixAcaoOriginalFinal,body.dark .modalBack button.obrixAcaoOriginalFinal,
html[data-theme="dark"] body button.obrixAcaoOriginalFinal.obrixAcaoOriginalFinal,body.dark button.obrixAcaoOriginalFinal.obrixAcaoOriginalFinal,
html[data-theme="dark"] body #app #equipe button.obrix-pagar-equipe-topo,body.dark #app #equipe button.obrix-pagar-equipe-topo{
background:${CARD_BG}!important;background-color:${CARD_BG}!important;background-image:none!important;color:${TEXT}!important;-webkit-text-fill-color:${TEXT}!important;border:1px solid ${BORDER}!important;box-shadow:none!important;text-shadow:none!important}

/* Excluir comum em qualquer tela: fundo original, borda vermelha, letras vermelhas. */
html[data-theme="dark"] body #app button.obrixExcluirFinal,body.dark #app button.obrixExcluirFinal,
html[data-theme="dark"] body .modalBack button.obrixExcluirFinal,body.dark .modalBack button.obrixExcluirFinal,
html[data-theme="dark"] body button.obrixExcluirFinal.obrixExcluirFinal,body.dark button.obrixExcluirFinal.obrixExcluirFinal{
background:${CARD_BG}!important;background-color:${CARD_BG}!important;background-image:none!important;color:${RED}!important;-webkit-text-fill-color:${RED}!important;border:1px solid ${RED}!important;box-shadow:none!important;text-shadow:none!important}
html[data-theme="dark"] body button.obrixExcluirFinal *,body.dark button.obrixExcluirFinal *{color:${RED}!important;-webkit-text-fill-color:${RED}!important}

/* Excluir Conta, Apagar Tudo, Apagar Obras, Apagar Equipe e Apagar Financeiro: vermelho cheio e letras brancas. */
html[data-theme="dark"] body #app button.obrixDestrutivoFinal,body.dark #app button.obrixDestrutivoFinal,
html[data-theme="dark"] body .modalBack button.obrixDestrutivoFinal,body.dark .modalBack button.obrixDestrutivoFinal,
html[data-theme="dark"] body button.obrixDestrutivoFinal.obrixDestrutivoFinal,body.dark button.obrixDestrutivoFinal.obrixDestrutivoFinal{
background:${RED_SOLID}!important;background-color:${RED_SOLID}!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border:1px solid #991b1b!important;box-shadow:none!important;text-shadow:none!important}
html[data-theme="dark"] body button.obrixDestrutivoFinal *,body.dark button.obrixDestrutivoFinal *{color:#fff!important;-webkit-text-fill-color:#fff!important}

#app .obrixValorReceita{color:${GREEN}!important;-webkit-text-fill-color:${GREEN}!important}
#app .obrixValorDespesa{color:${RED}!important;-webkit-text-fill-color:${RED}!important}
#app .obrixValorResultado{color:${BLUE}!important;-webkit-text-fill-color:${BLUE}!important}

html[data-theme="dark"] #app #menuSair,html[data-theme="dark"] #app #cfgSair,body.dark #app #menuSair,body.dark #app #cfgSair{background:${CARD_BG}!important;background-color:${CARD_BG}!important;color:${RED}!important;-webkit-text-fill-color:${RED}!important;border-color:${BORDER}!important;box-shadow:none!important}
`;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
function ensureStyle(){let s=document.getElementById(STYLE_ID);if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s)}if(s.textContent!==CSS)s.textContent=CSS;if(document.head.lastElementChild!==s)document.head.appendChild(s)}
function clearOld(b){b.classList.remove('obrixApprovedGold','obrixApprovedSecondary','obrixEquipeAzulClaro','obrixExcluirAprovado');b.removeAttribute('data-obrix-approved-color')}
function mark(el,cls){if(!el)return;el.classList.remove('obrixValorReceita','obrixValorDespesa','obrixValorResultado');el.classList.add(cls)}
function valueNear(label){const box=label.closest('.kpi,.mini,.obrix-resumo-grid>div,.card,[data-fin-card]')||label.parentElement;if(!box)return null;const a=[...box.querySelectorAll('strong,b')].filter(x=>x!==label);return a.find(x=>/R\$|\d/.test((x.textContent||'').trim()))||a[0]||null}
function applyValueColors(root=document){mark(document.getElementById('fmRecebido'),'obrixValorReceita');mark(document.getElementById('fmDespesas'),'obrixValorDespesa');mark(document.getElementById('fmResultado'),'obrixValorResultado');root.querySelectorAll?.('[data-fin-card][data-tipo="receita"] .mini b,[data-fin-card][data-tipo="receita"] .mini strong').forEach(el=>mark(el,'obrixValorReceita'));root.querySelectorAll?.('[data-fin-card][data-tipo="despesa"] .mini b,[data-fin-card][data-tipo="despesa"] .mini strong').forEach(el=>mark(el,'obrixValorDespesa'));root.querySelectorAll?.('small,span,label').forEach(label=>{const t=norm(label.textContent);if(!t)return;const v=valueNear(label);if(!v)return;if(/^(receita|receitas|recebido|recebidos)$/.test(t))mark(v,'obrixValorReceita');else if(/^(despesa|despesas)$/.test(t))mark(v,'obrixValorDespesa');else if(t.startsWith('resultado'))mark(v,'obrixValorResultado')})}
function markButtons(root=document){root.querySelectorAll?.('button').forEach(b=>{const t=norm(b.textContent);const destructive=/^(excluir conta|apagar tudo|apagar (a )?(obras|equipe|financeiro))\b/.test(t);const exclude=/\b(excluir|remover|apagar|deletar)\b/.test(t)||b.matches('.danger,.perigo,.orcPerigo,.diarioPerigo,[data-cmd="excluir"],[data-acao="excluir"]');const neutral=/\bvale\b/.test(t)||/registrar (diaria|diario)/.test(t)||/registrar falta/.test(t)||/^cancelar\b/.test(t)||(/\bpagar\b/.test(t)&&!!b.closest?.('#equipe'));if(destructive){b.classList.add('obrixDestrutivoFinal');b.classList.remove('obrixExcluirFinal','obrixAcaoOriginalFinal');clearOld(b);return}else b.classList.remove('obrixDestrutivoFinal');if(exclude){b.classList.add('obrixExcluirFinal');b.classList.remove('obrixAcaoOriginalFinal');clearOld(b);return}else b.classList.remove('obrixExcluirFinal');if(neutral){b.classList.add('obrixAcaoOriginalFinal');clearOld(b)}else b.classList.remove('obrixAcaoOriginalFinal')})}
let timer=0;function apply(){ensureStyle();applyValueColors(document);markButtons(document)}function schedule(){clearTimeout(timer);timer=setTimeout(apply,60)}
function start(){apply();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});new MutationObserver(()=>{const s=document.getElementById(STYLE_ID);if(s&&document.head.lastElementChild!==s)setTimeout(ensureStyle,0)}).observe(document.head,{childList:true});['pageshow','online','offline','obrix:feature-pronto','obrix:modules-ready','obrix:theme-changed'].forEach(n=>window.addEventListener(n,schedule));document.addEventListener('click',()=>setTimeout(schedule,0),true);setTimeout(apply,150);setTimeout(apply,700);setTimeout(apply,1500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();