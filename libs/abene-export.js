/* Genius Raros — Export (P12).
   Éditeur paginé ≈ imprimir ≈ PDF. DOCX lit ABENE.Document.
   Les boutons Guardar / PDF / DOCX / Imprimir existants restent.
   Fix #6 (DOCX fidelity, additive): PageGeometry size/margins/orientation,
   page breaks, table header repeat, inline+floating images (CORS-safe),
   Modelo headers/footers, commercial orçamento/recibo structure.
   Commercial DOCX (additive): letterhead brand+title, dual goldbar,
   parties boxes, totals (grand navy), signatures/stamp, condições notes.
   PDF (html2pdf / paged capture) path is intentionally untouched.
   Audit #6 (2026-09-21): rasterize clamp = content width (not 54px); DOCX left += pageGutter.
   Remaining DOCX limits: absolute float z-order, complex nested HTML in cells,
   full CSS layout, watermarks, and pixel-perfect commercial chrome. */
(function (root) {
    root.ABENE = root.ABENE || {};
    var useEngine = true;
    try {
        if (root.localStorage && root.localStorage.getItem('abeneExportEngine') === '0') useEngine = false;
    } catch (e0) {}

    var _docxImgSkipCount = 0;

    function resetDocxImgSkips() { _docxImgSkipCount = 0; }

    function noteDocxImgSkip() {
        _docxImgSkipCount = (_docxImgSkipCount || 0) + 1;
    }

    function countDocxImgSkips(rootEl) {
        var n = _docxImgSkipCount || 0;
        try {
            if (rootEl && rootEl.querySelectorAll) {
                var marked = rootEl.querySelectorAll('[data-abene-docx-img="skipped"]');
                if (marked && marked.length > n) n = marked.length;
            }
        } catch (eC) {}
        return n;
    }

    var DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    function safeDocxFilename(filename) {
        var name = String(filename || 'document').replace(/\.docx$/i, '');
        name = name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/[. ]+$/g, '')
            .trim()
            .slice(0, 180);
        if (!name) name = 'document';
        if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name)) name = 'document-' + name;
        return name + '.docx';
    }

    function beginDocxSave(filename) {
        var name = safeDocxFilename(filename);
        if (typeof root.showSaveFilePicker !== 'function') return null;
        var options = {
            suggestedName: name,
            types: [{ description: 'Word', accept: {} }]
        };
        options.types[0].accept[DOCX_MIME] = ['.docx'];
        try {
            return root.showSaveFilePicker(options).then(function (handle) {
                return { handle: handle, filename: name, cancelled: false };
            }).catch(function (err) {
                return {
                    handle: null,
                    filename: name,
                    cancelled: !!(err && err.name === 'AbortError'),
                    failed: !(err && err.name === 'AbortError')
                };
            });
        } catch (errPicker) {
            return Promise.resolve({
                handle: null,
                filename: name,
                cancelled: !!(errPicker && errPicker.name === 'AbortError'),
                failed: !(errPicker && errPicker.name === 'AbortError')
            });
        }
    }

    function writeDocxSaveTarget(target, content) {
        var blob = content instanceof Blob ? content : new Blob([content], { type: DOCX_MIME });
        if (blob.type !== DOCX_MIME && typeof blob.slice === 'function') {
            blob = blob.slice(0, blob.size, DOCX_MIME);
        }
        if (!blob.size) return Promise.reject(new Error('empty-docx'));
        if (!target || !target.handle || typeof target.handle.createWritable !== 'function') {
            return Promise.reject(new Error('docx-save-target-unavailable'));
        }
        return target.handle.createWritable().then(function (writable) {
            return Promise.resolve(writable.write(blob)).then(function () {
                return writable.close();
            }).then(function () {
                return {
                    filename: target.filename || 'document.docx',
                    size: blob.size,
                    type: blob.type || DOCX_MIME
                };
            });
        });
    }

    function clickDocxDownload(href, name, cleanup, cleanupDelay) {
        var link = document.createElement('a');
        link.href = href;
        link.download = name;
        link.rel = 'noopener';
        link.style.display = 'none';
        (document.body || document.documentElement).appendChild(link);
        link.click();
        root.setTimeout(function () {
            if (link.parentNode) link.parentNode.removeChild(link);
            if (typeof cleanup === 'function') cleanup();
        }, cleanupDelay || 1000);
    }

    function downloadDocxObjectUrl(blob, name) {
        var url = root.URL.createObjectURL(blob);
        // Chrome may still be reading the Blob after click(); revoking immediately can cancel
        // the download and leave a UUID entry marked "Deleted".
        clickDocxDownload(url, name, function () {
            root.URL.revokeObjectURL(url);
        }, 60000);
        return true;
    }

    function downloadDocxBlob(content, filename) {
        var blob = content instanceof Blob ? content : new Blob([content], { type: DOCX_MIME });
        if (blob.type !== DOCX_MIME && typeof blob.slice === 'function') {
            blob = blob.slice(0, blob.size, DOCX_MIME);
        }
        var name = safeDocxFilename(filename);
        if (!blob.size) throw new Error('empty-docx');
        var metadata = { filename: name, size: blob.size, type: blob.type || DOCX_MIME };

        // Keep this synchronous when called from a click: Chrome then preserves download=name.
        try {
            downloadDocxObjectUrl(blob, name);
            return metadata;
        } catch (errObjectUrl) {}

        // Distant fallback for browsers without Blob URL support.
        if (root.FileReader && blob.size <= 64 * 1024 * 1024) {
            var reader = new root.FileReader();
            reader.onload = function () {
                if (typeof reader.result === 'string' && reader.result.indexOf('data:') === 0) {
                    clickDocxDownload(reader.result, name);
                }
            };
            reader.readAsDataURL(blob);
            return metadata;
        }
        throw new Error('docx-download-unavailable');
    }

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
            },
            paperSizeId: pg.paperSize || A().pageSizeId || 'a4'
        };
    }

    /* Portrait paper size (docx wants unswapped w/h + orientation flag). */
    function docxPaperProps() {
        var pg = G();
        var a = A();
        var orient = (pg.orientation || a.pageOrientation || 'portrait') === 'landscape' ? 'landscape' : 'portrait';
        var portrait = { w: 794, h: 1123 };
        if (typeof pg.sizePx === 'function') {
            try { portrait = pg.sizePx(pg.paperSize || a.pageSizeId || 'a4') || portrait; } catch (e0) {}
        }
        if (a.pageSize && a.pageSize.w && a.pageSize.h) {
            portrait = { w: Number(a.pageSize.w) || portrait.w, h: Number(a.pageSize.h) || portrait.h };
        }
        var m = {
            top: pg.marginTop != null ? pg.marginTop : ((a.pageMargins && a.pageMargins.top) || 96),
            right: pg.marginRight != null ? pg.marginRight : ((a.pageMargins && a.pageMargins.right) || 96),
            bottom: pg.marginBottom != null ? pg.marginBottom : ((a.pageMargins && a.pageMargins.bottom) || 96),
            left: pg.marginLeft != null ? pg.marginLeft : ((a.pageMargins && a.pageMargins.left) || 96)
        };
        /* Match on-screen left pad: margins.left + pageGutter (Modelo / duplex). */
        try {
            var gut = Number(a.pageGutter);
            if (!isFinite(gut) || gut < 0) gut = 0;
            if (gut) m.left = (Number(m.left) || 0) + gut;
        } catch (eGut) {}
        var dpi = pg.dpi || 96;
        var pxToTwip = function (px) { return Math.round((Number(px) || 0) * 1440 / dpi); };
        return {
            portrait: portrait,
            orientation: orient,
            margins: m,
            paperSizeId: pg.paperSize || a.pageSizeId || 'a4',
            pxToTwip: pxToTwip,
            dpi: dpi
        };
    }

    function cssColorToHexLocal(c) {
        if (!c) return '';
        c = String(c).trim();
        if (c.charAt(0) === '#') return c.replace('#', '').slice(0, 6);
        var m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (m) return [m[1], m[2], m[3]].map(function (x) { return ('0' + Number(x).toString(16)).slice(-2); }).join('');
        return '';
    }

    function docxBorderLocal(api, color, sz) {
        var BorderStyle = (root.docx && root.docx.BorderStyle) || (api && api.BorderStyle);
        var style = BorderStyle ? BorderStyle.SINGLE : 'single';
        return { style: style, size: sz || 4, color: color || '0B1223' };
    }

    function modeloZoneText(kind) {
        try {
            var chrome = document.getElementById('pageChrome');
            if (!chrome) return '';
            var sel = kind === 'footer'
                ? '.page-footer-zone .footer-content'
                : '.page-header-zone .header-content';
            var zone = chrome.querySelector(sel);
            if (!zone) return '';
            var clone = zone.cloneNode(true);
            clone.querySelectorAll('.hf-placeholder, .hf-tab, .hf-rule, .hf-close').forEach(function (n) { n.remove(); });
            return String(clone.innerText || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
        } catch (e) { return ''; }
    }

    function readModeloHf() {
        var a = A();
        var tpl = a.pageHeaderTemplate || '';
        var fields = a.pageHeaderFields || {};
        var headerText = a.pageHeaderText || '';
        var footerText = a.pageFooterText;
        if (footerText == null || footerText === undefined) footerText = 'Página {PAGE} / {NUMPAGES}';
        try {
            if (!tpl && root.localStorage) tpl = root.localStorage.getItem('abeneHeaderTemplate') || '';
            if (!headerText && root.localStorage) headerText = root.localStorage.getItem('abeneHeader') || '';
            if ((footerText == null || footerText === '') && root.localStorage) {
                var ft = root.localStorage.getItem('abeneFooter');
                if (ft != null) footerText = ft;
            }
            if ((!fields || !Object.keys(fields).length) && root.localStorage) {
                try { fields = JSON.parse(root.localStorage.getItem('abeneHeaderFields') || '{}') || {}; } catch (eF) { fields = {}; }
            }
        } catch (eLs) {}
        if (!tpl) tpl = headerText ? 'text' : 'blank';
        var liveH = modeloZoneText('header');
        var liveF = modeloZoneText('footer');
        if (!headerText && liveH) headerText = liveH;
        if (!footerText && liveF) footerText = liveF;
        if (!footerText) footerText = 'Página {PAGE} / {NUMPAGES}';
        return {
            headerTpl: tpl,
            headerFields: fields || {},
            headerText: headerText || liveH || '',
            footerText: footerText || liveF || 'Página {PAGE} / {NUMPAGES}',
            liveHeader: liveH,
            liveFooter: liveF,
            companyName: ((a.companyData) || {}).name || 'Genius Raros'
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
        if (typeof root.abeneCancelCrop === 'function') {
            try { root.abeneCancelCrop(); } catch (eCrop) {}
        }
        document.querySelectorAll('.abene-crop-overlay').forEach(function (n) {
            if (n.parentNode) n.parentNode.removeChild(n);
        });
        if (editor && editor.classList.contains('editing-header-footer') && typeof root.abeneCloseHeaderFooter === 'function') {
            root.abeneCloseHeaderFooter();
        }
        if (root.ABENE && root.ABENE.Images && typeof root.ABENE.Images.wrapLoose === 'function') {
            try { root.ABENE.Images.wrapLoose(editor); } catch (eWrap) {}
        }
        if (root.ABENE && root.ABENE.Images && typeof root.ABENE.Images.syncAnchors === 'function') {
            try { root.ABENE.Images.syncAnchors(editor); } catch (e1) {}
        }
        if (typeof root.abeneRenumberCaptions === 'function') {
            try { root.abeneRenumberCaptions(); } catch (eCap) {}
        }
        if (typeof root.updateAllFields === 'function') {
            try { root.updateAllFields({ silent: true }); } catch (eFld) {}
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
        rootEl.querySelectorAll('.abene-check-toolbar, .abene-check-del').forEach(function (n) { n.remove(); });
        rootEl.querySelectorAll('td.abene-check-result, .abene-check-table td').forEach(function (td) {
            if (!td.querySelector || !td.querySelector('.abene-check-btn')) return;
            var tr = td.parentNode;
            var key = (tr && tr.getAttribute && tr.getAttribute('data-check-result')) || '';
            var on = td.querySelector('.abene-check-btn.on') || (key && td.querySelector('.abene-check-btn[data-check-val="' + key + '"]'));
            var label = on ? String(on.textContent || '').replace(/\s+/g, ' ').trim() : '';
            td.textContent = label || ' ';
            td.removeAttribute('contenteditable');
        });
        rootEl.querySelectorAll('.abene-check-wrap').forEach(function (w) {
            var table = w.querySelector('table');
            if (table && w.parentNode) {
                w.parentNode.insertBefore(table, w);
                w.parentNode.removeChild(w);
            }
        });
        return rootEl;
    }

    function sanitizeExportRoot(rootEl) {
        if (!rootEl || !rootEl.querySelectorAll) return rootEl;
        rootEl.querySelectorAll('.abene-obj-resize, .abene-tbox-bar, .image-handle, .hf-tab, .hf-rule, .hf-close, .page-gap-band, .hf-placeholder, .abene-crop-overlay, #abeneCropBar, .abene-check-toolbar, .abene-check-del').forEach(function (n) { n.remove(); });
        rootEl.querySelectorAll('.abene-fill').forEach(function (el) {
            el.style.border = 'none';
            el.style.background = 'transparent';
            el.style.padding = '0';
        });
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

    function markImageCorsSkip(img, reason) {
        if (!img || !img.setAttribute) return;
        try {
            var already = img.getAttribute && img.getAttribute('data-abene-docx-img') === 'skipped';
            img.setAttribute('data-abene-docx-img', 'skipped');
            if (reason) img.setAttribute('data-abene-docx-img-reason', String(reason).slice(0, 80));
            if (!already) noteDocxImgSkip();
        } catch (e0) {}
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
                    /* Cap to page content width — never crush to logo-sized 54px (audit #6). */
                    var maxW = 700;
                    try {
                        var gCap = geo();
                        maxW = Math.max(200, (gCap.w || 794) - (gCap.margins.left || 96) - (gCap.margins.right || 96));
                    } catch (eCap) {}
                    if (boxW > maxW) {
                        var ratio = boxH / Math.max(1, boxW);
                        boxW = maxW;
                        boxH = Math.max(1, Math.round(maxW * ratio));
                    }
                    var url = canvasFromImage(el);
                    if (url && url.indexOf('data:image/png') === 0) {
                        img.setAttribute('src', url);
                        img.removeAttribute('srcset');
                        img.style.setProperty('width', Math.max(1, boxW) + 'px', 'important');
                        img.style.setProperty('height', Math.max(1, boxH) + 'px', 'important');
                        img.setAttribute('width', String(Math.round(boxW)));
                        img.setAttribute('height', String(Math.round(boxH)));
                        img.removeAttribute('data-abene-docx-img');
                    }
                } catch (eCors) {
                    /* Tainted canvas / CORS — skip image rather than abort DOCX. */
                    markImageCorsSkip(img, 'cors-canvas');
                }
                finish();
            };
            if (img.complete && img.naturalWidth) {
                applyFrom(img);
                return;
            }
            var probe = new Image();
            try { probe.crossOrigin = 'anonymous'; } catch (eX) {}
            probe.onload = function () { applyFrom(probe.naturalWidth ? probe : img); };
            probe.onerror = function () {
                /* Retry without CORS; if still fails, skip gracefully. */
                var probe2 = new Image();
                probe2.onload = function () { applyFrom(probe2.naturalWidth ? probe2 : img); };
                probe2.onerror = function () {
                    if (img.complete && img.naturalWidth) applyFrom(img);
                    else {
                        markImageCorsSkip(img, 'load-error');
                        finish();
                    }
                };
                probe2.src = src;
            };
            probe.src = src;
            setTimeout(function () {
                if (finished) return;
                if (img.complete && img.naturalWidth) applyFrom(img);
                else {
                    markImageCorsSkip(img, 'timeout');
                    finish();
                }
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
            if (img.getAttribute && img.getAttribute('data-abene-docx-img') === 'skipped') return null;
            var src = img.src || img.getAttribute('src') || '';
            if (!/^data:image\//i.test(src)) return orig.apply(this, arguments);
            var pic = img.closest && img.closest('.abene-pic, [data-abene-obj="pic"]');
            var wrap = pic ? (pic.getAttribute('data-wrap') || '') : '';
            var w = Math.min(500, parseFloat(img.style.width) || img.naturalWidth || img.offsetWidth || 320);
            var h = img.naturalHeight && img.naturalWidth
                ? Math.round(w * img.naturalHeight / img.naturalWidth)
                : Math.min(400, parseFloat(img.style.height) || img.offsetHeight || 240);
            var opts = { data: src, transformation: { width: w, height: Math.max(24, h) } };
            var D = root.docx;
            if (pic && D && D.TextWrappingType && wrap && wrap !== 'none' && wrap !== 'inline' && wrap !== 'center' && wrap !== 'above' && wrap !== 'below') {
                var g = geo();
                var m = g.margins || { top: 96, right: 96, bottom: 96, left: 96 };
                var dx = Number(pic.getAttribute('data-abene-dx')) || 0;
                var dy = Number(pic.getAttribute('data-abene-dy')) || 0;
                var left = parseFloat(pic.style.left);
                var top = parseFloat(pic.style.top);
                if (!isFinite(left)) left = dx;
                if (!isFinite(top)) top = dy;
                var pageH = g.h || 1123;
                var pageTop = top >= pageH ? (top % pageH) : top;
                var isFloat = wrap === 'left' || wrap === 'right';
                var isFree = wrap === 'free' || wrap === 'behind' || wrap === 'front';
                var relH = D.HorizontalPositionRelativeFrom;
                var relV = D.VerticalPositionRelativeFrom;
                if (isFloat) {
                    var contentW = Math.max(40, (g.w || 794) - (m.left || 0) - (m.right || 0));
                    opts.floating = {
                        horizontalPosition: {
                            relative: relH ? relH.MARGIN : undefined,
                            offset: wrap === 'right' ? pxToEmu(Math.max(0, contentW - w)) : 0
                        },
                        verticalPosition: {
                            relative: relV ? relV.PARAGRAPH : undefined,
                            offset: 0
                        },
                        wrap: { type: D.TextWrappingType.SQUARE }
                    };
                } else if (isFree) {
                    opts.floating = {
                        horizontalPosition: {
                            relative: relH ? relH.PAGE : undefined,
                            offset: pxToEmu(Math.max(0, left))
                        },
                        verticalPosition: {
                            relative: relV ? relV.PAGE : undefined,
                            offset: pxToEmu(Math.max(0, pageTop))
                        },
                        wrap: { type: D.TextWrappingType.NONE },
                        behindDocument: wrap === 'behind',
                        allowOverlap: true
                    };
                }
            }
            try { return new ImageRun(opts); } catch (e) { return orig.apply(this, arguments); }
        };
        root.docxImageRun._abeneExport = true;
    }

    function isPicHost(node) {
        if (!node || !node.classList) return false;
        if (node.classList.contains('abene-pic')) return true;
        if (node.tagName !== 'P' || !node.querySelector) return false;
        var pic = node.querySelector(':scope > .abene-pic');
        if (!pic) return false;
        var only = true;
        Array.from(node.childNodes).forEach(function (ch) {
            if (ch.nodeType === 3 && !String(ch.textContent || '').replace(/\u200b/g, '').trim()) return;
            if (ch.nodeType === 1 && (ch.classList.contains('abene-pic') || ch.tagName === 'BR')) return;
            only = false;
        });
        return only;
    }
    function emitFigure(node, children, api) {
        var pic = node.classList.contains('abene-pic') ? node : node.querySelector('.abene-pic');
        var img = (pic || node).querySelector('img');
        var cap = (pic || node).querySelector('.abene-caption, [data-caption-for]');
        var ir = img && typeof root.docxImageRun === 'function' ? root.docxImageRun(img, api.ImageRun) : null;
        if (ir) {
            children.push(new api.Paragraph({
                children: [ir],
                alignment: api.AlignmentType.CENTER,
                spacing: { after: cap ? 40 : 160 }
            }));
        }
        if (cap) {
            children.push(new api.Paragraph({
                children: [new api.TextRun({
                    text: String(cap.innerText || '').replace(/\s+/g, ' ').trim() || ' ',
                    italics: true,
                    font: 'Calibri',
                    size: 20
                })],
                alignment: api.AlignmentType.CENTER,
                spacing: { after: 200 }
            }));
        }
    }
    function emitFlowPics(node, children, api, orig, ctx) {
        var pics = node.querySelectorAll ? Array.prototype.slice.call(node.querySelectorAll(':scope > .abene-pic, :scope > [data-abene-obj="pic"]')) : [];
        if (!pics.length) return false;
        var removed = [];
        pics.forEach(function (pic) {
            var w = pic.getAttribute('data-wrap') || 'none';
            if (w === 'none' || w === 'inline' || w === 'left' || w === 'right') return;
            removed.push({ pic: pic, next: pic.nextSibling, parent: pic.parentNode, wrap: w });
            if (pic.parentNode) pic.parentNode.removeChild(pic);
        });
        if (!removed.length) return false;
        removed.forEach(function (r) {
            if (r.wrap === 'below') return;
            emitFigure(r.pic, children, api);
        });
        orig.apply(ctx || null, [node, children, api]);
        removed.forEach(function (r) {
            if (r.wrap === 'below') emitFigure(r.pic, children, api);
            if (!r.parent) return;
            if (r.next && r.next.parentNode === r.parent) r.parent.insertBefore(r.pic, r.next);
            else r.parent.appendChild(r.pic);
        });
        return true;
    }
    function emitDocxPageBreak(children, api) {
        if (!api || !api.PageBreak || !api.Paragraph) return;
        children.push(new api.Paragraph({ children: [new api.PageBreak()] }));
    }

    function noneBorderLocal(api) {
        var none = docxBorderLocal(api, 'FFFFFF', 0);
        none.style = (root.docx && root.docx.BorderStyle && root.docx.BorderStyle.NONE) || 'nil';
        return none;
    }
    function borderBoxLocal(api, color, sz) {
        var b = docxBorderLocal(api, color || '0B1223', sz || 8);
        return { top: b, bottom: b, left: b, right: b };
    }
    function plainTextLocal(el) {
        return String((el && (el.innerText || el.textContent)) || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    }
    function splitNoteLines(node) {
        var lines = [];
        function walk(n) {
            if (!n) return;
            if (n.nodeType === 3) {
                var raw = String(n.textContent || '').replace(/\u00a0/g, ' ');
                if (!raw) return;
                raw.split(/\n/).forEach(function (part) {
                    if (lines.length && part === '' && lines[lines.length - 1] === '') return;
                    if (lines.length === 0 && !String(part).trim()) return;
                    lines.push(part);
                });
                return;
            }
            if (n.nodeType !== 1) return;
            var tag = String(n.tagName || '').toUpperCase();
            if (tag === 'BR') { lines.push(''); return; }
            if (tag === 'STRONG' || tag === 'B' || tag === 'EM' || tag === 'I' || tag === 'SPAN') {
                walkChildren(n);
                return;
            }
            if (tag === 'P' || tag === 'DIV') {
                if (lines.length && lines[lines.length - 1] !== '') lines.push('');
                walkChildren(n);
                return;
            }
            walkChildren(n);
        }
        function walkChildren(n) {
            Array.prototype.forEach.call(n.childNodes || [], walk);
        }
        walkChildren(node);
        /* collapse trailing empties */
        while (lines.length && !String(lines[lines.length - 1]).trim()) lines.pop();
        if (!lines.length) {
            var t = plainTextLocal(node);
            if (t) lines.push(t);
        }
        return lines;
    }
    function emitStyledPara(api, text, opts) {
        opts = opts || {};
        var Paragraph = api.Paragraph, TextRun = api.TextRun, AlignmentType = api.AlignmentType;
        var para = {
            alignment: opts.align || AlignmentType.LEFT,
            spacing: opts.spacing || { after: 60 },
            children: [new TextRun({
                text: (text == null || text === '') ? ' ' : String(text),
                font: 'Calibri',
                bold: !!opts.bold,
                italics: !!opts.italics,
                color: opts.color || '0B1223',
                size: opts.size || 20
            })]
        };
        if (opts.border) para.border = opts.border;
        if (opts.indent) para.indent = opts.indent;
        return new Paragraph(para);
    }
    function emitBrandRow(node, children, api) {
        var Table = api.Table, TableRow = api.TableRow, TableCell = api.TableCell;
        var WidthType = api.WidthType, Paragraph = api.Paragraph, TextRun = api.TextRun;
        var ImageRun = api.ImageRun, AlignmentType = api.AlignmentType;
        var img = node.querySelector && node.querySelector('img.gr-brand-mark, img');
        var textHost = node.querySelector && (node.querySelector('.gr-brand-text') || node);
        var nameEl = textHost && textHost.querySelector && textHost.querySelector('.gr-co-name');
        var sloganEl = textHost && textHost.querySelector && textHost.querySelector('.gr-slogan');
        var leftKids = [];
        var ir = img && typeof root.docxImageRun === 'function' ? root.docxImageRun(img, ImageRun) : null;
        if (ir) leftKids.push(new Paragraph({ children: [ir] }));
        else leftKids.push(new Paragraph({ children: [new TextRun({ text: ' ', font: 'Calibri' })] }));
        var rightKids = [];
        if (nameEl) rightKids.push(emitStyledPara(api, plainTextLocal(nameEl), { bold: true, size: 32, color: '0B1223', spacing: { after: 40 } }));
        if (sloganEl) rightKids.push(emitStyledPara(api, plainTextLocal(sloganEl), { bold: true, size: 15, color: '8F7328', spacing: { after: 40 } }));
        if (!rightKids.length) {
            var fallback = plainTextLocal(textHost);
            if (fallback) rightKids.push(emitStyledPara(api, fallback, { bold: true, size: 28 }));
            else rightKids.push(new Paragraph({ children: [new TextRun({ text: ' ', font: 'Calibri' })] }));
        }
        var none = noneBorderLocal(api);
        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        width: { size: 18, type: WidthType.PERCENTAGE },
                        borders: { top: none, bottom: none, left: none, right: none },
                        margins: { top: 40, bottom: 40, left: 0, right: 80 },
                        children: leftKids
                    }),
                    new TableCell({
                        width: { size: 82, type: WidthType.PERCENTAGE },
                        borders: { top: none, bottom: none, left: none, right: none },
                        margins: { top: 40, bottom: 40, left: 40, right: 40 },
                        children: rightKids
                    })
                ]
            })]
        }));
        return true;
    }
    function emitPartyBox(node, children, api) {
        var Table = api.Table, TableRow = api.TableRow, TableCell = api.TableCell;
        var WidthType = api.WidthType, Paragraph = api.Paragraph, TextRun = api.TextRun;
        var ShadingType = api.ShadingType;
        var label = node.querySelector && node.querySelector('.gr-party-label');
        var body = node.querySelector && node.querySelector('.gr-party-body');
        var labelTxt = plainTextLocal(label) || ' ';
        var bodyLines = body ? splitNoteLines(body) : [plainTextLocal(node)];
        if (!bodyLines.length) bodyLines = [' '];
        var navy = docxBorderLocal(api, '0B1223', 8);
        var gold = docxBorderLocal(api, 'C9A84C', 18);
        var bodyParas = bodyLines.map(function (ln, idx) {
            var t = String(ln || '');
            var isStrong = idx === 0 && body && body.querySelector && body.querySelector('strong');
            return new Paragraph({
                spacing: { after: 40 },
                children: [new TextRun({
                    text: t.trim() ? t : ' ',
                    font: 'Calibri',
                    bold: !!(isStrong && idx === 0),
                    size: (isStrong && idx === 0) ? 22 : 20,
                    color: '0B1223'
                })]
            });
        });
        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    cantSplit: true,
                    children: [new TableCell({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        shading: ShadingType ? { type: ShadingType.CLEAR, fill: '0B1223' } : undefined,
                        borders: { top: navy, left: navy, right: navy, bottom: gold },
                        margins: { top: 40, bottom: 40, left: 80, right: 80 },
                        children: [new Paragraph({
                            children: [new TextRun({
                                text: labelTxt.toUpperCase(),
                                font: 'Calibri', bold: true, color: 'F8F6F0', size: 15
                            })]
                        })]
                    })]
                }),
                new TableRow({
                    cantSplit: true,
                    children: [new TableCell({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: { top: navy, bottom: navy, left: navy, right: navy },
                        margins: { top: 80, bottom: 80, left: 90, right: 90 },
                        children: bodyParas
                    })]
                })
            ]
        }));
        children.push(new Paragraph({ children: [new TextRun({ text: ' ', font: 'Calibri' })], spacing: { after: 60 } }));
        return true;
    }
    function emitSignLine(node, children, api) {
        var AlignmentType = api.AlignmentType;
        var label = plainTextLocal(node) || ' ';
        children.push(emitStyledPara(api, ' ', {
            align: AlignmentType.CENTER,
            spacing: { before: 200, after: 0 },
            size: 18
        }));
        children.push(emitStyledPara(api, label, {
            align: AlignmentType.CENTER,
            bold: true,
            size: 19,
            color: '0B1223',
            spacing: { before: 280, after: 100 },
            border: { top: { color: '0B1223', space: 10, style: 'single', size: 12 } }
        }));
        return true;
    }
    function emitStamp(node, children, api) {
        var Table = api.Table, TableRow = api.TableRow, TableCell = api.TableCell;
        var WidthType = api.WidthType, Paragraph = api.Paragraph, TextRun = api.TextRun;
        var AlignmentType = api.AlignmentType;
        var txt = plainTextLocal(node) || ' ';
        var b = docxBorderLocal(api, '0B1223', 18);
        children.push(new Table({
            width: { size: 55, type: WidthType.PERCENTAGE },
            rows: [new TableRow({
                cantSplit: true,
                children: [new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: { top: b, bottom: b, left: b, right: b },
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({
                            text: txt.toUpperCase(),
                            font: 'Calibri', bold: true, size: 24, color: '0B1223'
                        })]
                    })]
                })]
            })]
        }));
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: ' ', font: 'Calibri' })],
            spacing: { after: 80 }
        }));
        return true;
    }
    function emitNoteBlock(node, children, api, kind) {
        var Table = api.Table, TableRow = api.TableRow, TableCell = api.TableCell;
        var WidthType = api.WidthType, Paragraph = api.Paragraph, TextRun = api.TextRun;
        var ShadingType = api.ShadingType;
        var lines = splitNoteLines(node);
        if (!lines.length) lines = [plainTextLocal(node) || ' '];
        var gold = docxBorderLocal(api, 'C9A84C', 24);
        var soft = docxBorderLocal(api, 'D4CFC2', 4);
        var paras = [];
        lines.forEach(function (ln, idx) {
            var raw = String(ln || '');
            var isTitle = idx === 0 && /^(Condições|Condicoes|Notas|Pagamento)\b/i.test(raw.trim());
            var body = raw;
            if (isTitle) {
                paras.push(new Paragraph({
                    spacing: { after: 60 },
                    children: [new TextRun({
                        text: raw.trim(),
                        font: 'Calibri', bold: true, size: 20, color: '0B1223'
                    })]
                }));
                return;
            }
            paras.push(new Paragraph({
                spacing: { after: 40 },
                children: [new TextRun({
                    text: body.trim() ? body : ' ',
                    font: 'Calibri',
                    size: kind === 'iva' ? 18 : 20,
                    italics: kind === 'iva',
                    color: kind === 'iva' ? '333333' : '1A1A1A'
                })]
            }));
        });
        if (!paras.length) paras.push(new Paragraph({ children: [new TextRun({ text: ' ', font: 'Calibri' })] }));
        if (kind === 'iva' || kind === 'foot') {
            paras.forEach(function (p) { children.push(p); });
            if (kind === 'foot') {
                /* gold top rule above footer line already approximated via spacing */
            }
            return true;
        }
        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({
                cantSplit: true,
                children: [new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    shading: ShadingType ? { type: ShadingType.CLEAR, fill: 'F7F4EB' } : undefined,
                    borders: { top: soft, bottom: soft, right: soft, left: gold },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    children: paras
                })]
            })]
        }));
        children.push(new Paragraph({ children: [new TextRun({ text: ' ', font: 'Calibri' })], spacing: { after: 80 } }));
        return true;
    }
    function emitDocxFoot(node, children, api) {
        var AlignmentType = api.AlignmentType;
        var lines = splitNoteLines(node);
        if (!lines.length) lines = [plainTextLocal(node) || ' '];
        children.push(emitStyledPara(api, ' ', {
            align: AlignmentType.CENTER,
            spacing: { before: 160, after: 0 },
            border: { top: { color: 'C9A84C', space: 8, style: 'single', size: 12 } },
            size: 14
        }));
        lines.forEach(function (ln) {
            children.push(emitStyledPara(api, String(ln || '').trim() || ' ', {
                align: AlignmentType.CENTER,
                size: 15,
                color: '333333',
                spacing: { after: 40 }
            }));
        });
        return true;
    }
    function emitTotalsRight(node, children, api) {
        var Table = api.Table, TableRow = api.TableRow, TableCell = api.TableCell;
        var WidthType = api.WidthType, Paragraph = api.Paragraph, TextRun = api.TextRun;
        var ShadingType = api.ShadingType, AlignmentType = api.AlignmentType;
        var none = noneBorderLocal(api);
        var inner = [];
        emitDocxTable(node, inner, api, { totalsLayout: true });
        if (!inner.length) return;
        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        width: { size: 48, type: WidthType.PERCENTAGE },
                        borders: { top: none, bottom: none, left: none, right: none },
                        children: [new Paragraph({ children: [new TextRun({ text: ' ', font: 'Calibri' })] })]
                    }),
                    new TableCell({
                        width: { size: 52, type: WidthType.PERCENTAGE },
                        borders: { top: none, bottom: none, left: none, right: none },
                        margins: { top: 0, bottom: 0, left: 0, right: 0 },
                        children: inner
                    })
                ]
            })]
        }));
    }

    function emitCellBlocks(cell, api) {
        var Paragraph = api.Paragraph, TextRun = api.TextRun, ImageRun = api.ImageRun;
        var AlignmentType = api.AlignmentType;
        var out = [];
        var hasBlock = false;
        Array.prototype.forEach.call(cell.childNodes || [], function (ch) {
            if (ch.nodeType === 1 && /^(DIV|P|H[1-6]|TABLE|UL|OL|BLOCKQUOTE)$/i.test(ch.tagName)) hasBlock = true;
        });
        if (!hasBlock) {
            var runs = typeof root.docxRuns === 'function'
                ? root.docxRuns(cell, TextRun, ImageRun)
                : [new TextRun({ text: String(cell.innerText || ' ').replace(/\s+/g, ' ').trim() || ' ', font: 'Calibri' })];
            var align = typeof root.docxAlign === 'function' ? root.docxAlign(cell, AlignmentType) : AlignmentType.LEFT;
            if (cell.classList && (cell.classList.contains('gr-lh-doc') || cell.classList.contains('c-eur'))) {
                align = AlignmentType.RIGHT;
            }
            out.push(new Paragraph({ children: runs, alignment: align }));
            return out;
        }
        Array.prototype.forEach.call(cell.childNodes || [], function (ch) {
            if (ch.nodeType === 3) {
                var t = String(ch.textContent || '').replace(/\u00a0/g, ' ').trim();
                if (t) out.push(new Paragraph({ children: [new TextRun({ text: t, font: 'Calibri' })] }));
                return;
            }
            if (ch.nodeType !== 1) return;
            if (ch.tagName === 'TABLE') {
                emitDocxTable(ch, out, api);
                return;
            }
            if (ch.tagName === 'BR') {
                out.push(new Paragraph({ children: [new TextRun({ text: ' ' })] }));
                return;
            }
            if (typeof root.docxPushBlock === 'function') {
                var before = out.length;
                try {
                    root.docxPushBlock(ch, out, api);
                } catch (ePush) {
                    var txt = String(ch.innerText || '').replace(/\s+/g, ' ').trim();
                    if (txt) out.push(new Paragraph({ children: [new TextRun({ text: txt, font: 'Calibri' })] }));
                }
                if (out.length === before) {
                    var t2 = String(ch.innerText || '').replace(/\s+/g, ' ').trim();
                    if (t2) out.push(new Paragraph({ children: [new TextRun({ text: t2, font: 'Calibri' })] }));
                }
            }
        });
        if (!out.length) out.push(new Paragraph({ children: [new TextRun({ text: ' ' })] }));
        return out;
    }

    function emitDocxTable(node, children, api, layoutOpts) {
        if (!node || !api || !api.Table) return;
        if (node.getAttribute && node.getAttribute('data-abene-cont')) return;
        layoutOpts = layoutOpts || {};
        var Table = api.Table, TableRow = api.TableRow, TableCell = api.TableCell;
        var WidthType = api.WidthType, Paragraph = api.Paragraph, TextRun = api.TextRun;
        var ImageRun = api.ImageRun, ShadingType = api.ShadingType, AlignmentType = api.AlignmentType;
        var cls = String(node.className || '');
        var isItems = /\bgr-items\b|\babene-quote-table\b|\bdevis-items-table\b/.test(cls);
        var isMeta = /\bgr-meta\b/.test(cls);
        var isKv = /\bgr-kv\b/.test(cls);
        var isTotals = /\bgr-totals\b/.test(cls);
        var isLetter = /\bgr-letterhead\b/.test(cls);
        var isParties = /\bgr-parties\b/.test(cls);
        var isSigns = /\bgr-signs\b/.test(cls);
        var isPartiesOrSigns = isParties || isSigns;
        var tblW = Math.max(1, node.offsetWidth || 600);
        var colCount = 0;
        try {
            if (node.rows && node.rows[0]) colCount = node.rows[0].cells.length;
        } catch (eC) { colCount = 0; }

        var rows = Array.from(node.rows || []).filter(function (row) {
            return !(row.getAttribute && row.getAttribute('data-abene-cloned-head'));
        }).map(function (row) {
            var isHead = !!(row.parentNode && row.parentNode.tagName === 'THEAD') ||
                !!(row.cells.length && row.querySelector('th') && !row.querySelector('td'));
            var isGrand = !!(row.classList && row.classList.contains('gr-tot-grand'));
            var isDisc = !!(row.classList && row.classList.contains('gr-tot-disc'));
            return new TableRow({
                tableHeader: !!(isHead && (isItems || row.parentNode && row.parentNode.tagName === 'THEAD')),
                cantSplit: true,
                children: Array.from(row.cells).map(function (cell, cellIdx) {
                    var cs = (typeof getComputedStyle === 'function') ? getComputedStyle(cell) : cell.style;
                    var bgRaw = cssColorToHexLocal((cs && cs.backgroundColor) || cell.style.backgroundColor);
                    var isTh = cell.tagName === 'TH' || isHead;
                    var fill = '';
                    if (isGrand) fill = '0B1223';
                    else if (isTh && isItems) fill = '0B1223';
                    else if (bgRaw && bgRaw !== '000000' && bgRaw.toLowerCase() !== 'ffffff') fill = bgRaw;
                    else if (isKv && isTh) fill = 'F6F3EA';
                    else if (isMeta && isTh) fill = '';
                    else if (isLetter && isTh) fill = '';

                    var cellKids;
                    if (isTh && isItems) {
                        cellKids = [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({
                                text: (cell.innerText || ' ').replace(/\s+/g, ' ').trim() || ' ',
                                font: 'Calibri', bold: true, color: 'FFFFFF', size: 16
                            })]
                        })];
                    } else if (isMeta) {
                        var metaTxt = plainTextLocal(cell) || ' ';
                        cellKids = [new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [new TextRun({
                                text: metaTxt,
                                font: 'Calibri',
                                bold: !isTh,
                                color: isTh ? '8F7328' : '0B1223',
                                size: isTh ? 18 : 19
                            })]
                        })];
                    } else if (isTotals) {
                        var totTxt = plainTextLocal(cell) || ' ';
                        var right = !!(cell.classList && cell.classList.contains('c-eur')) || cellIdx === row.cells.length - 1;
                        cellKids = [new Paragraph({
                            alignment: right ? AlignmentType.RIGHT : AlignmentType.LEFT,
                            children: [new TextRun({
                                text: totTxt,
                                font: 'Calibri',
                                bold: !!(isGrand || right),
                                color: isGrand ? 'FFFFFF' : (isDisc ? '9A3412' : '0B1223'),
                                size: isGrand ? 24 : 20
                            })]
                        })];
                    } else if (isLetter && cell.classList && cell.classList.contains('gr-lh-doc')) {
                        cellKids = emitCellBlocks(cell, api);
                        /* force right-ish title block: already handled via child classes */
                    } else {
                        cellKids = emitCellBlocks(cell, api);
                    }

                    var pct;
                    if (isLetter && colCount === 2) pct = cellIdx === 0 ? 58 : 42;
                    else if (isParties && colCount === 3) pct = cellIdx === 1 ? 4 : 48;
                    else if (isSigns && colCount === 3) pct = cellIdx === 1 ? 8 : 46;
                    else if (isKv && colCount === 2) pct = cellIdx === 0 ? 34 : 66;
                    else if (isTotals && colCount === 2) pct = cellIdx === 0 ? 62 : 38;
                    else if (isMeta && colCount === 2) pct = cellIdx === 0 ? 40 : 60;
                    else pct = Math.max(6, Math.round(((cell.offsetWidth || 80) / tblW) * 100));

                    if (isPartiesOrSigns && row.cells.length === 3 && !(isLetter)) {
                        var idx = Array.prototype.indexOf.call(row.cells, cell);
                        if (isParties) pct = idx === 1 ? 4 : 48;
                        if (isSigns) pct = idx === 1 ? 8 : 46;
                    }

                    var cellOpts = {
                        width: { size: pct, type: WidthType.PERCENTAGE },
                        margins: {
                            top: isLetter || isMeta ? 40 : 60,
                            bottom: isLetter || isMeta ? 40 : 60,
                            left: isMeta ? 40 : 80,
                            right: isMeta ? 40 : 80
                        },
                        children: cellKids
                    };
                    if (fill && ShadingType) cellOpts.shading = { type: ShadingType.CLEAR, fill: fill };

                    var bColor = isItems ? (isTh ? '243049' : 'D4CFC2')
                        : (isKv || isTotals ? '0B1223' : (isMeta || isLetter || isPartiesOrSigns ? 'FFFFFF' : 'CCCCCC'));
                    var bSz = (isMeta || isLetter || isPartiesOrSigns) ? 0 : (isKv || isTotals ? 8 : 4);
                    var border = docxBorderLocal(api, bColor, bSz || 1);
                    if (isMeta || isLetter || isPartiesOrSigns) {
                        var none = noneBorderLocal(api);
                        cellOpts.borders = { top: none, bottom: none, left: none, right: none };
                    } else if (isTotals) {
                        var tn = docxBorderLocal(api, '0B1223', 10);
                        var soft = docxBorderLocal(api, 'D4CFC2', 4);
                        if (isGrand) {
                            cellOpts.borders = { top: tn, bottom: tn, left: tn, right: tn };
                        } else {
                            cellOpts.borders = { top: soft, bottom: soft, left: tn, right: tn };
                        }
                    } else if (isKv) {
                        var kn = docxBorderLocal(api, '0B1223', 8);
                        var ks = docxBorderLocal(api, 'D4CFC2', 4);
                        cellOpts.borders = { top: ks, bottom: ks, left: kn, right: kn };
                    } else {
                        cellOpts.borders = { top: border, bottom: border, left: border, right: border };
                    }
                    if (isLetter && cell.classList && cell.classList.contains('gr-lh-doc')) {
                        cellOpts.margins = { top: 40, bottom: 40, left: 80, right: 0 };
                    }
                    return new TableCell(cellOpts);
                })
            });
        });
        if (!rows.length) return;
        children.push(new Table({
            rows: rows,
            width: { size: 100, type: WidthType.PERCENTAGE }
        }));
        if (!layoutOpts.totalsLayout) {
            children.push(new Paragraph({ children: [new TextRun({ text: ' ' })], spacing: { after: 80 } }));
        }
    }

    function emitCommercialChrome(node, children, api) {
        if (!node || !node.classList) return false;
        var Paragraph = api.Paragraph, TextRun = api.TextRun, AlignmentType = api.AlignmentType;
        if (node.classList.contains('abene-status-banner') || node.classList.contains('abene-check-toolbar')) {
            return true; /* omit UI chrome from DOCX */
        }
        if (node.classList.contains('gr-brand-row')) {
            return emitBrandRow(node, children, api);
        }
        if (node.classList.contains('gr-co-name')) {
            children.push(emitStyledPara(api, plainTextLocal(node), { bold: true, size: 32, color: '0B1223', spacing: { after: 40 } }));
            return true;
        }
        if (node.classList.contains('gr-slogan')) {
            children.push(emitStyledPara(api, plainTextLocal(node), { bold: true, size: 15, color: '8F7328', spacing: { after: 40 } }));
            return true;
        }
        if (node.classList.contains('gr-co-meta')) {
            splitNoteLines(node).forEach(function (ln) {
                children.push(emitStyledPara(api, String(ln || '').trim() || ' ', { size: 17, color: '2A2A2A', spacing: { after: 20 } }));
            });
            return true;
        }
        if (node.classList.contains('gr-doc-kicker')) {
            children.push(emitStyledPara(api, plainTextLocal(node).toUpperCase(), {
                align: AlignmentType.RIGHT, bold: true, size: 14, color: '8F7328', spacing: { after: 40 }
            }));
            return true;
        }
        if (node.classList.contains('gr-doc-title')) {
            children.push(emitStyledPara(api, plainTextLocal(node), {
                align: AlignmentType.RIGHT, bold: true, size: 34, color: '0B1223', spacing: { after: 80 }
            }));
            return true;
        }
        if (node.classList.contains('gr-party')) {
            return emitPartyBox(node, children, api);
        }
        if (node.classList.contains('gr-sign-line')) {
            return emitSignLine(node, children, api);
        }
        if (node.classList.contains('gr-sign-hint')) {
            children.push(emitStyledPara(api, plainTextLocal(node), {
                align: AlignmentType.CENTER, size: 16, color: '444444', spacing: { before: 40, after: 200 }
            }));
            return true;
        }
        if (node.classList.contains('gr-stamp')) {
            return emitStamp(node, children, api);
        }
        if (node.classList.contains('gr-amount-box')) {
            var label = node.querySelector('.gr-amount-label');
            var amount = node.querySelector('.gr-amount');
            var words = node.querySelector('.gr-amount-words');
            var Table = api.Table, TableRow = api.TableRow, TableCell = api.TableCell;
            var WidthType = api.WidthType, ShadingType = api.ShadingType;
            var soft = docxBorderLocal(api, '0B1223', 10);
            var goldTop = docxBorderLocal(api, 'C9A84C', 24);
            var boxKids = [];
            if (label) boxKids.push(emitStyledPara(api, plainTextLocal(label).toUpperCase(), {
                align: AlignmentType.CENTER, bold: true, size: 15, color: '8F7328', spacing: { after: 60 }
            }));
            if (amount) boxKids.push(emitStyledPara(api, plainTextLocal(amount), {
                align: AlignmentType.CENTER, bold: true, size: 48, color: '0B1223', spacing: { after: 60 }
            }));
            if (words) boxKids.push(emitStyledPara(api, plainTextLocal(words), {
                align: AlignmentType.CENTER, italics: true, size: 20, color: '222222', spacing: { after: 40 }
            }));
            if (!boxKids.length) boxKids.push(new Paragraph({ children: [new TextRun({ text: ' ' })] }));
            children.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [new TableRow({
                    cantSplit: true,
                    children: [new TableCell({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        shading: ShadingType ? { type: ShadingType.CLEAR, fill: 'F7F4EB' } : undefined,
                        borders: { top: goldTop, bottom: soft, left: soft, right: soft },
                        margins: { top: 100, bottom: 100, left: 120, right: 120 },
                        children: boxKids
                    })]
                })]
            }));
            children.push(new Paragraph({ children: [new TextRun({ text: ' ' })], spacing: { after: 120 } }));
            return true;
        }
        if (node.classList.contains('gr-goldbar') || node.classList.contains('gr-rules')) {
            children.push(new Paragraph({
                border: { bottom: { color: '0B1223', space: 1, style: 'single', size: 8 } },
                children: [new TextRun({ text: ' ' })],
                spacing: { after: 20 }
            }));
            children.push(new Paragraph({
                border: { bottom: { color: 'C9A84C', space: 1, style: 'single', size: 18 } },
                children: [new TextRun({ text: ' ' })],
                spacing: { after: 200 }
            }));
            return true;
        }
        if (node.classList.contains('gr-section-label')) {
            children.push(emitStyledPara(api, plainTextLocal(node).toUpperCase(), {
                bold: true, size: 15, color: '8F7328', spacing: { before: 160, after: 80 }
            }));
            return true;
        }
        if (node.classList.contains('gr-totals-wrap')) {
            var tot = node.querySelector('table.gr-totals') || node.querySelector('table');
            if (tot) {
                emitTotalsRight(tot, children, api);
                children.push(new Paragraph({ children: [new TextRun({ text: ' ' })], spacing: { after: 80 } }));
                return true;
            }
        }
        if (node.classList.contains('gr-sign-block') || node.classList.contains('gr-brand-text') ||
            node.classList.contains('gr-party-cell') || node.classList.contains('abene-keep-together')) {
            Array.from(node.childNodes || []).forEach(function (ch) {
                if (typeof root.docxPushBlock === 'function') root.docxPushBlock(ch, children, api);
            });
            return true;
        }
        if (node.classList.contains('gr-doc-foot')) {
            return emitDocxFoot(node, children, api);
        }
        if (node.classList.contains('gr-pay') || node.classList.contains('gr-note')) {
            return emitNoteBlock(node, children, api, 'note');
        }
        if (node.classList.contains('gr-iva-note')) {
            return emitNoteBlock(node, children, api, 'iva');
        }
        return false;
    }

    function wrapPushBlock() {
        if (typeof root.docxPushBlock !== 'function' || root.docxPushBlock._abeneExport) return;
        var orig = root.docxPushBlock;
        root.docxPushBlock = function (node, children, api) {
            if (useEngine && node && node.nodeType === 1 && node.classList) {
                if (node.classList.contains('abene-notes-source') || node.classList.contains('abene-obj-resize')) return;
                if (node.classList.contains('page-break-marker') ||
                    node.classList.contains('abene-page-break') ||
                    (node.getAttribute && node.getAttribute('data-abene-break') === 'page')) {
                    emitDocxPageBreak(children, api);
                    return;
                }
                if (node.classList.contains('abene-section-break')) {
                    children.push({ _abeneSection: node.getAttribute('data-abene-section-role') || 'body' });
                    return;
                }
                if (node.classList.contains('abene-break-before') || node.classList.contains('abene-pagebreak-before')) {
                    emitDocxPageBreak(children, api);
                    /* continue to emit the node body below */
                }
                if (emitCommercialChrome(node, children, api)) return;
                if (node.tagName === 'TABLE') {
                    emitDocxTable(node, children, api);
                    return;
                }
                if (node.classList.contains('devis-container') || node.classList.contains('receipt-container') ||
                    node.classList.contains('gr-sign-block') || node.classList.contains('gr-totals-wrap') ||
                    node.classList.contains('abene-keep-together') ||
                    (node.getAttribute && (node.getAttribute('data-abene-block') === 'devis' || node.getAttribute('data-abene-block') === 'receipt'))) {
                    /* gr-totals-wrap: prefer commercial chrome (right-aligned totals) */
                    if (node.classList.contains('gr-totals-wrap') && emitCommercialChrome(node, children, api)) return;
                    Array.from(node.childNodes).forEach(function (ch) {
                        root.docxPushBlock(ch, children, api);
                    });
                    return;
                }
                if (node.classList.contains('abene-caption') || node.getAttribute('data-caption-for')) {
                    children.push(new api.Paragraph({
                        children: [new api.TextRun({
                            text: String(node.innerText || '').replace(/\s+/g, ' ').trim() || ' ',
                            italics: true,
                            font: 'Calibri',
                            size: 20
                        })],
                        alignment: api.AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }));
                    return;
                }
                if (isPicHost(node)) {
                    emitFigure(node, children, api);
                    return;
                }
                if (node.tagName && /^(P|H[1-6]|LI)$/i.test(node.tagName) &&
                    node.querySelector && node.querySelector(':scope > .abene-pic, :scope > [data-abene-obj="pic"]')) {
                    if (emitFlowPics(node, children, api, orig, this)) return;
                }
            }
            return orig.apply(this, arguments);
        };
        root.docxPushBlock._abeneExport = true;
        root.docxPushBlock._abeneExportOrig = orig;
    }

    function splitDocxChildren(children) {
        var parts = [{ role: 'front', items: [] }];
        var saw = false;
        (children || []).forEach(function (c) {
            if (c && c._abeneSection) {
                saw = true;
                parts.push({ role: c._abeneSection, items: [] });
                return;
            }
            parts[parts.length - 1].items.push(c);
        });
        if (!saw) return null;
        return parts.filter(function (p) { return p.items.length; });
    }
    function emptyHfPara(api) {
        return new api.Paragraph({ children: [new api.TextRun({ text: ' ' })] });
    }
    function reportHeader(api, ctx, role) {
        if (role === 'front') return new api.Header({ children: [emptyHfPara(api)] });
        var modelo = readModeloHf();
        var fields = (ctx && ctx.headerFields) || modelo.headerFields || {};
        var headerTpl = (ctx && ctx.headerTpl) || modelo.headerTpl || 'blank';
        var headerText = (ctx && ctx.headerText) || modelo.headerText || '';
        var companyName = (ctx && ctx.companyName) || modelo.companyName || 'Genius Raros';
        var left = [];
        if (ctx && ctx.logoRun) left.push(new api.Paragraph({ children: [ctx.logoRun] }));
        left.push(new api.Paragraph({
            children: [new api.TextRun({ text: companyName, bold: true, font: 'Calibri', size: 22 })]
        }));
        var right = [
            new api.Paragraph({
                alignment: api.AlignmentType.RIGHT,
                children: [new api.TextRun({ text: fields.title || headerText || '', bold: true, font: 'Calibri', size: 28 })]
            }),
            fields.ref
                ? new api.Paragraph({ alignment: api.AlignmentType.RIGHT, children: [new api.TextRun({ text: fields.ref, font: 'Calibri', size: 18, color: '5B7AA8' })] })
                : emptyHfPara(api),
            fields.date
                ? new api.Paragraph({ alignment: api.AlignmentType.RIGHT, children: [new api.TextRun({ text: fields.date, font: 'Calibri', size: 18, color: '5B7AA8' })] })
                : emptyHfPara(api)
        ];
        if (headerTpl === 'gr-report' || headerTpl === 'gr-letter' || headerTpl === 'triple') {
            return new api.Header({
                children: [new api.Table({
                    width: { size: 100, type: api.WidthType.PERCENTAGE },
                    rows: [new api.TableRow({
                        children: [
                            new api.TableCell({ width: { size: 50, type: api.WidthType.PERCENTAGE }, children: left }),
                            new api.TableCell({ width: { size: 50, type: api.WidthType.PERCENTAGE }, children: right })
                        ]
                    })]
                })]
            });
        }
        if (headerText || modelo.liveHeader) {
            return new api.Header({
                children: [new api.Paragraph({
                    alignment: api.AlignmentType.CENTER,
                    children: [new api.TextRun({ text: headerText || modelo.liveHeader, font: 'Calibri', size: 20 })]
                })]
            });
        }
        return new api.Header({ children: [emptyHfPara(api)] });
    }
    function reportFooter(api, ctx, role) {
        if (role === 'front') return new api.Footer({ children: [emptyHfPara(api)] });
        var modelo = readModeloHf();
        var footerText = (ctx && ctx.footerText != null) ? ctx.footerText : modelo.footerText;
        var runs = [];
        var annex = role === 'annex' ? ((typeof root.t === 'function' ? root.t('secAnnexNum') : '') || 'Anexo') + ' ' : '';
        if (annex) runs.push(new api.TextRun({ text: annex, font: 'Calibri', size: 18 }));
        String(footerText || '').split(/(\{PAGE\}|\{NUMPAGES\})/i).forEach(function (part) {
            if (!part) return;
            if (/^\{PAGE\}$/i.test(part)) runs.push(new api.TextRun({ children: [api.PageNumber.CURRENT], font: 'Calibri', size: 18 }));
            else if (/^\{NUMPAGES\}$/i.test(part)) runs.push(new api.TextRun({ children: [api.PageNumber.TOTAL_PAGES], font: 'Calibri', size: 18 }));
            else runs.push(new api.TextRun({ text: part, font: 'Calibri', size: 18 }));
        });
        return new api.Footer({
            children: [new api.Paragraph({
                alignment: api.AlignmentType.CENTER,
                children: runs.length ? runs : [new api.TextRun({ text: ' ' })]
            })]
        });
    }
    function buildDocxSections(ctx) {
        if (!useEngine || !ctx || !ctx.Document || !ctx.Packer) return null;
        var paper = docxPaperProps();
        var pxToTwip = paper.pxToTwip || ctx.pxToTwip;
        var portrait = paper.portrait;
        var orientation = paper.orientation;
        var margins = paper.margins;
        /* Fix #6: prefer live PageGeometry (docxPaperProps). ctx.page* only fills gaps. */
        if ((!portrait || !portrait.w || !portrait.h) && ctx.pageSize && ctx.pageSize.w && ctx.pageSize.h) {
            portrait = { w: ctx.pageSize.w, h: ctx.pageSize.h };
        }
        if (!orientation && ctx.pageOrientation) {
            orientation = ctx.pageOrientation === 'landscape' ? 'landscape' : 'portrait';
        }
        if (ctx.pageMargins) {
            margins = {
                top: margins.top != null ? margins.top : ctx.pageMargins.top,
                right: margins.right != null ? margins.right : ctx.pageMargins.right,
                bottom: margins.bottom != null ? margins.bottom : ctx.pageMargins.bottom,
                left: margins.left != null ? margins.left : ctx.pageMargins.left
            };
        }
        var modelo = readModeloHf();
        if (!ctx.headerTpl) ctx.headerTpl = modelo.headerTpl;
        if (!ctx.headerFields) ctx.headerFields = modelo.headerFields;
        if (!ctx.headerText) ctx.headerText = modelo.headerText;
        if (ctx.footerText == null) ctx.footerText = modelo.footerText;
        if (!ctx.companyName) ctx.companyName = modelo.companyName;

        var parts = splitDocxChildren(ctx.children);
        if (!parts || parts.length < 2) {
            var flat = (ctx.children || []).filter(function (c) { return !(c && c._abeneSection); });
            parts = [{ role: 'body', items: flat.length ? flat : [] }];
        }
        var D = root.docx || {};
        var PageOrientation = ctx.PageOrientation || D.PageOrientation || {};
        var sections = parts.map(function (part, i) {
            var page = {
                size: {
                    width: pxToTwip(portrait.w),
                    height: pxToTwip(portrait.h),
                    orientation: orientation === 'landscape'
                        ? (PageOrientation.LANDSCAPE || 'landscape')
                        : (PageOrientation.PORTRAIT || 'portrait')
                },
                margin: {
                    top: pxToTwip(margins.top),
                    right: pxToTwip(margins.right),
                    bottom: pxToTwip(margins.bottom),
                    left: pxToTwip(margins.left)
                }
            };
            if (part.role === 'body' || part.role === 'annex') page.pageNumbers = { start: 1 };
            var props = { page: page };
            if (D.SectionType && i > 0) props.type = D.SectionType.NEXT_PAGE;
            if (part.role === 'front') props.titlePage = true;
            var items = part.items.length ? part.items : [new ctx.Paragraph({ children: [new ctx.TextRun({ text: ' ' })] })];
            return {
                properties: props,
                headers: {
                    default: reportHeader(ctx, ctx, part.role),
                    first: part.role === 'front' ? reportHeader(ctx, ctx, 'front') : reportHeader(ctx, ctx, part.role)
                },
                footers: {
                    default: reportFooter(ctx, ctx, part.role),
                    first: part.role === 'front' ? reportFooter(ctx, ctx, 'front') : reportFooter(ctx, ctx, part.role)
                },
                children: items
            };
        });
        return ctx.Packer.toBlob(new ctx.Document({ sections: sections }));
    }

        function notifyDocxLimitsOnce(opts) {
        if (root._abeneDocxLimitToast) return;
        root._abeneDocxLimitToast = true;
        try {
            if (typeof root.showToast !== 'function') return;
            var editor = ed();
            var commercial = !!(editor && editor.querySelector && editor.querySelector(
                '.gr-letterhead, .devis-container, .receipt-container, [data-abene-block="devis"], [data-abene-block="receipt"]'
            ));
            var skipped = 0;
            try {
                skipped = (opts && opts.skippedImages != null)
                    ? Number(opts.skippedImages) || 0
                    : countDocxImgSkips(editor);
            } catch (eS) { skipped = _docxImgSkipCount || 0; }
            var msg;
            if (skipped > 0) {
                msg = 'DOCX parcial: ' + skipped + ' imagem(ns) omitida(s) (CORS / falha de carga). O resto do documento foi exportado; use PDF para fidelidade visual completa.';
            } else if (commercial) {
                msg = 'DOCX comercial: cabeçalho, partes, totais e assinaturas mapeados; alguns detalhes CSS (flex exacto / carimbo pixel) podem diferir. PDF permanece a via de alta fidelidade.';
            } else {
                msg = 'DOCX aproximado: layouts complexos / flutuantes / CSS avançado podem diferir. PDF permanece fiel ao ecrã.';
            }
            root.showToast(msg);
        } catch (eT) {}
    }
function pdfOptions(g, filename) {
        return {
            margin: 0,
            filename: filename,
            image: { type: 'png', quality: 1 },
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
                    box.querySelectorAll('.abene-fill').forEach(function (el) {
                        el.style.setProperty('border', 'none', 'important');
                        el.style.setProperty('background', 'transparent', 'important');
                        el.style.setProperty('padding', '0', 'important');
                    });
                    box.querySelectorAll('.abene-obj-resize, .abene-tbox-bar, .image-handle, .abene-crop-overlay').forEach(function (el) {
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
                    bestImage = pageCanvas.toDataURL('image/png');
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
            var image = typeof canvasOrImage === 'string' ? canvasOrImage : canvasOrImage.toDataURL('image/png');
            pdf.addImage(image, 'PNG', 0, 0, g.wmm, g.hmm, undefined, 'FAST');
            return true;
        } catch (e1) {
            try {
                pdf.addImage(canvasOrImage, 'PNG', 0, 0, g.wmm, g.hmm, undefined, 'FAST');
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

    function pdfFromPageImages(canvases, g) {
        var orient = g.orientation === 'landscape' ? 'landscape' : 'portrait';
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
            return pdf;
        });
    }

    function renderPagedPdf(tree, g) {
        flattenExportDom(tree);
        sanitizeExportRoot(tree);
        showCaptureRoot(tree, g);
        return afterLayout().then(function () {
            return captureSheets(tree, g);
        }).then(function (canvases) {
            if (!canvases.length) throw new Error('blank-canvas');
            return pdfFromPageImages(canvases, g);
        });
    }

    function savePagedPdf(tree, g, filename) {
        return renderPagedPdf(tree, g).then(function (pdf) {
            pdf.save(filename);
            return pdf;
        });
    }

    function pagedPdfToBlob(tree, g) {
        return renderPagedPdf(tree, g).then(function (pdf) {
            return pdf.output('blob');
        });
    }

    function cleanupExportCapture(tree) {
        if (root.abeneRemoveExportRoot) root.abeneRemoveExportRoot();
        else if (tree && tree.parentNode) tree.parentNode.removeChild(tree);
        if (root.abeneReleaseViewZoom) root.abeneReleaseViewZoom();
    }

    function captureLivePagedImages(filterFn) {
        if (!useEngine || !root.html2pdf || typeof root.abeneBuildPagedExport !== 'function') {
            return Promise.reject(new Error('no-engine'));
        }
        if (root.abeneRemoveExportRoot) root.abeneRemoveExportRoot();
        prepare();
        var tree = root.abeneBuildPagedExport();
        if (!tree) return Promise.reject(new Error('no-tree'));
        if (typeof filterFn === 'function') {
            try { filterFn(tree); } catch (eF) {}
        }
        if (!tree.querySelector('.abene-export-sheet')) return Promise.reject(new Error('no-sheets'));
        var g = geo();
        if (root.abeneInjectPrintPageSize) root.abeneInjectPrintPageSize();
        document.body.appendChild(tree);
        if (root.abeneHoldViewZoom) root.abeneHoldViewZoom();
        return waitImages(tree).then(function () {
            flattenExportDom(tree);
            sanitizeExportRoot(tree);
            showCaptureRoot(tree, g);
            return afterLayout().then(function () {
                return captureSheets(tree, g);
            });
        }).then(function (images) {
            cleanupExportCapture(tree);
            if (!images || !images.length) throw new Error('blank-canvas');
            return { images: images, g: g };
        }, function (err) {
            cleanupExportCapture(tree);
            throw err;
        });
    }

    function captureLivePagedBlob(filterFn) {
        return captureLivePagedImages(filterFn).then(function (pack) {
            return pdfFromPageImages(pack.images, pack.g).then(function (pdf) {
                var blob = pdf.output('blob');
                if (!blob || blob.size < 4000) throw new Error('empty');
                return blob;
            });
        });
    }

    function savePageImagesPdf(images, g, filename) {
        return pdfFromPageImages(images, g).then(function (pdf) {
            pdf.save(filename || 'document.pdf');
            return pdf;
        });
    }

    function pageImagesToBlob(images, g) {
        return pdfFromPageImages(images, g).then(function (pdf) {
            return pdf.output('blob');
        });
    }

    function buildHtmlExportTree(html, g) {
        g = g || geo();
        var m = g.margins || { top: 96, right: 96, bottom: 96, left: 96 };
        var editor = ed();
        var measure = document.createElement('div');
        measure.className = 'page';
        measure.setAttribute('data-abene-export-measure', '1');
        measure.style.cssText = 'position:absolute;left:-16000px;top:0;width:' + g.w + 'px;box-sizing:border-box;background:#fff;color:#1a1a1a;margin:0;overflow:visible;';
        measure.style.padding = m.top + 'px ' + m.right + 'px ' + m.bottom + 'px ' + m.left + 'px';
        if (editor) {
            try {
                var cs = root.getComputedStyle(editor);
                if (cs.fontFamily) measure.style.fontFamily = cs.fontFamily;
                if (cs.fontSize) measure.style.fontSize = cs.fontSize;
            } catch (eCs) {}
        }
        measure.innerHTML = html || '<p></p>';
        measure.querySelectorAll('.abene-page-flow, .page-decoration, .page-header-zone, .page-footer-zone, .page-gap-band, .abene-obj-resize, .abene-tbox-bar').forEach(function (n) { n.remove(); });
        flattenExportDom(measure);
        sanitizeExportRoot(measure);
        document.body.appendChild(measure);
        var total = Math.max(g.h, measure.scrollHeight || measure.offsetHeight || g.h);
        var pages = Math.max(1, Math.ceil(total / g.h));
        var tree = document.createElement('div');
        tree.id = 'abeneExportRoot';
        tree.className = 'abene-export-root';
        tree.setAttribute('data-abene-export', '1');
        var i;
        for (i = 0; i < pages; i++) {
            var sheet = document.createElement('div');
            sheet.className = 'abene-export-sheet';
            sheet.style.cssText = 'width:' + g.w + 'px;height:' + g.h + 'px;position:relative;overflow:hidden;background:#fff;margin:0;padding:0;border:0;box-sizing:border-box;';
            var clip = document.createElement('div');
            clip.className = 'abene-export-clip';
            clip.style.cssText = 'position:absolute;left:0;top:0;width:' + g.w + 'px;height:' + g.h + 'px;overflow:hidden;';
            var clone = measure.cloneNode(true);
            clone.removeAttribute('data-abene-export-measure');
            clone.style.position = 'relative';
            clone.style.left = '0';
            clone.style.top = (-i * g.h) + 'px';
            clone.style.width = g.w + 'px';
            clip.appendChild(clone);
            sheet.appendChild(clip);
            tree.appendChild(sheet);
        }
        if (measure.parentNode) measure.parentNode.removeChild(measure);
        return tree;
    }

    function htmlToPagedBlob(html) {
        if (!useEngine || !root.html2pdf) return Promise.reject(new Error('no-engine'));
        var g = geo();
        if (root.abeneRemoveExportRoot) root.abeneRemoveExportRoot();
        var tree = buildHtmlExportTree(html, g);
        document.body.appendChild(tree);
        if (root.abeneHoldViewZoom) root.abeneHoldViewZoom();
        return waitImages(tree).then(function () {
            return embedImages(tree);
        }).then(function () {
            return pagedPdfToBlob(tree, g);
        }).then(function (blob) {
            cleanupExportCapture(tree);
            if (!blob || blob.size < 4000) throw new Error('empty');
            return blob;
        }, function (err) {
            cleanupExportCapture(tree);
            throw err;
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
        docxPaperProps: docxPaperProps,
        readModeloHf: readModeloHf,
        bodyHtml: bodyHtml,
        sanitize: sanitizeExportRoot,
        flatten: flattenExportDom,
        embedImages: embedImages,
        logoPng: logoPng,
        rasterizeImages: rasterizeImages,
        savePagedPdf: savePagedPdf,
        pagedPdfToBlob: pagedPdfToBlob,
        captureLivePagedImages: captureLivePagedImages,
        captureLivePagedBlob: captureLivePagedBlob,
        savePageImagesPdf: savePageImagesPdf,
        pageImagesToBlob: pageImagesToBlob,
        htmlToPagedBlob: htmlToPagedBlob,
        htmlElementToPdfBlob: htmlElementToPdfBlob,
        beginDocxSave: beginDocxSave,
        writeDocxSaveTarget: writeDocxSaveTarget,
        downloadDocxBlob: downloadDocxBlob,
        buildDocxSections: buildDocxSections,
        notifyDocxLimitsOnce: notifyDocxLimitsOnce
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
            resetDocxImgSkips();
            root._abeneDocxLimitToast = false;
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
                var blob = await origFn.apply(this, arguments);
                notifyDocxLimitsOnce({ skippedImages: countDocxImgSkips(null) });
                return blob;
            } catch (e) {
                root.abeneGetCleanHtml = origClean;
                var blob2 = await origFn.apply(this, arguments);
                notifyDocxLimitsOnce({ skippedImages: countDocxImgSkips(null) });
                return blob2;
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

    /* Ver → Leitura / Web: segundo clique (ou Esc) volta à impressão. O wrap Estrutura (Awinda) continua a marcar o botão e o toast. */
    (function wrapReadViewToggle() {
        var orig = root.setViewMode;
        if (typeof orig !== 'function') return;
        if (!orig._abeneReadToggle) {
            root.setViewMode = function (mode) {
                var m = String(mode || 'print');
                var editor = ed();
                if (m === 'read' && editor && editor.classList.contains('view-read')) {
                    return orig.call(this, 'print');
                }
                if (m === 'web' && editor && editor.classList.contains('view-web')) {
                    return orig.call(this, 'print');
                }
                return orig.apply(this, arguments);
            };
            root.setViewMode._abeneReadToggle = true;
            root.setViewMode._abeneWebToggle = true;
            root.setViewMode._legacy = orig;
        } else if (!root.setViewMode._abeneWebToggle) {
            var prev = root.setViewMode;
            root.setViewMode = function (mode) {
                var m = String(mode || 'print');
                var editor = ed();
                if (m === 'web' && editor && editor.classList.contains('view-web')) {
                    return prev.call(this, 'print');
                }
                return prev.apply(this, arguments);
            };
            root.setViewMode._abeneReadToggle = true;
            root.setViewMode._abeneWebToggle = true;
            root.setViewMode._legacy = prev._legacy || prev;
        }
        if (!root._abeneReadEsc) {
            root._abeneReadEsc = true;
            document.addEventListener('keydown', function (e) {
                if (e.key !== 'Escape') return;
                if (document.body.classList.contains('focus-mode')) return;
                var editor = ed();
                if (!editor) return;
                if (editor.classList.contains('view-read') || editor.classList.contains('view-web')) {
                    if (typeof root.setViewMode === 'function') root.setViewMode('print');
                }
            });
        }
    })();
})(window);
