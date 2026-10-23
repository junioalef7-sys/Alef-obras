(()=>{'use strict';
if(window.__OBRIX_EQUIPE_LAYOUT_ESTAVEL_V2)return;window.__OBRIX_EQUIPE_LAYOUT_ESTAVEL_V2=true;
const css=document.createElement('style');css.id='obrixEquipeLayoutEstavelV2Css';css.textContent=`
#equipe .obrix-equipe-controles{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;margin-bottom:18px!important}
#equipe .obrix-equipe-botoes,#equipe .obrix-equipe-secundario{display:contents!important}
#equipe .obrix-atualizar-equipe{display:none!important}
#equipe [data-acao="faltas"],#equipe [data-acao="editar"]{display:none!important}
#equipe .obrix-slot-vazio{visibility:hidden!important;pointer-events:none!important;min-height:54px!important}
#equipe #listaEquipe .obrix-modelo-acoes{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}
#equipe #listaEquipe .obrix-modelo-acoes [data-acao="diaria"]{order:1!important;grid-column:1!important}
#equipe #listaEquipe .obrix-modelo-acoes [data-acao="falta"]{order:2!important;grid-column:2!important}
#equipe #listaEquipe .obrix-modelo-acoes [data-acao="registros"]{order:3!important;grid-column:3!important}
#equipe #listaEquipe .obrix-modelo-acoes [data-obrix-card-extra="vale"]{order:4!important;grid-column:1!important}
#equipe #listaEquipe .obrix-modelo-acoes [data-obrix-card-extra="bonus"]{order:5!important;grid-column:2!important}
#equipe #listaEquipe .obrix-modelo-acoes [data-acao="diaria"],#equipe #listaEquipe .obrix-modelo-acoes [data-acao="falta"],#equipe #listaEquipe .obrix-modelo-acoes [data-acao="registros"],#equipe #listaEquipe .obrix-modelo-acoes .obrix-card-extra{min-width:0!important;width:100%!important;min-height:50px!important;border:1px solid #cbd5e1!important;border-radius:14px!important;background:#fff!important;color:#334155!important;font:inherit!important;font-weight:900!important;padding:9px!important}
html[data-theme="dark"] #equipe #listaEquipe .obrix-modelo-acoes .obrix-card-extra,body.dark #equipe #listaEquipe .obrix-modelo-acoes .obrix-card-extra{background:#161d25!important;color:#eef2f7!important;border-color:#334155!important}
@media(max-width:390px){#equipe #listaEquipe .obrix-modelo-acoes{grid-template-columns:repeat(3,minmax(0,1fr))!important}#equipe #listaEquipe .obrix-modelo-acoes button{font-size:11px!important;padding:8px 4px!important}}
`;document.head.appendChild(css);
function acaoExtra(id,tipo){window.equipeAcao?.(String(id),tipo)}
function decorarCard(card){
 const id=card?.dataset?.id,area=card?.querySelector?.('.obrix-modelo-acoes');if(!id||!area)return;
 area.querySelectorAll('[data-acao="faltas"],[data-acao="editar"]').forEach(b=>b.remove());
 let vale=area.querySelector('[data-obrix-card-extra="vale"]');if(!vale){vale=document.createElement('button');vale.type='button';vale.className='obrix-card-extra';vale.dataset.obrixCardExtra='vale';vale.textContent='Vale';area.appendChild(vale)}
 let bonus=area.querySelector('[data-obrix-card-extra="bonus"]');if(!bonus){bonus=document.createElement('button');bonus.type='button';bonus.className='obrix-card-extra';bonus.dataset.obrixCardExtra='bonus';bonus.textContent='Bônus e Extras';area.appendChild(bonus)}
 vale.onclick=()=>acaoExtra(id,'vale');bonus.onclick=()=>acaoExtra(id,'bonus');
}
function decorarCards(){document.querySelectorAll('#equipe #listaEquipe .obrix-modelo-card').forEach(decorarCard)}
function ehVale(b){const t=(b?.textContent||'').trim().toLowerCase();return t==='vale'||t==='💵 vale'||t==='💰 vale'}
function ehBonus(b){const t=(b?.textContent||'').trim().toLowerCase();return t.includes('bônus')&&t.includes('extra')}
function trocarTopo(){
 const box=document.querySelector('#equipe .obrix-equipe-controles');if(!box)return;
 const novo=box.querySelector('[data-cmd="novo"]'),lista=box.querySelector('[data-cmd="lista"]');if(novo)novo.textContent='＋ Novo Funcionário';
 if(box.dataset.obrixTrocaValeBonus==='1')return;
 const botoes=[...box.querySelectorAll('button')].filter(b=>!b.classList.contains('obrix-atualizar-equipe'));
 const vale=botoes.find(b=>b!==novo&&b!==lista&&ehVale(b));
 const bonus=botoes.find(b=>b!==novo&&b!==lista&&ehBonus(b));
 if(!novo||!lista||!vale||!bonus)return;
 const paiNovo=novo.parentElement,paiLista=lista.parentElement;
 const slotNovo=document.createElement('span'),slotLista=document.createElement('span');slotNovo.className='obrix-slot-vazio';slotLista.className='obrix-slot-vazio';
 paiNovo?.insertBefore(slotNovo,novo);paiLista?.insertBefore(slotLista,lista);
 vale.replaceWith(novo);bonus.replaceWith(lista);
 box.dataset.obrixTrocaValeBonus='1';
}
function patchApi(){
 const api=window.OBRIX_EQUIPE_MODELO;if(!api||api.__obrixLayoutEstavelV2Patched)return;
 if(typeof api.render==='function'){const old=api.render;api.render=function(){const r=old.apply(this,arguments);setTimeout(()=>{decorarCards();trocarTopo()},0);return r}}
 if(typeof api.refresh==='function'){const old=api.refresh;api.refresh=async function(){const r=await old.apply(this,arguments);decorarCards();trocarTopo();return r}}
 api.__obrixLayoutEstavelV2Patched=true;
}
function aplicar(){trocarTopo();patchApi();decorarCards()}
document.addEventListener('change',e=>{if(e.target?.matches?.('#equipe .obrix-filtro-equipe'))setTimeout(decorarCards,0)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(aplicar,120),{once:true});else setTimeout(aplicar,120);
window.addEventListener('obrix:grupo-pronto',e=>{if(e.detail?.name==='equipe'){setTimeout(aplicar,60);setTimeout(aplicar,700)}});
window.addEventListener('obrix:modules-ready',()=>setTimeout(aplicar,250));
setTimeout(aplicar,900);setTimeout(aplicar,2200);
window.OBRIX_EQUIPE_LAYOUT_ESTAVEL_V1={apply:aplicar,cards:decorarCards};
})();