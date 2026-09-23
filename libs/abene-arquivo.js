/* Genius Raros — janela Arquivo (independente do editor Word).
   Não altera Guardar / autosave / versões / modelos existentes.
   Cópia só de leitura: o documento em curso não é tocado ao consultar.
   Fix #7 (mobile nav): back path preview→files→folders, tools collapse,
   44px targets, reachable panes without crushing desktop layout.
   Fix #7b: injectCss @media aligned with isMobileArchive (pointer:coarse).
   Fix #7c: body scroll-lock, keep mobile pane on reopen, files after nova pasta. */
(function () {
    var STORE = 'abeneArquivoV1';
    var FOLDERS_STORE = 'abeneArquivoFoldersV1';
    var LAST_JOB = 'abeneLastJobV1';
    var NAVY = '#0B1223';
    var GOLD = '#C9A84C';
    var state = {
        folder: 'all',
        query: '',
        clientQuery: '',
        type: 'all',
        concludedOnly: false,
        dateFrom: '',
        dateTo: '',
        selectedIds: {},
        selectedId: null,
        previewSource: null,
        previewTab: 'doc',
        selectedPdfId: null,
        mobilePane: 'folders',
        toolsCollapsed: true,
        eventsBound: false
    };

    function isMobileArchive() {
        try {
            return window.matchMedia('(max-width:820px), (max-width:960px) and (pointer:coarse), (max-width:960px) and (max-height:480px) and (orientation:landscape)').matches;
        } catch (e) {
            return window.innerWidth <= 820;
        }
    }

    var STR = {
        'pt-PT': {
            title: 'Arquivo',
            subtitle: 'Consultar pastas e documentos concluídos — o Word em curso não é alterado.',
            archiveNow: 'Arquivar documento atual',
            close: 'Fechar',
            search: 'Pesquisar nome, cliente, pasta…',
            typeAll: 'Todos os tipos',
            typeRel: 'Relatório',
            typeOrc: 'Orçamento',
            typeRec: 'Recibo',
            typeComp: 'Completo (relatório + orçamento + recibo)',
            typeDoc: 'Outro documento',
            onlyDone: 'Só concluídos',
            folders: 'Pastas',
            files: 'Ficheiros',
            all: 'Todos',
            done: 'Concluídos',
            byType: 'Por tipo',
            byClient: 'Por cliente',
            clientSearch: 'Procurar cliente ou trabalho…',
            clientEmpty: 'Nenhum cliente ou trabalho encontrado.',
            clientDocuments: 'Ver documentos e trabalhos',
            byPasta: 'Por pasta / obra',
            byYear: 'Por ano',
            drafts: 'Documento em curso e versões Guardar',
            current: 'Documento em curso (não arquivado)',
            versions: 'Versões locais (menu Guardar) — só leitura',
            empty: 'Nenhum documento nesta pasta. Arquive o documento atual ou desmarque « só concluídos ».',
            preview: 'Pré-visualização',
            noSel: 'Selecione um ficheiro à esquerda. O editor Word por baixo não muda.',
            open: 'Abrir no editor',
            copyAll: 'Copiar como modelo',
            copyRel: 'Copiar só o relatório',
            copyOrc: 'Copiar só o orçamento',
            copyRec: 'Copiar só o recibo',
            dlOne: 'Descarregar HTML',
            dlSet: 'Descarregar conjunto (ZIP)',
            markDone: 'Marcar concluído',
            markOpen: 'Desmarcar concluído',
            pasta: 'Pasta / obra',
            client: 'Cliente',
            concluded: 'Concluído',
            notDone: 'Em curso',
            sentBadge: 'Enviado PDF',
            openModify: 'Abrir para modificar',
            openView: 'Abrir para consultar',
            copyAsNew: 'Copiar como novo',
            archived: 'Arquivado',
            confirmOpen: 'Abrir para modificar no editor substitui o conteúdo visível. O arquivo e o Guardar automático não são apagados. Continuar?',
            confirmOpenFinal: 'Esta é uma versão definitiva (PDF gelado). Para alterar, use «Copiar como novo». Abrir mesmo assim só para consultar no editor?',
            confirmCopy: 'Copiar este modelo para o editor cria um documento novo (o original e o PDF final ficam intactos). Continuar?',
            pastaPh: 'Ex.: Cozinha Rua das Flores 12',
            clientPh: 'Nome do cliente',
            archivedOk: 'Cópia guardada no arquivo. O documento no editor não foi alterado.',
            quota: 'Arquivo cheio (limite do browser). Exporte um ZIP e continue.',
            copied: 'Cópia criada no editor. O original no arquivo ficou intacto.',
            opened: 'Documento aberto para modificar. A cópia no arquivo ficou intacta.',
            openedFinalHint: 'Versão definitiva aberta só para consulta. O PDF final no arquivo não foi alterado.',
            sentMarked: 'Marcado como enviado ao cliente (PDF — não definitivo).',
            sentFinalMarked: 'Enviado ao cliente e guardado no Arquivo como versão final.',
            sentFinalFailed: 'O PDF foi enviado, mas a versão final não pôde ser guardada no Arquivo.',
            zipOk: 'Conjunto descarregado ({n} ficheiro(s)).',
            zipEmpty: 'Nada a descarregar nesta vista.',
            packOk: 'Pack contabilista PT descarregado ({n} documento(s)).',
            packEmpty: 'Não há relatórios, orçamentos nem recibos disponíveis para o contabilista.',
            noZip: 'JSZip indisponível — a descarregar HTML um a um.',
            needBlock: 'Este documento não tem essa parte para copiar.',
            none: 'Sem pasta',
            noClient: 'Sem cliente',
            newClient: 'Novo cliente',
            newPasta: 'Nova pasta / obra',
            folderOk: 'Pasta criada. Será copiada para o Google Drive na próxima sincronização.',
            openDrive: 'Abrir no Drive',
            archiveConfirm: 'Arquivar em {client} / {pasta}?',
            archivedAuto: 'Arquivado em {client} / {pasta}.',
            saveFicha: 'Guardar ficha',
            tabDoc: 'Documento',
            tabPdf: 'PDF',
            navHint: 'Pastas à esquerda · ficheiros ao centro · pré-visualização à direita.',
            archivePanelTitle: 'Arquivar o documento atual',
            archiveGo: 'Arquivar agora',
            archiveCancel: 'Cancelar',
            pdfSavedView: 'Versão gravada — a pré-visualização PDF está abaixo.',
            createGo: 'Criar',
            folderPanelTitle: 'Nova pasta no arquivo',
            gdocsEntry: 'Google Docs',
            gdocsOpenEntry: 'Abrir o Google Docs ligado',
            gdocsCreateEntry: 'Criar e abrir no Google Docs',
            gdocsCopyEntry: 'Criar cópia editável no Google Docs',
            gdocsCopyNotice: 'Foi criada uma cópia editável; o documento concluído original fica intacto.',
            gdocsOffline: 'Sem ligação: o Google Docs só pode ser aberto quando houver internet.'
        },
        'fr-FR': {
            title: 'Archives',
            subtitle: 'Dossiers et documents conclus — le Word en cours n’est pas modifié.',
            archiveNow: 'Archiver le document actuel',
            close: 'Fermer',
            search: 'Rechercher nom, client, dossier…',
            typeAll: 'Tous les types',
            typeRel: 'Rapport',
            typeOrc: 'Devis',
            typeRec: 'Reçu',
            typeComp: 'Complet (rapport + devis + reçu)',
            typeDoc: 'Autre document',
            onlyDone: 'Conclus seulement',
            folders: 'Dossiers',
            files: 'Fichiers',
            all: 'Tous',
            done: 'Conclus',
            byType: 'Par type',
            byClient: 'Par client',
            clientSearch: 'Rechercher un client ou un travail…',
            clientEmpty: 'Aucun client ou travail trouvé.',
            clientDocuments: 'Voir les documents et travaux',
            byPasta: 'Par dossier / chantier',
            byYear: 'Par année',
            drafts: 'Document en cours et versions Enregistrer',
            current: 'Document en cours (non archivé)',
            versions: 'Versions locales (Enregistrer) — lecture seule',
            empty: 'Aucun document dans ce dossier. Archivez le document actuel ou décochez « conclus seulement ».',
            preview: 'Aperçu',
            noSel: 'Sélectionnez un fichier à gauche. L’éditeur Word en dessous ne change pas.',
            open: 'Ouvrir dans l’éditeur',
            copyAll: 'Copier comme modèle',
            copyRel: 'Copier seulement le rapport',
            copyOrc: 'Copier seulement le devis',
            copyRec: 'Copier seulement le reçu',
            dlOne: 'Télécharger HTML',
            dlSet: 'Télécharger l’ensemble (ZIP)',
            markDone: 'Marquer conclu',
            markOpen: 'Retirer le statut conclu',
            pasta: 'Dossier / chantier',
            client: 'Client',
            concluded: 'Conclu',
            notDone: 'En cours',
            sentBadge: 'PDF envoyé',
            openModify: 'Ouvrir pour modifier',
            openView: 'Ouvrir pour consulter',
            copyAsNew: 'Copier comme nouveau',
            archived: 'Archivé',
            confirmOpen: 'Ouvrir pour modifier dans l’éditeur remplace le contenu visible. L’archive et l’enregistrement auto ne sont pas effacés. Continuer ?',
            confirmOpenFinal: 'Version définitive (PDF figé). Pour modifier, utilisez « Copier comme nouveau ». Ouvrir quand même pour consultation ?',
            confirmCopy: 'Copier ce modèle dans l’éditeur crée un nouveau document (l’original et le PDF final restent intacts). Continuer ?',
            pastaPh: 'Ex. : Cuisine Rue des Fleurs 12',
            clientPh: 'Nom du client',
            archivedOk: 'Copie enregistrée dans l’archive. Le document dans l’éditeur n’a pas changé.',
            quota: 'Archive pleine (limite du navigateur). Exportez un ZIP puis continuez.',
            copied: 'Copie créée dans l’éditeur. L’original dans l’archive est intact.',
            opened: 'Document ouvert pour modification. La copie dans l’archive est intacte.',
            openedFinalHint: 'Version définitive ouverte en consultation. Le PDF final dans l’archive n’a pas changé.',
            sentMarked: 'Marqué comme envoyé au client (PDF — non définitif).',
            sentFinalMarked: 'Envoyé au client et conservé dans les archives comme version finale.',
            sentFinalFailed: 'Le PDF a été envoyé, mais la version finale n’a pas pu être conservée dans les archives.',
            zipOk: 'Ensemble téléchargé ({n} fichier(s)).',
            zipEmpty: 'Rien à télécharger dans cette vue.',
            packOk: 'Pack comptable PT téléchargé ({n} document(s)).',
            packEmpty: 'Aucun rapport, devis ou reçu n’est disponible pour le comptable.',
            noZip: 'JSZip indisponible — téléchargement HTML un par un.',
            needBlock: 'Ce document n’a pas cette partie à copier.',
            none: 'Sans dossier',
            noClient: 'Sans client',
            newClient: 'Nouveau client',
            newPasta: 'Nouveau dossier / chantier',
            folderOk: 'Dossier créé. Il sera copié vers Google Drive à la prochaine synchro.',
            openDrive: 'Ouvrir dans Drive',
            archiveConfirm: 'Archiver dans {client} / {pasta} ?',
            archivedAuto: 'Archivé dans {client} / {pasta}.',
            saveFicha: 'Enregistrer la fiche',
            tabDoc: 'Document',
            tabPdf: 'PDF',
            navHint: 'Dossiers à gauche · fichiers au centre · aperçu à droite.',
            archivePanelTitle: 'Archiver le document actuel',
            archiveGo: 'Archiver maintenant',
            archiveCancel: 'Annuler',
            pdfSavedView: 'Version enregistrée — l’aperçu PDF est ci-dessous.',
            createGo: 'Créer',
            folderPanelTitle: 'Nouveau dossier dans l’archive',
            gdocsEntry: 'Google Docs',
            gdocsOpenEntry: 'Ouvrir le Google Docs lié',
            gdocsCreateEntry: 'Créer et ouvrir dans Google Docs',
            gdocsCopyEntry: 'Créer une copie modifiable dans Google Docs',
            gdocsCopyNotice: 'Une copie modifiable a été créée ; le document final original reste intact.',
            gdocsOffline: 'Hors connexion : Google Docs ne peut être ouvert qu’avec Internet.'
        },
        'en-US': {
            title: 'Archive',
            subtitle: 'Browse folders and concluded files — the current Word document is not changed.',
            archiveNow: 'Archive current document',
            close: 'Close',
            search: 'Search name, client, folder…',
            typeAll: 'All types',
            typeRel: 'Report',
            typeOrc: 'Quote',
            typeRec: 'Receipt',
            typeComp: 'Complete (report + quote + receipt)',
            typeDoc: 'Other document',
            onlyDone: 'Concluded only',
            folders: 'Folders',
            files: 'Files',
            all: 'All',
            done: 'Concluded',
            byType: 'By type',
            byClient: 'By client',
            clientSearch: 'Find a client or job…',
            clientEmpty: 'No matching client or job.',
            clientDocuments: 'View documents and jobs',
            byPasta: 'By job folder',
            byYear: 'By year',
            drafts: 'Current document and Save versions',
            current: 'Current document (not archived)',
            versions: 'Local Save versions — read only',
            empty: 'No documents in this folder. Archive the current document or clear “concluded only”.',
            preview: 'Preview',
            noSel: 'Select a file on the left. The Word editor underneath does not change.',
            open: 'Open in editor',
            copyAll: 'Copy as template',
            copyRel: 'Copy report only',
            copyOrc: 'Copy quote only',
            copyRec: 'Copy receipt only',
            dlOne: 'Download HTML',
            dlSet: 'Download set (ZIP)',
            markDone: 'Mark concluded',
            markOpen: 'Unmark concluded',
            pasta: 'Job folder',
            client: 'Client',
            concluded: 'Concluded',
            notDone: 'In progress',
            sentBadge: 'PDF sent',
            openModify: 'Open to edit',
            openView: 'Open to view',
            copyAsNew: 'Copy as new',
            archived: 'Archived',
            confirmOpen: 'Open to edit replaces the visible content. The archive and autosave are not deleted. Continue?',
            confirmOpenFinal: 'This is a final version (frozen PDF). To change it, use “Copy as new”. Open anyway for viewing?',
            confirmCopy: 'Copying creates a new document (original and final PDF stay intact). Continue?',
            pastaPh: 'e.g. Kitchen 12 Flower Street',
            clientPh: 'Client name',
            archivedOk: 'Copy stored in the archive. The editor document was not changed.',
            quota: 'Archive full (browser limit). Download a ZIP first.',
            copied: 'Copy created in the editor. The archive original is intact.',
            opened: 'Document opened to edit. The archive copy is intact.',
            openedFinalHint: 'Final version opened for viewing. The final PDF in the archive was not changed.',
            sentMarked: 'Marked as sent to client (PDF — not final).',
            sentFinalMarked: 'Sent to the client and stored in the archive as a final version.',
            sentFinalFailed: 'The PDF was sent, but the final version could not be stored in the archive.',
            zipOk: 'Set downloaded ({n} file(s)).',
            zipEmpty: 'Nothing to download in this view.',
            packOk: 'PT accounting pack downloaded ({n} document(s)).',
            packEmpty: 'No reports, quotes or receipts are available for the accountant.',
            noZip: 'JSZip unavailable — downloading HTML one by one.',
            needBlock: 'This document does not have that part to copy.',
            none: 'No folder',
            noClient: 'No client',
            newClient: 'New client',
            newPasta: 'New job folder',
            folderOk: 'Folder created. It will be copied to Google Drive on the next sync.',
            openDrive: 'Open in Drive',
            archiveConfirm: 'Archive to {client} / {pasta}?',
            archivedAuto: 'Archived in {client} / {pasta}.',
            saveFicha: 'Save file card',
            tabDoc: 'Document',
            tabPdf: 'PDF',
            navHint: 'Folders on the left · files in the middle · preview on the right.',
            archivePanelTitle: 'Archive the current document',
            archiveGo: 'Archive now',
            archiveCancel: 'Cancel',
            pdfSavedView: 'Version saved — PDF preview is below.',
            createGo: 'Create',
            folderPanelTitle: 'New archive folder',
            gdocsEntry: 'Google Docs',
            gdocsOpenEntry: 'Open linked Google Doc',
            gdocsCreateEntry: 'Create and open in Google Docs',
            gdocsCopyEntry: 'Create an editable copy in Google Docs',
            gdocsCopyNotice: 'An editable copy was created; the original final document remains unchanged.',
            gdocsOffline: 'Offline: Google Docs can only be opened with an internet connection.'
        },
        'es-ES': {
            title: 'Archivo',
            subtitle: 'Consultar carpetas y documentos concluidos — el Word en curso no se modifica.',
            archiveNow: 'Archivar documento actual',
            close: 'Cerrar',
            search: 'Buscar nombre, cliente, carpeta…',
            typeAll: 'Todos los tipos',
            typeRel: 'Informe',
            typeOrc: 'Presupuesto',
            typeRec: 'Recibo',
            typeComp: 'Completo (informe + presupuesto + recibo)',
            typeDoc: 'Otro documento',
            onlyDone: 'Solo concluidos',
            folders: 'Carpetas',
            files: 'Ficheros',
            all: 'Todos',
            done: 'Concluidos',
            byType: 'Por tipo',
            byClient: 'Por cliente',
            clientSearch: 'Buscar cliente o trabajo…',
            clientEmpty: 'No se encontraron clientes ni trabajos.',
            clientDocuments: 'Ver documentos y trabajos',
            byPasta: 'Por carpeta / obra',
            byYear: 'Por año',
            drafts: 'Documento en curso y versiones Guardar',
            current: 'Documento en curso (no archivado)',
            versions: 'Versiones locales (Guardar) — solo lectura',
            empty: 'Ningún documento en esta carpeta. Archive el documento actual o quite « solo concluidos ».',
            preview: 'Vista previa',
            noSel: 'Seleccione un fichero a la izquierda. El editor Word debajo no cambia.',
            open: 'Abrir en el editor',
            copyAll: 'Copiar como modelo',
            copyRel: 'Copiar solo el informe',
            copyOrc: 'Copiar solo el presupuesto',
            copyRec: 'Copiar solo el recibo',
            dlOne: 'Descargar HTML',
            dlSet: 'Descargar conjunto (ZIP)',
            markDone: 'Marcar concluido',
            markOpen: 'Quitar concluido',
            pasta: 'Carpeta / obra',
            client: 'Cliente',
            concluded: 'Concluido',
            notDone: 'En curso',
            sentBadge: 'PDF enviado',
            openModify: 'Abrir para modificar',
            openView: 'Abrir para consultar',
            copyAsNew: 'Copiar como nuevo',
            archived: 'Archivado',
            confirmOpen: 'Abrir para modificar sustituye el contenido visible. El archivo y el autoguardado no se borran. ¿Continuar?',
            confirmOpenFinal: 'Versión definitiva (PDF congelado). Para cambiarla, use «Copiar como nuevo». ¿Abrir solo para consultar?',
            confirmCopy: 'Copiar crea un documento nuevo (el original y el PDF final quedan intactos). ¿Continuar?',
            pastaPh: 'Ej.: Cocina Rua das Flores 12',
            clientPh: 'Nombre del cliente',
            archivedOk: 'Copia guardada en el archivo. El documento del editor no cambió.',
            quota: 'Archivo lleno (límite del navegador). Descargue un ZIP primero.',
            copied: 'Copia creada en el editor. El original en el archivo quedó intacto.',
            opened: 'Documento abierto para modificar. La copia en el archivo quedó intacta.',
            openedFinalHint: 'Versión definitiva abierta solo para consulta. El PDF final no cambió.',
            sentMarked: 'Marcado como enviado al cliente (PDF — no definitivo).',
            sentFinalMarked: 'Enviado al cliente y guardado en el archivo como versión final.',
            sentFinalFailed: 'El PDF fue enviado, pero la versión final no pudo guardarse en el archivo.',
            zipOk: 'Conjunto descargado ({n} fichero(s)).',
            zipEmpty: 'Nada que descargar en esta vista.',
            packOk: 'Pack contable PT descargado ({n} documento(s)).',
            packEmpty: 'No hay informes, presupuestos ni recibos disponibles para el contable.',
            noZip: 'JSZip no disponible — descarga HTML uno a uno.',
            needBlock: 'Este documento no tiene esa parte para copiar.',
            none: 'Sin carpeta',
            noClient: 'Sin cliente',
            newClient: 'Nuevo cliente',
            newPasta: 'Nueva carpeta / obra',
            folderOk: 'Carpeta creada. Se copiará a Google Drive en la próxima sincronización.',
            openDrive: 'Abrir en Drive',
            archiveConfirm: '¿Archivar en {client} / {pasta}?',
            archivedAuto: 'Archivado en {client} / {pasta}.',
            saveFicha: 'Guardar ficha',
            tabDoc: 'Documento',
            tabPdf: 'PDF',
            navHint: 'Carpetas a la izquierda · ficheros al centro · vista previa a la derecha.',
            archivePanelTitle: 'Archivar el documento actual',
            archiveGo: 'Archivar ahora',
            archiveCancel: 'Cancelar',
            pdfSavedView: 'Versión grabada — la vista PDF está abajo.',
            createGo: 'Crear',
            folderPanelTitle: 'Nueva carpeta en el archivo',
            gdocsEntry: 'Google Docs',
            gdocsOpenEntry: 'Abrir el Google Docs vinculado',
            gdocsCreateEntry: 'Crear y abrir en Google Docs',
            gdocsCopyEntry: 'Crear una copia editable en Google Docs',
            gdocsCopyNotice: 'Se creó una copia editable; el documento final original permanece intacto.',
            gdocsOffline: 'Sin conexión: Google Docs solo se puede abrir con Internet.'
        }
    };

    var PDFSTR = {
        'pt-PT': {
            pdfTitle: 'Versões finais (PDF)',
            pdfHint: 'Cliché interno por etapa (relatório, orçamento, recibo). Não é fatura AT. O Word continua editável. Descarregar é opcional.',
            pdfGravarRel: 'Gravar relatório',
            pdfGravarOrc: 'Gravar orçamento',
            pdfGravarRec: 'Gravar recibo',
            pdfBusy: 'A gravar PDF… o Word não é alterado.',
            pdfOk: 'Versão final {etape} v{rev} gravada (sem descarregar).',
            pdfNoLib: 'html2pdf indisponível.',
            pdfNeed: 'Esta etapa não existe neste documento.',
            pdfConfirmV: 'Já existe v{rev} desta etapa. Gravar v{next}? A versão anterior fica intacta.',
            pdfView: 'Ver',
            pdfDl: 'Descarregar',
            pdfEmpty: 'Nenhuma versão final ainda.',
            pdfFail: 'Não foi possível gravar o PDF.',
            pdfKb: '{n} KB',
            packAcct: 'Pack contabilista PT'
        },
        'fr-FR': {
            pdfTitle: 'Versions finales (PDF)',
            pdfHint: 'Cliché interne par étape (rapport, devis, reçu). Ce n’est pas une facture AT. Le Word reste modifiable. Télécharger est optionnel.',
            pdfGravarRel: 'Figer le rapport',
            pdfGravarOrc: 'Figer le devis',
            pdfGravarRec: 'Figer le reçu',
            pdfBusy: 'Enregistrement du PDF… le Word n’est pas modifié.',
            pdfOk: 'Version finale {etape} v{rev} enregistrée (sans téléchargement).',
            pdfNoLib: 'html2pdf indisponible.',
            pdfNeed: 'Cette étape n’existe pas dans ce document.',
            pdfConfirmV: 'v{rev} existe déjà pour cette étape. Enregistrer v{next} ? La version précédente reste.',
            pdfView: 'Voir',
            pdfDl: 'Télécharger',
            pdfEmpty: 'Aucune version finale pour l’instant.',
            pdfFail: 'Impossible d’enregistrer le PDF.',
            pdfKb: '{n} Ko',
            packAcct: 'Pack comptable PT'
        },
        'en-US': {
            pdfTitle: 'Final versions (PDF)',
            pdfHint: 'Internal snapshot per stage (report, quote, receipt). Not an AT invoice. Word stays editable. Download is optional.',
            pdfGravarRel: 'Save report final',
            pdfGravarOrc: 'Save quote final',
            pdfGravarRec: 'Save receipt final',
            pdfBusy: 'Saving PDF… Word is not changed.',
            pdfOk: 'Final {etape} v{rev} saved (no download).',
            pdfNoLib: 'html2pdf unavailable.',
            pdfNeed: 'This stage is not in the document.',
            pdfConfirmV: 'v{rev} already exists for this stage. Save v{next}? The previous version stays.',
            pdfView: 'View',
            pdfDl: 'Download',
            pdfEmpty: 'No final version yet.',
            pdfFail: 'Could not save the PDF.',
            pdfKb: '{n} KB',
            packAcct: 'PT accounting pack'
        },
        'es-ES': {
            pdfTitle: 'Versiones finales (PDF)',
            pdfHint: 'Cliché interno por etapa (informe, presupuesto, recibo). No es factura AT. El Word sigue editable. Descargar es opcional.',
            pdfGravarRel: 'Grabar informe',
            pdfGravarOrc: 'Grabar presupuesto',
            pdfGravarRec: 'Grabar recibo',
            pdfBusy: 'Grabando PDF… el Word no se modifica.',
            pdfOk: 'Versión final {etape} v{rev} grabada (sin descargar).',
            pdfNoLib: 'html2pdf no disponible.',
            pdfNeed: 'Esta etapa no existe en el documento.',
            pdfConfirmV: 'Ya existe v{rev} de esta etapa. ¿Grabar v{next}? La anterior permanece.',
            pdfView: 'Ver',
            pdfDl: 'Descargar',
            pdfEmpty: 'Ninguna versión final aún.',
            pdfFail: 'No se pudo grabar el PDF.',
            pdfKb: '{n} KB',
            packAcct: 'Pack contable PT'
        }
    };
    Object.keys(PDFSTR).forEach(function (l) {
        if (STR[l]) Object.assign(STR[l], PDFSTR[l]);
    });

    var SELECTSTR = {
        'pt-PT': {
            dateFrom: 'Período desde', dateTo: 'Período até', clearPeriod: 'Limpar período',
            selectAll: 'Selecionar visíveis', clearSelection: 'Limpar seleção', selectedCount: '{n} selecionado(s)',
            downloadSelected: 'Descarregar selecionados', packSelected: 'Pack contabilista selecionado',
            finalizeSelected: 'Criar finais (PDF)', documentDate: 'Data do documento', archiveDate: 'Arquivado em',
            period: 'Período do documento', periodDay: 'Dia', periodMonth: 'Mês', periodYear: 'Ano', periodToday: 'Hoje',
            selectedEmpty: 'Selecione pelo menos um documento.',
            finalizeConfirm: 'Criar e guardar os PDFs finais de {n} documento(s)? Os originais e os PDFs existentes ficam intactos.',
            finalizeBusy: 'A criar versões finais de {n} documento(s)…',
            finalizeOk: 'Versões finais verificadas para {n} documento(s).',
            finalizePartial: '{ok} documento(s) finalizado(s); {fail} sem etapa válida ou com erro.',
            finalizeArchiveOnly: 'A finalização em lote aplica-se apenas aos documentos arquivados.'
        },
        'fr-FR': {
            dateFrom: 'Période depuis', dateTo: 'Période jusqu’à', clearPeriod: 'Effacer la période',
            selectAll: 'Sélectionner les visibles', clearSelection: 'Effacer la sélection', selectedCount: '{n} sélectionné(s)',
            downloadSelected: 'Télécharger la sélection', packSelected: 'Pack comptable sélectionné',
            finalizeSelected: 'Créer les versions finales (PDF)', documentDate: 'Date du document', archiveDate: 'Archivé le',
            period: 'Période du document', periodDay: 'Jour', periodMonth: 'Mois', periodYear: 'Année', periodToday: 'Aujourd’hui',
            selectedEmpty: 'Sélectionnez au moins un document.',
            finalizeConfirm: 'Créer et conserver les PDF finaux de {n} document(s) ? Les originaux et les PDF existants resteront intacts.',
            finalizeBusy: 'Création des versions finales de {n} document(s)…',
            finalizeOk: 'Versions finales vérifiées pour {n} document(s).',
            finalizePartial: '{ok} document(s) finalisé(s) ; {fail} sans étape valable ou en erreur.',
            finalizeArchiveOnly: 'La finalisation groupée concerne uniquement les documents archivés.'
        },
        'en-US': {
            dateFrom: 'Period from', dateTo: 'Period to', clearPeriod: 'Clear period',
            selectAll: 'Select visible', clearSelection: 'Clear selection', selectedCount: '{n} selected',
            downloadSelected: 'Download selected', packSelected: 'Selected accounting pack',
            finalizeSelected: 'Create finals (PDF)', documentDate: 'Document date', archiveDate: 'Archived on',
            period: 'Document period', periodDay: 'Day', periodMonth: 'Month', periodYear: 'Year', periodToday: 'Today',
            selectedEmpty: 'Select at least one document.',
            finalizeConfirm: 'Create and retain final PDFs for {n} document(s)? Originals and existing PDFs will remain intact.',
            finalizeBusy: 'Creating final versions for {n} document(s)…',
            finalizeOk: 'Final versions verified for {n} document(s).',
            finalizePartial: '{ok} document(s) finalized; {fail} had no valid stage or failed.',
            finalizeArchiveOnly: 'Bulk finalization applies only to archived documents.'
        },
        'es-ES': {
            dateFrom: 'Período desde', dateTo: 'Período hasta', clearPeriod: 'Limpiar período',
            selectAll: 'Seleccionar visibles', clearSelection: 'Limpiar selección', selectedCount: '{n} seleccionado(s)',
            downloadSelected: 'Descargar selección', packSelected: 'Pack contable seleccionado',
            finalizeSelected: 'Crear finales (PDF)', documentDate: 'Fecha del documento', archiveDate: 'Archivado el',
            period: 'Período del documento', periodDay: 'Día', periodMonth: 'Mes', periodYear: 'Año', periodToday: 'Hoy',
            selectedEmpty: 'Seleccione al menos un documento.',
            finalizeConfirm: '¿Crear y conservar los PDF finales de {n} documento(s)? Los originales y los PDF existentes quedarán intactos.',
            finalizeBusy: 'Creando versiones finales de {n} documento(s)…',
            finalizeOk: 'Versiones finales verificadas para {n} documento(s).',
            finalizePartial: '{ok} documento(s) finalizado(s); {fail} sin etapa válida o con error.',
            finalizeArchiveOnly: 'La finalización en lote se aplica solo a documentos archivados.'
        }
    };
    Object.keys(SELECTSTR).forEach(function (l) {
        if (STR[l]) Object.assign(STR[l], SELECTSTR[l]);
    });

    var TRASHSTR = {
        'pt-PT': {
            trash: 'Lixo', trashEmpty: 'O Lixo está vazio.', deletedBadge: 'No Lixo', deletedOn: 'Eliminado em',
            moveTrash: 'Mover para o Lixo', moveSelectedTrash: 'Mover rascunhos para o Lixo',
            restore: 'Restaurar', restoreSelected: 'Restaurar selecionados',
            trashConfirm: 'Mover «{name}» para o Lixo? Poderá restaurá-lo mais tarde.',
            trashSelectedConfirm: 'Mover {n} rascunho(s) selecionado(s) para o Lixo? Poderá restaurá-los mais tarde.',
            trashOk: '{n} rascunho(s) movido(s) para o Lixo.', restoredOk: '{n} documento(s) restaurado(s).',
            trashDraftOnly: 'Só os documentos arquivados como rascunho podem ser movidos para o Lixo.',
            protectedCannotTrash: 'Este rascunho está protegido. Retire a proteção antes de o mover para o Lixo.',
            protect: 'Proteger documento', unprotect: 'Retirar proteção', protectedBadge: 'Protegido',
            protectConfirm: 'Proteger apenas «{name}» contra alterações e eliminação?',
            unprotectConfirm: 'Retirar a proteção de «{name}»?',
            protectedOk: 'Proteção aplicada apenas a este documento.', unprotectedOk: 'Proteção retirada deste documento.',
            protectedOpened: 'Documento protegido aberto apenas para consulta.'
        },
        'fr-FR': {
            trash: 'Corbeille', trashEmpty: 'La Corbeille est vide.', deletedBadge: 'Dans la Corbeille', deletedOn: 'Supprimé le',
            moveTrash: 'Mettre à la Corbeille', moveSelectedTrash: 'Mettre les brouillons à la Corbeille',
            restore: 'Restaurer', restoreSelected: 'Restaurer la sélection',
            trashConfirm: 'Mettre « {name} » à la Corbeille ? Vous pourrez le restaurer plus tard.',
            trashSelectedConfirm: 'Mettre {n} brouillon(s) sélectionné(s) à la Corbeille ? Vous pourrez les restaurer plus tard.',
            trashOk: '{n} brouillon(s) placé(s) dans la Corbeille.', restoredOk: '{n} document(s) restauré(s).',
            trashDraftOnly: 'Seuls les documents archivés comme brouillons peuvent être placés dans la Corbeille.',
            protectedCannotTrash: 'Ce brouillon est protégé. Retirez sa protection avant de le mettre à la Corbeille.',
            protect: 'Protéger le document', unprotect: 'Retirer la protection', protectedBadge: 'Protégé',
            protectConfirm: 'Protéger uniquement « {name} » contre les modifications et la suppression ?',
            unprotectConfirm: 'Retirer la protection de « {name} » ?',
            protectedOk: 'La protection est appliquée uniquement à ce document.', unprotectedOk: 'La protection de ce document a été retirée.',
            protectedOpened: 'Document protégé ouvert uniquement en consultation.'
        },
        'en-US': {
            trash: 'Trash', trashEmpty: 'Trash is empty.', deletedBadge: 'In Trash', deletedOn: 'Deleted on',
            moveTrash: 'Move to Trash', moveSelectedTrash: 'Move drafts to Trash',
            restore: 'Restore', restoreSelected: 'Restore selected',
            trashConfirm: 'Move “{name}” to Trash? You can restore it later.',
            trashSelectedConfirm: 'Move {n} selected draft(s) to Trash? You can restore them later.',
            trashOk: '{n} draft(s) moved to Trash.', restoredOk: '{n} document(s) restored.',
            trashDraftOnly: 'Only archived draft documents can be moved to Trash.',
            protectedCannotTrash: 'This draft is protected. Remove protection before moving it to Trash.',
            protect: 'Protect document', unprotect: 'Remove protection', protectedBadge: 'Protected',
            protectConfirm: 'Protect only “{name}” against changes and deletion?',
            unprotectConfirm: 'Remove protection from “{name}”?',
            protectedOk: 'Protection was applied only to this document.', unprotectedOk: 'Protection was removed from this document.',
            protectedOpened: 'Protected document opened for viewing only.'
        },
        'es-ES': {
            trash: 'Papelera', trashEmpty: 'La Papelera está vacía.', deletedBadge: 'En la Papelera', deletedOn: 'Eliminado el',
            moveTrash: 'Mover a la Papelera', moveSelectedTrash: 'Mover borradores a la Papelera',
            restore: 'Restaurar', restoreSelected: 'Restaurar seleccionados',
            trashConfirm: '¿Mover «{name}» a la Papelera? Podrá restaurarlo más tarde.',
            trashSelectedConfirm: '¿Mover {n} borrador(es) seleccionado(s) a la Papelera? Podrá restaurarlos más tarde.',
            trashOk: '{n} borrador(es) movido(s) a la Papelera.', restoredOk: '{n} documento(s) restaurado(s).',
            trashDraftOnly: 'Solo los documentos archivados como borrador pueden moverse a la Papelera.',
            protectedCannotTrash: 'Este borrador está protegido. Quite la protección antes de moverlo a la Papelera.',
            protect: 'Proteger documento', unprotect: 'Quitar protección', protectedBadge: 'Protegido',
            protectConfirm: '¿Proteger únicamente «{name}» contra cambios y eliminación?',
            unprotectConfirm: '¿Quitar la protección de «{name}»?',
            protectedOk: 'La protección se aplicó únicamente a este documento.', unprotectedOk: 'Se quitó la protección de este documento.',
            protectedOpened: 'Documento protegido abierto solo para consulta.'
        }
    };
    Object.keys(TRASHSTR).forEach(function (l) {
        if (STR[l]) Object.assign(STR[l], TRASHSTR[l]);
    });

    var MOBILESTR = {
        'pt-PT': {
            back: 'Voltar',
            backToFiles: '← Ficheiros',
            backToFolders: '← Pastas',
            toolsMore: 'Filtros e ações',
            toolsLess: 'Recolher',
            navHintMobile: 'Pastas → ficheiros → pré-visualização. Use Voltar para regressar.',
            mobileTrailFolders: 'Pastas',
            mobileTrailFiles: 'Ficheiros',
            mobileTrailPreview: 'Pré-visualização'
        },
        'fr-FR': {
            back: 'Retour',
            backToFiles: '← Fichiers',
            backToFolders: '← Dossiers',
            toolsMore: 'Filtres et actions',
            toolsLess: 'Réduire',
            navHintMobile: 'Dossiers → fichiers → aperçu. Utilisez Retour pour revenir.',
            mobileTrailFolders: 'Dossiers',
            mobileTrailFiles: 'Fichiers',
            mobileTrailPreview: 'Aperçu'
        },
        'en-US': {
            back: 'Back',
            backToFiles: '← Files',
            backToFolders: '← Folders',
            toolsMore: 'Filters & actions',
            toolsLess: 'Collapse',
            navHintMobile: 'Folders → files → preview. Use Back to return.',
            mobileTrailFolders: 'Folders',
            mobileTrailFiles: 'Files',
            mobileTrailPreview: 'Preview'
        },
        'es-ES': {
            back: 'Volver',
            backToFiles: '← Ficheros',
            backToFolders: '← Carpetas',
            toolsMore: 'Filtros y acciones',
            toolsLess: 'Contraer',
            navHintMobile: 'Carpetas → ficheros → vista previa. Use Volver para regresar.',
            mobileTrailFolders: 'Carpetas',
            mobileTrailFiles: 'Ficheros',
            mobileTrailPreview: 'Vista previa'
        }
    };
    Object.keys(MOBILESTR).forEach(function (l) {
        if (STR[l]) Object.assign(STR[l], MOBILESTR[l]);
    });

    function lang() {
        var l = localStorage.getItem('abeneLanguage') || 'pt-PT';
        return STR[l] ? l : 'pt-PT';
    }
    function tr(key, vars) {
        var dict = STR[lang()] || STR['pt-PT'];
        var s = (dict && dict[key]) || (STR['pt-PT'] && STR['pt-PT'][key]) || key;
        if (vars) Object.keys(vars).forEach(function (k) {
            s = String(s).replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
        });
        return s;
    }
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function toast(msg) {
        if (typeof showToast === 'function') showToast(msg);
        else alert(msg);
    }
    function docState() {
        return (window.abene && window.abene.documentState) || {};
    }
    function editorEl() {
        return document.getElementById('editor');
    }
    function loadStore() {
        try {
            var raw = JSON.parse(localStorage.getItem(STORE) || '[]');
            return Array.isArray(raw) ? raw : [];
        } catch (e) { return []; }
    }
    function saveStore(list) {
        try {
            localStorage.setItem(STORE, JSON.stringify(list));
            if (typeof window.abeneSheetsOnArquivoChange === 'function') window.abeneSheetsOnArquivoChange();
            return true;
        } catch (e) {
            toast(tr('quota'));
            return false;
        }
    }
    function loadFolders() {
        try {
            var raw = JSON.parse(localStorage.getItem(FOLDERS_STORE) || '[]');
            return Array.isArray(raw) ? raw : [];
        } catch (e) { return []; }
    }
    function saveFolders(list) {
        try {
            localStorage.setItem(FOLDERS_STORE, JSON.stringify(list));
            if (typeof window.abeneSheetsOnArquivoChange === 'function') window.abeneSheetsOnArquivoChange();
            return true;
        } catch (e) {
            return false;
        }
    }
    function loadLastJob() {
        try {
            var raw = JSON.parse(localStorage.getItem(LAST_JOB) || '{}');
            return raw && typeof raw === 'object' ? raw : {};
        } catch (e) { return {}; }
    }
    function saveLastJob(job) {
        var next = Object.assign({}, loadLastJob(), job || {});
        try { localStorage.setItem(LAST_JOB, JSON.stringify(next)); } catch (e) {}
        return next;
    }
    function pastaHint(client) {
        var job = loadLastJob();
        client = String(client || '').trim();
        if (job.pasta && (!client || !job.client || String(job.client) === client)) return String(job.pasta);
        if (job.site && (!client || !job.client || String(job.client) === client)) return String(job.site);
        var folders = loadFolders();
        var i, f, last = '';
        for (i = 0; i < folders.length; i++) {
            f = folders[i];
            if (!f || f.kind !== 'pasta') continue;
            if (client && String(f.client || '') !== client) continue;
            last = f.label || '';
        }
        return last;
    }
    function decodeBlockPayload(el) {
        if (!el) return null;
        if (window.abeneComercial && typeof window.abeneComercial.decodePayload === 'function') {
            return window.abeneComercial.decodePayload(el);
        }
        var b64 = el.getAttribute('data-abene-payload');
        if (!b64) return null;
        try { return JSON.parse(decodeURIComponent(escape(atob(b64)))); }
        catch (e) {
            try { return JSON.parse(atob(b64)); } catch (e2) { return null; }
        }
    }
    function rememberFolder(kind, label, client) {
        label = String(label || '').trim();
        if (!label) return;
        client = String(client || '').trim();
        var list = loadFolders();
        var exists = list.some(function (f) {
            return f && f.kind === kind && f.label === label && (kind !== 'pasta' || (f.client || '') === client);
        });
        if (exists) return;
        list.push({
            kind: kind,
            label: label,
            client: client,
            path: kind === 'pasta' ? (client ? client + '/' + label : label) : label
        });
        saveFolders(list);
    }
    function driveRootUrl() {
        var c = (window.abene && window.abene.companyData) || {};
        return String(c.driveFolderUrl || '').trim();
    }
    function openDriveRoot() {
        var url = driveRootUrl();
        if (!url) {
            toast(tr('openDrive'));
            return;
        }
        window.open(url, '_blank', 'noopener');
    }
    function createClientFolder() {
        openFolderPanel('client');
    }
    function createPastaFolder() {
        openFolderPanel('pasta');
    }
    function catalogClients() {
        var fromDocs = allEntries().map(function (e) { return e.client || tr('noClient'); });
        var fromCat = [];
        loadFolders().forEach(function (f) {
            if (!f) return;
            if (f.kind === 'client' && f.label) fromCat.push(f.label);
            if (f.kind === 'pasta' && f.client) fromCat.push(f.client);
        });
        return unique(fromDocs.concat(fromCat));
    }
    function catalogPastas() {
        var fromDocs = allEntries().map(function (e) { return e.pasta || tr('none'); });
        var fromCat = loadFolders().filter(function (f) { return f && f.kind === 'pasta' && f.label; }).map(function (f) { return f.label; });
        return unique(fromDocs.concat(fromCat));
    }
    function catalogPastasForClient(client) {
        var fromDocs = allEntries().filter(function (e) {
            return (e.client || tr('noClient')) === client;
        }).map(function (e) { return e.pasta || tr('none'); });
        var fromCat = loadFolders().filter(function (f) {
            return f && f.kind === 'pasta' && f.label && (f.client || tr('noClient')) === client;
        }).map(function (f) { return f.label; });
        return unique(fromDocs.concat(fromCat));
    }
    function folderLabel(id) {
        id = String(id || 'all');
        if (id === 'all') return tr('all');
        if (id === 'done') return tr('done');
        if (id === 'trash') return tr('trash');
        if (id.indexOf('type:') === 0) return typeLabel(id.slice(5));
        if (id.indexOf('clientpasta:') === 0) {
            var cp = id.slice(12).split('|');
            return (cp[0] || '') + ' / ' + (cp[1] || '');
        }
        if (id.indexOf('client:') === 0) return id.slice(7);
        if (id.indexOf('pasta:') === 0) return id.slice(6);
        if (id.indexOf('year:') === 0) return id.slice(5);
        if (id.indexOf('month:') === 0) return id.slice(6);
        if (id === 'draft:current') return tr('current');
        if (id === 'draft:versions') return tr('versions');
        return id.replace(/^[^:]+:/, '');
    }

    var IDB_NAME = 'abeneFinalPdf';
    var IDB_STORE = 'finals';
    var pdfPreviewUrl = '';
    var lastArchivePdfPromise = Promise.resolve();

    function currentPdfOwnerId() {
        var st = docState();
        if (!st.pdfOwnerId) {
            st.pdfOwnerId = 'live-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
            try {
                if (typeof window.projectSettings === 'function') {
                    localStorage.setItem('abeneProjectSettings', window.projectSettings());
                }
            } catch (e) {}
        }
        return String(st.pdfOwnerId);
    }

    function ownerIdOf(entry) {
        if (!entry) return '';
        if (entry.id === 'current') return currentPdfOwnerId();
        return String(entry.id);
    }
    function etapeLabel(etape) {
        if (etape === 'relatorio') return tr('typeRel');
        if (etape === 'orcamento') return tr('typeOrc');
        if (etape === 'recibo') return tr('typeRec');
        return etape;
    }
    function extractKey(etape) {
        if (etape === 'orcamento') return 'devis';
        if (etape === 'recibo') return 'receipt';
        return 'relatorio';
    }
    function sheetHasBody(sheet) {
        var probe = sheet.cloneNode(true);
        probe.querySelectorAll('.page-header-zone, .page-footer-zone, .page-chrome, .watermark, .abene-page-flow, .hf-tab, .hf-rule').forEach(function (n) { n.remove(); });
        var text = String(probe.innerText || '').replace(/\s+/g, ' ').trim();
        return text.length > 8 || !!probe.querySelector('img, table, [data-abene-block]');
    }
    function filterExportTree(tree, etape) {
        if (!tree || !tree.querySelectorAll) return;
        var key = extractKey(etape);
        var sheets = Array.prototype.slice.call(tree.querySelectorAll('.abene-export-sheet'));
        if (key === 'devis' || key === 'receipt') {
            var sel = key === 'devis' ? '[data-abene-block="devis"]' : '[data-abene-block="receipt"]';
            sheets.forEach(function (sheet) {
                if (!sheet.querySelector(sel)) {
                    sheet.remove();
                    return;
                }
                Array.prototype.slice.call(sheet.querySelectorAll('.abene-export-clip > *')).forEach(function (node) {
                    if (node.querySelector && (node.querySelector('.page-header-zone') || node.querySelector('.page-footer-zone'))) return;
                    Array.prototype.slice.call(node.children || []).forEach(function (ch) {
                        if (ch.matches && ch.matches(sel)) return;
                        if (ch.querySelector && ch.querySelector(sel)) return;
                        if (ch.classList && (ch.classList.contains('watermark') || ch.classList.contains('abene-page-flow'))) return;
                        ch.remove();
                    });
                });
            });
        } else {
            tree.querySelectorAll('[data-abene-block="devis"], [data-abene-block="receipt"]').forEach(function (n) { n.remove(); });
        }
        Array.prototype.slice.call(tree.querySelectorAll('.abene-export-sheet')).forEach(function (sheet) {
            if (!sheetHasBody(sheet)) sheet.remove();
        });
    }
    function canUseLivePaged(entry, opts) {
        var live = editorEl();
        if (!live) return false;
        var Ex = window.ABENE && window.ABENE.Export;
        if (!Ex || typeof Ex.captureLivePagedBlob !== 'function') return false;
        if (opts && opts.html && opts.html === live.innerHTML) return true;
        if (entry && (entry.id === 'current' || entry.source === 'current')) return true;
        try {
            var archived = cleanArchiveHtml((entry && entry.html) || '');
            if (archived && archived === liveEditorHtml()) return true;
            if (archived && archived === cleanArchiveHtml(live.innerHTML)) return true;
        } catch (e) {}
        return false;
    }
    function pdfBlobForEtape(etape, entry, chunk, opts) {
        var Ex = window.ABENE && window.ABENE.Export;
        if (canUseLivePaged(entry, opts) && Ex && typeof Ex.captureLivePagedBlob === 'function') {
            return Ex.captureLivePagedBlob(function (tree) {
                filterExportTree(tree, etape);
            }).then(function (blob) {
                if (!blob || blob.size < 4000) throw new Error('empty');
                return blob;
            }).catch(function () {
                return htmlToPdfBlob(chunk);
            });
        }
        return htmlToPdfBlob(chunk);
    }
    function openPdfDb() {
        return new Promise(function (resolve, reject) {
            if (!window.indexedDB) {
                reject(new Error('indexedDB'));
                return;
            }
            var req = indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = function () {
                var db = req.result;
                if (!db.objectStoreNames.contains(IDB_STORE)) {
                    var st = db.createObjectStore(IDB_STORE, { keyPath: 'id' });
                    st.createIndex('ownerId', 'ownerId', { unique: false });
                }
            };
            req.onsuccess = function () { resolve(req.result); };
            req.onerror = function () { reject(req.error); };
        });
    }
    function idbOp(mode, fn) {
        return openPdfDb().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(IDB_STORE, mode);
                var st = tx.objectStore(IDB_STORE);
                fn(st, resolve, reject);
                tx.onerror = function () { reject(tx.error); };
            });
        });
    }
    function listFinals(ownerId) {
        return idbOp('readonly', function (st, resolve) {
            var idx = st.index('ownerId');
            var req = idx.getAll(ownerId);
            req.onsuccess = function () {
                var rows = (req.result || []).slice().sort(function (a, b) {
                    if (a.etape === b.etape) return (b.rev || 0) - (a.rev || 0);
                    return String(a.etape).localeCompare(String(b.etape));
                });
                resolve(rows);
            };
        }).catch(function () { return []; });
    }
    function listAllFinals() {
        return idbOp('readonly', function (st, resolve) {
            var req = st.getAll();
            req.onsuccess = function () { resolve(req.result || []); };
        }).catch(function () { return []; });
    }
    function putFinal(rec) {
        return idbOp('readwrite', function (st, resolve, reject) {
            var req = st.put(rec);
            req.onsuccess = function () { resolve(rec); };
            req.onerror = function () { reject(req.error); };
        });
    }
    function getFinal(id) {
        return idbOp('readonly', function (st, resolve) {
            var req = st.get(id);
            req.onsuccess = function () { resolve(req.result || null); };
        });
    }
    function copyFinals(fromOwner, toOwner) {
        if (!fromOwner || !toOwner || fromOwner === toOwner) return Promise.resolve();
        return listFinals(fromOwner).then(function (rows) {
            return rows.reduce(function (p, rec) {
                return p.then(function () {
                    var clone = {
                        id: toOwner + ':' + rec.etape + ':v' + rec.rev,
                        ownerId: toOwner,
                        etape: rec.etape,
                        rev: rec.rev,
                        number: rec.number || '',
                        name: rec.name || '',
                        createdAt: rec.createdAt,
                        bytes: rec.bytes,
                        blob: rec.blob,
                        driveFileId: rec.driveFileId || '',
                        driveUrl: rec.driveUrl || '',
                        cloudError: rec.cloudError || '',
                        cloudSkipped: true,
                        client: rec.client || '',
                        pasta: rec.pasta || '',
                        type: rec.type || '',
                        concluded: true
                    };
                    return putFinal(clone);
                });
            }, Promise.resolve());
        });
    }
    function pdfOptions() {
        var m = (window.abene && window.abene.pageMargins) || (window.PageGeometry && window.PageGeometry.defaultMargins && window.PageGeometry.defaultMargins()) || { top: 96, right: 96, bottom: 96, left: 96 };
        var ori = (window.abene && window.abene.pageOrientation) || (window.PageGeometry && window.PageGeometry.orientation) || 'portrait';
        var mm = function (px) {
            if (window.PageGeometry && typeof window.PageGeometry.pxToMm === 'function') return window.PageGeometry.pxToMm(px);
            return (Number(px) || 96) * 0.26458;
        };
        var fmt = (window.PageGeometry && window.PageGeometry.paperSize) || 'a4';
        if (!/^(a[0-9]|letter|legal|tabloid|a3|a4|a5)$/i.test(fmt)) fmt = 'a4';
        return {
            margin: [mm(m.top), mm(m.right), mm(m.bottom), mm(m.left)],
            filename: 'final.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false, imageTimeout: 4000 },
            jsPDF: { unit: 'mm', format: fmt, orientation: ori === 'landscape' ? 'landscape' : 'portrait' }
        };
    }
    function htmlToPdfBlobLegacy(html) {
        return new Promise(function (resolve, reject) {
            if (!window.html2pdf) {
                reject(new Error('nolib'));
                return;
            }
            var host = document.createElement('div');
            host.className = 'page';
            host.setAttribute('data-arq-pdf-host', '1');
            var hostW = (window.PageGeometry && window.PageGeometry.width) || 794;
            host.style.cssText = 'position:fixed;left:0;top:0;width:' + hostW + 'px;background:#fff;color:#1a1a1a;font-family:Calibri,Segoe UI,sans-serif;padding:12px 16px;z-index:2147483002;box-sizing:border-box;opacity:1;';
            host.innerHTML = html || '<p></p>';
            host.querySelectorAll('.abene-page-flow, .page-decoration, .page-header-zone, .page-footer-zone, .page-gap-band, .abene-obj-resize, .abene-tbox-bar').forEach(function (n) { n.remove(); });
            if (window.ABENE && window.ABENE.Export && typeof window.ABENE.Export.flatten === 'function') {
                window.ABENE.Export.flatten(host);
            }
            document.body.appendChild(host);
            if (window.abeneHoldViewZoom) window.abeneHoldViewZoom();
            var cleaned = false;
            var cleanup = function () {
                if (cleaned) return;
                cleaned = true;
                if (host.parentNode) host.parentNode.removeChild(host);
                if (window.abeneReleaseViewZoom) window.abeneReleaseViewZoom();
            };
            var done = function (blob) {
                cleanup();
                if (!blob || blob.size < 5000) reject(new Error('empty'));
                else resolve(blob);
            };
            var fail = function (err) {
                cleanup();
                reject(err || new Error('empty'));
            };
            var capture = function () {
                if (window.ABENE && window.ABENE.Export && typeof window.ABENE.Export.htmlElementToPdfBlob === 'function') {
                    return window.ABENE.Export.htmlElementToPdfBlob(host);
                }
                var worker = window.html2pdf().set(pdfOptions()).from(host);
                return worker.toPdf().get('pdf').then(function (pdf) { return pdf.output('blob'); });
            };
            var wait = (window.ABENE && window.ABENE.Export && typeof window.ABENE.Export.embedImages === 'function')
                ? window.ABENE.Export.embedImages(host)
                : Promise.resolve();
            wait.then(function () {
                return new Promise(function (ok) {
                    requestAnimationFrame(function () {
                        requestAnimationFrame(function () { setTimeout(ok, 140); });
                    });
                });
            }).then(capture).then(done).catch(fail);
        });
    }
    function htmlToPdfBlob(html) {
        if (!window.html2pdf && typeof window.abeneEnsureLibrary === 'function') {
            return window.abeneEnsureLibrary('pdf').then(function () { return htmlToPdfBlob(html); });
        }
        var Ex = window.ABENE && window.ABENE.Export;
        if (Ex && typeof Ex.htmlToPagedBlob === 'function') {
            return Ex.htmlToPagedBlob(html).catch(function () {
                return htmlToPdfBlobLegacy(html);
            });
        }
        return htmlToPdfBlobLegacy(html);
    }
    function partHasContent(html, etape) {
        var chunk = extractPart(html, extractKey(etape));
        if (!chunk) return false;
        var tmp = document.createElement('div');
        tmp.innerHTML = chunk;
        var text = (tmp.innerText || '').replace(/\s+/g, ' ').trim();
        if (/Comece a escrever|Commencez à|Start typing|Empiece a escribir/.test(text) && text.length < 90) return false;
        return text.length > 15 || !!tmp.querySelector('img, table');
    }
    function revokePdfPreview() {
        if (pdfPreviewUrl) {
            URL.revokeObjectURL(pdfPreviewUrl);
            pdfPreviewUrl = '';
        }
    }

    function parseHtml(html) {
        var d = document.createElement('div');
        d.innerHTML = html || '';
        return d;
    }
    function normalizeEntryDate(value) {
        var raw = String(value || '').trim();
        if (!raw) return '';
        var iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
        if (iso) return iso[1];
        var local = raw.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
        if (local) return local[3] + '-' + ('0' + local[2]).slice(-2) + '-' + ('0' + local[1]).slice(-2);
        var d = new Date(raw);
        return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
    }
    function todayIso() {
        var d = new Date();
        return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    }
    function normalizePeriodKind(kind) {
        return kind === 'month' || kind === 'year' ? kind : 'day';
    }
    function normalizePeriodValue(kind, value) {
        kind = normalizePeriodKind(kind);
        value = String(value || '').trim();
        if (kind === 'year') {
            var y = value.match(/^(\d{4})/);
            return y ? y[1] : '';
        }
        if (kind === 'month') {
            var m = value.match(/^(\d{4})-(\d{2})/);
            return m ? m[1] + '-' + m[2] : '';
        }
        return normalizeEntryDate(value);
    }
    function periodBounds(kind, value) {
        kind = normalizePeriodKind(kind);
        value = normalizePeriodValue(kind, value);
        if (!value) return { kind: kind, value: '', start: '', end: '' };
        if (kind === 'year') return { kind: kind, value: value, start: value + '-01-01', end: value + '-12-31' };
        if (kind === 'month') {
            var parts = value.split('-');
            var last = new Date(Number(parts[0]), Number(parts[1]), 0).getDate();
            return { kind: kind, value: value, start: value + '-01', end: value + '-' + ('0' + last).slice(-2) };
        }
        return { kind: kind, value: value, start: value, end: value };
    }
    function entryPeriod(e) {
        e = e || {};
        var fallback = normalizeEntryDate(e.documentDate) || (e.html ? detectMeta(e.html).documentDate : '') || normalizeEntryDate(e.periodStart) || normalizeEntryDate(e.archivedAt);
        return periodBounds(e.periodKind || 'day', e.periodValue || fallback);
    }
    function periodLabel(e) {
        var p = entryPeriod(e);
        if (!p.value) return '';
        return tr('period') + ': ' + p.value;
    }
    function setPeriodInput(kindId, valueId, kind, value) {
        var kindEl = document.getElementById(kindId);
        var valueEl = document.getElementById(valueId);
        kind = normalizePeriodKind(kind || (kindEl && kindEl.value));
        if (kindEl) kindEl.value = kind;
        if (!valueEl) return;
        valueEl.type = kind === 'year' ? 'number' : kind;
        if (kind === 'year') { valueEl.min = '1900'; valueEl.max = '2200'; valueEl.step = '1'; }
        else { valueEl.removeAttribute('min'); valueEl.removeAttribute('max'); valueEl.removeAttribute('step'); }
        valueEl.value = normalizePeriodValue(kind, value != null ? value : valueEl.value);
    }
    function detectMeta(html) {
        var d = parseHtml(html);
        var devis = d.querySelector('[data-abene-block="devis"]');
        var receipt = d.querySelector('[data-abene-block="receipt"]');
        var text = (d.innerText || '').toLowerCase();
        var hasReport = !!(d.querySelector('h1, h2') && /relat[oó]rio|rapport|inspe[cç]|report|informe/i.test(text));
        var type = 'documento';
        if (devis && receipt) type = 'completo';
        else if (devis) type = 'orcamento';
        else if (receipt) type = 'recibo';
        else if (hasReport) type = 'relatorio';
        var pay = decodeBlockPayload(devis) || decodeBlockPayload(receipt) || {};
        var client = (devis && devis.getAttribute('data-abene-client')) ||
            (receipt && receipt.getAttribute('data-abene-client')) ||
            pay.client || pay.payerName || '';
        var number = (devis && devis.getAttribute('data-abene-number')) ||
            (receipt && receipt.getAttribute('data-abene-number')) ||
            pay.number || '';
        var total = (devis && devis.getAttribute('data-abene-total')) || '';
        var documentDate = (devis && devis.getAttribute('data-abene-date')) ||
            (receipt && receipt.getAttribute('data-abene-date')) || pay.date || '';
        var pasta = String(pay.site || pay.pasta || '').trim();
        var nif = String(pay.clientNif || pay.payerNif || (devis && devis.getAttribute('data-abene-nif')) || '').trim();
        return {
            type: type,
            client: String(client || '').trim(),
            pasta: pasta,
            nif: nif,
            number: String(number || '').trim(),
            total: String(total || '').trim(),
            documentDate: normalizeEntryDate(documentDate),
            hasDevis: !!devis,
            hasReceipt: !!receipt,
            hasReport: hasReport || (!devis && !receipt)
        };
    }
    function typeLabel(type) {
        return ({
            relatorio: tr('typeRel'),
            orcamento: tr('typeOrc'),
            recibo: tr('typeRec'),
            completo: tr('typeComp'),
            documento: tr('typeDoc')
        })[type] || type;
    }
    function sanitizeName(name) {
        return String(name || 'documento').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 80) || 'documento';
    }
    function blobToBase64(blob) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function () {
                var value = String(reader.result || '');
                var comma = value.indexOf(',');
                resolve(comma >= 0 ? value.slice(comma + 1) : value);
            };
            reader.onerror = function () { reject(reader.error || new Error('read-fail')); };
            reader.readAsDataURL(blob);
        });
    }
    function syncFinalToDrive(rec, entry) {
        if (!rec || !rec.blob || typeof window.abeneSheetsEnabled !== 'function' ||
            !window.abeneSheetsEnabled() || typeof window.abeneSheetsCall !== 'function' || navigator.onLine === false) {
            return Promise.resolve(rec);
        }
        var period = entryPeriod(entry || rec);
        return blobToBase64(rec.blob).then(function (base64) {
            return window.abeneSheetsCall('SAVE_FINAL_PDF', {
                ownerId: rec.ownerId,
                etape: rec.etape,
                rev: rec.rev,
                number: rec.number || entry.number || '',
                name: rec.name || entry.name || '',
                client: entry.client || '',
                pasta: entry.pasta || '',
                type: entry.type || '',
                periodKind: period.kind,
                periodValue: period.value,
                periodStart: period.start,
                periodEnd: period.end,
                concluded: true,
                createdAt: rec.createdAt,
                base64: base64
            });
        }).then(function (json) {
            rec.driveFileId = json && json.id || '';
            rec.driveUrl = json && json.url || '';
            rec.cloudError = '';
            return putFinal(rec);
        }).catch(function (err) {
            rec.cloudError = String((err && err.message) || err || 'sync-fail').slice(0, 180);
            return putFinal(rec).then(function () { return rec; });
        });
    }
    function retryUnsyncedFinals() {
        if (typeof window.abeneSheetsEnabled !== 'function' || !window.abeneSheetsEnabled() ||
            typeof window.abeneSheetsCall !== 'function' || navigator.onLine === false) return Promise.resolve([]);
        return listAllFinals().then(function (rows) {
            return rows.filter(function (rec) {
                return rec && rec.blob && !rec.driveFileId && !rec.cloudSkipped;
            }).reduce(function (promise, rec) {
                return promise.then(function () { return syncFinalToDrive(rec, rec); });
            }, Promise.resolve()).then(function () { return rows; });
        });
    }
    function archiveFileBase(entry) {
        entry = entry || {};
        var stamp = String(entry.archivedAt || '').replace(/[^0-9]/g, '').slice(0, 14);
        var suffix = String(entry.id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(-12);
        return sanitizeName([
            entry.name || 'documento',
            entry.number || '',
            stamp || '',
            suffix || ''
        ].filter(Boolean).join('_'));
    }
    function uid() {
        return 'arq-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }
    function cleanArchiveHtml(html) {
        var safe = typeof window.abeneSanitizeHtml === 'function' ? window.abeneSanitizeHtml(html) : html;
        var d = parseHtml(safe);
        d.querySelectorAll('.abene-page-flow, .page-decoration, .page-header-zone, .page-footer-zone, .page-gap-band, .page-chrome, .abene-obj-resize, .abene-tbox-bar, .hf-tab, .hf-rule').forEach(function (n) { n.remove(); });
        if (window.ABENE && window.ABENE.Export && typeof window.ABENE.Export.flatten === 'function') {
            try { window.ABENE.Export.flatten(d); } catch (eFlat) {}
        }
        return d.innerHTML.trim() || '<p></p>';
    }
    function liveEditorHtml() {
        var editor = editorEl();
        if (typeof window.abeneGetCleanHtml === 'function' && editor) {
            try {
                var live = window.abeneGetCleanHtml(editor);
                if (live) return cleanArchiveHtml(live);
            } catch (e0) {}
        }
        if (typeof persistableEditorHtml === 'function') {
            try {
                var html = persistableEditorHtml();
                if (html) return cleanArchiveHtml(html);
            } catch (e1) {}
        }
        return cleanArchiveHtml(editor ? editor.innerHTML : '');
    }
    function currentSnapshot() {
        var html = liveEditorHtml();
        var name = docState().name || localStorage.getItem('abeneDocName') || 'Documento1';
        var meta = detectMeta(html);
        var period = periodBounds('day', meta.documentDate || todayIso());
        return {
            id: 'current',
            source: 'current',
            name: name,
            html: html,
            type: meta.type,
            client: meta.client,
            pasta: meta.pasta || pastaHint(meta.client),
            nif: meta.nif || '',
            number: meta.number,
            total: meta.total,
            documentDate: meta.documentDate,
            periodKind: period.kind,
            periodValue: period.value,
            periodStart: period.start,
            periodEnd: period.end,
            concluded: false,
            protected: !!docState().protected,
            archivedAt: new Date().toISOString(),
            hasDevis: meta.hasDevis,
            hasReceipt: meta.hasReceipt,
            hasReport: meta.hasReport,
            gdocsFileId: docState().gdocsFileId || '',
            gdocsUrl: docState().gdocsUrl || '',
            readOnlyOrigin: true
        };
    }
    function versionSnapshots() {
        var list = [];
        try {
            var raw = JSON.parse(localStorage.getItem('abeneVersions') || '[]');
            if (!Array.isArray(raw)) return list;
            raw.forEach(function (v, i) {
                var html = v && v.html ? v.html : '';
                var meta = detectMeta(html);
                var period = periodBounds('day', meta.documentDate || normalizeEntryDate(v && v.date) || todayIso());
                list.push({
                    id: 'ver-' + i,
                    source: 'version',
                    name: (v && v.name) || ('v' + (i + 1)),
                    html: html,
                    type: meta.type,
                    client: meta.client,
                    pasta: '',
                    number: meta.number,
                    total: meta.total,
                    documentDate: meta.documentDate || normalizeEntryDate(v && v.date),
                    periodKind: period.kind,
                    periodValue: period.value,
                    periodStart: period.start,
                    periodEnd: period.end,
                    concluded: false,
                    archivedAt: (v && v.date) || '',
                    hasDevis: meta.hasDevis,
                    hasReceipt: meta.hasReceipt,
                    hasReport: meta.hasReport,
                    readOnlyOrigin: true
                });
            });
        } catch (e) {}
        return list;
    }

    function decorateArchiveEntry(e) {
        e = Object.assign({}, e || {});
        e.source = 'archive';
        e.readOnlyOrigin = false;
        return e;
    }
    function allEntries() {
        return loadStore().filter(function (e) {
            return e && !e.deletedAt;
        }).map(decorateArchiveEntry);
    }
    function trashedEntries() {
        return loadStore().filter(function (e) {
            return e && !!e.deletedAt && !e.concluded;
        }).map(decorateArchiveEntry);
    }
    function isTrashedEntry(e) {
        return !!(e && e.deletedAt);
    }
    function isProtectedEntry(e) {
        return !!(e && e.protected);
    }
    function isDeletableDraft(e) {
        return !!(e && e.source === 'archive' && !e.readOnlyOrigin && !e.concluded && !e.deletedAt && !e.protected);
    }
    function entryDate(e) {
        if (!e) return '';
        var date = normalizeEntryDate(e.documentDate);
        if (!date && e.html) date = detectMeta(e.html).documentDate;
        return date || normalizeEntryDate(e.archivedAt);
    }
    function visibleEntries() {
        var folder = state.folder;
        var list;
        if (folder === 'trash') {
            list = trashedEntries();
        } else if (folder.indexOf('draft:') === 0) {
            if (folder === 'draft:current') list = [currentSnapshot()];
            else list = versionSnapshots();
        } else {
            list = allEntries();
        }
        var q = (state.query || '').trim().toLowerCase();
        return list.filter(function (e) {
            var docDate = entryDate(e);
            var period = entryPeriod(e);
            if (folder !== 'trash' && state.concludedOnly && !e.concluded) return false;
            if (state.type !== 'all' && e.type !== state.type) return false;
            if (state.dateFrom && (!period.end || period.end < state.dateFrom)) return false;
            if (state.dateTo && (!period.start || period.start > state.dateTo)) return false;
            if (folder === 'done' && !e.concluded) return false;
            if (folder.indexOf('type:') === 0 && e.type !== folder.slice(5)) return false;
            if (folder.indexOf('clientpasta:') === 0) {
                var cp = folder.slice(12).split('|');
                if ((e.client || tr('noClient')) !== cp[0]) return false;
                if ((e.pasta || tr('none')) !== (cp[1] || '')) return false;
            }
            if (folder.indexOf('client:') === 0 && folder.indexOf('clientpasta:') !== 0 && (e.client || tr('noClient')) !== folder.slice(7)) return false;
            if (folder.indexOf('pasta:') === 0 && (e.pasta || tr('none')) !== folder.slice(6)) return false;
            if (folder.indexOf('year:') === 0 && period.start.slice(0, 4) !== folder.slice(5)) return false;
            if (folder.indexOf('month:') === 0 && period.start.slice(0, 7) !== folder.slice(6)) return false;
            if (q) {
                var blob = [e.name, e.client, e.pasta, e.number, e.type, typeLabel(e.type), docDate,
                    period.value, period.start, period.end, periodLabel(e)].join(' ').toLowerCase();
                if (blob.indexOf(q) === -1) return false;
            }
            return true;
        });
    }
    function unique(arr) {
        var seen = {};
        var out = [];
        arr.forEach(function (v) {
            var k = v || '';
            if (!seen[k]) { seen[k] = 1; out.push(v); }
        });
        return out.sort(function (a, b) { return String(a).localeCompare(String(b), 'pt'); });
    }

    function injectCss() {
        var css = document.getElementById('arq-css');
        if (!css) {
            css = document.createElement('style');
            css.id = 'arq-css';
            document.head.appendChild(css);
        }
        css.textContent =
            'body.abene-arq-open{overflow:hidden!important;overscroll-behavior:none;}' +
            '#arqOverlay{position:fixed;inset:0;z-index:2600;display:none;flex-direction:column;background:#f3f4f6;color:#1a1a1a;font-family:Calibri,Segoe UI,sans-serif;}' +
            '#arqOverlay.open{display:flex;}' +
            '.arq-top{background:' + NAVY + ';color:#fff;padding:12px 16px;display:flex;align-items:center;gap:12px;}' +
            '.arq-top h2{margin:0;font-size:16px;font-weight:700;letter-spacing:.02em;}' +
            '.arq-top p{margin:2px 0 0;font-size:12px;color:#cbd5e1;}' +
            '.arq-top .arq-gold{width:8px;height:28px;background:' + GOLD + ';flex:none;}' +
            '.arq-top-actions{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap;}' +
            '.arq-btn{border:1px solid #c5c5c5;background:#fff;color:#1a1a1a;padding:6px 10px;font-size:12px;cursor:pointer;border-radius:3px;}' +
            '.arq-btn:hover{background:#e8f0fe;}' +
            '.arq-btn:disabled{opacity:.48;cursor:not-allowed;background:#f1f5f9;}' +
            '.arq-btn.primary{background:' + NAVY + ';color:#fff;border-color:' + NAVY + ';}' +
            '.arq-btn.gold{background:' + GOLD + ';border-color:' + GOLD + ';color:' + NAVY + ';font-weight:700;}' +
            '.arq-btn.danger{background:#fff1f2;border-color:#be123c;color:#9f1239;font-weight:700;}' +
            '.arq-tools{display:flex;gap:8px;align-items:center;padding:8px 16px;background:#fff;border-bottom:1px solid #d9d9d9;flex-wrap:wrap;}' +
            '.arq-tool-filters,.arq-tool-actions{display:contents;}' +
            '.arq-tools input,.arq-tools select{border:1px solid #c5c5c5;padding:6px 8px;font-size:12px;min-width:180px;}' +
            '.arq-tools input[type=checkbox]{min-width:auto;width:auto;min-height:auto;padding:0;}' +
            '.arq-tools label{font-size:12px;display:flex;align-items:center;gap:6px;}' +
            '.arq-date-filter{display:grid!important;grid-template-columns:auto 132px;gap:6px!important;white-space:nowrap;}' +
            '.arq-date-filter input{min-width:132px!important;}' +
            '.arq-selection-bar{display:flex;align-items:center;gap:10px;padding:7px 16px;background:#eef2f7;border-bottom:1px solid #cbd5e1;}' +
            '.arq-selection-summary{font-size:12px;font-weight:700;color:' + NAVY + ';white-space:nowrap;}' +
            '.arq-selection-actions{display:flex;align-items:center;gap:6px;min-width:0;flex-wrap:wrap;}' +
            '.arq-archive-panel{display:none;grid-template-columns:repeat(2,minmax(170px,1fr)) repeat(5,auto);gap:8px;align-items:end;padding:10px 16px;background:#fff8e8;border-bottom:1px solid ' + GOLD + ';}' +
            '.arq-archive-panel.open{display:grid;}' +
            '.arq-archive-panel label{font-size:12px;display:flex;flex-direction:column;gap:4px;}' +
            '.arq-archive-panel input:not([type=checkbox]),.arq-archive-panel select{border:1px solid #c5c5c5;padding:6px 8px;min-height:34px;background:#fff;}' +
            '.arq-archive-panel .arq-check{flex-direction:row;align-items:center;gap:6px;}' +
            '.arq-archive-panel .arq-panel-title{grid-column:1/-1;font-size:12px;font-weight:700;color:' + NAVY + ';}' +
            '.arq-body{flex:1;display:grid;grid-template-columns:260px minmax(260px,1fr) minmax(340px,1.25fr);min-height:0;}' +
            '.arq-mobile-nav{display:none;}' +
            '.arq-mobile-back{display:none;}' +
            '.arq-tools-toggle{display:none;}' +
            '.arq-col{overflow:auto;background:#fff;border-right:1px solid #e5e5e5;min-height:0;}' +
            '.arq-col.arq-list-col{display:flex;flex-direction:column;}' +
            '.arq-list{flex:1;overflow:auto;outline:none;}' +
            '.arq-crumb{padding:0 12px 8px;font-size:12px;color:#64748b;background:#f8f8f8;border-bottom:1px solid #eee;}' +
            '.arq-crumb button{border:0;background:none;color:' + NAVY + ';cursor:pointer;font-size:12px;padding:0 2px;text-decoration:underline;}' +
            '.arq-col h3{margin:0;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#64748b;background:#f8f8f8;border-bottom:1px solid #eee;}' +
            '.arq-tree button,.arq-list button.arq-row{display:block;width:100%;text-align:left;border:0;background:none;padding:7px 12px;font-size:12px;cursor:pointer;}' +
            '.arq-row-wrap{display:grid;grid-template-columns:42px minmax(0,1fr) 48px;align-items:stretch;border-bottom:1px solid #f1f5f9;}' +
            '.arq-row-select{display:flex;align-items:center;justify-content:center;background:#fff;cursor:pointer;}' +
            '.arq-row-select input{width:18px;height:18px;accent-color:' + NAVY + ';}' +
            '.arq-gdocs-entry{border:0;border-left:1px solid #eef2f7;background:#fff;color:#185abc;font-weight:800;cursor:pointer;font-size:12px;}' +
            '.arq-gdocs-entry:hover,.arq-gdocs-entry.linked{background:#e8f0fe;color:#174ea6;}' +
            '.arq-row-wrap.selected{box-shadow:inset 4px 0 ' + GOLD + ';background:#fff8e8;}' +
            '.arq-tree button:hover,.arq-list button.arq-row:hover{background:#e8f0fe;}' +
            '.arq-tree button.on,.arq-list button.arq-row.on{background:#0B1223;color:#fff;font-weight:600;}' +
            '.arq-tree button.on .arq-hint,.arq-list button.arq-row.on .arq-meta{color:#cbd5e1;}' +
            '.arq-tree details{padding-left:4px;}' +
            '.arq-tree summary{padding:6px 12px;font-size:12px;cursor:pointer;color:#334155;font-weight:600;}' +
            '.arq-tree-sub{margin-left:14px;border-left:2px solid ' + GOLD + ';padding-left:4px;}' +
            '.arq-row .arq-meta{display:block;font-size:11px;color:#64748b;font-weight:400;}' +
            '.arq-badge{display:inline-block;font-size:10px;padding:1px 6px;border:1px solid #d1d5db;margin-right:4px;border-radius:2px;}' +
            '.arq-badge.done{border-color:#166534;color:#166534;}' +
            '.arq-badge.protected{border-color:#92400e;color:#92400e;background:#fffbeb;}' +
            '.arq-badge.trashed{border-color:#9f1239;color:#9f1239;background:#fff1f2;}' +
            '.arq-row.on .arq-badge{border-color:#C9A84C;color:#C9A84C;}' +
            '.arq-preview{padding:12px;display:flex;flex-direction:column;gap:8px;min-height:0;overflow:auto;}' +
            '.arq-preview iframe{flex:1;min-height:240px;border:1px solid #e5e5e5;background:#fff;width:100%;}' +
            '.arq-preview .arq-actions{display:flex;flex-wrap:wrap;gap:6px;}' +
            '.arq-preview-tabs{display:flex;gap:0;border-bottom:1px solid #e5e5e5;}' +
            '.arq-preview-tabs button{border:0;background:transparent;padding:8px 14px;cursor:pointer;font-size:12px;color:#334155;}' +
            '.arq-preview-tabs button.on{border-bottom:2px solid ' + GOLD + ';font-weight:700;color:' + NAVY + ';}' +
            '#arqPdfFrame{width:100%;min-height:280px;border:1px solid #e5e5e5;background:#fff;display:none;}' +
            '#arqPdfFrame.show{display:block;}' +
            '.arq-form{display:grid;gap:6px;font-size:12px;}' +
            '.arq-form input,.arq-form select{border:1px solid #c5c5c5;padding:5px 7px;min-height:34px;background:#fff;}' +
            '.arq-hint{font-size:11px;color:#64748b;}' +
            '.arq-pdf{border:1px solid #e5e5e5;padding:8px;background:#f8f8f8;}' +
            '.arq-pdf h4{margin:0 0 6px;font-size:12px;}' +
            '.arq-pdf-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:4px 0;border-top:1px solid #eee;font-size:12px;}' +
            '.arq-pdf-row.on{background:#fff;}' +
            '@media(max-width:900px){.arq-body{grid-template-columns:1fr;}.arq-archive-panel{grid-template-columns:1fr;}}' +
            '@media(min-width:821px) and (max-width:900px){.arq-body{grid-template-columns:220px minmax(220px,1fr) minmax(300px,1.15fr);}}' +
            '@media(max-width:820px),(max-width:960px) and (pointer:coarse),(max-width:960px) and (max-height:480px) and (orientation:landscape){' +
            '#arqOverlay{height:100dvh;max-height:100dvh;overflow:hidden;}' +
            '.arq-top{flex-wrap:wrap;gap:8px;padding:8px 12px;padding-top:max(8px,env(safe-area-inset-top,0px));flex-shrink:0;}' +
            '.arq-top>div:nth-child(2){min-width:0;flex:1;}' +
            '.arq-top h2{font-size:15px;}' +
            '.arq-top p{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
            '.arq-top-actions{margin-left:0;width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;}' +
            '.arq-btn{min-height:44px;min-width:44px;padding:8px 12px;font-size:13px;}' +
            '.arq-tools{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 8px;align-items:center;padding:6px 10px;flex-shrink:0;max-height:34dvh;overflow-y:auto;overscroll-behavior:contain;}' +
            '.arq-tools-toggle{display:inline-flex!important;align-items:center;justify-content:center;grid-column:2;grid-row:1;min-height:44px;min-width:44px;padding:8px 10px;font-size:12px;font-weight:700;white-space:nowrap;}' +
            '.arq-tool-filters{display:contents;}' +
            '.arq-tools #arqSearch{grid-column:1;grid-row:1;min-width:0;width:100%;max-width:100%;font-size:16px;min-height:44px;}' +
            '.arq-tools.is-collapsed{max-height:none;overflow:visible;}' +
            '.arq-tools.is-collapsed .arq-tool-actions,.arq-tools.is-collapsed .arq-date-filter,.arq-tools.is-collapsed #arqType,.arq-tools.is-collapsed label:has(#arqDoneOnly){display:none!important;}' +
            '.arq-tools:not(.is-collapsed){grid-template-columns:minmax(0,1fr);}' +
            '.arq-tools:not(.is-collapsed) .arq-tools-toggle{grid-column:1/-1;grid-row:auto;justify-self:stretch;}' +
            '.arq-tools:not(.is-collapsed) .arq-tool-filters{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;grid-column:1/-1;}' +
            '.arq-tools:not(.is-collapsed) .arq-tool-filters #arqSearch{grid-column:1/-1;grid-row:auto;}' +
            '.arq-tools:not(.is-collapsed) .arq-tool-filters label{min-height:44px;white-space:nowrap;}' +
            '.arq-tools:not(.is-collapsed) .arq-date-filter{grid-template-columns:1fr!important;gap:3px!important;white-space:normal!important;}' +
            '.arq-tools:not(.is-collapsed) .arq-date-filter input{min-width:0!important;}' +
            '.arq-tools input,.arq-tools select{min-width:0;width:100%;max-width:100%;font-size:16px;min-height:44px;}' +
            '.arq-tools:not(.is-collapsed) .arq-tool-actions{display:flex;gap:8px;overflow-x:auto;padding-top:4px;grid-column:1/-1;-webkit-overflow-scrolling:touch;scrollbar-width:thin;}' +
            '.arq-tool-actions .arq-btn{flex:0 0 auto;}' +
            '.arq-selection-bar{padding:6px 8px;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;flex-shrink:0;max-height:56px;}' +
            '.arq-selection-actions{flex-wrap:nowrap;}' +
            '.arq-selection-actions .arq-btn{flex:0 0 auto;}' +
            '.arq-mobile-nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));background:#fff;border-bottom:1px solid #d9d9d9;flex:0 0 46px;}' +
            '.arq-mobile-nav button{min-width:0;min-height:46px;border:0;border-bottom:3px solid transparent;background:#fff;color:#475569;font-size:13px;font-weight:600;padding:6px 4px;}' +
            '.arq-mobile-nav button.on{color:' + NAVY + ';border-bottom-color:' + GOLD + ';background:#fff8e8;}' +
            '.arq-mobile-back{display:flex;align-items:center;gap:8px;padding:4px 8px;background:#fff;border-bottom:1px solid #e5e5e5;flex:0 0 auto;min-height:48px;}' +
            '.arq-mobile-back[hidden]{display:none!important;}' +
            '.arq-pane-back{border:1px solid #c5c5c5;background:#fff;color:' + NAVY + ';font-weight:700;font-size:13px;min-height:44px;min-width:44px;padding:8px 12px;border-radius:3px;cursor:pointer;flex:0 0 auto;}' +
            '.arq-mobile-trail{font-size:12px;color:#64748b;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
            '.arq-mobile-trail strong{color:' + NAVY + ';}' +
            '.arq-body{display:block;min-height:0;overflow:hidden;flex:1;position:relative;}' +
            '.arq-body>.arq-col{display:none!important;position:absolute;inset:0;height:auto!important;border-right:0;overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}' +
            '.arq-body[data-mobile-pane="folders"]>.arq-folders-col{display:block!important;}' +
            '.arq-body[data-mobile-pane="files"]>.arq-list-col{display:flex!important;flex-direction:column;}' +
            '.arq-body[data-mobile-pane="preview"]>.arq-preview{display:flex!important;}' +
            '.arq-tree button,.arq-list button.arq-row{min-height:44px;padding:10px 12px;}' +
            '.arq-tree summary{min-height:44px;display:flex;align-items:center;}' +
            '.arq-row-wrap{grid-template-columns:48px minmax(0,1fr);}' +
            '.arq-row-select{min-height:44px;min-width:44px;}' +
            '.arq-crumb{padding:6px 10px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;}' +
            '.arq-crumb button{min-height:44px;padding:8px 10px;text-decoration:none;border:1px solid #e2e8f0;border-radius:3px;background:#fff;}' +
            '.arq-preview-tabs button{min-height:44px;padding:10px 14px;}' +
            '.arq-preview iframe,#arqPdfFrame,#arqPdfFrame.show{min-height:160px;flex:1 1 auto;}' +
            '.arq-preview{padding-bottom:max(12px,env(safe-area-inset-bottom,0px));}' +
            '.arq-top,.arq-mobile-nav,.arq-mobile-back{flex-shrink:0;}' +
            '.arq-list,.arq-folders-col .arq-tree{min-height:0;overflow:auto;overscroll-behavior:contain;}' +
            '.arq-list-col>.arq-list{flex:1;min-height:0;}' +
            '.arq-preview>*{flex-shrink:0;max-width:100%;box-sizing:border-box;}' +
            '.arq-preview .arq-actions .arq-btn{white-space:normal;overflow-wrap:anywhere;}' +
            '.arq-preview iframe,#arqPdfFrame{flex-shrink:1!important;}' +
            '}' +
'@media(max-width:820px) and (max-height:640px),(max-width:960px) and (max-height:480px) and (orientation:landscape){' +
            '.arq-top p{display:none;}' +
            '.arq-tools{max-height:28dvh;padding:4px 8px;}' +
            '.arq-tools.is-collapsed{max-height:none;}' +
            '.arq-selection-bar{max-height:48px;padding:4px 8px;}' +
            '.arq-preview iframe,#arqPdfFrame,#arqPdfFrame.show{min-height:110px;}' +
            '.arq-mobile-nav{flex-basis:42px;}.arq-mobile-nav button{min-height:42px;font-size:12px;}' +
            '.arq-mobile-back{min-height:44px;padding:2px 8px;}' +
            '}' +
'@media(max-width:960px) and (max-height:480px) and (orientation:landscape){' +
            '.arq-top{flex-wrap:nowrap;padding:5px 8px;}.arq-top p{display:none;}.arq-top-actions{width:auto;margin-left:auto;display:flex;flex-wrap:nowrap;}' +
            '.arq-tools{display:flex;flex-wrap:nowrap;overflow-x:auto;padding:4px 8px;max-height:none;-webkit-overflow-scrolling:touch;align-items:center;}' +
            '.arq-tools.is-collapsed{display:flex;}' +
            '.arq-tools-toggle{flex:0 0 auto;min-height:36px;}' +
            '.arq-tools.is-collapsed .arq-tool-actions,.arq-tools.is-collapsed .arq-date-filter,.arq-tools.is-collapsed #arqType,.arq-tools.is-collapsed label:has(#arqDoneOnly){display:none!important;}' +
            '.arq-tools:not(.is-collapsed) .arq-tool-filters,.arq-tools:not(.is-collapsed) .arq-tool-actions{display:flex;flex:0 0 auto;gap:6px;padding:0;align-items:center;}' +
            '.arq-tool-filters #arqSearch{width:160px;}.arq-tool-filters label{min-height:36px;}' +
            '.arq-tools input,.arq-tools select{width:140px;min-height:36px;font-size:14px;}.arq-date-filter{display:flex!important;grid-template-columns:none!important;gap:4px!important;}' +
            '.arq-date-filter input{width:128px!important;}.arq-btn{min-height:36px;padding:6px 10px;}' +
            '.arq-selection-bar{min-height:40px;padding:4px 8px;}.arq-mobile-nav{flex-basis:40px;}.arq-mobile-nav button{min-height:40px;}' +
            '.arq-pane-back{min-height:36px;}' +
            '.arq-body>.arq-col{padding-bottom:4px;}' +
            '}' +
'@media(max-width:400px){.arq-top p{display:none;}.arq-top-actions{width:auto;margin-left:auto;}.arq-top-actions .arq-btn{padding:6px 9px;font-size:12px;}.arq-tools{padding:6px 8px;}.arq-tool-actions{padding-top:6px;}.arq-selection-summary{position:sticky;left:0;background:#eef2f7;padding-right:4px;}.arq-mobile-nav button{font-size:12px;padding:6px 2px;}.arq-tools-toggle{font-size:11px;padding:8px 8px;}}';
    }
    function archivePanelHtml() {
        return '<div class="arq-archive-panel" id="arqArchivePanel">' +
            '<div class="arq-panel-title" id="arqArchTitle"></div>' +
            '<label><span id="arqArchClientLbl"></span><input type="text" id="arqArchClient" autocomplete="off" /></label>' +
            '<label><span id="arqArchPastaLbl"></span><input type="text" id="arqArchPasta" autocomplete="off" /></label>' +
            '<label><span id="arqArchPeriodLbl"></span><select id="arqArchPeriodKind"><option value="day"></option><option value="month"></option><option value="year"></option></select></label>' +
            '<label><span id="arqArchPeriodValueLbl"></span><input type="date" id="arqArchPeriodValue" /></label>' +
            '<button type="button" class="arq-btn" id="arqArchToday"></button>' +
            '<label class="arq-check"><input type="checkbox" id="arqArchDone" /> <span id="arqArchDoneLbl"></span></label>' +
            '<button type="button" class="arq-btn gold" id="arqArchGo"></button>' +
            '<button type="button" class="arq-btn" id="arqArchCancel"></button>' +
            '</div>';
    }
    function folderPanelHtml() {
        return '<div class="arq-archive-panel" id="arqFolderPanel">' +
            '<div class="arq-panel-title" id="arqFoldTitle"></div>' +
            '<label id="arqFoldClientWrap"><span id="arqFoldClientLbl"></span><input type="text" id="arqFoldClient" autocomplete="off" /></label>' +
            '<label id="arqFoldPastaWrap"><span id="arqFoldPastaLbl"></span><input type="text" id="arqFoldPasta" autocomplete="off" /></label>' +
            '<button type="button" class="arq-btn gold" id="arqFoldGo"></button>' +
            '<button type="button" class="arq-btn" id="arqFoldCancel"></button>' +
            '</div>';
    }
    function setPanelOpen(id, on) {
        var el = document.getElementById(id);
        if (el) el.classList.toggle('open', !!on);
    }
    function closeArchivePanel() {
        setPanelOpen('arqArchivePanel', false);
    }
    function closeFolderPanel() {
        setPanelOpen('arqFolderPanel', false);
    }
    function openArchivePanel() {
        closeFolderPanel();
        ensureDom();
        fillChrome();
        var snap = currentSnapshot();
        var meta = detectMeta(snap.html);
        var job = loadLastJob();
        var client = String(snap.client || meta.client || job.client || '').trim();
        var pasta = String(snap.pasta || meta.pasta || pastaHint(client) || job.pasta || '').trim();
        var cEl = document.getElementById('arqArchClient');
        var pEl = document.getElementById('arqArchPasta');
        var dEl = document.getElementById('arqArchDone');
        var detectedDate = meta.documentDate || todayIso();
        if (cEl) cEl.value = client;
        if (pEl) pEl.value = pasta;
        // Editing remains a draft unless the user explicitly chooses the final state.
        if (dEl) dEl.checked = false;
        setPeriodInput('arqArchPeriodKind', 'arqArchPeriodValue', 'day', detectedDate);
        setPanelOpen('arqArchivePanel', true);
        if (cEl) cEl.focus();
    }
    function commitArchivePanel() {
        var client = String((document.getElementById('arqArchClient') || {}).value || '').trim();
        var pasta = String((document.getElementById('arqArchPasta') || {}).value || '').trim();
        var concluded = !!(document.getElementById('arqArchDone') || { checked: false }).checked;
        var periodKind = normalizePeriodKind((document.getElementById('arqArchPeriodKind') || {}).value || 'day');
        var periodValue = normalizePeriodValue(periodKind, (document.getElementById('arqArchPeriodValue') || {}).value || todayIso());
        closeArchivePanel();
        archiveCurrent({ fromPanel: true, client: client, pasta: pasta, concluded: concluded, periodKind: periodKind, periodValue: periodValue });
    }
    function openFolderPanel(kind) {
        closeArchivePanel();
        ensureDom();
        fillChrome();
        var job = loadLastJob();
        var pastaWrap = document.getElementById('arqFoldPastaWrap');
        var cEl = document.getElementById('arqFoldClient');
        var pEl = document.getElementById('arqFoldPasta');
        var title = document.getElementById('arqFoldTitle');
        if (title) title.textContent = kind === 'pasta' ? tr('newPasta') : tr('newClient');
        if (cEl) cEl.value = kind === 'pasta' ? String(job.client || '').trim() : '';
        if (pEl) pEl.value = '';
        if (pastaWrap) pastaWrap.style.display = kind === 'pasta' ? '' : 'none';
        document.getElementById('arqFolderPanel').setAttribute('data-kind', kind);
        setPanelOpen('arqFolderPanel', true);
        if (cEl) cEl.focus();
    }
    function commitFolderPanel() {
        var panel = document.getElementById('arqFolderPanel');
        var kind = panel ? panel.getAttribute('data-kind') : 'client';
        var client = String((document.getElementById('arqFoldClient') || {}).value || '').trim();
        var pasta = String((document.getElementById('arqFoldPasta') || {}).value || '').trim();
        closeFolderPanel();
        if (kind === 'pasta') {
            if (!pasta) return;
            if (client) rememberFolder('client', client, '');
            rememberFolder('pasta', pasta, client);
            state.folder = client ? ('clientpasta:' + client + '|' + pasta) : ('pasta:' + pasta);
        } else {
            if (!client) return;
            rememberFolder('client', client, '');
            state.folder = 'client:' + client;
        }
        toast(tr('folderOk'));
        renderTree();
        renderList();
        renderPreview();
        if (isMobileArchive()) setMobilePane('files');
    }
    function selectedEntries(list) {
        list = list || visibleEntries();
        return list.filter(function (e) { return !!state.selectedIds[e.id]; });
    }
    function pruneSelection(list) {
        var allowed = {};
        (list || []).forEach(function (e) { allowed[e.id] = true; });
        Object.keys(state.selectedIds).forEach(function (id) {
            if (!allowed[id]) delete state.selectedIds[id];
        });
    }
    function clearSelection() {
        state.selectedIds = {};
        renderList();
    }
    function renderSelectionBar(list) {
        list = list || visibleEntries();
        pruneSelection(list);
        var selected = selectedEntries(list);
        var inTrash = state.folder === 'trash';
        var count = document.getElementById('arqSelectedCount');
        if (count) count.textContent = tr('selectedCount', { n: String(selected.length) });
        var allBtn = document.getElementById('arqSelectAllBtn');
        if (allBtn) {
            allBtn.disabled = !list.length;
            allBtn.setAttribute('aria-pressed', list.length && selected.length === list.length ? 'true' : 'false');
        }
        ['arqClearSelectionBtn', 'arqDownloadSelectedBtn'].forEach(function (id) {
            var btn = document.getElementById(id);
            if (btn) btn.disabled = !selected.length;
        });
        var packBtn = document.getElementById('arqPackSelectedBtn');
        if (packBtn) packBtn.disabled = !selected.length || inTrash;
        var finalBtn = document.getElementById('arqFinalizeSelectedBtn');
        if (finalBtn) finalBtn.disabled = !selected.some(function (e) {
            return e.source === 'archive' && !e.deletedAt && !e.protected;
        }) || inTrash;
        var trashBtn = document.getElementById('arqTrashSelectedBtn');
        if (trashBtn) {
            trashBtn.textContent = tr(inTrash ? 'restoreSelected' : 'moveSelectedTrash');
            trashBtn.classList.toggle('danger', !inTrash);
            trashBtn.disabled = inTrash
                ? !selected.some(isTrashedEntry)
                : !selected.some(isDeletableDraft);
        }
    }
    function toggleSelectAll() {
        var list = visibleEntries();
        var chosen = selectedEntries(list);
        var select = chosen.length !== list.length;
        list.forEach(function (e) {
            if (select) state.selectedIds[e.id] = true;
            else delete state.selectedIds[e.id];
        });
        renderList();
    }
    function applyDateFilters() {
        var fromEl = document.getElementById('arqDateFrom');
        var toEl = document.getElementById('arqDateTo');
        var from = normalizeEntryDate(fromEl && fromEl.value);
        var to = normalizeEntryDate(toEl && toEl.value);
        if (from && to && from > to) {
            var swap = from;
            from = to;
            to = swap;
        }
        state.dateFrom = from;
        state.dateTo = to;
        if (fromEl) fromEl.value = from;
        if (toEl) toEl.value = to;
        renderList();
        renderPreview();
    }
    function refreshArchiveViews() {
        renderTree();
        renderList();
        renderPreview();
    }
    function moveDraftsToTrash(entries, ask) {
        var eligible = (entries || []).filter(isDeletableDraft);
        if (!eligible.length) {
            var protectedDraft = (entries || []).some(function (e) {
                return e && e.source === 'archive' && !e.concluded && !e.deletedAt && e.protected;
            });
            toast(tr(protectedDraft ? 'protectedCannotTrash' : 'trashDraftOnly'));
            return false;
        }
        var message = eligible.length === 1
            ? tr('trashConfirm', { name: eligible[0].name || tr('typeDoc') })
            : tr('trashSelectedConfirm', { n: String(eligible.length) });
        if (ask !== false && !confirm(message)) return false;
        var ids = {};
        eligible.forEach(function (e) { ids[e.id] = true; });
        var now = new Date().toISOString();
        var list = loadStore();
        list.forEach(function (item) {
            if (!ids[item.id] || item.concluded || item.protected || item.deletedAt) return;
            item.deletedAt = now;
            item.updatedAt = now;
        });
        if (!saveStore(list)) return false;
        state.folder = 'trash';
        state.selectedId = eligible[0].id;
        state.selectedIds = {};
        eligible.forEach(function (e) { state.selectedIds[e.id] = true; });
        toast(tr('trashOk', { n: String(eligible.length) }));
        refreshArchiveViews();
        if (isMobileArchive()) setMobilePane('files');
        return true;
    }
    function restoreTrashedEntries(entries) {
        var eligible = (entries || []).filter(isTrashedEntry);
        if (!eligible.length) return false;
        var ids = {};
        eligible.forEach(function (e) { ids[e.id] = true; });
        var now = new Date().toISOString();
        var list = loadStore();
        list.forEach(function (item) {
            if (!ids[item.id] || !item.deletedAt || item.concluded) return;
            item.deletedAt = '';
            item.restoredAt = now;
            item.updatedAt = now;
        });
        if (!saveStore(list)) return false;
        state.folder = 'all';
        state.selectedId = eligible[0].id;
        state.selectedIds = {};
        toast(tr('restoredOk', { n: String(eligible.length) }));
        refreshArchiveViews();
        if (isMobileArchive()) setMobilePane('files');
        return true;
    }
    function toggleEntryProtection(entry) {
        if (!entry || entry.source !== 'archive' || entry.concluded || entry.deletedAt) return false;
        var next = !entry.protected;
        var key = next ? 'protectConfirm' : 'unprotectConfirm';
        if (!confirm(tr(key, { name: entry.name || tr('typeDoc') }))) return false;
        var list = loadStore();
        var now = new Date().toISOString();
        list.forEach(function (item) {
            if (item.id !== entry.id || item.concluded || item.deletedAt) return;
            item.protected = next;
            item.protectedAt = next ? now : '';
            item.updatedAt = now;
        });
        if (!saveStore(list)) return false;
        toast(tr(next ? 'protectedOk' : 'unprotectedOk'));
        refreshArchiveViews();
        return true;
    }
    function bindArquivoEvents() {
        if (state.eventsBound) return;
        state.eventsBound = true;
        document.getElementById('arqCloseBtn').onclick = closeArquivo;
        document.getElementById('arqArchiveBtn').onclick = function () { openArchivePanel(); };
        document.getElementById('arqSearch').oninput = function () {
            state.query = this.value;
            renderList();
            renderPreview();
        };
        document.getElementById('arqType').onchange = function () {
            state.type = this.value;
            renderList();
            renderPreview();
        };
        document.getElementById('arqDoneOnly').onchange = function () {
            state.concludedOnly = this.checked;
            renderList();
            renderPreview();
        };
        document.getElementById('arqDateFrom').onchange = applyDateFilters;
        document.getElementById('arqDateTo').onchange = applyDateFilters;
        document.getElementById('arqDateClearBtn').onclick = function () {
            state.dateFrom = '';
            state.dateTo = '';
            document.getElementById('arqDateFrom').value = '';
            document.getElementById('arqDateTo').value = '';
            renderList();
            renderPreview();
        };
        document.getElementById('arqSelectAllBtn').onclick = toggleSelectAll;
        document.getElementById('arqClearSelectionBtn').onclick = clearSelection;
        document.getElementById('arqDownloadSelectedBtn').onclick = function () {
            var list = selectedEntries();
            if (!list.length) { toast(tr('selectedEmpty')); return; }
            downloadEntries(list, 'Selecao');
        };
        document.getElementById('arqPackSelectedBtn').onclick = function () {
            var list = selectedEntries();
            if (!list.length) { toast(tr('selectedEmpty')); return; }
            if (typeof window.downloadPackContabilistaSelect === 'function') {
                window.downloadPackContabilistaSelect({ entries: list });
            } else if (typeof window.downloadPackContabilista === 'function') {
                window.downloadPackContabilista({ select: true, entries: list });
            } else toast(tr('packEmpty'));
        };
        document.getElementById('arqFinalizeSelectedBtn').onclick = finalizeSelectedEntries;
        document.getElementById('arqTrashSelectedBtn').onclick = function () {
            var list = selectedEntries();
            if (!list.length) { toast(tr('selectedEmpty')); return; }
            if (state.folder === 'trash') restoreTrashedEntries(list);
            else moveDraftsToTrash(list, true);
        };
        document.getElementById('arqZipBtn').onclick = downloadSet;
        document.getElementById('arqPackBtn').onclick = function (ev) {
            if (typeof window.downloadPackContabilistaSelect === 'function') {
                window.downloadPackContabilistaSelect();
            } else if (typeof window.downloadPackContabilista === 'function') {
                window.downloadPackContabilista({ select: true });
            } else toast(tr('packEmpty'));
        };
        document.getElementById('arqNewClientBtn').onclick = createClientFolder;
        document.getElementById('arqNewPastaBtn').onclick = createPastaFolder;
        document.getElementById('arqDriveBtn').onclick = openDriveRoot;
        bindMobileChromeEvents();
        var archGo = document.getElementById('arqArchGo');
        var archCancel = document.getElementById('arqArchCancel');
        if (archGo) archGo.onclick = commitArchivePanel;
        if (archCancel) archCancel.onclick = closeArchivePanel;
        var archPeriodKind = document.getElementById('arqArchPeriodKind');
        if (archPeriodKind) archPeriodKind.onchange = function () { setPeriodInput('arqArchPeriodKind', 'arqArchPeriodValue', this.value); };
        var archToday = document.getElementById('arqArchToday');
        if (archToday) archToday.onclick = function () { setPeriodInput('arqArchPeriodKind', 'arqArchPeriodValue', 'day', todayIso()); };
        var foldGo = document.getElementById('arqFoldGo');
        var foldCancel = document.getElementById('arqFoldCancel');
        if (foldGo) foldGo.onclick = commitFolderPanel;
        if (foldCancel) foldCancel.onclick = closeFolderPanel;
        ['arqArchClient', 'arqArchPasta'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); commitArchivePanel(); }
            });
        });
        ['arqFoldClient', 'arqFoldPasta'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); commitFolderPanel(); }
            });
        });
        var list = document.getElementById('arqList');
        if (list) {
            list.addEventListener('keydown', function (e) {
                if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
                var rows = visibleEntries();
                if (!rows.length) return;
                var i = -1;
                rows.forEach(function (row, idx) { if (row.id === state.selectedId) i = idx; });
                if (e.key === 'ArrowDown') i = Math.min(rows.length - 1, i + 1);
                else if (e.key === 'ArrowUp') i = Math.max(0, i < 0 ? 0 : i - 1);
                else if (e.key === 'Home') i = 0;
                else if (e.key === 'End') i = rows.length - 1;
                state.selectedId = rows[i].id;
                state.previewTab = 'doc';
                state.selectedPdfId = null;
                renderList();
                renderPreview();
                e.preventDefault();
            });
        }
        document.addEventListener('keydown', function (e) {
            var wrap = document.getElementById('arqOverlay');
            if (!wrap || !wrap.classList.contains('open')) return;
            if (e.key !== 'Escape') return;
            var ap = document.getElementById('arqArchivePanel');
            var fp = document.getElementById('arqFolderPanel');
            if (ap && ap.classList.contains('open')) {
                closeArchivePanel();
                e.preventDefault();
                return;
            }
            if (fp && fp.classList.contains('open')) {
                closeFolderPanel();
                e.preventDefault();
                return;
            }
            if (isMobileArchive() && mobileBack()) {
                e.preventDefault();
                return;
            }
            e.preventDefault();
            closeArquivo();
        });
    }
    function upgradeOverlay() {
        var wrap = document.getElementById('arqOverlay');
        if (!wrap) return;
        var tools = wrap.querySelector('.arq-tools');
        var filters = tools && tools.querySelector('.arq-tool-filters');
        if (filters && !document.getElementById('arqDateFrom')) {
            filters.insertAdjacentHTML('beforeend', dateFiltersHtml());
        }
        if (tools && !document.getElementById('arqArchivePanel')) {
            tools.insertAdjacentHTML('afterend', archivePanelHtml() + folderPanelHtml());
        }
        if (tools && !document.getElementById('arqSelectionBar')) {
            tools.insertAdjacentHTML('afterend', selectionBarHtml());
        }
        if (tools && !document.getElementById('arqToolsToggle')) {
            tools.insertAdjacentHTML('afterbegin', toolsToggleHtml());
        }
        if (tools) tools.classList.toggle('is-collapsed', !!state.toolsCollapsed);
        var body = wrap.querySelector('.arq-body');
        if (body && !document.getElementById('arqMobileNav')) {
            body.insertAdjacentHTML('beforebegin', mobileNavHtml());
        }
        if (body && !document.getElementById('arqMobileBack')) {
            body.insertAdjacentHTML('beforebegin', mobileBackHtml());
        }
        var cols = body ? body.querySelectorAll(':scope > .arq-col') : [];
        if (cols[0]) cols[0].classList.add('arq-folders-col');
        if (body) body.setAttribute('data-mobile-pane', state.mobilePane);
        var listCol = wrap.querySelector('.arq-body .arq-col:nth-child(2)');
        if (listCol) {
            listCol.classList.add('arq-list-col');
            var h3 = listCol.querySelector('h3');
            if (h3 && !document.getElementById('arqCrumb')) {
                h3.insertAdjacentHTML('afterend', '<div class="arq-crumb" id="arqCrumb"></div>');
            }
            var list = document.getElementById('arqList');
            if (list) list.setAttribute('tabindex', '0');
        }
        bindMobileChromeEvents();
        bindArquivoEvents();
    }
    function ensureDom() {
        injectCss();
        var wrap = document.getElementById('arqOverlay');
        if (wrap) {
            upgradeOverlay();
            return;
        }
        wrap = document.createElement('div');
        wrap.id = 'arqOverlay';
        wrap.setAttribute('role', 'dialog');
        wrap.setAttribute('aria-modal', 'true');
        wrap.innerHTML =
            '<div class="arq-top">' +
            '<div class="arq-gold"></div>' +
            '<div><h2 id="arqTitle"></h2><p id="arqSub"></p></div>' +
            '<div class="arq-top-actions">' +
            '<button type="button" class="arq-btn gold" id="arqArchiveBtn"></button>' +
            '<button type="button" class="arq-btn" id="arqCloseBtn"></button>' +
            '</div></div>' +
            '<div class="arq-tools is-collapsed">' +
            toolsToggleHtml() +
            '<div class="arq-tool-filters">' +
            '<input type="search" id="arqSearch" />' +
            '<select id="arqType"></select>' +
            '<label><input type="checkbox" id="arqDoneOnly" /> <span id="arqDoneLbl"></span></label>' +
            dateFiltersHtml() +
            '</div><div class="arq-tool-actions">' +
            '<button type="button" class="arq-btn primary" id="arqZipBtn"></button>' +
            '<button type="button" class="arq-btn gold" id="arqPackBtn"></button>' +
            '<button type="button" class="arq-btn" id="arqNewClientBtn"></button>' +
            '<button type="button" class="arq-btn" id="arqNewPastaBtn"></button>' +
            '<button type="button" class="arq-btn gold" id="arqDriveBtn"></button>' +
            '</div></div>' +
            selectionBarHtml() +
            archivePanelHtml() +
            folderPanelHtml() +
            mobileNavHtml() +
            mobileBackHtml() +
            '<div class="arq-body">' +
            '<div class="arq-col arq-folders-col"><h3 id="arqFoldersTitle"></h3><div class="arq-tree" id="arqTree"></div></div>' +
            '<div class="arq-col arq-list-col"><h3 id="arqListTitle"></h3><div class="arq-crumb" id="arqCrumb"></div><div class="arq-list" id="arqList" tabindex="0"></div></div>' +
            '<div class="arq-col arq-preview" id="arqPreview"></div>' +
            '</div>';
        document.body.appendChild(wrap);
        wrap.querySelector('.arq-body').setAttribute('data-mobile-pane', state.mobilePane);
        bindArquivoEvents();
    }

    function mobileNavHtml() {
        return '<div class="arq-mobile-nav" id="arqMobileNav" role="tablist" aria-label="Arquivo">' +
            '<button type="button" data-pane="folders" role="tab"></button>' +
            '<button type="button" data-pane="files" role="tab"></button>' +
            '<button type="button" data-pane="preview" role="tab"></button>' +
            '</div>';
    }
    function mobileBackHtml() {
        return '<div class="arq-mobile-back" id="arqMobileBack" hidden>' +
            '<button type="button" class="arq-pane-back" id="arqMobileBackBtn"></button>' +
            '<span class="arq-mobile-trail" id="arqMobileTrail"></span>' +
            '</div>';
    }
    function toolsToggleHtml() {
        return '<button type="button" class="arq-btn arq-tools-toggle" id="arqToolsToggle" aria-expanded="false"></button>';
    }

    function dateFiltersHtml() {
        return '<label class="arq-date-filter"><span id="arqDateFromLbl"></span><input type="date" id="arqDateFrom" /></label>' +
            '<label class="arq-date-filter"><span id="arqDateToLbl"></span><input type="date" id="arqDateTo" /></label>' +
            '<button type="button" class="arq-btn" id="arqDateClearBtn"></button>';
    }

    function selectionBarHtml() {
        return '<div class="arq-selection-bar" id="arqSelectionBar" aria-live="polite">' +
            '<span class="arq-selection-summary" id="arqSelectedCount"></span>' +
            '<div class="arq-selection-actions">' +
            '<button type="button" class="arq-btn" id="arqSelectAllBtn"></button>' +
            '<button type="button" class="arq-btn" id="arqClearSelectionBtn"></button>' +
            '<button type="button" class="arq-btn primary" id="arqDownloadSelectedBtn"></button>' +
            '<button type="button" class="arq-btn gold" id="arqPackSelectedBtn"></button>' +
            '<button type="button" class="arq-btn" id="arqFinalizeSelectedBtn"></button>' +
            '<button type="button" class="arq-btn danger" id="arqTrashSelectedBtn"></button>' +
            '</div></div>';
    }

    function bindMobileChromeEvents() {
        document.querySelectorAll('#arqMobileNav [data-pane]').forEach(function (btn) {
            btn.onclick = function () { setMobilePane(btn.getAttribute('data-pane')); };
        });
        var backBtn = document.getElementById('arqMobileBackBtn');
        if (backBtn) backBtn.onclick = function () { mobileBack(); };
        var toolsToggle = document.getElementById('arqToolsToggle');
        if (toolsToggle) toolsToggle.onclick = function () { setToolsCollapsed(!state.toolsCollapsed); };
    }
    function setToolsCollapsed(on) {
        state.toolsCollapsed = !!on;
        var tools = document.querySelector('#arqOverlay .arq-tools');
        if (tools) tools.classList.toggle('is-collapsed', state.toolsCollapsed);
        var tog = document.getElementById('arqToolsToggle');
        if (tog) {
            tog.textContent = state.toolsCollapsed ? tr('toolsMore') : tr('toolsLess');
            tog.setAttribute('aria-expanded', state.toolsCollapsed ? 'false' : 'true');
        }
    }
    function syncMobileChrome() {
        var mobile = isMobileArchive();
        var backWrap = document.getElementById('arqMobileBack');
        var backBtn = document.getElementById('arqMobileBackBtn');
        var trail = document.getElementById('arqMobileTrail');
        var pane = state.mobilePane || 'folders';
        if (backWrap) {
            if (!mobile || pane === 'folders') {
                backWrap.hidden = true;
            } else {
                backWrap.hidden = false;
                if (backBtn) {
                    backBtn.textContent = pane === 'preview' ? tr('backToFiles') : tr('backToFolders');
                    backBtn.setAttribute('data-back-to', pane === 'preview' ? 'files' : 'folders');
                }
                if (trail) {
                    var parts = [tr('mobileTrailFolders')];
                    if (pane === 'files' || pane === 'preview') parts.push(tr('mobileTrailFiles'));
                    if (pane === 'preview') parts.push(tr('mobileTrailPreview'));
                    trail.innerHTML = parts.map(function (p, i) {
                        return i === parts.length - 1 ? ('<strong>' + esc(p) + '</strong>') : esc(p);
                    }).join(' · ');
                }
            }
        }
        var tools = document.querySelector('#arqOverlay .arq-tools');
        if (tools) {
            if (mobile) tools.classList.toggle('is-collapsed', state.toolsCollapsed);
            else tools.classList.remove('is-collapsed');
        }
        var tog = document.getElementById('arqToolsToggle');
        if (tog) {
            tog.style.display = mobile ? '' : 'none';
            if (mobile) {
                tog.textContent = state.toolsCollapsed ? tr('toolsMore') : tr('toolsLess');
                tog.setAttribute('aria-expanded', state.toolsCollapsed ? 'false' : 'true');
            }
        }
        try {
            document.body.classList.toggle('abene-arq-open', !!(document.getElementById('arqOverlay') && document.getElementById('arqOverlay').classList.contains('open')));
            if (typeof window.abeneArquivoOnMobilePane === 'function') window.abeneArquivoOnMobilePane(pane, mobile);
        } catch (eSync) {}
    }
    function mobileBack() {
        if (!isMobileArchive()) return false;
        if (state.mobilePane === 'preview') {
            setMobilePane('files');
            return true;
        }
        if (state.mobilePane === 'files') {
            setMobilePane('folders');
            return true;
        }
        return false;
    }
    function setMobilePane(pane) {
        if (['folders', 'files', 'preview'].indexOf(pane) < 0) pane = 'folders';
        state.mobilePane = pane;
        var body = document.querySelector('#arqOverlay .arq-body');
        if (body) body.setAttribute('data-mobile-pane', pane);
        document.querySelectorAll('#arqMobileNav [data-pane]').forEach(function (btn) {
            var on = btn.getAttribute('data-pane') === pane;
            btn.classList.toggle('on', on);
            btn.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        syncMobileChrome();
        try {
            var active = document.querySelector('#arqOverlay .arq-body > .arq-col[style], #arqOverlay .arq-body > .arq-folders-col, #arqOverlay .arq-body > .arq-list-col, #arqOverlay .arq-body > .arq-preview');
            var paneEl = null;
            if (pane === 'folders') paneEl = document.querySelector('#arqOverlay .arq-folders-col');
            else if (pane === 'files') paneEl = document.querySelector('#arqOverlay .arq-list-col');
            else paneEl = document.getElementById('arqPreview');
            if (paneEl && typeof paneEl.scrollTop === 'number') paneEl.scrollTop = 0;
        } catch (eScroll) {}
    }
    function fillChrome() {
        document.getElementById('arqTitle').textContent = tr('title');
        document.getElementById('arqSub').textContent = tr('subtitle') + ' — ' + tr(isMobileArchive() ? 'navHintMobile' : 'navHint');
        document.getElementById('arqArchiveBtn').textContent = tr('archiveNow');
        document.getElementById('arqCloseBtn').textContent = tr('close');
        document.getElementById('arqSearch').placeholder = tr('search');
        document.getElementById('arqDoneLbl').textContent = tr('onlyDone');
        document.getElementById('arqDateFromLbl').textContent = tr('dateFrom');
        document.getElementById('arqDateToLbl').textContent = tr('dateTo');
        document.getElementById('arqDateFrom').value = state.dateFrom;
        document.getElementById('arqDateTo').value = state.dateTo;
        document.getElementById('arqDateClearBtn').textContent = tr('clearPeriod');
        document.getElementById('arqZipBtn').textContent = tr('dlSet');
        document.getElementById('arqSelectAllBtn').textContent = tr('selectAll');
        document.getElementById('arqClearSelectionBtn').textContent = tr('clearSelection');
        document.getElementById('arqDownloadSelectedBtn').textContent = tr('downloadSelected');
        document.getElementById('arqPackSelectedBtn').textContent = tr('packSelected');
        document.getElementById('arqFinalizeSelectedBtn').textContent = tr('finalizeSelected');
        document.getElementById('arqTrashSelectedBtn').textContent = tr(state.folder === 'trash' ? 'restoreSelected' : 'moveSelectedTrash');
        var packBtn = document.getElementById('arqPackBtn');
        if (packBtn) packBtn.textContent = tr('packAcct');
        var nc = document.getElementById('arqNewClientBtn');
        if (nc) nc.textContent = tr('newClient');
        var np = document.getElementById('arqNewPastaBtn');
        if (np) np.textContent = tr('newPasta');
        var drv = document.getElementById('arqDriveBtn');
        if (drv) {
            drv.textContent = tr('openDrive');
            var url = driveRootUrl();
            drv.style.display = url ? '' : 'none';
        }
        document.getElementById('arqFoldersTitle').textContent = tr('folders');
        var paneLabels = { folders: tr('folders'), files: tr('files'), preview: tr('preview') };
        document.querySelectorAll('#arqMobileNav [data-pane]').forEach(function (btn) {
            btn.textContent = paneLabels[btn.getAttribute('data-pane')] || '';
        });
        setToolsCollapsed(state.toolsCollapsed);
        setMobilePane(state.mobilePane);
        var sel = document.getElementById('arqType');
        var types = [
            ['all', tr('typeAll')],
            ['relatorio', tr('typeRel')],
            ['orcamento', tr('typeOrc')],
            ['recibo', tr('typeRec')],
            ['completo', tr('typeComp')],
            ['documento', tr('typeDoc')]
        ];
        sel.innerHTML = types.map(function (p) {
            return '<option value="' + p[0] + '"' + (state.type === p[0] ? ' selected' : '') + '>' + esc(p[1]) + '</option>';
        }).join('');
        document.getElementById('arqDoneOnly').checked = state.concludedOnly;
        renderSelectionBar(visibleEntries());
        var archTitle = document.getElementById('arqArchTitle');
        if (archTitle) archTitle.textContent = tr('archivePanelTitle');
        var acl = document.getElementById('arqArchClientLbl');
        if (acl) acl.textContent = tr('client');
        var apl = document.getElementById('arqArchPastaLbl');
        if (apl) apl.textContent = tr('pasta');
        var apr = document.getElementById('arqArchPeriodLbl');
        if (apr) apr.textContent = tr('period');
        var aprv = document.getElementById('arqArchPeriodValueLbl');
        if (aprv) aprv.textContent = tr('period');
        var apk = document.getElementById('arqArchPeriodKind');
        if (apk) {
            apk.options[0].textContent = tr('periodDay');
            apk.options[1].textContent = tr('periodMonth');
            apk.options[2].textContent = tr('periodYear');
        }
        var apt = document.getElementById('arqArchToday');
        if (apt) apt.textContent = tr('periodToday');
        var adl = document.getElementById('arqArchDoneLbl');
        if (adl) adl.textContent = tr('markDone');
        var ago = document.getElementById('arqArchGo');
        if (ago) ago.textContent = tr('archiveGo');
        var aca = document.getElementById('arqArchCancel');
        if (aca) aca.textContent = tr('archiveCancel');
        var fcl = document.getElementById('arqFoldClientLbl');
        if (fcl) fcl.textContent = tr('client');
        var fpl = document.getElementById('arqFoldPastaLbl');
        if (fpl) fpl.textContent = tr('pasta');
        var fgo = document.getElementById('arqFoldGo');
        if (fgo) fgo.textContent = tr('createGo');
        var fca = document.getElementById('arqFoldCancel');
        if (fca) fca.textContent = tr('archiveCancel');
        var ft = document.getElementById('arqFoldTitle');
        if (ft && !ft.textContent) ft.textContent = tr('folderPanelTitle');
    }
    function treeBtn(id, label, extra) {
        var on = state.folder === id ? ' on' : '';
        return '<button type="button" class="' + on + '" data-folder="' + esc(id) + '">' + esc(label) + (extra ? ' <span class="arq-hint">(' + extra + ')</span>' : '') + '</button>';
    }
    function selectFolder(id) {
        state.folder = id;
        var still = visibleEntries().some(function (e) { return e.id === state.selectedId; });
        if (!still) {
            state.selectedId = null;
            state.previewTab = 'doc';
            state.selectedPdfId = null;
        }
        renderTree();
        renderList();
        renderPreview();
        if (isMobileArchive()) setMobilePane('files');
    }
    function clientSearchText(value) {
        return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
    }
    function filterClientTree() {
        var tree = document.getElementById('arqTree');
        if (!tree) return;
        var words = clientSearchText(state.clientQuery).split(/\s+/).filter(Boolean);
        var visible = 0;
        tree.querySelectorAll('[data-client-search]').forEach(function (group) {
            var haystack = group.getAttribute('data-client-search');
            var match = words.every(function (word) { return haystack.indexOf(word) >= 0; });
            group.hidden = !match;
            if (match) visible++;
            if (words.length && match) group.open = true;
        });
        var empty = document.getElementById('arqClientEmpty');
        if (empty) empty.hidden = visible !== 0;
    }
    function renderTree() {
        var items = allEntries();
        var trashItems = trashedEntries();
        var clients = catalogClients().slice().sort(function (a, b) {
            return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
        });
        var pastas = catalogPastas();
        var years = unique(items.map(function (e) { return entryPeriod(e).start.slice(0, 4); }).filter(Boolean));
        var html = '';
        html += treeBtn('all', tr('all'), items.length);
        html += treeBtn('done', tr('done'), items.filter(function (e) { return e.concluded; }).length);
        html += treeBtn('trash', tr('trash'), trashItems.length);
        html += '<details open><summary>' + esc(tr('byType')) + '</summary>';
        ['relatorio', 'orcamento', 'recibo', 'completo', 'documento'].forEach(function (tp) {
            var n = items.filter(function (e) { return e.type === tp; }).length;
            html += treeBtn('type:' + tp, typeLabel(tp), n);
        });
        html += '</details>';
        html += '<details open><summary>' + esc(tr('byClient')) + '</summary>';
        html += '<input type="search" id="arqClientSearch" aria-label="' + esc(tr('clientSearch')) + '" placeholder="' + esc(tr('clientSearch')) + '" value="' + esc(state.clientQuery) + '" style="box-sizing:border-box;width:calc(100% - 16px);margin:8px;min-height:44px;font-size:16px;padding:8px;" />';
        html += '<p id="arqClientEmpty" role="status" class="arq-hint" style="padding:6px 12px;" hidden>' + esc(tr('clientEmpty')) + '</p>';
        clients.forEach(function (c) {
            var clientItems = items.filter(function (e) { return (e.client || tr('noClient')) === c; });
            var nAll = clientItems.length;
            var sub = catalogPastasForClient(c);
            var searchText = clientSearchText([c].concat(sub, clientItems.map(function (e) { return [e.name, e.number].join(' '); })).join(' '));
            var activeClient = state.folder === 'client:' + c || state.folder.indexOf('clientpasta:' + c + '|') === 0;
            html += '<details data-client-search="' + esc(searchText) + '"' + (activeClient ? ' open' : '') + '><summary>' + esc(c) + ' <span class="arq-hint">(' + nAll + ')</span></summary>';
            html += treeBtn('client:' + c, tr('clientDocuments'), nAll);
            html += '<div class="arq-tree-sub">';
            sub.forEach(function (p) {
                var nP = items.filter(function (e) {
                    return (e.client || tr('noClient')) === c && (e.pasta || tr('none')) === p;
                }).length;
                html += treeBtn('clientpasta:' + c + '|' + p, p, nP);
            });
            html += '</div></details>';
        });
        html += '</details>';
        html += '<details open><summary>' + esc(tr('byPasta')) + '</summary>';
        if (!pastas.length) html += '<p class="arq-hint" style="padding:6px 12px;">—</p>';
        pastas.forEach(function (p) { html += treeBtn('pasta:' + p, p); });
        html += '</details>';
        html += '<details><summary>' + esc(tr('byYear')) + '</summary>';
        years.forEach(function (y) {
            var months = unique(items.filter(function (e) { return entryPeriod(e).start.slice(0, 4) === y; })
                .map(function (e) { return entryPeriod(e).start.slice(0, 7); }));
            html += '<details open><summary>' + esc(y) + '</summary>';
            html += treeBtn('year:' + y, tr('all') + ' ' + y);
            months.forEach(function (m) {
                html += treeBtn('month:' + m, m);
            });
            html += '</details>';
        });
        html += '</details>';
        html += '<details><summary>' + esc(tr('drafts')) + '</summary>';
        html += treeBtn('draft:current', tr('current'));
        html += treeBtn('draft:versions', tr('versions'), versionSnapshots().length);
        html += '</details>';
        var tree = document.getElementById('arqTree');
        tree.innerHTML = html;
        var clientSearch = document.getElementById('arqClientSearch');
        clientSearch.oninput = function () { state.clientQuery = this.value; filterClientTree(); };
        clientSearch.onkeydown = function (event) {
            if (event.key === 'Escape') {
                event.preventDefault(); event.stopPropagation();
                this.value = ''; state.clientQuery = ''; filterClientTree();
            } else if (event.key === 'Enter') {
                event.preventDefault();
                var first = tree.querySelector('[data-client-search]:not([hidden]) button[data-folder]');
                if (first) first.click();
            }
        };
        filterClientTree();
        tree.querySelectorAll('button[data-folder]').forEach(function (btn) {
            btn.onclick = function () { selectFolder(btn.getAttribute('data-folder')); };
        });
    }
    function renderCrumb() {
        var el = document.getElementById('arqCrumb');
        if (!el) return;
        var parts = [{ id: 'all', label: tr('all') }];
        var id = state.folder;
        if (id.indexOf('clientpasta:') === 0) {
            var cp = id.slice(12).split('|');
            parts.push({ id: 'client:' + cp[0], label: cp[0] });
            parts.push({ id: id, label: cp[1] || '' });
        } else if (id.indexOf('client:') === 0) {
            parts.push({ id: id, label: id.slice(7) });
        } else if (id.indexOf('pasta:') === 0) {
            parts.push({ id: id, label: id.slice(6) });
        } else if (id.indexOf('month:') === 0) {
            parts.push({ id: 'year:' + id.slice(6, 10), label: id.slice(6, 10) });
            parts.push({ id: id, label: id.slice(6) });
        } else if (id !== 'all') {
            parts.push({ id: id, label: folderLabel(id) });
        }
        el.innerHTML = parts.map(function (p, i) {
            if (i === parts.length - 1) return '<strong>' + esc(p.label) + '</strong>';
            return '<button type="button" data-folder="' + esc(p.id) + '">' + esc(p.label) + '</button> / ';
        }).join('');
        el.querySelectorAll('button[data-folder]').forEach(function (btn) {
            btn.onclick = function () { selectFolder(btn.getAttribute('data-folder')); };
        });
    }
    function renderList() {
        var list = visibleEntries();
        pruneSelection(list);
        if (list.length && !list.some(function (e) { return e.id === state.selectedId; })) {
            state.selectedId = list[0].id;
            state.previewTab = 'doc';
            state.selectedPdfId = null;
        }
        if (!list.length) state.selectedId = null;
        var titleEl = document.getElementById('arqListTitle');
        if (titleEl) titleEl.textContent = list.length + ' — ' + folderLabel(state.folder);
        renderCrumb();
        var box = document.getElementById('arqList');
        if (!list.length) {
            box.innerHTML = '<p class="arq-hint" style="padding:12px;">' + esc(tr(state.folder === 'trash' ? 'trashEmpty' : 'empty')) + '</p>';
            renderSelectionBar(list);
            return;
        }
        box.innerHTML = list.map(function (e) {
            var on = state.selectedId === e.id ? ' on' : '';
            var checked = !!state.selectedIds[e.id];
            var date = entryDate(e);
            var archived = normalizeEntryDate(e.archivedAt);
            var deleted = normalizeEntryDate(e.deletedAt);
            var dateMeta = periodLabel(e);
            if (date) dateMeta += (dateMeta ? ' · ' : '') + tr('documentDate') + ': ' + date;
            if (archived && archived !== date) dateMeta += (dateMeta ? ' · ' : '') + tr('archiveDate') + ': ' + archived;
            if (deleted) dateMeta += (dateMeta ? ' · ' : '') + tr('deletedOn') + ': ' + deleted;
            return '<div class="arq-row-wrap' + (checked ? ' selected' : '') + '" data-id="' + esc(e.id) + '">' +
                '<label class="arq-row-select"><input type="checkbox" class="arq-select-cb" data-id="' + esc(e.id) + '"' + (checked ? ' checked' : '') + ' aria-label="' + esc(tr('selectAll') + ': ' + e.name) + '" /></label>' +
                '<button type="button" class="arq-row' + on + '" data-id="' + esc(e.id) + '">' +
                '<span class="arq-badge' + (e.concluded ? ' done' : '') + '">' + esc(e.concluded ? tr('concluded') : tr('notDone')) + '</span>' +
                (e.sentToClient ? '<span class="arq-badge">' + esc(tr('sentBadge')) + '</span>' : '') +
                (e.protected ? '<span class="arq-badge protected">🔒 ' + esc(tr('protectedBadge')) + '</span>' : '') +
                (e.deletedAt ? '<span class="arq-badge trashed">' + esc(tr('deletedBadge')) + '</span>' : '') +
                '<span class="arq-badge">' + esc(typeLabel(e.type)) + '</span>' +
                esc(e.name) +
                '<span class="arq-meta">' + esc([e.client || tr('noClient'), e.pasta || tr('none'), dateMeta, e.number].filter(Boolean).join(' · ')) + '</span>' +
                '</button>' +
                (!e.deletedAt ? '<button type="button" class="arq-gdocs-entry' + (e.gdocsFileId ? ' linked' : '') + '" data-gdocs-entry="' + esc(e.id) + '" title="' + esc(tr(e.gdocsFileId ? 'gdocsOpenEntry' : ((e.concluded || e.protected || e.readOnlyOrigin) ? 'gdocsCopyEntry' : 'gdocsCreateEntry'))) + '" aria-label="' + esc(tr('gdocsEntry') + ': ' + e.name) + '">' + (e.gdocsFileId ? 'G✓' : 'G+') + '</button>' : '') +
                '</div>';
        }).join('');
        box.querySelectorAll('.arq-select-cb').forEach(function (cb) {
            cb.onchange = function () {
                var id = cb.getAttribute('data-id');
                if (cb.checked) state.selectedIds[id] = true;
                else delete state.selectedIds[id];
                renderList();
            };
        });
        box.querySelectorAll('button.arq-row').forEach(function (btn) {
            btn.onclick = function () {
                state.selectedId = btn.getAttribute('data-id');
                state.previewTab = 'doc';
                state.selectedPdfId = null;
                renderList();
                renderPreview();
                if (isMobileArchive()) setMobilePane('preview');
            };
        });
        box.querySelectorAll('[data-gdocs-entry]').forEach(function (btn) {
            btn.onclick = function (event) {
                event.preventDefault();
                event.stopPropagation();
                var id = btn.getAttribute('data-gdocs-entry');
                var entry = list.filter(function (item) { return String(item.id) === String(id); })[0];
                if (entry) openEntryInGoogleDocs(entry);
            };
        });
        renderSelectionBar(list);
        var on = box.querySelector('.arq-row.on');
        if (on && typeof on.scrollIntoView === 'function') on.scrollIntoView({ block: 'nearest' });
    }
    function findSelected() {
        var id = state.selectedId;
        if (!id) return null;
        if (id === 'current') return currentSnapshot();
        if (id.indexOf('ver-') === 0) {
            return versionSnapshots().filter(function (v) { return v.id === id; })[0] || null;
        }
        return allEntries().concat(trashedEntries()).filter(function (e) { return e.id === id; })[0] || null;
    }
    function previewDoc(html) {
        return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
            'body{font-family:Calibri,Segoe UI,sans-serif;padding:20px 24px;color:#1a1a1a;line-height:1.45;background:#fff;}' +
            'h1,h2,h3{color:#0B1223;margin:0 0 10px;}' +
            'table{border-collapse:collapse;width:100%;margin:8px 0;}' +
            'td,th{border:1px solid #94a3b8;padding:6px 8px;font-size:14px;vertical-align:top;}' +
            'th{background:#0B1223;color:#fff;font-weight:700;}' +
            'img{max-width:100%;height:auto;}' +
            'p{margin:0 0 8px;}' +
            '.abene-page-flow,.page-decoration,.page-header-zone,.page-footer-zone,.page-gap-band,.abene-obj-resize,.abene-tbox-bar{display:none!important;}' +
            '</style></head><body>' + (html || '') + '</body></html>';
    }
    function syncPreviewTabs() {
        var docBtn = document.getElementById('arqTabDoc');
        var pdfBtn = document.getElementById('arqTabPdf');
        var htmlFrame = document.getElementById('arqPreviewFrame');
        var pdfFrame = document.getElementById('arqPdfFrame');
        var pdfOn = state.previewTab === 'pdf';
        if (docBtn) docBtn.classList.toggle('on', !pdfOn);
        if (pdfBtn) pdfBtn.classList.toggle('on', pdfOn);
        if (htmlFrame) htmlFrame.style.display = pdfOn ? 'none' : '';
        if (pdfFrame) {
            if (pdfOn && pdfPreviewUrl) pdfFrame.classList.add('show');
            else pdfFrame.classList.remove('show');
        }
    }
    function showPdfBlob(blob, pid) {
        if (!blob) return;
        revokePdfPreview();
        pdfPreviewUrl = URL.createObjectURL(blob);
        state.previewTab = 'pdf';
        state.selectedPdfId = pid || state.selectedPdfId;
        var frame = document.getElementById('arqPdfFrame');
        if (frame) {
            frame.removeAttribute('sandbox');
            frame.src = pdfPreviewUrl;
            frame.classList.add('show');
        }
        syncPreviewTabs();
        var status = document.getElementById('arqPdfStatus');
        if (status && pid) status.textContent = tr('pdfSavedView');
        document.querySelectorAll('.arq-pdf-row').forEach(function (row) {
            row.classList.toggle('on', row.getAttribute('data-pid') === (pid || ''));
        });
    }
    function renderPreview() {
        var box = document.getElementById('arqPreview');
        var e = findSelected();
        revokePdfPreview();
        state.selectedPdfId = null;
        if (!e) {
            box.innerHTML = '<h3>' + esc(tr('preview')) + '</h3><p class="arq-hint">' + esc(tr('noSel')) + '</p>';
            return;
        }
        var canRel = !!e.hasReport && partHasContent(e.html, 'relatorio');
        var canOrc = !!e.hasDevis && partHasContent(e.html, 'orcamento');
        var canRec = !!e.hasReceipt && partHasContent(e.html, 'recibo');
        var trashed = isTrashedEntry(e);
        var protectedEntry = isProtectedEntry(e);
        var actions;
        if (trashed) {
            actions = '<div class="arq-actions">' +
                '<button type="button" class="arq-btn gold" data-act="restore">' + esc(tr('restore')) + '</button>' +
                '<button type="button" class="arq-btn" data-act="dl">' + esc(tr('dlOne')) + '</button>' +
                '</div>';
        } else {
            actions = '<div class="arq-actions">' +
                '<button type="button" class="arq-btn primary" data-act="open">' + esc((e.concluded || protectedEntry) ? tr('openView') : tr('openModify')) + '</button>' +
                '<button type="button" class="arq-btn gold" data-act="copy">' + esc(tr('copyAsNew')) + '</button>' +
                (canRel ? '<button type="button" class="arq-btn" data-act="copy-rel">' + esc(tr('copyRel')) + '</button>' : '') +
                (canOrc ? '<button type="button" class="arq-btn" data-act="copy-orc">' + esc(tr('copyOrc')) + '</button>' : '') +
                (canRec ? '<button type="button" class="arq-btn" data-act="copy-rec">' + esc(tr('copyRec')) + '</button>' : '') +
                '<button type="button" class="arq-btn" data-act="dl">' + esc(tr('dlOne')) + '</button>' +
                '<button type="button" class="arq-btn" data-act="gdocs">G · ' + esc(tr(e.gdocsFileId ? 'gdocsOpenEntry' : ((e.concluded || protectedEntry || e.readOnlyOrigin) ? 'gdocsCopyEntry' : 'gdocsCreateEntry'))) + '</button>' +
                (!e.readOnlyOrigin && !e.concluded
                    ? '<button type="button" class="arq-btn" data-act="protect">' + esc(tr(protectedEntry ? 'unprotect' : 'protect')) + '</button>'
                    : '') +
                (!e.readOnlyOrigin && !e.concluded && !protectedEntry
                    ? '<button type="button" class="arq-btn" data-act="toggle">' + esc(tr('markDone')) + '</button>'
                    : '') +
                (!e.readOnlyOrigin && !e.concluded
                    ? '<button type="button" class="arq-btn danger" data-act="trash"' + (protectedEntry ? ' disabled title="' + esc(tr('protectedCannotTrash')) + '"' : '') + '>' + esc(tr('moveTrash')) + '</button>'
                    : '') +
                '</div>';
        }
        var form = '';
        if (!e.readOnlyOrigin && !trashed) {
            var ep = entryPeriod(e);
            form = '<div class="arq-form">' +
                '<label>' + esc(tr('client')) + '<input id="arqEditClient" value="' + esc(e.client) + '" /></label>' +
                '<label>' + esc(tr('pasta')) + '<input id="arqEditPasta" value="' + esc(e.pasta) + '" /></label>' +
                '<label>' + esc(tr('documentDate')) + '<input type="date" id="arqEditDate" value="' + esc(entryDate(e)) + '" /></label>' +
                '<label>' + esc(tr('period')) + '<select id="arqEditPeriodKind"><option value="day"' + (ep.kind === 'day' ? ' selected' : '') + '>' + esc(tr('periodDay')) + '</option><option value="month"' + (ep.kind === 'month' ? ' selected' : '') + '>' + esc(tr('periodMonth')) + '</option><option value="year"' + (ep.kind === 'year' ? ' selected' : '') + '>' + esc(tr('periodYear')) + '</option></select></label>' +
                '<label>' + esc(tr('period')) + '<input id="arqEditPeriodValue" value="' + esc(ep.value) + '" /></label>' +
                '<button type="button" class="arq-btn" id="arqEditToday">' + esc(tr('periodToday')) + '</button>' +
                '<button type="button" class="arq-btn gold" data-act="meta">' + esc(tr('saveFicha')) + '</button>' +
                '</div>';
        }
        var pdfBtns = '<div class="arq-actions">' +
            (!trashed && !protectedEntry && canRel ? '<button type="button" class="arq-btn gold" data-act="final-relatorio">' + esc(tr('pdfGravarRel')) + '</button>' : '') +
            (!trashed && !protectedEntry && canOrc ? '<button type="button" class="arq-btn gold" data-act="final-orcamento">' + esc(tr('pdfGravarOrc')) + '</button>' : '') +
            (!trashed && !protectedEntry && canRec ? '<button type="button" class="arq-btn gold" data-act="final-recibo">' + esc(tr('pdfGravarRec')) + '</button>' : '') +
            '</div>';
        var tab = state.previewTab === 'pdf' ? 'pdf' : 'doc';
        box.innerHTML = '<h3>' + esc(tr('preview')) + ' — ' + esc(e.name) + '</h3>' +
            '<p class="arq-hint">' + esc(typeLabel(e.type) + ' · ' + (e.client || tr('noClient')) + ' · ' + (e.pasta || tr('none'))) + '</p>' +
            actions + form +
            '<div class="arq-pdf"><h4>' + esc(tr('pdfTitle')) + '</h4>' +
            '<p class="arq-hint">' + esc(tr('pdfHint')) + '</p>' +
            pdfBtns +
            '<div id="arqPdfStatus" class="arq-hint"></div>' +
            '<div id="arqPdfList"></div></div>' +
            '<div class="arq-preview-tabs">' +
            '<button type="button" id="arqTabDoc" class="' + (tab === 'doc' ? 'on' : '') + '">' + esc(tr('tabDoc')) + '</button>' +
            '<button type="button" id="arqTabPdf">' + esc(tr('tabPdf')) + '</button>' +
            '</div>' +
            '<iframe title="preview" id="arqPreviewFrame"></iframe>' +
            '<iframe title="pdf" id="arqPdfFrame"></iframe>';
        var iframe = box.querySelector('#arqPreviewFrame');
        iframe.setAttribute('sandbox', '');
        iframe.srcdoc = previewDoc(cleanArchiveHtml(e.html));
        var tabDoc = document.getElementById('arqTabDoc');
        var tabPdf = document.getElementById('arqTabPdf');
        if (tabDoc) tabDoc.onclick = function () { state.previewTab = 'doc'; syncPreviewTabs(); };
        if (tabPdf) tabPdf.onclick = function () {
            state.previewTab = 'pdf';
            syncPreviewTabs();
            if (!pdfPreviewUrl) {
                var firstView = document.querySelector('#arqPdfList [data-pdf="view"]');
                if (firstView) firstView.click();
            }
        };
        box.querySelectorAll('[data-act]').forEach(function (btn) {
            btn.onclick = function () { runAction(btn.getAttribute('data-act'), e); };
        });
        if (document.getElementById('arqEditPeriodKind')) {
            setPeriodInput('arqEditPeriodKind', 'arqEditPeriodValue', ep.kind, ep.value);
            document.getElementById('arqEditPeriodKind').onchange = function () {
                setPeriodInput('arqEditPeriodKind', 'arqEditPeriodValue', this.value);
            };
            document.getElementById('arqEditToday').onclick = function () {
                setPeriodInput('arqEditPeriodKind', 'arqEditPeriodValue', 'day', todayIso());
                runAction('meta', e);
            };
        }
        ['arqEditClient', 'arqEditPasta', 'arqEditDate', 'arqEditPeriodValue'].forEach(function (fid) {
            var field = document.getElementById(fid);
            if (!field) return;
            field.addEventListener('change', function () { runAction('meta', e); });
        });
        fillPdfList(e);
        syncPreviewTabs();
    }
    function fillPdfList(entry) {
        var listEl = document.getElementById('arqPdfList');
        if (!listEl) return;
        listFinals(ownerIdOf(entry)).then(function (rows) {
            if (state.selectedId !== entry.id) return;
            if (!rows.length) {
                listEl.innerHTML = '<p class="arq-hint">' + esc(tr('pdfEmpty')) + '</p>';
                return;
            }
            listEl.innerHTML = rows.map(function (r) {
                var kb = Math.max(1, Math.round((r.bytes || 0) / 1024));
                var when = String(r.createdAt || '').slice(0, 16).replace('T', ' ');
                var on = state.selectedPdfId === r.id ? ' on' : '';
                return '<div class="arq-pdf-row' + on + '" data-pid="' + esc(r.id) + '">' +
                    '<span>' + esc(etapeLabel(r.etape)) + ' v' + esc(String(r.rev)) +
                    (r.number ? ' · ' + esc(r.number) : '') +
                    ' · ' + esc(when) + ' · ' + esc(tr('pdfKb', { n: String(kb) })) +
                    (r.driveFileId ? ' · Drive ✓' : '') + '</span>' +
                    '<button type="button" class="arq-btn" data-pdf="view" data-pid="' + esc(r.id) + '">' + esc(tr('pdfView')) + '</button>' +
                    '<button type="button" class="arq-btn" data-pdf="dl" data-pid="' + esc(r.id) + '">' + esc(tr('pdfDl')) + '</button>' +
                    '</div>';
            }).join('');
            listEl.querySelectorAll('[data-pdf]').forEach(function (btn) {
                btn.onclick = function () { handlePdfFile(btn.getAttribute('data-pdf'), btn.getAttribute('data-pid'), entry); };
            });
        });
    }
    function handlePdfFile(kind, pid, entry) {
        getFinal(pid).then(function (rec) {
            if (!rec || !rec.blob) return;
            if (kind === 'view') {
                showPdfBlob(rec.blob, rec.id);
                return;
            }
            var a = document.createElement('a');
            a.href = URL.createObjectURL(rec.blob);
            a.download = sanitizeName(entry.name) + '_' + rec.etape + '_v' + rec.rev + '.pdf';
            a.click();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
        });
    }
    function gravarEtape(etape, opts) {
        opts = opts || {};
        if (!window.html2pdf && typeof window.abeneEnsureLibrary === 'function') {
            return window.abeneEnsureLibrary('pdf').then(function () { return gravarEtape(etape, opts); });
        }
        var entry = opts.entry || currentSnapshot();
        if (opts.html) {
            entry = Object.assign({}, entry, {
                html: opts.html,
                number: opts.number || entry.number,
                name: opts.name || entry.name,
                client: opts.client != null ? opts.client : entry.client,
                pasta: opts.pasta != null ? opts.pasta : entry.pasta,
                nif: opts.nif != null ? opts.nif : entry.nif,
                type: opts.type || entry.type
            });
        }
        if (!window.html2pdf) {
            if (!opts.silent) toast(tr('pdfNoLib'));
            return Promise.reject(new Error('nolib'));
        }
        if (!partHasContent(entry.html, etape)) {
            if (!opts.silent) toast(tr('pdfNeed'));
            return Promise.reject(new Error('empty'));
        }
        var chunk = extractPart(entry.html, extractKey(etape));
        return listFinals(ownerIdOf(entry)).then(function (rows) {
            var same = rows.filter(function (r) { return r.etape === etape; });
            var lastRev = same.length ? Math.max.apply(null, same.map(function (r) { return Number(r.rev) || 0; })) : 0;
            var next = lastRev + 1;
            return pdfBlobForEtape(etape, entry, chunk, opts).then(function (blob) {
                var rec = {
                    id: ownerIdOf(entry) + ':' + etape + ':v' + next,
                    ownerId: ownerIdOf(entry),
                    etape: etape,
                    rev: next,
                    number: entry.number || opts.number || '',
                    name: entry.name || '',
                    createdAt: new Date().toISOString(),
                    bytes: blob.size || 0,
                    blob: blob,
                    client: entry.client || '',
                    pasta: entry.pasta || '',
                    type: entry.type || '',
                    periodKind: entryPeriod(entry).kind,
                    periodValue: entryPeriod(entry).value,
                    periodStart: entryPeriod(entry).start,
                    periodEnd: entryPeriod(entry).end,
                    concluded: true
                };
                return putFinal(rec).then(function () { return syncFinalToDrive(rec, entry); });
            });
        }).then(function (rec) {
            if (!opts.silent) toast(tr('pdfOk', { etape: etapeLabel(etape), rev: String(rec.rev) }));
            var listHost = document.getElementById('arqPdfList');
            if (listHost && opts.entry) fillPdfList(opts.entry);
            return rec;
        });
    }
    function gravarFinal(entry, etape) {
        var status = document.getElementById('arqPdfStatus');
        if (status) status.textContent = tr('pdfBusy');
        gravarEtape(etape, { entry: entry, silent: false }).then(function (rec) {
            if (status) status.textContent = rec ? tr('pdfOk', { etape: etapeLabel(etape), rev: String(rec.rev) }) : '';
            fillPdfList(entry);
            if (rec && rec.blob) showPdfBlob(rec.blob, rec.id);
        }).catch(function (err) {
            if (status) status.textContent = '';
            var msg = err && err.message;
            if (msg === 'cancel' || msg === 'nolib' || msg === 'empty') return;
            toast(tr('pdfFail'));
        });
    }
    function extractPart(html, part) {
        var d = parseHtml(html);
        if (part === 'devis') {
            var el = d.querySelector('[data-abene-block="devis"]');
            return el ? el.outerHTML : '';
        }
        if (part === 'receipt') {
            var el2 = d.querySelector('[data-abene-block="receipt"]');
            return el2 ? el2.outerHTML : '';
        }
        if (part === 'relatorio') {
            d.querySelectorAll('[data-abene-block="devis"], [data-abene-block="receipt"]').forEach(function (n) { n.remove(); });
            var report = d.querySelector('[data-abene-block="report"]');
            var left = (report ? report.outerHTML : d.innerHTML).trim();
            return left || html || '';
        }
        return html;
    }
    function applyToEditor(html, name, asCopy, readOnly, archiveEntryId) {
        var editor = editorEl();
        if (!editor) return false;
        try {
            if (typeof saveDocument === 'function') saveDocument({ silent: true });
        } catch (eSave) {
            if (typeof showToast === 'function') showToast('Não foi possível guardar o documento atual. A abertura foi cancelada para conservar o trabalho.');
            return false;
        }
        var prepared = asCopy && typeof window.abenePrepareCopyAsNewHtml === 'function'
            ? window.abenePrepareCopyAsNewHtml(html)
            : cleanArchiveHtml(html);
        editor.innerHTML = prepared || '<p></p>';
        docState().archiveEntryId = !asCopy && !readOnly ? (archiveEntryId || '') : '';
        var linkedEntry = !asCopy && !readOnly && archiveEntryId
            ? loadStore().filter(function (item) { return item.id === archiveEntryId; })[0] : null;
        if (linkedEntry && linkedEntry.gdocsFileId && window.abeneGdocsSetLink) {
            window.abeneGdocsSetLink(linkedEntry.gdocsFileId, linkedEntry.gdocsUrl);
        } else if (window.abeneGdocsClearLink) window.abeneGdocsClearLink();
        if (typeof window.abeneEnhanceCheckTables === 'function') window.abeneEnhanceCheckTables(editor);
        editor.contentEditable = readOnly ? 'false' : 'true';
        if (typeof renameDocument === 'function') renameDocument(name);
        if (docState()) {
            docState().dirty = true;
            docState().protected = !!readOnly;
            docState().pdfOwnerId = '';
            if (asCopy) {
                docState().sentToClient = false;
                if (window.abeneGdocsForkOnCopy) window.abeneGdocsForkOnCopy();
            }
        }
        if (typeof saveUndoState === 'function') saveUndoState();
        if (typeof updateStats === 'function') updateStats();
        if (typeof updateNavigation === 'function') updateNavigation();
        try {
            /* Fix #5: read-only opens must not rebind Drive sync to "current". */
            if (!readOnly && typeof window.abeneDocumentSyncOnDocChange === 'function') window.abeneDocumentSyncOnDocChange();
        } catch (eSyncDoc) {}
        if (typeof refreshPagination === 'function') refreshPagination();
        if (typeof updateSaveStatus === 'function') updateSaveStatus();
        closeArquivo();
        return true;
    }
    function downloadHtml(name, html) {
        var blob = new Blob(['<!DOCTYPE html><html><head><meta charset="utf-8"><title>' +
            sanitizeName(name) + '</title></head><body>' + cleanArchiveHtml(html) + '</body></html>'], { type: 'text/html;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = sanitizeName(name) + '.html';
        a.click();
        URL.revokeObjectURL(a.href);
    }
    function csvEsc(v) {
        var s = String(v == null ? '' : v);
        if (/^[\t\r ]*[=+\-@]/.test(s)) s = "'" + s;
        if (/[;"\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
    }
    function ensureFinalPdfs(entry) {
        var etapes = [];
        if (entry.hasReport && partHasContent(entry.html, 'relatorio')) etapes.push('relatorio');
        if (entry.hasDevis && partHasContent(entry.html, 'orcamento')) etapes.push('orcamento');
        if (entry.hasReceipt && partHasContent(entry.html, 'recibo')) etapes.push('recibo');
        if (!etapes.length) {
            return Promise.reject(new Error('empty'));
        }
        return listFinals(ownerIdOf(entry)).then(function (rows) {
            return etapes.reduce(function (promise, etape) {
                return promise.then(function () {
                    var exists = rows.some(function (r) { return r.etape === etape && r.blob; });
                    if (exists) return null;
                    return gravarEtape(etape, { entry: entry, silent: true });
                });
            }, Promise.resolve());
        }).then(function () {
            var list = loadStore();
            var changed = false;
            list.forEach(function (item) {
                if (item.id === entry.id && !item.concluded) {
                    item.concluded = true;
                    changed = true;
                }
            });
            if (changed && saveStore(list)) {
                entry.concluded = true;
            }
            return entry;
        });
    }
    function concludeWithPdfs(entry) {
        toast(tr('pdfBusy'));
        return ensureFinalPdfs(entry).then(function () {
            renderTree();
            renderList();
            renderPreview();
        }).catch(function (err) {
            if (err && err.message === 'empty') toast(tr('pdfNeed'));
            else toast(tr('pdfFail'));
        });
    }
    function finalizeSelectedEntries() {
        var chosen = selectedEntries();
        if (!chosen.length) { toast(tr('selectedEmpty')); return; }
        var list = chosen.filter(function (e) {
            return !e.readOnlyOrigin && e.source === 'archive' && !e.deletedAt && !e.protected;
        });
        if (!list.length) { toast(tr('finalizeArchiveOnly')); return; }
        if (!confirm(tr('finalizeConfirm', { n: String(list.length) }))) return;
        toast(tr('finalizeBusy', { n: String(list.length) }));
        var ok = 0;
        var fail = 0;
        list.reduce(function (promise, entry) {
            return promise.then(function () {
                return ensureFinalPdfs(entry).then(function () { ok += 1; }).catch(function () { fail += 1; });
            });
        }, Promise.resolve()).then(function () {
            renderTree();
            renderList();
            renderPreview();
            if (fail) toast(tr('finalizePartial', { ok: String(ok), fail: String(fail) }));
            else toast(tr('finalizeOk', { n: String(ok) }));
        }).catch(function () {
            toast(tr('pdfFail'));
        });
    }
    function runAction(act, e) {
        if (act === 'gdocs') {
            openEntryInGoogleDocs(e);
            return;
        }
        if (act === 'open') {
            if (e.deletedAt) return;
            if (e.concluded) {
                if (!confirm(tr('confirmOpenFinal'))) return;
                if (applyToEditor(e.html, e.name, false, true)) toast(tr('openedFinalHint'));
                return;
            }
            if (e.protected) {
                if (applyToEditor(e.html, e.name, false, true)) toast(tr('protectedOpened'));
                return;
            }
            if (applyToEditor(e.html, e.name, false, false, e.id)) toast(tr('opened'));
            return;
        }
        if (act === 'trash') {
            moveDraftsToTrash([e], true);
            return;
        }
        if (act === 'restore') {
            restoreTrashedEntries([e]);
            return;
        }
        if (act === 'protect') {
            toggleEntryProtection(e);
            return;
        }
        if (act === 'copy') {
            if (applyToEditor(e.html, (lang() === 'fr-FR' ? 'Copie — ' : 'Cópia — ') + e.name, true)) toast(tr('copied'));
            return;
        }
        if (act === 'copy-rel') {
            var rel = extractPart(e.html, 'relatorio');
            if (!rel) { toast(tr('needBlock')); return; }
            if (applyToEditor(rel, (lang() === 'fr-FR' ? 'Modèle rapport — ' : 'Modelo relatório — ') + e.name, true)) toast(tr('copied'));
            return;
        }
        if (act === 'copy-orc') {
            var orc = extractPart(e.html, 'devis');
            if (!orc) { toast(tr('needBlock')); return; }
            if (applyToEditor(orc, (lang() === 'fr-FR' ? 'Modèle devis — ' : 'Modelo orçamento — ') + e.name, true)) toast(tr('copied'));
            return;
        }
        if (act === 'copy-rec') {
            var rec = extractPart(e.html, 'receipt');
            if (!rec) { toast(tr('needBlock')); return; }
            if (applyToEditor(rec, (lang() === 'fr-FR' ? 'Modèle reçu — ' : 'Modelo recibo — ') + e.name, true)) toast(tr('copied'));
            return;
        }
        if (act === 'dl') {
            downloadHtml(e.name, e.html);
            return;
        }
        if (act === 'final-relatorio') { gravarFinal(e, 'relatorio'); return; }
        if (act === 'final-orcamento') { gravarFinal(e, 'orcamento'); return; }
        if (act === 'final-recibo') { gravarFinal(e, 'recibo'); return; }
        if (act === 'toggle' && !e.readOnlyOrigin && !e.concluded) {
            concludeWithPdfs(e);
            return;
        }
        if (act === 'meta' && !e.readOnlyOrigin) {
            var client = (document.getElementById('arqEditClient') || {}).value || '';
            var pasta = (document.getElementById('arqEditPasta') || {}).value || '';
            var documentDate = normalizeEntryDate((document.getElementById('arqEditDate') || {}).value || '');
            var periodKind = normalizePeriodKind((document.getElementById('arqEditPeriodKind') || {}).value || e.periodKind || 'day');
            var period = periodBounds(periodKind, (document.getElementById('arqEditPeriodValue') || {}).value || e.periodValue || documentDate || todayIso());
            var list2 = loadStore();
            list2.forEach(function (item) {
                if (item.id === e.id) {
                    item.client = String(client).trim();
                    item.pasta = String(pasta).trim();
                    item.documentDate = documentDate || item.documentDate || normalizeEntryDate(item.archivedAt);
                    item.periodKind = period.kind;
                    item.periodValue = period.value;
                    item.periodStart = period.start;
                    item.periodEnd = period.end;
                }
            });
            if (saveStore(list2)) {
                rememberFolder('client', String(client).trim(), '');
                rememberFolder('pasta', String(pasta).trim(), String(client).trim());
                if (String(client).trim() && String(pasta).trim()) state.folder = 'clientpasta:' + String(client).trim() + '|' + String(pasta).trim();
                else if (String(client).trim()) state.folder = 'client:' + String(client).trim();
                else if (String(pasta).trim()) state.folder = 'pasta:' + String(pasta).trim();
                else state.folder = 'all';
                renderTree();
                renderList();
                renderPreview();
            }
        }
    }

    function openEntryInGoogleDocs(entry) {
        if (!entry || entry.deletedAt) return false;
        if (navigator.onLine === false) {
            toast(tr('gdocsOffline'));
            return false;
        }
        var fileId = String(entry.gdocsFileId || '').replace(/[^a-zA-Z0-9_-]/g, '');
        if (fileId) {
            window.open('https://docs.google.com/document/d/' + fileId + '/edit', '_blank', 'noopener,noreferrer');
            return true;
        }
        if (typeof window.abeneOpenInGoogleDocs !== 'function') return false;
        if (entry.source === 'current' || entry.id === 'current') {
            closeArquivo();
            window.abeneOpenInGoogleDocs();
            return true;
        }
        var asCopy = !!(entry.concluded || entry.protected || entry.readOnlyOrigin);
        var prefix = lang() === 'fr-FR' ? 'Copie — ' : (lang() === 'en-US' ? 'Copy — ' : (lang() === 'es-ES' ? 'Copia — ' : 'Cópia — '));
        var opened = applyToEditor(entry.html, (asCopy ? prefix : '') + entry.name, asCopy, false, asCopy ? '' : entry.id);
        if (!opened) return false;
        closeArquivo();
        if (asCopy) toast(tr('gdocsCopyNotice'));
        window.abeneOpenInGoogleDocs();
        return true;
    }
    function refreshArquivoIfOpen() {
        var el = document.getElementById('arqOverlay');
        if (!el || !el.classList.contains('open')) return;
        renderTree();
        renderList();
        renderPreview();
    }
    function upsertArchiveEntry(entry) {
        var list = loadStore();
        var existing = list.filter(function (e) {
            return !e.deletedAt && e.name === entry.name && (e.client || '') === (entry.client || '') && e.type === entry.type;
        })[0];
        if (existing && (existing.concluded || existing.protected)) existing = null;
        if (existing) {
            existing.html = entry.html;
            existing.concluded = entry.concluded;
            existing.pasta = entry.pasta || existing.pasta;
            existing.nif = entry.nif || existing.nif;
            existing.archivedAt = entry.archivedAt;
            existing.number = entry.number;
            existing.total = entry.total;
            existing.documentDate = entry.documentDate || existing.documentDate;
            existing.periodKind = entry.periodKind || existing.periodKind || 'day';
            existing.periodValue = entry.periodValue || existing.periodValue || entry.documentDate || normalizeEntryDate(entry.archivedAt);
            var existingPeriod = periodBounds(existing.periodKind, existing.periodValue);
            existing.periodStart = existingPeriod.start;
            existing.periodEnd = existingPeriod.end;
            existing.hasDevis = entry.hasDevis;
            existing.hasReceipt = entry.hasReceipt;
            existing.hasReport = entry.hasReport;
            // Preserve / update Google Docs link (same Doc per Arquivo entry).
            if (Object.prototype.hasOwnProperty.call(entry, 'gdocsFileId')) {
                existing.gdocsFileId = entry.gdocsFileId || '';
                existing.gdocsUrl = entry.gdocsUrl || '';
            } else if (!existing.gdocsFileId && entry.gdocsFileId) {
                existing.gdocsFileId = entry.gdocsFileId;
                existing.gdocsUrl = entry.gdocsUrl || '';
            }
            state.selectedId = existing.id;
        } else {
            list.unshift(entry);
            state.selectedId = entry.id;
        }
        if (!saveStore(list)) return null;
        rememberFolder('client', entry.client, '');
        rememberFolder('pasta', entry.pasta, entry.client);
        lastArchivePdfPromise = copyFinals(currentPdfOwnerId(), state.selectedId);
        lastArchivePdfPromise.catch(function () {});
        return state.selectedId;
    }
    function archiveCurrent(opts) {
        opts = opts || {};
        var snap = currentSnapshot();
        var meta = detectMeta(snap.html);
        var job = loadLastJob();
        var clientDef = String(opts.client || snap.client || meta.client || job.client || '').trim();
        var pastaDef = String(opts.pasta || snap.pasta || meta.pasta || pastaHint(clientDef) || job.pasta || '').trim();
        var client = clientDef;
        var pasta = pastaDef;
        var concluded;
        if (opts.silent) {
            if (!pasta) pasta = String(snap.name || 'Documento').trim();
            concluded = opts.concluded === true;
        } else if (opts.fromPanel) {
            client = String(opts.client != null ? opts.client : clientDef).trim();
            pasta = String(opts.pasta != null ? opts.pasta : pastaDef).trim();
            if (!pasta) pasta = String(snap.name || 'Documento').trim();
            concluded = opts.concluded != null ? !!opts.concluded : false;
        } else {
            openArchivePanel();
            return null;
        }
        var ds = docState() || {};
        var period = periodBounds(opts.periodKind || 'day', opts.periodValue || meta.documentDate || todayIso());
        var entry = {
            id: uid(),
            name: snap.name,
            html: snap.html,
            type: meta.type,
            client: String(client || meta.client || '').trim(),
            pasta: String(pasta || '').trim(),
            nif: String(opts.nif || meta.nif || job.nif || '').trim(),
            number: meta.number,
            total: meta.total,
            documentDate: meta.documentDate,
            periodKind: period.kind,
            periodValue: period.value,
            periodStart: period.start,
            periodEnd: period.end,
            concluded: !!concluded,
            protected: !concluded && !!snap.protected,
            protectedAt: (!concluded && snap.protected) ? new Date().toISOString() : '',
            archivedAt: new Date().toISOString(),
            hasDevis: meta.hasDevis,
            hasReceipt: meta.hasReceipt,
            hasReport: meta.hasReport,
            gdocsFileId: ds.gdocsFileId || '',
            gdocsUrl: ds.gdocsUrl || ''
        };
        var boundId = upsertArchiveEntry(entry);
        if (!boundId) return null;
        // Keep the open document bound to this Arquivo entry so later Guardar updates the same ficha.
        try {
            if (ds) ds.archiveEntryId = boundId;
        } catch (eBind) {}
        try {
            if (typeof window.abeneDocumentSyncOnDocChange === 'function') window.abeneDocumentSyncOnDocChange();
        } catch (eSyncBind) {}
        saveLastJob({ client: entry.client, pasta: entry.pasta, nif: entry.nif });
        if (!opts.silent) {
            var cLabel = entry.client || tr('noClient');
            var pLabel = entry.pasta || tr('none');
            state.folder = 'clientpasta:' + cLabel + '|' + pLabel;
            toast(tr('archivedAuto', { client: cLabel, pasta: pLabel }));
        }
        refreshArquivoIfOpen();
        return state.selectedId;
    }
    function downloadEntries(list, label) {
        list = list || [];
        if (!list.length) { toast(tr('zipEmpty')); return; }
        var csvHdr = ['Nome', 'Tipo', 'Concluido', 'Cliente', 'Pasta', 'Numero', 'Total', 'Tipo_periodo', 'Periodo', 'Inicio_periodo', 'Fim_periodo', 'Data_documento', 'Data_arquivo'].join(';');
        var csv = '\uFEFF' + csvHdr + '\r\n' + list.map(function (e) {
            var p = entryPeriod(e);
            return [e.name, e.type, e.concluded ? 'sim' : 'nao', e.client, e.pasta, e.number, e.total,
                p.kind, p.value, p.start, p.end, entryDate(e), normalizeEntryDate(e.archivedAt)]
                .map(csvEsc).join(';');
        }).join('\r\n');
        if (!window.JSZip) {
            toast(tr('noZip'));
            downloadHtml('indice-arquivo', '<pre>' + csv.replace(/^﻿/, '') + '</pre>');
            list.forEach(function (e) { downloadHtml(archiveFileBase(e), e.html); });
            return;
        }
        var zip = new window.JSZip();
        zip.file('indice.csv', csv);
        list.forEach(function (e) {
            var folder = [e.client || tr('noClient'), e.pasta || tr('none'), entryPeriod(e).value || 'Sem_periodo', typeLabel(e.type)]
                .map(sanitizeName).join('/');
            zip.file(folder + '/' + archiveFileBase(e) + '.html',
                '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' + cleanArchiveHtml(e.html) + '</body></html>');
        });
        Promise.all(list.map(function (e) {
            var folder = [e.client || tr('noClient'), e.pasta || tr('none'), entryPeriod(e).value || 'Sem_periodo', typeLabel(e.type)]
                .map(sanitizeName).join('/');
            return listFinals(ownerIdOf(e)).then(function (rows) {
                rows.forEach(function (r) {
                    if (!r.blob) return;
                    zip.file(folder + '/' + archiveFileBase(e) + '_' + r.etape + '_v' + r.rev + '.pdf', r.blob);
                });
            });
        })).then(function () {
            return zip.generateAsync({ type: 'blob' });
        }).then(function (blob) {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            var brand = ((typeof window.abeneBrandName === 'function') ? window.abeneBrandName() : 'Genius Raros').replace(/\s+/g, '-');
            a.download = brand + '-' + sanitizeName(label || 'Arquivo') + '-' + new Date().toISOString().slice(0, 10) + '.zip';
            a.click();
            URL.revokeObjectURL(a.href);
            toast(tr('zipOk', { n: String(list.length) }));
        }).catch(function () { toast(tr('quota')); });
    }
    function downloadSet() {
        downloadEntries(visibleEntries(), 'Arquivo');
    }
    function openArquivo() {
        ensureDom();
        fillChrome();
        if (typeof closeAllDropdowns === 'function') closeAllDropdowns();
        if (typeof closeImageToolbar === 'function') closeImageToolbar();
        document.getElementById('arqOverlay').classList.add('open');
        try { document.body.classList.add('abene-arq-open'); } catch (eOpen) {}
        if (isMobileArchive()) {
            state.toolsCollapsed = true;
            setToolsCollapsed(true);
            /* Fix #7c: preserve last pane on reopen (was always Pastas). */
            setMobilePane(state.mobilePane || 'folders');
        } else {
            setToolsCollapsed(false);
            syncMobileChrome();
        }
        renderTree();
        renderList();
        renderPreview();
        var listEl = document.getElementById('arqList');
        if (listEl) listEl.focus();
        try {
            if (typeof window.abeneArquivoOnOpen === 'function') window.abeneArquivoOnOpen(isMobileArchive());
        } catch (eHook) {}
    }
    function closeArquivo() {
        revokePdfPreview();
        var el = document.getElementById('arqOverlay');
        if (el) el.classList.remove('open');
        try { document.body.classList.remove('abene-arq-open'); } catch (eClose) {}
        try {
            if (typeof window.abeneArquivoOnClose === 'function') window.abeneArquivoOnClose();
        } catch (eHook2) {}
    }

    function openEntryById(entryId) {
        entryId = String(entryId || '');
        var exists = allEntries().concat(trashedEntries()).some(function (entry) {
            return String(entry.id || '') === entryId;
        });
        if (!exists) {
            openArquivo();
            return false;
        }
        state.folder = 'all';
        state.selectedId = entryId;
        state.previewTab = 'doc';
        state.selectedPdfId = null;
        openArquivo();
        if (isMobileArchive()) setMobilePane('preview');
        return true;
    }

    function markSentToClient(meta) {
        meta = meta || {};
        var list = loadStore();
        var touched = false;
        var num = String(meta.number || '').trim();
        var client = String(meta.client || '').trim().toLowerCase();
        list.forEach(function (item) {
            if (item.deletedAt) return;
            if (item.concluded) return;
            var matchNum = num && String(item.number || '') === num;
            var matchClient = client && String(item.client || '').toLowerCase() === client;
            if (matchNum || (matchClient && !num)) {
                item.sentToClient = true;
                item.sentAt = new Date().toISOString();
                touched = true;
            }
        });
        var snap = currentSnapshot();
        if (!touched) {
            list.unshift({
                id: 'sent-' + Date.now(),
                name: (docState() && docState().name) || snap.name,
                html: snap.html,
                type: snap.type,
                client: meta.client || snap.client,
                pasta: snap.pasta,
                nif: snap.nif,
                number: meta.number || snap.number,
                total: snap.total,
                documentDate: snap.documentDate,
                periodKind: entryPeriod(snap).kind,
                periodValue: entryPeriod(snap).value,
                periodStart: entryPeriod(snap).start,
                periodEnd: entryPeriod(snap).end,
                concluded: false,
                protected: !!snap.protected,
                protectedAt: snap.protected ? new Date().toISOString() : '',
                sentToClient: true,
                sentAt: new Date().toISOString(),
                archivedAt: new Date().toISOString(),
                hasDevis: snap.hasDevis,
                hasReceipt: snap.hasReceipt,
                hasReport: snap.hasReport
            });
            touched = true;
        }
        if (touched && saveStore(list)) {
            toast(tr('sentMarked'));
            try {
                if (docState()) docState().sentToClient = true;
            } catch (eD) {}
        }
        return touched;
    }

    function base64PdfBlob(value, mimeType) {
        var raw = String(value || '');
        var comma = raw.indexOf(',');
        if (comma >= 0) raw = raw.slice(comma + 1);
        var binary = atob(raw);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        return new Blob([bytes], { type: mimeType || 'application/pdf' });
    }

    function finalizeSentToClient(meta) {
        meta = meta || {};
        var list = loadStore();
        var boundId = String((docState() && docState().archiveEntryId) || '');
        var num = String(meta.number || '').trim();
        var client = String(meta.client || '').trim().toLowerCase();
        var entry = list.filter(function (item) {
            return item && !item.deletedAt && boundId && String(item.id || '') === boundId;
        })[0] || list.filter(function (item) {
            return item && !item.deletedAt && num && String(item.number || '') === num;
        })[0] || list.filter(function (item) {
            return item && !item.deletedAt && client && String(item.client || '').toLowerCase() === client;
        })[0];

        if (!entry) {
            archiveCurrent({
                silent: true,
                concluded: false,
                client: meta.client || '',
                pasta: meta.pasta || ''
            });
            list = loadStore();
            boundId = String((docState() && docState().archiveEntryId) || '');
            entry = list.filter(function (item) { return item && String(item.id || '') === boundId; })[0];
        }
        if (!entry) {
            toast(tr('sentFinalFailed'));
            return Promise.resolve(false);
        }

        entry.sentToClient = true;
        entry.sentAt = new Date().toISOString();
        if (!saveStore(list)) {
            toast(tr('sentFinalFailed'));
            return Promise.resolve(false);
        }

        var attachment = meta.attachment || {};
        var etape = meta.kind === 'devis' ? 'orcamento' : (meta.kind === 'receipt' ? 'recibo' : 'relatorio');
        var blob;
        try {
            blob = base64PdfBlob(attachment.data, attachment.mimeType);
        } catch (eBlob) {
            toast(tr('sentFinalFailed'));
            return Promise.resolve(false);
        }
        if (!blob.size || blob.type !== 'application/pdf') {
            toast(tr('sentFinalFailed'));
            return Promise.resolve(false);
        }

        return listFinals(ownerIdOf(entry)).then(function (rows) {
            var same = rows.filter(function (row) { return row.etape === etape; });
            var lastRev = same.length ? Math.max.apply(null, same.map(function (row) { return Number(row.rev) || 0; })) : 0;
            var rec = {
                id: ownerIdOf(entry) + ':' + etape + ':v' + (lastRev + 1),
                ownerId: ownerIdOf(entry),
                etape: etape,
                rev: lastRev + 1,
                number: entry.number || num,
                name: entry.name || attachment.name || '',
                createdAt: new Date().toISOString(),
                bytes: blob.size,
                blob: blob,
                client: entry.client || meta.client || '',
                pasta: entry.pasta || meta.pasta || '',
                type: entry.type || '',
                periodKind: entryPeriod(entry).kind,
                periodValue: entryPeriod(entry).value,
                periodStart: entryPeriod(entry).start,
                periodEnd: entryPeriod(entry).end,
                concluded: true
            };
            return putFinal(rec).then(function () { return syncFinalToDrive(rec, entry); });
        }).then(function () {
            list = loadStore();
            list.forEach(function (item) {
                if (item.id !== entry.id) return;
                item.concluded = true;
                item.protected = false;
                item.protectedAt = '';
                item.concludedAt = new Date().toISOString();
                item.sentToClient = true;
                item.sentAt = entry.sentAt;
            });
            if (!saveStore(list)) throw new Error('archive-save');
            try {
                if (docState()) docState().sentToClient = true;
            } catch (eState) {}
            refreshArquivoIfOpen();
            toast(tr('sentFinalMarked'));
            return true;
        }).catch(function () {
            toast(tr('sentFinalFailed'));
            return false;
        });
    }

    window.openArquivoWindow = openArquivo;
    window.abeneArquivoOpenEntry = openEntryById;
    window.closeArquivoWindow = closeArquivo;
    window.abeneArquivoMobileBack = mobileBack;
    window.abeneArquivoSetMobilePane = setMobilePane;
    window.abeneArquivoIsMobile = isMobileArchive;
    window.abeneArquivoArchive = function (opts) { return archiveCurrent(opts || { silent: true }); };
    window.abeneArquivoApi = {
        getEntryGdocsLink: function (entryId) {
            entryId = String(entryId || '');
            if (!entryId) return null;
            var list = loadStore();
            var entry = list.filter(function (item) { return item && String(item.id || '') === entryId; })[0];
            if (!entry || !entry.gdocsFileId) return null;
            return {
                id: String(entry.gdocsFileId),
                url: entry.gdocsUrl || ('https://docs.google.com/document/d/' + entry.gdocsFileId + '/edit')
            };
        },
        persistGdocsLink: function (entryId, fileId, url) {
            entryId = String(entryId || '');
            if (!entryId) return false;
            var list = loadStore();
            var entry = list.filter(function (item) { return item && String(item.id || '') === entryId; })[0];
            if (!entry || entry.deletedAt) return false;
            entry.gdocsFileId = String(fileId || '').replace(/[^a-zA-Z0-9_-]/g, '');
            entry.gdocsUrl = entry.gdocsFileId
                ? (url || ('https://docs.google.com/document/d/' + entry.gdocsFileId + '/edit'))
                : '';
            entry.updatedAt = new Date().toISOString();
            if (!saveStore(list)) return false;
            refreshArquivoIfOpen();
            return true;
        },
        saveOpenedDocument: function (html, name) {
            var id = docState().archiveEntryId;
            if (!id) return;
            var list = loadStore();
            var entry = list.filter(function (item) { return item.id === id; })[0];
            if (!entry || entry.deletedAt || entry.protected || entry.concluded || entry.readOnlyOrigin) return;
            var clean = cleanArchiveHtml(html);
            var linkId = docState().gdocsFileId || '';
            if (entry.html === clean && entry.name === name && (entry.gdocsFileId || '') === linkId) return;
            localStorage.setItem('abeneArchiveBeforeSave', JSON.stringify(entry));
            entry.html = clean;
            entry.name = name || entry.name;
            entry.gdocsFileId = linkId;
            entry.gdocsUrl = docState().gdocsUrl || '';
            entry.updatedAt = new Date().toISOString();
            if (!saveStore(list)) throw new Error('Não foi possível atualizar o documento no Arquivo.');
            refreshArquivoIfOpen();
        },
        visibleEntries: function () { return visibleEntries(); },
        allEntries: function () { return allEntries(); },
        entryPeriod: function (entry) { return entryPeriod(entry); },
        trashedEntries: function () { return trashedEntries(); },
        currentSnapshot: currentSnapshot,
        listFinals: listFinals,
        gravarEtape: gravarEtape,
        ownerIdOf: ownerIdOf,
        sanitizeName: sanitizeName,
        archiveFileBase: archiveFileBase,
        catalogFolders: loadFolders,
        rememberFolder: rememberFolder,
        archiveCurrent: archiveCurrent,
        waitForArchivePdfs: function () { return lastArchivePdfPromise; },
        lastJob: loadLastJob,
        saveLastJob: saveLastJob,
        markSentToClient: markSentToClient,
        finalizeSentToClient: finalizeSentToClient,
        mobileBack: mobileBack,
        setMobilePane: setMobilePane,
        isMobileArchive: isMobileArchive
    };
    window.addEventListener('abene:languagechange', function () {
        var overlay = document.getElementById('arqOverlay');
        if (!overlay) return;
        fillChrome();
        renderTree();
        renderList();
        renderPreview();
    });
    window.addEventListener('online', function () { retryUnsyncedFinals(); });
    setTimeout(function () { retryUnsyncedFinals(); }, 1600);
})();
