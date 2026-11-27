(function(){
  'use strict';
  const CONFIG_URL='https://gnvclctqnwxnjxydzhwc.supabase.co/functions/v1/obrix-public-config';
  const OFFICIAL_REF='gnvclctqnwxnjxydzhwc';
  const OFFICIAL_HOSTS=new Set([
    'alef-obras-obrix3.vercel.app','alef-obras.vercel.app',
    'obrix.junioalef7.workers.dev','junioalef7-sys.github.io'
  ]);
  function ehAmbienteNaoOficial(){
    const host=String(window.location?.hostname||'').toLowerCase();
    return !OFFICIAL_HOSTS.has(host);
  }
  function urlConfigSegura(){
    if(!ehAmbienteNaoOficial())return {url:CONFIG_URL,ref:OFFICIAL_REF};
    const ref=String(window.__OBRIX_HML_PROJECT_REF||'').trim().toLowerCase();
    if(!/^[a-z]{20}$/.test(ref)||ref===OFFICIAL_REF){
      throw new Error('Prévia de testes bloqueada: configure um Supabase de homologação isolado.');
    }
    return {url:'https://'+ref+'.supabase.co/functions/v1/obrix-public-config',ref};
  }
  function validarConfigAmbiente(cfg,ref){
    if(!cfg?.url||!cfg?.publishableKey)throw new Error('Configuração OBRIX indisponível.');
    let hostname;
    try{hostname=new URL(cfg.url).hostname}catch(_){throw new Error('URL do Supabase inválida.')}
    if(ehAmbienteNaoOficial()&&hostname!==ref+'.supabase.co'){
      throw new Error('Prévia bloqueada: configuração aponta para outro banco de dados.');
    }
    return cfg;
  }
  const CONFIG_CACHE='obrix_public_config_v2';
  const CONFIG_TTL=6*60*60*1000;
  const OFFLINE_BASE='obrix_offline_base_v3',OFFLINE_BASE_OLD='obrix_offline_base_v2';
  let client=null,userCache=null,userPromise=null,profileCache=null,profilePromise=null;

  function lerJson(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null}catch(_){return null}}
  function baseOffline(){const b=lerJson(OFFLINE_BASE)||lerJson(OFFLINE_BASE_OLD);return b?.profile?.empresa_id?b:null}
  function restaurarShellOffline(reason='offline'){
    if(navigator.onLine)return false;
    const b=baseOffline();if(!b)return false;
    const typed=(document.getElementById('email')?.value||'').trim().toLowerCase(),cached=String(b.profile.email||'').trim().toLowerCase();
    if(typed&&cached&&typed!==cached)return false;
    window.__OBRIX_OFFLINE_BOOTSTRAP_BASE=b;window.obras=Array.isArray(b.obras)?b.obras:[];window.funcionarios=Array.isArray(b.funcionarios)?b.funcionarios:[];
    const login=document.getElementById('login'),app=document.getElementById('app'),usuario=document.getElementById('usuario');login?.classList.add('hidden');app?.classList.remove('hidden');if(usuario)usuario.textContent=b.profile.nome||b.profile.email||'';
    document.documentElement.dataset.obrixOffline='1';document.documentElement.dataset.obrixOfflineBoot=reason;
    window.dispatchEvent(new CustomEvent('obrix:offline-bootstrap',{detail:{reason,updatedAt:b.updatedAt||null,empresa_id:b.profile.empresa_id}}));return true;
  }
  if(!navigator.onLine)restaurarShellOffline('backend-early');
  window.addEventListener('offline',()=>restaurarShellOffline('backend-offline'));
  window.OBRIX_OFFLINE_EARLY={restore:restaurarShellOffline,base:baseOffline,status:()=>({online:navigator.onLine,available:!!baseOffline()})};

  function lerConfigCache(){
    try{
      const raw=localStorage.getItem(CONFIG_CACHE);if(!raw)return null;
      const item=JSON.parse(raw);if(!item?.cfg?.url||!item?.cfg?.publishableKey)return null;
      return item;
    }catch(_){return null}
  }
  function salvarConfigCache(cfg){try{localStorage.setItem(CONFIG_CACHE,JSON.stringify({at:Date.now(),cfg}))}catch(_){}}
  async function carregarConfig(){
    // Resolve a origem antes de usar cache, impedindo fuga para o banco oficial na prévia.
    const {url,ref}=urlConfigSegura();
    const cache=lerConfigCache();
    if(cache&&Date.now()-Number(cache.at||0)<CONFIG_TTL){
      try{return validarConfigAmbiente(cache.cfg,ref)}catch(_){}
    }
    try{
      const r=await fetch(url,{cache:'no-store'}),cfg=await r.json();
      if(!r.ok)throw new Error('Configuração OBRIX indisponível.');
      validarConfigAmbiente(cfg,ref);
      salvarConfigCache(cfg);return cfg;
    }catch(e){
      if(cache?.cfg?.url&&cache?.cfg?.publishableKey){
        try{return validarConfigAmbiente(cache.cfg,ref)}catch(_){}
      }
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
      const sb=await init();
      const sessao=await sb.auth.getSession();
      if(sessao?.data?.session?.user){userCache=sessao.data.session.user;return userCache}
      let {data,error}=await sb.auth.getUser();
      if(error||!data?.user){
        await new Promise(r=>setTimeout(r,180));
        const tentativa=await sb.auth.getSession();
        if(tentativa?.data?.session?.user){userCache=tentativa.data.session.user;return userCache}
        const nova=await sb.auth.getUser();data=nova.data;error=nova.error;
      }
      if(error||!data?.user)throw new Error('Sessão não encontrada. Entre novamente.');
      userCache=data.user;return userCache;
    })();
    try{return await userPromise}finally{userPromise=null}
  }


  // Aceite expresso em homologação: nunca ativar no banco oficial.
  async function exigirAceiteHml(sb,user){
    if(window.__OBRIX_HML_PROJECT_REF!=='xavwkfgrnowmusbkbiea'||!ehAmbienteNaoOficial())return;
    const versao='1.0-hml';
    const {data,error}=await sb.from('obrix_aceites_legais').select('versao').eq('user_id',user.id).eq('versao',versao).maybeSingle();
    if(error)throw error;
    if(data)return;
    await new Promise((resolve,reject)=>{
      const dialog=document.createElement('dialog');
      dialog.setAttribute('aria-labelledby','obrixAceiteTitulo');
      dialog.style.cssText='width:min(460px,calc(100% - 32px));max-height:85dvh;overflow:auto;box-sizing:border-box;padding:22px;border:1px solid var(--border,#64748b);border-radius:16px;background:var(--surface,#fff);color:var(--text,#0f172a);';
      dialog.innerHTML=`<h2 id="obrixAceiteTitulo">Documentos legais</h2><p>Leia os documentos abaixo. Esta é uma versão de homologação, sem contratação comercial.</p><details style="margin:10px 0"><summary>Termos de Uso — versão 1.0 (homologação)</summary><p>OBRIX Gestão de Obras: ferramenta de gestão de obras, equipes, finanças, estoques e documentos. Proteja suas credenciais e mantenha registros corretos. O sistema não substitui orientação contábil, jurídica ou técnica. Teste gratuito de sete dias; após vencimento, acesso limitado a uma obra e um funcionário. Mensal R$ 39,90; anual R$ 399,00. Pagamento confirmado libera o plano. Condições de renovação devem ser exibidas antes da contratação. Atendimento: obrixapp@hotmail.com / (31) 97356-5930. Identificação completa do fornecedor pendente de publicação controlada. Minuta de teste, não destinada a contratação comercial.</p></details><details style="margin:10px 0"><summary>Política de Privacidade — versão 1.0 (homologação)</summary><p>Tratamos dados de cadastro, autenticação, obras, equipes, finanças, documentos, fotos e dados técnicos para prestar o serviço, sincronizar, suportar, prevenir fraudes e cumprir obrigações legais. O OBRIX atua como controlador de suas contas e pode atuar como operador dos dados inseridos pelos clientes. Fornecedores incluem Supabase, Vercel e Efí. Transferências internacionais devem observar a LGPD. Retenção conforme finalidade e obrigações legais; exclusão sujeita às hipóteses legais de conservação e aos backups. Solicite acesso, correção, eliminação e demais direitos pelo e-mail obrixapp@hotmail.com. Identificação completa e prazos de retenção pendentes de revisão. Minuta de teste.</p></details><label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" class="aceite">Li e aceito os Termos de Uso e declaro ciência da Política de Privacidade.</label><p role="alert" class="erro"></p><button class="btn confirmar" type="button" disabled style="background:#ea580c;color:white">Aceitar e continuar</button> <button class="btn sair" type="button">Sair</button>`;
      const checkbox=dialog.querySelector('.aceite'),btn=dialog.querySelector('.confirmar'),sair=dialog.querySelector('.sair'),erro=dialog.querySelector('.erro');
      checkbox.onchange=()=>{btn.disabled=!checkbox.checked};
      dialog.addEventListener('cancel',e=>e.preventDefault());
      btn.onclick=async()=>{
        if(!checkbox.checked)return;
        btn.disabled=true;checkbox.disabled=true;sair.disabled=true;erro.textContent='';
        try{
          const current=await sb.auth.getUser();
          if(current.error||current.data?.user?.id!==user.id)throw new Error('Sessão alterada. Entre novamente.');
          const result=await sb.rpc('obrix_aceitar_documentos_hml',{p_versao:versao});
          if(result.error||result.data!==true)throw result.error||new Error('Aceite não confirmado.');
          dialog.close();dialog.remove();resolve();
        }catch(e){erro.textContent='Não foi possível registrar o aceite. Tente novamente.';checkbox.disabled=false;btn.disabled=!checkbox.checked;sair.disabled=false;}
      };
      sair.onclick=async()=>{sair.disabled=true;btn.disabled=true;try{const result=await sb.auth.signOut();if(result.error)throw result.error;dialog.close();dialog.remove();reject(new Error('Aceite não realizado.'));}catch(e){erro.textContent='Não foi possível sair. Tente novamente.';sair.disabled=false;btn.disabled=!checkbox.checked;}};
      document.body.appendChild(dialog);dialog.showModal();
    });
  }

  async function profile(force=false){
    if(profileCache&&!force)return profileCache;
    if(profilePromise&&!force)return profilePromise;
    profilePromise=(async()=>{
      const sb=await init(),user=await currentUser(force);
      await exigirAceiteHml(sb,user);
      const {data,error}=await sb.from('perfis').select('id,empresa_id,nome,email,papel').eq('id',user.id).maybeSingle();
      if(error)throw error;
      if(!data)throw new Error('Perfil OBRIX não encontrado.');
      const {error:trialError}=await sb.rpc('obrix_iniciar_trial_primeiro_acesso');
      if(trialError)throw trialError;
      profileCache=data;return profileCache;
    })();
    try{return await profilePromise}finally{profilePromise=null}
  }

  async function readTable(table,orderColumn){
    const sb=await init();
    const p=await profile(), eid=p.empresa_id;
    if(!eid)throw new Error('Empresa não identificada.');
    const tamanho=500, registros=[], vistos=new Set();
    for(let inicio=0;;inicio+=tamanho){
      let q=sb.from(table).select('*');
      if(['obras','funcionarios','financeiro','assinaturas','servicos_extras','diarias','vales','bonus_extras'].includes(table))q=q.eq('empresa_id',eid);
      if(orderColumn)q=q.order(orderColumn,{ascending:false});
      if(orderColumn!=='id')q=q.order('id',{ascending:true});
      const {data,error}=await q.range(inicio,inicio+tamanho-1);
      if(error)throw error;
      if(!Array.isArray(data))throw new Error('Resposta inválida ao carregar '+table);
      for(const item of data){
        if(!item.id||vistos.has(item.id))throw new Error('Consulta instável ao carregar '+table);
        vistos.add(item.id);registros.push(item);
      }
      if(data.length<tamanho)return registros;
    }
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
