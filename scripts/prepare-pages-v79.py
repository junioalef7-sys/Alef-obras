from pathlib import Path
import base64
import re
import shutil

ROOT = Path('.')
OUT = ROOT / '.pages'

FILES = [
    'edifiq-sw.js','manifest.webmanifest','edifiq-icon-192.png','edifiq-menu-logo.jpg','edific-icon.svg',
    'privacidade.html','exclusao-conta.html','orcamentos.html','billing-fix57.js','account-delete-fix61.js',
    'trial-fix62.js','billing-hotfix63.js','access-limit63.js','core-fix65.js','ui-fix67.js','login-ui68.js',
    'orcamentos-link79.js','visual-fix78.css'
]

if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(parents=True)

for name in FILES:
    src = ROOT / name
    if not src.exists():
        raise SystemExit(f'Arquivo obrigatório ausente: {name}')
    shutil.copy2(src, OUT / name)

page = ROOT / 'index.html'
if not page.exists():
    raise SystemExit('index.html ausente')
html = page.read_text(encoding='utf-8')

html = html.replace('<meta content="EDIFIQ" name="apple-mobile-web-app-title"/>','<meta content="Edific" name="apple-mobile-web-app-title"/>',1)
html = html.replace('<meta name="application-name" content="EDIFIQ"/>','<meta name="application-name" content="Edific"/>',1)
html = re.sub(r'<meta\s+content=["\']black-translucent["\']\s+name=["\']apple-mobile-web-app-status-bar-style["\']\s*/?>','<meta content="default" name="apple-mobile-web-app-status-bar-style"/>',html,count=1,flags=re.I)

html = html.replace("hint.textContent='7 dias de teste grátis';","hint.textContent='';hint.hidden=true;hint.style.display='none';")
html = html.replace('authMsg("E-mail ou senha incorretos.");','authMsg("Senha incorreta ou dados incorretos.");')
html = html.replace("authMsg('E-mail ou senha incorretos.');","authMsg('Senha incorreta ou dados incorretos.');")

logo_b64 = base64.b64encode((OUT/'edifiq-menu-logo.jpg').read_bytes()).decode('ascii')
touch = f'<link rel="apple-touch-icon" sizes="1254x1254" href="data:image/jpeg;base64,{logo_b64}"/>'
if re.search(r'<link\s+[^>]*rel=["\']apple-touch-icon["\'][^>]*>',html,re.I):
    html = re.sub(r'<link\s+[^>]*rel=["\']apple-touch-icon["\'][^>]*>',touch,html,count=1,flags=re.I)
else:
    html = html.replace('</head>',touch+'\n</head>',1)
html = re.sub(r'<link\s+[^>]*rel=["\'](?:icon|shortcut icon)["\'][^>]*>\s*','',html,flags=re.I)
html = html.replace('</head>','<link rel="icon" type="image/jpeg" sizes="1254x1254" href="./edifiq-menu-logo.jpg?v=75"/>\n</head>',1)

html = re.sub(r'<link[^>]+href=["\']\./visual-fix78\.css[^"\']*["\'][^>]*>\s*','',html,flags=re.I)
html = html.replace('</head>','<link rel="stylesheet" href="./visual-fix78.css?v=78"/>\n</head>',1)

fixes = ['billing-fix57.js','account-delete-fix61.js','trial-fix62.js','billing-hotfix63.js','access-limit63.js','core-fix65.js','ui-fix67.js','login-ui68.js','orcamentos-link79.js']
for name in fixes:
    html = re.sub(r'<script[^>]+src=["\']\./'+re.escape(name)+r'[^"\']*["\'][^>]*></script>\s*','',html,flags=re.I)

pos = html.lower().rfind('</body>')
if pos < 0:
    raise SystemExit('Fechamento </body> não encontrado')
addons = '''<script src="./core-fix65.js?v=75" defer></script>
<script src="./billing-fix57.js?v=75" defer></script>
<script src="./account-delete-fix61.js?v=75" defer></script>
<script src="./trial-fix62.js?v=75" defer></script>
<script src="./billing-hotfix63.js?v=75" defer></script>
<script src="./access-limit63.js?v=75" defer></script>
<script src="./ui-fix67.js?v=77" defer></script>
<script src="./login-ui68.js?v=75" defer></script>
<script src="./orcamentos-link79.js?v=79" defer></script>
'''
html = html[:pos] + addons + html[pos:]

required = [
    'edifiqPostLoginStartup','setTimeout(()=>edifiqPostLoginStartup(session),0)','classList.remove("hidden")',
    './trial-fix62.js?v=75','./ui-fix67.js?v=77','./login-ui68.js?v=75','./orcamentos-link79.js?v=79',
    './visual-fix78.css?v=78','Senha incorreta ou dados incorretos.','data:image/jpeg;base64,','apple-mobile-web-app-status-bar-style'
]
for marker in required:
    if marker not in html:
        raise SystemExit('PUBLICAÇÃO PROTEGIDA: marcador ausente: '+marker)
for marker in ["hint.textContent='7 dias de teste grátis';",'authMsg("E-mail ou senha incorretos.");',"authMsg('E-mail ou senha incorretos.');",'black-translucent']:
    if marker in html:
        raise SystemExit('PUBLICAÇÃO BLOQUEADA: estado antigo reapareceu: '+marker)

(OUT/'index.html').write_text(html,encoding='utf-8')
(OUT/'.nojekyll').touch()
print('Versão pública v79 preparada com sucesso.')
