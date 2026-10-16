from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.pages'

if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(parents=True)

html = (ROOT / 'homologacao-real.html').read_text(encoding='utf-8')
html = html.replace('let snap=null;', 'window.__EDIFIQ_SB__=sb;let snap=null;', 1)
html = html.replace('</head>', '<link rel="stylesheet" href="./src/app/obras-checklist-view.css"></head>', 1)
html = html.replace('</body>', '<script src="./src/adapters/supabase-obras-write.js"></script><script src="./src/app/obras-checklist-view.js"></script><script src="./src/app/homologacao-obras-bridge.js"></script><script src="./src/app/homologacao-obras-autoload.js"></script></body>', 1)
(OUT / 'index.html').write_text(html, encoding='utf-8')

source = ROOT / 'src'
if source.exists():
    shutil.copytree(source, OUT / 'src')

(OUT / 'preview-edifiq.txt').write_text('EDIFIQ refactor preview - Obras e Checklist com camada de escrita segura\n', encoding='utf-8')
print('EDIFIQ refactor preview preparado com camada segura de Obras e Checklist')
