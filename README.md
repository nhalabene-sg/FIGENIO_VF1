# Genius Raros 1.0

Editor **Word + Excel + Arquivo**. Uma só fonte (`src/`), um só livrable (`app/`).

Interface por omissão: **português (Portugal)**.  
O projeto Next Level **não foi modificado**.

---

## Abrir

1. `index.html` nesta pasta (entrada), **ou**
2. `app/index.html` (pacote gerado)

Se `app/` ainda não existir: `.\build.ps1` ou `npm run build`.

Funciona **sem internet**. Com internet: ⚙ Definições → o URL `/exec` do Google do cliente (ver `backend/`).

Depois de atualizar: **Ctrl+F5**.

---

## Pastas

```
GENIUS RAROS 1.0/
├── src/                           ← única fonte editável
│   ├── Genius_Raros_ABENE.html
│   ├── libs/                      (abene-*.js + JSZip, html2pdf, docx)
│   └── branding/
├── app/                           ← livrable (gerado; não editar)
├── backend/                       ← emaildrive.gs.txt
├── build.ps1
├── scripts/build.js
├── tests/run-all.js
├── docs/
├── archive/                       ← P0 (zip) + specs
└── index.html                     ← página de entrada
```

Editar **apenas** `src/`. Depois: `.\build.ps1` ou `npm run build`.

Não renomear `abene-*.js` nem as chaves `localStorage` `abene*`.

---

## Google (opcional)

Ver `backend/INSTALAR.html`. Colar o URL `/exec` em `src/Genius_Raros_ABENE.html` na linha `var API_URL = '';` e voltar a gerar `app/`. **Não publique o `/exec`.**

---

## GitHub Pages

Publicar o **conteúdo de `app/`** na raiz do repositório (index + libs + branding + `.nojekyll` + `SHA256SUMS.txt`).

Ou publicar esta pasta e abrir `…/app/`.

---

## Testes

```
npm test
```

Limites conhecidos: `docs/P14-RESULTATS-2026-09-04.md` e `docs/EXCEL-EXPORT-LIMITES.md`.  
A colaboração **não** é edição em tempo real (última gravação vence).

## Licença

Uso interno Genius Raros. Ver `LICENSE`.
