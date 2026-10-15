(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  function notify(text){try{if(typeof window.toast==='function')window.toast(text);else alert(text)}catch(_){}}
  async function current(){
    if(typeof sb==='undefined'||!sb)throw new Error('Sem conexão com o servidor.');
    const {data,error}=await sb.auth.getSession();if(error)throw error;
    const session=data?.session;if(!session?.user?.id)throw new Error('Sua sessão expirou. Entre novamente.');
    return {session,user:session.user};
  }
  function closeDelete(){try{if(typeof closeM==='function')closeM('edExcluirConta14M');else $('edExcluirConta14M')?.classList.remove('open')}catch(_){}
  function clearDevice(uid){try{for(const store of [localStorage,sessionStorage])for(const key of Object.keys(store))if(key.startsWith('sb-')||key.toLowerCase().startsWith('edifiq')||key.includes(uid))store.removeItem(key)}catch(_){}}
  window.openExcluirConta14=async function(){
    let account;try{account=await current()}catch(e){notify(e?.message||'Não foi possível identificar sua conta.');return}
    let m=$('edExcluirConta14M');if(!m){m=document.createElement('div');m.id='edExcluirConta14M';m.className='modal';document.body.appendChild(m)}
    m.innerHTML=`<div class="modalBox" style="max-width:660px;max-height:92vh;overflow:auto"><div class="modalHead"><div><h2>🗑️ Excluir conta e dados</h2><p class="sub">A exclusão é imediata. Não existe mais solicitação pendente.</p></div><button class="x" type="button" onclick="closeM('edExcluirConta14M')">×</button></div>
      <div class="card ed61Warn"><h3>⚠️ Faça backup antes</h3><p>Depois da confirmação final, a conta e os dados operacionais associados serão excluídos. Se quiser guardar uma cópia, faça o backup agora.</p><div class="edAccountActions"><button class="btn" type="button" onclick="closeM('edExcluirConta14M');openBackupConfigDirect&&openBackupConfigDirect()">💾 Fazer backup primeiro</button></div></div>
      <div class="card"><h3>1. Conta que será excluída</h3><div class="financeRow"><span>E-mail</span><b>${String(account.user.email||'—')}</b></div></div>
      <div class="card"><h3>2. Confirme a exclusão</h3><div class="ed61Grid"><label>Senha atual<input id="edExcluirSenha61" type="password" autocomplete="current-password" placeholder="Digite sua senha atual"></label><label>Digite <b>EXCLUIR MINHA CONTA</b><input id="edExcluirFrase61" autocomplete="off" placeholder="EXCLUIR MINHA CONTA"></label><label>Motivo (opcional)<textarea id="edExcluirMotivo61" maxlength="500" placeholder="Se quiser, informe o motivo."></textarea></label><label class="ed61Check"><input id="edExcluirCiente61" type="checkbox"><span>Confirmo que esta é a conta que desejo excluir.</span></label><label class="ed61Check"><input id="edExcluirIrreversivel61" type="checkbox"><span>Entendo que a exclusão é definitiva e que devo fazer backup antes se quiser conservar meus dados.</span></label></div><div class="edAccountActions"><button id="edExcluirAgora61" class="btn danger" type="button" onclick="excluirContaAgora61()">Excluir conta agora</button></div><p id="edExcluirMsg61" class="sub"></p></div>
      <div class="note">Confirmou a senha, digitou a frase e marcou as duas confirmações: o botão acima exclui a conta na hora.</div></div>`;
    m.classList.add('open');
  };
  window.excluirContaAgora61=async function(){
    const senha=String($('edExcluirSenha61')?.value||'');
    const frase=String($('edExcluirFrase61')?.value||'').trim().toUpperCase();
    const motivo=String($('edExcluirMotivo61')?.value||'').trim().slice(0,500);
    const ciente=!!$('edExcluirCiente61')?.checked,irreversivel=!!$('edExcluirIrreversivel61')?.checked;
    const msg=$('edExcluirMsg61'),btn=$('edExcluirAgora61');
    const setMsg=t=>{if(msg)msg.textContent=t};
    if(!senha){setMsg('Digite sua senha atual.');return}
    if(frase!=='EXCLUIR MINHA CONTA'){setMsg('Digite exatamente: EXCLUIR MINHA CONTA');return}
    if(!ciente||!irreversivel){setMsg('Marque as duas confirmações antes de excluir.');return}
    if(!confirm('CONFIRMAÇÃO FINAL: deseja excluir esta conta agora? Esta ação não poderá ser desfeita.'))return;
    if(btn){btn.disabled=true;btn.textContent='Excluindo conta...'}setMsg('Validando senha e excluindo a conta...');
    try{
      const {user}=await current();
      const {data,error}=await sb.functions.invoke('edifiq-excluir-conta-imediato',{body:{password:senha,confirmation:'EXCLUIR MINHA CONTA',confirmed:true,reason:motivo}});
      if(error){let text=error.message||'Não foi possível excluir a conta.';try{if(error.context&&typeof error.context.clone==='function'){const j=await error.context.clone().json();text=j?.error||text}}catch(_){}throw new Error(text)}
      if(!data?.ok||!data?.deleted)throw new Error(data?.error||'A exclusão não foi confirmada pelo servidor.');
      closeDelete();clearDevice(user.id);try{await sb.auth.signOut({scope:'local'})}catch(_){}
      alert('Conta excluída com sucesso. O login desta conta foi removido.');
      try{location.href=location.pathname+'?conta_excluida=1'}catch(_){location.reload()}
    }catch(e){console.error('EDIFIQ exclusão imediata 61',e);setMsg(e?.message||'Não foi possível excluir a conta.');if(btn){btn.disabled=false;btn.textContent='Excluir conta agora'}}
  };
  window.solicitarExclusaoConta14=window.excluirContaAgora61;
  const css=document.createElement('style');css.id='edAccountDelete61Style';css.textContent=`.ed61Warn{border-color:#fda29b!important}.ed61Grid{display:grid;gap:12px}.ed61Grid label{display:block;font-weight:700}.ed61Grid input,.ed61Grid textarea{width:100%;box-sizing:border-box;margin-top:6px}.ed61Check{display:flex!important;align-items:flex-start;gap:9px;font-weight:500!important}.ed61Check input{width:auto!important;margin-top:4px!important}`;document.head.appendChild(css);
})();