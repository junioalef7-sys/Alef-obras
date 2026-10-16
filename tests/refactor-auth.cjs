const assert=require('node:assert/strict');
const {createAuthController,STATES}=require('../src/core/auth-controller.js');

function fakeClient(opts={}){
  let listener=null;
  let session=opts.session||null;
  let unsubscribed=false;
  return {
    auth:{
      onAuthStateChange(cb){listener=cb;return{data:{subscription:{unsubscribe(){unsubscribed=true}}}}},
      async getSession(){if(opts.getSessionError)return{data:{session:null},error:opts.getSessionError};return{data:{session},error:null}},
      async signInWithPassword({email,password}){
        if(opts.signInError)return{data:{session:null},error:opts.signInError};
        session={access_token:'a',refresh_token:'r',user:{id:'u1',email}};
        return{data:{session},error:null};
      },
      async signOut(){if(opts.signOutError)throw opts.signOutError;session=null;return{error:null}}
    },
    emit(event,nextSession){listener?.(event,nextSession)},
    get unsubscribed(){return unsubscribed}
  };
}

async function tick(){await new Promise(r=>setTimeout(r,0))}

(async()=>{
  {
    const c=fakeClient({session:{user:{id:'u1',email:'a@b.com'}}});
    const auth=createAuthController({getClient:async()=>c,timeoutMs:1000});
    const s=await auth.bootstrap();
    assert.equal(s.status,STATES.SIGNED_IN);
    assert.equal(s.user.id,'u1');
    auth.destroy();
    assert.equal(c.unsubscribed,true);
  }

  {
    const c=fakeClient();
    const auth=createAuthController({getClient:async()=>c,timeoutMs:1000});
    const s=await auth.bootstrap();
    assert.equal(s.status,STATES.SIGNED_OUT);
    assert.equal(s.user,null);
  }

  {
    const c=fakeClient();
    const auth=createAuthController({getClient:async()=>c,timeoutMs:1000});
    await auth.bootstrap();
    const s=await auth.signIn(' TEST@EXAMPLE.COM ','secret');
    assert.equal(s.status,STATES.SIGNED_IN);
    assert.equal(s.user.email,'test@example.com');
  }

  {
    const c=fakeClient({signInError:new Error('invalid login credentials')});
    const auth=createAuthController({getClient:async()=>c,timeoutMs:1000});
    await auth.bootstrap();
    await assert.rejects(()=>auth.signIn('x@y.com','bad'),/invalid login credentials/);
    const s=auth.getState();
    assert.equal(s.status,STATES.SIGNED_OUT);
    assert.equal(s.event,'SIGN_IN_ERROR');
  }

  {
    const c=fakeClient();
    const auth=createAuthController({getClient:async()=>c,timeoutMs:1000});
    await auth.bootstrap();
    c.emit('PASSWORD_RECOVERY',{user:{id:'u2',email:'r@e.com'}});
    await tick();
    assert.equal(auth.getState().status,STATES.RECOVERY);
    c.emit('SIGNED_IN',{user:{id:'u2',email:'r@e.com'}});
    await tick();
    assert.equal(auth.getState().status,STATES.SIGNED_IN);
  }

  {
    const c=fakeClient({signOutError:new Error('offline')});
    const auth=createAuthController({getClient:async()=>c,timeoutMs:1000});
    await auth.bootstrap();
    const s=await auth.signOut();
    assert.equal(s.status,STATES.SIGNED_OUT);
    assert.equal(s.user,null);
  }

  {
    const auth=createAuthController({getClient:()=>new Promise(()=>{}),timeoutMs:1000});
    const started=Date.now();
    const s=await auth.bootstrap();
    assert.equal(s.status,STATES.ERROR);
    assert.ok(Date.now()-started>=900);
  }

  console.log('REFACTOR AUTH OK');
})().catch(err=>{console.error(err);process.exit(1)});
