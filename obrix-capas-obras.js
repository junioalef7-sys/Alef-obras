(()=>{'use strict';
if(window.OBRIX_CAPAS)return;
const script=document.currentScript;
const defaultUrl=new URL('obrix-capa-padrao.webp',script?.src||document.baseURI).href;
const cache=new Map(),pending=new Map(),seen=new WeakSet();
const bucket='obrix-fotos';
const uuid=id=>/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(String(id||''));
let contextPromise=null,queued=false;
const context=()=>{
 if(!contextPromise)contextPromise=Promise.all([window.OBRIX_BACKEND.init(),window.OBRIX_BACKEND.profile()]).then(([sb,p])=>{
  if(!uuid(p?.empresa_id))throw Error('Empresa não identificada.');
  return {sb,company:String(p.empresa_id)};
 }).catch(err=>{contextPromise=null;throw err});
 return contextPromise;
};
const path=(company,id)=>company+'/capas/'+id+'/capa.webp';
async function load(id,force=false){
 id=String(id);if(!uuid(id))return defaultUrl;
 const cached=cache.get(id);
 if(!force&&cached&&cached.expires>Date.now())return cached.url;
 if(pending.has(id))return pending.get(id);
 const work=(async()=>{
  const {sb,company}=await context();
  const folder=company+'/capas/'+id;
  const {data:objects,error:err}=await sb.storage.from(bucket).list(folder,{limit:10,search:'capa.webp'});
  if(err)throw err;
  if(!objects?.some(o=>o.name==='capa.webp')){
   cache.set(id,{url:defaultUrl,expires:Date.now()+90000});return defaultUrl;
  }
  const {data,error}=await sb.storage.from(bucket).createSignedUrl(path(company,id),3600);
  if(error||!data?.signedUrl)throw error||Error('Não foi possível abrir a foto.');
  cache.set(id,{url:data.signedUrl,expires:Date.now()+45*60000});
  return data.signedUrl;
 })().catch(e=>{console.warn('Capa de obra:',e.message||e);return defaultUrl}).finally(()=>pending.delete(id));
 pending.set(id,work);return work;
}
function apply(id,url){
 document.querySelectorAll('#obras [data-obrix-capa-id]').forEach(el=>{
  if(el.dataset.obrixCapaId!==id)return;
  const img=el.querySelector(':scope>img');
  if(img&&img.src!==url)img.src=url;
  el.dataset.obrixCapaCustom=String(url!==defaultUrl);
 });
}
async function display(el){
 const id=el.dataset.obrixCapaId,url=await load(id);
 if(el.isConnected&&el.dataset.obrixCapaId===id){
  const img=el.querySelector(':scope>img');
  if(img&&img.src!==url)img.src=url;
  el.dataset.obrixCapaCustom=String(url!==defaultUrl);
 }
}
const observer=typeof IntersectionObserver==='function'
 ?new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){observer.unobserve(e.target);void display(e.target)}}),{rootMargin:'180px'}):null;
function scan(){
 document.querySelectorAll('#obras [data-obrix-capa-id]').forEach(el=>{
  if(seen.has(el))return;seen.add(el);
  const img=el.querySelector(':scope>img');
  if(img)img.addEventListener('error',()=>{if(img.src!==defaultUrl)img.src=defaultUrl});
  if(observer)observer.observe(el);else void display(el);
 });
}
function queue(){
 if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()});
}
function toast(text,error=false){
 const last=document.querySelector('.obrixCapaToast');last?.remove();
 const el=document.createElement('div');el.className='obrixCapaToast';
 el.setAttribute('role',error?'alert':'status');el.textContent=text;
 el.style.cssText='position:fixed;z-index:999999;bottom:96px;left:12px;right:12px;max-width:440px;margin:auto;padding:12px 16px;background:#142435;color:#fff;border:1px solid #64748b;border-radius:12px;text-align:center;font-weight:700;font-size:14px';
 document.body.appendChild(el);setTimeout(()=>el.remove(),2500);
}
function busy(id,on){
 document.querySelectorAll('#obras .obrixCapaAcoes button').forEach(el=>{
  if([el.dataset.obrixCapaChoose,el.dataset.obrixCapaCamera,el.dataset.obrixCapaRemove].includes(id))el.disabled=on;
 });
}
async function permitted(sb,id,company){
 if(!uuid(id))throw Error('Obra inválida.');
 const works=window.obras||[];
 if(!works.some(o=>String(o.id)===id))throw Error('Obra não identificada.');
 const {data,error}=await sb.from('obras').select('id').eq('id',id).eq('empresa_id',company).maybeSingle();
 if(error||!data?.id)throw Error('Sem acesso à obra.');
}
async function compress(file){
 // Fotos HEIC/HEIF do iPhone podem vir sem MIME, mas continuam sendo imagens.
 const nome=String(file?.name||'');
 const imagemValida=!!file&&(String(file.type||'').startsWith('image/')||/\.(?:heic|heif|jpg|jpeg|png|webp|avif)$/i.test(nome));
 if(!imagemValida)throw Error('Selecione uma fotografia (JPG, PNG, HEIC ou WebP).');
 // O arquivo original é convertido para uma capa WebP leve (1200 × 675) antes de enviar.
 // Fotos grandes do iPhone devem poder entrar na etapa de compactação.
 if(file.size>150*1024*1024)throw Error('Foto muito grande para processar neste aparelho (limite de 150 MB).');
 const url=URL.createObjectURL(file);
 try{
  const img=await new Promise((ok,bad)=>{
   const im=new Image();im.onload=()=>ok(im);im.onerror=()=>bad(Error('Não foi possível abrir esta imagem. Tente uma foto em JPG ou PNG.'));im.src=url;
  });
  const w=img.naturalWidth,h=img.naturalHeight;
  if(!w||!h)throw Error('Foto inválida.');
  const aspect=16/9,sw=Math.min(w,h*aspect),sh=sw/aspect;
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=675;
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas indisponível.');
  ctx.drawImage(img,(w-sw)/2,(h-sh)/2,sw,sh,0,0,1200,675);
  const blob=await new Promise(ok=>canvas.toBlob(ok,'image/webp',.78));
  canvas.width=0;canvas.height=0;
  if(!blob)throw Error('Falha ao compactar imagem.');
  return blob;
 }finally{URL.revokeObjectURL(url)}
}
async function change(id,file,remove){
 busy(id,true);
 try{
  if(navigator.onLine===false)throw Error('Conecte à internet para alterar a capa.');
  const {sb,company}=await context();
  await permitted(sb,id,company);
  const target=path(company,id);
  if(remove){
   const {error}=await sb.storage.from(bucket).remove([target]);
   if(error)throw error;
   cache.set(id,{url:defaultUrl,expires:Date.now()+60000});apply(id,defaultUrl);
   toast('Imagem padrão restaurada.');
  }else{
   const blob=await compress(file);
   const {error}=await sb.storage.from(bucket).upload(target,blob,{upsert:true,contentType:'image/webp',cacheControl:'0'});
   if(error)throw error;
   cache.delete(id);
   const url=await load(id,true);
   if(url===defaultUrl)throw Error('Foto enviada; reabra Obras para atualizar a capa.');
   apply(id,url);toast('Foto da capa salva para esta obra.');
  }
 }catch(err){toast(err.message||'Não foi possível alterar a capa.',true)}
 finally{busy(id,false)}
}
function pick(id,camera){
 const input=document.createElement('input');input.type='file';input.accept='image/*';
 if(camera)input.setAttribute('capture','environment');
 input.hidden=true;document.body.appendChild(input);
 input.addEventListener('change',()=>{
  const file=input.files?.[0];input.remove();
  if(file)void change(id,file,false);
 },{once:true});
 input.click();
 window.addEventListener('focus',()=>setTimeout(()=>{if(input.isConnected&&!input.files?.length)input.remove()},900),{once:true});
}
function click(event){
 const el=event.target.closest?.('[data-obrix-capa-choose],[data-obrix-capa-camera],[data-obrix-capa-remove]');
 if(!el||!document.getElementById('obras')?.contains(el))return;
 const id=String(el.dataset.obrixCapaChoose||el.dataset.obrixCapaCamera||el.dataset.obrixCapaRemove||'');
 if(!uuid(id))return;
 event.preventDefault();event.stopPropagation();
 if(el.hasAttribute('data-obrix-capa-remove'))void change(id,null,true);
 else pick(id,el.hasAttribute('data-obrix-capa-camera'));
}
function boot(){
 const obras=document.getElementById('obras');if(!obras)return;
 new MutationObserver(ch=>{if(ch.some(c=>c.addedNodes.length||c.removedNodes.length))queue()})
 .observe(obras,{subtree:true,childList:true});
 document.addEventListener('click',click);
 window.addEventListener('pageshow',queue,{passive:true});
 queue();
}
window.OBRIX_CAPAS={defaultUrl,get:load,refresh:()=>{cache.clear();queue()}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();