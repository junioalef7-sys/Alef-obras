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
    </div></div>`;
    document.body.appendChild(back);
    back.querySelector('.obrix-pessoal-x').onclick=()=>back.remove();
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
    .obrix-pessoal-detalhe-back{z-index:10040}
    .obrix-pessoal-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}.obrix-pessoal-head h2{margin:0 0 4px}.obrix-pessoal-head p{margin:0}
    .obrix-pessoal-x{border:0;background:transparent;color:inherit;font-size:32px;line-height:1;padding:2px 8px}
    .obrix-pessoal-lista{display:grid;gap:9px}
    .obrix-pessoal-item{width:100%;border:1px solid #e2e8f0;border-radius:14px;background:#fff;color:#0f172a;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px;text-align:left;font:inherit;font-size:17px;font-weight:900}
    .obrix-pessoal-item .seta{font-size:28px;line-height:1;color:#64748b}
    .obrix-pessoal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
    .obrix-pessoal-campo{background:#f8fafc;border:1px solid #eef2f7;border-radius:11px;padding:10px;min-width:0}.obrix-pessoal-campo small{display:block;color:#64748b;font-weight:800;margin-bottom:4px}.obrix-pessoal-campo b{display:block;overflow-wrap:anywhere}
    html[data-theme="dark"] .obrix-pessoal-item,body.dark .obrix-pessoal-item{background:#0f172a;color:#f8fafc;border-color:#334155}
    html[data-theme="dark"] .obrix-pessoal-campo,body.dark .obrix-pessoal-campo{background:#111827;border-color:#334155}
    @media(max-width:620px){.obrix-pessoal-modal{padding:14px}.obrix-pessoal-grid{grid-template-columns:1fr}.obrix-pessoal-item{padding:14px;font-size:16px}}
  `;document.head.appendChild(css);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(bind,100);setTimeout(bind,600)});else{setTimeout(bind,100);setTimeout(bind,600)}
  window.OBRIX_FUNCIONARIOS_PESSOAL={open:abrirDiretorio,bind,openDetail:abrirDetalhe};
})();