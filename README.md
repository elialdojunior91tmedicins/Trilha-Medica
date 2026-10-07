# Checklist Residência Médica

Endereço: **https://elialdojunior91tmedicins.github.io/Trilha-Medica/**

Site do checklist de estudos para residência médica: 185 temas de alta recorrência,
plano do dia, revisões espaçadas, faculdade, questões, anotações e caderno de erros.

- Funciona como app: no Safari, **Compartilhar › Adicionar à Tela de Início**.
- Funciona sem internet; sincroniza quando a conexão volta.
- Os dados de cada pessoa ficam na conta dela (Firebase), protegidos pelas regras em `firestore.rules`.
  Este repositório tem só o programa, nenhum dado de estudo.

## Configurar a sincronização (uma vez)

1. Em <https://console.firebase.google.com>, **Adicionar projeto** (pode desativar o Google Analytics).
2. **Authentication › Vamos começar › Método de login › E-mail/senha › Ativar › Salvar**.
3. **Firestore Database › Criar banco de dados** › local `southamerica-east1 (São Paulo)` › **modo de produção**.
   Na aba **Regras**, cole o conteúdo de `firestore.rules` e toque em **Publicar**.
4. **Configurações do projeto (engrenagem) › Seus apps › Web (`</>`)**, registre o app (sem Hosting)
   e copie o objeto `firebaseConfig` para `config.js`.
5. **Authentication › Configurações › Domínios autorizados**: adicione o domínio do site (`elialdojunior91tmedicins.github.io`).

Enquanto `config.js` estiver com `COLE_AQUI`, o site funciona salvando só no próprio aparelho.

## Arquivos

- `index.html` — o app (gerado a partir da versão do Claude)
- `bridge.js` — conta, sincronização, backup, IA por copiar e colar
- `config.js` — configuração do Firebase
- `sw.js`, `manifest.webmanifest`, `icons/` — app instalável e modo sem internet

- `src/` — fonte do app (o mesmo do checklist no Claude) e o montador `build_site.py`
