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
   // A disposição agora é definida apenas por CSS neste arquivo.
   card.classList.remove('obxFinCardCompacto');
   const tipo=card.dataset.tipo,valor=card.querySelector(':scope>.grid>.mini>b');
   valor?.classList.toggle('obxFinValorDespesa',tipo==='despesa');
   valor?.classList.toggle('obxFinValorReceita',tipo==='receita');
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









@media(max-width:640px){#financeiroMain .kpi{padding:10px!important;min-height:70px!important}#financeiroMain .kpi strong{font-size:18px!important}#financeiroMain .obxFinAcoes{gap:7px!important}}


/* FONTE ÚNICA: cartão Financeiro Android — dimensões e posicionamento aprovados. */
@media(max-width:760px){
 html body #app #financeiroMain #fmLista>[data-fin-card="1"].card.item{
  box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;
  padding:15px!important;margin:0 0 12px!important;
  background:var(--ob-surface,#F8FAFC)!important;background-color:var(--ob-surface,#F8FAFC)!important;
  border:1px solid var(--ob-border,#CBD5E1)!important;border-radius:18px!important;
  box-shadow:none!important
 }
 html body #app #financeiroMain #fmLista>[data-fin-card="1"]>h3{
  font-size:18px!important;line-height:1.28!important;font-weight:850!important;margin:0 0 5px!important
 }
 html body #app #financeiroMain #fmLista>[data-fin-card="1"]>.muted{
  font-size:14px!important;line-height:1.38!important;margin:0 0 9px!important
 }
 html body #app #financeiroMain #fmLista>[data-fin-card="1"]>.grid{
  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
  width:100%!important;max-width:100%!important;min-width:0!important;
  gap:8px!important;margin:8px 0 0!important;
 }
 html body #app #financeiroMain #fmLista>[data-fin-card="1"]>.grid>.mini{
  position:relative!important;grid-column:1!important;grid-row:auto!important;
  box-sizing:border-box!important;width:100%!important;max-width:100%!important;
  min-width:0!important;display:flex!important;flex-direction:column!important;
  align-items:flex-start!important;justify-content:center!important;
  background:transparent!important;background-color:transparent!important;
  border:1px solid var(--ob-border,#CBD5E1)!important;border-radius:12px!important;
  min-height:65px!important;padding:10px 5px 10px 48px!important;gap:0!important;
  box-shadow:none!important
 }
 html body #app #financeiroMain #fmLista>[data-fin-card="1"]>.grid>.mini::before,
 html body #app #financeiroMain #fmLista>[data-fin-card="1"]>.grid>.mini::after{
  content:none!important;display:none!important
 }
 html body #app #financeiroMain #fmLista>[data-fin-card="1"]>.grid>.mini>small{
  display:block!important;position:static!important;align-self:flex-start!important;
  margin:0!important;padding:0!important;min-height:0!important;
  font-size:clamp(12px,3.35vw,14px)!important;font-weight:750!important;
  line-height:1.2!important;text-align:left!important;white-space:nowrap!important;
  color:var(--ob-muted,#526173)!important;-webkit-text-fill-color:var(--ob-muted,#526173)!important
 }
 html body #app #financeiroMain #fmLista>[data-fin-card="1"]>.grid>.mini>small::before{
  position:absolute!important;content:'↑'!important;left:9px!important;top:50%!important;
  transform:translateY(-50%)!important;
  display:flex!important;align-items:center!important;justify-content:center!important;
  box-sizing:border-box!important;width:31px!important;height:31px!important;
  border-radius:50%!important;background:#16A34A!important;
  font-size:20px!important;font-weight:900!important;
  color:#fff!important;-webkit-text-fill-color:#fff!important
 }
 html body #app #financeiroMain #fmLista>[data-fin-card="1"][data-tipo="despesa"]>.grid>.mini>small::before{
  content:'↓'!important;background:#DC2626!important
 }
 html body #app #financeiroMain #fmLista>[data-fin-card="1"]>.grid>.mini>b{
  display:block!important;position:static!important;align-self:flex-start!important;
  margin:3px 0 0!important;padding:0!important;flex:0 1 auto!important;
  width:auto!important;max-width:100%!important;min-width:0!important;
  font-size:clamp(12px,3.55vw,17px)!important;font-weight:900!important;
  letter-spacing:-.02em!important;line-height:1.2!important;
  text-align:left!important;white-space:nowrap!important;font-variant-numeric:tabular-nums!important
 }
 html[data-theme="light"] body #app #financeiroMain #fmLista>[data-fin-card="1"][data-tipo="receita"]>.grid>.mini>b{
  color:#15803D!important;-webkit-text-fill-color:#15803D!important
 }
 html[data-theme="light"] body #app #financeiroMain #fmLista>[data-fin-card="1"][data-tipo="despesa"]>.grid>.mini>b{
  color:#B91C1C!important;-webkit-text-fill-color:#B91C1C!important
 }
 html[data-theme="dark"] body #app #financeiroMain #fmLista>[data-fin-card="1"][data-tipo="receita"]>.grid>.mini>b{
  color:#4ADE80!important;-webkit-text-fill-color:#4ADE80!important
 }
 html[data-theme="dark"] body #app #financeiroMain #fmLista>[data-fin-card="1"][data-tipo="despesa"]>.grid>.mini>b{
  color:#FF6B6B!important;-webkit-text-fill-color:#FF6B6B!important
 }
 html body #app #financeiroMain #fmLista>[data-fin-card="1"]>.actions{
  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
  width:100%!important;max-width:100%!important;gap:9px!important;
  margin:10px 0 0!important
 }
 html body #app #financeiroMain #fmLista>[data-fin-card="1"]>.actions>button{
  box-sizing:border-box!important;grid-column:auto!important;
  width:100%!important;max-width:100%!important;min-width:0!important;
  min-height:42px!important;padding:8px 10px!important;
  background:var(--ob-surface-2,#FFF)!important;
  border:1px solid var(--ob-border,#CBD5E1)!important;border-radius:12px!important;
  font-size:16px!important;font-weight:800!important
 }
 html body #app #financeiroMain #fmLista>[data-fin-card="1"]>.actions>button:only-child{
  grid-column:1/-1!important
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