from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.pages'

if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(parents=True)

# Publica somente a nova base de homologação como entrada do Preview.
shutil.copy2(ROOT / 'homologacao-real.html', OUT / 'index.html')

for folder in ('src',):
    source = ROOT / folder
    if source.exists():
        shutil.copytree(source, OUT / folder)

# Arquivo marcador para confirmar que o Preview veio da base limpa.
(OUT / 'preview-edifiq.txt').write_text(
    'EDIFIQ refactor preview - clean readonly homologation\n',
    encoding='utf-8'
)

print('EDIFIQ refactor preview preparado em .pages')
