'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const root='obrix-preview-inicio-equipe-20261104.js';
const versions=['','obrix-android-inicial/'];
for(const folder of versions){
 const get=p=>read(folder+p);
 const edited=['obrix-onboarding.js','obrix-orcamentos-main.js','obrix-orcamentos-ui-v8.js',
   'obrix-orcamentos-rascunho-print.js','obrix-documentos-direto.js',
   'obrix-equipe-realtime-sync.js','obrix-equipe-historico-pagamentos.js',
   'obrix-visual-padrao-final.js','obrix-pos-login-loader.js','obrix-startup-router.js'];
 for(const p of edited)assert.doesNotThrow(()=>new vm.Script(get(p),{filename:folder+p}),folder+p+' sintaxe incorreta');
 const onboarding=get('obrix-onboarding.js');
 assert.ok(!onboarding.includes("dataset.obrixInstallHelp='1'"),'Instalar ainda no Menu '+folder);
 assert.ok(folder?onboarding.includes('Instalar o OBRIX no Android'):onboarding.includes('obxInstallGuide'),'Guia no primeiro acesso desapareceu '+folder);
 const v8=get('obrix-orcamentos-ui-v8.js');
 assert.ok(v8.includes('maxW=usableW-43'),'Rodapé precisa reservar 43mm '+folder);
 assert.ok(v8.includes('pdf.rect(pageW-margin-39,pageH-margin-12,39,12'),'Número de página precisa área própria '+folder);
 const usableW=210-16,footerWidth=usableW-43,paginaLeft=210-8-39;
 assert.ok(8+footerWidth+3<=paginaLeft,'Faixas de rodapé e paginação se sobrepõem '+folder);
 const print=get('obrix-orcamentos-rascunho-print.js');
 assert.ok(print.includes('max-width:calc(100% - 43mm)'),'Área de impressão sem reserva '+folder);
 const budget=get('obrix-orcamentos-main.js');
 assert.ok(budget.includes("el.hidden=true;el.style.setProperty('display','none','important')"),
   'Mensagem salvo continua visível '+folder);
 assert.ok(budget.includes('},2200);'),'Mensagem precisa sair em 2.2 segundos '+folder);
 const docs=get('obrix-documentos-direto.js');
 assert.ok(docs.includes('iPhone|iPad|iPod|Android'),'Documentos devem usar visualizador nativo '+folder);
 assert.ok(docs.includes("popup.location.replace(x.url)"),'Navegação do arquivo não implementada '+folder);
 const team=get('obrix-equipe-realtime-sync.js');
 assert.ok(team.includes('paintQueued'),'Equipe precisa consolidar eventos '+folder);
 assert.ok(!team.includes("await window.OBRIX_EQUIPE?.refresh?.();if(visivel())pintar()"),
   'Equipe está re-renderizando duas vezes '+folder);
 const payments=get('obrix-equipe-historico-pagamentos.js');
 for(const option of ['value="30"','value="90"','value="all"'])
   assert.ok(payments.includes(option),'Filtro de histórico de pagamentos sem '+option+' '+folder);
 assert.ok(payments.includes("const visiveis=periodo==='all'?base.pagamentos:"),
  'Histórico completo não pode ser excluído '+folder);
 const head=get('obrix-visual-padrao-final.js');
 assert.ok(head.includes('dataSetDoesNotExist')===false,'Marcador inválido');
 assert.ok(head.includes("dataset.obrixObrasOrigem==='rodape'"),'Obras do rodapé sem Menu '+folder);
 assert.ok(head.includes('const subTela='),'Subtela perde seta '+folder);
 const loader=get('obrix-pos-login-loader.js');
 assert.ok(loader.includes('obrix-equipe-historico-pagamentos.js?v=20261114-confirmacoes-nativas2'),
  'Histórico de pagamentos não carregado '+folder);
 const start=get('obrix-startup-router.js');
 assert.ok(start.includes('obrix-orcamentos-ui-v8.js?v=20261114-pdf-rodape-livre1'),
   'Gerador PDF ainda antigo '+folder);
 const sw=get('obrix-sw.js');
 assert.ok(sw.includes('obrix-offline-v83-sem-rodape-orc-estavel-20261114'),'Cache antigo '+folder);
}
const premium=read(root);
for(const op of ['data-obp-periodo','value="30"','value="90"','value="all"'])
 assert.ok(premium.includes(op),'Filtro de Ver registros precisa: '+op);
assert.ok(premium.includes("periodoRegistros==='all'?naAba"),'Ver registros: histórico completo ocultado');
// Garantir posição do Menu sem alterar a tela inicial nem duplicar setas.
for(const folder of versions){
  const html=read(folder+'obrix.html'),visual=read(folder+'obrix-visual-padrao-final.js');
  assert.ok(html.includes('obrix-visual-padrao-final.js?v=20261114-menu-direita-voltar2'),'Versão antiga do cabeçalho '+folder);
  for(const id of ['menuMain','obras','financeiroMain','equipe'])
    assert.ok(html.includes('#'+id+':not(.hidden)) > .top > #bMenu'),'Menu à direita ausente em '+id+' '+folder);
  assert.ok(visual.includes('obrixSubTelaAtiva'),'A seta precisa sobreviver a subtelas '+folder);
  assert.ok(visual.includes("body>.modalBack:not(.hidden)"),'Diálogo fora do app precisa entrar no estado de navegação '+folder);
  assert.ok(visual.includes('conectarDialogos()'),'Diálogos devem disparar recálculo do cabeçalho '+folder);
}
const r=read('obrix.html'),a=read('obrix-android-inicial/obrix.html');
for(const page of [r,a]){
 assert.ok(page.includes('20261114-registros-periodo1'));
 assert.ok(page.includes('20261114-menu-direita-voltar2'));
 assert.ok(page.includes('20261114-pdf-historico1'));
}
assert.equal(read('obrix-sw.js'),read('obrix-android-inicial/obrix-sw.js'),'Service workers diferentes');
console.log('PASS: 2 plataformas, PDF sem sobreposição, Menu, documentos, voltar, Equipe, histórico e cache');
