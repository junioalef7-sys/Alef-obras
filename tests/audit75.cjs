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

assert.match(login,/Senha incorreta ou dados incorretos\./,'erro de login padronizado ausente');
assert.match(login,/authCommercialHint\{display:none!important\}/,'propaganda de teste não pode voltar ao login');

assert.match(sw,/edifiq-shell-v75-audit/,'cache PWA deve estar na versão auditada');
assert.doesNotMatch(sw,/BILLING_FIX/,'Service Worker não pode injetar cobrança antiga');
assert.doesNotMatch(sw,/injectFix/,'Service Worker não pode reescrever HTML com correções antigas');
assert.match(sw,/cache:'no-store'/,'navegação e assets devem priorizar versão atual');
assert.match(manifest,/edifiq-menu-logo\.jpg\?v=75/,'manifest deve apontar para a logo nova versionada');

console.log('AUDIT75 OK: sessão/sync, trial, pagamentos, UI, login, impressão e PWA protegidos contra regressão.');
