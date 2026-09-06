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
        if (img) {
            window.selectedImage = img;
            img.classList.add('selected');
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
    function applyWrap(el, mode) {
        if (!el) return;
        mode = mode || 'none';
        if (mode === 'inline') mode = 'none';
        el.classList.remove('abene-obj-left', 'abene-obj-right', 'abene-obj-center', 'abene-obj-free',
            'abene-obj-inline', 'abene-obj-behind', 'abene-obj-front');
        el.style.float = '';
        el.style.display = '';
        el.style.marginLeft = '';
        el.style.marginRight = '';
        el.style.zIndex = '';
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
        if (typeof positionImageHandles === 'function') positionImageHandles();
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
            Array.prototype.forEach.call(files, function (f) {
                if (/^image\//.test(f.type)) { n++; insertImageFile(f); }
            });
            if (n) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }

    function init() {
        bindEditor(editorEl());
        try { syncAnchors(); } catch (e) {}
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
        var img = window.selectedImage;
        var wrap = img && img.closest && img.closest('.abene-pic');
        if (wrap) {
            removeAnchor(wrap);
            wrap.remove();
            window.selectedImage = null;
            var tb = document.getElementById('imageToolbar');
            if (tb) tb.classList.remove('visible');
            if (typeof hideImageHandles === 'function') hideImageHandles();
            save();
            return;
        }
        if (typeof origDelImg === 'function') return origDelImg.apply(this, arguments);
    };
    var origReset = window.resetImageStyle;
    window.resetImageStyle = function () {
        if (typeof origReset === 'function') origReset.apply(this, arguments);
        var img = window.selectedImage;
        var wrap = img && img.closest && img.closest('.abene-pic');
        if (wrap) applyWrap(wrap, 'none');
    };

    window.ABENE = window.ABENE || {};
    window.ABENE.Images = {
        syncAnchors: syncAnchors,
        applyWrap: applyWrap,
        ensureAnchor: ensureAnchor
    };
})();
