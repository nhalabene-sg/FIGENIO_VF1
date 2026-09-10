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
        var editor = ed();
        if (typeof root.abeneGetCleanHtml === 'function' && editor) {
            try {
                var live = root.abeneGetCleanHtml(editor);
                if (live && live !== '<p></p>') return live;
            } catch (e0) {}
        }
        if (typeof root.persistableEditorHtml === 'function') {
            try {
                var html = root.persistableEditorHtml();
                if (html && html !== '<p></p>') return html;
            } catch (e1) {}
        }
        var Doc = root.ABENE && root.ABENE.Document;
        if (Doc && typeof Doc.bodyHtml === 'function') {
            try { return Doc.bodyHtml(); } catch (e2) {}
        }
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

    function flattenExportDom(rootEl) {
        if (!rootEl || !rootEl.querySelectorAll) return rootEl;
        rootEl.querySelectorAll('del.abene-change').forEach(function (n) { n.remove(); });
        var guard = 0;
        while (guard++ < 80) {
            var list = rootEl.querySelectorAll('ins.abene-change, span.abene-change');
            if (!list.length) break;
            var n = list[list.length - 1];
            if (!n.parentNode) break;
            while (n.firstChild) n.parentNode.insertBefore(n.firstChild, n);
            n.parentNode.removeChild(n);
        }
        rootEl.querySelectorAll('.abene-change').forEach(function (n) {
            n.classList.remove('abene-change');
            n.removeAttribute('data-author');
            n.removeAttribute('data-date');
        });
        return rootEl;
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
                    var boxW = img.offsetWidth || parseFloat(img.getAttribute('width')) || 0;
                    var boxH = img.offsetHeight || parseFloat(img.getAttribute('height')) || 0;
                    if (boxW < 4) boxW = el.naturalWidth || 54;
                    if (boxH < 4) boxH = el.naturalHeight || 54;
                    if (boxW > 800) {
                        var ratio = boxH / boxW;
                        boxW = 54;
                        boxH = Math.max(1, Math.round(54 * ratio));
                    }
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
            image: { type: 'jpeg', quality: 0.93 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: g.w,
                windowWidth: g.w,
                logging: false,
                imageTimeout: 4000,
                scrollX: 0,
                scrollY: 0,
                onclone: function (doc) {
                    var box = doc.getElementById('abeneExportRoot') || doc.querySelector('.abene-export-root') || doc.body;
                    box.querySelectorAll('.abene-page-flow, .page-gap-band').forEach(function (el) {
                        el.style.setProperty('background', '#ffffff', 'important');
                        el.style.setProperty('box-shadow', 'none', 'important');
                    });
                    box.querySelectorAll('.page-header-zone, .page-footer-zone, .abene-export-sheet, .page').forEach(function (el) {
                        el.style.setProperty('background', '#ffffff', 'important');
                    });
                    box.querySelectorAll('.page-footer-zone').forEach(function (el) {
                        el.style.setProperty('--hf-seam', '0px');
                    });
                    box.querySelectorAll('.page-gap-band').forEach(function (el) {
                        el.style.display = 'none';
                    });
                }
            },
            jsPDF: {
                unit: 'mm',
                format: [g.wmm, g.hmm],
                orientation: g.orientation === 'landscape' ? 'landscape' : 'portrait'
            },
            pagebreak: { mode: [] }
        };
    }

    function afterLayout() {
        return new Promise(function (resolve) {
            requestAnimationFrame(function () {
                requestAnimationFrame(function () { setTimeout(resolve, 80); });
            });
        });
    }

    function showCaptureRoot(tree, g) {
        var n = Math.max(1, tree.querySelectorAll('.abene-export-sheet').length);
        tree.classList.add('abene-capture-live');
        tree.style.position = 'fixed';
        tree.style.setProperty('left', '0px', 'important');
        tree.style.setProperty('top', '0px', 'important');
        tree.style.opacity = '1';
        tree.style.zIndex = '2147483000';
        tree.style.width = g.w + 'px';
        tree.style.height = (n * g.h) + 'px';
        tree.style.background = '#fff';
        tree.style.overflow = 'visible';
        return n;
    }

    function grabCanvas(el, g, heightPx) {
        var opt = pdfOptions(g, 'tmp.pdf');
        opt.html2canvas.height = heightPx || g.h;
        opt.html2canvas.windowHeight = heightPx || g.h;
        opt.html2canvas.width = g.w;
        opt.html2canvas.windowWidth = g.w;
        return root.html2pdf().set(opt).from(el).toCanvas().get('canvas');
    }

    function canvasLooksEmpty(c) {
        try {
            if (!c || c.width < 8 || c.height < 8) return true;
            var probe = document.createElement('canvas');
            probe.width = 90;
            probe.height = 90;
            var ctx = probe.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, probe.width, probe.height);
            ctx.drawImage(c, 0, 0, probe.width, probe.height);
            var d = ctx.getImageData(0, 0, probe.width, probe.height).data;
            var ink = 0;
            var i;
            for (i = 0; i < d.length; i += 4) {
                if (d[i] < 248 || d[i + 1] < 248 || d[i + 2] < 248 || d[i + 3] < 250) ink++;
            }
            return ink < 15;
        } catch (e) {
            return false;
        }
    }

    function cropCanvas(src, g) {
        var scale = src.width / Math.max(1, g.w);
        var w = src.width;
        var h = Math.max(1, Math.round(g.h * scale));
        if (src.height === h && src.width === w) return src;
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(src, 0, 0, w, Math.min(src.height, h), 0, 0, w, Math.min(src.height, h));
        return c;
    }

    function releaseCanvas(canvas) {
        try {
            if (canvas) {
                canvas.width = 1;
                canvas.height = 1;
            }
        } catch (e) {}
    }

    function canvasInkScore(canvas) {
        try {
            if (!canvas || canvas.width < 8 || canvas.height < 8) return -1;
            var data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
            var score = 0;
            for (var i = 0; i < data.length; i += 32) {
                if (data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245) score++;
            }
            return score;
        } catch (e) {
            return -1;
        }
    }

    function captureBestSheetImage(sheet, g) {
        var bestImage = '';
        var bestScore = -1;
        var seq = Promise.resolve();
        [0, 1, 2].forEach(function () {
            seq = seq.then(afterLayout).then(function () {
                return grabCanvas(sheet, g, g.h);
            }).then(function (canvas) {
                var pageCanvas = cropCanvas(canvas, g);
                var score = canvasInkScore(pageCanvas);
                if (score > bestScore) {
                    bestImage = pageCanvas.toDataURL('image/jpeg', 0.94);
                    bestScore = score;
                }
                releaseCanvas(pageCanvas);
            });
        });
        return seq.then(function () {
            if (!bestImage) throw new Error('blank-page');
            return bestImage;
        });
    }

    function stampCanvas(pdf, canvasOrImage, g) {
        try {
            var image = typeof canvasOrImage === 'string' ? canvasOrImage : canvasOrImage.toDataURL('image/jpeg', 0.94);
            pdf.addImage(image, 'JPEG', 0, 0, g.wmm, g.hmm, undefined, 'NONE');
            return true;
        } catch (e1) {
            try {
                pdf.addImage(canvasOrImage, 'JPEG', 0, 0, g.wmm, g.hmm);
                return true;
            } catch (e2) {
                try {
                    pdf.addImage(canvasOrImage, 'PNG', 0, 0, g.wmm, g.hmm);
                    return true;
                } catch (e3) {
                    return false;
                }
            }
        }
    }

    function createJsPdf(g) {
        var orient = g.orientation === 'landscape' ? 'landscape' : 'portrait';
        var Ctor = (root.jspdf && root.jspdf.jsPDF) || root.jsPDF;
        if (typeof Ctor === 'function') {
            return Promise.resolve(new Ctor({
                unit: 'mm',
                format: [g.wmm, g.hmm],
                orientation: orient === 'landscape' ? 'l' : 'p',
                compress: true
            }));
        }
        var holder = document.createElement('div');
        holder.style.cssText = 'width:' + g.w + 'px;height:8px;background:#fff;';
        holder.appendChild(document.createTextNode('.'));
        document.body.appendChild(holder);
        return root.html2pdf().set(pdfOptions(g, 'tmp.pdf')).from(holder).toPdf().get('pdf').then(function (pdf) {
            if (holder.parentNode) holder.parentNode.removeChild(holder);
            return pdf;
        }).catch(function (err) {
            if (holder.parentNode) holder.parentNode.removeChild(holder);
            throw err;
        });
    }

    function captureSheets(tree, g) {
        var sheets = Array.prototype.slice.call(tree.querySelectorAll('.abene-export-sheet'));
        if (!sheets.length) return Promise.reject(new Error('no-sheets'));
        var seq = Promise.resolve([]);
        sheets.forEach(function (sheet, i) {
            seq = seq.then(function (acc) {
                sheets.forEach(function (s, j) {
                    s.style.display = j === i ? 'block' : 'none';
                });
                tree.style.height = g.h + 'px';
                return afterLayout().then(function () {
                    return captureBestSheetImage(sheet, g);
                }).then(function (pageImage) {
                    /* L'image choisie est déjà figée avant la page suivante. */
                    acc.push(pageImage);
                    return acc;
                });
            });
        });
        return seq.then(function (acc) {
            sheets.forEach(function (s) { s.style.display = 'block'; });
            tree.style.height = (sheets.length * g.h) + 'px';
            return acc;
        });
    }

    function savePagedPdf(tree, g, filename) {
        flattenExportDom(tree);
        sanitizeExportRoot(tree);
        showCaptureRoot(tree, g);
        var orient = g.orientation === 'landscape' ? 'landscape' : 'portrait';
        return afterLayout().then(function () {
            return captureSheets(tree, g);
        }).then(function (canvases) {
            if (!canvases.length) throw new Error('blank-canvas');
            return createJsPdf(g).then(function (pdf) {
                var stamped = 0;
                canvases.forEach(function (c, i) {
                    if (i > 0) pdf.addPage([g.wmm, g.hmm], orient);
                    else {
                        try { pdf.setPage(1); } catch (e0) {}
                    }
                    if (stampCanvas(pdf, c, g)) stamped++;
                });
                if (!stamped) throw new Error('pdf-stamp');
                pdf.save(filename);
            });
        });
    }

    function htmlElementToPdfBlob(el) {
        var g = geo();
        var hPx = Math.max(g.h, el.scrollHeight || el.offsetHeight || g.h);
        return grabCanvas(el, g, hPx).then(function (full) {
            if (canvasLooksEmpty(full)) throw new Error('blank-canvas');
            var scale = full.width / Math.max(1, g.w);
            var pageH = Math.max(1, Math.round(g.h * scale));
            var n = Math.max(1, Math.ceil(full.height / pageH));
            var orient = g.orientation === 'landscape' ? 'landscape' : 'portrait';
            return createJsPdf(g).then(function (pdf) {
                var i, c, ctx, sh, stamped = 0;
                for (i = 0; i < n; i++) {
                    if (i > 0) pdf.addPage([g.wmm, g.hmm], orient);
                    else {
                        try { pdf.setPage(1); } catch (e0) {}
                    }
                    c = document.createElement('canvas');
                    c.width = full.width;
                    c.height = pageH;
                    ctx = c.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, c.width, c.height);
                    sh = Math.min(pageH, full.height - i * pageH);
                    if (sh > 0) ctx.drawImage(full, 0, i * pageH, full.width, sh, 0, 0, full.width, sh);
                    if (stampCanvas(pdf, c, g)) stamped++;
                }
                if (!stamped) throw new Error('pdf-stamp');
                return pdf.output('blob');
            });
        });
    }

    var ExportApi = {
        get useEngine() { return useEngine; },
        set useEngine(v) { useEngine = !!v; },
        prepare: prepare,
        geo: geo,
        bodyHtml: bodyHtml,
        sanitize: sanitizeExportRoot,
        flatten: flattenExportDom,
        embedImages: embedImages,
        logoPng: logoPng,
        rasterizeImages: rasterizeImages,
        savePagedPdf: savePagedPdf,
        htmlElementToPdfBlob: htmlElementToPdfBlob
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
            if (useEngine && tree) {
                flattenExportDom(tree);
                sanitizeExportRoot(tree);
            }
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

    if (typeof root.abeneRemoveExportRoot === 'function' && !root.abeneRemoveExportRoot._abeneExport) {
        var origRm = root.abeneRemoveExportRoot;
        root.abeneRemoveExportRoot = function () {
            document.querySelectorAll('.html2pdf__overlay, .html2pdf__container').forEach(function (n) { n.remove(); });
            return origRm.apply(this, arguments);
        };
        root.abeneRemoveExportRoot._abeneExport = true;
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
            document.body.appendChild(tree);
            if (root.abeneHoldViewZoom) root.abeneHoldViewZoom();
            showCaptureRoot(tree, g);
            var ds = A().documentState || {};
            var name = ds.name || 'document';
            var donePdf = function () {
                if (root.abeneRemoveExportRoot) root.abeneRemoveExportRoot();
                if (root.abeneReleaseViewZoom) root.abeneReleaseViewZoom();
            };
            waitImages(tree).then(function () {
                return savePagedPdf(tree, g, name + '.pdf');
            }).then(donePdf).catch(function () {
                donePdf();
                if (typeof root.printDocument === 'function') root.printDocument();
            });
            if (typeof root.showToast === 'function' && typeof root.t === 'function') root.showToast(root.t('toastPdf'));
            if (typeof root.closeAllDropdowns === 'function') root.closeAllDropdowns();
        };
        root.exportPDF._abeneExport = true;
    }

    function wrapDocxPrep(origFn) {
        return async function () {
            if (!useEngine) return origFn.apply(this, arguments);
            wrapImageRun();
            wrapPushBlock();
            prepare();
            var box = document.createElement('div');
            box.innerHTML = bodyHtml();
            if (typeof flattenExportDom === 'function') flattenExportDom(box);
            box.className = 'page';
            box.style.cssText = 'position:fixed;left:0;top:0;width:' + (geo().w || 794) + 'px;background:#fff;z-index:0;opacity:1;padding:0;';
            document.body.appendChild(box);
            try {
                await waitImages(box);
                await rasterizeImages(box);
            } catch (eImg) {}
            var html = box.innerHTML;
            if (box.parentNode) box.parentNode.removeChild(box);
            var origClean = root.abeneGetCleanHtml;
            root.abeneGetCleanHtml = function () { return html; };
            try {
                return await origFn.apply(this, arguments);
            } catch (e) {
                root.abeneGetCleanHtml = origClean;
                return await origFn.apply(this, arguments);
            } finally {
                root.abeneGetCleanHtml = origClean;
            }
        };
    }

    if (typeof root.buildDocxBlob === 'function' && !root.buildDocxBlob._abeneExport) {
        root.buildDocxBlob = wrapDocxPrep(root.buildDocxBlob);
        root.buildDocxBlob._abeneExport = true;
    }

    if (typeof root.exportDocx === 'function' && !root.exportDocx._abeneExport) {
        /* exportDocx chama buildDocxBlob — só envolva se o helper não existir */
        if (!(root.buildDocxBlob && root.buildDocxBlob._abeneExport)) {
            root.exportDocx = wrapDocxPrep(root.exportDocx);
        }
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
