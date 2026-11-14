/* OBRIX — avisos de ações sem diálogos nativos do navegador.
 * Compatível com os módulos atuais; não interfere em window.confirm,
 * nem em confirmações assíncronas de exclusão e pagamento.
 */
(()=>{'use strict';
 if(window.__OBRIX_ALERTAS_GLOBAIS_V1)return;
 window.__OBRIX_ALERTAS_GLOBAIS_V1=true;
 let temporizador=0,ultimo='',ultimaHora=0,atual=null;
 const classificar=texto=>{
  if(/(?:erro|falha|não foi possível|nao foi possivel|indisponível|invalido|inválido|selecione|informe|obrigatório|atenção|aguarde|tente novamente|não encontrado)/i.test(texto))return 'erro';
  if(/(?:registrad[oa]|salv[oa]|atualizad[oa]|excluíd[oa]|excluid[oa]|removid[oa]|concluíd[oa]|concluid[oa]|estornad[oa]|cadastrad[oa]|enviad[oa]|gerad[oa]|sincronizad[oa]|sucesso|pagamento realizado)/i.test(texto))return 'sucesso';
  return 'info';
 };
 function estilo(){
  if(document.getElementById('obrixAvisoGlobalStyle'))return;
  const s=document.createElement('style');s.id='obrixAvisoGlobalStyle';
  s.textContent='.obrixAvisoGlobal{position:fixed!important;z-index:2147483602!important;left:12px!important;right:12px!important;bottom:calc(95px + env(safe-area-inset-bottom,0px))!important;width:min(440px,calc(100% - 24px))!important;box-sizing:border-box!important;margin:auto!important;padding:12px 45px 12px 15px!important;min-height:48px!important;border-radius:12px!important;border:1px solid #64748b!important;background:#142435!important;color:#fff!important;-webkit-text-fill-color:#fff!important;box-shadow:0 5px 20px #0004!important;font:700 14px/1.45 system-ui,sans-serif!important;overflow-wrap:anywhere!important}.obrixAvisoGlobal[data-tipo="erro"]{border-color:#ef4444!important}.obrixAvisoGlobalClose{position:absolute!important;right:6px!important;top:4px!important;width:34px!important;height:34px!important;border:0!important;border-radius:8px!important;background:transparent!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-size:24px!important;cursor:pointer!important}';
  document.head.appendChild(s);
 }
 function aviso(mensagem,tipo){
  const texto=String(mensagem??'').trim().slice(0,260);
  if(!texto||!document.body)return;
  const categoria=tipo||classificar(texto);
  const agora=Date.now(),chave=categoria+'|'+texto;
  if(chave===ultimo&&agora-ultimaHora<800)return;
  ultimo=chave;ultimaHora=agora;
  if(categoria==='sucesso'&&typeof window.OBRIX_SUCESSO==='function'){
   clearTimeout(temporizador);atual?.remove();atual=null;
   window.OBRIX_SUCESSO(texto);return;
  }
  estilo();clearTimeout(temporizador);
  atual?.remove();
  const div=document.createElement('div');div.id='obrixAvisoGlobal';div.className='obrixAvisoGlobal';div.dataset.tipo=categoria;div.setAttribute('role',categoria==='erro'?'alert':'status');
  const span=document.createElement('span');span.textContent=(categoria==='erro'?'Atenção: ':'')+texto;
  const fechar=document.createElement('button');fechar.type='button';fechar.className='obrixAvisoGlobalClose';fechar.setAttribute('aria-label','Fechar aviso');fechar.textContent='×';
  div.append(span,fechar);
  fechar.onclick=()=>{clearTimeout(temporizador);if(atual===div)atual=null;div.remove()};
  document.body.appendChild(div);atual=div;
  temporizador=setTimeout(()=>{if(atual===div){atual=null;div.remove()}},categoria==='erro'?5200:3300);
 }
 window.OBRIX_MENSAGEM=aviso;
 // Bare alert() e window.alert() nos módulos passam a usar o mesmo aviso não bloqueante.
 window.alert=function(mensagem){aviso(mensagem)};
})();