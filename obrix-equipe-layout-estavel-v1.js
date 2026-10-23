(()=>{'use strict';
if(window.__OBRIX_EQUIPE_LAYOUT_ESTAVEL_V3)return;window.__OBRIX_EQUIPE_LAYOUT_ESTAVEL_V3=true;
const css=document.createElement('style');css.id='obrixEquipeLayoutEstavelV3Css';css.textContent=`
#equipe .obrix-equipe-controles{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;margin-bottom:18px!important}
#equipe .obrix-equipe-botoes,#equipe .obrix-equipe-secundario{display:contents!important}
#equipe .obrix-equipe-controles [data-cmd="novo"]{order:1!important;grid-column:1!important}
#equipe .obrix-equipe-controles [data-cmd="lista"]{order:2!important;grid-column:2!important}
#equipe .obrix-equipe-controles .obrix-pagar-equipe-topo{order:3!important;grid-column:1!important;width:100%!important}
#equipe .obrix-equipe-controles .obrix-historico-pagamentos-topo{order:4!important;grid-column:2!important;width:100%!important}
#equipe .obrix-equipe-controles [data-cmd="toggle"]{order:5!important;grid-column:1!important}
#equipe .obrix-equipe-controles .obrix-filtro-equipe{order:6!important;grid-column:2!important;width:100%!important}
#equipe .obrix-equipe-controles [data-cmd="excluir"]{order:7!important;grid-column:1/-1!important;width:100%!important}
#equipe .obrix-atualizar-equipe{display:none!important}
#equipe [data-acao="faltas"],#equipe [data-acao="editar"]{display:none!important}
#equipe #listaEquipe .obrix-modelo-acoes{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:8px!important}
#equipe #listaEquipe .obrix-modelo-acoes [data-acao="diaria"]{order:1!important;grid-column:span 2!important}
#equipe #listaEquipe .obrix-modelo-acoes [data-acao="falta"]{order:2!important;grid-column:span 2!important}
#equipe #listaEquipe .obrix-modelo-acoes [data-acao="registros"]{order:3!important;grid-column:span 2!important}
#equipe #listaEquipe .obrix-modelo-acoes [data-obrix-card-extra="bonus"]{order:4!important;grid-column:span 3!important}
#equipe #listaEquipe .obrix-modelo-acoes [data-obrix-card-extra="vale"]{order:5!important;grid-column:span 3!important}
#equipe #listaEquipe .obrix-modelo-acoes [data-acao="diaria"],#equipe #listaEquipe .obrix-modelo-acoes [data-acao="falta"],#equipe #listaEquipe .obrix-modelo-acoes [data-acao="registros"],#equipe #listaEquipe .obrix-modelo-acoes .obrix-card-extra{min-width:0!important;width:100%!important;min-height:44px!important;border:1px solid #cbd5e1!important;border-radius:12px!important;background:#fff!important;color:#334155!important;font-size:12px!important;line-height:1.1!important;font-weight:900!important;padding:7px 4px!important;white-space:nowrap!important;word-break:normal!important;overflow-wrap:normal!important}
html[data-theme="dark"] #equipe #listaEquipe .obrix-modelo-acoes .obrix-card-extra,body.dark #equipe #listaEquipe .obrix-modelo-acoes .obrix-card-extra{background:#161d25!important;color:#eef2f7!important;border-color:#334155!important}
@media(max-width:390px){#equipe #listaEquipe .obrix-modelo-acoes [data-acao="diaria"],#equipe #listaEquipe .obrix-modelo-acoes [data-acao="falta"],#equipe #listaEquipe .obrix-modelo-acoes [data-acao="registros"]{font-size:11px!important;padding:7px 2px!important}}
`;document.head.appendChild(css);
function acaoExtra(id,tipo){window.equipeAcao?.(String(id),tipo)}
function decorarCard(card){
 const id=card?.dataset?.id,area=card?.querySelector?.('.obrix-modelo-acoes');if(!id||!area)return;
 area.querySelectorAll('[data-acao="faltas"],[data-acao="editar"]').forEach(b=>b.remove());
 let bonus=area.querySelector('[data-obrix-card-extra="bonus"]');if(!bonus){bonus=document.createElement('button');bonus.type='button';bonus.className='obrix-card-extra';bonus.dataset.obrixCardExtra='bonus';bonus.textContent='Bônus e Extras';area.appendChild(bonus)}
 let vale=area.querySelector('[data-obrix-card-extra="vale"]');if(!vale){vale=document.createElement('button');vale.type='button';vale.className='obrix-card-extra';vale.dataset.obrixCardExtra='vale';vale.textContent='Vale';area.appendChild(vale)}
 bonus.onclick=()=>acaoExtra(id,'bonus');vale.onclick=()=>acaoExtra(id,'vale');
}
function decorarCards(){document.querySelectorAll('#equipe #listaEquipe .obrix-modelo-card').forEach(decorarCard)}
function rotuloTopo(){const novo=document.querySelector('#equipe .obrix-equipe-controles [data-cmd="novo"]');if(novo)novo.textContent='＋ Novo Funcionário'}
function patchApi(){
 const api=window.OBRIX_EQUIPE_MODELO;if(!api||api.__obrixLayoutEstavelV3Patched)return;
 if(typeof api.render==='function'){const old=api.render;api.render=function(){const r=old.apply(this,arguments);setTimeout(decorarCards,0);return r}}
 if(typeof api.refresh==='function'){const old=api.refresh;api.refresh=async function(){const r=await old.apply(this,arguments);decorarCards();return r}}
 api.__obrixLayoutEstavelV3Patched=true;
}
function aplicar(){rotuloTopo();patchApi();decorarCards()}
document.addEventListener('change',e=>{if(e.target?.matches?.('#equipe .obrix-filtro-equipe'))setTimeout(decorarCards,0)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(aplicar,120),{once:true});else setTimeout(aplicar,120);
window.addEventListener('obrix:grupo-pronto',e=>{if(e.detail?.name==='equipe'){setTimeout(aplicar,60);setTimeout(aplicar,700)}});
window.addEventListener('obrix:modules-ready',()=>setTimeout(aplicar,250));
setTimeout(aplicar,900);setTimeout(aplicar,2200);
window.OBRIX_EQUIPE_LAYOUT_ESTAVEL_V1={apply:aplicar,cards:decorarCards};
})();