const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8'),workflow=fs.readFileSync('.github/workflows/publish.yml','utf8');
const asaas=html.match(/<script id="edifiq-asaas-final">([\s\S]*?)<\/script>/)[1];
const bridge=workflow.slice(workflow.indexOf('checkout_patch =')).match(/<script id="edifiqCheckoutDirect51Script">([\s\S]*?)<\/script>/)[1];
function fixture(){
 let resolve,calls=0;const nav=[],messages=[],events={},buttons=[{disabled:false,dataset:{}}],response=new Promise(r=>resolve=r);
 const d={getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>buttons,readyState:'loading',body:{},documentElement:{},addEventListener(){}};
 const w={addEventListener:(n,f)=>events[n]=f};const c={document:d,window:w,URL,NodeFilter:{SHOW_TEXT:4},MutationObserver:class{observe(){}},setTimeout(){},console:{error(){}},localStorage:{setItem(){}},location:{href:'https://junioalef7-sys.github.io/Alef-obras/',assign:u=>nav.push(u)},toast:m=>messages.push(m),sb:{functions:{invoke:async(name,args)=>{calls++;assert.equal(name,'edifiq-assinatura-checkout');assert.ok(['cartao','pix','boleto'].includes(args.body.forma));return response}}}};vm.createContext(c);vm.runInContext(asaas,c);vm.runInContext(bridge,c);return{c,w,buttons,nav,messages,events,resolve,calls:()=>calls};
}
(async()=>{
 for(const forma of ['cartao','pix','boleto']){
  const f=fixture();if(forma==='boleto')f.c.document.querySelector=s=>({value:s==='#edAsaasNome'?'Fixture':'12345678901'});
  const a=f.w.edifiqAsaasContinuar('mensal',forma);await f.w.edifiqAsaasContinuar('mensal',forma);assert.equal(f.calls(),1);assert.ok(f.buttons.every(b=>b.disabled));f.resolve({data:{checkout_url:'https://www.asaas.com/checkoutSession/show?id=fixture'}});await a;assert.equal(f.nav.length,1);assert.equal(f.w.__edifiqBillingBusy,true);f.events.pageshow({persisted:true});assert.equal(f.w.__edifiqBillingBusy,false);
 }
 let f=fixture(),a=f.w.edifiqAsaasContinuar('anual','cartao');f.resolve({error:{message:'Sem conexão'}});await a;assert.equal(f.nav.length,0);assert.equal(f.w.__edifiqBillingBusy,false);assert.equal(f.buttons[0].disabled,false);
 f=fixture();a=f.w.edifiqAsaasContinuar('anual','pix');f.resolve({data:{checkout_url:'https://asaas.com.evil.example/'}});await a;assert.equal(f.nav.length,0);
 f=fixture();await f.w.edifiqAsaasContinuar('invalido','pix');assert.equal(f.calls(),0);
 f=fixture();let selected;f.w.edifiqAsaasEscolher=p=>selected=p;f.w.assinarPlanoEdifiq11('anual');assert.equal(selected,'anual');f.w.edifiqPagar47('mensal');assert.equal(selected,'mensal');
 const mod=html.match(/<script id="edifiq-etapa14-script">([\s\S]*?)<\/script>/)[1];assert.ok(mod.includes("location.assign(new URL('./exclusao-conta.html',location.href).href)"));assert.ok(!mod.includes("insert({user_id:u.id,empresa_user_id:u.id,status:'solicitada'"));
 console.log('8 verificações de checkout/exclusão aprovadas: Asaas, 3 formas, clique único, erros, segurança, aliases e exclusão definitiva.');
})().catch(e=>{console.error(e);process.exit(1)});
