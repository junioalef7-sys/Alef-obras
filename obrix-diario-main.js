(()=>{'use strict';
const $=id=>document.getElementById(id),today=()=>new Date().toISOString().slice(0,10),escHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const JSPDF_SRC='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
let diarios=[],pdfPromise=null,loadPromise=null,rerunLoad=false,loadedOnce=false,lastHistorySignature='',noticeTimer=null,ultimaConsultaObras=0;
const off=()=>window.OBRIX_OFFLINE_DIARIO;
const ptError=e=>window.OBRIX_PT_ERROR?.(e)||(e?.message||String(e||'Não foi possível concluir.'));
function ensure(){
  if(document.getElementById('diarioMain'))return;
  const app=document.getElementById('app'),bottom=app?.querySelector('.bottom');
  if(!app||!bottom)return;
  const main=document.createElement('main');
  main.id='diarioMain';main.className='hidden';
  main.innerHTML=`<div class="hero"><h1>Diário de Obras</h1><p>Registre o andamento diário de cada obra</p></div>
  <div class="diarioKpis"><div class="diarioKpi"><small>Registros</small><strong id="diarioKTotal">0</strong></div><div class="diarioKpi"><small>Finalizados</small><strong id="diarioKFinal">0</strong></div><div class="diarioKpi"><small>Rascunhos</small><strong id="diarioKRasc">0</strong></div></div>
  <div class="card diarioForm"><div class="sectionHead"><strong id="diarioFormTitle">Novo diário</strong><button class="btn diarioAtualizar" type="button">Atualizar</button></div><input id="diarioId" type="hidden">
  <div class="diarioGrid2"><label>Obra<input id="diarioObraBusca" type="search" list="diarioObraSugestoes" placeholder="Buscar obra pelo nome..." autocomplete="off" aria-label="Buscar obra para o diário"><datalist id="diarioObraSugestoes"></datalist><select id="diarioObra"></select></label><label>Data<input id="diarioData" type="date"></label></div>
  <div class="diarioGrid3"><label>Clima<select id="diarioClima"><option>Ensolarado</option><option>Nublado</option><option>Chuvoso</option><option>Parcialmente nublado</option></select></label><label>Temperatura<input id="diarioTemperatura" placeholder="Ex.: 28°C"></label><label>Status<select id="diarioStatus"><option value="rascunho">Rascunho</option><option value="finalizado">Finalizado</option></select></label></div>
  <label>Serviços executados<textarea id="diarioServicos" placeholder="Ex.: Alvenaria, reboco, pintura..."></textarea></label>
  <label>Ocorrências<textarea id="diarioOcorrencias" placeholder="Ex.: Sem ocorrências"></textarea></label>
  <label>Materiais utilizados<textarea id="diarioMateriais" placeholder="Ex.: Cimento, areia, blocos..."></textarea></label>
  <label>Equipamentos utilizados<textarea id="diarioEquipamentos" placeholder="Ex.: Betoneira, andaime..."></textarea></label>
  <label>Observações<textarea id="diarioObs"></textarea></label>
  <div class="diarioActions"><button class="btn" id="diarioSalvar" type="button">Salvar diário</button><button class="btn diarioSecundario hidden" id="diarioCancelar" type="button">Cancelar edição</button></div><div id="diarioMsg" class="diarioMsg hidden"></div></div>
  <div class="card"><div class="sectionHead"><strong>Histórico da obra</strong><span class="muted">Toque em um registro para abrir</span></div><div id="diarioLista"></div></div>`;
  app.insertBefore(main,bottom);
  main.querySelector('.diarioAtualizar').onclick=()=>load().catch(showError);
  $('diarioObra').onchange=()=>{sincronizarBuscaDiario();render()};$('diarioObraBusca').oninput=selecionarBuscaDiario;$('diarioObraBusca').onchange=selecionarBuscaDiario;
  $('diarioSalvar').onclick=save;
  $('diarioCancelar').onclick=resetForm;
}
function showMsg(text,ok=true){
   const el=$('diarioMsg');if(!el)return;
   clearTimeout(noticeTimer);
   el.textContent=text;el.className='diarioMsg '+(ok?'ok':'erro');
   if(ok&&/salvo com sucesso|atualizado com sucesso|salvo e sincronizado/i.test(text)){
     noticeTimer=setTimeout(()=>{if(el.textContent===text)el.classList.add('hidden')},4500);
   }
 }
function showError(e){showMsg('Erro: '+ptError(e),false)}
function normalizarBuscaDiario(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function sincronizarBuscaDiario(){
 const sel=$('diarioObra'),campo=$('diarioObraBusca'),lista=$('diarioObraSugestoes');if(!sel||!campo||!lista)return;
 const opts=[...sel.options].filter(o=>o.value),contagem=new Map();
 opts.forEach(o=>{const k=normalizarBuscaDiario(o.textContent);contagem.set(k,(contagem.get(k)||0)+1)});
 const rows=opts.map(o=>({id:o.value,rotulo:contagem.get(normalizarBuscaDiario(o.textContent))>1?o.textContent+' • '+o.value.slice(0,8):o.textContent}));
 sel.__buscaDiarioOpcoes=rows;lista.replaceChildren(...rows.map(x=>new Option(x.rotulo)));
 if(document.activeElement===campo){selecionarBuscaDiario();return}
 const atual=rows.find(x=>x.id===sel.value);campo.value=atual?.rotulo||'';
}
function selecionarBuscaDiario(){
 const sel=$('diarioObra'),campo=$('diarioObraBusca');if(!sel||!campo)return;
 const q=normalizarBuscaDiario(campo.value),rows=sel.__buscaDiarioOpcoes||[];
 const exatos=rows.filter(o=>normalizarBuscaDiario(o.rotulo)===q),similares=rows.filter(o=>normalizarBuscaDiario(o.rotulo).includes(q));
 const item=q?(exatos.length===1?exatos[0]:(similares.length===1?similares[0]:null)):null;
 const atual=sel.value;sel.value=item?.id||'';if(sel.value!==atual)render();
}
function fillObras(){
   const sel=$('diarioObra');if(!sel)return false;
   if(document.activeElement===sel&&sel.options.length){
     if(sel.dataset.obrixPendente!=='1'){
       sel.dataset.obrixPendente='1';
       sel.addEventListener('blur',()=>{delete sel.dataset.obrixPendente;fillObras()},{once:true});
     }
     return false;
   }
   const obras=(window.obras||[]).filter(o=>o?.status==='andamento');
   const next=obras.length?obras.map(o=>({id:String(o.id),nome:String(o.nome||'Obra')})):[{id:'',nome:'Nenhuma obra em andamento'}];
   const atual=Array.from(sel.options).map(o=>({id:String(o.value),nome:String(o.textContent)}));
   if(JSON.stringify(next)===JSON.stringify(atual))return false;
   const old=sel.value;
   sel.replaceChildren(...next.map(o=>{const op=document.createElement('option');op.value=o.id;op.textContent=o.nome;return op}));
   if(next.some(o=>o.id===old))sel.value=old;
   sincronizarBuscaDiario();return true;
 }
function currentRows(){const oid=$('diarioObra')?.value;return diarios.filter(d=>String(d.obra_id)===String(oid)).sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')))}
function render(){const rows=currentRows();$('diarioKTotal').textContent=String(rows.length);$('diarioKFinal').textContent=String(rows.filter(x=>x.status==='finalizado').length);$('diarioKRasc').textContent=String(rows.filter(x=>x.status!=='finalizado').length);const box=$('diarioLista');if(!box)return;const chave=String($('diarioObra')?.value||'')+'|'+JSON.stringify(rows);if(chave===lastHistorySignature&&box.hasChildNodes())return;lastHistorySignature=chave;if(!rows.length){box.innerHTML='<div class="muted diarioVazio">Nenhum diário registrado para esta obra.</div>';return}box.innerHTML=rows.map(d=>{const aguardando=!!d.__offline;return `<div class="diarioItem" data-id="${escHtml(d.id)}"><button class="diarioItemHead" type="button"><span><b>${escHtml(formatDate(d.data))}</b><small>${escHtml(d.clima||'Sem clima')}${d.temperatura?' • '+escHtml(d.temperatura):''}</small></span><span class="diarioBadge ${aguardando?'offline':d.status==='finalizado'?'finalizado':''}">${aguardando?'Aguardando sincronização':d.status==='finalizado'?'Finalizado':'Rascunho'}</span></button><div class="diarioItemBody hidden"><div class="diarioResumo"><b>Serviços executados</b><p>${escHtml(d.servicos_executados||'Não informado')}</p><b>Ocorrências</b><p>${escHtml(d.ocorrencias||'Sem ocorrências')}</p><b>Materiais utilizados</b><p>${escHtml(d.materiais_utilizados||'Não informado')}</p><b>Equipamentos utilizados</b><p>${escHtml(d.equipamentos_utilizados||'Não informado')}</p>${d.observacoes?`<b>Observações</b><p>${escHtml(d.observacoes)}</p>`:''}</div><div class="diarioActions"><button class="btn diarioPdf" type="button">Visualizar PDF</button><button class="btn editar" type="button">Editar</button><button class="btn diarioPerigo excluir" type="button">Excluir</button></div></div></div>`}).join('');box.querySelectorAll('.diarioItem').forEach(el=>{const d=rows.find(x=>String(x.id)===String(el.dataset.id));if(!d)return;el.querySelector('.diarioItemHead').onclick=()=>el.querySelector('.diarioItemBody').classList.toggle('hidden');el.querySelector('.diarioPdf').onclick=()=>abrirPdf(d);el.querySelector('.editar').onclick=()=>edit(d);el.querySelector('.excluir').onclick=()=>removeD(d)})}
function formatDate(v){if(!v)return'';const [y,m,d]=String(v).slice(0,10).split('-');return d&&m&&y?`${d}/${m}/${y}`:v}
function resetForm(){if(!$('diarioId'))return;$('diarioId').value='';$('diarioData').value=today();$('diarioClima').value='Ensolarado';$('diarioTemperatura').value='';$('diarioStatus').value='rascunho';$('diarioServicos').value='';$('diarioOcorrencias').value='';$('diarioMateriais').value='';$('diarioEquipamentos').value='';$('diarioObs').value='';document.querySelectorAll('#diarioEquipeBox input[type=checkbox]').forEach(x=>x.checked=false);$('diarioFormTitle').textContent='Novo diário';$('diarioCancelar').classList.add('hidden');$('diarioMsg').classList.add('hidden')}
function edit(d){$('diarioId').value=d.id;$('diarioObra').value=d.obra_id;sincronizarBuscaDiario();$('diarioData').value=d.data;$('diarioClima').value=d.clima||'Ensolarado';$('diarioTemperatura').value=d.temperatura||'';$('diarioStatus').value=d.status||'rascunho';$('diarioServicos').value=d.servicos_executados||'';$('diarioOcorrencias').value=d.ocorrencias||'';$('diarioMateriais').value=d.materiais_utilizados||'';$('diarioEquipamentos').value=d.equipamentos_utilizados||'';$('diarioObs').value=d.observacoes||'';const ids=new Set((d.equipe_ids||[]).map(String));document.querySelectorAll('#diarioEquipeBox input[type=checkbox]').forEach(x=>x.checked=ids.has(String(x.value)));$('diarioFormTitle').textContent='Editar diário';$('diarioCancelar').classList.remove('hidden');scrollTo({top:0,behavior:'smooth'})}
function perfilAtual(){try{return typeof profile!=='undefined'&&profile?profile:null}catch{return null}}
function payloadAtual(){return {obra_id:$('diarioObra').value,data:$('diarioData').value,clima:$('diarioClima').value,temperatura:$('diarioTemperatura').value.trim()||null,servicos_executados:$('diarioServicos').value.trim()||null,ocorrencias:$('diarioOcorrencias').value.trim()||null,materiais_utilizados:$('diarioMateriais').value.trim()||null,equipamentos_utilizados:$('diarioEquipamentos').value.trim()||null,observacoes:$('diarioObs').value.trim()||null,status:$('diarioStatus').value,equipe_ids:[...document.querySelectorAll('#diarioEquipeBox input[type=checkbox]:checked')].map(x=>x.value),atualizado_em:new Date().toISOString()}}
function carregarLocal(msg='Modo offline: exibindo dados salvos neste aparelho.'){
    if(!navigator.onLine)off()?.restoreBase?.();
    diarios=off()?.rows?.()||[];
    fillObras();if(!$('diarioData').value)$('diarioData').value=today();
    render();showMsg(msg,true);
 }
async function load(){
  ensure();
  // Um novo evento durante uma leitura exige no máximo uma nova conferência,
  // nunca várias leituras simultâneas nem re-renderizações em cascata.
  if(loadPromise){rerunLoad=true;return loadPromise}
  loadPromise=(async()=>{
    if(!navigator.onLine&&off()){carregarLocal();return}
    if(!navigator.onLine){
      if(off()?.restoreBase?.())carregarLocal();
      return;
    }
    // A sessão do Supabase pode estar válida antes da variável global profile.
    // Isso não pode impedir a leitura online dos diários nem das obras.
    try{
      if(!window.obras?.length||Date.now()-ultimaConsultaObras>60000){
        const obrasServidor=await OBRIX_BACKEND.readTable('obras','criado_em');
        if(Array.isArray(obrasServidor)){
          if(obrasServidor.length||!window.obras?.length)window.obras=obrasServidor;
          ultimaConsultaObras=Date.now();
        }
      }
      const server=await OBRIX_BACKEND.readTable('diarios_obra','data')||[];
      const merged=off()?.merge?.(server)||server;
      const mudou=!loadedOnce||JSON.stringify(diarios)!==JSON.stringify(merged);
      const listaMudou=fillObras();
      if(mudou){
        diarios=merged;
        off()?.saveCache?.(server);
      }
      loadedOnce=true;
      if(!$('diarioData').value)$('diarioData').value=today();
      if(mudou||listaMudou)render();
    }catch(e){
      if(!loadedOnce){
        const cached=off()?.rows?.()||[];
        if(cached.length){diarios=cached;fillObras();render();showMsg('Não foi possível consultar o servidor. Exibindo diário salvo no aparelho.',false)}
        else showError(e);
      }else console.warn('Diário: conferência remota será repetida',e);
    }
  })().finally(()=>{
    loadPromise=null;
    if(rerunLoad){rerunLoad=false;setTimeout(()=>{if(!document.hidden)void load()},280)}
  });
  return loadPromise;
}
async function save(){
 const oid=$('diarioObra')?.value,date=$('diarioData')?.value;
 if(!oid||!date){showMsg('Selecione a obra e a data.',false);return}
 const btn=$('diarioSalvar');
 if(!btn||btn.disabled)return;
 const id=$('diarioId')?.value||'';
 let p=perfilAtual(),persistido=false;
 const payload=payloadAtual();
 btn.disabled=true;
 try{
  if(!p?.empresa_id&&navigator.onLine)p=await OBRIX_BACKEND.profile();
  if(!p?.empresa_id&&off()?.restoreBase?.())p=perfilAtual();
  if(!p?.empresa_id)throw new Error('Conta não identificada. Entre uma vez conectado antes de salvar offline.');
  // Validação para novos diários e edições: histórico preservado,
  // mas somente obras atualmente em andamento aceitam alterações.
  const localObra=(window.obras||[]).find(o=>String(o.id)===String(oid));
  if(!navigator.onLine){
    if(localObra?.status!=='andamento')throw new Error('Somente obras em andamento podem receber diários.');
  }else{
    const db=await OBRIX_BACKEND.init();
    const checagem=await db.from('obras').select('status').eq('id',oid).eq('empresa_id',p.empresa_id).maybeSingle();
    if(checagem.error)throw checagem.error;
    if(checagem.data?.status!=='andamento')throw new Error('Somente obras em andamento podem receber diários.');
  }
  const local={...payload,empresa_id:p.empresa_id};
  const registrarLocal=()=>{
    const localId=off()?.add?.(local,String(id).startsWith('offline-')?id:null);
    if(!localId)throw new Error('O Diário não foi gravado no aparelho. Verifique o armazenamento disponível.');
    persistido=true;
    return localId;
  };
  if(!navigator.onLine||String(id).startsWith('offline-')){
    registrarLocal();
    let sincronizado=false;
    if(navigator.onLine)sincronizado=await off()?.sync?.().catch(()=>false)===true;
    resetForm();
    if(navigator.onLine)void load();else carregarLocal();
    showMsg(sincronizado?'Diário salvo e sincronizado.':'Diário salvo no aparelho. Sincronização pendente.');
    return;
  }
  const sb=await OBRIX_BACKEND.init();
  const q=id?sb.from('diarios_obra').update(payload).eq('id',id).eq('empresa_id',p.empresa_id).select('id'):
    sb.from('diarios_obra').insert({...payload,empresa_id:p.empresa_id}).select('id');
  const r=await q;
  if(r.error)throw r.error;
  if(!r.data?.length)throw new Error('O banco não confirmou a gravação do diário.');
  persistido=true;
  resetForm();
  showMsg(id?'Diário atualizado e sincronizado.':'Diário salvo e sincronizado.');
  // Atualiza cache local e comunica outros componentes sem refazer a tela inteira.
  window.dispatchEvent(new CustomEvent('obrix:diario-salvo',{detail:{obra_id:oid,id:r.data?.[0]?.id||id}}));
  void load();
 }catch(e){
  if(persistido){showMsg('Diário registrado. Atualize a lista para conferir.',true);return}
  const msg=e?.message||String(e);
  if(off()&&p?.empresa_id&&(!navigator.onLine||/failed to fetch|network|fetch failed|offline|conex|timeout/i.test(msg))){
    try{
      const localId=off().add({...payload,empresa_id:p.empresa_id},String(id).startsWith('offline-')?id:null);
      if(!localId)throw new Error('Armazenamento local não confirmou a gravação.');
      resetForm();carregarLocal('Diário salvo no aparelho. Sincronização pendente.');
    }catch(localError){showMsg('Não foi possível guardar o diário: '+(localError?.message||localError),false)}
  }else showMsg(msg.includes('duplicate key')?'Já existe um diário para esta obra nessa data.':ptError(e),false);
 }finally{btn.disabled=false}
}
async function removeD(d){if(!await window.OBRIX_CONFIRMAR_EXCLUSAO({titulo:'Excluir diário',mensagem:`Excluir o diário de ${formatDate(d.data)}?`,confirmar:'Excluir'}))return;if(d.__offline&&String(d.id).startsWith('offline-')){off()?.removePending?.(d.id);carregarLocal('Registro offline excluído do aparelho.');return}if(!navigator.onLine)return showMsg('Para excluir um diário já sincronizado, conecte o aparelho à internet.',false);try{const p=perfilAtual(),sb=await OBRIX_BACKEND.init(),{error}=await sb.from('diarios_obra').delete().eq('id',d.id).eq('empresa_id',p.empresa_id);if(error)throw error;await load();showMsg('Diário excluído com sucesso.')}catch(e){showError(e)}}
function ensureJsPdf(){if(window.jspdf?.jsPDF)return Promise.resolve(window.jspdf.jsPDF);if(pdfPromise)return pdfPromise;pdfPromise=new Promise((resolve,reject)=>{if(!navigator.onLine){reject(new Error('Para gerar o PDF pela primeira vez, conecte o aparelho à internet.'));return}let done=false;const finish=(ok,v)=>{if(done)return;done=true;ok?resolve(v):reject(v)};const s=document.createElement('script');s.src=JSPDF_SRC;s.async=true;s.onload=()=>window.jspdf?.jsPDF?finish(true,window.jspdf.jsPDF):finish(false,new Error('Não foi possível iniciar o gerador de PDF.'));s.onerror=()=>finish(false,new Error('Não foi possível carregar o gerador de PDF.'));document.head.appendChild(s);setTimeout(()=>finish(false,new Error('O gerador de PDF demorou demais para carregar.')),10000)}).catch(e=>{pdfPromise=null;throw e});return pdfPromise}
function nomeObra(id){return (window.obras||[]).find(o=>String(o.id)===String(id))?.nome||'Obra'}
function nomesEquipe(ids=[]){const set=new Set((ids||[]).map(String));return (window.funcionarios||[]).filter(f=>set.has(String(f.id))).map(f=>f.nome).filter(Boolean).join(', ')||'Não informada'}
function nomePdf(d){const obra=nomeObra(d.obra_id).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,45)||'obra';return `diario-${obra}-${String(d.data||today()).slice(0,10)}.pdf`}
async function gerarPdfBlob(d){const JsPDF=await ensureJsPdf(),doc=new JsPDF({unit:'mm',format:'a4'}),W=210,M=16,C=W-M*2;let y=18;const pageH=297;function pageIf(h=12){if(y+h>282){doc.addPage();y=18}}function line(label,value){pageIf(9);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(label,M,y);doc.setFont('helvetica','normal');const x=M+doc.getTextWidth(label)+2,txt=doc.splitTextToSize(String(value||'—'),Math.max(30,C-(x-M)));doc.text(txt,x,y);y+=Math.max(6,txt.length*5)}function section(title,value){pageIf(20);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(title,M,y);y+=6;doc.setFont('helvetica','normal');doc.setFontSize(10);const parts=doc.splitTextToSize(String(value||'Não informado'),C);for(const p of parts){pageIf(6);doc.text(p,M,y);y+=5}y+=3}doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text('OBRIX - Diário de Obras',M,y);y+=9;doc.setDrawColor(180);doc.line(M,y,W-M,y);y+=8;line('Obra:',nomeObra(d.obra_id));line('Data:',formatDate(d.data));line('Status:',d.status==='finalizado'?'Finalizado':'Rascunho');line('Clima:',`${d.clima||'Não informado'}${d.temperatura?' • '+d.temperatura:''}`);line('Equipe:',nomesEquipe(d.equipe_ids));y+=4;section('Serviços executados',d.servicos_executados);section('Ocorrências',d.ocorrencias||'Sem ocorrências');section('Materiais utilizados',d.materiais_utilizados);section('Equipamentos utilizados',d.equipamentos_utilizados);if(d.observacoes)section('Observações',d.observacoes);pageIf(15);doc.setFontSize(8);doc.setTextColor(100);doc.text(`Gerado pelo OBRIX em ${new Date().toLocaleString('pt-BR')}`,M,288);return doc.output('blob')}
async function abrirPdf(d){let back=null,url='';try{const blob=await gerarPdfBlob(d);url=URL.createObjectURL(blob);back=document.createElement('div');back.className='diarioPdfBack';back.innerHTML=`<div class="diarioPdfModal"><div class="diarioPdfHead"><div><b>Diário de Obras em PDF</b><small>${escHtml(nomeObra(d.obra_id))} • ${escHtml(formatDate(d.data))}</small></div><div class="diarioPdfActions"><button type="button" class="enviar">Enviar PDF</button><button type="button" class="abrir">Abrir / Imprimir</button><button type="button" class="fechar">Fechar PDF</button></div></div><iframe class="diarioPdfFrame" title="PDF do Diário de Obras"></iframe></div>`;document.body.appendChild(back);document.body.dataset.diarioPdfOverflow=document.body.style.overflow||'';document.body.style.overflow='hidden';back.querySelector('.diarioPdfFrame').src=url;const fechar=()=>{if(!back?.isConnected)return;document.body.style.overflow=document.body.dataset.diarioPdfOverflow||'';delete document.body.dataset.diarioPdfOverflow;back.remove();setTimeout(()=>URL.revokeObjectURL(url),300)};back.querySelector('.fechar').onclick=fechar;back.querySelector('.abrir').onclick=()=>{const w=window.open(url,'_blank');if(!w)alert('Não foi possível abrir o PDF. Verifique se o navegador permite novas janelas.')};back.querySelector('.enviar').onclick=async()=>{const file=new File([blob],nomePdf(d),{type:'application/pdf'});try{if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({title:'Diário de Obras - OBRIX',text:`${nomeObra(d.obra_id)} - ${formatDate(d.data)}`,files:[file]});return}const w=window.open(url,'_blank');if(!w)throw new Error('Não foi possível abrir as opções de compartilhamento.');alert('O compartilhamento direto de arquivo não está disponível neste aparelho. O PDF foi aberto para você enviar pelas opções do navegador.')}catch(e){if(e?.name!=='AbortError')alert(ptError(e))}};back.addEventListener('click',e=>{if(e.target===back)fechar()})}catch(e){if(back)back.remove();if(url)URL.revokeObjectURL(url);alert(ptError(e))}}
function hideOthers(){['inicio','obras','equipe','financeiroMain','estoqueMain','relatoriosMain','backupMain','configMain','assinaturaMain','menuMain'].forEach(id=>document.getElementById(id)?.classList.add('hidden'));document.querySelectorAll('.bottom button').forEach(b=>b.classList.remove('active'))}
function open(){
  ensure();hideOthers();
  $('diarioMain').classList.remove('hidden');
  if(!$('diarioData').value)$('diarioData').value=today();
  // Mostrar o formulário imediatamente; rede é carregada em segundo plano.
  scrollTo({top:0,behavior:'smooth'});
  void load().catch(showError);
}
function wireNavigation(){const oldAbrir=window.abrir;if(typeof oldAbrir==='function'&&!oldAbrir.__obrixDiario){const fn=function(){document.getElementById('diarioMain')?.classList.add('hidden');return oldAbrir.apply(this,arguments)};fn.__obrixDiario=true;window.abrir=fn}['OBRIX_FIN','OBRIX_EST','OBRIX_RELATORIOS','OBRIX_BACKUP','OBRIX_CONFIG','OBRIX_ASSINATURA'].forEach(k=>{const obj=window[k];if(!obj?.open||obj.open.__obrixDiario)return;const old=obj.open.bind(obj);const fn=function(){document.getElementById('diarioMain')?.classList.add('hidden');return old(...arguments)};fn.__obrixDiario=true;obj.open=fn})}
const css=document.createElement('style');css.textContent=`.diarioKpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:14px}.diarioKpi{min-width:0;background:var(--surface,#fff);border:1px solid var(--border,#e2e8f0);border-radius:14px;padding:12px 8px;text-align:center;box-shadow:var(--shadow,none)}.diarioKpi small{display:block;color:var(--muted,#64748b);font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.diarioKpi strong{display:block;font-size:22px;margin-top:4px;color:var(--text,#0f172a)}.diarioForm label{display:block;font-weight:800;margin:10px 0 5px}.diarioForm input,.diarioForm select,.diarioForm textarea{width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:11px;font:inherit;background:#fff;color:#0f172a}.diarioForm textarea{min-height:88px;resize:vertical}.diarioGrid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.diarioGrid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.diarioActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.diarioActions .diarioPdf{background:#1d4ed8!important;color:#fff!important}.diarioSecundario{background:#e2e8f0;color:#0f172a}.diarioPerigo{background:#b91c1c!important;color:#fff!important}.diarioMsg{margin-top:12px;padding:11px;border-radius:10px;font-weight:800}.diarioMsg.ok{background:#dcfce7;color:#166534}.diarioMsg.erro{background:#fee2e2;color:#991b1b}.diarioVazio{padding:15px 0}.diarioItem{border-top:1px solid #e2e8f0}.diarioItem:first-child{border-top:0}.diarioItemHead{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;background:transparent;border:0;padding:15px 0;color:inherit}.diarioItemHead b,.diarioItemHead small{display:block}.diarioItemHead small{color:#64748b;margin-top:4px}.diarioBadge{background:#e2e8f0;color:#334155;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:900}.diarioBadge.finalizado{background:#dcfce7;color:#166534}.diarioBadge.offline{background:#fef3c7;color:#92400e}html[data-theme="dark"] .diarioBadge{background:#243244!important;color:#dbe7f5!important;border:1px solid #3a4b60}html[data-theme="dark"] .diarioBadge.finalizado{background:#123524!important;color:#86efac!important;border-color:#1f5a3a}html[data-theme="dark"] .diarioBadge.offline{background:#422006!important;color:#fde68a!important;border-color:#713f12}html[data-theme="dark"] .diarioKpi{background:#0d1722!important;border-color:#2a3a4d!important}html[data-theme="dark"] .diarioKpi strong{color:#f8fafc!important}.diarioItemBody{padding:0 0 15px}.diarioResumo p{white-space:pre-wrap;margin:4px 0 12px;color:#475569}.diarioPdfBack{position:fixed;inset:0;z-index:10050;background:rgba(2,6,23,.88);padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom));display:flex}.diarioPdfModal{width:min(100%,980px);height:100%;margin:auto;background:#fff;border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 70px rgba(0,0,0,.45)}.diarioPdfHead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px;background:#0f172a;color:#fff}.diarioPdfHead b,.diarioPdfHead small{display:block}.diarioPdfHead small{color:#cbd5e1;margin-top:2px}.diarioPdfActions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.diarioPdfActions button{border:1px solid #475569;background:#1e293b;color:#fff;border-radius:9px;padding:9px 11px;font-weight:850}.diarioPdfActions .enviar{background:#1d4ed8;border-color:#1d4ed8}.diarioPdfActions .fechar{background:#991b1b;border-color:#991b1b}.diarioPdfFrame{flex:1;width:100%;border:0;background:#e5e7eb}@media(max-width:700px){.diarioKpis{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px}.diarioKpi{padding:10px 5px}.diarioKpi small{font-size:10px}.diarioKpi strong{font-size:19px}.diarioGrid2,.diarioGrid3{grid-template-columns:1fr}.diarioItemHead{align-items:flex-start}.diarioActions .btn{flex:1;min-width:110px}.diarioPdfHead{align-items:flex-start;flex-direction:column}.diarioPdfActions{width:100%;display:grid;grid-template-columns:1fr 1fr}.diarioPdfActions .fechar{grid-column:1/-1}.diarioPdfActions button{width:100%}}`;document.head.appendChild(css);
window.addEventListener('obrix:diario-sincronizado',()=>{if(navigator.onLine&&!document.getElementById('diarioMain')?.classList.contains('hidden'))load().catch(()=>{})});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{ensure();wireNavigation()});else{ensure();wireNavigation()}
window.OBRIX_DIARIO={open,load,render,abrirPdf,status:()=>({carregando:!!loadPromise,total:diarios.length,pendentes:off()?.status?.().pendentes||0})};const diarioBuscaDesktopCss=document.createElement('style');diarioBuscaDesktopCss.id='obrixDiarioBuscaObraDesktop';diarioBuscaDesktopCss.textContent='#diarioObraBusca{display:none!important}#diarioObraSugestoes{display:none!important}@media(min-width:761px){#diarioObraBusca{display:block!important;width:100%;min-width:0;margin:5px 0 8px}#diarioObra{display:block!important;width:100%;min-height:45px}}';document.head.appendChild(diarioBuscaDesktopCss);

})();