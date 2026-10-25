import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASELINE='fdbf21975c216f057c8d9afeafdd33ce019f227c';
const LOCK='obrix-offline-v3-lock.json';
const errors=[];
const fail=m=>errors.push(m);
const read=p=>fs.readFileSync(p,'utf8');
const blobAt=(commit,path)=>execFileSync('git',['rev-parse',`${commit}:${path}`],{encoding:'utf8'}).trim();
const blobNow=path=>execFileSync('git',['hash-object',path],{encoding:'utf8'}).trim();

// Arquivos visuais homologados que continuam congelados. A autorização direta do
// usuário em 25/10/2026 vale SOMENTE para a camada clara e seu carregador.
const LOCKED_VISUAL_PATHS=[
  'obrix-button-colors-v1.js','obrix-offline-online-visual-v1.js','obrix-online-visual-approved-v1.css','obrix-light-polish.js','obrix-light-ui-final-v2.js','obrix-light-ui-final-v3.js','obrix-pagamentos-ui-alinhamento.js','obrix-global-ui-report-fix.js','obrix-avatar-dark-fix.js','obrix-brand-main.js','obrix-theme-main.js','obrix-ajustes-ui-final.js','obrix-equipe-botoes-neutros-v1.js','obrix-equipe-controles-guard.js','obrix-account-delete.js','obrix-equipe-checklist-loader.js'
];
const AUTHORIZED_LIGHT_PATHS=['obrix-light-ui-requested-v4.js','obrix-suporte-admin-notif.js'];

if(!fs.existsSync(LOCK))fail('Arquivo mestre de blindagem ausente.');
let lock={};try{lock=JSON.parse(read(LOCK))}catch(_){fail('Arquivo mestre de blindagem inválido.');}
const full=lock.visual_full_homologation||{};
if(full.status!=='approved_by_user')fail('Visual homologado anterior perdeu seu registro.');
if(full.baseline_commit!==BASELINE)fail('Baseline visual anterior foi alterado.');
if(lock?.triple_lock?.offline_locked!==true||lock?.triple_lock?.dark_locked!==true)fail('Blindagem do modo escuro ou offline foi removida.');
if(lock?.triple_lock?.requires_direct_user_command_for_change!==true)fail('Exigência de comando direto do usuário foi removida.');

for(const path of LOCKED_VISUAL_PATHS){
  if(!fs.existsSync(path)){fail(`Arquivo visual protegido ausente: ${path}`);continue}
  let expected='';try{expected=blobAt(BASELINE,path)}catch(_){fail(`Arquivo visual não existe no baseline aprovado: ${path}`);continue}
  const actual=blobNow(path);if(actual!==expected)fail(`ALTERAÇÃO NÃO AUTORIZADA EM ÁREA BLINDADA: ${path}\n  aprovado: ${expected}\n  atual:    ${actual}`);
}
for(const path of AUTHORIZED_LIGHT_PATHS){if(!fs.existsSync(path))fail(`Arquivo autorizado do modo claro ausente: ${path}`);}

const v3=fs.existsSync('obrix-light-ui-final-v3.js')?read('obrix-light-ui-final-v3.js'):'';
const bridge=fs.existsSync('obrix-offline-online-visual-v1.js')?read('obrix-offline-online-visual-v1.js'):'';
const colors=fs.existsSync('obrix-button-colors-v1.js')?read('obrix-button-colors-v1.js'):'';
const v4=fs.existsSync('obrix-light-ui-requested-v4.js')?read('obrix-light-ui-requested-v4.js'):'';
const loader=fs.existsSync('obrix-suporte-admin-notif.js')?read('obrix-suporte-admin-notif.js'):'';
if(!v3.includes('function cleanupDark()'))fail('Proteção contra vazamento do modo claro para o escuro foi removida.');
if(!v3.includes("attributeFilter:['data-theme']"))fail('Troca segura entre claro/escuro foi alterada.');
if(!bridge.includes("DARK_LOCK_STYLE_ID='obrixDarkModalButtonsLockedV1'"))fail('Trava visual do modo escuro foi removida.');
if(!colors.includes('Modo escuro homologado'))fail('Regra homologada do modo escuro foi removida.');
if(!v4.includes('function cleanup()'))fail('Limpeza segura da camada clara foi removida.');
if(!loader.includes('obrix-light-reference-loader-v1.js'))fail('Carregador da nova camada clara autorizada não está conectado.');

if(errors.length){console.error('\nOBRIX: PUBLICAÇÃO BLOQUEADA PARA PROTEGER ESCURO/OFFLINE.\n');errors.forEach(e=>console.error(`- ${e}`));process.exit(1);}
console.log(`Modo escuro preservado: ${LOCKED_VISUAL_PATHS.length} arquivos visuais conferidos contra ${BASELINE}.`);
console.log('Modo offline continua validado pela blindagem offline v3 independente.');
console.log('Modo claro: alteração direta autorizada pelo usuário para teste; nova homologação será exigida após aprovação visual.');
