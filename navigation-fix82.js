(function(){
'use strict';
if(window.__EDIFIQ_NAV82)return;window.__EDIFIQ_NAV82=true;
const VERSION='82';
const MAIN_PAGES=new Set(['dashboard','financeiro','funcionarios','obras']);
const q=id=>document.getElementById(id);
const pageExists=id=>!!q(id)?.classList?.contains('page');
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();

function closeDrawer82(){
 const menu=q('menuPasta'),back=q('menuPastaBackdrop');
 if(menu){menu.classList.remove('open');menu.setAttribute('aria-hidden','true')}
 if(back){back.classList.remove('open');back.setAttribute('aria-hidden','true')}
}
function limited82(){try{return typeof window.edifiqLimitedMode63==='function'&&window.edifiqLimitedMode63()}catch(_){return false}}
function blocked82(page){return limited82()&&!MAIN_PAGES.has(String(page||''))}
function blockMessage82(){try{window.toast?.('Seu teste grátis terminou. Este recurso fica disponível após a assinatura.')}catch(_){}}

function activate82(page){
 page=String(page||'').trim();
 const target=q(page);if(!target||!target.classList.contains('page'))return false;
 if(blocked82(page)){blockMessage82();return false}
 closeDrawer82();
 try{window.renderAll?.()}catch(e){console.warn('EDIFIQ nav82 render:',e)}
 document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
 target.classList.add('active');
 document.querySelectorAll('nav.nav button[data-p],.nav button[data-p]').forEach(btn=>btn.classList.toggle('active',btn.dataset.p===page));
 try{window.scrollTo({top:0,behavior:'auto'})}catch(_){try{window.scrollTo(0,0)}catch(__){}}
 try{window.dispatchEvent(new CustomEvent('edifiq:navigation',{detail:{page,version:VERSION}}))}catch(_){}
 return true;
}

const oldGo=window.go;
window.go=function(page){
 const id=String(page||'').trim();
 if(pageExists(id))return activate82(id);
 return typeof oldGo==='function'?oldGo.apply(this,arguments):false;
};
window.go.__edifiqNav82=true;window.go.__edifiqOriginal82=oldGo;
window.goMenu=function(page){closeDrawer82();return window.go(page)};

function pageFromClick82(el){
 if(!el)return'';
 const data=el.dataset?.p;if(data&&pageExists(data))return data;
 const on=String(el.getAttribute?.('onclick')||'');
 const m=on.match(/go(?:Menu)?\(['"]([^'"]+)['"]\)/i);
 return m&&pageExists(m[1])?m[1]:'';
}
function captureNav82(ev){
 const el=ev.target?.closest?.('nav.nav button[data-p],#menuPasta button,[onclick*="go(\'"] ,[onclick*="go(&quot;"],[onclick*="goMenu(\'"] ,[onclick*="goMenu(&quot;"]');
 if(!el)return;
 const page=pageFromClick82(el);if(!page)return;
 ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();activate82(page);
}
document.addEventListener('click',captureNav82,true);

function openVale82(employeeId){
 closeDrawer82();
 try{window.fillSelectors?.()}catch(_){}
 try{window.fillAdiantamentoFuncionarios?.()}catch(_){}
 const modal=q('adiantM');if(!modal){try{window.toast?.('Tela de Vale indisponível. Reabra o aplicativo.')}catch(_){}return false}
 const obra=q('adiantObra'),func=q('adiantFunc'),valor=q('adiantValor'),data=q('adiantData'),obs=q('adiantObs');
 if(func)func.value=employeeId==null?'':String(employeeId);
 if(obra){let obraId='';if(employeeId!=null)try{obraId=String(window.getFuncObra?.(employeeId)||'')}catch(_){}obra.value=obraId}
 if(valor)valor.value='';if(data)data.value=typeof window.today==='function'?window.today():new Date().toISOString().slice(0,10);if(obs)obs.value='';
 try{window.fillValeChecklistSelector?.()}catch(_){}
 modal.classList.add('open');return true;
}
window.openAdiantamento=function(){return openVale82(null)};
window.openAdiantamentoFuncionario=function(id){return openVale82(id)};

function patchButtons82(){
 document.querySelectorAll('nav.nav button[data-p],#menuPasta button').forEach(btn=>{
  const p=pageFromClick82(btn);if(p)btn.dataset.edNav82=p;
  const text=norm(btn.textContent);
  if(text==='vale'||text==='vales')btn.dataset.edVale82='1';
 });
}
function captureVale82(ev){
 const btn=ev.target?.closest?.('[data-ed-vale82="1"],[onclick*="openAdiantamento"]');if(!btn)return;
 ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
 const raw=String(btn.getAttribute('onclick')||''),m=raw.match(/openAdiantamentoFuncionario\(['"]?([^'"\)]+)['"]?\)/i);
 openVale82(m?m[1]:null);
}
document.addEventListener('click',captureVale82,true);

function health82(){
 const expected=['dashboard','financeiro','funcionarios','obras'];
 const missing=expected.filter(id=>!pageExists(id));
 if(missing.length)console.error('EDIFIQ nav82: páginas ausentes:',missing);
 patchButtons82();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',health82,{once:true});else health82();
setTimeout(health82,500);setTimeout(health82,1800);
window.edifiqNavigate82=activate82;window.edifiqNavigationHealth82=health82;
})();