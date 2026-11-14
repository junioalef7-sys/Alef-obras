'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const labels=['Início','Obras','Financeiro','Equipe'];
for(const prefix of ['','obrix-android-inicial/']){
 const h=read(prefix+'obrix.html'),core=read(prefix+'obrix-core-main.js'),menu=read(prefix+'obrix-menu-main.js');
 const nav=read(prefix+'obrix-nav-active.js'),off=read(prefix+'obrix-offline-v3.js');
 const offnav=read(prefix+'obrix-offline-v3-nav.js'),loader=read(prefix+'obrix-pos-login-loader.js');
 const footer=h.match(/<div class="bottom">([\s\S]*?)<\/div>/);
 assert.ok(footer,prefix+' rodapé principal');
 assert.deepEqual([...footer[1].matchAll(/<button[^>]*>([^<]*)<\/button>/g)].map(m=>m[1]),labels,prefix+' quatro abas');
 assert.equal((h.match(/id="bMenu"/g)||[]).length,1,prefix+' Menu uma vez');
 const cabecalho=h.slice(h.indexOf('<div class="top">'),h.indexOf('</div><main id="inicio">'));
 assert.ok(cabecalho.indexOf('id="bMenu"')>=0&&cabecalho.indexOf('id="bMenu"')<cabecalho.indexOf('<div class="brand">'),prefix+' ícone Menu à esquerda da logo');
 assert.ok(cabecalho.includes('<div class="obrixTopActions"></div>'),prefix+' outras ações preservadas');
 assert.ok(read(prefix+'obrix-ui-stability.js').includes("setBottom(k==='equipe'?3:1)"),prefix+' seleção de aba corrigida');
 assert.ok(h.includes('id="bObras"')&&h.includes('id="bFinanceiro"')&&h.includes('id="bEquipe"'));
 assert.ok(menu.includes("const menuBtn=document.getElementById('bMenu')"),prefix+' Menu não pode substituir Equipe');
 assert.ok(!menu.includes("bottom.querySelectorAll('button')[3]"));
 assert.ok(nav.includes('ativar(2)')&&nav.includes('ativar(-1)'));
 assert.ok(core.includes("$('bObras')?.classList.toggle('active',id==='obras')"));
 assert.ok(off.includes("['inicio','obras','financeiro','equipe']"));
 assert.ok(offnav.includes("const ROUTES=['inicio','obras','financeiro','equipe']"));
 assert.ok(loader.includes('obrix-menu-main.js?v=20261113-nav-header1'));
 assert.ok(read(prefix+'obrix-sw.js').includes('obrix-offline-v70-atalhos-proporcionais-20261113'));
}
assert.ok(read('obrix-preview-card-contours-icons-v2.js').includes("['Obras','hardhat']"));
console.log('OBRIX - menu superior e quatro abas com offline: OK');
