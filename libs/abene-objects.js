/* Genius Raros — caixa de texto + imagens com posição (arrastar / quebra) */
(function () {
    function tt(key) { return typeof window.t === 'function' ? window.t(key) : key; }
    function editorEl() { return document.getElementById('editor'); }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function toast(msg) {
        if (typeof showToast === 'function') showToast(msg);
    }
    function save() {
        if (typeof saveUndoState === 'function') saveUndoState();
        if (typeof onEditorInput === 'function') onEditorInput();
    }
    function pt(clientX, clientY) {
        var editor = editorEl();
        var er = editor.getBoundingClientRect();
        var sx = editor.offsetWidth / Math.max(1, er.width);
        var sy = editor.offsetHeight / Math.max(1, er.height);
        return { x: (clientX - er.left) * sx, y: (clientY - er.top) * sy };
    }
    function isLockedImg(img) {
        return !!(img && img.closest && img.closest('[data-abene-block="cover"], [data-abene-block="titlepage"], [data-abene-block="body-logo"], .abene-cover, .abene-titlepage, .page-header-zone, .page-footer-zone, .hf-gr-report, .hf-gr-letter'));
    }
    function clearSel() {
        editorEl() && editorEl().querySelectorAll('.abene-obj-on').forEach(function (el) { el.classList.remove('abene-obj-on'); });
    }
    function selectObj(el) {
        clearSel();
        if (!el) return;
        el.classList.add('abene-obj-on');
        var img = el.matches('img') ? el : el.querySelector('img');
        var icon = !img ? (el.querySelector('[data-icon]') || (el.getAttribute && el.getAttribute('data-icon') ? el : null)) : null;
        if (img) {
            window.selectedImage = img;
            img.classList.add('selected');
            if (typeof showImageToolbar === 'function') showImageToolbar({ clientX: 0, clientY: 0 });
        } else if (icon) {
            window.selectedImage = icon;
            icon.classList.add('selected');
            if (typeof showImageToolbar === 'function') showImageToolbar({ clientX: 0, clientY: 0 });
        } else {
            window.selectedImage = null;
            var tb = document.getElementById('imageToolbar');
            if (tb) tb.classList.remove('visible');
            if (typeof hideImageHandles === 'function') hideImageHandles();
            showTboxBar(el);
        }
    }
    function showTboxBar(box) {
        var bar = document.getElementById('objectToolbar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'objectToolbar';
            bar.className = 'image-toolbar';
            bar.innerHTML =
                '<button type="button" onclick="setObjectWrap(\'none\')">' + esc(tt('objInline')) + '</button>' +
                '<button type="button" onclick="setObjectWrap(\'left\')">' + esc(tt('objLeft')) + '</button>' +
                '<button type="button" onclick="setObjectWrap(\'right\')">' + esc(tt('objRight')) + '</button>' +
                '<button type="button" onclick="setObjectWrap(\'center\')">' + esc(tt('objCenter')) + '</button>' +
                '<button type="button" onclick="setObjectWrap(\'free\')">' + esc(tt('objFree')) + '</button>' +
                '<button type="button" onclick="setObjectWrap(\'behind\')">' + esc(tt('objBehind')) + '</button>' +
                '<button type="button" onclick="setObjectWrap(\'front\')">' + esc(tt('objFront')) + '</button>' +
                '<button type="button" onclick="deleteSelectedObject()" style="color:red">' + esc(tt('imgDelete')) + '</button>';
            document.body.appendChild(bar);
        }
        var r = box.getBoundingClientRect();
        bar.style.top = Math.max(8, r.top - 46) + 'px';
        bar.style.left = Math.max(8, r.left) + 'px';
        bar.classList.add('visible');
    }
    function hideTboxBar() {
        var bar = document.getElementById('objectToolbar');
        if (bar) bar.classList.remove('visible');
    }
    function isOverlayWrap(mode) {
        return mode === 'free' || mode === 'behind' || mode === 'front';
    }
    function newAnchorId() {
        return 'ai' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }
    function editorXY(node) {
        var editor = editorEl();
        if (!editor || !node || !node.getBoundingClientRect) return { x: 0, y: 0 };
        var er = editor.getBoundingClientRect();
        var nr = node.getBoundingClientRect();
        var sx = editor.offsetWidth / Math.max(1, er.width);
        var sy = editor.offsetHeight / Math.max(1, er.height);
        return { x: (nr.left - er.left) * sx, y: (nr.top - er.top) * sy };
    }
    function findAnchor(id) {
        var editor = editorEl();
        if (!editor || !id) return null;
        return editor.querySelector('.abene-img-anchor[data-abene-aid="' + id.replace(/"/g, '') + '"]');
    }
    function ensureAnchor(el) {
        var editor = editorEl();
        if (!editor || !el) return null;
        var id = el.getAttribute('data-abene-aid');
        if (!id) {
            id = newAnchorId();
            el.setAttribute('data-abene-aid', id);
        }
        var mark = findAnchor(id);
        if (mark) return mark;
        mark = document.createElement('span');
        mark.className = 'abene-img-anchor';
        mark.setAttribute('data-abene-aid', id);
        mark.setAttribute('contenteditable', 'false');
        mark.setAttribute('aria-hidden', 'true');
        if (el.parentNode && el.parentNode !== editor) {
            el.parentNode.insertBefore(mark, el);
        } else {
            var host = editor.querySelector('p, h1, h2, h3, h4, .abene-normal') || editor;
            if (host === editor) editor.insertBefore(mark, editor.firstChild);
            else host.insertBefore(mark, host.firstChild);
        }
        return mark;
    }
    function removeAnchor(el) {
        if (!el) return;
        var id = el.getAttribute('data-abene-aid');
        var mark = findAnchor(id);
        if (mark && mark.parentNode) mark.parentNode.removeChild(mark);
        el.removeAttribute('data-abene-aid');
        el.removeAttribute('data-abene-dx');
        el.removeAttribute('data-abene-dy');
    }
    function storeDxDy(el, mark) {
        if (!el || !mark) return;
        var p = editorXY(el);
        var a = editorXY(mark);
        el.setAttribute('data-abene-dx', String(Math.round(p.x - a.x)));
        el.setAttribute('data-abene-dy', String(Math.round(p.y - a.y)));
    }
    function restoreBesideAnchor(el) {
        var id = el.getAttribute('data-abene-aid');
        var mark = findAnchor(id);
        if (mark && mark.parentNode) {
            mark.parentNode.insertBefore(el, mark.nextSibling);
            if (mark.parentNode) mark.parentNode.removeChild(mark);
        }
        el.removeAttribute('data-abene-aid');
        el.removeAttribute('data-abene-dx');
        el.removeAttribute('data-abene-dy');
    }
    function syncAnchors(root) {
        var editor = root || editorEl();
        if (!editor) return;
        editor.querySelectorAll('.abene-pic, .abene-tbox').forEach(function (el) {
            var mode = el.getAttribute('data-wrap');
            if (!isOverlayWrap(mode)) return;
            var mark = findAnchor(el.getAttribute('data-abene-aid'));
            if (!mark) return;
            var dx = Number(el.getAttribute('data-abene-dx')) || 0;
            var dy = Number(el.getAttribute('data-abene-dy')) || 0;
            var a = editorXY(mark);
            el.style.position = 'absolute';
            el.style.left = Math.max(0, a.x + dx) + 'px';
            el.style.top = Math.max(0, a.y + dy) + 'px';
        });
    }
    function isCaptionNode(n) {
        return !!(n && n.classList && (n.classList.contains('abene-caption') || n.getAttribute('data-caption-for')));
    }
    function findLooseCaption(wrap) {
        if (isCaptionNode(wrap.nextElementSibling)) return wrap.nextElementSibling;
        var parent = wrap.parentElement;
        if (!parent || parent.id === 'editor' || parent.classList.contains('page')) return null;
        var onlyPic = true;
        Array.from(parent.childNodes).forEach(function (ch) {
            if (ch === wrap) return;
            if (ch.nodeType === 3 && !String(ch.textContent || '').replace(/\u200b/g, '').trim()) return;
            if (ch.nodeType === 1 && (ch.classList.contains('abene-obj-resize') || ch.tagName === 'BR')) return;
            onlyPic = false;
        });
        if (onlyPic && isCaptionNode(parent.nextElementSibling)) return parent.nextElementSibling;
        return null;
    }
    function stickCaptionToPic(wrap) {
        if (!wrap || !wrap.classList || !wrap.classList.contains('abene-pic')) return;
        var inner = wrap.querySelector(':scope > .abene-caption, :scope > [data-caption-for]');
        if (inner) {
            inner.setAttribute('contenteditable', 'true');
            return;
        }
        var n = findLooseCaption(wrap);
        if (!n) return;
        var cap = n;
        if (cap.tagName === 'P') {
            var span = document.createElement('span');
            Array.from(cap.attributes).forEach(function (a) { span.setAttribute(a.name, a.value); });
            span.innerHTML = cap.innerHTML;
            cap.parentNode.removeChild(cap);
            cap = span;
        } else cap.parentNode.removeChild(cap);
        cap.classList.add('abene-caption');
        cap.setAttribute('contenteditable', 'true');
        var rs = wrap.querySelector(':scope > .abene-obj-resize');
        if (rs) wrap.insertBefore(cap, rs);
        else wrap.appendChild(cap);
    }
    function isEmptyBlock(node) {
        if (!node || !node.parentNode) return false;
        var t = String(node.textContent || '').replace(/\u200b/g, '').replace(/\s+/g, '');
        if (t) return false;
        if (node.querySelector && node.querySelector('img, [data-icon], table, .abene-pic, .abene-tbox')) return false;
        return true;
    }
    function placeAboveBelow(el, mode) {
        var host = el.closest && el.closest('p, h1, h2, h3, h4, h5, h6, li, td, th, .abene-normal');
        if (!host || host === el || !host.parentNode) return;
        var inCell = /^(TD|TH|LI)$/.test(host.tagName);
        var parent = host.parentNode;
        if (mode === 'below') {
            if (inCell || host.tagName === 'P' || (host.classList && host.classList.contains('abene-normal'))) {
                host.appendChild(el);
            } else if (host.nextSibling) parent.insertBefore(el, host.nextSibling);
            else parent.appendChild(el);
        } else {
            if (inCell || host.tagName === 'P' || (host.classList && host.classList.contains('abene-normal'))) {
                host.insertBefore(el, host.firstChild);
            } else parent.insertBefore(el, host);
        }
        if (!inCell && isEmptyBlock(host)) parent.removeChild(host);
    }
    function applyWrap(el, mode) {
        if (!el) return;
        stickCaptionToPic(el);
        mode = mode || 'none';
        if (mode === 'inline') mode = 'none';
        el.classList.remove('abene-obj-left', 'abene-obj-right', 'abene-obj-center', 'abene-obj-free',
            'abene-obj-inline', 'abene-obj-behind', 'abene-obj-front', 'abene-obj-above', 'abene-obj-below');
        el.style.float = '';
        el.style.display = '';
        el.style.marginLeft = '';
        el.style.marginRight = '';
        el.style.zIndex = '';
        el.style.clear = '';
        var editor = editorEl();
        if (mode !== 'free' && mode !== 'behind' && mode !== 'front') {
            el.style.position = '';
            el.style.left = '';
            el.style.top = '';
            if (el.getAttribute('data-abene-aid')) restoreBesideAnchor(el);
        }
        el.setAttribute('data-wrap', mode);
        if (mode === 'left') el.classList.add('abene-obj-left');
        else if (mode === 'right') el.classList.add('abene-obj-right');
        else if (mode === 'center') el.classList.add('abene-obj-center');
        else if (mode === 'above' || mode === 'below') {
            el.classList.add(mode === 'above' ? 'abene-obj-above' : 'abene-obj-below');
            placeAboveBelow(el, mode);
        }
        else if (isOverlayWrap(mode)) {
            var mark = ensureAnchor(el);
            var vis = editorXY(el);
            el.classList.add(mode === 'behind' ? 'abene-obj-behind' : (mode === 'front' ? 'abene-obj-front' : 'abene-obj-free'));
            el.style.position = 'absolute';
            el.style.left = vis.x + 'px';
            el.style.top = vis.y + 'px';
            if (editor) {
                if (mode === 'behind') editor.insertBefore(el, editor.firstChild);
                else editor.appendChild(el);
            }
            storeDxDy(el, mark);
            syncAnchors();
        } else el.classList.add('abene-obj-inline');
        save();
        if (!isOverlayWrap(mode) && typeof window.abeneSchedulePageFlow === 'function') {
            window.abeneSchedulePageFlow(true);
        }
    }
    function wrapImg(img) {
        if (!img || img.closest('.abene-pic') || isLockedImg(img)) return img.closest && img.closest('.abene-pic');
        var wrap = document.createElement('span');
        wrap.className = 'abene-pic abene-obj-inline';
        wrap.setAttribute('data-abene-obj', 'pic');
        wrap.setAttribute('data-wrap', 'none');
        wrap.contentEditable = 'false';
        img.parentNode.insertBefore(wrap, img);
        wrap.appendChild(img);
        img.setAttribute('draggable', 'false');
        var rs = document.createElement('span');
        rs.className = 'abene-obj-resize';
        rs.setAttribute('data-resize', 'se');
        wrap.appendChild(rs);
        stickCaptionToPic(wrap);
        return wrap;
    }
    function isIconNode(el) {
        return !!(el && el.getAttribute && el.getAttribute('data-icon') === 'true');
    }
    function applyIconSize(glyph, px) {
        if (!glyph) return;
        px = Math.max(16, Math.min(400, Math.round(Number(px) || 32)));
        glyph.style.fontSize = px + 'px';
        glyph.style.width = px + 'px';
        glyph.style.height = px + 'px';
        glyph.style.lineHeight = '1';
        glyph.style.display = 'block';
        var box = glyph.closest && glyph.closest('.abene-pic');
        if (box) {
            box.style.width = px + 'px';
            box.style.height = 'auto';
        }
    }
    function wrapIcon(el) {
        if (!el || !isIconNode(el)) return el && el.closest && el.closest('.abene-pic');
        if (el.closest('.abene-pic')) return el.closest('.abene-pic');
        var wrap = document.createElement('span');
        wrap.className = 'abene-pic abene-icon abene-obj-inline';
        wrap.setAttribute('data-abene-obj', 'pic');
        wrap.setAttribute('data-wrap', 'none');
        wrap.contentEditable = 'false';
        el.parentNode.insertBefore(wrap, el);
        wrap.appendChild(el);
        el.classList.add('abene-icon-glyph');
        if (!el.style.fontSize) el.style.fontSize = '32px';
        el.style.lineHeight = '1';
        el.style.display = 'block';
        var rs = document.createElement('span');
        rs.className = 'abene-obj-resize';
        rs.setAttribute('data-resize', 'se');
        wrap.appendChild(rs);
        return wrap;
    }
    function picHtml(src, alt, style) {
        var st = style || 'max-width:400px;height:auto;';
        return '<span class="abene-pic abene-obj-inline" data-abene-obj="pic" data-wrap="none" contenteditable="false">' +
            '<img data-illustration="true" src="' + esc(src) + '" alt="' + esc(alt || '') + '" draggable="false" style="' + st + '">' +
            '<span class="abene-obj-resize" data-resize="se"></span></span>';
    }
    function insertAtCaret(html) {
        var editor = editorEl();
        if (!editor) return;
        editor.focus();
        var payload = html + '<span>\u200b</span>';
        if (window.EditorCommands && window.EditorCommands.useEngine && typeof window.EditorCommands.insertHTML === 'function') {
            window.EditorCommands.insertHTML(payload);
        } else {
            try { document.execCommand('insertHTML', false, payload); } catch (e) {
                editor.insertAdjacentHTML('beforeend', html);
            }
        }
        save();
    }
    function insertImageFile(file) {
        if (!file || !/^image\//.test(file.type)) return;
        var reader = new FileReader();
        reader.onload = function (e) {
            insertAtCaret(picHtml(e.target.result, file.name || 'imagem'));
        };
        reader.readAsDataURL(file);
    }

    window.insertTextBox = function () {
        var editor = editorEl();
        if (!editor) return;
        editor.focus();
        var html = '<span class="abene-tbox abene-obj-inline" data-abene-obj="tbox" data-wrap="none" contenteditable="false" style="width:220px;">' +
            '<span class="abene-tbox-bar">' + esc(tt('textBox')) + '</span>' +
            '<div class="abene-tbox-body" contenteditable="true">' + esc(tt('tboxHint')) + '</div>' +
            '<span class="abene-obj-resize" data-resize="se"></span></span>';
        insertAtCaret(html);
        setTimeout(function () {
            var box = editor.querySelector('.abene-tbox:last-of-type .abene-tbox-body');
            if (box) {
                box.focus();
                var r = document.createRange();
                r.selectNodeContents(box);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(r);
            }
        }, 30);
    };

    window.handleImageUpload = function (event) {
        var files = event && event.target && event.target.files;
        if (!files || !files.length) return;
        Array.prototype.forEach.call(files, insertImageFile);
        event.target.value = '';
    };

    var origOnline = window.insertOnlineImage;
    window.insertOnlineImage = function () {
        if (typeof origOnline === 'function') return origOnline.apply(this, arguments);
        var asked = window.prompt(tt('pImageUrl') || tt('imageUrl') || 'URL', 'https://');
        if (!asked) return;
        var u = String(asked).trim();
        if (!/^https?:\/\//i.test(u) && !/^data:image\//i.test(u)) {
            toast(tt('aBadUrl'));
            return;
        }
        insertAtCaret(picHtml(u, 'imagem'));
    };

    window.abeneInsertPicture = function (src, opts) {
        opts = opts || {};
        if (!src) return;
        var w = Number(opts.width) || 0;
        var unit = opts.unit === '%' ? '%' : 'px';
        var style = w > 0
            ? (unit === '%' ? ('width:' + Math.min(100, w) + '%;max-width:100%;height:auto;') : ('width:' + w + 'px;height:auto;'))
            : 'max-width:400px;height:auto;';
        insertAtCaret(picHtml(src, opts.alt || 'imagem', style));
        var wrap = opts.wrap;
        if (wrap && wrap !== 'none' && wrap !== 'inline') {
            setTimeout(function () {
                var editor = editorEl();
                var pics = editor ? editor.querySelectorAll('.abene-pic') : [];
                var last = pics.length ? pics[pics.length - 1] : null;
                if (last) applyWrap(last, wrap);
            }, 40);
        }
    };

    window.setImageWrap = function (type) {
        var img = window.selectedImage;
        var wrap = img && img.closest && img.closest('.abene-pic');
        if (img && !wrap && !isLockedImg(img)) wrap = wrapImg(img);
        if (wrap) applyWrap(wrap, type === 'none' ? 'none' : type);
        else if (img) {
            img.classList.remove('float-left', 'float-right', 'center');
            img.style.float = '';
            img.style.display = '';
            img.style.margin = '';
            if (type === 'left') img.classList.add('float-left');
            else if (type === 'right') img.classList.add('float-right');
            else if (type === 'center') img.classList.add('center');
            save();
        }
        if (typeof showImageToolbar === 'function') showImageToolbar({ clientX: 0, clientY: 0 });
        else if (typeof positionImageHandles === 'function') positionImageHandles();
    };
    window.setObjectWrap = function (type) {
        var box = editorEl() && editorEl().querySelector('.abene-tbox.abene-obj-on');
        if (box) applyWrap(box, type);
    };
    window.deleteSelectedObject = function () {
        var editor = editorEl();
        var box = editor && editor.querySelector('.abene-tbox.abene-obj-on');
        if (box) {
            box.remove();
            hideTboxBar();
            save();
        }
    };

    var drag = null;
    function startDrag(el, ev) {
        drag = {
            el: el,
            startCX: ev.clientX,
            startCY: ev.clientY,
            moved: false,
            needFree: !isOverlayWrap(el.getAttribute('data-wrap')),
            left: parseFloat(el.style.left) || el.offsetLeft,
            top: parseFloat(el.style.top) || el.offsetTop
        };
        try { ev.currentTarget && ev.currentTarget.setPointerCapture && ev.currentTarget.setPointerCapture(ev.pointerId); } catch (err) {}
    }
    function startResize(el, ev) {
        drag = { el: el, resize: true, startX: ev.clientX, startW: el.offsetWidth };
        try { ev.target.setPointerCapture(ev.pointerId); } catch (err) {}
    }

    function bindEditor(editor) {
        if (!editor || editor._abeneObjBound) return;
        editor._abeneObjBound = true;

        editor.addEventListener('pointerdown', function (ev) {
            var rs = ev.target.closest && ev.target.closest('.abene-obj-resize');
            var tbox = ev.target.closest && ev.target.closest('.abene-tbox');
            var pic = ev.target.closest && ev.target.closest('.abene-pic');
            var img = ev.target.closest && ev.target.closest('#editor img');
            var looseIcon = ev.target.closest && ev.target.closest('#editor [data-icon]');
            if (!pic && looseIcon && !looseIcon.closest('.abene-pic')) pic = wrapIcon(looseIcon);
            if (!pic && !tbox && !rs) {
                var overlayHit = null;
                editor.querySelectorAll('.abene-pic, .abene-tbox').forEach(function (el) {
                    var mode = el.getAttribute('data-wrap');
                    if (!isOverlayWrap(mode) && mode !== 'above' && mode !== 'below') return;
                    var r = el.getBoundingClientRect();
                    if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) overlayHit = el;
                });
                if (overlayHit) {
                    pic = overlayHit.classList.contains('abene-pic') ? overlayHit : pic;
                    tbox = overlayHit.classList.contains('abene-tbox') ? overlayHit : tbox;
                }
            }
            if (rs) {
                ev.preventDefault();
                ev.stopPropagation();
                startResize(rs.parentElement, ev);
                selectObj(rs.parentElement);
                return;
            }
            if (ev.target.classList && ev.target.classList.contains('abene-tbox-bar')) {
                ev.preventDefault();
                startDrag(tbox, ev);
                selectObj(tbox);
                return;
            }
            if (tbox && ev.target.closest('.abene-tbox-body')) {
                selectObj(tbox);
                return;
            }
            if (pic) {
                if (ev.target.closest && ev.target.closest('.abene-caption')) {
                    selectObj(pic);
                    return;
                }
                ev.preventDefault();
                startDrag(pic, ev);
                selectObj(pic);
                return;
            }
            if (img && !isLockedImg(img)) {
                var w = wrapImg(img);
                if (w) {
                    startDrag(w, ev);
                    selectObj(w);
                }
            }
        });
        editor.addEventListener('pointermove', function (ev) {
            if (!drag) return;
            if (drag.resize) {
                ev.preventDefault();
                var editorBox = editorEl();
                var er = editorBox.getBoundingClientRect();
                var sx = editorBox.offsetWidth / Math.max(1, er.width);
                var w = Math.max(48, drag.startW + (ev.clientX - drag.startX) * sx);
                drag.el.style.width = w + 'px';
                var im = drag.el.querySelector('img');
                if (im) { im.style.width = w + 'px'; im.style.height = 'auto'; im.style.maxWidth = 'none'; }
                var ic = drag.el.querySelector('[data-icon]');
                if (ic) applyIconSize(ic, w);
                if (typeof positionImageHandles === 'function') positionImageHandles();
                return;
            }
            if (!drag.moved) {
                if (Math.abs(ev.clientX - drag.startCX) < 5 && Math.abs(ev.clientY - drag.startCY) < 5) return;
                drag.moved = true;
                ev.preventDefault();
                if (drag.needFree) applyWrap(drag.el, 'free');
                var p0 = pt(ev.clientX, ev.clientY);
                drag.dx = p0.x - (parseFloat(drag.el.style.left) || 0);
                drag.dy = p0.y - (parseFloat(drag.el.style.top) || 0);
            }
            ev.preventDefault();
            var p = pt(ev.clientX, ev.clientY);
            drag.el.style.left = Math.max(0, p.x - drag.dx) + 'px';
            drag.el.style.top = Math.max(0, p.y - drag.dy) + 'px';
            if (typeof positionImageHandles === 'function') positionImageHandles();
        });
        editor.addEventListener('pointerup', function () {
            if (drag && drag.el && isOverlayWrap(drag.el.getAttribute('data-wrap'))) {
                storeDxDy(drag.el, findAnchor(drag.el.getAttribute('data-abene-aid')));
            }
            if (drag) { drag = null; save(); }
        });

        editor.addEventListener('click', function (ev) {
            if (ev.target.closest && ev.target.closest('.abene-tbox-body')) return;
            if (ev.target.closest && ev.target.closest('.abene-pic, .abene-tbox')) {
                ev.stopPropagation();
                return;
            }
            clearSel();
            hideTboxBar();
        }, true);

        editor.addEventListener('paste', function (e) {
            var items = e.clipboardData && e.clipboardData.items;
            if (!items) return;
            var i;
            for (i = 0; i < items.length; i++) {
                if (items[i].type && items[i].type.indexOf('image') === 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    insertImageFile(items[i].getAsFile());
                    return;
                }
            }
        }, true);

        editor.addEventListener('dragover', function (e) {
            var dt = e.dataTransfer;
            if (!dt) return;
            var ok = dt.files && dt.files.length || (dt.types && Array.prototype.indexOf.call(dt.types, 'Files') >= 0);
            if (ok) {
                e.preventDefault();
                dt.dropEffect = 'copy';
                editor.classList.add('abene-drop-ok');
            }
        });
        editor.addEventListener('dragleave', function () { editor.classList.remove('abene-drop-ok'); });
        editor.addEventListener('drop', function (e) {
            editor.classList.remove('abene-drop-ok');
            var files = e.dataTransfer && e.dataTransfer.files;
            if (!files || !files.length) return;
            var n = 0;
            var opened = false;
            Array.prototype.forEach.call(files, function (f) {
                if (/^image\//.test(f.type)) { n++; insertImageFile(f); }
            });
            if (typeof window.abeneHandleDroppedFiles === 'function') {
                opened = window.abeneHandleDroppedFiles(files);
            }
            if (n || opened) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }

    function init() {
        bindEditor(editorEl());
        try {
            var ed0 = editorEl();
            if (ed0) ed0.querySelectorAll('[data-icon]').forEach(function (el) {
                if (el.closest('.abene-pic, [data-abene-block], .page-header-zone, .page-footer-zone')) return;
                wrapIcon(el);
            });
            syncAnchors();
        } catch (e) {}
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Delete' && e.key !== 'Backspace') return;
            var editor = editorEl();
            if (!editor) return;
            var on = editor.querySelector('.abene-pic.abene-obj-on, .abene-tbox.abene-obj-on');
            if (!on) return;
            if (on.classList.contains('abene-tbox') && document.activeElement && document.activeElement.closest && document.activeElement.closest('.abene-tbox-body')) return;
            e.preventDefault();
            removeAnchor(on);
            on.remove();
            hideTboxBar();
            var tb = document.getElementById('imageToolbar');
            if (tb) tb.classList.remove('visible');
            if (typeof hideImageHandles === 'function') hideImageHandles();
            window.selectedImage = null;
            save();
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    var origDelImg = window.deleteSelectedImage;
    window.deleteSelectedImage = function () {
        endCrop(false);
        var img = window.selectedImage;
        var wrap = img && img.closest && img.closest('.abene-pic');
        var host = wrap || img;
        var capAfter = host && host.nextElementSibling;
        if (capAfter && !(capAfter.classList.contains('abene-caption') || capAfter.getAttribute('data-caption-for'))) capAfter = null;
        if (wrap) {
            removeAnchor(wrap);
            wrap.remove();
            window.selectedImage = null;
            var tb = document.getElementById('imageToolbar');
            if (tb) tb.classList.remove('visible');
            if (typeof hideImageHandles === 'function') hideImageHandles();
            save();
        } else if (typeof origDelImg === 'function') {
            origDelImg.apply(this, arguments);
        }
        if (capAfter && capAfter.parentNode) capAfter.remove();
        if (typeof window.abeneRenumberCaptions === 'function') window.abeneRenumberCaptions();
        if (typeof window.abeneScheduleLiveFields === 'function') window.abeneScheduleLiveFields();
    };
    var origReset = window.resetImageStyle;
    window.resetImageStyle = function () {
        var img = window.selectedImage;
        if (isIconNode(img)) {
            applyIconSize(img, 32);
            img.style.border = '';
            img.style.boxShadow = '';
            img.style.borderRadius = '';
            img.style.transform = '';
            var box = img.closest && img.closest('.abene-pic');
            if (box) {
                box.removeAttribute('data-abene-rotate');
                applyWrap(box, 'none');
            }
            if (typeof saveUndoState === 'function') saveUndoState();
            if (typeof showImageToolbar === 'function') showImageToolbar({ clientX: 0, clientY: 0 });
            return;
        }
        if (typeof origReset === 'function') origReset.apply(this, arguments);
        img = window.selectedImage;
        var wrap = img && img.closest && img.closest('.abene-pic');
        if (img && img.getAttribute('data-abene-orig')) {
            img.src = img.getAttribute('data-abene-orig');
            img.removeAttribute('data-abene-orig');
        }
        if (wrap) {
            wrap.removeAttribute('data-abene-rotate');
            wrap.removeAttribute('data-abene-crop');
            applyWrap(wrap, 'none');
        }
        endCrop(false);
    };

    function rememberOrig(img) {
        if (img && !img.getAttribute('data-abene-orig')) img.setAttribute('data-abene-orig', img.getAttribute('src') || '');
    }
    function canvasSafe(img) {
        try {
            var c = document.createElement('canvas');
            c.width = 2;
            c.height = 2;
            c.getContext('2d').drawImage(img, 0, 0, 2, 2);
            c.toDataURL('image/png');
            return true;
        } catch (e) {
            return false;
        }
    }
    function replaceImgSrc(img, dataUrl) {
        var w = img.style.width || (img.offsetWidth ? img.offsetWidth + 'px' : '');
        img.src = dataUrl;
        if (w) {
            img.style.width = w;
            img.style.height = 'auto';
        }
        if (typeof save === 'function') save();
        else if (typeof saveUndoState === 'function') saveUndoState();
        if (typeof showImageToolbar === 'function') showImageToolbar({ clientX: 0, clientY: 0 });
    }
    function wrapSizeFns() {
        var origResize = window.resizeSelectedImage;
        if (typeof origResize === 'function' && !origResize._abeneIcon) {
            window.resizeSelectedImage = function (dim) {
                var el = window.selectedImage;
                if (isIconNode(el)) {
                    var wEl = document.getElementById('imgWidth');
                    var hEl = document.getElementById('imgHeight');
                    var px = dim === 'h' ? parseInt(hEl && hEl.value, 10) : parseInt(wEl && wEl.value, 10);
                    applyIconSize(el, px);
                    if (wEl) wEl.value = Math.round(el.offsetWidth || px);
                    if (hEl) hEl.value = Math.round(el.offsetHeight || px);
                    if (typeof saveUndoState === 'function') saveUndoState();
                    if (typeof positionImageHandles === 'function') positionImageHandles();
                    return;
                }
                return origResize.apply(this, arguments);
            };
            window.resizeSelectedImage._abeneIcon = true;
        }
        var origPct = window.setImageSizePercent;
        if (typeof origPct === 'function' && !origPct._abeneIcon) {
            window.setImageSizePercent = function (percent) {
                var el = window.selectedImage;
                if (isIconNode(el)) {
                    applyIconSize(el, 16 + (Math.max(10, Math.min(100, Number(percent) || 50)) / 100) * 160);
                    if (typeof showImageToolbar === 'function') showImageToolbar({ clientX: 0, clientY: 0 });
                    if (typeof saveUndoState === 'function') saveUndoState();
                    return;
                }
                return origPct.apply(this, arguments);
            };
            window.setImageSizePercent._abeneIcon = true;
        }
    }
    wrapSizeFns();
    document.addEventListener('DOMContentLoaded', wrapSizeFns);

    window.abeneRotateImage = function (delta) {
        endCrop(false);
        var img = window.selectedImage;
        if (isIconNode(img)) {
            var box = img.closest && img.closest('.abene-pic') || img;
            var cur = Number(box.getAttribute('data-abene-rotate')) || 0;
            cur = (cur + (delta < 0 ? -90 : 90) + 360) % 360;
            box.setAttribute('data-abene-rotate', String(cur));
            img.style.transform = cur ? 'rotate(' + cur + 'deg)' : '';
            img.style.display = 'block';
            save();
            if (typeof showImageToolbar === 'function') showImageToolbar({ clientX: 0, clientY: 0 });
            return;
        }
        if (!img || img.tagName !== 'IMG') return;
        if (!img.complete || !img.naturalWidth) {
            img.onload = function () { window.abeneRotateImage(delta); };
            return;
        }
        rememberOrig(img);
        if (!canvasSafe(img)) {
            if (typeof showToast === 'function') showToast(tt('imgRotateFail'));
            return;
        }
        var deg = delta < 0 ? 270 : 90;
        var w = img.naturalWidth;
        var h = img.naturalHeight;
        var c = document.createElement('canvas');
        if (deg === 180) { c.width = w; c.height = h; }
        else { c.width = h; c.height = w; }
        var ctx = c.getContext('2d');
        ctx.translate(c.width / 2, c.height / 2);
        ctx.rotate(deg * Math.PI / 180);
        ctx.drawImage(img, -w / 2, -h / 2);
        if (deg === 90 || deg === 270) {
            var shown = img.offsetHeight || parseFloat(img.style.width) || w;
            img.style.width = shown + 'px';
            img.style.height = 'auto';
        }
        replaceImgSrc(img, c.toDataURL('image/png'));
    };

    var cropState = null;
    function cropBar() { return document.getElementById('abeneCropBar'); }
    function endCrop(apply) {
        var bar = cropBar();
        if (bar) bar.hidden = true;
        if (cropState && cropState.overlay && cropState.overlay.parentNode) cropState.overlay.parentNode.removeChild(cropState.overlay);
        if (apply && cropState && cropState.img) bakeCrop(cropState);
        cropState = null;
        document.removeEventListener('mousemove', onCropMove);
        document.removeEventListener('mouseup', onCropUp);
    }
    function bakeCrop(st) {
        var img = st.img;
        var rect = st.rect;
        var box = img.getBoundingClientRect();
        if (!box.width || !box.height || !img.naturalWidth) return;
        var x = Math.max(0, (rect.left - box.left) / box.width) * img.naturalWidth;
        var y = Math.max(0, (rect.top - box.top) / box.height) * img.naturalHeight;
        var w = Math.max(4, (rect.width / box.width) * img.naturalWidth);
        var h = Math.max(4, (rect.height / box.height) * img.naturalHeight);
        if (x + w > img.naturalWidth) w = img.naturalWidth - x;
        if (y + h > img.naturalHeight) h = img.naturalHeight - y;
        rememberOrig(img);
        if (!canvasSafe(img)) {
            if (typeof showToast === 'function') showToast(tt('imgRotateFail'));
            return;
        }
        var c = document.createElement('canvas');
        c.width = Math.round(w);
        c.height = Math.round(h);
        c.getContext('2d').drawImage(img, Math.round(x), Math.round(y), c.width, c.height, 0, 0, c.width, c.height);
        var shown = Math.min(img.offsetWidth || c.width, c.width);
        img.style.width = shown + 'px';
        img.style.height = 'auto';
        replaceImgSrc(img, c.toDataURL('image/png'));
    }
    function onCropMove(ev) {
        if (!cropState || !cropState.drag) return;
        ev.preventDefault();
        var box = cropState.img.getBoundingClientRect();
        var r = cropState.rect;
        var dx = ev.clientX - cropState.startX;
        var dy = ev.clientY - cropState.startY;
        var left = cropState.orig.left;
        var top = cropState.orig.top;
        var right = cropState.orig.left + cropState.orig.width;
        var bottom = cropState.orig.top + cropState.orig.height;
        var hnd = cropState.drag;
        if (hnd.indexOf('w') >= 0) left = cropState.orig.left + dx;
        if (hnd.indexOf('e') >= 0) right = cropState.orig.left + cropState.orig.width + dx;
        if (hnd.indexOf('n') >= 0) top = cropState.orig.top + dy;
        if (hnd.indexOf('s') >= 0) bottom = cropState.orig.top + cropState.orig.height + dy;
        if (hnd === 'move') {
            left = cropState.orig.left + dx;
            top = cropState.orig.top + dy;
            right = left + cropState.orig.width;
            bottom = top + cropState.orig.height;
        }
        left = Math.max(box.left, Math.min(left, box.right - 16));
        top = Math.max(box.top, Math.min(top, box.bottom - 16));
        right = Math.min(box.right, Math.max(right, left + 16));
        bottom = Math.min(box.bottom, Math.max(bottom, top + 16));
        r.left = left;
        r.top = top;
        r.width = right - left;
        r.height = bottom - top;
        placeCropRect();
    }
    function onCropUp() {
        if (cropState) cropState.drag = null;
    }
    function placeCropRect() {
        if (!cropState || !cropState.overlay) return;
        var rectEl = cropState.overlay.querySelector('.abene-crop-rect');
        if (!rectEl) return;
        rectEl.style.left = cropState.rect.left + 'px';
        rectEl.style.top = cropState.rect.top + 'px';
        rectEl.style.width = cropState.rect.width + 'px';
        rectEl.style.height = cropState.rect.height + 'px';
    }
    window.abeneStartCrop = function () {
        var img = window.selectedImage;
        if (!img || img.tagName !== 'IMG') return;
        if (!img.complete || !img.naturalWidth) {
            img.onload = function () { window.abeneStartCrop(); };
            return;
        }
        rememberOrig(img);
        if (!canvasSafe(img)) {
            if (typeof showToast === 'function') showToast(tt('imgRotateFail'));
            return;
        }
        endCrop(false);
        if (typeof hideImageHandles === 'function') hideImageHandles();
        var box = img.getBoundingClientRect();
        var overlay = document.createElement('div');
        overlay.className = 'abene-crop-overlay';
        overlay.innerHTML = '<div class="abene-crop-rect">' +
            '<span data-c="nw"></span><span data-c="ne"></span><span data-c="sw"></span><span data-c="se"></span></div>';
        document.body.appendChild(overlay);
        var pad = Math.min(box.width, box.height) * 0.08;
        cropState = {
            img: img,
            overlay: overlay,
            rect: { left: box.left + pad, top: box.top + pad, width: box.width - pad * 2, height: box.height - pad * 2 },
            orig: null,
            drag: null,
            startX: 0,
            startY: 0
        };
        placeCropRect();
        var rectEl = overlay.querySelector('.abene-crop-rect');
        rectEl.addEventListener('mousedown', function (ev) {
            if (ev.target.getAttribute('data-c')) return;
            ev.preventDefault();
            cropState.drag = 'move';
            cropState.startX = ev.clientX;
            cropState.startY = ev.clientY;
            cropState.orig = { left: cropState.rect.left, top: cropState.rect.top, width: cropState.rect.width, height: cropState.rect.height };
        });
        overlay.querySelectorAll('[data-c]').forEach(function (h) {
            h.addEventListener('mousedown', function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                cropState.drag = h.getAttribute('data-c');
                cropState.startX = ev.clientX;
                cropState.startY = ev.clientY;
                cropState.orig = { left: cropState.rect.left, top: cropState.rect.top, width: cropState.rect.width, height: cropState.rect.height };
            });
        });
        document.addEventListener('mousemove', onCropMove);
        document.addEventListener('mouseup', onCropUp);
        var bar = cropBar();
        if (bar) {
            bar.hidden = false;
            bar.style.left = Math.max(8, box.left) + 'px';
            bar.style.top = Math.max(8, box.top - 40) + 'px';
        }
    };
    window.abeneApplyCrop = function () { endCrop(true); };
    window.abeneCancelCrop = function () { endCrop(false); };
    window.abeneStickFigureCaption = stickCaptionToPic;
    window.abeneWrapImage = wrapImg;
    document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && cropState) {
            ev.preventDefault();
            endCrop(false);
        }
    });
    window.addEventListener('scroll', function () {
        if (cropState) endCrop(false);
    }, true);

    function wrapLooseImages(root) {
        var editor = root || editorEl();
        if (!editor) return;
        editor.querySelectorAll('img').forEach(function (img) {
            if (isLockedImg(img)) return;
            var w = wrapImg(img);
            if (w) stickCaptionToPic(w);
        });
        editor.querySelectorAll('.abene-pic').forEach(stickCaptionToPic);
    }
    window.abeneWrapLooseImages = wrapLooseImages;

    window.ABENE = window.ABENE || {};
    window.ABENE.Images = {
        syncAnchors: syncAnchors,
        applyWrap: applyWrap,
        ensureAnchor: ensureAnchor,
        wrapLoose: wrapLooseImages,
        wrapOne: wrapImg,
        stickCaption: stickCaptionToPic
    };
})();
