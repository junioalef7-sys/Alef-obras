'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','obrix-backend-adapter.js'),'utf8');
const PROD='gnvclctqnwxnjxydzhwc';
const HML='abcdefghijklmnopqrst';
const PREVIEW='alef-obras-9uj5bdnjc-obrix3.vercel.app';

function start({host,ref,config,cacheConfig}){
  const requests=[],clients=[],store=new Map();
  if(cacheConfig)store.set('obrix_public_config_v2',JSON.stringify({at:Date.now(),cfg:cacheConfig}));
  const window={
    location:{hostname:host},
    __OBRIX_HML_PROJECT_REF:ref,
    addEventListener(){},
    supabase:{createClient:(url,key)=>{
      clients.push({url,key});
      return {auth:{onAuthStateChange(){}}};
    }}
  };
  const context={window,navigator:{onLine:true},
    document:{getElementById(){return null},documentElement:{dataset:{}}},
    localStorage:{getItem:key=>store.get(key)||null,setItem:(key,val)=>store.set(key,val)},
    fetch:async url=>{requests.push(url);return {ok:true,json:async()=>config};},
    URL,CustomEvent:class {}
  };
  vm.runInNewContext(source,context,{timeout:3000});
  return {init:()=>window.OBRIX_BACKEND.init(),requests,clients,store};
}

test('dominio oficial continua apontando ao backend oficial',async()=>{
  const x=start({host:'alef-obras-obrix3.vercel.app',config:{
    url:'https://'+PROD+'.supabase.co',publishableKey:'public-test-key'
  }});
  await x.init();
  assert.equal(x.requests.length,1);
  assert.equal(x.clients[0]?.url,'https://'+PROD+'.supabase.co');
});

test('preview sem branch isolada é bloqueada antes da primeira requisição',async()=>{
  const x=start({host:PREVIEW,config:{
    url:'https://'+PROD+'.supabase.co',publishableKey:'public-test-key'
  }});
  await assert.rejects(x.init(),/Prévia de testes bloqueada/);
  assert.equal(x.requests.length,0);
  assert.equal(x.clients.length,0);
});

test('preview recusa endpoint que devolve configuração de produção',async()=>{
  const x=start({host:PREVIEW,ref:HML,config:{
    url:'https://'+PROD+'.supabase.co',publishableKey:'public-test-key'
  }});
  await assert.rejects(x.init(),/configuração aponta para outro banco/);
  assert.equal(x.requests[0],'https://'+HML+'.supabase.co/functions/v1/obrix-public-config');
  assert.equal(x.clients.length,0);
});

test('preview válida usa exclusivamente o banco de homologação configurado',async()=>{
  const x=start({host:PREVIEW,ref:HML,config:{
    url:'https://'+HML+'.supabase.co',publishableKey:'public-test-key'
  }});
  await x.init();
  assert.equal(x.clients[0]?.url,'https://'+HML+'.supabase.co');
});

test('cache local apontando ao oficial não contorna isolamento da preview',async()=>{
  const x=start({host:PREVIEW,ref:HML,
    cacheConfig:{url:'https://'+PROD+'.supabase.co',publishableKey:'public-test-key'},
    config:{url:'https://'+HML+'.supabase.co',publishableKey:'public-test-key'}
  });
  await x.init();
  assert.equal(x.requests.length,1);
  assert.equal(x.clients[0]?.url,'https://'+HML+'.supabase.co');
});
