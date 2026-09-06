# Genius Raros — editor de documentos

Aplicação **offline-first** (Word + Excel + Arquivo) para a Genius Raros.  
O documento edita-se no computador. A sincronização com Google Sheets e Drive só acontece quando há internet e um URL `/exec` nas Definições.

Interface por omissão: **português (Portugal)**. Recarregar com **Ctrl+F5** após atualizar os ficheiros.

---

## O que publicar no GitHub

Publique **apenas esta pasta** (`ABENE`), como raiz do repositório.  
Não envie o resto de `PROJETO AFONSO`, nem `exemples/`, nem outras aplicações.

```
.
├── index.html                 ← abrir este ficheiro (ou a URL GitHub Pages)
├── 404.html
├── .nojekyll                  ← obrigatório para GitHub Pages
├── README.md
├── LICENSE
├── .gitignore
├── .gitattributes
├── branding/                  logótipos e ícones
├── apps-script/
│   ├── emaildrive.gs.txt      colar no Apps Script do CLIENTE (nome do projeto: emaildrive)
│   ├── Code.gs.txt            mesmo código (nome antigo)
│   ├── appsscript.json        âmbitos Sheets + Drive + Gmail
│   └── LEIA-ME.txt            instalação no Google do cliente
└── libs/                      Word, Excel, Arquivo, Sheets, JSZip, PDF, DOCX
```

Tamanho aproximado: **~3,5 Mo**. Sem `node_modules`, sem servidor.

---

## Utilização local (sem GitHub)

1. Descarregar o repositório (ZIP ou `git clone`).
2. Abrir `index.html` no browser (duplo clique).
3. Funciona **sem internet**: Guardar, autosave, Word, Excel, Arquivo, PDF, DOCX.
4. Com internet: ⚙ Definições → colar o URL `/exec` → Testar / Enviar.

---

## Google Sheets + Drive + e-mail (`emaildrive`)

Instalar **no Google do cliente**. Ficheiros e pastas vão para o Drive dele; os e-mails saem do Gmail dele.

Não há chave API Google. Não há ID de folha a copiar.

Passos completos: `apps-script/LEIA-ME.txt`. Resumo:

1. Folha vazia na conta do cliente → Extensões → Apps Script → colar `apps-script/emaildrive.gs.txt` → Guardar.
2. Renomear o projeto: **emaildrive**. Preencher `CFG.INSTALLER_EMAIL` (o vosso Gmail) se precisarem de aceder ao Drive.
3. Executar **`initialiserSysteme`** → autorizar Sheets + Drive + Gmail.
4. Menu Genius Raros → **Enviar e-mail de teste**.
5. Implementar como **Aplicação Web** (executar como eu, acesso a qualquer pessoa).
6. Copiar o URL `/exec` → colar em `index.html` na linha `var API_URL = '…';` (como no projeto originaux Next Level).

Pasta Drive (ao lado da folha), nome da empresa com espaços em `_` :

```
Genius_Raros_Arquivo/
  00_Leia-me.txt
  00_Indice.csv
  _Sistema/          documento Word atual, workbook.json, empresa.json
  {Cliente}/{Pasta}/{01_Relatorios|…}/{ano}/{Em_curso|Concluidos}/
```

Folhas criadas: CONFIG, DOCUMENTS, EXCEL, ARQUIVO, FOLDERS, CLIENTS, ARTICLES, DEVIS, DEVIS_LIGNES, JOURNAL, SYNC_LOG, EMAIL_LOG.

Menu na folha: **Genius Raros**.

### Depois de atualizar o script

Colar de novo `emaildrive.gs.txt` no Apps Script, depois **Implementar → Gerir implementações → lápis → Nova versão**.

---

## Publicar no GitHub

A página do repositório (`github.com/…`) **não executa** a aplicação. Clicar em `index.html` no GitHub mostra o código, não o editor.

Para **usar no browser pela internet**, ative **GitHub Pages** (passos abaixo).  
Para **só guardar o código**: repositório privado + abrir `index.html` no computador (ZIP ou clone).

### Não colocar no repositório

- palavras-passe, `.env`, capturas com dados de clientes
- a pasta pai `PROJETO AFONSO` ou outras aplicações

O jeton por omissão está em `apps-script/emaildrive.gs.txt` (`CFG.TOKEN`). Se o GitHub for **público**, altere-o no script, volte a implementar, e não partilhe o `/exec` com estranhos.

### Método A — site GitHub (sem Git no PC)

1. Ir a [https://github.com/new](https://github.com/new).
2. Nome sugerido: `genius-raros` (ou o que preferir).
3. Visibilidade: **Public** se quiser GitHub Pages no plano gratuito. **Private** só funciona como site se tiver GitHub Pro.
4. **Não** marcar “Add a README” (já existe neste dossier).
5. Create repository → **uploading an existing file**.
6. Arrastar **o conteúdo desta pasta** (os ficheiros, não a pasta `ABENE` em si): `index.html`, `.nojekyll`, `404.html`, `libs/`, `branding/`, `apps-script/`, `README.md`, `LICENSE`.
7. Commit. Os ficheiros que começam por ponto (`.nojekyll`) têm de ir também — no explorador Windows: Ver → Itens ocultos.

### Método B — Git no computador

Instalar [Git](https://git-scm.com/download/win) se ainda não existir (`git` não está no PATH neste PC). Depois, **na pasta ABENE** :

```bash
git init
git add .
git commit -m "Publicar editor Genius Raros (Word, Excel, Arquivo, Sheets)."
git branch -M main
git remote add origin https://github.com/VOSSO-UTILIZADOR/VOSSO-REPO.git
git push -u origin main
```

Substituir `VOSSO-UTILIZADOR` e `VOSSO-REPO`. Autenticar com GitHub (token ou GitHub Desktop).

### GitHub Pages — abrir a app (obrigatório para o site)

1. No repositório: **Settings → Pages**.
2. **Build and deployment → Source** : **Deploy from a branch**.
3. Branch **`main`** (ou `master`), pasta **`/ (root)`** → **Save**.
4. Esperar 1 a 2 minutos. A URL aparece no cimo da página Pages:
   `https://VOSSO-UTILIZADOR.github.io/VOSSO-REPO/`
5. Abrir **essa** URL (com a barra `/` no fim). Não abrir `github.com/…`.

Se a página fica em branco ou falta o editor: `index.html` não está na **raiz** do repositório (foi enviada a pasta `ABENE` inteira). Mova os ficheiros para a raiz, ou abra `https://…github.io/VOSSO-REPO/ABENE/`.

Depois de atualizar os ficheiros no GitHub, recarregar com **Ctrl+F5**.

Se alterar o script Google: colar de novo `emaildrive.gs.txt` e **Implementar → Gerir → lápis → Nova versão**.

---

## Funcionalidades

> **État P14 (04/09/2026) :** corrections bloquantes décrites dans [`docs/P14-CORRECTIONS-AUDIT-2026-09-04.md`](docs/P14-CORRECTIONS-AUDIT-2026-09-04.md). Compte-rendu : [`docs/P14-RESULTATS-2026-09-04.md`](docs/P14-RESULTATS-2026-09-04.md). Limites XLSX/ODS : [`docs/EXCEL-EXPORT-LIMITES.md`](docs/EXCEL-EXPORT-LIMITES.md). La présence d’une commande dans l’interface ne signifie pas encore que la phase correspondante est validée.

| Módulo | Conteúdo |
|--------|----------|
| Word | Editor, modelos, cabeçalho/rodapé, orçamentos, export PDF/DOCX |
| Excel | Grelha, fórmulas, gráficos, livro de trabalho, ligação Word |
| Arquivo | Pastas, clientes, ZIP, versões PDF, pack contabilista PT |
| Sync | Offline local; push/pull Sheets + árvore Drive quando online |
| Colaboração | Modo Docs em cima do Word (presença, partilha Drive, versões na nuvem). Sem `/exec`: tudo continua local. Última gravação vence. |

Identificadores técnicos (`abene-*.js`, `localStorage` `abene*`) mantêm-se de propósito: mudar o nome apagaria os documentos já gravados no browser.

---

## Licença

Uso interno Genius Raros. Ver `LICENSE`.
