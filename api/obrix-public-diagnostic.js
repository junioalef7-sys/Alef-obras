import crypto from 'node:crypto';
export default async function handler(req,res){
  if(req.method!=='GET'){res.status(405).json({error:'Method not allowed'});return;}
  const origin='https://obrix.junioalef7.workers.dev';
  const files=[
    '/obrix.html',
    '/obrix-relatorio-fotografico.js',
    '/obrix-pos-login-loader.js',
    '/obrix-relatorio-fotografico-realtime.js',
    '/obrix-sw.js'
  ];
  const variants=files.flatMap(path=>[path,path+'?v=20261103busca-oficial1',path+'?v=20261103busca-oficial1&diag=2']);
  const result=await Promise.all(variants.map(async item=>{
    const [path,qs]=item.split('?');
    try {
      const r=await fetch(origin+item,{cache:'no-store',signal:AbortSignal.timeout(10000),headers:{'accept':'text/plain, text/html, application/javascript, */*'}});
      const t=await r.text();
      return {path,query:qs||'',status:r.status,type:r.headers.get('content-type'),cache:r.headers.get('cache-control'),cfCache:r.headers.get('cf-cache-status'),age:r.headers.get('age'),etag:r.headers.get('etag'),lastModified:r.headers.get('last-modified'),length:t.length,sha256:crypto.createHash('sha256').update(t).digest('hex').slice(0,20),
        hasSearchField:t.includes('obrix-rf-busca'),
        hasSearchHandler:t.includes("listar(obraId,page,filtros)"),
        hasPhotoModule:t.includes('obrix-relatorio-fotografico.js'),
        hasCacheVersion63:t.includes('obrix-offline-v63-fotos-busca'),
        hasRecentLoader:t.includes('20261103busca-oficial1'),
        looksHtml:t.includes('<html')||t.includes('<!DOCTYPE'),
        title:(t.match(/<title[^>]*>([^<]*)/i)||[])[1]||null};
    }catch(e){return{path,query:qs||'',error:String(e?.message||e).slice(0,250)}}
  }));
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({checked:'public workers.dev files only',result});
}