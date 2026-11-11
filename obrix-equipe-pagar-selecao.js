(()=>{
'use strict';
if(window.__OBRIX_PAGAR_SELECAO)return;window.__OBRIX_PAGAR_SELECAO=true;
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),hoje=()=>new Date().toISOString().slice(0,10);
async function aviso(mensagem,titulo='Pagamento da equipe'){if(typeof window.OBRIX_AVISO==='function')return window.OBRIX_AVISO(mensagem,titulo);console.warn('OBRIX:',mensagem)}
function confirmarPagamento(mensagem){return new Promise(resolve=>{const box=document.createElement('div');box.className='obrixConfirmOverlay obrixPagarConfirmOverlay';box.innerHTML='<div class="obrixConfirmBox" role="dialog" aria-modal="true"><h2>Confirmar pagamento</h2><p></p><div class="obrixConfirmActions"><button type="button" class="obrixConfirmCancel">Cancelar</button><button type="button" class="obrixPagarConfirmar">Confirmar</button></div></div>';box.querySelector('p').textContent=mensagem;let done=false;const key=e=>{if(e.key==='Escape'){e.preventDefault();finish(false)}};function finish(v){if(done)return;done=true;document.removeEventListener('keydown',key,true);box.remove();resolve(v)}box.querySelector('.obrixConfirmCancel').onclick=()=>finish(false);box.querySelector('.obrixPagarConfirmar').onclick=()=>finish(true);box.addEventListener('click',e=>{if(e.target===box)finish(false)});document.body.appendChild(box);document.addEventListener('keydown',key,true);box.querySelector('.obrixConfirmCancel').focus()})}
function modal(html){const b=document.createElement('div');b.className='modalBack obrix-pagar-back';b.innerHTML=`<div class="modal obrix-pagar-selecao-modal">${html}</div>`;document.body.appendChild(b);b.addEventListener('click',e=>{if(e.target===b)b.remove()});return b}
async function dadosAbertos(){const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile(),eid=p.empresa_id;const [fr,dr,vr,br]=await Promise.all([sb.from('funcionarios').select('id,nome,ativo').eq('empresa_id',eid).order('nome'),sb.from('diarias').select('*').eq('empresa_id',eid).eq('paga',false),sb.from('vales').select('*').eq('empresa_id',eid).eq('quitado',false),sb.from('bonus_extras').select('*').eq('empresa_id',eid).eq('pago',false)]);for(const r of [fr,dr,vr,br])if(r.error)throw r.error;return{sb,eid,funcs:fr.data||[],ds:dr.data||[],vs:vr.data||[],bs:br.data||[]}}
function calc(base,fid){
 const api=window.OBRIX_LIQUIDACAO_SEGURA;
 const ds=base.ds.filter(x=>String(x.funcionario_id)===String(fid));
 const vs=base.vs.filter(x=>String(x.funcionario_id)===String(fid)&&!x.estornado_em);
 const bs=base.bs.filter(x=>String(x.funcionario_id)===String(fid));
 const calc=api.calcular({ds,bs,vs});
 return{ds,vs,bs,bruto:calc.bruto/100,td:calc.diarias/100,tb:calc.bonus/100,tv:calc.vales/100,
  liq:calc.liquido/100,tem:!!(ds.length||vs.length||bs.length),
  problemas:calc.erros,invalido:calc.erros.length>0,
  cruzada:calc.negativas.length>0,precisaEscolherObra:calc.precisaEscolherObra,
  obras:api.opcoesDeObra(calc,window.obras||[]),calc};
}
async function abrir(){
 try{
  if(!window.OBRIX_LIQUIDACAO_SEGURA)throw Error('Atualize o OBRIX para carregar a baixa segura de pagamentos.');
  const base=await dadosAbertos();
  const itens=base.funcs.map(f=>({f,r:calc(base,f.id)})).filter(x=>x.r.tem);
  if(!itens.length)return aviso('Não há valores em aberto para pagar.');
  const cartoes=itens.map(({f,r})=>{
   const escolhas=r.precisaEscolherObra?
    '<div class="obrix-pagar-destino"><small>Obra para lançar o líquido — sem rateio</small><select data-obra-func="'+esc(f.id)+'"><option value="">Selecione a obra do pagamento</option>'+
    r.obras.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.nome)+'</option>').join('')+
    '</select></div>':'';
   return '<div class="obrix-pagar-item '+(r.invalido?'invalido':'')+'"><label class="obrix-pagar-pessoa"><input type="checkbox" class="obrix-pagar-check" value="'+esc(f.id)+'"><span><b>'+esc(f.nome||'Funcionário')+'</b><small>Bruto '+money(r.bruto)+' · Vales '+money(r.tv)+' · Líquido '+money(r.liq)+'</small>'+(r.invalido?'<em>'+esc(r.problemas[0])+'</em>':'')+'</span></label>'+escolhas+'</div>';
  }).join('');
  const back=modal('<div class="obrix-pagar-head"><div><h2>Pagar equipe</h2><p>Selecione um, vários ou todos os funcionários.</p></div><button type="button" class="obrix-pagar-x">×</button></div><label class="obrix-pagar-todos"><input type="checkbox" id="obrixPagarTodos"><b>Selecionar todos</b></label><div class="obrix-pagar-lista">'+cartoes+'</div><div class="obrix-pagar-total"><span>Selecionados</span><b id="obrixPagarQtd">0</b><span>Total líquido</span><strong id="obrixPagarTotal">'+money(0)+'</strong></div><label class="obrix-pagar-data-label">Data do pagamento<input id="obrixPagarData" type="date" value="'+hoje()+'"></label><div class="modalActions"><button type="button" class="btn obrix-pagar-cancelar">Cancelar</button><button type="button" class="btn obrix-pagar-confirmar">Confirmar pagamento</button></div>');
  const checks=[...back.querySelectorAll('.obrix-pagar-check')],todos=back.querySelector('#obrixPagarTodos');
  const selecionados=()=>itens.filter(x=>checks.some(c=>c.checked&&c.value===String(x.f.id)));
  function atualizar(){
   const escolhidos=selecionados();
   back.querySelector('#obrixPagarQtd').textContent=String(escolhidos.length);
   back.querySelector('#obrixPagarTotal').textContent=money(escolhidos.reduce((a,x)=>a+x.r.liq,0));
   todos.checked=checks.length>0&&checks.every(c=>c.checked);
   todos.indeterminate=checks.some(c=>c.checked)&&!todos.checked;
  }
  todos.onchange=()=>{checks.forEach(c=>c.checked=todos.checked);atualizar()};
  checks.forEach(c=>c.onchange=atualizar);
  back.querySelector('.obrix-pagar-x').onclick=()=>back.remove();
  back.querySelector('.obrix-pagar-cancelar').onclick=()=>back.remove();
  const btn=back.querySelector('.obrix-pagar-confirmar');
  btn.onclick=async()=>{
   if(btn.disabled)return;
   const escolhidos=selecionados();
   if(!escolhidos.length)return aviso('Selecione pelo menos um funcionário.');
   const data=back.querySelector('#obrixPagarData')?.value;
   if(!data)return aviso('Informe a data de pagamento.');
   const erros=[];
   for(const x of escolhidos){
    if(x.r.problemas.length)erros.push(x.f.nome+': '+x.r.problemas.join(' '));
    if(x.r.precisaEscolherObra&&!back.querySelector('[data-obra-func="'+CSS.escape(String(x.f.id))+'"]')?.value)
     erros.push(x.f.nome+': selecione a obra onde será registrado o saldo líquido.');
   }
   if(erros.length)return aviso('Revise antes de pagar:'+String.fromCharCode(10)+erros.join(String.fromCharCode(10)));
   const total=escolhidos.reduce((a,x)=>a+x.r.liq,0);
   if(!await window.OBRIX_CONFIRMAR_PAGAMENTO({titulo:'Confirmar pagamento da equipe',
     mensagem:'Funcionários: '+escolhidos.length+String.fromCharCode(10)+'Líquido total: '+money(total),
     confirmar:'Confirmar pagamento'}))return;
   btn.disabled=true;btn.textContent='Registrando...';
   const feitos=[],falhas=[];
   for(const x of escolhidos){
    try{
     const obraSelecionada=back.querySelector('[data-obra-func="'+CSS.escape(String(x.f.id))+'"]')?.value ||
       (x.r.cruzada&&x.r.obras.length===1?x.r.obras[0].id:'');
     const pagamento=await window.OBRIX_LIQUIDACAO_SEGURA.registrar({
      funcionarioId:x.f.id,data,obraPagamentoId:obraSelecionada,esperado:x.r.liq});
     feitos.push(pagamento);
    }catch(e){falhas.push(x.f.nome+': '+(e?.message||'Erro ao registrar.'));break}
   }
   if(feitos.length){
    back.remove();
    try{await window.OBRIX_EQUIPE?.refresh?.({force:true,financeiro:true})}catch(e){console.warn('Equipe: atualização após pagamento',e)}
    try{await window.OBRIX_FIN?.render?.(true)}catch(e){console.warn('Financeiro: atualização após pagamento',e)}
   }else{btn.disabled=false;btn.textContent='Confirmar pagamento'}
   const resultado=feitos.length+' pagamento(s) registrado(s).'+
     (falhas.length?' Não repita os pagamentos concluídos. Pendência: '+falhas.join(' '):' Todos os registros foram baixados e enviados ao Financeiro.');
   await aviso(resultado, falhas.length?'Conferir pagamentos':'Pagamentos concluídos');
  };
  atualizar();
 }catch(e){await aviso(e?.message||'Não foi possível abrir o pagamento da equipe.')}
}
function instalarBotao(){const sec=document.querySelector('#equipe .obrix-equipe-secundario');if(!sec)return false;let btn=sec.querySelector('.obrix-pagar-equipe-topo');const antigo=sec.querySelector('.obrix-atualizar-equipe');if(!btn){btn=document.createElement('button');btn.type='button';btn.className='obrix-cmd obrix-pagar-equipe-topo';btn.textContent='💳 Pagar';if(antigo)antigo.replaceWith(btn);else sec.appendChild(btn)}btn.onclick=abrir;return true}
const css=document.createElement('style');css.textContent=`.obrix-pagar-pessoa{display:flex!important;align-items:flex-start;gap:10px;width:100%;cursor:pointer}.obrix-pagar-item{display:block!important}.obrix-pagar-pessoa span{display:grid;gap:4px;flex:1}.obrix-pagar-destino{margin:11px 0 0 25px}.obrix-pagar-destino small{display:block;margin-bottom:7px}.obrix-pagar-destino select{width:100%;min-height:46px;padding:10px;border-radius:11px;border:1px solid var(--ob-border,#64748b);background:var(--ob-surface,#fff);color:var(--ob-text,#111827)}.obrix-pagar-back{z-index:2147483000!important}.obrixPagarConfirmar{background:var(--ob-accent,#ff5a00)!important;color:#fff!important;border:1px solid var(--ob-accent,#ff5a00)!important}.obrix-pagar-equipe-topo{background:#0f172a!important;color:#fff!important;border-color:#0f172a!important}.obrix-pagar-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.obrix-pagar-head h2{margin:0 0 4px}.obrix-pagar-head p{margin:0;color:#64748b}.obrix-pagar-x{border:0;background:transparent;color:inherit;font-size:30px}.obrix-pagar-todos{display:flex!important;gap:9px;align-items:center;margin:15px 0 10px!important;padding:12px;border:1px solid #cbd5e1;border-radius:12px}.obrix-pagar-todos input,.obrix-pagar-item input{width:auto!important;margin:0!important;transform:scale(1.15)}.obrix-pagar-lista{display:grid;gap:8px;max-height:42vh;overflow:auto}.obrix-pagar-item{display:flex!important;gap:10px;align-items:flex-start;padding:12px;border:1px solid #e2e8f0;border-radius:12px;margin:0!important}.obrix-pagar-item span{display:grid;gap:3px}.obrix-pagar-item small{color:#64748b}.obrix-pagar-item em{font-size:12px;color:#be123c;font-style:normal;font-weight:700}.obrix-pagar-item.invalido{opacity:1;border-color:#c2410c}.obrix-pagar-total{display:grid;grid-template-columns:1fr auto;gap:6px 12px;margin:12px 0;padding:12px;border-radius:12px;background:#f8fafc}.obrix-pagar-total strong{font-size:20px}.obrix-pagar-data-label{display:block!important;font-weight:800}.obrix-pagar-data-label input{display:block;width:100%}html[data-theme="dark"] .obrix-pagar-equipe-topo,body.dark .obrix-pagar-equipe-topo{background:#2563eb!important;border-color:#2563eb!important}html[data-theme="dark"] .obrix-pagar-item,body.dark .obrix-pagar-item,html[data-theme="dark"] .obrix-pagar-todos,body.dark .obrix-pagar-todos{border-color:#334155}html[data-theme="dark"] .obrix-pagar-total,body.dark .obrix-pagar-total{background:#111827}`;document.head.appendChild(css);const t=setInterval(()=>{if(instalarBotao())clearInterval(t)},120);setTimeout(instalarBotao,1200);setTimeout(instalarBotao,2600);new MutationObserver(()=>instalarBotao()).observe(document.documentElement,{childList:true,subtree:true});window.OBRIX_PAGAR_EQUIPE={open:abrir};
})();
(()=>{if(document.querySelector('script[data-obrix-equipe-historico-pag]'))return;const s=document.createElement('script');s.dataset.obrixEquipeHistoricoPag='1';s.src='./obrix-equipe-historico-pagamentos.js?v=20261111-busca-pagamentos1';document.head.appendChild(s)})();
