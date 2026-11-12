# Gera ../index.html (o site).
# Desde a fase 1 da divisão (11/2026, docs/adr/001-divisao-em-modulos.md) o código-fonte vive em src/app/:
#   topo.html + css/app.css + corpo.html + js/**/*.js (em ordem de caminho) + fim.html
# O build junta esses arquivos, sem mudar nenhum byte, em src/checklist-residencia.html e depois monta o index.html.
# src/checklist-residencia.html é só uma SAÍDA do build (o app sem a conta, que o preview e testes antigos abrem):
# desde 12/11/2026 não vai para o repositório (.gitignore); não editar à mão.
# Uso, na raiz do repositório: python3 src/build_site.py
#   --check : só confere se index.html e sw.js estão iguais ao que src/app/ gera (não grava nada)
import re, sys, pathlib, hashlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = ROOT / "src/app"
GEN = ROOT / "src/checklist-residencia.html"
STAMP = APP / ".gerado.sha1"  # impressão do último gerado (fora do repositório): se o gerado mudar à mão, o build para


def assemble():
    # js/: arquivos soltos e pastas de módulo (js/060-faculdade/010-estrutura.js), em ordem de caminho
    js = sorted((APP / "js").rglob("*.js"), key=lambda p: p.relative_to(APP / "js").as_posix())
    pieces = [APP / "topo.html", APP / "css/app.css", APP / "corpo.html", *js, APP / "fim.html"]
    return b"".join(p.read_bytes() for p in pieces)


CHECK = "--check" in sys.argv
out = assemble()
cur = GEN.read_bytes() if GEN.exists() else b""
if not CHECK:
    if cur and cur != out and STAMP.exists() and hashlib.sha1(cur).hexdigest() != STAMP.read_text().strip():
        sys.exit("src/checklist-residencia.html foi editado à mão (é gerado). Passe a mudança para os arquivos em src/app/ "
                 "e rode o build de novo; nada foi gravado.")
    GEN.write_bytes(out)
    STAMP.write_text(hashlib.sha1(out).hexdigest() + "\n")
src = out.decode("utf-8")
FB = "10.12.2"
ver = hashlib.sha1((src + "".join((ROOT / f).read_text(encoding="utf-8") for f in ("bridge.js", "config.js", "site.css"))).encode()).hexdigest()[:8]
head = f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Nexus - Trilha Médica</title>
<meta name="description" content="185 temas de alta recorrência para residência médica, com plano do dia, revisões espaçadas, faculdade e caderno de erros.">
<meta name="theme-color" content="#f3f0e9" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0a1121" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Nexus">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<style>:root{{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0;font:14px/1.5 system-ui,-apple-system,sans-serif}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
<link rel="stylesheet" href="site.css?v={ver}">
<script src="https://www.gstatic.com/firebasejs/{FB}/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/{FB}/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/{FB}/firebase-firestore-compat.js"></script>
<script src="config.js?v={ver}"></script>
<script src="bridge.js?v={ver}"></script>
</head>
<body>
"""
body = src.replace('<meta charset="utf-8">\n', "", 1).replace("<title>Nexus - Trilha Médica</title>\n", "", 1)
index = head + body + "\n</body>\n</html>\n"
sw = (ROOT / "sw.js").read_text(encoding="utf-8")
sw2 = re.sub(r'const V = "checklist-[^"]*";', f'const V = "checklist-{ver}";', sw)
if CHECK:
    old = (ROOT / "index.html").read_text(encoding="utf-8") if (ROOT / "index.html").exists() else ""
    if old != index or sw != sw2:
        sys.exit("index.html ou sw.js está diferente do que src/app/ gera. Rode python3 src/build_site.py.")
    print("ok: index.html e sw.js conferem com src/app/")
    sys.exit(0)
(ROOT / "index.html").write_text(index, encoding="utf-8")
(ROOT / "sw.js").write_text(sw2, encoding="utf-8")
print("index.html gerado · versão", ver)
