(()=>{'use strict';
 if(window.__OBRIX_FIN_PROTECAO_ESTOQUE_ESTAVEL)return;
 window.__OBRIX_FIN_PROTECAO_ESTOQUE_ESTAVEL=true;
 const ehEstoque=x=>x?.origem==='estoque'||!!x?.estoque_movimentacao_id||
   String(x?.observacoes||'').startsWith('Movimentação automática do estoque:');
 let timer=0,observado=null,observer=null;
 function aplicar(){
  const lista=document.getElementById('fmLista');
  if(!lista)return;
  for(const card of lista.querySelectorAll('.card.item')){
   const titulo=(card.querySelector('h3')?.textContent||'').trim().toLowerCase();
   const temAcoes=!!card.querySelector('[data-fin="editar"],[data-fin="excluir"]');
   const exibir=!temAcoes&&titulo.startsWith('saída de estoque -');
   const aviso=card.querySelector('.finEstoqueProtegido');
   if(!exibir){aviso?.remove();continue}
   if(aviso)continue; // Idempotência: não destruir/recriar a cada sincronização.
   let actions=card.querySelector('.actions');
   if(!actions){actions=document.createElement('div');actions.className='actions';card.appendChild(actions)}
   const el=document.createElement('div');el.className='muted finEstoqueProtegido';
   el.style.cssText='width:100%;font-weight:700;padding:8px 0';
   el.textContent='Gerado pelo estoque — estorne pelo Histórico.';
   actions.appendChild(el);
  }
 }
 function agendar(){clearTimeout(timer);timer=setTimeout(aplicar,70)}
 function conectar(){
  const lista=document.getElementById('fmLista');
  if(lista&&lista!==observado){
   observer?.disconnect();observado=lista;observer=new MutationObserver(agendar);
   observer.observe(lista,{childList:true,subtree:false});
  }
  agendar();
 }
 document.addEventListener('click',e=>{
  const botao=e.target.closest?.('[data-fin]');if(!botao)return;
  const x=(window.financeiro||[]).find(z=>String(z.id)===String(botao.dataset.id));
  if(!ehEstoque(x))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  window.OBRIX_MENSAGEM?.('Lançamento do estoque. Para desfazer, abra Estoque → Histórico → Estornar saída.','erro');
 },true);
 window.addEventListener('focus',conectar);
 window.addEventListener('pageshow',conectar);
 window.addEventListener('obrix:modules-ready',conectar);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)conectar()});
 // O Financeiro é carregado sob demanda; detectar seu primeiro carregamento
 // sem observar todo o documentElement nem reprocessar a lista a cada segundo.
 setInterval(()=>{if(!document.hidden)conectar()},5000);
 setTimeout(conectar,0);
})();