(()=>{'use strict';
if(window.__OBRIX_EQUIPE_LAYOUT_ESTAVEL_V1)return;window.__OBRIX_EQUIPE_LAYOUT_ESTAVEL_V1=true;
const css=document.createElement('style');css.id='obrixEquipeLayoutEstavelV1Css';css.textContent=`
#equipe .obrix-equipe-controles{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;margin-bottom:18px!important}
#equipe .obrix-equipe-botoes,#equipe .obrix-equipe-secundario{display:contents!important}
#equipe .obrix-equipe-controles [data-cmd="lista"]{order:1!important;grid-column:1!important}
#equipe .obrix-equipe-controles [data-cmd="toggle"]{order:2!important;grid-column:2!important}
#equipe .obrix-equipe-controles .obrix-historico-pagamentos-topo{order:3!important;grid-column:1!important}
#equipe .obrix-equipe-controles [data-cmd="novo"]{order:4!important;grid-column:2!important}
#equipe .obrix-equipe-controles .obrix-filtro-equipe{order:5!important;grid-column:1!important;width:100%!important}
#equipe .obrix-equipe-controles .obrix-pagar-equipe-topo{order:6!important;grid-column:2!important;width:100%!important}
#equipe .obrix-equipe-controles [data-cmd="excluir"]{order:7!important;grid-column:1/-1!important;width:100%!important}
#equipe .obrix-atualizar-equipe{display:none!important}
#equipe [data-acao="faltas"],#equipe [data-acao="editar"]{display:none!important}
#equipe #listaEquipe .obrix-modelo-acoes{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}
#equipe #listaEquipe .obrix-modelo-acoes [data-acao="diaria"],#equipe #listaEquipe .obrix-modelo-acoes [data-acao="falta"],#equipe #listaEquipe .obrix-modelo-acoes [data-acao="registros"]{grid-column:auto!important;min-width:0!important;width:100%!important}
@media(max-width:390px){#equipe #listaEquipe .obrix-modelo-acoes{grid-template-columns:repeat(3,minmax(0,1fr))!important}#equipe #listaEquipe .obrix-modelo-acoes button{font-size:11px!important;padding:8px 4px!important}}
`;document.head.appendChild(css);
function rotulo(){const b=document.querySelector('#equipe .obrix-equipe-controles [data-cmd="novo"]');if(b)b.textContent='＋ Novo Funcionário'}
function aplicar(){rotulo()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(aplicar,120),{once:true});else setTimeout(aplicar,120);
window.addEventListener('obrix:grupo-pronto',e=>{if(e.detail?.name==='equipe'){setTimeout(aplicar,60);setTimeout(aplicar,700)}});
window.addEventListener('obrix:modules-ready',()=>setTimeout(aplicar,250));
setTimeout(aplicar,900);setTimeout(aplicar,2200);
window.OBRIX_EQUIPE_LAYOUT_ESTAVEL_V1={apply:aplicar};
})();