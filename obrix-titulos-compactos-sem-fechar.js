(()=>{
'use strict';
const TITULOS=['Financeiro','Equipe','Diário de Obras','Orçamentos','Ajuda e Feedback','Obras','Relatórios','Documentos','Materiais / Estoque','Estoque','Configurações','Backup'];
const norm=s=>(s||'').replace(/\s+/g,' ').trim().toLowerCase();
const ehTitulo=t=>TITULOS.some(x=>norm(t)===norm(x));
function ajustar(){
  document.querySelectorAll('h1,h2,h3,strong,.title,.titulo').forEach(t=>{
    if(!ehTitulo(t.textContent)) return;
    let box=t.parentElement;
    if(!box) return;
    // Somente cabeçalhos/cartões que contêm o título e ações de navegação.
    const txt=norm(box.textContent);
    if(txt.length>160) return;
    box.classList.add('obrixTituloCompacto');
    t.classList.add('obrixTituloTexto');
    box.querySelectorAll('button,a,[role="button"]').forEach(b=>{
      if(b===t || b.contains(t)) return;
      const a=(b.getAttribute('aria-label')||b.getAttribute('title')||b.textContent||'').trim().toLowerCase();
      if(a==='fechar'||a==='voltar'||a==='×'||a==='x'||a==='✕'||a==='←'||a.includes('fechar')) b.classList.add('obrixFecharTituloRemovido');
    });
  });
}
const style=document.createElement('style');
style.textContent=`
.obrixTituloCompacto{min-height:0!important;height:auto!important;padding:10px 14px!important;margin-bottom:12px!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:0!important;text-align:left!important;background:transparent!important;box-shadow:none!important}
.obrixTituloCompacto .obrixTituloTexto{margin:0!important;padding:0!important;text-align:left!important;line-height:1.2!important;width:auto!important;flex:0 1 auto!important}
.obrixTituloCompacto .obrixFecharTituloRemovido{display:none!important}
`;
document.head.appendChild(style);
adjustar();
new MutationObserver(()=>requestAnimationFrame(ajustar)).observe(document.body,{childList:true,subtree:true});
})();