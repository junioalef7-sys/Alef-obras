(()=>{
  'use strict';

  function getFuncionarios(){
    try{
      return (typeof funcionarios !== 'undefined' && Array.isArray(funcionarios)) ? funcionarios : [];
    }catch(_){
      return [];
    }
  }

  function fecharCard(card){
    const detalhes=card.querySelector(':scope > .obrix-func-detalhes');
    const cab=card.querySelector(':scope > .obrix-func-cabecalho');
    if(!detalhes||!cab)return;
    detalhes.hidden=true;
    cab.setAttribute('aria-expanded','false');
    card.classList.remove('obrix-func-aberto');
  }

  function abrirCard(card){
    const box=document.getElementById('listaEquipe');
    if(box){
      box.querySelectorAll('.card.item.obrix-func-aberto').forEach(outro=>{
        if(outro!==card)fecharCard(outro);
      });
    }
    const detalhes=card.querySelector(':scope > .obrix-func-detalhes');
    const cab=card.querySelector(':scope > .obrix-func-cabecalho');
    if(!detalhes||!cab)return;
    detalhes.hidden=false;
    cab.setAttribute('aria-expanded','true');
    card.classList.add('obrix-func-aberto');
  }

  function organizarCard(card,index){
    const funcs=getFuncionarios();
    const f=funcs[index]||null;

    if(card.dataset.obrixListaVertical==='1'){
      const detalhes=card.querySelector(':scope > .obrix-func-detalhes');
      const cab=card.querySelector(':scope > .obrix-func-cabecalho');
      if(detalhes&&cab){
        Array.from(card.children).forEach(el=>{
          if(el!==cab&&el!==detalhes)detalhes.appendChild(el);
        });
      }
      return;
    }

    const nome=(f&&f.nome)||card.querySelector('h3')?.textContent?.trim()||'Funcionário';
    const detalhes=document.createElement('div');
    detalhes.className='obrix-func-detalhes';
    detalhes.hidden=true;

    while(card.firstChild)detalhes.appendChild(card.firstChild);

    const cab=document.createElement('button');
    cab.type='button';
    cab.className='obrix-func-cabecalho';
    cab.setAttribute('aria-expanded','false');

    const nomeEl=document.createElement('span');
    nomeEl.className='obrix-func-nome';
    nomeEl.textContent=nome;

    const seta=document.createElement('span');
    seta.className='obrix-func-seta';
    seta.setAttribute('aria-hidden','true');
    seta.textContent='›';

    cab.append(nomeEl,seta);
    cab.addEventListener('click',()=>{
      if(card.classList.contains('obrix-func-aberto'))fecharCard(card);
      else abrirCard(card);
    });

    card.classList.add('obrix-func-item');
    card.dataset.obrixListaVertical='1';
    card.append(cab,detalhes);
  }

  function aplicarListaVertical(){
    const box=document.getElementById('listaEquipe');
    if(!box)return;
    const cards=Array.from(box.querySelectorAll('.card.item'));
    cards.forEach((card,index)=>organizarCard(card,index));
  }

  function instalar(){
    const original=window.renderEquipe;
    if(typeof original==='function'&&!original.__obrixListaVertical){
      const renderLista=function(){
        const r=original.apply(this,arguments);
        requestAnimationFrame(aplicarListaVertical);
        return r;
      };
      renderLista.__obrixListaVertical=true;
      window.renderEquipe=renderLista;
    }

    const box=document.getElementById('listaEquipe');
    if(box){
      let agendado=false;
      const observer=new MutationObserver(()=>{
        if(agendado)return;
        agendado=true;
        requestAnimationFrame(()=>{
          agendado=false;
          aplicarListaVertical();
        });
      });
      observer.observe(box,{childList:true,subtree:true});
    }

    aplicarListaVertical();
  }

  const css=document.createElement('style');
  css.textContent=`
    #listaEquipe{display:flex;flex-direction:column;gap:10px}
    #listaEquipe .card.item.obrix-func-item{padding:0;margin:0;overflow:hidden}
    .obrix-func-cabecalho{width:100%;border:0;background:transparent;color:inherit;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 18px;text-align:left;font:inherit;font-weight:900;font-size:17px}
    .obrix-func-cabecalho:active{transform:scale(.995)}
    .obrix-func-nome{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .obrix-func-seta{font-size:28px;line-height:1;font-weight:500;transition:transform .18s ease;color:#64748b}
    .obrix-func-aberto .obrix-func-seta{transform:rotate(90deg)}
    .obrix-func-detalhes{border-top:1px solid #e2e8f0;padding:16px 18px 18px}
    .obrix-func-detalhes[hidden]{display:none!important}
    .obrix-func-detalhes>h3:first-child{display:none}
    @media(max-width:700px){
      .obrix-func-cabecalho{padding:15px 14px;font-size:16px}
      .obrix-func-detalhes{padding:14px}
    }
  `;
  document.head.appendChild(css);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,0));
  else setTimeout(instalar,0);
})();
