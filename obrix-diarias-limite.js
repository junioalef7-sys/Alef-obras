(()=>{'use strict';
if(window.OBRIX_DIARIA_LIMITE)return;
const Q='obrix_equipe_offline_v1',BASE='obrix_offline_base_v3';
const msg='Este funcionário já atingiu o limite de 1 diária inteira ou 2 meias diárias nesta data. A regra vale mesmo em obras diferentes.';
function listarStorage(chave){try{const a=JSON.parse(localStorage.getItem(chave)||'null');return Array.isArray(a)?a:[]}catch{return[]}}
function pendentes(empresa,funcionario,data){
 return listarStorage(Q).filter(x=>{
  const d=x?.payload||x;
  return x?.type==='diaria'&&String(d?.empresa_id)===String(empresa)
    &&String(d?.funcionario_id)===String(funcionario)&&String(d?.data)===String(data)
    &&!d?.cancelada_em;
 }).map(x=>x.payload||x);
}
function existentesOffline(empresa,funcionario,data){
 let base=[];try{base=JSON.parse(localStorage.getItem(BASE)||'null')?.diarias||[]}catch{}
 const w=Array.isArray(window.diarias)?window.diarias:[];
 const rows=[...w,...base,...pendentes(empresa,funcionario,data)],map=new Map();
 rows.forEach(d=>{
  if(String(d?.empresa_id)!==String(empresa)||String(d?.funcionario_id)!==String(funcionario)||
     String(d?.data)!==String(data)||d.cancelada_em)return;
  const id=String(d.id||[d.funcionario_id,d.data,d.obra_id,d.quantidade].join(':'));
  map.set(id,d);
 });
 return [...map.values()];
}
function avalia(rows,quantidade){
 const valid=quantidade===0.5||quantidade===1;
 if(!valid)return{ok:false,mensagem:'Selecione uma diária inteira ou meia diária.'};
 const soma=rows.reduce((n,d)=>n+Number(d.quantidade||0),0);
 if(soma+quantidade>1.0000001||rows.length>=2)return{ok:false,mensagem:msg};
 return{ok:true,restante:Math.max(0,1-soma-quantidade)};
}
async function validar({empresa_id,funcionario_id,data,quantidade,sb,offline=false}){
 const q=Number(quantidade);
 if(!empresa_id||!funcionario_id||!/^\d{4}-\d{2}-\d{2}$/.test(String(data)))
  return{ok:false,mensagem:'Informe funcionário e data para registrar a diária.'};
 if(q!==0.5&&q!==1)return avalia([],q);
 if(offline){
  const result=avalia(existentesOffline(empresa_id,funcionario_id,data),q);
  return result;
 }
 try{
  const client=sb||await window.OBRIX_BACKEND.init();
  const r=await client.from('diarias')
   .select('id,empresa_id,funcionario_id,data,quantidade,cancelada_em')
   .eq('empresa_id',empresa_id).eq('funcionario_id',funcionario_id)
   .eq('data',data).is('cancelada_em',null);
  if(r.error)throw r.error;
  const dataRows=Array.isArray(r.data)?r.data:[];
  const found=new Map(dataRows.map(d=>[String(d.id),d]));
  pendentes(empresa_id,funcionario_id,data).forEach(d=>found.set(String(d.id),d));
  return avalia([...found.values()],q);
 }catch(e){
  console.warn('OBRIX: falha ao validar limite de diárias',e);
  return{ok:false,mensagem:'Não foi possível verificar as diárias desta data. Confira a conexão e tente novamente.'};
 }
}
function mensagemErro(err){
 const raw=String(err?.message||err||'');
 if(/OBRIX_DIARIA_LIMITE_DIA|obrix_diarias_limite_dia/.test(raw))return msg;
 if(/OBRIX_DIARIA_QUANTIDADE|obrix_diaria_quantidade/.test(raw))return'Selecione uma diária inteira ou meia diária.';
 return window.OBRIX_PT_ERROR?.(err)||raw;
}
window.OBRIX_DIARIA_LIMITE={validar,mensagemErro,avaliar:avalia,mensagem:msg};
})();
