(function(){
'use strict';
if(window.__EDIFIQ_ACTION85M2)return;window.__EDIFIQ_ACTION85M2=true;
const VERSION='85m2',q=id=>document.getElementById(id),norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const isPage=id=>!!q(id)?.classList?.contains('page');
function toast85(m){try{window.toast?.(m)}catch(_){}}
function closeDrawer(){q('menuPasta')?.classList.remove('open');q('menuPastaBackdrop')?.classList.remove('open')}
function enforcePage(id){if(!isPage(id))return false;closeDrawer();document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));document.querySelectorAll('nav.nav button[data-p],.nav button[data-p]').forEach(b=>b.classList.toggle('active',b.dataset.p===id));try{window.scrollTo(0,0)}catch(_){}return true}
function navigate85(id){if(!enforcePage(String(id||'').trim()))return false;try{window.renderAll?.()}catch(e){console.warn('EDIFIQ mobile render',e)};setTimeout(()=>enforcePage(id),80);return true}
window.edifiqNavigate85=navigate85;window.go=navigate85;window.goMenu=function(p){closeDrawer();return navigate85(p)};
function openModal(id){const m=q(id);if(!m)return false;document.querySelectorAll('.modal.open').forEach(x=>x.classList.remove('open'));m.classList.add('open');m.removeAttribute('hidden');m.style.display='';document.body.classList.add('modal-open');return true}
function setv(id,v=''){const e=q(id);if(e)e.value=v}
function today(){return new Date().toISOString().slice(0,10)}
function prepSelectors(){try{window.fillSelectors?.()}catch(_){} }
/* No iPhone, abre os modais diretamente. Isso evita wrappers antigos disputando o mesmo toque. */
function openFin85(){prepSelectors();setv('tFin','entrada');setv('dFin');setv('vFin');setv('dtFin',today());setv('forFin');setv('obsFin');try{window.atualizarCategoriaFinanceira?.();window.atualizarReceitaChecklistDistribuicao?.();window.atualizarDespesaChecklistDistribuicao?.()}catch(_){}return openModal('finM')}
function openObra85(){setv('oNome');setv('oCli');setv('oLoc');setv('oVal');setv('oIni',today());setv('oFim');setv('oTipo');setv('oObs');setv('oStatus','em_andamento');if(q('obraTitle'))q('obraTitle').textContent='Nova obra';return openModal('obraM')}
function openFunc85(){prepSelectors();['fNome','fFunc','fTel','fDia','fSal','fPag'].forEach(id=>setv(id));setv('fAtivo','true');setv('fTipo','diaria');setv('fDiariaRegistro','true');setv('fObra');if(q('funcTitle'))q('funcTitle').textContent='Novo funcionário';return openModal('funcM')}
function openDia85(id){prepSelectors();setv('dData',today());setv('dQtd','1');if(id)setv('dFunc',String(id));try{window.aplicarTipoDiaria?.();window.fillDiariaChecklistSelector?.()}catch(_){}return openModal('diaM')}
function openVale85(id){prepSelectors();try{window.fillAdiantamentoFuncionarios?.()}catch(_){};if(id)setv('adiantFunc',String(id));setv('adiantValor');setv('adiantData',today());setv('adiantObs');try{window.fillValeChecklistSelector?.()}catch(_){}return openModal('adiantM')}
function openPay85(id){try{if(id&&typeof window.openPagamentoFuncionario==='function'){window.openPagamentoFuncionario(id);return true}if(typeof window.openPagamentoEquipe==='function'){window.openPagamentoEquipe();return true}}catch(e){console.warn(e)}return openModal('pagEquipeM')}
function argsFrom(on,name){const m=String(on||'').match(new RegExp(name+'\\([\\"\\\']?([^\\"\\\'\\)]*)'));return m&&m[1]?m[1]:null}
function print85(){try{window.focus();setTimeout(()=>window.print(),120);return true}catch(e){console.error(e);toast85('Não foi possível abrir a impressão.');return false}}
function action(el){const on=String(el.getAttribute?.('onclick')||''),text=norm(el.textContent);
 if(/openFin\s*\(/.test(on)||(/lancamento/.test(text)&&el.closest('#financeiro')))return openFin85;
 if(/openObra\s*\(\s*\)/.test(on))return openObra85;
 if(/openFuncCommand\(['\"]add/.test(on)||/openFunc\s*\(\s*\)/.test(on)||(/funcionario/.test(text)&&/adicionar|novo|\+/.test(text)))return openFunc85;
 if(/openDiaFuncionario/.test(on)){const id=argsFrom(on,'openDiaFuncionario');return()=>openDia85(id)} if(/openDia\s*\(\s*\)/.test(on))return()=>openDia85();
 if(/openAdiantamentoFuncionario/.test(on)){const id=argsFrom(on,'openAdiantamentoFuncionario');return()=>openVale85(id)} if(/openAdiantamento\s*\(\s*\)/.test(on))return()=>openVale85();
 if(/openPagamentoFuncionario/.test(on)){const id=argsFrom(on,'openPagamentoFuncionario');return()=>openPay85(id)} if(/openPagamentoEquipe/.test(on))return()=>openPay85();
 if(/print|imprimir/.test(text)||/rtPrint|edifiqReportPrint|ed27PrintReport|window\.print/.test(on))return print85;
 return null}
function pageFrom(el){const p=el.dataset?.p;if(p&&isPage(p))return p;const m=String(el.getAttribute?.('onclick')||'').match(/go(?:Menu)?\(['\"]([^'\"]+)/i);return m&&isPage(m[1])?m[1]:''}
let lastTouch=0;
function handle(ev){if(ev.type==='click'&&Date.now()-lastTouch<650)return;const el=ev.target?.closest?.('button,a,[role="button"]');if(!el)return;const p=pageFrom(el);const a=action(el);if(!p&&!a)return;if(ev.type==='touchend')lastTouch=Date.now();ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();if(p)navigate85(p);else a()}
/* touchend resolve o Safari/iPhone antes que handlers antigos cancelem o click sintetizado. */
document.addEventListener('touchend',handle,{capture:true,passive:false});document.addEventListener('click',handle,true);
window.addEventListener('pageshow',()=>{document.documentElement.classList.add('edifiq-mobile-actions-ready')});
})();