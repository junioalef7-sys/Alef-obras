from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'.pages'
if OUT.exists(): shutil.rmtree(OUT)
OUT.mkdir(parents=True)
html=(ROOT/'homologacao-real.html').read_text(encoding='utf-8')
html=html.replace('let snap=null;','window.__EDIFIQ_SB__=sb;let snap=null;',1)
html=html.replace('</head>','<link rel="stylesheet" href="./src/app/obras-checklist-view.css"></head>',1)
scripts='<script src="./src/adapters/supabase-obras-write.js"></script><script src="./src/adapters/supabase-team-write.js"></script><script src="./src/adapters/supabase-team-adjustments.js"></script><script src="./src/app/obras-checklist-view.js"></script><script src="./src/app/homologacao-obras-bridge.js"></script><script src="./src/app/homologacao-obras-autoload.js"></script><script src="./src/app/obras-editor.js"></script><script src="./src/app/equipe-editor.js"></script>'
html=html.replace('</body>',scripts+'</body>',1)
(OUT/'index.html').write_text(html,encoding='utf-8')
source=ROOT/'src'
if source.exists(): shutil.copytree(source,OUT/'src')
(OUT/'preview-edifiq.txt').write_text('EDIFIQ refactor preview - Equipe com Vale e faltas preparados\n',encoding='utf-8')
print('EDIFIQ preview preparado com ajustes seguros da Equipe')
