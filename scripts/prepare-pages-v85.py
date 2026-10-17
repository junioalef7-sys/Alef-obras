from pathlib import Path
import runpy, shutil
runpy.run_path('scripts/prepare-pages-v84.py', run_name='__main__')
out=Path('.pages'); fix=Path('action-fix85.js')
if not fix.exists(): raise SystemExit('PWA v86: action fix ausente')
shutil.copy2(fix,out/fix.name)
pagbank_test=Path('pagbank-teste.html')
if not pagbank_test.exists(): raise SystemExit('PWA v86: página de teste PagBank ausente')
shutil.copy2(pagbank_test,out/pagbank_test.name)
for name in ['obrix-backend-test.html','obrix-backend-adapter.js','obrix-app-test.html','obrix-financeiro-test.html','obrix-sync-test.html','obrix-realtime-sync.js','obrix-equipe-pagamento-test.html','obrix-vales-bonus-test.html','obrix-faltas-meia-test.html','obrix-checklist-test.html','obrix-diario-test.html','obrix-fotos-test.html','foto1.js','foto2.js','foto3.js','foto4.js']:
 p=Path(name)
 if not p.exists(): raise SystemExit('PWA v86: arquivo de teste OBRIX ausente: '+name)
 shutil.copy2(p,out/p.name)
index=out/'index.html'; html=index.read_text(encoding='utf-8')
html=html.replace('<script src="./navigation-fix82.js?v=82" defer></script>','')
html=html.replace('<script src="./action-fix85.js?v=854" defer></script>','')
marker='<script src="./action-fix85.js?v=860" defer></script>'
pos=html.lower().rfind('</body>')
if pos<0: raise SystemExit('PWA v86: body ausente')
html=html[:pos]+marker+'\n'+html[pos:]
index.write_text(html,encoding='utf-8')
swp=out/'edifiq-sw.js'
sw="""self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('edifiq-shell-')).map(k=>caches.delete(k)));await self.clients.claim()})()));
"""
swp.write_text(sw,encoding='utf-8')
manifest=out/'manifest.webmanifest'; m=manifest.read_text(encoding='utf-8')
m=m.replace('"id": "./"','"id": "./?pwa=860"').replace('"start_url": "./"','"start_url": "./?pwa=860"')
manifest.write_text(m,encoding='utf-8')
if './navigation-fix82.js?v=82' in html: raise SystemExit('PWA v86: navegação duplicada')
if html.count('./action-fix85.js') != 1: raise SystemExit('PWA v86: action fix duplicado')
if 'fetch' in sw: raise SystemExit('PWA v86: service worker interceptando rede')
for required in ['./action-fix85.js?v=860','?pwa=860']:
 if required not in html+m: raise SystemExit('PWA v86: marcador ausente '+required)
print('Versão pública v86 preparada sem navegação duplicada e sem interceptação de rede.')
