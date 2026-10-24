import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = path => fs.readFileSync(path, 'utf8');
const errors = [];
const fail = message => errors.push(message);
const expect = (condition, message) => { if (!condition) fail(message); };

const lockPath = 'obrix-release-lock.json';
if (!fs.existsSync(lockPath)) {
  console.error('ERRO: obrix-release-lock.json não existe.');
  process.exit(1);
}

const lock = JSON.parse(read(lockPath));
const protectedFiles = lock.protected_files || {};

for (const [file, expectedHash] of Object.entries(protectedFiles)) {
  if (!fs.existsSync(file)) {
    fail(`Arquivo protegido ausente: ${file}`);
    continue;
  }
  const actualHash = execFileSync('git', ['hash-object', file], { encoding: 'utf8' }).trim();
  if (actualHash !== expectedHash) {
    fail(`Arquivo protegido alterado: ${file}\n  esperado: ${expectedHash}\n  atual:    ${actualHash}`);
  }
}

const offline = lock.offline_v2 || {};
const router = read('obrix-startup-router.js');
const offlineStart = router.indexOf('async function offline(){');
const offlineEnd = router.indexOf('function route()', offlineStart);
expect(offlineStart >= 0 && offlineEnd > offlineStart, 'Não foi possível localizar a rota offline aprovada no startup router.');
const offlineBody = offlineStart >= 0 && offlineEnd > offlineStart ? router.slice(offlineStart, offlineEnd) : '';

for (const moduleName of offline.required_active_modules || []) {
  expect(offlineBody.includes(moduleName), `A rota offline deixou de carregar o módulo obrigatório: ${moduleName}`);
}

const loader = read('obrix-offline-v2-loader.js');
for (const moduleName of offline.forbidden_active_modules || []) {
  expect(!offlineBody.includes(moduleName), `Módulo offline antigo voltou para a rota ativa: ${moduleName}`);
  expect(!loader.includes(moduleName), `Módulo offline antigo voltou para o loader v2: ${moduleName}`);
}

const sw = read('obrix-sw.js');
for (const moduleName of offline.required_cached_modules || offline.required_active_modules || []) {
  expect(sw.includes(moduleName), `Service Worker não está protegendo o módulo offline obrigatório: ${moduleName}`);
}

const bootstrap = read('obrix-offline-bootstrap.js');
const session = read('obrix-session-offline-fix.js');
for (const token of offline.forbidden_storage_wipes || []) {
  expect(!bootstrap.includes(token), `Bootstrap voltou a apagar dados offline: ${token}`);
  expect(!session.includes(token), `Sessão voltou a apagar dados offline: ${token}`);
}

const engine = read('obrix-offline-v2.js');
for (const marker of offline.engine_markers || []) {
  expect(engine.includes(marker), `Motor offline v2 perdeu marcador estrutural: ${marker}`);
}

const guard = read('obrix-offline-v2-legacy-guard.js');
for (const flag of offline.legacy_guard_flags || []) {
  expect(guard.includes(flag), `Blindagem contra motor antigo perdeu a flag: ${flag}`);
}

expect(sw.includes("const CACHE='obrix-offline-v59"), 'O cache offline aprovado deixou de usar a geração v59.');
expect(router.includes('window.OBRIX_OFFLINE_V2?.activate?.()'), 'O roteador offline deixou de ativar explicitamente o motor v2.');
expect(engine.includes('window.OBRIX_OFFLINE_V2={activate,deactivate,active,prepare,sync,status,client:localClient'), 'A API principal do motor offline v2 foi alterada.');

if (errors.length) {
  console.error('\nBLINDAGEM OBRIX: PUBLICAÇÃO BLOQUEADA.\n');
  for (const error of errors) console.error(`- ${error}`);
  console.error('\nA versão offline aprovada não pode ser alterada sem atualização consciente da blindagem e nova homologação.\n');
  process.exit(1);
}

console.log(`Blindagem OBRIX aprovada: ${Object.keys(protectedFiles).length} arquivos protegidos; motor offline v2 íntegro.`);
