(function(){
  'use strict';
  const CONFIG_URL='https://gnvclctqnwxnjxydzhwc.supabase.co/functions/v1/obrix-public-config';
  let client=null;
  async function init(){
    if(client)return client;
    const r=await fetch(CONFIG_URL,{cache:'no-store'});
    const cfg=await r.json();
    if(!r.ok||!cfg.url||!cfg.publishableKey)throw new Error('Configuração OBRIX indisponível.');
    client=window.supabase.createClient(cfg.url,cfg.publishableKey);
    return client;
  }
  window.OBRIX_BACKEND={init,get client(){return client}};
})();
