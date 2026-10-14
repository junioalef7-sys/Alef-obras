const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const workflow=fs.readFileSync('.github/workflows/publish.yml','utf8');
const code=workflow.slice(workflow.indexOf("checkout_patch =")).match(/<script id="edifiqCheckoutDirect51Script">([\s\S]*?)<\/script>/)[1];
function fixture(){
 const buttons=[{textContent:'Assinar Mensal',dataset:{},disabled:false},{textContent:'Assinar Anual',dataset:{},disabled:false}];
 let resolve,calls=0;const nav=[],events={},messages=[];
 const response=new Promise(r=>resolve=r);
 const w={location:{assign:u=>nav.push(u)},addEventListener:(n,f)=>events[n]=f,open:()=>{throw Error('Não deve abrir aba')}};
 const d={getElementById:()=>null,querySelectorAll:()=>buttons,readyState:'complete',documentElement:{}};
 const c={window:w,document:d,URL,console,MutationObserver:class{observe(){}},localStorage:{setItem(){}},location:{href:'https://junioalef7-sys.github.io/Alef-obras/'},user:{id:'fixture'},sb:{functions:{invoke:async(n,args)=>{calls++;assert.equal(args.body.forma,'mercado_pago');return response}}},toast:m=>messages.push(m)};
 vm.runInNewContext(code,c);return{w,buttons,nav,events,messages,resolve,calls:()=>calls};
}
(async()=>{
 let f=fixture();let a=f.w.assinarPlanoEdifiq11('mensal');await f.w.assinarPlanoEdifiq11('anual');assert.equal(f.calls(),1);assert.ok(f.buttons.every(b=>b.disabled));f.events.pageshow({persisted:false});assert.equal(f.w.__edifiqBillingBusy,true);
 f.resolve({data:{checkout_url:'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=fixture'}});await a;assert.equal(f.nav.length,1);await f.w.assinarPlanoEdifiq11('mensal');assert.equal(f.calls(),1);f.events.pageshow({persisted:true});assert.ok(f.buttons.every(b=>!b.disabled));assert.equal(f.buttons[0].textContent,'Assinar Mensal');
 f=fixture();a=f.w.assinarPlanoEdifiq11('anual');f.resolve({error:{message:'Sem conexão'}});await a;assert.equal(f.nav.length,0);assert.ok(f.buttons.every(b=>!b.disabled));assert.equal(f.w.__edifiqBillingBusy,false);
 f=fixture();a=f.w.assinarPlanoEdifiq11('mensal');f.resolve({data:{checkout_url:'https://mercadopago.com.br.evil.example/'}});await a;assert.equal(f.nav.length,0);assert.equal(f.w.__edifiqBillingBusy,false);
 f=fixture();await f.w.assinarPlanoEdifiq11('invalido');assert.equal(f.calls(),0);
 f=fixture();a=f.w.assinarPlanoEdifiq11('anual');f.resolve({data:{checkout_url:'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=annual'}});await a;assert.equal(f.nav.length,1);
 console.log('6 verificações checkout aprovadas: navegação única, clique duplicado, retorno, erro, URL e planos. Sem cobranças reais.');
})().catch(e=>{console.error(e);process.exit(1)});
