(()=>{
'use strict';
// Preview isolada de 18/11/2026: nenhuma ação no OBRIX oficial.
if(window.__OBRIX_HML_PROJECT_REF!=='xavwkfgrnowmusbkbiea')return;
if(window.OBRIX_HML_LIMIT_PANEL)return;
const key='obrixHmlLimitedPanel';
const el=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n};
const fmt=e=>String(e?.message||e||'Não foi possível concluir a seleção.');
const ativo=a=>{
  if(!a)return false;
  const now=Date.now();
  if(a.status==='teste')return !!a.trial_fim&&new Date(a.trial_fim).getTime()>now;
  return a.status==='ativo'&&(a.plano==='permanente'||((a.plano==='mensal'||a.plano==='anual')&&!!a.periodo_fim&&new Date(a.periodo_fim).getTime()>now));
};
let version=0;
async function refresh(sb,perfil,assinatura){
  const current=++version;
  const status=document.getElementById('assStatus');
  if(!status||!perfil?.empresa_id)return;
  let box=document.getElementById(key);
  if(ativo(assinatura)){
    box?.remove();
    return;
  }
  if(!box){
    box=el('section',undefined,'card');
    box.id=key;
    box.style.margin='12px 0';
    box.style.padding='16px';
    status.insertAdjacentElement('afterend',box);
  }
  box.replaceChildren(
    el('h3','Plano limitado — escolha dos registros'),
    el('p','Após o vencimento, somente uma obra e um funcionário poderão ser editados. Os demais ficarão preservados para consulta. A escolha não poderá ser trocada enquanto o plano estiver limitado.'),
    el('p','Carregando opções disponíveis...')
  );
  try{
    const [sr,or,fr]=await Promise.all([
      sb.from('obrix_hml_limite_selecao').select('obra_id,funcionario_id').eq('empresa_id',perfil.empresa_id).maybeSingle(),
      sb.from('obras').select('id,nome').eq('empresa_id',perfil.empresa_id).order('criado_em',{ascending:true}),
      sb.from('funcionarios').select('id,nome').eq('empresa_id',perfil.empresa_id).order('criado_em',{ascending:true})
    ]);
    if(current!==version||!box.isConnected)return;
    if(sr.error||or.error||fr.error)throw sr.error||or.error||fr.error;
    const escolha=sr.data||{},obras=or.data||[],funcs=fr.data||[];
    const h=el('h3','Plano limitado — escolha dos registros');
    const p=el('p','Apenas a obra e o funcionário escolhidos poderão ser editados. Os demais continuam preservados para consulta. A seleção é definitiva durante o período limitado.');
    box.replaceChildren(h,p);
    const donos=['proprietario','administrador'];
    const form=[];
    function row(label,id,items,fixed){
      const wrap=el('div');
      wrap.style.marginBottom='12px';
      const lbl=el('label',label);
      lbl.setAttribute('for',id);
      lbl.style.display='block';lbl.style.fontWeight='700';
      const select=el('select');select.id=id;
      select.style.cssText='display:block;width:100%;min-height:44px;margin-top:6px;padding:8px;border:1px solid #98a2b3;border-radius:10px;background:var(--surface,#fff);color:var(--text,#111827);font:inherit';
      const empty=el('option',items.length?'Escolha um registro':'Nenhum registro cadastrado');empty.value='';select.append(empty);
      for(const rec of items){const opt=el('option',rec.nome||'Sem nome');opt.value=rec.id;select.append(opt)}
      if(fixed){select.value=fixed;select.disabled=true;}
      wrap.append(lbl,select);box.append(wrap);form.push(select);
      return select;
    }
    const obra=row('Obra autorizada','obrixHmlPlanoObra',obras,escolha.obra_id);
    const func=row('Funcionário autorizado','obrixHmlPlanoFunc',funcs,escolha.funcionario_id);
    const selected=!!escolha.obra_id&&!!escolha.funcionario_id;
    const info=el('p',selected?'Seleção concluída. O cadastro permanece preservado.':'Você pode escolher a obra e o funcionário agora, ou selecionar um de cada vez.');
    info.style.fontSize='13px';box.append(info);
    if(selected||!donos.includes(String(perfil.papel||'')))return;
    let confirmation=false;
    const btn=el('button','Confirmar seleção','btn');
    btn.type='button';btn.style.cssText='background:#ea7800;color:white;border:0;border-radius:10px;padding:12px 14px;font-weight:750';
    const note=el('div');note.setAttribute('role','status');note.style.marginTop='8px';
    btn.addEventListener('click',async()=>{
      const p_obra_id=escolha.obra_id||obra.value||null;
      const p_funcionario_id=escolha.funcionario_id||func.value||null;
      if(!p_obra_id&&!p_funcionario_id){note.textContent='Escolha ao menos um registro.';return;}
      if(!confirmation){
        confirmation=true;btn.textContent='Confirmar escolha definitiva';note.textContent='Atenção: não será possível trocar esses registros antes de reativar a assinatura.';
        return;
      }
      btn.disabled=true;note.textContent='Registrando seleção...';
      try{
        const r=await sb.rpc('obrix_hml_selecionar_plano_limitado',{p_obra_id,p_funcionario_id});
        if(r.error)throw r.error;
        note.textContent='Seleção registrada.';
        await refresh(sb,perfil,assinatura);
      }catch(e){btn.disabled=false;confirmation=false;btn.textContent='Confirmar seleção';note.textContent=fmt(e);}
    });
    for(const s of form)s.addEventListener('change',()=>{confirmation=false;btn.textContent='Confirmar seleção';note.textContent=''});
    box.append(btn,note);
  }catch(e){
    if(current!==version||!box.isConnected)return;
    box.replaceChildren(el('h3','Plano limitado'),el('p',fmt(e)));
  }
}
window.OBRIX_HML_LIMIT_PANEL={refresh};
})();