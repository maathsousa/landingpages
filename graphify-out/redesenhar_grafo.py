"""Reaplica o design do mapa do projeto sobre o graph.html gerado pelo graphify.

Uso (dentro de graphify-out/):  python redesenhar_grafo.py

- Se graph.html acabou de ser gerado pelo graphify (contém os dados embutidos),
  ele é guardado como graph.original.html e os dados vão para graph-dados.js.
- graph.template.html é a fonte do design: dele saem graph.html, graph.css e graph.js.
"""
import re
from pathlib import Path

aqui = Path(__file__).parent
gerado = aqui / 'graph.html'
original = aqui / 'graph.original.html'
modelo = (aqui / 'graph.template.html').read_text(encoding='utf-8')

# 1) dados: do graph.html recém-gerado ou da cópia original
texto = gerado.read_text(encoding='utf-8') if gerado.exists() else ''
if 'const RAW_NODES' in texto:
    original.write_text(texto, encoding='utf-8')
fonte = original.read_text(encoding='utf-8')
linhas = []
for nome in ('RAW_NODES', 'RAW_EDGES', 'LEGEND', 'hyperedges'):
    m = re.search(r'^\s*const ' + nome + r' = .*?;\s*$', fonte, re.M)
    if not m:
        raise SystemExit(f'Não achei {nome} no graph.html gerado.')
    linhas.append(m.group(0).strip())
(aqui / 'graph-dados.js').write_text(
    '/* Dados gerados pelo graphify. Não edite à mão: rode redesenhar_grafo.py após cada build. */\n'
    + '\n'.join(linhas) + '\n', encoding='utf-8')

# 2) css
css = re.search(r'<style>\n(.*?)</style>', modelo, re.S).group(1)
css = '\n'.join(l[2:] if l.startswith('  ') else l for l in css.splitlines())
(aqui / 'graph.css').write_text('/* Mapa do projeto · visual */\n' + css.strip() + '\n', encoding='utf-8')

# 3) js: tema aplicado na hora (evita piscar) + interface após o DOM carregar
tema = re.search(r'<script>\n(\(function \(\) \{.*?\}\)\(\);)\n</script>', modelo, re.S).group(1)
app = re.search(r'<script>\n/\*__DATA__\*/\n(.*?)</script>', modelo, re.S).group(1)
js = ('/* Mapa do projeto · interface. Depende de vis-network e de graph-dados.js. */\n'
      + tema + '\n\n'
      + "document.addEventListener('DOMContentLoaded', function () {\n'use strict';\n"
      + app.strip() + '\n});\n')
(aqui / 'graph.js').write_text(js, encoding='utf-8')

# 4) html: só a estrutura
html = re.sub(r'<style>\n.*?</style>\n', '<link rel="stylesheet" href="graph.css">\n', modelo, flags=re.S)
html = re.sub(r'<script>\n\(function \(\) \{.*?\}\)\(\);\n</script>\n',
              '<script src="graph-dados.js"></script>\n<script src="graph.js"></script>\n', html, flags=re.S)
html = re.sub(r'\n<script>\n/\*__DATA__\*/\n.*?</script>\n', '\n', html, flags=re.S)
gerado.write_text(html, encoding='utf-8')
print('ok: graph.html, graph.css, graph.js, graph-dados.js')
