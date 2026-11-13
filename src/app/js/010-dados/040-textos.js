/* ===== Textos: instruções padrão do gerador (DEFAULT_PROMPT, a versão anterior e as antigas em OLD_PROMPTS; promptUp troca as antigas),
   frases da saudação (HERO_FRASES) e a aba Ajuda (HELP: [título, texto]; títulos usados por helpBtn não mudam). Só literais. ===== */
const DEFAULT_PROMPT=`Você é um elaborador experiente de questões de residência médica no Brasil, com foco no Enamed.

Estilo
- Cerca de 70–80% em caso clínico curto e contextualizado, como nas provas brasileiras (Enamed, ENARE, USP, UNIFESP); o restante, conceito aplicado.
- Cada questão testa uma decisão específica: diagnóstico mais provável, próximo passo, conduta, interpretação de exame ou fisiopatologia aplicada.
- Quando fizer sentido, ambiente o caso na atenção primária, na urgência ou no contexto do SUS.
- O enunciado traz os dados necessários para decidir. A dificuldade vem do conteúdo, nunca de ambiguidade.

Alternativas
- 4 alternativas (A a D), uma única melhor resposta.
- Distratores plausíveis, da mesma categoria da correta e com extensão parecida, baseados em erros reais de raciocínio.
- Evite pistas, alternativas parcialmente corretas, dupla negativa e "todas/nenhuma das anteriores".

Dificuldade
- Média, como em prova real. Varie os subtópicos e o tipo de pergunta.
- Em cerca de 20–30% das questões, inclua uma pegadinha justa (exceção, contraindicação, sequência de conduta, limiar ou detalhe clínico decisivo), sem anunciá-la.

Conteúdo e fontes
- Use só fontes confiáveis e vigentes: diretrizes e protocolos brasileiros (Ministério da Saúde, PCDTs, sociedades médicas brasileiras como SBC, SBD, SBP, FEBRASGO, SBPT, SBEM, AMIB), o que as bancas brasileiras cobram e, quando não houver diretriz brasileira, diretrizes internacionais de referência (OMS, ACC/AHA, ESC, KDIGO, GOLD, GINA, ADA, IDSA, Surviving Sepsis) e livros-texto clássicos (Harrison, Sabiston, Nelson, Williams, Guyton).
- Nada inventado: nenhum dado, dose, critério, valor de corte, estudo ou referência que você não tenha certeza de que existe e está correto. Se não tiver certeza de um detalhe, não o use na questão.
- Evite basear a questão em ponto controverso. Se for inevitável, cobre o que a maioria das bancas cobra e explique a divergência no alerta.

Comentário
- Explique a correta ligando os achados decisivos do caso ao mecanismo, critério ou conduta, em 2 a 4 frases. Nas pegadinhas, aponte o detalhe decisivo.
- Para cada alternativa errada, explique em 1 ou 2 frases o erro de raciocínio naquele caso e, quando couber, em que situação ela seria a resposta.
- Conceito-chave: uma frase curta, boa para revisar depois.
- Apoie o comentário na referência: diga o que ela estabelece (critério, conduta, valor de corte, dose) e por que isso decide o caso. Nunca mande o estudante "conferir na diretriz": a explicação tem de estar aqui.
- Se o tema mudou recentemente ou as fontes divergem, diga no alerta qual versão você seguiu (ano) e o que mudou.`;
const DEFAULT_PROMPT_1026A=`Você é um elaborador experiente de questões de residência médica no Brasil, com foco no Enamed.

Estilo
- Cerca de 70–80% em caso clínico curto e contextualizado, como nas provas brasileiras (Enamed, ENARE, USP, UNIFESP); o restante, conceito aplicado.
- Cada questão testa uma decisão específica: diagnóstico mais provável, próximo passo, conduta, interpretação de exame ou fisiopatologia aplicada.
- Quando fizer sentido, ambiente o caso na atenção primária, na urgência ou no contexto do SUS.
- O enunciado traz os dados necessários para decidir. A dificuldade vem do conteúdo, nunca de ambiguidade.

Alternativas
- 4 alternativas (A a D), uma única melhor resposta.
- Distratores plausíveis, da mesma categoria da correta e com extensão parecida, baseados em erros reais de raciocínio.
- Evite pistas, alternativas parcialmente corretas, dupla negativa e "todas/nenhuma das anteriores".

Dificuldade
- Média, como em prova real. Varie os subtópicos e o tipo de pergunta.
- Em cerca de 20–30% das questões, inclua uma pegadinha justa (exceção, contraindicação, sequência de conduta, limiar ou detalhe clínico decisivo), sem anunciá-la.

Conteúdo e fontes
- Use só fontes confiáveis e vigentes: diretrizes e protocolos brasileiros (Ministério da Saúde, PCDTs, sociedades médicas brasileiras como SBC, SBD, SBP, FEBRASGO, SBPT, SBEM, AMIB), o que as bancas brasileiras cobram e, quando não houver diretriz brasileira, diretrizes internacionais de referência (OMS, ACC/AHA, ESC, KDIGO, GOLD, GINA, ADA, IDSA, Surviving Sepsis) e livros-texto clássicos (Harrison, Sabiston, Nelson, Williams, Guyton).
- Nada inventado: nenhum dado, dose, critério, valor de corte, estudo ou referência que você não tenha certeza de que existe e está correto. Se não tiver certeza de um detalhe, não o use na questão.
- Evite basear a questão em ponto controverso. Se for inevitável, cobre o que a maioria das bancas cobra e explique a divergência no alerta.

Comentário
- Explique a correta ligando os achados decisivos do caso ao mecanismo, critério ou conduta, em 2 a 4 frases. Nas pegadinhas, aponte o detalhe decisivo.
- Para cada alternativa errada, explique em 1 ou 2 frases o erro de raciocínio naquele caso e, quando couber, em que situação ela seria a resposta.
- Conceito-chave: uma frase curta, boa para revisar depois.
- Se a resposta depender de protocolo que muda com frequência (doses, calendário vacinal, esquemas terapêuticos), avise no alerta para conferir na diretriz vigente.`;
/* instruções padrão antigas: quem nunca mudou o texto passa a usar o padrão novo */
const OLD_PROMPTS=[`Você é um elaborador experiente de questões de residência médica no Brasil, com foco no Enamed.

Estilo
- Cerca de 70–80% em caso clínico curto e contextualizado, como nas provas brasileiras (Enamed, ENARE, USP, UNIFESP); o restante, conceito aplicado.
- Cada questão testa uma decisão específica: diagnóstico mais provável, próximo passo, conduta, interpretação de exame ou fisiopatologia aplicada.
- Quando fizer sentido, ambiente o caso na atenção primária, na urgência ou no contexto do SUS.
- O enunciado traz os dados necessários para decidir. A dificuldade vem do conteúdo, nunca de ambiguidade.

Alternativas
- 4 alternativas (A a D), uma única melhor resposta.
- Distratores plausíveis, da mesma categoria da correta e com extensão parecida, baseados em erros reais de raciocínio.
- Evite pistas, alternativas parcialmente corretas, dupla negativa e "todas/nenhuma das anteriores".

Dificuldade
- Média, como em prova real. Varie os subtópicos e o tipo de pergunta.
- Em cerca de 20–30% das questões, inclua uma pegadinha justa (exceção, contraindicação, sequência de conduta, limiar ou detalhe clínico decisivo), sem anunciá-la.

Conteúdo
- Siga diretrizes brasileiras (Ministério da Saúde e sociedades médicas brasileiras).
- Não invente dados, doses, critérios ou referências.
- Evite basear a questão em ponto controverso. Se for inevitável, cobre o que a maioria das bancas cobra e explique a divergência no alerta.

Comentário
- Explique a correta ligando os achados decisivos do caso ao mecanismo, critério ou conduta, em 2 a 4 frases. Nas pegadinhas, aponte o detalhe decisivo.
- Para cada alternativa errada, explique em 1 ou 2 frases o erro de raciocínio naquele caso e, quando couber, em que situação ela seria a resposta.
- Conceito-chave: uma frase curta, boa para revisar depois.
- Se a resposta depender de protocolo que muda com frequência (doses, calendário vacinal, esquemas terapêuticos), avise no alerta para conferir na diretriz vigente.`,`Você é um elaborador experiente de questões de residência médica no Brasil, com foco no Enamed.

Estilo
- Questões em formato de caso clínico curto e contextualizado, como nas provas brasileiras (Enamed, ENARE, USP, UNIFESP).
- Priorize raciocínio prático: conduta imediata, próximo passo, diagnóstico mais provável e interpretação de exames.
- Quando fizer sentido, ambiente o caso na atenção primária, na urgência ou no contexto do SUS.

Formato
- 4 alternativas (A a D), apenas uma correta.
- Distratores plausíveis, que testem confusões comuns do tema.
- Dificuldade média, como em prova real. Varie os subtópicos entre as questões.

Conteúdo
- Siga diretrizes brasileiras atuais (Ministério da Saúde e sociedades médicas brasileiras).
- Não invente dados, doses ou critérios. Se houver controvérsia, escolha o que a maioria das bancas cobra.

Comentário
- Explique por que a correta está certa e por que cada alternativa errada está errada, de forma direta.
- Resuma o conceito-chave cobrado em uma frase curta, boa para revisar depois.
- Se a resposta depender de protocolo que muda com frequência (doses, calendário vacinal, esquemas terapêuticos), avise no campo de alerta para conferir na diretriz vigente.`];
const HERO_FRASES=["Constância vence intensidade.","Cada questão errada hoje é um ponto a mais na prova.","Não precisa ser um dia perfeito. Precisa ser um dia de estudo.","Disciplina é fazer o combinado mesmo sem vontade.",
"A aprovação é feita de dias comuns bem usados.","Revisar é o que transforma estudo em memória.","Um tema por vez. Uma revisão por vez.","Quem revisa no dia certo não estuda duas vezes.",
"O cansaço passa. O que você aprendeu hoje fica.","Pequenos avanços diários somam uma especialidade inteira.","O erro de hoje é o acerto da prova.","Comece pelo mais difícil enquanto a cabeça está fresca.",
"Vitória é a soma de manhãs em que você sentou para estudar.","Você não precisa de motivação para abrir o caderno. Precisa abrir.","Uma hora focada vale mais que três distraídas.","A prova premia quem viu o assunto muitas vezes, não uma vez só.",
"Hoje conta. Mesmo que seja pouco.","Faça o simples bem feito: revisar, questionar, corrigir.","Seu futuro paciente agradece cada revisão de hoje.","Ritmo sustentável ganha da maratona de véspera.",
"Errar na questão é barato. Errar no plantão não é.","Domine o básico: é ele que cai mais.","A dúvida de hoje é a pegadinha que você não vai cair.","Quem anota o próprio erro não repete o mesmo erro.",
"Estudar cansado ainda é estudar. Parar de vez é que não.","Celebre o dia cumprido, não só a nota final.","Um passo hoje vale mais que um plano perfeito para amanhã.","Foque no que depende de você: as próximas horas.",
"Cada tema dominado é um a menos para temer.","Respeite o descanso: ele também faz parte do plano.","A disciplina de hoje é a tranquilidade da véspera.","Questão feita com atenção ensina mais que dez feitas com pressa.",
"Não compare o seu capítulo 3 com o capítulo 20 de ninguém.","O que é revisado no tempo certo não precisa ser reaprendido.","Persistência é voltar ao plano depois de um dia ruim.","Um dia de cada vez, um tema de cada vez.",
"Vencer a preguiça nos primeiros cinco minutos é metade do trabalho.","Leia o enunciado inteiro. A resposta costuma estar nele.","Quem entende o porquê não precisa decorar tudo.","Organização hoje poupa desespero amanhã.",
"Seu esforço de hoje é invisível agora e evidente na prova.","Aprender devagar ainda é aprender.","A constância transforma o difícil em rotina.","Toda especialidade parece enorme até você dividir em temas.",
"Melhor feito do que perfeito: termine o bloco de hoje.","Cada acerto novo é prova de que o método funciona.","Desligue o celular por uma sessão e veja a diferença.","Revisão atrasada se resolve com uma por vez, não com culpa.",
"Disciplina é escolher o que você quer mais em vez do que você quer agora.","O ritmo de hoje decide a calma de amanhã.","Estude para entender o paciente, não só para marcar a alternativa.","A cada revisão, o esquecimento perde força.",
"Hoje é um bom dia para fechar uma lacuna antiga.","Quem mede o progresso enxerga o quanto já andou.","Dias difíceis também contam como dias de estudo.","A prova é longa; o preparo também. Vá no seu passo.",
"Faça a parte de hoje e deixe o resto para amanhã.","Seu melhor método é o que você consegue repetir todo dia.","O hábito leva você onde a motivação não alcança.","Cada sessão concluída é uma pequena vitória. Some todas."];
const HELP=[
["Comece aqui",`O Nexus organiza o estudo para a residência (**198 temas** das 5 grandes áreas) junto com a faculdade. Todo dia ele monta um plano, agenda as revisões do que você já estudou e mostra onde você mais erra.
Um dia de estudo:
1. **Início › Fila do dia:** toque em **Começar**. O app passa pelos erros, as revisões dos temas, o ponto fraco, as questões para refazer, os cartões e os temas do plano, um depois do outro; a barra de baixo leva ao próximo. O cartão mostra o tempo previsto e se cabe no seu dia; depois das 19 h, ele fecha o dia.
2. **Estudar hoje:** estude os temas do plano. **Começar com o Foco** conta o tempo; ao terminar, marque os subtópicos que viu.
3. **Questões:** gere dentro do tema ou registre as de bancos em **+ Registrar questões**.
4. **Errou?** **Levar para o caderno de erros**: o erro volta para você revisar.
5. **Faculdade:** com prova ou fechamento de SP perto, **Próximas provas** mostra o que falta e o ritmo.
- **Primeira vez:** o app pergunta a data da prova, se você já estudou e quanto tempo tem por dia. Já estudou temas antes do app? Na Residência, **Já estudei alguns temas antes do app** marca vários de uma vez.
- **Navegar:** no celular, a barra de baixo traz as abas principais e **≡ Menu** abre todas as seções, a busca, Perfil, Configurações e Ajuda (no iPad em pé, o ≡ fica no alto). No computador e no iPad deitado, a **barra lateral** fica aberta no Início e vira um trilho de ícones nas outras abas; **Fixar** e **Recolher** mudam isso (toque de novo para o automático).
- **Buscar em tudo:** a lupa (no computador, **Ctrl+K** ou **/**) procura em temas, anotações, erros, cartões e faculdade.
- **O botão ?** de cada cartão mostra ali mesmo como ele funciona; **Mais na Ajuda →** abre o assunto aqui.
- **Início do seu jeito:** no fim do Início, **Personalizar o Início** esconde ou reordena os cartões.
- **Saudação:** a data, o que espera por você hoje, os dias até a prova principal e uma frase do dia, trocada por um feito real quando há (dias seguidos, questões de ontem, acerto que subiu, horas de foco).
- **Site e artefato:** use o **site** como principal; o artefato no Claude guarda os dados à parte (para levar o progresso, use o backup).`],
["Estudar hoje",`O plano do dia fica fixo até o dia virar. Ele traz primeiro o que é da faculdade com prova ou fechamento perto, depois os temas que você está **Estudando** (para terminar antes de abrir outro) e temas novos de maior incidência.
- **Concluir:** marque os subtópicos do dia; tema sem subtópicos, **Estudei hoje**. Os cartões ficam recolhidos e o que você começou fica aberto.
- **Temas grandes em partes:** até 6 subtópicos vem inteiro; maior que isso, em **partes de 3 a 4** ("Parte 1 de 4") e no dia seguinte vem a próxima. O tema fica **Estudando** até a última parte e só então entra nas revisões. Subtópico **denso** conta como dois (o Claude já marcou os dos 198 temas; corrija no tema em **Marcar subtópicos densos**).
- **High Yield:** o selo **HY** marca os temas que mais caem (peso 3). Dentro do tema, **★ HY** marca os subtópicos que mais caem: começam com uma estimativa e você muda em **Marcar os subtópicos ★ HY** (a sua escolha sempre vale). Os ★ vêm primeiro nas partes do tema, voltam mais vezes no rodízio da revisão, puxam mais questões no gerador e no simulado e aparecem no PDF do caderno e na folha de véspera.
- **Trocar:** **Trocar subtópicos** (até 6), **Refazer plano** (mantém o que você começou) e, no cartão do tema do eixo, **Outro do eixo**. Estudou outro tema? Ele entra no lugar de um não iniciado (**Desfazer troca** volta).
- **Planejar a semana** (⚙ Configurações › Plano): para cada dia, **Folga, 30 min, 1 h, 2 h ou 3 h+**. A **Semana padrão** vale sempre; **Esta semana** e **Próxima semana** mudam só aquela (contorno dourado = diferente da padrão). No domingo e na segunda, o Início mostra como foi a semana e leva a planejar a próxima. **30 min** = só o leve (fila do dia, um ponto fraco e uma revisão geral com até 20 cartões); **1 h** ≈ 1 tema; **2 h** ≈ 2; **3 h+** = o plano inteiro. **Tenho mais ou menos tempo hoje** muda só hoje.
- **Dia com aula fixa** (Faculdade › Calendário): cada 2 h de aula tiram um degrau do tempo do dia, nunca abaixo de 30 min (o que você escolheu à mão vale).
- **Plano alinhado ao eixo** (padrão no Ciclo clínico; Configurações › Plano): as vagas ficam **1 da faculdade** (o próximo conteúdo da SP) · **1 da residência do eixo** (a área das SPs desta semana e da próxima) · **1 livre**. Dá para mudar a composição, usar áreas vizinhas ou fixar o eixo até uma data.
- **Freio de revisões:** com mais de 20 revisões atrasadas, o plano traz só 1 tema novo; com mais de 40, nenhum. O cartão mostra o tempo estimado do dia.
- **Folga e sequência:** folga planejada sem estudo **congela** a sequência (❄ no mapa do Foco); estudar na folga soma. Na folga, o Início sugere coisas leves e opcionais; **Hoje é só descanso** esconde.
- **Hoje não deu** (1 por semana, dois toques): hoje vira folga, o plano zera, as revisões passam para o próximo dia de estudo e a sequência congela. **Desfazer** no mesmo dia.
- **Faculdade no plano:** com aula fixa amanhã, lembra os objetivos da SP aberta; entregas dos próximos 3 dias aparecem com **Já entreguei**; na semana da prova, **Ler as anotações da prova** junta as páginas dela.
- **Meta e projeção** (Residência; no celular, parte Progresso): temas que faltam, quantos por semana até a prova principal e o seu ritmo das últimas 4 semanas. **Ver semanas** mostra semana a semana (temas novos, revisões, cartões); semanas de prova da faculdade recebem menos temas.
- **Próximos 6 dias:** prévia do que o plano deve propor, supondo que você cumpra o plano. Prova nova nos próximos 7 dias refaz o plano sozinho.`],
["Revisões",`Todo tema estudado volta em **1, 3, 7, 15, 30, 60 e 90 dias** (Configurações › Plano tem também Intensivo e Espaçado). As revisões ficam na aba **Residência**, numa lista só com as da faculdade (selo **FAC**), por importância: peso do tema × dias de atraso.
- **Lembrei** sobe um degrau (se passou mais tempo que o previsto, o próximo intervalo é pelo menos esse tempo). **Difícil** repete o intervalo. **Esqueci** volta dois degraus. Cada botão mostra em quantos dias volta.
- **Questões contam:** com 5 ou mais questões do tema no dia em que ele vence, a revisão é marcada sozinha pelo acerto (75%+ Lembrei; 50–74% Difícil; menos, Esqueci).
- **Acerto alto alonga:** a partir da 2ª revisão, 85%+ nos últimos 90 dias (mín. 8 questões) deixa o intervalo 40% maior; 75%+, 20%. Acerto baixo não encurta: o tema vira **ponto fraco** e entra na fila como questões.
- **Reler faz parte:** a anotação do tema aparece dentro da revisão, com as pegadinhas primeiro.
- **Subtópicos em rodízio:** cada revisão sugere os que você revisou há mais tempo, para o tema inteiro passar em 3 ou 4 revisões.
- **Quando começa:** ao tema ficar **Estudado** (último subtópico, Estudei hoje ou o nível). Enquanto está Estudando, não há revisão. Desmarcou logo depois, no mesmo dia? Volta para Estudando.
- **Na fila do dia** entram as revisões que cabem no tempo do seu dia; as outras esperam.
- **Próximos dias:** quantas revisões caem em cada um dos próximos 14 dias. **Equilibrar** adianta revisões para dias mais leves (ou adia até 3 dias).
- **Histórico:** o app guarda cada revisão (dia, resposta e se estava atrasada). A **retenção** (quanto você tocou Lembrei, no prazo e atrasado) aparece em Estatísticas › Como estou indo e no tema aberto.
- **Atrasou muito?** Se as revisões atrasadas passarem do que cabe em uns 3 dias, o app as espalha sozinho pelos próximos dias (até 14), as mais esquecidas primeiro, e avisa no Início. Cada cartão mostra a data original ("era para"); enquanto isso entra 1 tema novo por dia. Sobrou tempo? **Revisar mais 3 do atraso** na fila. Não gostou? **Desfazer** no aviso.
- **Não estudei este tema** tira das revisões e volta para Não iniciado (questões, anotações e erros ficam).
- **Véspera de prova:** nos 3 dias antes, aparece só o que você já estudou para ela. **Modo provas** ligado pausa as revisões da residência.`],
["Residência: temas, níveis e incidência",`A lista começa recolhida: toque na área, na especialidade e no tema. Cada linha diz o **próximo passo** (Começar · parte 1 de 3, Revisar hoje, Acerto caiu…), o acerto colorido, o foco e os subtópicos; **☑ N/M** marca subtópicos sem abrir.
- **Tema aberto:** **Estudo** (revisão, subtópicos, nível e peso), **Questões** (seu desempenho, registrar, gerar com o Claude e as provas na íntegra do tema), **Anotações** (a página do tema, a mesma do Caderno) e **Erros**, além de **⏱ Foco** e **☆ Fixar**.
| Nível | Quando |
|---|---|
| Estudando | Começou e não terminou (sozinho no 1º subtópico, ou à mão). Sem revisão |
| Estudado | Viu o conteúdo inteiro |
| Revisado | Lembrou bem numa revisão |
| Dominado | 80%+ em 10 ou mais questões e duas revisões seguidas sem dificuldade |
- **Sugestões de nível:** o app propõe **Marcar como Dominado** quando o tema bate os critérios e **Voltar para Revisado** se o acerto cair abaixo de 70% em 30 dias. **Agora não** esconde por 14 dias.
- **Incidência:** as barrinhas vêm de 1.182 questões (ENARE 2020–2024, Enamed 2025, Revalida 2021–2026), conferidas com as estatísticas do INEP em 10/2026. **De onde vem este peso** explica cada tema; dá para ajustar.
- **Encontrar temas:** a busca procura no nome, nos subtópicos e nas anotações. **Filtros**: Situação, Mostrar só (Revisão pendente, Pontos fracos, Sem questões, Incidência muito alta, ★ Fixados, **Neste semestre** = ligados aos seus semestres ativos) e Onde. Ordem: da lista ou mais cobrados primeiro.
- **Mapa da residência** (parte Progresso): os 198 temas em quadradinhos na cor do nível. **Progresso por área:** a barra grossa conta temas; a fina, subtópicos.
- **Já estudei alguns temas antes do app:** marque vários, escolha Estudados ou Já revisados e confirme; a 1ª revisão se espalha pelos próximos dias. **Desfazer** volta.
- **Subtópicos próprios:** adicione no fim da lista do tema.`],
["Questões",`A aba é o seu **Banco de questões**: toda questão que passa pelo app fica guardada (das provas importadas, dos simulados e as geradas, também as que você acerta). Cada questão respondida conta no acerto do tema. As erradas vão para **Refazer as que errei**.
- **Partes da aba**, no topo: **Banco**, **Simulado misto**, **Refazer**, **Provas na íntegra** e **Resumo**. No celular, toque em **Banco ▾** para trocar.
- **Banco:** busca no enunciado e no comentário, **Filtros** (Situação, Onde = área › especialidade › tema, Origem, Banca, Ano e Mais) e os atalhos **Inéditas**, **Teimosas**, **Eixo atual**, **Prova da faculdade**, **Favoritas** e **HY recorrentes**. **+ Salvar filtro** guarda o que está ligado como um atalho seu (× apaga). Os 4 números (não resolvidas, resolvidas, acertadas, erradas) também filtram. Cada linha mostra se você acertou (✓) ou errou (✕) da última vez, com o tracejado nas inéditas, e quantas vezes errou e acertou.
- **Resolver estas** (até 100, na ordem da lista) mostra o gabarito a cada questão. **Simulado com estas** sorteia, inéditas primeiro, no modo prova: relógio, mapa das questões e resultado só no fim (**Entregar**). O tempo de cada questão fica guardado. **⛶ Tela inteira** funciona também no celular, em pé ou deitado (deitado, o enunciado fica à esquerda e as alternativas à direita), com **≡ Menu** e **Sair** no topo. No celular, Simulado misto, Refazer e Provas na íntegra também têm **⛶ Tela inteira**.
- **Conta no acerto do tema** só a primeira vez que você faz a questão. Refeita conta na meta semanal. Questão de prova na íntegra conta quando feita na própria prova.
- **Uma agenda só com o Refazer:** errou no banco, a questão vai para o Refazer. Se ela já está lá e venceu, fazer no banco conta como a revisão dela; antes de vencer, só o erro conta.
- **Sorteio inteligente** (Simulado com estas e Simulado misto › **Do banco**): inéditas primeiro, depois os seus pontos fracos, os temas que mais caem, o eixo da faculdade e a próxima prova; no máximo um quarto do mesmo tema.
- **Fixar com questões do banco:** no tema (parte Questões) e no aviso ao concluir um tema, resolve as questões dele que estão no banco, inéditas primeiro.
- **Questão irmã:** errou? **Fazer uma questão irmã** traz outra inédita do mesmo tema, parecida no conceito, para ver se você aprendeu ou só decorou.
- **Diretriz mudou:** marque na questão aberta. Ela sai dos sorteios e some com **Esconder anuladas e desatualizadas**.
- **Teimosa:** errada 3 vezes; sai com 2 acertos seguidos em dias diferentes e volta se errar de novo.
- **Toque numa linha** para ver a questão, suas respostas, **☆ Favoritar** e **Tirar do banco** (dois toques; dá para desfazer). Questão do seu material guarda a figura junto.
- **Gerar** (no tema): escolha quantas (10 é a sugestão) e, se quiser, um subtópico e o estilo (Residência ou **Prova da faculdade**, depois de marcar uma prova importada como **modelo da faculdade**). Seus erros no tema entram no pedido. Até 20 por pedido.
- **Referências:** cada questão traz a fonte específica (diretriz com ano e seção, livro e capítulo, manual do Ministério). No site, o Claude pesquisa e traz o **link**; no artefato, questão sem fonte segura é descartada.
- **Material seu** (gerador e simulado): um ou mais arquivos (PDF, slides, Word, fotos). As questões saem do material e citam a página. No simulado vão até 100 mil caracteres em partes, e páginas com figura viram **figuras** que aparecem junto da questão.
- **Depois de responder:** **Gabarito**, **Por que está certa**, Ponto-chave, Conceito-chave e Fonte; o porquê de cada errada fica embaixo dela. As alternativas vêm embaralhadas. **Levar para a anotação**, **Criar cartão** e **Levar para o caderno de erros** ficam ali.
- **Simulado misto**, em três passos: **de onde** (Escolher temas, Onde focar, Revisões ou Plano de hoje, Estudados nesta semana, Meus erros, Para refazer, a prova da faculdade, ou **um material seu**), **como** (5 a 30 questões, dificuldade, estilo Residência ou **ENAMED/INEP**) e o resumo. **⚡ Bloco rápido** faz 5 dos temas da semana. **Encerrar** mostra o resultado das respondidas.
- **Meus simulados:** cada simulado terminado fica guardado. **Rever**, **Refazer estas** (conta na meta semanal, não no acerto) e **Mesmos temas, questões novas**.
- **Refazer as que errei:** a questão volta amanhã; acertou, em 3 dias; **sai depois de 2 acertos em dias diferentes**. As de hoje entram na fila do dia. Errou 2 vezes (selo **teimosa**)? Leve ao caderno de erros. **O gabarito está errado?** corrige (e, se for de prova importada, a prova junto). Vencida há 21 dias sem fazer, sai sozinha.
- **Ponto fraco:** menos de 60% nos últimos 30 dias (mín. 5 questões). Um por dia entra na fila como 5 questões; depois descansa 7 dias.
- **Onde focar:** uma conta só (peso do tema × distância de 80% de acerto), usada no simulado, no gráfico, na lista de temas e nas Estatísticas.
- **Resumo:** **Acerto por banca no banco** (na 1ª vez de cada questão ou nos últimos 30 dias), **High Yield pelo seu banco**, **Conceitos recorrentes**, meta, ritmo, evolução, gráficos e bancas, **+ Registrar questões** e a lista dos seus temas, com Busca e Filtros próprios.
- **High Yield pelo seu banco:** conta as questões das provas (na íntegra e oficiais) e **sugere** subir ou descer o peso do tema e pôr ou tirar a ★ dos subtópicos. Nada muda sem você tocar em **Aceitar** (vira escolha sua); **Agora não** esconde. As 12 provas que já formam o peso não contam de novo, as provas-alvo do seu Perfil pesam o dobro, e as sugestões de peso começam com 3 provas novas. No tema aparece "No seu banco: caiu N vezes em M provas".
- **Conceito recorrente:** a mesma ideia cobrada em 2 ou mais provas diferentes. O Claude marca a ideia quando comenta uma prova; o app mostra pares parecidos para você confirmar (**É a mesma ideia** ou **Não é**). Essas questões ganham o selo **Recorrente** e entram primeiro no sorteio.
- **Seus temas nas questões:** sem filtro, os 10 que mais pedem atenção (**Ver todos**). Toque num tema para ver acerto por semana e por banca, tendência, erros e as ações **Praticar**, **Pôr no simulado**, **Registrar**.
- **+ Registrar questões:** para as feitas fora (bancos, provas). Informe a **banca** e, se quiser, o **tempo** (entra no Ritmo). **Juntar ou renomear fontes** une nomes repetidos.
- **Meta semanal, Ritmo e Evolução:** questões de segunda a domingo, tempo médio por questão × o tempo da prova, e as últimas 12 semanas. Tendência ▲/▼ compara 30 dias com os 90 antes.
- **No site:** a geração é por copiar e colar (veja "Site: gerar questões e resumos").`],
["Provas na íntegra",`Em Questões › Provas na íntegra. **+ Importar prova** e escolha o PDF (ou fotos das páginas, na ordem). Os passos aparecem no topo: **Arquivo › Gabarito › Leitura › Conferir › Salvar**.
- **Gabarito:** no próprio PDF, em outro PDF ou colado. Gabarito comentado ("RESPOSTA 1 · Correta: B") também serve: as justificativas viram o comentário. Sem gabarito, o Claude resolve e a questão fica marcada **Gabarito do Claude · conferir**; quando sair o oficial, **Colar gabarito** corrige tudo.
- **Leitura:** PDF com texto e questões numeradas é lido no aparelho, sem o Claude (o tema vem como **Tema sugerido**). Página escaneada, questão faltando ou sem gabarito: o app pede para **passar pelo Claude**, em partes de até 20 questões; resposta cortada pede só as que faltaram.
- **Conferir:** cada questão com problema mostra **Conferir:** no topo. Troque a resposta, anule, escolha o tema (até 3; **+ outro tema**) ou descarte. Comentário que contradiz o gabarito ganha um selo.
- **Figuras:** as páginas com figura (exame, ECG) são recortadas ao salvar e a figura aparece na questão certa.
- **Provas oficiais:** a lista **Provas oficiais: lidas e faltando** mostra quais já estão no app e quais faltam; **Importar** já preenche nome, banca, ano e nível. Marque **Prova oficial** ao importar: as questões entram no banco como oficiais. As reimpressões da Medway (texto em dobro, alternativas depois dos enunciados) são lidas no aparelho.
- **Gabarito preliminar × definitivo:** ao colar, diga qual é. Quando sair o definitivo, cole de novo: as questões que mudaram ganham **Gabarito mudou** e o acerto é recalculado.
- **Juntar gabarito e comentários:** se o Claude preparou numa conversa um arquivo com o gabarito e o comentário de cada questão, toque em **Juntar gabarito e comentários** no cartão da prova e escolha o arquivo. Cada questão é conferida pelo número e pelo começo do enunciado; gabarito do Claude não passa por cima do oficial.
- **Comentário do Claude:** prova oficial vem sem comentário. **✦ Comentar N sem comentário** (no cartão da prova, em partes de 10) ou **✦ Comentar com o Claude** na questão aberta; fica guardado na prova e no banco.
- **Subtópico:** o app sugere pelo texto da questão; as duvidosas aparecem em **Conferir subtópicos**. No banco, escolha um tema para filtrar por subtópico.
- **Jogar:** **Modo prova** (resultado no fim) ou **Modo estudo** (correção a cada questão); dá para pausar. No computador, o mapa das questões e o relógio ficam ao lado; **⛶ Tela inteira** deixa só a prova (A a E respondem, → próxima, ← anterior).
- **Resultado:** **Onde você perdeu pontos** primeiro (especialidades com 3+ questões e acerto abaixo de 60%, com os temas e as questões para levar ao caderno de erros) e depois o acerto por área. É só sugestão: o plano não muda.
- **Lista:** busca, situação, banca e **Da faculdade**, agrupada por banca. Prova feita mostra o acerto por área.
- **Ligar a temas:** liga a prova a temas da residência e conteúdos da faculdade; ela aparece dentro do tema e o acerto conta também no conteúdo da faculdade.
- Cada resposta conta no acerto do tema e da banca, e as erradas de temas já estudados vão para Refazer.`],
["Caderno",`A aba **Caderno** junta as **páginas livres** (aula, plantão, dicas) e a **página de cada tema**, que é a mesma anotação da Residência. Tudo é salvo enquanto você escreve.
- **Partes** (celular e tablet em pé): **Caderno** e **Pegadinhas**. No computador, tudo numa página, com o sumário ao lado. Os cartões têm aba própria, **Cartões**.
- **Uma busca só** para páginas livres e dos temas; em **Filtros**, Tipo, Etiquetas, Mostrar só (editadas na semana, com pegadinhas, com tabela, com cartões, **temas estudados sem anotação**) e Onde.
- **Página do tema e páginas ligadas:** cada tema tem uma página principal e quantas ligadas quiser (**+ Nova página ligada**). Página nova ligada a um tema sem anotação vira a página dele.
- **Escrever:** título, negrito, ==destaque==, listas (Tab recua), pegadinha, **★** (a linha que cai muito em prova, o High Yield), tabela, link, **fluxograma** e **[[ ]]** para ligar a outro tema ou página (**Mencionado em** mostra quem liga para ela). **Selo** põe na linha um erro ou uma questão de prova. Modelos: **Doença** e, para tema de SP, **Resumo de SP**.
- **Ler:** cada título abre e fecha; seções vazias somem e as **Pegadinhas** ficam em destaque. **+ Criar cartão do trecho** em cada seção (ou selecione um texto); trecho com ★ vai para o Anki com a etiqueta high-yield.
- **Levar para a anotação** (em toda questão respondida): entra um bloco **Da questão** com o caso e a resposta inteira, mais o que você marcar (Por quê, Ponto-chave, Pegadinha, Por que não…). O app sugere a seção; **✦ Escrever com o Claude** transforma em 2 a 4 frases.
- **Pegadinhas e destaques:** junta as linhas "> Pegadinha:", os ==destaques==, as linhas **★** e as seções Pegadinhas/Alertas, dos temas e das páginas livres. Filtre por tipo (**Só HY** mostra as ★), temas de hoje, prova da faculdade ou **Não sabia**. **Revisar pegadinhas** passa uma a uma; **Folha de véspera** baixa um PDF. No erro "Li errado" ou "Confundi", **Virar pegadinha** escreve na anotação.
- **+ Criar cartão do trecho** e os cartões dos erros vão para a aba **Cartões**.
- **📄 Ler arquivo:** foto, PDF, Word, PowerPoint ou texto, um ou vários. Diga o tipo e onde salvar (tema ou caderno livre); o Claude organiza com explicação, fluxograma e pegadinhas, e você confere antes de salvar. O arquivo não fica guardado, só o texto.
- **Erros junto:** abaixo da página do tema, os erros que ainda pedem atenção (até 3), com o selo que abre o caderno de erros.
- **Baixar PDF:** como está na tela, tudo, uma área ou os temas que você escolher. Tem capa, sumário, texto justificado, tabelas com grade, pegadinhas em caixa e links entre temas com a página.
- **✦ Gerar resumo** e **Organizar minhas anotações** com o Claude: você insere ou descarta; **Desfazer última substituição** volta.`],
["Cartões",`A aba **Cartões** (no celular, na barra de baixo; **Erros** fica no ≡ Menu) tem três partes: **Hoje**, **Todos** e **Números**.
- **Revisar:** cada cartão volta quando você estaria perto de esquecer (**FSRS**, o do Anki). **Mostrar resposta** e escolha **Errei**, **Difícil**, **Bom** ou **Fácil** (no computador: espaço e 1–4). Até 14 novos por dia (**Ajustes dos cartões**).
- **+ Novo cartão:** escolha o tema e escreva; **Salvar e criar outro** mantém o tema. **Colar vários**: um por linha, **pergunta :: resposta** (ou separado por tabulação, como no .txt do Anki). **Criar com o Claude**: escolha até 5 temas. Se já existe um cartão parecido no mesmo tema, o app avisa.
- **Cartões que você mais esquece:** os que você esqueceu 4 vezes ou mais. **Editar** ou **Juntar ao lote de melhorias** (o Claude reescreve em lote).
- **Todos:** busca, filtros (área, tema, situação, origem, mais esquecidos) e ordem. Toque num cartão para editar (no computador, o editor fica ao lado). **Suspender** tira da revisão sem apagar; **Reativar** traz de volta. **Selecionar** faz o mesmo em vários: trocar de tema, suspender, apagar ou exportar para o Anki.
- **Números:** quanto você lembra nas revisões (meta de 90%), jovens × maduros (21 dias ou mais), revisões por dia, previsão de 30 dias, por área, os mais esquecidos e o calendário com os dias seguidos. O histórico começou em 13/11/2026.
- **Anki:** cartões a 40+ dias da próxima revisão aparecem em **Prontos para o Anki**. **Exportar (.apkg)** e, no Anki, Arquivo › Importar com **importar o progresso**; depois **Já importei no Anki** tira eles daqui (ficam 30 dias na lixeira). Cartões novos vão como novos.`],
["Caderno de erros",`Registre o erro: o que você pensou, o conceito certo, o tipo e a fonte. Na questão errada, **Levar para o caderno de erros** já monta tudo: **O que eu errei**, a **Pista do caso** (com o que decide em negrito), **Dados decisivos**, **Ponto-chave**, **Conceito correto** e a questão inteira guardada. Ajuste com as suas palavras; **✦ Resumir com o Claude** encurta.
- **Revisar:** a frente mostra o caso inteiro e a pergunta, sem a resposta: responda de cabeça e toque em **Mostrar a resposta** (**Ver alternativas** ajuda, mas aí vale no máximo Em parte). O verso traz **Certa × Você marcou**, **A regra**, **O raciocínio** e **Por que não a sua**, montados pelo app (✎ **Corrigir**, toque num dado marcado para tirar, ✦ **Melhorar com o Claude** opcional). Notas: **Errei** volta amanhã, **Em parte** na metade do prazo do Acertei (2, 3, 7 ou 15 dias, conforme o degrau), **Acertei** vai para 3, 7, 15 e 30 dias. A partir da 3ª revisão pode vir um caso novo com a mesma regra. Acertou no degrau de 30 dias: o erro fica **formado** (sai da revisão; volta se você errar de novo no tema).
- **Uma agenda por questão:** erro que virou cartão passa a ser revisado pelos cartões; questão levada do Refazer sai do Refazer.
- **Criar cartões** (⋯ Ações): dois cartões no padrão Osler, o **discriminador** e **por que não a sua**; **✦ Melhorar com o Claude** oferece também lacuna e armadilha.
- **Por que você erra · último mês:** erros novos × mês anterior, por tipo e as causas mais comuns, cada uma com uma dica; toque para filtrar. **Temas e especialidades com mais erros** contam só os ativos; o selo marca 2+ erros em 30 dias.
- **Tipos:** **Não sabia o conteúdo**, **Li errado / desatenção**, **Confundi ou esqueci**. **Por que errei** (opcional) dá uma causa mais precisa, como "Não vi o EXCETO".
- **Filtros:** Situação, Origem (residência, faculdade, semana da prova, fonte), Por que errou, Onde e Quando. **Exportar PDF destes erros** usa os filtros.
- **Simulado dos meus erros:** questões novas sobre os pontos que você errou; acertar um erro que vencia hoje conta como Acertei.
- **Resolvido** arquiva (sai das revisões; dá para desarquivar). Um erro acertado várias vezes ganha **Já domino: arquivar**.
- **Tela inteira** (tablet deitado e computador): só o erro na tela; espaço mostra a resposta, 1 Errei, 2 Em parte, 3 Acertei, Esc sai. O mesmo botão existe nos cartões, no simulado, no Refazer e nas provas.`],
["Faculdade e provas",`A Faculdade funciona como pastas: **Semestre › (Unidade curricular) › Disciplina › conteúdos**.
- **Semestre:** **+ Semestre** cria a pasta. Dentro: **+ Disciplina**, **Colar ementa** (o Claude monta disciplinas, SPs e objetivos; você revisa antes de salvar), **Provas do semestre** e o **Calendário**. Em **⚙ Ajustes**: renomear, unidades curriculares, nomes dos níveis e arquivar.
- **Conteúdos:** **+ Conteúdo** e digite o assunto. Se já existe na residência, **Usar este** (o progresso é o mesmo); senão **Criar** faz um conteúdo da faculdade (selo **FAC** na Residência). Os chips **Ligar à residência** já ligam a temas parecidos.
- **SP:** **+ SP** cria a situação-problema: um conteúdo de estudo com **objetivos** (viram subtópicos; dá para ler de uma **foto ou arquivo**), **fechamento**, materiais e prova. **+ Outro conteúdo** guarda o que for só da SP. **Mover para…** e **Transformar em SP** reorganizam.
- **Ligar a um tema da residência:** o conteúdo continua com o seu nome na Faculdade, mas o progresso passa a ser o do tema: estudar em qualquer um avança os dois. Escolha o tema inteiro ou só alguns subtópicos; um conteúdo pode ligar a vários temas (conta como estudado quando todos estiverem). **Trocar ligação** e **Desligar** ficam no tema.
- **Provas:** **+ Nova prova**: escolha o semestre, a(s) disciplina(s), nome e data. A prova começa com o que ainda não está em outra prova; abra para marcar o que cai. Na SP, **Cai na prova** liga a SP inteira. Conta como estudado o que você estudou ou revisou nas 3 semanas antes.
- **Próximas provas:** quanto está pronto, o que falta e o ritmo. **Estudar o próximo** abre o conteúdo e liga o Foco; **Simulado da prova** monta questões só com ela; **Adicionar ao calendário** gera um .ics.
| Dias até a prova | Vagas no plano |
|---|---|
| 15 a 21 | 1 |
| 8 a 14 | 2 |
| 0 a 7 | 3 |
- **Semana da prova:** o que você já estudou volta como **Revisar para a prova** (até 2 vezes, menor acerto primeiro) e não entram temas novos da residência. **+1 vaga** se o conteúdo também cai muito na residência; **residência protegida** em 2 dias por semana, exceto nos 7 dias finais.
- **Fechamento da SP:** preencha a data e com quantos dias de antecedência começar (7). Nesse período, os objetivos e conteúdos dela entram no plano e ela aparece em **Próximas provas › Fechamentos**.
- **Calendário do semestre:** provas, fechamentos e entregas das próximas semanas (semanas pesadas em dourado). Toque numa data para mudar ou marcar **adiada**. **+ Entrega** lembra nos 3 dias antes; **+ Aula fixa** reduz o tempo de estudo do dia (cancelar um dia devolve).
- **Depois da prova:** por até 30 dias, registre a nota e toque no que caiu e você não sabia (vira erro no caderno).
- **Modo provas:** 3+ provas em 7 dias liga sozinho (pausa as revisões da residência); controle em Faculdade › Modo provas.
- **Materiais** (+ Material na disciplina e na SP) guardam links. O cabeçalho da disciplina mostra o foco na semana.
- Temas FAC não entram no "% dominado", que mede só os 198 temas da residência.`],
["Foco: tempo de estudo",`A aba **Foco** conta os minutos que você estuda (no celular, em ≡ Menu).
- **Pomodoro** (25+5, 50+10 ou Personalizar, com pausa longa a cada 4 ciclos) ou **Cronômetro** (até **Encerrar e salvar**; menos de 1 minuto não salva).
- **Vincular** a sessão a um tema ou a uma disciplina (os do plano e das revisões de hoje aparecem primeiro; dá para mudar com o relógio correndo). Na disciplina, toque no **conteúdo** que está estudando ou em **Disciplina em geral**; conteúdo ligado à residência conta também no tema, uma vez só. O botão **Foco** dos cartões já abre o relógio no tema.
- **O que você estudou?** Ao terminar, marque os subtópicos, **Estudei hoje** ou a revisão (Esqueci, Difícil, Lembrei) e registre questões, sem sair do Foco.
- **Me distraí** (tecla D) conta distrações. **Som de fundo:** chuva, riacho, lareira, ruído branco ou marrom, só durante o foco.
- **Esta semana:** total, sessões e gráfico, com a **meta por semana** (Configurações › Plano) dividida pelos dias de estudo; embaixo, o recorde.
- **Nas últimas 12 semanas:** um quadradinho por dia (❄ = folga), total por semana, média, melhor semana e o seu melhor horário.
- **Registrar tempo:** para o que você estudou sem o cronômetro (Anki no celular, livro, aula). Minutos, dia (hoje, ontem ou outro), o que fez (Anki, Questões, Leitura, Resumo ou um tipo seu, que fica guardado) e, se quiser, o tema ou a disciplina. Conta na meta da semana, nas Estatísticas e na sequência de dias; ✎ na lista edita.
- **Tempo por matéria ou por tipo:** 7 a 90 dias ou tudo; nas disciplinas, os conteúdos aparecem embaixo.
- A contagem usa a hora de início: continua certa com a tela bloqueada. O alarme só toca com o app aberto. **Tela inteira** esconde o resto (espaço pausa, Esc sai).`],
["Estatísticas",`A página **Estatísticas** (≡ Menu ou barra lateral) responde quatro perguntas, cada uma com um selo verde, amarelo ou vermelho:
- **Como estou indo:** 7, 30 ou 90 dias × o período anterior (acerto, questões, temas, revisões, erros) e a nota nas provas na íntegra.
- **Vou chegar a tempo:** seu ritmo × o necessário até a prova principal e quantos temas ficariam de fora.
- **Estou estudando o suficiente:** horas por semana (do Foco) com a meta e quanto tempo um tema leva para você. **Ajustar a semana** leva ao planejamento.
- **Tenho direção:** quanto do tempo foi para temas que mais caem, o quadro **tempo × acerto** por especialidade e 3 focos sugeridos.
- **Lado Faculdade:** notas das provas, o que está pronto, foco por disciplina, **resumo do semestre** (horas × nota) e a divisão do tempo entre residência, faculdade e as duas (sem somar em dobro).
- As horas vêm só do Foco. Com menos de 3 semanas de uso, a página avisa que há poucos dados.`],
["Perfil e Configurações",`**Perfil** (suas iniciais; no computador, no pé da barra lateral):
- **Nome** e **Fase do curso** (Ciclo clínico, Internato ou Reta final): a fase ajusta de uma vez antecedência das provas, meta de questões, eixo e dia de simulado.
- **Provas de residência:** cadastre as que vai prestar e marque a principal (ela guia a projeção). Ao digitar, o app sugere do **catálogo** (nacionais e por região, com banca e mês habitual); a data vem **estimada** até você pôr a do edital. **Ver provas por região** mostra a lista.
- **Conta** (no site): entrar, sair e criar senha para o app instalado.
- **Exportar PDF** (Panorama de estudos): residência, faculdade e/ou questões e erros, no período e nas matérias que você escolher. Funciona sem internet.
**⚙ Configurações:** cada cartão mostra o básico e guarda o resto em **Mais opções**.
- **Aparência:** layout (**Clássico**, **Compacto**, **Essencial**), tema (automático, claro, escuro), tamanho da letra e barra lateral.
- **Plano:** Planejar a semana, meta por semana, temas por dia, subtópicos por revisão, intervalos (Padrão, Intensivo, Espaçado), eixo da faculdade e subtópicos densos.
- **Questões:** meta semanal e tempo da prova por questão; **Instruções do gerador**.
- **Faculdade:** antecedência das provas, residência garantida na semana e modo provas.
- **Marcar atraso:** desligado, o atraso aparece em âmbar como "pendente há N dias".
- **Backup**, **Lixeira** e esta **Ajuda**. Tudo vale em todos os aparelhos.`],
["Filtros",`Todos os filtros do app seguem o mesmo jeito:
- A **busca** fica à vista; **Filtros** abre o painel com os grupos. No celular, o painel sobe de baixo (**Ver resultados** fecha).
- **Escolher um** (período, tipo): botões lado a lado. **Ligar e combinar** (situação, atalhos, origem): etiquetas; toque de novo para desligar. Cada etiqueta mostra quantos itens tem (com 0, fica apagada).
- Os ligados aparecem como etiquetas com **×**; **Limpar tudo** tira todos.
- **Período:** 7 · 15 · 30 · 60 · 90 dias · Tudo (as Estatísticas usam 7, 30 e 90, para comparar com o anterior).
- Cada aba lembra os seus filtros.`],
["Backup",`Em **⚙ Configurações › Backup**.
- **Exportar backup:** um arquivo com tudo. No iPad/iPhone, **Salvar em Arquivos**. **Copiar backup** dá o mesmo como texto.
- **Importar backup** (site): mostra um resumo e guarda uma cópia do que existia; **Desfazer a última importação** até 7 dias.
- Ao migrar, exporte por último. Sem conta no site, o Início lembra quando o último backup passou de 30 dias.
- **Gravação recusada pela conta** (item grande demais, espaço cheio): um aviso diz o quê e por quê; o item fica no aparelho e **Tentar de novo** envia.
- **Lixeira** (⚙ Configurações): erros, cartões, anotações apagadas, páginas, provas, SPs e disciplinas ficam 30 dias. Logo depois de apagar, **Desfazer** embaixo da tela.`],
["Site: instalar, conta e sem internet",`Endereço: **elialdojunior91tmedicins.github.io/Trilha-Medica**
- **Instalar (iPad/iPhone):** no Safari, **Compartilhar › Adicionar à Tela de Início**. No computador, o Chrome oferece **Instalar**.
- **Conta:** entre com **Google** ou **e-mail e senha**. Nos outros aparelhos, do mesmo jeito: tudo sincroniza, em segundos, mesmo com o app aberto em vários (o aparelho em uso só se atualiza depois de uns segundos sem toque).
- **App instalado no iPhone/iPad:** o botão do Google não funciona. Crie uma senha pelo Safari em **Conta › Criar senha** e entre com e-mail e senha.
- **Esqueci minha senha:** digite o e-mail e toque no link; confira o spam.
- **Sair** apaga os dados daquele aparelho (continuam na conta). **Sem internet**, o app salva no aparelho e sincroniza depois. Atualizações chegam ao abrir, às vezes na segunda vez.`],
["Site: gerar questões e resumos",`No site, a IA funciona por copiar e colar no Claude:
1. Toque em **Gerar questões** (ou resumo). Abre uma janela com o pedido pronto.
2. **Copiar pedido** e cole numa conversa do Claude (**Abrir o Claude** leva até lá).
3. Copie a resposta inteira, volte, cole e toque em **Usar estas questões**.
- Resposta sem as questões? O site avisa e deixa colar de novo.
- **Importar prova** vai em partes (um copiar e colar por parte). Páginas escaneadas pedem para anexar o PDF; se fechar uma parte, o que já veio fica guardado.`],
["Pedir mudanças ao Claude",`Mudanças de layout, opções novas e correções são feitas pedindo ao Claude. O mesmo código gera o site e o checklist do Claude.
- **Numa conversa nova,** diga onde está o código: o repositório **elialdojunior91tmedicins/Trilha-Medica** e o link do checklist no Claude.
- Para um erro: o que você fez, o que esperava, o que aconteceu e uma captura de tela. Seus dados não mudam com o código.`],
["Problemas comuns",`| Problema | O que fazer |
|---|---|
| Prova cadastrada não entrou no plano | Mais de 7 dias: entra a partir de amanhã. Para hoje, **Refazer plano**. |
| Tema estudado não aparece como concluído | Marque todos os subtópicos de hoje, ou **Estudei hoje**. |
| As revisões sumiram | O **modo provas** pode estar ligado (revisões pausadas). |
| Um aparelho não mostra o que marquei no outro | Mesmo e-mail nos dois? Há internet? Feche e abra o app. |
| O Claude e o site têm dados diferentes | São separados: exporte no Claude e importe no site. |
| "Sem conexão" ao entrar | O login precisa de internet; o app segue salvando no aparelho. |
| Esqueci a senha | Na tela de entrar, digite o e-mail e toque em **Esqueci minha senha**. Confira o spam. |
| A resposta colada não virou questões | Copie a resposta inteira, do primeiro [ ao último ]. |
| O site não mostra a mudança nova | Feche e abra o app duas vezes. |
| Importei o backup errado | **Desfazer a última importação** (até 7 dias). |`]
];
