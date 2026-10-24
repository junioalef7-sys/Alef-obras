import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const lockPath='obrix-offline-v3-lock.json';
const errors=[];
const fail=m=>errors.push(m);
const expect=(c,m)=>{if(!c)fail(m)};
const read=p=>fs.readFileSync(p,'utf8');

if(!fs.existsSync(lockPath)){
  console.error('ERRO: obrix-offline-v3-lock.json ausente.');
  process.exit(1);
}
const lock=JSON.parse(read(lockPath));
const approved=lock.approved_runtime_commit;
const paths=Array.isArray(lock.protected_paths)?lock.protected_paths:[];
expect(typeof approved==='string'&&approved.length>=7,'Commit aprovado do runtime offline v3 não definido.');
expect(paths.length>=51,'Blindagem incompleta: menos de 51 arquivos protegidos.');

for(const path of paths){
  if(!fs.existsSync(path)){fail(`Arquivo protegido ausente: ${path}`);continue}
  let expected='';
  try{expected=execFileSync('git',['rev-parse',`${approved}:${path}`],{encoding:'utf8'}).trim()}catch(_){fail(`Arquivo protegido não existe no commit aprovado: ${path}`);continue}
  const actual=execFileSync('git',['hash-object',path],{encoding:'utf8'}).trim();
  if(actual!==expected)fail(`Arquivo offline protegido alterado: ${path}\n  aprovado: ${expected}\n  atual:    ${actual}`);
}

const html=read('obrix.html');
const router=read('obrix-startup-router.js');
const engine=read('obrix-offline-v3.js');
const nav=read('obrix-offline-v3-nav.js');
const guard=read('obrix-offline-v3-guard.js');
const bootstrap=read('obrix-offline-bootstrap.js');
const sw=read('obrix-sw.js');

expect(html.includes('obrix-offline-v3.js?v=20261024offline-v3-1'),'HTML deixou de carregar o motor offline v3.');
expect(html.indexOf('obrix-offline-v3.js') < html.indexOf('obrix-offline-bootstrap.js'),'Motor v3 precisa carregar antes das camadas offline antigas.');
expect(router.includes("async function offline(){await load('./obrix-offline-v3.js"),'Rota offline deixou de entrar diretamente pelo v3.');
expect(router.includes("obrix-offline-v3-nav.js?v=20261024offline-v3-nav1"),'Rota offline deixou de carregar a barra inferior independente.');
expect(!router.match(/async function offline\(\)[\s\S]*obrix-offline-visual-parity-v2/),'Rota offline reintroduziu camada visual antiga.');
expect(engine.includes("const SNAP_PREFIX='obrix_offline_v3_snapshot:'"),'Motor v3 perdeu a base própria de snapshots.');
expect(engine.includes("const labels=['Início','Financeiro','Equipe','Menu']"),'Motor v3 perdeu os quatro botões inferiores de compatibilidade.');
expect(engine.includes("route(['inicio','financeiro','equipe','menu'][i]"),'Navegação inferior de compatibilidade foi alterada.');
expect(engine.includes('persistCompat'),'Motor v3 perdeu compatibilidade de restauração dos dados locais.');
expect(!engine.includes('MutationObserver'),'Motor v3 não pode usar MutationObserver.');
expect(nav.includes("const ROUTES=['inicio','financeiro','equipe','menu']"),'Barra offline própria perdeu as quatro rotas aprovadas.');
expect(nav.includes("const LABELS=['Início','Financeiro','Equipe','Menu']"),'Barra offline própria perdeu os quatro rótulos aprovados.');
expect(nav.includes("position:fixed!important"),'Barra offline própria deixou de ficar fixa e visível no rodapé.');
expect(nav.includes("setInterval(()=>{if(offline())ensure()},1500)"),'Barra offline própria perdeu a autorrecuperação caso seja removida.');
expect(guard.includes("capture?.('pre-online-logout')"),'Proteção de dados no logout foi removida.');
expect(bootstrap.includes("obrix-sw.js?v=20261024-offline-v3-nav1"),'Bootstrap deixou de forçar a geração nova do Service Worker.');
expect(sw.includes("const CACHE='obrix-offline-v61-v3-nav'"),'Geração aprovada do cache offline v3 foi alterada.');
expect(sw.includes("'./obrix-offline-v3.js'"),'Service Worker deixou de cachear o motor v3.');
expect(sw.includes("'./obrix-offline-v3-nav.js'"),'Service Worker deixou de cachear a barra inferior offline independente.');
expect(sw.includes("'./obrix-offline-v3-guard.js'"),'Service Worker deixou de cachear a proteção do v3.');

if(errors.length){
  console.error('\nBLINDAGEM OFFLINE V3: PUBLICAÇÃO BLOQUEADA.\n');
  for(const e of errors)console.error(`- ${e}`);
  console.error('\nQualquer mudança no offline exige nova homologação explícita e atualização consciente do baseline.\n');
  process.exit(1);
}
console.log(`Blindagem offline v3 aprovada: ${paths.length} arquivos conferidos contra ${approved}.`);
