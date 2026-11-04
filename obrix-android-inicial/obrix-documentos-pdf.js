(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  function safe(s){return String(s||'documento').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase()||'documento'}

  async function buildFile(){
    const p=$('preview');
    if(!p||!p.innerText.trim()){
      if(!window.OBRIX_DOCS?.gerar?.()) throw new Error('Gere a prévia do documento primeiro.');
    }
    const J=window.jspdf?.jsPDF;
    if(!J) throw new Error('Gerador de PDF não carregou.');
    const doc=new J({unit:'mm',format:'a4'});
    let y=18;
    const x=16,w=178;
    function add(t,size=10,bold=false,space=5){
      if(!t)return;
      doc.setFont('helvetica',bold?'bold':'normal');
      doc.setFontSize(size);
      const lines=doc.splitTextToSize(String(t),w);
      if(y+lines.length*5>280){doc.addPage();y=18}
      doc.text(lines,x,y);
      y+=lines.length*5+space;
    }
    for(const el of [...p.children]){
      const tag=el.tagName;
      if(tag==='H1')add(el.innerText,16,true,8);
      else if(tag==='H2'||tag==='H3')add(el.innerText,12,true,5);
      else if(tag==='P')add(el.innerText,10,false,5);
      else if(el.classList?.contains('sig')){y+=18;add(el.innerText,10,false,3)}
      else add(el.innerText,10,false,5);
    }
    const title=(p.querySelector('h1')?.innerText||'documento');
    const name='obrix-'+safe(title)+'-'+new Date().toISOString().slice(0,10)+'.pdf';
    const blob=doc.output('blob');
    return new File([blob],name,{type:'application/pdf'});
  }

  async function pdf(){
    const st=$('status'),btn=$('pdf');
    try{
      if(btn)btn.disabled=true;
      if(st)st.textContent='Gerando PDF...';
      const file=await buildFile();
      if(navigator.share&&navigator.canShare?.({files:[file]})){
        await navigator.share({files:[file],title:'Documento OBRIX'});
        if(st)st.textContent='PDF pronto para salvar ou compartilhar.';
      }else{
        const url=URL.createObjectURL(file),a=document.createElement('a');
        a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),60000);
        if(st)st.textContent='PDF gerado.';
      }
    }catch(e){
      if(st)st.textContent=e?.name==='AbortError'?'Compartilhamento cancelado.':'Erro ao gerar PDF: '+(e.message||e);
    }finally{
      if(btn)btn.disabled=false;
    }
  }

  const b=$('pdf');
  if(b)b.onclick=pdf;
  window.OBRIX_DOC_PDF={buildFile,pdf};
})();