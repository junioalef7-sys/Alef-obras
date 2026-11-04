(()=>{'use strict';
if(window.__OBRIX_REL_DIARIO)return;window.__OBRIX_REL_DIARIO=true;
const $=id=>document.getElementById(id),
esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
fmt=v=>{if(!v)return'';const [y,m,d]=String(v).slice(0,10).split('-');return d&&m&&y?`${d}/${m}/${y}`:v},
safeName=s=>String(s||'diario').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase()||'diario';
let ultimo=null,jsPdfPromise=null;

function instalar(){
  const tipos=document.querySelector('.relTipo');if(!tipos||$('relTipoDiario'))return;
  const b=document.createElement('button');b.className='btn';b.id='relTipoDiario';b.textContent='Diário de Obras';tipos.appendChild(b);b.onclick=abrirFiltros;
  const fin=$('relFinFiltros');if(!fin)return;
  const c=document.createElement('div');c.className='card relFiltros hidden';c.id='relDiarioFiltros';
  c.innerHTML='<h3>Relatório do Diário de Obras</h3><div class="relGrid"><select id="relDiarioObra"><option value="">Todas as obras</option></select><input id="relDiarioInicio" type="date"><input id="relDiarioFim" type="date"><button class="btn" id="relDiarioGerar">Gerar relatório</button></div>';
  fin.parentNode.insertBefore(c,fin.nextSibling);$('relDiarioGerar').onclick=gerar;
}
function fecharOutros(){['relFinFiltros','relEqFiltros','relClienteFiltros','relDocsFiltros'].forEach(id=>$(id)?.classList.add('hidden'))}
async function abrirFiltros(){
  instalar();fecharOutros();$('relDiarioFiltros')?.classList.remove('hidden');
  document.querySelectorAll('.relTipo .btn').forEach(x=>x.classList.remove('active'));$('relTipoDiario')?.classList.add('active');$('relResultado')?.classList.add('hidden');
  const os=await OBRIX_BACKEND.readTable('obras','criado_em').catch(()=>[]),s=$('relDiarioObra');
  s.innerHTML='<option value="">Todas as obras</option>'+os.map(o=>`<option value="${o.id}">${esc(o.nome||'Obra')}</option>`).join('');
}
function noPeriodo(v,i,f){v=String(v||'').slice(0,10);return(!i||v>=i)&&(!f||v<=f)}
function fotosDoDiario(d,fotos){return fotos.filter(f=>String(f.diario_id||'')===String(d.id)||(!f.diario_id&&String(f.obra_id)===String(d.obra_id)&&String(f.data_foto||'').slice(0,10)===String(d.data||'').slice(0,10)))}
async function signed(sb,path,w=240,h=180){
  let r=await sb.storage.from('relatorio-fotografico').createSignedUrl(path,900,{transform:{width:w,height:h,resize:'cover'}});
  if(r.error)r=await sb.storage.from('relatorio-fotografico').createSignedUrl(path,900);
  return r.error?'':r.data.signedUrl;
}
function carregarJsPdf(){
  if(window.jspdf?.jsPDF)return Promise.resolve(window.jspdf.jsPDF);
  if(jsPdfPromise)return jsPdfPromise;
  jsPdfPromise=new Promise((resolve,reject)=>{
    const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';s.async=true;
    const timer=setTimeout(()=>reject(new Error('Tempo esgotado ao carregar o gerador de PDF.')),12000);
    s.onload=()=>{clearTimeout(timer);window.jspdf?.jsPDF?resolve(window.jspdf.jsPDF):reject(new Error('Gerador de PDF indisponível.'))};
    s.onerror=()=>{clearTimeout(timer);reject(new Error('Não foi possível carregar o gerador de PDF.'))};document.head.appendChild(s);
  }).catch(e=>{jsPdfPromise=null;throw e});
  return jsPdfPromise;
}
async function imagemData(url){
  const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('Foto indisponível.');
  const blob=await r.blob();
  return await new Promise((resolve,reject)=>{
    const fr=new FileReader();fr.onload=()=>resolve({data:String(fr.result),format:/png/i.test(blob.type)?'PNG':'JPEG'});fr.onerror=()=>reject(fr.error||new Error('Falha ao ler foto.'));fr.readAsDataURL(blob);
  });
}

async function gerar(){
  const btn=$('relDiarioGerar');btn.disabled=true;btn.textContent='Gerando...';
  try{
    const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile(),oid=$('relDiarioObra').value,ini=$('relDiarioInicio').value,fim=$('relDiarioFim').value;
    const [dr,or,fr]=await Promise.all([
      sb.from('diarios_obra').select('*').eq('empresa_id',p.empresa_id).order('data',{ascending:false}),
      sb.from('obras').select('id,nome').eq('empresa_id',p.empresa_id),
      sb.from('relatorio_fotos').select('id,diario_id,obra_id,storage_path,descricao,data_foto').eq('empresa_id',p.empresa_id)
    ]);
    if(dr.error)throw dr.error;if(or.error)throw or.error;if(fr.error)throw fr.error;
    const obras=or.data||[],fotos=fr.data||[],rows=(dr.data||[]).filter(d=>(!oid||String(d.obra_id)===String(oid))&&noPeriodo(d.data,ini,fim)),
    nome=id=>obras.find(o=>String(o.id)===String(id))?.nome||'Obra',cards=[];
    for(const d of rows){
      const fs=fotosDoDiario(d,fotos),imgs=[];
      for(const f of fs){const u=await signed(sb,f.storage_path);if(u)imgs.push(`<img loading="lazy" decoding="async" src="${esc(u)}" alt="Foto do diário">`)}
      cards.push(`<div class="card"><h3>${esc(nome(d.obra_id))} — ${esc(fmt(d.data))}</h3><div class="muted">${esc(d.clima||'Sem clima')}${d.temperatura?' • '+esc(d.temperatura):''} • ${d.status==='finalizado'?'Finalizado':'Rascunho'}</div><p><b>Serviços:</b> ${esc(d.servicos_executados||'Não informado')}</p><p><b>Ocorrências:</b> ${esc(d.ocorrencias||'Sem ocorrências')}</p><p><b>Materiais:</b> ${esc(d.materiais_utilizados||'Não informado')}</p><p><b>Equipamentos:</b> ${esc(d.equipamentos_utilizados||'Não informado')}</p>${d.observacoes?`<p><b>Observações:</b> ${esc(d.observacoes)}</p>`:''}${imgs.length?`<div class="relDiarioFotos">${imgs.join('')}</div>`:'<div class="muted">Sem fotos neste diário.</div>'}</div>`);
    }
    ultimo={rows,obras,fotos};
    $('relResultado').innerHTML=`<div class="sectionHead"><strong>${rows.length} diário(s)</strong><div class="relDiarioAcoes"><button class="btn" id="relDiarioImprimir">Salvar / Compartilhar PDF</button><button class="btn relFechar" id="relDiarioFechar">Fechar</button></div></div>${cards.length?cards.join(''):'<div class="card muted">Nenhum diário no período selecionado.</div>'}`;
    $('relResultado').classList.remove('hidden');$('relDiarioImprimir').onclick=imprimir;$('relDiarioFechar').onclick=()=>{$('relResultado').classList.add('hidden');ultimo=null};
  }catch(e){alert(e.message||'Não foi possível gerar o relatório do diário.')}
  finally{btn.disabled=false;btn.textContent='Gerar relatório'}
}

async function criarPdf(){
  if(!ultimo)throw new Error('Gere o relatório primeiro.');
  const JsPDF=await carregarJsPdf(),doc=new JsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true}),
  {rows,obras,fotos}=ultimo,sb=await OBRIX_BACKEND.init(),nome=id=>obras.find(o=>String(o.id)===String(id))?.nome||'Obra',
  left=14,width=182,bottom=282;
  let y=16,first=true;
  const newPage=()=>{doc.addPage();y=16};
  const ensure=h=>{if(y+h>bottom)newPage()};
  const text=(txt,size=9,bold=false,gap=4)=>{
    if(txt===undefined||txt===null||txt==='')return;
    doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(15,23,42);
    const lines=doc.splitTextToSize(String(txt),width),h=lines.length*(size*.38)+gap;ensure(h);doc.text(lines,left,y);y+=h;
  };
  doc.setProperties({title:'Relatório do Diário de Obras — OBRIX',subject:'Diário de Obras OBRIX',creator:'OBRIX'});
  for(const d of rows){
    if(!first)newPage();first=false;
    text('OBRIX — Relatório do Diário de Obras',16,true,3);
    text(`${nome(d.obra_id)} — ${fmt(d.data)}`,12,true,3);
    text(`${d.clima||'Sem clima'}${d.temperatura?' • '+d.temperatura:''} • ${d.status==='finalizado'?'Finalizado':'Rascunho'}`,9,false,7);
    text(`Serviços executados: ${d.servicos_executados||'Não informado'}`,9,false,5);
    text(`Ocorrências: ${d.ocorrencias||'Sem ocorrências'}`,9,false,5);
    text(`Materiais utilizados: ${d.materiais_utilizados||'Não informado'}`,9,false,5);
    text(`Equipamentos utilizados: ${d.equipamentos_utilizados||'Não informado'}`,9,false,5);
    if(d.observacoes)text(`Observações: ${d.observacoes}`,9,false,6);
    const fs=fotosDoDiario(d,fotos);
    if(!fs.length){text('Sem fotos neste diário.',8,false,3);continue}
    text('Fotos',10,true,4);
    let col=0;
    for(const f of fs){
      if(col===0)ensure(46);
      try{
        const u=await signed(sb,f.storage_path,720,540);
        if(!u)throw new Error('Foto indisponível.');
        const img=await imagemData(u),w=56,h=42,x=left+col*62;
        doc.addImage(img.data,img.format,x,y,w,h,undefined,'FAST');
      }catch(_){
        const x=left+col*62;doc.setDrawColor(203,213,225);doc.rect(x,y,56,42);doc.setFontSize(7);doc.setTextColor(100,116,139);doc.text('Foto indisponível',x+5,y+22);
      }
      col++;
      if(col===3){col=0;y+=46}
    }
    if(col!==0)y+=46;
  }
  if(!rows.length){
    text('OBRIX — Relatório do Diário de Obras',16,true,6);text('Nenhum diário no período selecionado.',9,false,4);
  }
  const filtro=$('relDiarioObra')?.selectedOptions?.[0]?.textContent||'obras',nomeArquivo=`obrix-diario-${safeName(filtro)}.pdf`,
  blob=doc.output('blob'),file=new File([blob],nomeArquivo,{type:'application/pdf'});
  return{blob,file,nome:nomeArquivo,titulo:'Relatório do Diário de Obras — OBRIX'};
}

function baixar(p){
  const u=URL.createObjectURL(p.blob),a=document.createElement('a');a.href=u;a.download=p.nome;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),120000);
}

async function imprimir(){
  if(!ultimo)return;
  const btn=$('relDiarioImprimir'),old=btn?.textContent||'Salvar / Compartilhar PDF';
  if(btn){btn.disabled=true;btn.textContent='Gerando PDF...'}
  try{
    const p=await criarPdf();
    if(btn)btn.textContent='Abrindo compartilhamento...';
    if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[p.file]}))){
      await navigator.share({title:p.titulo,files:[p.file]});
      return;
    }
    baixar(p);alert('O PDF foi gerado e salvo no aparelho.');
  }catch(e){
    if(e?.name!=='AbortError'){console.warn('OBRIX diário PDF',e);alert(e?.message||'Não foi possível gerar o PDF.')}
  }finally{
    if(btn){btn.disabled=false;btn.textContent=old}
  }
}

const css=document.createElement('style');
css.textContent='.relDiarioFotos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:10px}.relDiarioFotos img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px}.relDiarioAcoes{display:flex;gap:7px;flex-wrap:wrap}.relFechar{background:#64748b!important}';
document.head.appendChild(css);
function scan(){if($('relatoriosMain'))instalar()}
new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});scan();
})();