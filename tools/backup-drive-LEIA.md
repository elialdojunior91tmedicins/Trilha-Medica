# Backup automático diário no Google Drive

Um script do Google (Apps Script) que roda **na sua conta Google**, todo dia por volta das 3h,
mesmo com o app fechado. Ele **só lê** seus dados do Firebase e salva um arquivo de backup na pasta
**"Nexus - Trilha Médica (backups)"** do seu Drive, no mesmo formato do "Exportar backup" do app.
Guarda as 30 cópias mais novas; as antigas vão para a lixeira do Drive. Se algum dia falhar,
o Google manda um e-mail avisando.

Arquivos: `backup-drive.gs` (o script) e `appsscript.json` (permissões e fuso).
Para copiar (texto puro):
https://raw.githubusercontent.com/elialdojunior91tmedicins/Trilha-Medica/main/tools/backup-drive.gs e
https://raw.githubusercontent.com/elialdojunior91tmedicins/Trilha-Medica/main/tools/appsscript.json

## Instalar (uma vez, no computador, ~10 min)

1. Entre em **script.google.com** com a **mesma conta Google que criou o Firebase** (a que abre
   console.firebase.google.com › projeto *trilha-medica*).
2. **Novo projeto**. Clique em "Projeto sem título" e renomeie para **Nexus backup**.
3. Engrenagem **Configurações do projeto** (à esquerda) › marque **Mostrar arquivo de manifesto "appsscript.json" no editor**.
4. Volte ao **Editor** (`< >`):
   - Abra `appsscript.json`, apague tudo e cole o conteúdo de `appsscript.json`.
   - Abra `Código.gs`, apague tudo e cole o conteúdo de `backup-drive.gs`.
   - Salve (ícone de disquete ou Ctrl+S).
5. Na barra de cima, escolha a função **instalar** e clique em **Executar**.
6. Autorize: **Revisar permissões** › escolha sua conta › aparece "O Google não verificou este app"
   › **Avançado** › **Acessar Nexus backup (não seguro)** › **Permitir**.
   O aviso aparece porque o script é seu e não passou pela revisão do Google; ele só lê seus dados
   e só mexe na pasta de backups que ele mesmo cria.
7. No **Registro de execução** deve aparecer: `Backup diário ligado (por volta das 3h). Salvo: nexus-backup-…json (N temas, …)`.
   Confira no Drive a pasta **Nexus - Trilha Médica (backups)**.

## Restaurar

Baixe o arquivo do Drive e, no site: **Configurações › Backup › Importar backup**. O app mostra o
que o arquivo contém antes de importar e permite **desfazer**.

## Outras funções (escolha na barra e clique em Executar)

- **backupAgora**: faz um backup na hora (ex.: antes de uma mudança grande).
- **desinstalar**: desliga o backup diário (os arquivos já salvos continuam no Drive).

## Se der erro

Copie a mensagem do Registro de execução e mande para o Claude. As mais prováveis:
- `403 … PERMISSION_DENIED`: a conta usada não é a dona do projeto Firebase.
- `403 … has not been used in project` ou `SERVICE_DISABLED`: falta liberar uma API no Google Cloud.

Quando o formato dos dados do app mudar, o script pode precisar ser atualizado (o teste `tests/t87.js` confere).
