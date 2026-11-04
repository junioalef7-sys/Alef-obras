(()=>{'use strict';if(window.__OBRIX_EQUIPE_VISUAL_FINAL)return;window.__OBRIX_EQUIPE_VISUAL_FINAL=true;const css=document.createElement('style');css.id='obrix-equipe-visual-final-style';css.textContent=`
#equipe>.hero>p{display:none!important}
#equipe>.sectionHead{display:none!important}
#equipe{background:var(--ob-bg)!important;color:var(--ob-text)!important}
#equipe .hero,#equipe #listaEquipe>.card,#equipe .obrix-modelo-card{background:var(--ob-surface)!important;background-color:var(--ob-surface)!important;color:var(--ob-text)!important;border-color:var(--ob-border)!important;box-shadow:none!important}
#equipe .obrix-modelo-pagamento,#equipe .obrix-modelo-pilulas,#equipe .obrix-modelo-pilulas span,#equipe .obrix-modelo-metrica{background:var(--ob-surface-2)!important;background-color:var(--ob-surface-2)!important;color:var(--ob-text)!important;border-color:var(--ob-border)!important;box-shadow:none!important}
#equipe .obrix-equipe-controles{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;padding:14px!important;margin:0 0 18px!important;border:1px solid var(--ob-border)!important;border-radius:18px!important;background:var(--ob-surface)!important;box-shadow:none!important}
#equipe .obrix-equipe-controles .obrix-equipe-botoes,#equipe .obrix-equipe-controles .obrix-equipe-secundario{display:contents!important}
#equipe .obrix-equipe-controles :is(.obrix-cmd,.obrix-filtro-equipe,.obrix-pagar-equipe-topo,.obrix-historico-pagamentos-topo),#equipe #listaEquipe .obrix-modelo-acoes button,#equipe .obrix-registros-acoes button{background:var(--ob-surface-2)!important;color:var(--ob-text)!important;-webkit-text-fill-color:var(--ob-text)!important;border:1px solid var(--ob-border)!important;box-shadow:none!important;background-image:none!important}
#equipe [data-acao="apagar"],#equipe [data-acao="excluir"],#equipe button.danger,#equipe .danger{background:var(--ob-surface-2)!important;color:var(--ob-text)!important;-webkit-text-fill-color:var(--ob-text)!important;border:1px solid var(--ob-border)!important;box-shadow:none!important}
.modalBack .obrix-modelo-modal input[type="date"],.modalBack .modal input[type="date"]{display:block!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:100%!important;height:48px!important;min-height:48px!important;padding:0 12px!important;margin:5px 0 12px!important;border-radius:10px!important;font:inherit!important;line-height:48px!important;text-align:center!important;text-align-last:center!important;-webkit-appearance:none!important;appearance:none!important}
`;document.head.appendChild(css);
const alertaOriginal=window.alert.bind(window);
function confirmarDiariaAndroid(){
  if(!document.body)return alertaOriginal('Diária registrada');
  if(document.getElementById('obrixDiariaConfirmAndroid'))return;
  if(!document.getElementById('obrixDiariaConfirmAndroidCss')){
    const css=document.createElement('style');
    css.id='obrixDiariaConfirmAndroidCss';
    css.textContent=
      '#obrixDiariaConfirmAndroid{position:fixed;inset:0;z-index:2147483550;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.52);box-sizing:border-box}' +
      '#obrixDiariaConfirmAndroid .obrixDiariaConfirmCard{width:min(330px,100%);background:#fff;color:#101820;border-radius:20px;padding:26px 24px 20px;box-shadow:0 18px 55px rgba(0,0,0,.22);text-align:center}' +
      '#obrixDiariaConfirmAndroid .obrixDiariaConfirmText{margin:0 0 23px;font:700 19px/1.4 system-ui,-apple-system,sans-serif;color:inherit}' +
      '#obrixDiariaConfirmAndroid .obrixDiariaConfirmOk{min-width:110px;min-height:44px;padding:10px 20px;border:0;border-radius:12px;background:#ff5a00;color:#fff;font:800 16px system-ui,-apple-system,sans-serif}' +
      'html[data-theme="dark"] #obrixDiariaConfirmAndroid .obrixDiariaConfirmCard{background:#101820;color:#f8fafc}';
    document.head.appendChild(css);
  }
  const dialog=document.createElement('div');
  dialog.id='obrixDiariaConfirmAndroid';
  dialog.innerHTML='<div class="obrixDiariaConfirmCard" role="alertdialog" aria-modal="true" aria-labelledby="obrixDiariaConfirmText"><p class="obrixDiariaConfirmText" id="obrixDiariaConfirmText">Diária registrada</p><button class="obrixDiariaConfirmOk" type="button">OK</button></div>';
  const ok=dialog.querySelector('.obrixDiariaConfirmOk');
  function close(){dialog.remove();document.removeEventListener('keydown',keydown,true)}
  function keydown(e){if(e.key==='Escape'){e.preventDefault();close()}}
  ok.addEventListener('click',close);
  document.body.appendChild(dialog);
  document.addEventListener('keydown',keydown,true);
  try{ok.focus({preventScroll:true})}catch(_){ok.focus()}
}
window.alert=function(msg){
  const texto=String(msg??'').trim();
  if(/^Diária registrada/i.test(texto)){
    if(/Android/i.test(navigator.userAgent||''))return confirmarDiariaAndroid();
    return alertaOriginal('Diária registrada');
  }
  return alertaOriginal(msg)
};
const PALETA={
 diaria:{light:['#eaf3ff','#1e4f82','#a9c9ef'],dark:['#13263a','#d7eaff','#315b82']},
 vale:{light:['#e8f7f4','#155e55','#9bd5ca'],dark:['#12312d','#d4f3ed','#2b6e64']},
 bonus:{light:['#fff6dc','#715315','#e5c66f'],dark:['#33280f','#f9e7a8','#79641f']},
 falta:{light:['#fff0f1','#7a3038','#e8adb3'],dark:['#341b20','#ffdce0','#7d4149']},
 registros:{light:['#f2efff','#51418a','#b9ace7'],dark:['#241e3b','#e2dcff','#66579a']},
 pagar:{light:['#eaf7ed','#2d6138','#9fd0a8'],dark:['#17301d','#daf3df','#3e7549']},
 historico:{light:['#eef1f8','#3f4d6b','#b8c0d2'],dark:['#1d2432','#e3e8f3','#4d5b72']},
 toggle:{light:['#fff1e6','#78451d','#e7b487'],dark:['#342417','#ffe4cd','#815a38']},
 todos:{light:['#edf4f6','#365b65','#b2cbd1'],dark:['#18282d','#d9edf1','#405e66']},
 novo:{light:['#e9f8f0','#255f49','#9fd6bc'],dark:['#153027','#d8f4e7','#39745c']},
 funcionarios:{light:['#edf0ff','#414f89','#b2bbe9'],dark:['#1b223b','#e0e5ff','#505d96']},
 excluir:{light:['#fff1f1','#7a3535','#e7b0b0'],dark:['#321c1c','#ffdada','#7a4646']}
};
function pintar(el,chave,dark){if(!el||!PALETA[chave])return;const [bg,fg,bd]=PALETA[chave][dark?'dark':'light'];el.style.setProperty('background',bg,'important');el.style.setProperty('background-color',bg,'important');el.style.setProperty('background-image','none','important');el.style.setProperty('color',fg,'important');el.style.setProperty('-webkit-text-fill-color',fg,'important');el.style.setProperty('border-color',bd,'important');el.style.setProperty('box-shadow','none','important')}
function pintarAcoes(e,dark){
 const regras=[
  ['[data-acao="diaria"]','diaria'],
  ['[data-acao="vale"],[data-equipe-extra-card="vale"]','vale'],
  ['[data-acao="bonus"],[data-equipe-extra-card="bonus"]','bonus'],
  ['[data-acao="falta"]','falta'],
  ['[data-acao="registros"]','registros'],
  ['.obrix-pagar-equipe-topo','pagar'],
  ['.obrix-historico-pagamentos-topo','historico'],
  ['[data-cmd="toggle"]','toggle'],
  ['.obrix-filtro-equipe','todos'],
  ['[data-cmd="novo"]','novo'],
  ['[data-cmd="lista"]','funcionarios'],
  ['[data-cmd="excluir"]','excluir']
 ];
 regras.forEach(([sel,chave])=>e.querySelectorAll(sel).forEach(el=>pintar(el,chave,dark)));
}
function aplicar(){const e=document.getElementById('equipe');if(!e)return;const dark=document.documentElement.dataset.theme==='dark';const bg=dark?'#07111b':'#eef2f6',surface=dark?'#0d1722':'#f8fafc',surface2=dark?'#111e2c':'#e5eaf0',text=dark?'#f8fafc':'#0f172a',border=dark?'#293b4d':'#cbd5df';e.style.setProperty('background',bg,'important');e.style.setProperty('color',text,'important');e.querySelectorAll(':scope>.sectionHead').forEach(el=>el.style.setProperty('display','none','important'));e.querySelectorAll(':scope>.hero,#listaEquipe>.card,.obrix-modelo-card').forEach(el=>{el.style.setProperty('background',surface,'important');el.style.setProperty('background-color',surface,'important');el.style.setProperty('color',text,'important');el.style.setProperty('border-color',border,'important');el.style.setProperty('box-shadow','none','important')});e.querySelectorAll('.obrix-modelo-pagamento,.obrix-modelo-pilulas,.obrix-modelo-pilulas span,.obrix-modelo-metrica').forEach(el=>{el.style.setProperty('background',surface2,'important');el.style.setProperty('background-color',surface2,'important');el.style.setProperty('color',text,'important');el.style.setProperty('border-color',border,'important');el.style.setProperty('box-shadow','none','important')});e.querySelectorAll('.obrix-equipe-controles').forEach(el=>{el.style.setProperty('background',surface,'important');el.style.setProperty('border-color',border,'important')});e.querySelectorAll('.obrix-equipe-controles button,.obrix-equipe-controles select,.obrix-modelo-acoes button,.obrix-registros-acoes button').forEach(el=>{el.style.setProperty('background',surface2,'important');el.style.setProperty('background-color',surface2,'important');el.style.setProperty('color',text,'important');el.style.setProperty('-webkit-text-fill-color',text,'important');el.style.setProperty('border-color',border,'important');el.style.setProperty('box-shadow','none','important')});pintarAcoes(e,dark)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',aplicar,{once:true});else aplicar();new MutationObserver(()=>requestAnimationFrame(aplicar)).observe(document.getElementById('equipe')||document.body,{childList:true,subtree:true});new MutationObserver(aplicar).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});window.addEventListener('obrix:modules-ready',()=>setTimeout(aplicar,0));window.addEventListener('pageshow',aplicar);window.OBRIX_EQUIPE_VISUAL_FINAL={refresh:aplicar};})();