from pathlib import Path
import runpy
import shutil

# Preserva integralmente a preparação v80 já auditada.
runpy.run_path('scripts/prepare-pages-v80.py', run_name='__main__')

out = Path('.pages')
fix = Path('orcamentos-fix81.js')
if not fix.exists():
    raise SystemExit('Orçamentos v81: arquivo de correção ausente')
shutil.copy2(fix, out / fix.name)

orc_path = out / 'orcamentos.html'
orc = orc_path.read_text(encoding='utf-8')
marker = '<script src="./orcamentos-fix81.js?v=81" defer></script>'
if marker not in orc:
    if '</body>' not in orc:
        raise SystemExit('Orçamentos v81: fechamento </body> ausente')
    orc = orc.replace('</body>', marker + '\n</body>', 1)
orc_path.write_text(orc, encoding='utf-8')

# Força atualização do PWA e deixa o novo módulo disponível offline.
sw_path = out / 'edifiq-sw.js'
sw = sw_path.read_text(encoding='utf-8')
sw = sw.replace("edifiq-shell-v80-orcamentos-safe", "edifiq-shell-v81-orcamentos-pdf", 1)
needle = "'./exclusao-conta.html','./orcamentos.html','./visual-fix78.css?v=78'"
repl = "'./exclusao-conta.html','./orcamentos.html','./orcamentos-fix81.js?v=81','./visual-fix78.css?v=78'"
if needle not in sw:
    raise SystemExit('Orçamentos v81: lista do Service Worker não encontrada')
sw = sw.replace(needle, repl, 1)
sw_path.write_text(sw, encoding='utf-8')

for required in [
    'orcamentos-fix81.js?v=81',
    'edifiq-shell-v81-orcamentos-pdf',
]:
    if required not in (orc + sw):
        raise SystemExit('Orçamentos v81: marcador ausente: ' + required)

print('Versão pública v81 preparada: ações, PDF e compartilhamento corrigidos.')
