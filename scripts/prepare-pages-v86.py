from pathlib import Path
import runpy, shutil, re
runpy.run_path('scripts/prepare-pages-v85.py', run_name='__main__')
out=Path('.pages')
required_pages=[Path('obrix.html'),Path('obrix-financeiro-main.js'),Path('obrix-estoque-main.js'),Path('obrix-estoque-operacoes-main.js'),Path('obrix-equipe-main.js'),Path('obrix-equipe-lista-vertical.js'),Path('obrix-obras-main.js'),Path('obrix-menu-main.js'),Path('obrix-theme-main.js'),Path('obrix-faltas-meia-test.html'),Path('obrix-financeiro-test.html'),Path('obrix-estoque-saida-test.html'),Path('obrix-estoque-saida-test.js'),Path('obrix-estoque-transferencia-test.html'),Path('obrix-estoque-transferencia-test.js'),Path('obrix-estoque-ajuste-test.html'),Path('obrix-estoque-ajuste-test.js'),Path('obrix-estoque-reposicao-test.html'),Path('obrix-estoque-reposicao-test.js'),Path('obrix-estoque-recebimento-test.html'),Path('obrix-estoque-recebimento-test.js'),Path('obrix-estoque-pagamento-test.html'),Path('obrix-estoque-pagamento-test.js'),Path('obrix-estoque-historico-test.html'),Path('obrix-estoque-historico-test.js'),Path('obrix-estoque-menu-integration.js'),Path('obrix-obras-resumo-integration.js'),Path('obrix-equipe-diarias-integration.js'),Path('obrix-equipe-vale.js'),Path('obrix-equipe-bonus.js'),Path('obrix-equipe-pagamento.js'),Path('obrix-dashboard-integration.js'),Path('obrix-visao-geral-main.js'),Path('equipe-layout87.js')]
for page in required_pages:
 if not page.exists(): raise SystemExit(f'PWA v86: arquivo público ausente: {page.name}')
 shutil.copy2(page,out/page.name)

# Layout final da Equipe na página pública antiga: botões no topo, lista direta, dados cadastrais e falta rápida.
# A versão 873 também força Safari/PWA a abandonar a interface antiga em cache.
public_index=out/'index.html'
public_html=public_index.read_text(encoding='utf-8')
public_html=re.sub(r'<script src="\./equipe-layout87\.js\?v=\d+" defer></script>\s*','',public_html)
public_html=re.sub(r'<script id="edifiq-release-\d+">.*?</script>\s*','',public_html,flags=re.S)
team_marker='<script src="./equipe-layout87.js?v=873" defer></script>'
release_marker='''<script id="edifiq-release-873">(function(){try{var u=new URL(location.href);if(u.searchParams.get("edv")!=="873"){u.searchParams.set("edv","873");location.replace(u.toString());}}catch(_){}})();</script>'''
pos=public_html.lower().rfind('</body>')
if pos<0: raise SystemExit('PWA v86: body ausente na página pública')
public_html=public_html[:pos]+team_marker+'\n'+release_marker+'\n'+public_html[pos:]
public_index.write_text(public_html,encoding='utf-8')

# Nova identidade de instalação/start_url para o iPhone não reutilizar a PWA antiga.
manifest=out/'manifest.webmanifest'
m=manifest.read_text(encoding='utf-8')
m=re.sub(r'"id"\s*:\s*"\./(?:\?pwa=\d+)?"','"id": "./?pwa=873"',m)
m=re.sub(r'"start_url"\s*:\s*"\./(?:\?pwa=\d+)?"','"start_url": "./?pwa=873"',m)
manifest.write_text(m,encoding='utf-8')

# Força cache novo dos módulos do OBRIX em cada publicação.
obrix=out/'obrix.html'
obrix_html=obrix.read_text(encoding='utf-8')
for modulo in ('obrix-financeiro-main.js','obrix-estoque-main.js','obrix-equipe-main.js','obrix-obras-main.js','obrix-estoque-operacoes-main.js','obrix-menu-main.js','obrix-theme-main.js'):
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
print('Versão pública v873 preparada com OBRIX atualizado e Equipe organizada.')
