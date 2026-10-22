(()=>{'use strict';
if(window.__OBRIX_ORC_UI_V5)return;window.__OBRIX_ORC_UI_V5=true;
const PDF_STATE=new WeakMap();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function injectCss(){if(document.getElementById('obrixOrcV5Css'))return;const s=document.createElement('style');s.id='obrixOrcV5Css';s.textContent=`
#orcamentosMain .orcItem{padding:10px!important;margin-bottom:8px!important;border-radius:12px!important}
#orcamentosMain .orcItem label{font-weight:900!important;margin:5px 0 3px!important}
#orcamentosMain .orcItem .desc,#orcamentosMain .orcItem .qtd,#orcamentosMain .orcItem .uni,#orcamentosMain .orcItem .vu,#orcamentosMain .orcItem .vt{font-weight:900!important}
#orcamentosMain .orcItem .desc,#orcamentosMain .orcItem .qtd,#orcamentosMain .orcItem .uni,#orcamentosMain .orcItem .vu,#orcamentosMain .orcItem .obs{min-height:42px!important;padding:9px 10px!important}
#orcamentosMain .orcItem>label:has(.obs){font-size:12px!important;color:var(--muted,#64748b)!important;margin-top:7px!important}
#orcamentosMain .orcItem .obs{height:42px!important;font-size:14px!important;font-weight:700!important;margin-top:3px!important}
#orcamentosMain .orcItemTotal span{font-size:11px!important}
#orcamentosMain .orcItemTotal b{font-weight:950!important}
@media(max-width:700px){
 #orcamentosMain .orcGridItem{display:grid!important;grid-template-columns:minmax(0,1fr) 72px 108px 36px!important;gap:6px!important;align-items:end!important}
 #orcamentosMain .orcGridItem>label:nth-child(1){grid-column:1/-1!important}
 #orcamentosMain .orcGridItem>label:nth-child(2){grid-column:1!important}
 #orcamentosMain .orcGridItem>label:nth-child(3){grid-column:2!important}
 #orcamentosMain .orcGridItem>label:nth-child(4){grid-column:3!important}
 #orcamentosMain .orcGridItem .orcItemTotal{grid-column:1/4!important;padding:2px 0 0!important;display:flex!important;justify-content:flex-end!important;align-items:center!important;gap:8px!important}
 #orcamentosMain .orcGridItem .orcItemTotal span,#orcamentosMain .orcGridItem .orcItemTotal b{display:inline!important}
 #orcamentosMain .orcGridItem .orcRemove{grid-column:4!important;grid-row:2!important;width:36px!important;height:42px!important;margin:0!important}
 #orcamentosMain .orcItem .qtd,#orcamentosMain .orcItem .uni,#orcamentosMain .orcItem .vu{font-size:15px!important;padding-left:8px!important;padding-right:8px!important}
}
`;document.head.appendChild(s)}
function compactar(){injectCss();document.querySelectorAll('#orcItens .orcItem').forEach(row=>{const desc=row.querySelector('.desc'),q=row.querySelector('.qtd'),vu=row.querySelector('.vu'),obs=row.querySelector('.obs');if(desc)desc.style.fontWeight='900';if(q)q.style.fontWeight='900';if(vu)vu.style.fontWeight='900';if(obs){obs.placeholder='Observação curta do item';obs.setAttribute('aria-label','Observações do item')}})}
function loadInto(w,src,test){return new Promise(resolve=>{try{if(test())return resolve(true);const s=w.document.createElement('script');s.src=src;s.onload=()=>resolve(true);s.onerror=()=>resolve(false);w.document.head.appendChild(s)}catch(_){resolve(false)}})}
async function gerarPdfPopup(w){const sheet=w.document.querySelector('.sheet');if(!sheet)return null;const state=PDF_STATE.get(w)||{};if(state.promise)return state.promise;state.promise=(async()=>{const ok1=await loadInto(w,'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',()=>!!w.html2canvas);const ok2=await loadInto(w,'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',()=>!!w.jspdf?.jsPDF);if(!ok1||!ok2)throw new Error('Não foi possível carregar o gerador de PDF.');const canvas=await w.html2canvas(sheet,{scale:1.45,useCORS:true,backgroundColor:'#ffffff',logging:false});const img=canvas.toDataURL('image/jpeg',0.94),jsPDF=w.jspdf.jsPDF,pdf=new jsPDF('p','mm','a4'),pageW=210,pageH=297,margin=8,imgW=pageW-margin*2,imgH=canvas.height*imgW/canvas.width,usable=pageH-margin*2;let offset=0,page=0;while(offset<imgH-.5){if(page>0)pdf.addPage();pdf.addImage(img,'JPEG',margin,margin-offset,imgW,imgH,undefined,'FAST');offset+=usable;page++}const blob=pdf.output('blob'),num=(w.document.querySelector('.numero')?.textContent||'orcamento').replace(/[^0-9A-Za-zÀ-ÿ_-]+/g,'-'),file=new File([blob],`Orcamento-${num}.pdf`,{type:'application/pdf'});state.file=file;PDF_STATE.set(w,state);return file})();PDF_STATE.set(w,state);try{return await state.promise}catch(e){state.promise=null;PDF_STATE.set(w,state);throw e}}
async function compartilharPdf(w,btn){try{btn.disabled=true;btn.textContent='Preparando PDF...';const file=await gerarPdfPopup(w);btn.disabled=false;btn.textContent='Compartilhar PDF';if(w.navigator.canShare?.({files:[file]})){await w.navigator.share({files:[file],title:w.document.title||'Orçamento'});return}const url=w.URL.createObjectURL(file),a=w.document.createElement('a');a.href=url;a.download=file.name;w.document.body.appendChild(a);a.click();a.remove();setTimeout(()=>w.URL.revokeObjectURL(url),3000);w.alert('O PDF foi gerado. Use o arquivo salvo para compartilhar.')}catch(e){btn.disabled=false;btn.textContent='Compartilhar PDF';w.alert('Não foi possível gerar o PDF para compartilhar. Tente novamente.')}}
function decorarPopup(w){let tries=0;const t=setInterval(async()=>{tries++;try{if(w.closed){clearInterval(t);return}const sheet=w.document.querySelector('.sheet');if(!sheet){if(tries>100)clearInterval(t);return}clearInterval(t);const st=w.document.createElement('style');st.textContent=`tbody td:nth-child(2)>b,tbody td:nth-child(3),tbody td:nth-child(4),tbody td:nth-child(5){font-weight:950!important}tbody small{font-weight:600!important;line-height:1.25!important;margin-top:3px!important}.toolbar button:nth-child(2){font-weight:900!important}`;w.document.head.appendChild(st);const buttons=[...w.document.querySelectorAll('.toolbar button')],share=buttons[1];if(share){share.textContent='Preparando PDF...';share.disabled=true;share.onclick=()=>compartilharPdf(w,share);gerarPdfPopup(w).then(()=>{if(!w.closed){share.disabled=false;share.textContent='Compartilhar PDF'}}).catch(()=>{if(!w.closed){share.disabled=false;share.textContent='Compartilhar PDF'}})}}catch(_){if(tries>100)clearInterval(t)}},80)}
const originalOpen=window.open?.bind(window);if(originalOpen&&!window.open.__obrixOrcV5){const f=function(){const w=originalOpen(...arguments);if(w)setTimeout(()=>decorarPopup(w),20);return w};f.__obrixOrcV5=true;window.open=f}
const mo=new MutationObserver(compactar);if(document.body)mo.observe(document.body,{childList:true,subtree:true});else document.addEventListener('DOMContentLoaded',()=>mo.observe(document.body,{childList:true,subtree:true}));
setInterval(compactar,1200);compactar();
window.OBRIX_ORC_UI_V5={compactar,decorarPopup,gerarPdfPopup};
})();