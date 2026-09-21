# Excel — limites d’export (2026-09-20)

L’application **n’annonce pas** un round-trip XLSX/ODS intégral. Le classeur interne (`abeneExcelWorkbook`) reste la source de vérité.

## XLSX (`abeneExcelXlsxOut`)

**Conservé :** valeurs, formules, feuilles multiples, polices, remplissages, alignement, nombres de base, **bordures simples**, largeurs / hauteurs, fusions, volets figés, **filtres auto**, **commentaires**, **hyperliens**, cellules stylées même vides.

**Non reconstruit :** graphiques, validations, mises en forme conditionnelles, tableaux dynamiques, protection de feuille, certaines bordures complexes / styles avancés.

Réimporter un XLSX exporté depuis Genius Raros ne restaure donc pas ces objets manquants. Un toast d’export liste ce qui est omis lorsqu’il est présent dans le classeur.

## ODS (`abeneExcelOdsOut`)

- Plafond : **2000 lignes × 80 colonnes** par feuille (au-delà : troncature + message).
- Cellules en texte / nombre / formule ODS simple ; la mise en forme n’est pas exportée.
- Import ODS : texte + formules simples (unescape XML, spans) ; styles / graphiques non restaurés.

## CSV (`abeneExcelCsvOut`)

- Feuille **active** uniquement.
- Texte brut (formules exportées comme texte), sans styles ni multi-feuilles.
- Plage utilisée uniquement (colonnes vides de queue non exportées).

## Ce qui reste dans l’application

141 fonctions, feuilles multiples, formatage, fusion, filtres, graphiques, tableau dynamique, import/export et interop Word ⇄ Excel **dans l’éditeur**. Ces objets vivent dans `localStorage` `abeneExcelWorkbook` même s’ils ne passent pas tous dans le fichier XLSX/ODS/CSV.
