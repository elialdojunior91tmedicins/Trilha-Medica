# monta tests/preview.html como o Claude publica o artefato (cabeçalho com viewport e charset)
import os
here=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(here,'..','src','checklist-residencia.html'),encoding='utf-8').read()
head='<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui;background:#fafafa}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'
open(os.path.join(here,'preview.html'),'w',encoding='utf-8').write(head+src+'</body></html>')
