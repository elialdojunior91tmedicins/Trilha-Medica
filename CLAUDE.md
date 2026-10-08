# Trilha Médica — Checklist Residência Médica

Checklist de estudos para residência médica (185 temas, plano do dia, revisões espaçadas,
faculdade, questões, anotações, caderno de erros). Abas: Início (view `inicio`, padrão), Residência (view `temas`),
Faculdade, Questões, Anotações, Erros, Ajuda. Existe em duas versões com o MESMO código:

- **Site** (este repositório, GitHub Pages): https://elialdojunior91tmedicins.github.io/Trilha-Medica/
- **Artefato no Claude**: https://claude.ai/artifact/4jniuB68sNVjGFhfT2n4jQ
- **Manual (Claude Docs)**: https://claude.ai/code/artifact/fcdd47d2-4612-4cba-a14c-bba04148ecc8

O usuário fala português (Brasil), é estudante de medicina, gosta de crítica sincera e de ser
consultado quando há dúvida. Responda em português.

## Como atualizar

1. Edite **`src/checklist-residencia.html`** (fonte única do app; é o arquivo publicado como artefato).
   Não edite `index.html` à mão: ele é gerado.
2. Gere o site: `python3 src/build_site.py` (monta `index.html` e muda a versão do `sw.js`).
3. Teste no celular (390px, toque), tablet (820/1180, toque, inclusive 578px com tela 1180×820 =
   iPad dentro do app do Claude) e computador (1366, 1920). Modos de layout ficam em
   `html[data-layout=phone|tablet|desktop|compact][data-cols]`, decididos pelo tamanho da TELA.
4. Commit e push na `main` (o GitHub Pages publica a raiz).
5. Republique o artefato: Artifact tool com `url` = link do artefato acima e `file_path` =
   `src/checklist-residencia.html` (leia o artefato antes, como o tool exige).
6. Se a mudança afetar o uso, atualize a aba Ajuda (constante `HELP` no fonte) e o manual.

## Arquitetura

- `src/checklist-residencia.html`: app inteiro (HTML/CSS/JS). No Claude usa `window.claude.use(...)`
  (db, user, sample, downloads).
- `bridge.js`: no site, implementa o mesmo `window.claude.use` com Firebase (Auth e-mail/senha +
  Firestore, persistência offline), download/compartilhamento de arquivos e IA por **copiar e colar**
  (janela com o pedido; o usuário cola a resposta). Também: importar/desfazer backup, conta, avisos.
- `config.js`: `window.FIREBASE_CONFIG` (com `COLE_AQUI` o site funciona só no aparelho).
- `sw.js` + `manifest.webmanifest` + `icons/`: app instalável e offline.
- `firestore.rules`: cada usuário só acessa `data/users/{uid}/**`.
- Dados no Firestore: `data/users/{uid}/progress` (topics, hist, plan), `/faculdade`, `/settings`,
  `progress/errors/{id}`, `progress/notes/{key}`.
- Faculdade: `fac.discs[]` = {name, info:{tipo,ch,prof,tutor,horario,local,ementa,objetivos}, items (conteúdo avulso antigo),
  eixos:[{id,name,area,spec}], sps:[{id,name,eixoId,items:[ref],objs:[texto]}]}; `sem.lv` renomeia os níveis.
  Refs: `T:<chave>` tema da residência, `S:<chave>:<subtópico>`, `O:<id>` tema da faculdade (progresso em `F-<id>`).
  O eixo define área/especialidade dos temas FAC (`ownPlace`), que aparecem na aba Temas com selo FAC e não contam no % dominado.
  Objetivos da SP viram subtópicos (`cs` com `fac:<id da SP>`) do primeiro tema ligado (`syncObjs`).
  "Colar ementa": `ementaPrompt` → `sample.json` → `ementaParse` (revisão) → `ementaApply` (junta por nome, sem duplicar).
- Backup: JSON `{app:"checklist-residencia", format:1, exportedAt, data:{topics,hist,plan,notes,noteAt,errors,fac,prompt,sort}}`.

- Início: os cartões "Estudar hoje" (`.card.today`) e "Revisões" (`.card.revs`) são os mesmos nós da aba Residência;
  `placeShared()` os move para `#iToday`/`#iRevs` quando a aba Início está aberta e de volta ao abrir a Residência.
- Faculdade em pastas: semestre (`facOpenSem`, + Disciplina em `facNewDiscFor`) › disciplina (`facOpenDisc`; + Conteúdo em `facAddC`
  guarda em `d.items` ou numa SP; "Organizar" = `facEditDisc`) › eixo › SP;
  "Colar ementa" e "Provas do semestre" (`facOpenProv`) ficam dentro de cada semestre.

- Perfil e Configurações: páginas `perfil`/`config` abertas pelos ícones do topo (`#profBtn`, `#cfgBtn`; `goSub`/`goBack`).
  Preferências em `ui = {prefs:{layout,theme,font,planN,subN,ints,facWin,resWeek}, profile:{name,goal,goalDate}}`,
  salvas em localStorage `resid-ui-v1` e no Firestore `data/users/{uid}/prefs`; `applyUI()` aplica (layouts via
  `html[data-skin=classic|compact|focus]`, letra via `html[data-font]`). No site, o botão de conta do bridge vai para `#acctSlot` (Perfil).

## Cuidados

- Mudança no formato dos dados → migração automática (veja `migrate()` e `SUB_PERM`).
- Firestore não aceita `undefined` nem arrays dentro de arrays.
- Login: Google (popup, só fora do app instalado) e e-mail/senha. No iPhone/iPad instalado na tela inicial o popup falha;
  contas Google criam uma senha em Conta › Criar senha (linkWithCredential) e usam e-mail/senha no app instalado.
