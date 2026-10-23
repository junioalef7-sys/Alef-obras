(()=>{'use strict';
if(window.__OBRIX_EQUIPE_CONTROLES_GUARD)return;window.__OBRIX_EQUIPE_CONTROLES_GUARD=true;
const VISUAL=`
/* OBRIX — blindagem visual da Equipe: sem fundo dourado + tamanhos levemente menores */
html body #app .bottom button.active{
  background:rgba(100,116,139,.10)!important;
  background-image:none!important;
  color:#334155!important;
  -webkit-text-fill-color:#334155!important;
  box-shadow:inset 0 0 0 1px rgba(100,116,139,.16)!important;
}
html[data-theme="dark"] body #app .bottom button.active,
body.dark #app .bottom button.active{
  background:rgba(148,163,184,.10)!important;
  background-image:none!important;
  color:#f8fafc!important;
  -webkit-text-fill-color:#f8fafc!important;
  box-shadow:inset 0 0 0 1px rgba(148,163,184,.14)!important;
}
html body #equipe #listaEquipe{gap:16px!important}
html body #equipe #listaEquipe .obrix-modelo-card{
  background:#fff!important;
  background-image:none!important;
  border-radius:20px!important;
  padding:24px!important;
}
html body #equipe #listaEquipe .obrix-modelo-cabecalho h3{font-size:25px!important}
html body #equipe #listaEquipe .obrix-modelo-subnome{font-size:18px!important;margin-bottom:17px!important}
html body #equipe #listaEquipe .obrix-modelo-status{padding:7px 12px!important;margin-bottom:20px!important}
html body #equipe #listaEquipe .obrix-modelo-pagamento{
  background:#f8fafc!important;
  background-image:none!important;
  padding:18px 20px!important;
  margin-bottom:14px!important;
}
html body #equipe #listaEquipe .obrix-modelo-pagamento small{font-size:14px!important}
html body #equipe #listaEquipe .obrix-modelo-pagamento strong{font-size:18px!important}
html body #equipe #listaEquipe .obrix-modelo-pagamento span{font-size:14px!important}
html body #equipe #listaEquipe .obrix-modelo-pagamento>b{font-size:27px!important;margin-top:18px!important}
html body #equipe #listaEquipe .obrix-modelo-pilulas{gap:8px!important;margin-bottom:14px!important}
html body #equipe #listaEquipe .obrix-modelo-pilulas span{
  background:#f8fafc!important;
  background-image:none!important;
  padding:8px 13px!important;
  font-size:14px!important;
}
html body #equipe #listaEquipe .obrix-modelo-metricas{gap:10px!important}
html body #equipe #listaEquipe .obrix-modelo-metrica{
  min-height:104px!important;
  padding:14px!important;
  background:#f8fafc!important;
  background-image:none!important;
  border-color:#e2e8f0!important;
}
html body #equipe #listaEquipe .obrix-modelo-metrica small{font-size:14px!important;margin-bottom:6px!important}
html body #equipe #listaEquipe .obrix-modelo-metrica b{font-size:24px!important}
html body #equipe #listaEquipe .obrix-modelo-metrica span{font-size:12px!important}
html body #equipe #listaEquipe .obrix-modelo-metrica.liquido{background:#fff1f2!important;border-color:#fecdd3!important}
html body #equipe #listaEquipe .obrix-modelo-acoes{gap:8px!important;margin-top:15px!important}
html body #equipe #listaEquipe .obrix-modelo-acoes button{
  min-height:52px!important;
  padding:10px!important;
  font-size:14px!important;
  background:#fff!important;
  background-image:none!important;
  color:#334155!important;
  -webkit-text-fill-color:#334155!important;
  border-color:#cbd5e1!important;
  box-shadow:none!important;
}
html[data-theme="dark"] body #equipe #listaEquipe .obrix-modelo-card,
body.dark #equipe #listaEquipe .obrix-modelo-card{
  background:#0f172a!important;
  background-image:none!important;
  border-color:#334155!important;
}
html[data-theme="dark"] body #equipe #listaEquipe .obrix-modelo-pagamento,
html[data-theme="dark"] body #equipe #listaEquipe .obrix-modelo-pilulas span,
html[data-theme="dark"] body #equipe #listaEquipe .obrix-modelo-metrica,
body.dark #equipe #listaEquipe .obrix-modelo-pagamento,
body.dark #equipe #listaEquipe .obrix-modelo-pilulas span,
body.dark #equipe #listaEquipe .obrix-modelo-metrica{
  background:#111827!important;
  background-image:none!important;
  border-color:#273449!important;
}
html[data-theme="dark"] body #equipe #listaEquipe .obrix-modelo-metrica.liquido,
body.dark #equipe #listaEquipe .obrix-modelo-metrica.liquido{
  background:#231b27!important;
  border-color:#3d2934!important;
}
html[data-theme="dark"] body #equipe #listaEquipe .obrix-modelo-acoes button,
body.dark #equipe #listaEquipe .obrix-modelo-acoes button{
  background:#161d25!important;
  background-image:none!important;
  color:#eef2f7!important;
  -webkit-text-fill-color:#eef2f7!important;
  border-color:#334155!important;
  box-shadow:none!important;
}
@media(max-width:700px){
  html body #equipe #listaEquipe .obrix-modelo-card{padding:18px 16px!important}
  html body #equipe #listaEquipe .obrix-modelo-cabecalho h3{font-size:22px!important}
  html body #equipe #listaEquipe .obrix-modelo-subnome{font-size:15px!important;margin-bottom:15px!important}
  html body #equipe #listaEquipe .obrix-modelo-pagamento{padding:15px!important}
  html body #equipe #listaEquipe .obrix-modelo-pagamento>b{font-size:24px!important;margin-top:16px!important}
  html body #equipe #listaEquipe .obrix-modelo-metrica{min-height:98px!important;padding:12px!important}
  html body #equipe #listaEquipe .obrix-modelo-metrica b{font-size:20px!important}
  html body #equipe #listaEquipe .obrix-modelo-acoes button{min-height:49px!important;font-size:14px!important;padding:9px 7px!important}
}
`;
function visual(){
  let s=document.getElementById('obrixEquipeVisualDiscretoFinal');
  if(!s){s=document.createElement('style');s.id='obrixEquipeVisualDiscretoFinal';document.head.appendChild(s)}
  if(s.textContent!==VISUAL)s.textContent=VISUAL;
  if(s!==document.head.lastElementChild)document.head.appendChild(s);
}
function ensure(){
  visual();
  const sec=document.getElementById('equipe');if(!sec)return;
  const box=sec.querySelector('.obrix-equipe-controles');if(!box)return;
  let area=box.querySelector('.obrix-equipe-secundario');
  if(!area){area=document.createElement('div');area.className='obrix-equipe-secundario';box.appendChild(area)}
  if(!box.querySelector('.obrix-atualizar-equipe')){
    const b=document.createElement('button');
    b.className='obrix-cmd obrix-atualizar-equipe';b.type='button';b.textContent='↻ Atualizar';
    b.addEventListener('click',async()=>{b.disabled=true;try{await window.OBRIX_EQUIPE?.refresh?.()}catch(e){console.warn('OBRIX equipe refresh',e)}finally{b.disabled=false}});
    area.appendChild(b);
  }
}
let timer=0;function schedule(){clearTimeout(timer);timer=setTimeout(ensure,0)}
function start(){
  ensure();
  if(document.body)new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  ['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','pageshow','focus','online','offline'].forEach(n=>window.addEventListener(n,schedule));
  document.addEventListener('click',()=>setTimeout(schedule,0),true);
  setInterval(ensure,700);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_EQUIPE_CONTROLES_GUARD={ensure};
})();