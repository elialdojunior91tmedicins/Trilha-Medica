#!/usr/bin/env bash
# Roda os testes do app. Uso: tests/run.sh            (todos, 3 em paralelo)
#                             tests/run.sh t74 t75    (só estes)
#                             tests/run.sh --monkey   (teste aleatório nos 6 aparelhos)
#                             tests/run.sh --unit     (testes da lógica no Node, sem navegador: ~2 s)
#                             tests/run.sh --rapido   (unitários + t151, a abertura nos 6 aparelhos: ~30 s)
cd "$(dirname "$0")"
if [ "$1" = "--unit" ]; then node --test unit/*.test.js 2>&1 | grep -E "^# (pass|fail)|^not ok"; exit "${PIPESTATUS[0]}"; fi
if [ "$1" = "--rapido" ]; then ./run.sh --unit || exit 1; set -- t151; fi
# src/checklist-residencia.html é saída do build e não vai para o repositório: gera se faltar ou se src/app/ mudou depois
G=../src/checklist-residencia.html
if [ ! -f "$G" ] || [ -n "$(find ../src/app -newer "$G" -type f ! -name .gerado.sha1 -print -quit)" ]; then (cd .. && python3 src/build_site.py) || exit 1; fi
python3 mkprev.py
# os testes do site abrem http://localhost:8765/ (a raiz do repositório, com index.html gerado)
if ! curl -s -o /dev/null http://localhost:8765/; then (cd .. && setsid nohup python3 -m http.server 8765 >/dev/null 2>&1 &); sleep 1; fi
if [ "$1" = "--monkey" ]; then
  for d in fone ipad578 tabEmPe tabDeitado note monitor; do (timeout 600 node monkey8.js 1 220 $d > out_monkey_$d.txt 2>&1 &); done; wait
  sleep 2; while pgrep -f monkey8.js >/dev/null; do sleep 5; done; tail -n 2 out_monkey_*.txt; exit 0
fi
if [ $# -gt 0 ]; then L=$(printf "%s.js\n" "$@"); else L=$(cat list.txt); fi
# resultado de um teste: 0 = passou (sem FALHA e sem Error na saída)
one() { timeout 600 node "$1" > "out_$1.txt" 2>&1; f=$(grep -c "^FALHA" "out_$1.txt"); e=$(grep -c "Error" "out_$1.txt"); n=$(grep -c "^OK" "out_$1.txt"); [ "$f$e" = "00" ] && echo "ok    $1 ($n)" || echo "FALHA $1 ($f falhas, $e erros) -> tests/out_$1.txt"; }
export -f one
R=$(echo "$L" | xargs -P 3 -I{} bash -c 'one {}' | sort)
# Testes instáveis (t133, t147, t148… falham às vezes sob carga): o que falhou roda de novo SOZINHO, uma vez.
# Passou na 2ª = "instável" (anotado em out_instaveis.txt, que guarda o histórico para achar os crônicos); falhou de novo = falha de verdade.
# SEM_REPETIR=1 desliga.
F=$(echo "$R" | grep "^FALHA" | awk '{print $2}')
if [ -n "$F" ] && [ -z "$SEM_REPETIR" ]; then
  for t in $F; do cp "out_$t.txt" "out_$t.1a.txt"; r2=$(one "$t")
    if [ "${r2%% *}" = "ok" ]; then R=$(echo "$R" | sed "s#^FALHA $t (\([^)]*\)).*#inst  $t (falhou na 1ª: \1; passou sozinho) -> tests/out_$t.1a.txt#"); echo "$(date +%F\ %H:%M) $t instável (passou na 2ª)" >> out_instaveis.txt
    else echo "$(date +%F\ %H:%M) $t falhou duas vezes" >> out_instaveis.txt; fi; done
fi
echo "$R"
echo "$R" | grep -q "^inst" && echo "(inst = instável: falhou junto com os outros e passou sozinho. Histórico: tests/out_instaveis.txt)"
echo "$R" | grep -q "^FALHA" && exit 1 || exit 0
