(()=>{
  'use strict';
  if(window.__OBRIX_EQUIPE_FOLHA_INSTALL)return;
  window.__OBRIX_EQUIPE_FOLHA_INSTALL=true;

  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]||c));
  const funcs=()=>{try{return typeof funcionarios!=='undefined'&&Array.isArray(funcionarios)?funcionarios:[]}catch(_){return[]}};
  const diariasList=()=>{try{return typeof diarias!=='undefined'&&Array.isArray(diarias)?diarias:[]}catch(_){return[]}};
  const valesList=()=>{try{return typeof vales!=='undefined'&&Array.isArray(vales)?vales:[]}catch(_){return[]}};
  const bonusList=()=>{try{return typeof bonus!=='undefined'&&Array.isArray(bonus)?bonus:[]}catch(_){return[]}};

  function modal(titulo,html){
    const back=document.createElement('div');back.className='modalBack obrix-folha-modalback';
    back.innerHTML=`<div class="modal obrix-folha-modal"><div class="obrix-folha-modalhead"><h2>${esc(titulo)}</h2><button type="button" class="obrix-folha-x" aria-label="Fechar">×</button></div>${html}</div>`;
    document.body.appendChild(back);back.querySelector('.obrix-folha-x').onclick=()=>back.remove();back.addEventListener('click',e=>{if(e.target===back)back.remove()});return back;
  }

  function abrirAcaoTopo(tipo){
    const fs=funcs().slice().sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));if(!fs.length)return alert('Nenhum funcionário cadastrado.');
    const ehVale=tipo==='vale',titulo=ehVale?'Vale':'Bônus e Extras',texto=ehVale?'Selecione o funcionário para registrar um vale.':'Selecione o funcionário para registrar um bônus ou extra.';
    const back=modal(titulo,`<p class="muted">${texto}</p><label>Funcionário</label><select class="obrix-acao-func">${fs.map(f=>`<option value="${esc(f.id)}">${esc(f.nome||'Funcionário')}</option>`).join('')}</select><div class="modalActions"><button type="button" class="btn cancelar">Cancelar</button><button type="button" class="btn continuar">Continuar</button></div>`);
    back.querySelector('.cancelar').onclick=()=>back.remove();back.querySelector('.continuar').onclick=()=>{const id=back.querySelector('.obrix-acao-func').value;back.remove();window.equipeAcao?.(String(id),tipo)};
  }

  function garantirBotoesTopo(){
    const botoes=document.querySelector('#equipe .obrix-equipe-botoes');if(!botoes)return;
    let vale=botoes.querySelector('[data-cmd="vale"]');if(!vale){vale=document.createElement('button');vale.type='button';vale.className='obrix-cmd obrix-vale-topo';vale.dataset.cmd='vale';vale.textContent='💵 Vale';botoes.appendChild(vale)}vale.onclick=()=>abrirAcaoTopo('vale');
    let bonus=botoes.querySelector('[data-cmd="bonus"]');if(!bonus){bonus=document.createElement('button');bonus.type='button';bonus.className='obrix-cmd obrix-bonus-topo';bonus.dataset.cmd='bonus';bonus.textContent='🎁 Bônus e Extras';botoes.appendChild(bonus)}bonus.onclick=()=>abrirAcaoTopo('bonus');
  }

  function retirarAcoesDosRegistros(){document.querySelectorAll('.obrix-registros-acoes [data-extra="vale"],.obrix-registros-acoes [data-extra="bonus"]').forEach(b=>b.remove())}

  function calcularFolha(){
    const fs=funcs();let diariasAberto=0,valesAberto=0,bonusAberto=0,liquido=0;const ds=diariasList(),vs=valesList(),bs=bonusList();
    fs.forEach(f=>{const id=String(f.id),d=ds.filter(x=>String(x.funcionario_id)===id&&!x.paga).reduce((s,x)=>s+Number(x.valor_total||0),0),v=vs.filter(x=>String(x.funcionario_id)===id&&!x.quitado).reduce((s,x)=>s+Number(x.valor||0),0),b=bs.filter(x=>String(x.funcionario_id)===id&&!x.pago).reduce((s,x)=>s+Number(x.valor||0),0);diariasAberto+=d;valesAberto+=v;bonusAberto+=b;const bruto=d+b;liquido+=Math.max(0,bruto-Math.min(v,Math.max(0,bruto)))});
    return {ativos:fs.filter(f=>f.ativo!==false).length,diariasAberto,valesAberto,bonusAberto,bruto:diariasAberto+bonusAberto,liquido};
  }

  function garantirResumo(){const sec=document.getElementById('equipe'),controles=sec?.querySelector('.obrix-equipe-controles');if(!sec||!controles)return null;let box=sec.querySelector('#obrixGestaoResumo');if(!box){box=document.createElement('section');box.id='obrixGestaoResumo';box.className='card obrix-gestao-resumo';controles.insertAdjacentElement('afterend',box)}return box}

  let pagamentoCache={valor:null,ts:0,carregando:false};
  async function totalPagoHistorico(){const agora=Date.now();if(pagamentoCache.valor!==null&&agora-pagamentoCache.ts<5000)return pagamentoCache.valor;if(pagamentoCache.carregando)return pagamentoCache.valor;pagamentoCache.carregando=true;try{const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile();const {data,error}=await sb.from('pagamentos_equipe').select('valor_liquido').eq('empresa_id',p.empresa_id);if(error)throw error;pagamentoCache={valor:(data||[]).reduce((s,x)=>s+Number(x.valor_liquido||0),0),ts:Date.now(),carregando:false};return pagamentoCache.valor}catch(_){pagamentoCache.carregando=false;return pagamentoCache.valor}}

  let resumoTimer=null;
  async function atualizarResumo(){clearTimeout(resumoTimer);resumoTimer=setTimeout(async()=>{garantirBotoesTopo();retirarAcoesDosRegistros();const box=garantirResumo();if(!box)return;const r=calcularFolha(),pago=await totalPagoHistorico();box.innerHTML=`<div class="obrix-gestao-head"><div><h2>Gestão da equipe</h2><p>Resumo total da folha de pagamento</p></div></div><div class="obrix-folha-grid"><div><small>Funcionários ativos</small><strong>${r.ativos}</strong></div><div><small>Diárias em aberto</small><strong>${money(r.diariasAberto)}</strong></div><div><small>Vales em aberto</small><strong>${money(r.valesAberto)}</strong></div><div><small>Bônus e extras</small><strong>${money(r.bonusAberto)}</strong></div><div><small>Bruto da folha</small><strong>${money(r.bruto)}</strong></div><div class="destaque"><small>Líquido a pagar</small><strong>${money(r.liquido)}</strong></div><div class="pago"><small>Total pago (histórico)</small><strong>${pago===null?'—':money(pago)}</strong></div></div>`},80)}

  let deferredPrompt=null;const instalado=()=>window.matchMedia?.('(display-mode: standalone)').matches===true||window.navigator.standalone===true;
  function garantirInstalacao(){const inicio=document.getElementById('inicio');if(!inicio)return;if(instalado()){inicio.querySelector('#obrixInstalarApp')?.remove();return}let card=inicio.querySelector('#obrixInstalarApp');if(!card){card=document.createElement('section');card.id='obrixInstalarApp';card.className='card obrix-instalar-card';card.innerHTML=`<h2>Instalar o OBRIX</h2><p class="muted">Tenha o aplicativo na tela inicial para abrir mais rápido.</p><button type="button" class="btn obrix-instalar-btn">Instalar aplicativo</button><div class="obrix-instrucoes-install"><h3>Como instalar</h3><p><b>Safari no iPhone/iPad:</b> toque em <b>Compartilhar</b> → <b>Adicionar à Tela de Início</b> → <b>Adicionar</b>.</p><p><b>Google Chrome/Android:</b> toque no menu <b>⋮</b> → <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b> → <b>Instalar</b>.</p><p class="muted">Se o botão “Instalar aplicativo” do OBRIX não abrir a instalação automática, siga as instruções do seu navegador acima.</p></div>`;const obras=inicio.querySelector('#obxObras');if(obras)obras.insertAdjacentElement('afterend',card);else inicio.appendChild(card);card.querySelector('.obrix-instalar-btn').onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();try{await deferredPrompt.userChoice}catch(_){}deferredPrompt=null;if(instalado())card.remove()}else card.querySelector('.obrix-instrucoes-install')?.scrollIntoView({behavior:'smooth',block:'center'})}}}
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;garantirInstalacao()});window.addEventListener('appinstalled',()=>document.getElementById('obrixInstalarApp')?.remove());

  function iniciar(){garantirBotoesTopo();retirarAcoesDosRegistros();atualizarResumo();garantirInstalacao();const lista=document.getElementById('listaEquipe');if(lista&&!lista.__obrixFolhaObs){lista.__obrixFolhaObs=true;new MutationObserver(()=>{pagamentoCache.ts=0;atualizarResumo()}).observe(lista,{childList:true,subtree:true})}if(!document.body.__obrixFolhaModalObs){document.body.__obrixFolhaModalObs=true;new MutationObserver(()=>retirarAcoesDosRegistros()).observe(document.body,{childList:true,subtree:true})}}

  const css=document.createElement('style');css.textContent=`
    .obrix-vale-topo{border-color:#3b82f6!important;color:#2563eb!important}.obrix-bonus-topo{border-color:#d59b28!important;color:#9a6700!important}
    .obrix-gestao-resumo{margin:0 0 18px!important;padding:18px!important}.obrix-gestao-head h2{margin:0 0 4px;font-size:22px}.obrix-gestao-head p{margin:0 0 14px;color:#64748b}
    .obrix-folha-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.obrix-folha-grid>div{border:1px solid #e2e8f0;border-radius:14px;padding:14px;background:#f8fafc;min-width:0}.obrix-folha-grid small{display:block;color:#64748b;font-weight:700;margin-bottom:5px}.obrix-folha-grid strong{display:block;font-size:20px;word-break:break-word}.obrix-folha-grid .destaque{background:#fff1f2;border-color:#fecdd3}.obrix-folha-grid .destaque strong{color:#e11d48}.obrix-folha-grid .pago{grid-column:1/-1}.obrix-folha-grid .pago strong{color:#10b981}
    .obrix-registros-acoes{grid-template-columns:1fr!important}.obrix-folha-modalhead{display:flex;align-items:center;justify-content:space-between;gap:12px}.obrix-folha-modalhead h2{margin:0}.obrix-folha-x{border:0;background:transparent;font-size:30px;color:inherit}.obrix-folha-modal label{display:block;font-weight:800;margin:12px 0 5px}.obrix-folha-modal select{width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#0f172a;font:inherit}
    .obrix-instalar-card{margin-top:18px!important}.obrix-instalar-card h2{margin:0 0 5px}.obrix-instalar-btn{width:100%;margin:8px 0 14px;min-height:52px}.obrix-instrucoes-install{border-top:1px solid #e2e8f0;padding-top:14px}.obrix-instrucoes-install h3{margin:0 0 10px}.obrix-instrucoes-install p{line-height:1.5;margin:8px 0}
    html[data-theme="dark"] .obrix-gestao-resumo,body.dark .obrix-gestao-resumo,html[data-theme="dark"] .obrix-instalar-card,body.dark .obrix-instalar-card{background:#0f172a;color:#f8fafc;border-color:#334155}html[data-theme="dark"] .obrix-folha-grid>div,body.dark .obrix-folha-grid>div{background:#111827;border-color:#334155}html[data-theme="dark"] .obrix-folha-grid .destaque,body.dark .obrix-folha-grid .destaque{background:#231b27;border-color:#3d2934}html[data-theme="dark"] .obrix-folha-modal,body.dark .obrix-folha-modal{background:#0f172a;color:#f8fafc}html[data-theme="dark"] .obrix-folha-modal select,body.dark .obrix-folha-modal select{background:#111827;color:#f8fafc;border-color:#334155}html[data-theme="dark"] .obrix-instrucoes-install,body.dark .obrix-instrucoes-install{border-color:#334155}
    @media(max-width:390px){.obrix-folha-grid{grid-template-columns:1fr}.obrix-folha-grid .pago{grid-column:auto}}
  `;document.head.appendChild(css);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciar,1100));else setTimeout(iniciar,1100);setTimeout(iniciar,1800);setTimeout(iniciar,3200);document.addEventListener('click',e=>{if(e.target.closest?.('#equipe button,#equipe select,.bottom button'))setTimeout(()=>{iniciar();atualizarResumo()},180)},true);window.addEventListener('pageshow',()=>setTimeout(iniciar,150));
})();