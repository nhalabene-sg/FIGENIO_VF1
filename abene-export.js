/* Genius Raros — Export (P12).
   Éditeur paginé ≈ imprimir ≈ PDF. DOCX lit ABENE.Document.
   Les boutons Guardar / PDF / DOCX / Imprimir existants restent. */
(function (root) {
    root.ABENE = root.ABENE || {};
    var useEngine = true;
    try {
        if (root.localStorage && root.localStorage.getItem('abeneExportEngine') === '0') useEngine = false;
    } catch (e0) {}

    function A() { return root.abene || {}; }
    function ed() { return (A().editor) || document.getElementById('editor'); }
    function G() { return root.PageGeometry || {}; }

    function geo() {
        var pg = G();
        var w = pg.width || (typeof root.getPageWidth === 'function' ? root.getPageWidth() : 794);
        var h = pg.height || (typeof root.getPageHeight === 'function' ? root.getPageHeight() : 1123);
        var pxToMm = typeof pg.pxToMm === 'function' ? pg.pxToMm.bind(pg) : function (px) { return (Number(px) || 0) * 25.4 / 96; };
        return {
            w: w,
            h: h,
            wmm: Number(pxToMm(w).toFixed(2)),
            hmm: Number(pxToMm(h).toFixed(2)),
            orientation: pg.orientation || A().pageOrientation || 'portrait',
            margins: {
                top: pg.marginTop || 96,
                right: pg.marginRight || 96,
                bottom: pg.marginBottom || 96,
                left: pg.marginLeft || 96
            }
        };
    }

    function bodyHtml() {
        var Doc = root.ABENE && root.ABENE.Document;
        if (Doc && typeof Doc.bodyHtml === 'function') {
            try { return Doc.bodyHtml(); } catch (e) {}
        }
        if (typeof root.persistableEditorHtml === 'function') return root.persistableEditorHtml();
        if (typeof root.abeneGetCleanHtml === 'function') return root.abeneGetCleanHtml(ed());
        var editor = ed();
        return editor ? editor.innerHTML : '<p></p>';
    }

    function prepare() {
        var editor = ed();
        if (editor && editor.classList.contains('editing-header-footer') && typeof root.abeneCloseHeaderFooter === 'function') {
            root.abeneCloseHeaderFooter();
        }
        if (root.ABENE && root.ABENE.Images && typeof root.ABENE.Images.syncAnchors === 'function') {
            try { root.ABENE.Images.syncAnchors(editor); } catch (e1) {}
        }
        if (root.ABENE && root.ABENE.Document && typeof root.ABENE.Document.capture === 'function') {
            try { root.ABENE.Document.capture(); } catch (e2) {}
        }
        if (typeof root.refreshPagination === 'function') root.refreshPagination();
        else if (root.abeneLayoutPageFlow) {
            root.abeneLayoutPageFlow();
            if (typeof root.renderPageDecorations === 'function') root.renderPageDecorations();
        }
    }

    function sanitizeExportRoot(rootEl) {
        if (!rootEl || !rootEl.querySelectorAll) return rootEl;
        rootEl.querySelectorAll('.abene-obj-resize, .abene-tbox-bar, .image-handle, .hf-tab, .hf-rule, .hf-close, .page-gap-band, .hf-placeholder').forEach(function (n) { n.remove(); });
        rootEl.querySelectorAll('.abene-obj-on, .selected').forEach(function (el) {
            el.classList.remove('abene-obj-on');
            el.classList.remove('selected');
        });
        return rootEl;
    }

    function waitImages(rootEl) {
        var imgs = rootEl ? rootEl.querySelectorAll('img') : [];
        return Promise.all(Array.prototype.map.call(imgs, function (img) {
            if (img.complete && img.naturalWidth) return Promise.resolve();
            return new Promise(function (resolve) {
                var done = function () { resolve(); };
                img.addEventListener('load', done, { once: true });
                img.addEventListener('error', done, { once: true });
                setTimeout(done, 2000);
            });
        }));
    }

    function rasterizeImages(box) {
        var imgs = box.querySelectorAll('img');
        return Promise.all(Array.prototype.map.call(imgs, function (img) {
            var src = img.getAttribute('src') || img.src || '';
            if (!src || /^data:image\//i.test(src)) return Promise.resolve();
            return new Promise(function (resolve) {
                var probe = new Image();
                probe.crossOrigin = 'anonymous';
                var finished = false;
                var finish = function () { if (finished) return; finished = true; resolve(); };
                probe.onload = function () {
                    try {
                        var c = document.createElement('canvas');
                        c.width = Math.max(1, probe.naturalWidth || img.naturalWidth || 1);
                        c.height = Math.max(1, probe.naturalHeight || img.naturalHeight || 1);
                        c.getContext('2d').drawImage(probe, 0, 0);
                        img.setAttribute('src', c.toDataURL('image/png'));
                    } catch (e) {}
                    finish();
                };
                probe.onerror = finish;
                probe.src = src;
                setTimeout(finish, 2500);
            });
        }));
    }

    function pxToEmu(px) {
        return Math.round((Number(px) || 0) * 914400 / 96);
    }

    function wrapImageRun() {
        if (typeof root.docxImageRun !== 'function' || root.docxImageRun._abeneExport) return;
        var orig = root.docxImageRun;
        root.docxImageRun = function (img, ImageRun) {
            if (!useEngine) return orig.apply(this, arguments);
            if (!img || !ImageRun) return orig.apply(this, arguments);
            var src = img.src || '';
            if (!/^data:image\//i.test(src)) return orig.apply(this, arguments);
            var pic = img.closest && img.closest('.abene-pic, [data-abene-obj="pic"]');
            var wrap = pic ? pic.getAttribute('data-wrap') : '';
            var w = Math.min(500, parseFloat(img.style.width) || img.naturalWidth || img.offsetWidth || 320);
            var h = img.naturalHeight && img.naturalWidth
                ? Math.round(w * img.naturalHeight / img.naturalWidth)
                : Math.min(400, parseFloat(img.style.height) || img.offsetHeight || 240);
            var opts = { data: src, transformation: { width: w, height: Math.max(24, h) } };
            var D = root.docx;
            if (pic && D && D.TextWrappingType && wrap && wrap !== 'none') {
                var dx = Number(pic.getAttribute('data-abene-dx')) || 0;
                var dy = Number(pic.getAttribute('data-abene-dy')) || 0;
                var left = parseFloat(pic.style.left) || dx;
                var top = parseFloat(pic.style.top) || dy;
                var isFloat = wrap === 'left' || wrap === 'right';
                var isFree = wrap === 'free' || wrap === 'behind' || wrap === 'front';
                if (isFloat || isFree) {
                    opts.floating = {
                        horizontalPosition: { offset: pxToEmu(isFloat && wrap === 'right' ? 360 : left) },
                        verticalPosition: { offset: pxToEmu(top) },
                        wrap: {
                            type: isFree ? D.TextWrappingType.NONE : D.TextWrappingType.SQUARE
                        },
                        behindDocument: wrap === 'behind',
                        allowOverlap: isFree
                    };
                }
            }
            try { return new ImageRun(opts); } catch (e) { return orig.apply(this, arguments); }
        };
        root.docxImageRun._abeneExport = true;
    }

    function wrapPushBlock() {
        if (typeof root.docxPushBlock !== 'function' || root.docxPushBlock._abeneExport) return;
        var orig = root.docxPushBlock;
        root.docxPushBlock = function (node, children, api) {
            if (useEngine && node && node.classList && node.classList.contains('abene-notes-source')) return;
            return orig.apply(this, arguments);
        };
        root.docxPushBlock._abeneExport = true;
    }

    var ExportApi = {
        get useEngine() { return useEngine; },
        set useEngine(v) { useEngine = !!v; },
        prepare: prepare,
        geo: geo,
        bodyHtml: bodyHtml,
        sanitize: sanitizeExportRoot
    };
    root.ABENE.Export = ExportApi;

    if (typeof root.abenePrepareForExport === 'function' && !root.abenePrepareForExport._abeneExport) {
        var origPrep = root.abenePrepareForExport;
        root.abenePrepareForExport = function () {
            if (!useEngine) return origPrep.apply(this, arguments);
            prepare();
        };
        root.abenePrepareForExport._abeneExport = true;
    }

    if (typeof root.abeneBuildPagedExport === 'function' && !root.abeneBuildPagedExport._abeneExport) {
        var origBuild = root.abeneBuildPagedExport;
        root.abeneBuildPagedExport = function () {
            var tree = origBuild.apply(this, arguments);
            if (useEngine && tree) sanitizeExportRoot(tree);
            return tree;
        };
        root.abeneBuildPagedExport._abeneExport = true;
    }

    if (typeof root.abeneInjectPrintPageSize === 'function' && !root.abeneInjectPrintPageSize._abeneExport) {
        var origInject = root.abeneInjectPrintPageSize;
        root.abeneInjectPrintPageSize = function () {
            var r = origInject.apply(this, arguments);
            if (useEngine && r) {
                var st = document.getElementById('abenePrintPageSize');
                if (st) {
                    st.textContent = '@media print { @page { size: ' + r.wmm + 'mm ' + r.hmm + 'mm; margin: 0; } }';
                }
            }
            return r;
        };
        root.abeneInjectPrintPageSize._abeneExport = true;
    }

    if (typeof root.exportPDF === 'function' && !root.exportPDF._abeneExport) {
        var origPdf = root.exportPDF;
        root.exportPDF = function () {
            if (!useEngine || !root.html2pdf || !root.abeneBuildPagedExport) return origPdf.apply(this, arguments);
            if (root.abeneRemoveExportRoot) root.abeneRemoveExportRoot();
            prepare();
            var tree = root.abeneBuildPagedExport();
            if (!tree) return origPdf.apply(this, arguments);
            var g = geo();
            if (root.abeneInjectPrintPageSize) root.abeneInjectPrintPageSize();
            tree.style.position = 'fixed';
            tree.style.left = '-20000px';
            tree.style.top = '0';
            tree.style.zIndex = '0';
            tree.style.background = '#fff';
            document.body.appendChild(tree);
            var ds = A().documentState || {};
            var name = ds.name || 'document';
            var donePdf = function () { if (root.abeneRemoveExportRoot) root.abeneRemoveExportRoot(); };
            waitImages(tree).then(function () {
                var job = root.html2pdf().set({
                    margin: 0,
                    filename: name + '.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: g.w, windowWidth: g.w },
                    jsPDF: { unit: 'mm', format: [g.wmm, g.hmm], orientation: g.orientation === 'landscape' ? 'landscape' : 'portrait' },
                    pagebreak: { mode: ['css'], after: '.abene-export-sheet' }
                }).from(tree);
                try {
                    var p = job.save();
                    if (p && typeof p.then === 'function') p.then(donePdf).catch(donePdf);
                    else setTimeout(donePdf, 8000);
                } catch (err) { donePdf(); }
            });
            if (typeof root.showToast === 'function' && typeof root.t === 'function') root.showToast(root.t('toastPdf'));
            if (typeof root.closeAllDropdowns === 'function') root.closeAllDropdowns();
        };
        root.exportPDF._abeneExport = true;
    }

    if (typeof root.exportDocx === 'function' && !root.exportDocx._abeneExport) {
        var origDocx = root.exportDocx;
        root.exportDocx = async function () {
            if (!useEngine) return origDocx.apply(this, arguments);
            wrapImageRun();
            wrapPushBlock();
            prepare();
            var box = document.createElement('div');
            box.innerHTML = bodyHtml();
            await rasterizeImages(box);
            var html = box.innerHTML;
            var origClean = root.abeneGetCleanHtml;
            root.abeneGetCleanHtml = function () { return html; };
            try {
                return await origDocx.apply(this, arguments);
            } catch (e) {
                root.abeneGetCleanHtml = origClean;
                return await origDocx.apply(this, arguments);
            } finally {
                root.abeneGetCleanHtml = origClean;
            }
        };
        root.exportDocx._abeneExport = true;
    }

    if (typeof root.exportWord === 'function' && !root.exportWord._abeneExport) {
        var origWord = root.exportWord;
        root.exportWord = function () {
            if (useEngine) prepare();
            return origWord.apply(this, arguments);
        };
        root.exportWord._abeneExport = true;
    }

    wrapImageRun();
    wrapPushBlock();
})(window);
