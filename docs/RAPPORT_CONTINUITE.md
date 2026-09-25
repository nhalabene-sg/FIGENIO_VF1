# ABENE — Rapport de continuité

Dernière mise à jour : 25 septembre 2026

Langue par défaut obligatoire : portugais du Portugal (`pt-PT`)

Dépôt : `nhalabene-sg/FIGENIO_VF1`

Ce fichier est le point de reprise canonique pour une personne ou une intelligence artificielle qui continue le projet. Il résume les demandes, les décisions, les changements, les tests et les limites connues. Il ne contient ni clé d’accès, ni jeton, ni adresse privée.

## Traçabilité des conversations

- La conversation complète, les captures et les pièces jointes restent conservées dans la tâche Codex d’origine.
- Le présent rapport enregistre la synthèse opérationnelle de toutes les demandes utiles, leur état et les décisions prises afin qu’une autre intelligence artificielle puisse reprendre sans relire tout l’historique.
- L’historique Git conserve les changements techniques publiés. Les secrets, jetons et données privées ne sont volontairement pas recopiés dans le dépôt.
- Après chaque future étape importante, mettre à jour ce rapport avec la date, les fichiers touchés, les tests, le cache-bust et les limites restantes.

## Règles de continuité

- Ne rien supprimer ni remplacer lorsque la fonctionnalité existe et fonctionne.
- Procéder par ajouts/correctifs limités et testables.
- Ne pas modifier `API_URL` ni `ACCOUNT_EMAIL`.
- Ne pas fusionner Google Docs natif avec `SYNC_DOCUMENT`.
- Ne pas introduire OT/CRDT ni de fusion HTML automatique.
- Conserver `pt-PT` comme langue initiale, avec français, anglais et espagnol disponibles.
- Tester localement avant de publier.
- Conserver le fichier original joint ; une conversion éditable ne le remplace jamais.

## Besoin utilisateur consolidé

ABENE doit permettre :

1. de produire un rapport, un devis seul, un rapport avec devis et un reçu commercial ;
2. de joindre un rapport/devis/document créé ailleurs ;
3. de conserver l’historique par client, chantier, type et période ;
4. de rechercher et sélectionner les documents dans l’`Arquivo` ;
5. de créer des versions finales PDF sans détruire les brouillons ;
6. de télécharger un ensemble ou un pack comptable par période ;
7. de continuer à travailler hors connexion puis synchroniser sans écrasement silencieux ;
8. d’ouvrir facilement le document dans Google Docs ;
9. d’obtenir un Word visuellement fidèle à la mise en page ABENE, y compris pages, en-têtes, icônes et éléments graphiques ;
10. de pouvoir modifier les textes/options des devis, les mémoriser comme valeurs par défaut et restaurer les textes d’origine.

## État fonctionnel vérifié

### Documents commerciaux

- Devis seul : le mode `Substituir o documento (só orçamento)` existe et reste disponible.
- Devis dans un rapport : insertion et réimportation de la table de devis présentes.
- Reçu commercial : présent ; il ne doit pas être présenté comme une facture certifiée AT.
- Textes des conditions, plans et moyens de paiement : personnalisables, mémorisables et restaurables.

### Arquivo

- Classement par client, chantier, type, année et mois.
- Recherche par nom, client, chantier, numéro, type et période.
- Période documentaire distincte de la date technique d’archivage : jour, mois ou année, avec bouton `Hoje`.
- Historique des versions locales et fiches archivées.
- Brouillon, protection, conclusion et versions finales PDF séparés.
- Copie comme nouveau document sans modifier l’original final.
- Google Docs accessible par fiche.
- Sélection multiple, ZIP et pack comptable.

### Ajout du 25 septembre 2026

- Nouveau bouton `Juntar ficheiro` dans `Arquivo`.
- Formats joints : PDF, DOCX, HTML/HTM et TXT.
- Le fichier binaire original est conservé sans conversion dans IndexedDB.
- Suggestions automatiques, toujours modifiables avant validation : type d’après le nom, client d’après les clients connus, période d’après le nom et date du fichier comme repli.
- L’original peut être visualisé (PDF) ou téléchargé avec son nom/format.
- Les ZIP de l’Arquivo incluent un dossier `Original`.
- Le pack comptable inclut `ORIGINAIS/`, son index et `12_periodos_documentos.csv`.
- Les documents justificatifs génériques sont sélectionnables dans le pack, en plus des rapports, devis et reçus.
- Nouvel endpoint Apps Script `SAVE_ORIGINAL_FILE` : enregistre l’original dans Drive sans le convertir. Il reste séparé de `SYNC_DOCUMENT` et de Google Docs.

### Word, PDF et Google Docs

- PDF : export paginé fonctionnel.
- DOCX par défaut : mode fidèle construit à partir des pages ABENE. Il conserve visuellement pages, en-têtes, icônes et éléments graphiques comme le PDF.
- DOCX modifiable : reste disponible en parallèle ; la fidélité dépend des capacités Word.
- Google Docs modifiable : le flux existant reste inchangé et lié au même fichier.
- Nouveau choix `Abrir cópia fiel no Google Docs` : crée une copie visuellement fidèle sans remplacer le Google Docs modifiable lié. La présentation est conservée sous forme de pages ; le texte n’a donc pas la même liberté d’édition que dans le mode modifiable.

## Synchronisation et stockage

- `SYNC_DOCUMENT` conserve son canal de brouillon et ses contrôles de révision/conflit.
- L’`Arquivo` et ses métadonnées sont inclus dans la synchronisation Sheets existante.
- Les PDF finaux utilisent `SAVE_FINAL_PDF`.
- Les originaux joints utilisent `SAVE_ORIGINAL_FILE` lorsque le nouvel Apps Script est redéployé.
- Hors connexion, l’original reste disponible sur l’appareil. Après redéploiement/configuration du script, un nouvel original joint est aussi envoyé vers Drive.
- Ne jamais éditer simultanément le même brouillon sur deux ordinateurs.

## Tests locaux du 25 septembre 2026

Test automatisé réel dans Chrome, application servie localement : **PASS**.

- langue initiale : `pt-PT` ;
- détection de `Relatorio_Cliente_Acme_2026-09.pdf` : rapport, client `Cliente Acme`, période mensuelle `2026-09` ;
- conservation du Blob original et de son nom : PASS ;
- affichage dans l’Arquivo, recherche et filtres de période : PASS ;
- sélecteur du pack comptable : 1 document attendu ;
- ZIP comptable : original PDF présent et `12_periodos_documentos.csv` présent ;
- DOCX fidèle : 95 826 octets, ZIP DOCX valide, 2 médias/pages ;
- PDF de contrôle : 170 911 octets, MIME `application/pdf` ;
- canal Google Docs fidèle simulé : `OPEN_GDOCS` reçoit un DOCX valide (`PK`) nommé `Documento1 — fiel` ;
- vérification syntaxique Node des fichiers JavaScript et Apps Script : PASS ;
- `git diff --check` : PASS.

Les appels réels Gmail/Drive/Google Docs sur le compte du client ne peuvent pas être validés sans la nouvelle version Apps Script déployée et autorisée dans ce compte.

## Cadre fiscal portugais à ne pas dépasser

ABENE organise des rapports, devis, reçus commerciaux et pièces justificatives. Le pack facilite le travail du comptable, mais n’est pas un SAF-T et ABENE n’est pas présenté comme logiciel de facturation certifié.

Références officielles consultées :

- [Autoridade Tributária — SAF-T (PT)](https://info.portaldasfinancas.gov.pt/pt/apoio_ao_contribuinte/Negocios/Faturacao/SAF_T_PT/SAF_T_PT_Versao_PT/Paginas/default.aspx)
- [Autoridade Tributária — certification des logiciels de facturation](https://info.portaldasfinancas.gov.pt/pt/apoio_ao_contribuinte/Negocios/Faturacao/Regras_mecanismos_comunicacao/Certificacao_programas/Certificacao_software_faturacao/Paginas/default.aspx)
- [Autoridade Tributária — règles de facturation et archivage électronique](https://info.portaldasfinancas.gov.pt/pt/apoio_ao_contribuinte/Negocios/Faturacao/Regras_de_faturacao/Paginas/default.aspx)
- [CIRC, article 130 — dossier fiscal conservé dix ans](https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/CIRC_2R/Pages/irc130.aspx)

## Fichiers modifiés dans cette étape

- `index.html`
- `libs/abene-arquivo.js`
- `libs/abene-contabilidade.js`
- `libs/abene-gdocs.js`
- `libs/abene-i18n.js`
- `apps-script/emaildrive.gs.txt`
- `README.md`
- `docs/RAPPORT_CONTINUITE.md`

Cache-bust : `20260925-final-workflow-1`.

Rien de fonctionnel existant n’a été supprimé. Les deux modes Google Docs et les deux modes DOCX restent parallèles.

## Étape externe obligatoire après publication GitHub Pages

Pour activer l’envoi des fichiers originaux vers Drive :

1. recopier le nouveau `apps-script/emaildrive.gs.txt` dans le projet Apps Script du compte client ;
2. enregistrer et créer une **nouvelle version** du déploiement Web App ;
3. conserver l’URL `/exec` et la clé existantes si Google les maintient ; sinon actualiser uniquement les champs dans `Definições` ;
4. exécuter `Testar ligação` ;
5. joindre un petit PDF de test et vérifier l’indication `Original no Drive`.

## Point de reprise

Après le déploiement Pages, vérifier l’URL avec le hash du nouveau commit, faire un rechargement forcé, puis réaliser un essai réel avec : un rapport multipage, un devis seul, un PDF externe nommé avec client+période, le pack comptable et les deux choix Google Docs. Ne pas recommencer les modules déjà marqués PASS ci-dessus.
