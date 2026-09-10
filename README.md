# ABENE — Genius Raros 1.0

Aplicação profissional de edição de documentos, Excel, Arquivo, orçamentos,
recibos comerciais e preparação de ficheiros para o contabilista.

A interface abre por defeito em **português de Portugal**. Também estão
disponíveis francês, inglês e espanhol.

## Publicar no GitHub Pages

Publicar **todo o conteúdo desta pasta ABENE** na raiz do repositório:

- `index.html`
- `404.html`
- `.nojekyll`
- `manifest.webmanifest`
- `libs/`
- `branding/`
- `apps-script/`
- `README.md`
- `LICENSE`

O dossier `Fligenio/ABENE 1.0` contém apenas salvaguardas, testes e documentos
de desenvolvimento. Não é necessário publicá-lo no GitHub.

## Abrir a aplicação

Abrir `index.html` ou ativar o GitHub Pages na raiz do repositório. Depois de
publicar uma atualização, atualizar o browser com `Ctrl+F5`.

## Ligação Google opcional

1. Abrir `apps-script/LEIA-ME.txt`.
2. Instalar `apps-script/emaildrive.gs.txt` no Apps Script da conta Google do
   cliente.
3. Executar `initialiserSysteme` e criar uma nova implementação Web App.
4. Nas Definições da aplicação, introduzir separadamente:
   - o **URL da API**, que termina em `/exec`;
   - a **Chave de acesso da API ABENE**, apresentada por
     `initialiserSysteme`.
5. Utilizar **Testar ligação**.

O URL e a chave de acesso de cada cliente são configurações privadas. Não os
publique no GitHub.

## Dados e segurança

A aplicação continua editável sem internet. Quando a ligação Google está
configurada, os ficheiros são guardados no Drive do cliente e os e-mails são
enviados pelo Gmail do cliente. Os documentos enviados ao cliente são PDFs.

## Licença

Uso interno Genius Raros. Consultar `LICENSE`.
