(()=>{
  'use strict';

  const $=id=>document.getElementById(id);
  const recoveryHint=/(^|[?#&])type=recovery([&#]|$)/i.test(location.href)||/[?&]code=/.test(location.search);
  let recoveryOpened=false;

  function friendlyMessage(e){
    const raw=(e?.message||String(e||'Não foi possível concluir.')).trim();
    const s=raw.toLowerCase();
    if(!raw)return 'Não foi possível concluir a operação. Tente novamente.';
    if(/invalid login credentials|invalid credentials|email or password|wrong password|credenciais/.test(s))return 'E-mail ou senha incorretos. Confira os dados ou use “Esqueci minha senha”.';
    if(/email not confirmed|email.*confirm/.test(s))return 'Este e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou tente recuperar a senha.';
    if(/user.*already|email.*already|already registered|already been registered|user.*exists|email.*exists/.test(s))return 'Este e-mail já possui cadastro. Entre normalmente ou use “Esqueci minha senha” para recuperar o acesso.';
    if(/rate limit|too many|over_email_send_rate_limit|muitas tentativas/.test(s))return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.';
    if(/network|failed to fetch|fetch failed|load failed|networkerror|offline|internet connection/.test(s))return 'Não foi possível conectar agora. Verifique sua internet e tente novamente.';
    if(/auth session missing|session.*expired|expired.*session|jwt.*expired|invalid jwt|refresh token|token.*expired/.test(s))return 'Sua sessão expirou. Entre novamente para continuar.';
    if(/user not found|no user|usuario não encontrado|usuário não encontrado/.test(s))return 'Usuário não encontrado. Confira o e-mail informado.';
    if(/invalid email|email.*invalid|valid email|email address.*valid/.test(s))return 'Informe um endereço de e-mail válido.';
    if(/password.*least|at least.*character|weak password|password.*short|senha.*caracter/.test(s))return 'A senha não atende aos requisitos mínimos. Use pelo menos 6 caracteres.';
    if(/permission denied|row level security|not authorized|unauthorized|forbidden|insufficient privilege/.test(s))return 'Você não tem permissão para concluir esta operação.';
    if(/duplicate key|unique constraint|already exists|duplicate/.test(s))return 'Já existe um registro com esses dados.';
    if(/foreign key|violates.*constraint|constraint.*violat/.test(s))return 'Não foi possível concluir porque este registro está ligado a outros dados.';
    if(/timeout|timed out|time limit|connection.*time/.test(s))return 'A operação demorou demais. Tente novamente.';
    if(/bucket not found|object not found|file not found|storage.*not found/.test(s))return 'Arquivo não encontrado.';
    if(/database error|database.*failed|server error|internal server|bad gateway|service unavailable/.test(s))return 'O servidor não conseguiu concluir a operação agora. Tente novamente.';
    if(/already|registered|exists|cadastrad|já possui|ja possui/.test(s))return 'Este cadastro já existe.';
    if(/\b(error|failed|invalid|not found|request|network|timeout|permission|denied|unauthorized|forbidden|password|session|token|database|missing|cannot|could not|unable to|unexpected)\b/.test(s))return 'Não foi possível concluir a operação. Tente novamente.';
    return raw;
  }

  function style(){
    if($('obrixAuthStyles'))return;
    const s=document.createElement('style');
    s.id='obrixAuthStyles';
    s.textContent=`
      .loginAux{display:flex;gap:8px;margin-top:10px}.loginAux button{flex:1;border:1px solid var(--border,#cbd5e1);background:var(--surface,#fff);color:var(--text,#0f172a);border-radius:11px;padding:11px 8px;font-weight:800}.loginAux button:active{transform:scale(.98)}
      .authModal{max-width:460px;width:calc(100% - 24px);margin:auto}.authModal h2{margin-top:0}.authModal input{width:100%;padding:13px;border:1px solid var(--border,#cbd5e1);border-radius:11px;font-size:16px;margin:6px 0 10px}.authModal .authActions{display:flex;gap:8px;margin-top:8px}.authModal .authActions button{flex:1}.authHelp{font-size:13px;color:var(--muted,#475569);margin:2px 0 10px}
      .authError,#erro.status{position:relative;background:#fff1f2!important;color:#7f1d1d!important;border:1px solid #fecaca!important;border-left:4px solid #dc2626!important;border-radius:12px!important;padding:12px 14px 12px 42px!important;margin:10px 0!important;font-size:14px!important;font-weight:800!important;line-height:1.45!important;box-shadow:0 6px 18px rgba(127,29,29,.08)!important;opacity:1!important}
      .authError{display:none}.authError.show{display:block}.authError:before,#erro.status:before{content:'!';position:absolute;left:13px;top:11px;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#dc2626;color:#fff;font-size:13px;font-weight:950;line-height:1}
      html[data-theme="dark"] .authError,html[data-theme="dark"] #erro.status{background:#2b1217!important;color:#fecdd3!important;border-color:#7f1d1d!important;border-left-color:#fb7185!important;box-shadow:0 8px 24px rgba(0,0,0,.22)!important}
      html[data-theme="dark"] .authError:before,html[data-theme="dark"] #erro.status:before{background:#fb7185;color:#25080d}
    `;
    document.head.appendChild(s);
  }

  function err(box,e){
    box.textContent=friendlyMessage(e);
    box.classList.add('show');
  }

  function installLoginErrorMap(){
    const box=$('erro');
    if(!box)return;
    const normalize=()=>{const current=(box.textContent||'').trim();if(!current)return;const next=friendlyMessage(current);if(next!==current)box.textContent=next};
    new MutationObserver(normalize).observe(box,{childList:true,characterData:true,subtree:true});
    normalize();
  }

  function installGlobalErrorMap(){
    window.OBRIX_PT_ERROR=friendlyMessage;
    if(!window.__OBRIX_PT_ALERT){
      window.__OBRIX_PT_ALERT=true;
      const nativeAlert=window.alert.bind(window);
      window.alert=msg=>nativeAlert(friendlyMessage(msg));
    }
    const selector='#erro,.authError,.diarioMsg.erro,.cfgStatus,.status';
    const normalizeEl=el=>{if(!el)return;const current=(el.textContent||'').trim();if(!current)return;const next=friendlyMessage(current);if(next!==current)el.textContent=next};
    const scan=root=>{if(!root)return;if(root.matches?.(selector))normalizeEl(root);root.querySelectorAll?.(selector).forEach(normalizeEl)};
    const start=()=>{
      if(!document.body)return;
      scan(document.body);
      const obs=new MutationObserver(ms=>ms.forEach(m=>{if(m.type==='characterData')scan(m.target.parentElement);else{scan(m.target);m.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n)})}}));
      obs.observe(document.body,{childList:true,subtree:true,characterData:true});
    };
    if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
  }

  function modal(html){
    const back=document.createElement('div');
    back.className='modalBack';
    back.innerHTML=`<div class="modal authModal">${html}</div>`;
    document.body.appendChild(back);
    return back;
  }

  async function criarConta(){
    const back=modal(`
      <h2>Criar conta</h2>
      <p class="authHelp">O teste grátis de 7 dias começa no primeiro cadastro.</p>
      <label>Nome</label><input class="nome" autocomplete="name" placeholder="Seu nome">
      <label>E-mail</label><input class="email" type="email" autocomplete="email" placeholder="seu@email.com">
      <label>Senha</label><input class="senha" type="password" autocomplete="new-password" placeholder="Mínimo de 6 caracteres">
      <label>Confirmar senha</label><input class="senha2" type="password" autocomplete="new-password" placeholder="Repita a senha">
      <div class="authError"></div>
      <div class="authActions"><button class="btn cancelar" type="button">Cancelar</button><button class="btn confirmar" type="button">Criar conta</button></div>
    `);
    const loginEmail=$('email')?.value?.trim();
    if(loginEmail)back.querySelector('.email').value=loginEmail;
    back.querySelector('.cancelar').onclick=()=>back.remove();
    back.querySelector('.confirmar').onclick=async()=>{
      const box=back.querySelector('.authError'),btn=back.querySelector('.confirmar');
      box.classList.remove('show');
      const nome=back.querySelector('.nome').value.trim();
      const email=back.querySelector('.email').value.trim();
      const senha=back.querySelector('.senha').value;
      const senha2=back.querySelector('.senha2').value;
      if(!email)return err(box,'Digite um e-mail válido.');
      if(senha.length<6)return err(box,'A senha precisa ter pelo menos 6 caracteres.');
      if(senha!==senha2)return err(box,'As senhas não conferem.');
      btn.disabled=true;btn.textContent='Criando...';
      try{
        const sb=await OBRIX_BACKEND.init();
        const {data,error}=await sb.functions.invoke('obrix-signup',{body:{nome:nome||email,email,password:senha}});
        if(error){
          let msg=data?.error||'Não foi possível criar a conta agora.';
          try{const j=await error.context?.json?.();if(j?.error)msg=j.error}catch(_){}
          throw new Error(msg);
        }
        if(!data?.ok)throw new Error(data?.error||'Não foi possível criar a conta agora.');
        const login=await sb.auth.signInWithPassword({email,password:senha});
        if(login.error)throw login.error;
        back.remove();
        if(typeof carregar==='function')await carregar();else location.reload();
      }catch(e){btn.disabled=false;btn.textContent='Criar conta';err(box,e)}
    };
  }

  async function esqueceuSenha(){
    const back=modal(`
      <h2>Recuperar senha</h2>
      <p class="authHelp">Digite o e-mail da conta. Você receberá um link para cadastrar uma nova senha.</p>
      <label>E-mail</label><input class="email" type="email" autocomplete="email" placeholder="seu@email.com">
      <div class="authError"></div>
      <div class="authActions"><button class="btn cancelar" type="button">Cancelar</button><button class="btn confirmar" type="button">Enviar link</button></div>
    `);
    const loginEmail=$('email')?.value?.trim();
    if(loginEmail)back.querySelector('.email').value=loginEmail;
    back.querySelector('.cancelar').onclick=()=>back.remove();
    back.querySelector('.confirmar').onclick=async()=>{
      const box=back.querySelector('.authError'),btn=back.querySelector('.confirmar');
      box.classList.remove('show');
      const email=back.querySelector('.email').value.trim();
      if(!email)return err(box,'Digite o seu e-mail.');
      btn.disabled=true;btn.textContent='Enviando...';
      try{
        const sb=await OBRIX_BACKEND.init();
        const redirectTo='https://obrix.junioalef7.workers.dev/obrix.html';
        const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo});
        if(error)throw error;
        back.remove();
        alert('Se esse e-mail estiver cadastrado, o link para criar uma nova senha foi enviado.');
      }catch(e){btn.disabled=false;btn.textContent='Enviar link';err(box,e)}
    };
  }

  async function novaSenha(){
    if(recoveryOpened)return;
    recoveryOpened=true;
    const back=modal(`
      <h2>Criar nova senha</h2>
      <p class="authHelp">Digite a nova senha que deseja usar no OBRIX.</p>
      <label>Nova senha</label><input class="senha" type="password" autocomplete="new-password" placeholder="Mínimo de 6 caracteres">
      <label>Confirmar nova senha</label><input class="senha2" type="password" autocomplete="new-password" placeholder="Repita a senha">
      <div class="authError"></div>
      <div class="authActions"><button class="btn confirmar" type="button">Salvar nova senha</button></div>
    `);
    back.querySelector('.confirmar').onclick=async()=>{
      const box=back.querySelector('.authError'),btn=back.querySelector('.confirmar');
      box.classList.remove('show');
      const senha=back.querySelector('.senha').value,senha2=back.querySelector('.senha2').value;
      if(senha.length<6)return err(box,'A senha precisa ter pelo menos 6 caracteres.');
      if(senha!==senha2)return err(box,'As senhas não conferem.');
      btn.disabled=true;btn.textContent='Salvando...';
      try{
        const sb=await OBRIX_BACKEND.init();
        const {error}=await sb.auth.updateUser({password:senha});
        if(error)throw error;
        const u=new URL(location.href);u.hash='';u.searchParams.delete('code');u.searchParams.delete('type');u.searchParams.delete('token_hash');
        history.replaceState({},'',u.pathname+(u.search||''));
        back.remove();
        alert('Senha alterada com sucesso.');
        if(typeof carregar==='function')await carregar();
      }catch(e){btn.disabled=false;btn.textContent='Salvar nova senha';err(box,e)}
    };
  }

  function installButtons(){
    style();
    installGlobalErrorMap();
    installLoginErrorMap();
    const entrar=$('entrar');
    if(!entrar||$('obrixAuthAux'))return;
    const row=document.createElement('div');
    row.id='obrixAuthAux';row.className='loginAux';
    row.innerHTML='<button type="button" class="criar">Criar conta</button><button type="button" class="esqueci">Esqueci minha senha</button>';
    entrar.insertAdjacentElement('afterend',row);
    row.querySelector('.criar').onclick=criarConta;
    row.querySelector('.esqueci').onclick=esqueceuSenha;
  }

  async function installRecovery(){
    try{
      const sb=await OBRIX_BACKEND.init();
      sb.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')setTimeout(novaSenha,0)});
      if(recoveryHint){
        const {data}=await sb.auth.getSession();
        if(data?.session)setTimeout(novaSenha,0);
      }
    }catch(e){console.warn('OBRIX auth recovery indisponível',e)}
  }

  window.OBRIX_PT_ERROR=friendlyMessage;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installButtons);else installButtons();
  setTimeout(installRecovery,500);
  window.OBRIX_AUTH={criarConta,esqueceuSenha,novaSenha,friendlyMessage};
})();