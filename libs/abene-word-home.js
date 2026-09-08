/* Genius Raros — moteur Accueil / Police / Paragraphe / Règle (Word 2013+) */
(function () {
    var DPI = (window.PageGeometry && window.PageGeometry.dpi) || 96;
    var PX_CM = DPI / 2.54;
    var WORD_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
    var formatPainterLocked = false;
    var currentTabStops = [];
    var lastIndent = { first: 0, left: 0, right: 0 };
    var lastIndentBlock = null;
    var PAGE_SEAM = 40;

    function A() { return window.abene || {}; }
    function tt(key, vars) { return typeof window.t === 'function' ? window.t(key, vars) : key; }
    function ed() { return (A().editor) || document.getElementById('editor'); }
    function runExec(cmd, value) {
        if (window.EditorCommands && window.EditorCommands.useEngine && typeof window.EditorCommands.exec === 'function') {
            return window.EditorCommands.exec(cmd, value);
        }
        var editor = ed();
        if (editor) editor.focus();
        try { return document.execCommand(cmd, false, value == null ? null : value); } catch (e) { return false; }
    }
    function runInsertHTML(html) {
        if (window.EditorCommands && window.EditorCommands.useEngine && typeof window.EditorCommands.insertHTML === 'function') {
            return window.EditorCommands.insertHTML(html);
        }
        try { return document.execCommand('insertHTML', false, html); } catch (e) { return false; }
    }
    function runInsertText(text) {
        if (window.EditorCommands && window.EditorCommands.useEngine && typeof window.EditorCommands.insertText === 'function') {
            return window.EditorCommands.insertText(text);
        }
        try { return document.execCommand('insertText', false, text); } catch (e) { return false; }
    }
    function cm(px) { return (Number(px) || 0) / PX_CM; }
    function px(c) { return Math.round((Number(c) || 0) * PX_CM); }
    function pageW() {
        if (typeof getPageWidth === 'function') return getPageWidth();
        if (window.PageGeometry) return window.PageGeometry.width;
        return (ed() && ed().offsetWidth) || 794;
    }
    function pageH() {
        if (typeof getPageHeight === 'function') return getPageHeight();
        if (window.PageGeometry) return window.PageGeometry.height;
        return 1123;
    }
    function hideFly() {
        var f = document.getElementById('ribbonFlyout');
        if (f) {
            f.classList.remove('visible');
            f.classList.remove('hf-gallery-fly');
        }
        var mini = document.getElementById('miniToolbar');
        if (mini) mini.classList.remove('visible');
    }
    function showFly(ev, html) {
        var f = document.getElementById('ribbonFlyout');
        if (!f) return;
        f.classList.remove('hf-gallery-fly');
        f.innerHTML = html;
        f.classList.add('visible');
        var r = (ev.currentTarget || ev.target).getBoundingClientRect();
        f.style.left = r.left + 'px';
        f.style.top = r.bottom + 'px';
        ev.stopPropagation();
    }
    function getBlock() {
        var sel = window.getSelection();
        if (!sel.rangeCount) return null;
        var n = sel.anchorNode;
        if (n && n.nodeType !== 1) n = n.parentElement;
        if (!n) return null;
        return n.closest('p, h1, h2, h3, h4, h5, h6, blockquote, pre, li, td, th') || n.closest('#editor > *');
    }
    function wrapInline(mutator) {
        var editor = ed();
        editor.focus();
        var sel = window.getSelection();
        if (!sel.rangeCount) return;
        var range = sel.getRangeAt(0);
        var span = document.createElement('span');
        mutator(span);
        if (range.collapsed) {
            span.appendChild(document.createTextNode('\u200b'));
            range.insertNode(span);
        } else {
            span.appendChild(range.extractContents());
            range.insertNode(span);
        }
        if (typeof saveUndoState === 'function') saveUndoState();
    }
    function applyToBlocks(fn) {
        var block = getBlock();
        if (!block) return;
        fn(block);
        if (typeof saveUndoState === 'function') saveUndoState();
        if (typeof updateRulerFromSelection === 'function') updateRulerFromSelection();
    }

    window.showPasteMenu = function (ev) {
        showFly(ev,
            '<button type="button" onclick="pasteContent(\'source\')">' + tt('pasteSource') + '</button>' +
            '<button type="button" onclick="pasteContent(\'merge\')">' + tt('pasteMerge') + '</button>' +
            '<button type="button" onclick="pasteContent(\'text\')">' + tt('pasteText') + '</button>' +
            '<button type="button" onclick="pasteContent(\'link\')">' + tt('pasteLink') + '</button>' +
            '<button type="button" onclick="pasteContent(\'formulas\')">' + tt('xlPasteFml') + '</button>'
        );
    };
    function tdFromCaret() {
        var sel = window.getSelection();
        if (!sel || !sel.rangeCount) return null;
        var n = sel.anchorNode;
        if (n && n.nodeType !== 1) n = n.parentElement;
        return n && n.closest ? n.closest('td,th') : null;
    }
    function styleFromTd(td) {
        var cs = td.style || {};
        var ce = { raw: (td.getAttribute('data-raw') != null ? td.getAttribute('data-raw') : (td.innerText || '').replace(/\u00a0/g, ' ')), value: (td.innerText || '').trim() };
        var computed = window.getComputedStyle(td);
        var fw = cs.fontWeight || computed.fontWeight;
        if (fw === 'bold' || Number(fw) >= 700 || td.tagName === 'TH') ce.bold = true;
        if ((cs.fontStyle || computed.fontStyle) === 'italic') ce.italic = true;
        if (String(cs.textDecoration || computed.textDecoration || '').indexOf('underline') >= 0) ce.under = true;
        var bg = cs.backgroundColor || computed.backgroundColor;
        if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') ce.fill = bg;
        if (cs.color || (computed.color && computed.color !== 'rgb(0, 0, 0)')) ce.color = cs.color || computed.color;
        if (cs.textAlign || computed.textAlign) ce.align = cs.textAlign || computed.textAlign;
        var fs = parseFloat(cs.fontSize || computed.fontSize);
        if (fs) ce.size = fs;
        if (cs.fontFamily || computed.fontFamily) ce.font = cs.fontFamily || computed.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
        return ce;
    }
    function applyTdFromCell(td, ce, mode) {
        if (!td || !ce) return;
        var txt;
        if (mode === 'link') {
            txt = ce._link || cellPackValue(ce);
            td.setAttribute('data-abene-xl-link', ce._link || '');
            td.style.color = '#0563c1';
            td.style.textDecoration = 'underline';
        } else if (mode === 'formulas') {
            txt = ce.raw != null ? String(ce.raw) : cellPackValue(ce);
            if (ce.raw) td.setAttribute('data-raw', ce.raw);
        } else if (mode === 'text' || mode === 'val') {
            txt = cellPackValue(ce);
        } else {
            txt = cellPackValue(ce);
            if (ce.raw) td.setAttribute('data-raw', ce.raw);
        }
        if (mode !== 'merge' && mode !== 'text' && mode !== 'val') {
            if (ce.bold) td.style.fontWeight = 'bold'; else td.style.fontWeight = '';
            if (ce.italic) td.style.fontStyle = 'italic';
            if (ce.under) td.style.textDecoration = (td.style.textDecoration || '') + ' underline';
            if (ce.fill) td.style.background = ce.fill;
            if (ce.color && mode !== 'link') td.style.color = ce.color;
            if (ce.align) td.style.textAlign = ce.align;
            if (ce.size) td.style.fontSize = ce.size + 'px';
            if (ce.font) td.style.fontFamily = ce.font;
            if (ce.border) td.style.border = '1px solid ' + (ce.border === true ? '#616161' : ce.border);
        } else if (mode === 'merge') {
            if (ce.bold) td.style.fontWeight = 'bold';
            if (ce.italic) td.style.fontStyle = 'italic';
        }
        td.textContent = txt;
    }
    function cellPackValue(ce) {
        if (!ce) return '';
        if (ce.value != null && String(ce.raw || '').charAt(0) === '=') return String(ce.value);
        if (ce.value != null && ce.value !== '' && ce.raw == null) return String(ce.value);
        return ce.raw != null ? String(ce.raw) : String(ce.value || '');
    }
    function pasteGridIntoWord(pack, mode) {
        var editor = ed();
        if (!editor || !pack || !pack.cells) return false;
        var rows = pack.cells;
        var start = tdFromCaret();
        if (start && start.closest('#editor')) {
            var table = start.closest('table');
            var tr0 = start.closest('tr');
            var r0 = Array.prototype.indexOf.call(table.rows, tr0);
            var c0 = Array.prototype.indexOf.call(tr0.cells, start);
            var r, c, dest;
            for (r = 0; r < rows.length; r++) {
                for (c = 0; c < rows[r].length; c++) {
                    dest = table.rows[r0 + r] && table.rows[r0 + r].cells[c0 + c];
                    if (!dest) continue;
                    var ce = JSON.parse(JSON.stringify(rows[r][c] || {}));
                    if (mode === 'link' && pack.meta && pack.meta.type === 'excel') {
                        var sh = pack.meta.sheet || 'Folha1';
                        if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(sh)) sh = "'" + String(sh).replace(/'/g, "''") + "'";
                        ce._link = '=' + sh + '!$' + colNameWord(pack.meta.c0 + c) + '$' + (pack.meta.r0 + r + 1);
                    }
                    applyTdFromCell(dest, ce, mode);
                }
            }
            if (typeof saveUndoState === 'function') saveUndoState();
            return true;
        }
        var html = buildWordTableHtml(pack, mode);
        editor.focus();
        runInsertHTML(html + '<p></p>');
        if (typeof saveUndoState === 'function') saveUndoState();
        return true;
    }
    function colNameWord(c) {
        var s = '';
        c = Number(c) + 1;
        while (c > 0) { c--; s = String.fromCharCode(65 + (c % 26)) + s; c = Math.floor(c / 26); }
        return s;
    }
    function buildWordTableHtml(pack, mode) {
        var rows = pack.cells || [];
        var html = '<table style="border-collapse:collapse;font-family:Calibri,sans-serif;font-size:11pt;">';
        rows.forEach(function (row, r) {
            html += '<tr>';
            row.forEach(function (ce, c) {
                var st = ['border:1px solid #c8c6c4', 'padding:2px 6px'];
                var txt = cellPackValue(ce);
                var extra = '';
                if (mode === 'link' && pack.meta && pack.meta.type === 'excel') {
                    var sh = pack.meta.sheet || 'Folha1';
                    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(sh)) sh = "'" + String(sh).replace(/'/g, "''") + "'";
                    var linkRef = '=' + sh + '!$' + colNameWord(pack.meta.c0 + c) + '$' + (pack.meta.r0 + r + 1);
                    extra = ' data-abene-xl-link="' + linkRef.replace(/"/g, '&quot;') + '"';
                    st.push('color:#0563c1'); st.push('text-decoration:underline');
                    txt = linkRef;
                } else if (mode === 'formulas') {
                    txt = ce.raw != null ? String(ce.raw) : txt;
                    extra = ce.raw ? ' data-raw="' + String(ce.raw).replace(/"/g, '&quot;') + '"' : '';
                } else if (mode !== 'text' && mode !== 'val' && mode !== 'merge') {
                    if (ce.bold) st.push('font-weight:bold');
                    if (ce.italic) st.push('font-style:italic');
                    if (ce.under) st.push('text-decoration:underline');
                    if (ce.fill) st.push('background:' + ce.fill);
                    if (ce.color) st.push('color:' + ce.color);
                    if (ce.align) st.push('text-align:' + ce.align);
                    if (ce.size) st.push('font-size:' + ce.size + 'px');
                    extra = ce.raw ? ' data-raw="' + String(ce.raw).replace(/"/g, '&quot;') + '"' : '';
                } else if (mode === 'merge') {
                    if (ce.bold) st.push('font-weight:bold');
                    if (ce.italic) st.push('font-style:italic');
                }
                html += '<td style="' + st.join(';') + '"' + extra + '>' + String(txt).replace(/[&<>]/g, function (ch) {
                    return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch];
                }) + '</td>';
            });
            html += '</tr>';
        });
        return html + '</table>';
    }
    window.abeneCaptureWordCopy = function () {
        var editor = ed();
        if (!editor) return false;
        var sel = window.getSelection();
        if (!sel || !sel.rangeCount) return false;
        var n = sel.anchorNode;
        if (n && n.nodeType !== 1) n = n.parentElement;
        var table = n && n.closest ? n.closest('#editor table') : null;
        if (!table) return false;
        var range = sel.getRangeAt(0);
        var cells = [];
        Array.prototype.forEach.call(table.rows, function (tr) {
            var row = [];
            Array.prototype.forEach.call(tr.cells, function (td) {
                var hit = false;
                try { hit = range.intersectsNode(td); } catch (e) { hit = table.contains(td); }
                if (hit) row.push(styleFromTd(td));
            });
            if (row.length) cells.push(row);
        });
        if (!cells.length) return false;
        var pack = { type: 'word-table', cells: cells, meta: { type: 'word-table' } };
        if (typeof window.abeneSetClipPack === 'function') window.abeneSetClipPack(pack);
        else window.abeneClipPack = pack;
        return true;
    };
    window.pasteContent = function (mode) {
        hideFly();
        mode = mode || 'source';
        if (document.body.classList.contains('abene-excel-mode') && typeof window.abeneExcelPaste === 'function') {
            var map = { source: 'all', merge: 'val', text: 'val', val: 'val', link: 'link', formulas: 'formulas' };
            window.abeneExcelPaste(map[mode] || 'all');
            return;
        }
        var pack = (typeof window.abeneGetClipPack === 'function' ? window.abeneGetClipPack() : window.abeneClipPack) || null;
        var editor = ed();
        if (pack && pack.cells && pack.cells.length && !(navigator.clipboard && navigator.clipboard.read)) {
            pasteGridIntoWord(pack, mode);
            return;
        }
        if (navigator.clipboard && navigator.clipboard.read) {
            navigator.clipboard.read().then(async function (items) {
                var htmlItem = items.find(function (e) { return e.types.includes('text/html'); });
                var textItem = items.find(function (e) { return e.types.includes('text/plain'); });
                var html = htmlItem ? await (await htmlItem.getType('text/html')).text() : '';
                var text = textItem ? await (await textItem.getType('text/plain')).text() : '';
                var parsed = typeof window.abeneParseHtmlToCells === 'function' ? window.abeneParseHtmlToCells(html) : null;
                if (parsed && parsed.cells && parsed.cells.length && (mode === 'link' || mode === 'formulas' || tdFromCaret() || /<table/i.test(html))) {
                    pasteGridIntoWord(parsed, mode);
                    return;
                }
                if (pack && pack.cells && pack.cells.length && (mode === 'link' || mode === 'formulas' || tdFromCaret())) {
                    pasteGridIntoWord(pack, mode);
                    return;
                }
                if (mode === 'text' || (!html && text)) {
                    runInsertText(text || '');
                } else if (mode === 'merge' && html) {
                    var tmp = document.createElement('div');
                    tmp.innerHTML = html;
                    tmp.querySelectorAll('*').forEach(function (node) {
                        node.removeAttribute('class');
                        node.removeAttribute('id');
                        var keep = '';
                        if (node.style.fontWeight === 'bold' || node.tagName === 'B' || node.tagName === 'STRONG') keep += 'font-weight:bold;';
                        if (node.style.fontStyle === 'italic' || node.tagName === 'I' || node.tagName === 'EM') keep += 'font-style:italic;';
                        node.removeAttribute('style');
                        if (keep) node.setAttribute('style', keep);
                    });
                    runInsertHTML(tmp.innerHTML);
                } else if (typeof insertClipboardHTML === 'function') {
                    insertClipboardHTML(html || text);
                } else {
                    runInsertHTML(html || text);
                }
                if (typeof saveUndoState === 'function') saveUndoState();
            }).catch(function () {
                if (pack && pack.cells && pack.cells.length) pasteGridIntoWord(pack, mode);
                else runExec('paste');
            });
            return;
        }
        if (pack && pack.cells && pack.cells.length) { pasteGridIntoWord(pack, mode); return; }
        runExec('paste');
    };
    window.abenePasteWordGrid = function (mode) {
        var pack = (typeof window.abeneGetClipPack === 'function' ? window.abeneGetClipPack() : window.abeneClipPack) || null;
        if (pack && pack.cells && pack.cells.length) return pasteGridIntoWord(pack, mode || 'source');
        return false;
    };

    (function bindWordClip() {
        function onCopy(ev) {
            if (!window.abeneCaptureWordCopy()) return;
            var pack = window.abeneGetClipPack && window.abeneGetClipPack();
            if (!pack || !pack.cells || !ev.clipboardData) return;
            ev.preventDefault();
            var html = window.abeneCellsToHtml ? window.abeneCellsToHtml(pack.cells, pack.meta) : '';
            var text = pack.cells.map(function (row) {
                return row.map(function (ce) { return (ce && (ce.raw || ce.value)) || ''; }).join('\t');
            }).join('\n');
            try {
                ev.clipboardData.setData('text/html', html);
                ev.clipboardData.setData('text/plain', text);
            } catch (e) {}
        }
        function attach() {
            var editor = ed();
            if (!editor || editor._abeneClipBound) return;
            editor._abeneClipBound = true;
            editor.addEventListener('copy', onCopy);
            editor.addEventListener('cut', function (ev) {
                onCopy(ev);
            });
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach);
        else attach();
    })();

    window.formatPainter = function (lock) {
        var sel = window.getSelection();
        if (sel.rangeCount && sel.anchorNode) {
            var el = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
            var cs = window.getComputedStyle(el);
            var block = getBlock();
            window.savedFormat = {
                fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
                fontStyle: cs.fontStyle, color: cs.color, backgroundColor: cs.backgroundColor,
                textDecoration: cs.textDecoration,
                textAlign: block ? block.style.textAlign || cs.textAlign : '',
                lineHeight: block ? block.style.lineHeight : '',
                marginLeft: block ? block.style.marginLeft : '',
                textIndent: block ? block.style.textIndent : ''
            };
            window.isFormatPainterActive = true;
            formatPainterLocked = !!lock;
            document.body.style.cursor = 'copy';
            var btn = document.getElementById('btnFormatPainter');
            if (btn) btn.classList.add('active');
        }
    };

    window.changeFontSize = function (val) {
        var n = Number(val);
        if (!n || n < 1) return;
        var inp = document.getElementById('fontSize');
        if (inp) inp.value = String(n);
        wrapInline(function (span) { span.style.fontSize = n + 'pt'; });
    };
    window.stepFontSize = function (delta) {
        var inp = document.getElementById('fontSize');
        var current = Number(inp && inp.value) || 11;
        var idx = WORD_SIZES.indexOf(current);
        if (idx < 0) {
            idx = WORD_SIZES.findIndex(function (s) { return s >= current; });
            if (idx < 0) idx = WORD_SIZES.length - 1;
        }
        idx = Math.max(0, Math.min(WORD_SIZES.length - 1, idx + (delta > 0 ? 1 : -1)));
        window.changeFontSize(WORD_SIZES[idx]);
    };

    window.changeLineSpacing = function (val) {
        if (val === 'options') { window.openParagraphDialog(); return; }
        applyToBlocks(function (block) {
            if (val === 'exactly') return;
            block.style.lineHeight = String(val || '1.08');
        });
    };

    window.clearFormatting = function () {
        var editor = ed();
        editor.focus();
        runExec('removeFormat');
        runExec('unlink');
        var block = getBlock();
        if (block && block !== editor) {
            block.removeAttribute('style');
            var keep = (block.className || '').split(/\s+/).filter(function (c) {
                return c && !/^abene-/.test(c) && c !== 'selected';
            });
            block.className = keep.join(' ').trim();
            if (/^H[1-6]$/.test(block.tagName) || block.tagName === 'BLOCKQUOTE' || block.tagName === 'PRE') {
                runExec('formatBlock', 'p');
            }
        }
        if (typeof saveUndoState === 'function') saveUndoState();
    };

    var STYLE_DEFS = {
        normal: { tag: 'p', cls: 'abene-normal' },
        nospacing: { tag: 'p', cls: 'abene-nospacing' },
        title: { tag: 'p', cls: 'abene-title' },
        subtitle: { tag: 'p', cls: 'abene-subtitle' },
        h1: { tag: 'h1' }, h2: { tag: 'h2' }, h3: { tag: 'h3' }, h4: { tag: 'h4' },
        h5: { tag: 'h5' }, h6: { tag: 'h6' },
        h7: { tag: 'p', cls: 'abene-h7' }, h8: { tag: 'p', cls: 'abene-h8' }, h9: { tag: 'p', cls: 'abene-h9' },
        quote: { tag: 'blockquote', cls: 'abene-quote' },
        intensequote: { tag: 'blockquote', cls: 'abene-intense-quote' },
        listpara: { tag: 'p', cls: 'abene-list-para' },
        emphasis: { inline: 'abene-emphasis' },
        strong: { inline: 'abene-strong' },
        booktitle: { inline: 'abene-book-title' },
        pre: { tag: 'pre' },
        p: { tag: 'p', cls: 'abene-normal' },
        blockquote: { tag: 'blockquote', cls: 'abene-quote' }
    };
    window.applyStyle = function (key) {
        var def = STYLE_DEFS[key] || STYLE_DEFS.normal;
        if (def.inline) {
            wrapInline(function (span) { span.className = def.cls || def.inline; });
            return;
        }
        var block = getBlock();
        var editor = ed();
        editor.focus();
        if (def.tag && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'pre'].indexOf(def.tag) >= 0) {
            runExec('formatBlock', def.tag);
        }
        block = getBlock();
        if (block && def.cls) {
            block.className = (block.className || '').replace(/abene-\S+/g, '').trim() + ' ' + def.cls;
        }
        if (typeof updateNavigation === 'function') updateNavigation();
        if (typeof saveUndoState === 'function') saveUndoState();
        var sel = document.getElementById('styleSelect');
        if (sel) sel.value = key;
    };

    window.manageStyles = function () {
        if (typeof openGenericModal !== 'function') return;
        openGenericModal(tt('stylesPaneTitle'),
            '<p style="font-size:12px;margin-bottom:8px;">' + tt('stylesPaneHint') + '</p>' +
            '<label>' + tt('stylesTitleColor') + ' <input type="color" id="styleTitleColor" value="' + (localStorage.getItem('abeneTitleColor') || '#2b579a') + '"></label>',
            '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + tt('cancel') + '</button>' +
            '<button class="btn-primary" onclick="applyManagedStyles()">' + tt('ok') + '</button>'
        );
    };
    window.applyManagedStyles = function () {
        var c = document.getElementById('styleTitleColor');
        if (c) {
            localStorage.setItem('abeneTitleColor', c.value);
            ed().querySelectorAll('h1, h2, h3, h4, h5, h6, .abene-title').forEach(function (h) { h.style.color = c.value; });
        }
        closeModal('genericModal');
        if (typeof saveUndoState === 'function') saveUndoState();
    };

    window.showCaseMenu = function (ev) {
        showFly(ev,
            '<button onclick="changeCase(\'sentence\')">' + tt('caseSentence') + '</button>' +
            '<button onclick="changeCase(\'lower\')">' + tt('caseLower') + '</button>' +
            '<button onclick="changeCase(\'upper\')">' + tt('caseUpper') + '</button>' +
            '<button onclick="changeCase(\'caps\')">' + tt('caseCaps') + '</button>' +
            '<button onclick="changeCase(\'toggle\')">' + tt('caseToggle') + '</button>'
        );
    };
    window.changeCase = function (mode) {
        hideFly();
        var sel = window.getSelection();
        if (!sel.rangeCount) return;
        var text = sel.toString();
        if (!text) return;
        var out = text;
        if (mode === 'lower') out = text.toLocaleLowerCase();
        else if (mode === 'upper') out = text.toLocaleUpperCase();
        else if (mode === 'caps') out = text.replace(/\S+/g, function (w) { return w.charAt(0).toLocaleUpperCase() + w.slice(1).toLocaleLowerCase(); });
        else if (mode === 'toggle') out = text.replace(/[A-Za-zÀ-ÿ]/g, function (ch) {
            return ch === ch.toLocaleUpperCase() ? ch.toLocaleLowerCase() : ch.toLocaleUpperCase();
        });
        else {
            out = text.toLocaleLowerCase();
            out = out.replace(/(^\s*[a-zà-ÿ])|([.!?]\s+[a-zà-ÿ])/g, function (m) { return m.toLocaleUpperCase(); });
        }
        runInsertText(out);
        if (typeof saveUndoState === 'function') saveUndoState();
    };

    window.showUnderlineMenu = function (ev) {
        showFly(ev,
            '<button onclick="applyUnderline(\'solid\')">' + tt('dlgSolid') + '</button>' +
            '<button onclick="applyUnderline(\'double\')">' + tt('dlgDouble') + '</button>' +
            '<button onclick="applyUnderline(\'dotted\')">' + tt('dlgDotted') + '</button>' +
            '<button onclick="applyUnderline(\'dashed\')">' + tt('dlgDashed') + '</button>' +
            '<button onclick="applyUnderline(\'wavy\')">' + tt('dlgWavy') + '</button>' +
            '<button onclick="applyUnderline(\'none\')">' + tt('borderNone') + '</button>'
        );
    };
    window.applyUnderline = function (style) {
        hideFly();
        if (style === 'none') {
            wrapInline(function (span) { span.style.textDecoration = 'none'; });
            return;
        }
        wrapInline(function (span) {
            span.style.textDecorationLine = 'underline';
            span.style.textDecorationStyle = style;
        });
    };
    window.applyTextEffect = function (ev) {
        if (ev && ev.currentTarget) {
            showFly(ev,
                '<button onclick="applyTextFx(\'shadow\')">' + tt('fxShadow') + '</button>' +
                '<button onclick="applyTextFx(\'glow\')">' + tt('fxGlow') + '</button>' +
                '<button onclick="applyTextFx(\'outline\')">' + tt('fxOutline') + '</button>' +
                '<button onclick="applyTextFx(\'fill\')">' + tt('fxFill') + '</button>' +
                '<button onclick="applyTextFx(\'none\')">' + tt('fxNone') + '</button>'
            );
            return;
        }
        window.applyTextFx('shadow');
    };
    window.applyTextFx = function (kind) {
        hideFly();
        wrapInline(function (span) {
            span.classList.remove('abene-fx-shadow', 'abene-fx-glow', 'abene-fx-outline', 'abene-fx-fill');
            span.style.textShadow = '';
            span.style.webkitTextStroke = '';
            span.style.backgroundImage = '';
            span.style.webkitBackgroundClip = '';
            span.style.color = '';
            if (kind === 'none') return;
            span.classList.add('abene-fx-' + kind);
        });
    };

    window.toggleShowMarks = function () {
        var editor = ed();
        editor.classList.toggle('show-marks');
        var btn = document.getElementById('btnShowMarks');
        if (btn) btn.classList.toggle('active', editor.classList.contains('show-marks'));
    };

    window.applyParagraphShading = function (color) {
        applyToBlocks(function (b) { b.style.backgroundColor = color; });
    };

    window.showBorderMenu = function (ev) {
        showFly(ev,
            '<button onclick="setParaBorder(\'bottom\')">' + tt('borderBottom') + '</button>' +
            '<button onclick="setParaBorder(\'top\')">' + tt('borderTop') + '</button>' +
            '<button onclick="setParaBorder(\'left\')">' + tt('borderLeft') + '</button>' +
            '<button onclick="setParaBorder(\'right\')">' + tt('borderRight') + '</button>' +
            '<button onclick="setParaBorder(\'outside\')">' + tt('borderOutside') + '</button>' +
            '<button onclick="setParaBorder(\'all\')">' + tt('borderAll') + '</button>' +
            '<button onclick="setParaBorder(\'none\')">' + tt('borderNone') + '</button>'
        );
    };
    window.setParaBorder = function (kind) {
        hideFly();
        applyToBlocks(function (b) {
            b.style.border = '';
            b.style.borderBottom = b.style.borderTop = b.style.borderLeft = b.style.borderRight = '';
            var line = '1px solid #333';
            if (kind === 'none') return;
            if (kind === 'all' || kind === 'outside') b.style.border = line;
            else if (kind === 'bottom') b.style.borderBottom = line;
            else if (kind === 'top') b.style.borderTop = line;
            else if (kind === 'left') b.style.borderLeft = line;
            else if (kind === 'right') b.style.borderRight = line;
        });
    };
    window.addBorders = function () { window.setParaBorder('outside'); };

    window.showBulletMenu = function (ev) {
        showFly(ev,
            '<button onclick="applyList(\'ul\',\'disc\')">' + tt('bulletDisc') + '</button>' +
            '<button onclick="applyList(\'ul\',\'circle\')">' + tt('bulletCircle') + '</button>' +
            '<button onclick="applyList(\'ul\',\'square\')">' + tt('bulletSquare') + '</button>' +
            '<button onclick="applyList(\'ul\',\'\' ,\'✓ \')">' + tt('bulletCheck') + '</button>' +
            '<button onclick="applyList(\'ul\',\'\' ,\'➤ \')">' + tt('bulletArrow') + '</button>'
        );
    };
    window.showNumberMenu = function (ev) {
        showFly(ev,
            '<button onclick="applyList(\'ol\',\'decimal\')">' + tt('numDecimal') + '</button>' +
            '<button onclick="applyList(\'ol\',\'lower-alpha\')">' + tt('numAlpha') + '</button>' +
            '<button onclick="applyList(\'ol\',\'upper-alpha\')">' + tt('numAlphaU') + '</button>' +
            '<button onclick="applyList(\'ol\',\'lower-roman\')">' + tt('numRoman') + '</button>' +
            '<button onclick="applyList(\'ol\',\'upper-roman\')">' + tt('numRomanU') + '</button>' +
            '<button onclick="restartNumbering()">' + tt('numRestart') + '</button>'
        );
    };
    window.applyList = function (tag, style, prefix) {
        hideFly();
        ed().focus();
        runExec(tag === 'ol' ? 'insertOrderedList' : 'insertUnorderedList');
        var block = getBlock();
        var list = block && block.closest('ul, ol');
        if (!list) return;
        if (style) list.style.listStyleType = style;
        if (prefix) {
            list.style.listStyle = 'none';
            Array.from(list.children).forEach(function (li) {
                if (!li.textContent.startsWith(prefix.trim())) li.insertAdjacentText('afterbegin', prefix);
            });
        }
        if (typeof saveUndoState === 'function') saveUndoState();
    };
    window.restartNumbering = function () {
        hideFly();
        var block = getBlock();
        var list = block && block.closest('ol');
        if (list) list.start = 1;
    };
    window.insertMultilevelList = function () {
        ed().focus();
        runExec('insertOrderedList');
        var block = getBlock();
        var list = block && block.closest('ol');
        if (list) list.classList.add('abene-ml');
        if (typeof saveUndoState === 'function') saveUndoState();
    };

    window.showSelectMenu = function (ev) {
        showFly(ev,
            '<button onclick="selectAll();hideRibbonFlyout()">' + tt('selAll') + '</button>' +
            '<button onclick="selectSimilarFormatting()">' + tt('selSimilar') + '</button>' +
            '<button onclick="selectObjects()">' + tt('selObjects') + '</button>'
        );
    };
    window.hideRibbonFlyout = hideFly;
    window.selectSimilarFormatting = function () {
        hideFly();
        var block = getBlock();
        if (!block) return;
        var sel = window.getSelection();
        var sample = sel.toString() ? (sel.anchorNode.parentElement || block) : block;
        var cs = window.getComputedStyle(sample);
        var range = document.createRange();
        range.selectNodeContents(ed());
        sel.removeAllRanges();
        var walker = document.createTreeWalker(ed(), NodeFilter.SHOW_TEXT);
        var first = null, last = null;
        while (walker.nextNode()) {
            var p = walker.currentNode.parentElement;
            if (!p) continue;
            var s = window.getComputedStyle(p);
            if (s.fontWeight === cs.fontWeight && s.fontStyle === cs.fontStyle && s.fontSize === cs.fontSize) {
                if (!first) first = walker.currentNode;
                last = walker.currentNode;
            }
        }
        if (first && last) {
            range = document.createRange();
            range.setStart(first, 0);
            range.setEnd(last, last.length);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    };
    window.selectObjects = function () {
        hideFly();
        var img = ed().querySelector('img');
        if (img && typeof selectImage === 'function') selectImage(img);
        else if (img) img.classList.add('selected');
    };

    window.openFindReplace = function (mode) {
        var panel = document.getElementById('findReplacePanel');
        panel.classList.add('visible');
        var goto = document.getElementById('gotoGroup');
        if (goto) goto.style.display = mode === 'goto' ? 'block' : 'none';
        var focusId = mode === 'replace' ? 'replaceInput' : mode === 'goto' ? 'gotoPageInput' : 'findInput';
        var el = document.getElementById(focusId);
        if (el) el.focus();
    };
    window.gotoPage = function () {
        var n = Number(document.getElementById('gotoPageInput').value) || 1;
        var area = document.getElementById('editorArea');
        var h = pageH();
        if (area) area.scrollTop = Math.max(0, (n - 1) * h);
    };

    window.switchFontTab = function (tab) {
        document.getElementById('fontPanePolice').style.display = tab === 'police' ? 'block' : 'none';
        document.getElementById('fontPaneAvance').style.display = tab === 'avance' ? 'block' : 'none';
        document.getElementById('fontTabPolice').classList.toggle('on', tab === 'police');
        document.getElementById('fontTabAvance').classList.toggle('on', tab === 'avance');
    };
    window.openFontDialog = function () {
        document.getElementById('fontDialog').classList.add('visible');
        var block = getBlock();
        if (!block) return;
        var cs = window.getComputedStyle(block);
        var name = document.getElementById('dlgFontName');
        var size = document.getElementById('dlgFontSize');
        if (name) {
            var opt = Array.from(name.options).find(function (o) { return cs.fontFamily.indexOf(o.value) >= 0; });
            if (opt) name.value = opt.value;
        }
        if (size) size.value = Math.round(parseFloat(cs.fontSize) * 72 / 96);
    };
    window.applyFontDialog = function () {
        var name = document.getElementById('dlgFontName').value;
        var size = document.getElementById('dlgFontSize').value;
        var style = document.getElementById('dlgFontStyle').value;
        var color = document.getElementById('dlgFontColor').value;
        var und = document.getElementById('dlgUnderline').value;
        wrapInline(function (span) {
            span.style.fontFamily = name;
            span.style.fontSize = size + 'pt';
            span.style.color = color;
            span.style.fontWeight = style.indexOf('bold') >= 0 ? '700' : '400';
            span.style.fontStyle = style.indexOf('italic') >= 0 ? 'italic' : 'normal';
            if (und) { span.style.textDecorationLine = 'underline'; span.style.textDecorationStyle = und; }
            if (document.getElementById('dlgStrike').checked) span.style.textDecorationLine = (span.style.textDecorationLine + ' line-through').trim();
            if (document.getElementById('dlgDStrike').checked) span.classList.add('abene-double-strike');
            if (document.getElementById('dlgSuper').checked) span.style.verticalAlign = 'super';
            if (document.getElementById('dlgSub').checked) span.style.verticalAlign = 'sub';
            if (document.getElementById('dlgSmallCaps').checked) span.style.fontVariant = 'small-caps';
            if (document.getElementById('dlgAllCaps').checked) span.style.textTransform = 'uppercase';
            if (document.getElementById('dlgHidden').checked) span.classList.add('abene-hidden');
            var scale = Number(document.getElementById('dlgScale').value) || 100;
            if (scale !== 100) span.style.transform = 'scaleX(' + (scale / 100) + ')';
            var kind = document.getElementById('dlgSpacingKind').value;
            var spt = Number(document.getElementById('dlgSpacingPt').value) || 0;
            if (kind === 'expanded') span.style.letterSpacing = spt + 'pt';
            if (kind === 'condensed') span.style.letterSpacing = (-spt) + 'pt';
            var pos = document.getElementById('dlgPosition').value;
            if (pos === 'raised') span.style.position = 'relative', span.style.bottom = '3pt';
            if (pos === 'lowered') span.style.position = 'relative', span.style.top = '3pt';
        });
        closeModal('fontDialog');
    };

    window.switchParaTab = function (tab) {
        document.getElementById('paraPaneIndent').style.display = tab === 'indent' ? 'block' : 'none';
        document.getElementById('paraPaneBreaks').style.display = tab === 'breaks' ? 'block' : 'none';
        document.getElementById('paraTabIndent').classList.toggle('on', tab === 'indent');
        document.getElementById('paraTabBreaks').classList.toggle('on', tab === 'breaks');
    };
    window.openParagraphDialog = function () {
        document.getElementById('paragraphDialog').classList.add('visible');
        var b = getBlock();
        if (!b) return;
        document.getElementById('dlgAlign').value = (b.style.textAlign || 'left').replace('start', 'left');
        document.getElementById('dlgIndLeft').value = cm(parseFloat(b.style.marginLeft) || 0).toFixed(2);
        document.getElementById('dlgIndRight').value = cm(parseFloat(b.style.marginRight) || 0).toFixed(2);
        document.getElementById('dlgSpBefore').value = parseFloat(b.style.marginTop) || 0;
        document.getElementById('dlgSpAfter').value = b.style.marginBottom ? parseFloat(b.style.marginBottom) : 8;
        document.getElementById('dlgWidow').checked = getComputedStyle(b).widows !== '1';
        document.getElementById('dlgKeepNext').checked = b.classList.contains('abene-keep-next');
        document.getElementById('dlgKeepLines').checked = b.classList.contains('abene-keep-together');
        document.getElementById('dlgPageBefore').checked = b.classList.contains('abene-break-before');
        document.getElementById('dlgNoHyphen').checked = b.classList.contains('abene-no-hyphen');
        var ti = parseFloat(b.style.textIndent) || 0;
        if (ti > 0) { document.getElementById('dlgIndSpecial').value = 'first'; document.getElementById('dlgIndBy').value = cm(ti).toFixed(2); }
        else if (ti < 0) { document.getElementById('dlgIndSpecial').value = 'hanging'; document.getElementById('dlgIndBy').value = cm(-ti).toFixed(2); }
        else document.getElementById('dlgIndSpecial').value = 'none';
    };
    window.applyParagraphDialog = function () {
        applyToBlocks(function (b) {
            b.style.textAlign = document.getElementById('dlgAlign').value;
            var left = px(document.getElementById('dlgIndLeft').value);
            var right = px(document.getElementById('dlgIndRight').value);
            var by = px(document.getElementById('dlgIndBy').value);
            var spec = document.getElementById('dlgIndSpecial').value;
            b.style.marginLeft = left + 'px';
            b.style.marginRight = right + 'px';
            if (spec === 'first') { b.style.textIndent = by + 'px'; }
            else if (spec === 'hanging') { b.style.marginLeft = (left + by) + 'px'; b.style.textIndent = (-by) + 'px'; }
            else b.style.textIndent = '0';
            b.style.marginTop = document.getElementById('dlgSpBefore').value + 'pt';
            b.style.marginBottom = document.getElementById('dlgSpAfter').value + 'pt';
            var rule = document.getElementById('dlgLineRule').value;
            var at = document.getElementById('dlgLineAt').value;
            if (rule === 'exactly' || rule === 'atleast') b.style.lineHeight = at + 'pt';
            else if (rule === 'multiple') b.style.lineHeight = String(at || '1.08');
            else b.style.lineHeight = rule;
            b.classList.toggle('abene-same-style-tight', document.getElementById('dlgNoSpaceSame').checked);
            b.classList.toggle('abene-keep-next', document.getElementById('dlgKeepNext').checked);
            b.classList.toggle('abene-keep-together', document.getElementById('dlgKeepLines').checked);
            b.classList.toggle('abene-break-before', document.getElementById('dlgPageBefore').checked);
            b.classList.toggle('abene-no-hyphen', document.getElementById('dlgNoHyphen').checked);
            b.style.widows = document.getElementById('dlgWidow').checked ? '2' : '1';
            b.style.orphans = document.getElementById('dlgWidow').checked ? '2' : '1';
            lastIndent.left = parseFloat(b.style.marginLeft) || 0;
            lastIndent.right = parseFloat(b.style.marginRight) || 0;
            lastIndent.first = parseFloat(b.style.textIndent) || 0;
        });
        closeModal('paragraphDialog');
        window.updateRulerFromSelection();
    };

    var PAGE_SIZES = (window.PageGeometry && window.PageGeometry.SIZES) || {
        a4: { w: 794, h: 1123 },
        a5: { w: 559, h: 794 },
        letter: { w: 816, h: 1056 },
        legal: { w: 816, h: 1344 },
        executive: { w: 696, h: 1008 },
        a3: { w: 1123, h: 1587 }
    };
    window.abenePageSizes = PAGE_SIZES;

    function near(a, b, tol) { return Math.abs((Number(a) || 0) - (Number(b) || 0)) <= (tol || 4); }
    function marginPresetId(m) {
        m = m || {};
        if (near(m.top, px(1.27)) && near(m.bottom, px(1.27)) && near(m.left, px(1.27)) && near(m.right, px(1.27))) return 'narrow';
        if (near(m.top, px(2.54)) && near(m.bottom, px(2.54)) && near(m.left, px(1.91)) && near(m.right, px(1.91))) return 'moderate';
        if (near(m.top, px(2.54)) && near(m.bottom, px(2.54)) && near(m.left, px(5.08)) && near(m.right, px(5.08))) return 'wide';
        if (near(m.top, px(2.5)) && near(m.bottom, px(2.5)) && near(m.left, px(3)) && near(m.right, px(3))) return 'word2013';
        if (near(m.top, 96) && near(m.bottom, 96) && near(m.left, 96) && near(m.right, 96)) return 'normal';
        return 'custom';
    }
    function sizeIdFromPage(ps) {
        ps = ps || {};
        var id;
        for (id in PAGE_SIZES) {
            if (PAGE_SIZES[id].w === ps.w && PAGE_SIZES[id].h === ps.h) return id;
        }
        return 'a4';
    }

    window.applyMarginPreset = function (name) {
        var m;
        if (name === 'custom') { window.openPageSetupDialog('margins'); return; }
        if (name === 'narrow') m = { top: px(1.27), bottom: px(1.27), left: px(1.27), right: px(1.27) };
        else if (name === 'moderate') m = { top: px(2.54), bottom: px(2.54), left: px(1.91), right: px(1.91) };
        else if (name === 'word2013') m = { top: px(2.5), bottom: px(2.5), left: px(3), right: px(3) };
        else if (name === 'wide') m = { top: px(2.54), bottom: px(2.54), left: px(5.08), right: px(5.08) };
        else m = { top: 96, bottom: 96, left: 96, right: 96 };
        window.setPageMargins(m);
    };
    function psUnit() {
        var el = document.getElementById('psMarginUnit');
        return (el && el.value) || localStorage.getItem('abeneMarginUnit') || 'cm';
    }
    function psToPx(val) {
        var n = Number(val) || 0;
        var u = psUnit();
        if (u === 'mm') return n * 96 / 25.4;
        if (u === 'in') return n * 96;
        return n * 96 / 2.54;
    }
    function pxToPs(pxVal) {
        var n = Number(pxVal) || 0;
        var u = psUnit();
        if (u === 'mm') return n * 25.4 / 96;
        if (u === 'in') return n / 96;
        return n * 2.54 / 96;
    }
    window.abeneConvertPageSetupUnits = function () {
        var prev = window._abenePsUnit || 'cm';
        var next = psUnit();
        if (prev === next) return;
        var ids = ['mTop', 'mBottom', 'mLeft', 'mRight', 'mGutter'];
        ids.forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            var n = Number(el.value) || 0;
            var pxVal = prev === 'mm' ? n * 96 / 25.4 : prev === 'in' ? n * 96 : n * 96 / 2.54;
            el.value = (next === 'mm' ? pxVal * 25.4 / 96 : next === 'in' ? pxVal / 96 : pxVal * 2.54 / 96).toFixed(2);
        });
        window._abenePsUnit = next;
        try { localStorage.setItem('abeneMarginUnit', next); } catch (e) {}
    };
    window.showPageSetupTab = function (tab) {
        if (tab !== 'paper' && tab !== 'bg') tab = 'margins';
        var margins = document.getElementById('psTabMargins');
        var paper = document.getElementById('psTabPaper');
        var bg = document.getElementById('psTabBg');
        if (margins) margins.style.display = tab === 'margins' ? 'block' : 'none';
        if (paper) paper.style.display = tab === 'paper' ? 'block' : 'none';
        if (bg) bg.style.display = tab === 'bg' ? 'block' : 'none';
        document.querySelectorAll('#pageSetupTabs button').forEach(function (b) {
            b.classList.toggle('on', b.getAttribute('data-ps-tab') === tab);
        });
    };
    window.openPageSetupDialog = function (tab) {
        window.openMarginsDialog();
        window.showPageSetupTab(tab === 'paper' || tab === 'bg' ? tab : 'margins');
    };
    window.openMarginsDialog = function () {
        var m = A().pageMargins || { top: 96, bottom: 96, left: 96, right: 96 };
        var g = Number(A().pageGutter) || 0;
        var unitEl = document.getElementById('psMarginUnit');
        if (unitEl) unitEl.value = localStorage.getItem('abeneMarginUnit') || 'cm';
        window._abenePsUnit = psUnit();
        document.getElementById('mTop').value = pxToPs(m.top).toFixed(2);
        document.getElementById('mBottom').value = pxToPs(m.bottom).toFixed(2);
        document.getElementById('mLeft').value = pxToPs(m.left).toFixed(2);
        document.getElementById('mRight').value = pxToPs(m.right).toFixed(2);
        var gut = document.getElementById('mGutter');
        if (gut) gut.value = pxToPs(g).toFixed(2);
        var ps = document.getElementById('psPaperSize');
        if (ps) ps.value = A().pageSizeId || sizeIdFromPage(A().pageSize) || 'a4';
        var or = document.getElementById('psOrientation');
        if (or) or.value = A().pageOrientation || 'portrait';
        var col = document.getElementById('psColumns');
        if (col) col.value = String(A().pageColumns || '1');
        var rule = document.getElementById('psColRule');
        if (rule) rule.checked = !!A().pageColRule;
        var bg = document.getElementById('psPageBg');
        if (bg) {
            var edEl = ed();
            bg.value = (edEl && edEl.style.backgroundColor) ? rgbToHex(edEl.style.backgroundColor) : (localStorage.getItem('abenePageBg') || '#ffffff');
        }
        document.getElementById('marginsDialog').classList.add('visible');
        window.showPageSetupTab('margins');
    };
    function rgbToHex(c) {
        if (!c) return '#ffffff';
        if (c.charAt(0) === '#') return c.length === 4 ? ('#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]) : c;
        var m = String(c).match(/\d+/g);
        if (!m || m.length < 3) return '#ffffff';
        return '#' + [0, 1, 2].map(function (i) {
            var h = Number(m[i]).toString(16);
            return h.length === 1 ? '0' + h : h;
        }).join('');
    }
    window.applyCustomMargins = function () {
        window.applyPageSetup();
    };
    window.applyPageSetup = function () {
        try { localStorage.setItem('abeneMarginUnit', psUnit()); } catch (e) {}
        var gutEl = document.getElementById('mGutter');
        A().pageGutter = gutEl ? psToPx(gutEl.value) : 0;
        try { localStorage.setItem('abeneGutter', String(A().pageGutter || 0)); } catch (e) {}
        window.setPageMargins({
            top: psToPx(document.getElementById('mTop').value),
            bottom: psToPx(document.getElementById('mBottom').value),
            left: psToPx(document.getElementById('mLeft').value),
            right: psToPx(document.getElementById('mRight').value)
        });
        var ps = document.getElementById('psPaperSize');
        if (ps && ps.value) window.abeneChangePaperSize(ps.value);
        var or = document.getElementById('psOrientation');
        if (or && or.value && typeof window.setOrientation === 'function') window.setOrientation(or.value);
        var col = document.getElementById('psColumns');
        if (col) window.applyPageColumns(col.value);
        var rule = document.getElementById('psColRule');
        A().pageColRule = !!(rule && rule.checked);
        try { localStorage.setItem('abeneColRule', A().pageColRule ? '1' : '0'); } catch (e) {}
        window.applyPageColumns(A().pageColumns || '1');
        var bg = document.getElementById('psPageBg');
        if (bg && bg.value) {
            try { localStorage.setItem('abenePageBg', bg.value); } catch (e) {}
            if (typeof window.changePageBg === 'function') window.changePageBg(bg.value);
            else {
                var editor = ed();
                if (editor) editor.style.backgroundColor = bg.value;
            }
            var ribbonBg = document.getElementById('pageBgColor');
            if (ribbonBg) ribbonBg.value = bg.value;
        }
        closeModal('marginsDialog');
    };
    window.setPageMargins = function (m) {
        A().pageMargins = m;
        var editor = ed();
        var left = (m.left || 0) + (Number(A().pageGutter) || 0);
        editor.style.padding = m.top + 'px ' + m.right + 'px ' + m.bottom + 'px ' + left + 'px';
        editor.style.setProperty('--pad-top', m.top + 'px');
        editor.style.setProperty('--pad-right', m.right + 'px');
        editor.style.setProperty('--pad-bottom', m.bottom + 'px');
        editor.style.setProperty('--pad-left', left + 'px');
        editor.style.setProperty('--write-h', Math.max(80, pageH() - m.top - m.bottom) + 'px');
        try { localStorage.setItem('abeneMargins', JSON.stringify(m)); } catch (e) {}
        if (typeof applyPageGeometry === 'function') applyPageGeometry();
        if (typeof updateRulerHandles === 'function') updateRulerHandles();
        if (typeof renderPageDecorations === 'function') renderPageDecorations();
        if (typeof refreshPagination === 'function') refreshPagination();
        if (window.abeneSyncLayoutUi) window.abeneSyncLayoutUi();
    };
    window.changeMargins = function (val) {
        var n = Number(val);
        if (n) window.setPageMargins({ top: n, bottom: n, left: n, right: n });
    };
    window.abeneChangePaperSize = function (val) {
        var size = PAGE_SIZES[val] || PAGE_SIZES.a4;
        A().pageSize = { w: size.w, h: size.h };
        A().pageSizeId = PAGE_SIZES[val] ? val : 'a4';
        try {
            localStorage.setItem('abenePageSize', JSON.stringify(A().pageSize));
            localStorage.setItem('abenePageSizeId', A().pageSizeId);
        } catch (e) {}
        if (typeof applyPageGeometry === 'function') applyPageGeometry();
        if (typeof refreshPagination === 'function') refreshPagination();
        if (window.abeneSyncLayoutUi) window.abeneSyncLayoutUi();
    };
    window.applyPageColumns = function (val) {
        var editor = ed();
        if (!editor) return;
        var n = String(val || '1');
        if (n !== '2' && n !== '3') n = '1';
        editor.classList.remove('abene-cols-1', 'abene-cols-2', 'abene-cols-3', 'abene-cols-rule');
        editor.style.columnCount = '';
        editor.style.columnGap = '';
        editor.style.columnRule = '';
        if (n !== '1') editor.classList.add('abene-cols-' + n);
        if (n !== '1' && A().pageColRule) editor.classList.add('abene-cols-rule');
        A().pageColumns = n;
        try { localStorage.setItem('abeneColumns', n); } catch (e) {}
        if (typeof refreshPagination === 'function') refreshPagination();
        if (window.abeneSyncLayoutUi) window.abeneSyncLayoutUi();
    };
    window.abeneSyncLayoutUi = function () {
        var m = A().pageMargins || { top: 96, bottom: 96, left: 96, right: 96 };
        var ms = document.getElementById('marginSelect');
        if (ms) {
            var preset = marginPresetId(m);
            if (ms.querySelector('option[value="' + preset + '"]')) ms.value = preset;
        }
        var id = A().pageSizeId || sizeIdFromPage(A().pageSize);
        var paper = document.getElementById('paperSize');
        if (paper) {
            if (!paper.querySelector('option[value="' + id + '"]')) id = 'a4';
            paper.value = id;
        }
        var cols = document.getElementById('columnsSelect');
        if (cols) cols.value = String(A().pageColumns || '1');
        var btnP = document.getElementById('btnPortrait');
        var btnL = document.getElementById('btnLandscape');
        var ori = A().pageOrientation || 'portrait';
        if (btnP) btnP.classList.toggle('on', ori === 'portrait');
        if (btnL) btnL.classList.toggle('on', ori === 'landscape');
    };

    window.applyDocParagraphSpacing = function (preset) {
        var editor = ed();
        editor.classList.remove('abene-doc-compact', 'abene-doc-open');
        if (preset === 'compact') editor.classList.add('abene-doc-compact');
        if (preset === 'open') editor.classList.add('abene-doc-open');
        if (typeof showToast === 'function') showToast(tt('toastSpace', { s: preset }));
    };
    window.setThemeFonts = function (theme) {
        var map = { calibri: ['Calibri Light', 'Calibri'], cambria: ['Cambria', 'Cambria'], georgia: ['Georgia', 'Georgia'] };
        var pair = map[theme] || map.calibri;
        ed().style.fontFamily = pair[1];
        ed().querySelectorAll('h1, h2, .abene-title').forEach(function (h) { h.style.fontFamily = pair[0]; });
        var fam = document.getElementById('fontFamily');
        if (fam) fam.value = pair[1];
        if (typeof saveUndoState === 'function') saveUndoState();
    };

    window.updateRulerFromSelection = function () {
        var ruler = document.getElementById('ruler');
        if (!ruler) return;
        var m = A().pageMargins || { left: 96, right: 96, top: 96, bottom: 96 };
        var w = pageW();
        var padL = (m.left || 0) + (Number(A().pageGutter) || 0);
        var padR = m.right || 0;
        var block = getBlock() || lastIndentBlock;
        var leftInd = block ? parseFloat(block.style.marginLeft) || 0 : lastIndent.left;
        var rightInd = block ? parseFloat(block.style.marginRight) || 0 : lastIndent.right;
        var first = block ? parseFloat(block.style.textIndent) || 0 : lastIndent.first;
        var firstEl = document.getElementById('indentFirst');
        var leftEl = document.getElementById('indentLeft');
        var rightEl = document.getElementById('indentRight');
        if (firstEl) firstEl.style.left = (padL + leftInd + first) + 'px';
        if (leftEl) leftEl.style.left = (padL + leftInd) + 'px';
        if (rightEl) rightEl.style.left = (w - padR - rightInd) + 'px';
        if (block) {
            lastIndent.left = leftInd;
            lastIndent.right = rightInd;
            lastIndent.first = first;
            lastIndentBlock = block;
        }
        drawTabStops();
    };

    function ticksHtml(lengthPx, axis, offsetPx) {
        offsetPx = offsetPx || 0;
        var html = '';
        var n = Math.ceil(cm(lengthPx) * 4);
        for (var i = 0; i <= n; i++) {
            var pos = offsetPx + px(i / 4);
            if (pos > offsetPx + lengthPx + 0.5) break;
            var major = i % 4 === 0;
            var mid = i % 2 === 0;
            var size = major ? 11 : (mid ? 7 : 4);
            if (axis === 'h') {
                html += '<span class="ruler-tick h" style="left:' + pos + 'px;height:' + size + 'px"></span>';
                if (major && i > 0) html += '<span class="ruler-num" style="left:' + (pos + 2) + 'px;top:1px">' + (i / 4) + '</span>';
            } else {
                html += '<span class="ruler-tick v" style="top:' + pos + 'px;width:' + size + 'px"></span>';
                if (major && i > 0) html += '<span class="ruler-num" style="top:' + (pos + 1) + 'px;left:1px">' + (i / 4) + '</span>';
            }
        }
        return html;
    }

    function localPosOnEl(event, el, axis) {
        var rect = el.getBoundingClientRect();
        if (axis === 'y') {
            if (!rect.height) return 0;
            return (event.clientY - rect.top) * ((el.offsetHeight || rect.height) / rect.height);
        }
        if (!rect.width) return 0;
        return (event.clientX - rect.left) * ((el.offsetWidth || rect.width) / rect.width);
    }

    function applyMarginsLive(m) {
        m = {
            left: m.left, right: m.right, top: m.top, bottom: m.bottom
        };
        A().pageMargins = m;
        var editor = ed();
        if (!editor) return;
        var left = (m.left || 0) + (Number(A().pageGutter) || 0);
        editor.style.padding = m.top + 'px ' + m.right + 'px ' + m.bottom + 'px ' + left + 'px';
        editor.style.setProperty('--pad-top', m.top + 'px');
        editor.style.setProperty('--pad-right', m.right + 'px');
        editor.style.setProperty('--pad-bottom', m.bottom + 'px');
        editor.style.setProperty('--pad-left', left + 'px');
        editor.style.setProperty('--write-h', Math.max(80, pageH() - m.top - m.bottom) + 'px');
        try { localStorage.setItem('abeneMargins', JSON.stringify(m)); } catch (e) {}
        liveSyncChromeMargins(m);
        var editorNow = ed();
        if (editorNow) {
            abeneKeepBodyInWritingBands(editorNow, pageH(), m);
            keepSignClustersOnPage(editorNow, pageH(), m);
        }
        abeneScheduleBodyAlignToRuler(false);
    }

    function abeneScheduleBodyAlignToRuler(immediate) {
        clearTimeout(window._abeneRulerLayoutT);
        var run = function () {
            if (window._abeneLayingOut) {
                window._abeneRulerLayoutT = setTimeout(run, 40);
                return;
            }
            var holdDrag = !!window._abeneRulerDrag;
            window._abeneRulerLayoutOk = true;
            window._abeneRulerDrag = false;
            window._abenePointerDown = false;
            try {
                if (typeof window.abeneLayoutPageFlow === 'function') window.abeneLayoutPageFlow();
                liveSyncChromeMargins(A().pageMargins || {});
                if (typeof updateRulerHandles === 'function') updateRulerHandles();
            } finally {
                window._abeneRulerLayoutOk = false;
                window._abeneRulerDrag = holdDrag;
                if (holdDrag) window._abenePointerDown = true;
            }
        };
        if (immediate) run();
        else window._abeneRulerLayoutT = setTimeout(run, 50);
    }

    function liveSyncChromeMargins(m) {
        m = m || A().pageMargins || {};
        var chrome = document.getElementById('pageChrome');
        var h = pageH();
        var w = pageW();
        var ml = ((m.left || 0) + (Number(A().pageGutter) || 0)) + 'px';
        var mr = (m.right || 0) + 'px';
        if (chrome) {
            chrome.style.width = w + 'px';
            chrome.querySelectorAll('.page-header-zone').forEach(function (el) {
                var page = Math.max(1, Number(el.getAttribute('data-page')) || 1);
                el.style.top = ((page - 1) * h) + 'px';
                el.style.height = (m.top || 0) + 'px';
                el.style.setProperty('--ml', ml);
                el.style.setProperty('--mr', mr);
            });
            chrome.querySelectorAll('.page-footer-zone').forEach(function (el) {
                var page = Math.max(1, Number(el.getAttribute('data-page')) || 1);
                el.style.top = ((page - 1) * h + h - (m.bottom || 0)) + 'px';
                el.style.height = (m.bottom || 0) + 'px';
                el.style.setProperty('--ml', ml);
                el.style.setProperty('--mr', mr);
            });
        }
        var editor = ed();
        if (editor) {
            editor.querySelectorAll('.abene-cover, .abene-titlepage').forEach(function (el) {
                el.style.maxHeight = Math.max(80, h - (m.top || 0) - (m.bottom || 0)) + 'px';
            });
        }
        if (typeof updateRulerHandles === 'function') updateRulerHandles();
    }

    function showMarginTip(side, pxVal, event) {
        var tip = document.getElementById('rulerMarginTip');
        if (!tip) return;
        var names = { left: tt('rulerMarginLeft'), right: tt('rulerMarginRight'), top: tt('rulerMarginTop'), bottom: tt('rulerMarginBottom') };
        tip.textContent = (names[side] || '') + ' · ' + cm(pxVal).toFixed(2) + ' cm';
        tip.classList.add('on');
        if (event) {
            tip.style.position = 'fixed';
            tip.style.left = (event.clientX + 14) + 'px';
            tip.style.top = (event.clientY + 16) + 'px';
            if (tip.parentNode !== document.body) document.body.appendChild(tip);
        }
    }

    function hideMarginTip() {
        var tip = document.getElementById('rulerMarginTip');
        if (!tip) return;
        tip.classList.remove('on');
        var ruler = document.getElementById('ruler');
        if (ruler && tip.parentNode !== ruler) ruler.appendChild(tip);
        tip.style.position = '';
        tip.style.left = '';
        tip.style.top = '';
    }

    window.initRuler = function () {
        var ruler = document.getElementById('ruler');
        var editor = ed();
        if (!ruler || !editor) return;
        var w = pageW();
        var h = pageH();
        ruler.style.width = w + 'px';
        editor.style.setProperty('--page-w', w + 'px');
        editor.style.setProperty('--page-h', h + 'px');
        var html = '<div class="ruler-white-zone"></div>' + ticksHtml(w, 'h', 0);
        html += '<span class="ruler-handle horizontal" data-ruler-side="left" title="' + tt('rulerMarginLeft') + '"></span>' +
            '<span class="ruler-handle horizontal" data-ruler-side="right" title="' + tt('rulerMarginRight') + '"></span>' +
            '<span class="ruler-indent-first" id="indentFirst" title="Première ligne"></span>' +
            '<span class="ruler-indent-left" id="indentLeft" title="Retrait gauche / suspendu"></span>' +
            '<span class="ruler-indent-right" id="indentRight" title="Retrait droit"></span>' +
            '<span id="rulerTabs"></span>' +
            '<span class="ruler-margin-tip" id="rulerMarginTip"></span>';
        ruler.innerHTML = html;
        drawVerticalRuler(1);
        updateRulerHandles();
        bindRulerEvents(ruler);
        if (!ruler.dataset.abeneBound) {
            ruler.dataset.abeneBound = '1';
            ruler.addEventListener('click', function (ev) {
                if (ev.target.id === 'indentFirst' || ev.target.id === 'indentLeft' || ev.target.id === 'indentRight') return;
                if (ev.target.classList.contains('ruler-handle') || ev.target.classList.contains('ruler-tab-stop')) return;
                var rect = ruler.getBoundingClientRect();
                var x = ev.clientX - rect.left;
                var m = A().pageMargins || { left: 96, right: 96 };
                if (x <= m.left || x >= w - m.right) return;
                var kind = (document.getElementById('rulerTabKind') || {}).value || 'left';
                currentTabStops.push({ pos: x, align: kind });
                currentTabStops.sort(function (a, b) { return a.pos - b.pos; });
                drawTabStops();
            });
        }
    };

    function drawVerticalRuler(pages) {
        var vertical = document.getElementById('verticalRuler');
        if (!vertical) return;
        if (window._abeneRulerDrag) {
            if (typeof updateRulerHandles === 'function') updateRulerHandles();
            return;
        }
        var h = pageH();
        var m = A().pageMargins || { top: 96, bottom: 96 };
        pages = Math.max(1, pages || 1);
        var totalH = pages * h;
        vertical.style.height = totalH + 'px';
        vertical.style.minHeight = totalH + 'px';
        var vHtml = '';
        for (var p = 0; p < pages; p++) {
            var top = p * h;
            var bodyTop = top + m.top;
            var bodyH = Math.max(8, h - m.top - m.bottom);
            vHtml += '<div class="v-ruler-white" style="top:' + bodyTop + 'px;height:' + bodyH + 'px"></div>';
            vHtml += ticksHtml(h, 'v', top);
            if (p < pages - 1) {
                vHtml += '<div class="v-ruler-gap" style="top:' + (top + h - PAGE_SEAM) + 'px;height:' + PAGE_SEAM + 'px"></div>';
            }
            vHtml += '<span class="ruler-handle vertical" data-ruler-side="top" data-page="' + p + '" title="' + tt('rulerMarginTop') + '" style="top:' + (top + m.top) + 'px"></span>' +
                '<span class="ruler-handle vertical" data-ruler-side="bottom" data-page="' + p + '" title="' + tt('rulerMarginBottom') + '" style="top:' + (top + h - m.bottom) + 'px"></span>';
        }
        vertical.innerHTML = vHtml;
    }

    function bindRulerEvents(ruler) {
        var setIndent = function (event, type) {
            event.preventDefault();
            var w = pageW();
            var m = A().pageMargins || { left: 96, right: 96 };
            var padL = (m.left || 0) + (Number(A().pageGutter) || 0);
            var padR = m.right || 0;
            var x = localPosOnEl(event, ruler, 'x');
            var position = Math.max(padL, Math.min(w - padR, x));
            var el = document.getElementById(type);
            if (el) el.style.left = position + 'px';
            applyParagraphIndent(type, position);
            if (typeof updateRulerFromSelection === 'function') updateRulerFromSelection();
        };
        ['indentFirst', 'indentLeft', 'indentRight'].forEach(function (type) {
            var handle = document.getElementById(type);
            if (!handle) return;
            handle.addEventListener('pointerdown', function (event) {
                event.stopPropagation();
                handle.setPointerCapture(event.pointerId);
                setIndent(event, type);
                handle.onpointermove = function (move) { setIndent(move, type); };
                handle.onpointerup = function () { handle.onpointermove = null; if (typeof saveUndoState === 'function') saveUndoState(); abeneScheduleBodyAlignToRuler(true); };
            });
        });
        if (!window._abeneRulerMoveBound) {
            window._abeneRulerMoveBound = true;
            document.addEventListener('pointerdown', function (event) {
                var handle = event.target && event.target.closest && event.target.closest('.ruler-handle');
                if (!handle) return;
                event.preventDefault();
                event.stopPropagation();
                window._abeneRulerDrag = true;
                window._abenePointerDown = true;
                A().rulerDrag = { side: handle.dataset.rulerSide || 'top', el: handle };
                handle.classList.add('is-drag');
                try { handle.setPointerCapture(event.pointerId); } catch (err) {}
            }, true);
            document.addEventListener('pointermove', function (event) {
                if (!A().rulerDrag) return;
                var src = A().pageMargins || {};
                var m = {
                    left: Number(src.left) || 96,
                    right: Number(src.right) || 96,
                    top: Number(src.top) || 96,
                    bottom: Number(src.bottom) || 96
                };
                var w = pageW();
                var h = pageH();
                var side = A().rulerDrag.side;
                if (side === 'top' || side === 'bottom') {
                    var vertical = document.getElementById('verticalRuler');
                    if (!vertical) return;
                    var y = localPosOnEl(event, vertical, 'y');
                    var yInPage = ((y % h) + h) % h;
                    var position = side === 'top' ? yInPage : (h - yInPage);
                    m[side] = Math.max(36, Math.min(220, position));
                } else {
                    var rulerEl = document.getElementById('ruler');
                    if (!rulerEl) return;
                    var x = localPosOnEl(event, rulerEl, 'x');
                    var pos = side === 'left' ? x : (w - x);
                    m[side] = Math.max(24, Math.min(260, pos));
                }
                applyMarginsLive(m);
                showMarginTip(side, m[side], event);
            });
            document.addEventListener('pointerup', function () {
                if (!A().rulerDrag) return;
                var handle = A().rulerDrag.el;
                if (handle && handle.classList) handle.classList.remove('is-drag');
                A().rulerDrag = null;
                clearTimeout(window._abeneRulerLayoutT);
                window._abeneRulerDrag = false;
                window._abenePointerDown = false;
                hideMarginTip();
                var m = A().pageMargins;
                if (m && typeof window.setPageMargins === 'function') window.setPageMargins(m);
                else abeneScheduleBodyAlignToRuler(true);
            });
        }
    }

    window.updateRulerHandles = function () {
        var ruler = document.getElementById('ruler');
        var vertical = document.getElementById('verticalRuler');
        var m = A().pageMargins || { left: 96, right: 96, top: 96, bottom: 96 };
        var w = pageW();
        var h = pageH();
        if (ruler) {
            ruler.style.width = w + 'px';
            var left = ruler.querySelector('[data-ruler-side="left"]');
            var right = ruler.querySelector('[data-ruler-side="right"]');
            if (left) left.style.left = (m.left / w * 100) + '%';
            if (right) right.style.left = ((w - m.right) / w * 100) + '%';
            var zone = ruler.querySelector('.ruler-white-zone');
            if (zone) { zone.style.left = m.left + 'px'; zone.style.width = Math.max(0, w - m.left - m.right) + 'px'; }
        }
        if (vertical) {
            vertical.querySelectorAll('[data-ruler-side="top"]').forEach(function (el) {
                var p = Number(el.getAttribute('data-page')) || 0;
                el.style.top = (p * h + m.top) + 'px';
            });
            vertical.querySelectorAll('[data-ruler-side="bottom"]').forEach(function (el) {
                var p = Number(el.getAttribute('data-page')) || 0;
                el.style.top = (p * h + h - m.bottom) + 'px';
            });
            vertical.querySelectorAll('.v-ruler-white').forEach(function (el, idx) {
                el.style.top = (idx * h + m.top) + 'px';
                el.style.height = Math.max(8, h - m.top - m.bottom) + 'px';
            });
        }
        window.updateRulerFromSelection();
    };

    function indentTargetBlocks() {
        var editor = ed();
        var blocks = [];
        var sel = window.getSelection();
        if (editor && sel && sel.rangeCount && !sel.isCollapsed) {
            try {
                var range = sel.getRangeAt(0);
                editor.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote, pre, li').forEach(function (el) {
                    if (range.intersectsNode(el)) blocks.push(el);
                });
            } catch (err) {}
        }
        if (!blocks.length) {
            var one = getBlock() || lastIndentBlock;
            if (!one && editor) one = editor.querySelector('p, h1, h2, h3, h4, h5, h6, blockquote, pre, li');
            if (one && editor && !editor.contains(one)) one = null;
            if (one) blocks.push(one);
        }
        if (blocks[0]) lastIndentBlock = blocks[0];
        return blocks;
    }

    window.applyParagraphIndent = function (type, position) {
        var blocks = indentTargetBlocks();
        if (!blocks.length) return;
        var m = A().pageMargins || { left: 96, right: 96 };
        var w = pageW();
        var padL = (m.left || 0) + (Number(A().pageGutter) || 0);
        var padR = m.right || 0;
        position = Math.max(padL, Math.min(w - padR, Number(position) || padL));
        blocks.forEach(function (block) {
            if (!block || !block.style) return;
            if (type === 'indentFirst') {
                var bodyLeft = parseFloat(block.style.marginLeft) || 0;
                block.style.textIndent = (position - padL - bodyLeft) + 'px';
            }
            if (type === 'indentLeft') {
                var firstAbs = padL + (parseFloat(block.style.marginLeft) || 0) + (parseFloat(block.style.textIndent) || 0);
                if (firstAbs < padL) firstAbs = padL;
                block.style.marginLeft = Math.max(0, position - padL) + 'px';
                block.style.textIndent = (firstAbs - position) + 'px';
            }
            if (type === 'indentRight') {
                block.style.marginRight = Math.max(0, w - padR - position) + 'px';
            }
        });
        var block = blocks[0];
        lastIndent.left = parseFloat(block.style.marginLeft) || 0;
        lastIndent.right = parseFloat(block.style.marginRight) || 0;
        lastIndent.first = parseFloat(block.style.textIndent) || 0;
        if (typeof abeneScheduleBodyAlignToRuler === 'function') abeneScheduleBodyAlignToRuler(false);
    };

    function drawTabStops() {
        var box = document.getElementById('rulerTabs');
        if (!box) return;
        box.innerHTML = currentTabStops.map(function (t, i) {
            return '<span class="ruler-tab-stop ' + t.align + '" data-tab="' + i + '" style="left:' + t.pos + 'px" title="Taquet ' + t.align + '"></span>';
        }).join('');
        box.querySelectorAll('.ruler-tab-stop').forEach(function (el) {
            el.addEventListener('dblclick', function (ev) {
                ev.stopPropagation();
                currentTabStops.splice(Number(el.dataset.tab), 1);
                drawTabStops();
            });
        });
    }

    function isTrailingBlank(el) {
        if (!el || el.nodeType !== 1) return true;
        if (el.classList.contains('abene-page-flow')) return true;
        if (el.classList.contains('page-break-marker')) return false;
        if (el.hasAttribute('data-abene-block')) return false;
        if (el.tagName !== 'P') return false;
        if (el.querySelector('img, table, canvas, video, svg, hr, [data-abene-block]')) return false;
        var t = String(el.innerText || '').replace(/[\u200b\u00a0]/g, ' ').replace(/\s+/g, ' ').trim();
        return !t;
    }

    function lastUsedChild(editor) {
        var n = editor.lastElementChild;
        while (n && (n.classList.contains('abene-page-flow') || n.classList.contains('abene-footnotes'))) n = n.previousElementSibling;
        while (n && isTrailingBlank(n)) {
            var prev = n.previousElementSibling;
            while (prev && prev.classList.contains('abene-page-flow')) prev = prev.previousElementSibling;
            if (prev && prev.classList.contains('page-break-marker')) {
                n = prev;
                break;
            }
            n = prev;
        }
        return n;
    }

    window.abeneCountUsedPages = function (editor) {
        editor = editor || ed();
        var h = pageH();
        if (!editor) return 1;
        var n = lastUsedChild(editor);
        if (!n) return 1;
        var brPrev = n.previousElementSibling;
        while (brPrev && brPrev.classList.contains('abene-page-flow')) brPrev = brPrev.previousElementSibling;
        if (n && isTrailingBlank(n) && brPrev && brPrev.classList.contains('page-break-marker')) {
            return Math.max(1, Math.floor((yInEditor(brPrev, editor) + 1) / h) + 2);
        }
        var top = yInEditor(n, editor);
        var bottom = top + n.offsetHeight;
        if (n.classList.contains('page-break-marker')) {
            return Math.max(1, Math.floor((top + 1) / h) + 2);
        }
        var after = n.nextElementSibling;
        while (after && after.classList.contains('abene-page-flow')) after = after.nextElementSibling;
        if (after && after.classList.contains('page-break-marker') && isTrailingBlank(after.nextElementSibling)) {
            return Math.max(1, Math.floor((yInEditor(after, editor) + 1) / h) + 2);
        }
        return Math.max(1, Math.ceil((bottom - 4) / h));
    };

    window.abeneFitEditorSheets = function (editor) {
        editor = editor || ed();
        var h = pageH();
        if (!editor) return 1;
        editor.style.height = 'auto';
        editor.style.minHeight = h + 'px';
        var pages = window.abeneCountUsedPages(editor);
        editor.style.minHeight = (pages * h) + 'px';
        return pages;
    };

    function writingStart(page, h, m) {
        return page * h + (m.top || 0);
    }
    function writingLimit(page, h, m) {
        var extra = 0;
        if (window.ABENE && window.ABENE.Notes && typeof window.ABENE.Notes.spaceForPage === 'function') {
            extra = window.ABENE.Notes.spaceForPage(page) || 0;
        }
        var start = page * h + (m.top || 0);
        var limit = (page + 1) * h - (m.bottom || 0) - extra;
        return Math.max(start + 80, limit);
    }
    function nextWritingStart(page, h, m) {
        return (page + 1) * h + (m.top || 0);
    }

    function yInEditor(el, editor) {
        if (!el || !editor) return 0;
        try {
            var er = editor.getBoundingClientRect();
            var rr = el.getBoundingClientRect();
            if (er.height) {
                return (rr.top - er.top) * (editor.offsetHeight / er.height);
            }
        } catch (err) {}
        var y = 0;
        var n = el;
        while (n && n !== editor) {
            y += n.offsetTop || 0;
            var next = n.offsetParent;
            if (!next || next === editor) break;
            if (editor.contains(next)) {
                n = next;
                continue;
            }
            break;
        }
        var pad = 0;
        try { pad = parseFloat(window.getComputedStyle(editor).paddingTop) || 0; } catch (err2) {}
        return y + pad;
    }

    function yRangeInEditor(range, editor, edge) {
        if (!range || !editor) return 0;
        try {
            var er = editor.getBoundingClientRect();
            var b = range.getBoundingClientRect();
            if (!er.height) return 0;
            var raw = edge === 'bottom' ? b.bottom : b.top;
            return (raw - er.top) * (editor.offsetHeight / er.height);
        } catch (err) {
            return 0;
        }
    }

    function isLayoutSkipNode(node) {
        if (!node) return true;
        var el = node.nodeType === 1 ? node : node.parentElement;
        if (!el || !el.closest) return false;
        return !!(el.closest('.abene-page-flow, .page-chrome, .page-header-zone, .page-footer-zone, .page-fn-zone, [data-abene-cloned-head]'));
    }

    function saveCaretBookmark(editor) {
        var sel = window.getSelection();
        if (!sel.rangeCount) return null;
        var r = sel.getRangeAt(0);
        if (!editor.contains(r.startContainer) && r.startContainer !== editor) return null;
        var walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                return isLayoutSkipNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
            }
        });
        var pos = 0;
        var n;
        var start = 0;
        var found = false;
        while ((n = walker.nextNode())) {
            if (n === r.startContainer) {
                start = pos + r.startOffset;
                found = true;
                break;
            }
            pos += n.nodeValue.length;
        }
        if (!found && r.startContainer.nodeType === 1) {
            start = pos;
        }
        return {
            node: r.startContainer,
            offset: r.startOffset,
            endNode: r.endContainer,
            endOffset: r.endOffset,
            start: start,
            collapsed: r.collapsed
        };
    }

    function restoreCaretBookmark(editor, bm) {
        if (!bm) return;
        var sel = window.getSelection();
        function clampOff(node, off) {
            if (!node) return 0;
            var max = node.nodeType === 3 ? node.nodeValue.length : node.childNodes.length;
            return Math.max(0, Math.min(off, max));
        }
        if (bm.node && editor.contains(bm.node) && !isLayoutSkipNode(bm.node)) {
            try {
                var r = document.createRange();
                r.setStart(bm.node, clampOff(bm.node, bm.offset));
                if (!bm.collapsed && bm.endNode && editor.contains(bm.endNode) && !isLayoutSkipNode(bm.endNode)) {
                    r.setEnd(bm.endNode, clampOff(bm.endNode, bm.endOffset));
                } else {
                    r.collapse(true);
                }
                sel.removeAllRanges();
                sel.addRange(r);
                return;
            } catch (err) {}
        }
        var walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                return isLayoutSkipNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
            }
        });
        var pos = 0;
        var n;
        var target = Math.max(0, bm.start || 0);
        while ((n = walker.nextNode())) {
            var len = n.nodeValue.length;
            if (pos + len >= target) {
                try {
                    var r2 = document.createRange();
                    r2.setStart(n, Math.max(0, Math.min(len, target - pos)));
                    r2.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(r2);
                } catch (err2) {}
                return;
            }
            pos += len;
        }
        try {
            var end = document.createRange();
            end.selectNodeContents(editor);
            end.collapse(false);
            sel.removeAllRanges();
            sel.addRange(end);
        } catch (err3) {}
    }

    function mergeContinuedTables(root) {
        if (!root || !root.querySelectorAll) return;
        var list = Array.prototype.slice.call(root.querySelectorAll('table[data-abene-cont]'));
        var i;
        for (i = list.length - 1; i >= 0; i--) {
            var t = list[i];
            if (!t.parentNode) continue;
            var prev = t.previousElementSibling;
            while (prev && prev.classList && prev.classList.contains('abene-page-flow')) prev = prev.previousElementSibling;
            if (!prev || prev.tagName !== 'TABLE') {
                t.removeAttribute('data-abene-cont');
                continue;
            }
            var dest = prev.tBodies[0] || prev;
            var srcRows = Array.prototype.slice.call(t.rows);
            srcRows.forEach(function (tr) {
                if (tr.getAttribute('data-abene-cloned-head')) return;
                if (t.tHead && tr.parentNode === t.tHead) return;
                dest.appendChild(tr);
            });
            t.parentNode.removeChild(t);
        }
    }

    function mergeContinuedBlocks(root) {
        if (!root || !root.querySelectorAll) return;
        var list = Array.prototype.slice.call(root.querySelectorAll('[data-abene-cont="p"]'));
        var i;
        for (i = list.length - 1; i >= 0; i--) {
            var t = list[i];
            if (!t.parentNode) continue;
            var prev = t.previousElementSibling;
            while (prev && prev.classList && prev.classList.contains('abene-page-flow')) prev = prev.previousElementSibling;
            if (!prev || prev.tagName !== t.tagName) {
                t.removeAttribute('data-abene-cont');
                continue;
            }
            while (t.firstChild) prev.appendChild(t.firstChild);
            t.parentNode.removeChild(t);
        }
    }

    function clampOverflowMedia(editor, writeH) {
        editor.querySelectorAll('img, video, canvas, svg').forEach(function (el) {
            if (el.closest && el.closest('.page-chrome, .hf-brand')) return;
            if (el.offsetHeight > writeH + 8) {
                el.style.maxHeight = writeH + 'px';
                el.style.width = 'auto';
                el.style.objectFit = 'contain';
            }
        });
    }

    function ensureTableColgroup(table) {
        var colg = table.querySelector('colgroup');
        if (colg) return colg;
        var row = table.rows[0];
        if (!row || !row.cells.length) return null;
        colg = document.createElement('colgroup');
        var i;
        for (i = 0; i < row.cells.length; i++) {
            var col = document.createElement('col');
            col.style.width = row.cells[i].offsetWidth + 'px';
            colg.appendChild(col);
        }
        table.insertBefore(colg, table.firstChild);
        return colg;
    }

    function headerRowsForClone(table) {
        if (table && table.getAttribute && table.getAttribute('data-abene-repeat-head') === '0') return [];
        var out = [];
        if (table.tHead && table.tHead.rows.length) {
            Array.prototype.forEach.call(table.tHead.rows, function (hr) { out.push(hr); });
            return out;
        }
        var first = table.rows[0];
        if (first && first.cells.length && first.querySelector('th') && !first.querySelector('td')) out.push(first);
        return out;
    }

    function isUnsplittableTable(table) {
        if (!table) return false;
        var cn = ' ' + (table.className || '') + ' ';
        if (/\sgr-(signs|letterhead|meta|parties|totals)\s/.test(cn)) return true;
        if (table.closest && (table.closest('.gr-sign-block') || table.closest('.gr-letterhead'))) return true;
        return false;
    }

    function trySplitTable(table, limit, editor) {
        if (isUnsplittableTable(table)) return false;
        if (window.ABENE && window.ABENE.Tables && window.ABENE.Tables.useEngine !== false &&
            typeof window.ABENE.Tables.trySplit === 'function') {
            return window.ABENE.Tables.trySplit(table, limit, editor, {
                yInEditor: yInEditor,
                ensureColgroup: ensureTableColgroup,
                headerRows: headerRowsForClone
            });
        }
        return trySplitTableLegacy(table, limit, editor);
    }

    function trySplitTableLegacy(table, limit, editor) {
        if (!table || table.tagName !== 'TABLE') return false;
        if (isUnsplittableTable(table)) return false;
        var rows = Array.prototype.slice.call(table.rows || []);
        if (rows.length < 2) return false;
        var splitAt = -1;
        var r, top, bot;
        for (r = 0; r < rows.length; r++) {
            top = yInEditor(rows[r], editor);
            bot = top + rows[r].offsetHeight;
            if (bot > limit + 1) { splitAt = r; break; }
        }
        if (splitAt < 1) return false;
        var heads = headerRowsForClone(table);
        var headCount = table.tHead ? table.tHead.rows.length : 0;
        if (headCount && splitAt < headCount) return false;
        var colg = ensureTableColgroup(table);
        var clone = table.cloneNode(false);
        clone.setAttribute('data-abene-cont', '1');
        clone.removeAttribute('id');
        if (table.style && table.style.cssText) clone.style.cssText = table.style.cssText;
        if (!clone.style.width) clone.style.width = table.offsetWidth + 'px';
        if (colg) clone.appendChild(colg.cloneNode(true));
        if (heads.length) {
            var nh = document.createElement('thead');
            heads.forEach(function (hr) {
                var copy = hr.cloneNode(true);
                copy.setAttribute('data-abene-cloned-head', '1');
                copy.setAttribute('contenteditable', 'false');
                nh.appendChild(copy);
            });
            clone.appendChild(nh);
        }
        var body = document.createElement('tbody');
        if (table.tBodies[0] && table.tBodies[0].className) body.className = table.tBodies[0].className;
        clone.appendChild(body);
        for (r = splitAt; r < rows.length; r++) {
            if (table.tHead && rows[r].parentNode === table.tHead) continue;
            body.appendChild(rows[r]);
        }
        if (!body.rows.length) return false;
        if (table.nextSibling) table.parentNode.insertBefore(clone, table.nextSibling);
        else table.parentNode.appendChild(clone);
        return true;
    }

    function canSplitBlock(el) {
        if (!el || el.nodeType !== 1) return false;
        if (el.classList.contains('page-break-marker') || el.classList.contains('abene-page-flow')) return false;
        if (el.hasAttribute('data-abene-block')) return false;
        if (/^(TABLE|IMG|HR|UL|OL|LI|FIGURE|VIDEO|CANVAS|THEAD|TBODY|TR|TD|TH)$/.test(el.tagName)) return false;
        if (el.querySelector('table, img, video, canvas, .page-break-marker, [data-abene-block]')) return false;
        return /^(P|H1|H2|H3|H4|H5|H6|BLOCKQUOTE|PRE)$/.test(el.tagName);
    }

    function snapSplitOffset(node, off) {
        var s = node.nodeValue || '';
        if (off <= 0 || off >= s.length) return off;
        if (/\s/.test(s.charAt(off)) || /\s/.test(s.charAt(off - 1))) return off;
        var k = off;
        while (k > 0 && !/\s/.test(s.charAt(k - 1))) k--;
        return k > 0 ? k : off;
    }

    function trySplitBlock(el, limit, editor) {
        if (!canSplitBlock(el)) return false;
        var texts = [];
        var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
        var tn;
        while ((tn = w.nextNode())) {
            if (tn.nodeValue) texts.push(tn);
        }
        if (!texts.length) return false;
        var splitNode = null;
        var splitOff = 0;
        var i;
        var j;
        var foundOverflow = false;
        for (i = 0; i < texts.length && !foundOverflow; i++) {
            tn = texts[i];
            var len = tn.nodeValue.length;
            var step = Math.max(1, Math.ceil(len / 48));
            for (j = 1; j <= len; j += step) {
                var probe = document.createRange();
                var at = Math.min(j, len);
                if (at < len) {
                    probe.setStart(tn, at);
                    probe.setEnd(tn, Math.min(at + 1, len));
                } else {
                    probe.setStart(tn, Math.max(0, len - 1));
                    probe.setEnd(tn, len);
                }
                if (yRangeInEditor(probe, editor, 'bottom') > limit + 1) {
                    splitNode = tn;
                    splitOff = snapSplitOffset(tn, Math.max(0, at - step));
                    foundOverflow = true;
                    break;
                }
                splitNode = tn;
                splitOff = at;
            }
        }
        if (!foundOverflow || !splitNode) return false;
        if (splitNode === texts[0] && splitOff === 0) return false;
        if (splitNode === texts[texts.length - 1] && splitOff >= (splitNode.nodeValue || '').length) return false;
        try {
            var hBefore = el.offsetHeight;
            var tailRange = document.createRange();
            tailRange.setStart(splitNode, splitOff);
            tailRange.setEnd(el, el.childNodes.length);
            var tail = tailRange.extractContents();
            if (!tail || (!tail.textContent.replace(/[\u200b\s]/g, '').length && !tail.querySelector('br, img'))) {
                el.appendChild(tail);
                return false;
            }
            var clone = el.cloneNode(false);
            clone.setAttribute('data-abene-cont', 'p');
            clone.appendChild(tail);
            if (el.nextSibling) el.parentNode.insertBefore(clone, el.nextSibling);
            else el.parentNode.appendChild(clone);
            if (el.offsetHeight >= hBefore - 1) {
                while (clone.firstChild) el.appendChild(clone.firstChild);
                if (clone.parentNode) clone.parentNode.removeChild(clone);
                return false;
            }
            return true;
        } catch (err) {
            return false;
        }
    }

    window.abeneStripPageFlow = function (root) {
        if (!root || !root.querySelectorAll) return;
        root.querySelectorAll('.abene-page-flow').forEach(function (el) { el.remove(); });
        mergeContinuedTables(root);
        mergeContinuedBlocks(root);
    };

    window.abeneSchedulePageFlow = function (immediate) {
        if (window._abeneLayingOut) return;
        clearTimeout(window._abeneFlowT);
        var run = function () {
            if (typeof refreshPagination === 'function') refreshPagination();
            else if (window.abeneLayoutPageFlow) {
                window.abeneLayoutPageFlow();
                if (typeof window.renderPageDecorations === 'function') window.renderPageDecorations();
            }
        };
        if (immediate) {
            run();
            return;
        }
        window._abeneFlowT = setTimeout(run, 70);
    };

    window.abeneInsertPageBreak = function () {
        if (window._abeneBreakLock) return;
        window._abeneBreakLock = true;
        setTimeout(function () { window._abeneBreakLock = false; }, 40);
        var editor = ed();
        if (!editor) return;
        editor.focus();
        var block = getBlock();
        var cls = 'abene-normal';
        var extra = '';
        if (block && block !== editor && !/^(TD|TH|LI|TR|TABLE)$/.test(block.tagName)) {
            if (block.className) cls = String(block.className).replace(/"/g, '');
            if (block.style) {
                if (block.style.textAlign) extra += 'text-align:' + block.style.textAlign + ';';
                if (block.style.marginLeft) extra += 'margin-left:' + block.style.marginLeft + ';';
                if (block.style.marginRight) extra += 'margin-right:' + block.style.marginRight + ';';
                if (block.style.textIndent) extra += 'text-indent:' + block.style.textIndent + ';';
            }
        }
        var marker = document.createElement('div');
        marker.className = 'page-break-marker';
        marker.contentEditable = 'false';
        marker.setAttribute('aria-hidden', 'true');
        var nextP = document.createElement('p');
        nextP.className = cls;
        if (extra) nextP.setAttribute('style', extra);
        nextP.innerHTML = '<br>';
        var host = block && editor.contains(block) ? block : editor.lastElementChild;
        while (host && host.parentNode && host.parentNode !== editor) host = host.parentNode;
        if (host && host.parentNode === editor && host !== editor) {
            if (host.nextSibling) editor.insertBefore(marker, host.nextSibling);
            else editor.appendChild(marker);
            editor.insertBefore(nextP, marker.nextSibling);
        } else {
            editor.appendChild(marker);
            editor.appendChild(nextP);
        }
        try {
            var sel = window.getSelection();
            var r = document.createRange();
            r.selectNodeContents(nextP);
            r.collapse(true);
            sel.removeAllRanges();
            sel.addRange(r);
        } catch (err) {}
        if (typeof saveUndoState === 'function') saveUndoState();
        window.abeneSchedulePageFlow(true);
        if (typeof window.abeneFitEditorSheets === 'function') window.abeneFitEditorSheets(editor);
        if (typeof window.renderPageDecorations === 'function') window.renderPageDecorations();
    };
    window.insertPageBreak = window.abeneInsertPageBreak;

    window.abeneLayoutPageFlow = function () {
        var editor = ed();
        if (!editor || window._abeneLayingOut) return;
        if (editor.classList.contains('editing-header-footer')) return;
        if (A().documentState && A().documentState.pagination === false) {
            window.abeneStripPageFlow(editor);
            return;
        }
        if ((window._abenePointerDown || window._abeneRulerDrag) && !window._abeneRulerLayoutOk) {
            window.abeneSchedulePageFlow();
            return;
        }
        window._abeneLayingOut = true;
        var saved = saveCaretBookmark(editor);
        window.abeneStripPageFlow(editor);
        var h = pageH();
        var m = A().pageMargins || { top: 96, bottom: 96, left: 96, right: 96 };
        var writeH = Math.max(80, h - m.top - m.bottom);
        clampOverflowMedia(editor, writeH);
        var page = 0;
        var guard = 0;
        var stuck = null;
        function kids() {
            return Array.prototype.filter.call(editor.children, function (el) {
                if (!el.classList) return false;
                if (el.classList.contains('abene-page-flow')) return false;
                if (el.classList.contains('abene-footnotes') || el.getAttribute('data-abene-notes') === 'footnotes') return false;
                if (el.classList.contains('abene-img-anchor')) return false;
                if (el.classList.contains('abene-obj-free') || el.classList.contains('abene-obj-behind') || el.classList.contains('abene-obj-front')) return false;
                return true;
            });
        }
        while (guard++ < 120) {
            var limit = writingLimit(page, h, m);
            var nextStart = nextWritingStart(page, h, m);
            var writeStart = writingStart(page, h, m);
            var list = kids();
            var lastOK = null;
            var nextEl = null;
            var i, el, top, bottom, remain;
            var didSplit = false;
            for (i = 0; i < list.length; i++) {
                el = list[i];
                top = yInEditor(el, editor);
                bottom = top + el.offsetHeight;
                if (bottom <= writeStart + 2) {
                    lastOK = el;
                    continue;
                }
                if (el.classList.contains('page-break-marker')) {
                    lastOK = el;
                    nextEl = list[i + 1] || null;
                    if (!nextEl) {
                        var blank = document.createElement('p');
                        blank.className = 'abene-normal';
                        blank.innerHTML = '<br>';
                        editor.appendChild(blank);
                        nextEl = blank;
                    }
                    break;
                }
                if (top >= limit - 4) {
                    nextEl = el;
                    break;
                }
                if (bottom <= limit) {
                    lastOK = el;
                    continue;
                }
                remain = limit - top;
                if (el.tagName === 'TABLE' && remain > 36 && trySplitTable(el, limit, editor)) {
                    didSplit = true;
                    break;
                }
                if (remain > 18 && trySplitBlock(el, limit, editor)) {
                    didSplit = true;
                    break;
                }
                if (el.offsetHeight > writeH + 4) {
                    var innerTbl = el.tagName !== 'TABLE' ? el.querySelector && el.querySelector('table') : null;
                    if (innerTbl && remain > 36 && trySplitTable(innerTbl, limit, editor)) {
                        didSplit = true;
                        break;
                    }
                    lastOK = el;
                    continue;
                }
                nextEl = el;
                break;
            }
            if (didSplit) {
                stuck = null;
                continue;
            }
            if (!nextEl) break;
            if (nextEl === stuck) {
                page++;
                stuck = null;
                continue;
            }
            stuck = nextEl;
            var fromY = lastOK ? (yInEditor(lastOK, editor) + lastOK.offsetHeight) : writeStart;
            var gap = Math.round(nextStart - fromY);
            if (gap < 4) {
                page++;
                stuck = null;
                continue;
            }
            if (gap > h + m.top + 8) gap = Math.round(h + m.top);
            var spacer = document.createElement('div');
            spacer.className = 'abene-page-flow';
            spacer.contentEditable = 'false';
            spacer.setAttribute('aria-hidden', 'true');
            spacer.style.setProperty('height', gap + 'px', 'important');
            spacer.style.setProperty('--flow-h', gap + 'px');
            if (nextEl && nextEl.parentNode === editor) editor.insertBefore(spacer, nextEl);
            else if (lastOK && lastOK.parentNode === editor) {
                if (lastOK.nextSibling) editor.insertBefore(spacer, lastOK.nextSibling);
                else editor.appendChild(spacer);
            } else editor.appendChild(spacer);
            page++;
            stuck = null;
        }
        abeneKeepBodyInWritingBands(editor, h, m);
        keepSignClustersOnPage(editor, h, m);
        if (window.ABENE && window.ABENE.Images && typeof window.ABENE.Images.syncAnchors === 'function') {
            try { window.ABENE.Images.syncAnchors(editor); } catch (errImg) {}
        }
        if (window.ABENE && window.ABENE.Notes && typeof window.ABENE.Notes.afterLayout === 'function') {
            try { window.ABENE.Notes.afterLayout(editor); } catch (errFn) {}
        }
        window._abeneChromeSig = '';
        restoreCaretBookmark(editor, saved);
        window._abeneLayingOut = false;
    };

    function insertFlowSpacer(editor, beforeEl, heightPx) {
        heightPx = Math.round(heightPx);
        if (!editor || heightPx < 4) return null;
        var prev = beforeEl && beforeEl.previousElementSibling;
        if (prev && prev.classList.contains('abene-page-flow')) {
            var cur = parseFloat(prev.style.height) || prev.offsetHeight || 0;
            prev.style.setProperty('height', (cur + heightPx) + 'px', 'important');
            prev.style.setProperty('--flow-h', (cur + heightPx) + 'px');
            return prev;
        }
        var spacer = document.createElement('div');
        spacer.className = 'abene-page-flow';
        spacer.contentEditable = 'false';
        spacer.setAttribute('aria-hidden', 'true');
        spacer.style.setProperty('height', heightPx + 'px', 'important');
        spacer.style.setProperty('--flow-h', heightPx + 'px');
        if (beforeEl && beforeEl.parentNode) beforeEl.parentNode.insertBefore(spacer, beforeEl);
        else editor.appendChild(spacer);
        return spacer;
    }

    function clusterEnd(el) {
        if (!el) return el;
        if (el.classList && el.classList.contains('gr-sign-block')) return el;
        var n = el.nextElementSibling;
        var last = el;
        while (n) {
            if (n.classList.contains('abene-page-flow')) {
                n = n.nextElementSibling;
                continue;
            }
            if (n.classList.contains('gr-doc-foot') || n.classList.contains('gr-goldbar') || n.classList.contains('gr-iva-note')) {
                last = n;
                n = n.nextElementSibling;
                continue;
            }
            break;
        }
        return last;
    }

    function keepSignClustersOnPage(editor, h, m) {
        if (!editor || !h) return;
        m = m || { top: 96, bottom: 96 };
        var writeH = Math.max(80, h - (m.top || 0) - (m.bottom || 0));
        var guard = 0;
        while (guard++ < 16) {
            var moved = false;
            var nodes = editor.querySelectorAll('.gr-sign-block, table.gr-signs');
            var i, el, last, top, bottom, page, limit, dest, need, clusterH;
            for (i = 0; i < nodes.length; i++) {
                el = nodes[i];
                if (el.tagName === 'TABLE' && el.closest && el.closest('.gr-sign-block')) continue;
                last = clusterEnd(el);
                top = yInEditor(el, editor);
                bottom = yInEditor(last, editor) + last.offsetHeight;
                clusterH = Math.max(last.offsetHeight || 0, bottom - top);
                if (clusterH > writeH + 8) continue;
                page = Math.max(0, Math.floor(top / h));
                limit = writingLimit(page, h, m);
                dest = 0;
                if (top < limit && bottom > limit + 1) dest = nextWritingStart(page, h, m);
                else if (top >= limit - 1 && top < (page + 1) * h) dest = nextWritingStart(page, h, m);
                if (!dest) continue;
                need = dest - top;
                if (need < 4 || need > h) continue;
                insertFlowSpacer(editor, el, need);
                moved = true;
                break;
            }
            if (!moved) break;
        }
    }

    function abeneKeepBodyInWritingBands(editor, h, m) {
        if (!editor || !h) return;
        m = m || { top: 96, bottom: 96 };
        var writeH = Math.max(80, h - (m.top || 0) - (m.bottom || 0));
        var guard = 0;
        while (guard++ < 48) {
            var moved = false;
            var list = Array.prototype.slice.call(editor.children);
            var i, el, top, bottom, page, start, limit, dest, need;
            for (i = 0; i < list.length; i++) {
                el = list[i];
                if (!el || el.classList.contains('abene-page-flow')) continue;
                if (el.classList.contains('page-break-marker')) continue;
                if (el.classList.contains('abene-img-anchor')) continue;
                if (el.classList.contains('abene-obj-free') || el.classList.contains('abene-obj-behind') || el.classList.contains('abene-obj-front')) continue;
                if (el.classList.contains('abene-footnotes') || el.getAttribute('data-abene-notes') === 'footnotes') continue;
                top = yInEditor(el, editor);
                bottom = top + el.offsetHeight;
                page = Math.max(0, Math.floor(top / h));
                start = writingStart(page, h, m);
                limit = writingLimit(page, h, m);
                dest = 0;
                if (page === 0 && top < start && top <= 2) continue;
                if (top < start - 1 && top >= page * h - 1) dest = start;
                else if (top >= limit - 1 && top < (page + 1) * h) dest = nextWritingStart(page, h, m);
                else if (top >= start - 1 && top < limit && bottom > limit + 1 && el.offsetHeight <= writeH + 4) {
                    dest = nextWritingStart(page, h, m);
                }
                if (!dest) continue;
                need = dest - top;
                if (need < 3) continue;
                insertFlowSpacer(editor, el, need);
                moved = true;
                break;
            }
            if (!moved) break;
        }
    }

    function headerTplId() {
        return A().pageHeaderTemplate || ((A().pageHeaderText || '') ? 'text' : 'blank');
    }
    function isStructuredHeader(tpl) {
        tpl = tpl || headerTplId();
        return tpl === 'gr-report' || tpl === 'gr-letter' || tpl === 'triple';
    }
    function persistHeaderState() {
        try {
            localStorage.setItem('abeneHeader', A().pageHeaderText || '');
            localStorage.setItem('abeneHeaderTemplate', headerTplId());
            localStorage.setItem('abeneHeaderFields', JSON.stringify(A().pageHeaderFields || {}));
        } catch (err) {}
    }
    function defaultHeaderFields(tpl) {
        var y = new Date().getFullYear();
        var iso = new Date().toISOString().slice(0, 10);
        var doc = (A().documentState && A().documentState.name) || '';
        var title = tpl === 'gr-letter' ? tt('hfTplLetterTitle') : tt('hfTplReportTitle');
        if (tpl === 'centered' || tpl === 'triple') title = doc || tt('pHeaderDef') || 'Documento1';
        return {
            title: title || 'RELATÓRIO',
            ref: (tt('hfRefPrefix') || 'Nº ') + 'GR-RAP-' + y + '-001',
            date: (tt('hfDatePrefix') || 'Data : ') + iso
        };
    }
    function headerFieldsFor(tpl) {
        var cur = A().pageHeaderFields || {};
        var def = defaultHeaderFields(tpl);
        return {
            title: String(cur.title || def.title),
            ref: String(cur.ref || def.ref),
            date: String(cur.date || def.date)
        };
    }
    function readHfFields(root) {
        var out = { title: '', ref: '', date: '' };
        if (!root) return out;
        root.querySelectorAll('[data-hf-field]').forEach(function (el) {
            var k = el.getAttribute('data-hf-field');
            if (k) out[k] = String(el.innerText || '').replace(/\u200b/g, '').replace(/\n/g, ' ').trim();
        });
        return out;
    }
    function renderHeaderTemplateHtml(tpl) {
        var co = A().companyData || {};
        var name = escapeHf(co.name || 'Genius Raros');
        var icon = escapeHf(co.iconUrl || 'branding/icon_48.svg');
        var f = headerFieldsFor(tpl);
        if (tpl === 'gr-report') {
            return '<div class="hf-gr-report">' +
                '<div class="hf-gr-left"><img class="hf-gr-logo" src="' + icon + '" alt="" width="42" height="42" draggable="false" /><div class="hf-gr-name">' + name + '</div></div>' +
                '<div class="hf-gr-right">' +
                '<div class="hf-gr-title" data-hf-field="title">' + escapeHf(f.title) + '</div>' +
                '<div class="hf-gr-ref" data-hf-field="ref">' + escapeHf(f.ref) + '</div>' +
                '<div class="hf-gr-date" data-hf-field="date">' + escapeHf(f.date) + '</div>' +
                '</div></div>';
        }
        if (tpl === 'gr-letter') {
            return '<div class="hf-gr-letter">' +
                '<div class="hf-gr-letter-brand"><img src="' + icon + '" alt="" width="36" height="36" draggable="false" /><span>' + name + '</span></div>' +
                '<div class="hf-gr-letter-meta">' +
                '<div class="hf-gr-title" data-hf-field="title">' + escapeHf(f.title) + '</div>' +
                '<div class="hf-gr-date" data-hf-field="date">' + escapeHf(f.date) + '</div>' +
                '</div></div>';
        }
        if (tpl === 'triple') {
            return '<div class="hf-triple">' +
                '<div class="hf-t-l">' + name + '</div>' +
                '<div class="hf-t-c" data-hf-field="title">' + escapeHf(f.title) + '</div>' +
                '<div class="hf-t-r" data-hf-field="date">' + escapeHf(f.date) + '</div>' +
                '</div>';
        }
        return '';
    }
    function ensureHeaderRoom(minTop) {
        var m = A().pageMargins;
        if (!m || m.top >= minTop) return;
        m.top = minTop;
        A().pageMargins = m;
        var editor = ed();
        if (editor) {
            editor.style.padding = m.top + 'px ' + m.right + 'px ' + m.bottom + 'px ' + m.left + 'px';
            editor.style.setProperty('--pad-top', m.top + 'px');
            editor.style.setProperty('--pad-right', m.right + 'px');
            editor.style.setProperty('--pad-bottom', m.bottom + 'px');
            editor.style.setProperty('--pad-left', m.left + 'px');
            editor.style.setProperty('--write-h', Math.max(80, pageH() - m.top - m.bottom) + 'px');
        }
        try { localStorage.setItem('abeneMargins', JSON.stringify(m)); } catch (err) {}
        if (typeof initRuler === 'function') initRuler();
    }

    window.showHeaderGallery = function (ev) {
        var f = document.getElementById('ribbonFlyout');
        if (!f || !ev) return;
        var co = A().companyData || {};
        var nm = escapeHf(co.name || 'Genius Raros');
        var ic = escapeHf(co.iconUrl || 'branding/icon_48.svg');
        var cur = headerTplId();
        function card(id, label, preview, featured) {
            var on = cur === id || (id === 'text' && (cur === 'text' || cur === 'company')) ? ' on' : '';
            return '<button type="button" class="hf-gal-card' + on + (featured ? ' featured' : '') + '" onclick="applyHeaderTemplate(\'' + id + '\')">' +
                '<div class="hf-gal-preview">' + preview + '</div>' +
                '<div class="hf-gal-label">' + label + '</div></button>';
        }
        f.classList.add('hf-gallery-fly');
        f.innerHTML =
            '<div class="hf-gal-title">' + tt('hfGallery') + '</div>' +
            (typeof window.abeneHfSectionMenuHtml === 'function' ? window.abeneHfSectionMenuHtml() : '') +
            '<div class="hf-gal-grid">' +
            card('gr-report', tt('hfTplReport'),
                '<div class="hf-mini-report"><div class="l"><img src="' + ic + '" alt="" /><b>' + nm + '</b></div>' +
                '<div class="r"><b>' + escapeHf(tt('hfTplReportTitle')) + '</b><span>Nº GR-RAP-…</span><span>' + escapeHf(tt('hfDatePrefix')) + '…</span></div></div>', true) +
            card('blank', tt('hfTplBlank'), '<div class="hf-mini-blank"></div>') +
            card('text', tt('hfTplCompany'), '<div class="hf-mini-center">' + nm + '</div>') +
            card('centered', tt('hfTplCentered'), '<div class="hf-mini-center">' + escapeHf((A().documentState && A().documentState.name) || tt('pHeaderDef')) + '</div>') +
            card('gr-letter', tt('hfTplLetter'),
                '<div class="hf-mini-letter"><div class="l"><img src="' + ic + '" alt="" /><span>' + nm + '</span></div>' +
                '<div class="r"><b>' + escapeHf(tt('hfTplLetterTitle')) + '</b><div>' + escapeHf(tt('hfDatePrefix')) + '…</div></div></div>') +
            card('triple', tt('hfTplTriple'),
                '<div class="hf-mini-triple"><span>' + nm + '</span><span>' + escapeHf(tt('pHeaderDef')) + '</span><span>' + escapeHf(tt('hfDatePrefix')) + '…</span></div>') +
            '</div>';
        f.classList.add('visible');
        var r = (ev.currentTarget || ev.target).getBoundingClientRect();
        var left = r.left;
        if (left + 500 > window.innerWidth) left = Math.max(8, window.innerWidth - 510);
        f.style.left = left + 'px';
        f.style.top = r.bottom + 'px';
        ev.stopPropagation();
    };

    window.applyHeaderTemplate = function (id, opts) {
        opts = opts || {};
        hideFly();
        if (!opts.silent && window._abeneHf && typeof window.abeneCloseHeaderFooter === 'function') {
            window.abeneCloseHeaderFooter();
        }
        var co = A().companyData || {};
        var name = co.name || 'Genius Raros';
        var tpl = id || 'blank';
        if (tpl === 'company') tpl = 'text';
        A().pageHeaderTemplate = tpl;
        if (tpl === 'blank') {
            A().pageHeaderText = '';
        } else if (tpl === 'text') {
            A().pageHeaderText = name;
        } else if (tpl === 'centered') {
            A().pageHeaderText = (A().documentState && A().documentState.name) || tt('pHeaderDef') || name;
        } else {
            var fields = headerFieldsFor(tpl);
            var def = defaultHeaderFields(tpl);
            fields.title = def.title;
            A().pageHeaderFields = fields;
            A().pageHeaderText = fields.title;
            if (tpl === 'gr-report' || tpl === 'gr-letter') ensureHeaderRoom(118);
        }
        persistHeaderState();
        window._abeneChromeSig = '';
        var editor = ed();
        if (editor) editor.querySelectorAll('.document-header').forEach(function (el) { el.remove(); });
        if (typeof refreshPagination === 'function') refreshPagination();
        else if (typeof window.renderPageDecorations === 'function') window.renderPageDecorations();
        if (typeof saveUndoState === 'function') saveUndoState();
        if (!opts.silent && tpl !== 'blank' && window.abeneActivateHeaderFooter) window.abeneActivateHeaderFooter('header');
    };

    window.renderPageDecorations = function () {
        var editor = ed();
        if (!editor) return;
        if (window._abeneRulerDrag) {
            liveSyncChromeMargins(A().pageMargins || {});
            return;
        }
        editor.querySelectorAll('.page-decoration, .page-header-zone, .page-footer-zone, .page-gap-band').forEach(function (el) { el.remove(); });
        if (editor.classList.contains('editing-header-footer')) return;
        var pageHeight = pageH();
        var pageWidth = pageW();
        var pages = window.abeneFitEditorSheets ? window.abeneFitEditorSheets(editor) : Math.max(1, Math.ceil(editor.scrollHeight / pageHeight));
        var m = A().pageMargins || { top: 96, bottom: 96, left: 96, right: 96 };
        editor.style.setProperty('--page-w', pageWidth + 'px');
        editor.style.setProperty('--page-h', pageHeight + 'px');
        editor.style.setProperty('--pad-top', m.top + 'px');
        editor.style.setProperty('--pad-right', m.right + 'px');
        editor.style.setProperty('--pad-bottom', m.bottom + 'px');
        editor.style.setProperty('--pad-left', m.left + 'px');
        editor.style.setProperty('--write-h', Math.max(80, pageHeight - m.top - m.bottom) + 'px');
        var header = A().pageHeaderText || '';
        var footer = A().pageFooterText;
        if (footer === undefined || footer === null) footer = tt('defaultFooter') || 'Página {PAGE} / {NUMPAGES}';
        var co = A().companyData || {};
        var brandName = co.name || 'Genius Raros';
        var brandIcon = co.iconUrl || 'branding/icon_48.svg';
        var tpl = headerTplId();
        var fieldsSig = '';
        try { fieldsSig = JSON.stringify(A().pageHeaderFields || {}); } catch (err) { fieldsSig = ''; }
        var chrome = document.getElementById('pageChrome');
        if (!chrome) {
            chrome = document.createElement('div');
            chrome.id = 'pageChrome';
            chrome.className = 'page-chrome';
            editor.parentNode.appendChild(chrome);
        }
        if (A().documentState && A().documentState.pagination === false) {
            chrome.innerHTML = '';
            window._abeneChromeSig = '';
            return;
        }
        var secHf = window.ABENE && window.ABENE.Sections && typeof window.ABENE.Sections.hfForPage === 'function';
        var secSig = (secHf && window.ABENE.Sections.chromeSig) ? window.ABENE.Sections.chromeSig(pages) : '';
        var sig = [pages, pageHeight, pageWidth, m.top, m.bottom, m.left, m.right, header, footer, brandName, brandIcon, tpl, fieldsSig, A().pageHeaderDifferentFirst ? '1' : '0', 'seam' + PAGE_SEAM, secSig].join('|');
        if (window._abeneChromeSig === sig && chrome.childNodes.length) {
            drawVerticalRuler(pages);
            return;
        }
        window._abeneChromeSig = sig;
        var PAGE_GAP = PAGE_SEAM;
        var cssVars = '--ml:' + ((m.left || 0) + (Number(A().pageGutter) || 0)) + 'px;--mr:' + m.right + 'px';
        chrome.style.width = pageWidth + 'px';
        chrome.style.height = (pages * pageHeight) + 'px';
        var html = '';
        for (var page = 0; page < pages; page++) {
            var pageTop = page * pageHeight;
            var n = page + 1;
            var pageHf = secHf ? window.ABENE.Sections.hfForPage(page, pages) : null;
            var pageHeader = pageHf ? pageHf.header : header;
            var pageFooter = pageHf ? pageHf.footer : footer;
            if (!pageHf && (pageFooter === undefined || pageFooter === null)) pageFooter = footer;
            var hideFirst = pageHf ? !!pageHf.hideFirst : (!!A().pageHeaderDifferentFirst && page === 0);
            var pageTpl = (pageHf && pageHf.template) || tpl;
            var structured = isStructuredHeader(pageTpl);
            var savedFields = A().pageHeaderFields;
            if (pageHf && pageHf.fields) A().pageHeaderFields = pageHf.fields;
            var hHtml = hideFirst ? '' : hfInner('header', pageHeader, n, pages, pageTpl);
            var fHtml = hideFirst ? { main: '', right: '' } : hfInner('footer', pageFooter, n, pages);
            if (pageHf && pageHf.fields) A().pageHeaderFields = savedFields;
            var brand = (!structured && !hideFirst && page > 0)
                ? '<span class="hf-brand"><img src="' + escapeHf(brandIcon) + '" alt="" width="18" height="18" /><span>' + escapeHf(brandName) + '</span></span>'
                : '';
            var rowInner = structured
                ? '<div class="header-content">' + hHtml + '</div>'
                : '<div class="hf-left">' + brand + '</div><div class="hf-center"><div class="header-content">' + hHtml + '</div></div><div class="hf-right"></div>';
            var headH = (pageHf && pageHf.headerDistance != null) ? pageHf.headerDistance : m.top;
            var footH = (pageHf && pageHf.footerDistance != null) ? pageHf.footerDistance : m.bottom;
            html += '<div class="page-header-zone' + (hideFirst ? ' hf-first-blank' : '') + '" data-page="' + n + '" style="top:' + pageTop + 'px;height:' + headH + 'px;' + cssVars + '">' +
                '<div class="hf-row' + (structured ? ' hf-wide' : '') + '">' + rowInner + '</div>' +
                '<div class="hf-rule"></div><span class="hf-tab">' + tt('headerBadge') + '</span></div>';
            var seamPad = page < pages - 1 ? PAGE_GAP : 0;
            html += '<div class="page-footer-zone' + (hideFirst ? ' hf-first-blank' : '') + '" data-page="' + n + '" style="top:' + (pageTop + pageHeight - footH) + 'px;height:' + footH + 'px;--hf-seam:' + seamPad + 'px;' + cssVars + '">' +
                '<div class="hf-rule"></div><span class="hf-tab">' + tt('footerBadge') + '</span>' +
                '<div class="hf-row"><div class="hf-left"></div><div class="hf-center"><div class="footer-content">' + fHtml.main + '</div></div><div class="hf-right">' + fHtml.right + '</div></div></div>';
            if (page < pages - 1) {
                html += '<div class="page-gap-band" style="top:' + (pageTop + pageHeight - PAGE_GAP) + 'px;height:' + PAGE_GAP + 'px"></div>';
            }
        }
        chrome.innerHTML = html;
        bindHeaderFooterZones(chrome);
        drawVerticalRuler(pages);
        bindPrintLayoutOnce();
    };

    function escapeHf(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function substPageFields(text, page, total) {
        return escapeHf(text)
            .replace(/\n/g, '<br>')
            .replace(/\{PAGE\}/gi, String(page))
            .replace(/\{NUMPAGES\}/gi, String(total));
    }
    function hfInner(kind, text, page, total, tplOverride) {
        var raw = String(text || '').trim();
        if (kind === 'header') {
            var tpl = tplOverride || headerTplId();
            if (isStructuredHeader(tpl)) return renderHeaderTemplateHtml(tpl);
            if (tpl === 'blank' || !raw) return '<span class="hf-placeholder">' + tt('headerHint') + '</span>';
            return substPageFields(raw, page, total);
        }
        var hasField = /\{PAGE\}/i.test(raw);
        if (!raw) {
            return { main: '<span class="hf-placeholder">' + tt('footerHint') + '</span>', right: page + ' / ' + total };
        }
        return {
            main: substPageFields(raw, page, total),
            right: hasField ? '' : (page + ' / ' + total)
        };
    }

    function caretFromPoint(x, y) {
        if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
        var pos = document.caretPositionFromPoint && document.caretPositionFromPoint(x, y);
        if (!pos) return null;
        var r = document.createRange();
        r.setStart(pos.offsetNode, pos.offset);
        r.collapse(true);
        return r;
    }

    function chromeKindAt(x, y) {
        var el = document.elementFromPoint(x, y);
        if (el) {
            if (el.closest('.hf-close')) return 'close';
            if (el.closest('.page-header-zone')) return 'header';
            if (el.closest('.page-footer-zone')) return 'footer';
            if (el.closest('.page-gap-band')) return 'gap';
            if (el.closest('.hf-tab')) return 'tab';
        }
        return chromeKindFromGeometry(x, y);
    }

    function chromeKindFromGeometry(clientX, clientY) {
        var editor = ed();
        if (!editor) return 'body';
        var er = editor.getBoundingClientRect();
        if (!er.width || !er.height) return 'body';
        var yCss = (clientY - er.top) * (editor.offsetHeight / er.height);
        var xCss = (clientX - er.left) * (editor.offsetWidth / er.width);
        var w = pageW();
        if (xCss < -2 || xCss > w + 2 || yCss < -2) return 'body';
        var h = pageH();
        var m = A().pageMargins || { top: 96, bottom: 96, left: 96, right: 96 };
        var pageIndex = Math.floor(Math.max(0, yCss) / h);
        var pages = Math.max(1, Math.ceil(editor.scrollHeight / h));
        var yInPage = yCss - pageIndex * h;
        if (pageIndex < pages - 1 && yInPage > h - PAGE_SEAM) return 'gap';
        if (yInPage < m.top) return 'header';
        if (yInPage > h - m.bottom) return 'footer';
        return 'body';
    }

    function isTypingField(el) {
        if (!el || !el.tagName) return false;
        var tag = el.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
        if (el.isContentEditable && el.closest && !el.closest('#editor, .header-content, .footer-content, [data-hf-field]')) return true;
        return false;
    }

    function placeCaretIn(el, ev) {
        el.focus();
        var sel = window.getSelection();
        var range = null;
        if (ev) range = caretFromPoint(ev.clientX, ev.clientY);
        if (range && el.contains(range.startContainer)) {
            sel.removeAllRanges();
            sel.addRange(range);
            return;
        }
        range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(!el.textContent);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    function commitHeaderFooter() {
        var st = window._abeneHf;
        if (!st || !st.content) return;
        var hint = tt(st.type === 'footer' ? 'footerHint' : 'headerHint');
        var sec = window.ABENE && window.ABENE.Sections && typeof window.ABENE.Sections.commitFromZone === 'function'
            ? window.ABENE.Sections
            : null;
        if (st.type === 'header' && st.structured) {
            var fields = readHfFields(st.content);
            if (sec && sec.commitFromZone(st.type, { val: fields.title || '', fields: fields, structured: true, template: headerTplId() }, st.zone)) {
                return;
            }
            A().pageHeaderFields = fields;
            A().pageHeaderText = fields.title || A().pageHeaderText || '';
            persistHeaderState();
            if (sec && typeof sec.syncRootFromGlobal === 'function') sec.syncRootFromGlobal();
            return;
        }
        var val = String(st.content.innerText || '').replace(/\u200b/g, '');
        if (val.trim() === hint) val = '';
        if (sec && sec.commitFromZone(st.type, { val: val }, st.zone)) return;
        if (st.type === 'footer') {
            A().pageFooterText = val;
            try { localStorage.setItem('abeneFooter', val); } catch (err) {}
        } else {
            A().pageHeaderText = val;
            persistHeaderState();
        }
        if (sec && typeof sec.syncRootFromGlobal === 'function') sec.syncRootFromGlobal();
    }

    function decorateHfTab(zone, type) {
        var tab = zone.querySelector('.hf-tab');
        if (!tab || tab.querySelector('.hf-close')) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hf-close';
        btn.title = tt('hfCloseHint');
        btn.setAttribute('aria-label', tt('hfCloseHint'));
        btn.textContent = '✕';
        btn.addEventListener('mousedown', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
        });
        btn.addEventListener('click', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            window.abeneCloseHeaderFooter();
        });
        tab.appendChild(btn);
        tab.title = tt('hfCloseHint');
    }

    window.enterHeaderFooter = function (type, zone, ev) {
        var editor = ed();
        if (!editor || !zone) return;
        var content = zone.querySelector(type === 'footer' ? '.footer-content' : '.header-content');
        if (!content) return;
        var st = window._abeneHf;
        if (st && st.content === content && editor.classList.contains('editing-header-footer')) {
            var already = ev && ev.target && ev.target.closest && ev.target.closest('[data-hf-field]');
            placeCaretIn(already || content.querySelector('[data-hf-field]') || content, ev);
            return;
        }
        if (st && st.type && st.content !== content) commitHeaderFooter();
        editor.contentEditable = 'false';
        editor.classList.add('editing-header-footer');
        var chrome = document.getElementById('pageChrome');
        if (chrome) {
            chrome.classList.add('hf-guides-on');
            chrome.querySelectorAll('.page-header-zone, .page-footer-zone').forEach(function (z) {
                z.classList.remove('active');
                z.querySelectorAll('[contenteditable="true"]').forEach(function (old) {
                    if (old !== content && !content.contains(old)) old.contentEditable = 'false';
                });
            });
            chrome.querySelectorAll(type === 'footer' ? '.page-footer-zone' : '.page-header-zone').forEach(function (z) {
                z.classList.add('active');
                decorateHfTab(z, type);
            });
        }
        var structured = type === 'header' && isStructuredHeader();
        window._abeneHf = { type: type, zone: zone, content: content, structured: structured };
        if (structured) {
            content.contentEditable = 'false';
            var fields = content.querySelectorAll('[data-hf-field]');
            fields.forEach(function (f) {
                f.contentEditable = 'true';
                f.spellcheck = true;
            });
            content.oninput = function () {
                var live = readHfFields(content);
                if (chrome) {
                    chrome.querySelectorAll('.header-content').forEach(function (c) {
                        if (c === content) return;
                        c.querySelectorAll('[data-hf-field]').forEach(function (el) {
                            var k = el.getAttribute('data-hf-field');
                            if (k && live[k] !== undefined) el.textContent = live[k];
                        });
                    });
                }
            };
            content.onkeydown = function (event) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    window.abeneCloseHeaderFooter();
                    return;
                }
                if (event.key === 'Enter') {
                    event.preventDefault();
                    return;
                }
                if (event.key === 'Tab') {
                    event.preventDefault();
                    var list = Array.prototype.slice.call(content.querySelectorAll('[data-hf-field]'));
                    var i = list.indexOf(event.target.closest('[data-hf-field]'));
                    if (i < 0) return;
                    var next = event.shiftKey ? list[(i - 1 + list.length) % list.length] : list[(i + 1) % list.length];
                    if (next) placeCaretIn(next, null);
                }
            };
            content.onblur = null;
            var target = (ev && ev.target && ev.target.closest && ev.target.closest('[data-hf-field]')) || fields[0];
            if (target) placeCaretIn(target, ev);
            return;
        }
        var raw = type === 'footer' ? (A().pageFooterText || '') : (A().pageHeaderText || '');
        content.textContent = raw;
        content.contentEditable = 'true';
        content.spellcheck = true;
        content.oninput = function () {
            var live = content.innerText;
            var selClass = type === 'footer' ? '.footer-content' : '.header-content';
            if (chrome) {
                chrome.querySelectorAll(selClass).forEach(function (c) {
                    if (c !== content) c.textContent = live;
                });
            }
        };
        content.onkeydown = function (event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                window.abeneCloseHeaderFooter();
                return;
            }
            if (event.key === 'Tab') {
                event.preventDefault();
                runInsertText('\t');
            }
        };
        content.onblur = null;
        placeCaretIn(content, ev);
    };

    window.abeneCloseHeaderFooter = function () {
        var editor = ed();
        if (!editor) return;
        if (!editor.classList.contains('editing-header-footer') && !window._abeneHf) return;
        commitHeaderFooter();
        var st = window._abeneHf;
        if (st && st.content) {
            st.content.contentEditable = 'false';
            st.content.onkeydown = null;
            st.content.oninput = null;
            st.content.querySelectorAll('[data-hf-field]').forEach(function (f) {
                f.contentEditable = 'false';
            });
        }
        window._abeneHf = null;
        editor.contentEditable = 'true';
        editor.classList.remove('editing-header-footer');
        var chrome = document.getElementById('pageChrome');
        if (chrome) {
            chrome.classList.remove('hf-guides-on');
            chrome.querySelectorAll('.active').forEach(function (z) { z.classList.remove('active'); });
        }
        window._abeneChromeSig = '';
        if (typeof saveUndoState === 'function') saveUndoState();
        if (typeof window.renderPageDecorations === 'function') window.renderPageDecorations();
        editor.focus();
    };

    function bindHeaderFooterZones(chrome) {
        function bindZone(zone, type) {
            zone.title = tt(type === 'footer' ? 'footerHint' : 'headerHint');
            zone.addEventListener('mousedown', function (ev) {
                if (ev.target.closest('.hf-close')) return;
                var editor = ed();
                if (zone.classList.contains('active') && editor.classList.contains('editing-header-footer')) return;
                ev.preventDefault();
                ev.stopPropagation();
                if (editor.classList.contains('editing-header-footer')) {
                    window.enterHeaderFooter(type, zone, ev);
                }
            });
            zone.addEventListener('dblclick', function (ev) {
                if (ev.target.closest('.hf-close')) return;
                ev.preventDefault();
                ev.stopPropagation();
                window.enterHeaderFooter(type, zone, ev);
            });
            var tab = zone.querySelector('.hf-tab');
            if (tab) {
                tab.addEventListener('click', function (ev) {
                    if (ev.target.closest('.hf-close')) return;
                    ev.preventDefault();
                    ev.stopPropagation();
                    window.enterHeaderFooter(type, zone, ev);
                });
            }
        }
        chrome.querySelectorAll('.page-header-zone').forEach(function (zone) { bindZone(zone, 'header'); });
        chrome.querySelectorAll('.page-footer-zone').forEach(function (zone) { bindZone(zone, 'footer'); });
        chrome.querySelectorAll('.page-gap-band').forEach(function (gap) {
            gap.addEventListener('dblclick', function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
            });
        });
    }

    function placeCaretAtCss(editor, xCss, yCss) {
        var er = editor.getBoundingClientRect();
        if (!er.width || !er.height) return false;
        var x = er.left + xCss * (er.width / editor.offsetWidth);
        var y = er.top + yCss * (er.height / editor.offsetHeight);
        var caret = caretFromPoint(x, y);
        if (!caret || !editor.contains(caret.startContainer)) return false;
        window._abeneSnapping = true;
        window._abeneSnapLock = true;
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(caret);
        window._abeneSnapping = false;
        var node = caret.startContainer;
        if (node && node.nodeType !== 1) node = node.parentElement;
        if (node && node.scrollIntoView) node.scrollIntoView({ block: 'nearest' });
        requestAnimationFrame(function () { window._abeneSnapLock = false; });
        return true;
    }

    function pageIndexFromCaret() {
        var editor = ed();
        var sel = window.getSelection();
        if (!sel.rangeCount || !editor.contains(sel.anchorNode)) return 0;
        var r = sel.getRangeAt(0).getBoundingClientRect();
        var er = editor.getBoundingClientRect();
        if (!er.height) return 0;
        var yCss = (r.top - er.top) * (editor.offsetHeight / er.height);
        return Math.max(0, Math.floor(yCss / pageH()));
    }

    function jumpCaretToPageBody(pageIndex, atEnd) {
        var editor = ed();
        if (!editor) return;
        var h = pageH();
        var m = A().pageMargins || { top: 96, bottom: 96, left: 96, right: 96 };
        var pages = Math.max(1, Math.ceil(Math.max(h, editor.scrollHeight) / h));
        pageIndex = Math.max(0, Math.min(pages - 1, pageIndex));
        var yCss = atEnd
            ? (pageIndex + 1) * h - m.bottom - 10
            : pageIndex * h + m.top + 8;
        var maxY = Math.max(m.top + 8, editor.scrollHeight - 8);
        if (yCss > maxY) yCss = maxY;
        placeCaretAtCss(editor, m.left + 10, yCss);
    }

    function snapCaretToWritingZone() {
        if (window._abeneSnapping || window._abeneLayingOut || window._abenePointerDown) return;
        var editor = ed();
        if (!editor || editor.classList.contains('editing-header-footer')) return;
        if (editor.getAttribute('contenteditable') === 'false') return;
        var sel = window.getSelection();
        if (!sel.rangeCount || !sel.isCollapsed) return;
        if (!editor.contains(sel.anchorNode)) return;
        var r = sel.getRangeAt(0).getBoundingClientRect();
        if (!r || (r.top === 0 && r.bottom === 0)) return;
        var x = r.left + Math.min(4, Math.max(0, r.width / 2));
        var y = r.top + Math.min(6, Math.max(1, r.height / 2));
        var kind = chromeKindAt(x, y);
        if (kind !== 'header' && kind !== 'footer' && kind !== 'gap') return;
        if (window._abeneSnapLock) return;
        var er = editor.getBoundingClientRect();
        var yCss = (r.top - er.top) * (editor.offsetHeight / Math.max(1, er.height));
        var pageIndex = Math.max(0, Math.floor(yCss / pageH()));
        var dir = window._abeneNavDir || 0;
        if (dir > 0 && (kind === 'footer' || kind === 'gap')) {
            jumpCaretToPageBody(pageIndex + 1, false);
            return;
        }
        if (dir < 0 && (kind === 'header' || kind === 'gap')) {
            if (pageIndex <= 0) {
                jumpCaretToPageBody(0, false);
                return;
            }
            jumpCaretToPageBody(pageIndex - 1, true);
            return;
        }
        var chrome = document.getElementById('pageChrome');
        if (!chrome) return;
        var el = document.elementFromPoint(x, y);
        var band = el && (el.closest('.page-header-zone') || el.closest('.page-footer-zone') || el.closest('.page-gap-band'));
        if (!band) return;
        var br = band.getBoundingClientRect();
        var m = A().pageMargins || { left: 96, right: 96 };
        var targetY = kind === 'header' || (kind === 'gap' && br.bottom > y)
            ? br.bottom + 8
            : br.top - 8;
        var targetX = editor.getBoundingClientRect().left + m.left + 8;
        var caret = caretFromPoint(targetX, targetY);
        if (!caret || !editor.contains(caret.startContainer)) return;
        window._abeneSnapping = true;
        window._abeneSnapLock = true;
        sel.removeAllRanges();
        sel.addRange(caret);
        window._abeneSnapping = false;
        requestAnimationFrame(function () { window._abeneSnapLock = false; });
    }

    function isCaretAtEdge(el, atEnd) {
        var sel = window.getSelection();
        if (!sel.rangeCount || !sel.isCollapsed) return false;
        var r = sel.getRangeAt(0);
        if (!el.contains(r.startContainer)) return false;
        var edge = document.createRange();
        edge.selectNodeContents(el);
        edge.collapse(!atEnd);
        return r.compareBoundaryPoints(Range.START_TO_START, edge) === 0;
    }

    function visibleLen(s) {
        return String(s || '').replace(/[\u200b\u00a0]/g, ' ').replace(/\s+/g, ' ').trim().length;
    }

    function editorTopChild(el, editor) {
        var n = el;
        while (n && n.parentElement && n.parentElement !== editor) n = n.parentElement;
        return n && n.parentElement === editor ? n : null;
    }

    function skipFlowSibling(el, dir) {
        var sib = el;
        while (sib && sib.classList && sib.classList.contains('abene-page-flow')) {
            sib = dir < 0 ? sib.previousElementSibling : sib.nextElementSibling;
        }
        return sib;
    }

    function isAtomicEl(el) {
        if (!el || el.nodeType !== 1) return false;
        if (el.id === 'editor') return false;
        if (el.classList.contains('abene-page-flow')) return false;
        if (el.classList.contains('abene-footnotes') || el.getAttribute('data-abene-notes') === 'footnotes') return false;
        if (el.classList.contains('abene-img-anchor')) return false;
        if (el.classList.contains('abene-obj-free') || el.classList.contains('abene-obj-behind') || el.classList.contains('abene-obj-front')) return false;
        if (el.classList.contains('page-break-marker')) return true;
        if (el.classList.contains('abene-section-break')) return true;
        if (el.classList.contains('watermark') || el.classList.contains('abene-wm')) return true;
        if (el.tagName === 'IMG') return true;
        if (el.classList.contains('abene-drop-cap') || el.classList.contains('drop-cap')) return true;
        var blk = el.getAttribute('data-abene-block');
        if (blk === 'cover' || blk === 'titlepage' || blk === 'toc' || blk === 'annex' ||
            blk === 'body-logo' || blk === 'confidential' || blk === 'signs' ||
            blk === 'devis' || blk === 'receipt') return true;
        if (el.classList.contains('abene-paper-locked')) return true;
        if (el.getAttribute('data-abene-status') === 'final' && el.hasAttribute('data-abene-block')) return true;
        if (el.getAttribute('contenteditable') === 'false' && !el.closest('table')) return true;
        return false;
    }

    function removeAtomic(el) {
        if (!el) return;
        var next = el.nextElementSibling;
        var prev = el.previousElementSibling;
        var isModel = el.getAttribute && (el.getAttribute('data-abene-break') === 'model' ||
            /^(cover|titlepage|toc|annex)$/.test(el.getAttribute('data-abene-block') || ''));
        el.remove();
        if (isModel) {
            var side = next;
            while (side && side.classList && side.classList.contains('abene-page-flow')) {
                var n = side.nextElementSibling;
                side.remove();
                side = n;
            }
            if (side && side.classList && side.classList.contains('page-break-marker') &&
                side.getAttribute('data-abene-break') === 'model') {
                side.remove();
            }
            side = prev;
            while (side && side.classList && side.classList.contains('abene-page-flow')) {
                var p = side.previousElementSibling;
                if (side.parentNode) side.remove();
                side = p;
            }
        }
    }

    function rangeFullyContains(range, el) {
        try {
            var r = document.createRange();
            r.selectNode(el);
            return range.compareBoundaryPoints(Range.START_TO_START, r) <= 0 &&
                range.compareBoundaryPoints(Range.END_TO_END, r) >= 0;
        } catch (err) {
            return false;
        }
    }

    function isEditableModelBlock(el) {
        if (!el || !el.getAttribute) return false;
        var blk = el.getAttribute('data-abene-block');
        return blk === 'cover' || blk === 'titlepage' || blk === 'toc' || blk === 'annex' ||
            blk === 'signs' || blk === 'confidential' || blk === 'body-logo';
    }

    function rangeHitsBlocker(range, editor) {
        var list = editor.querySelectorAll('.abene-page-flow, .page-break-marker, .watermark, .abene-wm, img, [contenteditable="false"], [data-abene-block]');
        var i;
        for (i = 0; i < list.length; i++) {
            var el = list[i];
            if (el === editor) continue;
            if (el.closest && el.closest('.page-header-zone, .page-footer-zone, .page-chrome')) continue;
            try {
                if (!range.intersectsNode(el)) continue;
            } catch (err) { continue; }
            if (el.classList.contains('abene-page-flow') || el.classList.contains('page-break-marker')) return el;
            if (isEditableModelBlock(el)) {
                if (rangeFullyContains(range, el)) return el;
                continue;
            }
            if (isAtomicEl(el)) return el;
        }
        return null;
    }

    function caretAtContentEdge(block, atStart) {
        var sel = window.getSelection();
        if (!sel.rangeCount || !sel.isCollapsed || !block) return false;
        var r = sel.getRangeAt(0);
        if (!block.contains(r.startContainer) && r.startContainer !== block) return false;
        try {
            var slice = document.createRange();
            slice.selectNodeContents(block);
            if (atStart) slice.setEnd(r.startContainer, r.startOffset);
            else slice.setStart(r.startContainer, r.startOffset);
            return !visibleLen(slice.toString());
        } catch (err) {
            return false;
        }
    }

    function mergeEditorBlocks(prev, block) {
        var marker = document.createTextNode('\u200b');
        prev.appendChild(marker);
        while (block.firstChild) prev.appendChild(block.firstChild);
        block.remove();
        var sel = window.getSelection();
        var r = document.createRange();
        r.setStart(marker, 0);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
        if (marker.parentNode) marker.parentNode.removeChild(marker);
    }

    function pruneEmptyModelBlocks(editor) {
        editor.querySelectorAll('[data-abene-block="cover"], [data-abene-block="titlepage"], [data-abene-block="toc"], [data-abene-block="annex"], [data-abene-block="confidential"], [data-abene-block="signs"]').forEach(function (el) {
            if (visibleLen(el.innerText) > 1) return;
            var brk = el.nextElementSibling;
            el.remove();
            while (brk && brk.classList && brk.classList.contains('abene-page-flow')) {
                var n = brk.nextElementSibling;
                brk.remove();
                brk = n;
            }
            if (brk && brk.classList && brk.classList.contains('page-break-marker') &&
                brk.getAttribute('data-abene-break') === 'model') brk.remove();
        });
    }

    function afterEditorDelete(editor) {
        pruneEmptyModelBlocks(editor);
        if (!editor.innerHTML.replace(/\s|&nbsp;|<br\s*\/?>/gi, '').trim()) editor.innerHTML = '<p class="abene-normal"><br></p>';
        if (typeof saveUndoState === 'function') saveUndoState();
        if (typeof onEditorInput === 'function') onEditorInput();
        else if (window.abeneSchedulePageFlow) window.abeneSchedulePageFlow();
        else if (typeof refreshPagination === 'function') refreshPagination();
    }

    function imageBesideCaret(forward) {
        var sel = window.getSelection();
        if (!sel.rangeCount || !sel.isCollapsed) return null;
        var r = sel.getRangeAt(0);
        var n = r.startContainer;
        function skipEmpty(node, dir) {
            while (node && ((node.nodeType === 3 && !visibleLen(node.textContent)) || (node.nodeType === 1 && node.tagName === 'BR'))) {
                node = dir < 0 ? node.previousSibling : node.nextSibling;
            }
            return node;
        }
        if (n.nodeType === 3) {
            if (!forward && r.startOffset === 0) {
                var p = skipEmpty(n.previousSibling, -1);
                if (p && p.tagName === 'IMG') return p;
            }
            if (forward && r.startOffset === n.textContent.length) {
                var nx = skipEmpty(n.nextSibling, 1);
                if (nx && nx.tagName === 'IMG') return nx;
            }
            return null;
        }
        if (n.nodeType === 1) {
            var child = n.childNodes[r.startOffset];
            if (forward) {
                child = skipEmpty(child, 1);
                if (child && child.tagName === 'IMG') return child;
            } else {
                var prev = skipEmpty(n.childNodes[r.startOffset - 1], -1);
                if (prev && prev.tagName === 'IMG') return prev;
            }
        }
        return null;
    }

    function handleEditorDelete(e) {
        if (e.key !== 'Backspace' && e.key !== 'Delete') return false;
        if (e.altKey || e.ctrlKey || e.metaKey) return false;
        if (document.body.classList.contains('abene-excel-mode')) return false;
        if (isTypingField(e.target)) return false;
        var editor = ed();
        if (!editor || editor.classList.contains('editing-header-footer')) return false;
        if (editor.getAttribute('contenteditable') === 'false') return false;
        if (A().documentState && A().documentState.protected) return false;
        var sel = window.getSelection();
        if (!sel.rangeCount) return false;
        if (!editor.contains(sel.anchorNode) && sel.anchorNode !== editor) return false;
        var forward = e.key === 'Delete';
        var selectedImg = editor.querySelector('img.selected');
        if (selectedImg) {
            e.preventDefault();
            selectedImg.remove();
            afterEditorDelete(editor);
            return true;
        }
        var edgeImg = imageBesideCaret(forward);
        if (edgeImg && editor.contains(edgeImg)) {
            e.preventDefault();
            edgeImg.remove();
            afterEditorDelete(editor);
            return true;
        }

        if (!sel.isCollapsed) {
            var range = sel.getRangeAt(0);
            if (!rangeHitsBlocker(range, editor)) return false;
            e.preventDefault();
            editor.querySelectorAll('.abene-page-flow, .page-break-marker, .watermark, .abene-wm, img, [contenteditable="false"], [data-abene-block]').forEach(function (el) {
                if (el === editor) return;
                try {
                    if (!range.intersectsNode(el)) return;
                } catch (err) { return; }
                if (isEditableModelBlock(el) && !rangeFullyContains(range, el)) return;
                if (el.classList.contains('abene-page-flow')) el.remove();
                else if (isAtomicEl(el)) removeAtomic(el);
            });
            try {
                var now = window.getSelection();
                if (now.rangeCount && !now.isCollapsed) now.getRangeAt(0).deleteContents();
            } catch (err2) {}
            afterEditorDelete(editor);
            return true;
        }

        var node = sel.anchorNode;
        if (node && node.nodeType !== 1) node = node.parentElement;
        if (!node) return false;
        var locked = node.closest && node.closest('.abene-paper-locked, [data-abene-status="final"]');
        if (locked && locked !== editor && editor.contains(locked) && locked.getAttribute('contenteditable') === 'false') {
            e.preventDefault();
            removeAtomic(locked);
            afterEditorDelete(editor);
            return true;
        }
        var ceFalse = node.closest && node.closest('[contenteditable="false"]');
        if (ceFalse && ceFalse !== editor && editor.contains(ceFalse) && !ceFalse.closest('table')) {
            e.preventDefault();
            removeAtomic(ceFalse.closest('[data-abene-block]') || ceFalse);
            afterEditorDelete(editor);
            return true;
        }

        var top = editorTopChild(node, editor);
        if (!top) return false;
        var atStart = caretAtContentEdge(top, true);
        var atEnd = caretAtContentEdge(top, false);

        if (!forward && atStart) {
            var prev = skipFlowSibling(top.previousElementSibling, -1);
            if (prev && isAtomicEl(prev)) {
                e.preventDefault();
                removeAtomic(prev);
                afterEditorDelete(editor);
                return true;
            }
            if (prev && prev !== top && !isAtomicEl(prev) && prev.tagName !== 'TABLE') {
                var between = top.previousElementSibling;
                var hadFlow = between && between.classList.contains('abene-page-flow');
                if (hadFlow) {
                    e.preventDefault();
                    while (top.previousElementSibling && top.previousElementSibling.classList.contains('abene-page-flow')) {
                        top.previousElementSibling.remove();
                    }
                    mergeEditorBlocks(prev, top);
                    afterEditorDelete(editor);
                    return true;
                }
            }
        }
        if (forward && atEnd) {
            var next = skipFlowSibling(top.nextElementSibling, 1);
            if (next && isAtomicEl(next)) {
                e.preventDefault();
                removeAtomic(next);
                afterEditorDelete(editor);
                return true;
            }
            if (next && next !== top && !isAtomicEl(next) && next.tagName !== 'TABLE') {
                var nextBetween = top.nextElementSibling;
                if (nextBetween && nextBetween.classList.contains('abene-page-flow')) {
                    e.preventDefault();
                    while (top.nextElementSibling && top.nextElementSibling.classList.contains('abene-page-flow')) {
                        top.nextElementSibling.remove();
                    }
                    mergeEditorBlocks(top, next);
                    afterEditorDelete(editor);
                    return true;
                }
            }
        }
        return false;
    }

    window.abeneOnEditorNav = function (e) {
        if (document.body.classList.contains('abene-excel-mode')) return;
        if (isTypingField(e.target)) return;
        var editor = ed();
        if (!editor) return;
        var nav = { ArrowDown: 1, ArrowUp: -1, ArrowRight: 1, ArrowLeft: -1, PageDown: 1, PageUp: -1 };
        if (editor.classList.contains('editing-header-footer')) {
            if (e.key === 'ArrowDown' && window._abeneHf && window._abeneHf.type === 'header' && isCaretAtEdge(window._abeneHf.content, true)) {
                var chrome = document.getElementById('pageChrome');
                var zone = chrome && chrome.querySelector('.page-footer-zone');
                if (zone) { e.preventDefault(); window.enterHeaderFooter('footer', zone); }
            }
            if (e.key === 'ArrowUp' && window._abeneHf && window._abeneHf.type === 'footer' && isCaretAtEdge(window._abeneHf.content, false)) {
                var chromeUp = document.getElementById('pageChrome');
                var hzone = chromeUp && chromeUp.querySelector('.page-header-zone');
                if (hzone) { e.preventDefault(); window.enterHeaderFooter('header', hzone); }
            }
            return;
        }
        if (!nav[e.key]) return;
        if ((e.ctrlKey || e.metaKey) && (e.key === 'PageDown' || e.key === 'PageUp')) {
            e.preventDefault();
            var cur = pageIndexFromCaret();
            jumpCaretToPageBody(e.key === 'PageDown' ? cur + 1 : cur - 1, e.key === 'PageUp');
            return;
        }
        window._abeneNavDir = nav[e.key];
        requestAnimationFrame(function () {
            snapCaretToWritingZone();
            setTimeout(function () { window._abeneNavDir = 0; }, 80);
        });
    };

    var SHORTCUTS = {
        'en-US': { b: 'bold', i: 'italic', u: 'underline', s: 'save', n: 'new', o: 'open', p: 'print', f: 'find', h: 'replace', g: 'goto', a: 'selectAll', k: 'link', l: 'left', e: 'center', r: 'right', j: 'justify', d: 'font', z: 'undo', y: 'redo', x: 'cut', c: 'copy', v: 'paste' },
        'fr-FR': { g: 'bold', i: 'italic', u: 'underline', s: 'save', n: 'new', o: 'open', a: 'selectAll', f: 'find', h: 'replace', p: 'print', b: 'goto', z: 'undo', y: 'redo', x: 'cut', c: 'copy', v: 'paste', e: 'center', j: 'justify', d: 'font', k: 'link' },
        'pt-PT': { n: 'bold', i: 'italic', s: 'underline', b: 'save', o: 'new', a: 'open', t: 'selectAll', l: 'find', h: 'replace', p: 'print', z: 'undo', y: 'redo', x: 'cut', c: 'copy', v: 'paste', e: 'center', j: 'justify', q: 'left', r: 'right', d: 'font', k: 'link' },
        'es-ES': { n: 'bold', k: 'italic', i: 'italic', s: 'underline', g: 'save', u: 'new', a: 'open', t: 'selectAll', b: 'find', h: 'replace', p: 'print', z: 'undo', y: 'redo', x: 'cut', c: 'copy', v: 'paste', e: 'center', j: 'justify', q: 'left', d: 'font' }
    };

    function runShortcutAction(name) {
        if (name === 'bold') runExec('bold');
        else if (name === 'italic') runExec('italic');
        else if (name === 'underline') runExec('underline');
        else if (name === 'cut') runExec('cut');
        else if (name === 'copy') runExec('copy');
        else if (name === 'paste' && typeof pasteContent === 'function') pasteContent();
        else if (name === 'selectAll' && typeof selectAll === 'function') selectAll();
        else if (name === 'undo' && typeof undo === 'function') undo();
        else if (name === 'redo' && typeof redo === 'function') redo();
        else if (name === 'save' && typeof openSaveChooser === 'function') openSaveChooser();
        else if (name === 'save' && typeof saveDocument === 'function') saveDocument();
        else if (name === 'new' && typeof newDocument === 'function') newDocument();
        else if (name === 'open' && typeof openFile === 'function') openFile();
        else if (name === 'print' && typeof printDocument === 'function') printDocument();
        else if (name === 'find' && typeof openFindReplace === 'function') openFindReplace('find');
        else if (name === 'replace' && typeof openFindReplace === 'function') openFindReplace('replace');
        else if (name === 'goto' && typeof openFindReplace === 'function') openFindReplace('goto');
        else if (name === 'link' && typeof insertLink === 'function') insertLink();
        else if (name === 'left') runExec('justifyLeft');
        else if (name === 'center') runExec('justifyCenter');
        else if (name === 'right') runExec('justifyRight');
        else if (name === 'justify') runExec('justifyFull');
        else if (name === 'font' && typeof openFontDialog === 'function') openFontDialog();
        else if (name === 'pageBreak' && typeof insertPageBreak === 'function') insertPageBreak();
        else return false;
        return true;
    }

    window.abeneDispatchShortcut = function (e) {
        if (document.body.classList.contains('abene-excel-mode')) return false;
        if (isTypingField(e.target)) return false;
        var lang = localStorage.getItem('abeneLanguage') || 'pt-PT';
        var map = SHORTCUTS[lang] || SHORTCUTS['pt-PT'];
        var k = e.key.toLowerCase();
        if (e.key === 'Enter') {
            var edEl = ed();
            if (edEl && edEl.classList.contains('editing-header-footer')) return false;
            e.preventDefault();
            e.stopPropagation();
            return runShortcutAction('pageBreak');
        }
        if (e.shiftKey && lang === 'fr-FR') {
            if (k === 'g') { e.preventDefault(); runExec('justifyLeft'); return true; }
            if (k === 'd') { e.preventDefault(); runExec('justifyRight'); return true; }
        }
        if (e.shiftKey) return false;
        var action = map[k];
        if (!action) return false;
        e.preventDefault();
        e.stopPropagation();
        return runShortcutAction(action);
    };

    function tryClickAndType(e) {
        var editor = ed();
        if (!editor || editor.classList.contains('editing-header-footer')) return false;
        if (e.target.closest && e.target.closest('img, table, a, button, .page-header-zone, .page-footer-zone, .page-gap-band')) return false;
        var hit = e.target;
        if (hit && hit !== editor) {
            var block = hit.closest && hit.closest('p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, pre');
            if (block && visibleLen(block.innerText || block.textContent)) return false;
        }
        var sel = window.getSelection();
        if (sel.rangeCount && !sel.isCollapsed && editor.contains(sel.anchorNode)) {
            var picked = sel.toString().replace(/\s/g, '');
            if (picked.length) return false;
        }
        var last = editor.lastElementChild;
        while (last && last.classList.contains('abene-page-flow')) last = last.previousElementSibling;
        if (!last) return false;
        var er = editor.getBoundingClientRect();
        if (!er.width || !er.height) return false;
        var yCss = (e.clientY - er.top) * (editor.offsetHeight / er.height);
        var xCss = (e.clientX - er.left) * (editor.offsetWidth / er.width);
        var lastBottom = last.offsetTop + last.offsetHeight;
        if (yCss < lastBottom + 8) return false;
        var m = A().pageMargins || { top: 96, bottom: 96, left: 96, right: 96 };
        var h = pageH();
        var yInPage = yCss - Math.floor(Math.max(0, yCss) / h) * h;
        if (yInPage < m.top || yInPage > h - m.bottom) return false;
        var writingW = Math.max(40, pageW() - m.left - m.right);
        var xIn = xCss - m.left;
        var align = 'left';
        if (xIn > writingW * 2 / 3) align = 'right';
        else if (xIn > writingW / 3) align = 'center';
        e.preventDefault();
        var pageIndex = Math.floor(yCss / h);
        var maxY = (pageIndex * h) + h - m.bottom - 16;
        var targetY = Math.min(yCss, maxY);
        var guard = 0;
        while (last.offsetTop + last.offsetHeight < targetY && guard < 80) {
            var p = document.createElement('p');
            p.className = 'abene-normal';
            p.innerHTML = '<br>';
            p.style.textAlign = align;
            editor.appendChild(p);
            last = p;
            guard++;
        }
        last.style.textAlign = align;
        var range = document.createRange();
        range.selectNodeContents(last);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        editor.focus();
        if (typeof saveUndoState === 'function') saveUndoState();
        if (window.abeneSchedulePageFlow) window.abeneSchedulePageFlow();
        return true;
    }

    function bindPrintLayoutOnce() {
        if (window._abenePLBound) return;
        window._abenePLBound = true;
        var editor = ed();
        if (!editor) return;
        editor.addEventListener('dblclick', function (e) {
            if (editor.classList.contains('editing-header-footer')) {
                e.preventDefault();
                window.abeneCloseHeaderFooter();
                return;
            }
            var kind = chromeKindAt(e.clientX, e.clientY);
            if (kind === 'header' || kind === 'footer') {
                e.preventDefault();
                var chrome = document.getElementById('pageChrome');
                var zone = chrome && chrome.querySelector(kind === 'footer' ? '.page-footer-zone' : '.page-header-zone');
                if (zone && window.enterHeaderFooter) window.enterHeaderFooter(kind, zone, e);
                return;
            }
            if (tryClickAndType(e)) return;
        });
        editor.addEventListener('mousedown', function (e) {
            if (editor.classList.contains('editing-header-footer')) {
                e.preventDefault();
            }
        });
        editor.addEventListener('input', function (e) {
            if (!e.inputType || e.inputType.indexOf('delete') < 0) return;
            pruneEmptyModelBlocks(editor);
        });
    }

    window.abeneActivateHeaderFooter = function (type) {
        var chrome = document.getElementById('pageChrome');
        if (!chrome) return;
        var zone = chrome.querySelector(type === 'footer' ? '.page-footer-zone' : '.page-header-zone');
        if (!zone) return;
        window.enterHeaderFooter(type, zone);
    };

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.ribbon-flyout') && !e.target.closest('.ribbon-btn-sm') && !e.target.closest('.ribbon-btn')) hideFly();
    });
    document.addEventListener('selectionchange', function () {
        if (window._abeneNavDir) snapCaretToWritingZone();
        window.updateRulerFromSelection && window.updateRulerFromSelection();
        var sel = window.getSelection();
        var mini = document.getElementById('miniToolbar');
        if (!mini) return;
        var editor = ed();
        if (editor && editor.classList.contains('editing-header-footer')) {
            mini.classList.remove('visible');
            return;
        }
        if (sel.rangeCount && !sel.isCollapsed && ed().contains(sel.anchorNode)) {
            var r = sel.getRangeAt(0).getBoundingClientRect();
            mini.style.left = r.left + 'px';
            mini.style.top = Math.max(8, r.top - 40) + 'px';
            mini.classList.add('visible');
        } else mini.classList.remove('visible');
        var size = document.getElementById('fontSize');
        if (size && sel.anchorNode && ed().contains(sel.anchorNode)) {
            var p = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
            if (p) {
                var pt = Math.round(parseFloat(getComputedStyle(p).fontSize) * 72 / 96);
                if (pt) size.value = String(pt);
            }
        }
    });
    document.addEventListener('mouseup', function (e) {
        if (!window.isFormatPainterActive || !window.savedFormat) return;
        if (e.target && e.target.closest && e.target.closest('#btnFormatPainter, .ribbon-btn, .ribbon-btn-sm, .mini-toolbar, .title-bar')) return;
        var sel = window.getSelection();
        if (sel.rangeCount && !sel.isCollapsed) {
            var range = sel.getRangeAt(0);
            var span = document.createElement('span');
            var f = window.savedFormat;
            span.style.fontFamily = f.fontFamily;
            span.style.fontSize = f.fontSize;
            span.style.fontWeight = f.fontWeight;
            span.style.fontStyle = f.fontStyle;
            span.style.color = f.color;
            if (f.textDecoration) span.style.textDecoration = f.textDecoration;
            if (f.backgroundColor && f.backgroundColor !== 'rgba(0, 0, 0, 0)' && f.backgroundColor !== 'transparent') {
                span.style.backgroundColor = f.backgroundColor;
            }
            span.appendChild(range.extractContents());
            range.insertNode(span);
            var block = getBlock();
            if (block) {
                if (f.textAlign) block.style.textAlign = f.textAlign;
                if (f.lineHeight) block.style.lineHeight = f.lineHeight;
                if (f.marginLeft) block.style.marginLeft = f.marginLeft;
                if (f.textIndent) block.style.textIndent = f.textIndent;
            }
        }
        if (!formatPainterLocked) {
            window.isFormatPainterActive = false;
            document.body.style.cursor = 'default';
            var btn = document.getElementById('btnFormatPainter');
            if (btn) btn.classList.remove('active');
        }
        if (typeof saveUndoState === 'function') saveUndoState();
    });
    document.addEventListener('mousedown', function () { window._abenePointerDown = true; }, true);
    document.addEventListener('mouseup', function () {
        requestAnimationFrame(function () { window._abenePointerDown = false; });
    });
    document.addEventListener('keydown', function (e) {
        var editor = ed();
        var inEditor = editor && (document.activeElement === editor || editor.contains(document.activeElement) || (document.activeElement && document.activeElement.closest && document.activeElement.closest('.header-content, .footer-content')));
        if (e.key === 'Escape') {
            formatPainterLocked = false;
            window.isFormatPainterActive = false;
            document.body.style.cursor = 'default';
            hideFly();
            if (typeof closeAllDropdowns === 'function') closeAllDropdowns();
            if (window.abeneCloseHeaderFooter) window.abeneCloseHeaderFooter();
            return;
        }
        if (e.key === 'F5' && inEditor) {
            e.preventDefault();
            if (typeof openFindReplace === 'function') openFindReplace('goto');
            return;
        }
        if (inEditor && !document.body.classList.contains('abene-excel-mode')) window.abeneOnEditorNav(e);
        if (!inEditor) return;
        if (document.body.classList.contains('abene-excel-mode')) return;
        if (handleEditorDelete(e)) return;
        if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            requestAnimationFrame(function () {
                if (window.abeneSchedulePageFlow) window.abeneSchedulePageFlow();
            });
        }
        if (e.key === 'Tab' && !e.ctrlKey) {
            var liTab = document.activeElement && document.activeElement.closest && document.activeElement.closest('li');
            if (!liTab) {
                var selTab = window.getSelection();
                var nTab = selTab && selTab.anchorNode;
                if (nTab && nTab.nodeType !== 1) nTab = nTab.parentElement;
                liTab = nTab && nTab.closest && nTab.closest('#editor li');
            }
            if (liTab && editor.contains(liTab)) {
                e.preventDefault();
                runExec(e.shiftKey ? 'outdent' : 'indent');
                if (typeof saveUndoState === 'function') saveUndoState();
                return;
            }
            if (currentTabStops.length) {
            e.preventDefault();
            var span = document.createElement('span');
            span.className = 'abene-tab';
            var next = currentTabStops[0];
            span.style.width = Math.max(12, next.pos - (A().pageMargins || { left: 96 }).left) + 'px';
            span.innerHTML = '\u00a0';
            runInsertHTML(span.outerHTML);
            return;
            }
        }
        var mod = e.ctrlKey || e.metaKey;
        if (!mod) return;
        if (window.abeneDispatchShortcut(e)) return;
    }, true);

    window.abenePxToMm = function (px) {
        if (window.PageGeometry && typeof window.PageGeometry.pxToMm === 'function') return window.PageGeometry.pxToMm(px);
        return (Number(px) || 0) * 25.4 / ((window.PageGeometry && window.PageGeometry.dpi) || 96);
    };
    window.abeneGetCleanHtml = function (root) {
        var src = root || ed();
        if (!src) return '<p></p>';
        var clone = src.cloneNode(true);
        window.abeneStripPageFlow(clone);
        clone.querySelectorAll('.page-decoration, .page-header-zone, .page-footer-zone, .page-gap-band, .document-header, .document-footer').forEach(function (n) { n.remove(); });
        return clone.innerHTML.trim() || '<p></p>';
    };
    window.abenePrepareForExport = function () {
        var editor = ed();
        if (editor && editor.classList.contains('editing-header-footer') && typeof window.abeneCloseHeaderFooter === 'function') {
            window.abeneCloseHeaderFooter();
        }
        if (typeof refreshPagination === 'function') refreshPagination();
        else {
            if (window.abeneLayoutPageFlow) window.abeneLayoutPageFlow();
            if (typeof window.renderPageDecorations === 'function') window.renderPageDecorations();
        }
    };
    window.abeneRemoveExportRoot = function () {
        var old = document.getElementById('abeneExportRoot');
        if (old && old.parentNode) old.parentNode.removeChild(old);
        var st = document.getElementById('abenePrintPageSize');
        if (st && st.parentNode) st.parentNode.removeChild(st);
        document.body.classList.remove('abene-printing');
    };
    window.abeneBuildPagedExport = function () {
        window.abenePrepareForExport();
        var editor = ed();
        if (!editor) return null;
        var w = pageW();
        var h = pageH();
        var m = A().pageMargins || { top: 96, bottom: 96, left: 96, right: 96 };
        var chrome = document.getElementById('pageChrome');
        var used = typeof window.abeneCountUsedPages === 'function' ? window.abeneCountUsedPages(editor) : 1;
        var chromePages = 0;
        if (chrome) {
            chrome.querySelectorAll('[data-page]').forEach(function (z) {
                chromePages = Math.max(chromePages, Number(z.getAttribute('data-page') || 0) || 0);
            });
        }
        var rawH = Math.max(editor.scrollHeight || 0, chrome && chrome.offsetHeight ? chrome.offsetHeight : 0);
        var overflow = rawH - used * h;
        var pages = Math.max(1, used, chromePages);
        if (overflow > 8) pages = Math.max(pages, Math.ceil((rawH - 2) / h));
        var totalH = pages * h;
        var root = document.createElement('div');
        root.id = 'abeneExportRoot';
        root.className = 'abene-export-root';
        root.setAttribute('data-abene-export', '1');
        root.style.setProperty('--export-page-w', w + 'px');
        root.style.setProperty('--export-page-h', h + 'px');
        root.style.setProperty('--export-page-h-total', totalH + 'px');
        root.style.setProperty('--pad-top', m.top + 'px');
        root.style.setProperty('--pad-right', m.right + 'px');
        root.style.setProperty('--pad-bottom', m.bottom + 'px');
        root.style.setProperty('--pad-left', m.left + 'px');
        root.style.setProperty('--write-h', Math.max(80, h - m.top - m.bottom) + 'px');
        var pad = editor.style.padding || (m.top + 'px ' + m.right + 'px ' + m.bottom + 'px ' + m.left + 'px');
        var bg = editor.style.backgroundColor || '#fff';
        var i;
        for (i = 0; i < pages; i++) {
            var sheet = document.createElement('div');
            sheet.className = 'abene-export-sheet';
            sheet.style.cssText = 'width:' + w + 'px;height:' + h + 'px;position:relative;overflow:hidden;background:#fff;margin:0;padding:0;border:0;box-sizing:border-box;page-break-inside:avoid;break-inside:avoid;';
            var inner = document.createElement('div');
            inner.className = 'abene-export-clip';
            inner.style.cssText = 'position:absolute;left:0;top:' + (-i * h) + 'px;width:' + w + 'px;height:' + totalH + 'px;';
            var edClone = editor.cloneNode(true);
            edClone.removeAttribute('id');
            edClone.removeAttribute('contenteditable');
            edClone.contentEditable = 'false';
            edClone.classList.remove('editing-header-footer');
            edClone.style.transform = 'none';
            edClone.style.margin = '0';
            edClone.style.boxShadow = 'none';
            edClone.style.position = 'relative';
            edClone.style.width = w + 'px';
            edClone.style.setProperty('height', totalH + 'px', 'important');
            edClone.style.setProperty('min-height', totalH + 'px', 'important');
            edClone.style.backgroundColor = bg;
            edClone.style.padding = pad;
            edClone.style.setProperty('--page-w', w + 'px');
            edClone.style.setProperty('--page-h', h + 'px');
            edClone.style.setProperty('--pad-top', m.top + 'px');
            edClone.style.setProperty('--pad-right', m.right + 'px');
            edClone.style.setProperty('--pad-bottom', m.bottom + 'px');
            edClone.style.setProperty('--pad-left', m.left + 'px');
            edClone.style.setProperty('--write-h', Math.max(80, h - m.top - m.bottom) + 'px');
            edClone.querySelectorAll('.abene-page-flow').forEach(function (sp) {
                var hh = sp.style.getPropertyValue('--flow-h') || sp.style.height || (sp.offsetHeight + 'px');
                if (hh) sp.style.setProperty('height', hh, 'important');
            });
            inner.appendChild(edClone);
            if (chrome && chrome.childNodes.length) {
                var chClone = chrome.cloneNode(true);
                chClone.removeAttribute('id');
                chClone.classList.remove('hf-guides-on');
                chClone.querySelectorAll('.hf-tab, .hf-rule, .page-gap-band, .hf-close').forEach(function (n) { n.remove(); });
                chClone.querySelectorAll('[contenteditable]').forEach(function (el) { el.contentEditable = 'false'; });
                chClone.querySelectorAll('.page-footer-zone').forEach(function (zone) {
                    var pg = Math.max(0, Number(zone.getAttribute('data-page') || '1') - 1);
                    zone.style.height = m.bottom + 'px';
                    zone.style.top = (pg * h + h - m.bottom) + 'px';
                });
                chClone.style.position = 'absolute';
                chClone.style.top = '0';
                chClone.style.left = '0';
                chClone.style.width = w + 'px';
                chClone.style.height = totalH + 'px';
                chClone.style.pointerEvents = 'none';
                inner.appendChild(chClone);
            }
            sheet.appendChild(inner);
            root.appendChild(sheet);
        }
        return root;
    };
    window.abeneInjectPrintPageSize = function () {
        var w = pageW();
        var h = pageH();
        var wmm = window.abenePxToMm(w).toFixed(2);
        var hmm = window.abenePxToMm(h).toFixed(2);
        var st = document.getElementById('abenePrintPageSize');
        if (!st) {
            st = document.createElement('style');
            st.id = 'abenePrintPageSize';
            document.head.appendChild(st);
        }
        st.textContent = '@page { size: ' + wmm + 'mm ' + hmm + 'mm; margin: 0; }';
        return { w: w, h: h, wmm: Number(wmm), hmm: Number(hmm) };
    };

        window.abeneInitRuler = window.initRuler;
        window.abeneUpdateRulerHandles = window.updateRulerHandles;
        window.abeneApplyParagraphIndent = window.applyParagraphIndent;
        window.abeneRenderPageDecorations = window.renderPageDecorations;
        window.abeneChangeMargins = window.changeMargins;
        window.abeneChangeFontSize = window.changeFontSize;
        window.abeneStepFontSize = window.stepFontSize;
        window.abeneApplyStyle = window.applyStyle;
        window.abeneChangeLineSpacing = window.changeLineSpacing;
        window.abenePasteContent = window.pasteContent;
        window.abeneFormatPainter = window.formatPainter;
        window.abeneOpenFindReplace = window.openFindReplace;
        window.abeneAddBorders = window.addBorders;
        window.abeneManageStyles = window.manageStyles;
        window.abeneClearFormatting = window.clearFormatting;
        window.abeneWrapInline = wrapInline;
        var prevI18n = window.abeneAfterI18n;
        window.abeneAfterI18n = function (lang) {
            if (typeof prevI18n === 'function') prevI18n(lang);
            window._abeneChromeSig = '';
            if (typeof window.renderPageDecorations === 'function') window.renderPageDecorations();
        };
        bindPrintLayoutOnce();
})();
