from pathlib import Path
import runpy, shutil
runpy.run_path('scripts/prepare-pages-v85.py', run_name='__main__')
out=Path('.pages')
required_pages=[Path('obrix.html'),Path('obrix-financeiro-main.js'),Path('obrix-estoque-main.js'),Path('obrix-estoque-operacoes-main.js'),Path('obrix-equipe-main.js'),Path('obrix-obras-main.js'),Path('obrix-menu-main.js'),Path('obrix-theme-main.js'),Path('obrix-faltas-meia-test.html'),Path('obrix-financeiro-test.html'),Path('obrix-estoque-saida-test.html'),Path('obrix-estoque-saida-test.js'),Path('obrix-estoque-transferencia-test.html'),Path('obrix-estoque-transferencia-test.js'),Path('obrix-estoque-ajuste-test.html'),Path('obrix-estoque-ajuste-test.js'),Path('obrix-estoque-reposicao-test.html'),Path('obrix-estoque-reposicao-test.js'),Path('obrix-estoque-recebimento-test.html'),Path('obrix-estoque-recebimento-test.js'),Path('obrix-estoque-pagamento-test.html'),Path('obrix-estoque-pagamento-test.js'),Path('obrix-estoque-historico-test.html'),Path('obrix-estoque-historico-test.js'),Path('obrix-estoque-menu-integration.js'),Path('obrix-obras-resumo-integration.js'),Path('obrix-equipe-diarias-integration.js'),Path('obrix-equipe-vale.js'),Path('obrix-equipe-bonus.js'),Path('obrix-equipe-pagamento.js'),Path('obrix-dashboard-integration.js'),Path('obrix-visao-geral-main.js')]
for page in required_pages:
 if not page.exists(): raise SystemExit(f'PWA v86: arquivo público ausente: {page.name}')
 shutil.copy2(page,out/page.name)
# Forca cache novo dos modulos do OBRIX em cada publicacao.
obrix=out/'obrix.html'
obrix_html=obrix.read_text(encoding='utf-8')
for modulo in ('obrix-financeiro-main.js','obrix-estoque-main.js','obrix-equipe-main.js','obrix-obras-main.js','obrix-estoque-operacoes-main.js','obrix-menu-main.js','obrix-theme-main.js'):
 import re
 obrix_html=re.sub(rf'({re.escape(modulo)}\?v=)\d+',rf'\g<1>315',obrix_html)
obrix.write_text(obrix_html,encoding='utf-8')
app=out/'obrix-app-test.html'
if not app.exists(): raise SystemExit('PWA v86: app principal de teste OBRIX ausente')
html=app.read_text(encoding='utf-8')
for old in ('213','214','215','216'): html=html.replace(f'<script src="./obrix-estoque-menu-integration.js?v={old}"></script>','')
stock='<script src="./obrix-estoque-menu-integration.js?v=217"></script>'
if stock not in html:
 pos=html.lower().rfind('</body>');html=html[:pos]+stock+'\n'+html[pos:]
for old in ('256','257','258','259','260'): html=html.replace(f'<script src="./obrix-obras-resumo-integration.js?v={old}"></script>','')
pos=html.lower().rfind('</body>');html=html[:pos]+'<script src="./obrix-obras-resumo-integration.js?v=261"></script>\n'+html[pos:]
for old in ('263','264','265','266'): html=html.replace(f'<script src="./obrix-equipe-diarias-integration.js?v={old}"></script>','')
pos=html.lower().rfind('</body>');html=html[:pos]+'<script src="./obrix-equipe-diarias-integration.js?v=267"></script>\n'+html[pos:]
pos=html.lower().rfind('</body>');html=html[:pos]+'<script src="./obrix-equipe-vale.js?v=269"></script>\n<script src="./obrix-equipe-bonus.js?v=271"></script>\n<script src="./obrix-equipe-pagamento.js?v=276"></script>\n<script src="./obrix-dashboard-integration.js?v=278"></script>\n'+html[pos:]
app.write_text(html,encoding='utf-8')
print('Versão pública v86 preparada com OBRIX em /obrix.html, sem substituir o EDIFIQ.')