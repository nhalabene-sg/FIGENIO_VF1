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

    function isRasterData(src) {
        return /^data:image\/(png|jpe?g|gif|webp|bmp)/i.test(src || '');
    }

    function canvasFromImage(el, scale) {
        var w = Math.max(1, el.offsetWidth || parseFloat(el.getAttribute('width')) || el.naturalWidth || 54);
        var h = Math.max(1, el.offsetHeight || parseFloat(el.getAttribute('height')) || el.naturalHeight || 54);
        if (el.naturalWidth && el.naturalHeight && w && h) {
            h = Math.max(1, Math.round(w * el.naturalHeight / el.naturalWidth));
        }
        scale = scale || ((w < 128 || h < 128) ? 3 : 1);
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w * scale));
        c.height = Math.max(1, Math.round(h * scale));
        var ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        if (ctx.imageSmoothingQuality) ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(el, 0, 0, c.width, c.height);
        return c.toDataURL('image/png');
    }

    function rasterizeOne(img) {
        var src = (img && (img.getAttribute('src') || img.currentSrc || img.src)) || '';
        if (!img || !src || isRasterData(src)) return Promise.resolve();
        return new Promise(function (resolve) {
            var finished = false;
            var finish = function () { if (finished) return; finished = true; resolve(); };
            var applyFrom = function (el) {
                try {
                    var boxW = img.offsetWidth || parseFloat(img.getAttribute('width')) || el.offsetWidth || el.naturalWidth || 54;
                    var boxH = img.offsetHeight || parseFloat(img.getAttribute('height')) || el.offsetHeight || el.naturalHeight || 54;
                    var url = canvasFromImage(el);
                    if (url && url.indexOf('data:image/png') === 0) {
                        img.setAttribute('src', url);
                        img.removeAttribute('srcset');
                        img.style.setProperty('width', Math.max(1, boxW) + 'px', 'important');
                        img.style.setProperty('height', Math.max(1, boxH) + 'px', 'important');
                        img.setAttribute('width', String(Math.round(boxW)));
                        img.setAttribute('height', String(Math.round(boxH)));
                    }
                } catch (e) {}
                finish();
            };
            if (img.complete && img.naturalWidth) {
                applyFrom(img);
                return;
            }
            var probe = new Image();
            probe.onload = function () { applyFrom(probe.naturalWidth ? probe : img); };
            probe.onerror = function () {
                if (img.complete && img.naturalWidth) applyFrom(img);
                else finish();
            };
            probe.src = src;
            setTimeout(function () {
                if (finished) return;
                if (img.complete && img.naturalWidth) applyFrom(img);
                else finish();
            }, 2500);
        });
    }

    function rasterizeImages(box) {
        var imgs = box ? box.querySelectorAll('img') : [];
        return Promise.all(Array.prototype.map.call(imgs, rasterizeOne));
    }

    function logoPng() {
        var co = (A().companyData) || {};
        var src = co.iconUrl || co.logoUrl || 'branding/icon_48.svg';
        if (isRasterData(src)) return Promise.resolve(src);
        var img = document.createElement('img');
        img.setAttribute('width', '54');
        img.setAttribute('height', '54');
        img.src = src;
        document.body.appendChild(img);
        img.style.cssText = 'position:absolute;left:-9999px;width:54px;height:54px;';
        return rasterizeOne(img).then(function () {
            var out = img.getAttribute('src') || '';
            if (img.parentNode) img.parentNode.removeChild(img);
            return isRasterData(out) ? out : '';
        }).catch(function () {
            if (img.parentNode) img.parentNode.removeChild(img);
            return '';
        });
    }

    function embedImages(rootEl) {
        return waitImages(rootEl).then(function () { return rasterizeImages(rootEl); });
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

    function pdfOptions(g, filename) {
        return {
            margin: 0,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: g.w,
                height: g.h,
                windowWidth: g.w,
                windowHeight: g.h,
                logging: false,
                imageTimeout: 4000
            },
            jsPDF: {
                unit: 'mm',
                format: [g.wmm, g.hmm],
                orientation: g.orientation === 'landscape' ? 'landscape' : 'portrait'
            },
            pagebreak: { mode: [] }
        };
    }

    function captureHost(g) {
        var host = document.getElementById('abenePdfMount');
        if (host && host.parentNode) host.parentNode.removeChild(host);
        host = document.createElement('div');
        host.id = 'abenePdfMount';
        host.style.cssText = 'position:fixed;left:0;top:0;width:' + g.w + 'px;height:' + g.h + 'px;overflow:hidden;background:#fff;pointer-events:none;z-index:1;';
        document.body.appendChild(host);
        return host;
    }

    function placeSheet(host, sheet, g) {
        while (host.firstChild) host.removeChild(host.firstChild);
        sheet.style.width = g.w + 'px';
        sheet.style.height = g.h + 'px';
        sheet.style.maxHeight = g.h + 'px';
        sheet.style.minHeight = g.h + 'px';
        sheet.style.overflow = 'hidden';
        sheet.style.margin = '0';
        sheet.style.boxShadow = 'none';
        sheet.style.pageBreakAfter = 'auto';
        sheet.style.breakAfter = 'auto';
        host.appendChild(sheet);
    }

    function afterLayout() {
        return new Promise(function (resolve) {
            requestAnimationFrame(function () {
                requestAnimationFrame(resolve);
            });
        });
    }

    function savePagedPdf(tree, g, filename) {
        var sheets = tree.querySelectorAll('.abene-export-sheet');
        if (!sheets.length) sheets = [tree];
        var list = Array.prototype.slice.call(sheets);
        var host = captureHost(g);
        var opt = pdfOptions(g, filename);
        placeSheet(host, list[0], g);
        return afterLayout().then(function () {
            var worker = root.html2pdf().set(opt).from(list[0]).toPdf();
            var i;
            for (i = 1; i < list.length; i++) {
                worker = (function (el) {
                    return worker.get('pdf').then(function (pdf) {
                        pdf.addPage([g.wmm, g.hmm], opt.jsPDF.orientation);
                        placeSheet(host, el, g);
                        return afterLayout();
                    }).set(opt).from(el).toContainer().toCanvas().toPdf();
                })(list[i]);
            }
            return Promise.resolve(worker.save(filename));
        }).then(function () {
            if (host && host.parentNode) host.parentNode.removeChild(host);
        }).catch(function (err) {
            if (host && host.parentNode) host.parentNode.removeChild(host);
            throw err;
        });
    }

    var ExportApi = {
        get useEngine() { return useEngine; },
        set useEngine(v) { useEngine = !!v; },
        prepare: prepare,
        geo: geo,
        bodyHtml: bodyHtml,
        sanitize: sanitizeExportRoot,
        embedImages: embedImages,
        logoPng: logoPng,
        rasterizeImages: rasterizeImages,
        savePagedPdf: savePagedPdf
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
            var donePdf = function () {
                var mount = document.getElementById('abenePdfMount');
                if (mount && mount.parentNode) mount.parentNode.removeChild(mount);
                if (root.abeneRemoveExportRoot) root.abeneRemoveExportRoot();
            };
            embedImages(tree).then(function () {
                return savePagedPdf(tree, g, name + '.pdf');
            }).then(donePdf).catch(function () {
                try {
                    root.html2pdf().set(pdfOptions(g, name + '.pdf')).from(tree.querySelector('.abene-export-sheet') || tree).save();
                } catch (err) {}
                setTimeout(donePdf, 8000);
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
