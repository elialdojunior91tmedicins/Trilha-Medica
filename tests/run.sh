#!/usr/bin/env bash
# Roda os testes do app. Uso: tests/run.sh            (todos, 3 em paralelo)
#                             tests/run.sh t74 t75    (só estes)
#                             tests/run.sh --monkey   (teste aleatório nos 6 aparelhos)
cd "$(dirname "$0")"
python3 mkprev.py
# os testes do site abrem http://localhost:8765/ (a raiz do repositório, com index.html gerado)
if ! curl -s -o /dev/null http://localhost:8765/; then (cd .. && setsid nohup python3 -m http.server 8765 >/dev/null 2>&1 &); sleep 1; fi
if [ "$1" = "--monkey" ]; then
  for d in fone ipad578 tabEmPe tabDeitado note monitor; do (timeout 600 node monkey8.js 1 220 $d > out_monkey_$d.txt 2>&1 &); done; wait
  sleep 2; while pgrep -f monkey8.js >/dev/null; do sleep 5; done; tail -n 2 out_monkey_*.txt; exit 0
fi
if [ $# -gt 0 ]; then L=$(printf "%s.js\n" "$@"); else L=$(cat list.txt); fi
echo "$L" | xargs -P 3 -I{} sh -c 'timeout 600 node {} > out_{}.txt 2>&1; f=$(grep -c "^FALHA" out_{}.txt); e=$(grep -c "Error" out_{}.txt); n=$(grep -c "^OK" out_{}.txt); [ "$f$e" = "00" ] && echo "ok    {} ($n)" || echo "FALHA {} ($f falhas, $e erros) -> tests/out_{}.txt"' | sort
