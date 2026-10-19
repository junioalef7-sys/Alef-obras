(()=>{
  'use strict';

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const txt=v=>String(v??'').trim()||'Não informado';

  function funcs(){
    try{return Array.isArray(funcionarios)?funcionarios:[]}catch(_){return[]}
  }
  function obrasList(){
    try{return Array.isArray(obras)?obras:[]}catch(_){return[]}
  }
  function obraNome(id){return obrasList().find(o=>String(o.id)===String(id))?.nome||'Sem obra vinculada'}
  function achar(id){return funcs().find(f=>String(f.id)===String(id))||null}

  function campo(rotulo,valor){return `<div class="obrix-pessoal-campo"><small>${esc(rotulo)}</small><b>${esc(txt(valor))}</b></div>`}

  function fecharOutros(atual){
    document.querySelectorAll('.obrix-pessoal-item.aberto').forEach(item=>{
      if(item===atual)return;
      item.classList.remove('aberto');
      item.querySelector('.obrix-pessoal-detalhes')?.setAttribute('hidden','');
      item.querySelector('.obrix-pessoal-toggle')?.setAttribute('aria-expanded','false');
    });
  }

  function abrirEditar(f,voltar){
    document.querySelector('.obrix-pessoal-editar-back')?.remove();
    const ops='<option value="">Sem obra vinculada</option>'+obrasList().map(o=>`<option value="${esc(o.id)}" ${String(o.id)===String(f.obra_id||'')?'selected':''}>${esc(o.nome||'Obra')}</option>`).join('');
    const back=document.createElement('div');back.className='modalBack obrix-pessoal-editar-back';
    back.innerHTML=`<div class="modal obrix-pessoal-editar"><h2>Dados pessoais</h2><p class="muted">${esc(f.nome||'Funcionário')}</p>
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
      <div class="modalActions"><button class="btn cancelar" type="button">Cancelar</button><button class="btn salvar" type="button">Salvar dados</button></div></div>`;
    document.body.appendChild(back);
    back.querySelector('.cancelar').onclick=()=>{back.remove();voltar?.()};
    back.querySelector('.salvar').onclick=async()=>{
      const nome=back.querySelector('.nome').value.trim();
      if(!nome)return alert('Informe o nome do funcionário.');
      const btn=back.querySelector('.salvar');btn.disabled=true;
      try{
        const sb=await OBRIX_BACKEND.init();
        const eid=(typeof profile!=='undefined'&&profile?.empresa_id)?profile.empresa_id:null;
        if(!eid)throw new Error('Empresa não identificada.');
        const payload={
          nome,
          cargo:back.querySelector('.cargo').value.trim()||null,
          cpf:back.querySelector('.cpf').value.trim()||null,
          telefone:back.querySelector('.telefone').value.trim()||null,
          email:back.querySelector('.email').value.trim()||null,
          endereco:back.querySelector('.endereco').value.trim()||null,
          obra_id:back.querySelector('.obra').value||null,
          banco:back.querySelector('.banco').value.trim()||null,
          agencia:back.querySelector('.agencia').value.trim()||null,
          conta:back.querySelector('.conta').value.trim()||null,
          tipo_conta:back.querySelector('.tipoConta').value.trim()||null,
          pix_tipo:back.querySelector('.pixTipo').value.trim()||null,
          pix_chave:back.querySelector('.pixChave').value.trim()||null,
          ativo:back.querySelector('.ativo').checked,
          observacoes:back.querySelector('.obs').value.trim()||null,
          atualizado_em:new Date().toISOString()
        };
        const {data,error}=await sb.from('funcionarios').update(payload).eq('id',f.id).eq('empresa_id',eid).select('id');
        if(error)throw error;
        if(!data?.length)throw new Error('A alteração não foi confirmada.');
        back.remove();
        await window.OBRIX_EQUIPE?.refresh?.();
        abrirDiretorio();
      }catch(e){alert('Não foi possível salvar: '+(e.message||e))}
      finally{btn.disabled=false}
    };
  }

  function itemHtml(f){
    return `<article class="obrix-pessoal-item" data-id="${esc(f.id)}">
      <button type="button" class="obrix-pessoal-toggle" aria-expanded="false">
        <span>${esc(f.nome||'Funcionário')}</span><span class="seta">›</span>
      </button>
      <div class="obrix-pessoal-detalhes" hidden>
        <div class="obrix-pessoal-grid">
          ${campo('Nome completo',f.nome)}
          ${campo('Cargo / Função',f.cargo)}
          ${campo('Status',f.ativo===false?'Inativo':'Ativo')}
          ${campo('Obra vinculada',obraNome(f.obra_id))}
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
        </div>
        <button type="button" class="btn obrix-pessoal-editar-btn" data-id="${esc(f.id)}">Editar dados pessoais</button>
      </div>
    </article>`;
  }

  function abrirDiretorio(){
    document.querySelector('.obrix-diretorio-back')?.remove();
    const lista=funcs().slice().sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
    const back=document.createElement('div');back.className='modalBack obrix-diretorio-back';
    back.innerHTML=`<div class="modal obrix-pessoal-modal"><div class="obrix-pessoal-head"><div><h2>Funcionários</h2><p class="muted">Toque no funcionário para ver os dados pessoais.</p></div><button type="button" class="obrix-pessoal-x" aria-label="Fechar">×</button></div><div class="obrix-pessoal-lista">${lista.length?lista.map(itemHtml).join(''):'<div class="card muted">Nenhum funcionário cadastrado.</div>'}</div></div>`;
    document.body.appendChild(back);
    back.querySelector('.obrix-pessoal-x').onclick=()=>back.remove();
    back.addEventListener('click',e=>{if(e.target===back)back.remove()});
    back.querySelectorAll('.obrix-pessoal-toggle').forEach(btn=>btn.onclick=()=>{
      const item=btn.closest('.obrix-pessoal-item'),det=item.querySelector('.obrix-pessoal-detalhes'),abrir=!item.classList.contains('aberto');
      fecharOutros(item);
      item.classList.toggle('aberto',abrir);
      det.hidden=!abrir;
      btn.setAttribute('aria-expanded',abrir?'true':'false');
    });
    back.querySelectorAll('.obrix-pessoal-editar-btn').forEach(btn=>btn.onclick=()=>{
      const f=achar(btn.dataset.id);if(!f)return;
      back.remove();abrirEditar(f,abrirDiretorio);
    });
  }

  function bind(){
    const btn=document.querySelector('#equipe .obrix-equipe-controles [data-cmd="lista"]');
    if(!btn)return false;
    btn.onclick=abrirDiretorio;
    btn.dataset.obrixPessoal='1';
    return true;
  }

  const css=document.createElement('style');
  css.textContent=`
    .obrix-pessoal-modal{width:min(720px,100%);padding:18px}
    .obrix-pessoal-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}
    .obrix-pessoal-head h2{margin:0 0 4px}.obrix-pessoal-head p{margin:0}
    .obrix-pessoal-x{border:0;background:transparent;color:inherit;font-size:30px;line-height:1;padding:2px 8px}
    .obrix-pessoal-lista{display:flex;flex-direction:column;gap:9px}
    .obrix-pessoal-item{border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;background:#fff;color:#0f172a}
    .obrix-pessoal-toggle{width:100%;border:0;background:transparent;color:inherit;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px;text-align:left;font:inherit;font-size:17px;font-weight:900}
    .obrix-pessoal-toggle .seta{font-size:28px;line-height:1;color:#64748b;transition:transform .18s ease}.obrix-pessoal-item.aberto .seta{transform:rotate(90deg)}
    .obrix-pessoal-detalhes{border-top:1px solid #e2e8f0;padding:14px}.obrix-pessoal-detalhes[hidden]{display:none!important}
    .obrix-pessoal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
    .obrix-pessoal-campo{background:#f8fafc;border:1px solid #eef2f7;border-radius:11px;padding:10px;min-width:0}
    .obrix-pessoal-campo small{display:block;color:#64748b;font-weight:800;margin-bottom:4px}.obrix-pessoal-campo b{display:block;overflow-wrap:anywhere}
    .obrix-pessoal-editar-btn{width:100%;margin-top:12px}
    .obrix-pessoal-editar textarea{width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:10px;margin:5px 0 12px;font:inherit;resize:vertical}
    @media(max-width:620px){.obrix-pessoal-modal{padding:14px}.obrix-pessoal-grid{grid-template-columns:1fr}.obrix-pessoal-toggle{padding:14px;font-size:16px}}
    html[data-theme="dark"] .obrix-pessoal-item,body.dark .obrix-pessoal-item{background:#0f172a;color:#f8fafc;border-color:#334155}
    html[data-theme="dark"] .obrix-pessoal-detalhes,body.dark .obrix-pessoal-detalhes{border-color:#334155}
    html[data-theme="dark"] .obrix-pessoal-campo,body.dark .obrix-pessoal-campo{background:#111827;border-color:#334155}
  `;
  document.head.appendChild(css);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(bind,80);setTimeout(bind,350)});else{setTimeout(bind,80);setTimeout(bind,350)}
  const obs=new MutationObserver(()=>{const b=document.querySelector('#equipe .obrix-equipe-controles [data-cmd="lista"]');if(b&&b.dataset.obrixPessoal!=='1')bind()});
  if(document.body)obs.observe(document.body,{childList:true,subtree:true});else document.addEventListener('DOMContentLoaded',()=>obs.observe(document.body,{childList:true,subtree:true}));
  window.OBRIX_FUNCIONARIOS_PESSOAL={open:abrirDiretorio,bind};
})();