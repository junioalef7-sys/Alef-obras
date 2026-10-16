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

# Orçamentos v80: não depender de import ESM sem timeout no iPhone/PWA.
orc_path = OUT / 'orcamentos.html'
orc = orc_path.read_text(encoding='utf-8')
orc = orc.replace('<title>Orçamentos — Edific</title>', '<title>Orçamentos — Edific</title>\n<!-- ORCAMENTOS_V80_TIMEOUT_SAFE -->', 1)
orc = orc.replace(
    '  <div id="loading" class="notice"><span class="spinner"></span> Carregando...</div>',
    '  <div id="loading" class="notice"><span class="spinner"></span> <span id="loadingText">Carregando...</span></div>\n'
    '  <div id="loadError" class="notice warn hidden"><b>Não foi possível abrir Orçamentos.</b><div id="loadErrorText" style="margin:6px 0 10px"></div><button id="retryBtn" class="btn">Tentar novamente</button></div>',
    1,
)
old_boot = """<script type=\"module\">\nimport{createClient}from'https://esm.sh/@supabase/supabase-js@2.117.3';\nconst sb=createClient('https://lwqntzwajjgkvtynwdjg.supabase.co','sb_publishable_yAGQ6P0-43ia5EiLcR8rJQ_VEOf-mjn',{auth:{persistSession:true,detectSessionInUrl:true,autoRefreshToken:true}});"""
new_boot = """<script>\nlet sb=null;\nconst SUPA_URL='https://lwqntzwajjgkvtynwdjg.supabase.co',SUPA_KEY='sb_publishable_yAGQ6P0-43ia5EiLcR8rJQ_VEOf-mjn';\nfunction withTimeout(promise,ms,label='Operação'){return Promise.race([Promise.resolve(promise),new Promise((_,rej)=>setTimeout(()=>rej(new Error(label+' demorou demais. Tente novamente.')),ms))])}\nasync function loadSupabase(){\n if(window.supabase?.createClient)return window.supabase;\n const urls=['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3','https://unpkg.com/@supabase/supabase-js@2.117.3/dist/umd/supabase.min.js'];\n for(const src of urls){\n  try{\n   await withTimeout(new Promise((resolve,reject)=>{const old=document.querySelector('script[data-ed-orc-supa=\\\"1\\\"]');if(old)old.remove();const sc=document.createElement('script');sc.src=src;sc.async=true;sc.dataset.edOrcSupa='1';sc.onload=resolve;sc.onerror=()=>reject(new Error('Falha ao carregar biblioteca'));document.head.appendChild(sc)}),8000,'Conexão com o servidor');\n   if(window.supabase?.createClient)return window.supabase;\n  }catch(e){console.warn('Orçamentos: falha ao carregar Supabase por',src,e)}\n }\n throw new Error('Não foi possível carregar a conexão do Edific.');\n}\nasync function ensureClient(){if(sb)return sb;const lib=await loadSupabase();sb=lib.createClient(SUPA_URL,SUPA_KEY,{auth:{persistSession:true,detectSessionInUrl:true,autoRefreshToken:true}});return sb;}"""
if old_boot not in orc:
    raise SystemExit('ORÇAMENTOS V80: bootstrap antigo não encontrado')
orc = orc.replace(old_boot, new_boot, 1)

old_init = """async function init(){const{data:{session}}=await sb.auth.getSession();S.session=session;if(!session){location.replace('./');return}let limited=false;try{const{data,error}=await sb.rpc('edifiq_assinatura_atual');if(!error&&data)limited=!hasFullAccess(data)}catch(_){}$('loading').classList.add('hidden');if(limited){$('limited').classList.remove('hidden');$('newBtn').disabled=true;return}$('home').classList.remove('hidden');await loadList()}\nasync function loadList(){setBusy(true);try{const{data,error}=await sb.from('orcamentos').select('id,numero,cliente,obra_nome,endereco,telefone,email,valor,subtotal,desconto,pagamento,status,data_orcamento,validade_dias,materiais,prazo,observacoes,condicoes_pagamento,obra_id,created_at,updated_at').order('created_at',{ascending:false});if(error)throw error;S.rows=data||[];renderHome()}catch(e){console.error(e);toast('Não foi possível carregar os orçamentos.')}finally{setBusy(false)}}"""
new_init = """function showLoadError(e){$('loading').classList.add('hidden');$('home').classList.add('hidden');$('loadError').classList.remove('hidden');$('loadErrorText').textContent=e?.message||'Falha de conexão. Tente novamente.'}\nasync function init(){\n $('loadError').classList.add('hidden');$('limited').classList.add('hidden');$('home').classList.add('hidden');$('loading').classList.remove('hidden');$('loadingText').textContent='Conectando ao Edific...';\n try{\n  const client=await ensureClient();\n  $('loadingText').textContent='Confirmando sua sessão...';\n  const ses=await withTimeout(client.auth.getSession(),8000,'Confirmação da sessão');const session=ses?.data?.session;S.session=session;if(!session){location.replace('./');return}\n  $('loadingText').textContent='Verificando acesso...';\n  const sub=await withTimeout(client.rpc('edifiq_assinatura_atual'),8000,'Verificação da assinatura');if(sub?.error)throw sub.error;const limited=!!sub?.data&&!hasFullAccess(sub.data);\n  $('loading').classList.add('hidden');\n  if(limited){$('limited').classList.remove('hidden');$('newBtn').disabled=true;return}\n  $('home').classList.remove('hidden');await loadList();\n }catch(e){console.error('Orçamentos init:',e);showLoadError(e)}\n}\nasync function loadList(){setBusy(true);try{const client=await ensureClient();const q=client.from('orcamentos').select('id,numero,cliente,obra_nome,endereco,telefone,email,valor,subtotal,desconto,pagamento,status,data_orcamento,validade_dias,materiais,prazo,observacoes,condicoes_pagamento,obra_id,created_at,updated_at').order('created_at',{ascending:false});const{data,error}=await withTimeout(q,10000,'Carregamento dos orçamentos');if(error)throw error;S.rows=data||[];renderHome()}catch(e){console.error(e);showLoadError(e)}finally{setBusy(false)}}"""
if old_init not in orc:
    raise SystemExit('ORÇAMENTOS V80: init antigo não encontrado')
orc = orc.replace(old_init, new_init, 1)

orc = orc.replace(
    "async function loadItems(id){const{data,error}=await sb.from('orcamento_itens').select('id,descricao,unidade,quantidade,valor_unitario,total,ordem').eq('orcamento_id',id).order('ordem').order('id');if(error)throw error;return data||[]}",
    "async function loadItems(id){const client=await ensureClient();const q=client.from('orcamento_itens').select('id,descricao,unidade,quantidade,valor_unitario,total,ordem').eq('orcamento_id',id).order('ordem').order('id');const{data,error}=await withTimeout(q,10000,'Carregamento dos serviços');if(error)throw error;return data||[]}",
    1,
)
orc = orc.replace("$('backApp').onclick=()=>location.assign('./');", "$('retryBtn').onclick=()=>init();$('backApp').onclick=()=>location.assign('./');", 1)

if 'esm.sh/@supabase/supabase-js' in orc:
    raise SystemExit('ORÇAMENTOS V80: import ESM antigo permaneceu')
for marker in ['ORCAMENTOS_V80_TIMEOUT_SAFE','Tentar novamente','withTimeout','ensureClient','cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3']:
    if marker not in orc:
        raise SystemExit('ORÇAMENTOS V80: marcador ausente: '+marker)
orc_path.write_text(orc, encoding='utf-8')

# Página principal: preserva todos os patches já auditados.
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
required = ['edifiqPostLoginStartup','setTimeout(()=>edifiqPostLoginStartup(session),0)','classList.remove("hidden")','./trial-fix62.js?v=75','./ui-fix67.js?v=77','./login-ui68.js?v=75','./orcamentos-link79.js?v=79','./visual-fix78.css?v=78','Senha incorreta ou dados incorretos.','data:image/jpeg;base64,','apple-mobile-web-app-status-bar-style']
for marker in required:
    if marker not in html:
        raise SystemExit('PUBLICAÇÃO PROTEGIDA: marcador ausente: '+marker)
for marker in ["hint.textContent='7 dias de teste grátis';",'authMsg("E-mail ou senha incorretos.");',"authMsg('E-mail ou senha incorretos.');",'black-translucent']:
    if marker in html:
        raise SystemExit('PUBLICAÇÃO BLOQUEADA: estado antigo reapareceu: '+marker)
(OUT/'index.html').write_text(html,encoding='utf-8')
(OUT/'.nojekyll').touch()
print('Versão pública v80 preparada com Orçamentos anti-travamento.')
