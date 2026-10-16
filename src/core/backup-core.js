(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.EdificBackupCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const FORMAT='EDIFIC_BACKUP';
  const VERSION='11.0';
  const TABLES=Object.freeze(['obras','funcionarios','checklist','servicos_adicionais','servicos','terceirizados','orcamentos','diarias','gastos','pagamentos','faltas','adiantamentos','diario','presencas','pagamentos_terceirizados']);
  const CRITICAL=Object.freeze(['funcionarios','diarias','gastos','pagamentos','faltas','adiantamentos']);
  const MONEY_TABLES=new Set(['diarias','gastos','pagamentos','adiantamentos']);
  const AUX_KEYS=Object.freeze(['funcionarioObras','adiantamentosAplicados','servicosAdicionais','diariasBaixadas']);

  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const cents=value=>Math.round((Number(value)||0)*100);
  const rowMoney=row=>Number(row?.valor??row?.valor_pago??row?.valor_baixado??0)||0;
  function stable(value){
    if(Array.isArray(value)) return '['+value.map(stable).join(',')+']';
    if(value&&typeof value==='object') return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';
    return JSON.stringify(value);
  }
  function fallbackIdentity(table,row,index){return `raw:${table}:${index}:${stable(row)}`}
  function identity(table,row,index=0){
    if(row?.operation_id) return 'op:'+String(row.operation_id);
    if(row?.client_operation_id) return 'cop:'+String(row.client_operation_id);
    if(row?.id!=null&&String(row.id)!=='') return 'id:'+String(row.id);
    return fallbackIdentity(table,row,index);
  }
  function dedupeRows(table,rows){
    const map=new Map();
    (Array.isArray(rows)?rows:[]).forEach((row,index)=>{
      const key=identity(table,row,index),copy=clone(row);
      map.set(key,map.has(key)?{...map.get(key),...copy}:copy);
    });
    return [...map.values()];
  }
  function normalizeData(data){
    const out={};
    for(const table of TABLES) out[table]=dedupeRows(table,data?.[table]);
    return out;
  }
  function signature(data){
    const src=normalizeData(data),out={};
    for(const table of TABLES){
      const rows=src[table];
      out[table]={count:rows.length};
      if(MONEY_TABLES.has(table)) out[table].sum_cents=rows.reduce((sum,row)=>sum+cents(rowMoney(row)),0);
    }
    return out;
  }
  function totalRecords(sig){return TABLES.reduce((n,t)=>n+Number(sig?.[t]?.count||0),0)}
  function diffSignatures(expected,actual,tables=TABLES){
    const diffs=[];
    for(const table of tables){
      const e=expected?.[table]||{},a=actual?.[table]||{};
      if(Number(e.count||0)!==Number(a.count||0)) diffs.push({table,field:'count',expected:Number(e.count||0),actual:Number(a.count||0)});
      if(e.sum_cents!=null&&Number(e.sum_cents)!==Number(a.sum_cents||0)) diffs.push({table,field:'sum_cents',expected:Number(e.sum_cents),actual:Number(a.sum_cents||0)});
    }
    return diffs;
  }
  function auxFrom(source){
    const out={};for(const key of AUX_KEYS)out[key]=clone(source?.[key]||{});return out;
  }
  function legacyVersion(backup){return String(backup?.version||'').trim()}
  function isSupportedApp(app){return ['EDIFIQ','EDIFIC',FORMAT].includes(String(app||'').toUpperCase())}
  function normalizeBackup(input){
    if(!input||typeof input!=='object'||Array.isArray(input)) throw new Error('Arquivo de backup inválido.');
    if(!isSupportedApp(input.app)&&String(input.format||'').toUpperCase()!==FORMAT) throw new Error('Este arquivo não pertence ao Edific.');
    const version=legacyVersion(input)||'legacy';
    const data=normalizeData(input.data||{}),sig=signature(data),aux=auxFrom(input);
    const warnings=[];
    if(version!=='11.0') warnings.push(`Backup legado ${version}; será validado antes de qualquer gravação.`);
    return {raw:input,version,data,aux,sig,warnings};
  }
  function snapshotFromManifest(backup){
    return backup?.manifest?.integrity_snapshot||backup?.manifest?.signature||null;
  }
  function countsFromManifest(backup){return backup?.manifest?.tables||null}
  function validateBackup(input,options={}){
    const n=normalizeBackup(input),errors=[];
    const manifestSig=snapshotFromManifest(input);
    if(manifestSig){
      errors.push(...diffSignatures(manifestSig,n.sig));
    }else{
      const counts=countsFromManifest(input);
      if(counts){
        for(const table of TABLES){
          if(counts[table]!=null&&Number(counts[table])!==n.sig[table].count) errors.push({table,field:'count',expected:Number(counts[table]),actual:n.sig[table].count});
        }
      }else n.warnings.push('Backup sem manifesto completo; a integridade será conferida pelos dados disponíveis.');
    }
    const declared=Number(input?.manifest?.total_records);
    if(Number.isFinite(declared)&&declared>=0&&declared!==totalRecords(n.sig)) errors.push({table:'manifest',field:'total_records',expected:declared,actual:totalRecords(n.sig)});
    if(errors.length){
      const err=new Error('Backup não passou na conferência de integridade.');err.code='BACKUP_INTEGRITY_MISMATCH';err.diffs=errors;throw err;
    }
    if(options.requireCritical!==false){
      for(const table of CRITICAL) if(!Array.isArray(n.data[table])) throw new Error('Tabela crítica ausente: '+table);
    }
    return {ok:true,version:n.version,total:totalRecords(n.sig),signature:n.sig,warnings:n.warnings,data:n.data,aux:n.aux};
  }
  function createBackup(snapshot={},options={}){
    const data=normalizeData(snapshot.data||snapshot),sig=signature(data),now=options.date||new Date().toISOString();
    const aux=auxFrom(snapshot.aux||snapshot);
    return {
      app:'EDIFIC',format:FORMAT,version:VERSION,
      backup_id:options.backupId||('edific11_'+Date.now()+'_'+Math.random().toString(36).slice(2,9)),
      date:now,scope_hint:options.scopeHint||'',
      manifest:{tables:Object.fromEntries(TABLES.map(t=>[t,sig[t].count])),total_records:totalRecords(sig),restore_mode:'exact-v11',integrity_snapshot:sig,critical_tables:[...CRITICAL]},
      data,...aux,
      photos:clone(snapshot.photos||[]),documents:clone(snapshot.documents||[]),
      warnings:clone(options.warnings||[])
    };
  }
  function mergeData(current,target){
    const out={};
    for(const table of TABLES) out[table]=dedupeRows(table,[...(current?.[table]||[]),...(target?.[table]||[])]);
    return out;
  }
  function planImport(input,current={},options={}){
    const checked=validateBackup(input),mode=options.mode==='merge'?'merge':'exact';
    const before=normalizeData(current),after=mode==='merge'?mergeData(before,checked.data):normalizeData(checked.data);
    return Object.freeze({format:FORMAT,version:VERSION,mode,before:clone(before),after:clone(after),aux:clone(checked.aux),expected:signature(after),sourceExpected:checked.signature,warnings:[...checked.warnings]});
  }
  function verifyApplied(plan,actual){
    if(!plan?.expected) throw new Error('Plano de importação inválido.');
    const got=signature(actual),diffs=diffSignatures(plan.expected,got);
    const criticalDiffs=diffSignatures(plan.expected,got,CRITICAL);
    return {ok:diffs.length===0,criticalOk:criticalDiffs.length===0,diffs,criticalDiffs,actual:got,expected:clone(plan.expected)};
  }
  function assertApplied(plan,actual){
    const result=verifyApplied(plan,actual);
    if(!result.ok){const err=new Error('Importação incompleta. Os dados anteriores devem ser preservados.');err.code='IMPORT_INCOMPLETE';err.diffs=result.diffs;throw err}
    return result;
  }
  function transactionSnapshot(current,plan){return Object.freeze({before:normalizeData(current),after:clone(plan.after),aux:clone(plan.aux),expected:clone(plan.expected)});}

  return Object.freeze({FORMAT,VERSION,TABLES,CRITICAL,AUX_KEYS,cents,identity,normalizeData,signature,totalRecords,diffSignatures,validateBackup,createBackup,planImport,verifyApplied,assertApplied,transactionSnapshot});
});