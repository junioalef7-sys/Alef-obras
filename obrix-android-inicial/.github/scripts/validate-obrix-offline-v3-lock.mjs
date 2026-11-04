import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const lockPath='obrix-offline-v3-lock.json';
const errors=[];
const fail=m=>errors.push(m);
const read=p=>fs.readFileSync(p,'utf8');
const blobAt=(commit,path)=>execFileSync('git',['rev-parse',`${commit}:${path}`],{encoding:'utf8'}).trim();
const blobNow=path=>execFileSync('git',['hash-object',path],{encoding:'utf8'}).trim();

if(!fs.existsSync(lockPath)){console.error('ERRO: lock offline ausente.');process.exit(1)}
const lock=JSON.parse(read(lockPath));
const approved=String(lock.approved_runtime_commit||'').trim();
const envApproved=String(process.env.OBRIX_OFFLINE_HOMOLOGATED_COMMIT||'').trim();

const offlinePaths=[
'obrix-offline-v3.js','obrix-offline-v3-nav.js','obrix-offline-v3-guard.js','obrix-offline-bootstrap.js','obrix-session-offline-fix.js','obrix-offline-v2.js'
];
if(!approved)fail('Commit aprovado do offline não definido.');
if(envApproved&&approved!==envApproved)fail('Commit homologado do workflow diverge do offline aprovado.');
for(const path of offlinePaths){
 if(!fs.existsSync(path)){fail(`Arquivo offline ausente: ${path}`);continue}
 try{const expected=blobAt(approved,path),actual=blobNow(path);if(actual!==expected)fail(`Arquivo offline alterado: ${path}`)}catch(_){fail(`Não foi possível validar arquivo offline: ${path}`)}
}
if(errors.length){console.error('BLINDAGEM OFFLINE: PUBLICAÇÃO BLOQUEADA.');errors.forEach(e=>console.error('- '+e));process.exit(1)}
console.log('Modo offline preservado. Blindagem visual claro/escuro não é validada aqui.');
