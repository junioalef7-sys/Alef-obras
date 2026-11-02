(()=>{'use strict';
if(window.__OBRIX_FIN_LUCRO_ESTAVEL)return;
window.__OBRIX_FIN_LUCRO_ESTAVEL=true;

const desc=Object.getOwnPropertyDescriptor(Node.prototype,'textContent');
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let instalado=false,obsLista=null,obsBody=null,timer=null;

function escrever(el,valor){
  if(!el)return;
  if(desc?.set)desc.set.call(el,valor);
  else el.innerText=valor;
}

function blindar(el){
  if(!el||el.__obrixLucroBlindado)return;
  try{
    Object.defineProperty(el,'textContent',{
      configurable:true,
      get(){return desc?.get?desc.get.call(this):this.innerText},
      set(){return true}
    });
    Object.defineProperty(el,'__obrixLucroBlindado',{value:true,configurable:true});
  }catch(_){ }
}

function recalcular(){
  clearTimeout(timer);
  timer=null;
  const res=document.getElementById('fmResultado');
  if(!res)return false;
  const label=res.closest('.kpi')?.querySelector('small');
  blindar(res);blindar(label);
  const fin=Array.isArray(window.financeiro)?window.financeiro:[];
  const ativos=fin.filter(x=>!x.status_lancamento||x.status_lancamento==='ativo');
  const recebido=ativos.filter(x=>x.tipo==='receita').reduce((s,x)=>s+Number(x.valor||0),0);
  const despesas=ativos.filter(x=>x.tipo==='despesa').reduce((s,x)=>s+Number(x.valor||0),0);
  escrever(res,money(recebido-despesas));
  escrever(label,'Lucro');
  return true;
}

function agendar(ms=0){
  clearTimeout(timer);
  timer=setTimeout(recalcular,ms);
}

function instalar(){
  const main=document.getElementById('financeiroMain');
  if(!main)return false;
  if(!instalado){
    instalado=true;
    const lista=document.getElementById('fmLista');
    if(lista){
      obsLista=new MutationObserver(()=>agendar(0));
      obsLista.observe(lista,{childList:true,subtree:false});
    }
  }
  recalcular();
  return true;
}

if(!instalar()){
  obsBody=new MutationObserver(()=>{if(instalar()){obsBody.disconnect();obsBody=null}});
  obsBody.observe(document.body,{childList:true,subtree:true});
}

document.addEventListener('click',e=>{
  const b=e.target.closest?.('button');
  if(b&&(b.textContent||'').trim()==='Financeiro')agendar(0);
},true);
window.addEventListener('focus',()=>agendar(0));
window.addEventListener('pageshow',()=>agendar(0));
window.addEventListener('obrix-financeiro-atualizado',()=>agendar(0));
window.addEventListener('obrix-dados-atualizados',()=>agendar(0));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')agendar(0)});

window.OBRIX_FIN_LUCRO_ESTAVEL={refresh:recalcular};
})();
