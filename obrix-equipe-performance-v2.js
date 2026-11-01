(()=>{
'use strict';
if(window.__OBRIX_EQUIPE_PERFORMANCE_V2)return;window.__OBRIX_EQUIPE_PERFORMANCE_V2=true;

const abrirCore=typeof window.abrir==='function'?window.abrir:null;
if(!abrirCore)return;

let abrirCompleto=null;
let instalado=false;
let aquecido=false;
let bootAgendado=false;
let ultimaAtualizacao=Number(window.__OBRIX_CORE_LAST_LOAD||Date.now());

const appAberto=()=>{
  const app=document.getElementById('app'),login=document.getElementById('login');
  return !!(app&&!app.classList.contains('hidden')&&(!login||login.classList.contains('hidden')));
};

function atualizarEmSegundoPlano(){
  const agora=Date.now();
  if(agora-ultimaAtualizacao<60000)return;
  ultimaAtualizacao=agora;
  setTimeout(()=>{
    const api=window.OBRIX_EQUIPE;
    if(!api?.refresh)return;
    Promise.resolve(api.refresh()).then(()=>{ultimaAtualizacao=Date.now()}).catch(e=>console.warn('Equipe: atualização em segundo plano indisponível',e));
  },800);
}

function abrirOtimizado(id){
  if(id==='equipe'){
    const r=abrirCore.apply(this,arguments);
    const loader=window.OBRIX_POS_LOGIN_LOADER;
    if(loader?.loadGroup)setTimeout(()=>loader.loadGroup('equipe').catch?.(()=>{}),0);
    atualizarEmSegundoPlano();
    return r;
  }
  const fn=abrirCompleto&&abrirCompleto!==abrirOtimizado?abrirCompleto:abrirCore;
  return fn.apply(this,arguments);
}

function instalarRotaRapida(){
  if(instalado)return true;
  const atual=window.abrir;
  if(typeof atual!=='function'||atual===abrirOtimizado)return false;
  abrirCompleto=atual;
  window.abrir=abrirOtimizado;
  instalado=true;
  return true;
}

async function aquecerEquipe(){
  if(aquecido)return true;
  const loader=window.OBRIX_POS_LOGIN_LOADER;
  if(!loader?.loadGroup)return false;
  aquecido=true;
  try{
    await loader.loadGroup('equipe');
    return true;
  }catch(e){
    aquecido=false;
    console.warn('Equipe: pré-carga indisponível',e);
    return false;
  }
}

function preparar(tentativa=0){
  if(!appAberto()){bootAgendado=false;return}
  const loader=window.OBRIX_POS_LOGIN_LOADER;
  const status=loader?.status?.();
  if(!loader||(!status?.baseDone&&navigator.onLine)){
    if(tentativa<50)setTimeout(()=>preparar(tentativa+1),120);
    else bootAgendado=false;
    return;
  }
  ultimaAtualizacao=Number(window.__OBRIX_CORE_LAST_LOAD||Date.now());
  instalarRotaRapida();
  const iniciar=()=>aquecerEquipe();
  if('requestIdleCallback'in window)requestIdleCallback(iniciar,{timeout:1200});
  else setTimeout(iniciar,350);
}

function agendar(){
  if(bootAgendado)return;
  bootAgendado=true;
  setTimeout(()=>preparar(0),80);
}

const app=document.getElementById('app');
if(app){
  const obs=new MutationObserver(()=>{if(appAberto()){obs.disconnect();agendar()}});
  obs.observe(app,{attributes:true,attributeFilter:['class']});
}
window.addEventListener('pageshow',agendar);
setTimeout(()=>{if(appAberto())agendar()},120);

if(!document.getElementById('obrix-ajustes-desktop-20261101-loader')){
  const s=document.createElement('script');
  s.id='obrix-ajustes-desktop-20261101-loader';
  s.src='./obrix-ajustes-desktop-20261101.js?v=20261101-1';
  s.async=false;
  document.body.appendChild(s);
}
})();