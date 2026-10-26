(()=>{'use strict';
if(window.__OBRIX_MOBILE_CLEAN)return;window.__OBRIX_MOBILE_CLEAN=true;
const style=document.createElement('style');style.id='obrix-mobile-clean';style.textContent=`
/* OBRIX faxina visual: camada responsiva central, sem regras de negocio */
#app #inicio{min-width:0;overflow-x:hidden}
#app #inicio .obxSearch{box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:0 14px!important;min-height:54px!important;overflow:hidden}
#app #inicio .obxSearch>span{flex:0 0 auto;color:var(--ob-muted)!important;font-size:20px}
#app #inicio .obxSearch input{flex:1 1 auto;min-width:0;width:100%;height:50px!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}
#app #inicio .obxKpis{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;width:100%;min-width:0}
#app #inicio .obxKpis .kpi{box-sizing:border-box;min-width:0!important;width:auto!important;overflow:hidden;padding:16px!important}
#app #inicio .obxKpis .kpi strong{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:clamp(22px,6.4vw,34px)!important;line-height:1.12}
#app #inicio .obxKpis .kpi small{display:block;white-space:normal;line-height:1.25;margin-bottom:8px}
#app #inicio .obxFilters{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;width:100%;min-width:0}
#app #inicio .obxFilters select{box-sizing:border-box;width:100%!important;min-width:0!important;max-width:100%!important;height:44px!important;padding:0 34px 0 12px!important;border:1px solid var(--ob-border)!important;border-radius:12px!important;background:var(--ob-surface)!important;color:var(--ob-text)!important;font-size:15px!important;text-overflow:ellipsis}
#app #inicio .obxNova{min-height:44px!important;padding:10px 16px!important;border-radius:12px!important}
#app #inicio .obxObra{box-sizing:border-box;min-width:0;overflow:hidden}
#app #inicio .obxObraTop>div{min-width:0;flex:1 1 auto}
#app #inicio .obxObraTop h3,#app #inicio .obxObraTop p{overflow-wrap:anywhere}
#app #inicio .obxMeta{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;min-width:0}
#app #inicio .obxMeta .mini{min-width:0!important;overflow:hidden}
#app #inicio .obxMeta b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#app .bottom{box-sizing:border-box!important}
#app .bottom button{min-width:0!important;min-height:48px!important;padding:6px 4px!important;border-radius:14px!important;font-size:13px!important;white-space:nowrap!important;overflow:hidden!important}
#app .bottom button span{margin-right:2px!important}
/* O banner de instalacao nao pode cobrir cards ou navegacao. */
#app [class*="install"]:not(button):not(.btn),#app [id*="install"]:not(button):not(input){max-width:calc(100vw - 24px);box-sizing:border-box}
@media(max-width:520px){
 #app #inicio .obxKpis{grid-template-columns:1fr!important}
 #app #inicio .obxKpis .kpi strong{font-size:30px!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;overflow-wrap:anywhere}
 #app #inicio .obxFilters{grid-template-columns:1fr!important}
 #app #inicio .obxMeta{grid-template-columns:repeat(2,minmax(0,1fr))!important}
 #app .bottom{gap:5px!important;padding-left:8px!important;padding-right:8px!important}
 #app .bottom button{font-size:12px!important;padding:6px 2px!important}
}
@media(max-width:390px){#app #inicio .obxKpis .kpi strong{font-size:27px!important}#app .bottom button{font-size:11px!important}}
`;document.head.appendChild(style);
})();