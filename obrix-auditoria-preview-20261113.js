(()=>{
 'use strict';
 // Auditoria somente em preview e explicitamente solicitada por ?obrix_auditoria=1.
 // Nenhum dado da conta, obras, equipe ou financeiro é recolhido/transmitido.
 if(new URLSearchParams(location.search).get('obrix_auditoria')!=='1')return;
 if(window.__OBRIX_AUDITORIA_BUILD)return;
 const build='auditoria-20261113-inicializacao-unica-1';
 window.__OBRIX_AUDITORIA_BUILD=build;
 const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
 function status(){
   const theme=document.documentElement.dataset.theme||'não informado';
   const files=[...document.scripts].filter(x=>/obrix-pos-login-loader\.js/.test(x.src||''));
   const loader=files.map(x=>{
     try{const u=new URL(x.src);return u.pathname.split('/').pop()+'?v='+(u.searchParams.get('v')||'sem versão')}
     catch{return 'inválido'}
   });
   const config=document.getElementById('configMain');
   const deleteButtons=[...(config?.querySelectorAll('.cfgDeleteGrid button[data-del]')||[])];
   const neutral=deleteButtons.map(b=>{
     const cs=getComputedStyle(b);
     const col=cs.color,fill=cs.webkitTextFillColor;
     return {border:cs.borderTopWidth,color:col,fill,
       red:/rgba?\(\s*(?:1[7-9]\d|2\d\d)\s*,\s*(?:[0-9]|[1-6]\d)\s*,\s*(?:[0-9]|[1-6]\d)\b/.test(col)};
   });
   const account=document.getElementById('cfgExcluirConta'),ac=account?getComputedStyle(account):null;
   const bottom=document.querySelector('#app>.bottom');
   const sw=navigator.serviceWorker?.controller?.scriptURL||'sem controlador';
   const navigation=performance.getEntriesByType('navigation')[0];
   const asMs=v=>Number.isFinite(v)?Math.round(v)+' ms':'n/d';
   return {
     host:location.host,build,theme,
     carregadorPrincipal:window.__OBRIX_POS_LOGIN_LOADER?'ativo':'ainda não ativo',
     scriptPrincipal:loader.join(' | ')||'ausente',
     cachePWA:sw.split('/').slice(-1)[0],
     config:{montada:!!config,aberta:!!config&&!config.classList.contains('hidden'),
       apagarDetectados:neutral.length,aparencia:neutral.length?neutral.every(x=>x.border==='0px'&&!x.red)?'neutra':'vermelho/borda detectado':'pendente',
       excluirConta:ac?{background:ac.backgroundColor,borda:ac.borderTopWidth,texto:ac.color}:'pendente'},
     obras:{cartoes:document.querySelectorAll('#listaObras .obxObraCard').length},
     navegacao:asMs(navigation?.domContentLoadedEventEnd)
   };
 }
 function add(){
   if(document.getElementById('obrixAuditoriaPreview'))return;
   const node=document.createElement('aside');
   node.id='obrixAuditoriaPreview';
   node.setAttribute('aria-label','Diagnóstico de prévia OBRIX');
   node.style.cssText='position:fixed;top:max(12px,env(safe-area-inset-top));right:8px;z-index:2147483500;max-width:min(370px,calc(100vw - 16px));font:12px/1.4 system-ui,-apple-system,sans-serif;color:#fff;background:#182637;border:1px solid #8ea2b7;border-radius:10px;box-shadow:0 8px 28px #0005;padding:8px;';
   const details=document.createElement('details');
   const summary=document.createElement('summary');
   summary.textContent='TESTE • Diagnóstico de versão (toque para abrir)';
   summary.style.cssText='font-weight:800;cursor:pointer';
   const pre=document.createElement('pre');
   pre.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:11px/1.4 monospace;margin:8px 0 0;max-height:48vh;overflow-y:auto;color:#fff';
   details.append(summary,pre);
   node.appendChild(details);
   document.body.appendChild(node);
   let count=0;
   function paint(){
     if(!node.isConnected)return;
     const data=status();
     pre.textContent=JSON.stringify(data,null,2);
     count++;
   }
   paint();
   setInterval(()=>{if(details.open)paint()},1400);
   window.OBRIX_AUDITORIA_PREVIEW={status,build,refresh:paint};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add,{once:true});
 else add();
})();
