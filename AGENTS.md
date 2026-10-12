# EDIFIQ: preservar a versão consolidada

O aplicativo publicado é `index.html`. Ele contém a interface aprovada, módulos
comerciais e correções de backup/sincronização que precisam continuar juntos.
Substituir o arquivo inteiro por uma exportação antiga já causou regressões reais.

- Sempre leia o `main` atual antes de editar. Não publique HTML de outra conversa
  ou arquivo exportado por cima dele; incorpore somente as alterações necessárias.
- Preserve os módulos descritos em `release-contract.json`, inclusive os módulos
  comerciais e as correções da interface, de diárias, de faltas e de backup.
- Rode `python3 scripts/check-release.py` antes de publicar. O teste usa apenas
  dados demonstrativos e não acessa a conta nem os dados reais.
- Antes de atualizar `main`, confira novamente seu SHA. Use atualização normal
  com `expected_sha`; se houver outro commit, incorpore-o e valide novamente.
- A publicação deve usar GitHub Pages com Source = GitHub Actions. O workflow
  `.github/workflows/publish.yml` publica somente após a validação. Não volte para
  publicação direta de uma branch, que ignora essa proteção.
- Não remova ou enfraqueça o contrato, os testes ou o workflow para fazer uma
  versão antiga passar. Renomear/remover um módulo exige revisar sua substituição
  funcional e atualizar explicitamente a validação correspondente.
- Não restaure/apague registros de usuários para corrigir uma regressão de código.

