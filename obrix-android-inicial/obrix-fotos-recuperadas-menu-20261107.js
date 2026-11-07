(()=>{
'use strict';
if(window.OBRIX_FOTOS_RECUPERADAS)return;
const COMPANY='ec70a79d-42ce-47af-8831-986a01b152c5',BUCKET='relatorio-fotografico',PAGE_SIZE=6;
const GROUPS={
 A:{folder:'98073940-6c39-4171-92eb-0d21c551eba8',count:216,bytes:172155200},
 B:{folder:'822ed78c-3b03-4cd7-9fb4-718c2a661e09',count:26,bytes:12262727}
};
let root=null,sb=null,items=null,group='A',page=0,openNow=false,seq=0,blobUrls=[],oldOverflow='';
const $=id=>root?.querySelector('#'+id);
const status=(str,bad=false)=>{const x=$('obrFrStatus');if(x){x.textContent=str;x.style.color=bad?'#992a20':'#284862'}};
function revoke(){seq++;for(const u of blobUrls)URL.revokeObjectURL(u);blobUrls=[];const p=$('obrFrPhotos');if(p)p.replaceChildren()}
function closeZoom(){const z=$('obrFrZoom');if(z)z.hidden=true}
function close(){
 if(!openNow)return;
 revoke();closeZoom();openNow=false;sb=null;items=null;
 root.hidden=true;document.documentElement.style.overflow=oldOverflow;
}
function install(){
 if(root)return;
 const style=document.createElement('style');style.id='obrFrStyle';
 style.textContent='#obrFrRoot{position:fixed;inset:0;z-index:2147482000;overflow-y:auto;overflow-x:hidden;background:#f4f6f9;color:#172839;font:15px/1.5 system-ui,-apple-system,sans-serif;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}#obrFrRoot[hidden],#obrFrRoot [hidden]{display:none!important}#obrFrRoot *{box-sizing:border-box}#obrFrRoot .obrWrap{max-width:1000px;margin:auto;padding:14px 12px 36px}#obrFrRoot h2{font-size:22px;line-height:1.2;margin:0;color:#15293d}#obrFrRoot h3{font-size:17px;margin:0 0 10px;color:#15293d}#obrFrRoot p{color:#50647a;line-height:1.48}#obrFrRoot .obrTop{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}#obrFrRoot .obrSection{padding:15px;border:1px solid #d9e4ef;border-radius:13px;background:white;margin:13px 0}#obrFrRoot button{border:0;border-radius:10px;padding:12px 14px;min-height:43px;font-size:15px;font-weight:750;color:white;background:#e65c1a;touch-action:manipulation}#obrFrRoot button:disabled{opacity:.48}#obrFrRoot .obrSecondary{background:#334b63}#obrFrRoot .obrGroups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}#obrFrRoot .obrGroup{background:#f6f9fd;color:#203951;text-align:left;border:1px solid #cdd9e6}#obrFrRoot .obrGroup[aria-pressed=true]{background:#fff6ef;border:2px solid #e65c1a}#obrFrRoot .obrGroup b,#obrFrRoot .obrGroup small{display:block}#obrFrRoot .obrGroup small{font-size:12px;font-weight:500}#obrFrRoot .obrGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;margin:12px 0}#obrFrRoot .obrCard{background:#fff;border:1px solid #dae3ed;border-radius:11px;overflow:hidden;min-width:0}#obrFrRoot .obrCard button{display:block;width:100%;aspect-ratio:4/3;border-radius:0;background:#e9eef5;padding:0}#obrFrRoot .obrCard img{width:100%;height:100%;object-fit:contain;display:block}#obrFrRoot .obrMeta{padding:8px;font-size:12px;color:#566879;overflow-wrap:anywhere}#obrFrRoot .obrMeta strong{display:block;color:#182b41}#obrFrRoot .obrPages{display:flex;justify-content:center;gap:10px;align-items:center;flex-wrap:wrap}#obrFrRoot .obrPages select{font:16px system-ui;padding:9px;border-radius:9px;border:1px solid #b9c9da;color:#1a3049;background:white}#obrFrRoot #obrFrStatus{background:#eaf3fc;padding:11px;border-radius:9px;white-space:pre-wrap;overflow-wrap:anywhere}#obrFrRoot .obrWarning{background:#f0f4f8;border-left:3px solid #b9c9da;padding:11px;border-radius:8px}#obrFrRoot .obrZoom{position:fixed;inset:0;z-index:2147482500;background:rgba(7,14,25,.96);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;padding:12px}#obrFrRoot .obrZoom img{max-width:100%;max-height:calc(100dvh - 112px);object-fit:contain}#obrFrRoot .obrZoom p{color:white;font-size:12px;overflow-wrap:anywhere}@media(max-width:650px){#obrFrRoot .obrGrid{grid-template-columns:repeat(2,minmax(0,1fr))}#obrFrRoot .obrCard button{aspect-ratio:1/1}}@media(max-width:370px){#obrFrRoot .obrGrid{grid-template-columns:1fr}}';
 document.head.appendChild(style);
 root=document.createElement('div');root.id='obrFrRoot';root.hidden=true;
 root.innerHTML='<div class="obrWrap"><div class="obrTop"><div><small style="font-weight:800;color:#aa4b20">OBRIX · TESTE</small><h2>Fotografias recuperadas</h2></div><button type="button" class="obrSecondary" id="obrFrClose">← Voltar ao menu</button></div>'+
 '<section class="obrSection"><h3>Acervo sem obra identificada</h3><p class="obrWarning">Os arquivos originais permanecem preservados. Nenhuma foto será vinculada a uma obra, excluída ou modificada nesta tela.</p><div class="obrGroups">'+
 '<button class="obrGroup" id="obrFrA" aria-pressed="true"><b>Grupo A</b><small>216 fotos · Obra não identificada</small></button>'+
 '<button class="obrGroup" id="obrFrB" aria-pressed="false"><b>Grupo B</b><small>26 fotos · Obra não identificada</small></button>'+
 '</div><p id="obrFrStatus" role="status" aria-live="polite">Iniciando...</p></section>'+
 '<section class="obrSection"><h3 id="obrFrTitle">Grupo A</h3><div class="obrGrid" id="obrFrPhotos"></div><div class="obrPages">'+
 '<button type="button" class="obrSecondary" id="obrFrPrev">Anterior</button><label for="obrFrPage">Página</label><select id="obrFrPage"></select><button type="button" class="obrSecondary" id="obrFrNext">Próxima</button>'+
 '</div></section><section class="obrSection"><h3>Segurança</h3><p>A visualização não substitui o backup binário. Não restaure nem exclua fotografias até verificar a cópia dos originais.</p></section></div>'+
 '<div class="obrZoom" id="obrFrZoom" hidden><button type="button" id="obrFrZoomClose" class="obrSecondary">Fechar imagem</button><img id="obrFrLarge" alt="Fotografia ampliada"><p id="obrFrFilename"></p></div>';
 document.body.appendChild(root);
 $('obrFrClose').onclick=close;
 $('obrFrZoomClose').onclick=closeZoom;
 $('obrFrZoom').onclick=e=>{if(e.target===$('obrFrZoom'))closeZoom()};
 $('obrFrA').onclick=()=>selectGroup('A');$('obrFrB').onclick=()=>selectGroup('B');
 $('obrFrPrev').onclick=()=>selectPage(page-1);$('obrFrNext').onclick=()=>selectPage(page+1);
 $('obrFrPage').onchange=e=>selectPage(Number(e.target.value));
 document.addEventListener('keydown',e=>{if(!openNow||e.key!=='Escape')return;if(!$('obrFrZoom').hidden)closeZoom();else close()});
 document.addEventListener('click',e=>{if(e.target?.closest?.('#sair,#menuSair'))close()},true);
}
async function listFolder(g){
 const cfg=GROUPS[g],path=COMPANY+'/'+cfg.folder;
 const result=await sb.storage.from(BUCKET).list(path,{limit:500,offset:0,sortBy:{column:'name',order:'asc'}});
 if(result.error)throw Error('Não foi possível consultar o grupo '+g+': '+result.error.message);
 const found=(result.data||[]).map(x=>{
  const size=Number(x.metadata?.size);
  if(!x.metadata||!Number.isSafeInteger(size)||size<=0||!(/^[a-zA-Z0-9_.-]+$/).test(x.name)||x.name.includes('..'))throw Error('Arquivo inesperado no grupo '+g);
  return {path:path+'/'+x.name,name:x.name,size,created:x.created_at};
 });
 if(found.length!==cfg.count||found.reduce((s,x)=>s+x.size,0)!==cfg.bytes||new Set(found.map(x=>x.path)).size!==cfg.count)
  throw Error('O grupo '+g+' não confere com o inventário de segurança.');
 return found;
}
function controls(){
 const files=items?.[group]||[],n=Math.ceil(files.length/PAGE_SIZE),select=$('obrFrPage');
 $('obrFrA').setAttribute('aria-pressed',String(group==='A'));
 $('obrFrB').setAttribute('aria-pressed',String(group==='B'));
 $('obrFrTitle').textContent='Grupo '+group+' · '+files.length+' fotografias';
 select.replaceChildren();
 for(let i=0;i<n;i++){const opt=document.createElement('option');opt.value=String(i);opt.textContent=(i+1)+' / '+n;select.append(opt)}
 select.value=String(page);select.disabled=!files.length;
 $('obrFrPrev').disabled=!files.length||page===0;
 $('obrFrNext').disabled=!files.length||page>=n-1;
 $('obrFrA').disabled=!items?.A;$('obrFrB').disabled=!items?.B;
}
async function render(){
 if(!openNow||!items?.[group])return;
 revoke();const active=seq,files=items[group].slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
 controls();
 const cards=[];
 for(let i=0;i<files.length;i++){
  const f=files[i],card=document.createElement('article');card.className='obrCard';
  const btn=document.createElement('button');btn.type='button';btn.disabled=true;btn.setAttribute('aria-label','Ampliar fotografia '+(page*PAGE_SIZE+i+1));
  const img=document.createElement('img');img.alt='Fotografia do grupo '+group;img.loading='lazy';btn.append(img);
  const meta=document.createElement('div');meta.className='obrMeta';
  const title=document.createElement('strong');title.textContent='Foto '+(page*PAGE_SIZE+i+1);
  const detail=document.createElement('span');detail.textContent='Carregando...';
  meta.append(title,detail);card.append(btn,meta);$('obrFrPhotos').append(card);
  cards.push({f,img,btn,detail,number:page*PAGE_SIZE+i+1});
 }
 status('Carregando fotografias da página '+(page+1)+'...');
 let next=0,finished=0,failed=0;
 async function worker(){
  while(next<cards.length){
   const x=cards[next++];
   try{
    const r=await sb.storage.from(BUCKET).download(x.f.path);
    if(active!==seq||!openNow)return;
    if(r.error||!r.data)throw Error(r.error?.message||'Foto indisponível');
    if(r.data.size!==x.f.size)throw Error('Tamanho inesperado');
    if(r.data.type&&!['image/jpeg','image/png'].includes(r.data.type))throw Error('Formato inesperado');
    const url=URL.createObjectURL(r.data);blobUrls.push(url);x.img.src=url;x.btn.disabled=false;
    x.detail.textContent=(x.f.size/1024).toFixed(0)+' KiB · Envio '+new Date(x.f.created).toLocaleDateString('pt-BR');
    x.btn.onclick=()=>{if(active!==seq||!openNow)return;$('obrFrLarge').src=url;$('obrFrFilename').textContent='Grupo '+group+' · Foto '+x.number+' · '+x.f.name;$('obrFrZoom').hidden=false};
   }catch(e){if(active!==seq||!openNow)return;failed++;x.detail.textContent='Não foi possível abrir: '+(e.message||String(e))}
   finished++;if(active===seq&&openNow)status('Carregadas '+finished+'/'+cards.length+(failed?' · Falhas '+failed:''));
  }
 }
 await Promise.all([worker(),worker()]);
 if(active===seq&&openNow)status('Página '+(page+1)+': '+(finished-failed)+' fotos carregadas'+(failed?'; '+failed+' falharam.':'.'),failed>0);
}
function selectGroup(g){if(!openNow||!items?.[g])return;group=g;page=0;void render()}
function selectPage(n){if(!openNow||!items?.[group])return;if(!Number.isInteger(n)||n<0||n>=Math.ceil(items[group].length/PAGE_SIZE))return;page=n;void render()}
async function load(){
 const active=seq;
 try{
  if(!navigator.onLine)throw Error('As fotografias precisam de conexão com a internet.');
  if(!window.OBRIX_BACKEND?.init||!window.OBRIX_BACKEND?.profile)throw Error('Faça login no OBRIX novamente.');
  const [instance,profile]=await Promise.all([window.OBRIX_BACKEND.init(),window.OBRIX_BACKEND.profile()]);
  if(!openNow||active!==seq)return;
  const user=await instance.auth.getUser();
  if(user.error||!user.data?.user)throw Error('Sua sessão expirou. Entre novamente.');
  if(profile?.empresa_id!==COMPANY)throw Error('Estas 242 fotos estão disponíveis apenas na conta de teste com oito obras.');
  sb=instance;status('Conferindo o inventário dos dois grupos...');
  const [a,b]=await Promise.all([listFolder('A'),listFolder('B')]);
  if(!openNow||active!==seq)return;
  items={A:a,B:b};group='A';page=0;
  await render();
 }catch(e){if(openNow&&active===seq)status(e.message||String(e),true)}
}
function open(){
 if(!document.getElementById('app')||document.getElementById('app').classList.contains('hidden'))return false;
 install();if(openNow)return true;
 openNow=true;oldOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';
 root.hidden=false;items=null;group='A';page=0;revoke();closeZoom();
 $('obrFrA').disabled=true;$('obrFrB').disabled=true;$('obrFrPrev').disabled=true;$('obrFrNext').disabled=true;$('obrFrPage').disabled=true;
 status('Validando sessão e conferindo arquivos...');
 root.scrollTop=0;void load();return true;
}
window.OBRIX_FOTOS_RECUPERADAS={open,close,version:'test-20261107'};
})();