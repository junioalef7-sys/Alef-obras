(()=>{
'use strict';
if(window.__OBRIX_EQUIPE_ORGANIZACAO_V4)return;window.__OBRIX_EQUIPE_ORGANIZACAO_V4=true;

function acaoExtra(id,tipo){window.equipeAcao?.(String(id),tipo)}
function novoBotao(id,tipo,texto){
 const b=document.createElement('button');b.type='button';b.className='obrix-equipe-extra-card';b.dataset.equipeExtraCard=tipo;b.dataset.id=String(id);b.textContent=texto;return b;
}
function arrumarCard(card){
 const id=card?.dataset?.id;if(!id)return;
 const area=card.querySelector('.obrix-modelo-acoes');if(!area)return;
 area.querySelectorAll('[data-acao="faltas"],[data-acao="editar"]').forEach(b=>b.remove());
 const diaria=area.querySelector('[data-acao="diaria"]'),falta=area.querySelector('[data-acao="falta"]'),reg=area.querySelector('[data-acao="registros"]');
 if(!diaria||!falta||!reg)return;
 let bonus=area.querySelector('[data-equipe-extra-card="bonus"]');if(!bonus)bonus=novoBotao(id,'bonus','Bônus e Extras');
 let vale=area.querySelector('[data-equipe-extra-card="vale"]');if(!vale)vale=novoBotao(id,'vale','Vale');
 bonus.dataset.id=String(id);vale.dataset.id=String(id);bonus.onclick=()=>acaoExtra(id,'bonus');vale.onclick=()=>acaoExtra(id,'vale');
 diaria.classList.add('obrix-card-top3');falta.classList.add('obrix-card-top3');reg.classList.add('obrix-card-top3');bonus.classList.add('obrix-card-bottom2');vale.classList.add('obrix-card-bottom2');
 const ordem=[diaria,falta,reg,bonus,vale],atual=[...area.children];
 if(atual.length!==ordem.length||ordem.some((n,i)=>atual[i]!==n))area.replaceChildren(...ordem);
}
function arrumarCards(){document.querySelectorAll('#listaEquipe .obrix-modelo-card').forEach(arrumarCard)}

function arrumarTopo(){
 const box=document.querySelector('#equipe .obrix-equipe-controles');if(!box)return false;
 const pri=box.querySelector('.obrix-equipe-botoes'),sec=box.querySelector('.obrix-equipe-secundario');if(!pri||!sec)return false;
 const funcionarios=box.querySelector('[data-cmd="lista"]'),toggle=box.querySelector('[data-cmd="toggle"]'),excluir=box.querySelector('[data-cmd="excluir"]'),novo=box.querySelector('[data-cmd="novo"]');
 if(novo)novo.textContent='＋ Novo Funcionário';
 const ordemPri=[funcionarios,toggle,excluir,novo].filter(Boolean),atualPri=[...pri.children].filter(n=>ordemPri.includes(n));
 if(ordemPri.length===4&&(atualPri.length!==4||ordemPri.some((n,i)=>atualPri[i]!==n)))ordemPri.forEach(n=>pri.appendChild(n));
 const pagar=box.querySelector('.obrix-pagar-equipe-topo'),pagamentos=box.querySelector('.obrix-historico-pagamentos-topo'),filtro=box.querySelector('.obrix-filtro-equipe'),atualizar=box.querySelector('.obrix-atualizar-equipe');
 [pagar,pagamentos,filtro,atualizar].filter(Boolean).forEach(n=>sec.appendChild(n));
 if(filtro){filtro.setAttribute('aria-label','Filtrar funcionários');const opt=filtro.querySelector('option[value="todos"]');if(opt)opt.textContent='Todos'}
 return true;
}
function aplicar(){arrumarTopo();arrumarCards();window.OBRIX_FUNCIONARIOS_PESSOAL?.bind?.()}
function observar(){
 const lista=document.getElementById('listaEquipe');if(lista&&!lista.__obrixOrgV4){lista.__obrixOrgV4=true;new MutationObserver(()=>queueMicrotask(arrumarCards)).observe(lista,{childList:true,subtree:true})}
 const box=document.querySelector('#equipe .obrix-equipe-controles');if(box&&!box.__obrixOrgV4){box.__obrixOrgV4=true;new MutationObserver(()=>queueMicrotask(arrumarTopo)).observe(box,{childList:true,subtree:true})}
}
const css=document.createElement('style');css.id='obrixEquipeOrganizacaoV4Css';css.textContent=`
#equipe .obrix-atualizar-equipe{display:none!important}
#equipe .obrix-equipe-botoes{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
#equipe .obrix-equipe-secundario{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;margin-top:10px!important}
#equipe .obrix-equipe-secundario .obrix-filtro-equipe{grid-column:1/-1!important;width:100%!important;min-height:58px!important}
#listaEquipe .obrix-modelo-acoes{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:8px!important}
#listaEquipe .obrix-modelo-acoes .obrix-card-top3{grid-column:span 2!important}
#listaEquipe .obrix-modelo-acoes .obrix-card-bottom2{grid-column:span 3!important}
#listaEquipe .obrix-modelo-acoes .obrix-equipe-extra-card{min-height:50px!important;border:1px solid #cbd5e1!important;border-radius:14px!important;background:#fff!important;color:#334155!important;font:inherit!important;font-weight:900!important;padding:9px!important}
html[data-theme="dark"] #listaEquipe .obrix-modelo-acoes .obrix-equipe-extra-card,body.dark #listaEquipe .obrix-modelo-acoes .obrix-equipe-extra-card{background:#161d25!important;color:#eef2f7!important;border-color:#334155!important}
@media(max-width:700px){#equipe .obrix-equipe-secundario .obrix-filtro-equipe{min-height:54px!important}#listaEquipe .obrix-modelo-acoes .obrix-equipe-extra-card{min-height:47px!important;font-size:12px!important;padding:8px 5px!important}#listaEquipe .obrix-modelo-acoes .obrix-card-top3{font-size:12px!important;padding:8px 5px!important}}
`;
document.head.appendChild(css);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{aplicar();observar()},250)},{once:true});else setTimeout(()=>{aplicar();observar()},250);
window.addEventListener('obrix:grupo-pronto',e=>{if(e.detail?.name==='equipe'){setTimeout(()=>{aplicar();observar()},40);setTimeout(aplicar,500)}});
window.addEventListener('obrix:modules-ready',()=>setTimeout(()=>{aplicar();observar()},300));
setTimeout(()=>{aplicar();observar()},1000);setTimeout(aplicar,2500);
window.OBRIX_EQUIPE_ORGANIZACAO_V4={apply:aplicar,cards:arrumarCards,top:arrumarTopo};
})();