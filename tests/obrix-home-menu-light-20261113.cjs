'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {chromium,webkit,devices}=require('playwright');
const roots=['','obrix-android-inicial/'];
const browsers=[
 ['iPhone (WebKit)',webkit,devices['iPhone 13']],
 ['Android (Chromium)',chromium,devices['Pixel 7']],
 ['Desktop (Chromium)',chromium,{viewport:{width:1280,height:800}}]
];
const read=p=>fs.readFileSync(p,'utf8');
const home=read('obrix-preview-inicio-equipe-20261104.js');
const start=home.indexOf('function renderInicio(){');
const end=home.indexOf("  $('obpOla').textContent",start);
assert.ok(start>=0&&end>start,'HTML real dos atalhos não encontrado');
const template=home.slice(start,end);
const shortcuts=[...template.matchAll(/data-short="([^"]+)"/g)].map(x=>x[1]);
assert.deepEqual(shortcuts,['diario','notas','relatorios','foto'],'Os quatro atalhos devem seguir o layout aprovado');
assert.ok(template.includes('Diário de obras')&&template.includes('Relatórios'));
assert.ok(template.includes('data-short="notas"')&&template.includes('data-short="foto"'));
assert.ok(template.includes('data-short="relatorios"')&&!template.includes('data-short="documentos"'));

assert.ok(!template.includes('data-short="nova"')&&!template.includes('data-short="documentos"'));
assert.ok(home.includes("['notas','relatorios','diario','documentos'].includes(tipo)"),'Documentos não foi associado ao botão');
assert.ok(home.includes("relatorios:'OBRIX_RELATORIOS'"),'Rota Relatórios não foi configurada');
for(const path of ['obrix-preview-card-contours-icons-v2.js','obrix-visual-aprovado-teste-20261112.js'])
 assert.ok(read(path).includes("relatorios:'chart'"),'Ícone Relatórios não acompanha a alteração: '+path);
const from=home.indexOf('async function acaoRapida(tipo){'),to=home.indexOf('function cliqueInicio(e){',from);
assert.ok(from>=0&&to>from,'Roteador de atalhos não encontrado');
const calls=[];
const sandbox={window:{OBRIX_MENU:{go:async k=>calls.push(k)}},console,alert:()=>{},setTimeout:()=>{}};
vm.createContext(sandbox);
vm.runInContext(home.slice(from,to)+';globalThis.__acao=acaoRapida;',sandbox);
(async()=>{
 await sandbox.__acao('diario');await sandbox.__acao('relatorios');
 assert.deepEqual(calls,['diario','relatorios'],'Atalhos não enviaram destino correto');
 for(const prefix of roots){
  const html=read(prefix+'obrix.html');
  assert.match(html,/obrix-preview-inicio-equipe-20261104\.js\?v=20261114-equipe-observer-stable1/);
  assert.match(html,/obrix-preview-card-contours-icons-v2\.js\?v=20261113-home-doc-icon1/);
  const st=html.match(/<style id="obrixNavHeaderTeste20261113">([\s\S]*?)<\/style>/);
  assert.ok(st,'CSS do cabeçalho inexistente: '+prefix);
  assert.ok(st[1].includes('html[data-theme] body #app:has(> #menuMain:not(.hidden))'),'Ocultação não está limitada ao Menu nos dois temas');
  assert.ok(st[1].includes('grid-template-columns:repeat(4,minmax(0,1fr))!important'),'Quatro colunas uniformes ausentes');
  assert.ok(st[1].includes('#inicio #obpHome .obp-shortcuts>button[data-short]'),'Estilo dos quatro cartões ausente');
  assert.ok(st[1].includes('overflow-wrap:anywhere!important'),'Quebra de texto responsiva ausente');
  const content='<!doctype html><html data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
   '<style>'+st[1]+'</style><style>.hidden{display:none}#app #inicio{width:min(100%,760px);max-width:100%;box-sizing:border-box;padding:0 4px}#app #inicio .obp-shortcuts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}#app #inicio .obp-shortcuts button{min-width:0;min-height:82px;padding:12px 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:12px}</style></head><body>'+
   '<section id="app"><div class="top"><button id="bMenu">☰</button><div class="brand">OBRIX</div>'+
   '<div class="obrixTopActions"><button id="obrixTheme">🌙</button><button id="obrixNotifBell">🔔</button></div></div>'+
   '<main id="inicio" class="hidden"><div id="obpHome"><div class="obp-shortcuts"><button data-short="diario"><span>▣</span>Diário de obras</button><button data-short="notas"><span>✎</span>Notas</button><button data-short="relatorios"><span>▤</span>Relatórios</button><button data-short="foto"><span>▧</span>Foto</button></div></div></main><main id="menuMain">Menu</main></section></body></html>';
  for(const [name,engine,device] of browsers){
   const browser=await engine.launch();
   try{
    const page=await browser.newPage(device);
    await page.setContent(content);
    const get=()=>page.evaluate(()=>Object.fromEntries(['obrixTheme','obrixNotifBell'].map(id=>{
      const el=document.getElementById(id),cs=getComputedStyle(el);
      return [id,{display:cs.display,visibility:cs.visibility}];
    })));
    const hidden=await get();
    for(const item of Object.values(hidden))assert.equal(item.display,'none',prefix+name+' tema claro Menu: ícone não ocultado');
    await page.evaluate(()=>document.documentElement.dataset.theme='dark');
    const dark=await get();
    for(const item of Object.values(dark))assert.equal(item.display,'none',prefix+name+' Menu escuro: botão não ocultado');
    await page.evaluate(()=>{document.getElementById('menuMain').classList.add('hidden');document.getElementById('inicio').classList.remove('hidden')});
    const inicioDark=await get();
    for(const item of Object.values(inicioDark))assert.notEqual(item.display,'none',prefix+name+' Início escuro: botão ocultado indevidamente');
    await page.evaluate(()=>{
      document.documentElement.dataset.theme='light';
      document.getElementById('menuMain').classList.add('hidden');
      document.getElementById('inicio').classList.remove('hidden');
    });
    const inicio=await get();
    for(const item of Object.values(inicio))assert.notEqual(item.display,'none',prefix+name+' tela Início: botão removido');
    for(const width of [320,375,390,device.viewport?.width||1280]){
      await page.setViewportSize({width,height:800});
      const measurements=await page.locator('#inicio .obp-shortcuts>button[data-short]').evaluateAll(nodes=>{
        const cards=nodes.map(el=>{
          const r=el.getBoundingClientRect(),icon=el.querySelector(':scope>span'),ir=icon?.getBoundingClientRect();
          return {name:el.dataset.short,width:r.width,height:r.height,iconWidth:ir?.width,iconHeight:ir?.height,
            font:parseFloat(getComputedStyle(el).fontSize),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,
            left:r.left,right:r.right};
        });
        const grid=document.querySelector('#inicio .obp-shortcuts').getBoundingClientRect();
        return {cards,grid:{left:grid.left,right:grid.right},viewport:document.documentElement.clientWidth};
      });
      assert.deepEqual(measurements.cards.map(c=>c.name),['diario','notas','relatorios','foto'],prefix+name+' atalhos diferentes');
      const first=measurements.cards[0];
      for(const card of measurements.cards){
        assert.ok(Math.abs(card.width-first.width)<1,prefix+name+' cartões com larguras desiguais em '+width+': '+JSON.stringify(measurements.cards));
        assert.ok(Math.abs(card.height-first.height)<1,prefix+name+' cartões com alturas desiguais em '+width);
        assert.ok(Math.abs(card.font-first.font)<.1,prefix+name+' fontes desiguais em '+width);
        assert.ok(Math.abs(card.iconWidth-first.iconWidth)<1,prefix+name+' ícones desiguais em '+width);
        assert.ok(card.scrollWidth<=card.clientWidth+1,prefix+name+' texto saiu na horizontal em '+width+': '+JSON.stringify(card));
        assert.ok(card.scrollHeight<=card.clientHeight+1,prefix+name+' texto saiu na vertical em '+width+': '+JSON.stringify(card));
        const proporcao=card.height/card.width;
        assert.ok(proporcao>=.90&&proporcao<=1.58,prefix+name+' cartão fora da proporção da foto em '+width+': '+proporcao);
        assert.ok(card.left>=measurements.grid.left-1&&card.right<=measurements.grid.right+1,prefix+name+' cartão ultrapassou o grid');
      }
      assert.ok(measurements.grid.right<=measurements.viewport+1,prefix+name+' grid ultrapassou a tela em '+width);
    }
    console.log(JSON.stringify({variant:prefix||'root',device:name,menuLightHidden:true,menuDarkHidden:true,homeDarkPreserved:true,homeLightPreserved:true,fourCardsUniform:true,shortcuts:shortcuts.join(','),pass:true}));
   }finally{await browser.close()}
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1});
