(()=>{
'use strict';
if(window.__OBRIX_STORAGE_BACKUP)return;window.__OBRIX_STORAGE_BACKUP=true;
const BUCKETS=['relatorio-fotografico','obrix-documentos','obrix-fotos'];
const MAX_BYTES=20*1024*1024,MAX_FILES=36;
const $=id=>document.getElementById(id);
let snapshot=null,busy=false;
const fmt=n=>Number(n||0).toLocaleString('pt-BR');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function msg(s){const e=$('storageBackupMsg');if(e)e.textContent=s;}
function safePath(s){if(!s||s.split('/').some(v=>!v||v==='.'||v==='..'||v.includes('\\')))throw Error('Caminho inválido no Storage.');return s}
async function walk(sb,bucket,folder,owner,out,visited){
 if(visited.has(folder))return;visited.add(folder);
 if(visited.size>10000)throw Error('Excesso de pastas no Storage.');
 let offset=0;
 for(;;){
  const r=await sb.storage.from(bucket).list(folder,{limit:100,offset,sortBy:{column:'name',order:'asc'}});
  if(r.error)throw Error('Listagem de '+bucket+': '+r.error.message);
  const rows=r.data||[];
  for(const item of rows){
   if(!item.name||item.name.includes('/'))throw Error('Nome inválido no Storage.');
   const path=safePath(folder+'/'+item.name);
   if(!path.startsWith(owner+'/'))throw Error('Arquivo de outra empresa detectado.');
   if(item.id){
    const n=Number(item.metadata?.size);
    out.push({bucket,path,bytes:Number.isFinite(n)&&n>=0?n:null});
   }else{
    if(path.split('/').length>9)throw Error('Profundidade excessiva de pastas.');
    await walk(sb,bucket,path,owner,out,visited);
   }
  }
  if(rows.length<100)break;offset+=rows.length;
  if(offset>200000)throw Error('Limite de arquivos ultrapassado.');
 }
}
function group(files){
 const parts=[];let current=[],size=0;
 for(const f of files){
  const weight=f.bytes===null?MAX_BYTES:f.bytes;
  if(current.length&&(size+weight>MAX_BYTES||current.length>=MAX_FILES)){
   parts.push(current);current=[];size=0;
  }
  current.push(f);size+=weight;
 }
 if(current.length)parts.push(current);return parts;
}
async function scan(){
 if(busy)return;busy=true;const btn=$('storageBackupScan');btn.disabled=true;
 try{
  const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile(),owner=String(p?.empresa_id||'');
  if(!/^[a-f\d-]{36}$/i.test(owner))throw Error('Empresa autenticada não encontrada.');
  const files=[];
  for(const bucket of BUCKETS){msg('Conferindo '+bucket+'...');await walk(sb,bucket,owner,owner,files,new Set());}
  const keys=new Set();
  for(const f of files){const k=f.bucket+'|'+f.path;if(keys.has(k))throw Error('Arquivo duplicado na listagem.');keys.add(k);}
  files.sort((a,b)=>(a.bucket+'|'+a.path).localeCompare(b.bucket+'|'+b.path));
  snapshot={owner,files,parts:group(files),time:new Date().toISOString(),downloaded:new Set()};
  show();
  msg('Conferência concluída. Baixe todas as partes ZIP para obter os arquivos.');
 }catch(e){snapshot=null;$('storageBackupParts').replaceChildren();msg('Falha: '+String(e.message||e));}
 finally{busy=false;btn.disabled=false;}
}
const CRC=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(b){let c=0xffffffff;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function zip(entries){
 const encode=new TextEncoder(),now=new Date();
 const hour=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1);
 const day=((Math.max(1980,now.getFullYear())-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate();
 let size=0,centralSize=0;const body=[],central=[];
 for(const e of entries){
  const name=encode.encode(safePath(e.name)),bytes=e.bytes,c=crc32(bytes);
  if(name.length>65535||size+centralSize+bytes.length+name.length*2+76>0xffffffff)throw Error('ZIP excedeu o limite seguro.');
  const local=new Uint8Array(30+name.length),l=new DataView(local.buffer);
  l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x0800,true);
  l.setUint16(10,hour,true);l.setUint16(12,day,true);l.setUint32(14,c,true);
  l.setUint32(18,bytes.length,true);l.setUint32(22,bytes.length,true);l.setUint16(26,name.length,true);
  local.set(name,30);
  const record=new Uint8Array(46+name.length),r=new DataView(record.buffer);
  r.setUint32(0,0x02014b50,true);r.setUint16(4,20,true);r.setUint16(6,20,true);
  r.setUint16(8,0x0800,true);r.setUint16(12,hour,true);r.setUint16(14,day,true);
  r.setUint32(16,c,true);r.setUint32(20,bytes.length,true);r.setUint32(24,bytes.length,true);
  r.setUint16(28,name.length,true);r.setUint32(42,size,true);record.set(name,46);
  body.push(local,bytes);central.push(record);size+=local.length+bytes.length;centralSize+=record.length;
 }
 const end=new Uint8Array(22),d=new DataView(end.buffer);
 d.setUint32(0,0x06054b50,true);d.setUint16(8,entries.length,true);d.setUint16(10,entries.length,true);
 d.setUint32(12,centralSize,true);d.setUint32(16,size,true);
 return new Blob([...body,...central,end],{type:'application/zip'});
}
async function hash(bytes){
 if(!crypto?.subtle)throw Error('SHA-256 indisponível neste aparelho.');
 const b=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
}
async function save(blob,name,type){
 if(navigator.canShare&&navigator.share&&window.File){
  const file=new File([blob],name,{type});
  if(navigator.canShare({files:[file]})){
   try{await navigator.share({files:[file],title:'Backup OBRIX'});return true;}
   catch(e){if(e.name==='AbortError')return false;}
  }
 }
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);return true;
}
async function manifest(){
 if(!snapshot||busy)return;
 const s=snapshot,detail={obrix_storage_manifest:1,empresa_id:s.owner,gerado_em:s.time,quantidade:s.files.length,total_partes:s.parts.length,
   files:s.files.map(f=>({bucket:f.bucket,path:f.path,bytes:f.bytes,parte:s.parts.findIndex(p=>p.includes(f))+1}))};
 const ok=await save(new Blob([JSON.stringify(detail,null,2)],{type:'application/json'}),
 'OBRIX_INVENTARIO_STORAGE_'+new Date().toISOString().slice(0,10)+'.json','application/json');
 msg(ok?'Inventário salvo. Ele não contém as imagens; baixe todos os ZIPs.':'Compartilhamento cancelado.');
}

function downloadDirect(blob,name){
 // O clique original deve executar a criação do link (Safari / PWA).
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=name;link.style.display='none';
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),120000);
}
function resetButtons(preparado){
 for(let k=0;k<(snapshot?.parts.length||0);k++){
   const btn=$('storageBackupPart'+k),direct=$('storageBackupDirect'+k);
   if(!btn)continue;
   const ativo=preparado?.index===k;
   btn.disabled=false;
   btn.textContent=ativo?'Salvar ZIP '+(k+1)+'/'+snapshot.parts.length:
     'Preparar ZIP '+(k+1)+'/'+snapshot.parts.length+' ('+snapshot.parts[k].length+' arquivos)';
   btn.onclick=ativo?()=>savePart(k):()=>preparePart(k);
   if(direct)direct.hidden=!ativo;
 }
}
async function preparePart(i){
 if(busy||!snapshot?.parts[i])return;
 busy=true;
 const btn=$('storageBackupPart'+i);
 btn.disabled=true;
 const s=snapshot;
 // Só uma parte ZIP reside na memória do navegador por vez.
 s.prepared=null;
 try{
  const p=await OBRIX_BACKEND.profile(),sb=await OBRIX_BACKEND.init();
  if(String(p?.empresa_id)!==s.owner)throw Error('A conta mudou. Confira novamente.');
  const files=s.parts[i],entries=[],metadata=[];
  for(let k=0;k<files.length;k++){
   const f=files[k];
   msg('Preparando ZIP '+(i+1)+'/'+s.parts.length+': arquivo '+(k+1)+' de '+files.length+'. Não feche o aplicativo.');
   if(!f.path.startsWith(s.owner+'/'))throw Error('Arquivo de outra empresa.');
   let timer;
   const result=await Promise.race([
      sb.storage.from(f.bucket).download(f.path),
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Download do arquivo '+(k+1)+' excedeu 90 segundos. Verifique a conexão e tente novamente.')),90000)})
   ]).finally(()=>clearTimeout(timer));
   if(result.error||!result.data)throw Error('Falha no arquivo '+(k+1)+': '+String(result.error?.message||'Download não concluído'));
   const bytes=new Uint8Array(await result.data.arrayBuffer());
   if(f.bytes!==null&&bytes.length!==f.bytes)throw Error('Tamanho divergente no arquivo '+(k+1)+'.');
   metadata.push({bucket:f.bucket,path:f.path,bytes:bytes.length,sha256:await hash(bytes)});
   entries.push({name:f.bucket+'/'+f.path,bytes});
   // Permite renderizar progresso e receber eventos de toque.
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  const meta={obrix_storage_zip:1,empresa_id:s.owner,parte:i+1,total_partes:s.parts.length,gerado_em:s.time,arquivos:metadata};
  entries.push({name:'OBRIX_MANIFESTO_PARTE.json',bytes:new TextEncoder().encode(JSON.stringify(meta,null,2))});
  msg('Finalizando ZIP '+(i+1)+'/'+s.parts.length+'...');
  const blob=zip(entries),two=n=>String(n).padStart(2,'0');
  const name='OBRIX_ARQUIVOS_'+new Date().toISOString().slice(0,10)+'_PARTE_'+two(i+1)+'_DE_'+two(s.parts.length)+'.zip';
  s.prepared={index:i,blob,name};
  msg('ZIP '+(i+1)+'/'+s.parts.length+' preparado ('+(blob.size/1048576).toFixed(1)+' MB). Agora toque em SALVAR ZIP para abrir o compartilhamento. Se não abrir, use “Download alternativo”.');
 }catch(e){
  msg('Falha ao preparar ZIP '+(i+1)+': '+String(e.message||e)+'. Nenhum dado foi alterado.');
  s.prepared=null;
 }finally{
  busy=false;resetButtons(s.prepared);
 }
}
function savePart(i){
 // É obrigatório invocar navigator.share diretamente neste segundo toque,
 // sem awaits de rede: exigência da ativação de usuário no Safari/WebKit.
 const s=snapshot,prepared=s?.prepared;
 if(!prepared||prepared.index!==i||busy)return;
 const btn=$('storageBackupPart'+i);
 btn.disabled=true;
 msg('Abrindo opções de salvamento do ZIP '+(i+1)+'. No iPhone selecione “Salvar em Arquivos”.');
 // save() inicia navigator.share síncrono até o primeiro await.
 save(prepared.blob,prepared.name,'application/zip').then(ok=>{
  if(ok){
   s.downloaded.add(i);updateCount();
   msg('ZIP '+(i+1)+' enviado ao sistema de salvamento. Verifique no app Arquivos antes de preparar o próximo pacote.');
  }else msg('Salvamento cancelado. Toque novamente em “Salvar ZIP” ou use “Download alternativo”.');
 }).catch(e=>{
  msg('O compartilhamento não abriu: '+String(e.message||e)+'. Use o botão “Download alternativo” logo abaixo.');
 }).finally(()=>{btn.disabled=false;});
}
function directPart(i){
 const prepared=snapshot?.prepared;
 if(!prepared||prepared.index!==i)return;
 try{
  downloadDirect(prepared.blob,prepared.name);
  snapshot.downloaded.add(i);updateCount();
  msg('Download alternativo do ZIP '+(i+1)+' iniciado. Confira o arquivo em Downloads/Arquivos antes de continuar.');
 }catch(e){msg('Não foi possível iniciar o download alternativo: '+String(e.message||e));}
}
function updateCount(){const e=$('storageBackupCount');if(e&&snapshot)e.textContent=snapshot.downloaded.size+' de '+snapshot.parts.length+' partes enviadas ao salvamento.';}
function show(){
 const s=snapshot,a=$('storageBackupParts');if(!a)return;
 const byBucket=BUCKETS.map(b=>b+': '+fmt(s.files.filter(f=>f.bucket===b).length)).join(' · ');
 a.innerHTML='<div class="backupResultado ok"><strong>'+fmt(s.files.length)+' arquivos identificados</strong>'+
  '<span>'+esc(byBucket)+'</span><span>Tamanho declarado: '+fmt(s.files.reduce((n,f)=>n+(f.bytes||0),0))+
  ' bytes · '+fmt(s.parts.length)+' parte(s)</span></div>'+
  '<p class="muted">Inclui também arquivos antigos presentes na sua pasta, mesmo sem registro na tabela atual. A conferência e o download não alteram o Supabase.</p>'+
  '<button type="button" class="btn" id="storageBackupInventory">Salvar inventário JSON</button>'+
  '<p class="muted">O inventário NÃO substitui o backup dos arquivos. Para cada parte: PREPARAR, depois SALVAR. Se travar, use Download alternativo. Salve todas as partes da mesma conferência.</p>'+
  '<div id="storageBackupCount" class="muted"></div><div id="storageBackupZipButtons"></div>';
 $('storageBackupInventory').onclick=manifest;
 const box=$('storageBackupZipButtons');
 for(let i=0;i<s.parts.length;i++){
  const b=document.createElement('button');b.type='button';b.id='storageBackupPart'+i;b.className='btn storageZipButton';
  b.textContent='Preparar ZIP '+(i+1)+'/'+s.parts.length+' ('+s.parts[i].length+' arquivos)';
  b.onclick=()=>preparePart(i);box.appendChild(b);
  const fallback=document.createElement('button');fallback.type='button';fallback.id='storageBackupDirect'+i;
  fallback.className='btn storageZipAlternative';fallback.textContent='Download alternativo — ZIP '+(i+1);
  fallback.hidden=true;fallback.onclick=()=>directPart(i);box.appendChild(fallback);
 }
 updateCount();
}
function install(){
 const main=$('backupMain');if(!main||$('storageBackupCard'))return !!$('storageBackupCard');
 const card=document.createElement('div');card.id='storageBackupCard';card.className='card';
 card.innerHTML='<h3>Fotos e documentos — backup de arquivos (teste)</h3>'+
 '<p class="muted">O backup JSON não inclui os arquivos do Storage. Confira e salve os ZIPs da sua empresa em partes menores.</p>'+
 '<button type="button" class="btn" id="storageBackupScan">Conferir arquivos da conta</button>'+
 '<div id="storageBackupMsg" class="muted" role="status" aria-live="polite" style="margin-top:12px"></div>'+
 '<div id="storageBackupParts" style="margin-top:12px"></div>';
 main.insertBefore(card,main.querySelector('.backupAviso'));
 $('storageBackupScan').onclick=scan;
 const st=document.createElement('style');st.textContent='#storageBackupCard .storageZipButton{display:block;width:100%;margin:8px 0;white-space:normal}#storageBackupCard .storageZipAlternative{display:block;width:100%;margin:3px 0 12px;background:var(--ob-surface-2,#f2f5f9);border:1px solid var(--ob-border,#ced6e0);color:var(--ob-text,#15202b)}#storageBackupCard [hidden]{display:none!important}#storageBackupCard .backupResultado{line-height:1.5}';
 document.head.appendChild(st);return true;
}
if(window.OBRIX_BACKUP?.open){
 const open=window.OBRIX_BACKUP.open;
 window.OBRIX_BACKUP.open=function(...args){const r=open.apply(this,args);setTimeout(install,0);return r;};
}
if(!install()){
 const observer=new MutationObserver(()=>{if(install())observer.disconnect()});
 observer.observe(document.documentElement,{childList:true,subtree:true});
 setTimeout(install,500);
}
})();