(()=>{'use strict';
if(window.__OBRIX_EQUIPE_CONTROLES_GUARD)return;window.__OBRIX_EQUIPE_CONTROLES_GUARD=true;
const VISUAL=`
/* OBRIX — blindagem visual da Equipe: sem fundo dourado + visual compacto */
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
  padding:22px!important;
}
html body #equipe #listaEquipe .obrix-modelo-cabecalho h3{font-size:22px!important;line-height:1.16!important;margin-bottom:5px!important}
html body #equipe #listaEquipe .obrix-modelo-subnome{font-size:14px!important;line-height:1.25!important;margin-bottom:14px!important;color:#64748b!important}
html body #equipe #listaEquipe .obrix-modelo-status{padding:6px 11px!important;margin-bottom:18px!important}
html body #equipe #listaEquipe .obrix-modelo-pagamento{
  background:#f8fafc!important;
  background-image:none!important;
  padding:17px 18px!important;
  margin-bottom:14px!important;
}
html body #equipe #listaEquipe .obrix-modelo-pagamento small{font-size:13px!important}
html body #equipe #listaEquipe .obrix-modelo-pagamento strong{font-size:17px!important}
html body #equipe #listaEquipe .obrix-modelo-pagamento span{font-size:13px!important}
html body #equipe #listaEquipe .obrix-modelo-pagamento>b{font-size:25px!important;margin-top:17px!important}
html body #equipe #listaEquipe .obrix-modelo-pilulas{gap:8px!important;margin-bottom:14px!important}
html body #equipe #listaEquipe .obrix-modelo-pilulas span{
  background:#f8fafc!important;
  background-image:none!important;
  padding:8px 12px!important;
  font-size:13px!important;
}
html body #equipe #listaEquipe .obrix-modelo-metricas{gap:10px!important}
html body #equipe #listaEquipe .obrix-modelo-metrica{
  min-height:100px!important;
  padding:13px!important;
  background:#f8fafc!important;
  background-image:none!important;
  border-color:#e2e8f0!important;
}
html body #equipe #listaEquipe .obrix-modelo-metrica small{font-size:13px!important;margin-bottom:6px!important}
html body #equipe #listaEquipe .obrix-modelo-metrica b{font-size:22px!important}
html body #equipe #listaEquipe .obrix-modelo-metrica span{font-size:12px!important}
html body #equipe #listaEquipe .obrix-modelo-metrica.liquido{background:#fff1f2!important;border-color:#fecdd3!important}
html body #equipe #listaEquipe .obrix-modelo-acoes{gap:8px!important;margin-top:14px!important}
html body #equipe #listaEquipe .obrix-modelo-acoes button{
  min-height:50px!important;
  padding:9px!important;
  font-size:13px!important;
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
html[data-theme="dark"] body #equipe #listaEquipe .obrix-modelo-subnome,
body.dark #equipe #listaEquipe .obrix-modelo-subnome{color:#94a3b8!important}
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
  html body #equipe #listaEquipe .obrix-modelo-card{padding:17px 15px!important}
  html body #equipe #listaEquipe .obrix-modelo-cabecalho h3{font-size:20px!important}
  html body #equipe #listaEquipe .obrix-modelo-subnome{font-size:13px!important;margin-bottom:12px!important}
  html body #equipe #listaEquipe .obrix-modelo-pagamento{padding:14px!important}
  html body #equipe #listaEquipe .obrix-modelo-pagamento>b{font-size:23px!important;margin-top:15px!important}
  html body #equipe #listaEquipe .obrix-modelo-metrica{min-height:94px!important;padding:11px!important}
  html body #equipe #listaEquipe .obrix-modelo-metrica b{font-size:19px!important}
  html body #equipe #listaEquipe .obrix-modelo-acoes button{min-height:47px!important;font-size:13px!important;padding:8px 6px!important}
}
`;
function visual(){
  let s=document.getElementById('obrixEquipeVisualDiscretoFinal');
  if(!s){s=document.createElement('style');s.id='obrixEquipeVisualDiscretoFinal';document.head.appendChild(s)}
  if(s.textContent!==VISUAL)s.textContent=VISUAL;
  if(s!==document.head.lastElementChild)document.head.appendChild(s);
}
function listaFuncionarios(){try{return typeof funcionarios!=='undefined'&&Array.isArray(funcionarios)?funcionarios:[]}catch(_){return[]}}
function sincronizarFuncao(){
  const fs=listaFuncionarios();
  document.querySelectorAll('#equipe #listaEquipe .obrix-modelo-card[data-id]').forEach(card=>{
    const f=fs.find(x=>String(x.id)===String(card.dataset.id));
    const sub=card.querySelector('.obrix-modelo-subnome');
    if(!sub)return;
    const cargo=String(f?.cargo||f?.funcao||'').trim();
    const label=cargo||'Função não informada';
    if(sub.textContent!==label)sub.textContent=label;
    if(sub.getAttribute('data-obrix-funcao')!=='1')sub.setAttribute('data-obrix-funcao','1');
  });
}
function ensure(){
  visual();
  sincronizarFuncao();
  const sec=document.getElementById('equipe');if(!sec)return;
  const box=sec.querySelector('.obrix-equipe-controles');if(!box)return;
  let area=box.querySelector('.obrix-equipe-secundario');
  if(!area){area=document.createElement('div');area.className='obrix-equipe-secundario';box.appendChild(area)}
  if(!box.querySelector('.obrix-atualizar-equipe')){
    const b=document.createElement('button');
    b.className='obrix-cmd obrix-atualizar-equipe';b.type='button';b.textContent='↻ Atualizar';
    b.addEventListener('click',async()=>{b.disabled=true;try{await window.OBRIX_EQUIPE?.refresh?.()}catch(e){console.warn('OBRIX equipe refresh',e)}finally{b.disabled=false;setTimeout(sincronizarFuncao,0)}});
    area.appendChild(b);
  }
}
let timer=0;function schedule(){clearTimeout(timer);timer=setTimeout(ensure,0)}
function start(){
  ensure();
  const sec=document.getElementById('equipe');
  if(sec)new MutationObserver(schedule).observe(sec,{childList:true,subtree:true});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  if(document.head)new MutationObserver(ms=>{if(ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&n.id!=='obrixEquipeVisualDiscretoFinal'&&(n.tagName==='STYLE'||n.tagName==='LINK'))))schedule()}).observe(document.head,{childList:true});
  ['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','pageshow','focus','online','offline'].forEach(n=>window.addEventListener(n,schedule));
  document.addEventListener('click',e=>{if(e.target.closest?.('#equipe'))setTimeout(schedule,0)},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_EQUIPE_CONTROLES_GUARD={ensure,sincronizarFuncao};
})();