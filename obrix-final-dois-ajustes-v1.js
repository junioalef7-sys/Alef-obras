(()=>{'use strict';
if(window.__OBRIX_FINAL_DOIS_AJUSTES_V1)return;window.__OBRIX_FINAL_DOIS_AJUSTES_V1=true;
const RED='#b91c1c',WHITE='#ffffff',LIGHT='#F5F7FA',DARK='#0F1720',BORDER_LIGHT='#D9E0E8',BORDER_DARK='#2A3948';
function imp(el,p,v){if(el)el.style.setProperty(p,v,'important')}
function vermelho(el){if(!el)return;imp(el,'background',RED);imp(el,'background-color',RED);imp(el,'background-image','none');imp(el,'color',WHITE);imp(el,'-webkit-text-fill-color',WHITE);imp(el,'border-color','#991b1b');imp(el,'box-shadow','none');imp(el,'text-shadow','none')}
function pintarExcluir(){vermelho(document.getElementById('cfgExcluirConta'));document.querySelectorAll('.accountDeleteModal button.excluir').forEach(vermelho)}
function escuro(){return document.documentElement.dataset.theme==='dark'||document.body?.classList.contains('dark')}
function rotuloTema(){const b=document.getElementById('obrixThemeInicioFinal');if(!b)return;const d=escuro();b.textContent=d?'☀️ Claro':'🌙 Escuro';b.setAttribute('aria-label',d?'Ativar modo claro':'Ativar modo escuro');imp(b,'background',d?DARK:LIGHT);imp(b,'background-color',d?DARK:LIGHT);imp(b,'color',d?WHITE:'#111827');imp(b,'-webkit-text-fill-color',d?WHITE:'#111827');imp(b,'border-color',d?BORDER_DARK:BORDER_LIGHT)}
function garantirTema(){const inicio=document.getElementById('inicio');if(!inicio)return;let b=document.getElementById('obrixThemeInicioFinal');if(!b){b=document.createElement('button');b.id='obrixThemeInicioFinal';b.type='button';b.className='obrixThemeInicioFinal';b.onclick=()=>{const prox=escuro()?'light':'dark';window.OBRIX_THEME?.apply?.(prox);setTimeout(rotuloTema,0)};inicio.insertBefore(b,inicio.firstChild)}rotuloTema()}
const st=document.createElement('style');st.textContent=`#inicio #obrixThemeInicioFinal{display:flex!important;width:max-content!important;min-width:92px!important;min-height:40px!important;margin:0 0 12px auto!important;padding:9px 12px!important;border:1px solid ${BORDER_LIGHT}!important;border-radius:11px!important;align-items:center!important;justify-content:center!important;font-weight:850!important;font-size:14px!important;line-height:1!important;box-shadow:none!important;text-shadow:none!important}`;document.head.appendChild(st);
function atualizar(){garantirTema();pintarExcluir()}
['obrix:modules-ready','obrix:modules-online-ready','pageshow','obrix:theme-changed'].forEach(n=>window.addEventListener(n,()=>{setTimeout(atualizar,0);setTimeout(atualizar,180)}));
window.addEventListener('obrix:feature-pronto',e=>{if(e?.detail?.name==='config'){setTimeout(pintarExcluir,0);setTimeout(pintarExcluir,300);setTimeout(pintarExcluir,650)}});
document.addEventListener('click',e=>{if(e.target.closest?.('#bInicio,.bottom button'))setTimeout(garantirTema,120);if(e.target.closest?.('[data-go="config"],#cfgExcluirConta')){setTimeout(pintarExcluir,80);setTimeout(pintarExcluir,350)}},true);
setTimeout(atualizar,350);setTimeout(atualizar,1300);
})();
