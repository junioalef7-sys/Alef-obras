(()=>{
'use strict';
if(window.__OBRIX_SUPORTE_MAIN)return;window.__OBRIX_SUPORTE_MAIN=true;

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const pt=e=>window.OBRIX_PT_ERROR?.(e)||e?.message||String(e||'Não foi possível concluir a operação.');
const fmt=v=>{if(!v)return'';try{return new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}catch{return''}};
const cats={duvida:'Dúvida',sugestao:'Sugestão',critica:'Crítica',avaliacao:'Avaliação'};
const sts={aberto:'Aberto',em_atendimento:'Em atendimento',respondido:'Respondido',fechado:'Fechado'};
let main=null,user=null,profile=null,isAdmin=false,tickets=[],selected=null,mode='meus',busy=false,menuHooked=false;

function hideOthers(){
  const app=$('app');if(!app)return;
  app.querySelectorAll(':scope > main').forEach(m=>{if(m.id!=='suporteMain')m.classList.add('hidden')});
  $('menuMain')?.classList.add('hidden');
  document.querySelectorAll('.bottom button').forEach(b=>b.classList.remove('active'));
}

function ensure(){
  if(main)return main;
  const app=$('app'),bottom=app?.querySelector('.bottom');if(!app||!bottom)return null;
  main=document.createElement('main');main.id='suporteMain';main.className='hidden obrixSupport';
  main.innerHTML=`
    <div class="hero supHero"><div><h1>Ajuda e Feedback</h1><p>Tire dúvidas, envie sugestões, críticas e avaliações.</p></div><button type="button" id="supVoltar">Voltar</button></div>
    <div class="supTabs">
      <button type="button" data-sup-tab="novo">Novo contato</button>
      <button type="button" data-sup-tab="meus" class="active">Meus atendimentos</button>
      <button type="button" id="supAdminTab" data-sup-tab="admin" class="hidden">Caixa de Atendimento</button>
    </div>
    <section id="supNovo" class="card hidden">
      <h3>Fale com a OBRIX</h3>
      <p class="muted">Escolha o tipo de contato e escreva sua mensagem. Você poderá acompanhar a resposta aqui.</p>
      <div class="supFormGrid">
        <label>Tipo de contato<select id="supCategoria"><option value="duvida">Dúvida</option><option value="sugestao">Sugestão</option><option value="critica">Crítica</option><option value="avaliacao">Avaliação</option></select></label>
        <label id="supNotaWrap" class="hidden">Avaliação<select id="supNota"><option value="5">5 estrelas</option><option value="4">4 estrelas</option><option value="3">3 estrelas</option><option value="2">2 estrelas</option><option value="1">1 estrela</option></select></label>
      </div>
      <label>Assunto<input id="supAssunto" maxlength="120" placeholder="Ex.: Dúvida sobre relatório fotográfico"></label>
      <label>Mensagem<textarea id="supMensagem" maxlength="4000" rows="6" placeholder="Escreva sua dúvida, sugestão, crítica ou avaliação..."></textarea></label>
      <button type="button" class="btn supPrimary" id="supEnviar">Enviar mensagem</button>
      <div id="supFormStatus" class="status hidden"></div>
    </section>
    <section id="supListaSec">
      <div class="sectionHead"><strong id="supListaTitulo">Meus atendimentos</strong><button type="button" id="supAtualizar" class="btn">Atualizar</button></div>
      <div id="supResumo" class="supResumo"></div>
      <div id="supLista" class="supLista"><div class="card muted">Carregando...</div></div>
    </section>
    <section id="supConversa" class="hidden"></section>`;
  app.insertBefore(main,bottom);
  $('supVoltar').onclick=()=>window.OBRIX_MENU?.open?.()||window.abrir?.('inicio');
  $('supCategoria').onchange=()=>$('supNotaWrap').classList.toggle('hidden',$('supCategoria').value!=='avaliacao');
  $('supEnviar').onclick=criarChamado;
  $('supAtualizar').onclick=()=>loadTickets(true);
  main.querySelectorAll('[data-sup-tab]').forEach(b=>b.onclick=()=>setMode(b.dataset.supTab));
  document.head.appendChild(style());
  installMenuIntegration();
  return main;
}

function style(){
  const s=document.createElement('style');s.id='obrixSupportStyle';s.textContent=`
  .obrixSupport{margin:0}.supHero{display:flex;align-items:center;justify-content:space-between;gap:12px}.supHero button{border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.12);color:#fff;border-radius:11px;padding:11px 15px;font-weight:900}.supTabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}.supTabs button{border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:999px;padding:9px 13px;font-weight:850}.supTabs button.active{background:#0f172a;color:#fff;border-color:#0f172a}.supFormGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.obrixSupport label{display:block;font-weight:800;color:#334155;margin-top:10px}.obrixSupport input,.obrixSupport select,.obrixSupport textarea{width:100%;margin-top:6px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;border-radius:11px;padding:12px;font:inherit}.obrixSupport textarea{resize:vertical;min-height:120px}.supPrimary{margin-top:12px}.supResumo{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:12px}.supResumo>div{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px}.supResumo small{display:block;color:#64748b;font-weight:700}.supResumo strong{display:block;font-size:21px;margin-top:4px}.supLista{display:grid;gap:10px}.supTicket{width:100%;text-align:left;background:#fff;color:#0f172a;border:1px solid #dbe2ea;border-radius:14px;padding:14px;display:grid;gap:7px}.supTicket:hover{border-color:#94a3b8}.supTicketTop{display:flex;align-items:center;justify-content:space-between;gap:10px}.supTicketTop b{font-size:15px}.supMeta{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.supChip{display:inline-flex;border-radius:999px;padding:5px 8px;font-size:11px;font-weight:900;background:#e2e8f0;color:#334155}.supChip.resp{background:#dcfce7;color:#166534}.supChip.aberto{background:#dbeafe;color:#1d4ed8}.supChip.fechado{background:#e2e8f0;color:#475569}.supTicket small{color:#64748b}.supAdminWho{font-size:12px;color:#475569}.supConvHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:12px}.supConvHead h3{margin:0 0 5px}.supMessages{display:grid;gap:10px;margin:14px 0}.supMsg{max-width:82%;border-radius:14px;padding:11px 13px;border:1px solid #e2e8f0;background:#fff}.supMsg.user{justify-self:end;background:#eaf2ff;border-color:#c9daf7}.supMsg.support{justify-self:start;background:#f8fafc}.supMsg small{display:block;margin-top:6px;color:#64748b}.supReply{display:grid;gap:8px}.supReply textarea{min-height:90px}.supAdminActions{display:flex;gap:8px;flex-wrap:wrap}.supAdminActions button{border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:9px;padding:8px 10px;font-weight:800}.supStars{font-size:14px;color:#b45309;font-weight:900}.supEmpty{text-align:center;padding:28px}.supOffline{background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;border-radius:11px;padding:10px;margin-bottom:10px}.supOk{background:#dcfce7!important;color:#166534!important}.supErr{background:#fee2e2!important;color:#991b1b!important}
  html[data-theme="dark"] .supTabs button,html[data-theme="dark"] .supResumo>div,html[data-theme="dark"] .supTicket,html[data-theme="dark"] .supMsg.support,html[data-theme="dark"] .supAdminActions button{background:#0f172a!important;color:#f8fafc!important;border-color:#334155!important}html[data-theme="dark"] .supTabs button.active{background:#e2e8f0!important;color:#0f172a!important}html[data-theme="dark"] .obrixSupport label{color:#e2e8f0!important}html[data-theme="dark"] .obrixSupport input,html[data-theme="dark"] .obrixSupport select,html[data-theme="dark"] .obrixSupport textarea{background:#111827!important;color:#f8fafc!important;border-color:#334155!important}html[data-theme="dark"] .supMsg.user{background:#172554!important;color:#f8fafc!important;border-color:#1e3a8a!important}html[data-theme="dark"] .supAdminWho,html[data-theme="dark"] .supTicket small,html[data-theme="dark"] .supMsg small{color:#cbd5e1!important}@media(max-width:700px){.supFormGrid{grid-template-columns:1fr}.supResumo{grid-template-columns:1fr 1fr}.supMsg{max-width:94%}.supConvHead{flex-direction:column}}
  `;return s;
}

async function session(){
  const sb=await OBRIX_BACKEND.init();
  user=await OBRIX_BACKEND.currentUser();profile=await OBRIX_BACKEND.profile();
  const {data,error}=await sb.from('obrix_admins').select('user_id').eq('user_id',user.id).maybeSingle();
  if(error)throw error;isAdmin=!!data;
  $('supAdminTab')?.classList.toggle('hidden',!isAdmin);
  return sb;
}

function setMode(next){
  if(next==='admin'&&!isAdmin)return;
  mode=next||'meus';selected=null;
  main?.querySelectorAll('[data-sup-tab]').forEach(b=>b.classList.toggle('active',b.dataset.supTab===mode));
  $('supNovo')?.classList.toggle('hidden',mode!=='novo');
  $('supListaSec')?.classList.toggle('hidden',mode==='novo');
  $('supConversa')?.classList.add('hidden');
  if(mode!=='novo')loadTickets();
}

function summary(){
  const counts={aberto:0,em_atendimento:0,respondido:0,fechado:0};tickets.forEach(t=>{if(counts[t.status]!=null)counts[t.status]++});
  $('supResumo').innerHTML=`<div><small>Abertos</small><strong>${counts.aberto}</strong></div><div><small>Em atendimento</small><strong>${counts.em_atendimento}</strong></div><div><small>Respondidos</small><strong>${counts.respondido}</strong></div><div><small>Fechados</small><strong>${counts.fechado}</strong></div>`;
}

async function loadTickets(force=false){
  ensure();if(mode==='novo')return;
  const box=$('supLista');if(!navigator.onLine){box.innerHTML='<div class="supOffline">A Central de Ajuda precisa de internet para enviar e receber mensagens.</div>';return}
  box.innerHTML='<div class="card muted">Carregando atendimentos...</div>';
  try{
    const sb=await session();
    let q=sb.from('suporte_chamados').select('id,empresa_id,usuario_id,usuario_nome,usuario_email,empresa_nome,categoria,assunto,nota,status,ultima_mensagem_em,criado_em,atualizado_em').order('atualizado_em',{ascending:false}).limit(mode==='admin'?100:50);
    if(mode!=='admin')q=q.eq('usuario_id',user.id);
    const {data,error}=await q;if(error)throw error;tickets=data||[];
    $('supListaTitulo').textContent=mode==='admin'?'Caixa de Atendimento':'Meus atendimentos';summary();renderList();
  }catch(e){box.innerHTML=`<div class="status">${esc(pt(e))}</div>`}
}

function renderList(){
  const box=$('supLista');if(!tickets.length){box.innerHTML=`<div class="card supEmpty"><strong>${mode==='admin'?'Nenhum chamado recebido.':'Você ainda não abriu nenhum atendimento.'}</strong><p class="muted">${mode==='admin'?'Os novos contatos aparecerão aqui.':'Use “Novo contato” para falar com a OBRIX.'}</p></div>`;return}
  box.innerHTML=tickets.map(t=>{
    const admin=mode==='admin'?`<div class="supAdminWho">${esc(t.usuario_nome||t.usuario_email||'Usuário')} · ${esc(t.empresa_nome||'Empresa')}</div>`:'';
    const stars=t.nota?`<span class="supStars">${'★'.repeat(Number(t.nota))}${'☆'.repeat(5-Number(t.nota))}</span>`:'';
    return `<button type="button" class="supTicket" data-ticket="${esc(t.id)}"><div class="supTicketTop"><b>${esc(t.assunto)}</b><span class="supChip ${t.status==='respondido'?'resp':t.status}">${esc(sts[t.status]||t.status)}</span></div>${admin}<div class="supMeta"><span class="supChip">${esc(cats[t.categoria]||t.categoria)}</span>${stars}<small>${fmt(t.atualizado_em||t.criado_em)}</small></div></button>`
  }).join('');
  box.querySelectorAll('[data-ticket]').forEach(b=>b.onclick=()=>openTicket(b.dataset.ticket));
}

async function openTicket(id){
  selected=tickets.find(t=>t.id===id)||null;if(!selected)return;
  const sec=$('supConversa');sec.classList.remove('hidden');sec.innerHTML='<div class="card muted">Carregando conversa...</div>';sec.scrollIntoView({behavior:'smooth',block:'start'});
  try{
    const sb=await session();
    const {data,error}=await sb.from('suporte_mensagens').select('id,chamado_id,usuario_id,autor_tipo,mensagem,criado_em').eq('chamado_id',id).order('criado_em',{ascending:true});if(error)throw error;
    renderConversation(data||[]);
  }catch(e){sec.innerHTML=`<div class="status">${esc(pt(e))}</div>`}
}

function renderConversation(messages){
  const t=selected,admin=mode==='admin'&&isAdmin;if(!t)return;
  const who=admin?`<p class="muted">${esc(t.usuario_nome||t.usuario_email||'Usuário')} · ${esc(t.empresa_nome||'Empresa')}</p>`:'';
  const actions=admin?`<div class="supAdminActions"><button type="button" data-status="em_atendimento">Marcar em atendimento</button><button type="button" data-status="fechado">Fechar chamado</button></div>`:'';
  $('supConversa').innerHTML=`<div class="card"><div class="supConvHead"><div><h3>${esc(t.assunto)}</h3>${who}<div class="supMeta"><span class="supChip">${esc(cats[t.categoria]||t.categoria)}</span><span class="supChip ${t.status==='respondido'?'resp':t.status}">${esc(sts[t.status]||t.status)}</span>${t.nota?`<span class="supStars">${'★'.repeat(Number(t.nota))}${'☆'.repeat(5-Number(t.nota))}</span>`:''}</div></div>${actions}</div><div class="supMessages">${messages.map(m=>`<div class="supMsg ${m.autor_tipo==='suporte'?'support':'user'}"><b>${m.autor_tipo==='suporte'?'OBRIX':'Você'}</b><div>${esc(m.mensagem).replace(/\n/g,'<br>')}</div><small>${fmt(m.criado_em)}</small></div>`).join('')||'<div class="muted">Sem mensagens.</div>'}</div><div class="supReply"><label>${admin?'Responder ao usuário':'Enviar nova mensagem'}<textarea id="supReplyText" maxlength="4000" rows="4" placeholder="Escreva sua mensagem..."></textarea></label><button type="button" class="btn" id="supReplySend">Enviar resposta</button><div id="supReplyStatus" class="status hidden"></div></div></div>`;
  $('supReplySend').onclick=sendReply;
  $('supConversa').querySelectorAll('[data-status]').forEach(b=>b.onclick=()=>setStatus(b.dataset.status));
}

function showStatus(id,text,ok=true){const b=$(id);if(!b)return;b.textContent=text;b.className='status '+(ok?'supOk':'supErr');b.classList.remove('hidden')}

async function criarChamado(){
  if(busy)return;const categoria=$('supCategoria').value,assunto=$('supAssunto').value.trim(),mensagem=$('supMensagem').value.trim(),nota=categoria==='avaliacao'?Number($('supNota').value):null;
  if(assunto.length<3)return showStatus('supFormStatus','Informe um assunto com pelo menos 3 caracteres.',false);
  if(!mensagem)return showStatus('supFormStatus','Escreva sua mensagem.',false);
  const btn=$('supEnviar');try{
    busy=true;btn.disabled=true;btn.textContent='Enviando...';
    const sb=await session();const {data,error}=await sb.rpc('obrix_criar_chamado_suporte',{p_categoria:categoria,p_assunto:assunto,p_mensagem:mensagem,p_nota:nota});if(error)throw error;
    $('supAssunto').value='';$('supMensagem').value='';showStatus('supFormStatus','Mensagem enviada com sucesso. Você poderá acompanhar a resposta em “Meus atendimentos”.');
    setTimeout(()=>{setMode('meus');loadTickets(true);if(data)selected=data},500);
  }catch(e){showStatus('supFormStatus',pt(e),false)}finally{busy=false;btn.disabled=false;btn.textContent='Enviar mensagem'}
}

async function sendReply(){
  const text=$('supReplyText')?.value.trim();if(!text||!selected)return showStatus('supReplyStatus','Escreva uma mensagem.',false);
  const btn=$('supReplySend');try{
    btn.disabled=true;btn.textContent='Enviando...';const sb=await session();
    const {error}=await sb.from('suporte_mensagens').insert({chamado_id:selected.id,usuario_id:user.id,autor_tipo:(mode==='admin'&&isAdmin)?'suporte':'usuario',mensagem:text});if(error)throw error;
    $('supReplyText').value='';await loadTickets(true);await openTicket(selected.id);
  }catch(e){showStatus('supReplyStatus',pt(e),false)}finally{btn.disabled=false;btn.textContent='Enviar resposta'}
}

async function setStatus(status){
  if(!isAdmin||!selected)return;try{const sb=await session();const {error}=await sb.from('suporte_chamados').update({status,atualizado_em:new Date().toISOString()}).eq('id',selected.id);if(error)throw error;await loadTickets(true);await openTicket(selected.id)}catch(e){alert(pt(e))}
}

async function open(){
  ensure();hideOthers();main.classList.remove('hidden');
  if(!navigator.onLine){$('supLista').innerHTML='<div class="supOffline">Conecte-se à internet para usar a Central de Ajuda e Feedback.</div>';scrollTo({top:0,behavior:'smooth'});return}
  try{await session();if(mode==='admin'&&!isAdmin)mode='meus';setMode(mode==='novo'?'novo':'meus')}catch(e){$('supLista').innerHTML=`<div class="status">${esc(pt(e))}</div>`}
  scrollTo({top:0,behavior:'smooth'});
}

function injectMenu(){
  const m=$('menuMain');if(!m)return false;
  if(!m.querySelector('[data-obrix-suporte-menu]')){
    const nav=m.querySelector('.opmSide nav');if(nav){const b=document.createElement('button');b.type='button';b.dataset.obrixSuporteMenu='1';b.innerHTML='<i>?</i><span>Ajuda e Feedback</span>';b.onclick=open;const config=nav.querySelector('[data-go="config"]');nav.insertBefore(b,config||null)}
    const account=m.querySelector('.opmGrid .account');if(account){const b=document.createElement('button');b.type='button';b.dataset.obrixSuporteMenu='1';b.innerHTML='<b>Ajuda e Feedback</b><small>Dúvidas, sugestões, críticas e avaliações</small>';b.onclick=open;const cfg=account.querySelector('[data-go="config"]');account.insertBefore(b,cfg||null)}
  }
  if(!menuHooked&&window.OBRIX_MENU?.open){const old=window.OBRIX_MENU.open;window.OBRIX_MENU.open=function(){main?.classList.add('hidden');return old.apply(this,arguments)};menuHooked=true}
  const observerTarget=m;if(!observerTarget.dataset.supObserved){observerTarget.dataset.supObserved='1';new MutationObserver(()=>{if(!m.classList.contains('hidden'))main?.classList.add('hidden')}).observe(m,{attributes:true,attributeFilter:['class']})}
  return true;
}

function installMenuIntegration(){
  injectMenu();new MutationObserver(()=>injectMenu()).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{const nav=e.target.closest?.('[data-go],#bInicio,#bEquipe,.bottom button');if(nav&&!e.target.closest?.('[data-obrix-suporte-menu]'))main?.classList.add('hidden')},true);
}

setTimeout(()=>{ensure();injectMenu()},400);setTimeout(injectMenu,1400);
window.OBRIX_SUPORTE={open,load:loadTickets,new:()=>{ensure();open();setMode('novo')}};
})();
