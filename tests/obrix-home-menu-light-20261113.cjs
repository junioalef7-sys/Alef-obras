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
assert.deepEqual(shortcuts,['diario','notas','documentos','foto'],'Só dois atalhos devem mudar');
assert.ok(template.includes('Diário de obras')&&template.includes('Documentos'));
assert.ok(!template.includes('data-short="nova"')&&!template.includes('data-short="relatorios"'));
assert.ok(home.includes("['notas','relatorios','diario','documentos'].includes(tipo)"),'Documentos não foi associado ao botão');
assert.ok(home.includes("documentos:'OBRIX_DOCUMENTOS'"),'Rota Documentos não foi configurada');
for(const path of ['obrix-preview-card-contours-icons-v2.js','obrix-visual-aprovado-teste-20261112.js'])
 assert.ok(read(path).includes("documentos:'files'"),'Ícone Documentos não acompanha a alteração: '+path);
const from=home.indexOf('async function acaoRapida(tipo){'),to=home.indexOf('function cliqueInicio(e){',from);
assert.ok(from>=0&&to>from,'Roteador de atalhos não encontrado');
const calls=[];
const sandbox={window:{OBRIX_MENU:{go:async k=>calls.push(k)}},console,alert:()=>{},setTimeout:()=>{}};
vm.createContext(sandbox);
vm.runInContext(home.slice(from,to)+';globalThis.__acao=acaoRapida;',sandbox);
(async()=>{
 await sandbox.__acao('diario');await sandbox.__acao('documentos');
 assert.deepEqual(calls,['diario','documentos'],'Atalhos não enviaram destino correto');
 for(const prefix of roots){
  const html=read(prefix+'obrix.html');
  assert.match(html,/obrix-preview-inicio-equipe-20261104\.js\?v=20261113-home-shortcuts1/);
  assert.match(html,/obrix-preview-card-contours-icons-v2\.js\?v=20261113-home-doc-icon1/);
  const st=html.match(/<style id="obrixNavHeaderTeste20261113">([\s\S]*?)<\/style>/);
  assert.ok(st,'CSS do cabeçalho inexistente: '+prefix);
  assert.ok(st[1].includes('html[data-theme="light"] body #app:has(> #menuMain:not(.hidden))'),'Ocultação não está limitada ao Menu/tema claro');
  assert.ok(!st[1].includes('html[data-theme="dark"] body #app:has(> #menuMain:not(.hidden))'),'Tema escuro foi modificado indevidamente');
  const content='<!doctype html><html data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
   '<style>'+st[1]+'</style><style>.hidden{display:none}</style></head><body>'+
   '<section id="app"><div class="top"><button id="bMenu">☰</button><div class="brand">OBRIX</div>'+
   '<div class="obrixTopActions"><button id="obrixTheme">🌙</button><button id="obrixNotifBell">🔔</button></div></div>'+
   '<main id="inicio" class="hidden"></main><main id="menuMain">Menu</main></section></body></html>';
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
    for(const item of Object.values(dark))assert.notEqual(item.display,'none',prefix+name+' tema escuro: botão removido');
    await page.evaluate(()=>{
      document.documentElement.dataset.theme='light';
      document.getElementById('menuMain').classList.add('hidden');
      document.getElementById('inicio').classList.remove('hidden');
    });
    const inicio=await get();
    for(const item of Object.values(inicio))assert.notEqual(item.display,'none',prefix+name+' tela Início: botão removido');
    console.log(JSON.stringify({variant:prefix||'root',device:name,menuLightHidden:true,menuDarkPreserved:true,homeLightPreserved:true,shortcuts:shortcuts.join(','),pass:true}));
   }finally{await browser.close()}
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1});
