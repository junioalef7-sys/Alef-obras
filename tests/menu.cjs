const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../.release-base.html'),'utf8');
const classes=()=>{const s=new Set();return{toggle(k,on){on?s.add(k):s.delete(k)},add(k){s.add(k)},remove(k){s.delete(k)},contains(k){return s.has(k)}}};
const button=(name,onclick='')=>({textContent:name,classList:classes(),querySelector:()=>({textContent:name}),getAttribute:()=>onclick});
const buttons=['Diagnóstico do aplicativo','Primeiros passos','Publicação e suporte','Produção • Piloto','Teste final • Piloto','Comercial • Teste','Operação • Pré-lançamento','Clientes • Piloto','Métricas • Piloto','Convites • Piloto','Convites • Piloto','Financeiro','Configurações','Backup'].map(n=>button(n));
const menu={querySelectorAll:()=>buttons,classList:classes(),setAttribute(){}},back={classList:classes(),setAttribute(){}},body={classList:classes()},banner={classList:classes()};
const ctx={window:null,user:null,document:{body,readyState:'complete',getElementById:id=>({menuPasta:menu,menuPastaBackdrop:back,edOnboardingBanner12:banner}[id]),querySelectorAll:()=>[],addEventListener(){}},MutationObserver:class{observe(){}},console};ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(html.match(/<script id="edifiq-final-customer-performance">([\s\S]*?)<\/script>/)[1],ctx);
let count=0;function test(n,fn){fn();console.log('OK',n);count++}
test('Visitante e assinante não acessam ações internas',()=>{for(const u of [null,{id:'demo-client',email:'cliente@exemplo.invalid'}]){ctx.edifiqSetMenuUser45(u);buttons.slice(0,11).forEach(b=>assert.equal(ctx.edifiqMenuAllowed(b),false));buttons.slice(11).forEach(b=>assert.equal(ctx.edifiqMenuAllowed(b),true));assert.equal(body.classList.contains('edAppOwner'),false)}});
test('Proprietário mantém acesso e itens não são apagados',()=>{ctx.edifiqSetMenuUser45({id:'demo-owner',email:'junioalef7@gmail.com'});assert.equal(body.classList.contains('edAppOwner'),true);buttons.forEach(b=>assert.equal(ctx.edifiqMenuAllowed(b),true));assert.equal(buttons.length,14)});
test('Convites duplicados aparecem apenas uma vez',()=>{assert.equal(buttons[9].classList.contains('edMenuDuplicate'),false);assert.equal(buttons[10].classList.contains('edMenuDuplicate'),true)});
test('Sair ou trocar conta revoga visualização administrativa',()=>{ctx.edifiqSetMenuUser45(null);assert.equal(body.classList.contains('edAppOwner'),false);assert.equal(ctx.edifiqMenuAllowed(buttons[0]),false)});
test('Metadados editáveis não dão acesso administrativo',()=>{ctx.edifiqSetMenuUser45({id:'demo',email:'cliente@exemplo.invalid',user_metadata:{email:'junioalef7@gmail.com',role:'admin'}});assert.equal(ctx.edifiqMenuAllowed(buttons[0]),false)});
let handler;ctx.document.addEventListener=(name,fn)=>{if(name==='click')handler=fn};ctx.closeDrawer=()=>{menu.classList.remove('open');back.classList.remove('open')};ctx.actionMap={'Configurações':'openConfiguracoes'};let calls=0;ctx.openConfiguracoes=()=>{assert.equal(menu.classList.contains('open'),false);assert.equal(back.classList.contains('open'),false);calls++};
const start=html.indexOf("document.addEventListener('click',function(event){",html.indexOf('<script id="edifiq-ui29-visao-geral-menu">')),end=html.indexOf("document.addEventListener('keydown'",start);vm.runInContext(html.slice(start,end),ctx);
function click(btn){let stopped=false;handler({target:{closest:()=>btn},preventDefault(){},stopImmediatePropagation(){stopped=true}});return stopped}
test('Um clique fecha o menu e abre configuração exatamente uma vez',()=>{menu.classList.add('open');back.classList.add('open');assert.equal(click(buttons[12]),true);assert.equal(calls,1)});
test('Ação dinâmica mantém handler original sem ser consumida',()=>{menu.classList.add('open');assert.equal(click(buttons[11]),false);assert.equal(menu.classList.contains('open'),false)});
test('Clique em ação administrativa é bloqueado para assinante',()=>{assert.equal(click(buttons[0]),true);assert.equal(calls,1)});
console.log(count+' verificações de menu e perfis aprovadas; somente dados demonstrativos.');
