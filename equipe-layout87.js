(()=>{
  'use strict';
  if(window.__EDIFIQ_EQUIPE_LAYOUT87)return;
  window.__EDIFIQ_EQUIPE_LAYOUT87=true;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function extrairId(card){
    if(!card)return'';
    const btn=[...card.querySelectorAll('button')].find(b=>/openDiaFuncionario\s*\(|openFunc\s*\(/.test(String(b.getAttribute('onclick')||'')));
    if(!btn)return'';
    const on=String(btn.getAttribute('onclick')||'');
    const m=on.match(/(?:openDiaFuncionario|openFunc)\s*\(\s*['"]?([^'"\)]+)['"]?\s*\)/);
    return m?String(m[1]).trim():'';
  }

  function abrirDiretorio(){
    document.getElementById('ed87DiretorioM')?.remove();
    const cards=[...document.querySelectorAll('#funcList .edEquipeCard,#funcList>.card')];
    const modal=document.createElement('div');
    modal.id='ed87DiretorioM';
    modal.className='modal open';
    modal.innerHTML=`<div class="modalBox ed87DirBox"><div class="modalHead"><div><h2>Funcionários</h2><p class="sub">Dados pessoais e cadastrais da equipe.</p></div><button class="x" type="button" aria-label="Fechar">×</button></div><div class="ed87DirLista"></div></div>`;
    const lista=modal.querySelector('.ed87DirLista');
    if(!cards.length){
      lista.innerHTML='<div class="empty">Nenhum funcionário cadastrado.</div>';
    }else{
      lista.innerHTML=cards.map(card=>{
        const id=extrairId(card);
        const nome=card.querySelector('.edEqName,h3')?.textContent?.trim()||'Funcionário';
        const cargo=card.querySelector('.edEqHead small,.row small')?.textContent?.trim()||'Função não informada';
        const status=card.querySelector('.edEqBadge,.badge')?.textContent?.trim()||'';
        const obra=card.querySelector('.edEqRate small:last-child')?.textContent?.trim()||'';
        return `<article class="ed87Pessoa"><div><h3>${esc(nome)}</h3><p>${esc(cargo)}</p>${status?`<span class="ed87Status">${esc(status)}</span>`:''}${obra?`<small>Obra atual: ${esc(obra)}</small>`:''}</div>${id?`<button type="button" class="btn ed87Editar" data-id="${esc(id)}">Editar cadastro</button>`:''}</article>`;
      }).join('');
    }
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    const fechar=()=>{modal.remove();if(!document.querySelector('.modal.open'))document.body.classList.remove('modal-open')};
    modal.querySelector('.x').onclick=fechar;
    modal.addEventListener('click',e=>{if(e.target===modal)fechar()});
    modal.querySelectorAll('.ed87Editar').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id;fechar();if(typeof window.openFunc==='function')window.openFunc(id)});
  }

  function prepararBotaoFuncionarios(page){
    const btn=[...page.querySelectorAll('.edEquipeTopActions .edEqCmd')].find(b=>/funcionários|funcionarios/i.test(b.textContent||'')&&!/ativar|desativar|excluir|\+/i.test(b.textContent||''));
    if(!btn||btn.dataset.ed87Pronto==='1')return;
    btn.dataset.ed87Pronto='1';
    btn.removeAttribute('onclick');
    btn.onclick=e=>{e.preventDefault();abrirDiretorio()};
  }

  function removerNovoDuplicado(page){
    const keep=page.querySelector('.edEquipeTopActions .edEqCmd.gold');
    [...page.querySelectorAll('button')].forEach(btn=>{
      const t=String(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      const novo=(t.includes('+ funcionário')||t.includes('+funcionário')||t.includes('＋ funcionário')||t.includes('+ funcionario')||t.includes('＋ funcionario'));
      if(novo&&btn!==keep&&!btn.closest('#funcList'))btn.style.display='none';
    });
  }

  function adicionarFaltas(){
    document.querySelectorAll('#funcList .edEquipeCard,#funcList>.card').forEach(card=>{
      const actions=card.querySelector('.ed27Actions,.listActions');
      if(!actions||actions.querySelector('.ed87Falta'))return;
      const id=extrairId(card);if(!id)return;
      const btn=document.createElement('button');
      btn.type='button';btn.className='btn ed87Falta';btn.textContent='Falta';
      btn.onclick=()=>{if(typeof window.openFalta==='function')window.openFalta(id);else alert('Registro de falta indisponível. Atualize a página e tente novamente.')};
      const diaria=[...actions.querySelectorAll('button')].find(b=>/marcar diária|marcar diaria/i.test(b.textContent||''));
      if(diaria&&diaria.nextSibling)actions.insertBefore(btn,diaria.nextSibling);else actions.appendChild(btn);
    });
  }

  function aplicar(){
    const page=document.getElementById('funcionarios');
    if(!page)return;

    const overview=page.querySelector('.equipeOverview');
    if(overview){overview.hidden=true;overview.setAttribute('aria-hidden','true')}
    const extra=document.getElementById('ed27TeamFilters');
    if(extra){extra.hidden=true;extra.setAttribute('aria-hidden','true')}
    const periodo=document.getElementById('edEquipePeriod');
    if(periodo){periodo.hidden=true;periodo.setAttribute('aria-hidden','true')}

    const top=page.querySelector('.edEquipeTopActions');
    const secondary=page.querySelector('.edEquipeSecondary');
    const list=document.getElementById('funcList');
    if(top&&secondary&&list){
      if(top.nextElementSibling!==secondary)top.insertAdjacentElement('afterend',secondary);
      if(secondary.nextElementSibling!==list)secondary.insertAdjacentElement('afterend',list);
    }

    prepararBotaoFuncionarios(page);
    removerNovoDuplicado(page);
    adicionarFaltas();
  }

  const css=document.createElement('style');
  css.id='edifiq-equipe-layout87';
  css.textContent=`
    #funcionarios .equipeOverview,
    #funcionarios #ed27TeamFilters,
    #funcionarios #edEquipePeriod{display:none!important}
    #funcionarios .edEquipeTopActions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;margin:0 0 10px!important}
    #funcionarios .edEquipeTopActions .edEqCmd{width:100%!important;min-height:68px!important;margin:0!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:9px!important;border-radius:16px!important;font-weight:900!important;font-size:16px!important;text-align:center!important}
    #funcionarios .edEquipeSecondary{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin:0 0 16px!important;align-items:stretch!important}
    #funcionarios .edEquipeSecondary select,#funcionarios .edEquipeSecondary .btn{width:100%!important;min-height:54px!important;margin:0!important;border-radius:14px!important}
    #funcionarios #funcList{display:flex!important;flex-direction:column!important;gap:12px!important;margin:0!important;width:100%!important}
    #funcionarios #funcList>.edEquipeCard,#funcionarios #funcList>.card{width:100%!important;margin:0!important}
    #funcionarios .edEquipeCard .ed27Actions,#funcionarios #funcList .listActions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:9px!important}
    #funcionarios .edEquipeCard .ed27Actions .btn,#funcionarios #funcList .listActions .btn{width:100%!important;min-width:0!important;min-height:50px!important;margin:0!important}
    .ed87DirBox{width:min(720px,calc(100% - 24px))!important}.ed87DirLista{display:grid;gap:10px;max-height:68vh;overflow:auto}.ed87Pessoa{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--line,#2b3340);border-radius:14px;padding:14px;background:rgba(255,255,255,.02)}.ed87Pessoa h3{margin:0 0 4px}.ed87Pessoa p{margin:0 0 6px;color:var(--muted,#94a3b8)}.ed87Pessoa small{display:block;margin-top:6px;color:var(--muted,#94a3b8)}.ed87Status{display:inline-block;padding:4px 8px;border-radius:999px;border:1px solid currentColor;font-size:11px;font-weight:800}.ed87Editar{flex:0 0 auto}
    @media(max-width:520px){#funcionarios .edEquipeTopActions{gap:8px!important}#funcionarios .edEquipeTopActions .edEqCmd{min-height:64px!important;font-size:15px!important;padding:10px 8px!important}#funcionarios .edEquipeSecondary{gap:8px!important;margin-bottom:12px!important}#funcionarios .edEquipeSecondary select,#funcionarios .edEquipeSecondary .btn{min-height:50px!important}#funcionarios #funcList{gap:10px!important}.ed87Pessoa{align-items:stretch;flex-direction:column}.ed87Editar{width:100%}}
  `;
  document.head.appendChild(css);

  function instalar(){
    aplicar();
    const page=document.getElementById('funcionarios');
    if(!page)return setTimeout(instalar,250);
    let agendado=false;
    new MutationObserver(()=>{if(agendado)return;agendado=true;requestAnimationFrame(()=>{agendado=false;aplicar()})}).observe(page,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});
  else instalar();
})();
