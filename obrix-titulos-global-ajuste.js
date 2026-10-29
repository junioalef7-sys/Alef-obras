(()=>{'use strict';
if(window.__OBRIX_TITULOS_GLOBAL_AJUSTE)return;window.__OBRIX_TITULOS_GLOBAL_AJUSTE=true;
const norm=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
function style(){if(document.getElementById('obrix-titulos-global-ajuste-style'))return;const s=document.createElement('style');s.id='obrix-titulos-global-ajuste-style';s.textContent=`
/* Escopo exclusivo dos cartões de título */
main>.hero,.obrixPageMain>.hero,[id$="Main"]>.hero{width:max-content!important;max-width:100%!important;min-width:0!important;display:block!important;text-align:left!important;padding:10px 12px!important;margin-right:auto!important;margin-left:0!important}
main>.hero h1,.obrixPageMain>.hero h1,[id$="Main"]>.hero h1{font-size:95%!important;text-align:left!important;width:auto!important;margin-left:0!important;margin-right:0!important}
/* seta única de voltar fora do cartão de título */
.obrixTituloVoltar{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;margin:0 0 8px 0;border:1px solid var(--ob-border);border-radius:10px;background:var(--ob-surface-2);color:var(--ob-text);font-size:25px;font-weight:900;line-height:1}
`;
document.head.appendChild(s)}
function removeFecharTitulos(){document.querySelectorAll('main>.hero,.obrixPageMain>.hero,[id$="Main"]>.hero').forEach(hero=>hero.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{if(norm(b.textContent)==='fechar')b.remove()}))}
function dedupObras(){const root=document.getElementById('listaObras');if(!root)return;root.querySelectorAll('.item,.card').forEach(card=>{['pagamentos recebidos','relatório fotográfico','relatorio fotografico'].forEach(nome=>{const bs=[...card.querySelectorAll('button,.btn,[role="button"]')].filter(b=>norm(b.textContent)===nome);bs.slice(1).forEach(b=>b.remove())})})}
function visible(el){if(!el||el.classList.contains('hidden'))return false;const cs=getComputedStyle(el);return cs.display!=='none'&&cs.visibility!=='hidden'}
function addBack(){document.querySelectorAll('main,[id$="Main"]').forEach(page=>{if(!visible(page)||page.id==='inicio')return;const hero=page.querySelector(':scope > .hero');if(!hero)return;let back=page.querySelector(':scope > .obrixTituloVoltar');if(back)return;const existing=[...page.querySelectorAll(':scope > button,:scope > .sectionHead button')].find(b=>/^(←|‹|voltar)$/i.test(norm(b.textContent)));if(existing)return;back=document.createElement('button');back.type='button';back.className='obrixTituloVoltar';back.setAttribute('aria-label','Voltar');back.textContent='←';back.addEventListener('click',()=>{if(history.length>1)history.back();else if(typeof window.abrir==='function')window.abrir('inicio')});page.insertBefore(back,hero)})}
function apply(){style();removeFecharTitulos();dedupObras();addBack()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','pageshow'].forEach(n=>window.addEventListener(n,()=>requestAnimationFrame(apply)));
const mo=new MutationObserver(ms=>{if(ms.some(m=>m.addedNodes.length))requestAnimationFrame(apply)});mo.observe(document.body,{childList:true,subtree:true});
})();