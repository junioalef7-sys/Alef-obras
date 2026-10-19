(()=>{
  'use strict';

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let filtro='todos';

  function getFuncionarios(){
    try{return (typeof funcionarios!=='undefined'&&Array.isArray(funcionarios))?funcionarios:[]}catch(_){return[]}
  }
  function getObras(){
    try{return (typeof obras!=='undefined'&&Array.isArray(obras))?obras:[]}catch(_){return[]}
  }
  function acharFunc(id){return getFuncionarios().find(f=>String(f.id)===String(id))||null}
  function nomeObra(id){return getObras().find(o=>String(o.id)===String(id))?.nome||'Sem obra vinculada'}

  function fecharCard(card){
    const detalhes=card.querySelector(':scope > .obrix-func-detalhes');
    const toggle=card.querySelector(':scope > .obrix-func-topo .obrix-func-toggle');
    if(!detalhes||!toggle)return;
    detalhes.hidden=true;
    toggle.setAttribute('aria-expanded','false');
    card.classList.remove('obrix-func-aberto');
  }

  function abrirCard(card){
    document.querySelectorAll('#listaEquipe .obrix-func-aberto').forEach(outro=>{if(outro!==card)fecharCard(outro)});
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

  async function registrarFalta(id){
    const f=acharFunc(id);if(!f)return alert('Funcionário não encontrado.');
    const ops=getObras().map(o=>`<option value="${esc(o.id)}">${esc(o.nome||'Obra')}</option>`).join('');
    const back=document.createElement('div');
    back.className='modalBack';
    back.innerHTML=`<div class="modal obrix-modal-falta"><h2>Registrar falta</h2><p class="muted"><b>${esc(f.nome||'Funcionário')}</b></p><label>Obra</label><select class="obra"><option value="">Sem obra</option>${ops}</select><label>Data</label><input class="data" type="date" value="${new Date().toISOString().slice(0,10)}"><label>Tipo</label><select class="tipo"><option value="false">Falta injustificada</option><option value="true">Falta justificada</option></select><label>Motivo</label><input class="motivo" placeholder="Motivo da falta"><label>Observações</label><input class="obs" placeholder="Observações opcionais"><div class="modalActions"><button class="btn cancelar" type="button">Cancelar</button><button class="btn salvar" type="button">Registrar falta</button></div></div>`;
    document.body.appendChild(back);
    back.querySelector('.cancelar').onclick=()=>back.remove();
    back.querySelector('.salvar').onclick=async()=>{
      const data=back.querySelector('.data').value;
      if(!data)return alert('Informe a data da falta.');
      const salvar=back.querySelector('.salvar');salvar.disabled=true;
      try{
        const sb=await OBRIX_BACKEND.init();
        const eid=(typeof profile!=='undefined'&&profile?.empresa_id)?profile.empresa_id:null;
        if(!eid)throw new Error('Empresa não identificada.');
        const {error}=await sb.from('faltas').insert({
          empresa_id:eid,
          funcionario_id:f.id,
          obra_id:back.querySelector('.obra').value||null,
          data,
          justificada:back.querySelector('.tipo').value==='true',
          motivo:back.querySelector('.motivo').value.trim()||null,
          observacoes:back.querySelector('.obs').value.trim()||null
        });
        if(error)throw error;
        back.remove();
        alert('Falta registrada no histórico.');
      }catch(e){alert('Não foi possível registrar a falta: '+(e.message||e))}
      finally{salvar.disabled=false}
    };
  }

  function clicarGestao(id,classe){
    const card=document.querySelector(`#listaEquipe [data-obrix-func-id="${CSS.escape(String(id))}"]`);
    const btn=card?.querySelector(classe);
    if(!btn)return alert('Ação indisponível. Atualize a página e tente novamente.');
    btn.click();
  }

  function abrirDiretorio(){
    document.querySelector('.obrix-diretorio-back')?.remove();
    const funcs=getFuncionarios().slice().sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
    const back=document.createElement('div');back.className='modalBack obrix-diretorio-back';
    back.innerHTML=`<div class="modal obrix-diretorio"><h2>Funcionários</h2><p class="muted">Somente dados pessoais e cadastrais.</p><div class="obrix-diretorio-lista">${funcs.length?funcs.map(f=>`<article class="obrix-pessoa"><div><h3>${esc(f.nome||'Funcionário')}</h3><p>${esc(f.cargo||'Cargo não informado')}</p><small>${f.ativo===false?'Inativo':'Ativo'} · ${esc(nomeObra(f.obra_id))}</small>${f.observacoes?`<small>${esc(f.observacoes)}</small>`:''}</div><button class="btn editar" type="button" data-id="${esc(f.id)}">Editar cadastro</button></article>`).join(''):'<div class="card muted">Nenhum funcionário cadastrado.</div>'}</div><div class="modalActions"><button class="btn fechar" type="button">Fechar</button></div></div>`;
    document.body.appendChild(back);
    back.querySelector('.fechar').onclick=()=>back.remove();
    back.addEventListener('click',e=>{if(e.target===back)back.remove()});
    back.querySelectorAll('.editar').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id;back.remove();clicarGestao(id,'.editarF')});
  }

  function abrirSeletorGestao(tipo){
    const funcs=getFuncionarios().slice().sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
    if(!funcs.length)return alert('Nenhum funcionário cadastrado.');
    const back=document.createElement('div');back.className='modalBack';
    const titulo=tipo==='toggle'?'Ativar / Desativar':'Excluir funcionário';
    back.innerHTML=`<div class="modal"><h2>${titulo}</h2><label>Funcionário</label><select class="func">${funcs.map(f=>`<option value="${esc(f.id)}">${esc(f.nome||'Funcionário')} — ${f.ativo===false?'Inativo':'Ativo'}</option>`).join('')}</select><div class="modalActions"><button class="btn cancelar" type="button">Cancelar</button><button class="btn continuar" type="button">Continuar</button></div></div>`;
    document.body.appendChild(back);
    back.querySelector('.cancelar').onclick=()=>back.remove();
    back.querySelector('.continuar').onclick=()=>{const id=back.querySelector('.func').value;back.remove();clicarGestao(id,tipo==='toggle'?'.toggleF':'.excluirF')};
  }

  function novoFuncionario(){
    const original=document.querySelector('#equipe .sectionHead > .btn,#equipe .sectionHead .btn');
    if(original)return original.click();
    alert('Cadastro de funcionário indisponível. Atualize a página e tente novamente.');
  }

  async function atualizar(){
    const b=document.querySelector('.obrix-atualizar-equipe');if(b)b.disabled=true;
    try{await window.OBRIX_EQUIPE?.refresh?.()}catch(e){alert('Não foi possível atualizar a equipe: '+(e.message||e))}
    finally{if(b)b.disabled=false;setTimeout(aplicar,0)}
  }

  function aplicarFiltro(){
    const funcs=getFuncionarios();
    document.querySelectorAll('#listaEquipe > .card.item').forEach((card,index)=>{
      const f=acharFunc(card.dataset.obrixFuncId)||funcs[index];
      const mostrar=f&&(filtro==='todos'||(filtro==='ativos'&&f.ativo!==false)||(filtro==='inativos'&&f.ativo===false));
      card.style.display=mostrar?'':'none';
    });
  }

  function montarTopo(){
    const sec=document.getElementById('equipe');if(!sec)return;
    const head=sec.querySelector('.sectionHead');if(head)head.classList.add('obrix-head-original');
    let box=sec.querySelector('.obrix-equipe-controles');
    if(!box){
      box=document.createElement('div');box.className='obrix-equipe-controles';
      box.innerHTML=`<div class="obrix-equipe-botoes"><button class="obrix-cmd" data-cmd="lista" type="button">👥 Funcionários</button><button class="obrix-cmd" data-cmd="toggle" type="button">⏯️ Ativar / Desativar</button><button class="obrix-cmd perigo" data-cmd="excluir" type="button">🗑️ Excluir</button><button class="obrix-cmd destaque" data-cmd="novo" type="button">＋ Funcionário</button></div><div class="obrix-equipe-secundario"><select class="obrix-filtro-equipe" aria-label="Filtrar funcionários"><option value="todos">Todos</option><option value="ativos">Ativos</option><option value="inativos">Inativos</option></select><button class="obrix-cmd obrix-atualizar-equipe" type="button">↻ Atualizar</button></div>`;
      const hero=sec.querySelector('.hero');hero?.insertAdjacentElement('afterend',box);
      box.querySelector('[data-cmd="lista"]').onclick=abrirDiretorio;
      box.querySelector('[data-cmd="toggle"]').onclick=()=>abrirSeletorGestao('toggle');
      box.querySelector('[data-cmd="excluir"]').onclick=()=>abrirSeletorGestao('delete');
      box.querySelector('[data-cmd="novo"]').onclick=novoFuncionario;
      box.querySelector('.obrix-atualizar-equipe').onclick=atualizar;
      box.querySelector('.obrix-filtro-equipe').onchange=e=>{filtro=e.target.value;aplicarFiltro()};
    }
  }

  function prepararDetalhes(detalhes){
    const titulo=detalhes.querySelector(':scope > h3');if(titulo)titulo.classList.add('obrix-titulo-original');
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
      const label=document.createElement('div');label.className='obrix-gerenciar-label';label.textContent='Gerenciar funcionário';gestao.insertAdjacentElement('beforebegin',label);
    }
  }

  function organizarCard(card,index){
    const f=getFuncionarios()[index]||acharFunc(card.dataset.obrixFuncId);if(!f)return;
    card.dataset.obrixFuncId=String(f.id);
    if(card.dataset.obrixEquipeOrganizada==='1'){
      const detalhes=card.querySelector(':scope > .obrix-func-detalhes');
      if(detalhes){Array.from(card.children).forEach(el=>{if(!el.classList.contains('obrix-func-topo')&&el!==detalhes)detalhes.appendChild(el)});prepararDetalhes(detalhes)}
      return;
    }
    const detalhes=document.createElement('div');detalhes.className='obrix-func-detalhes';detalhes.hidden=true;
    while(card.firstChild)detalhes.appendChild(card.firstChild);prepararDetalhes(detalhes);
    const topo=document.createElement('div');topo.className='obrix-func-topo';
    const toggle=document.createElement('button');toggle.type='button';toggle.className='obrix-func-toggle';toggle.setAttribute('aria-expanded','false');toggle.innerHTML='<span class="obrix-func-nome"></span><span class="obrix-func-seta" aria-hidden="true">›</span>';toggle.querySelector('.obrix-func-nome').textContent=f.nome||'Funcionário';toggle.onclick=()=>card.classList.contains('obrix-func-aberto')?fecharCard(card):abrirCard(card);
    const diaria=document.createElement('button');diaria.type='button';diaria.className='obrix-func-rapido diaria';diaria.textContent='Marcar diária';diaria.onclick=e=>{e.stopPropagation();registrarDiaria(f.id)};
    const falta=document.createElement('button');falta.type='button';falta.className='obrix-func-rapido falta';falta.textContent='Falta';falta.onclick=e=>{e.stopPropagation();registrarFalta(f.id)};
    topo.append(toggle,diaria,falta);card.classList.add('obrix-func-item');card.dataset.obrixEquipeOrganizada='1';card.append(topo,detalhes);
  }

  function aplicar(){
    montarTopo();
    const box=document.getElementById('listaEquipe');if(!box)return;
    Array.from(box.querySelectorAll(':scope > .card.item')).forEach((card,index)=>organizarCard(card,index));
    aplicarFiltro();
  }

  function instalar(){
    montarTopo();
    const original=window.renderEquipe;
    if(typeof original==='function'&&!original.__obrixEquipeOrganizada){
      const render=function(){const r=original.apply(this,arguments);requestAnimationFrame(aplicar);return r};render.__obrixEquipeOrganizada=true;window.renderEquipe=render;
    }
    const box=document.getElementById('listaEquipe');
    if(box){let pendente=false;new MutationObserver(()=>{if(pendente)return;pendente=true;requestAnimationFrame(()=>{pendente=false;aplicar()})}).observe(box,{childList:true,subtree:true})}
    aplicar();setTimeout(aplicar,220);
  }

  const css=document.createElement('style');
  css.textContent=`
    #equipe .obrix-head-original{display:none!important}
    .obrix-equipe-controles{margin:0 0 16px}
    .obrix-equipe-botoes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .obrix-equipe-secundario{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
    .obrix-cmd,.obrix-filtro-equipe{width:100%;min-height:58px;border:1px solid #cbd5e1;border-radius:15px;background:#fff;color:#0f172a;font:inherit;font-weight:900;padding:12px;text-align:center}
    .obrix-cmd.destaque{border-color:#c48b18;color:#a66f00}.obrix-cmd.perigo{border-color:#ef4444;color:#dc2626}
    #listaEquipe{display:flex;flex-direction:column;gap:10px}
    #listaEquipe .card.item.obrix-func-item{padding:0;margin:0;overflow:hidden}
    .obrix-func-topo{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:stretch;gap:8px;padding:8px}
    .obrix-func-toggle{min-width:0;border:0;background:transparent;color:inherit;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 10px;text-align:left;font:inherit;font-weight:900;font-size:17px;border-radius:12px}
    .obrix-func-toggle:active{background:rgba(100,116,139,.08)}
    .obrix-func-nome{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.obrix-func-seta{font-size:27px;line-height:1;font-weight:500;transition:transform .18s ease;color:#64748b}.obrix-func-aberto .obrix-func-seta{transform:rotate(90deg)}
    .obrix-func-rapido{border:0;border-radius:11px;padding:10px 13px;font-weight:900;background:#0f172a;color:#fff;white-space:nowrap}.obrix-func-rapido.falta{background:#fff;color:#dc2626;border:1px solid #ef4444}
    .obrix-func-detalhes{border-top:1px solid #e2e8f0;padding:14px 16px 16px}.obrix-func-detalhes[hidden]{display:none!important}.obrix-titulo-original{display:none!important}.obrix-func-detalhes>.muted{margin-bottom:10px;font-size:13px}
    .obrix-func-detalhes>.grid{margin-top:0;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}.obrix-func-detalhes>.grid .mini{padding:10px 9px;min-width:0}.obrix-func-detalhes>.grid .mini small{font-size:11px;line-height:1.25}.obrix-func-detalhes>.grid .mini b{display:block;margin-top:4px;font-size:14px;overflow-wrap:anywhere}
    .obrix-acoes-financeiras{display:grid!important;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.obrix-acoes-financeiras button{min-width:0!important;width:100%;padding:10px 8px!important}.obrix-acao-diaria-duplicada{display:none!important}.obrix-acao-pagar{background:#0f172a!important;color:#fff!important;border-color:#0f172a!important}
    .obrix-gerenciar-label{font-size:12px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin:16px 0 7px;padding-top:12px;border-top:1px solid #e2e8f0}.gestaoFunc{margin-top:0!important;display:grid!important;grid-template-columns:repeat(3,1fr);gap:7px}.gestaoFunc button{min-width:0!important;padding:8px!important;font-size:12px}
    .obrix-diretorio-lista{display:grid;gap:10px}.obrix-pessoa{display:flex;justify-content:space-between;align-items:center;gap:12px;border:1px solid #e2e8f0;border-radius:14px;padding:13px}.obrix-pessoa h3{margin:0 0 4px}.obrix-pessoa p,.obrix-pessoa small{display:block;margin:2px 0;color:#64748b}.obrix-pessoa .editar{flex:0 0 auto}
    @media(max-width:700px){.obrix-equipe-botoes{gap:8px}.obrix-equipe-secundario{gap:8px}.obrix-cmd,.obrix-filtro-equipe{min-height:54px;padding:10px 8px;font-size:14px}.obrix-func-topo{grid-template-columns:minmax(0,1fr) 1fr 72px;padding:6px}.obrix-func-toggle{font-size:16px;padding:11px 8px}.obrix-func-rapido{padding:9px 7px;font-size:12px}.obrix-func-detalhes{padding:12px}.obrix-func-detalhes>.grid{grid-template-columns:1fr 1fr}.obrix-acoes-financeiras{grid-template-columns:1fr}.gestaoFunc{grid-template-columns:repeat(3,1fr)}.obrix-pessoa{align-items:stretch;flex-direction:column}.obrix-pessoa .editar{width:100%}}
    @media(max-width:390px){.obrix-func-topo{grid-template-columns:1fr 1fr}.obrix-func-toggle{grid-column:1/-1}.gestaoFunc{grid-template-columns:1fr}}
  `;
  document.head.appendChild(css);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,0));else setTimeout(instalar,0);
})();
