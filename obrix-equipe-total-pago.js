(()=>{'use strict';
let carregando=false,timer=null,totais=new Map();
async function atualizar(){
  if(carregando||!window.OBRIX_BACKEND)return;
  carregando=true;
  try{
    const sb=await OBRIX_BACKEND.init(),r=await sb.rpc('obrix_totais_pagos_equipe');
    if(r.error)throw r.error;
    totais=new Map((r.data||[]).map(x=>[String(x.funcionario_id),Number(x.total_pago||0)]));
  }catch(e){console.warn('Equipe: total pago indisponível',e)}finally{carregando=false}
}
function agendar(ms=250){clearTimeout(timer);timer=setTimeout(atualizar,ms)}
function instalar(){agendar(0)}
document.addEventListener('click',e=>{
  const b=e.target.closest?.('button');if(!b)return;
  const t=(b.textContent||'').trim();
  if(t==='Equipe'||t.includes('Pagar')||t==='Confirmar pagamento'||t==='Estornar'||t==='Registrar diária'||t==='Vale'||t==='Bônus e Extras')agendar(t==='Confirmar pagamento'||t==='Estornar'?900:300)
},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
window.OBRIX_EQUIPE_TOTAL_PAGO={refresh:atualizar,paint:()=>{},get:id=>totais.get(String(id))||0};
})();
(()=>{if(window.__OBRIX_REGISTROS_EXCLUIR_LOADER)return;window.__OBRIX_REGISTROS_EXCLUIR_LOADER=true;const s=document.createElement('script');s.src='./obrix-equipe-registros-excluir.js?v=20261019diaria1';s.defer=true;document.head.appendChild(s)})();