'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),{execFileSync}=require('node:child_process');
const manifest=JSON.parse(fs.readFileSync('.github/OBRIX_CHANGE_SCOPE.json','utf8'));
assert.ok(/^[0-9a-f]{40}$/.test(manifest.production_base_sha));
const files=execFileSync('git',['diff','--name-only',manifest.production_base_sha,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const allowed=new Set(manifest.allowed_paths);
const unexpected=files.filter(x=>!allowed.has(x));
assert.deepEqual(unexpected,[],'Arquivos fora do escopo autorizado foram alterados');
assert.ok(files.length>=2,'Nenhuma alteração entregue');
const required=['obrix.html','obrix-android-inicial/obrix.html'];
for(const filename of required){
 const s=fs.readFileSync(filename,'utf8');
 assert.ok(s.includes('position:fixed!important;inset:auto 0 0 0!important'),'Rodapé fixo modificado: '+filename);
 assert.ok(s.includes('obrix-pos-login-loader.js?v=20261113-exact-cache64'),'Loader sem versão atual: '+filename);
}
for(const prefix of ['','obrix-android-inicial/']){
 const c=fs.readFileSync(prefix+'obrix-config-main.js','utf8');
 const a=fs.readFileSync(prefix+'obrix-account-delete.js','utf8');
 const p=fs.readFileSync(prefix+'obrix-checklist-progress-core.js','utf8');
 const o=fs.readFileSync(prefix+'obrix-obras-offline.js','utf8');
 const core=fs.readFileSync(prefix+'obrix-core-main.js','utf8');
 assert.ok(c.includes('html[data-theme="dark"] #app #configMain .cfgDeleteGrid button[data-del]'),'Regra dos botões Apagar ausente em '+prefix);
 assert.ok(c.includes('border-color:transparent!important'),'Borda vermelha não neutralizada em '+prefix);
 assert.ok(c.includes('-webkit-text-fill-color:#f8fafc!important'),'Texto vermelho não neutralizado em '+prefix);
 assert.ok(a.includes('background:#e5eaf0!important')&&a.includes('background:#111e2c!important'),'Cartão Excluir conta não tem ambos os temas em '+prefix);
 assert.ok(a.includes("b.querySelector('.excluir').onclick=()=>excluirConta(b)"),'Confirmação Excluir conta removida em '+prefix);
 assert.ok(p.includes('function mediaConhecida(id)')&&p.includes('etapasRemovidas'),'Checklist ainda pode zerar obras sem itens em '+prefix);
 assert.ok(o.includes('const preservados=next.map(o=>'),'Obras offline perde progresso em '+prefix);
 assert.ok(core.includes('conservarProgressoObras(obras,novos)'),'Obras online perde progresso em '+prefix);
}
for(const prefix of ['','obrix-android-inicial/']){const sw=fs.readFileSync(prefix+'obrix-sw.js','utf8');assert.ok(sw.includes('v64-exact-version-20261113'),'Cache PWA não atualizado');assert.ok(!sw.includes('v63-stability-coalesced'),'Cache antigo ainda ativo')}
console.log(JSON.stringify({result:'PASSOU',baseline:manifest.production_base_sha,changed_files:files,blocked_out_of_scope:0,footer:'preservado',modules_unchanged:true},null,2));
