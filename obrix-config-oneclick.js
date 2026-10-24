(()=>{'use strict';
if(window.__OBRIX_CONFIG_ONECLICK)return;window.__OBRIX_CONFIG_ONECLICK=true;
document.addEventListener('click',async e=>{
  const b=e.target.closest?.('#menuMain [data-go="config"]');
  if(!b||window.OBRIX_CONFIG?.open)return;
  e.preventDefault();e.stopImmediatePropagation();
  const old=b.innerHTML;b.disabled=true;
  try{
    const label=b.querySelector('b')||b.querySelector('span');if(label)label.textContent='Abrindo...';
    const loader=window.OBRIX_POS_LOGIN_LOADER;
    if(!loader?.loadFeature)throw new Error('Carregador de Configurações indisponível.');
    const ok=await loader.loadFeature('config');
    if(!ok||!window.OBRIX_CONFIG?.open)throw new Error('Não foi possível carregar Configurações.');
    await Promise.resolve(window.OBRIX_CONFIG.open());
  }catch(err){console.error('OBRIX Configurações:',err);alert(err?.message||'Não foi possível abrir Configurações.');}
  finally{b.disabled=false;b.innerHTML=old}
},true);
})();
