'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const helper=pathToFileURL(path.join(__dirname,'../supabase/functions/obrix-delete-account/cors-origin.mjs')).href;
const PROD='https://gnvclctqnwxnjxydzhwc.supabase.co';
const AUDIT='https://mjzlwnuklfopdmgcvdcs.supabase.co';
const HML='https://abcdefghijklmnopqrst.supabase.co';
const PREVIEW='https://alef-obras-9uj5bdnjc-obrix3.vercel.app';
async function check(origin,expected,backend){
 const {previewHmlPermitida}=await import(helper);
 return previewHmlPermitida(origin,expected,backend);
}
test('autoriza somente origem exata na branch isolada',async()=>{
 assert.equal(await check(PREVIEW,PREVIEW,HML),true);
 assert.equal(await check(PREVIEW,'',HML),false);
 assert.equal(await check(PREVIEW,'https://outro.vercel.app',HML),false);
});
test('recusa preview em produção e em auditoria com dados anteriores',async()=>{
 assert.equal(await check(PREVIEW,PREVIEW,PROD),false);
 assert.equal(await check(PREVIEW,PREVIEW,AUDIT),false);
});
test('recusa preview se URL do backend for inválida',async()=>{
 assert.equal(await check(PREVIEW,PREVIEW,'https://evil.test'),false);
 assert.equal(await check(PREVIEW,PREVIEW,'javascript:alert(1)'),false);
 assert.equal(await check(PREVIEW,PREVIEW,'https://AAAAAAAAAAAAAAAAAAAA.supabase.co'),false);
});
test('nunca libera domínios de terceiros ou origem oficial por essa exceção',async()=>{
 assert.equal(await check('https://evil.example', 'https://evil.example',HML),false);
 assert.equal(await check('https://alef-obras-obrix3.vercel.app','https://alef-obras-obrix3.vercel.app',HML),false);
 assert.equal(await check('https://alef-obras.vercel.app','https://alef-obras.vercel.app',HML),false);
});
test('a Edge consome a política e preserva validação do token',()=>{
 const code=fs.readFileSync(path.join(__dirname,'../supabase/functions/obrix-delete-account/index.ts'),'utf8');
 assert.ok(code.includes('previewHmlPermitida('));
 assert.ok(code.includes('origemPermitida(origin)'));
 assert.ok(code.includes('userClient.auth.getUser()'));
 assert.ok(code.includes('EXCLUIR CONTA'));
 assert.equal(code.includes('alef-obras-git-test-obrix-diarias-config-diario-e-296b55-obrix3'),false);
});
