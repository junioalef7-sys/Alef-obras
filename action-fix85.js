(function(){
'use strict';
if(window.__EDIFIQ_ACTION854)return;window.__EDIFIQ_ACTION854=true;
const q=id=>document.getElementById(id),norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const isPage=id=>!!q(id)?.classList?.contains('page');
function closeDrawer(){const m=q('menuPasta'),b=q('menuPastaBackdrop');m?.classList.remove('open');b?.classList.remove('open');m?.setAttribute('aria-hidden','true');b?.setAttribute('aria-hidden','true')}
function navigate(id){id=String(id||'').trim();if(!isPage(id))return false;closeDrawer();document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));document.querySelectorAll('nav.nav button[data-p],.nav button[data-p]').forEach(b=>b.classList.toggle('active',b.dataset.p===id));try{window.renderAll?.()}catch(e){console.warn('EDIFIQ render',e)}try{window.scrollTo(0,0)}catch(_){}return true}
window.edifiqNavigate85=navigate;window.go=navigate;window.goMenu=p=>navigate(p);
function openModal(id){const m=q(id);if(!m)return false;closeDrawer();document.querySelectorAll('.modal.open').forEach(x=>x.classList.remove('open'));m.classList.add('open');m.removeAttribute('hidden');m.style.display='';document.body.classList.add('modal-open');return true}
function setv(id,v=''){const e=q(id);if(e)e.value=v}function today(){return new Date().toISOString().slice(0,10)}function prep(){try{window.fillSelectors?.()}catch(_){}}
function openFin(){prep();setv('tFin','entrada');setv('dFin');setv('vFin');setv('dtFin',today());setv('forFin');setv('obsFin');try{window.atualizarCategoriaFinanceira?.();window.atualizarReceitaChecklistDistribuicao?.();window.atualizarDespesaChecklistDistribuicao?.()}catch(_){}return openModal('finM')}
function openObra(){['oNome','oCli','oLoc','oVal','oFim','oTipo','oObs'].forEach(id=>setv(id));setv('oIni',today());setv('oStatus','em_andamento');if(q('obraTitle'))q('obraTitle').textContent='Nova obra';return openModal('obraM')}
function openFunc(){prep();['fNome','fFunc','fTel','fDia','fSal','fPag'].forEach(id=>setv(id));setv('fAtivo','true');setv('fTipo','diaria');setv('fDiariaRegistro','true');setv('fObra');if(q('funcTitle'))q('funcTitle').textContent='Novo funcionário';return openModal('funcM')}
function openDia(id){prep();setv('dData',today());setv('dQtd','1');if(id)setv('dFunc',String(id));try{window.aplicarTipoDiaria?.();window.fillDiariaChecklistSelector?.()}catch(_){}return openModal('diaM')}
function openVale(id){prep();try{window.fillAdiantamentoFuncionarios?.()}catch(_){}if(id)setv('adiantFunc',String(id));setv('adiantValor');setv('adiantData',today());setv('adiantObs');try{window.fillValeChecklistSelector?.()}catch(_){}return openModal('adiantM')}
function arg(on,name){const m=String(on||'').match(new RegExp(name+'\\([\\"\\\']?([^\\"\\\'\\)]*)'));return m&&m[1]?m[1]:null}
function action(el){const on=String(el.getAttribute?.('onclick')||''),text=norm(el.textContent);if(/openFin\s*\(/.test(on)||(/lancamento/.test(text)&&el.closest('#financeiro')))return openFin;if(/openObra\s*\(\s*\)/.test(on))return openObra;if(/openFuncCommand\(['\"]add/.test(on)||/openFunc\s*\(\s*\)/.test(on))return openFunc;if(/openDiaFuncionario/.test(on)){const id=arg(on,'openDiaFuncionario');return()=>openDia(id)}if(/openDia\s*\(\s*\)/.test(on))return()=>openDia();if(/openAdiantamentoFuncionario/.test(on)){const id=arg(on,'openAdiantamentoFuncionario');return()=>openVale(id)}if(/openAdiantamento\s*\(\s*\)/.test(on))return()=>openVale();return null}
function page(el){const p=el.dataset?.p;if(p&&isPage(p))return p;const m=String(el.getAttribute?.('onclick')||'').match(/go(?:Menu)?\(['\"]([^'\"]+)/i);return m&&isPage(m[1])?m[1]:''}
/* v85.4: uma única camada e somente click. Sem touchend, sem preventDefault global e sem stopImmediatePropagation. */
document.addEventListener('click',ev=>{const el=ev.target?.closest?.('button,a,[role="button"]');if(!el)return;const p=page(el),a=action(el);if(!p&&!a)return;ev.preventDefault();ev.stopPropagation();if(p)navigate(p);else a()},false);
window.addEventListener('pageshow',()=>{document.documentElement.classList.add('edifiq-actions-ready');closeDrawer()});
})();