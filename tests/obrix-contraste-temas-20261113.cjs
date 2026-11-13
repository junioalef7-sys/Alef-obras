'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
const baseline='a20f5a5d48929faf2e447fa6a1977d236fb743c3';
const core=['obrix-financeiro-main.js','obrix-diario-main.js','obrix-notas-main.js','obrix-orcamentos-main.js','obrix-suporte-main.js','obrix-pos-login-loader.js','obrix.html'];
const allowed=new Set([...core,...core.map(p=>'obrix-android-inicial/'+p),
  'tests/obrix-contraste-temas-20261113.cjs','tests/obrix-contraste-e2e-20261113.cjs',
  '.github/workflows/obrix-contraste-temas-20261113.yml']);
const changed=cp.execFileSync('git',['diff','--name-only',baseline,'HEAD'],{encoding:'utf8'}).split('\n').filter(Boolean);
assert.deepEqual(changed.filter(p=>!allowed.has(p)),[],'Mudanca fora do escopo autorizado');
assert.ok(changed.length>4);
for(const prefix of ['','obrix-android-inicial/']){
 const get=f=>fs.readFileSync(prefix+f,'utf8');
 const fm=get('obrix-financeiro-main.js');
 assert.ok(fm.includes('html[data-theme="dark"] #fmChecklistTotal.fmDistErro>div:last-child'));
 assert.ok(fm.includes('background:#381b28!important'));
 assert.ok(fm.includes('html[data-theme="light"] #fmChecklistTotal.fmDistErro>div:last-child span'));
 for(const [name,labels] of [
  ['obrix-diario-main.js',['diarioMsg.ok','diarioMsg.erro','diarioForm input']],
  ['obrix-notas-main.js',['notasMsg.ok','notasMsg.erro','notaMeta .alta','notaMeta .baixa']],
  ['obrix-orcamentos-main.js',['orcMsg.ok','orcMsg.erro','orcStatus.aprovado','orcForm input']],
  ['obrix-suporte-main.js',['supOk','supErr','supOffline','supChip.aberto','supTabs button.active']]
 ]){
  const c=get(name);for(const lbl of labels)assert.ok(c.includes(lbl),prefix+name+' missing '+lbl);
 }
 for(const file of core.filter(x=>x.endsWith('.js')))cp.execFileSync('node',['--check',prefix+file]);
 const loader=get('obrix-pos-login-loader.js'),html=get('obrix.html');
 for(const f of ['obrix-financeiro-main.js','obrix-diario-main.js','obrix-notas-main.js','obrix-orcamentos-main.js'])
  assert.ok(loader.includes(f+'?v=20261113-contraste-temas1'),prefix+f+' ainda usa cache antigo');
 assert.ok(html.includes('obrix-suporte-main.js?v=20261113-contraste-temas1'));
 assert.ok(html.includes('obrix-pos-login-loader.js?v=20261113-contraste-temas1'));
}
console.log(JSON.stringify({result:'PASSOU',changedFiles:changed.length,unexpectedFiles:0,
  base:baseline,variants:['root','android'],corrected:['Financeiro','Diario','Notas','Orcamentos','Ajuda']},null,2));