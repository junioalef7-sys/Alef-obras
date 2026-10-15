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

  function normalizeName65(v){
    return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
  }
  function installReportMatch(){
    const original=window.rtMatchEmployee;
    if(typeof original!=='function')return false;
    if(original.__edifiqReport65)return true;
    const compatible=function(row,func){
      const id=String(func?.id??'');
      const explicit=String(row?.funcionario_id??row?.funcionarioId??row?.funcId??'');
      if(explicit)return explicit===id;
      const name=normalizeName65(func?.nome);
      if(!name)return false;
      const supplier=normalizeName65(row?.fornecedor);
      if(supplier)return supplier===name;
      const description=normalizeName65(row?.descricao);
      if(!description)return false;
      const data=typeof D!=='undefined'?D:window.D;
      const candidates=(Array.isArray(data?.funcionarios)?data.funcionarios:[])
        .map(f=>normalizeName65(f?.nome))
        .filter(n=>n&&description.includes(n))
        .sort((a,b)=>b.length-a.length);
      if(candidates.length)return candidates[0]===name;
      return description===name;
    };
    compatible.__edifiqReport65=true;
    compatible.__edifiqOriginal65=original;
    window.rtMatchEmployee=compatible;
    return true;
  }

  function reportAdvances65(data,id){
    const applied=typeof window.getAdvanceApplied==='function'?window.getAdvanceApplied()||{}:{};
    return (Array.isArray(data?.gastos)?data.gastos:[]).filter(g=>{
      const gid=String(g?.funcionario_id??g?.funcionarioId??'');
      if(gid!==String(id))return false;
      const cat=normalizeName65(g?.categoria||g?.descricao||'');
      return cat.includes('adiantamento')||cat.includes('vale');
    }).map(g=>({
      ...g,
      obra_id:g?.obra_id??g?.obraId??'',
      disponivel:Math.max(0,Number(g?.valor||0)-Number(g?.valor_baixado??applied[g?.id]??0))
    }));
  }
  function reportBalance65(d){
    const C=window.EdifiqRelease27;
    const data=typeof D!=='undefined'?D:window.D;
    if(!C?.payroll||!d?.f?.id||!data)return null;
    const helpers={
      paid:r=>typeof window.diariaEstaPaga==='function'?window.diariaEstaPaga(r):['pago','paid','quitado','liquidado'].includes(normalizeName65(r?.status)),
      daily:r=>typeof window.diariaValor==='function'?window.diariaValor(r):Number(r?.valor_diaria||0)*Number(r?.qtd??r?.quantidade??1),
      days:rows=>typeof window.edifiqDiariasCanonicas==='function'?window.edifiqDiariasCanonicas(rows):rows||[],
      extras:id=>typeof window.getFuncionarioExtras==='function'?window.getFuncionarioExtras(id):(Array.isArray(data?.servicosExtras)?data.servicosExtras:[]).filter(x=>String(x?.funcionario_id??x?.funcionarioId??'')===String(id)),
      advances:id=>reportAdvances65(data,id)
    };
    const bounds=d?.r?{start:d.r.ini,end:d.r.fim}:null;
    return C.payroll(data,d.f.id,{obra:'all',bounds},helpers);
  }
  function installReportBalance(){
    const originalData=window.rtData;
    if(typeof originalData!=='function')return false;
    if(!originalData.__edifiqBalance65){
      const wrappedData=function(){
        const d=originalData.apply(this,arguments);
        if(!d)return d;
        try{
          const balance=reportBalance65(d);
          if(balance){
            d.balance=balance;
            d.pendDiarias=balance.pendingDiarias;
            d.totalExtras=balance.extrasTotal;
            d.totalAdiant=balance.advance;
            d.diasTrabalhados=(Array.isArray(balance.days)?balance.days:[]).reduce((sum,row)=>sum+Number(row?.qtd??row?.quantidade??1),0);
          }
        }catch(e){console.warn('EDIFIQ relatório saldo 65:',e)}
        return d;
      };
      wrappedData.__edifiqBalance65=true;
      wrappedData.__edifiqOriginal65=originalData;
      window.rtData=wrappedData;
    }
    const originalBuild=window.rtBuildHtml;
    if(typeof originalBuild==='function'&&!originalBuild.__edifiqBalance65){
      const wrappedBuild=function(){
        let html=originalBuild.apply(this,arguments);
        try{
          const d=window.rtData?.();
          if(d?.balance){
            const value=typeof window.rtMoney==='function'?window.rtMoney(d.balance.net):Number(d.balance.net||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
            html=String(html).replace(/(<small>Saldo estimado pendente<\/small><b>)[\s\S]*?(<\/b>)/,'$1'+value+'$2');
          }
        }catch(e){console.warn('EDIFIQ relatório HTML 65:',e)}
        return html;
      };
      wrappedBuild.__edifiqBalance65=true;
      wrappedBuild.__edifiqOriginal65=originalBuild;
      window.rtBuildHtml=wrappedBuild;
    }
    return true;
  }

  function install(){
    const money=installMoney();
    const progress=installProgress();
    installReportMatch();
    installReportBalance();
    return money&&progress;
  }
  window.edifiqInstallCoreFix65=install;

  if(!install()){
    const retry=()=>{installMoney();installProgress();installReportMatch();installReportBalance()};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',retry,{once:true});
    else setTimeout(retry,0);
  }
})();