const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
function has(s,msg){assert.ok(html.includes(s),msg)}
has('finishLogin','Fluxo finishLogin ausente');
has('edifiqPostLoginStartup','Pós-login isolado ausente');
has('setTimeout(()=>edifiqPostLoginStartup(session),0)','Pós-login precisa continuar desacoplado, sem await');
has('$("auth")?.classList.add("hidden")','Login precisa ocultar a tela de autenticação imediatamente');
has('$("app")?.classList.remove("hidden")','Login precisa liberar o aplicativo imediatamente');
assert.ok(html.includes('grant_type=password')||html.includes('signInWithPassword'),'Autenticação por senha ausente');
const start=html.indexOf('const finishLogin=async(session)=>');
assert.ok(start>=0,'Bloco finishLogin não encontrado');
let end=html.indexOf('\n  try{\n    // 1)',start);
if(end<0)end=html.indexOf('\n  try{\r\n    // 1)',start);
assert.ok(end>start,'Não foi possível delimitar o bloco finishLogin');
const block=html.slice(start,end);
assert.ok(block.includes('classList.remove("hidden")'),'Aplicativo não é liberado no finishLogin');
assert.ok(block.includes('setTimeout(()=>edifiqPostLoginStartup(session),0)'),'Pós-login não está desacoplado dentro de finishLogin');
assert.ok(!/await\s+(?:loadCloud|edifiqCarregarEmpresaAtiva|edifiqClaimLegacyStorage|edifiqLoadScopedLocalState)\s*\(/.test(block),'Operação de nuvem voltou a bloquear o login');
console.log('LOGIN OK: autenticação libera o app antes de sincronização, assinatura e nuvem.');
