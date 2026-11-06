(()=>{
'use strict';
if(window.__OBRIX_FIN_BUSCA)return;
window.__OBRIX_FIN_BUSCA=true;

const estado={busca:''};
const STOP=new Set(['a','o','as','os','um','uma','uns','umas','de','da','do','das','dos','em','no','na','nos','nas','com','e','para','por','que','foi','foram','me','mostre','mostra','mostrar','quero','ver','procure','procura','buscar','busca','encontre','encontra','achar','ache','todos','todas','somente','so','apenas','valor','valores','lancamento','lancamentos','financeiro','financeira','r','real','reais']);
const CAT={
  entrada:'entrada receita recebimento recebido',
  material:'material materiais',
  mao_de_obra:'mao de obra equipe funcionario funcionarios trabalhador trabalhadores',
  servico_terceirizado:'servico terceirizado terceirizados terceiro terceiros',
  ferramentas_equipamentos:'ferramenta ferramentas equipamento equipamentos',
  locacao:'locacao aluguel alugueis',
  transporte:'transporte frete',
  combustivel:'combustivel combustiveis',
  outros:'outros outras'
};

const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[_-]+/g,' ').replace(/[^a-z0-9.,/\s]/g,' ').replace(/\s+/g,' ').trim();
const words=s=>norm(s).replace(/[.,/]/g,' ').split(/\s+/).filter(Boolean);
const digitChunks=s=>(String(s??'').match(/\d[\d.,/-]*/g)||[]).map(v=>v.replace(/\D/g,'')).filter(Boolean);
const pad=n=>String(n).padStart(2,'0');
const dateForms=s=>{
  const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(!m)return [];
  const [,y,mo,d]=m;
  return [`${y}${mo}${d}`,`${d}${mo}${y}`,`${d}/${mo}/${y}`,`${d}-${mo}-${y}`,`${d}.${mo}.${y}`];
};
const moneyForms=v=>{
  const n=Number(v);
  if(!Number.isFinite(n))return [];
  const br=n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const plain=n.toFixed(2);
  const inteiro=String(Math.trunc(Math.abs(n)));
  return [String(n),plain,br,`R$ ${br}`,inteiro].concat([String(Math.round(Math.abs(n)*100))]);
};
const hoje=()=>{
  const d=new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
};
const ontem=()=>{
  const d=new Date();d.setDate(d.getDate()-1);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
};
const mesKey=s=>String(s||'').slice(0,7);
const anoKey=s=>String(s||'').slice(0,4);
const mesRel=delta=>{const d=new Date();d.setMonth(d.getMonth()+delta);return `${d.getFullYear()}-${pad(d.getMonth()+1)}`};
const anoRel=delta=>String(new Date().getFullYear()+delta);

function queryInfo(raw){
  const n=norm(raw);
  const flags={hoje:/\bhoje\b/.test(n),ontem:/\bontem\b/.test(n),mesAtual:/\b(este mes|mes atual)\b/.test(n),mesPassado:/\b(mes passado|ultimo mes)\b/.test(n),anoAtual:/\b(este ano|ano atual)\b/.test(n),anoPassado:/\b(ano passado|ultimo ano)\b/.test(n)};
  let clean=n.replace(/\b(hoje|ontem|este mes|mes atual|mes passado|ultimo mes|este ano|ano atual|ano passado|ultimo ano)\b/g,' ');
  const termos=words(clean).filter(t=>!/^\d+$/.test(t)&&!STOP.has(t));
  const numeros=digitChunks(raw);
  return {termos,numeros,flags};
}

function recordFor(card){
  const id=String(card.dataset.id||'');
  return (Array.isArray(window.financeiro)?window.financeiro:[]).find(x=>String(x.id)===id)||null;
}
function obraFor(x){
  if(!x)return null;
  return (Array.isArray(window.obras)?window.obras:[]).find(o=>String(o.id)===String(x.obra_id))||null;
}
function indexes(card){
  const x=recordFor(card),o=obraFor(x);
  const extras=[];
  if(x?.tipo==='despesa')extras.push('despesa despesas gasto gastos saida saidas custo custos');
  if(x?.tipo==='receita')extras.push('receita receitas entrada entradas recebimento recebimentos recebido recebidos');
  if(x?.categoria&&CAT[x.categoria])extras.push(CAT[x.categoria]);
  const txt=[card.textContent,x?.descricao,x?.tipo,x?.categoria,x?.subcategoria,x?.origem,x?.status_lancamento,o?.nome,o?.cliente,o?.local,o?.status,...extras,...dateForms(x?.data),...moneyForms(x?.valor)].filter(Boolean).join(' ');
  const texto=norm(txt);
  const nums=new Set(digitChunks(txt));
  dateForms(x?.data).forEach(v=>digitChunks(v).forEach(n=>nums.add(n)));
  moneyForms(x?.valor).forEach(v=>digitChunks(v).forEach(n=>nums.add(n)));
  return {x,texto,nums:[...nums]};
}
function periodoOk(data,flags){
  if(!Object.values(flags).some(Boolean))return true;
  if(!data)return false;
  if(flags.hoje&&String(data).slice(0,10)!==hoje())return false;
  if(flags.ontem&&String(data).slice(0,10)!==ontem())return false;
  if(flags.mesAtual&&mesKey(data)!==mesRel(0))return false;
  if(flags.mesPassado&&mesKey(data)!==mesRel(-1))return false;
  if(flags.anoAtual&&anoKey(data)!==anoRel(0))return false;
  if(flags.anoPassado&&anoKey(data)!==anoRel(-1))return false;
  return true;
}
function match(card,info){
  const idx=indexes(card);
  if(!periodoOk(idx.x?.data,info.flags))return false;
  const termosOk=info.termos.every(t=>idx.texto.includes(t));
  const numsOk=info.numeros.every(q=>idx.nums.some(n=>n.includes(q)||q.includes(n)));
  return termosOk&&numsOk;
}

// No teclado móvel, o filtro reordena a altura da lista. Mantém somente o eixo X da página em zero.
function conterDeslocamentoBusca(){
  if(!window.matchMedia('(max-width:900px)').matches)return;
  window.requestAnimationFrame(()=>{
    if(document.activeElement?.id!=='fmFiltroBusca')return;
    const page=document.scrollingElement||document.documentElement;
    if(page&&page.scrollLeft!==0)page.scrollLeft=0;
    if(document.body&&document.body.scrollLeft!==0)document.body.scrollLeft=0;
  });
}
if(window.visualViewport){
  window.visualViewport.addEventListener('resize',()=>{
    if(document.activeElement?.id==='fmFiltroBusca')conterDeslocamentoBusca();
  },{passive:true});
}

function ensure(){
  const main=document.getElementById('financeiroMain');
  if(!main)return false;
  let wrap=document.getElementById('fmBuscaPanel');
  if(!wrap){
    document.getElementById('fmFiltrosPanel')?.remove();
    wrap=document.createElement('section');
    wrap.id='fmBuscaPanel';
    wrap.className='card fmBuscaPanel';
    wrap.innerHTML='<div class="fmBuscaTexto"><input id="fmFiltroBusca" type="search" placeholder="Buscar por obra, descrição, valor, data, categoria..." autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Buscar no financeiro"></div>';
    const form=document.getElementById('fmForm');
    if(form?.parentNode)form.parentNode.insertBefore(wrap,form);else main.appendChild(wrap);
  }
  const busca=document.getElementById('fmFiltroBusca');
  if(busca&&!busca.dataset.obrixBuscaLigada){
    busca.dataset.obrixBuscaLigada='1';
    busca.value=estado.busca;
    busca.addEventListener('focus',conterDeslocamentoBusca);
    busca.addEventListener('input',()=>{estado.busca=busca.value;aplicar();conterDeslocamentoBusca()});
    busca.addEventListener('search',()=>{estado.busca=busca.value;aplicar();conterDeslocamentoBusca()});
  }
  return true;
}
function aplicar(){
  if(!ensure())return;
  const lista=document.getElementById('fmLista');
  if(!lista)return;
  const cards=[...lista.querySelectorAll('[data-fin-card="1"]')];
  const info=queryInfo(estado.busca);
  const ativa=estado.busca.trim().length>0;
  let vis=0;
  cards.forEach(card=>{const ok=!ativa||match(card,info);card.style.display=ok?'':'none';if(ok)vis++});
  let vazio=document.getElementById('fmBuscaVazio');
  if(ativa&&cards.length&&vis===0){
    if(!vazio){vazio=document.createElement('div');vazio.id='fmBuscaVazio';vazio.className='card muted fmBuscaVazio';lista.prepend(vazio)}
    vazio.textContent=`Nenhum lançamento encontrado para “${estado.busca.trim()}”.`;
    vazio.style.display='';
  }else if(vazio){vazio.style.display='none'}
}
function limpar(){estado.busca='';const el=document.getElementById('fmFiltroBusca');if(el)el.value='';aplicar()}
function refreshOptions(){aplicar()}

const css=document.createElement('style');
css.id='obrix-financeiro-busca-style';
css.textContent=`#fmBuscaPanel.fmBuscaPanel{margin:0 0 14px!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}.fmBuscaTexto{margin:0!important}.fmBuscaTexto input{display:block;width:100%!important;min-height:48px!important;border:1px solid #cbd5e1!important;border-radius:12px!important;background:#fff!important;color:#0f172a!important;padding:0 14px!important;font:inherit!important;font-size:16px!important;box-sizing:border-box!important}.fmBuscaTexto input::placeholder{color:#64748b!important;opacity:1}.fmBuscaVazio{margin-top:10px!important}html[data-theme="dark"] .fmBuscaTexto input,body.dark .fmBuscaTexto input{background:#111827!important;color:#f8fafc!important;border-color:#334155!important}html[data-theme="dark"] .fmBuscaTexto input::placeholder,body.dark .fmBuscaTexto input::placeholder{color:#94a3b8!important}`;
document.head.appendChild(css);

document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(b&&(b.textContent||'').trim()==='Financeiro')setTimeout(()=>{ensure();aplicar()},120)},true);
window.addEventListener('pageshow',()=>setTimeout(()=>{ensure();aplicar()},120));
window.addEventListener('focus',()=>setTimeout(aplicar,0));
setTimeout(()=>{ensure();aplicar()},250);
window.OBRIX_FIN_BUSCA={aplicar,limpar,refreshOptions,ensure};
})();

(()=>{if(window.__OBRIX_OBRAS_BOTOES_FIX_LOADER)return;window.__OBRIX_OBRAS_BOTOES_FIX_LOADER=true;const s=document.createElement('script');s.src='./obrix-obras-botoes-fix.js?v=20261030fix1';s.defer=true;document.head.appendChild(s)})();
(()=>{if(!window.matchMedia('(max-width:620px)').matches)return;if(window.__OBRIX_FIN_MOBILE_RESUMO_LOADER)return;window.__OBRIX_FIN_MOBILE_RESUMO_LOADER=1;const s=document.createElement('script');s.src='./obrix-financeiro-mobile-resumo-obra.js?v=20261101mobresumo1';s.async=false;document.head.appendChild(s)})();
(()=>{'use strict';if(window.__OBRIX_FIN_DIRETO_FIX)return;window.__OBRIX_FIN_DIRETO_FIX=true;const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});let obs=null,timer=null;function resumo(){const main=document.getElementById('financeiroMain');if(!main)return false;const kpis=main.querySelector('.kpis');if(!kpis)return false;let m=document.getElementById('fmMargem');if(!m){const card=document.createElement('div');card.className='kpi';card.innerHTML='<small>Margem lucro</small><strong id="fmMargem">0,0%</strong>';kpis.appendChild(card);m=document.getElementById('fmMargem')}const fin=Array.isArray(window.financeiro)?window.financeiro:[],ativos=fin.filter(x=>!x.status_lancamento||x.status_lancamento==='ativo'),recebido=ativos.filter(x=>x.tipo==='receita').reduce((s,x)=>s+Number(x.valor||0),0),despesas=ativos.filter(x=>x.tipo==='despesa').reduce((s,x)=>s+Number(x.valor||0),0),lucro=recebido-despesas,margem=recebido>0?lucro/recebido*100:0,r=document.getElementById('fmResultado'),rl=r?.closest('.kpi')?.querySelector('small'),ml=m?.closest('.kpi')?.querySelector('small'),mv=margem.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';if(r&&r.textContent!==money(lucro))r.textContent=money(lucro);if(rl&&rl.textContent!=='Lucro')rl.textContent='Lucro';if(m&&m.textContent!==mv)m.textContent=mv;if(ml&&ml.textContent!=='Margem lucro')ml.textContent='Margem lucro';return true}function agendar(){clearTimeout(timer);timer=setTimeout(resumo,0)}function montar(){const main=document.getElementById('financeiroMain');if(!main)return false;const kpis=main.querySelector('.kpis');if(!kpis)return false;resumo();if(!obs){obs=new MutationObserver(()=>agendar());obs.observe(kpis,{childList:true,subtree:true,characterData:true})}return true}const t=setInterval(()=>{if(montar())clearInterval(t)},100);document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(b&&(b.textContent||'').trim()==='Financeiro')setTimeout(agendar,0)},true);window.addEventListener('focus',agendar);window.addEventListener('pageshow',agendar);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')agendar()})})();
