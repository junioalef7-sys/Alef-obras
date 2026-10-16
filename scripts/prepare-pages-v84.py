from pathlib import Path
import runpy

runpy.run_path('scripts/prepare-pages-v83.py', run_name='__main__')
out=Path('.pages')

# Padroniza somente a marca visível. Não renomeia funções/tabelas internas.
manifest=out/'manifest.webmanifest'
text=manifest.read_text(encoding='utf-8')
text=text.replace('"name": "Edific — Gestão de Obras"','"name": "EDIFIQ — Gestão de Obras"')
text=text.replace('"short_name": "Edific"','"short_name": "EDIFIQ"')
manifest.write_text(text,encoding='utf-8')

index=out/'index.html'
html=index.read_text(encoding='utf-8')
replacements={
    'content="Edific" name="apple-mobile-web-app-title"':'content="EDIFIQ" name="apple-mobile-web-app-title"',
    'name="application-name" content="Edific"':'name="application-name" content="EDIFIQ"',
    '<title>Edific':'<title>EDIFIQ',
    '>Edific<':'>EDIFIQ<',
    '— Edific':'— EDIFIQ'
}
for old,new in replacements.items(): html=html.replace(old,new)
index.write_text(html,encoding='utf-8')

orc=out/'orcamentos.html'
if orc.exists():
    s=orc.read_text(encoding='utf-8')
    s=s.replace('Orçamentos — Edific','Orçamentos — EDIFIQ')
    s=s.replace('← Edific','← EDIFIQ')
    s=s.replace('no Edific para usar Orçamentos','no EDIFIQ para usar Orçamentos')
    orc.write_text(s,encoding='utf-8')

pdf=out/'orcamentos-fix81.js'
if pdf.exists():
    s=pdf.read_text(encoding='utf-8')
    s=s.replace("doc.text('EDIFIC',44,18)","doc.text('EDIFIQ',44,18)")
    s=s.replace('`Edific · ${r.numero', '`EDIFIQ · ${r.numero')
    pdf.write_text(s,encoding='utf-8')

svg=out/'edific-icon.svg'
if svg.exists():
    s=svg.read_text(encoding='utf-8').replace('aria-label="Edific"','aria-label="EDIFIQ"')
    svg.write_text(s,encoding='utf-8')

sw=out/'edifiq-sw.js'
s=sw.read_text(encoding='utf-8')
if 'edifiq-shell-v83-manual-photo-delete' not in s: raise SystemExit('Marca v84: cache v83 esperado não encontrado')
s=s.replace('edifiq-shell-v83-manual-photo-delete','edifiq-shell-v84-brand-edifiq',1)
sw.write_text(s,encoding='utf-8')

checks=[
    ('manifest', '"short_name": "EDIFIQ"' in manifest.read_text(encoding='utf-8')),
    ('cache', 'edifiq-shell-v84-brand-edifiq' in sw.read_text(encoding='utf-8')),
    ('orcamentos', 'Orçamentos — EDIFIQ' in orc.read_text(encoding='utf-8')),
    ('pdf', "doc.text('EDIFIQ',44,18)" in pdf.read_text(encoding='utf-8')),
]
for name,ok in checks:
    if not ok: raise SystemExit('Marca v84 falhou em '+name)
print('Versão pública v84 preparada com marca EDIFIQ padronizada.')
