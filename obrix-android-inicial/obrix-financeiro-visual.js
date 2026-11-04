(()=>{
'use strict';
if(window.__OBRIX_FIN_VISUAL)return;window.__OBRIX_FIN_VISUAL=true;
function ehVoltar(b){const t=String(b?.textContent||'').replace(/\s+/g,'').trim(),a=String(b?.getAttribute?.('aria-label')||'').toLowerCase(),ti=String(b?.getAttribute?.('title')||'').toLowerCase();return t==='←'||t==='‹'||t==='⬅'||t==='↩'||a.includes('voltar')||ti.includes('voltar')}
function removerSetasDuplicadas(){
 const main=document.getElementById('financeiroMain');if(!main)return;
 const top=main.previousElementSibling?.classList?.contains('top')?main.previousElementSibling:document.querySelector('#app>.top,.wrap #app .top');
 const candidatos=[...(top?.querySelectorAll?.('button,.btn,[role="button"],a')||[]),...main.querySelectorAll(':scope > button,:scope > .btn,:scope > [role="button"],:scope > a,.hero button,.hero .btn,.hero [role="button"],.hero a')].filter(ehVoltar);
 if(candidatos.length>1)candidatos.slice(1).forEach(b=>b.remove());
}
function aplicar(){
 const main=document.getElementById('financeiroMain');if(!main)return;removerSetasDuplicadas();
 const hero=main.querySelector('.hero');if(hero){hero.querySelectorAll('p').forEach(p=>p.remove());hero.classList.add('obxFinHeroLimpo');hero.querySelectorAll('button,.btn,[role="button"],a').forEach(b=>{if(ehVoltar(b))b.remove()})}
 const rec=document.getElementById('fmRecebido'),des=document.getElementById('fmDespesas'),res=document.getElementById('fmResultado');
 if(rec)rec.classList.add('obxFinRecebido');if(des)des.classList.add('obxFinDespesa');if(res)res.classList.add('obxFinResultado');
 const br=document.getElementById('fmReceita'),bd=document.getElementById('fmDespesa');if(br)br.classList.add('obxFinBtnReceita');if(bd)bd.classList.add('obxFinBtnDespesa');
 const sh=main.querySelector('.sectionHead');if(sh){sh.classList.add('obxFinSectionHead');const acoes=sh.querySelector('div');if(acoes)acoes.classList.add('obxFinAcoes')}
 main.querySelectorAll('[data-fin-card="1"]').forEach(card=>{
   card.classList.add('obxFinCardCompacto');
   const tipo=card.dataset.tipo;const mini=card.querySelector('.mini');const rotulo=mini?.querySelector('small');const valor=mini?.querySelector('b');
   if(valor){valor.classList.toggle('obxFinValorDespesa',tipo==='despesa');valor.classList.toggle('obxFinValorReceita',tipo==='receita');if(document.documentElement.dataset.theme==='light'){const cor=tipo==='receita'?'#16a34a':'#dc2626';valor.style.setProperty('color',cor,'important');valor.style.setProperty('-webkit-text-fill-color',cor,'important')}}
   if(rotulo&&document.documentElement.dataset.theme==='light'){rotulo.style.setProperty('color','var(--ob-muted,#526173)','important');rotulo.style.setProperty('-webkit-text-fill-color','var(--ob-muted,#526173)','important')}
   const btn=card.querySelector('[data-fin="excluir"]');if(btn){btn.textContent='Apagar';btn.classList.add('obxFinApagar')}
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
`;
document.head.appendChild(css);
const init=()=>{aplicar();const main=document.getElementById('financeiroMain');if(main&&!main.__obxFinVisual){main.__obxFinVisual=true;new MutationObserver(()=>requestAnimationFrame(aplicar)).observe(main,{childList:true,subtree:true})}[100,400,900,1800].forEach(ms=>setTimeout(aplicar,ms))};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.addEventListener('obrix:theme-applied',()=>requestAnimationFrame(aplicar));
window.OBRIX_FIN_VISUAL={refresh:aplicar};
})();