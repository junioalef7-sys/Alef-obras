(()=>{
'use strict';
if(window.__OBRIX_FIN_VISUAL)return;window.__OBRIX_FIN_VISUAL=true;
function ehVoltar(b){const t=String(b?.textContent||'').replace(/\s+/g,'').trim(),a=String(b?.getAttribute?.('aria-label')||'').toLowerCase(),ti=String(b?.getAttribute?.('title')||'').toLowerCase();return t==='←'||t==='‹'||t==='⬅'||t==='↩'||a.includes('voltar')||ti.includes('voltar')}
function removerSetasDuplicadas(){
  // Não remover nós de navegação: outros módulos os recriavam causando piscadas.
  const main=document.getElementById('financeiroMain');
  if(!main)return;
  const global=document.getElementById('obrixHeaderVoltar');
  const candidatos=[...main.querySelectorAll(':scope > button,:scope > .btn,:scope > [role="button"],:scope > a,.hero button,.hero .btn,.hero [role="button"],.hero a')].filter(ehVoltar);
  // A seta global é a navegação principal; as secundárias ficam apenas ocultas.
  const ocultar=!!global;
  for(const el of candidatos){
    if(el.classList.contains('obxFinBackDuplicada')!==ocultar)
      el.classList.toggle('obxFinBackDuplicada',ocultar);
  }
}
function aplicar(){
 const main=document.getElementById('financeiroMain');if(!main)return;removerSetasDuplicadas();
 const hero=main.querySelector('.hero');if(hero&&!hero.classList.contains('obxFinHeroLimpo'))hero.classList.add('obxFinHeroLimpo');
 const rec=document.getElementById('fmRecebido'),des=document.getElementById('fmDespesas'),res=document.getElementById('fmResultado');
 if(rec)rec.classList.add('obxFinRecebido');if(des)des.classList.add('obxFinDespesa');if(res)res.classList.add('obxFinResultado');
 const br=document.getElementById('fmReceita'),bd=document.getElementById('fmDespesa');if(br)br.classList.add('obxFinBtnReceita');if(bd)bd.classList.add('obxFinBtnDespesa');
 const sh=main.querySelector('.sectionHead');if(sh){sh.classList.add('obxFinSectionHead');const acoes=sh.querySelector('div');if(acoes)acoes.classList.add('obxFinAcoes')}
 main.querySelectorAll('[data-fin-card="1"]').forEach(card=>{
   card.classList.add('obxFinCardCompacto');
   const tipo=card.dataset.tipo;const mini=card.querySelector('.mini');const rotulo=mini?.querySelector('small');const valor=mini?.querySelector('b');
   if(valor){valor.classList.toggle('obxFinValorDespesa',tipo==='despesa');valor.classList.toggle('obxFinValorReceita',tipo==='receita');if(document.documentElement.dataset.theme==='light'){const cor=tipo==='receita'?'#16a34a':'#dc2626';valor.style.setProperty('color',cor,'important');valor.style.setProperty('-webkit-text-fill-color',cor,'important')}}
   if(rotulo&&document.documentElement.dataset.theme==='light'){rotulo.style.setProperty('color','var(--ob-muted,#526173)','important');rotulo.style.setProperty('-webkit-text-fill-color','var(--ob-muted,#526173)','important')}
   const btn=card.querySelector('[data-fin="excluir"]');if(btn){if(btn.textContent!=='Apagar')btn.textContent='Apagar';btn.classList.add('obxFinApagar')}
 });
 main.querySelectorAll('[id*="check" i],[class*="check" i]').forEach(box=>{
   box.querySelectorAll('[data-tipo="receita"] b,.receita b,[class*="receita"] strong,[class*="receita"] b').forEach(el=>el.classList.add('obxFinValorReceita'));
   box.querySelectorAll('[data-tipo="despesa"] b,.despesa b,[class*="despesa"] strong,[class*="despesa"] b').forEach(el=>el.classList.add('obxFinValorDespesa'));
   box.querySelectorAll('[class*="resultado"] strong,[class*="resultado"] b,[class*="saldo"] strong,[class*="saldo"] b').forEach(el=>el.classList.add('obxFinValorResultado'));
 });
}
const css=document.createElement('style');css.id='obrix-financeiro-visual-style';css.textContent=`
#financeiroMain #fmRecebido.obxFinRecebido{color:#35c759!important;-webkit-text-fill-color:#35c759!important}
#financeiroMain #fmDespesas.obxFinDespesa{color:#ff3b30!important;-webkit-text-fill-color:#ff3b30!important}
#financeiroMain #fmResultado.obxFinResultado,.obxFinValorResultado{color:#3b82f6!important;-webkit-text-fill-color:#3b82f6!important}
html[data-theme="light"] #financeiroMain #fmLista [data-fin-card="1"][data-tipo="despesa"] .mini>b{color:#dc2626!important;-webkit-text-fill-color:#dc2626!important}
html[data-theme="light"] #financeiroMain #fmLista [data-fin-card="1"][data-tipo="receita"] .mini>b{color:#16a34a!important;-webkit-text-fill-color:#16a34a!important}
html[data-theme="light"] #financeiroMain #fmLista [data-fin-card="1"] .mini>small{color:var(--ob-muted,#526173)!important;-webkit-text-fill-color:var(--ob-muted,#526173)!important}
#financeiroMain [data-fin-card="1"][data-tipo="despesa"] .mini b,.obxFinValorDespesa{color:#ff3b30!important;-webkit-text-fill-color:#ff3b30!important}
#financeiroMain [data-fin-card="1"][data-tipo="receita"] .mini b,.obxFinValorReceita{color:#35c759!important;-webkit-text-fill-color:#35c759!important}
#financeiroMain #fmReceita.obxFinBtnReceita{background:#16a34a!important;border-color:#16a34a!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
#financeiroMain #fmDespesa.obxFinBtnDespesa{background:#dc2626!important;border-color:#dc2626!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
#financeiroMain .actions .obxFinApagar{background:var(--ob-surface2,#f5f7fa)!important;color:#ff3b30!important;-webkit-text-fill-color:#ff3b30!important;border:1px solid var(--ob-border,#d7dee7)!important;outline:0!important;box-shadow:none!important}
html[data-theme="dark"] #financeiroMain .actions .obxFinApagar,body.dark #financeiroMain .actions .obxFinApagar{background:var(--ob-surface2,#111e2c)!important;border-color:var(--ob-border,#293b4d)!important;color:#ff453a!important;-webkit-text-fill-color:#ff453a!important}
#financeiroMain .obxFinHeroLimpo{margin-bottom:10px!important;padding-bottom:0!important}
#financeiroMain .hero>p{display:none!important}
#financeiroMain .obxFinBackDuplicada{display:none!important}
#app:has(#financeiroMain:not(.hidden))>.top #obrixHeaderVoltar::before,
#app:has(#financeiroMain:not(.hidden))>.top #obrixHeaderVoltar::after{content:none!important;display:none!important}
#app:has(#financeiroMain:not(.hidden))>.top button[aria-label="Voltar"]:not(#obrixHeaderVoltar){display:none!important}
#financeiroMain .hero button[aria-label="Voltar"],
#financeiroMain .hero a[aria-label="Voltar"],
#financeiroMain .hero button[title="Voltar"]{display:none!important}
#financeiroMain .obxFinHeroLimpo h1{margin-bottom:0!important}
#financeiroMain .kpis{gap:8px!important}
#financeiroMain .kpi{padding:12px!important;min-height:76px!important;border-radius:12px!important}
#financeiroMain .kpi small{font-size:11px!important;line-height:1.2!important}
#financeiroMain .kpi strong{font-size:19px!important;line-height:1.2!important;margin-top:4px!important}
#financeiroMain .obxFinSectionHead{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:8px!important;margin-top:10px!important}
#financeiroMain .obxFinSectionHead>strong{order:2!important;display:block!important;width:100%!important}
#financeiroMain .obxFinAcoes{order:1!important;display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;width:100%!important}
#financeiroMain .obxFinAcoes #fmReceita,#financeiroMain .obxFinAcoes #fmDespesa{width:100%!important;margin:0!important;min-height:44px!important;padding:9px 10px!important}
#financeiroMain .obxFinCardCompacto{padding:12px!important;margin-bottom:8px!important;border-radius:12px!important}
#financeiroMain .obxFinCardCompacto h3{font-size:15px!important;margin:0 0 4px!important;line-height:1.25!important}
#financeiroMain .obxFinCardCompacto .muted{font-size:12px!important;line-height:1.35!important;margin-bottom:7px!important}
#financeiroMain .obxFinCardCompacto .grid{gap:6px!important;margin:6px 0!important}
#financeiroMain .obxFinCardCompacto .mini{padding:8px 10px!important;min-height:auto!important;border-radius:10px!important}
#financeiroMain .obxFinCardCompacto .mini small{font-size:11px!important}
#financeiroMain .obxFinCardCompacto .mini b{font-size:16px!important}
#financeiroMain .obxFinCardCompacto .actions{margin-top:8px!important;gap:6px!important}
#financeiroMain .obxFinCardCompacto .actions button{min-height:38px!important;padding:7px 11px!important}
@media(max-width:640px){#financeiroMain .kpi{padding:10px!important;min-height:70px!important}#financeiroMain .kpi strong{font-size:18px!important}#financeiroMain .obxFinCardCompacto{padding:10px!important}#financeiroMain .obxFinAcoes{gap:7px!important}}

/* Financeiro: padronização dos cartões no Android conforme dimensões móveis aprovadas.
   Apenas cards de lançamentos; não modificar iPhone, KPIs, cadastro ou movimentações. */
@media (max-width:700px){
 html body #app #financeiroMain #fmLista [data-fin-card="1"].obxFinCardCompacto{
   display:block!important;box-sizing:border-box!important;width:100%!important;
   min-width:0!important;max-width:100%!important;
   height:auto!important;min-height:0!important;max-height:none!important;
   padding:10px!important;margin:0 0 8px!important;border-radius:12px!important;
 }
 html body #app #financeiroMain #fmLista [data-fin-card="1"]>h3{
   font-size:15px!important;line-height:1.25!important;margin:0 0 4px!important;
 }
 html body #app #financeiroMain #fmLista [data-fin-card="1"]>.muted{
   font-size:12px!important;line-height:1.3!important;margin:0 0 6px!important;
 }
 html body #app #financeiroMain #fmLista [data-fin-card="1"]>.grid{
   display:grid!important;grid-template-columns:minmax(0,1fr)!important;
   box-sizing:border-box!important;width:100%!important;min-width:0!important;
   max-width:100%!important;gap:0!important;margin:6px 0!important;
 }
 html body #app #financeiroMain #fmLista [data-fin-card="1"]>.grid>.mini{
   box-sizing:border-box!important;grid-column:1/-1!important;
   display:flex!important;flex-direction:row!important;align-items:center!important;
   justify-content:space-between!important;flex-wrap:nowrap!important;
   gap:9px!important;width:100%!important;max-width:100%!important;min-width:0!important;
   height:52px!important;min-height:52px!important;max-height:52px!important;
   padding:7px 12px!important;margin:0!important;border-radius:10px!important;
   overflow:hidden!important;
 }
 html body #app #financeiroMain #fmLista [data-fin-card="1"]>.grid>.mini>small{
   display:block!important;flex:0 1 auto!important;min-width:0!important;
   font-size:13px!important;line-height:18px!important;margin:0!important;
 }
 html body #app #financeiroMain #fmLista [data-fin-card="1"]>.grid>.mini>b{
   display:block!important;flex:0 0 auto!important;min-width:0!important;
   font-size:16px!important;line-height:20px!important;
   margin:0 0 0 auto!important;max-width:65%!important;
   white-space:nowrap!important;text-align:right!important;
 }
 html body #app #financeiroMain #fmLista [data-fin-card="1"]>.actions{
   display:flex!important;align-items:stretch!important;flex-wrap:nowrap!important;
   box-sizing:border-box!important;width:100%!important;max-width:100%!important;
   gap:7px!important;margin:7px 0 0!important;padding:0!important;
 }
 html body #app #financeiroMain #fmLista [data-fin-card="1"]>.actions>button{
   display:inline-flex!important;align-items:center!important;justify-content:center!important;
   box-sizing:border-box!important;flex:1 1 0!important;width:0!important;
   min-width:0!important;height:40px!important;min-height:40px!important;
   max-height:40px!important;padding:6px 8px!important;margin:0!important;
   font-size:13px!important;line-height:18px!important;border-radius:10px!important;
   white-space:nowrap!important;
 }
}

/* Android: largura da tarja Receita/Despesa igual à do iPhone (meia largura).
   Um quadro pequeno à esquerda; os botões continuam em duas colunas completas.
   A regra não é carregada pelo iPhone. */
@media (max-width:700px){
  html body #app #financeiroMain #fmLista [data-fin-card="1"]>.grid{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    gap:7px!important;
    width:100%!important;max-width:100%!important;min-width:0!important;
    box-sizing:border-box!important;
  }
  html body #app #financeiroMain #fmLista [data-fin-card="1"]>.grid>.mini{
    display:grid!important;
    grid-template-columns:minmax(0,1fr)!important;
    grid-template-rows:auto auto!important;
    grid-column:1!important;
    justify-self:stretch!important;
    align-content:center!important;
    justify-items:start!important;
    align-items:center!important;
    box-sizing:border-box!important;
    width:100%!important;min-width:0!important;max-width:100%!important;
    height:62px!important;min-height:62px!important;max-height:none!important;
    padding:8px 9px!important;
    gap:2px!important;
    overflow:visible!important;
  }
  html body #app #financeiroMain #fmLista [data-fin-card="1"]>.grid>.mini>small,
  html body #app #financeiroMain #fmLista [data-fin-card="1"]>.grid>.mini>b{
    display:block!important;
    grid-column:1!important;
    width:100%!important;
    min-width:0!important;max-width:100%!important;
    text-align:left!important;
    margin:0!important;
    overflow:visible!important;
    white-space:nowrap!important;
  }
  html body #app #financeiroMain #fmLista [data-fin-card="1"]>.grid>.mini>small{
    grid-row:1!important;
    font-size:12px!important;line-height:16px!important;
  }
  html body #app #financeiroMain #fmLista [data-fin-card="1"]>.grid>.mini>b{
    grid-row:2!important;
    font-size:clamp(13px,3.7vw,16px)!important;
    line-height:20px!important;
  }
}
`;
document.head.appendChild(css);
let agendaAplicacao=0,ultimoVisual=0;
function agendarAplicar(){
  clearTimeout(agendaAplicacao);
  agendaAplicacao=setTimeout(()=>{
    if(document.hidden)return;
    const main=document.getElementById('financeiroMain');
    if(main&&!main.classList.contains('hidden')&&Date.now()-ultimoVisual>=180){ultimoVisual=Date.now();aplicar();}
  },110);
}
const init=()=>{
  aplicar();
  const main=document.getElementById('financeiroMain');
  if(main&&!main.__obxFinVisual){
    main.__obxFinVisual=true;
    new MutationObserver(muts=>{
      if(muts.some(m=>m.addedNodes.length||m.removedNodes.length))agendarAplicar();
    }).observe(main,{childList:true,subtree:false});
  }
  setTimeout(agendarAplicar,300);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.addEventListener('obrix:theme-applied',agendarAplicar);
window.OBRIX_FIN_VISUAL={refresh:aplicar};
})();