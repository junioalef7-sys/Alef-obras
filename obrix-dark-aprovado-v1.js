(()=>{
  'use strict';

  const STYLE_ID='obrixDarkAprovadoV1';
  const CARD_BG='#0f1720';
  const APP_BG='#070b10';
  const BORDER='#2a3948';
  const TEXT='#eef2f7';
  const GREEN='#65d99b';
  const RED='#ff7878';
  const BLUE='#4da3ff';

  const CSS=`
    html[data-theme="dark"] body,
    body.dark{
      background:${APP_BG}!important;
      background-image:none!important;
    }

    html[data-theme="dark"] #app .card,
    html[data-theme="dark"] #app .kpi,
    html[data-theme="dark"] #app .mini,
    html[data-theme="dark"] #app .obrix-resumo-grid>div,
    html[data-theme="dark"] #app #menuMain .opmGrid article,
    html[data-theme="dark"] #app #menuMain .opmVersion,
    html[data-theme="dark"] #app #menuMain .opmProfile,
    html[data-theme="dark"] #app .offFastResumo>div,
    html[data-theme="dark"] #app .offFastGrid article,
    body.dark #app .card,
    body.dark #app .kpi,
    body.dark #app .mini,
    body.dark #app .obrix-resumo-grid>div,
    body.dark #app #menuMain .opmGrid article,
    body.dark #app #menuMain .opmVersion,
    body.dark #app #menuMain .opmProfile,
    body.dark #app .offFastResumo>div,
    body.dark #app .offFastGrid article{
      background:${CARD_BG}!important;
      background-color:${CARD_BG}!important;
      background-image:none!important;
    }

    html[data-theme="dark"] body #app button.btn:not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo):not(.obrixExcluirAprovado),
    html[data-theme="dark"] body #app button.obrixApprovedGold:not(.obrixExcluirAprovado),
    html[data-theme="dark"] body #app button.obrixEquipeAzulClaro:not(.obrixExcluirAprovado),
    html[data-theme="dark"] body #app #assPlanos button[data-ass-plano],
    html[data-theme="dark"] body #app #assPlanos button[data-ass-cob-efi],
    html[data-theme="dark"] body #app #assPlanos button.obrixPayMethod,
    body.dark #app button.btn:not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo):not(.obrixExcluirAprovado),
    body.dark #app button.obrixApprovedGold:not(.obrixExcluirAprovado),
    body.dark #app button.obrixEquipeAzulClaro:not(.obrixExcluirAprovado),
    body.dark #app #assPlanos button[data-ass-plano],
    body.dark #app #assPlanos button[data-ass-cob-efi],
    body.dark #app #assPlanos button.obrixPayMethod{
      background:${CARD_BG}!important;
      background-color:${CARD_BG}!important;
      background-image:none!important;
      color:${TEXT}!important;
      -webkit-text-fill-color:${TEXT}!important;
      border:1px solid ${BORDER}!important;
      box-shadow:none!important;
      text-shadow:none!important;
    }

    html[data-theme="dark"] body #login.obrixLoginPro #entrar,
    body.dark #login.obrixLoginPro #entrar{
      background:${CARD_BG}!important;
      background-color:${CARD_BG}!important;
      background-image:none!important;
      color:${TEXT}!important;
      -webkit-text-fill-color:${TEXT}!important;
      border:1px solid ${BORDER}!important;
      box-shadow:none!important;
    }

    html[data-theme="dark"] body #app button.active:not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo):not(.obrixExcluirAprovado),
    html[data-theme="dark"] body #app button.selected:not(.obrixExcluirAprovado),
    html[data-theme="dark"] body #app button.selecionado:not(.obrixExcluirAprovado),
    html[data-theme="dark"] body #app button[aria-pressed="true"]:not(.obrixExcluirAprovado),
    html[data-theme="dark"] body #app button[aria-selected="true"]:not(.obrixExcluirAprovado),
    body.dark #app button.active:not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo):not(.obrixExcluirAprovado),
    body.dark #app button.selected:not(.obrixExcluirAprovado),
    body.dark #app button.selecionado:not(.obrixExcluirAprovado),
    body.dark #app button[aria-pressed="true"]:not(.obrixExcluirAprovado),
    body.dark #app button[aria-selected="true"]:not(.obrixExcluirAprovado){
      background:${CARD_BG}!important;
      background-color:${CARD_BG}!important;
      background-image:none!important;
      color:${TEXT}!important;
      -webkit-text-fill-color:${TEXT}!important;
      border-color:${BORDER}!important;
      box-shadow:none!important;
    }

    html[data-theme="dark"] body #app button.obrixExcluirAprovado,
    body.dark #app button.obrixExcluirAprovado{
      background:${CARD_BG}!important;
      background-color:${CARD_BG}!important;
      background-image:none!important;
      color:${RED}!important;
      -webkit-text-fill-color:${RED}!important;
      border:1px solid ${RED}!important;
      box-shadow:none!important;
      text-shadow:none!important;
    }

    #app .obrixValorReceita{color:${GREEN}!important;-webkit-text-fill-color:${GREEN}!important}
    #app .obrixValorDespesa{color:${RED}!important;-webkit-text-fill-color:${RED}!important}
    #app .obrixValorResultado{color:${BLUE}!important;-webkit-text-fill-color:${BLUE}!important}

    html[data-theme="dark"] #app #menuSair,
    html[data-theme="dark"] #app #cfgSair,
    body.dark #app #menuSair,
    body.dark #app #cfgSair{
      color:${RED}!important;
      -webkit-text-fill-color:${RED}!important;
    }
  `;

  function ensureStyle(){
    let style=document.getElementById(STYLE_ID);
    if(!style){
      style=document.createElement('style');
      style.id=STYLE_ID;
      document.head.appendChild(style);
    }
    if(style.textContent!==CSS)style.textContent=CSS;
  }

  function mark(el,cls){
    if(!el||el.classList.contains(cls))return;
    el.classList.remove('obrixValorReceita','obrixValorDespesa','obrixValorResultado');
    el.classList.add(cls);
  }

  function valueNear(label){
    const box=label.closest('.kpi,.mini,.obrix-resumo-grid>div,.card,[data-fin-card]')||label.parentElement;
    if(!box)return null;
    const candidates=[...box.querySelectorAll('strong,b')].filter(x=>x!==label);
    return candidates.find(x=>/R\$|\d/.test((x.textContent||'').trim()))||candidates[0]||null;
  }

  function applyValueColors(root=document){
    mark(document.getElementById('fmRecebido'),'obrixValorReceita');
    mark(document.getElementById('fmDespesas'),'obrixValorDespesa');
    mark(document.getElementById('fmResultado'),'obrixValorResultado');

    root.querySelectorAll?.('[data-fin-card][data-tipo="receita"] .mini b,[data-fin-card][data-tipo="receita"] .mini strong').forEach(el=>mark(el,'obrixValorReceita'));
    root.querySelectorAll?.('[data-fin-card][data-tipo="despesa"] .mini b,[data-fin-card][data-tipo="despesa"] .mini strong').forEach(el=>mark(el,'obrixValorDespesa'));

    root.querySelectorAll?.('small,span,label').forEach(label=>{
      const t=(label.textContent||'').trim().toLowerCase();
      if(!t)return;
      const value=valueNear(label);
      if(!value)return;
      if(/^(receita|receitas|recebido|recebidos)$/.test(t)) mark(value,'obrixValorReceita');
      else if(/^(despesa|despesas)$/.test(t)) mark(value,'obrixValorDespesa');
      else if(t.startsWith('resultado')) mark(value,'obrixValorResultado');
    });
  }

  function applyDeleteStyle(root=document){
    root.querySelectorAll?.('#app button').forEach(btn=>{
      const t=String(btn.textContent||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
      const isDelete=/\b(excluir|remover|apagar|deletar)\b/.test(t)||btn.matches('.danger,.perigo,.orcPerigo,.diarioPerigo,[data-cmd="excluir"],[data-acao="excluir"]');
      if(isDelete&&!btn.classList.contains('obrixExcluirAprovado')){
        btn.classList.add('obrixExcluirAprovado');
        btn.classList.remove('obrixApprovedGold','obrixApprovedSecondary','obrixEquipeAzulClaro');
        btn.removeAttribute('data-obrix-approved-color');
      }
    });
  }

  let timer=0;
  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(()=>{
      ensureStyle();
      applyValueColors(document);
      applyDeleteStyle(document);
    },80);
  }

  function start(){
    ensureStyle();
    applyValueColors(document);
    applyDeleteStyle(document);
    const target=document.getElementById('app')||document.body;
    new MutationObserver(schedule).observe(target,{childList:true,subtree:true,characterData:true});
    window.addEventListener('obrix:theme-changed',schedule);
    ['pageshow','online','offline','obrix:feature-pronto','obrix:modules-ready'].forEach(n=>window.addEventListener(n,schedule));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
