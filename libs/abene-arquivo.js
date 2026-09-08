/* Genius Raros — janela Arquivo (independente do editor Word).
   Não altera Guardar / autosave / versões / modelos existentes.
   Cópia só de leitura: o documento em curso não é tocado ao consultar. */
(function () {
    var STORE = 'abeneArquivoV1';
    var FOLDERS_STORE = 'abeneArquivoFoldersV1';
    var LAST_JOB = 'abeneLastJobV1';
    var NAVY = '#0B1223';
    var GOLD = '#C9A84C';
    var state = {
        folder: 'all',
        query: '',
        type: 'all',
        concludedOnly: false,
        selectedId: null,
        previewSource: null
    };

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
            all: 'Todos',
            done: 'Concluídos',
            byType: 'Por tipo',
            byClient: 'Por cliente',
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
            archived: 'Arquivado',
            confirmOpen: 'Abrir este documento no editor substitui o conteúdo visível. O arquivo e o Guardar automático não são apagados. Continuar?',
            confirmCopy: 'Copiar este modelo para o editor substitui o conteúdo visível (cópia nova). O arquivo original fica intacto. Continuar?',
            pastaPh: 'Ex.: Cozinha Rua das Flores 12',
            clientPh: 'Nome do cliente',
            archivedOk: 'Cópia guardada no arquivo. O documento no editor não foi alterado.',
            quota: 'Arquivo cheio (limite do browser). Exporte um ZIP e continue.',
            copied: 'Modelo copiado para o editor. O original no arquivo ficou intacto.',
            opened: 'Documento aberto no editor. A cópia no arquivo ficou intacta.',
            zipOk: 'Conjunto descarregado ({n} ficheiro(s)).',
            zipEmpty: 'Nada a descarregar nesta vista.',
            packOk: 'Pack contabilista PT descarregado ({n} documento(s)).',
            packEmpty: 'Não há orçamento nem recibo nesta vista para o contabilista.',
            noZip: 'JSZip indisponível — a descarregar HTML um a um.',
            needBlock: 'Este documento não tem essa parte para copiar.',
            none: 'Sem pasta',
            noClient: 'Sem cliente',
            newClient: 'Novo cliente',
            newPasta: 'Nova pasta / obra',
            folderOk: 'Pasta criada. Será copiada para o Google Drive na próxima sincronização.',
            openDrive: 'Abrir no Drive',
            archiveConfirm: 'Arquivar em {client} / {pasta}?',
            archivedAuto: 'Arquivado em {client} / {pasta}.'
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
            all: 'Tous',
            done: 'Conclus',
            byType: 'Par type',
            byClient: 'Par client',
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
            archived: 'Archivé',
            confirmOpen: 'Ouvrir ce document dans l’éditeur remplace le contenu visible. L’archive et l’enregistrement auto ne sont pas effacés. Continuer ?',
            confirmCopy: 'Copier ce modèle dans l’éditeur remplace le contenu visible (nouvelle copie). L’original dans l’archive reste intact. Continuer ?',
            pastaPh: 'Ex. : Cuisine Rue des Fleurs 12',
            clientPh: 'Nom du client',
            archivedOk: 'Copie enregistrée dans l’archive. Le document dans l’éditeur n’a pas changé.',
            quota: 'Archive pleine (limite du navigateur). Exportez un ZIP puis continuez.',
            copied: 'Modèle copié dans l’éditeur. L’original dans l’archive est intact.',
            opened: 'Document ouvert dans l’éditeur. La copie dans l’archive est intacte.',
            zipOk: 'Ensemble téléchargé ({n} fichier(s)).',
            zipEmpty: 'Rien à télécharger dans cette vue.',
            packOk: 'Pack comptable PT téléchargé ({n} document(s)).',
            packEmpty: 'Aucun devis ni reçu dans cette vue pour le comptable.',
            noZip: 'JSZip indisponible — téléchargement HTML un par un.',
            needBlock: 'Ce document n’a pas cette partie à copier.',
            none: 'Sans dossier',
            noClient: 'Sans client',
            newClient: 'Nouveau client',
            newPasta: 'Nouveau dossier / chantier',
            folderOk: 'Dossier créé. Il sera copié vers Google Drive à la prochaine synchro.',
            openDrive: 'Ouvrir dans Drive',
            archiveConfirm: 'Archiver dans {client} / {pasta} ?',
            archivedAuto: 'Archivé dans {client} / {pasta}.'
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
            all: 'All',
            done: 'Concluded',
            byType: 'By type',
            byClient: 'By client',
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
            archived: 'Archived',
            confirmOpen: 'Opening this document in the editor replaces the visible content. The archive and autosave are not deleted. Continue?',
            confirmCopy: 'Copying this template into the editor replaces the visible content (new copy). The archive original stays intact. Continue?',
            pastaPh: 'e.g. Kitchen 12 Flower Street',
            clientPh: 'Client name',
            archivedOk: 'Copy stored in the archive. The editor document was not changed.',
            quota: 'Archive full (browser limit). Download a ZIP first.',
            copied: 'Template copied into the editor. The archive original is intact.',
            opened: 'Document opened in the editor. The archive copy is intact.',
            zipOk: 'Set downloaded ({n} file(s)).',
            zipEmpty: 'Nothing to download in this view.',
            packOk: 'PT accounting pack downloaded ({n} document(s)).',
            packEmpty: 'No quote or receipt in this view for the accountant.',
            noZip: 'JSZip unavailable — downloading HTML one by one.',
            needBlock: 'This document does not have that part to copy.',
            none: 'No folder',
            noClient: 'No client',
            newClient: 'New client',
            newPasta: 'New job folder',
            folderOk: 'Folder created. It will be copied to Google Drive on the next sync.',
            openDrive: 'Open in Drive',
            archiveConfirm: 'Archive to {client} / {pasta}?',
            archivedAuto: 'Archived in {client} / {pasta}.'
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
            all: 'Todos',
            done: 'Concluidos',
            byType: 'Por tipo',
            byClient: 'Por cliente',
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
            archived: 'Archivado',
            confirmOpen: 'Abrir este documento en el editor sustituye el contenido visible. El archivo y el autoguardado no se borran. ¿Continuar?',
            confirmCopy: 'Copiar este modelo al editor sustituye el contenido visible (copia nueva). El original en el archivo queda intacto. ¿Continuar?',
            pastaPh: 'Ej.: Cocina Rua das Flores 12',
            clientPh: 'Nombre del cliente',
            archivedOk: 'Copia guardada en el archivo. El documento del editor no cambió.',
            quota: 'Archivo lleno (límite del navegador). Descargue un ZIP primero.',
            copied: 'Modelo copiado al editor. El original en el archivo quedó intacto.',
            opened: 'Documento abierto en el editor. La copia en el archivo quedó intacta.',
            zipOk: 'Conjunto descargado ({n} fichero(s)).',
            zipEmpty: 'Nada que descargar en esta vista.',
            packOk: 'Pack contable PT descargado ({n} documento(s)).',
            packEmpty: 'No hay presupuesto ni recibo en esta vista para el contable.',
            noZip: 'JSZip no disponible — descarga HTML uno a uno.',
            needBlock: 'Este documento no tiene esa parte para copiar.',
            none: 'Sin carpeta',
            noClient: 'Sin cliente',
            newClient: 'Nuevo cliente',
            newPasta: 'Nueva carpeta / obra',
            folderOk: 'Carpeta creada. Se copiará a Google Drive en la próxima sincronización.',
            openDrive: 'Abrir en Drive',
            archiveConfirm: '¿Archivar en {client} / {pasta}?',
            archivedAuto: 'Archivado en {client} / {pasta}.'
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
        var name = window.prompt(tr('client'), '');
        if (name === null) return;
        name = String(name).trim();
        if (!name) return;
        rememberFolder('client', name, '');
        toast(tr('folderOk'));
        renderTree();
    }
    function createPastaFolder() {
        var client = window.prompt(tr('client'), '');
        if (client === null) return;
        var pasta = window.prompt(tr('pasta'), '');
        if (pasta === null) return;
        client = String(client).trim();
        pasta = String(pasta).trim();
        if (!pasta) return;
        if (client) rememberFolder('client', client, '');
        rememberFolder('pasta', pasta, client);
        toast(tr('folderOk'));
        renderTree();
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

    var IDB_NAME = 'abeneFinalPdf';
    var IDB_STORE = 'finals';
    var pdfPreviewUrl = '';

    function ownerIdOf(entry) {
        if (!entry) return '';
        if (entry.id === 'current') return 'live';
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
                        blob: rec.blob
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
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: fmt, orientation: ori === 'landscape' ? 'landscape' : 'portrait' }
        };
    }
    function htmlToPdfBlob(html) {
        return new Promise(function (resolve, reject) {
            if (!window.html2pdf) {
                reject(new Error('nolib'));
                return;
            }
            var host = document.createElement('div');
            host.setAttribute('data-arq-pdf-host', '1');
            var hostW = (window.PageGeometry && window.PageGeometry.width) || 794;
            host.style.cssText = 'position:fixed;left:-14000px;top:0;width:' + hostW + 'px;background:#fff;color:#1a1a1a;font-family:Calibri,Segoe UI,sans-serif;padding:8px;';
            host.innerHTML = html || '<p></p>';
            document.body.appendChild(host);
            var worker = window.html2pdf().set(pdfOptions()).from(host);
            var done = function (blob) {
                if (host.parentNode) host.parentNode.removeChild(host);
                if (blob) resolve(blob);
                else reject(new Error('empty'));
            };
            var fail = function (err) {
                if (host.parentNode) host.parentNode.removeChild(host);
                reject(err);
            };
            if (typeof worker.outputPdf === 'function') {
                Promise.resolve(worker.outputPdf('blob')).then(done).catch(function () {
                    worker.toPdf().get('pdf').then(function (pdf) { return pdf.output('blob'); }).then(done).catch(fail);
                });
            } else {
                worker.toPdf().get('pdf').then(function (pdf) { return pdf.output('blob'); }).then(done).catch(fail);
            }
        });
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
        var pasta = String(pay.site || pay.pasta || '').trim();
        var nif = String(pay.clientNif || pay.payerNif || (devis && devis.getAttribute('data-abene-nif')) || '').trim();
        return {
            type: type,
            client: String(client || '').trim(),
            pasta: pasta,
            nif: nif,
            number: String(number || '').trim(),
            total: String(total || '').trim(),
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
    function uid() {
        return 'arq-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }
    function currentSnapshot() {
        var editor = editorEl();
        var html = editor ? editor.innerHTML : '';
        var name = docState().name || localStorage.getItem('abeneDocName') || 'Documento1';
        var meta = detectMeta(html);
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
            concluded: false,
            archivedAt: new Date().toISOString(),
            hasDevis: meta.hasDevis,
            hasReceipt: meta.hasReceipt,
            hasReport: meta.hasReport,
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

    function allEntries() {
        return loadStore().map(function (e) {
            e.source = 'archive';
            e.readOnlyOrigin = false;
            return e;
        });
    }
    function visibleEntries() {
        var folder = state.folder;
        var list;
        if (folder.indexOf('draft:') === 0) {
            if (folder === 'draft:current') list = [currentSnapshot()];
            else list = versionSnapshots();
        } else {
            list = allEntries();
        }
        var q = (state.query || '').trim().toLowerCase();
        return list.filter(function (e) {
            if (state.concludedOnly && !e.concluded) return false;
            if (state.type !== 'all' && e.type !== state.type) return false;
            if (folder === 'done' && !e.concluded) return false;
            if (folder.indexOf('type:') === 0 && e.type !== folder.slice(5)) return false;
            if (folder.indexOf('client:') === 0 && (e.client || tr('noClient')) !== folder.slice(7)) return false;
            if (folder.indexOf('pasta:') === 0 && (e.pasta || tr('none')) !== folder.slice(6)) return false;
            if (folder.indexOf('year:') === 0 && String(e.archivedAt || '').slice(0, 4) !== folder.slice(5)) return false;
            if (folder.indexOf('month:') === 0 && String(e.archivedAt || '').slice(0, 7) !== folder.slice(6)) return false;
            if (q) {
                var blob = [e.name, e.client, e.pasta, e.number, e.type, typeLabel(e.type)].join(' ').toLowerCase();
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
        if (document.getElementById('arq-css')) return;
        var css = document.createElement('style');
        css.id = 'arq-css';
        css.textContent =
            '#arqOverlay{position:fixed;inset:0;z-index:2600;display:none;flex-direction:column;background:#f3f4f6;color:#1a1a1a;font-family:Calibri,Segoe UI,sans-serif;}' +
            '#arqOverlay.open{display:flex;}' +
            '.arq-top{background:' + NAVY + ';color:#fff;padding:12px 16px;display:flex;align-items:center;gap:12px;}' +
            '.arq-top h2{margin:0;font-size:16px;font-weight:700;letter-spacing:.02em;}' +
            '.arq-top p{margin:2px 0 0;font-size:12px;color:#cbd5e1;}' +
            '.arq-top .arq-gold{width:8px;height:28px;background:' + GOLD + ';flex:none;}' +
            '.arq-top-actions{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap;}' +
            '.arq-btn{border:1px solid #c5c5c5;background:#fff;color:#1a1a1a;padding:6px 10px;font-size:12px;cursor:pointer;border-radius:3px;}' +
            '.arq-btn:hover{background:#e8f0fe;}' +
            '.arq-btn.primary{background:' + NAVY + ';color:#fff;border-color:' + NAVY + ';}' +
            '.arq-btn.gold{background:' + GOLD + ';border-color:' + GOLD + ';color:' + NAVY + ';font-weight:700;}' +
            '.arq-tools{display:flex;gap:8px;align-items:center;padding:8px 16px;background:#fff;border-bottom:1px solid #d9d9d9;flex-wrap:wrap;}' +
            '.arq-tools input,.arq-tools select{border:1px solid #c5c5c5;padding:6px 8px;font-size:12px;min-width:180px;}' +
            '.arq-tools label{font-size:12px;display:flex;align-items:center;gap:6px;}' +
            '.arq-body{flex:1;display:grid;grid-template-columns:240px minmax(240px,1fr) minmax(280px,1.1fr);min-height:0;}' +
            '.arq-col{overflow:auto;background:#fff;border-right:1px solid #e5e5e5;}' +
            '.arq-col h3{margin:0;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#64748b;background:#f8f8f8;border-bottom:1px solid #eee;}' +
            '.arq-tree button,.arq-list button.arq-row{display:block;width:100%;text-align:left;border:0;background:none;padding:7px 12px;font-size:12px;cursor:pointer;}' +
            '.arq-tree button:hover,.arq-list button.arq-row:hover{background:#e8f0fe;}' +
            '.arq-tree button.on,.arq-list button.arq-row.on{background:#dbeafe;font-weight:600;}' +
            '.arq-tree details{padding-left:8px;}' +
            '.arq-tree summary{padding:6px 12px;font-size:12px;cursor:pointer;color:#334155;}' +
            '.arq-row .arq-meta{display:block;font-size:11px;color:#64748b;font-weight:400;}' +
            '.arq-badge{display:inline-block;font-size:10px;padding:1px 6px;border:1px solid #d1d5db;margin-right:4px;border-radius:2px;}' +
            '.arq-badge.done{border-color:#166534;color:#166534;}' +
            '.arq-preview{padding:12px;display:flex;flex-direction:column;gap:8px;min-height:0;}' +
            '.arq-preview iframe{flex:1;min-height:220px;border:1px solid #e5e5e5;background:#fff;width:100%;}' +
            '.arq-preview .arq-actions{display:flex;flex-wrap:wrap;gap:6px;}' +
            '.arq-form{display:grid;gap:6px;font-size:12px;}' +
            '.arq-form input{border:1px solid #c5c5c5;padding:5px 7px;}' +
            '.arq-hint{font-size:11px;color:#64748b;}' +
            '.arq-pdf{border:1px solid #e5e5e5;padding:8px;background:#f8f8f8;}' +
            '.arq-pdf h4{margin:0 0 6px;font-size:12px;}' +
            '.arq-pdf-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:4px 0;border-top:1px solid #eee;font-size:12px;}' +
            '@media(max-width:900px){.arq-body{grid-template-columns:1fr;}}';
        document.head.appendChild(css);
    }
    function ensureDom() {
        if (document.getElementById('arqOverlay')) return;
        injectCss();
        var wrap = document.createElement('div');
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
            '<div class="arq-tools">' +
            '<input type="search" id="arqSearch" />' +
            '<select id="arqType"></select>' +
            '<label><input type="checkbox" id="arqDoneOnly" /> <span id="arqDoneLbl"></span></label>' +
            '<button type="button" class="arq-btn primary" id="arqZipBtn"></button>' +
            '<button type="button" class="arq-btn gold" id="arqPackBtn"></button>' +
            '<button type="button" class="arq-btn" id="arqNewClientBtn"></button>' +
            '<button type="button" class="arq-btn" id="arqNewPastaBtn"></button>' +
            '<button type="button" class="arq-btn gold" id="arqDriveBtn"></button>' +
            '</div>' +
            '<div class="arq-body">' +
            '<div class="arq-col"><h3 id="arqFoldersTitle"></h3><div class="arq-tree" id="arqTree"></div></div>' +
            '<div class="arq-col"><h3 id="arqListTitle"></h3><div class="arq-list" id="arqList"></div></div>' +
            '<div class="arq-col arq-preview" id="arqPreview"></div>' +
            '</div>';
        document.body.appendChild(wrap);
        document.getElementById('arqCloseBtn').onclick = closeArquivo;
        document.getElementById('arqArchiveBtn').onclick = archiveCurrent;
        document.getElementById('arqSearch').oninput = function () {
            state.query = this.value;
            renderList();
        };
        document.getElementById('arqType').onchange = function () {
            state.type = this.value;
            renderList();
        };
        document.getElementById('arqDoneOnly').onchange = function () {
            state.concludedOnly = this.checked;
            renderList();
        };
        document.getElementById('arqZipBtn').onclick = downloadSet;
        document.getElementById('arqPackBtn').onclick = function () {
            if (typeof window.downloadPackContabilista === 'function') window.downloadPackContabilista();
            else toast(tr('packEmpty'));
        };
        document.getElementById('arqNewClientBtn').onclick = createClientFolder;
        document.getElementById('arqNewPastaBtn').onclick = createPastaFolder;
        document.getElementById('arqDriveBtn').onclick = openDriveRoot;
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && wrap.classList.contains('open')) {
                e.preventDefault();
                closeArquivo();
            }
        });
    }
    function fillChrome() {
        document.getElementById('arqTitle').textContent = tr('title');
        document.getElementById('arqSub').textContent = tr('subtitle');
        document.getElementById('arqArchiveBtn').textContent = tr('archiveNow');
        document.getElementById('arqCloseBtn').textContent = tr('close');
        document.getElementById('arqSearch').placeholder = tr('search');
        document.getElementById('arqDoneLbl').textContent = tr('onlyDone');
        document.getElementById('arqZipBtn').textContent = tr('dlSet');
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
    }
    function treeBtn(id, label, extra) {
        var on = state.folder === id ? ' on' : '';
        return '<button type="button" class="' + on + '" data-folder="' + esc(id) + '">' + esc(label) + (extra ? ' <span class="arq-hint">(' + extra + ')</span>' : '') + '</button>';
    }
    function renderTree() {
        var items = allEntries();
        var clients = catalogClients();
        var pastas = catalogPastas();
        var years = unique(items.map(function (e) { return String(e.archivedAt || '').slice(0, 4); }).filter(Boolean));
        var html = '';
        html += treeBtn('all', tr('all'), items.length);
        html += treeBtn('done', tr('done'), items.filter(function (e) { return e.concluded; }).length);
        html += '<details open><summary>' + esc(tr('byType')) + '</summary>';
        ['relatorio', 'orcamento', 'recibo', 'completo', 'documento'].forEach(function (tp) {
            var n = items.filter(function (e) { return e.type === tp; }).length;
            html += treeBtn('type:' + tp, typeLabel(tp), n);
        });
        html += '</details>';
        html += '<details open><summary>' + esc(tr('byClient')) + '</summary>';
        if (!clients.length) html += '<p class="arq-hint" style="padding:6px 12px;">—</p>';
        clients.forEach(function (c) { html += treeBtn('client:' + c, c); });
        html += '</details>';
        html += '<details open><summary>' + esc(tr('byPasta')) + '</summary>';
        if (!pastas.length) html += '<p class="arq-hint" style="padding:6px 12px;">—</p>';
        pastas.forEach(function (p) { html += treeBtn('pasta:' + p, p); });
        html += '</details>';
        html += '<details><summary>' + esc(tr('byYear')) + '</summary>';
        years.forEach(function (y) {
            html += treeBtn('year:' + y, y);
            unique(items.filter(function (e) { return String(e.archivedAt || '').slice(0, 4) === y; })
                .map(function (e) { return String(e.archivedAt || '').slice(0, 7); })).forEach(function (m) {
                html += treeBtn('month:' + m, '  ' + m);
            });
        });
        html += '</details>';
        html += '<details><summary>' + esc(tr('drafts')) + '</summary>';
        html += treeBtn('draft:current', tr('current'));
        html += treeBtn('draft:versions', tr('versions'), versionSnapshots().length);
        html += '</details>';
        var tree = document.getElementById('arqTree');
        tree.innerHTML = html;
        tree.querySelectorAll('button[data-folder]').forEach(function (btn) {
            btn.onclick = function () {
                state.folder = btn.getAttribute('data-folder');
                state.selectedId = null;
                renderTree();
                renderList();
                renderPreview();
            };
        });
    }
    function renderList() {
        var list = visibleEntries();
        document.getElementById('arqListTitle').textContent = list.length + ' — ' + (state.folder === 'all' ? tr('all') : state.folder.replace(/^[^:]+:/, ''));
        var box = document.getElementById('arqList');
        if (!list.length) {
            box.innerHTML = '<p class="arq-hint" style="padding:12px;">' + esc(tr('empty')) + '</p>';
            return;
        }
        box.innerHTML = list.map(function (e) {
            var on = state.selectedId === e.id ? ' on' : '';
            var date = e.archivedAt ? String(e.archivedAt).slice(0, 10) : '';
            return '<button type="button" class="arq-row' + on + '" data-id="' + esc(e.id) + '">' +
                '<span class="arq-badge' + (e.concluded ? ' done' : '') + '">' + esc(e.concluded ? tr('concluded') : tr('notDone')) + '</span>' +
                '<span class="arq-badge">' + esc(typeLabel(e.type)) + '</span>' +
                esc(e.name) +
                '<span class="arq-meta">' + esc([e.client || tr('noClient'), e.pasta || tr('none'), date, e.number].filter(Boolean).join(' · ')) + '</span>' +
                '</button>';
        }).join('');
        box.querySelectorAll('button.arq-row').forEach(function (btn) {
            btn.onclick = function () {
                state.selectedId = btn.getAttribute('data-id');
                renderList();
                renderPreview();
            };
        });
    }
    function findSelected() {
        var id = state.selectedId;
        if (!id) return null;
        if (id === 'current') return currentSnapshot();
        if (id.indexOf('ver-') === 0) {
            return versionSnapshots().filter(function (v) { return v.id === id; })[0] || null;
        }
        return allEntries().filter(function (e) { return e.id === id; })[0] || null;
    }
    function previewDoc(html) {
        return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
            'body{font-family:Calibri,Segoe UI,sans-serif;padding:16px;color:#1a1a1a;}' +
            'table{border-collapse:collapse;}img{max-width:100%;}' +
            '</style></head><body>' + (html || '') + '</body></html>';
    }
    function renderPreview() {
        var box = document.getElementById('arqPreview');
        var e = findSelected();
        revokePdfPreview();
        if (!e) {
            box.innerHTML = '<h3>' + esc(tr('preview')) + '</h3><p class="arq-hint">' + esc(tr('noSel')) + '</p>';
            return;
        }
        var canRel = partHasContent(e.html, 'relatorio');
        var canOrc = partHasContent(e.html, 'orcamento');
        var canRec = partHasContent(e.html, 'recibo');
        var actions = '<div class="arq-actions">' +
            '<button type="button" class="arq-btn primary" data-act="open">' + esc(tr('open')) + '</button>' +
            '<button type="button" class="arq-btn gold" data-act="copy">' + esc(tr('copyAll')) + '</button>' +
            (canRel ? '<button type="button" class="arq-btn" data-act="copy-rel">' + esc(tr('copyRel')) + '</button>' : '') +
            (canOrc ? '<button type="button" class="arq-btn" data-act="copy-orc">' + esc(tr('copyOrc')) + '</button>' : '') +
            (canRec ? '<button type="button" class="arq-btn" data-act="copy-rec">' + esc(tr('copyRec')) + '</button>' : '') +
            '<button type="button" class="arq-btn" data-act="dl">' + esc(tr('dlOne')) + '</button>' +
            (!e.readOnlyOrigin ? '<button type="button" class="arq-btn" data-act="toggle">' + esc(e.concluded ? tr('markOpen') : tr('markDone')) + '</button>' : '') +
            '</div>';
        var form = '';
        if (!e.readOnlyOrigin) {
            form = '<div class="arq-form">' +
                '<label>' + esc(tr('client')) + '<input id="arqEditClient" value="' + esc(e.client) + '" /></label>' +
                '<label>' + esc(tr('pasta')) + '<input id="arqEditPasta" value="' + esc(e.pasta) + '" /></label>' +
                '<button type="button" class="arq-btn" data-act="meta">' + esc(tr('archived')) + '</button>' +
                '</div>';
        }
        var pdfBtns = '<div class="arq-actions">' +
            (canRel ? '<button type="button" class="arq-btn gold" data-act="final-relatorio">' + esc(tr('pdfGravarRel')) + '</button>' : '') +
            (canOrc ? '<button type="button" class="arq-btn gold" data-act="final-orcamento">' + esc(tr('pdfGravarOrc')) + '</button>' : '') +
            (canRec ? '<button type="button" class="arq-btn gold" data-act="final-recibo">' + esc(tr('pdfGravarRec')) + '</button>' : '') +
            '</div>';
        box.innerHTML = '<h3>' + esc(tr('preview')) + ' — ' + esc(e.name) + '</h3>' +
            '<p class="arq-hint">' + esc(typeLabel(e.type) + ' · ' + (e.client || tr('noClient')) + ' · ' + (e.pasta || tr('none'))) + '</p>' +
            actions + form +
            '<div class="arq-pdf"><h4>' + esc(tr('pdfTitle')) + '</h4>' +
            '<p class="arq-hint">' + esc(tr('pdfHint')) + '</p>' +
            pdfBtns +
            '<div id="arqPdfStatus" class="arq-hint"></div>' +
            '<div id="arqPdfList"></div></div>' +
            '<iframe sandbox="" title="preview" id="arqPreviewFrame"></iframe>';
        var iframe = box.querySelector('#arqPreviewFrame');
        iframe.srcdoc = previewDoc(e.html);
        box.querySelectorAll('[data-act]').forEach(function (btn) {
            btn.onclick = function () { runAction(btn.getAttribute('data-act'), e); };
        });
        fillPdfList(e);
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
                return '<div class="arq-pdf-row">' +
                    '<span>' + esc(etapeLabel(r.etape)) + ' v' + esc(String(r.rev)) +
                    (r.number ? ' · ' + esc(r.number) : '') +
                    ' · ' + esc(when) + ' · ' + esc(tr('pdfKb', { n: String(kb) })) + '</span>' +
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
                revokePdfPreview();
                pdfPreviewUrl = URL.createObjectURL(rec.blob);
                var iframe = document.getElementById('arqPreviewFrame');
                if (iframe) {
                    iframe.removeAttribute('sandbox');
                    iframe.removeAttribute('srcdoc');
                    iframe.src = pdfPreviewUrl;
                }
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
        var entry = opts.entry || currentSnapshot();
        if (opts.html) {
            entry = Object.assign({}, entry, {
                html: opts.html,
                number: opts.number || entry.number,
                name: opts.name || entry.name
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
            if (lastRev && !opts.silent && !confirm(tr('pdfConfirmV', { rev: String(lastRev), next: String(next) }))) {
                return Promise.reject(new Error('cancel'));
            }
            return htmlToPdfBlob(chunk).then(function (blob) {
                var rec = {
                    id: ownerIdOf(entry) + ':' + etape + ':v' + next,
                    ownerId: ownerIdOf(entry),
                    etape: etape,
                    rev: next,
                    number: entry.number || opts.number || '',
                    name: entry.name || '',
                    createdAt: new Date().toISOString(),
                    bytes: blob.size || 0,
                    blob: blob
                };
                return putFinal(rec);
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
        gravarEtape(etape, { entry: entry, silent: false }).then(function () {
            if (status) status.textContent = '';
            fillPdfList(entry);
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
            d.querySelectorAll('[data-abene-block]').forEach(function (n) { n.remove(); });
            var left = d.innerHTML.trim();
            return left || '';
        }
        return html;
    }
    function applyToEditor(html, name, asCopy) {
        var editor = editorEl();
        if (!editor) return false;
        if (!confirm(asCopy ? tr('confirmCopy') : tr('confirmOpen'))) return false;
        editor.innerHTML = html || '<p></p>';
        if (typeof renameDocument === 'function') renameDocument(name);
        if (docState()) docState().dirty = true;
        if (typeof saveUndoState === 'function') saveUndoState();
        if (typeof updateStats === 'function') updateStats();
        if (typeof updateNavigation === 'function') updateNavigation();
        if (typeof refreshPagination === 'function') refreshPagination();
        if (typeof updateSaveStatus === 'function') updateSaveStatus();
        closeArquivo();
        return true;
    }
    function downloadHtml(name, html) {
        var blob = new Blob(['<!DOCTYPE html><html><head><meta charset="utf-8"><title>' +
            sanitizeName(name) + '</title></head><body>' + html + '</body></html>'], { type: 'text/html;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = sanitizeName(name) + '.html';
        a.click();
        URL.revokeObjectURL(a.href);
    }
    function csvEsc(v) {
        var s = String(v == null ? '' : v);
        if (/[;"\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
    }
    function runAction(act, e) {
        if (act === 'open') {
            if (applyToEditor(e.html, e.name, false)) toast(tr('opened'));
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
        if (act === 'toggle' && !e.readOnlyOrigin) {
            var list = loadStore();
            list.forEach(function (item) {
                if (item.id === e.id) item.concluded = !item.concluded;
            });
            if (saveStore(list)) { renderTree(); renderList(); renderPreview(); }
            return;
        }
        if (act === 'meta' && !e.readOnlyOrigin) {
            var client = (document.getElementById('arqEditClient') || {}).value || '';
            var pasta = (document.getElementById('arqEditPasta') || {}).value || '';
            var list2 = loadStore();
            list2.forEach(function (item) {
                if (item.id === e.id) {
                    item.client = String(client).trim();
                    item.pasta = String(pasta).trim();
                }
            });
            if (saveStore(list2)) {
                rememberFolder('client', String(client).trim(), '');
                rememberFolder('pasta', String(pasta).trim(), String(client).trim());
                renderTree();
                renderList();
                renderPreview();
            }
        }
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
            return e.name === entry.name && (e.client || '') === (entry.client || '') && e.type === entry.type;
        })[0];
        if (existing) {
            existing.html = entry.html;
            existing.concluded = entry.concluded;
            existing.pasta = entry.pasta || existing.pasta;
            existing.nif = entry.nif || existing.nif;
            existing.archivedAt = entry.archivedAt;
            existing.number = entry.number;
            existing.total = entry.total;
            existing.hasDevis = entry.hasDevis;
            existing.hasReceipt = entry.hasReceipt;
            existing.hasReport = entry.hasReport;
            state.selectedId = existing.id;
        } else {
            list.unshift(entry);
            state.selectedId = entry.id;
        }
        if (!saveStore(list)) return null;
        rememberFolder('client', entry.client, '');
        rememberFolder('pasta', entry.pasta, entry.client);
        copyFinals('live', state.selectedId);
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
            concluded = opts.concluded !== false || meta.type === 'completo';
        } else if (clientDef && pastaDef) {
            if (!window.confirm(tr('archiveConfirm', { client: clientDef, pasta: pastaDef }))) return null;
            concluded = opts.concluded != null ? !!opts.concluded : true;
        } else {
            client = window.prompt(tr('client'), clientDef);
            if (client === null) return null;
            pasta = window.prompt(tr('pasta'), pastaDef);
            if (pasta === null) return null;
            concluded = window.confirm(tr('markDone') + ' ?');
        }
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
            concluded: concluded || meta.type === 'completo',
            archivedAt: new Date().toISOString(),
            hasDevis: meta.hasDevis,
            hasReceipt: meta.hasReceipt,
            hasReport: meta.hasReport
        };
        if (!upsertArchiveEntry(entry)) return null;
        saveLastJob({ client: entry.client, pasta: entry.pasta, nif: entry.nif });
        if (!opts.silent) {
            state.folder = 'all';
            toast(tr('archivedOk'));
        }
        refreshArquivoIfOpen();
        return state.selectedId;
    }
    function downloadSet() {
        var list = visibleEntries();
        if (!list.length) { toast(tr('zipEmpty')); return; }
        var csvHdr = ['Nome', 'Tipo', 'Concluido', 'Cliente', 'Pasta', 'Numero', 'Total', 'Data'].join(';');
        var csv = '\uFEFF' + csvHdr + '\r\n' + list.map(function (e) {
            return [e.name, e.type, e.concluded ? 'sim' : 'nao', e.client, e.pasta, e.number, e.total, String(e.archivedAt || '').slice(0, 10)]
                .map(csvEsc).join(';');
        }).join('\r\n');
        if (!window.JSZip) {
            toast(tr('noZip'));
            downloadHtml('indice-arquivo', '<pre>' + csv.replace(/^﻿/, '') + '</pre>');
            list.forEach(function (e) { downloadHtml(e.name, e.html); });
            return;
        }
        var zip = new window.JSZip();
        zip.file('indice.csv', csv);
        list.forEach(function (e) {
            var folder = [e.client || tr('noClient'), e.pasta || tr('none'), typeLabel(e.type)]
                .map(sanitizeName).join('/');
            zip.file(folder + '/' + sanitizeName(e.name) + '.html',
                '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' + e.html + '</body></html>');
        });
        Promise.all(list.map(function (e) {
            var folder = [e.client || tr('noClient'), e.pasta || tr('none'), typeLabel(e.type)]
                .map(sanitizeName).join('/');
            return listFinals(ownerIdOf(e)).then(function (rows) {
                rows.forEach(function (r) {
                    if (!r.blob) return;
                    zip.file(folder + '/' + sanitizeName(e.name) + '_' + r.etape + '_v' + r.rev + '.pdf', r.blob);
                });
            });
        })).then(function () {
            return zip.generateAsync({ type: 'blob' });
        }).then(function (blob) {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = ((typeof window.abeneBrandName === 'function') ? window.abeneBrandName() : 'Genius Raros').replace(/\s+/g, '-') + '-Arquivo.zip';
            a.click();
            URL.revokeObjectURL(a.href);
            toast(tr('zipOk', { n: String(list.length) }));
        });
    }
    function openArquivo() {
        ensureDom();
        fillChrome();
        if (typeof closeAllDropdowns === 'function') closeAllDropdowns();
        document.getElementById('arqOverlay').classList.add('open');
        renderTree();
        renderList();
        renderPreview();
    }
    function closeArquivo() {
        revokePdfPreview();
        var el = document.getElementById('arqOverlay');
        if (el) el.classList.remove('open');
    }

    window.openArquivoWindow = openArquivo;
    window.closeArquivoWindow = closeArquivo;
    window.abeneArquivoArchive = function (opts) { return archiveCurrent(opts || { silent: true }); };
    window.abeneArquivoApi = {
        visibleEntries: function () { return visibleEntries(); },
        allEntries: function () { return allEntries(); },
        currentSnapshot: currentSnapshot,
        listFinals: listFinals,
        gravarEtape: gravarEtape,
        ownerIdOf: ownerIdOf,
        sanitizeName: sanitizeName,
        catalogFolders: loadFolders,
        rememberFolder: rememberFolder,
        archiveCurrent: archiveCurrent,
        lastJob: loadLastJob,
        saveLastJob: saveLastJob
    };
})();
