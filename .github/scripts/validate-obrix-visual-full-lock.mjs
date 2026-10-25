import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASELINE='fdbf21975c216f057c8d9afeafdd33ce019f227c';
const LOCK='obrix-offline-v3-lock.json';
const errors=[];
const fail=m=>errors.push(m);
const read=p=>fs.readFileSync(p,'utf8');
const blobAt=(commit,path)=>execFileSync('git',['rev-parse',`${commit}:${path}`],{encoding:'utf8'}).trim();
const blobNow=path=>execFileSync('git',['hash-object',path],{encoding:'utf8'}).trim();

const VISUAL_PATHS=[
  'obrix-button-colors-v1.js','obrix-offline-online-visual-v1.js','obrix-online-visual-approved-v1.css','obrix-light-polish.js','obrix-light-ui-final-v2.js','obrix-light-ui-final-v3.js','obrix-pagamentos-ui-alinhamento.js','obrix-global-ui-report-fix.js','obrix-avatar-dark-fix.js','obrix-brand-main.js','obrix-theme-main.js','obrix-ajustes-ui-final.js','obrix-equipe-botoes-neutros-v1.js','obrix-equipe-controles-guard.js','obrix-account-delete.js','obrix-equipe-checklist-loader.js','obrix-light-ui-requested-v4.js','obrix-suporte-admin-notif.js'
];

if(!fs.existsSync(LOCK))fail('Arquivo mestre de blindagem ausente.');
let lock={};try{lock=JSON.parse(read(LOCK))}catch(_){fail('Arquivo mestre de blindagem inválido.');}
const full=lock.visual_full_homologation||{};
if(full.status!=='approved_by_user')fail('Visual completo perdeu a homologação explícita do usuário.');
if(full.baseline_commit!==BASELINE)fail('Baseline visual completo foi alterado.');
if(full.requires_explicit_reapproval_for_change!==true)fail('Visual completo deixou de exigir comando direto e nova aprovação para mudança.');
if(full.light_locked!==true||full.dark_locked!==true)fail('Trava integral dos modos claro/escuro foi removida.');
if(full.ordinary_updates_must_preserve_visual!==true)fail('Atualizações comuns deixaram de ser obrigadas a preservar o visual.');
if(lock?.triple_lock?.status!=='approved_by_user'||lock?.triple_lock?.offline_locked!==true||lock?.triple_lock?.light_locked!==true||lock?.triple_lock?.dark_locked!==true)fail('Blindagem tripla claro/escuro/offline perdeu a homologação.');
if(lock?.triple_lock?.requires_direct_user_command_for_change!==true)fail('Blindagem tripla deixou de exigir comando direto do usuário.');

for(const path of VISUAL_PATHS){if(!fs.existsSync(path)){fail(`Arquivo visual protegido ausente: ${path}`);continue}let expected='';try{expected=blobAt(BASELINE,path)}catch(_){fail(`Arquivo visual não existe no baseline aprovado: ${path}`);continue}const actual=blobNow(path);if(actual!==expected)fail(`ALTERAÇÃO VISUAL BLOQUEADA: ${path}\n  aprovado: ${expected}\n  atual:    ${actual}`);}

const v3=fs.existsSync('obrix-light-ui-final-v3.js')?read('obrix-light-ui-final-v3.js'):'';
const bridge=fs.existsSync('obrix-offline-online-visual-v1.js')?read('obrix-offline-online-visual-v1.js'):'';
const colors=fs.existsSync('obrix-button-colors-v1.js')?read('obrix-button-colors-v1.js'):'';
const v4=fs.existsSync('obrix-light-ui-requested-v4.js')?read('obrix-light-ui-requested-v4.js'):'';
if(!v3.includes('function cleanupDark()'))fail('Proteção contra vazamento do modo claro para o escuro foi removida.');
if(!v3.includes("attributeFilter:['data-theme']"))fail('Troca segura entre claro/escuro foi alterada.');
if(!bridge.includes("DARK_LOCK_STYLE_ID='obrixDarkModalButtonsLockedV1'"))fail('Trava visual do modo escuro foi removida.');
if(!colors.includes('Modo escuro homologado'))fail('Regra homologada do modo escuro foi removida.');
if(!colors.includes('Modo claro homologado'))fail('Regra homologada do modo claro foi removida.');
if(!v4.includes("const GRAY='#F5F7FA'"))fail('Camada clara final aprovada foi alterada.');
if(!v4.includes('function bottomBlock()'))fail('Proteção visual da barra inferior aprovada foi removida.');
if(!v4.includes('function cleanup()'))fail('Limpeza segura da camada clara foi removida.');

if(errors.length){console.error('\nBLINDAGEM TRIPLA OBRIX: PUBLICAÇÃO BLOQUEADA.\n');errors.forEach(e=>console.error(`- ${e}`));console.error('\nModo claro, modo escuro e modo offline homologados só podem mudar após comando direto do usuário e nova homologação explícita.\n');process.exit(1);}
console.log(`Blindagem visual completa aprovada: ${VISUAL_PATHS.length} arquivos conferidos contra ${BASELINE}.`);
console.log('MODO CLARO + MODO ESCURO + MODO OFFLINE: HOMOLOGADOS E BLINDADOS CONTRA REGRESSÕES.');
