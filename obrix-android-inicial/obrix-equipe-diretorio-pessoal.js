(()=>{
  'use strict';
  if(window.__OBRIX_FUNCIONARIOS_PESSOAL_V2)return;window.__OBRIX_FUNCIONARIOS_PESSOAL_V2=true;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const txt=v=>String(v??'').trim()||'Não informado';
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  function funcs(){try{return Array.isArray(funcionarios)?funcionarios:[]}catch(_){return Array.isArray(window.funcionarios)?window.funcionarios:[]}}
  function obrasList(){try{return Array.isArray(obras)?obras:[]}catch(_){return Array.isArray(window.obras)?window.obras:[]}}
  function achar(id){return funcs().find(f=>String(f.id)===String(id))||null}
  function obraNome(id){return obrasList().find(o=>String(o.id)===String(id))?.nome||'Sem obra vinculada'}
  function tipoPagamento(v){return({diaria:'Por diária',semana:'Por semana',quinzena:'Por quinzena',mes:'Por mês'})[String(v||'diaria')]||txt(v)}
  function campo(rotulo,valor){return `<div class="obrix-pessoal-campo"><small>${esc(rotulo)}</small><b>${esc(txt(valor))}</b></div>`}

  function abrirEditar(f){
    document.querySelector('.obrix-pessoal-editar-back')?.remove();
    const ops='<option value="">Sem obra vinculada</option>'+obrasList().map(o=>`<option value="${esc(o.id)}" ${String(o.id)===String(f.obra_id||'')?'selected':''}>${esc(o.nome||'Obra')}</option>`).join('');
    const back=document.createElement('div');back.className='modalBack obrix-pessoal-editar-back';
    back.innerHTML=`<div class="modal obrix-pessoal-editar"><div class="obrix-pessoal-head"><div><h2>Editar cadastro</h2><p class="muted">${esc(f.nome||'Funcionário')}</p></div><button type="button" class="obrix-pessoal-x" aria-label="Fechar">×</button></div>
      <label>Nome completo</label><input class="nome" value="${esc(f.nome||'')}">
      <label>Cargo / Função</label><input class="cargo" value="${esc(f.cargo||'')}">
      <label>CPF</label><input class="cpf" inputmode="numeric" value="${esc(f.cpf||'')}">
      <label>Telefone</label><input class="telefone" inputmode="tel" value="${esc(f.telefone||'')}">
      <label>E-mail</label><input class="email" type="email" value="${esc(f.email||'')}">
      <label>Endereço</label><input class="endereco" value="${esc(f.endereco||'')}">
      <label>Obra vinculada</label><select class="obra">${ops}</select>
      <label>Banco</label><input class="banco" value="${esc(f.banco||'')}">
      <label>Agência</label><input class="agencia" value="${esc(f.agencia||'')}">
      <label>Conta</label><input class="conta" value="${esc(f.conta||'')}">
      <label>Tipo de conta</label><input class="tipoConta" value="${esc(f.tipo_conta||'')}">
      <label>Tipo de chave Pix</label><input class="pixTipo" value="${esc(f.pix_tipo||'')}">
      <label>Chave Pix</label><input class="pixChave" value="${esc(f.pix_chave||'')}">
      <label style="display:flex;gap:8px;align-items:center"><input class="ativo" type="checkbox" style="width:auto" ${f.ativo===false?'':'checked'}> Funcionário ativo</label>
      <label>Observações</label><textarea class="obs" rows="3">${esc(f.observacoes||'')}</textarea>
      <div class="modalActions"><button class="btn cancelar" type="button">Cancelar</button><button class="btn salvar" type="button">Salvar cadastro</button></div></div>`;
    document.body.appendChild(back);
    const fechar=()=>back.remove();
    back.querySelector('.obrix-pessoal-x').onclick=fechar;
    back.querySelector('.cancelar').onclick=fechar;
    back.addEventListener('click',e=>{if(e.target===back)fechar()});
    back.querySelector('.salvar').onclick=async()=>{
      const nome=back.querySelector('.nome').value.trim();if(!nome)return alert('Informe o nome do funcionário.');
      const btn=back.querySelector('.salvar');btn.disabled=true;
      try{
        const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile();
        if(!p?.empresa_id)throw new Error('Empresa não identificada.');
        const payload={nome,cargo:back.querySelector('.cargo').value.trim()||null,cpf:back.querySelector('.cpf').value.trim()||null,telefone:back.querySelector('.telefone').value.trim()||null,email:back.querySelector('.email').value.trim()||null,endereco:back.querySelector('.endereco').value.trim()||null,obra_id:back.querySelector('.obra').value||null,banco:back.querySelector('.banco').value.trim()||null,agencia:back.querySelector('.agencia').value.trim()||null,conta:back.querySelector('.conta').value.trim()||null,tipo_conta:back.querySelector('.tipoConta').value.trim()||null,pix_tipo:back.querySelector('.pixTipo').value.trim()||null,pix_chave:back.querySelector('.pixChave').value.trim()||null,ativo:back.querySelector('.ativo').checked,observacoes:back.querySelector('.obs').value.trim()||null,atualizado_em:new Date().toISOString()};
        const {data,error}=await sb.from('funcionarios').update(payload).eq('id',f.id).eq('empresa_id',p.empresa_id).select('id');
        if(error)throw error;if(!data?.length)throw new Error('A alteração não foi confirmada.');
        back.remove();await window.OBRIX_EQUIPE?.refresh?.();abrirDiretorio();
      }catch(e){alert('Não foi possível salvar: '+(e.message||e))}finally{btn.disabled=false}
    };
  }

  function abrirDetalhe(f){
    document.querySelector('.obrix-pessoal-detalhe-back')?.remove();
    const valorDiaria=Number(f.valor_diaria||0)>0?money(f.valor_diaria):'Não informado';
    const salario=Number(f.salario_mensal||0)>0?money(f.salario_mensal):'Não informado';
    const back=document.createElement('div');back.className='modalBack obrix-pessoal-detalhe-back';
    back.innerHTML=`<div class="modal obrix-pessoal-modal obrix-pessoal-detalhe"><div class="obrix-pessoal-head"><div><h2>${esc(f.nome||'Funcionário')}</h2><p class="muted">Informações do funcionário</p></div><button type="button" class="obrix-pessoal-x" aria-label="Fechar">×</button></div><div class="obrix-pessoal-grid">
      ${campo('Nome completo',f.nome)}
      ${campo('Cargo / Função',f.cargo||f.funcao)}
      ${campo('Status',f.ativo===false?'Inativo':'Ativo')}
      ${campo('Obra vinculada',obraNome(f.obra_id))}
      ${campo('Tipo de pagamento',tipoPagamento(f.tipo_pagamento))}
      ${campo('Valor da diária',valorDiaria)}
      ${campo('Salário mensal',salario)}
      ${campo('Dia de pagamento',f.dia_pagamento)}
      ${campo('CPF',f.cpf)}
      ${campo('Telefone',f.telefone)}
      ${campo('E-mail',f.email)}
      ${campo('Endereço',f.endereco)}
      ${campo('Banco',f.banco)}
      ${campo('Agência',f.agencia)}
      ${campo('Conta',f.conta)}
      ${campo('Tipo de conta',f.tipo_conta)}
      ${campo('Tipo de chave Pix',f.pix_tipo)}
      ${campo('Chave Pix',f.pix_chave)}
      ${campo('Observações',f.observacoes)}
    </div><button type="button" class="btn obrix-pessoal-editar-cadastro-btn">Editar cadastro</button></div>`;
    document.body.appendChild(back);
    back.querySelector('.obrix-pessoal-x').onclick=()=>back.remove();
    back.querySelector('.obrix-pessoal-editar-cadastro-btn').onclick=()=>{back.remove();abrirEditar(f)};
    back.addEventListener('click',e=>{if(e.target===back)back.remove()});
  }

  function abrirDiretorio(){
    document.querySelector('.obrix-diretorio-back')?.remove();
    document.querySelector('.obrix-pessoal-detalhe-back')?.remove();
    const lista=funcs().slice().sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
    const back=document.createElement('div');back.className='modalBack obrix-diretorio-back';
    back.innerHTML=`<div class="modal obrix-pessoal-modal"><div class="obrix-pessoal-head"><div><h2>Funcionários</h2><p class="muted">Toque em um funcionário para consultar as informações.</p></div><button type="button" class="obrix-pessoal-x" aria-label="Fechar">×</button></div><div class="obrix-pessoal-lista">${lista.length?lista.map(f=>`<button type="button" class="obrix-pessoal-item" data-funcionario-id="${esc(f.id)}"><span>${esc(f.nome||'Funcionário')}</span><span class="seta">›</span></button>`).join(''):'<div class="card muted">Nenhum funcionário cadastrado.</div>'}</div></div>`;
    document.body.appendChild(back);
    back.querySelector('.obrix-pessoal-x').onclick=()=>back.remove();
    back.addEventListener('click',e=>{if(e.target===back)back.remove()});
    back.querySelectorAll('[data-funcionario-id]').forEach(btn=>btn.onclick=()=>{const f=achar(btn.dataset.funcionarioId);if(f)abrirDetalhe(f)});
  }

  function bind(){
    const btn=document.querySelector('#equipe .obrix-equipe-controles [data-cmd="lista"]');if(!btn)return false;
    btn.onclick=abrirDiretorio;btn.dataset.obrixPessoal='2';return true;
  }

  const css=document.createElement('style');css.id='obrixPessoalConsultaV2';css.textContent=`
    .obrix-pessoal-modal{width:min(720px,100%);padding:18px;max-height:92vh;overflow:auto}
    .obrix-pessoal-detalhe-back,.obrix-pessoal-editar-back{z-index:10040}
    .obrix-pessoal-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}.obrix-pessoal-head h2{margin:0 0 4px}.obrix-pessoal-head p{margin:0}
    .obrix-pessoal-x{border:0;background:transparent;color:inherit;font-size:32px;line-height:1;padding:2px 8px}
    .obrix-pessoal-lista{display:grid;gap:9px}
    .obrix-pessoal-item{width:100%;border:1px solid #e2e8f0;border-radius:14px;background:#fff;color:#0f172a;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px;text-align:left;font:inherit;font-size:17px;font-weight:900}
    .obrix-pessoal-item .seta{font-size:28px;line-height:1;color:#64748b}
    .obrix-pessoal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
    .obrix-pessoal-campo{background:#f8fafc;border:1px solid #eef2f7;border-radius:11px;padding:10px;min-width:0}.obrix-pessoal-campo small{display:block;color:#64748b;font-weight:800;margin-bottom:4px}.obrix-pessoal-campo b{display:block;overflow-wrap:anywhere}
    .obrix-pessoal-editar-cadastro-btn{width:100%;margin-top:14px;min-height:50px}
    .obrix-pessoal-editar{width:min(620px,100%);max-height:92vh;overflow:auto}.obrix-pessoal-editar label{display:block;font-weight:800;margin-top:8px}.obrix-pessoal-editar input,.obrix-pessoal-editar select,.obrix-pessoal-editar textarea{width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:10px;margin:5px 0 9px;font:inherit}.obrix-pessoal-editar textarea{resize:vertical}
    html[data-theme="dark"] .obrix-pessoal-item,body.dark .obrix-pessoal-item{background:#0f172a;color:#f8fafc;border-color:#334155}
    html[data-theme="dark"] .obrix-pessoal-campo,body.dark .obrix-pessoal-campo{background:#111827;border-color:#334155}
    html[data-theme="dark"] .obrix-pessoal-editar,body.dark .obrix-pessoal-editar{background:#0f172a;color:#f8fafc}html[data-theme="dark"] .obrix-pessoal-editar input,html[data-theme="dark"] .obrix-pessoal-editar select,html[data-theme="dark"] .obrix-pessoal-editar textarea,body.dark .obrix-pessoal-editar input,body.dark .obrix-pessoal-editar select,body.dark .obrix-pessoal-editar textarea{background:#111827;color:#f8fafc;border-color:#334155}
    @media(max-width:620px){.obrix-pessoal-modal{padding:14px}.obrix-pessoal-grid{grid-template-columns:1fr}.obrix-pessoal-item{padding:14px;font-size:16px}}
  `;document.head.appendChild(css);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(bind,100);setTimeout(bind,600)});else{setTimeout(bind,100);setTimeout(bind,600)}
  window.OBRIX_FUNCIONARIOS_PESSOAL={open:abrirDiretorio,bind,openDetail:abrirDetalhe,edit:abrirEditar};
})();