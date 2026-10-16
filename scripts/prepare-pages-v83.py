from pathlib import Path
import runpy
import shutil

runpy.run_path('scripts/prepare-pages-v82.py', run_name='__main__')
out=Path('.pages')
fix=Path('photo-purge83.js')
if not fix.exists(): raise SystemExit('Fotos v83: arquivo ausente')
shutil.copy2(fix,out/fix.name)

index=out/'index.html'
html=index.read_text(encoding='utf-8')
marker='<script src="./photo-purge83.js?v=83" defer></script>'
if marker not in html:
    pos=html.lower().rfind('</body>')
    if pos<0: raise SystemExit('Fotos v83: fechamento body ausente')
    html=html[:pos]+marker+'\n'+html[pos:]
index.write_text(html,encoding='utf-8')

swp=out/'edifiq-sw.js'
sw=swp.read_text(encoding='utf-8')
if 'edifiq-shell-v82-navigation-safe' not in sw: raise SystemExit('Fotos v83: cache v82 esperado não encontrado')
sw=sw.replace('edifiq-shell-v82-navigation-safe','edifiq-shell-v83-manual-photo-delete',1)
needle="'./navigation-fix82.js?v=82','./visual-fix78.css?v=78'"
repl="'./navigation-fix82.js?v=82','./photo-purge83.js?v=83','./visual-fix78.css?v=78'"
if needle not in sw: raise SystemExit('Fotos v83: lista de assets esperada não encontrada')
sw=sw.replace(needle,repl,1)
swp.write_text(sw,encoding='utf-8')

for required in ['./photo-purge83.js?v=83','edifiq-shell-v83-manual-photo-delete']:
    if required not in html+sw: raise SystemExit('Fotos v83: marcador ausente '+required)
print('Versão pública v83 preparada: exclusão manual autenticada das fotos antigas.')
