const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('exclusao-conta.html','utf8').match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import\{createClient\}from'[^']+';/,'');
function fixture({providerId=null,cancelError=false,rpcError=false}={}){
 const elements={};const el=id=>elements[id]||(elements[id]={value:'',checked:false,disabled:false,textContent:'',classList:{add(){},remove(){}}});el('phrase').value='EXCLUIR MINHA CONTA';el('agree').checked=true;
 let rpc=0,cancel=0;const local={fixture_account_cache:'keep',other_account_cache:'keep','sb-lwqntzwajjgkvtynwdjg-auth-token':'secret','account-uid-cache':'own'};
 const store=new Proxy(local,{get(t,k){if(k==='removeItem')return key=>delete t[key];return t[k]}});
 const client={auth:{getSession:async()=>({data:{session:{user:{id:'account-uid',email:'fixture@example.invalid'}}}}),signOut:async()=>({})},from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{provedor:'asaas',provedor_assinatura_id:providerId,provedor_status:'ACTIVE'}})}),functions:{invoke:async()=>{cancel++;return cancelError?{error:{message:'provider error'}}:{data:{ok:true}}}},rpc:async()=>{rpc++;return rpcError?{error:{message:'fixture error'}}:{data:{ok:true,deleted:true}}}};
 const c={createClient:()=>client,document:{getElementById:el},location:{origin:'https://example.invalid',pathname:'/exclusao-conta.html'},console:{error(){},warn(){}},confirm:()=>true,localStorage:store,sessionStorage:{removeItem(){}},setTimeout};vm.createContext(c);vm.runInContext(code,c);return{el,local,rpc:()=>rpc,cancel:()=>cancel};
}
(async()=>{
 let f=fixture();f.el('phrase').value='';await f.el('requestBtn').onclick();assert.equal(f.rpc(),0);
 f=fixture({providerId:'sub_fixture',cancelError:true});await f.el('requestBtn').onclick();assert.equal(f.cancel(),1);assert.equal(f.rpc(),0);assert.equal(f.el('requestBtn').disabled,false);
 f=fixture({providerId:'sub_fixture'});await f.el('requestBtn').onclick();assert.equal(f.cancel(),1);assert.equal(f.rpc(),1);assert.equal(f.local.other_account_cache,'keep');assert.equal(f.local['account-uid-cache'],undefined);
 f=fixture({rpcError:true});await f.el('requestBtn').onclick();assert.equal(f.local['account-uid-cache'],'own');assert.equal(f.el('requestBtn').disabled,false);
 console.log('4 verificações da exclusão aprovadas: confirmação, cancelamento, sucesso e preservação em falha.');
})().catch(e=>{console.error(e);process.exit(1)});
