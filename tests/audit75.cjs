const fs=require('node:fs');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const trial=read('trial-fix62.js');
const billing=read('billing-hotfix63.js');
const ui=read('ui-fix67.js');
const login=read('login-ui68.js');
const sw=read('edifiq-sw.js');
const manifest=read('manifest.webmanifest');

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
assert.match(ui,/edifiqVisual77Style/,'correção visual v77 precisa estar presente');
assert.match(ui,/#menuPasta \.menuPastaHead\.edifiqDrawerHead>\.x\{display:none!important/,'X do cabeçalho do menu deve permanecer oculto');
assert.match(ui,/#app \.top,#app \.modalHead\{backdrop-filter:none!important/,'topos das telas e modais não podem usar blur');
assert.match(ui,/body:not\(\.edLight\) #app \.top\{background:#090b0e!important/,'cabeçalho escuro deve ser sólido');
assert.match(ui,/body\.edLight #app \.top\{background:#f4f7fb!important/,'cabeçalho claro deve ser sólido');
assert.match(ui,/apple-mobile-web-app-status-bar-style/,'correção deve alterar a barra superior do PWA');
assert.match(ui,/setAttribute\('content','default'\)/,'barra superior do iPhone não pode permanecer translúcida');

assert.match(login,/Senha incorreta ou dados incorretos\./,'erro de login padronizado ausente');
assert.match(login,/authCommercialHint\{display:none!important\}/,'propaganda de teste não pode voltar ao login');

assert.match(sw,/edifiq-shell-v77-opaque-top/,'cache PWA deve estar na versão visual atual');
assert.doesNotMatch(sw,/BILLING_FIX/,'Service Worker não pode injetar cobrança antiga');
assert.doesNotMatch(sw,/injectFix/,'Service Worker não pode reescrever HTML com correções antigas');
assert.match(sw,/cache:'no-store'/,'navegação e assets devem priorizar versão atual');
assert.match(sw,/ui-fix67\.js\?v=77/,'Service Worker deve carregar o patch visual v77 atualizado');
assert.match(manifest,/edifiq-menu-logo\.jpg\?v=75/,'manifest deve preservar a logo aprovada sem mudança desnecessária');

console.log('AUDIT77 OK: topo opaco corrigido sem regressão de sessão/sync, pagamentos, login, impressão ou PWA.');
