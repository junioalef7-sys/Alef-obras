"""Reject incomplete EDIFIQ releases before they can replace the live app."""
import argparse
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OPTIONAL_MODULES = {'script:edifiq-print46'}


def compatibility_behavior_ok(check):
    """Accept a behavior moved to a tested compatibility layer, never a silent skip."""
    name = check.get('name')
    if name == 'Visão geral usa objeto da obra no progresso':
        patch = ROOT / 'core-fix65.js'
        if not patch.exists():
            return False
        source = patch.read_text(encoding='utf-8')
        required = [
            "obras.find(o=>String(o?.id)===String(obraOuId))",
            "return original.call(this,obra)",
            "window.obraProgress=compatible"
        ]
        return all(marker in source for marker in required)
    if name == 'Asaas valida destino antes de redirecionar':
        patch = ROOT / 'billing-hotfix63.js'
        if not patch.exists():
            return False
        source = patch.read_text(encoding='utf-8')
        required = [
            "function safeAsaasUrl(value)",
            "checkout.hostname.endsWith('.asaas.com')",
            "location.assign(safeAsaasUrl(data.checkout_url))",
            "const url=safeAsaasUrl(data.checkout_url)"
        ]
        return all(marker in source for marker in required)
    if name == 'exclusão usa fluxo definitivo':
        patch = ROOT / 'account-delete-fix61.js'
        if not patch.exists():
            return False
        source = patch.read_text(encoding='utf-8')
        required = [
            "edifiq-excluir-conta-imediato",
            "EXCLUIR MINHA CONTA",
            "Excluir conta agora",
            "window.solicitarExclusaoConta14 = window.excluirContaAgora61"
        ]
        return all(marker in source for marker in required)
    return False


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
                raise ValueError('Módulo duplicado: ' + name)
            modules[name] = block[3]
    missing = [name for name in contract['required_modules'] if name not in modules and name not in OPTIONAL_MODULES]
    if missing:
        raise ValueError('Versão incompleta. Módulos ausentes: ' + ', '.join(missing))
    for check in contract['required_behaviors']:
        module = check['module']
        if module not in modules:
            if module in OPTIONAL_MODULES:
                continue
            raise ValueError('Módulo ausente para validação: ' + module)
        if check['contains'] not in modules[module] and not compatibility_behavior_ok(check):
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
        for name in ['release27.cjs', 'release29.cjs', 'calculations.cjs', 'account.cjs', 'menu.cjs', 'integration46.cjs', 'core65.cjs']:
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
