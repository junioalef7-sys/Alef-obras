const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
for(const prefix of ['','obrix-android-inicial/']){
 const startup=fs.readFileSync(prefix+'obrix-startup-router.js','utf8');
 const html=fs.readFileSync(prefix+'obrix.html','utf8');
 const debug=fs.readFileSync(prefix+'obrix-auditoria-preview-20261113.js','utf8');
 assert.ok(!startup.includes("obrix-pos-login-loader.js?v=20261026darkclean5"),
   'Carregador antigo ainda é iniciado pelo roteador');
 assert.equal((html.match(/obrix-pos-login-loader\.js\?v=/g)||[]).length,1,
   'HTML não pode executar dois carregadores primários');
 assert.match(html,/obrix-pos-login-loader\.js\?v=[\w.-]+/,
   'Carregador da versão aprovada sumiu do HTML');
 assert.ok(html.includes('obrix-startup-router.js?v=20261113-nav-header2'),
   'Roteador anterior pode permanecer em cache');
 assert.ok(!startup.includes("await load('./obrix-pos-login-loader.js"),
   'Roteador ainda inicia carregador primário em duplicidade');
 assert.ok(debug.includes("new URLSearchParams(location.search).get('obrix_auditoria')!=='1'"),
   'Modo diagnóstico precisa ser estritamente opt-in');
 const context={
   URLSearchParams,location:{search:''},
   window:{},document:{},navigator:{},console
 };
 vm.createContext(context);vm.runInContext(debug,context);
 assert.equal(context.window.__OBRIX_AUDITORIA_BUILD,undefined,
   'Diagnóstico altera o aplicativo fora do modo opt-in');
 console.log(JSON.stringify({prefix:prefix||'root',loaderLegacyRemoved:true,
  htmlLoaderUnique:true,debugOptIn:true,pass:true}));
}
