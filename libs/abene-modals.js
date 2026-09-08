/* Genius Raros — modales de mise en page, tableau, image, lien, export, typographie */
(function () {
    function tt(key, vars) {
        return typeof window.t === 'function' ? window.t(key, vars) : key;
    }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function editorEl() { return document.getElementById('editor'); }
    function insertViaCommands(html) {
        if (window.EditorCommands && window.EditorCommands.useEngine && typeof window.EditorCommands.insertHTML === 'function') {
            return window.EditorCommands.insertHTML(html);
        }
        var editor = editorEl();
        if (editor) editor.focus();
        try { document.execCommand('insertHTML', false, html); } catch (e) {
            if (editor) editor.insertAdjacentHTML('beforeend', html);
        }
    }
    var savedRange = null;
    function saveCaret() {
        var sel = window.getSelection();
        if (sel && sel.rangeCount) savedRange = sel.getRangeAt(0).cloneRange();
    }
    function restoreCaret() {
        var editor = editorEl();
        if (!editor) return;
        editor.focus();
        if (!savedRange) return;
        try {
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange);
        } catch (e) {}
    }
    function currentBlock() {
        var editor = editorEl();
        var sel = window.getSelection();
        if (!editor || !sel || !sel.rangeCount) return null;
        var n = sel.anchorNode;
        if (n && n.nodeType === 3) n = n.parentNode;
        while (n && n !== editor) {
            if (n.tagName && /^(P|H1|H2|H3|H4|H5|H6|LI|BLOCKQUOTE|DIV)$/.test(n.tagName)) return n;
            n = n.parentNode;
        }
        return null;
    }
    function closeFly() {
        try {
            if (typeof hideRibbonFlyout === 'function') hideRibbonFlyout();
        } catch (e) {
            var f = document.getElementById('ribbonFlyout');
            if (f) f.classList.remove('visible');
        }
        if (typeof closeAllDropdowns === 'function') closeAllDropdowns();
    }
    function field(id, label, inner) {
        return '<div class="form-group"><label for="' + id + '">' + esc(label) + '</label>' + inner + '</div>';
    }
    function val(id) {
        var el = document.getElementById(id);
        return el ? el.value : '';
    }
    function checked(id) {
        var el = document.getElementById(id);
        return !!(el && el.checked);
    }
    function restoreBg() {
        var c = localStorage.getItem('abenePageBg');
        if (!c) return;
        var editor = editorEl();
        if (editor) editor.style.backgroundColor = c;
        var ribbon = document.getElementById('pageBgColor');
        if (ribbon) ribbon.value = c;
        var ps = document.getElementById('psPageBg');
        if (ps) ps.value = c;
    }

    if (typeof window.changePageBg === 'function') {
        var origBg = window.changePageBg;
        window.changePageBg = function (color) {
            origBg(color);
            try { localStorage.setItem('abenePageBg', color); } catch (e) {}
        };
    }

    window.openInsertTableModal = function () {
        closeFly();
        if (typeof openGenericModal !== 'function') return;
        saveCaret();
        openGenericModal(tt('insertTable'),
            '<div class="form-row">' +
                field('abeneTblRows', tt('pRows'), '<input id="abeneTblRows" type="number" min="1" max="50" value="3">') +
                field('abeneTblCols', tt('pCols'), '<input id="abeneTblCols" type="number" min="1" max="20" value="3">') +
            '</div>' +
            field('abeneTblBorder', tt('tblBorder'),
                '<select id="abeneTblBorder">' +
                    '<option value="thin">' + esc(tt('tblBorderThin')) + '</option>' +
                    '<option value="medium">' + esc(tt('tblBorderMed')) + '</option>' +
                    '<option value="none">' + esc(tt('borderNone')) + '</option>' +
                '</select>') +
            field('abeneTblFill', tt('tblCellBg'), '<input id="abeneTblFill" type="color" value="#ffffff">') +
            '<label style="display:flex;align-items:center;gap:8px;font-size:12px;margin-top:8px;">' +
                '<input type="checkbox" id="abeneTblHeader" checked>' +
                '<span>' + esc(tt('tblHeaderRow')) + '</span>' +
            '</label>',
            '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel')) + '</button>' +
            '<button class="btn-primary" onclick="abeneApplyInsertTable()">' + esc(tt('ok')) + '</button>'
        );
    };
    window.abeneApplyInsertTable = function () {
        var rows = Math.max(1, Math.min(50, parseInt(val('abeneTblRows'), 10) || 3));
        var cols = Math.max(1, Math.min(20, parseInt(val('abeneTblCols'), 10) || 3));
        var border = val('abeneTblBorder') || 'thin';
        var fill = val('abeneTblFill') || '#ffffff';
        var header = checked('abeneTblHeader');
        if (typeof closeModal === 'function') closeModal('genericModal');
        var bw = border === 'none' ? '0' : (border === 'medium' ? '2px' : '1px');
        var bc = border === 'none' ? 'transparent' : '#333';
        var cellCss = 'border:' + bw + ' solid ' + bc + ';padding:6px 10px;background:' + fill + ';';
        var html = '<table style="border-collapse:collapse;width:100%;">';
        var r, c, tag, text;
        for (r = 0; r < rows; r++) {
            html += '<tr>';
            for (c = 0; c < cols; c++) {
                tag = (header && r === 0) ? 'th' : 'td';
                text = (header && r === 0)
                    ? (tt('tblHeaderCell') + ' ' + (c + 1))
                    : (tt('tblCell') + ' ' + r + ',' + (c + 1));
                html += '<' + tag + ' style="' + cellCss + '">' + esc(text) + '</' + tag + '>';
            }
            html += '</tr>';
        }
        html += '</table><p></p>';
        restoreCaret();
        var editor = editorEl();
        if (editor) editor.focus();
        insertViaCommands(html);
        if (typeof saveUndoState === 'function') saveUndoState();
    };
    window.insertCustomTable = function () {
        window.openInsertTableModal();
        var picker = document.getElementById('tableSizePicker');
        if (picker) picker.classList.remove('visible');
    };
    if (typeof window.drawTable === 'function') {
        window.drawTable = function () { window.openInsertTableModal(); };
    }

    window.openInsertImageModal = function () {
        closeFly();
        if (typeof openGenericModal !== 'function') return;
        saveCaret();
        window._abeneImgFileData = '';
        window._abeneImgFileName = '';
        openGenericModal(tt('imgInsert'),
            '<div class="form-group"><button type="button" class="btn-secondary" onclick="document.getElementById(\'abeneImgFile\').click()">' +
                esc(tt('imgChooseFile')) + '</button>' +
                '<input id="abeneImgFile" type="file" accept="image/*" style="display:none" onchange="abenePreviewImageFile(this)">' +
                '<div id="abeneImgFileName" style="font-size:11px;color:#666;margin-top:6px;"></div></div>' +
            field('abeneImgUrl', tt('pImageUrl'), '<input id="abeneImgUrl" type="url" value="https://">') +
            '<div class="form-row">' +
                field('abeneImgW', tt('imgWidth'), '<input id="abeneImgW" type="number" min="0" max="2000" value="400">') +
                field('abeneImgUnit', tt('imgWidthUnit'),
                    '<select id="abeneImgUnit"><option value="px">px</option><option value="%">%</option></select>') +
            '</div>' +
            field('abeneImgWrap', tt('imgWrap'),
                '<select id="abeneImgWrap">' +
                    '<option value="none">' + esc(tt('objInline')) + '</option>' +
                    '<option value="left">' + esc(tt('objLeft')) + '</option>' +
                    '<option value="right">' + esc(tt('objRight')) + '</option>' +
                    '<option value="center">' + esc(tt('objCenter')) + '</option>' +
                    '<option value="free">' + esc(tt('objFree')) + '</option>' +
                '</select>'),
            '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel')) + '</button>' +
            '<button class="btn-primary" onclick="abeneApplyInsertImage()">' + esc(tt('ok')) + '</button>'
        );
    };
    window.abenePreviewImageFile = function (inp) {
        var file = inp && inp.files && inp.files[0];
        if (!file) return;
        window._abeneImgFileName = file.name || '';
        var nameEl = document.getElementById('abeneImgFileName');
        if (nameEl) nameEl.textContent = file.name;
        var reader = new FileReader();
        reader.onload = function (e) { window._abeneImgFileData = e.target.result; };
        reader.readAsDataURL(file);
    };
    window.abeneApplyInsertImage = function () {
        var data = window._abeneImgFileData;
        var url = (val('abeneImgUrl') || '').trim();
        var width = Number(val('abeneImgW')) || 0;
        var unit = val('abeneImgUnit') || 'px';
        var wrap = val('abeneImgWrap') || 'none';
        if (typeof closeModal === 'function') closeModal('genericModal');
        restoreCaret();
        var src = data;
        if (!src) {
            if (/^https?:\/\//i.test(url) || /^data:image\//i.test(url)) src = url;
        }
        if (!src) {
            if (typeof showToast === 'function') showToast(tt('aBadUrl'));
            return;
        }
        if (typeof window.abeneInsertPicture === 'function') {
            window.abeneInsertPicture(src, { width: width, unit: unit, wrap: wrap, alt: window._abeneImgFileName || '' });
        } else {
            insertViaCommands('<img data-illustration="true" src="' + esc(src) + '" style="max-width:400px;height:auto;" alt="">');
        }
        window._abeneImgFileData = '';
    };
    window.insertOnlineImage = function () {
        window.openInsertImageModal();
    };

    window.insertLink = function () {
        closeFly();
        if (typeof openGenericModal !== 'function') return;
        var sel = window.getSelection();
        var selected = sel && sel.toString() ? sel.toString() : '';
        saveCaret();
        openGenericModal(tt('link'),
            field('abeneLinkUrl', tt('linkUrl'), '<input id="abeneLinkUrl" type="url" value="https://">') +
            field('abeneLinkText', tt('linkText'), '<input id="abeneLinkText" type="text" value="' + esc(selected) + '">') +
            field('abeneLinkTarget', tt('linkTarget'),
                '<select id="abeneLinkTarget">' +
                    '<option value="_blank">' + esc(tt('linkNewTab')) + '</option>' +
                    '<option value="_self">' + esc(tt('linkSameTab')) + '</option>' +
                '</select>'),
            '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel')) + '</button>' +
            '<button class="btn-primary" onclick="abeneApplyInsertLink()">' + esc(tt('ok')) + '</button>'
        );
    };
    window.abeneApplyInsertLink = function () {
        var url = (val('abeneLinkUrl') || '').trim();
        var text = (val('abeneLinkText') || '').trim();
        var target = val('abeneLinkTarget') === '_self' ? '_self' : '_blank';
        if (typeof closeModal === 'function') closeModal('genericModal');
        if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url) && !/^#/.test(url)) {
            if (typeof showToast === 'function') showToast(tt('aBadUrl'));
            return;
        }
        restoreCaret();
        var display = text || url;
        var extra = target === '_blank' ? ' target="_blank" rel="noopener noreferrer"' : ' target="_self"';
        insertViaCommands(
            '<a href="' + esc(url) + '"' + extra + ' style="color:#2b579a;">' + esc(display) + '</a>');
        if (typeof saveUndoState === 'function') saveUndoState();
    };

    window.openTypographyModal = function () {
        closeFly();
        if (typeof openGenericModal !== 'function') return;
        saveCaret();
        var fonts = ['Calibri', 'Arial', 'Times New Roman', 'Roboto', 'Georgia', 'Courier New', 'Verdana', 'Tahoma', 'Garamond', 'Trebuchet MS'];
        var ff = document.getElementById('fontFamily');
        var fs = document.getElementById('fontSize');
        var curFont = ff && ff.value ? ff.value : 'Calibri';
        var curSize = fs && fs.value ? fs.value : '11';
        openGenericModal(tt('typoTitle'),
            field('abeneTyFont', tt('dlgFont'),
                '<select id="abeneTyFont">' + fonts.map(function (f) {
                    return '<option value="' + esc(f) + '"' + (f === curFont ? ' selected' : '') + ' style="font-family:' + esc(f) + '">' + esc(f) + '</option>';
                }).join('') + '</select>') +
            '<div class="form-row">' +
                field('abeneTySize', tt('dlgSizePt'), '<input id="abeneTySize" type="number" min="1" max="1638" step="0.5" value="' + esc(curSize) + '">') +
                field('abeneTyAlign', tt('dlgAlign'),
                    '<select id="abeneTyAlign">' +
                        '<option value="left">' + esc(tt('alignLeft')) + '</option>' +
                        '<option value="center">' + esc(tt('alignCenter')) + '</option>' +
                        '<option value="right">' + esc(tt('alignRight')) + '</option>' +
                        '<option value="justify">' + esc(tt('dlgJustify')) + '</option>' +
                    '</select>') +
            '</div>' +
            '<div class="chk-row">' +
                '<label><input type="checkbox" id="abeneTyBold"> <b>' + esc(tt('boldLetter')) + '</b></label>' +
                '<label><input type="checkbox" id="abeneTyItalic"> <i>' + esc(tt('italicLetter')) + '</i></label>' +
                '<label><input type="checkbox" id="abeneTyUnder"> <u>' + esc(tt('dlgUnderline')) + '</u></label>' +
                '<label><input type="checkbox" id="abeneTyStrike"> <s>' + esc(tt('dlgStrike')) + '</s></label>' +
                '<label><input type="checkbox" id="abeneTySuper">' + esc(tt('dlgSuper')) + '</label>' +
                '<label><input type="checkbox" id="abeneTySub">' + esc(tt('dlgSub')) + '</label>' +
            '</div>' +
            '<div class="form-row">' +
                field('abeneTyLine', tt('dlgLineRule'),
                    '<select id="abeneTyLine">' +
                        '<option value="1">1.0</option>' +
                        '<option value="1.15" selected>1.15</option>' +
                        '<option value="1.5">1.5</option>' +
                        '<option value="2">2.0</option>' +
                    '</select>') +
                field('abeneTyBefore', tt('dlgBefore'), '<input id="abeneTyBefore" type="number" min="0" value="0">') +
                field('abeneTyAfter', tt('dlgAfter'), '<input id="abeneTyAfter" type="number" min="0" value="8">') +
            '</div>' +
            '<p style="font-size:11px;color:#666;margin-top:8px;">' +
                '<a href="#" onclick="closeModal(\'genericModal\');openFontDialog();return false;">' + esc(tt('dlgFont')) + '</a> · ' +
                '<a href="#" onclick="closeModal(\'genericModal\');openParagraphDialog();return false;">' + esc(tt('dlgPara')) + '</a>' +
            '</p>',
            '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel')) + '</button>' +
            '<button class="btn-primary" onclick="abeneApplyTypography()">' + esc(tt('ok')) + '</button>'
        );
    };
    window.abeneApplyTypography = function () {
        var font = val('abeneTyFont');
        var size = val('abeneTySize');
        var align = val('abeneTyAlign');
        var line = val('abeneTyLine');
        var before = val('abeneTyBefore');
        var after = val('abeneTyAfter');
        var bold = checked('abeneTyBold');
        var italic = checked('abeneTyItalic');
        var under = checked('abeneTyUnder');
        var strike = checked('abeneTyStrike');
        var sup = checked('abeneTySuper');
        var sub = checked('abeneTySub');
        if (typeof closeModal === 'function') closeModal('genericModal');
        restoreCaret();
        var editor = editorEl();
        if (editor) editor.focus();
        if (font && typeof window.changeFontFamily === 'function') window.changeFontFamily(font);
        if (size && typeof window.changeFontSize === 'function') window.changeFontSize(size);
        function tyExec(cmd) {
            if (window.EditorCommands && window.EditorCommands.useEngine && typeof window.EditorCommands.exec === 'function') {
                return window.EditorCommands.exec(cmd);
            }
            document.execCommand(cmd);
        }
        if (bold) tyExec('bold');
        if (italic) tyExec('italic');
        if (under) tyExec('underline');
        if (strike) tyExec('strikeThrough');
        if (sup) tyExec('superscript');
        if (sub) tyExec('subscript');
        var alignCmd = { left: 'justifyLeft', center: 'justifyCenter', right: 'justifyRight', justify: 'justifyFull' };
        if (align && alignCmd[align]) tyExec(alignCmd[align]);
        var block = currentBlock();
        if (block) {
            if (line) block.style.lineHeight = line;
            block.style.marginTop = (before || '0') + 'pt';
            block.style.marginBottom = (after || '8') + 'pt';
            if (align) block.style.textAlign = align;
        } else if (typeof window.changeLineSpacing === 'function') {
            window.changeLineSpacing(line);
        }
        if (typeof saveUndoState === 'function') saveUndoState();
    };

    window.openExportModal = function () {
        closeFly();
        if (typeof openGenericModal !== 'function') return;
        function btn(fn, icon, label) {
            return '<button type="button" class="btn-secondary" style="width:100%;text-align:left;margin-bottom:8px;" onclick="closeModal(\'genericModal\');' + fn + '()">' +
                icon + ' ' + esc(label) + '</button>';
        }
        openGenericModal(tt('exportDoc'),
            btn('exportDocx', '📘', tt('saveAsWord') || tt('fileDocx')) +
            btn('exportPDF', '📥', tt('saveAsPdf') || tt('filePdf')) +
            btn('saveForAccountant', '📊', tt('saveAsAcct') || tt('acctCsv')) +
            btn('exportWord', '📄', tt('fileDoc')) +
            btn('exportHtml', '🌐', tt('exportHtml')) +
            btn('saveAsText', '📝', tt('fileSaveTxt')) +
            btn('exportMarkdown', '📑', tt('fileMd')),
            '<button class="btn-primary" onclick="closeModal(\'genericModal\')">' + esc(tt('close') || tt('ok')) + '</button>'
        );
    };
    window.exportHtml = function () {
        var html = typeof persistableEditorHtml === 'function' ? persistableEditorHtml() : (editorEl() ? editorEl().innerHTML : '');
        var name = (window.documentState && documentState.name) || 'document';
        var doc = '<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"><title>' + esc(name) + '</title></head><body>' + html + '</body></html>';
        if (typeof downloadFile === 'function') downloadFile(doc, name + '.html', 'text/html');
        if (typeof closeAllDropdowns === 'function') closeAllDropdowns();
    };

    document.addEventListener('DOMContentLoaded', restoreBg);
    if (document.readyState !== 'loading') restoreBg();

    function winHint() {
        return typeof window.t === 'function' ? window.t('winDrag') : 'Arraste a barra de título para o lado e veja o documento.';
    }
    function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
    function pt(e) {
        if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        return { x: e.clientX, y: e.clientY };
    }
    function resetBox(box, overlay) {
        if (overlay) overlay.classList.remove('abene-win-moved');
        box.style.left = '';
        box.style.top = '';
        box.style.right = '';
        box.style.position = '';
        box.style.margin = '';
        box.style.width = '';
        box.classList.remove('is-dragging');
        box.removeAttribute('data-abene-docked');
    }
    function hitUi(el) {
        var n = el && el.nodeType === 1 ? el : (el && el.parentElement);
        return n && n.closest && n.closest('button, a, input, select, textarea, .modal-close');
    }
    function place(box, x, y, w) {
        box.style.left = clamp(x, 8 - Math.max(0, w - 96), window.innerWidth - 96) + 'px';
        box.style.top = clamp(y, 8, window.innerHeight - 56) + 'px';
    }
    function snapAside(box) {
        var r = box.getBoundingClientRect();
        var edge = 56;
        if (r.left < edge) box.style.left = '12px';
        else if (r.right > window.innerWidth - edge) {
            box.style.left = Math.max(12, window.innerWidth - r.width - 12) + 'px';
        }
    }
    function clampDocked() {
        document.querySelectorAll('[data-abene-docked="1"]').forEach(function (box) {
            var r = box.getBoundingClientRect();
            place(box, r.left, r.top, r.width);
        });
    }
    function bindDrag(header, box, overlay) {
        if (!header || !box || header.getAttribute('data-abene-drag') === '1') return;
        header.setAttribute('data-abene-drag', '1');
        header.setAttribute('data-i18n-title', 'winDrag');
        header.title = winHint();
        function start(e) {
            if (e.type === 'mousedown' && e.button !== 0) return;
            if (hitUi(e.target)) return;
            if (window.innerWidth <= 820 || document.body.classList.contains('abene-phone')) return;
            e.preventDefault();
            var r = box.getBoundingClientRect();
            var p = pt(e);
            if (overlay) overlay.classList.add('abene-win-moved');
            box.style.position = 'fixed';
            box.style.left = r.left + 'px';
            box.style.top = r.top + 'px';
            box.style.margin = '0';
            box.style.width = r.width + 'px';
            box.style.right = 'auto';
            box.setAttribute('data-abene-docked', '1');
            box.classList.add('is-dragging');
            var ox = p.x - r.left;
            var oy = p.y - r.top;
            var w = r.width;
            function move(ev) {
                ev.preventDefault();
                var q = pt(ev);
                place(box, q.x - ox, q.y - oy, w);
            }
            function stop() {
                box.classList.remove('is-dragging');
                snapAside(box);
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', stop);
                document.removeEventListener('touchmove', move);
                document.removeEventListener('touchend', stop);
            }
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', stop);
            document.addEventListener('touchmove', move, { passive: false });
            document.addEventListener('touchend', stop);
        }
        header.addEventListener('mousedown', start);
        header.addEventListener('touchstart', start, { passive: false });
        header.addEventListener('dblclick', function (e) {
            if (hitUi(e.target)) return;
            resetBox(box, overlay);
        });
    }
    function watchOverlay(overlay) {
        var modal = overlay.querySelector('.modal');
        var header = modal && modal.querySelector('.modal-header');
        if (!header) return;
        bindDrag(header, modal, overlay);
        var prev = overlay.classList.contains('visible');
        var obs = new MutationObserver(function () {
            var now = overlay.classList.contains('visible');
            if (now && !prev) resetBox(modal, overlay);
            prev = now;
        });
        obs.observe(overlay, { attributes: true, attributeFilter: ['class'] });
    }
    function initWinDrag() {
        document.querySelectorAll('.modal-overlay:not(.paper-preview-overlay)').forEach(watchOverlay);
        var find = document.getElementById('findReplacePanel');
        if (find) bindDrag(find.querySelector('.find-replace-header'), find, null);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initWinDrag);
    else initWinDrag();
    window.addEventListener('resize', clampDocked);
    var prevI18n = window.abeneAfterI18n;
    window.abeneAfterI18n = function (lang) {
        if (typeof prevI18n === 'function') prevI18n(lang);
        document.querySelectorAll('[data-abene-drag="1"]').forEach(function (h) { h.title = winHint(); });
    };
})();
