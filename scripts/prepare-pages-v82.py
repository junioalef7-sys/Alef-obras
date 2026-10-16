from pathlib import Path
import runpy
import shutil

runpy.run_path('scripts/prepare-pages-v81.py', run_name='__main__')
out=Path('.pages')
fix=Path('navigation-fix82.js')
if not fix.exists(): raise SystemExit('Navegação v82: arquivo ausente')
shutil.copy2(fix,out/fix.name)

index=out/'index.html'
html=index.read_text(encoding='utf-8')
marker='<script src="./navigation-fix82.js?v=82" defer></script>'
if marker not in html:
    pos=html.lower().rfind('</body>')
    if pos<0: raise SystemExit('Navegação v82: </body> ausente')
    html=html[:pos]+marker+'\n'+html[pos:]
index.write_text(html,encoding='utf-8')

swp=out/'edifiq-sw.js'
sw=swp.read_text(encoding='utf-8')
if 'edifiq-shell-v81-orcamentos-pdf' not in sw: raise SystemExit('Navegação v82: cache v81 esperado não encontrado')
sw=sw.replace('edifiq-shell-v81-orcamentos-pdf','edifiq-shell-v82-navigation-safe',1)
needle="'./orcamentos-fix81.js?v=81','./visual-fix78.css?v=78'"
repl="'./orcamentos-fix81.js?v=81','./navigation-fix82.js?v=82','./visual-fix78.css?v=78'"
if needle not in sw: raise SystemExit('Navegação v82: lista de assets esperada não encontrada')
sw=sw.replace(needle,repl,1)
swp.write_text(sw,encoding='utf-8')

for required in ['./navigation-fix82.js?v=82','edifiq-shell-v82-navigation-safe']:
    if required not in html+sw: raise SystemExit('Navegação v82: marcador ausente '+required)
print('Versão pública v82 preparada com navegação protegida.')
