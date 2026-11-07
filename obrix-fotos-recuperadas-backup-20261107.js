(()=>{
'use strict';
if(window.__OBRIX_FOTOS_BACKUP_INTEGRADO)return;
const gallery=window.OBRIX_FOTOS_RECUPERADAS;
if(!gallery||typeof gallery.open!=='function')return;
window.__OBRIX_FOTOS_BACKUP_INTEGRADO=true;
const COMPANY='ec70a79d-42ce-47af-8831-986a01b152c5',BUCKET='relatorio-fotografico';
const GROUPS={
 A:{folder:'98073940-6c39-4171-92eb-0d21c551eba8',count:216,bytes:172155200},
 B:{folder:'822ed78c-3b03-4cd7-9fb4-718c2a661e09',count:26,bytes:12262727}
};
let files=null,batches=[],client=null,zipUrl=null,busy=false,runId=0,root=null,observer=null;
const $=id=>root?.querySelector('#'+id);
const status=(str,bad=false)=>{
 const el=$('obrBackupStatus');if(!el)return;
 el.textContent=String(str);
 el.style.color=bad?'#92241f':'#294863';
};
function release(){
 if(zipUrl){URL.revokeObjectURL(zipUrl);zipUrl=null}
 const area=$('obrBackupReady');
 if(area){area.hidden=true;area.replaceChildren()}
}
function reset(){
 runId++;release();files=null;batches=[];client=null;
 const plan=$('obrBackupPlan'),build=$('obrBackupBuild'),sel=$('obrBackupBatch');
 if(plan)plan.disabled=false;
 if(build)build.disabled=true;
 if(sel)sel.disabled=true;
}
function mountedAndOpen(){return root&&!root.hidden&&document.getElementById('app')&&!document.getElementById('app').classList.contains('hidden')}
function mount(){
 root=document.getElementById('obrFrRoot');
 if(!root||root.querySelector('#obrBackupPanel'))return;
 const style=document.createElement('style');style.id='obrBackupStyle';
 style.textContent='#obrFrRoot .obrBackupActions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}#obrFrRoot .obrBackupActions label{display:block;font-weight:700;font-size:14px;color:#2c4357;margin-bottom:5px}#obrFrRoot .obrBackupActions select{width:100%;max-width:100%;min-width:0;padding:11px;border:1px solid #b7c7da;border-radius:9px;background:#fff;color:#19304b;font-size:16px}#obrFrRoot .obrBackupButton{width:100%;margin:8px 0}#obrFrRoot #obrBackupStatus{padding:10px 12px;background:#edf3f9;color:#294863;border-radius:9px;white-space:pre-wrap;overflow-wrap:anywhere}#obrFrRoot .obrBackupLink{display:block;background:#235c46;color:white;text-align:center;text-decoration:none;padding:13px;border-radius:10px;font-weight:750;margin:10px 0}#obrFrRoot .obrBackupHint{font-size:13px;color:#536a7d}#obrFrRoot #obrBackupPanel a:not(.obrBackupLink){color:#205f9a;text-decoration:underline;font-weight:600}@media(max-width:580px){#obrFrRoot .obrBackupActions{grid-template-columns:1fr}}';
 document.head.append(style);
 const panel=document.createElement('section');
 panel.id='obrBackupPanel';panel.className='obrSection';
 panel.innerHTML='<h3>Salvar backup das fotografias</h3>'+
 '<p>Baixe as fotos originais em ZIPs pequenos diretamente nesta conta. Cada lote terá um manifesto SHA-256. <strong>Não exclua nenhuma imagem do OBRIX.</strong></p>'+
 '<div class="obrBackupActions"><div><label for="obrBackupLimit">Tamanho do ZIP</label><select id="obrBackupLimit">'+
 '<option value="8388608">8 MiB — recomendado</option><option value="4194304">4 MiB — mais leve</option></select></div>'+
 '<div><label for="obrBackupBatch">Lote</label><select id="obrBackupBatch" disabled><option>Conferir inventário primeiro</option></select></div></div>'+
 '<button type="button" class="obrBackupButton obrSecondary" id="obrBackupPlan">Conferir e organizar lotes</button>'+
 '<button type="button" class="obrBackupButton" id="obrBackupBuild" disabled>Preparar ZIP selecionado</button>'+
 '<div id="obrBackupStatus" role="status" aria-live="polite">Os ZIPs ainda não foram salvos. Comece conferindo o inventário.</div>'+
 '<div id="obrBackupReady" hidden></div>'+
 '<p class="obrBackupHint">No iPhone: depois que o ZIP for preparado, toque em <strong>Salvar ZIP</strong>, escolha Arquivos e confira se ficou salvo. Depois selecione o próximo lote. Preparar não é o mesmo que salvar.</p>'+
 '<p class="obrBackupHint"><a href="https://alef-obras-1sls3u2dy-obrix3.vercel.app/" rel="noopener noreferrer" target="_blank">Conferir os ZIPs salvos com o verificador</a></p>';
 const sections=root.querySelectorAll('.obrSection');
 const last=sections[sections.length-1];if(last)last.before(panel);else root.querySelector('.obrWrap')?.append(panel);
 $('obrBackupPlan').onclick=()=>void plan();
 $('obrBackupBuild').onclick=()=>void build();
 $('obrBackupLimit').onchange=()=>{reset();status('Tamanho do lote alterado. Toque em “Conferir e organizar lotes”.')};
 $('obrBackupBatch').onchange=()=>release();
 observer=new MutationObserver(()=>{
  if(root.hidden||document.getElementById('app')?.classList.contains('hidden'))reset();
 });
 observer.observe(root,{attributes:true,attributeFilter:['hidden']});
 const app=document.getElementById('app');if(app)observer.observe(app,{attributes:true,attributeFilter:['class']});
}
async function ensureSignedIn(){
 if(!mountedAndOpen())throw Error('Entre no OBRIX e abra Fotografias recuperadas.');
 const backend=window.OBRIX_BACKEND;
 if(!backend?.init||!backend?.profile)throw Error('Sessão do OBRIX indisponível. Entre novamente.');
 const [sb,profile]=await Promise.all([backend.init(),backend.profile()]);
 const user=await sb.auth.getUser();
 if(user.error||!user.data?.user||profile?.empresa_id!==COMPANY)throw Error('Esta biblioteca pertence à conta de teste com oito obras.');
 return sb;
}
async function listGroup(sb,key){
 const g=GROUPS[key],prefix=COMPANY+'/'+g.folder;
 const r=await sb.storage.from(BUCKET).list(prefix,{limit:500,offset:0,sortBy:{column:'name',order:'asc'}});
 if(r.error)throw Error('Listagem negada no grupo '+key+': '+r.error.message);
 const found=(r.data||[]).map(row=>{
  const size=Number(row.metadata?.size);
  if(!row.metadata||!Number.isSafeInteger(size)||size<=0||!/^[A-Za-z0-9_.-]+$/.test(row.name)||row.name.includes('..'))throw Error('Arquivo inesperado no grupo '+key);
  return {path:prefix+'/'+row.name,name:row.name,size};
 });
 const sum=found.reduce((s,x)=>s+x.size,0);
 if(found.length!==g.count||sum!==g.bytes||new Set(found.map(x=>x.path)).size!==g.count)throw Error('Inventário do grupo '+key+' não confere. Backup bloqueado.');
 return found;
}
async function plan(){
 if(busy||!mountedAndOpen())return;
 busy=true;
 const current=++runId,btn=$('obrBackupPlan');
 btn.disabled=true;release();
 try{
  status('Confirmando acesso aos arquivos...');
  const sb=await ensureSignedIn();
  if(!mountedAndOpen()||current!==runId)return;
  status('Conferindo os 242 arquivos do Storage...');
  const [a,b]=await Promise.all([listGroup(sb,'A'),listGroup(sb,'B')]);
  if(!mountedAndOpen()||current!==runId)return;
  files={A:a,B:b};client=sb;
  const limit=Number($('obrBackupLimit').value);
  if(limit!==4194304&&limit!==8388608)throw Error('Tamanho de lote inválido.');
  batches=[];
  for(const key of ['A','B']){
   let arr=[],bytes=0;
   for(const f of files[key]){
    if(arr.length&&bytes+f.size>limit){batches.push({group:key,files:arr,bytes});arr=[];bytes=0}
    arr.push(f);bytes+=f.size;
   }
   if(arr.length)batches.push({group:key,files:arr,bytes});
  }
  const picker=$('obrBackupBatch');picker.replaceChildren();
  batches.forEach((x,index)=>{
   const opt=document.createElement('option');opt.value=String(index);
   opt.textContent='Lote '+(index+1)+'/'+batches.length+' · Grupo '+x.group+' · '+x.files.length+' fotos · '+(x.bytes/1048576).toFixed(1)+' MiB';picker.append(opt)
  });
  picker.disabled=false;$('obrBackupBuild').disabled=false;
  status('Conferidos: 242 arquivos em '+batches.length+' lotes. Escolha o lote 1 para começar. Nenhuma fotografia foi salva ainda.');
 }catch(e){if(mountedAndOpen()&&current===runId)status('Backup bloqueado: '+(e.message||String(e)),true)}
 finally{busy=false;if(mountedAndOpen())btn.disabled=false}
}
async function getJSZip(){
 if(window.JSZip)return window.JSZip;
 const prior=document.getElementById('obrBackupJszip');
 if(prior){await new Promise((resolve,reject)=>{if(window.JSZip)return resolve();prior.addEventListener('load',resolve,{once:true});prior.addEventListener('error',()=>reject(Error('Biblioteca ZIP indisponível')),{once:true})})}
 else await new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.id='obrBackupJszip';
  script.src='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';script.async=true;
  script.onload=resolve;script.onerror=()=>reject(Error('Não foi possível carregar o gerador de ZIP.'));
  document.head.append(script);
 });
 if(!window.JSZip)throw Error('Gerador de ZIP não carregou. Verifique sua conexão.');
 return window.JSZip;
}
async function sha256(buffer){
 if(!crypto?.subtle)throw Error('Este navegador não oferece verificação SHA-256.');
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',buffer))].map(n=>n.toString(16).padStart(2,'0')).join('');
}
async function build(){
 if(busy||!mountedAndOpen()||!client||!batches.length)return;
 const idx=Number($('obrBackupBatch').value),lot=batches[idx];
 if(!Number.isInteger(idx)||!lot){status('Selecione um lote válido.',true);return}
 busy=true;const current=++runId;
 const button=$('obrBackupBuild'),picker=$('obrBackupBatch'),limit=$('obrBackupLimit'),planBtn=$('obrBackupPlan');
 button.disabled=true;picker.disabled=true;limit.disabled=true;planBtn.disabled=true;release();
 try{
  status('Preparando lote '+(idx+1)+' de '+batches.length+'...');
  const Zip=await getJSZip();
  if(!mountedAndOpen()||current!==runId)return;
  const z=new Zip(),manifest=[];
  for(let i=0;i<lot.files.length;i++){
   if(!mountedAndOpen()||current!==runId)return;
   const file=lot.files[i];
   status('Lote '+(idx+1)+'/'+batches.length+': verificando foto '+(i+1)+'/'+lot.files.length+'...');
   const response=await client.storage.from(BUCKET).download(file.path);
   if(!mountedAndOpen()||current!==runId)return;
   if(response.error||!response.data)throw Error('Falha na leitura de '+file.name+': '+(response.error?.message||'arquivo vazio'));
   const buffer=await response.data.arrayBuffer();
   if(buffer.byteLength!==file.size)throw Error('Tamanho divergente: '+file.name);
   const hash=await sha256(buffer);
   z.file(file.path,new Uint8Array(buffer),{binary:true,compression:'STORE'});
   manifest.push({caminho:file.path,tamanho_bytes:file.size,sha256:hash});
  }
  z.file('manifesto_SHA256.json',JSON.stringify({
    tipo:'OBRIX_FOTOS_LOTE_SHA256',conta:COMPANY,bucket:BUCKET,
    lote:idx+1,totalLotes:batches.length,totalFotosEsperadas:242,
    grupo:lot.group,arquivos:manifest
  },null,2));
  status('Montando arquivo ZIP com manifesto SHA-256...');
  const blob=await z.generateAsync({type:'blob',compression:'STORE',streamFiles:true});
  if(!mountedAndOpen()||current!==runId)return;
  zipUrl=URL.createObjectURL(blob);
  const name='OBRIX_FOTOS_COPIA_LOTE_'+String(idx+1).padStart(2,'0')+'_DE_'+String(batches.length).padStart(2,'0')+'.zip';
  const wrap=$('obrBackupReady');wrap.replaceChildren();
  const p=document.createElement('p');
  p.textContent='ZIP preparado: '+lot.files.length+' fotografias, '+(blob.size/1048576).toFixed(1)+' MiB.';
  const link=document.createElement('a');link.className='obrBackupLink';link.href=zipUrl;link.download=name;
  link.textContent='Salvar ZIP — lote '+(idx+1)+' de '+batches.length;
  wrap.append(p,link);wrap.hidden=false;
  status('ZIP pronto, com '+lot.files.length+' hashes SHA-256. Toque em Salvar ZIP e confira o arquivo em Arquivos antes de continuar. O backup ainda não foi confirmado.');
 }catch(e){if(mountedAndOpen()&&current===runId)status('Não foi possível preparar este lote: '+(e.message||String(e)),true)}
 finally{
  busy=false;
  if(mountedAndOpen()){button.disabled=!batches.length;picker.disabled=!batches.length;limit.disabled=false;planBtn.disabled=false}
 }
}
const oldOpen=gallery.open;
gallery.open=function(){
 const result=oldOpen.apply(gallery,arguments);
 if(result)mount();
 return result;
};
})();
