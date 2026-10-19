(function(){
  'use strict';
  const CONFIG_URL='https://gnvclctqnwxnjxydzhwc.supabase.co/functions/v1/obrix-public-config';
  const CONFIG_CACHE='obrix_public_config_v2';
  const CONFIG_TTL=6*60*60*1000;
  let client=null,userCache=null,userPromise=null,profileCache=null,profilePromise=null;

  function lerConfigCache(){
    try{
      const raw=localStorage.getItem(CONFIG_CACHE);if(!raw)return null;
      const item=JSON.parse(raw);if(!item?.cfg?.url||!item?.cfg?.publishableKey)return null;
      return item;
    }catch(_){return null}
  }
  function salvarConfigCache(cfg){try{localStorage.setItem(CONFIG_CACHE,JSON.stringify({at:Date.now(),cfg}))}catch(_){}}
  async function carregarConfig(){
    const cache=lerConfigCache();
    if(cache&&Date.now()-Number(cache.at||0)<CONFIG_TTL)return cache.cfg;
    try{
      const r=await fetch(CONFIG_URL,{cache:'no-store'}),cfg=await r.json();
      if(!r.ok||!cfg.url||!cfg.publishableKey)throw new Error('Configuração OBRIX indisponível.');
      salvarConfigCache(cfg);return cfg;
    }catch(e){
      if(cache?.cfg?.url&&cache?.cfg?.publishableKey)return cache.cfg;
      throw e;
    }
  }

  async function init(){
    if(client)return client;
    const cfg=await carregarConfig();
    client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    client.auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_OUT'){userCache=null;profileCache=null;userPromise=null;profilePromise=null;return}
      if(session?.user){
        if(!userCache||userCache.id!==session.user.id)profileCache=null;
        userCache=session.user;
      }
    });
    return client;
  }

  async function currentUser(force=false){
    if(userCache&&!force)return userCache;
    if(userPromise&&!force)return userPromise;
    userPromise=(async()=>{
      const sb=await init(),{data,error}=await sb.auth.getUser();
      if(error||!data?.user)throw new Error('Sessão não encontrada. Entre novamente.');
      userCache=data.user;return userCache;
    })();
    try{return await userPromise}finally{userPromise=null}
  }

  async function profile(force=false){
    if(profileCache&&!force)return profileCache;
    if(profilePromise&&!force)return profilePromise;
    profilePromise=(async()=>{
      const sb=await init(),user=await currentUser(force);
      const {data,error}=await sb.from('perfis').select('id,empresa_id,nome,email,papel').eq('id',user.id).maybeSingle();
      if(error)throw error;
      if(!data)throw new Error('Perfil OBRIX não encontrado.');
      profileCache=data;return profileCache;
    })();
    try{return await profilePromise}finally{profilePromise=null}
  }

  async function readTable(table,orderColumn){
    const sb=await init();
    let q=sb.from(table).select('*');
    if(orderColumn)q=q.order(orderColumn,{ascending:false});
    const {data,error}=await q;
    if(error)throw error;
    return data||[];
  }

  async function healthcheck(){
    const p=await profile();
    const [obras,funcionarios,financeiro,assinaturas]=await Promise.all([
      readTable('obras','criado_em'),readTable('funcionarios','criado_em'),readTable('financeiro','data'),readTable('assinaturas','criado_em')
    ]);
    const assinatura=assinaturas.find(a=>a.empresa_id===p.empresa_id)||null;
    return {ok:true,perfil:{empresa_id:p.empresa_id,papel:p.papel},assinatura:assinatura?{plano:assinatura.plano,status:assinatura.status,trial_fim:assinatura.trial_fim,periodo_fim:assinatura.periodo_fim}:null,contagens:{obras:obras.length,funcionarios:funcionarios.length,financeiro:financeiro.length}};
  }

  window.OBRIX_BACKEND={init,currentUser,profile,readTable,healthcheck,clearCache(){userCache=null;profileCache=null},get client(){return client}};
})();
