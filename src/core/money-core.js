(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.EdificMoneyCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function toCents(value){
    if(value==null||value==='') return 0;
    if(typeof value==='number'){
      if(!Number.isFinite(value)) throw new Error('Valor monetário inválido.');
      return Math.round((value+Number.EPSILON)*100);
    }
    let s=String(value).trim().replace(/\s+/g,'').replace(/^R\$/i,'');
    if(!s) return 0;
    const negative=/^-/.test(s);s=s.replace(/[^0-9,.-]/g,'').replace(/-/g,'');
    const lastComma=s.lastIndexOf(','),lastDot=s.lastIndexOf('.');
    let dec=-1;
    if(lastComma>=0&&lastDot>=0) dec=Math.max(lastComma,lastDot);
    else if(lastComma>=0) dec=lastComma;
    else if(lastDot>=0){
      const digitsAfter=s.length-lastDot-1;
      dec=digitsAfter<=2?lastDot:-1;
    }
    let whole,frac='';
    if(dec>=0){whole=s.slice(0,dec).replace(/[.,]/g,'');frac=s.slice(dec+1).replace(/[.,]/g,'')}else whole=s.replace(/[.,]/g,'');
    whole=whole||'0';frac=(frac+'00').slice(0,2);
    const result=Number(whole)*100+Number(frac||0);
    if(!Number.isSafeInteger(result)) throw new Error('Valor monetário fora do limite seguro.');
    return negative?-result:result;
  }
  function fromCents(cents){
    const n=Number(cents||0);if(!Number.isSafeInteger(n))throw new Error('Centavos inválidos.');return n/100;
  }
  function format(cents){return fromCents(cents).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
  function sum(values){return (values||[]).reduce((a,v)=>a+toCents(v),0);}
  function pct(part,total){const p=Number(part||0),t=Number(total||0);return t===0?0:(p/t)*100;}
  function margin(receipts,expenses){const r=Number(receipts||0),e=Number(expenses||0);return r===0?0:((r-e)/r)*100;}
  function clampNonNegative(cents){return Math.max(0,Number(cents||0));}
  return Object.freeze({toCents,fromCents,format,sum,pct,margin,clampNonNegative});
});