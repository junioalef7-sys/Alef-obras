(()=>{'use strict';
if(window.__OBRIX_BACKUP_COMPLETO)return;window.__OBRIX_BACKUP_COMPLETO=true;
const TABELAS=['obras','clientes','fornecedores','funcionarios','servicos_extras','checklist_itens','diarios_obra','diario_atividades','diario_equipe','notas','diarias','faltas','vales','bonus_extras','pagamentos_equipe','pagamento_diarias','pagamento_vales','pagamento_bonus_extras','financeiro','materiais','estoques','estoque_saldos','estoque_movimentacoes','compras','compra_itens','orcamentos','orcamento_itens','documentos','relatorios','relatorios_fotograficos','fotos_obra','relatorio_fotos'];
const ORDEM=['obras','clientes','fornecedores','funcionarios','servicos_extras','checklist_itens','diarios_obra','diario_atividades','diario_equipe','notas','diarias','faltas','vales','bonus_extras','pagamentos_equipe','pagamento_diarias','pagamento_vales','pagamento_bonus_extras','materiais','estoques','estoque_saldos','estoque_movimentacoes','compras','compra_itens','financeiro','orcamentos','orcamento_itens','documentos','relatorios','relatorios_fotograficos','fotos_obra','relatorio_fotos'];
let arquivo=null;const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function lerTudo(sb,tabela,empresa){let out=[],ini=0;const lote=500;for(;;){const r=await sb.from(tabela).select('*',{count:'exact'}).eq('empresa_id',empresa).range(ini,ini+lote-1);if(r.error)throw r.error;const rows=r.data||[];out.push(...rows);if(rows.length<lote){if(typeof r.count==='number'&&out.length!==r.count)throw new Error(`${tabela}: esperado ${r.count}, lido ${out.length}.`);return out}ini+=lote}}
async function gerar(ev){const btn=ev.target.closest?.('#backupGerar');if(!btn)return;ev.preventDefault();ev.stopImmediatePropagation();const box=document.getElementById('backupStatus');btn.disabled=true;btn.textContent='Gerando backup completo...';if(box){box.classList.remove('hidden');box.innerHTML='<div class="muted">Lendo todos os registros, sem limite de quantidade...</div>'}try{const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile(),dados={},contagens={},erros=[];for(const t of TABELAS){try{dados[t]=await lerTudo(sb,t,p.empresa_id);contagens[t]=dados[t].length}catch(e){dados[t]=[];contagens[t]=0;erros.push({tabela:t,erro:e?.message||String(e)})}}if(erros.length)throw new Error('Backup interrompido para não gerar arquivo incompleto: '+erros.map(x=>x.tabela).join(', '));const backup={obrix_backup:2,app:'OBRIX',versao:'2026.11.06-backup-dados',inclui_arquivos_storage:false,gerado_em:new Date().toISOString(),empresa_id:p.empresa_id,completo:true,integridade:{contagens,total_registros:Object.values(contagens).reduce((a,b)=>a+b,0),tabelas:TABELAS},dados};const txt=JSON.stringify(backup),blob=new Blob([txt],{type:'application/json'}),nome=`OBRIX_BACKUP_COMPLETO_${new Date().toISOString().slice(0,10)}.json`;if(box)box.innerHTML=`<div class="backupResultado ok"><strong>Backup completo conferido</strong><span>${backup.integridade.total_registros.toLocaleString('pt-BR')} registros em ${TABELAS.length} módulos. Dados conferidos; fotos e documentos do Storage não estão incluídos neste JSON.</span></div>`;try{const f=new File([blob],nome,{type:'application/json'});if(navigator.share&&navigator.canShare?.({files:[f]})){await navigator.share({files:[f],title:'Backup completo OBRIX'});return}}catch(e){if(e?.name==='AbortError')return}const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=nome;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000)}catch(e){if(box)box.innerHTML=`<div class="backupResultado erro"><strong>Backup não foi salvo</strong><span>${esc(e?.message||e)} Corrija a pendência antes de gerar o arquivo.</span></div>`;else alert(e?.message||e)}finally{btn.disabled=false;btn.textContent='Gerar backup completo'}}
async function capturar(ev){if(ev.target?.id!=='backupArquivo')return;const f=ev.target.files?.[0];if(!f)return;try{const raw=JSON.parse((await f.text()).replace(/^\uFEFF/,'').trim());if((raw?.obrix_backup===1||raw?.obrix_backup===2)&&raw?.dados){arquivo=raw;setTimeout(()=>botaoImportar(),120);setTimeout(()=>botaoImportar(),500)}}catch(_){arquivo=null}}
// Esta versão somente verifica arquivos, não executa INSERT, UPDATE, UPSERT ou DELETE.
// O procedimento de restauração será habilitado após homologação em ambiente separado.
function botaoImportar(){
  if(!arquivo)return;
  const box=document.getElementById('backupConferencia');
  if(!box||box.querySelector('#backupRestaurarPrevia'))return;
  const total=Object.values(arquivo.dados||{}).reduce((n,v)=>n+(Array.isArray(v)?v.length:0),0);
  const d=document.createElement('div');d.className='backupExecBox';
  d.innerHTML=`<button class="btn" id="backupRestaurarPrevia">Conferir restauração (sem alterar dados)</button><div id="backupRestaurarStatus" class="muted">Arquivo com ${total.toLocaleString('pt-BR')} registros. A análise compara os IDs com os dados da sua empresa e identifica possíveis conflitos; não restaura registros.</div>`;
  box.appendChild(d);
  d.querySelector('button').onclick=conferirRestauracao;
}
async function conferirRestauracao(){
  const btn=document.getElementById('backupRestaurarPrevia'),
        st=document.getElementById('backupRestaurarStatus'),b=arquivo;
  if(!btn||!st||!b)return;
  btn.disabled=true;btn.textContent='Conferindo...';
  st.textContent='Verificando integridade e IDs; nenhuma alteração será realizada.';
  try{
    if(b.obrix_backup!==2||b.completo!==true||!b.dados||!b.integridade)
      throw new Error('Use um backup completo OBRIX versão 2. Arquivos antigos devem ser reexportados antes de restaurar.');
    const p=await OBRIX_BACKEND.profile();
    if(!p?.empresa_id||!b.empresa_id||String(b.empresa_id)!==String(p.empresa_id))
      throw new Error('O arquivo não pertence à conta atual. Nenhuma operação foi permitida.');
    const declared=b.integridade.contagens||{};
    const list=b.integridade.tabelas||[];
    if(!Array.isArray(list)||TABELAS.some(t=>!list.includes(t)))
      throw new Error('Arquivo incompleto: nem todas as tabelas do backup estão presentes.');
    let total=0;
    const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for(const t of TABELAS){
      const rows=b.dados[t];
      if(!Array.isArray(rows)||Number(declared[t])!==rows.length)
        throw new Error('Contagem divergente ou tabela ausente: '+t);
      const ids=new Set();
      for(const row of rows){
        if(!row||!uuid.test(String(row.id||'')))
          throw new Error('Registro sem ID válido na tabela: '+t);
        if(String(row.empresa_id||'')!==String(p.empresa_id))
          throw new Error('Registro de outra empresa na tabela: '+t);
        if(ids.has(String(row.id)))
          throw new Error('IDs duplicados dentro do arquivo: '+t);
        ids.add(String(row.id));
      }
      total+=rows.length;
    }
    if(total!==Number(b.integridade.total_registros))
      throw new Error('O total do arquivo não corresponde ao somatório das tabelas.');
    const sb=await OBRIX_BACKEND.init();
    let existentes=0,ausentes=0;
    const resultados=[];
    for(const t of TABELAS){
      const ids=b.dados[t].map(x=>String(x.id));
      if(!ids.length)continue;
      let encontrados=0;
      for(let i=0;i<ids.length;i+=100){
        const r=await sb.from(t).select('id').eq('empresa_id',p.empresa_id).in('id',ids.slice(i,i+100));
        if(r.error)throw new Error('Não foi possível comparar '+t+': '+r.error.message);
        encontrados+=(r.data||[]).length;
      }
      existentes+=encontrados;ausentes+=ids.length-encontrados;
      resultados.push([t,encontrados,ids.length-encontrados]);
    }
    const detalhes=resultados.map(x=>`<div>${esc(x[0])}: ${x[1]} existentes, ${x[2]} ausentes</div>`).join('');
    st.innerHTML=`<div class="backupResultado ok"><strong>Prévia concluída, sem gravar dados</strong>
       <span>${total.toLocaleString('pt-BR')} registros conferidos: ${existentes.toLocaleString('pt-BR')} existentes e ${ausentes.toLocaleString('pt-BR')} ausentes.</span>
       <span>Fotos e documentos armazenados no Storage não fazem parte do arquivo JSON.</span>
       <span>A restauração permanece desabilitada até ser validada em ambiente de teste.</span></div>
       <details><summary>Comparação por módulo</summary>${detalhes}</details>`;
    btn.textContent='Conferência concluída';
  }catch(e){
    st.textContent='Prévia interrompida: '+String(e?.message||e);
    btn.disabled=false;btn.textContent='Tentar conferir novamente';
  }
}
document.addEventListener('click',gerar,true);document.addEventListener('change',capturar,true);new MutationObserver(()=>botaoImportar()).observe(document.documentElement,{childList:true,subtree:true});})();