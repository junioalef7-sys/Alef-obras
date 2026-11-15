import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare-legacy-redirect/index.mjs';
import {readFileSync} from 'node:fs';
const ORIGIN='https://alef-obras-obrix3.vercel.app';
const LEGACY='https://obrix.junioalef7.workers.dev';
test('old recovery links keep query and browser token fragment',async()=>{
 const res=await worker.fetch(new Request(LEGACY+'/?type=recovery',{headers:{accept:'text/html'}}));
 assert.equal(res.status,200);
 const html=await res.text();
 assert.match(html,/location\.replace\("https:\/\/alef-obras-obrix3\.vercel\.app\/obrix\.html\?type=recovery" \+ location\.hash\)/);
 assert.match(res.headers.get('cache-control'),/no-store/);
});
test('Android path remains under one domain',async()=>{
 const r=await worker.fetch(new Request(LEGACY+'/obrix-android-inicial/obrix.html?x=1',{headers:{accept:'text/html'}}));
 assert.ok((await r.text()).includes(ORIGIN+'/obrix-android-inicial/obrix.html?x=1'));
});
test('legacy static assets redirect without choosing a new host',async()=>{
 const r=await worker.fetch(new Request(LEGACY+'/obrix-auth-main.js',{headers:{accept:'text/javascript'}}));
 assert.equal(r.status,307);assert.equal(r.headers.get('location'),ORIGIN+'/obrix-auth-main.js');
});
test('unsafe methods denied',async()=>{
 const r=await worker.fetch(new Request(LEGACY+'/obrix.html',{method:'POST'}));assert.equal(r.status,405);
});
test('Vercel host rule redirects only the secondary alias',()=>{
 const v=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.equal(v.redirects.length,1);
 assert.equal(v.redirects[0].has[0].type,'host');
 assert.equal(v.redirects[0].has[0].value,'alef-obras.vercel.app');
 assert.equal(v.redirects[0].destination,ORIGIN+'/:path*');
});
