(()=>{'use strict';
if(window.__OBRIX_BONUS_CHECKLIST_DIRETO)return;
window.__OBRIX_BONUS_CHECKLIST_DIRETO=true;

const hoje=()=>new Date().toISOString().slice(0,10);

async function contexto(){
  const p=await OBRIX_BACKEND.profile();
  return {sb:await OBRIX_BACKEND.init(),eid:p.empresa_id};
}

async function carregarChecklist(select,obraId){
  select.innerHTML='<option value="">Selecione a etapa</option>';
  if(!obraId)return;
  try{
    const {sb,eid}=await contexto();
    const r=await sb.from('checklist_itens').select('id,nome,ordem').eq('empresa_id',eid).eq('obra_id',obraId).order('ordem',{ascending:true});
    if(r.error)throw r.error;
    (r.data||[]).forEach(c=>{
      const o=document.createElement('option');
      o.value=c.id;
      o.textContent=c.nome||'Etapa';
      select.appendChild(o);
    });
  }catch(e){
    console.warn('Checklist do bônus/extra',e);
  }
}

async function abrirBonus(f){
  const obras=await OBRIX_BACKEND.readTable('obras','criado_em');
  const b=document.createElement('div');
  b.className='modalBack';
  b.innerHTML=`<div class="modal">
    <h2>Bônus e Extras</h2>
    <p><strong></strong></p>
    <label>Obra</label>
    <select class="obra"><option value="">Selecione a obra</option></select>
    <label>Checklist</label>
    <select class="modo"><option value="sem">Sem checklist</option><option value="com">Com checklist</option></select>
    <div class="checkWrap hidden">
      <label>Checklist / etapa</label>
      <select class="check"><option value="">Selecione a etapa</option></select>
    </div>
    <label>Tipo</label>
    <select class="tipo"><option value="bonus">Bônus</option><option value="extra">Extra</option></select>
    <label>Descrição</label>
    <input class="desc" placeholder="Ex.: produtividade">
    <label>Valor</label>
    <input class="valor" type="number" min="0" step="0.01">
    <label>Data</label>
    <input class="data" type="date">
    <div class="modalActions"><button class="btn light cancelar">Cancelar</button><button class="btn salvar">Registrar</button></div>
  </div>`;
  b.querySelector('strong').textContent=f.nome||'Funcionário';
  b.querySelector('.data').value=hoje();
  const obra=b.querySelector('.obra'),modo=b.querySelector('.modo'),wrap=b.querySelector('.checkWrap'),check=b.querySelector('.check');
  (obras||[]).filter(o=>o.status!=='concluida').forEach(o=>{
    const x=document.createElement('option');
    x.value=o.id;
    x.textContent=o.nome||'Obra';
    obra.appendChild(x);
  });
  async function atualizarChecklist(){
    const com=modo.value==='com';
    wrap.classList.toggle('hidden',!com);
    if(com)await carregarChecklist(check,obra.value);
    else check.value='';
  }
  obra.addEventListener('change',atualizarChecklist);
  modo.addEventListener('change',atualizarChecklist);
  document.body.appendChild(b);
  b.querySelector('.cancelar').onclick=()=>b.remove();
  b.querySelector('.salvar').onclick=async()=>{
    const obra_id=obra.value,com=modo.value==='com',checklist_id=com?(check.value||null):null,valor=Number(b.querySelector('.valor').value),data=b.querySelector('.data').value;
    if(!obra_id||valor<=0||!data)return alert('Selecione a obra e informe valor e data.');
    if(com&&!checklist_id)return alert('Selecione o checklist / etapa.');
    try{
      const {sb,eid}=await contexto();
      const r=await sb.from('bonus_extras').insert({empresa_id:eid,funcionario_id:f.id,obra_id,checklist_id,tipo:b.querySelector('.tipo').value,descricao:b.querySelector('.desc').value.trim()||'Bônus/Extra',valor,data,pago:false});
      if(r.error)throw r.error;
      b.remove();
      try{await window.OBRIX_EQUIPE?.refresh?.()}catch(_){}
      try{await window.OBRIX_REFRESH_ALL?.()}catch(_){}
      alert('Bônus/Extra registrado com sucesso.');
    }catch(e){
      alert('Não foi possível registrar: '+(e.message||e));
    }
  };
}

function idBonusDoBotao(btn){
  const attr=btn?.getAttribute?.('onclick')||'';
  const m=attr.match(/equipeAcao\(\s*['"]([^'"]+)['"]\s*,\s*['"]bonus['"]\s*\)/i);
  return m?.[1]||'';
}

document.addEventListener('click',e=>{
  const btn=e.target.closest?.('button');
  if(!btn)return;
  const id=idBonusDoBotao(btn);
  if(!id)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const f=(window.funcionarios||[]).find(x=>String(x.id)===String(id));
  if(!f)return alert('Funcionário não encontrado.');
  abrirBonus(f).catch(err=>alert(err?.message||'Não foi possível abrir Bônus e Extras.'));
},true);
})();