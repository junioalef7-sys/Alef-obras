from pathlib import Path
import runpy, shutil
runpy.run_path('scripts/prepare-pages-v84.py', run_name='__main__')
out=Path('.pages'); fix=Path('action-fix85.js')
if not fix.exists(): raise SystemExit('Ações v85.4: arquivo ausente')
shutil.copy2(fix,out/fix.name)
index=out/'index.html'; html=index.read_text(encoding='utf-8')
marker='<script src="./action-fix85.js?v=854" defer></script>'
if marker not in html:
 pos=html.lower().rfind('</body>')
 if pos<0: raise SystemExit('Ações v85.4: </body> ausente')
 html=html[:pos]+marker+'\n'+html[pos:]
index.write_text(html,encoding='utf-8')
swp=out/'edifiq-sw.js'; sw="""const CACHE_PREFIX='edifiq-shell-';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)).map(k=>caches.delete(k)));await self.clients.claim()})()));
self.addEventListener('fetch',event=>{const r=event.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==self.location.origin)return;event.respondWith(fetch(r,{cache:'no-store'}).catch(()=>Response.error()))});
"""; swp.write_text(sw,encoding='utf-8')
manifest=out/'manifest.webmanifest'; m=manifest.read_text(encoding='utf-8').replace('"id": "./"','"id": "./?pwa=854"').replace('"start_url": "./"','"start_url": "./?pwa=854"'); manifest.write_text(m,encoding='utf-8')
if 'touchend' in (out/'action-fix85.js').read_text(encoding='utf-8'): raise SystemExit('PWA v85.4: touchend antigo ainda presente')
for required in ['./action-fix85.js?v=854','?pwa=854']:
 if required not in html+m: raise SystemExit('PWA v85.4: marcador ausente '+required)
print('Versão pública v85.4 preparada: camada única de clique para navegador e PWA.')