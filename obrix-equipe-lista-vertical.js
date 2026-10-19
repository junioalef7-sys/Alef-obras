(()=>{
  'use strict';

  function getFuncionarios(){
    try{return (typeof funcionarios!=='undefined'&&Array.isArray(funcionarios))?funcionarios:[]}catch(_){return[]}
  }

  function fecharCard(card){
    const detalhes=card.querySelector(':scope > .obrix-func-detalhes');
    const toggle=card.querySelector(':scope > .obrix-func-topo .obrix-func-toggle');
    if(!detalhes||!toggle)return;
    detalhes.hidden=true;
    toggle.setAttribute('aria-expanded','false');
    card.classList.remove('obrix-func-aberto');
  }

  function abrirCard(card){
    const box=document.getElementById('listaEquipe');
    box?.querySelectorAll('.obrix-func-aberto').forEach(outro=>{if(outro!==card)fecharCard(outro)});
    const detalhes=card.querySelector(':scope > .obrix-func-detalhes');
    const toggle=card.querySelector(':scope > .obrix-func-topo .obrix-func-toggle');
    if(!detalhes||!toggle)return;
    detalhes.hidden=false;
    toggle.setAttribute('aria-expanded','true');
    card.classList.add('obrix-func-aberto');
  }

  function registrarDiaria(id){
    if(typeof window.equipeAcao!=='function')return alert('Ação de diária indisponível. Atualize a página e tente novamente.');
    window.equipeAcao(String(id),'diaria');
  }

  function abrirSeletorDiaria(){
    const funcs=getFuncionarios().filter(f=>f.ativo!==false);
    if(!funcs.length)return alert('Cadastre ou ative um funcionário primeiro.');
    const back=document.createElement('div');
    back.className='modalBack';
    back.innerHTML=`<div class="modal obrix-modal-diaria-rapida"><h2>Registrar diária</h2><p class="muted">Escolha o funcionário.</p><label>Funcionário</label><select class="obrix-escolher-funcionario">${funcs.map(f=>`<option value="${String(f.id).replace(/"/g,'&quot;')}">${String(f.nome||'Funcionário').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</option>`).join('')}</select><div class="modalActions"><button class="btn cancelar" type="button">Cancelar</button><button class="btn continuar" type="button">Continuar</button></div></div>`;
    document.body.appendChild(back);
    back.querySelector('.cancelar').onclick=()=>back.remove();
    back.querySelector('.continuar').onclick=()=>{const id=back.querySelector('.obrix-escolher-funcionario').value;back.remove();registrarDiaria(id)};
  }

  function configurarTopo(){
    const sec=document.getElementById('equipe');
    const head=sec?.querySelector('.sectionHead');
    if(!head)return;
    let actions=head.querySelector('.obrix-equipe-head-actions');
    if(!actions){
      const novo=head.querySelector(':scope > .btn');
      actions=document.createElement('div');
      actions.className='obrix-equipe-head-actions';
      if(novo)actions.appendChild(novo);
      const diaria=document.createElement('button');
      diaria.type='button';
      diaria.className='btn obrix-diaria-topo';
      diaria.textContent='Registrar diária';
      diaria.onclick=abrirSeletorDiaria;
      actions.insertBefore(diaria,actions.firstChild);
      head.appendChild(actions);
    }
    if(!sec.querySelector('.obrix-equipe-ajuda')){
      const ajuda=document.createElement('div');
      ajuda.className='obrix-equipe-ajuda muted';
      ajuda.textContent='Registrar diária fica sempre à mão. Toque no nome do funcionário para ver valores, vale, bônus, pagamento e cadastro.';
      head.insertAdjacentElement('afterend',ajuda);
    }
  }

  function prepararDetalhes(detalhes){
    const titulo=detalhes.querySelector(':scope > h3');
    if(titulo)titulo.classList.add('obrix-titulo-original');
    const acoes=Array.from(detalhes.querySelectorAll(':scope > .actions')).find(el=>!el.classList.contains('gestaoFunc'));
    if(acoes){
      acoes.classList.add('obrix-acoes-financeiras');
      acoes.querySelectorAll('button').forEach(btn=>{
        const t=(btn.textContent||'').trim().toLowerCase();
        if(t.includes('registrar diária')||t.includes('registrar diaria'))btn.classList.add('obrix-acao-diaria-duplicada');
        if(t==='pagar')btn.classList.add('obrix-acao-pagar');
      });
    }
    const gestao=detalhes.querySelector(':scope > .gestaoFunc');
    if(gestao&&!detalhes.querySelector(':scope > .obrix-gerenciar-label')){
      const label=document.createElement('div');
      label.className='obrix-gerenciar-label';
      label.textContent='Gerenciar funcionário';
      gestao.insertAdjacentElement('beforebegin',label);
    }
  }

  function organizarCard(card,index){
    const f=getFuncionarios()[index]||null;
    if(!f)return;

    if(card.dataset.obrixEquipeOrganizada==='1'){
      const detalhes=card.querySelector(':scope > .obrix-func-detalhes');
      if(detalhes){
        Array.from(card.children).forEach(el=>{if(!el.classList.contains('obrix-func-topo')&&el!==detalhes)detalhes.appendChild(el)});
        prepararDetalhes(detalhes);
      }
      return;
    }

    const nome=f.nome||card.querySelector('h3')?.textContent?.trim()||'Funcionário';
    const detalhes=document.createElement('div');
    detalhes.className='obrix-func-detalhes';
    detalhes.hidden=true;
    while(card.firstChild)detalhes.appendChild(card.firstChild);
    prepararDetalhes(detalhes);

    const topo=document.createElement('div');
    topo.className='obrix-func-topo';

    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='obrix-func-toggle';
    toggle.setAttribute('aria-expanded','false');
    toggle.innerHTML=`<span class="obrix-func-nome"></span><span class="obrix-func-seta" aria-hidden="true">›</span>`;
    toggle.querySelector('.obrix-func-nome').textContent=nome;
    toggle.onclick=()=>card.classList.contains('obrix-func-aberto')?fecharCard(card):abrirCard(card);

    const diaria=document.createElement('button');
    diaria.type='button';
    diaria.className='obrix-func-diaria';
    diaria.textContent='Registrar diária';
    diaria.onclick=e=>{e.stopPropagation();registrarDiaria(f.id)};

    topo.append(toggle,diaria);
    card.classList.add('obrix-func-item');
    card.dataset.obrixEquipeOrganizada='1';
    card.append(topo,detalhes);
  }

  function aplicar(){
    configurarTopo();
    const box=document.getElementById('listaEquipe');
    if(!box)return;
    Array.from(box.querySelectorAll(':scope > .card.item')).forEach((card,index)=>organizarCard(card,index));
  }

  function instalar(){
    configurarTopo();
    const original=window.renderEquipe;
    if(typeof original==='function'&&!original.__obrixEquipeOrganizada){
      const render=function(){const r=original.apply(this,arguments);requestAnimationFrame(aplicar);return r};
      render.__obrixEquipeOrganizada=true;
      window.renderEquipe=render;
    }
    const box=document.getElementById('listaEquipe');
    if(box){
      let pendente=false;
      new MutationObserver(()=>{if(pendente)return;pendente=true;requestAnimationFrame(()=>{pendente=false;aplicar()})}).observe(box,{childList:true,subtree:true});
    }
    aplicar();
  }

  const css=document.createElement('style');
  css.textContent=`
    #equipe .sectionHead{align-items:center}
    .obrix-equipe-head-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
    .obrix-diaria-topo{background:#0f172a!important;color:#fff!important}
    .obrix-equipe-ajuda{font-size:13px;line-height:1.4;margin:-4px 0 14px}
    #listaEquipe{display:flex;flex-direction:column;gap:10px}
    #listaEquipe .card.item.obrix-func-item{padding:0;margin:0;overflow:hidden}
    .obrix-func-topo{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:stretch;gap:8px;padding:8px}
    .obrix-func-toggle{min-width:0;border:0;background:transparent;color:inherit;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 10px;text-align:left;font:inherit;font-weight:900;font-size:17px;border-radius:12px}
    .obrix-func-toggle:active{background:rgba(100,116,139,.08)}
    .obrix-func-nome{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .obrix-func-seta{font-size:27px;line-height:1;font-weight:500;transition:transform .18s ease;color:#64748b}
    .obrix-func-aberto .obrix-func-seta{transform:rotate(90deg)}
    .obrix-func-diaria{border:0;border-radius:11px;padding:10px 14px;font-weight:900;background:#0f172a;color:#fff;white-space:nowrap}
    .obrix-func-detalhes{border-top:1px solid #e2e8f0;padding:14px 16px 16px}
    .obrix-func-detalhes[hidden]{display:none!important}
    .obrix-titulo-original{display:none!important}
    .obrix-func-detalhes>.muted{margin-bottom:10px;font-size:13px}
    .obrix-func-detalhes>.grid{margin-top:0;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}
    .obrix-func-detalhes>.grid .mini{padding:10px 9px;min-width:0}
    .obrix-func-detalhes>.grid .mini small{font-size:11px;line-height:1.25}
    .obrix-func-detalhes>.grid .mini b{display:block;margin-top:4px;font-size:14px;overflow-wrap:anywhere}
    .obrix-acoes-financeiras{display:grid!important;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
    .obrix-acoes-financeiras button{min-width:0!important;width:100%;padding:10px 8px!important}
    .obrix-acao-diaria-duplicada{display:none!important}
    .obrix-acao-pagar{background:#0f172a!important;color:#fff!important;border-color:#0f172a!important}
    .obrix-gerenciar-label{font-size:12px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin:16px 0 7px;padding-top:12px;border-top:1px solid #e2e8f0}
    .gestaoFunc{margin-top:0!important;display:grid!important;grid-template-columns:repeat(3,1fr);gap:7px}
    .gestaoFunc button{min-width:0!important;padding:8px!important;font-size:12px}
    .obrix-modal-diaria-rapida select{width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:10px;margin:5px 0 12px;font-size:16px}
    @media(max-width:700px){
      #equipe .sectionHead{align-items:flex-start;flex-direction:column}
      .obrix-equipe-head-actions{width:100%;display:grid;grid-template-columns:1fr 1fr}
      .obrix-equipe-head-actions .btn{width:100%;padding:11px 8px}
      .obrix-func-topo{grid-template-columns:minmax(0,1fr) auto;padding:6px}
      .obrix-func-toggle{font-size:16px;padding:11px 8px}
      .obrix-func-diaria{padding:9px 10px;font-size:13px}
      .obrix-func-detalhes{padding:12px}
      .obrix-func-detalhes>.grid{grid-template-columns:1fr 1fr}
      .obrix-acoes-financeiras{grid-template-columns:1fr}
      .gestaoFunc{grid-template-columns:repeat(3,1fr)}
    }
    @media(max-width:390px){
      .obrix-func-topo{grid-template-columns:1fr}
      .obrix-func-diaria{width:100%}
      .gestaoFunc{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(css);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,0));
  else setTimeout(instalar,0);
})();
