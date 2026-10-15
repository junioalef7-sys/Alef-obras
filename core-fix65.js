(function(){
  'use strict';

  function centsSafe(v){
    let s=typeof v==='string'?v.trim().replace(/R\$|\s/g,''):v;
    if(typeof s==='string'&&s.includes(','))s=s.replace(/\./g,'').replace(',','.');
    const n=Number(s||0);
    if(!Number.isFinite(n))throw new Error('Informe um valor válido.');
    const sign=n<0?-1:1;
    return sign*Math.round((Math.abs(n)+Number.EPSILON)*100);
  }
  window.edifiqCentsSafe65=centsSafe;

  function installMoney(){
    const C=window.EdifiqRelease27;
    if(!C||typeof C.cents!=='function')return false;
    if(!C.cents.__edifiqMoney65){
      const originalCents=C.cents;
      const patched=function(v){return centsSafe(v)};
      patched.__edifiqMoney65=true;
      patched.__edifiqOriginal65=originalCents;
      C.cents=patched;
    }
    if(typeof C.stageFinance==='function'&&!C.stageFinance.__edifiqStage65){
      const originalStage=C.stageFinance;
      const stagePatched=function(data,rows,obra,distribution){
        const source=data&&typeof data==='object'?data:{};
        const workSeen=new Set();
        const obras=(Array.isArray(source.obras)?source.obras:[]).filter(o=>{
          const id=String(o?.id??'');
          if(workSeen.has(id))return false;
          workSeen.add(id);return true;
        });
        const stageSeen=new Set();
        const checklist=(Array.isArray(source.checklist)?source.checklist:[]).map(c=>({
          ...c,
          obra_id:c?.obra_id??c?.obraId??'',
          id:c?.id??c?.checklist_id??c?.checklistId??''
        })).filter(c=>{
          const key=String(c.obra_id)+'|'+String(c.id);
          if(stageSeen.has(key))return false;
          stageSeen.add(key);return true;
        });
        const normalizedRows=(Array.isArray(rows)?rows:[]).map(r=>({
          ...r,
          obra_id:r?.obra_id??r?.obraId??'',
          checklist_id:r?.checklist_id??r?.checklistId??''
        }));
        return originalStage.call(this,{...source,obras,checklist},normalizedRows,obra,distribution);
      };
      stagePatched.__edifiqStage65=true;
      stagePatched.__edifiqOriginal65=originalStage;
      C.stageFinance=stagePatched;
    }
    return true;
  }

  function installProgress(){
    const original=window.obraProgress;
    if(typeof original!=='function')return false;
    if(original.__edifiqCompat65)return true;
    function compatible(obraOuId){
      let obra=obraOuId;
      if(obraOuId!=null&&typeof obraOuId!=='object'){
        const data=typeof D!=='undefined'?D:window.D;
        const obras=Array.isArray(data?.obras)?data.obras:[];
        obra=obras.find(o=>String(o?.id)===String(obraOuId))||{id:obraOuId};
      }
      return original.call(this,obra);
    }
    compatible.__edifiqCompat65=true;
    compatible.__edifiqOriginal65=original;
    window.obraProgress=compatible;
    return true;
  }

  function install(){
    const money=installMoney();
    const progress=installProgress();
    return money&&progress;
  }
  window.edifiqInstallCoreFix65=install;

  if(!install()){
    const retry=()=>{installMoney();installProgress()};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',retry,{once:true});
    else setTimeout(retry,0);
  }
})();