"""Reject incomplete EDIFIQ releases before they can replace the live app."""
import argparse
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _normalized_module(value):
    """Normalize whitespace only for duplicate comparison; behavior checks use original source."""
    return re.sub(r'\s+', ' ', value).strip()


def validate(path):
    html = path.read_text(encoding='utf-8')
    contract = json.loads((ROOT / 'release-contract.json').read_text())
    blocks = list(re.finditer(r'<(script|style)\b([^>]*)>([\s\S]*?)</\1\s*>', html, re.I))
    modules = {}
    for block in blocks:
        match = re.search(r'\bid=["\']([^"\']+)', block[2])
        if match:
            name = block[1].lower() + ':' + match[1]
            if name in modules:
                # The monolithic app contains printable/report HTML inside JS template strings.
                # Those strings can legitimately repeat the same embedded script/style ID and
                # the regex sees them as document modules. Accept only byte-equivalent behavior;
                # a genuinely conflicting duplicate still blocks publication.
                if _normalized_module(modules[name]) == _normalized_module(block[3]):
                    continue
                raise ValueError('Módulo duplicado conflitante: ' + name)
            modules[name] = block[3]
    missing = [name for name in contract['required_modules'] if name not in modules]
    if missing:
        raise ValueError('Versão incompleta. Módulos ausentes: ' + ', '.join(missing))
    for check in contract['required_behaviors']:
        if check['contains'] not in modules[check['module']]:
            raise ValueError('Correção ausente: ' + check['name'])
    with tempfile.TemporaryDirectory(prefix='edifiq-release-') as temp:
        folder = Path(temp)
        scripts = 0
        for block in blocks:
            if block[1].lower() != 'script' or not block[3].strip():
                continue
            if re.search(r'type=["\']application/(?:ld\+)?json', block[2]):
                continue
            script = folder / ('syntax-' + str(scripts) + '.js')
            script.write_text(block[3], encoding='utf-8')
            result = subprocess.run(['node', '--check', str(script)], capture_output=True, text=True)
            if result.returncode:
                raise ValueError('Erro de sintaxe JavaScript: ' + result.stderr)
            scripts += 1
        for name, filename in contract['fixture_modules'].items():
            (folder / filename).write_text(modules[name], encoding='utf-8')
        (folder / '.release-base.html').write_text(html, encoding='utf-8')
        shutil.copytree(ROOT / 'tests', folder / 'tests')
        for name in ['release27.cjs', 'release29.cjs', 'calculations.cjs', 'account.cjs', 'menu.cjs', 'integration46.cjs']:
            result = subprocess.run(['node', str(folder / 'tests' / name)], capture_output=True, text=True)
            if result.returncode:
                raise ValueError('Falha nos testes demonstrativos: ' + result.stdout + result.stderr)
            print(result.stdout.strip().splitlines()[-1])
    print(f'Publicação aprovada: {len(modules)} módulos identificados; {scripts} scripts válidos.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--html', type=Path, default=ROOT / 'index.html')
    args = parser.parse_args()
    try:
        validate(args.html)
    except (ValueError, OSError) as error:
        parser.exit(1, 'PUBLICAÇÃO BLOQUEADA: ' + str(error) + '\n')
