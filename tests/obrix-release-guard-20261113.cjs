'use strict';
// Guardião de release sem alterações na interface: bloqueia diff fora do escopo.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
const path=require('node:path');
const config=JSON.parse(fs.readFileSync('.github/OBRIX_RELEASE_GUARD_20261113.json','utf8'));
const base=config.baseline_sha;
assert.match(base,/^[0-9a-f]{40}$/);
assert.equal(config.production_release_authorized,false,'Produção só com aprovação explícita');
const command=(args)=>cp.execFileSync('git',args,{encoding:'utf8'}).trim();
assert.equal(command(['rev-parse',base]),base,'Baseline inacessível no checkout');
const changed=command(['diff','--name-only',base,'HEAD']).split('\n').filter(Boolean);
assert.ok(changed.length>0,'Nenhuma alteração registrada para validar');
const authorized=new Set(config.authorized_files);
const outside=changed.filter(x=>!authorized.has(x));
assert.deepEqual(outside,[],'REPROVADO: arquivos alterados fora da solicitação');
const appChanges=changed.filter(x=>/^((obrix-android-inicial\/)?obrix[^/]*\.(?:js|css|html))$/.test(x));
const read=f=>fs.readFileSync(f,'utf8');
const old=f=>{try{return cp.execFileSync('git',['show',base+':'+f],{encoding:'utf8'})}catch{return ''}};
const patterns={
  loader: /obrix-pos-login-loader\.js\?v=([\w.-]+)/g,
  router: /obrix-startup-router\.js\?v=([\w.-]+)/g
};
for(const prefix of ['','obrix-android-inicial/']){
 const html=read(prefix+'obrix.html');
 const loader=read(prefix+'obrix-pos-login-loader.js');
 const router=read(prefix+'obrix-startup-router.js');
 const sw=read(prefix+'obrix-sw.js');
 assert.equal((html.match(patterns.loader)||[]).length,1,prefix+' possui carregador duplicado');
 assert.ok((html.match(patterns.router)||[]).length>=1,prefix+' roteador ausente');
 assert.ok(!router.includes('obrix-pos-login-loader.js?v=20261026darkclean5'),prefix+' carregador antigo voltou');
 assert.ok(!router.includes("await load('./obrix-pos-login-loader.js"),prefix+' carregador duplicado');
 assert.ok(html.includes('position:fixed!important;inset:auto 0 0 0!important'),prefix+' rodapé aprovado ausente');
 assert.match(sw,/const CACHE='obrix-offline-v[\w-]+';/,prefix+' cache sem versão');
 assert.match(sw,/const BUILD='[\w-]+';/,prefix+' build sem identificador');
 assert.ok(loader.includes('20261113-contraste-temas1'),prefix+' loader defasado');
 for(const f of ['obrix-pos-login-loader.js','obrix-startup-router.js','obrix-sw.js']){
  cp.execFileSync(process.execPath,['--check',prefix+f],{stdio:'pipe'});
 }
}
const cacheTag=prefix=>read(prefix+'obrix-sw.js').match(/const CACHE='([^']+)'/)[1];
assert.equal(cacheTag(''),cacheTag('obrix-android-inicial/'),'Service Workers usam versões de cache diferentes');
const buildTag=prefix=>read(prefix+'obrix-sw.js').match(/const BUILD='([^']+)'/)[1];
assert.equal(buildTag(''),buildTag('obrix-android-inicial/'),'Builds PWA divergentes');
const sourceRefs=prefix=>read(prefix+'obrix.html')+'\n'+read(prefix+'obrix-pos-login-loader.js')+'\n'+read(prefix+'obrix-startup-router.js');
for(const f of appChanges){
 if(f.endsWith('.html'))continue;
 const prefix=f.startsWith('obrix-android-inicial/')?'obrix-android-inicial/':'';
 const sibling=prefix?f.slice(prefix.length):'obrix-android-inicial/'+f;
 if(fs.existsSync(sibling))assert.ok(changed.includes(sibling),
   'Módulo alterado só em uma plataforma: '+f+' (faltou '+sibling+')');
 if(f.endsWith('.js'))cp.execFileSync(process.execPath,['--check',f],{stdio:'pipe'});
 const basename=path.basename(f);
 if(basename==='obrix-sw.js')continue;
 const before=old(prefix+'obrix.html')+'\n'+old(prefix+'obrix-pos-login-loader.js')+'\n'+old(prefix+'obrix-startup-router.js');
 const after=sourceRefs(prefix);
 const re=new RegExp(basename.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\?v=([\\w.-]+)','g');
 const matchVer=s=>[...s.matchAll(re)].map(x=>x[1]);
 const prev=matchVer(before),next=matchVer(after);
 if(prev.length){
  assert.ok(next.length,'Removida referência executada ao módulo '+f);
  assert.notDeepEqual(next,prev,'REPROVADO: mudou '+f+' sem atualizar a versão ?v= utilizada pelo aplicativo');
 }
}
console.log(JSON.stringify({result:'PASSOU',baseline:base,changed,scope:'restrito',preservedApp:appChanges.length===0,build:buildTag(''),production:'intocada'}));
