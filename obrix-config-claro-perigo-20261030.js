(()=>{'use strict';
if(window.__OBRIX_TESTE_AJUSTES_GERAIS_3110)return;window.__OBRIX_TESTE_AJUSTES_GERAIS_3110=true;

const $=s=>document.querySelector(s);
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function voltarMenu(main){
  main?.classList.add('hidden');
  if(window.OBRIX_MENU?.open)return window.OBRIX_MENU.open();
  return window.abrir?.('inicio');
}

function prepararSeta(id){
  const b=document.getElementById(id);if(!b)return;
  b.textContent='←';b.setAttribute('aria-label','Voltar');b.title='Voltar';b.classList.add('obrixSetaVoltar');
}

function prepararAssinatura(){
  const main=document.getElementById('assinaturaMain');if(!main)return;
  const hero=main.querySelector(':scope > .hero');if(!hero)return;
  hero.classList.add('obrixHeroComVoltar');
  if(hero.querySelector('#assVoltarTeste'))return;
  const b=document.createElement('button');b.id='assVoltarTeste';b.type='button';b.className='obrixSetaVoltar';b.textContent='←';b.setAttribute('aria-label','Voltar');b.title='Voltar';
  b.onclick=()=>voltarMenu(main);hero.appendChild(b);
}

function prepararOrcamentos(){
  const main=document.getElementById('orcamentosMain');if(!main)return;
  const form=main.querySelector('#orcForm');if(!form)return;
  const topo=form.querySelector('#orcCancelar');if(topo){topo.textContent='Cancelar';topo.setAttribute('aria-label','Cancelar orçamento')}
  const area=form.querySelector(':scope > .orcActions');
  if(area&&!area.querySelector('#orcCancelarRodape')){
    const b=document.createElement('button');b.type='button';b.id='orcCancelarRodape';b.className='btn orcSec';b.textContent='Cancelar';
    b.onclick=()=>{form.classList.add('hidden');scrollTo({top:0,behavior:'smooth'})};
    area.appendChild(b);
  }
}

function protegerRenderObrasFinanceiro(){
  const api=window.OBRIX_OBRAS;if(!api||typeof api.render!=='function'||api.render.__obrixFinGuard)return;
  const original=api.render;
  function guardado(){
    const fin=document.getElementById('financeiroMain'),obras=document.getElementById('obras');
    if(fin&&!fin.classList.contains('hidden')&&(!obras||obras.classList.contains('hidden')))return;
    return original.apply(this,arguments);
  }
  guardado.__obrixFinGuard=true;guardado.__original=original;api.render=guardado;
}

function opcoesObras(sel=''){
  const os=Array.isArray(window.obras)?window.obras:[];
  return '<option value="">Sem obra vinculada</option>'+os.filter(o=>String(o.status||'').toLowerCase()!=='concluida'&&String(o.status||'').toLowerCase()!=='concluída').map(o=>`<option value="${esc(o.id)}" ${String(o.id)===String(sel)?'selected':''}>${esc(o.nome||'Obra')}</option>`).join('');
}

function abrirNovoFuncionario(){
  document.querySelector('.obrixNovoFuncionarioBack')?.remove();
  const back=document.createElement('div');back.className='modalBack obrixNovoFuncionarioBack';
  back.innerHTML=`<div class="modal obrixNovoFuncionarioModal"><div class="obrixNovoFuncionarioHead"><h2>Novo funcionário</h2><button type="button" class="obrixNovoFuncionarioX" aria-label="Fechar">×</button></div><label>Nome</label><input class="nome" placeholder="Nome do funcionário"><label>Cargo / Função</label><input class="cargo" placeholder="Pedreiro, servente, pintor..."><label>Tipo de pagamento</label><select class="tipo"><option value="diaria">Diária</option><option value="semana">Semana</option><option value="quinzena">Quinzena</option><option value="mes">Mês</option></select><label>Valor da diária</label><input class="diaria" type="number" min="0" step="0.01" inputmode="decimal"><label>Salário mensal</label><input class="salario" type="number" min="0" step="0.01" inputmode="decimal"><label>Dia de pagamento mensal</label><input class="dia" type="number" min="1" max="31" inputmode="numeric"><label>Obra vinculada</label><select class="obra">${opcoesObras()}</select><label style="display:flex;align-items:center;gap:8px"><input class="ativo" type="checkbox" checked style="width:auto"> Funcionário ativo</label><label>Observações</label><textarea class="obs" rows="3"></textarea><div class="modalActions"><button type="button" class="btn cancelar">Cancelar</button><button type="button" class="btn salvar">Cadastrar</button></div></div>`;
  document.body.appendChild(back);
  const fechar=()=>back.remove();back.querySelector('.obrixNovoFuncionarioX').onclick=fechar;back.querySelector('.cancelar').onclick=fechar;back.addEventListener('click',e=>{if(e.target===back)fechar()});
  back.querySelector('.salvar').onclick=async()=>{
    const nome=back.querySelector('.nome').value.trim();if(!nome)return alert('Informe o nome do funcionário.');
    const btn=back.querySelector('.salvar');btn.disabled=true;btn.textContent='Cadastrando...';
    try{
      const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile();if(!p?.empresa_id)throw new Error('Empresa não identificada.');
      const payload={empresa_id:p.empresa_id,nome,cargo:back.querySelector('.cargo').value.trim()||null,tipo_pagamento:back.querySelector('.tipo').value,valor_diaria:Number(back.querySelector('.diaria').value||0),salario_mensal:Number(back.querySelector('.salario').value||0),dia_pagamento:back.querySelector('.dia').value?Number(back.querySelector('.dia').value):null,obra_id:back.querySelector('.obra').value||null,ativo:back.querySelector('.ativo').checked,observacoes:back.querySelector('.obs').value.trim()||null,atualizado_em:new Date().toISOString()};
      const {data,error}=await sb.from('funcionarios').insert(payload).select('id');if(error)throw error;if(!data?.length)throw new Error('O cadastro não foi confirmado.');
      fechar();await window.OBRIX_EQUIPE?.refresh?.();
    }catch(e){alert(e?.message||'Não foi possível cadastrar o funcionário.');btn.disabled=false;btn.textContent='Cadastrar'}
  };
}

function prepararEstruturas(){
  prepararSeta('notasFechar');prepararSeta('backupFechar');prepararSeta('offlineCentralFechar');prepararSeta('offFastClose');
  prepararAssinatura();prepararOrcamentos();protegerRenderObrasFinanceiro();
}

const css=document.createElement('style');css.id='obrixTesteAjustesGerais3110';css.textContent=`
#obras .obxBusca{display:none!important}
#obras .obxMais{display:none!important}
html[data-theme="light"] body #configMain [data-del="equipe"],html[data-theme="light"] body #configMain [data-del="financeiro"]{background:#f8fafc!important;background-color:#f8fafc!important;background-image:none!important;color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;border:2px solid #dc2626!important;box-shadow:none!important;transition:none!important}
html[data-theme="light"] body #configMain [data-del="obras"],html[data-theme="light"] body #configMain [data-del="tudo"]{background:#e5eaf0!important;background-color:#e5eaf0!important;background-image:none!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;border:1px solid #cbd5df!important;box-shadow:none!important;transition:none!important}
html[data-theme="light"] #obras{--obx-bg:#eef2f6!important;--obx-panel:#ffffff!important;--obx-border:#cbd5e1!important;--obx-text:#0f172a!important;color:#0f172a!important;-webkit-text-fill-color:initial!important}
html[data-theme="light"] #obras>.hero,html[data-theme="light"] #obras .obxDetalhe{color:#0f172a!important}
html[data-theme="light"] #obras .obxFiltros button{background:#fff!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;border-color:#cbd5e1!important}
html[data-theme="light"] #obras .obxFiltros button.ativo{background:#dbeafe!important;color:#0f172a!important;border-color:#93c5fd!important}
html[data-theme="light"] #obras .obxDetalheHead h2,html[data-theme="light"] #obras .obxProgTitulo,html[data-theme="light"] #obras .obxResumoTitulo{color:#0f172a!important;-webkit-text-fill-color:#0f172a!important}
html[data-theme="light"] #obras .obxDetalheHead p{color:#475569!important;-webkit-text-fill-color:#475569!important;font-weight:600!important}
html[data-theme="light"] #obras .obxProg .obxBar{background:#d4dee6!important}
html[data-theme="light"] #obras .obxResumoTitulo{border-color:#cbd5e1!important}
html[data-theme="light"] #obras .obxResumoGrid>div{background:#fff!important;background-color:#fff!important;border-color:#cbd5e1!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important}
html[data-theme="light"] #obras .obxResumoGrid small{color:#475569!important;-webkit-text-fill-color:#475569!important;font-weight:700!important}
html[data-theme="light"] #obras .obxResumoGrid b{font-weight:900!important}
html[data-theme="light"] #obras .obxAcao{background:#fff!important;background-color:#fff!important;border-color:#cbd5e1!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important}
html[data-theme="light"] #obras .obxAcao b,html[data-theme="light"] #obras .obxAcao i{color:#0f172a!important;-webkit-text-fill-color:#0f172a!important}
html[data-theme="light"] #obras .obxAcao small{color:#475569!important;-webkit-text-fill-color:#475569!important;font-weight:650!important}
html[data-theme="light"] #obras .obxVoltar{background:#fff!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;border:1px solid #cbd5e1!important}
html[data-theme="light"] #obras .obxCardInfo p,html[data-theme="light"] #obras .obxCardFin small{color:#334155!important;-webkit-text-fill-color:#334155!important}
html[data-theme="dark"] #orcamentosMain .orcForm input,html[data-theme="dark"] #orcamentosMain .orcForm select,html[data-theme="dark"] #orcamentosMain .orcForm textarea,body.dark #orcamentosMain .orcForm input,body.dark #orcamentosMain .orcForm select,body.dark #orcamentosMain .orcForm textarea{background:#111e2c!important;background-color:#111e2c!important;color:#f8fafc!important;-webkit-text-fill-color:#f8fafc!important;border-color:#334155!important}
html[data-theme="dark"] #orcamentosMain .orcItem,html[data-theme="dark"] #orcamentosMain .orcResumo div,body.dark #orcamentosMain .orcItem,body.dark #orcamentosMain .orcResumo div{background:#111827!important;background-color:#111827!important;color:#f8fafc!important;border-color:#334155!important}
html[data-theme="dark"] #orcamentosMain .orcSec,body.dark #orcamentosMain .orcSec{background:#161d25!important;background-color:#161d25!important;color:#f8fafc!important;-webkit-text-fill-color:#f8fafc!important;border-color:#334155!important}
html[data-theme="dark"] #orcamentosMain .orcCardHead small,html[data-theme="dark"] #orcamentosMain .orcResumo span,html[data-theme="dark"] #orcamentosMain .orcItemTotal span,body.dark #orcamentosMain .orcCardHead small,body.dark #orcamentosMain .orcResumo span,body.dark #orcamentosMain .orcItemTotal span{color:#cbd5e1!important}
html[data-theme="dark"] #orcamentosMain .orcCardBody{border-color:#334155!important}
.obrixSetaVoltar,#notasFechar.obrixSetaVoltar,#backupFechar.obrixSetaVoltar,#offlineCentralFechar.obrixSetaVoltar,#offFastClose.obrixSetaVoltar{width:46px!important;height:46px!important;min-width:46px!important;padding:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;border:1px solid var(--ob-border,#cbd5e1)!important;border-radius:12px!important;background:var(--ob-surface-2,#e5eaf0)!important;background-color:var(--ob-surface-2,#e5eaf0)!important;color:var(--ob-text,#0f172a)!important;-webkit-text-fill-color:var(--ob-text,#0f172a)!important;font-size:28px!important;font-weight:900!important;line-height:1!important}
.obrixHeroComVoltar{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:12px!important}
.obrixNovoFuncionarioModal{width:min(560px,100%)!important;max-height:92vh!important;overflow:auto!important;background:var(--ob-surface,#f8fafc)!important;color:var(--ob-text,#0f172a)!important}
.obrixNovoFuncionarioHead{display:flex;align-items:center;justify-content:space-between;gap:12px}.obrixNovoFuncionarioHead h2{margin:0}.obrixNovoFuncionarioX{border:0;background:transparent;color:inherit;font-size:32px;line-height:1;padding:4px 8px}.obrixNovoFuncionarioModal label{display:block;font-weight:800;margin-top:8px}.obrixNovoFuncionarioModal input,.obrixNovoFuncionarioModal select,.obrixNovoFuncionarioModal textarea{width:100%;padding:12px;border:1px solid var(--ob-border,#cbd5e1);border-radius:10px;margin:5px 0 9px;font:inherit;background:var(--ob-surface-2,#e5eaf0);color:var(--ob-text,#0f172a)}
`;
document.head.appendChild(css);

const app=document.getElementById('app');if(app)new MutationObserver(m=>{if(m.some(x=>x.addedNodes.length))queueMicrotask(prepararEstruturas)}).observe(app,{childList:true});
document.addEventListener('click',e=>{
  protegerRenderObrasFinanceiro();
  const novo=e.target.closest?.('#equipe [data-cmd="novo"]');
  if(novo){e.preventDefault();e.stopImmediatePropagation();abrirNovoFuncionario();return}
  requestAnimationFrame(prepararEstruturas);
},true);
window.addEventListener('pageshow',prepararEstruturas);
window.addEventListener('obrix:modules-ready',prepararEstruturas);
window.addEventListener('obrix:grupo-pronto',prepararEstruturas);
window.addEventListener('obrix:feature-pronto',prepararEstruturas);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{prepararEstruturas();setTimeout(prepararEstruturas,500)},{once:true});else{prepararEstruturas();setTimeout(prepararEstruturas,500)}
window.OBRIX_TESTE_AJUSTES_GERAIS_3110={refresh:prepararEstruturas,novoFuncionario:abrirNovoFuncionario};
})();