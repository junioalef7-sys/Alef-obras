const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
for(const prefix of ['','obrix-android-inicial/']){
  const source=fs.readFileSync(prefix+'obrix-sw.js','utf8');
  const loader=fs.readFileSync(prefix+'obrix-pos-login-loader.js','utf8');
  test(prefix+' cache PWA: nao servir script antigo nem atrasar scripts conhecidos',async()=>{
    const routes={},cache=new Map();
    const origin='https://obrix-test.invalid';
    const getUrl=q=>typeof q==='string'?new URL(q,origin).href:q.url;
    const network=[];
    class MockRequest{
      constructor(input,opts={}){this.url=getUrl(input);this.method='GET';this.mode=opts.mode||input.mode||'cors';this.signal=opts.signal||null}
    }
    class MockResponse{
      constructor(body,{status=200}={}){this.body=body;this.status=status;this.ok=status>=200&&status<300;this.type='basic';this.redirected=false}
      clone(){return new MockResponse(this.body,{status:this.status})}
      async text(){return this.body}
      static error(){return new MockResponse('NETWORK_ERROR',{status:0})}
    }
    const useCache={
      async match(req,opts={}){
        const key=getUrl(req);
        if(cache.has(key))return cache.get(key).clone();
        if(opts.ignoreSearch){
          const pathname=new URL(key).pathname;
          const match=[...cache.keys()].find(x=>new URL(x).pathname===pathname);
          if(match)return cache.get(match).clone();
        }
        return undefined;
      },
      async put(q,res){cache.set(getUrl(q),res.clone())}
    };
    const cachesMock={async open(){return useCache},match:useCache.match};
    const ctx={
      console,Promise,URL,AbortController,setTimeout,clearTimeout,Request:MockRequest,
      Response:MockResponse,
      caches:cachesMock,location:{origin},
      self:{addEventListener(name,callback){routes[name]=callback},skipWaiting:async()=>{},clients:{claim:async()=>{}}},
      fetch:async req=>{
        network.push(getUrl(req));
        if(ctx.failNetwork)throw Error('offline');
        return new MockResponse('LATEST:'+new URL(req.url).search);
      },failNetwork:false
    };
    vm.createContext(ctx);vm.runInContext(source,ctx,{filename:prefix+'obrix-sw.js'});
    assert.equal(typeof routes.fetch,'function');
    async function request(path,mode='cors'){
      const req={url:origin+path,method:'GET',mode};
      let promise;
      routes.fetch({request:req,respondWith(p){promise=Promise.resolve(p)}});
      assert.ok(promise,'worker did not respond');
      return promise;
    }
    cache.set(origin+'/obrix-account-delete.js?v=old',new MockResponse('OLD RED SCRIPT'));
    ctx.failNetwork=true;
    const missing=await request('/obrix-account-delete.js?v=new');
    assert.equal(missing.status,0,'old script was served for another version');
    assert.equal(network.length,1,'network request for new version missing');
    cache.set(origin+'/obrix-account-delete.js?v=new',new MockResponse('NEW NEUTRAL SCRIPT'));
    const exact=await request('/obrix-account-delete.js?v=new');
    assert.equal(exact.body,'NEW NEUTRAL SCRIPT','not exact cached version');
    assert.equal(network.length,1,'script cache hit still blocked on network');
    ctx.failNetwork=false;
    const fresh=await request('/obrix-pos-login-loader.js?v=next');
    assert.equal(fresh.body,'LATEST:?v=next');
    assert.equal(network.length,2);
    const again=await request('/obrix-pos-login-loader.js?v=next');
    assert.equal(again.body,'LATEST:?v=next');
    assert.equal(network.length,2,'second tap should not perform another network fetch');
    const doc=await request('/obrix.html','navigate');
    assert.equal(doc.body,'LATEST:','navigation should prioritize online code');
    assert.equal(network.length,3);
    // Recuperação offline: somente a versão declarada pelo shell deste
    // mesmo cache pode reutilizar seu snapshot pré-baixado sem query.
    cache.set(origin+'/obrix.html',new MockResponse(
      '<script src="./obrix-account-delete.js?v=offline-current"></script>'
    ));
    cache.set(origin+'/obrix-pos-login-loader.js',new MockResponse(
      "const FEATURES={config:['./obrix-account-delete.js?v=offline-current']};"
    ));
    cache.set(origin+'/obrix-account-delete.js',new MockResponse('CURRENT_OFFLINE_SNAPSHOT'));
    ctx.failNetwork=true;
    const allowed=await request('/obrix-account-delete.js?v=offline-current');
    assert.equal(allowed.body,'CURRENT_OFFLINE_SNAPSHOT',
      'versioned script declared in this build must remain accessible offline');
    const foreign=await request('/obrix-account-delete.js?v=another-build');
    assert.equal(foreign.status,0,
      'offline snapshot from another build was incorrectly accepted');
    assert.match(source,/obrix-offline-v72-desktop-modules-equipe-obras-20261114/);
    assert.match(loader,/obrix-obras-offline\.js\?v=20261114-desktop-stability-cache72/);
    assert.match(source,/'\.\/obrix-pos-login-loader\.js'/,
      'offline manifest loader must be precached');
  });
  test(prefix+' prefetch: so quatro arquivos leves, sem executar modulos',()=>{
    assert.match(loader,/const prioritarios=\[\.\.\.FEATURES\.config,FEATURES\.notas\[0\],FEATURES\.diario\[1\]\]/);
    assert.match(loader,/l\.rel='prefetch'/);
    assert.match(loader,/l\.fetchPriority='low'/);
    assert.match(loader,/await sleep\(280\)/);
    assert.ok(!loader.includes("await loadGroup('financeiro');await loadGroup('obras')"));
  });
  test(prefix+' nova versao PWA referenciada pelos scripts raiz/Android',()=>{
    assert.ok(fs.readFileSync(prefix+'obrix-obras-offline.js','utf8').includes("obrix-sw.js?v=20261114-desktop-stability-cache72"));
    assert.match(fs.readFileSync(prefix+'obrix.html','utf8'),/obrix-pos-login-loader\.js\?v=[\w.-]+/);
  });
}
