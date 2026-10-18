(()=>{
  'use strict';

  const $=id=>document.getElementById(id);
  const recoveryHint=/(^|[?#&])type=recovery([&#]|$)/i.test(location.href)||/[?&]code=/.test(location.search);
  let recoveryOpened=false;

  function style(){
    if($('obrixAuthStyles'))return;
    const s=document.createElement('style');
    s.id='obrixAuthStyles';
    s.textContent=`
      .loginAux{display:flex;gap:8px;margin-top:10px}.loginAux button{flex:1;border:1px solid var(--border,#cbd5e1);background:var(--surface,#fff);color:var(--text,#0f172a);border-radius:11px;padding:11px 8px;font-weight:800}.loginAux button:active{transform:scale(.98)}
      .authModal{max-width:460px;width:calc(100% - 24px);margin:auto}.authModal h2{margin-top:0}.authModal input{width:100%;padding:13px;border:1px solid var(--border,#cbd5e1);border-radius:11px;font-size:16px;margin:6px 0 10px}.authModal .authActions{display:flex;gap:8px;margin-top:8px}.authModal .authActions button{flex:1}.authHelp{font-size:13px;color:var(--muted,#475569);margin:2px 0 10px}.authError{display:none;background:#fee2e2;color:#991b1b;border-radius:10px;padding:10px;margin:8px 0}.authError.show{display:block}
    `;
    document.head.appendChild(s);
  }

  function err(box,e){
    box.textContent=e?.message||String(e||'Não foi possível concluir.');
    box.classList.add('show');
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
        const {data,error}=await sb.auth.signUp({email,password:senha,options:{data:{nome:nome||email}}});
        if(error)throw error;
        if(!data?.session){
          back.remove();
          alert('Conta criada. Se for solicitado, confira seu e-mail para concluir o acesso.');
          return;
        }
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

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installButtons);else installButtons();
  setTimeout(installRecovery,500);
  window.OBRIX_AUTH={criarConta,esqueceuSenha,novaSenha};
})();