(function(){
  'use strict';
  const CONFIG_URL='https://gnvclctqnwxnjxydzhwc.supabase.co/functions/v1/obrix-public-config';
  let client=null;

  async function init(){
    if(client)return client;
    const r=await fetch(CONFIG_URL,{cache:'no-store'});
    const cfg=await r.json();
    if(!r.ok||!cfg.url||!cfg.publishableKey)throw new Error('Configuração OBRIX indisponível.');
    client=window.supabase.createClient(cfg.url,cfg.publishableKey,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
    return client;
  }

  async function currentUser(){
    const sb=await init();
    const {data,error}=await sb.auth.getUser();
    if(error||!data?.user)throw new Error('Sessão não encontrada. Entre novamente.');
    return data.user;
  }

  async function profile(){
    const sb=await init();
    const user=await currentUser();
    const {data,error}=await sb.from('perfis')
      .select('id,empresa_id,nome,email,papel')
      .eq('id',user.id)
      .maybeSingle();
    if(error)throw error;
    if(!data)throw new Error('Perfil OBRIX não encontrado.');
    return data;
  }

  async function readTable(table,orderColumn){
    const sb=await init();
    await currentUser();
    let q=sb.from(table).select('*');
    if(orderColumn)q=q.order(orderColumn,{ascending:false});
    const {data,error}=await q;
    if(error)throw error;
    return data||[];
  }

  async function healthcheck(){
    const p=await profile();
    const [obras,funcionarios,financeiro,assinaturas]=await Promise.all([
      readTable('obras','criado_em'),
      readTable('funcionarios','criado_em'),
      readTable('financeiro','data'),
      readTable('assinaturas','criado_em')
    ]);
    const assinatura=assinaturas.find(a=>a.empresa_id===p.empresa_id)||null;
    return {
      ok:true,
      perfil:{empresa_id:p.empresa_id,papel:p.papel},
      assinatura:assinatura?{plano:assinatura.plano,status:assinatura.status,trial_fim:assinatura.trial_fim,periodo_fim:assinatura.periodo_fim}:null,
      contagens:{obras:obras.length,funcionarios:funcionarios.length,financeiro:financeiro.length}
    };
  }

  window.OBRIX_BACKEND={init,currentUser,profile,readTable,healthcheck,get client(){return client}};
})();
