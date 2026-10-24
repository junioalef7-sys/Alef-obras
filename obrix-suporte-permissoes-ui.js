(()=>{
'use strict';
if(window.__OBRIX_SUPORTE_PERMISSOES_UI)return;window.__OBRIX_SUPORTE_PERMISSOES_UI=true;

const $=id=>document.getElementById(id);
let applying=false,lastUserId='',lastAdmin=false,observer=null,evalBusy=false;

function norm(v){
  return String(v||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[\u200B-\u200D\uFEFF]/g,'')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g,' ')
    .trim().replace(/\s+/g,' ');
}
function dedupeIdentity(el){
  if(!el)return;
  const txt=String(el.textContent||'').trim();
  if(!txt.includes('·'))return;
  const parts=txt.split('·').map(x=>x.trim()).filter(Boolean);
  if(parts.length<2)return;
  const pessoa=parts[0],empresa=parts.slice(1).join(' · ');
  el.textContent=norm(pessoa)===norm(empresa)?pessoa:`${pessoa} · ${empresa}`;
}
function evaluationUI(){
  const main=$('suporteMain');if(!main)return;
  const categoria=$('supCategoria'),assunto=$('supAssunto'),mensagem=$('supMensagem'),nota=$('supNotaWrap');
  if(!categoria||!assunto||!mensagem)return;
  const avaliacao=categoria.value==='avaliacao';
  assunto.closest('label')?.classList.toggle('hidden',avaliacao);
  if(nota)nota.classList.toggle('hidden',!avaliacao);
  const msgLabel=mensagem.closest('label');
  if(msgLabel){
    const textNode=[...msgLabel.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
    if(textNode)textNode.nodeValue=avaliacao?'Comentário (opcional)':'Mensagem';
  }
  mensagem.placeholder=avaliacao?'Se quiser, escreva um comentário sobre o OBRIX...':'Escreva sua dúvida, sugestão ou crítica...';
  if(avaliacao)assunto.value='';
}
function showEvalStatus(text,ok=true){
  const b=$('supFormStatus');if(!b)return;
  b.textContent=text;b.className='status '+(ok?'supOk':'supErr');b.classList.remove('hidden');
}

async function adminState(){
  try{
    const user=await window.OBRIX_BACKEND?.currentUser?.();
    if(!user?.id)return {user:null,isAdmin:false};
    if(user.id===lastUserId)return {user,isAdmin:lastAdmin};
    const sb=await window.OBRIX_BACKEND.init();
    const {data,error}=await sb.from('obrix_admins').select('user_id').eq('user_id',user.id).maybeSingle();
    if(error)throw error;
    lastUserId=user.id;lastAdmin=!!data;
    return {user,isAdmin:lastAdmin};
  }catch(_){return {user:null,isAdmin:false}}
}

async function apply(){
  if(applying)return;applying=true;
  try{
    const main=$('suporteMain');if(!main)return;
    const {isAdmin}=await adminState();
    const meus=main.querySelector('[data-sup-tab="meus"]');
    if(meus){
      meus.classList.remove('hidden');
      meus.textContent=isAdmin?'Meus atendimentos':'Histórico';
    }
    const adminTab=main.querySelector('[data-sup-tab="admin"]');
    if(adminTab)adminTab.classList.toggle('hidden',!isAdmin);

    const listaTitulo=$('supListaTitulo');
    if(listaTitulo&&!isAdmin&&listaTitulo.textContent==='Meus atendimentos')listaTitulo.textContent='Histórico de conversas';

    if(!isAdmin){
      main.querySelectorAll('.supAdminActions,[data-status="em_atendimento"],[data-status="fechado"]').forEach(el=>el.remove());
    }

    main.querySelectorAll('.supAdminWho').forEach(dedupeIdentity);
    main.querySelectorAll('#supConversa .supConvHead p.muted').forEach(dedupeIdentity);
    evaluationUI();
  }finally{applying=false}
}

async function sendEvaluation(e){
  const categoria=$('supCategoria');
  if(!categoria||categoria.value!=='avaliacao')return false;
  e.preventDefault();e.stopImmediatePropagation();
  if(evalBusy)return true;
  const nota=Number($('supNota')?.value||0),mensagem=String($('supMensagem')?.value||'').trim();
  if(nota<1||nota>5){showEvalStatus('Selecione uma avaliação de 1 a 5 estrelas.',false);return true}
  const btn=$('supEnviar');
  try{
    evalBusy=true;if(btn){btn.disabled=true;btn.textContent='Enviando...'}
    const sb=await window.OBRIX_BACKEND.init();
    const texto=mensagem||'Avaliação enviada sem comentário.';
    const {error}=await sb.rpc('obrix_criar_chamado_suporte',{p_categoria:'avaliacao',p_assunto:'Avaliação',p_mensagem:texto,p_nota:nota});
    if(error)throw error;
    if($('supMensagem'))$('supMensagem').value='';
    showEvalStatus('Avaliação enviada com sucesso. Obrigado pelo feedback.');
    window.OBRIX_NOTIFICACOES?.load?.(true);
  }catch(err){showEvalStatus(err?.message||'Não foi possível enviar a avaliação.',false)}finally{
    evalBusy=false;if(btn){btn.disabled=false;btn.textContent='Enviar mensagem'}
  }
  return true;
}

function install(){
  const main=$('suporteMain');
  if(!main)return setTimeout(install,250);
  if(!observer){observer=new MutationObserver(()=>queueMicrotask(apply));observer.observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}
  const categoria=$('supCategoria');if(categoria&&!categoria.dataset.evalUi){categoria.dataset.evalUi='1';categoria.addEventListener('change',()=>{evaluationUI();setTimeout(apply,0)})}
  apply();
}

document.addEventListener('click',e=>{
  if(e.target.closest?.('#supEnviar')){if($('supCategoria')?.value==='avaliacao'){sendEvaluation(e);return}}
  if(e.target.closest?.('[data-obrix-suporte-menu],#obrixNotifBell,[data-sup-tab],[data-ticket]'))setTimeout(apply,80);
},true);
window.addEventListener('pageshow',()=>{lastUserId='';setTimeout(apply,120)});
window.addEventListener('focus',()=>setTimeout(apply,120));
setTimeout(install,300);setTimeout(apply,1200);
})();