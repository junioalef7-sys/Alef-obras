(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.EdificAuthCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const STATES=Object.freeze({
    IDLE:'idle',
    CHECKING:'checking',
    SIGNED_OUT:'signed_out',
    SIGNED_IN:'signed_in',
    RECOVERY:'password_recovery',
    ERROR:'error'
  });

  function createAuthController(options={}){
    const getClient=options.getClient;
    if(typeof getClient!=='function') throw new Error('getClient é obrigatório.');

    const timeoutMs=Math.max(1000,Number(options.timeoutMs||8000));
    const listeners=new Set();
    let state={status:STATES.IDLE,session:null,user:null,error:null,event:null};
    let authSubscription=null;
    let bound=false;
    let destroyed=false;
    let operationSeq=0;

    function snapshot(){ return {...state}; }
    function emit(next){
      state={...state,...next};
      const snap=snapshot();
      for(const fn of listeners){ try{fn(snap)}catch(err){console.warn('EdificAuth listener',err)} }
      try{ options.onStateChange?.(snap); }catch(err){console.warn('EdificAuth onStateChange',err)}
      return snap;
    }

    function deadline(promise,label='Operação de autenticação',ms=timeoutMs){
      let timer;
      return Promise.race([
        Promise.resolve(promise).finally(()=>clearTimeout(timer)),
        new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' excedeu o tempo limite.')),ms)})
      ]);
    }

    async function client(){
      const c=await deadline(getClient(),'Conexão com autenticação');
      if(!c?.auth) throw new Error('Cliente de autenticação indisponível.');
      return c;
    }

    function applySession(session,event){
      if(destroyed) return snapshot();
      if(event==='PASSWORD_RECOVERY'){
        return emit({status:STATES.RECOVERY,session:session||null,user:session?.user||null,error:null,event});
      }
      if(session?.user){
        return emit({status:STATES.SIGNED_IN,session,user:session.user,error:null,event:event||'SESSION'});
      }
      return emit({status:STATES.SIGNED_OUT,session:null,user:null,error:null,event:event||'NO_SESSION'});
    }

    async function bind(){
      if(bound||destroyed) return;
      const c=await client();
      const result=c.auth.onAuthStateChange?.((event,session)=>{
        if(destroyed) return;
        // O listener apenas atualiza estado. Sync, billing e renderização pertencem a outros módulos.
        queueMicrotask(()=>applySession(session,event));
      });
      authSubscription=result?.data?.subscription||result?.subscription||null;
      bound=true;
    }

    async function bootstrap(){
      const seq=++operationSeq;
      emit({status:STATES.CHECKING,error:null,event:'BOOTSTRAP'});
      try{
        const c=await client();
        await bind();
        const result=await deadline(c.auth.getSession(),'Confirmação da sessão');
        if(seq!==operationSeq||destroyed) return snapshot();
        if(result?.error) throw result.error;
        return applySession(result?.data?.session||null,'INITIAL_SESSION');
      }catch(error){
        if(seq!==operationSeq||destroyed) return snapshot();
        emit({status:STATES.ERROR,session:null,user:null,error,event:'BOOTSTRAP_ERROR'});
        return snapshot();
      }
    }

    async function signIn(email,password){
      const normalized=String(email||'').trim().toLowerCase();
      if(!normalized||!password) throw new Error('Informe e-mail e senha.');
      const seq=++operationSeq;
      emit({status:STATES.CHECKING,error:null,event:'SIGN_IN_START'});
      try{
        const c=await client();
        await bind();
        const result=await deadline(c.auth.signInWithPassword({email:normalized,password}),'Login');
        if(seq!==operationSeq||destroyed) return snapshot();
        if(result?.error) throw result.error;
        const session=result?.data?.session||null;
        if(!session?.user) throw new Error('O servidor não retornou uma sessão válida.');
        return applySession(session,'SIGNED_IN');
      }catch(error){
        if(seq!==operationSeq||destroyed) return snapshot();
        emit({status:STATES.SIGNED_OUT,session:null,user:null,error,event:'SIGN_IN_ERROR'});
        throw error;
      }
    }

    async function signOut(){
      ++operationSeq;
      try{
        const c=await client();
        await deadline(c.auth.signOut(),'Saída da conta');
      }catch(error){
        // O estado local precisa encerrar mesmo se a rede falhar.
        console.warn('EdificAuth signOut remoto',error);
      }
      return applySession(null,'SIGNED_OUT');
    }

    function subscribe(fn){
      if(typeof fn!=='function') throw new Error('Listener inválido.');
      listeners.add(fn);
      fn(snapshot());
      return ()=>listeners.delete(fn);
    }

    function getState(){ return snapshot(); }

    function destroy(){
      destroyed=true;
      ++operationSeq;
      listeners.clear();
      try{authSubscription?.unsubscribe?.()}catch(_){ }
      authSubscription=null;
      bound=false;
    }

    return Object.freeze({
      STATES,
      bootstrap,
      signIn,
      signOut,
      subscribe,
      getState,
      destroy,
      deadline
    });
  }

  return Object.freeze({STATES,createAuthController});
});
