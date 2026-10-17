from pathlib import Path
import runpy, shutil

runpy.run_path('scripts/prepare-pages-v85.py', run_name='__main__')
out = Path('.pages')

required_pages = [
    Path('obrix-faltas-meia-test.html'),
    Path('obrix-estoque-saida-test.html'),
    Path('obrix-estoque-saida-test.js'),
]

for page in required_pages:
    if not page.exists():
        raise SystemExit(f'PWA v86: arquivo público ausente: {page.name}')
    shutil.copy2(page, out / page.name)

print('Versão pública v86 preparada com testes de meia diária/faltas e saída de estoque.')
