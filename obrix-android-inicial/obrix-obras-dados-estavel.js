(()=>{'use strict';
let busy=false;
function troca(nome,rows){const a=window[nome];if(Array.isArray(a))a.splice(0,a.length,...rows);else window[nome]=rows}
async function sync(){if(busy||!window.OBRIX_BACKEND)return;busy=true;try{const p=await OBRIX_BACKEND.profile(),sb=await OBRIX_BACKEND.init(),eid=p.empresa_id;const [o,f,e]=await Promise.all([sb.from('obras').select('*').eq('empresa_id',eid).order('criado_em',{ascending:false}),sb.from('financeiro').select('*').eq('empresa_id',eid).order('data',{ascending:false}),sb.from('servicos_extras').select('*').eq('empresa_id',eid)]);if(o.error)throw o.error;if(f.error)throw f.error;if(e.error)throw e.error;troca('obras',o.data||[]);troca('financeiro',f.data||[]);troca('extras',e.data||[]);window.renderObras?.();window.OBRIX_OBRAS_MODERNO?.refresh?.();window.OBRIX_DASH?.sync?.();window.OBRIX_DASH?.paint?.()}catch(err){console.warn('OBRIX Obras dados:',err)}finally{busy=false}}
const abrirAntigo=window.abrir;if(typeof abrirAntigo==='function'&&!abrirAntigo.__obrixDadosEstavel){const fn=function(id){const r=abrirAntigo.apply(this,arguments);if(id==='obras')setTimeout(sync,80);return r};fn.__obrixDadosEstavel=true;window.abrir=fn}
document.addEventListener('click',e=>{if(e.target.closest?.('#salvarObraBtn,#extraSalvar'))setTimeout(sync,250)},false);
window.OBRIX_OBRAS_DADOS={sync};setTimeout(sync,900);
})();