(()=>{
'use strict';
if(window.__OBRIX_ASSINATURAS_COBRANCAS_EFI)return;window.__OBRIX_ASSINATURAS_COBRANCAS_EFI=true;
const pt=e=>window.OBRIX_PT_ERROR?.(e)||e?.message||String(e||'Não foi possível concluir a operação.');
const S={id:'obrix_efi_cobranca_link_id',url:'obrix_efi_cobranca_link_url',metodo:'obrix_efi_cobranca_link_metodo',plano:'obrix_efi_cobranca_link_plano',owner:'obrix_efi_cobranca_link_owner'};
let atual={id:'',url:'',metodo:'boleto',plano:'mensal'},refreshSeq=0;
const $=id=>document.getElementById(id);
async function ownerId(force=false){
  try{const user=await window.OBRIX_BACKEND?.currentUser?.(force);return String(user?.id||'')}catch(_){return ''}
}
function labelMetodo(m){return m==='cartao'?'Cartão de crédito':'Boleto'}
function limpar(){Object.values(S).forEach(k=>localStorage.removeItem(k));atual={id:'',url:'',metodo:'boleto',plano:'mensal'}}
function modal(){
  let m=$('assCobEfiModal');if(m)return m;
  m=document.createElement('div');m.id='assCobEfiModal';m.className='assModal hidden';
  m.innerHTML=`<div class="assModalCard assCobEfiCard">
    <button type="button" id="assCobEfiFechar" class="assClose" aria-label="Fechar">×</button>
    <h3 id="assCobEfiTitulo">Pagamento Efí</h3>
    <p id="assCobEfiTexto" class="muted"></p>
    <button type="button" id="assCobEfiGerar" class="btn assCobEfiGerar">Gerar pagamento</button>
    <a id="assCobEfiAbrir" class="btn assCobEfiAbrir hidden" target="_blank" rel="noopener noreferrer">Abrir página segura da Efí</a>
    <div id="assCobEfiStatus" class="status hidden"></div>
    <button type="button" id="assCobEfiVerificar" class="btn assVerify hidden">Verificar pagamento</button>
  </div>`;
  document.body.appendChild(m);
  $('assCobEfiFechar').onclick=()=>m.classList.add('hidden');
  $('assCobEfiGerar').onclick=gerar;
  $('assCobEfiVerificar').onclick=verificar;
  return m;
}
function status(txt,ok=true){const b=$('assCobEfiStatus');if(!b)return;b.textContent=txt;b.className='status '+(ok?'assOk':'assErr')}
async function abrir(plano,metodo){
  modal();
  const desejado={id:'',url:'',plano:plano||'mensal',metodo:metodo||'boleto'};
  atual=desejado;
  $('assCobEfiTitulo').textContent=`${atual.plano==='anual'?'Plano Anual':'Plano Mensal'} — ${labelMetodo(atual.metodo)}`;
  $('assCobEfiTexto').textContent=atual.metodo==='boleto'
    ?'O boleto será emitido na página segura da Efí. O OBRIX só libera o acesso depois que a Efí confirmar o pagamento.'
    :'Os dados do cartão serão preenchidos diretamente na página segura da Efí e não ficam armazenados no OBRIX.';
  $('assCobEfiStatus').classList.add('hidden');
  $('assCobEfiModal').classList.remove('hidden');
  const owner=await ownerId(true);
  if(!owner){
    const a=$('assCobEfiAbrir');a.removeAttribute('href');a.classList.add('hidden');
    $('assCobEfiVerificar').classList.add('hidden');
    $('assCobEfiGerar').textContent='Gerar pagamento';
    status('Sua sessão não pôde ser confirmada. Feche esta tela e tente novamente.',false);return;
  }
  const temSalvo=!!(localStorage.getItem(S.id)||localStorage.getItem(S.url));
  if(temSalvo&&localStorage.getItem(S.owner)!==owner)limpar();
  atual=desejado;
  const savedPlan=localStorage.getItem(S.plano)||'',savedMetodo=localStorage.getItem(S.metodo)||'',savedOwner=localStorage.getItem(S.owner)||'';
  if(savedOwner===owner&&savedPlan===atual.plano&&savedMetodo===atual.metodo){atual.id=localStorage.getItem(S.id)||'';atual.url=localStorage.getItem(S.url)||''}
  $('assCobEfiGerar').textContent=atual.url?'Gerar novo pagamento':'Gerar pagamento';
  const a=$('assCobEfiAbrir');if(atual.url){a.href=atual.url;a.textContent=atual.metodo==='boleto'?'Abrir boleto na Efí':'Abrir pagamento no cartão';a.classList.remove('hidden')}else{a.removeAttribute('href');a.classList.add('hidden')}
  $('assCobEfiVerificar').classList.toggle('hidden',!atual.id);
}
async function gerar(){
  const btn=$('assCobEfiGerar');
  try{
    btn.disabled=true;btn.textContent='Gerando...';status('Criando página segura de pagamento na Efí...');
    const sb=await OBRIX_BACKEND.init(),owner=await ownerId(true);
    if(!owner)throw new Error('Sessão não encontrada. Feche esta tela e tente novamente.');
    const reqKey=`obrix_efi_cobranca_req_${owner}_${atual.plano}_${atual.metodo}`;
    let requestId=localStorage.getItem(reqKey)||'';if(!requestId){requestId=crypto.randomUUID();localStorage.setItem(reqKey,requestId)}
    const {data,error}=await sb.functions.invoke('efi-criar-cobranca-link',{body:{plano:atual.plano,metodo:atual.metodo,requestId}});
    if(error)throw error;if(data?.error)throw new Error(data.error);if(!data?.pagamentoId||!data?.checkoutUrl)throw new Error('A Efí não retornou a página de pagamento.');
    atual.id=String(data.pagamentoId);atual.url=String(data.checkoutUrl);
    localStorage.setItem(S.id,atual.id);localStorage.setItem(S.url,atual.url);localStorage.setItem(S.metodo,atual.metodo);localStorage.setItem(S.plano,atual.plano);localStorage.setItem(S.owner,owner);
    const a=$('assCobEfiAbrir');a.href=atual.url;a.textContent=atual.metodo==='boleto'?'Abrir boleto na Efí':'Abrir pagamento no cartão';a.classList.remove('hidden');
    $('assCobEfiVerificar').classList.remove('hidden');
    status(atual.metodo==='boleto'?'Boleto preparado. Abra a página da Efí para emitir e pagar.':'Pagamento preparado. Abra a página segura da Efí para informar o cartão.');
  }catch(e){status(pt(e),false)}finally{btn.disabled=false;btn.textContent=atual.url?'Gerar novo pagamento':'Gerar pagamento'}
}
async function verificar(opts={}){
  const btn=$('assCobEfiVerificar'),silencioso=!!opts.silencioso;
  try{
    if(btn){btn.disabled=true;btn.textContent='Verificando...'}
    const owner=await ownerId(true);if(!owner){if(!silencioso)throw new Error('Sessão não encontrada. Feche esta tela e tente novamente.');return false}
    if(localStorage.getItem(S.owner)&&localStorage.getItem(S.owner)!==owner){limpar();if(!silencioso)throw new Error('Pagamento pertence a outro acesso. Gere uma nova cobrança nesta conta.');return false}
    const sb=await OBRIX_BACKEND.init();
    const id=atual.id||localStorage.getItem(S.id)||'';if(!id){if(!silencioso)throw new Error('Nenhum pagamento foi gerado ainda.');return false}
    const {data,error}=await sb.functions.invoke('efi-reconciliar-cobranca',{body:{pagamentoId:id}});
    if(error)throw error;if(data?.error)throw new Error(data.error);
    if(data?.status==='aprovado'&&data?.aplicado){
      if(!silencioso)status('Pagamento confirmado. Assinatura OBRIX ativada com sucesso.');
      limpar();await window.OBRIX_ASSINATURA?.load?.();
      if(!silencioso)setTimeout(()=>$('assCobEfiModal')?.classList.add('hidden'),500);
      return true;
    }
    if(!silencioso){
      if(data?.status==='expirado')status('Esta cobrança venceu. Gere uma nova.',false);
      else if(data?.status==='cancelado'||data?.status==='rejeitado')status('Pagamento não aprovado. Gere uma nova cobrança.',false);
      else status('Pagamento ainda não confirmado pela Efí. O acesso permanece inalterado.');
    }
    return false;
  }catch(e){if(!silencioso)status(pt(e),false);return false}finally{if(btn){btn.disabled=false;btn.textContent='Verificar pagamento'}}
}
function assinaturaAberta(){const m=$('assinaturaMain');return !!(m&&!m.classList.contains('hidden'))}
async function atualizarAoRetornar(){
  if(!assinaturaAberta())return;
  const owner=await ownerId();if(!owner)return;
  const savedOwner=localStorage.getItem(S.owner)||'';
  if(savedOwner&&savedOwner!==owner)limpar();
  const seq=++refreshSeq;
  window.OBRIX_ASSINATURA?.load?.();
  if(localStorage.getItem(S.id)&&localStorage.getItem(S.owner)===owner)verificar({silencioso:true});
  setTimeout(()=>{if(seq===refreshSeq&&assinaturaAberta())window.OBRIX_ASSINATURA?.load?.()},1200);
  setTimeout(()=>{if(seq===refreshSeq&&assinaturaAberta())window.OBRIX_ASSINATURA?.load?.()},3500);
}
function botao(txt,plano,metodo){const b=document.createElement('button');b.type='button';b.className='btn assCobEfiBtn obrixPermanentNeutral obrixPayMethod';b.dataset.obrixPermanentNeutral='1';b.textContent=txt;b.dataset.assCobEfi=`${plano}:${metodo}`;b.onclick=()=>abrir(plano,metodo);return b}
function scan(){
  const box=$('assPlanos');if(!box)return;
  box.querySelectorAll('.assPlano').forEach(card=>{
    const pix=card.querySelector('[data-ass-plano]');if(!pix)return;const plano=pix.dataset.assPlano||'mensal';
    pix.classList.add('obrixPermanentNeutral','obrixPayMethod');pix.dataset.obrixPermanentNeutral='1';
    let row=card.querySelector('.assCobEfiRow');if(!row){row=document.createElement('div');row.className='assCobEfiRow';pix.insertAdjacentElement('afterend',row)}
    if(!row.querySelector(`[data-ass-cob-efi="${plano}:boleto"]`))row.appendChild(botao('Pagar com Boleto',plano,'boleto'));
    if(!row.querySelector(`[data-ass-cob-efi="${plano}:cartao"]`))row.appendChild(botao('Pagar com Cartão',plano,'cartao'));
  });
}
const css=document.createElement('style');css.textContent=`.assCobEfiRow{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.assCobEfiBtn{width:100%}html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #assPlanos button.obrixPayMethod,html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #assPlanos button.obrixPayMethod{background:#E2E8F0!important;background-color:#E2E8F0!important;background-image:none!important;color:#111827!important;-webkit-text-fill-color:#111827!important;border-color:#CBD5E1!important;box-shadow:none!important}.assCobEfiGerar,.assCobEfiAbrir,.assCobEfiCard .assVerify{width:100%;margin-top:12px;text-align:center;text-decoration:none;display:block}.assCobEfiAbrir.hidden{display:none!important}@media(max-width:620px){.assCobEfiRow{grid-template-columns:1fr}}`;document.head.appendChild(css);
new MutationObserver(()=>scan()).observe(document.body,{childList:true,subtree:true});document.addEventListener('obrix:feature-pronto',()=>setTimeout(scan,50));
window.addEventListener('focus',atualizarAoRetornar);window.addEventListener('pageshow',atualizarAoRetornar);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')atualizarAoRetornar()});
setTimeout(scan,100);setTimeout(scan,1000);
window.OBRIX_EFI_COBRANCAS={abrir,gerar,verificar,scan,atualizar:atualizarAoRetornar};
})();