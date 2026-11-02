(()=>{
'use strict';
if(window.__OBRIX_RESUMO_GERAL_INTEGRACAO_V2)return;window.__OBRIX_RESUMO_GERAL_INTEGRACAO_V2=true;
const $=id=>document.getElementById(id);
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const pct=v=>`${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%`;
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const active=x=>!x?.status_lancamento||x.status_lancamento==='ativo';
let timer=0,busy=false,lastObra='',cache=null;
function normalizarValorBusca(v){return String(v||'').replace(/(\d)[.](?=\d{3}(?:\D|$))/g,'$1').replace(/(\d),(?=\d{2}(?:\D|$))/g,'$1.')}
function resumoVisivel(){const r=$('resumoGeralMain');return !!r&&!r.classList.contains('hidden')}
function status(){try{return window.OBRIX_RESUMO_GERAL?.status?.()||{}}catch(_){return{}}}
function setaOriginal(){
  if(!resumoVisivel())return;
  const b=$('obrixHeaderVoltar');if(!b)return;
  b.classList.remove('hidden');b.textContent='←';b.setAttribute('aria-label','Voltar');b.setAttribute('title','Voltar');
  b.onclick=e=>{e?.preventDefault?.();e?.stopPropagation?.();const st=status();if(st.view==='obra'){window.OBRIX_RESUMO_GERAL?.open?.();return}$('resumoGeralMain')?.classList.add('hidden');window.OBRIX_MENU?.open?.()};
}
function classesStatus(){document.querySelectorAll('#resumoGeralMain .rgStatus').forEach(el=>{const t=norm(el.textContent);el.classList.toggle('andamento',t.includes('andamento'));el.classList.toggle('concluida',t.includes('conclu'))})}
function valoresChecklist(x){return x?.checklist_valores&&typeof x.checklist_valores==='object'&&!Array.isArray(x.checklist_valores)?x.checklist_valores:{}}
function mapaAjustado(x){
  const valor=Math.max(0,Number(x?.valor||0)),vals=valoresChecklist(x),entries=Object.entries(vals).map(([k,v])=>[String(k),Math.max(0,Number(v||0))]).filter(([,v])=>v>0),soma=entries.reduce((s,[,v])=>s+v,0);
  if(soma>0){const fator=valor>0&&soma>valor?valor/soma:1;return Object.fromEntries(entries.map(([k,v])=>[k,v*fator]))}
  if(x?.checklist_id&&valor>0)return{[String(x.checklist_id)]:valor};
  return{};
}
function somaMapa(m){return Object.values(m||{}).reduce((s,v)=>s+Number(v||0),0)}
async function carregarObra(obraId){
  const p=await OBRIX_BACKEND.profile(),sb=await OBRIX_BACKEND.init();if(!p?.empresa_id)throw new Error('Empresa não encontrada.');
  const [fi,ch]=await Promise.all([
    sb.from('financeiro').select('id,obra_id,checklist_id,checklist_ids,checklist_valores,tipo,valor,status_lancamento').eq('empresa_id',p.empresa_id).eq('obra_id',obraId),
    sb.from('checklist_itens').select('id,obra_id,nome,ordem,progresso,valor,concluido').eq('empresa_id',p.empresa_id).eq('obra_id',obraId).order('ordem',{ascending:true})
  ]);if(fi.error)throw fi.error;if(ch.error)throw ch.error;
  const fin=(fi.data||[]).filter(active).map(x=>({...x,__map:mapaAjustado(x)})),checks=ch.data||[];
  const etapas=checks.map(c=>{const id=String(c.id),rec=fin.filter(x=>x.tipo==='receita').reduce((s,x)=>s+Number(x.__map[id]||0),0),des=fin.filter(x=>x.tipo==='despesa').reduce((s,x)=>s+Number(x.__map[id]||0),0),res=rec-des;return{id,nome:c.nome||'Etapa',progresso:Number(c.progresso||0),valor:Number(c.valor||0),recebido:rec,despesas:des,resultado:res,margem:rec>0?res/rec*100:0,final:Number(c.progresso||0)>=100&&Number(c.valor||0)>0&&rec>=Number(c.valor||0)-.01}});
  const totalReceita=fin.filter(x=>x.tipo==='receita').reduce((s,x)=>s+Number(x.valor||0),0),totalDespesa=fin.filter(x=>x.tipo==='despesa').reduce((s,x)=>s+Number(x.valor||0),0),alocReceita=fin.filter(x=>x.tipo==='receita').reduce((s,x)=>s+somaMapa(x.__map),0),alocDespesa=fin.filter(x=>x.tipo==='despesa').reduce((s,x)=>s+somaMapa(x.__map),0);
  const nao={recebido:Math.max(0,totalReceita-alocReceita),despesas:Math.max(0,totalDespesa-alocDespesa)};nao.resultado=nao.recebido-nao.despesas;
  return{etapas,nao,totalReceita,totalDespesa};
}
function ranking(etapas){const pos=etapas.filter(x=>x.resultado>0),neg=etapas.filter(x=>x.resultado<0);return{maior:pos.slice().sort((a,b)=>b.resultado-a.resultado)[0]||null,menor:pos.slice().sort((a,b)=>a.resultado-b.resultado)[0]||null,prejuizo:neg.slice().sort((a,b)=>a.resultado-b.resultado)[0]||null}}
function destaque(tipo,e){const titulo=tipo==='maior'?'Maior lucro':tipo==='menor'?'Menor lucro':'Prejuízo',classe=tipo==='prejuizo'?'neg':tipo==='maior'?'pos':'mid';if(!e)return`<div class="rgDestaque ${classe}"><small>${titulo}</small><b>${tipo==='prejuizo'?'Nenhuma etapa em prejuízo':'Sem dados'}</b></div>`;return`<div class="rgDestaque ${classe}"><small>${titulo}</small><b>${String(e.nome||'')}</b><strong>${money(e.resultado)}</strong><span>${pct(e.margem)}</span></div>`}
function patchEtapas(d){
  const root=$('resumoGeralMain');if(!root)return;
  const sec=[...root.querySelectorAll('.rgCard')].find(x=>norm(x.querySelector('h2')?.textContent)==='etapas do checklist');if(!sec)return;
  const porNome=new Map(d.etapas.map(e=>[norm(e.nome),e]));
  sec.querySelectorAll('.rgEtapa:not(.rgNao)').forEach(card=>{const nome=norm(card.querySelector('.rgEtapaHead b')?.textContent),e=porNome.get(nome);if(!e)return;const cells=card.querySelectorAll('.rgEtapaGrid>div');if(cells[1]){cells[1].classList.add('rgNumGreen');const b=cells[1].querySelector('b');if(b)b.textContent=money(e.recebido)}if(cells[2]){cells[2].classList.add('rgNumRed');const b=cells[2].querySelector('b');if(b)b.textContent=money(e.despesas)}if(cells[3]){cells[3].classList.toggle('pos',e.resultado>0);cells[3].classList.toggle('neg',e.resultado<0);const b=cells[3].querySelector('b');if(b)b.textContent=money(e.resultado)}});
  let nao=sec.querySelector('.rgNao');if(d.nao.recebido||d.nao.despesas){if(!nao){nao=document.createElement('article');nao.className='rgEtapa rgNao';sec.querySelector('.rgEtapas')?.appendChild(nao)}nao.innerHTML=`<div class="rgEtapaHead"><div><b>Sem etapa / Não alocado</b><small>Lançamentos sem checklist</small></div></div><div class="rgEtapaGrid"><div class="rgNumGreen"><small>Recebido</small><b>${money(d.nao.recebido)}</b></div><div class="rgNumRed"><small>Despesas</small><b>${money(d.nao.despesas)}</b></div><div class="${d.nao.resultado<0?'neg':'pos'}"><small>Resultado</small><b>${money(d.nao.resultado)}</b></div></div>`}else nao?.remove();
  const ana=[...root.querySelectorAll('.rgCard')].find(x=>norm(x.querySelector('h2')?.textContent)==='analise das etapas'),r=ranking(d.etapas);if(ana){const h=ana.querySelector('.rgHighlights');if(h)h.innerHTML=destaque('maior',r.maior)+destaque('menor',r.menor)+destaque('prejuizo',r.prejuizo)}
}
function aplicarCores(){
  const r=$('resumoGeralMain');if(!r)return;classesStatus();
  const k=r.querySelectorAll('.rgKpis>div');[[1,'rgNumGreen'],[3,'rgNumGreen'],[4,'rgNumOrange'],[5,'rgNumRed'],[7,'rgNumBlue']].forEach(([i,c])=>k[i]?.classList.add(c));
  r.querySelectorAll('.rgObraItem').forEach(card=>{const g=card.querySelectorAll('.rgObraGrid>div');g[1]?.classList.add('rgNumGreen');g[2]?.classList.add('rgNumRed');card.querySelector('.rgObraFoot span:first-child')?.classList.add('rgNumOrange')});
  const cards=[...r.querySelectorAll('.rgCard')];const contrato=cards.find(x=>norm(x.querySelector('h2')?.textContent)==='contrato');contrato?.querySelector('.rgRows>div:nth-child(2)')?.classList.add('rgNumGreen');
  const rec=cards.find(x=>norm(x.querySelector('h2')?.textContent)==='recebimentos');rec?.querySelector('.rgRows>div:nth-child(1)')?.classList.add('rgNumGreen');rec?.querySelector('.rgRows>div:nth-child(2)')?.classList.add('rgNumOrange');rec?.querySelector('.rgRows>div:nth-child(3)')?.classList.add('rgNumBlue');
  const desp=cards.find(x=>norm(x.querySelector('h2')?.textContent)==='despesas por categoria');desp?.querySelectorAll('.rgCat').forEach(x=>x.classList.add('rgNumRed'));
  const resultado=cards.find(x=>norm(x.querySelector('h2')?.textContent)==='resultado da obra');resultado?.querySelector('.rgRows>div:nth-child(2)')?.classList.add('rgNumBlue');resultado?.querySelector('.rgRows>div:nth-child(3)')?.classList.add('rgNumBlue');
}
async function validarDetalhe(){
  const st=status();if(!resumoVisivel()||st.view!=='obra'||!st.obraAtual)return;const key=String(st.obraAtual);if(busy)return;if(lastObra===key&&cache){patchEtapas(cache);return}busy=true;try{cache=await carregarObra(key);lastObra=key;patchEtapas(cache)}catch(e){console.error('Resumo Geral - validação checklist:',e)}finally{busy=false}
}
function aplicar(){if(!resumoVisivel())return;document.querySelectorAll('#resumoGeralMain .rgBack').forEach(b=>b.style.setProperty('display','none','important'));setaOriginal();aplicarCores();validarDetalhe()}
function agenda(){clearTimeout(timer);timer=setTimeout(aplicar,60)}
document.addEventListener('click',e=>{const b=e.target.closest?.('#rgVoltarMenu');if(!b)return;e.preventDefault();e.stopImmediatePropagation();$('resumoGeralMain')?.classList.add('hidden');window.OBRIX_MENU?.open?.()},true);
document.addEventListener('input',e=>{const inp=e.target?.closest?.('#rgBusca');if(!inp)return;const n=normalizarValorBusca(inp.value);if(n!==inp.value){const pos=inp.selectionStart;inp.value=n;try{inp.setSelectionRange(pos,pos)}catch(_){}}},true);
const css=document.createElement('style');css.id='obrix-resumo-geral-integracao-v2-style';css.textContent=`#resumoGeralMain .rgBack{display:none!important}#resumoGeralMain .rgStatus,#resumoGeralMain .rgStatus.andamento,#resumoGeralMain .rgStatus.concluida{color:#fff!important;-webkit-text-fill-color:#fff!important}#resumoGeralMain .rgNumGreen,#resumoGeralMain .rgNumGreen b,#resumoGeralMain .rgNumGreen strong{color:#16a34a!important;-webkit-text-fill-color:#16a34a!important}#resumoGeralMain .rgNumRed,#resumoGeralMain .rgNumRed b,#resumoGeralMain .rgNumRed strong{color:#dc2626!important;-webkit-text-fill-color:#dc2626!important}#resumoGeralMain .rgNumOrange,#resumoGeralMain .rgNumOrange b,#resumoGeralMain .rgNumOrange strong{color:#f97316!important;-webkit-text-fill-color:#f97316!important}#resumoGeralMain .rgNumBlue,#resumoGeralMain .rgNumBlue b,#resumoGeralMain .rgNumBlue strong{color:#2563eb!important;-webkit-text-fill-color:#2563eb!important}#resumoGeralMain .pos,#resumoGeralMain .pos b,#resumoGeralMain .pos strong{color:#16a34a!important;-webkit-text-fill-color:#16a34a!important}#resumoGeralMain .neg,#resumoGeralMain .neg b,#resumoGeralMain .neg strong{color:#dc2626!important;-webkit-text-fill-color:#dc2626!important}`;document.head.appendChild(css);
const mo=new MutationObserver(()=>agenda());mo.observe(document.getElementById('app')||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});window.addEventListener('pageshow',agenda);window.addEventListener('focus',agenda);setTimeout(agenda,300);setTimeout(agenda,1200);
window.OBRIX_RESUMO_GERAL_INTEGRACAO={refresh:agenda,validar:validarDetalhe};
})();