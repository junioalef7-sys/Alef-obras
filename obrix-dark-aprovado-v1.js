(()=>{
  'use strict';

  const STYLE_ID='obrixDarkAprovadoV1';
  const CARD_BG='#0f1720';
  const APP_BG='#070b10';
  const GREEN='#65d99b';
  const RED='#ff7878';
  const BLUE='#4da3ff';

  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
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
    document.head.appendChild(style);
  }

  function mark(el,cls){
    if(!el)return;
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

  let timer=0;
  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(()=>applyValueColors(document),30);
  }

  function start(){
    addStyle();
    applyValueColors(document);
    const target=document.getElementById('app')||document.body;
    new MutationObserver(schedule).observe(target,{childList:true,subtree:true,characterData:true});
    window.addEventListener('obrix:theme-changed',schedule);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
