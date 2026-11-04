(()=>{'use strict';
const $=id=>document.getElementById(id),
money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),
esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
safeName=s=>String(s||'relatorio').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase()||'relatorio';
const soma=(a,t)=>a.filter(x=>x.tipo===t).reduce((s,x)=>s+Number(x.valor||0),0);
let jsPdfPromise=null;

function carregarJsPdf(){
  if(window.jspdf?.jsPDF)return Promise.resolve(window.jspdf.jsPDF);
  if(jsPdfPromise)return jsPdfPromise;
  jsPdfPromise=new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
    s.async=true;
    const timer=setTimeout(()=>reject(new Error('Tempo esgotado ao carregar o gerador de PDF.')),12000);
    s.onload=()=>{clearTimeout(timer);window.jspdf?.jsPDF?resolve(window.jspdf.jsPDF):reject(new Error('Gerador de PDF indisponível.'))};
    s.onerror=()=>{clearTimeout(timer);reject(new Error('Não foi possível carregar o gerador de PDF.'))};
    document.head.appendChild(s);
  }).catch(e=>{jsPdfPromise=null;throw e});
  return jsPdfPromise;
}

function grafico(recebido,despesas,lucro){
  const vals=[Math.max(0,recebido),Math.max(0,despesas),Math.max(0,lucro)],
  max=Math.max(...vals,1),nomes=['Recebido','Despesas','Lucro'];
  return `<div class="rfGrafico"><h3>Gráfico financeiro</h3><div class="rfBars">${vals.map((v,i)=>`<div class="rfBarItem"><div class="rfBarTrack"><div class="rfBar" style="height:${Math.max(3,(v/max)*100)}%"></div></div><b>${esc(nomes[i])}</b><span>${money(v)}</span></div>`).join('')}</div></div>`;
}

async function criarPdf(d){
  const JsPDF=await carregarJsPdf();
  const doc=new JsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  doc.setProperties({title:`Relatório Financeiro OBRIX - ${d.nome}`,subject:'Relatório Financeiro OBRIX',creator:'OBRIX'});
  const left=14,right=196,width=182,bottom=282;
  let y=16;
  const page=()=>{doc.addPage();y=16};
  const ensure=h=>{if(y+h>bottom)page()};
  const write=(txt,size=9,bold=false,gap=4)=>{
    if(txt===undefined||txt===null||txt==='')return;
    doc.setFont('helvetica',bold?'bold':'normal');
    doc.setFontSize(size);
    const lines=doc.splitTextToSize(String(txt),width);
    const h=lines.length*(size*0.38)+gap;
    ensure(h);
    doc.text(lines,left,y);
    y+=h;
  };

  doc.setTextColor(15,23,42);
  write('OBRIX — Relatório Financeiro',17,true,3);
  doc.setTextColor(71,85,105);
  write(`${d.nome} • Gerado em ${new Date().toLocaleDateString('pt-BR')}`,9,false,8);

  const kpis=[
    ['Contrato atualizado',money(d.contrato)],
    ['Recebido',money(d.recebido)],
    ['Despesas',money(d.despesas)],
    ['Lucro',money(d.lucro)]
  ];
  const boxW=88,boxH=18,gap=6;
  kpis.forEach((k,i)=>{
    const col=i%2,row=Math.floor(i/2);
    const x=left+col*(boxW+gap),yy=y+row*(boxH+4);
    doc.setDrawColor(203,213,225);doc.roundedRect(x,yy,boxW,boxH,2,2,'S');
    doc.setTextColor(100,116,139);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.text(k[0],x+4,yy+6);
    doc.setTextColor(15,23,42);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(k[1],x+4,yy+13);
  });
  y+=44;
  doc.setTextColor(71,85,105);
  write(`Margem: ${Number(d.margem||0).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%`,9,true,7);

  const vals=[Math.max(0,d.recebido),Math.max(0,d.despesas),Math.max(0,d.lucro)],max=Math.max(...vals,1),labs=['Recebido','Despesas','Lucro'];
  ensure(42);
  const baseY=y+29,barMax=24,barW=22;
  vals.forEach((v,i)=>{
    const x=left+18+i*55,h=Math.max(1,(v/max)*barMax);
    doc.setFillColor(i===0?37:i===1?239:22,i===0?99:i===1?68:163,i===0?235:i===1?68:74);
    doc.rect(x,baseY-h,barW,h,'F');
    doc.setTextColor(15,23,42);doc.setFont('helvetica','bold');doc.setFontSize(7);doc.text(labs[i],x,baseY+5);
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.text(money(v),x,baseY+10);
  });
  y=baseY+16;

  doc.setTextColor(15,23,42);
  write('Lançamentos',12,true,5);
  if(!d.lancamentos.length){
    doc.setTextColor(100,116,139);
    write('Nenhum lançamento encontrado.',9,false,4);
  }else{
    for(const x of d.lancamentos){
      ensure(22);
      doc.setDrawColor(226,232,240);doc.line(left,y-2,right,y-2);
      doc.setTextColor(15,23,42);doc.setFont('helvetica','bold');doc.setFontSize(9);
      const tipo=x.tipo==='receita'?'Receita':'Despesa';
      doc.text(`${String(x.data||'').slice(0,10)} • ${tipo} • ${money(x.valor)}`,left,y+3);
      y+=8;
      doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(51,65,85);
      const desc=doc.splitTextToSize(`${x.descricao||'Lançamento'}${x.categoria?' • '+x.categoria:''}`,width);
      ensure(desc.length*4+4);doc.text(desc,left,y);y+=desc.length*4+5;
    }
  }

  const blob=doc.output('blob');
  const nome=`obrix-relatorio-financeiro-${safeName(d.nome)}.pdf`;
  const file=new File([blob],nome,{type:'application/pdf'});
  return{blob,file,nome,titulo:`Relatório Financeiro OBRIX - ${d.nome}`};
}

function baixarPdf(p){
  const url=URL.createObjectURL(p.blob),a=document.createElement('a');
  a.href=url;a.download=p.nome;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),120000);
}

async function enviar(d){
  const btn=$('rfEnviar'),old=btn?.textContent||'Enviar PDF';
  if(btn){btn.disabled=true;btn.textContent='Gerando PDF...'}
  try{
    const p=await criarPdf(d);
    if(btn)btn.textContent='Abrindo compartilhamento...';
    if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[p.file]}))){
      await navigator.share({title:p.titulo,files:[p.file]});
      return;
    }
    baixarPdf(p);
    alert('O PDF foi gerado e salvo. Você pode anexar o arquivo ao WhatsApp, e-mail ou outro aplicativo.');
  }catch(e){
    if(e?.name!=='AbortError'){
      console.warn('OBRIX relatório financeiro PDF',e);
      alert(e?.message||'Não foi possível gerar o PDF agora.');
    }
  }finally{
    if(btn){btn.disabled=false;btn.textContent=old}
  }
}

async function gerar(){
  const obraId=$('relObra')?.value||'',btn=$('relGerar');
  if(btn){btn.disabled=true;btn.textContent='Gerando...'}
  try{
    const [fin,extras,obras]=await Promise.all([
      OBRIX_BACKEND.readTable('financeiro','data'),
      OBRIX_BACKEND.readTable('servicos_extras','criado_em').catch(()=>[]),
      OBRIX_BACKEND.readTable('obras','criado_em')
    ]);
    const selecionadas=obraId?(obras||[]).filter(o=>String(o.id)===String(obraId)):(obras||[]);
    if(obraId&&!selecionadas.length)throw new Error('Obra não encontrada.');
    const ids=new Set(selecionadas.map(o=>String(o.id))),
    lanc=(fin||[]).filter(x=>(!x.status_lancamento||x.status_lancamento==='ativo')&&(!obraId||ids.has(String(x.obra_id)))).sort((a,b)=>String(b.data||'').localeCompare(String(a.data||''))),
    ex=(extras||[]).filter(x=>!obraId||ids.has(String(x.obra_id))),
    contrato=selecionadas.reduce((s,o)=>s+Number(o.valor_contrato||0),0)+ex.reduce((s,x)=>s+Number(x.valor||0),0),
    recebido=soma(lanc,'receita'),despesas=soma(lanc,'despesa'),lucro=recebido-despesas,
    margem=recebido>0?lucro/recebido*100:0,nome=obraId?(selecionadas[0]?.nome||'Obra'):'Todas as obras',
    d={nome,contrato,recebido,despesas,lucro,margem,lancamentos:lanc};
    const r=$('relResultado');if(!r)return true;
    r.innerHTML=`<div class="rfAcoes"><button class="btn rfFechar" id="rfFechar">Fechar</button><button class="btn" id="rfEnviar">Enviar PDF</button></div><div class="card rfCab"><h2>${esc(nome)}</h2><div class="muted">Relatório financeiro completo ${obraId?'da obra':'de todas as obras'}</div></div><div class="kpis relKpis"><div class="kpi"><small>Contrato atualizado</small><strong>${money(contrato)}</strong></div><div class="kpi"><small>Recebido</small><strong>${money(recebido)}</strong></div><div class="kpi"><small>Despesas</small><strong>${money(despesas)}</strong></div><div class="kpi"><small>Lucro</small><strong>${money(lucro)}</strong><span>Margem ${margem.toLocaleString('pt-BR',{maximumFractionDigits:1})}%</span></div></div>${grafico(recebido,despesas,lucro)}<div class="sectionHead"><strong>Todos os lançamentos</strong></div><div>${lanc.length?lanc.map(x=>`<div class="card item"><h3>${esc(x.descricao||'Lançamento')}</h3><div class="muted">${esc(String(x.data||'').slice(0,10))} • ${esc(x.categoria||'')}</div><div class="grid"><div class="mini"><small>${x.tipo==='receita'?'Receita':'Despesa'}</small><b>${money(x.valor)}</b></div></div></div>`).join(''):'<div class="card muted">Nenhum lançamento encontrado.</div>'}</div>`;
    r.classList.remove('hidden');
    $('rfFechar').onclick=()=>{r.innerHTML='';r.classList.add('hidden')};
    $('rfEnviar').onclick=()=>enviar(d);
    return true;
  }catch(e){
    alert(e.message||'Não foi possível gerar o relatório.');
    return true;
  }finally{
    if(btn){btn.disabled=false;btn.textContent='Gerar relatório'}
  }
}

document.addEventListener('click',async e=>{
  const b=e.target.closest?.('#relGerar');if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();await gerar();
},true);

const css=document.createElement('style');
css.textContent='.rfAcoes{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin:0 0 12px}.rfAcoes .rfFechar{background:#e2e8f0;color:#0f172a}.rfGrafico{margin:18px 0;padding:18px;border:1px solid var(--line,#e2e8f0);border-radius:16px;background:var(--card,#fff)}.rfGrafico h3{margin:0 0 16px}.rfBars{height:220px;display:flex;align-items:flex-end;justify-content:center;gap:18px}.rfBarItem{height:100%;width:min(28%,150px);display:flex;flex-direction:column;justify-content:flex-end;text-align:center}.rfBarTrack{height:150px;display:flex;align-items:flex-end;justify-content:center}.rfBar{width:58%;min-height:4px;background:#2563eb;border-radius:8px 8px 2px 2px}.rfBarItem:nth-child(2) .rfBar{background:#ef4444}.rfBarItem:nth-child(3) .rfBar{background:#16a34a}.rfBarItem b{font-size:12px;margin-top:7px}.rfBarItem span{font-size:11px;color:var(--muted,#64748b);margin-top:3px}.rfCab{margin-bottom:12px}.rfCab h2{margin:0 0 4px}@media(max-width:520px){.rfAcoes .btn{flex:1;min-width:120px}.rfBars{gap:8px}.rfBarItem{width:31%}.rfBar{width:70%}}';
document.head.appendChild(css);
})();