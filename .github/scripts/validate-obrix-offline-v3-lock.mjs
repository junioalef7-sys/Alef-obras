import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const lockPath='obrix-offline-v3-lock.json';
const homologationPath='obrix-offline-v3-homologado.json';
const errors=[];
const fail=m=>errors.push(m);
const expect=(c,m)=>{if(!c)fail(m)};
const read=p=>fs.readFileSync(p,'utf8');
const blobAt=(commit,path)=>execFileSync('git',['rev-parse',`${commit}:${path}`],{encoding:'utf8'}).trim();
const blobNow=path=>execFileSync('git',['hash-object',path],{encoding:'utf8'}).trim();

if(!fs.existsSync(lockPath)){
  console.error('ERRO: obrix-offline-v3-lock.json ausente.');
  process.exit(1);
}
if(!fs.existsSync(homologationPath)){
  console.error('ERRO: registro de homologação do offline ausente.');
  process.exit(1);
}

const lock=JSON.parse(read(lockPath));
const homologation=JSON.parse(read(homologationPath));
const approved=lock.approved_runtime_commit;
const envApproved=String(process.env.OBRIX_OFFLINE_HOMOLOGATED_COMMIT||'').trim();
const paths=Array.isArray(lock.protected_paths)?lock.protected_paths:[];
const guardApproved=String(lock.approved_guard_commit||'').trim();
const guardPaths=Array.isArray(lock.guard_paths)?lock.guard_paths:[];

// Baseline visual estável. Mudanças nestes arquivos exigem atualização
// consciente deste commit de homologação visual.
const visualApproved='9dc45bd321844cc3ee6218019222a221ce030fed';
const visualPaths=[
  'obrix-button-colors-v1.js',
  'obrix-offline-online-visual-v1.js',
  'obrix-online-visual-approved-v1.css',
  'obrix-light-polish.js',
  'obrix-pagamentos-ui-alinhamento.js',
  'obrix-global-ui-report-fix.js',
  'obrix-avatar-dark-fix.js',
  'obrix-brand-main.js',
  'obrix-theme-main.js',
  'obrix-ajustes-ui-final.js',
  'obrix-equipe-botoes-neutros-v1.js',
  'obrix-equipe-controles-guard.js',
  'obrix-account-delete.js'
];

const mandatoryCoreProtected=[
  'obrix.html',
  'obrix-startup-router.js',
  'obrix-backend-adapter.js',
  'obrix-core-main.js',
  'obrix-auth-main.js',
  'obrix-login-profissional.js',
  'obrix-login-rescue.js',
  'obrix-menu-main.js',
  'obrix-nav-active.js',
  'obrix-home-clean.js',
  'obrix-theme-main.js',
  'obrix-brand-main.js'
];

expect(typeof approved==='string'&&approved.length>=40,'Commit aprovado do runtime offline v3 não definido.');
expect(paths.length>=51,'Blindagem incompleta: menos de 51 arquivos do runtime protegidos.');
expect(lock?.homologation?.status==='approved_by_user','Lock do offline perdeu o status de homologação do usuário.');
expect(lock?.homologation?.requires_explicit_reapproval_for_runtime_change===true,'Lock deixou de exigir nova homologação para alteração do runtime.');
expect(homologation?.status==='approved_by_user','Registro externo de homologação não está aprovado.');
expect(homologation?.policy?.runtime_changes_require_new_user_homologation===true,'Registro de homologação deixou de exigir nova aprovação do usuário.');
expect(homologation?.policy?.ordinary_updates_must_preserve_this_runtime===true,'Registro de homologação deixou de proteger o runtime contra atualizações comuns.');
expect(homologation?.runtime_commit===approved,'Commit do registro de homologação difere do commit protegido pelo lock.');
expect(homologation?.release===lock?.release,'Identificador da release homologada diverge entre os arquivos de blindagem.');
if(envApproved)expect(approved===envApproved,'Commit homologado no workflow diverge do commit protegido pelo lock.');
for(const p of mandatoryCoreProtected)expect(paths.includes(p),`Blindagem do núcleo perdeu arquivo obrigatório: ${p}`);
expect(visualPaths.length>=13,'Blindagem visual estável incompleta.');

// Homologação explícita do modo escuro aprovado pelo usuário.
expect(lock?.dark_mode_homologation?.status==='approved_by_user','Modo escuro perdeu o status de homologação do usuário.');
expect(lock?.dark_mode_homologation?.baseline_commit===visualApproved,'Baseline homologado do modo escuro diverge do baseline visual protegido.');
expect(lock?.dark_mode_homologation?.gold_buttons_forbidden===true,'Blindagem deixou de proibir botões dourados no modo escuro.');
expect(lock?.dark_mode_homologation?.gold_flicker_forbidden===true,'Blindagem deixou de proibir o piscar dourado no modo escuro.');
expect(lock?.dark_mode_homologation?.requires_explicit_reapproval_for_change===true,'Modo escuro deixou de exigir nova homologação para mudança.');

function verifyPaths(commit,list,label){
  for(const path of list){
    if(!fs.existsSync(path)){fail(`${label} ausente: ${path}`);continue}
    let expected='';
    try{expected=blobAt(commit,path)}catch(_){fail(`${label} não existe no commit aprovado: ${path}`);continue}
    const actual=blobNow(path);
    if(actual!==expected)fail(`${label} alterado: ${path}\n  aprovado: ${expected}\n  atual:    ${actual}`);
  }
}
verifyPaths(approved,paths,'Arquivo offline protegido');
verifyPaths(visualApproved,visualPaths,'Arquivo visual estável protegido');

if(guardApproved||guardPaths.length){
  expect(guardApproved.length>=40,'Commit aprovado da própria blindagem não definido.');
  expect(guardPaths.length>=3,'Blindagem da blindagem incompleta.');
  if(guardApproved.length>=40&&guardPaths.length)verifyPaths(guardApproved,guardPaths,'Arquivo da blindagem protegido');
}

const html=read('obrix.html');
const router=read('obrix-startup-router.js');
const engine=read('obrix-offline-v3.js');
const nav=read('obrix-offline-v3-nav.js');
const guard=read('obrix-offline-v3-guard.js');
const bootstrap=read('obrix-offline-bootstrap.js');
const sw=read('obrix-sw.js');
const visualBridge=read('obrix-offline-online-visual-v1.js');
const buttonColors=read('obrix-button-colors-v1.js');
const approvedCss=read('obrix-online-visual-approved-v1.css');
const accountDelete=read('obrix-account-delete.js');
const offlineBody=(router.match(/async function offline\(\)\{([\s\S]*?)\}\nfunction route/)||[])[1]||'';

expect(html.includes('obrix-offline-v3.js?v=20261024offline-v3-1'),'HTML deixou de carregar o motor offline v3.');
expect(html.indexOf('obrix-offline-v3.js') < html.indexOf('obrix-offline-bootstrap.js'),'Motor v3 precisa carregar antes das camadas offline antigas.');
expect(offlineBody.includes("./obrix-offline-v3.js?v=20261024offline-v3-1"),'Rota offline deixou de entrar diretamente pelo motor v3 homologado.');
expect(offlineBody.includes("./obrix-offline-v3-nav.js?v=20261024offline-v3-nav1"),'Rota offline deixou de carregar a barra inferior independente homologada.');
expect(offlineBody.includes("OBRIX_OFFLINE_V3?.start?.('startup-router-v3')"),'Rota offline deixou de iniciar pelo OBRIX_OFFLINE_V3.');
expect(!offlineBody.includes('obrix-offline-v2.js'),'Rota offline voltou a depender diretamente do motor v2.');
expect(!offlineBody.includes('obrix-pos-login-loader.js'),'Rota offline passou a depender do loader online.');
expect(!offlineBody.includes('obrix-offline-visual-parity-v2'),'Rota offline reintroduziu camada visual antiga.');

expect(engine.includes("const SNAP_PREFIX='obrix_offline_v3_snapshot:'"),'Motor v3 perdeu a base própria de snapshots.');
expect(engine.includes("const labels=['Início','Financeiro','Equipe','Menu']"),'Motor v3 perdeu os quatro botões inferiores de compatibilidade.');
expect(engine.includes("route(['inicio','financeiro','equipe','menu'][i]"),'Navegação inferior de compatibilidade foi alterada.');
expect(engine.includes('persistCompat'),'Motor v3 perdeu compatibilidade de restauração dos dados locais.');
expect(!engine.includes('MutationObserver'),'Motor v3 não pode usar MutationObserver.');
expect(!engine.includes('localStorage.clear('),'Motor v3 não pode limpar todo o armazenamento local.');
expect(!engine.includes('removeItem(SNAP_PREFIX'),'Motor v3 não pode apagar os snapshots homologados.');
expect(!engine.includes('removeItem(BASE_KEY'),'Motor v3 não pode apagar a base offline homologada.');

expect(nav.includes("const ROUTES=['inicio','financeiro','equipe','menu']"),'Barra offline própria perdeu as quatro rotas aprovadas.');
expect(nav.includes("const LABELS=['Início','Financeiro','Equipe','Menu']"),'Barra offline própria perdeu os quatro rótulos aprovados.');
expect(nav.includes('position:fixed!important'),'Barra offline própria deixou de ficar fixa e visível no rodapé.');
expect(nav.includes("setInterval(()=>{if(offline())ensure()},1500)"),'Barra offline própria perdeu a autorrecuperação caso seja removida.');
expect(!nav.includes('MutationObserver'),'Barra offline homologada não pode usar MutationObserver.');
expect(nav.includes("document.addEventListener('click'"),'Barra offline perdeu o manipulador de navegação por clique.');

expect(visualBridge.includes("DARK_LOCK_STYLE_ID='obrixDarkModalButtonsLockedV1'"),'Blindagem visual perdeu a trava dos botões de modal no modo escuro.');
expect(visualBridge.includes("INLINE_LOCK_ATTR='data-obrix-dark-inline-lock'"),'Blindagem visual perdeu a trava inline dos botões escuros.');
expect(visualBridge.includes('visual-approved6'),'Versão do CSS visual deixou de forçar atualização no navegador/PWA.');
expect(visualBridge.includes('.modalBack:not(.accountDeleteBack) .modalActions button'),'Botões Cancelar/Registrar/Salvar/Fechar dos modais deixaram de ser neutralizados no modo escuro.');
expect(visualBridge.includes('.accountDeleteModal .modalActions button.cancelar'),'Cancelar da exclusão de conta deixou de ser vermelho no modo escuro.');
expect(visualBridge.includes('function forceDarkActions()'),'Aplicação direta da cor dos botões escuros foi removida.');
expect(visualBridge.includes("document.querySelectorAll(`.modalBack .modalActions button,#cfgExcluirConta,[${INLINE_LOCK_ATTR}]`)"),'Aplicação direta deixou de cobrir modais e Excluir Conta.');
expect(visualBridge.includes("setImp(b,'background',bg)"),'Blindagem deixou de aplicar fundo com prioridade máxima.');
expect(visualBridge.includes("b.id==='cfgExcluirConta'||!!b.closest('.accountDeleteModal')"),'Excluir Conta e sua confirmação deixaram de ser classificados como vermelhos.');
expect(visualBridge.includes('background:#B91C1C!important'),'Exclusão de conta deixou de usar fundo vermelho protegido.');
expect(!visualBridge.includes('suppressGoldStyle'),'Camada visual voltou a remover e recriar a folha de cores, causando piscar.');
expect(!visualBridge.includes('watchGoldStyle'),'Camada visual voltou a observar/reordenar a folha dourada, causando disputa visual.');

// Blindagem semântica específica do modo escuro homologado.
expect(buttonColors.includes('/* Modo escuro homologado: nenhum botão comum recebe fundo/texto dourado.'),'Arquivo de cores perdeu a regra homologada que neutraliza dourado no modo escuro.');
expect(buttonColors.includes('background:#0F1720!important;background-color:#0F1720!important;background-image:none!important;color:#FFFFFF!important'),'Botões comuns do modo escuro deixaram de ter fundo escuro/texto branco protegido.');
expect(buttonColors.includes('background:#17212B!important;background-color:#17212B!important;background-image:none!important;color:#FFFFFF!important'),'Estado ativo/selecionado do modo escuro deixou de ser neutro e pode voltar ao dourado.');
expect(buttonColors.includes('html[data-theme="dark"] #app button.obrixPermanentNeutral.obrixPermanentGoldText'),'Arquivo perdeu a neutralização de texto dourado permanente no modo escuro.');
expect(buttonColors.includes('body.dark #app button.obrixPermanentNeutral.obrixPermanentGoldText{color:#FFFFFF!important;-webkit-text-fill-color:#FFFFFF!important}'),'Texto dourado permanente voltou a ser permitido no modo escuro.');
expect(approvedCss.includes('html:not([data-obrix-offline-v3="1"])[data-theme="dark"] body #app button:not(.obrixExcluirFinal):not(.obrixDestrutivoFinal):not(.obrixPayMethod)'),'CSS aprovado perdeu a regra global de botões neutros no modo escuro.');
expect(approvedCss.includes('background:#0F1720!important;background-color:#0F1720!important;background-image:none!important;color:#FFFFFF!important'),'CSS aprovado perdeu a paleta neutra do modo escuro.');
expect(approvedCss.includes('background:#B91C1C!important;background-color:#B91C1C!important'),'CSS aprovado perdeu o vermelho protegido de ações destrutivas.');
expect(accountDelete.includes('cfgExcluirConta')||accountDelete.includes('accountDelete'),'Módulo de exclusão de conta deixou de expor os controles protegidos.');

expect(guard.includes("capture?.('pre-online-logout')"),'Proteção de dados no logout foi removida.');
expect(!guard.includes('localStorage.clear('),'Proteção de logout não pode limpar o armazenamento local.');
expect(bootstrap.includes("obrix-sw.js?v=20261024-offline-v3-nav1"),'Bootstrap deixou de forçar a geração homologada do Service Worker.');
expect(!bootstrap.includes('localStorage.clear('),'Bootstrap offline não pode limpar o armazenamento local.');
expect(sw.includes("const CACHE='obrix-offline-v61-v3-nav'"),'Geração aprovada do cache offline v3 foi alterada.');
expect(sw.includes("'./obrix-offline-v3.js'"),'Service Worker deixou de cachear o motor v3.');
expect(sw.includes("'./obrix-offline-v3-nav.js'"),'Service Worker deixou de cachear a barra inferior offline independente.');
expect(sw.includes("'./obrix-offline-v3-guard.js'"),'Service Worker deixou de cachear a proteção do v3.');

if(errors.length){
  console.error('\nBLINDAGEM OBRIX: PUBLICAÇÃO BLOQUEADA.\n');
  for(const e of errors)console.error(`- ${e}`);
  console.error('\nO offline homologado, o núcleo de login/navegação, o visual estável e o modo escuro homologado estão protegidos. Alterações nesses pontos exigem uma mudança consciente da blindagem antes de publicar.\n');
  process.exit(1);
}
console.log(`Offline homologado protegido: ${paths.length} arquivos do runtime conferidos contra ${approved}.`);
console.log(`Visual estável protegido: ${visualPaths.length} arquivos conferidos contra ${visualApproved}.`);
console.log('Modo escuro homologado protegido: dourado e piscar dourado bloqueados por hash + regras semânticas.');
if(guardApproved&&guardPaths.length)console.log(`Blindagem também protegida: ${guardPaths.length} arquivos conferidos contra ${guardApproved}.`);
