from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'.pages'
if OUT.exists(): shutil.rmtree(OUT)
OUT.mkdir(parents=True)
html=(ROOT/'homologacao-real.html').read_text(encoding='utf-8')
html=html.replace('let snap=null;','window.__EDIFIQ_SB__=sb;let snap=null;',1)
html=html.replace('</head>','<link rel="stylesheet" href="./src/app/obras-checklist-view.css"></head>',1)
html=html.replace('<button id="obrasBtn" class="btn">Obras</button> <button id="sair" class="btn">Sair</button>','<button id="obrasBtn" class="btn">Obras</button> <button id="backupBtn" class="btn" type="button">Exportar backup</button> <button id="sair" class="btn">Sair</button>',1)
scripts=''.join([
'<script src="./src/adapters/supabase-obras-write.js"></script>',
'<script src="./src/adapters/supabase-team-write.js"></script>',
'<script src="./src/core/team-finance-summary.js"></script>',
'<script src="./src/core/backup-core.js"></script>',
'<script src="./src/app/backup-download.js"></script>',
'<script>document.getElementById("backupBtn")?.addEventListener("click",()=>window.EDIFIQBackupDownload?.run())</script>',
'<script src="./src/app/financeiro-summary-view.js"></script>',
'<script src="./src/app/equipe-summary-view.js"></script>',
'<script src="./src/app/obras-checklist-view.js"></script>',
'<script src="./src/app/homologacao-obras-bridge.js"></script>',
'<script src="./src/app/homologacao-obras-autoload.js"></script>',
'<script src="./src/app/obras-editor.js"></script>',
'<script src="./src/app/equipe-editor.js"></script>',
'<script src="./orcamentos-link79.js"></script>'
])
html=html.replace('</body>',scripts+'</body>',1)
(OUT/'index.html').write_text(html,encoding='utf-8')
source=ROOT/'src'
if source.exists(): shutil.copytree(source,OUT/'src')
for name in ('orcamentos.html','orcamentos-link79.js','orcamentos-fix81.js'):
 p=ROOT/name
 if p.exists(): shutil.copy2(p,OUT/name)
(OUT/'preview-edifiq.txt').write_text('EDIFIQ refactor preview - Obras Checklist Equipe Financeiro Orcamentos e Backup; importacao permanece bloqueada ate validacao completa\n',encoding='utf-8')
print('EDIFIQ preview preparado com backup de exportacao e operacoes nao validadas bloqueadas')
