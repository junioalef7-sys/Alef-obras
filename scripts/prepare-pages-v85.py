from pathlib import Path
import runpy, shutil

runpy.run_path('scripts/prepare-pages-v84.py', run_name='__main__')
out=Path('.pages')
fix=Path('action-fix85.js')
if not fix.exists(): raise SystemExit('Ações v85.3: arquivo ausente')
shutil.copy2(fix,out/fix.name)

index=out/'index.html'
html=index.read_text(encoding='utf-8')
marker='<script src="./action-fix85.js?v=853" defer></script>'
if marker not in html:
    pos=html.lower().rfind('</body>')
    if pos<0: raise SystemExit('Ações v85.3: </body> ausente')
    html=html[:pos]+marker+'\n'+html[pos:]
index.write_text(html,encoding='utf-8')

# PWA v85.3: não mantém shell antigo. O app instalado passa a buscar os mesmos
# arquivos da rede usados pelo Safari; caches EDIFIQ antigos são removidos.
swp=out/'edifiq-sw.js'
sw="""const CACHE_PREFIX='edifiq-shell-';
self.addEventListener('install',event=>{self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)).map(k=>caches.delete(k)));await self.clients.claim()})())});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;event.respondWith(fetch(req,{cache:'no-store'}).catch(()=>Response.error()))});
"""
swp.write_text(sw,encoding='utf-8')

manifest=out/'manifest.webmanifest'
m=manifest.read_text(encoding='utf-8')
m=m.replace('"id": "./"','"id": "./?pwa=853"')
m=m.replace('"start_url": "./"','"start_url": "./?pwa=853"')
manifest.write_text(m,encoding='utf-8')

for required in ['./action-fix85.js?v=853','?pwa=853']:
    if required not in html+m: raise SystemExit('Ações v85.3: marcador ausente '+required)
if "caches.delete" not in sw or "cache:'no-store'" not in sw: raise SystemExit('PWA v85.3: limpeza de cache ausente')
print('Versão pública v85.3 preparada: PWA sem shell antigo e com carregamento igual ao Safari.')
