const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../.release-base.html'),'utf8');let count=0;
function test(name,fn){fn();count++;console.log('OK',name);}
function fixture(){
 const els=new Map(['drawerUserName','drawerUserEmail','drawerUserAvatar'].map(id=>[id,{textContent:'Alef Júnior',hidden:false}]));
 const ctx={window:null,user:null,sb:null,console:{warn(){}},$:id=>els.get(id),String};ctx.window=ctx;vm.createContext(ctx);
 const start=html.indexOf('function edifiqAccountIdentity('),end=html.indexOf('function openConfiguracoes()',start);
 vm.runInContext(html.slice(start,end),ctx);
 const p=html.indexOf('  window.__edifiqProfile=null;'),q=html.indexOf('  function configMarkup6()',p);vm.runInContext(html.slice(p,q),ctx);
 return {ctx,els};
}
async function main(){
 test('Usuário sem nome exibe apenas o próprio e-mail',()=>{const {ctx,els}=fixture();ctx.user={id:'b',email:'cliente@exemplo.invalid'};ctx.renderDrawerAccount();assert.equal(els.get('drawerUserName').textContent,ctx.user.email);assert.equal(els.get('drawerUserEmail').textContent,'');assert.equal(els.get('drawerUserEmail').hidden,true);});
 test('Nome dos metadados de cadastro acompanha a conta',()=>{const {ctx,els}=fixture();ctx.user={id:'b',email:'cliente@exemplo.invalid',user_metadata:{full_name:'Maria Souza'}};ctx.renderDrawerAccount();assert.equal(els.get('drawerUserName').textContent,'Maria Souza');assert.equal(els.get('drawerUserEmail').textContent,ctx.user.email);assert.equal(els.get('drawerUserEmail').hidden,false);});
 test('Perfil do administrador nunca aparece para outra conta',()=>{const {ctx,els}=fixture();ctx.__edifiqProfile={id:'admin',nome:'Alef Júnior',telefone:'123'};ctx.user={id:'b',email:'cliente@exemplo.invalid'};ctx.renderDrawerAccount();assert.equal(els.get('drawerUserName').textContent,ctx.user.email);assert.equal(ctx.__edifiqProfile,null);});
 test('Perfil próprio tem prioridade e nome vazio é respeitado',()=>{const {ctx,els}=fixture();ctx.user={id:'b',email:'cliente@exemplo.invalid',user_metadata:{full_name:'Nome antigo'}};ctx.__edifiqProfile={id:'b',nome:'Nome atualizado'};ctx.renderDrawerAccount();assert.equal(els.get('drawerUserName').textContent,'Nome atualizado');ctx.__edifiqProfile.nome=' ';ctx.renderDrawerAccount();assert.equal(els.get('drawerUserName').textContent,ctx.user.email);});
 test('Perfil sem identificação não pode fornecer nome',()=>{const {ctx,els}=fixture();ctx.user={id:'b',email:'b@exemplo.invalid'};ctx.__edifiqProfile={nome:'Alef'};ctx.renderDrawerAccount();assert.equal(els.get('drawerUserName').textContent,ctx.user.email);});
 test('Sair da conta limpa imediatamente a identidade visual',()=>{const {ctx,els}=fixture();ctx.__edifiqProfile={id:'a',nome:'Alef'};ctx.edifiqRenderAccountForUser(null);assert.equal(ctx.__edifiqProfile,null);assert.equal(els.get('drawerUserName').textContent,'Minha conta');assert.equal(els.get('drawerUserEmail').textContent,'');});
 const h=fixture();h.ctx.user={id:'b',email:'b@exemplo.invalid'};h.ctx.__edifiqProfile={id:'a',nome:'Alef'};let requestedId;
 h.ctx.sb={auth:{getSession:async()=>({data:{session:{user:h.ctx.user}}})},from:()=>({select:()=>({eq:(_,id)=>{requestedId=id;return {maybeSingle:async()=>({error:Error('sem rede')})};}})})};await h.ctx.loadProfile6();
 test('Falha de leitura não reutiliza perfil de outra conta',()=>{assert.equal(requestedId,'b');assert.equal(h.ctx.__edifiqProfile,null);});
 const race=fixture();race.ctx.user={id:'a',email:'a@exemplo.invalid'};let finish,started;
 const ready=new Promise(r=>started=r);race.ctx.sb={auth:{getSession:async()=>({data:{session:{user:race.ctx.user}}})},from:()=>({select:()=>({eq:()=>({maybeSingle:()=>{started();return new Promise(r=>finish=r);}})})})};const query=race.ctx.loadProfile6();await ready;race.ctx.user={id:'b',email:'b@exemplo.invalid'};finish({data:{id:'a',nome:'Alef'}});await query;race.ctx.renderDrawerAccount();
 test('Resposta atrasada da conta anterior não substitui perfil atual',()=>{assert.equal(race.ctx.__edifiqProfile,null);assert.equal(race.els.get('drawerUserName').textContent,'b@exemplo.invalid');});
 test('Login e cadastro não mostram preços',()=>{const start=html.indexOf('  function patchAuth10(){'),end=html.indexOf('  patchAuth10();',start);const code=html.slice(start,end);assert.ok(!/R\$|39,90|399,00/.test(code));assert.ok(code.includes('7 dias de teste grátis'));const a=html.indexOf('window.openSignup10='),b=html.indexOf('window.criarContaEdifiq10=',a);assert.ok(a>0&&b>a);assert.ok(!/R\$/.test(html.slice(a,b)));});
 test('Transição de sessão limpa identidade antes de carregar dados',()=>{const a=html.indexOf('sb.auth.onAuthStateChange((event,session)=>{'),b=html.indexOf('setTimeout(async()=>{',a);assert.ok(html.slice(a,b).includes('edifiqRenderAccountForUser(session?.user||null)'));});
 console.log(count+' verificações de login e identidade aprovadas; somente contas demonstrativas.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
