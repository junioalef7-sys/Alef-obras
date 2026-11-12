(()=>{
  'use strict';
  if(window.__OBRIX_EQUIPE_REGISTROS_EXCLUIR)return;
  window.__OBRIX_EQUIPE_REGISTROS_EXCLUIR=true;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const funcs=()=>{try{return typeof funcionarios!=='undefined'&&Array.isArray(funcionarios)?funcionarios:[]}catch(_){return[]}};
  const obrasList=()=>{try{return typeof obras!=='undefined'&&Array.isArray(obras)?obras:[]}catch(_){return[]}};
  const diariasList=()=>{try{return typeof diarias!=='undefined'&&Array.isArray(diarias)?diarias:[]}catch(_){return[]}};
  const valesList=()=>{try{return typeof vales!=='undefined'&&Array.isArray(vales)?vales:[]}catch(_){return[]}};
  const bonusList=()=>{try{return typeof bonus!=='undefined'&&Array.isArray(bonus)?bonus:[]}catch(_){return[]}};
  const nomeObra=id=>obrasList().find(o=>String(o.id)===String(id))?.nome||'Sem obra';
  const dataBR=v=>v?new Date(v+'T12:00:00').toLocaleDateString('pt-BR'):'—';

  function modal(titulo,html){
    document.querySelector('.obrix-registros-excluir-back')?.remove();
    const back=document.createElement('div');back.className='modalBack obrix-registros-excluir-back';
    back.innerHTML=`<div class="modal obrix-registros-excluir-modal"><div class="obrix-registros-excluir-head"><h2>${esc(titulo)}</h2><button type="button" class="obrix-registros-excluir-x">×</button></div>${html}</div>`;
    document.body.appendChild(back);back.querySelector('.obrix-registros-excluir-x').onclick=()=>back.remove();back.addEventListener('click',e=>{if(e.target===back)back.remove()});return back;
  }

  function montarRows(id){
    const rows=[];
    diariasList().filter(x=>String(x.funcionario_id)===String(id)).forEach(x=>rows.push({id:x.id,kind:'diaria',data:x.data,tipo:Number(x.quantidade||1)<1?'Meia diária':'Diária',obra:nomeObra(x.obra_id),valor:Number(x.valor_total||0),status:x.paga?'Quitada':'Em aberto',aberto:!x.paga}));
    valesList().filter(x=>String(x.funcionario_id)===String(id)).forEach(x=>rows.push({id:x.id,kind:'vale',data:x.data,tipo:'Vale',obra:nomeObra(x.obra_id),valor:-Number(x.valor||0),status:x.quitado?'Quitado':'Em aberto',aberto:false}));
    bonusList().filter(x=>String(x.funcionario_id)===String(id)).forEach(x=>rows.push({id:x.id,kind:'bonus',data:x.data,tipo:x.tipo==='extra'?'Extra':'Bônus',obra:nomeObra(x.obra_id),valor:Number(x.valor||0),status:x.pago?'Pago':'Em aberto',aberto:false}));
    return rows.sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
  }

  function linha(x){
    return `<div class="obrix-registro-linha obrix-registro-excluir-linha"><div><b>${dataBR(x.data)}</b><span>${esc(x.tipo)} · ${esc(x.obra)}</span></div><div class="obrix-registro-excluir-direita"><div class="obrix-registro-valor"><b>${money(x.valor)}</b><small>${esc(x.status)}</small></div>${x.kind==='diaria'&&x.aberto?`<button type="button" class="obrix-excluir-diaria-aberta" data-diaria-id="${esc(x.id)}">Excluir</button>`:''}</div></div>`;
  }

  function abrir(id){
    const f=funcs().find(x=>String(x.id)===String(id));if(!f)return alert('Funcionário não encontrado.');
    const rows=montarRows(id);
    const back=modal('Registros do funcionário',`<p class="muted"><b>${esc(f.nome||'Funcionário')}</b></p><div class="obrix-registros-lista">${rows.length?rows.map(linha).join(''):'<p class="muted">Nenhum registro encontrado.</p>'}</div>`);
    back.querySelectorAll('[data-diaria-id]').forEach(btn=>btn.onclick=()=>excluirDiaria(id,btn.dataset.diariaId,back));
  }

  async function excluirDiaria(funcionarioId,diariaId,back){
    const d=diariasList().find(x=>String(x.id)===String(diariaId));
    if(!d||d.paga)return alert('Somente diárias em aberto podem ser excluídas.');
    if(!confirm(`Excluir esta ${Number(d.quantidade||1)<1?'meia diária':'diária'} de ${dataBR(d.data)}?`))return;
    const btn=back.querySelector(`[data-diaria-id="${CSS.escape(String(diariaId))}"]`);if(btn){btn.disabled=true;btn.textContent='Excluindo...'}
    try{
      const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile();
      const {data,error}=await sb.from('diarias').delete().eq('id',diariaId).eq('empresa_id',p.empresa_id).eq('funcionario_id',funcionarioId).eq('paga',false).select('id');
      if(error)throw error;if(!data?.length)throw new Error('A diária não foi excluída. Ela pode já ter sido paga ou alterada.');
      await window.OBRIX_EQUIPE?.refresh?.();
      back.remove();
      abrir(funcionarioId);
    }catch(e){if(btn){btn.disabled=false;btn.textContent='Excluir'}alert(e.message||'Não foi possível excluir a diária.')}
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('#equipe [data-acao="registros"]');if(!b)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();abrir(b.dataset.id);
  },true);

  const css=document.createElement('style');css.textContent=`
    .obrix-registros-excluir-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.obrix-registros-excluir-head h2{margin:0}.obrix-registros-excluir-x{border:0;background:transparent;color:inherit;font-size:30px}.obrix-registro-excluir-direita{display:flex;align-items:center;gap:10px}.obrix-excluir-diaria-aberta{border:1px solid #fecaca;background:#fff1f2;color:#b91c1c;border-radius:9px;padding:8px 11px;font-weight:900}.obrix-excluir-diaria-aberta:disabled{opacity:.6}.obrix-registro-excluir-linha{gap:12px}
    html[data-theme="dark"] .obrix-excluir-diaria-aberta,body.dark .obrix-excluir-diaria-aberta{background:#2a1519;color:#fecaca;border-color:#7f1d1d}
    @media(max-width:520px){.obrix-registro-excluir-linha{align-items:flex-start!important}.obrix-registro-excluir-direita{flex-direction:column;align-items:flex-end}.obrix-excluir-diaria-aberta{min-width:86px}}
  `;document.head.appendChild(css);
  window.OBRIX_EQUIPE_REGISTROS={open:abrir};
})();