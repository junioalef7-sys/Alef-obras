(()=>{
  'use strict';
  if(window.__OBRIX_OBRAS_BUSCA)return;
  window.__OBRIX_OBRAS_BUSCA=true;

  const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();

  function garantir(){
    const sec=document.getElementById('obras'),lista=document.getElementById('listaObras');
    if(!sec||!lista)return false;
    let box=sec.querySelector('#obrixBuscaObras');
    if(!box){
      box=document.createElement('div');
      box.id='obrixBuscaObras';
      box.className='card obrix-busca-obras';
      box.innerHTML=`<label for="obrixBuscaObraInput">Buscar obra</label><div class="obrix-busca-obras-linha"><input id="obrixBuscaObraInput" type="search" list="obrixBuscaObraSugestoes" placeholder="Digite o nome da obra ou cliente" autocomplete="off"><datalist id="obrixBuscaObraSugestoes"></datalist><button type="button" id="obrixLimparBuscaObra">Todas</button></div><small id="obrixBuscaObraInfo" class="muted"></small>`;
      lista.insertAdjacentElement('beforebegin',box);
      box.querySelector('#obrixBuscaObraInput').addEventListener('input',aplicar);
      box.querySelector('#obrixLimparBuscaObra').onclick=()=>{const i=box.querySelector('#obrixBuscaObraInput');i.value='';aplicar()};
    }
    atualizarSugestoes();
    aplicar();
    return true;
  }

  function atualizarSugestoes(){
    const dl=document.getElementById('obrixBuscaObraSugestoes');if(!dl)return;
    const os=Array.isArray(window.obras)?window.obras:[];
    dl.innerHTML=os.map(o=>`<option value="${String(o.nome||'').replace(/"/g,'&quot;')}">${String(o.cliente||'')}</option>`).join('');
  }

  function aplicar(){
    const input=document.getElementById('obrixBuscaObraInput'),lista=document.getElementById('listaObras'),info=document.getElementById('obrixBuscaObraInfo');
    if(!input||!lista)return;
    const q=norm(input.value),cards=[...lista.querySelectorAll('.card.item[data-obra-id]')];
    let visiveis=0;
    cards.forEach(card=>{
      const id=String(card.dataset.obraId||''),o=(Array.isArray(window.obras)?window.obras:[]).find(x=>String(x.id)===id);
      const texto=norm([o?.nome,o?.cliente,o?.endereco,o?.status,card.textContent].filter(Boolean).join(' '));
      const ok=!q||texto.includes(q);
      card.classList.toggle('hidden',!ok);
      if(ok)visiveis++;
    });
    if(info)info.textContent=q?(visiveis===1?'1 obra encontrada':`${visiveis} obras encontradas`):`${cards.length} obra${cards.length===1?'':'s'} cadastrada${cards.length===1?'':'s'}`;
  }

  const css=document.createElement('style');
  css.textContent=`
    .obrix-busca-obras{padding:14px!important;margin-bottom:14px!important}.obrix-busca-obras label{display:block;font-weight:900;margin-bottom:7px}.obrix-busca-obras-linha{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.obrix-busca-obras input{width:100%;min-width:0;padding:12px 13px;border:1px solid #cbd5e1;border-radius:11px;font-size:16px;background:#fff;color:#0f172a}.obrix-busca-obras button{border:1px solid #cbd5e1;background:#fff;color:#0f172a;border-radius:11px;padding:0 16px;font-weight:900}.obrix-busca-obras small{display:block;margin-top:7px}
    html[data-theme="dark"] .obrix-busca-obras input,body.dark .obrix-busca-obras input,html[data-theme="dark"] .obrix-busca-obras button,body.dark .obrix-busca-obras button{background:#111827;color:#f8fafc;border-color:#334155}
    @media(max-width:420px){.obrix-busca-obras-linha{grid-template-columns:1fr}.obrix-busca-obras button{min-height:44px}}
  `;
  document.head.appendChild(css);

  const obs=new MutationObserver(()=>requestAnimationFrame(()=>{garantir();aplicar()}));
  function iniciar(){if(!garantir())return setTimeout(iniciar,250);const lista=document.getElementById('listaObras');if(lista&&!lista.__obrixBuscaObs){lista.__obrixBuscaObs=true;obs.observe(lista,{childList:true})}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
  window.OBRIX_OBRAS_BUSCA={apply:aplicar,refresh:()=>{atualizarSugestoes();aplicar()}};
})();