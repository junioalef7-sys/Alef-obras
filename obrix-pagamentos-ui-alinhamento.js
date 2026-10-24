(()=>{
'use strict';
if(window.__OBRIX_PAGAMENTOS_UI_ALINHAMENTO)return;
window.__OBRIX_PAGAMENTOS_UI_ALINHAMENTO=true;

const ICONS={
  pix:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.05 3.73 2.8 7.98a5.67 5.67 0 0 0 0 8.03l4.25 4.25a4.03 4.03 0 0 0 5.7 0l2.12-2.12-1.42-1.42-2.12 2.12a2.02 2.02 0 0 1-2.86 0l-4.25-4.25a3.67 3.67 0 0 1 0-5.19l4.25-4.25a2.02 2.02 0 0 1 2.86 0l2.12 2.12 1.42-1.42-2.12-2.12a4.03 4.03 0 0 0-5.7 0Zm9.9 0a4.03 4.03 0 0 0-5.7 0L9.13 5.85l1.42 1.42 2.12-2.12a2.02 2.02 0 0 1 2.86 0l4.25 4.25a3.67 3.67 0 0 1 0 5.19l-4.25 4.25a2.02 2.02 0 0 1-2.86 0l-2.12-2.12-1.42 1.42 2.12 2.12a4.03 4.03 0 0 0 5.7 0l4.25-4.25a5.67 5.67 0 0 0 0-8.03l-4.25-4.25ZM8 8.7 6.58 10.1l4.82 4.82a.85.85 0 0 0 1.2 0l4.82-4.82L16 8.7l-4 4-4-4Z" fill="currentColor"/></svg>',
  boleto:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2v16H3V4Zm4 0h1v16H7V4Zm3 0h2v16h-2V4Zm4 0h1v16h-1V4Zm3 0h3v16h-3V4Z" fill="currentColor"/></svg>',
  cartao:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2v2h18V7H3Zm0 5v5h18v-5H3Zm2 2h6v2H5v-2Z" fill="currentColor"/></svg>'
};

function decorateButton(btn,type,label){
  if(!btn||btn.dataset.obrixPayDecorated==='1')return;
  btn.dataset.obrixPayDecorated='1';
  btn.dataset.obrixPermanentNeutral='1';
  btn.classList.add('obrixPayMethod','obrixPermanentNeutral');
  btn.classList.remove('obrixApprovedGold');
  btn.removeAttribute('data-obrix-approved-color');
  btn.setAttribute('aria-label',label);
  btn.innerHTML=`<span class="obrixPayIcon">${ICONS[type]}</span><span class="obrixPayLabel">${label}</span>`;
}

function decorateCard(card){
  if(!card||card.dataset.obrixPayReady==='1')return;
  const pix=card.querySelector('[data-ass-plano]');
  const row=card.querySelector('.assCobEfiRow');
  if(!pix||!row)return;
  const boleto=row.querySelector('[data-ass-cob-efi$=":boleto"]');
  const cartao=row.querySelector('[data-ass-cob-efi$=":cartao"]');
  if(!boleto||!cartao)return;

  card.dataset.obrixPayReady='1';
  row.classList.add('obrixPayStack');
  decorateButton(pix,'pix','Pagar com Pix');
  decorateButton(boleto,'boleto','Pagar com Boleto');
  decorateButton(cartao,'cartao','Pagar com Cartão');
  row.append(pix,boleto,cartao);
}

function scan(){
  const box=document.getElementById('assPlanos');
  if(!box)return;
  box.querySelectorAll('.assPlano').forEach(decorateCard);
}

const css=document.createElement('style');
css.id='obrixPagamentosUiAlinhamentoCss';
css.textContent=`
#assPlanos .assCobEfiRow.obrixPayStack{
  display:flex!important;
  flex-direction:column!important;
  gap:10px!important;
  width:100%!important;
  margin-top:12px!important;
  background:transparent!important;
}
#app #assPlanos .assCobEfiRow.obrixPayStack>.obrixPayMethod{
  display:flex!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:12px!important;
  width:100%!important;
  min-width:0!important;
  margin:0!important;
  padding:13px 16px!important;
  border:1px solid #cbd5e1!important;
  border-radius:12px!important;
  background:transparent!important;
  background-color:transparent!important;
  background-image:none!important;
  color:#334155!important;
  -webkit-text-fill-color:#334155!important;
  box-shadow:none!important;
  text-shadow:none!important;
  text-align:left!important;
  font-weight:800!important;
}
#assPlanos .obrixPayIcon{
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  flex:0 0 24px!important;
  width:24px!important;
  height:24px!important;
}
#assPlanos .obrixPayIcon svg{width:22px!important;height:22px!important;display:block!important}
#assPlanos .obrixPayLabel{display:block!important;flex:1!important;text-align:left!important}
#app #assPlanos .assCobEfiRow.obrixPayStack>.obrixPayMethod:hover,
#app #assPlanos .assCobEfiRow.obrixPayStack>.obrixPayMethod:focus,
#app #assPlanos .assCobEfiRow.obrixPayStack>.obrixPayMethod:active{
  background:rgba(148,163,184,.08)!important;
  background-color:rgba(148,163,184,.08)!important;
  color:#0f172a!important;
  -webkit-text-fill-color:#0f172a!important;
  border-color:#94a3b8!important;
}
html[data-theme="dark"] #app #assPlanos .assCobEfiRow.obrixPayStack>.obrixPayMethod,
body.dark #app #assPlanos .assCobEfiRow.obrixPayStack>.obrixPayMethod{
  background:transparent!important;
  background-color:transparent!important;
  background-image:none!important;
  color:#f8fafc!important;
  -webkit-text-fill-color:#f8fafc!important;
  border-color:#475569!important;
  box-shadow:none!important;
}
html[data-theme="dark"] #app #assPlanos .assCobEfiRow.obrixPayStack>.obrixPayMethod:hover,
html[data-theme="dark"] #app #assPlanos .assCobEfiRow.obrixPayStack>.obrixPayMethod:focus,
html[data-theme="dark"] #app #assPlanos .assCobEfiRow.obrixPayStack>.obrixPayMethod:active,
body.dark #app #assPlanos .assCobEfiRow.obrixPayStack>.obrixPayMethod:hover,
body.dark #app #assPlanos .assCobEfiRow.obrixPayStack>.obrixPayMethod:focus,
body.dark #app #assPlanos .assCobEfiRow.obrixPayStack>.obrixPayMethod:active{
  background:rgba(148,163,184,.08)!important;
  background-color:rgba(148,163,184,.08)!important;
  color:#f8fafc!important;
  -webkit-text-fill-color:#f8fafc!important;
  border-color:#64748b!important;
}
`;
document.head.appendChild(css);

let scheduled=false;
function scheduleScan(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;scan()});
}

new MutationObserver(scheduleScan).observe(document.body,{childList:true,subtree:true});
document.addEventListener('obrix:feature-pronto',scheduleScan);
setTimeout(scan,100);
setTimeout(scan,500);
setTimeout(scan,1200);
})();
