'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const STAGING='https://alef-obras-git-test-obrix-seguranca-pagamentos-20261116-obrix3.vercel.app/obrix.html';
const PRODUCTION='https://alef-obras-obrix3.vercel.app/obrix.html';
const examples=[
  ['alef-obras-git-test-obrix-seguranca-pagamentos-20261116-obrix3.vercel.app',STAGING],
  ['alef-obras-i75uqs27r-obrix3.vercel.app',STAGING],
  ['alef-obras-obrix3.vercel.app',PRODUCTION],
  ['alef-obras.vercel.app',PRODUCTION]
];

function loadRedirect(file,functionName,host){
  const code=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  const line=code.split('\n').find(x=>x.includes('function '+functionName+'()'));
  assert.ok(line,'funcao do retorno de e-mail deve existir em '+file);
  const start=line.indexOf('function '+functionName+'()');
  const source=line.slice(start);
  assert.match(source,/^function [A-Za-z]+RedirectUrl\(\)\{.+\}$/);
  return vm.runInNewContext('('+source+')()',{
    location:{hostname:host,origin:'https://'+host,search:'?_vercel_share=temporaryValue123456',hash:''}
  });
}

for(const [host,expected] of examples){
  test('confirmacao: destino correto para '+host,()=>{
    assert.equal(loadRedirect('obrix-auth-main.js','obrixAuthRedirectUrl',host),expected);
  });
  test('recuperacao: destino correto para '+host,()=>{
    assert.equal(loadRedirect('obrix-login-rescue.js','obrixRecoveryRedirectUrl',host),expected);
  });
}

test('callback nao depende de cookie temporario do Outlook/Vercel',()=>{
  for(const file of ['obrix-auth-main.js','obrix-login-rescue.js']){
    const code=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
    const fn=code.split('\n').find(x=>x.includes('RedirectUrl()'))||'';
    assert.ok(!fn.includes('_vercel_share'));
    assert.ok(fn.includes(STAGING));
  }
});
