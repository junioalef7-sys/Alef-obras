const fs=require('node:fs');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const trial=read('trial-fix62.js');
const billing=read('billing-hotfix63.js');
const ui=read('ui-fix67.js');
const visual=read('visual-fix78.css');
const login=read('login-ui68.js');
const sw=read('edifiq-sw.js');
const manifest=read('manifest.webmanifest');
const orcLink=read('orcamentos-link79.js');
const orcPage=read('orcamentos.html');

assert.match(trial,/edifiqSyncSessionState75/,'sincronização precisa conhecer estado da sessão');
assert.match(trial,/sessionState==='signed_out'/,'sincronização deve ser bloqueada após logout');
assert.match(trial,/edifiqForceFullSync/,'login deve disparar sincronização completa em segundo plano');
assert.doesNotMatch(trial,/setInterval\s*\(/,'trial não pode usar polling periódico que cause tremor/requisições repetidas');
assert.doesNotMatch(trial,/MutationObserver/,'trial não pode redesenhar a interface continuamente');

assert.match(billing,/safeAsaasUrl/,'checkout precisa validar URL do Asaas');
assert.match(billing,/forma==='boleto'/,'dados de pagador devem ser exigidos apenas no boleto no EDIFIQ');
assert.match(billing,/if\(!payload\)[\s\S]*checkout_url/,'Pix hospedado precisa aceitar redirecionamento ao checkout do Asaas');
assert.match(billing,/Início do teste/,'Planos precisa mostrar início do trial');
assert.match(billing,/Dias restantes/,'Planos precisa mostrar dias restantes');
assert.match(billing,/Vencimento do teste/,'Planos precisa mostrar vencimento');
assert.match(billing,/Primeira cobrança/,'Planos precisa mostrar primeira cobrança');

assert.match(ui,/edifiqSuppressConfigPlans71/,'Planos deve permanecer fora de Configurações');
assert.match(ui,/menuPlanosAssinaturas/,'Planos deve existir no Menu');
assert.match(ui,/edifiqSuppressOnboardingBanner69/,'Primeiros passos deve continuar removido');
assert.match(ui,/data-ed-close-overview/,'Visão geral precisa manter botão Fechar');
assert.match(ui,/edifiqReportPrint/,'impressão principal precisa estar protegida');
assert.match(ui,/ed27PrintReport/,'impressão de relatório deve estar protegida');
assert.match(ui,/apple-mobile-web-app-status-bar-style/,'correção deve alterar a barra superior do PWA');
assert.match(ui,/setAttribute\('content','default'\)/,'barra superior do iPhone não pode permanecer translúcida');

assert.match(visual,/^\.top\{/m,'correção visual deve atingir o cabeçalho global real');
assert.match(visual,/\.top\{[\s\S]*?backdrop-filter:none!important/,'cabeçalho global não pode usar blur');
assert.match(visual,/\.top\{[\s\S]*?background:#090b0e!important/,'cabeçalho escuro global deve ser sólido');
assert.match(visual,/body\.edLight \.top\{[\s\S]*?background:#f4f7fb!important/,'cabeçalho claro global deve ser sólido');
assert.match(visual,/\.modalHead\{[\s\S]*?backdrop-filter:none!important/,'cabeçalhos internos não podem usar blur');
assert.match(visual,/#menuPasta \.menuPastaHead\.edifiqDrawerHead>\.x/,'X do menu deve permanecer oculto');
assert.doesNotMatch(visual,/^#menuPasta\s*\{/m,'correção v78 não pode alterar o visual aprovado do menu');

assert.match(login,/Senha incorreta ou dados incorretos\./,'erro de login padronizado ausente');
assert.match(login,/authCommercialHint\{display:none!important\}/,'propaganda de teste não pode voltar ao login');

assert.match(orcLink,/menuOrcamentos79/,'Menu precisa expor Orçamentos');
assert.match(orcPage,/edifiq_orcamento_salvar/,'Orçamentos precisa salvar pelo RPC seguro');
assert.match(orcPage,/edifiq_orcamento_converter_em_obra/,'Orçamentos precisa converter proposta aprovada em obra');

assert.match(sw,/edifiq-shell-v79-orcamentos/,'cache PWA deve incluir o módulo de Orçamentos v79');
assert.match(sw,/orcamentos\.html/,'Service Worker deve incluir a página de Orçamentos');
assert.match(sw,/orcamentos-link79\.js\?v=79/,'Service Worker deve incluir o atalho de Orçamentos');
assert.doesNotMatch(sw,/BILLING_FIX/,'Service Worker não pode injetar cobrança antiga');
assert.doesNotMatch(sw,/injectFix/,'Service Worker não pode reescrever HTML com correções antigas');
assert.match(sw,/cache:'no-store'/,'navegação e assets devem priorizar versão atual');
assert.match(sw,/visual-fix78\.css\?v=78/,'Service Worker deve carregar a correção visual global v78');
assert.match(sw,/ui-fix67\.js\?v=77/,'Service Worker deve preservar o patch funcional visual anterior sem mudança desnecessária');
assert.match(manifest,/edifiq-menu-logo\.jpg\?v=75/,'manifest deve preservar a logo aprovada sem mudança desnecessária');

console.log('AUDIT79 OK: Orçamentos adicionado preservando login, sessão, sync, cobrança, visual e PWA.');
