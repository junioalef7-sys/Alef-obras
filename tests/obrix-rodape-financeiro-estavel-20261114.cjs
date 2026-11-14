'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit,devices}=require('playwright');
const read=p=>fs.readFileSync(p,'utf8');
const profiles=[['computador',chromium,{viewport:{width:1280,height:740}}],
 ['Android',chromium,devices['Pixel 7']],['iPhone',webkit,devices['iPhone 13']]];
(async()=>{
for(const pref of ['','obrix-android-inicial/']){
 const installer=read('obrix-install-card-home.js');
 const finance=read(pref+'obrix-financeiro-main.js');
 const protectedStock=read(pref+'obrix-financeiro-protecao-estoque.js');
 assert.ok(installer.includes("#obpHome .obp-shortcuts"),'Instalador não depende dos atalhos da Início');
 assert.ok(finance.includes('atualizarListaEstavel(lista,html)'),'Recriação da lista inteira ainda ativa');
 assert.ok(!protectedStock.includes('querySelectorAll(\'.finEstoqueProtegido\').forEach(n=>n.remove())'),'Avisos recriados');
 for(const [device,engine,profile] of profiles){
  const browser=await engine.launch();
  try{
   const page=await browser.newPage(profile);
   await page.setContent('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font:16px system-ui;background:#edf0f5}.hidden{display:none!important}#app{max-width:800px;margin:auto}#inicio{padding:16px}#inicio .card{display:block;padding:18px;background:#fff;border:1px solid #ccd;border-radius:12px}.bottom{position:fixed;bottom:0;left:0;right:0;height:84px;background:#fff;z-index:99999}</style><section id="app"><main id="inicio"><div id="obpHome"><div class="obp-shortcuts"><button>Diário</button><button>Notas</button><button>Relatórios</button><button>Foto</button></div><div style="height:640px">Início</div><div class="obp-heading">Obras em andamento</div></div></main><main id="obras" class="hidden"></main><main id="equipe" class="hidden"></main><div class="bottom"><button>Início</button></div></section>');
   await page.addScriptTag({content:installer});
   await page.locator('#obrixInstalarApp').waitFor({timeout:6500});
   await page.locator('#obrixInstalarApp').scrollIntoViewIfNeeded();
   const v=await page.evaluate(()=>{
    const card=document.querySelector('#obrixInstalarApp').getBoundingClientRect();
    const footer=document.querySelector('.bottom').getBoundingClientRect();
    return{cardBottom:card.bottom,footerTop:footer.top,scrollY,doc:document.documentElement.scrollHeight};
   });
   assert.ok(v.cardBottom<=v.footerTop-20,'Cartão oculto sob rodapé '+pref+device+JSON.stringify(v));
   await page.locator('.obrix-instalar-fechar').click();
   assert.equal(await page.locator('#obrixInstalarApp').count(),0,'Fechamento do cartão '+pref+device);
   const obra={id:'obra1',nome:'Obra teste',status:'andamento',valor_contrato:1000};
   const base={id:'receita-a',obra_id:'obra1',tipo:'receita',descricao:'Receita A',valor:100,data:'2026-11-14',categoria:'entrada',origem:'manual',status_lancamento:'ativo',criado_em:'2026-11-14T10:00:00',atualizado_em:'2026-11-14T10:00:00'};
   await page.evaluate(({obra,base})=>{
    window.obras=[obra];window.financeiro=[base];
    window.OBRIX_FIN_VISUAL={refresh(){}};
    window.OBRIX_FIN_BUSCA={refreshOptions(){},aplicar(){}};
   },{obra,base});
   await page.addScriptTag({content:finance});
   await page.evaluate(()=>window.OBRIX_FIN.render(false));
   const first=await page.locator('[data-fin-card][data-id="receita-a"]').evaluate(el=>{window.__cardA=el;return el.dataset.id});
   assert.equal(first,'receita-a');
   const b={...base,id:'receita-b',descricao:'Receita B',valor:85,criado_em:'2026-11-14T11:00:00',atualizado_em:'2026-11-14T11:00:00'};
   await page.evaluate(async b=>{window.financeiro.unshift(b);await window.OBRIX_FIN.render(false);},b);
   assert.equal(await page.locator('[data-fin-card]').count(),2);
   assert.ok(await page.evaluate(()=>window.__cardA===document.querySelector('[data-id="receita-a"]')),'Receita anterior recriada '+device);
   await page.evaluate(()=>window.OBRIX_FIN.render(false));
   assert.ok(await page.evaluate(()=>window.__cardA===document.querySelector('[data-id="receita-a"]')),'Cartão piscou em sync '+device);
   await page.evaluate(async()=>{
    const a=window.financeiro.find(f=>f.id==='receita-a');a.descricao='Receita A editada';
    await window.OBRIX_FIN.render(false);
   });
   assert.equal(await page.locator('[data-fin-card][data-id="receita-a"] h3').textContent(),'Receita A editada','Edição da receita não atualizou');
   assert.equal(await page.locator('[data-fin-card]').count(),2,'Outros cartões sumiram após edição');
   // Um aviso de Estoque deve ser criado uma vez e permanecer estável.
   await page.evaluate(async()=>{
    window.financeiro.push({id:'s1',obra_id:'obra1',tipo:'despesa',descricao:'Saída de estoque - cimento',valor:30,data:'2026-11-14',status_lancamento:'ativo',origem:'estoque'});
    await window.OBRIX_FIN.render(false);
   });
   await page.addScriptTag({content:protectedStock});
   await page.locator('.finEstoqueProtegido').waitFor({state:'attached',timeout:1200});
   await page.evaluate(()=>{window.__stockNotice=document.querySelector('.finEstoqueProtegido');window.dispatchEvent(new Event('focus'))});
   await page.waitForTimeout(250);
   assert.ok(await page.evaluate(()=>document.querySelectorAll('.finEstoqueProtegido').length===1&&window.__stockNotice===document.querySelector('.finEstoqueProtegido')),'Aviso do estoque piscando '+device);
   console.log(JSON.stringify({variant:pref||'root',device,cardAboveFooter:true,cardStable:true,noticeStable:true}));
  }finally{await browser.close()}
 }
}
})().catch(e=>{console.error(e);process.exitCode=1});