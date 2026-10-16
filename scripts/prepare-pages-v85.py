from pathlib import Path
import runpy, shutil

runpy.run_path('scripts/prepare-pages-v84.py', run_name='__main__')
out=Path('.pages')
fix=Path('action-fix85.js')
if not fix.exists(): raise SystemExit('Ações v85.2: arquivo ausente')
shutil.copy2(fix,out/fix.name)

index=out/'index.html'
html=index.read_text(encoding='utf-8')
marker='<script src="./action-fix85.js?v=852" defer></script>'
if marker not in html:
    pos=html.lower().rfind('</body>')
    if pos<0: raise SystemExit('Ações v85.2: </body> ausente')
    html=html[:pos]+marker+'\n'+html[pos:]
index.write_text(html,encoding='utf-8')

swp=out/'edifiq-sw.js'
sw=swp.read_text(encoding='utf-8')
if 'edifiq-shell-v84-brand-edifiq' not in sw: raise SystemExit('Ações v85.2: cache v84 esperado não encontrado')
sw=sw.replace('edifiq-shell-v84-brand-edifiq','edifiq-shell-v85-2-mobile-touch-print',1)
needle="'./photo-purge83.js?v=83','./visual-fix78.css?v=78'"
repl="'./photo-purge83.js?v=83','./action-fix85.js?v=852','./visual-fix78.css?v=78'"
if needle not in sw: raise SystemExit('Ações v85.2: lista de assets esperada não encontrada')
sw=sw.replace(needle,repl,1)
swp.write_text(sw,encoding='utf-8')

for required in ['./action-fix85.js?v=852','edifiq-shell-v85-2-mobile-touch-print']:
    if required not in html+sw: raise SystemExit('Ações v85.2: marcador ausente '+required)
print('Versão pública v85.2 preparada para Safari/iPhone e impressão.')
