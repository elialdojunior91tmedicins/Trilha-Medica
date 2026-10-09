# Gera ../index.html (o site) a partir de src/checklist-residencia.html (o mesmo código do checklist no Claude).
# Uso, na raiz do repositório: python3 src/build_site.py
import re, pathlib, hashlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / "src/checklist-residencia.html").read_text(encoding="utf-8")
FB = "10.12.2"
ver = hashlib.sha1((src + "".join((ROOT / f).read_text(encoding="utf-8") for f in ("bridge.js", "config.js", "site.css"))).encode()).hexdigest()[:8]
head = f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Trilha Médica</title>
<meta name="description" content="185 temas de alta recorrência para residência médica, com plano do dia, revisões espaçadas, faculdade e caderno de erros.">
<meta name="theme-color" content="#f3f6f5" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f1514" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Trilha">
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
body = src.replace('<meta charset="utf-8">\n', "", 1).replace("<title>Trilha Médica</title>\n", "", 1)
(ROOT / "index.html").write_text(head + body + "\n</body>\n</html>\n", encoding="utf-8")
sw = (ROOT / "sw.js").read_text(encoding="utf-8")
(ROOT / "sw.js").write_text(re.sub(r'const V = "checklist-[^"]*";', f'const V = "checklist-{ver}";', sw), encoding="utf-8")
print("index.html gerado · versão", ver)
