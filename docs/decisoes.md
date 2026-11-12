# Decisões do usuário

Registro curto das decisões que valem para o app inteiro e das propostas que o usuário recusou, com a data e onde estão anotadas
(`claude/…` = documento do Projeto "Trilha Médica" no Claude; `recursos` = `docs/recursos.md`). Serve para não propor de novo o que
já foi recusado e para não mudar sem perguntar o que já foi decidido. Se o usuário mudar de ideia, risque a linha antiga (~~assim~~), escreva a nova
com a data e não apague o histórico.

`node tools/mapa/onde.js <palavra>` também procura aqui (ex.: `onde.js notificação`).

## Como trabalhar

- Responder em português do Brasil, sem jargão de programação; crítica sincera; consultar quando houver dúvida. Nunca mudar uma decisão registrada sem perguntar. (CLAUDE.md; skill nexus-dev)
- O usuário confere tudo antes de publicar: prints reais nos aparelhos, depois "pode publicar". Cada ramo vai para a `main` só com o OK dele. (skill nexus-dev)
- Provas e PDFs nunca entram no repositório; arquivos de gabarito e comentários ficam com o usuário. (CLAUDE.md; claude/banco-plano.md)

## Plataforma

- **Artefato do Claude congelado** na versão de 30/10/2026 (05/11/2026, 13h30: "Ficar só com o site"). Publicar = site + manual. Não republicar e não propor artefato novo com outro link (recusado: os dados do artefato antigo não passariam). (claude/lote-21-publicado.md)
- O usuário **usa só o site** (21/10/2026, 23h02). (claude/problemas-a-resolver.md)
- **IA por copiar e colar** no site. Chamar a API do Claude direto do site: decidido em 24/10/2026 **não fazer agora** (o copiar e colar atende). (claude/problemas-a-resolver.md › Ideias profundas)
- Hospedagem própria, domínio e armazenamento de arquivos (R2/Worker): conversa de 01/11/2026, **não fazer agora**, só quando o app estiver estável e houver semanas de uso real. (claude/problemas-a-resolver.md › Ideias profundas)
- **Sem lembretes nem notificações** (10/10/2026); eventos de calendário sem alerta. **Sem Notion.** (claude/integracoes.md; skill nexus-dev)
- **Lixeira fora do backup** (12/11/2026, 14h36: "Não precisa da lixeira no backup"): ela vive 30 dias no aparelho e na conta; o backup não a leva. (tools/mapa/dados.js › FORA)
- Se o GitHub cair: não propor outro serviço de código sem o usuário pedir e **nunca sugerir criar outra conta no GitHub**. (skill nexus-dev)

## Questões e Banco de questões

- Referências das questões geradas: **nada inventado**; no site, o pedido manda pesquisar e citar fonte oficial com nome, ano e link; no artefato, sem referência segura a questão é trocada (21/10/2026, 23h01–23h02). (claude/problemas-a-resolver.md; recursos › Lote 12)
- A aba Questões **é** o Banco de questões, com Simulado misto, Refazer, Provas na íntegra e Resumo dentro (30/10/2026, 15h, por voz). Layout aprovado por prints (30/10, 15h20). (recursos › Banco de questões: as decisões do plano)
- "Assinale a incorreta" **sem selo**, de propósito. Só a **1ª tentativa** conta no acerto do tema. **Uma agenda só**: errou no banco → Refazer. Sem cota na fila do dia. Nível da prova é um filtro comum. (claude/banco-de-questoes.md)
- **Histórico de antes do banco é trazido** (30/10/2026, 15h38; ~~recomeçar do zero~~ revogado), sem contar duas vezes no acerto. (claude/banco-de-questoes.md)
- **Nada copiado de banco de cursinho**: fontes externas = provas oficiais. (claude/banco-de-questoes.md)
- Sem rótulo de dificuldade pessoal; no lugar, o preset "Teimosas" (entra com 3 erros, sai com 2 acertos seguidos em dias diferentes). (claude/banco-de-questoes.md)
- Comentário do Claude nas provas oficiais: botão "✦ Comentar" e "Comentar as N sem comentário", em partes de 10 por copiar e colar, guardado (05/11/2026, 22h21). (claude/banco-plano.md)
- **High Yield pelo banco: o banco SUGERE, não troca** o peso e as ★; conceito recorrente = app + Claude (12/11/2026, 09h15). HY (o que cai) e "Onde focar" (o que cai × onde erra) continuam separados. (claude/b5.md)
- ★ HY dos subtópicos: critérios (conduta, protocolos do MS/PCDT, critérios cobrados ao pé da letra, exame que fecha o diagnóstico) e teto (até 3 subtópicos = 1; 4 a 6 = 2; 7+ = 1/3) explicados e aceitos em 05/11/2026, 07h19–07h21. (claude/lote-21-publicado.md)
- Refazer: as 7 melhorias aceitas (21/10/2026, 23h08): volta espaçada, sai com 2 acertos em dias diferentes, alternativas embaralhadas, filtros, fila do dia, levar ao caderno de erros, fonte no simulado. (claude/problemas-a-resolver.md)
- Provas importadas em partes de até 20 páginas **ou** ~20 questões, com gabarito completo em cada parte (29/10/2026, 14h19). (claude/problemas-a-resolver.md)

## Erros, cartões e caderno

- Revisar erros: **Proposta B** — o app monta a regra, os dados decisivos e o raciocínio; o usuário corrige com toques; o Claude é opcional, em lote (31/10/2026, 22h09). O que o usuário corrige nunca é sobrescrito sem ele aprovar. (claude/lote-21.md)
- "Em parte" nos erros = volta na metade do prazo do Acertei, mínimo 2 dias, mesmo degrau (05/11/2026, 07h07). (claude/lote-21-publicado.md)
- Erros **não** são escritos dentro da anotação do tema: ficam só no caderno de erros, ligados ao tema; as seções "## Meus erros" antigas foram para o caderno (19/10/2026). (claude/problemas-a-resolver.md)
- O **caderno livre é o centro** da aba Caderno; a anotação do tema é uma página dele (21/10/2026, 22h43). (claude/problemas-a-resolver.md)
- Cartões: a prévia depois do erro continua como era, com "Salvar" e "Juntar ao lote de melhorias" (30/10/2026). Anki **só por .apkg** (24/10/2026; o .txt saiu). Cartões cortados guardados foram refeitos, mantendo a agenda (29/10/2026, 08h29). (claude/lote-21.md; claude/problemas-a-resolver.md)

## Plano, Foco e Faculdade

- Meta do usuário: **10 h por semana** (20/10/2026, 22h11), uma meta só, a do Planejar a semana. Semana padrão salva; sem planejar até segunda, vale a padrão (20/10, 22h28). (claude/problemas-a-resolver.md)
- Estatísticas com seletor **Residência · Faculdade**; o total de horas nunca soma em dobro (20/10/2026, 22h08). (claude/problemas-a-resolver.md)
- Foco: disciplina da faculdade sem conteúdo aparece na lista e as horas ficam nela (11/10/2026). "Registrar tempo" para estudo fora do cronômetro; conta na meta e na sequência de dias (30/10/2026, 10h37). (claude/problemas-a-resolver.md; claude/lote-21.md)
- Conteúdo da faculdade ligado a vários temas da Residência: conta como estudado quando **todos** estiverem estudados; notas, erros e cartões aparecem nos dois lados (11/10 e 14/10/2026). (claude/problemas-a-resolver.md)
- Filtros: um vocabulário só (segmento, chip, lista), períodos 7 · 15 · 30 · 60 · 90 · Tudo; as partes de navegação das abas ficam fora (29/10/2026, 08h41). (claude/problemas-a-resolver.md)

## Aprovado e ainda não feito

- Provas, entregas e fechamentos no **Calendário do iPhone** pela conta Google (agenda "Nexus", só leitura, sem alertas) — opção A, 01/11/2026, 08h23. (claude/integracoes.md)
- **Atalhos do iPhone/iPad** (links que abrem uma tela pronta: Foco, Registrar tempo, Revisar erros, Fila do dia, abas) — aprovado em 01/11/2026, 07h49; os links exatos a confirmar ao fazer. (claude/integracoes.md)

## Recusado (não propor de novo sem o usuário pedir)

- Botão "+ Nova" nas revisões (elas nascem ao estudar; "Já estudei antes" cobre o resto) — 11/10/2026.
- Painel único de "Evolução" e gráfico em radar — 11/10/2026.
- Telas de outro app: lista de aulas de cursinho, "Provas focais" (reta final), grade/página de "Ferramentas", ranking — 11/10/2026.
- Guardar PDF de diretriz no app; "Materiais" e "Resumir diretriz" no tema ("Acho que não, pode manter assim") — 12/10/2026.
- Ordem "onde ganhar mais pontos" no cartão "Seus temas nas questões" — 21/10/2026, 23h05.
- Linha "Sabia/Chutei/Errei" nas questões (chute conta como acerto) e "habilidades por questão" (nem a da Prisma nem a versão leve).
- Nos erros: campo para digitar a resposta antes de abrir; agrupar os erros por tema na sessão — 31/10/2026.
- Calendário por link secreto assinado no iPhone (opção B) — 01/11/2026.
- Abrir o Foco antes do Anki para contar o tempo (depende de lembrar toda vez) — 30/10/2026.
- Artefato novo com outro link — 05/11/2026.

Fontes: claude/problemas-a-resolver.md, claude/lote-21.md, claude/lote-21-publicado.md, claude/integracoes.md, claude/banco-de-questoes.md,
claude/banco-plano.md, claude/b5.md, docs/recursos.md e a skill nexus-dev. Compilado em 12/11/2026.
