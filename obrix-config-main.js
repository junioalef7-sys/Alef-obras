(()=>{'use strict';
const $=id=>document.getElementById(id);
const tabelasTudo=['pagamento_bonus_extras','pagamento_diarias','pagamento_vales','diario_atividades','diario_equipe','fotos_obra','orcamento_itens','compra_itens','financeiro','estoque_movimentacoes','estoque_saldos','pagamentos_equipe','bonus_extras','vales','diarias','faltas','relatorios_fotograficos','documentos','relatorios','compras','servicos_extras','checklist_itens','estoques','materiais','fornecedores','funcionarios','orcamentos','diarios_obra','obras','clientes'];
function esconderOutros(){['inicio','obras','equipe','financeiroMain','estoqueMain','relatoriosMain','backupMain','assinaturaMain','menuMain'].forEach(id=>{const e=$(id);if(e&&!e.classList.contains('hidden'))e.classList.add('hidden')});document.querySelectorAll('.bottom button.active').forEach(b=>b.classList.remove('active'))}
function atualizaTema(){const t=document.documentElement.dataset.theme||'light';$('cfgClaro')?.classList.toggle('active',t==='light');$('cfgEscuro')?.classList.toggle('active',t==='dark')}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function modal(titulo,html){document.querySelector('.cfgModalBack')?.remove();const b=document.createElement('div');b.className='modalBack cfgModalBack';b.innerHTML=`<div class="modal cfgModal"><h2>${esc(titulo)}</h2>${html}</div>`;document.body.appendChild(b);b.querySelector('.cancelar')?.addEventListener('click',()=>b.remove());return b}
let usuarioEmCarga=null;
function atualizarTextoConfig(id,valor){
  const el=$(id);
  if(el&&el.textContent!==valor)el.textContent=valor;
}
async function carregarUsuario(){
  if(usuarioEmCarga)return usuarioEmCarga;
  usuarioEmCarga=(async()=>{
    try{
      const p=await OBRIX_BACKEND.profile(),u=await OBRIX_BACKEND.currentUser();
      atualizarTextoConfig('cfgNome',p?.nome||'Não informado');
      atualizarTextoConfig('cfgEmail',u?.email||p?.email||'Não informado');
    }catch(e){atualizarTextoConfig('cfgEmail','Não foi possível carregar')}
  })();
  try{return await usuarioEmCarga}finally{usuarioEmCarga=null}
}
function ensure(){if($('configMain'))return;const app=$('app'),bottom=app?.querySelector('.bottom');if(!app||!bottom)return;const m=document.createElement('main');m.id='configMain';m.className='hidden';m.innerHTML=`
<div class="hero cfgHero"><div><h1>Configurações</h1><p>Conta, aparência e dados do aplicativo</p></div><button class="cfgFechar" id="cfgFechar">Fechar</button></div>
<div class="card"><h3>Dados pessoais do usuário</h3><div class="cfgUserData"><div><small>Nome</small><b id="cfgNome">Carregando...</b></div><div><small>E-mail</small><b id="cfgEmail">Carregando...</b></div></div><div class="cfgAccountActions"><button class="btn" id="cfgTrocarEmail">Trocar e-mail</button><button class="btn" id="cfgTrocarSenha">Trocar senha</button></div><div id="cfgContaStatus" class="muted cfgStatus"></div></div>
<div class="card"><h3>Aparência</h3><p class="muted">Escolha como o OBRIX deve aparecer neste aparelho.</p><div class="cfgTheme"><button id="cfgClaro">☀️ Modo claro</button><button id="cfgEscuro">🌙 Modo escuro</button></div></div>
<div class="card cfgData"><h3>Dados do aplicativo</h3><p class="muted">Apague somente o módulo desejado ou limpe todos os dados do aplicativo. Sua conta, login, perfil e assinatura são preservados.</p><div class="cfgDeleteGrid"><button data-del="equipe">Apagar Equipe</button><button data-del="obras">Apagar Obras</button><button data-del="financeiro">Apagar Financeiro</button><button class="dangerAll" data-del="tudo">Apagar tudo</button></div><div id="cfgLimparStatus" class="muted cfgStatus"></div></div>
<div class="card"><h3>Conta</h3><button class="btn cfgFull" id="cfgSair">Sair da conta</button></div>`;app.insertBefore(m,bottom);
$('cfgFechar').onclick=()=>window.OBRIX_MENU?.open?.()||window.abrir?.('inicio');
$('cfgClaro').onclick=()=>{window.OBRIX_THEME?.apply?.('light');atualizaTema()};$('cfgEscuro').onclick=()=>{window.OBRIX_THEME?.apply?.('dark');atualizaTema()};
$('cfgTrocarEmail').onclick=trocarEmail;$('cfgTrocarSenha').onclick=trocarSenha;$('cfgSair').onclick=()=>document.getElementById('sair')?.click();
m.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>apagarModulo(b.dataset.del));atualizaTema()}
async function trocarEmail(){const atual=$('cfgEmail')?.textContent||'';const b=modal('Trocar e-mail',`<p class="muted">E-mail atual: <b>${esc(atual)}</b></p><label>Novo e-mail</label><input class="novoEmail" type="email" autocomplete="email" placeholder="novo@email.com"><div class="modalActions"><button class="btn cancelar">Cancelar</button><button class="btn salvar">Trocar e-mail</button></div>`);b.querySelector('.salvar').onclick=async()=>{const email=b.querySelector('.novoEmail').value.trim().toLowerCase();if(!email||!email.includes('@'))return alert('Informe um e-mail válido.');const btn=b.querySelector('.salvar');btn.disabled=true;try{const sb=await OBRIX_BACKEND.init(),{data,error}=await sb.auth.updateUser({email});if(error)throw error;const pending=data?.user?.new_email&&String(data.user.email||'').toLowerCase()!==email;if(!pending){const p=await OBRIX_BACKEND.profile();await sb.from('perfis').update({email}).eq('id',p.id)}b.remove();$('cfgContaStatus').textContent=pending?'Solicitação enviada. Confirme o novo e-mail para concluir a troca.':'E-mail atualizado com sucesso.';await carregarUsuario()}catch(e){alert(e?.message||'Não foi possível trocar o e-mail.');btn.disabled=false}}}

const RECOVERY_URL='https://alef-obras-obrix3.vercel.app/obrix.html';
function cfgSessionError(e){return /auth session missing|sess[aã]o n[aã]o encontrada|invalid.*token|refresh.*token|jwt.*(expired|invalid)|session.*(expired|missing)|not authenticated|user not found/i.test(String(e?.message||e||''))}
function cfgModalInner(back,content){
  const card=back.querySelector('.cfgModal');
  if(!card)return null;
  card.innerHTML='<h2>Trocar senha</h2>'+content;
  card.querySelector('.cancelar')?.addEventListener('click',()=>back.remove());
  return card;
}
function cfgEntrarNovamente(back){
  const login=$('login'),app=$('app');
  back.remove();
  if(!login||!app){location.assign('./obrix.html');return}
  try{OBRIX_BACKEND.clearCache?.()}catch(_){}
  app.classList.add('hidden');
  login.classList.remove('hidden');
  $('erro')?.classList.add('hidden');
  const email=String($('cfgEmail')?.textContent||'').trim();
  if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&$('email'))$('email').value=email;
  window.scrollTo({top:0,behavior:'auto'});
}
function cfgRecuperarSenha(back){
  const saved=String($('cfgEmail')?.textContent||$('email')?.value||'').trim();
  const card=cfgModalInner(back,
    '<p class="muted">Sua sessão de acesso não está disponível. Entre novamente para trocar a senha ou solicite um link de recuperação por e-mail.</p>'+
    '<p class="muted">Seus dados de obras e registros locais não serão apagados.</p>'+
    '<label>E-mail da conta</label><input type="email" class="cfgRecuperarEmail" autocomplete="email" placeholder="seu@email.com">'+
    '<div class="cfgPasswordStatus" role="status" aria-live="polite"></div>'+
    '<div class="modalActions"><button type="button" class="btn cancelar">Cancelar</button><button type="button" class="btn cfgEntrar">Entrar novamente</button></div>'+
    '<button type="button" class="btn cfgEnviarLink" style="width:100%;margin-top:10px">Enviar link para recuperar senha</button>'
  );
  if(!card)return;
  if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(saved))card.querySelector('.cfgRecuperarEmail').value=saved;
  card.querySelector('.cfgEntrar').onclick=()=>cfgEntrarNovamente(back);
  card.querySelector('.cfgEnviarLink').onclick=async()=>{
    const email=String(card.querySelector('.cfgRecuperarEmail').value||'').trim().toLowerCase(),st=card.querySelector('.cfgPasswordStatus'),btn=card.querySelector('.cfgEnviarLink');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){st.textContent='Informe um e-mail válido.';return}
    if(!navigator.onLine){st.textContent='Conecte-se à internet para receber o link.';return}
    btn.disabled=true;btn.textContent='Enviando...';st.textContent='';
    try{
      const sb=await OBRIX_BACKEND.init();
      const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:RECOVERY_URL});
      if(error)throw error;
      st.textContent='Se o e-mail estiver cadastrado, enviaremos um link para criar uma nova senha. Verifique também a caixa de spam.';
      btn.textContent='Link solicitado';
    }catch(e){st.textContent='Não foi possível enviar o link agora. Verifique sua conexão e tente novamente.';btn.disabled=false;btn.textContent='Enviar link para recuperar senha'}
  };
}
function cfgVerificacaoIndisponivel(back,e){
  const offline=!navigator.onLine||document.documentElement.dataset.obrixOffline==='1'||window.__OBRIX_FORCE_OFFLINE;
  const detail=offline?'Conecte-se à internet para trocar sua senha.':'Não foi possível verificar sua sessão agora. Confira a conexão e tente novamente.';
  const card=cfgModalInner(back,
    '<p class="muted">'+detail+'</p>'+
    '<div class="modalActions"><button type="button" class="btn cancelar">Cancelar</button><button type="button" class="btn cfgRetry">Tentar novamente</button></div>'
  );
  card?.querySelector('.cfgRetry')?.addEventListener('click',()=>trocarSenha());
  if(e)console.warn('OBRIX: verificação de senha indisponível',e?.name||'Erro de conexão');
}
async function trocarSenha(){
  const back=modal('Trocar senha','<p class="muted">Verificando sua sessão de acesso...</p><div class="modalActions"><button type="button" class="btn cancelar">Cancelar</button></div>');
  if(!navigator.onLine||document.documentElement.dataset.obrixOffline==='1'||window.__OBRIX_FORCE_OFFLINE){cfgVerificacaoIndisponivel(back);return}
  try{
    const sb=await OBRIX_BACKEND.init();
    const {data:sessionData,error:sessionError}=await sb.auth.getSession();
    if(sessionError&&!cfgSessionError(sessionError))throw sessionError;
    if(!sessionData?.session?.access_token){cfgRecuperarSenha(back);return}
    const {data:userData,error:userError}=await sb.auth.getUser();
    if(userError){
      if(cfgSessionError(userError)){cfgRecuperarSenha(back);return}
      throw userError;
    }
    if(!userData?.user){cfgRecuperarSenha(back);return}
    const card=cfgModalInner(back,
      '<label>Nova senha</label><input class="senha1" type="password" autocomplete="new-password" minlength="8" placeholder="Mínimo de 8 caracteres">'+
      '<label>Confirmar nova senha</label><input class="senha2" type="password" autocomplete="new-password" minlength="8" placeholder="Repita a senha">'+
      '<div class="cfgPasswordStatus" role="status" aria-live="polite"></div>'+
      '<div class="modalActions"><button type="button" class="btn cancelar">Cancelar</button><button type="button" class="btn salvar">Trocar senha</button></div>'
    );
    if(!card)return;
    card.querySelector('.salvar').onclick=async()=>{
      const s1=card.querySelector('.senha1').value,s2=card.querySelector('.senha2').value,st=card.querySelector('.cfgPasswordStatus');
      st.textContent='';
      if(s1.length<8){st.textContent='A senha deve ter pelo menos 8 caracteres.';return}
      if(s1!==s2){st.textContent='As senhas não conferem.';return}
      const btn=card.querySelector('.salvar');btn.disabled=true;btn.textContent='Salvando...';
      try{
        const {error}=await sb.auth.updateUser({password:s1});
        if(error)throw error;
        back.remove();
        const status=$('cfgContaStatus');if(status)status.textContent='Senha atualizada com sucesso.';
      }catch(e){
        if(cfgSessionError(e)){cfgRecuperarSenha(back);return}
        st.textContent=String(e?.message||'Não foi possível trocar a senha.');
        btn.disabled=false;btn.textContent='Trocar senha';
      }
    };
  }catch(e){
    if(cfgSessionError(e))cfgRecuperarSenha(back);
    else cfgVerificacaoIndisponivel(back,e);
  }
}
async function delAll(sb,t,eid){const r=await sb.from(t).delete().eq('empresa_id',eid);if(r.error)throw new Error(`${t}: ${r.error.message}`)}
async function prepararFinanceiro(sb,eid,origem=null,obraIds=null){let q=sb.from('financeiro').update({status_lancamento:'estornado'}).eq('empresa_id',eid).neq('origem','manual').eq('status_lancamento','ativo');if(origem)q=q.eq('origem',origem);if(obraIds?.length)q=q.in('obra_id',obraIds);const r=await q;if(r.error)throw new Error(`financeiro: ${r.error.message}`)}
async function apagarEquipe(sb,eid,st){st.textContent='Preparando lançamentos da equipe...';await prepararFinanceiro(sb,eid,'pagamento_equipe');let r=await sb.from('financeiro').delete().eq('empresa_id',eid).eq('origem','pagamento_equipe');if(r.error)throw r.error;r=await sb.from('diario_equipe').delete().eq('empresa_id',eid);if(r.error)throw r.error;r=await sb.from('pagamento_bonus_extras').delete().eq('empresa_id',eid);if(r.error)throw r.error;r=await sb.from('pagamento_diarias').delete().eq('empresa_id',eid);if(r.error)throw r.error;r=await sb.from('pagamento_vales').delete().eq('empresa_id',eid);if(r.error)throw r.error;r=await sb.from('pagamentos_equipe').delete().eq('empresa_id',eid);if(r.error)throw r.error;r=await sb.from('funcionarios').delete().eq('empresa_id',eid);if(r.error)throw r.error}
async function apagarObras(sb,eid,st){st.textContent='Apagando obras e vínculos...';const wo=await sb.from('obras').select('id').eq('empresa_id',eid);if(wo.error)throw wo.error;const ids=(wo.data||[]).map(x=>x.id);if(!ids.length)return;await prepararFinanceiro(sb,eid,null,ids);let r=await sb.from('financeiro').delete().eq('empresa_id',eid).in('obra_id',ids);if(r.error)throw r.error;r=await sb.from('pagamento_diarias').delete().eq('empresa_id',eid).in('obra_id',ids);if(r.error)throw r.error;r=await sb.from('diarias').delete().eq('empresa_id',eid).in('obra_id',ids);if(r.error)throw r.error;r=await sb.from('compras').update({obra_id:null}).eq('empresa_id',eid).in('obra_id',ids);if(r.error)throw r.error;r=await sb.from('estoques').update({obra_id:null}).eq('empresa_id',eid).in('obra_id',ids);if(r.error)throw r.error;r=await sb.from('funcionarios').update({obra_id:null}).eq('empresa_id',eid).in('obra_id',ids);if(r.error)throw r.error;r=await sb.from('orcamentos').update({obra_id:null}).eq('empresa_id',eid).in('obra_id',ids);if(r.error)throw r.error;r=await sb.from('obras').delete().eq('empresa_id',eid).in('id',ids);if(r.error)throw r.error}
async function apagarFinanceiro(sb,eid,st){st.textContent='Preparando lançamentos automáticos...';await prepararFinanceiro(sb,eid);st.textContent='Apagando financeiro...';await delAll(sb,'financeiro',eid)}
async function apagarTudo(sb,eid,st){st.textContent='Preparando lançamentos automáticos...';await prepararFinanceiro(sb,eid);for(let i=0;i<tabelasTudo.length;i++){const t=tabelasTudo[i];st.textContent=`Apagando tudo: ${i+1} de ${tabelasTudo.length}...`;await delAll(sb,t,eid)}}
async function apagarModulo(tipo){const textos={equipe:['Equipe','APAGAR EQUIPE'],obras:['Obras','APAGAR OBRAS'],financeiro:['Financeiro','APAGAR FINANCEIRO'],tudo:['TODOS os dados do aplicativo','APAGAR TUDO']},cfg=textos[tipo];if(!cfg)return;const frase=prompt(`Esta ação apagará ${cfg[0]}.\n\nSua conta, login, perfil e assinatura serão preservados.\n\nDigite ${cfg[1]} para confirmar:`);if(String(frase||'').trim().toUpperCase()!==cfg[1])return;const st=$('cfgLimparStatus');document.querySelectorAll('.cfgDeleteGrid button').forEach(b=>b.disabled=true);try{const p=await OBRIX_BACKEND.profile(),sb=await OBRIX_BACKEND.init();if(tipo==='equipe')await apagarEquipe(sb,p.empresa_id,st);else if(tipo==='obras')await apagarObras(sb,p.empresa_id,st);else if(tipo==='financeiro')await apagarFinanceiro(sb,p.empresa_id,st);else await apagarTudo(sb,p.empresa_id,st);st.innerHTML=`<b>${cfg[0]} apagado com sucesso.</b>`;setTimeout(()=>location.reload(),900)}catch(e){console.warn('Limpeza OBRIX',e);st.textContent='Não foi possível concluir: '+(e?.message||e);document.querySelectorAll('.cfgDeleteGrid button').forEach(b=>b.disabled=false)}}
function open(){ensure();esconderOutros();$('configMain')?.classList.remove('hidden');atualizaTema();scrollTo({top:0,behavior:'smooth'});void carregarUsuario()}
const css=document.createElement('style');css.textContent=`.cfgHero{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.cfgHero h1{margin:0 0 5px}.cfgFechar{border:1px solid var(--ob-border)!important;background:var(--ob-surface-2)!important;color:var(--ob-text)!important;border-radius:10px;padding:9px 13px;font-weight:900}.cfgTheme{display:grid;grid-template-columns:1fr 1fr;gap:9px}.cfgTheme button{border:1px solid var(--ob-border)!important;background:var(--ob-surface-2)!important;color:var(--ob-text)!important;padding:14px;border-radius:12px;font-weight:900}.cfgTheme button.active{outline:2px solid var(--ob-accent,#f2b84b);outline-offset:1px}.cfgFull{width:100%;margin-top:6px}.cfgUserData{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.cfgUserData>div{border:1px solid var(--ob-border)!important;border-radius:12px;padding:12px;background:var(--ob-surface-2)!important;color:var(--ob-text)!important}.cfgUserData small{display:block;color:var(--ob-muted)!important;font-weight:700;margin-bottom:5px}.cfgUserData b{word-break:break-word;color:var(--ob-text)!important}.cfgAccountActions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cfgData{border-color:var(--ob-border)!important}.cfgDeleteGrid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.cfgDeleteGrid button,.cfgDeleteGrid .dangerAll{border:2px solid #dc2626!important;background:var(--ob-surface-2)!important;background-color:var(--ob-surface-2)!important;background-image:none!important;color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;border-radius:11px;padding:13px;font-weight:900;box-shadow:none!important}.cfgDeleteGrid button:disabled{opacity:.5}.cfgStatus{margin-top:10px}.cfgStatus b{color:#166534}.cfgModal{max-width:520px}html[data-theme="dark"] #configMain .card,html[data-theme="dark"] #configMain .hero{background:#0d1722!important;background-color:#0d1722!important;color:#f8fafc!important;border-color:#293b4d!important}html[data-theme="dark"] #configMain .cfgUserData>div,html[data-theme="dark"] #configMain .cfgTheme button,html[data-theme="dark"] #configMain .cfgAccountActions button,html[data-theme="dark"] #configMain #cfgSair{background:#111e2c!important;background-color:#111e2c!important;color:#f8fafc!important;-webkit-text-fill-color:#f8fafc!important;border-color:#293b4d!important}html[data-theme="light"] #configMain .card,html[data-theme="light"] #configMain .hero{background:#f8fafc!important;background-color:#f8fafc!important;color:#0f172a!important;border-color:#cbd5df!important}html[data-theme="light"] #configMain .cfgUserData>div,html[data-theme="light"] #configMain .cfgTheme button,html[data-theme="light"] #configMain .cfgAccountActions button,html[data-theme="light"] #configMain #cfgSair{background:#e5eaf0!important;background-color:#e5eaf0!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;border-color:#cbd5df!important}@media(max-width:520px){.cfgTheme,.cfgUserData,.cfgAccountActions,.cfgDeleteGrid{grid-template-columns:1fr}.cfgHero{align-items:flex-start}.cfgFechar{padding:8px 10px}}`;document.head.appendChild(css);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(ensure,200));else setTimeout(ensure,200);window.OBRIX_CONFIG={open,apagarModulo,trocarEmail,trocarSenha};})();