from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'.pages'
if OUT.exists(): shutil.rmtree(OUT)
OUT.mkdir(parents=True)
html=(ROOT/'homologacao-real.html').read_text(encoding='utf-8')
html=html.replace('let snap=null;','window.__EDIFIQ_SB__=sb;let snap=null;',1)
html=html.replace('</head>','<link rel="stylesheet" href="./src/app/obras-checklist-view.css"></head>',1)
scripts='<script src="./src/adapters/supabase-obras-write.js"></script><script src="./src/adapters/s