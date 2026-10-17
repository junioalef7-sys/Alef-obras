from pathlib import Path
import runpy, shutil

runpy.run_path('scripts/prepare-pages-v85.py', run_name='__main__')
out = Path('.pages')

required_pages = [
    Path('obrix-faltas-meia-test.html'),
    Path('obrix-estoque-saida-test.html'),
    Path('obrix-estoque-saida-test.js'),
    Path('obrix-estoque-transferencia-test.html'),
    Path('obrix-estoque-transferencia-test.js'),
    Path('obrix-estoque-ajuste-test.html'),
    Path('obrix-estoque-ajuste-test.js'),
    Path('obrix-estoque-menu-integration.js'),
]

for page in required_pages:
    if not page.exists():
        raise SystemExit(f'PWA v86: arquivo público ausente: {page.name}')
    shutil.copy2(page, out / page.name)

app = out / 'obrix-app-test.html'
if not app.exists():
    raise SystemExit('PWA v86: app principal de teste OBRIX ausente')
html = app.read_text(encoding='utf-8')
html = html.replace('<script src="./obrix-estoque-menu-integration.js?v=213"></script>','')
marker = '<script src="./obrix-estoque-menu-integration.js?v=214"></script>'
if marker not in html:
    pos = html.lower().rfind('</body>')
    if pos < 0:
        raise SystemExit('PWA v86: body ausente no app principal OBRIX')
    html = html[:pos] + marker + '\n' + html[pos:]
    app.write_text(html, encoding='utf-8')

print('Versão pública v86 preparada com ajuste de inventário integrado ao estoque do OBRIX.')
