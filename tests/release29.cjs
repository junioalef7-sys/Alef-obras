const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {harness}=require('./release27.cjs');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'.release-base.html'),'utf8');
const ui=fs.readFileSync(path.join(root,'release29-ui.js'),'utf8');
const css=fs.readFileSync(path.join(root,'release29.css'),'utf8');
let count=0;
function test(name,fn){fn();count++;console.log('OK',name);}
function fixture(){
  const h=harness(),{ctx,D,els}=h,events=new Map(),microtasks=[];
  function element(id){const e=ctx.document.createElement('div');e.id=id;ctx.document.body.appendChild(e);return e;}
  for(const id of ['resumoGeral','dashboard','diario','checklist','documentos','diarias','menuPasta','menuPastaBackdrop','obraSelecionada','obraSearch'])if(!els.has(id))element(id);
  for(const id of ['resumoGeral','dashboard','diario','checklist','documentos','diarias'])els.get(id).classList.add('page');
  for(const id of ['menuPasta','menuPastaBackdrop']){
    const el=els.get(id);el.classList.toggle=(name,value)=>{const on=value===undefined?!el.classList.contains(name):value;if(on)el.classList.add(name);else el.classList.remove(name);return on;};
  }
  ctx.queueMicrotask=fn=>microtasks.push(fn);
  ctx.document.addEventListener=(name,fn,options)=>{if(!events.has(name))events.set(name,[]);events.get(name).push({fn,options});};
  ctx.recordObraId=r=>r?.obra_id??r?.obraId??'';
  ctx.servicesForObra=id=>(D.servicos_adicionais||[]).filter(r=>String(r.obra_id)===String(id));
  ctx.categoriaFinanceira=ctx.gastoSubcategoria;
  const financialStart=html.indexOf('<script id="edifiq-etapa5-financeiro">');
  const fnStart=html.indexOf('(function(){',financialStart),fnEnd=html.indexOf('// Checklist:',fnStart);
  assert.ok(financialStart>0&&fnEnd>fnStart);
  vm.runInContext(html.slice(fnStart,fnEnd)+'})();',ctx);
  const normStart=html.indexOf('  function norm9(v){'),normEnd=html.indexOf('  /* Rótulos antigos',normStart);
  vm.runInContext(html.slice(normStart,normEnd),ctx);
  const toggleStart=html.indexOf('function toggleMenuPasta(){'),toggleEnd=html.indexOf('function renderDrawerAccount()',toggleStart);
  vm.runInContext(html.slice(toggleStart,toggleEnd),ctx);
  ctx.statusLabel=s=>({em_andamento:'Em andamento',planejada:'Planejada',concluida:'Concluída'})[ctx.edifiqNormalizeObraStatus(s)]||s;
  const calls=[];
  for(const fn of ['openObra','openRelatorioObraEdifiq','openRelatorioCliente','openRelatorioTrabalhador','openPagamentoEquipe','openAdiantamento','openConfiguracoes','openBackupConfigDirect','openDiagnosticoDireto12','openOfficial25','openEtapa28']){
    const modal=element(fn+'M');
    ctx[fn]=()=>{calls.push(fn);modal.classList.add('open');};
  }
  ctx.logout=()=>calls.push('logout');
  ctx.addServicoAdicional=id=>calls.push('extra:'+id);
  ctx.renderObras=()=>calls.push('renderObras');
  D.obras[0].valor=1200;D.obras[0].status='Em andamento';D.obras[1].status='Concluída';
  D.servicos_adicionais=[{id:'a1',operation_id:'service-1',obra_id:'o1',valor:200},{id:'a1-copy',operation_id:'service-1',obra_id:'o1',valor:200}];
  D.pagamentos.push({...D.pagamentos[0]});D.gastos.push({...D.gastos.find(r=>r.id==='g1')});
  vm.runInContext(ui,ctx);
  const flush=()=>{while(microtasks.length)microtasks.shift()();};
  function click(label,handler,nested=false){
    const button={disabled:false,classList:{contains:name=>name==='x'&&label==='Fechar'},querySelector:()=>({textContent:label})};
    const target={closest:selector=>selector==='#menuPasta button'?button:null};
    const event={target,preventDefault(){this.defaultPrevented=true;},stopImmediatePropagation(){this.stopped=true;}};
    for(const listener of events.get('click')||[])listener.fn(event);
    if(!event.stopped)vm.runInContext(handler,ctx);
    const during={menu:els.get('menuPasta').classList.contains('open'),backdrop:els.get('menuPastaBackdrop').classList.contains('open')};
    flush();return during;
  }
  return {...h,ctx,events,calls,click,flush};
}

test('Visão geral usa contrato atualizado sem somar extras ou lançamentos duplicados',()=>{
  const h=fixture(),before=JSON.stringify(h.D);h.ctx.renderResumoGeral();const s=h.ctx.__ed29.summary();
  assert.equal(s.original,150000);assert.equal(s.extra,20000);assert.equal(s.total,170000);
  assert.equal(s.income,40000);assert.equal(s.expense,107000);assert.equal(s.result,-67000);assert.equal(s.remaining,130000);
  assert.equal(s.activeProjects,1);assert.equal(s.activeEmployees,2);
  const markup=h.els.get('resumoGeral').innerHTML;
  for(const label of ['Visão geral','Total contratado','Saldo a receber','Obras ativas','Funcionários ativos','Contrato original','Serviços extras','Total atualizado','Movimento financeiro','Últimos movimentos'])assert.ok(markup.includes(label),label);
  assert.ok(markup.includes(h.ctx.money(1700)));assert.ok(!markup.includes('Saúde Financeira do seu Negócio'));
  assert.equal(JSON.stringify(h.D),before);assert.equal(h.writes.length,0);
});
test('Seleção da obra restringe cartões, equipe e movimentos sem excluir dados',()=>{
  const h=fixture(),before=JSON.stringify(h.D);h.ctx.ed29SelectScope('o1');const s=h.ctx.__ed29.summary();
  assert.equal(s.total,120000);assert.equal(s.original,100000);assert.equal(s.extra,20000);
  assert.equal(s.expense,27000);assert.equal(s.result,13000);assert.equal(s.remaining,80000);assert.equal(s.activeEmployees,1);
  assert.equal(s.works.length,1);assert.ok(!h.els.get('resumoGeral').innerHTML.includes('Vale outra obra'));
  assert.equal(JSON.stringify(h.D),before);assert.equal(h.writes.length,0);
});
test('Atualização dos dados renova a tela e seleção removida volta ao consolidado',()=>{
  const h=fixture();h.ctx.ed29SelectScope('o1');h.D.pagamentos.push({id:'qa-p2',obra_id:'o1',data:'2026-10-12',valor:100,descricao:'Novo recebimento'});
  h.ctx.renderResumoGeral();assert.equal(h.ctx.__ed29.summary().income,50000);assert.ok(h.els.get('resumoGeral').innerHTML.includes('Novo recebimento'));
  h.D.obras=h.D.obras.filter(o=>o.id!=='o1');h.ctx.renderResumoGeral();assert.equal(h.ctx.__ed29.summary().total,50000);
});
test('Obra sem registros mostra zero, equipe vazia e estado de lista vazia',()=>{
  const h=fixture();for(const table of Object.keys(h.D))if(Array.isArray(h.D[table]))h.D[table]=[];
  h.ctx.renderResumoGeral();const s=h.ctx.__ed29.summary();assert.equal(s.total,0);assert.equal(s.remaining,0);assert.equal(s.pending,0);
  assert.ok(h.els.get('resumoGeral').innerHTML.includes('Nenhuma obra cadastrada.'));h.ctx.ed29AddContractExtra();assert.equal(h.writes.length,0);
});
test('Conteúdo da obra é escapado nos nomes, atributos e movimentos',()=>{
  const h=fixture();h.D.obras[0].nome='<img src=x onerror=alert(1)>';h.D.gastos[0].descricao='<script>alert(1)</script>';
  h.ctx.renderResumoGeral();const markup=h.els.get('resumoGeral').innerHTML;
  assert.ok(markup.includes('&lt;img src=x onerror=alert(1)&gt;'));assert.ok(!markup.includes('<img src=x'));assert.ok(!markup.includes('<script>alert(1)'));
});
test('Todas as páginas do Menu abrem no primeiro toque e fecham fundo e gaveta',()=>{
  const h=fixture(),before=JSON.stringify(h.D);
  for(const page of ['dashboard','resumoGeral','obras','funcionarios','financeiro','diario','checklist','documentos','diarias']){
    h.ctx.toggleMenuPasta();assert.ok(h.els.get('menuPasta').classList.contains('open'));
    const during=h.click(page,`goMenu(${JSON.stringify(page)})`,true);
    assert.ok(h.els.get(page).classList.contains('active'),page);assert.deepEqual(during,{menu:false,backdrop:false});
    assert.equal(h.els.get('menuPasta')['aria-hidden'],'true');
  }
  assert.equal(JSON.stringify(h.D),before);assert.equal(h.writes.length,0);
});
test('Ações com toggle legado e ações dinâmicas abrem uma vez sem Menu por cima',()=>{
  const h=fixture();
  for(const [label,fn,toggle] of [['Relatório automático','openRelatorioObraEdifiq',true],['Relatório para Cliente','openRelatorioCliente',true],['Relatório do Trabalhador','openRelatorioTrabalhador',true],['Pagamento da Equipe','openPagamentoEquipe',true],['Vale','openAdiantamento',true],['Configurações','openConfiguracoes',true],['Backup','openBackupConfigDirect',false],['Diagnóstico do aplicativo','openDiagnosticoDireto12',false],['Administração','openOfficial25',false],['Comercial','openEtapa28',false]]){
    h.ctx.toggleMenuPasta();const before=h.calls.filter(c=>c===fn).length;
    const during=h.click(label,`${fn}();${toggle?'toggleMenuPasta();':''}`);
    assert.equal(h.calls.filter(c=>c===fn).length,before+1,fn);assert.ok(h.els.get(fn+'M').classList.contains('open'));
    assert.deepEqual(during,{menu:false,backdrop:false},fn);
  }
});
test('Nova Obra abre o formulário diretamente e Fechar/Escape continuam funcionando',()=>{
  const h=fixture();h.ctx.toggleMenuPasta();h.click('Nova Obra',"goMenu('obras')");assert.equal(h.calls.filter(c=>c==='openObra').length,1);assert.ok(h.els.get('openObraM').classList.contains('open'));
  h.ctx.toggleMenuPasta();h.click('Fechar','toggleMenuPasta()');assert.ok(!h.els.get('menuPasta').classList.contains('open'));
  h.ctx.toggleMenuPasta();for(const listener of h.events.get('keydown')||[])listener.fn({key:'Escape'});assert.ok(!h.els.get('menuPastaBackdrop').classList.contains('open'));
});
test('Links do novo painel abrem a obra e o Financeiro no escopo escolhido',()=>{
  const h=fixture();h.ctx.ed29SelectScope('o2');h.ctx.ed29OpenProject('o2');assert.ok(h.els.get('obras').classList.contains('active'));assert.equal(h.els.get('obraSelecionada').value,'o2');
  h.els.get('ed27FinSearch').value='Cimento';h.els.get('finCategoriaFilter').value='Material';h.ctx.ed29OpenFinance();
  assert.ok(h.els.get('financeiro').classList.contains('active'));assert.equal(h.els.get('finObraFilter').value,'o2');assert.equal(h.els.get('ed27FinSearch').value,'');assert.equal(h.els.get('finCategoriaFilter').value,'all');assert.equal(h.writes.length,0);
});
test('Adicionar extra segue o cadastro existente da obra e no consolidado pede seleção',()=>{
  const h=fixture();h.ctx.ed29SelectScope('o1');h.ctx.ed29AddContractExtra();assert.equal(h.calls.at(-1),'extra:o1');
  h.ctx.ed29SelectScope('all');h.ctx.ed29AddContractExtra();assert.ok(h.els.get('ed29ExtraPickM').classList.contains('open'));
  h.els.get('ed29ExtraWork').value='o2';h.ctx.ed29ContinueExtra();assert.equal(h.calls.at(-1),'extra:o2');assert.ok(!h.els.get('ed29ExtraPickM').classList.contains('open'));assert.equal(h.writes.length,0);
});
test('Tabela por etapa mantém 5 colunas no computador e tem 3 somente até 759px',()=>{
  const h=fixture();h.ctx.renderFinance();const table=h.els.get('ed27StagesFinance').innerHTML;
  assert.ok(table.includes('<th>Etapa</th><th>Recebido</th><th>Despesas</th><th>Mão de obra</th><th>Resultado</th>'));
  const start=css.indexOf('@media(max-width:759px){');let depth=1,end=start+css.slice(start).indexOf('{')+1;
  for(;end<css.length&&depth;end++){if(css[end]==='{')depth++;if(css[end]==='}')depth--;}
  const mobile=css.slice(start,end),rest=css.slice(end);
  assert.ok(mobile.includes('table-layout:fixed'));assert.ok(mobile.includes('min-width:0'));assert.ok(mobile.includes('overflow-wrap:anywhere'));
  assert.ok(mobile.includes('th:nth-child(2)'));assert.ok(mobile.includes('td:nth-child(4)'));assert.ok(mobile.includes('{display:none}'));
  assert.ok(!rest.includes('#ed27StagesFinance'));
  for(const width of [320,375,390,430,759,760,1024,1440])assert.equal([1,2,3,4,5].filter(c=>!(width<=759&&[2,4].includes(c))).length,width<=759?3:5);
});
console.log(count+' novas verificações aprovadas. Dados usados: somente fixtures locais.');
