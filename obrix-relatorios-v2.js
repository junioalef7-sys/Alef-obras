(()=>{'use strict';
const $=id=>document.getElementById(id);
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={entrada:'Entrada',material:'Material',mao_de_obra:'Mão de obra',servico_terceirizado:'Serviço terceirizado',ferramentas_equipamentos:'Ferramentas e Equipamentos',locacao:'Locação',transporte:'Transporte',combustivel:'Combustível',outros:'Outros'};
let dadosAtuais=null,modo='financeiro';
function ensure(){
  if($('relatoriosMain'))return;
  const app=$('app'),bottom=app?.querySelector('.bottom');if(!app||!bottom)return;
  const m=document.createElement('main');m.id='relatoriosMain';m.className='hidden';
  m.innerHTML=`<div class="hero"><h1>Relatórios</h1><p>Financeiro, equipe e trabalhador para conferência, impressão e PDF</p></div>
  <div class="relTipo"><button class="btn active" id="relTipoFinanceiro">Financeiro</button><button class="btn" id="relTipoEquipe">Equipe / Trabalhador</button></div>
  <div class="card relFiltros" id="relFinFiltros"><h3>Relatório Financeiro</h3><div class="relGrid"><select id="relObra"><option value="">Todas as obras</option></select><input id="relInicio" type="date"><input id="relFim" type="date"><button class="btn" id="relGerar">Gerar relatório</button></div></div>
  <div class="card relFiltros hidden" id="relEqFiltros"><h3>Relatório da Equipe / Trabalhador</h3><div class="relGrid"><select id="relFuncionario"><option value="">Toda a equipe</option></select><input id="relEqInicio" type="date"><input id="relEqFim" type="date"><button class="btn" id="relEqGerar">Gerar relatório</button></div></div>
  <div id="relResultado" class="hidden"></div>`;
  app.insertBefore(m,bottom);
  $('relTipoFinanceiro').onclick=()=>trocar('financeiro');$('relTipoEquipe').onclick=()=>trocar('equipe');$('relGerar').onclick=gerarFinanceiro;$('relEqGerar').onclick=gerarEquipe;
}
function esconderOutros(){['inicio','obras','equipe','financeiroMain','estoqueMain','assinaturaMain','menuMain'].forEach(id=>$(id)?.classList.add('hidden'));document.querySelectorAll('.bottom button').forEach(b=>b.classList.remove('active'))}
function trocar(novo){modo=novo;$('relFinFiltros')?.classList.toggle('hidden',novo!=='financeiro');$('relEqFiltros')?.classList.toggle('hidden',novo!=='equipe');$('relTipoFinanceiro')?.classList.toggle('active',novo==='financeiro');$('relTipoEquipe')?.classList.toggle('active',novo==='equipe');$('relResultado')?.classList.add('hidden');dadosAtuais=null}
async function carregarFiltros(){
  const [os,fs]=await Promise.all([OBRIX_BACKEND.readTable('obras','criado_em').catch(()=>[]),OBRIX_BACKEND.readTable('funcionarios','criado_em').catch(()=>[])]);
  window.obras=os||window.obras||[];window.funcionarios=fs||window.funcionarios||[];
  const so=$('relObra');if(so)so.innerHTML='<option value="">Todas as obras</option>'+((os||[]).map(o=>`<option value="${o.id}">${esc(o.nome||'Obra')}</option>`).join(''));
  const sf=$('relFuncionario');if(sf)sf.innerHTML='<option value="">Toda a equipe</option>'+((fs||[]).map(f=>`<option value="${f.id}">${esc(f.nome||'Funcionário')}${f.cargo?' — '+esc(f.cargo):''}</option>`).join(''));
}
async function open(){ensure();esconderOutros();$('relatoriosMain')?.classList.remove('hidden');await carregarFiltros();scrollTo({top:0,behavior:'smooth'})}
function noPeriodo(data,inicio,fim){const d=String(data||'').slice(0,10);return (!inicio||d>=inicio)&&(!fim||d<=fim)}
function obraNome(id,obras){return (obras||[]).find(o=>String(o.id)===String(id))?.nome||'Sem obra'}
function funcNome(id,funcs){return (funcs||[]).find(f=>String(f.id)===String(id))?.nome||'Funcionário'}
function periodoTexto(inicio,fim){return inicio||fim?`${inicio||'início'} até ${fim||'hoje'}`:'Todo o período'}
function abrirImpressao(html){const w=window.open('','_blank');if(!w)return alert('O navegador bloqueou a janela de impressão. Permita pop-ups para o OBRIX e tente novamente.');w.document.open();w.document.write(html);w.document.close()}
async function gerarFinanceiro(){
  const btn=$('relGerar');if(btn){btn.disabled=true;btn.textContent='Gerando...'}
  try{
    const [fin,extras,obrasDb]=await Promise.all([OBRIX_BACKEND.readTable('financeiro','data'),OBRIX_BACKEND.readTable('servicos_extras','criado_em'),OBRIX_BACKEND.readTable('obras','criado_em')]);
    const obraId=$('relObra').value,inicio=$('relInicio').value,fim=$('relFim').value,obras=(obrasDb||[]).filter(o=>!obraId||String(o.id)===String(obraId)),ids=new Set(obras.map(o=>String(o.id)));
    const f=(fin||[]).filter(x=>(!x.status_lancamento||x.status_lancamento==='ativo')&&(!obraId||ids.has(String(x.obra_id)))&&noPeriodo(x.data,inicio,fim));
    const ex=(extras||[]).filter(x=>!obraId||ids.has(String(x.obra_id)));
    const contrato=obras.reduce((s,o)=>s+Number(o.valor_contrato||0),0)+ex.reduce((s,x)=>s+Number(x.valor||0),0),recebido=f.filter(x=>x.tipo==='receita').reduce((s,x)=>s+Number(x.valor||0),0),despesas=f.filter(x=>x.tipo==='despesa').reduce((s,x)=>s+Number(x.valor||0),0),resultado=contrato-despesas,margem=contrato>0?(resultado/contrato)*100:0,nomeObra=obraId?(obras[0]?.nome||'Obra'):'Todas as obras';
    dadosAtuais={tipo:'financeiro',obra:nomeObra,inicio,fim,contrato,recebido,despesas,resultado,margem,lancamentos:f,obras:obrasDb||[]};
    const ordenados=f.slice().sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
    $('relResultado').innerHTML=`<div class="kpis relKpis"><div class="kpi"><small>Contrato atualizado</small><strong>${money(contrato)}</strong></div><div class="kpi"><small>Recebido</small><strong>${money(recebido)}</strong></div><div class="kpi"><small>Despesas</small><strong>${money(despesas)}</strong></div><div class="kpi"><small>Resultado</small><strong>${money(resultado)}</strong></div></div><div class="sectionHead"><strong>Lançamentos • Margem ${margem.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%</strong><button class="btn" id="relImprimirAtual">Imprimir / Salvar PDF</button></div><div>${ordenados.length?ordenados.map(x=>`<div class="card item"><h3>${esc(x.descricao||'Lançamento')}</h3><div class="muted">${esc(obraNome(x.obra_id,obrasDb))} • ${esc(x.data||'')} • ${esc(labels[x.categoria]||x.categoria||'')}</div><div class="grid"><div class="mini"><small>${x.tipo==='receita'?'Receita':'Despesa'}</small><b>${money(x.valor)}</b></div></div></div>`).join(''):'<div class="card muted">Nenhum lançamento no período selecionado.</div>'}</div>`;
    $('relResultado').classList.remove('hidden');$('relImprimirAtual').onclick=imprimirAtual;
  }catch(e){alert(e.message||'Não foi possível gerar o relatório.')}finally{if(btn){btn.disabled=false;btn.textContent='Gerar relatório'}}
}
async function gerarEquipe(){
  const btn=$('relEqGerar');if(btn){btn.disabled=true;btn.textContent='Gerando...'}
  try{
    const p=await OBRIX_BACKEND.profile(),sb=await OBRIX_BACKEND.init(),eid=p.empresa_id;
    const [fr,dr,vr,br,pr,or]=await Promise.all([
      sb.from('funcionarios').select('*').eq('empresa_id',eid),
      sb.from('diarias').select('*').eq('empresa_id',eid),
      sb.from('vales').select('*').eq('empresa_id',eid),
      sb.from('bonus_extras').select('*').eq('empresa_id',eid),
      sb.from('pagamentos_equipe').select('*').eq('empresa_id',eid),
      sb.from('obras').select('*').eq('empresa_id',eid)
    ]);
    const erro=[fr,dr,vr,br,pr,or].find(r=>r.error);if(erro)throw erro.error;
    const funcs=fr.data||[],obras=or.data||[],funcId=$('relFuncionario').value,inicio=$('relEqInicio').value,fim=$('relEqFim').value,ids=new Set(funcs.filter(f=>!funcId||String(f.id)===String(funcId)).map(f=>String(f.id)));
    const ds=(dr.data||[]).filter(x=>ids.has(String(x.funcionario_id))&&noPeriodo(x.data,inicio,fim));
    const vs=(vr.data||[]).filter(x=>ids.has(String(x.funcionario_id))&&noPeriodo(x.data,inicio,fim));
    const bs=(br.data||[]).filter(x=>ids.has(String(x.funcionario_id))&&noPeriodo(x.data,inicio,fim));
    const ps=(pr.data||[]).filter(x=>ids.has(String(x.funcionario_id))&&!x.estornado_em&&noPeriodo(x.data_pagamento,inicio,fim));
    const qtdDiarias=ds.reduce((s,x)=>s+Number(x.quantidade||0),0),valorDiarias=ds.reduce((s,x)=>s+Number(x.valor_total||0),0),vales=vs.reduce((s,x)=>s+Number(x.valor||0),0),bonus=bs.reduce((s,x)=>s+Number(x.valor||0),0),totalPago=ps.reduce((s,x)=>s+Number(x.valor_liquido||0),0);
    const abertoDiarias=ds.filter(x=>!x.paga).reduce((s,x)=>s+Number(x.valor_total||0),0),abertoVales=vs.filter(x=>!x.quitado).reduce((s,x)=>s+Number(x.valor||0),0),abertoBonus=bs.filter(x=>!x.pago).reduce((s,x)=>s+Number(x.valor||0),0),liquidoAberto=abertoDiarias+abertoBonus-abertoVales;
    const nome=funcId?(funcs.find(f=>String(f.id)===String(funcId))?.nome||'Funcionário'):'Toda a equipe';
    dadosAtuais={tipo:'equipe',nome,inicio,fim,funcs,obras,diarias:ds,valesMov:vs,bonusMov:bs,pagamentos:ps,qtdDiarias,valorDiarias,vales,bonus,totalPago,liquidoAberto};
    const movimentos=[
      ...ds.map(x=>({data:x.data,funcionario_id:x.funcionario_id,obra_id:x.obra_id,tipo:'Diária',descricao:Number(x.quantidade||0)===0.5?'Meia diária':'Diária',valor:Number(x.valor_total||0),status:x.paga?'Paga':'Em aberto'})),
      ...vs.map(x=>({data:x.data,funcionario_id:x.funcionario_id,obra_id:x.obra_id,tipo:'Vale',descricao:x.observacoes||'Vale',valor:-Number(x.valor||0),status:x.quitado?'Quitado':'Em aberto'})),
      ...bs.map(x=>({data:x.data,funcionario_id:x.funcionario_id,obra_id:x.obra_id,tipo:x.tipo==='bonus'?'Bônus':'Extra',descricao:x.descricao||'Bônus/Extra',valor:Number(x.valor||0),status:x.pago?'Pago':'Em aberto'}))
    ].sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
    $('relResultado').innerHTML=`<div class="kpis relKpis"><div class="kpi"><small>Diárias</small><strong>${qtdDiarias.toLocaleString('pt-BR')}</strong><span>${money(valorDiarias)}</span></div><div class="kpi"><small>Vales</small><strong>${money(vales)}</strong></div><div class="kpi"><small>Bônus e Extras</small><strong>${money(bonus)}</strong></div><div class="kpi"><small>Total pago</small><strong>${money(totalPago)}</strong></div><div class="kpi"><small>Líquido em aberto</small><strong>${money(liquidoAberto)}</strong></div></div><div class="sectionHead"><strong>${esc(nome)} • ${esc(periodoTexto(inicio,fim))}</strong><button class="btn" id="relImprimirAtual">Imprimir / Salvar PDF</button></div><h3>Movimentações</h3><div>${movimentos.length?movimentos.map(x=>`<div class="card item"><h3>${esc(x.tipo)} — ${esc(x.descricao)}</h3><div class="muted">${esc(funcNome(x.funcionario_id,funcs))} • ${esc(obraNome(x.obra_id,obras))} • ${esc(x.data||'')} • ${esc(x.status)}</div><div class="grid"><div class="mini"><small>Valor</small><b>${money(x.valor)}</b></div></div></div>`).join(''):'<div class="card muted">Nenhuma movimentação no período.</div>'}</div><h3>Pagamentos realizados</h3><div>${ps.length?ps.slice().sort((a,b)=>String(b.data_pagamento||'').localeCompare(String(a.data_pagamento||''))).map(x=>`<div class="card item"><h3>${esc(funcNome(x.funcionario_id,funcs))}</h3><div class="muted">${esc(x.data_pagamento||'')}</div><div class="grid"><div class="mini"><small>Bruto</small><b>${money(x.valor_bruto)}</b></div><div class="mini"><small>Vales</small><b>${money(x.valor_vales)}</b></div><div class="mini"><small>Líquido pago</small><b>${money(x.valor_liquido)}</b></div></div></div>`).join(''):'<div class="card muted">Nenhum pagamento realizado no período.</div>'}</div>`;
    $('relResultado').classList.remove('hidden');$('relImprimirAtual').onclick=imprimirAtual;
  }catch(e){alert(e.message||'Não foi possível gerar o relatório da equipe.')}finally{if(btn){btn.disabled=false;btn.textContent='Gerar relatório'}}
}
function imprimirAtual(){
  if(!dadosAtuais)return alert('Gere o relatório primeiro.');const d=dadosAtuais;
  if(d.tipo==='financeiro'){
    const linhas=d.lancamentos.slice().sort((a,b)=>String(b.data||'').localeCompare(String(a.data||''))).map(x=>`<tr><td>${esc(x.data||'')}</td><td>${esc(obraNome(x.obra_id,d.obras))}</td><td>${esc(x.descricao||'')}</td><td>${esc(labels[x.categoria]||x.categoria||'')}</td><td>${x.tipo==='receita'?'Receita':'Despesa'}</td><td>${money(x.valor)}</td></tr>`).join('');
    return abrirImpressao(`<!doctype html><html><head><meta charset="utf-8"><title>Relatório Financeiro OBRIX</title>${cssPrint()}</head><body><h1>OBRIX — Relatório Financeiro</h1><div class="meta">${esc(d.obra)} • ${esc(periodoTexto(d.inicio,d.fim))}</div><div class="resumo"><div class="box"><small>Contrato atualizado</small><b>${money(d.contrato)}</b></div><div class="box"><small>Recebido</small><b>${money(d.recebido)}</b></div><div class="box"><small>Despesas</small><b>${money(d.despesas)}</b></div><div class="box"><small>Resultado</small><b>${money(d.resultado)}</b></div></div><p><strong>Margem:</strong> ${d.margem.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%</p><table><thead><tr><th>Data</th><th>Obra</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th></tr></thead><tbody>${linhas||'<tr><td colspan="6">Nenhum lançamento.</td></tr>'}</tbody></table><script>window.onload=()=>setTimeout(()=>window.print(),150);<\/script></body></html>`);
  }
  const mov=[...d.diarias.map(x=>({data:x.data,fid:x.funcionario_id,oid:x.obra_id,tipo:'Diária',desc:Number(x.quantidade||0)===0.5?'Meia diária':'Diária',valor:Number(x.valor_total||0),status:x.paga?'Paga':'Em aberto'})),...d.valesMov.map(x=>({data:x.data,fid:x.funcionario_id,oid:x.obra_id,tipo:'Vale',desc:x.observacoes||'Vale',valor:-Number(x.valor||0),status:x.quitado?'Quitado':'Em aberto'})),...d.bonusMov.map(x=>({data:x.data,fid:x.funcionario_id,oid:x.obra_id,tipo:x.tipo==='bonus'?'Bônus':'Extra',desc:x.descricao||'Bônus/Extra',valor:Number(x.valor||0),status:x.pago?'Pago':'Em aberto'}))].sort((a,b)=>String(b.data||'').localeCompare(String(a.data||''))).map(x=>`<tr><td>${esc(x.data||'')}</td><td>${esc(funcNome(x.fid,d.funcs))}</td><td>${esc(obraNome(x.oid,d.obras))}</td><td>${esc(x.tipo)}</td><td>${esc(x.desc)}</td><td>${esc(x.status)}</td><td>${money(x.valor)}</td></tr>`).join('');
  const pags=d.pagamentos.slice().sort((a,b)=>String(b.data_pagamento||'').localeCompare(String(a.data_pagamento||''))).map(x=>`<tr><td>${esc(x.data_pagamento||'')}</td><td>${esc(funcNome(x.funcionario_id,d.funcs))}</td><td>${money(x.valor_bruto)}</td><td>${money(x.valor_vales)}</td><td>${money(x.valor_liquido)}</td></tr>`).join('');
  abrirImpressao(`<!doctype html><html><head><meta charset="utf-8"><title>Relatório da Equipe OBRIX</title>${cssPrint()}</head><body><h1>OBRIX — Relatório da Equipe / Trabalhador</h1><div class="meta">${esc(d.nome)} • ${esc(periodoTexto(d.inicio,d.fim))}</div><div class="resumo"><div class="box"><small>Diárias</small><b>${d.qtdDiarias.toLocaleString('pt-BR')} • ${money(d.valorDiarias)}</b></div><div class="box"><small>Vales</small><b>${money(d.vales)}</b></div><div class="box"><small>Bônus e Extras</small><b>${money(d.bonus)}</b></div><div class="box"><small>Total pago</small><b>${money(d.totalPago)}</b></div><div class="box"><small>Líquido em aberto</small><b>${money(d.liquidoAberto)}</b></div></div><h2>Movimentações</h2><table><thead><tr><th>Data</th><th>Funcionário</th><th>Obra</th><th>Tipo</th><th>Descrição</th><th>Status</th><th>Valor</th></tr></thead><tbody>${mov||'<tr><td colspan="7">Nenhuma movimentação.</td></tr>'}</tbody></table><h2>Pagamentos realizados</h2><table><thead><tr><th>Data</th><th>Funcionário</th><th>Bruto</th><th>Vales</th><th>Líquido pago</th></tr></thead><tbody>${pags||'<tr><td colspan="5">Nenhum pagamento.</td></tr>'}</tbody></table><script>window.onload=()=>setTimeout(()=>window.print(),150);<\/script></body></html>`);
}
function cssPrint(){return `<style>body{font-family:Arial,sans-serif;color:#111;padding:28px}h1{margin:0 0 4px}h2{font-size:16px;margin-top:22px}.meta{color:#555;margin-bottom:22px}.resumo{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0}.box{border:1px solid #ccc;border-radius:8px;padding:10px}.box small{display:block;color:#666}.box b{display:block;margin-top:5px}table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:18px}th,td{border-bottom:1px solid #ddd;padding:7px;text-align:left}th{background:#f3f4f6}@media print{body{padding:0}}@page{size:A4;margin:12mm}</style>`}
const css=document.createElement('style');css.textContent='.relTipo{display:flex;gap:8px;margin-bottom:12px}.relTipo .btn{background:#e2e8f0;color:#0f172a}.relTipo .btn.active{background:#0f172a;color:#fff}.relFiltros h3{margin-top:0}.relGrid{display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:8px;align-items:center}.relGrid select,.relGrid input{width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:10px;background:transparent;color:inherit}.relKpis{margin-top:14px}.relKpis .kpi span{display:block;margin-top:5px;font-size:13px;font-weight:700;color:#64748b}@media(max-width:760px){.relGrid{grid-template-columns:1fr 1fr}.relGrid select,.relGrid .btn{grid-column:1/-1}}@media(max-width:480px){.relTipo{display:grid;grid-template-columns:1fr}.relGrid{grid-template-columns:1fr}.relGrid select,.relGrid .btn{grid-column:auto}}';document.head.appendChild(css);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(ensure,150));else setTimeout(ensure,150);
window.OBRIX_RELATORIOS={open,gerar:gerarFinanceiro,gerarEquipe,imprimir:imprimirAtual};
})();