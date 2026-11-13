(()=>{'use strict';const hoje=()=>new Date().toISOString().slice(0,10),modal=(titulo,html)=>{const b=document.createElement('div');b.className='modalBack';b.innerHTML=`<div class="modal"><h2>${titulo}</h2>${html}</div>`;document.body.appendChild(b);b.querySelector('.cancelar')?.addEventListener('click',()=>b.remove());return b},obrasAtivas=()=>(window.obras||[]).filter(o=>String(o.status||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\s_-]+/g,'')==='andamento'),opts=(sel='')=>'<option value="">Sem obra vinculada</option>'+obrasAtivas().map(o=>`<option value="${o.id}" ${String(o.id)===String(sel)?'selected':''}>${esc(o.nome)}</option>`).join('');let obrasParaEquipe=null,obrasParaEquipeTs=0,obrasParaEquipeRequest=null;
async function obrasEmAndamento(){
  if(obrasParaEquipe&&Date.now()-obrasParaEquipeTs<45000)return obrasParaEquipe;
  if(obrasParaEquipeRequest)return obrasParaEquipeRequest;
  obrasParaEquipeRequest=(async()=>{
    try{
      const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile();
      if(!p?.empresa_id)throw Error('Empresa não identificada.');
      const r=await sb.from('obras').select('id,nome,status').eq('empresa_id',p.empresa_id).eq('status','andamento').order('nome');
      if(r.error)throw r.error;
      obrasParaEquipe=r.data||[];obrasParaEquipeTs=Date.now();
      return obrasParaEquipe;
    }catch(e){const local=obrasAtivas();if(local.length)return local;throw e}
  })();
  try{return await obrasParaEquipeRequest}finally{obrasParaEquipeRequest=null}
}
async function atualizarObrasNoModal(back){
  const sel=back.querySelector('select.obra');if(!sel||!back.isConnected)return;
  try{
    const lista=await obrasEmAndamento();
    if(!back.isConnected||!sel.isConnected)return;
    const items=[{id:'',nome:'Selecione uma obra em andamento'},...lista.map(o=>({id:String(o.id),nome:String(o.nome||'Obra')}))];
    const aplicar=()=>{
      if(!sel.isConnected)return;
      const anterior=sel.value;
      const iguais=items.length===sel.options.length&&items.every((o,i)=>sel.options[i]?.value===o.id&&sel.options[i]?.text===o.nome);
      if(!iguais)sel.replaceChildren(...items.map(o=>new Option(o.nome,o.id)));
      if(items.some(o=>o.id===anterior))sel.value=anterior;
    };
    if(document.activeElement===sel&&sel.options.length>1)sel.addEventListener('blur',aplicar,{once:true});
    else aplicar();
  }catch(e){console.warn('Obras para registro da equipe:',e)}
}
async function validarRegistroAtivo(sb,f,obraId){
  if(!obraId)throw Error('Selecione uma obra em andamento.');
  const p=await OBRIX_BACKEND.profile();if(!p?.empresa_id)throw Error('Empresa não identificada.');
  const [ro,rf]=await Promise.all([
    sb.from('obras').select('id,status').eq('empresa_id',p.empresa_id).eq('id',obraId).maybeSingle(),
    sb.from('funcionarios').select('id,ativo').eq('empresa_id',p.empresa_id).eq('id',f.id).maybeSingle()
  ]);
  if(ro.error)throw ro.error;if(rf.error)throw rf.error;
  if(ro.data?.status!=='andamento')throw Error('Só é permitido registrar em obras em andamento.');
  if(rf.data?.ativo!==true)throw Error('Só é permitido registrar para funcionários ativos.');
}
let refreshExecutando=null,refreshReexecutar=false,refreshFinanceiroPendente=false;
async function refresh(opcoes={}){
  if(opcoes?.financeiro)refreshFinanceiroPendente=true;
  if(refreshExecutando){
    if(opcoes?.force||opcoes?.financeiro)refreshReexecutar=true;
    return refreshExecutando;
  }
  const trabalho=(async()=>{
    let rodada=0;
    do{
      refreshReexecutar=false;
      const incluirFinanceiro=refreshFinanceiroPendente;
      refreshFinanceiroPendente=false;
      const sb=await OBRIX_BACKEND.init();
      const p=await OBRIX_BACKEND.profile();
      if(!p?.empresa_id)throw new Error('Conta não identificada.');
      const eid=p.empresa_id;
      const consultas=[
        sb.from('funcionarios').select('*').eq('empresa_id',eid).order('criado_em',{ascending:false}),
        sb.from('diarias').select('*').eq('empresa_id',eid),
        sb.from('vales').select('*').eq('empresa_id',eid),
        sb.from('bonus_extras').select('*').eq('empresa_id',eid)
      ];
      if(incluirFinanceiro)consultas.push(sb.from('financeiro').select('*').eq('empresa_id',eid).order('data',{ascending:false}));
      const resultados=await Promise.all(consultas);
      const falha=resultados.find(r=>r.error);
      if(falha)throw falha.error;
      funcionarios=resultados[0].data||[];
      diarias=resultados[1].data||[];
      vales=(resultados[2].data||[]).filter(v=>!v.estornado_em);
      bonus=resultados[3].data||[];
      window.funcionarios=funcionarios;
      window.diarias=diarias;
      window.vales=vales;
      window.bonus=bonus;
      if(incluirFinanceiro){
        financeiro=resultados[4].data||[];
        window.financeiro=financeiro;
      }
      window.__OBRIX_EQUIPE_LAST_LOAD=Date.now();
      const sec=document.getElementById('equipe');
      if(sec&&!sec.classList.contains('hidden'))window.renderEquipe?.();
      const k=document.getElementById('funcs');
      if(k)k.textContent=String(funcionarios.filter(f=>f.ativo!==false).length);
      if(incluirFinanceiro){
        window.OBRIX_FIN?.render?.();
        window.OBRIX_DASH?.paint?.();
      }
      if(typeof window.salvarBaseOffline==='function')window.salvarBaseOffline();
      else window.OBRIX_PREVIEW?.refresh?.();
      rodada++;
    }while(refreshReexecutar&&rodada<2);
  })();
  refreshExecutando=trabalho;
  try{return await trabalho}
  finally{
    refreshExecutando=null;
    if(refreshReexecutar)setTimeout(()=>refresh({financeiro:refreshFinanceiroPendente}).catch(e=>console.warn('Equipe: reconciliação adiada',e)),280);
  }
}
function funcionario(f=null){const b=modal(f?'Editar funcionário':'Novo funcionário',`<label>Nome</label><input class="nome" value="${esc(f?.nome||'')}"><label>Cargo</label><input class="cargo" value="${esc(f?.cargo||'')}" placeholder="Pedreiro, servente, pintor..."><label>Tipo de pagamento</label><select class="tipo"><option value="diaria">Diária</option><option value="semana">Semana</option><option value="quinzena">Quinzena</option><option value="mes">Mês</option></select><label>Valor da diária</label><input class="diaria" type="number" min="0" step="0.01" value="${f?.valor_diaria??''}"><label>Salário mensal</label><input class="salario" type="number" min="0" step="0.01" value="${f?.salario_mensal??''}"><label>Dia de pagamento mensal</label><input class="dia" type="number" min="1" max="31" value="${f?.dia_pagamento??''}"><label>Obra vinculada</label><select class="obra">${opts(f?.obra_id||'')}</select><label style="display:flex;gap:8px;align-items:center"><input class="ativo" type="checkbox" style="width:auto" ${f?.ativo===false?'':'checked'}> Funcionário ativo</label><label>Observações</label><input class="obs" value="${esc(f?.observacoes||'')}"><div class="modalActions"><button class="btn cancelar">Cancelar</button><button class="btn salvar">${f?'Salvar':'Cadastrar'}</button></div>`);b.querySelector('.tipo').value=f?.tipo_pagamento||'diaria';b.querySelector('.salvar').onclick=async()=>{const botaoSalvar=b.querySelector('.salvar');if(botaoSalvar.disabled)return;botaoSalvar.disabled=true;try{const nome=b.querySelector('.nome').value.trim();if(!nome)return alert('Informe o nome do funcionário.');const payload={nome,cargo:b.querySelector('.cargo').value.trim()||null,tipo_pagamento:b.querySelector('.tipo').value,valor_diaria:Number(b.querySelector('.diaria').value||0),salario_mensal:Number(b.querySelector('.salario').value||0),dia_pagamento:b.querySelector('.dia').value?Number(b.querySelector('.dia').value):null,obra_id:b.querySelector('.obra').value||null,ativo:b.querySelector('.ativo').checked,observacoes:b.querySelector('.obs').value.trim()||null,atualizado_em:new Date().toISOString()};const sb=await OBRIX_BACKEND.init();const q=f?await sb.from('funcionarios').update(payload).eq('id',f.id).eq('empresa_id',profile.empresa_id).select('id'):await sb.from('funcionarios').insert({...payload,empresa_id:profile.empresa_id}).select('id');if(q.error)return alert(q.error.message);if(!q.data?.length)return alert('A gravação não foi confirmada.');b.remove();window.OBRIX_SUCESSO?.(f?'Funcionário atualizado com sucesso.':'Funcionário cadastrado com sucesso.');await refresh({force:true})}finally{if(botaoSalvar.isConnected)botaoSalvar.disabled=false}}}async function toggle(f){const sb=await OBRIX_BACKEND.init(),r=await sb.from('funcionarios').update({ativo:!f.ativo,atualizado_em:new Date().toISOString()}).eq('id',f.id).eq('empresa_id',profile.empresa_id).select('id');if(r.error)return alert(r.error.message);await refresh()}async function excluir(f){
  if(typeof window.OBRIX_CONFIRMAR_EXCLUSAO!=='function')return alert('Confirmação indisponível. Atualize o aplicativo.');
  if(!await window.OBRIX_CONFIRMAR_EXCLUSAO({
    titulo:'Excluir funcionário',mensagem:'Excluir o funcionário “'+f.nome+'”?',confirmar:'Excluir'
  }))return;
  try{
    if(!navigator.onLine)throw Error('Conecte-se à internet para concluir.');
    const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile(),eid=p?.empresa_id;
    if(!eid)throw Error('Conta não identificada.');
    const tabelas=['diarias','faltas','vales','bonus_extras','pagamentos_equipe','diario_equipe'];
    const links=await Promise.all(tabelas.map(t=>sb.from(t).select('id')
      .eq('empresa_id',eid).eq('funcionario_id',f.id).limit(1)));
    const erro=links.find(r=>r.error);if(erro)throw erro.error;
    if(links.some(r=>r.data?.length))throw Error(
      'Funcionário com histórico. Utilize Ativar / Desativar para preservar diárias, faltas e pagamentos.'
    );
    const r=await sb.from('funcionarios').delete()
      .eq('id',f.id).eq('empresa_id',eid).select('id');
    if(r.error)throw r.error;
    if(!r.data?.length)throw Error('Funcionário não encontrado ou exclusão não autorizada.');
    await refresh();window.OBRIX_SUCESSO?.('Funcionário excluído com sucesso.');
  }catch(e){
    if(window.OBRIX_AVISO)await window.OBRIX_AVISO(e?.message||'Não foi possível excluir.','Equipe');
    else alert(e?.message||'Não foi possível excluir.');
  }
}/* Select a real checklist item for the chosen job, or explicitly choose none.
   All three payroll inputs use the existing checklist_id column. */
const cacheChecklistEquipe=new Map();
window.addEventListener('obrix:obras-remotas-atualizadas',()=>cacheChecklistEquipe.clear());
function prepararChecklistEquipe(back){
 const obra=back.querySelector('.obra'),check=back.querySelector('.check');
 if(!obra||!check)return;
 let seq=0;
 async function carregar(){
  const current=++seq,id=obra.value;
  check.disabled=true;check.dataset.ready='0';check.dataset.obra=id;
  check.innerHTML='<option value="">'+(id?'Carregando etapas...':'Sem checklist / etapa')+'</option>';
  if(!id){check.disabled=false;check.dataset.ready='1';return}
  try{
   const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile();
   if(!p?.empresa_id)throw Error('Conta não identificada');
   const chave=String(p.empresa_id)+':'+String(id),cache=cacheChecklistEquipe.get(chave);
   let rows;
   if(cache&&Date.now()-cache.em<20000)rows=cache.rows;
   else{
     const r=await sb.from('checklist_itens').select('id,nome,ordem').eq('empresa_id',p.empresa_id).eq('obra_id',id).order('ordem',{ascending:true});
     if(r.error)throw r.error;
     rows=r.data||[];
     cacheChecklistEquipe.set(chave,{em:Date.now(),rows});
   }
   if(seq!==current||!back.isConnected)return;
   check.replaceChildren(new Option(rows.length?'Sem checklist / etapa':'Sem etapas cadastradas nesta obra',''));
   for(const x of rows)check.add(new Option(String(x.nome||'Etapa'),String(x.id)));
   check.dataset.ready='1';
  }catch(e){
   if(seq!==current||!back.isConnected)return;
   check.innerHTML='<option value="">Falha ao carregar — selecione a obra novamente</option>';
   check.dataset.ready='error';console.warn('Equipe: checklist indisponível',e);
  }finally{if(seq===current&&back.isConnected)check.disabled=false}
 }
 obra.addEventListener('change',carregar);
 void carregar();
}
function checklistIdEquipe(back){
 const check=back.querySelector('.check'),obra=back.querySelector('.obra');
 if(!check||!obra||check.dataset.ready!=='1'||check.dataset.obra!==obra.value){
  alert('Aguarde o carregamento do checklist da obra.');return undefined;
 }
 return check.value||null;
}
async function diaria(f){const b=modal('Registrar diária',`<p><b>${esc(f.nome)}</b></p><label>Obra</label><select class="obra">${opts(f.obra_id||'')}</select><label>Checklist / etapa da obra</label><select class="check"><option value="">Sem checklist / etapa</option></select><label>Data</label><input class="data" type="date" value="${hoje()}"><label>Tipo</label><select class="qtd"><option value="1">Diária inteira</option><option value="0.5">Meia diária</option></select><label>Valor da diária</label><input class="valor" type="number" min="0" step="0.01" value="${Number(f.valor_diaria||0)}"><label>Observações</label><input class="obs"><div class="modalActions"><button class="btn cancelar">Cancelar</button><button class="btn salvar">Registrar</button></div>`);prepararChecklistEquipe(b);void atualizarObrasNoModal(b);b.querySelector('.salvar').onclick=async()=>{const botaoSalvar=b.querySelector('.salvar');if(botaoSalvar.disabled)return;botaoSalvar.disabled=true;try{const checklist_id=checklistIdEquipe(b);if(checklist_id===undefined)return;const obra_id=b.querySelector('.obra').value,data=b.querySelector('.data').value,q=Number(b.querySelector('.qtd').value),v=Number(b.querySelector('.valor').value);if(!obra_id||!data||v<=0)return alert('Selecione a obra, data e valor.');const sb=await OBRIX_BACKEND.init();await validarRegistroAtivo(sb,f,obra_id);const r=await sb.from('diarias').insert({empresa_id:profile.empresa_id,funcionario_id:f.id,obra_id,checklist_id,data,quantidade:q,valor_unitario:v,valor_total:v*q,paga:false,observacoes:b.querySelector('.obs').value.trim()||null});if(r.error)return alert(r.error.message);b.remove();window.OBRIX_SUCESSO?.('Diária registrada com sucesso.');await refresh({force:true})}finally{if(botaoSalvar.isConnected)botaoSalvar.disabled=false}}}async function vale(f){const b=modal('Registrar Vale',`<p><b>${esc(f.nome)}</b></p><label>Obra</label><select class="obra">${opts(f.obra_id||'')}</select><label>Checklist / etapa da obra</label><select class="check"><option value="">Sem checklist / etapa</option></select><label>Valor</label><input class="valor" type="number" min="0" step="0.01"><label>Data</label><input class="data" type="date" value="${hoje()}"><label>Observações</label><input class="obs"><div class="modalActions"><button class="btn cancelar">Cancelar</button><button class="btn salvar">Registrar Vale</button></div>`);prepararChecklistEquipe(b);void atualizarObrasNoModal(b);b.querySelector('.salvar').onclick=async()=>{const botaoSalvar=b.querySelector('.salvar');if(botaoSalvar.disabled)return;botaoSalvar.disabled=true;try{const checklist_id=checklistIdEquipe(b);if(checklist_id===undefined)return;const obra_id=b.querySelector('.obra').value,v=Number(b.querySelector('.valor').value),data=b.querySelector('.data').value;if(!obra_id||v<=0||!data)return alert('Selecione a obra e informe valor e data.');const sb=await OBRIX_BACKEND.init();await validarRegistroAtivo(sb,f,obra_id);const r=await sb.rpc('obrix_registrar_vale_financeiro',{
  p_funcionario_id:f.id,p_obra_id:obra_id,p_checklist_id:checklist_id,
  p_valor:v,p_data:data,p_observacoes:b.querySelector('.obs').value.trim()||null
 });if(r.error)throw r.error;
 b.remove();window.OBRIX_SUCESSO?.('Vale registrado com sucesso.');await refresh({force:true,financeiro:true});
 try{window.OBRIX_FIN?.render?.()}catch(err){console.warn('Financeiro após vale:',err)}}catch(e){alert(e?.message||'Não foi possível registrar o vale.')}finally{if(botaoSalvar.isConnected)botaoSalvar.disabled=false}}}async function bonusExtra(f){const b=modal('Bônus e Extras',`<p><b>${esc(f.nome)}</b></p><label>Obra</label><select class="obra">${opts(f.obra_id||'')}</select><label>Checklist / etapa da obra</label><select class="check"><option value="">Sem checklist / etapa</option></select><label>Tipo</label><select class="tipo"><option value="bonus">Bônus</option><option value="extra">Extra</option></select><label>Descrição</label><input class="desc"><label>Valor</label><input class="valor" type="number" min="0" step="0.01"><label>Data</label><input class="data" type="date" value="${hoje()}"><div class="modalActions"><button class="btn cancelar">Cancelar</button><button class="btn salvar">Registrar</button></div>`);prepararChecklistEquipe(b);void atualizarObrasNoModal(b);b.querySelector('.salvar').onclick=async()=>{const botaoSalvar=b.querySelector('.salvar');if(botaoSalvar.disabled)return;botaoSalvar.disabled=true;try{const checklist_id=checklistIdEquipe(b);if(checklist_id===undefined)return;const obra_id=b.querySelector('.obra').value,v=Number(b.querySelector('.valor').value),data=b.querySelector('.data').value;if(!obra_id||v<=0||!data)return alert('Selecione a obra e informe valor e data.');const sb=await OBRIX_BACKEND.init();await validarRegistroAtivo(sb,f,obra_id);const r=await sb.from('bonus_extras').insert({empresa_id:profile.empresa_id,funcionario_id:f.id,obra_id,checklist_id,tipo:b.querySelector('.tipo').value,descricao:b.querySelector('.desc').value.trim()||'Bônus/Extra',valor:v,data,pago:false});if(r.error)return alert(r.error.message);b.remove();window.OBRIX_SUCESSO?.('Bônus ou extra registrado com sucesso.');await refresh({force:true})}finally{if(botaoSalvar.isConnected)botaoSalvar.disabled=false}}}async function pagar(f){
 const api=window.OBRIX_LIQUIDACAO_SEGURA;
 if(!api)return window.OBRIX_AVISO('Atualize a versão de teste do OBRIX para carregar a baixa de pagamentos.','Equipe');
 const ds=diarias.filter(x=>String(x.funcionario_id)===String(f.id)&&!x.paga);
 const vs=vales.filter(x=>String(x.funcionario_id)===String(f.id)&&!x.quitado&&!x.estornado_em);
 const bs=bonus.filter(x=>String(x.funcionario_id)===String(f.id)&&!x.pago);
 const r=api.calcular({ds,bs,vs});
 if(!ds.length&&!vs.length&&!bs.length)return window.OBRIX_AVISO('Não há valores em aberto para este funcionário.','Equipe');
 const brutoDestino=r.negativas.length>0&&r.liquido>0;
 const obrasListadas=api.opcoesDeObra(r,window.obras||[]);
 const escolha=brutoDestino&&r.obrasTrabalhadas.length>1;
 const opcoes=obrasListadas.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.nome)+'</option>').join('');
 const campo=escolha?
  '<label>Obra para lançar o saldo líquido</label><select class="obraPagamento" aria-label="Obra que receberá o saldo líquido"><option value="">Selecione a obra do pagamento</option>'+opcoes+'</select><small class="muted">As diárias, bônus e vales continuam vinculados às obras originais. Sem rateio automático.</small>':
  brutoDestino?'<p class="muted">Vale de outra obra será compensado. O saldo líquido será lançado na obra onde houve serviço.</p>':'';
 const b=modal('Pagar funcionário',`<p><b>${esc(f.nome)}</b></p><div class="grid">
 <div class="mini"><small>Diárias</small><b>${money(r.diarias/100)}</b></div>
 <div class="mini"><small>Bônus e Extras</small><b>${money(r.bonus/100)}</b></div>
 <div class="mini"><small>Vales</small><b>-${money(r.vales/100)}</b></div>
 <div class="mini"><small>Líquido</small><b>${money(r.liquido/100)}</b></div></div>
 <label>Data do pagamento</label><input class="data" type="date" value="${hoje()}">${campo}
 <div class="modalActions"><button class="btn cancelar">Cancelar</button><button class="btn confirmar">Confirmar pagamento</button></div>`);
 const btn=b.querySelector('.confirmar');
 btn.onclick=async()=>{
   if(btn.disabled)return;
   if(r.erros.length)return window.OBRIX_AVISO(r.erros.join(' '),'Pagamento da equipe');
   const destino=b.querySelector('.obraPagamento')?.value||(!escolha&&brutoDestino?obrasListadas[0]?.id:'');
   if(escolha&&!destino)return window.OBRIX_AVISO('Selecione a obra que receberá os R$ '+(r.liquido/100).toLocaleString('pt-BR',{minimumFractionDigits:2})+' restantes.','Pagamento da equipe');
   const data=b.querySelector('.data')?.value;
   if(!data)return window.OBRIX_AVISO('Informe a data do pagamento.','Pagamento da equipe');
   const confirmado=await window.OBRIX_CONFIRMAR_PAGAMENTO({
     titulo:'Confirmar pagamento',
     mensagem:f.nome+'\\nBruto: '+money(r.bruto/100)+'\\nVales: -'+money(r.vales/100)+'\\nLíquido: '+money(r.liquido/100),
     confirmar:'Confirmar pagamento'});
   if(!confirmado)return;
   btn.disabled=true;btn.textContent='Registrando...';
   try{
     const resultado=await api.registrar({funcionarioId:f.id,data,obraPagamentoId:destino,esperado:r.liquido/100});
     b.remove();
     try{await refresh({force:true,financeiro:true})}catch(e){console.warn('Equipe: baixa gravada; sincronização pendente',e)}
     window.OBRIX_SUCESSO?.('Pagamento de '+money(resultado.liquido)+' registrado com sucesso.');
   }catch(e){await window.OBRIX_AVISO(e?.message||'Não foi possível concluir a baixa.','Pagamento da equipe')}
   finally{if(btn.isConnected){btn.disabled=false;btn.textContent='Confirmar pagamento'}}
 };
}
window.equipeAcao=(id,tipo)=>{const f=funcionarios.find(x=>String(x.id)===String(id));if(!f)return alert('Funcionário não encontrado.');if(['diaria','vale','bonus'].includes(tipo)&&f.ativo!==true)return alert('Somente funcionários ativos podem receber novos registros.');if(tipo==='diaria')return diaria(f);if(tipo==='vale')return vale(f);if(tipo==='bonus')return bonusExtra(f);if(tipo==='pagar')return pagar(f);if(tipo==='excluir')return excluir(f)};function enhance(){const sec=document.getElementById('equipe');if(!sec)return;const btn=sec.querySelector('.sectionHead .btn');if(btn){btn.removeAttribute('onclick');btn.textContent='+ Funcionário';btn.onclick=()=>funcionario()}const old=window.renderEquipe;window.renderEquipe=function(){old();document.querySelectorAll('#listaEquipe .card.item').forEach((card,i)=>{const f=funcionarios[i];if(!f)return;let row=card.querySelector('.gestaoFunc');if(!row){row=document.createElement('div');row.className='actions gestaoFunc';row.innerHTML='<button class="editarF">Editar</button><button class="toggleF"></button><button class="excluirF">Excluir</button>';card.appendChild(row)}row.querySelector('.editarF').onclick=()=>funcionario(f);row.querySelector('.toggleF').textContent=f.ativo===false?'Ativar':'Desativar';row.querySelector('.toggleF').onclick=()=>toggle(f);row.querySelector('.excluirF').onclick=()=>excluir(f)})};window.renderEquipe()}const css=document.createElement('style');css.textContent='.modalBack{position:fixed;inset:0;background:#0008;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px}.modal{background:#fff;color:#0f172a;width:min(560px,100%);max-height:90vh;overflow:auto;border-radius:18px;padding:20px}.modal input,.modal select{width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:10px;margin:5px 0 12px;font-size:16px}.modalActions{display:flex;gap:8px;margin-top:14px;position:sticky;bottom:0;background:inherit;padding-top:10px;padding-bottom:max(4px,env(safe-area-inset-bottom))}.modalActions .btn{flex:1;display:inline-flex;align-items:center;justify-content:center;min-height:44px}';document.head.appendChild(css);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(enhance,150));else setTimeout(enhance,150);window.OBRIX_EQUIPE={refresh};const abrirOriginal=window.abrir;if(typeof abrirOriginal==='function'&&!abrirOriginal.__obrixEquipeSync){const abrirSync=function(id){const r=abrirOriginal.apply(this,arguments);if(id==='equipe')setTimeout(()=>refresh().catch(e=>console.warn('Equipe: atualização indisponível',e)),0);return r};abrirSync.__obrixEquipeSync=true;window.abrir=abrirSync}})();