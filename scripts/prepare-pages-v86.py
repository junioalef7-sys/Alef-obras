from pathlib import Path
import runpy, shutil

runpy.run_path('scripts/prepare-pages-v85.py', run_name='__main__')
out = Path('.pages')
page = Path('obrix-faltas-meia-test.html')
if not page.exists():
    raise SystemExit('PWA v86: página de teste de meia diária/faltas ausente')
shutil.copy2(page, out / page.name)
print('Versão pública v86 preparada com teste de meia diária e faltas.')
