(()=>{'use strict';
if(window.__OBRIX_BUTTON_COLORS_V1)return;window.__OBRIX_BUTTON_COLORS_V1=true;

const PETROLEO='#176B87';
const PETROLEO_BORDER='#125970';
const WHITE='#ffffff';
const DANGER='#b91c1c';
const DANGER_BORDER='#991b1b';
const TEAM_BLUE='#2563EB';
const TEAM_SLATE='#475569';
const TEAM_GREEN='#22A653';
const TEAM_ORANGE='#C2410C';
const TEAM_STEEL='#0369A1';
const TEAM_AMBER='#A16207';
const TEAM_TEAL='#0F766E';
const DARK_NEUTRAL='#2B3138';
const dangerRe=/(excluir|remover|apagar|estornar|deletar|exclusão|exclusao)/i;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();

function text(b){return String(b?.textContent||'').replace(/\s+/g,' ').trim()}
function meta(b){return [b?.getAttribute?.('aria-label'),b?.getAttribute?.('title'),b?.dataset?.cmd,b?.dataset?.action,b?.dataset?.acao,b?.dataset?.fin,b?.dataset?.del,b?.dataset?.tipo].filter(Boolean).join(' ')}
function danger(b){const c=String(b?.className||'');return /(^|\s)(danger|perigo|orcPerigo|diarioPerigo)(\s|$)/i.test(c)||dangerRe.test(`${text(b)} ${meta(b)}`)}
function modalTitle(b){const box=b?.closest?.('.modalBack,.obrix-modelo-modal,[role="dialog"]');return norm(box?.querySelector?.('h1,h2,h3,.modalTitle,.titulo')?.textContent||'')}
function teamContext(b){return !!b?.closest?.('#equipe,.obrix-modelo-modal,.obrix-equipe-controles,.modalBack')}
function selected(b){return b.matches?.('.active,.selected,.is-active,[aria-selected="true"],[aria-pressed="true"]')||b.dataset?.active==='1'}
function isDark(){return document.documentElement.dataset.theme==='dark'||document.body?.classList?.contains('dark')}
function clearThemeClasses(b){b.classList.remove('obrixApprovedGold','obrixApprovedSecondary','obrixDangerButton','obrixPetroleumButton','obrixTransparentButton','obrixTeamBlue','obrixTeamSlate','obrixTeamGreen','obrixTeamOrange','obrixTeamSteel','obrixTeamAmber','obrixTeamTeal','obrixTeamNeutral','obrixEquipeAzulClaro','obrixEquipeNeutral','obrixPermanentNeutral','obrixPermanentGoldText');b.removeAttribute('data-obrix-approved-color');b.removeAttribute('data-obrix-permanent-neutral')}
function force(b,p,v){try{b.style.setProperty(p,v,'important')}catch(_){}}
function paint(b,theme){
  let bg=PETROLEO,border=PETROLEO_BORDER,color=WHITE,shadow='none';
  if(theme==='danger'){bg=DANGER;border=DANGER_BORDER;shadow='0 6px 16px rgba(185,28,28,.14)'}
  else if(theme==='petroleum'){shadow='0 6px 16px rgba(23,107,135,.18)'}
  else if(theme==='team-blue'){bg=TEAM_BLUE;border='#1d4ed8'}
  else if(theme==='team-slate'){bg=TEAM_SLATE;border='#334155'}
  else if(theme==='team-green'){bg=TEAM_GREEN;border='#188343'}
  else if(theme==='team-orange'){bg=TEAM_ORANGE;border='#9a3412'}
  else if(theme==='team-steel'){bg=TEAM_STEEL;border='#075985'}
  else if(theme==='team-amber'){bg=TEAM_AMBER;border='#854d0e'}
  else if(theme==='team-teal'){bg=TEAM_TEAL;border='#115e59'}
  else if(theme==='team-neutral'){bg=isDark()?DARK_NEUTRAL:'#e2e8f0';border=isDark()?'#3d4650':'#cbd5e1';color=isDark()?'#eef2f7':'#334155'}
  else if(theme==='transparent'){bg='transparent';border='transparent';shadow='none';color=b.closest?.('#menuMain')?WHITE:(isDark()?'#eef2f7':'#334155')}
  force(b,'background',bg);force(b,'background-color',bg);force(b,'background-image','none');force(b,'border-color',border);force(b,'color',color);force(b,'-webkit-text-fill-color',color);force(b,'box-shadow',shadow);force(b,'text-shadow','none');
}
function applyClass(b,cls,theme){clearThemeClasses(b);b.classList.add(cls);b.dataset.obrixButtonTheme=theme;paint(b,theme)}
function classify(b){
  if(!(b instanceof HTMLButtonElement))return;
  const t=norm(text(b)),mt=modalTitle(b),team=teamContext(b);
  if(b.id==='cfgExcluirConta'||danger(b)){applyClass(b,'obrixDangerButton','danger');return}
  if(b.id==='obrixNotifBell'||b.closest?.('.bottom')||b.closest?.('#menuMain')||b.id==='cfgSair'||t==='sair da conta'||t==='selecionar todos'||(b.closest?.('#estoqueMain .nav')&&b.hasAttribute('data-est'))){applyClass(b,'obrixTransparentButton','transparent');return}
  if(team){
    if(/^\+?\s*(novo\s+)?funcionario$/.test(t)||t==='novo funcionario'){applyClass(b,'obrixPetroleumButton','petroleum');return}
    if(t==='funcionarios'||t==='funcionario'){applyClass(b,'obrixTeamBlue','team-blue');return}
    if(t.includes('historico de pagamentos')||t==='pagamentos'){applyClass(b,'obrixTeamSlate','team-slate');return}
    if(['todos','ativos','inativos','ativar','desativar'].includes(t)){applyClass(b,selected(b)?'obrixPetroleumButton':'obrixTeamNeutral',selected(b)?'petroleum':'team-neutral');return}
    if(t.includes('marcar diaria')||t.includes('registrar diaria')||(t==='registrar'&&mt.includes('registrar diaria'))){applyClass(b,'obrixTeamGreen','team-green');return}
    if(t==='falta'||t.includes('registrar falta')||(t==='registrar'&&mt.includes('registrar falta'))){applyClass(b,'obrixTeamOrange','team-orange');return}
    if(t.includes('ver registro')){applyClass(b,'obrixTeamSteel','team-steel');return}
    if(t.includes('bonus e extras')||t==='bonus'||t==='extras'){applyClass(b,'obrixTeamAmber','team-amber');return}
    if(t==='vale'||t.includes('registrar vale')||(t==='registrar'&&mt.includes('registrar vale'))){applyClass(b,'obrixTeamTeal','team-teal');return}
    if(t==='cancelar'&&(mt.includes('registrar diaria')||mt.includes('registrar falta')||mt.includes('registrar vale'))){applyClass(b,'obrixTransparentButton','transparent');return}
  }
  if(t.startsWith('gerar relatorio')){applyClass(b,'obrixTeamSteel','team-steel');return}
  if(b.matches?.('#fmLista [data-fin="editar"],#diarioSalvar,#cfgTrocarEmail,#cfgTrocarSenha')){applyClass(b,'obrixPetroleumButton','petroleum');return}
  applyClass(b,'obrixPetroleumButton','petroleum');
}
function scan(root=document){if(root instanceof HTMLButtonElement)classify(root);root.querySelectorAll?.('button').forEach(classify)}

const baseColor=(cls,bg,border=bg,shadow='none')=>`
html body #app#app#app button.${cls}.${cls},html body .modalBack.modalBack button.${cls}.${cls},html body .obrix-modelo-modal.obrix-modelo-modal button.${cls}.${cls},html body .obrix-equipe-controles.obrix-equipe-controles button.${cls}.${cls},html body button.${cls}.${cls}.${cls}{background:${bg}!important;background-color:${bg}!important;background-image:none!important;color:${WHITE}!important;-webkit-text-fill-color:${WHITE}!important;border-color:${border}!important;box-shadow:${shadow}!important;text-shadow:none!important}
html body button.${cls} span,html body button.${cls} strong,html body button.${cls} small,html body button.${cls} b,html body button.${cls} i{color:inherit!important;-webkit-text-fill-color:inherit!important}`;

const STYLE=`
:root{--obrix-button-primary:${PETROLEO};--obrix-button-primary-border:${PETROLEO_BORDER};--obrix-button-primary-text:${WHITE};--obrix-button-danger:${DANGER};--obrix-button-danger-border:${DANGER_BORDER}}
${baseColor('obrixPetroleumButton',PETROLEO,PETROLEO_BORDER,'0 6px 16px rgba(23,107,135,.18)')}
${baseColor('obrixDangerButton',DANGER,DANGER_BORDER,'0 6px 16px rgba(185,28,28,.14)')}
${baseColor('obrixTeamBlue',TEAM_BLUE,'#1d4ed8')}
${baseColor('obrixTeamSlate',TEAM_SLATE,'#334155')}
${baseColor('obrixTeamGreen',TEAM_GREEN,'#188343')}
${baseColor('obrixTeamOrange',TEAM_ORANGE,'#9a3412')}
${baseColor('obrixTeamSteel',TEAM_STEEL,'#075985')}
${baseColor('obrixTeamAmber',TEAM_AMBER,'#854d0e')}
${baseColor('obrixTeamTeal',TEAM_TEAL,'#115e59')}

html body #app#app#app button.obrixTransparentButton.obrixTransparentButton,html body .modalBack.modalBack button.obrixTransparentButton.obrixTransparentButton,html body .obrix-modelo-modal.obrix-modelo-modal button.obrixTransparentButton.obrixTransparentButton,html body button.obrixTransparentButton.obrixTransparentButton.obrixTransparentButton{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;text-shadow:none!important;border-color:transparent!important;color:#334155!important;-webkit-text-fill-color:#334155!important}
html[data-theme="dark"] body #app#app#app button.obrixTransparentButton.obrixTransparentButton,body.dark #app#app#app button.obrixTransparentButton.obrixTransparentButton,html[data-theme="dark"] body button.obrixTransparentButton.obrixTransparentButton.obrixTransparentButton,body.dark button.obrixTransparentButton.obrixTransparentButton.obrixTransparentButton{color:#eef2f7!important;-webkit-text-fill-color:#eef2f7!important}
html body button.obrixTransparentButton span,html body button.obrixTransparentButton strong,html body button.obrixTransparentButton small,html body button.obrixTransparentButton b,html body button.obrixTransparentButton i{color:inherit!important;-webkit-text-fill-color:inherit!important}

html body #app#app#app button.obrixTeamNeutral.obrixTeamNeutral,html body .modalBack.modalBack button.obrixTeamNeutral.obrixTeamNeutral,html body button.obrixTeamNeutral.obrixTeamNeutral.obrixTeamNeutral{background:#e2e8f0!important;background-color:#e2e8f0!important;background-image:none!important;color:#334155!important;-webkit-text-fill-color:#334155!important;border:1px solid #cbd5e1!important;box-shadow:none!important;text-shadow:none!important}
html[data-theme="dark"] body #app#app#app button.obrixTeamNeutral.obrixTeamNeutral,body.dark #app#app#app button.obrixTeamNeutral.obrixTeamNeutral,html[data-theme="dark"] body button.obrixTeamNeutral.obrixTeamNeutral.obrixTeamNeutral,body.dark button.obrixTeamNeutral.obrixTeamNeutral.obrixTeamNeutral{background:${DARK_NEUTRAL}!important;background-color:${DARK_NEUTRAL}!important;color:#eef2f7!important;-webkit-text-fill-color:#eef2f7!important;border-color:#3d4650!important}

html body #app#app#app #configMain #cfgExcluirConta,html body #configMain #cfgExcluirConta.accountDeleteBtn{background:${DANGER}!important;background-color:${DANGER}!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border:1px solid ${DANGER_BORDER}!important;box-shadow:0 6px 16px rgba(185,28,28,.14)!important}
html body .accountDeleteModal .excluir{background:${DANGER}!important;background-color:${DANGER}!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:${DANGER_BORDER}!important}
html body #app#app#app #configMain #cfgTrocarEmail,html body #app#app#app #configMain #cfgTrocarSenha{background:${PETROLEO}!important;background-color:${PETROLEO}!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:${PETROLEO_BORDER}!important}
html body #app#app#app #configMain #cfgSair{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;border-color:transparent!important}

html body #app#app#app #obrixNotifBell{background:transparent!important;background-color:transparent!important;background-image:none!important;border-color:transparent!important;box-shadow:none!important}
html body #app#app#app .bottom button{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;border-color:transparent!important;color:#334155!important;-webkit-text-fill-color:#334155!important}
html body #app#app#app .bottom button.active{background:transparent!important;background-color:transparent!important;color:${PETROLEO}!important;-webkit-text-fill-color:${PETROLEO}!important}
html[data-theme="dark"] body #app#app#app .bottom button,body.dark #app#app#app .bottom button{color:#eef2f7!important;-webkit-text-fill-color:#eef2f7!important}
html[data-theme="dark"] body #app#app#app .bottom button.active,body.dark #app#app#app .bottom button.active{color:#6bb9d2!important;-webkit-text-fill-color:#6bb9d2!important}

html body #app#app#app #menuMain .opmShell,html body #app#app#app #menuMain .opmSide,html body #app#app#app #menuMain .opmContent{background:#07111f!important;color:#f8fafc!important;border-color:#26384d!important}
html body #app#app#app #menuMain .opmGrid article,html body #app#app#app #menuMain .opmGrid .account{background:#0f1b2a!important;color:#f8fafc!important;border-color:#26384d!important}
html body #app#app#app #menuMain .opmVersion,html body #app#app#app #menuMain .opmProfile{background:#0f1b2a!important;color:#f8fafc!important;border-color:#26384d!important}
html body #app#app#app #menuMain .opmVersion b,html body #app#app#app #menuMain .opmVersion small,html body #app#app#app #menuMain .opmProfile b,html body #app#app#app #menuMain .opmProfile small{color:#fff!important;-webkit-text-fill-color:#fff!important}
html body #app#app#app #menuMain .opmAvatar{background:#1e3348!important;color:#fff!important}
html body #app#app#app #menuMain button,html body #app#app#app #menuMain button.obrixTransparentButton{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
html body #app#app#app #menuMain button b,html body #app#app#app #menuMain button span,html body #app#app#app #menuMain button small,html body #app#app#app #menuMain button i{color:#fff!important;-webkit-text-fill-color:#fff!important}
html body #app#app#app #menuMain .opmSide nav button:hover,html body #app#app#app #menuMain .opmSide nav button.active{background:transparent!important;background-color:transparent!important;color:#fff!important}
html body #app#app#app #menuMain #menuSair{background:transparent!important;background-color:transparent!important;border-color:transparent!important;color:#fff!important;-webkit-text-fill-color:#fff!important;box-shadow:none!important}

html body #app#app#app #financeiroMain #fmLista [data-fin="editar"]{background:${PETROLEO}!important;background-color:${PETROLEO}!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:${PETROLEO_BORDER}!important}
html body #app#app#app #diarioMain #diarioSalvar{background:${PETROLEO}!important;background-color:${PETROLEO}!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:${PETROLEO_BORDER}!important}
html body #app#app#app #diarioMain .diarioEquipeTodos{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important}
html body #app#app#app #diarioMain .diarioBadge.finalizado{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;border-color:transparent!important}
html body #app#app#app #orcamentosMain .orcCardRight .orcStatus,html body #app#app#app #orcamentosMain .orcStatus{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;border-color:transparent!important}

html body #app#app#app #estoqueMain .nav button[data-est]{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;border-color:transparent!important;color:#334155!important;-webkit-text-fill-color:#334155!important}
html body #app#app#app #estoqueMain .nav button[data-est] span{color:#64748b!important;-webkit-text-fill-color:#64748b!important}
html[data-theme="dark"] body #app#app#app #estoqueMain .nav button[data-est],body.dark #app#app#app #estoqueMain .nav button[data-est]{color:#eef2f7!important;-webkit-text-fill-color:#eef2f7!important}
html[data-theme="dark"] body #app#app#app #estoqueMain .nav button[data-est] span,body.dark #app#app#app #estoqueMain .nav button[data-est] span{color:#94a3b8!important;-webkit-text-fill-color:#94a3b8!important}

html body button.obrixPetroleumButton:disabled,html body button.obrixDangerButton:disabled,html body button.obrixTeamBlue:disabled,html body button.obrixTeamSlate:disabled,html body button.obrixTeamGreen:disabled,html body button.obrixTeamOrange:disabled,html body button.obrixTeamSteel:disabled,html body button.obrixTeamAmber:disabled,html body button.obrixTeamTeal:disabled{opacity:.58!important;box-shadow:none!important}
`;

function css(){let s=document.getElementById('obrixButtonColorsV1');if(!s){s=document.createElement('style');s.id='obrixButtonColorsV1';document.head.appendChild(s)}if(s.textContent!==STYLE)s.textContent=STYLE;if(s!==document.head.lastElementChild)document.head.appendChild(s)}
let timer=0;function schedule(){clearTimeout(timer);timer=setTimeout(()=>{css();scan(document)},30)}
function inspectAdded(node){if(!(node instanceof Element))return;if(node.matches?.('button'))classify(node);node.querySelectorAll?.('button').forEach(classify)}
function start(){css();scan(document);if(document.body){new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes||[])inspectAdded(n)}).observe(document.body,{subtree:true,childList:true})}['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:offline-bootstrap','pageshow','focus','online','offline'].forEach(n=>window.addEventListener(n,schedule));document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(b)setTimeout(()=>classify(b),0)},true);setTimeout(schedule,100);setTimeout(schedule,300);setTimeout(schedule,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_BUTTON_COLORS={scan:schedule,gold:PETROLEO,primary:PETROLEO,petroleum:PETROLEO,danger:DANGER,teamGreen:TEAM_GREEN};
})();