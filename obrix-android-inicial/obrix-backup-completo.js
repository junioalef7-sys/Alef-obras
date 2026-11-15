(()=>{'use strict';
if(window.__OBRIX_BACKUP_COMPLETO)return;window.__OBRIX_BACKUP_COMPLETO=true;
const TABELAS=['obras','clientes','fornecedores','funcionarios','servicos_extras','checklist_itens','diarios_obra','diario_atividades','diario_equipe','notas','diarias','faltas','vales','bonus_extras','pagamentos_equipe','pagamento_diarias','pagamento_vales','pagamento_bonus_extras','financeiro','materiais','estoques','estoque_saldos','estoque_movimentacoes','compras','compra_itens','orcamentos','orcamento_itens','documentos','relatorios','relatorios_fotograficos','fotos_obra','relatorio_fotos'];
const ORDEM=['obras','clientes','fornecedores','funcionarios','servicos_extras','checklist_itens','diarios_obra','diario_atividades','diario_equipe','notas','diarias','faltas','vales','bonus_extras','pagamentos_equipe','pagamento_diarias','pagamento_vales','pagamento_bonus_extras','materiais','estoques','estoque_saldos','estoque_movimentacoes','compras','compra_itens','financeiro','orcamentos','orcamento_itens','documentos','relatorios','relatorios_fotograficos','fotos_obra','relatorio_fotos'];
let arquivo=null;const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function lerTudo(sb,tabela,empresa){let out=[],ini=0;const lote=500;for(;;){const r=await sb.from(tabela).select('*',{count:'exact'}).eq('empresa_id',empresa).range(ini,ini+lote-1);if(r.error)throw r.error;const rows=r.data||[];out.push(...rows);if(rows.length<lote){if(typeof r.count==='number'&&out.length!==r.count)throw new Error(`${tabela}: esperado ${r.count}, lido ${out.length}.`);return out}ini+=lote}}
async function gerar(ev){const btn=ev.target.closest?.('#backupGerar');if(!btn)return;ev.preventDefault();ev.stopImmediatePropagation();const box=document.getElementById('backupStatus');btn.disabled=true;btn.textContent='Gerando backup completo...';if(box){box.classList.remove('hidden');box.innerHTML='<div class="muted">Lendo todos os registros, sem limite de quantidade...</div>'}try{const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile(),dados={},contagens={},erros=[];for(const t of TABELAS){try{dados[t]=await lerTudo(sb,t,p.empresa_id);contagens[t]=dados[t].length}catch(e){dados[t]=[];contagens[t]=0;erros.push({tabela:t,erro:e?.message||String(e)})}}if(erros.length)throw new Error('Backup interrompido para não gerar arquivo incompleto: '+erros.map(x=>x.tabela).join(', '));const backup={obrix_backup:2,app:'OBRIX',versao:'2026.10.20-backup-completo',gerado_em:new Date().toISOString(),empresa_id:p.empresa_id,completo:true,integridade:{contagens,total_registros:Object.values(contagens).reduce((a,b)=>a+b,0),tabelas:TABELAS},dados};const txt=JSON.stringify(backup),blob=new Blob([txt],{type:'application/json'}),nome=`OBRIX_BACKUP_COMPLETO_${new Date().toISOString().slice(0,10)}.json`;if(box)box.innerHTML=`<div class="backupResultado ok"><strong>Backup completo conferido</strong><span>${backup.integridade.total_registros.toLocaleString('pt-BR')} registros em ${TABELAS.length} módulos. Nenhuma tabela foi cortada.</span></div>`;try{const f=new File([blob],nome,{type:'application/json'});if(navigator.share&&navigator.canShare?.({files:[f]})){await navigator.share({files:[f],title:'Backup completo OBRIX'});return}}catch(e){if(e?.name==='AbortError')return}const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=nome;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000)}catch(e){if(box)box.innerHTML=`<div class="backupResultado erro"><strong>Backup não foi salvo</strong><span>${esc(e?.message||e)} Corrija a pendência antes de gerar o arquivo.</span></div>`;else alert(e?.message||e)}finally{btn.disabled=false;btn.textContent='Gerar backup completo'}}
async function capturar(ev){
 if(ev.target?.id!=='backupArquivo')return;
 const f=ev.target.files?.[0];
 if(!f)return;
 arquivo=null;
 // Remover a ação do arquivo anterior; nunca misturar backup OBRIX com migração EDIFIQ.
 document.getElementById('backupRestaurarCompleto')?.closest('.backupExecBox')?.remove();
 try{
   const raw=JSON.parse((await f.text()).replace(/^\uFEFF/,'').trim());
   if((raw?.obrix_backup===1||raw?.obrix_backup===2)&&
      String(raw.app||'').toUpperCase()==='OBRIX'&&raw?.dados&&
      raw?.completo!==false){
     arquivo=raw;
     setTimeout(()=>botaoImportar(),120);
     setTimeout(()=>botaoImportar(),500);
   }
 }catch(_){arquivo=null}
}
function botaoImportar(){if(!arquivo)return;const box=document.getElementById('backupConferencia');if(!box||box.querySelector('#backupRestaurarCompleto'))return;const total=Object.values(arquivo.dados||{}).reduce((n,v)=>n+(Array.isArray(v)?v.length:0),0),d=document.createElement('div');d.className='backupExecBox';d.innerHTML=`<button class="btn" id="backupRestaurarCompleto">Restaurar backup OBRIX (${total.toLocaleString('pt-BR')} registros)</button><div id="backupRestaurarStatus" class="muted">A restauração confere cada módulo e não considera concluída se algum registro ficar faltando.</div>`;box.appendChild(d);document.getElementById('backupRestaurarCompleto').onclick=restaurar}
async function idsExistentes(sb,tabela,empresa,ids){
 const unicos=[...new Set(ids.map(id=>String(id)))];
 const r=await sb.from(tabela).select('id').eq('empresa_id',empresa).in('id',unicos);
 if(r.error)throw new Error(tabela+': falha ao conferir registros existentes: '+r.error.message);
 return new Set((r.data||[]).map(x=>String(x.id)));
}
async function restaurar(){
 if(!arquivo?.dados)return;
 const btn=document.getElementById('backupRestaurarCompleto');
 const st=document.getElementById('backupRestaurarStatus');
 if(!btn||!st)return;
 const permitido=await window.OBRIX_CONFIRMAR_EXCLUSAO({
   titulo:'Restaurar backup',
   mensagem:'Restaurar este backup do OBRIX?\n\nRegistros existentes serão preservados. Somente os registros ausentes serão adicionados. Pagamentos e históricos atuais não serão sobrescritos.',
   confirmar:'Restaurar dados'
 });
 if(!permitido)return;
 btn.disabled=true;
 let recuperados=0,preservados=0,conferidos=0;
 try{
   const [sb,p]=await Promise.all([OBRIX_BACKEND.init(),OBRIX_BACKEND.profile()]);
   if(!p?.empresa_id)throw new Error('Não foi possível identificar a empresa. Faça login novamente.');
   if(arquivo.empresa_id&&String(arquivo.empresa_id)!==String(p.empresa_id))
     throw new Error('Este backup pertence a outra empresa. A restauração foi bloqueada por segurança.');
   for(const t of ORDEM){
     const rows=Array.isArray(arquivo.dados[t])?arquivo.dados[t]:[];
     if(!rows.length)continue;
     st.textContent='Conferindo '+t+'...';
     for(let i=0;i<rows.length;i+=100){
       const lote=rows.slice(i,i+100);
       if(lote.some(x=>!x||typeof x!=='object'||x.id==null||String(x.id).trim()===''))
         throw new Error(t+': o backup contém registro sem identificador. Nenhum registro existente foi substituído.');
       const ids=lote.map(x=>String(x.id));
       const presentes=await idsExistentes(sb,t,p.empresa_id,ids);
       const faltantes=lote.filter(x=>!presentes.has(String(x.id))).map(x=>({...x,empresa_id:p.empresa_id}));
       if(faltantes.length){
         const r=await sb.from(t).insert(faltantes);
         if(r.error)throw new Error(t+': '+r.error.message);
         recuperados+=faltantes.length;
       }
       const depois=await idsExistentes(sb,t,p.empresa_id,ids);
       if(ids.some(id=>!depois.has(id)))
         throw new Error(t+': não foi possível confirmar todos os registros do arquivo.');
       preservados+=lote.length-faltantes.length;
       conferidos+=lote.length;
     }
   }
   st.textContent='Restauração concluída e conferida: '+recuperados.toLocaleString('pt-BR')+
     ' registro(s) recuperado(s) e '+preservados.toLocaleString('pt-BR')+
     ' registro(s) existente(s) preservado(s).';
   btn.textContent='Backup conferido e restaurado';
   setTimeout(()=>location.reload(),1500);
 }catch(e){
   st.textContent='Restauração interrompida. Conferidos '+conferidos.toLocaleString('pt-BR')+
     ' registro(s); '+recuperados.toLocaleString('pt-BR')+
     ' recuperado(s). Nenhum registro existente foi sobrescrito. Motivo: '+String(e?.message||e);
   btn.disabled=false;btn.textContent='Tentar restaurar novamente';
 }
}
document.addEventListener('click',gerar,true);document.addEventListener('change',capturar,true);
// O estado do arquivo é atualizado pelo input e pela conferência, sem observar todo o DOM.
window.addEventListener('obrix:backup-conferencia-pronta',botaoImportar);
})();