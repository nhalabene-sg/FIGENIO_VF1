/* Genius Raros — Tables Word (P6).
   Multipage + linha de cabeçalho repetida. Le système actuel (grille, modal,
   barra de tabela, trySplitTable) reste ; ce module l’enveloppe. */
(function (root) {
    root.ABENE = root.ABENE || {};
    var useEngine = true;
    try {
        if (root.localStorage && root.localStorage.getItem('abeneTablesEngine') === '0') useEngine = false;
    } catch (e0) {}

    function tt(key, fb) {
        return typeof root.t === 'function' ? root.t(key) : (fb || key);
    }
    function A() { return root.abene || {}; }
    function ed() { return (A().editor) || document.getElementById('editor'); }

    function headerRows(table) {
        if (!table) return [];
        if (table.getAttribute('data-abene-repeat-head') === '0') return [];
        var out = [];
        if (table.tHead && table.tHead.rows.length) {
            Array.prototype.forEach.call(table.tHead.rows, function (hr) { out.push(hr); });
            return out;
        }
        var first = table.rows[0];
        if (first && first.cells.length && first.querySelector('th') && !first.querySelector('td')) out.push(first);
        return out;
    }

    function isHeaderRow(tr, table) {
        if (!tr) return false;
        if (tr.getAttribute('data-abene-cloned-head')) return true;
        if (table && table.tHead && tr.parentNode === table.tHead) return true;
        return false;
    }

    function rowspanCrosses(table, splitAt) {
        var r, c, cell, span;
        for (r = 0; r < splitAt; r++) {
            if (!table.rows[r]) continue;
            for (c = 0; c < table.rows[r].cells.length; c++) {
                cell = table.rows[r].cells[c];
                span = Number(cell.rowSpan) || 1;
                if (span > 1 && r + span > splitAt) return true;
            }
        }
        return false;
    }

    function bodyRowsBefore(table, splitAt, heads) {
        var n = 0, r, tr;
        for (r = 0; r < splitAt; r++) {
            tr = table.rows[r];
            if (!tr) continue;
            if (tr.getAttribute('data-abene-cloned-head')) continue;
            if (heads.indexOf(tr) >= 0) continue;
            n++;
        }
        return n;
    }

    function trySplit(table, limit, editor, helpers) {
        if (!useEngine) return false;
        if (!table || table.tagName !== 'TABLE') return false;
        var cn = ' ' + (table.className || '') + ' ';
        if (/\sgr-(signs|letterhead|meta|parties|totals)\s/.test(cn)) return false;
        if (table.closest && (table.closest('.gr-sign-block') || table.closest('.gr-letterhead'))) return false;
        helpers = helpers || {};
        var yIn = helpers.yInEditor;
        var ensureCol = helpers.ensureColgroup;
        var headsFn = helpers.headerRows || headerRows;
        if (typeof yIn !== 'function') return false;
        var rows = Array.prototype.slice.call(table.rows || []);
        if (rows.length < 2) return false;
        var splitAt = -1;
        var r, top, bot;
        for (r = 0; r < rows.length; r++) {
            if (rows[r].getAttribute('data-abene-cloned-head')) continue;
            top = yIn(rows[r], editor);
            bot = top + rows[r].offsetHeight;
            if (bot > limit + 1) { splitAt = r; break; }
        }
        if (splitAt < 1) return false;
        var heads = headsFn(table);
        var headCount = table.tHead ? table.tHead.rows.length : heads.length;
        while (splitAt > headCount && rowspanCrosses(table, splitAt)) splitAt--;
        if (splitAt < 1) return false;
        if (headCount && splitAt < headCount) return false;
        if (bodyRowsBefore(table, splitAt, heads) < 1) return false;
        var colg = typeof ensureCol === 'function' ? ensureCol(table) : table.querySelector('colgroup');
        var clone = table.cloneNode(false);
        clone.setAttribute('data-abene-cont', '1');
        clone.removeAttribute('id');
        if (table.style && table.style.cssText) clone.style.cssText = table.style.cssText;
        if (!clone.style.width) clone.style.width = table.offsetWidth + 'px';
        if (colg) clone.appendChild(colg.cloneNode(true));
        if (heads.length && table.getAttribute('data-abene-repeat-head') !== '0') {
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
            if (rows[r].getAttribute('data-abene-cloned-head')) continue;
            body.appendChild(rows[r]);
        }
        if (!body.rows.length) return false;
        if (table.nextSibling) table.parentNode.insertBefore(clone, table.nextSibling);
        else table.parentNode.appendChild(clone);
        return true;
    }

    function normalize(table) {
        if (!table || table.tagName !== 'TABLE') return table;
        if (table.getAttribute('data-abene-cont')) return table;
        if (table.getAttribute('data-abene-repeat-head') === '0') return table;
        if (table.tHead && table.tHead.rows.length) {
            table.setAttribute('data-abene-repeat-head', '1');
            return table;
        }
        var first = table.rows[0];
        if (!first || !first.cells.length) return table;
        var allTh = true;
        Array.prototype.forEach.call(first.cells, function (cell) {
            if (cell.tagName !== 'TH') allTh = false;
        });
        if (!allTh) return table;
        var thead = table.tHead || table.createTHead();
        thead.appendChild(first);
        table.setAttribute('data-abene-repeat-head', '1');
        if (!table.tBodies.length) table.appendChild(document.createElement('tbody'));
        return table;
    }

    function tableAtCaret() {
        var sel = root.getSelection && root.getSelection();
        var node = sel && sel.rangeCount ? sel.getRangeAt(0).startContainer : null;
        var el = node && (node.nodeType === 1 ? node : node.parentElement);
        if (!el) return null;
        var cell = el.closest ? el.closest('td, th') : null;
        return cell ? cell.closest('table') : (el.closest ? el.closest('table') : null);
    }

    function relayout() {
        if (typeof root.abeneSchedulePageFlow === 'function') root.abeneSchedulePageFlow(true);
        else if (typeof refreshPagination === 'function') refreshPagination();
    }

    function withMergedTables(fn) {
        var editor = ed();
        if (editor && typeof root.abeneStripPageFlow === 'function') {
            try { root.abeneStripPageFlow(editor); } catch (e) {}
        }
        var r;
        try { r = fn(); } finally {
            relayout();
        }
        return r;
    }

    function setHeaderRow(table, on) {
        if (!table) return;
        if (table.getAttribute('data-abene-cont')) {
            var prev = table.previousElementSibling;
            while (prev && prev.classList && prev.classList.contains('abene-page-flow')) prev = prev.previousElementSibling;
            if (prev && prev.tagName === 'TABLE') table = prev;
        }
        var first, thead, tbody, neu;
        if (on) {
            first = (table.tHead && table.tHead.rows[0]) || table.rows[0];
            if (!first) return;
            Array.prototype.forEach.call(Array.prototype.slice.call(first.cells), function (c) {
                if (c.tagName === 'TH') return;
                neu = document.createElement('th');
                neu.innerHTML = c.innerHTML;
                neu.style.cssText = c.style.cssText;
                Array.prototype.forEach.call(c.attributes, function (a) {
                    if (a.name !== 'style') neu.setAttribute(a.name, a.value);
                });
                c.parentNode.replaceChild(neu, c);
            });
            thead = table.tHead || table.createTHead();
            if (first.parentNode !== thead) thead.appendChild(first);
            table.setAttribute('data-abene-repeat-head', '1');
        } else {
            thead = table.tHead;
            tbody = table.tBodies[0] || table.appendChild(document.createElement('tbody'));
            if (thead) {
                while (thead.rows.length) {
                    first = thead.rows[0];
                    Array.prototype.forEach.call(Array.prototype.slice.call(first.cells), function (c) {
                        if (c.tagName === 'TD') return;
                        neu = document.createElement('td');
                        neu.innerHTML = c.innerHTML;
                        neu.style.cssText = c.style.cssText;
                        c.parentNode.replaceChild(neu, c);
                    });
                    tbody.insertBefore(first, tbody.firstChild);
                }
                thead.parentNode.removeChild(thead);
            }
            table.setAttribute('data-abene-repeat-head', '0');
        }
    }

    function wrapFn(name, after) {
        var orig = root[name];
        if (typeof orig !== 'function' || orig._abeneTables) return;
        var wrapped = function () {
            var r = orig.apply(this, arguments);
            try { if (after) after.apply(this, arguments); } catch (e) {}
            return r;
        };
        wrapped._abeneTables = true;
        root[name] = wrapped;
    }

    function wrapMerged(name) {
        var orig = root[name];
        if (typeof orig !== 'function' || orig._abeneTables) return;
        var wrapped = function () {
            var args = arguments;
            var ctx = this;
            return withMergedTables(function () { return orig.apply(ctx, args); });
        };
        wrapped._abeneTables = true;
        root[name] = wrapped;
    }

    function normalizeCaretTable() {
        var t = tableAtCaret();
        if (t) normalize(t);
        relayout();
    }

    wrapFn('insertTable', normalizeCaretTable);
    wrapFn('abeneApplyInsertTable', function () {
        var t = tableAtCaret();
        if (t) normalize(t);
        relayout();
    });
    wrapFn('convertTextToTable', normalizeCaretTable);

    var origToggle = root.toggleHeaderRow;
    if (typeof origToggle === 'function' && !origToggle._abeneTables) {
        root.toggleHeaderRow = function () {
            withMergedTables(function () {
                var table = null;
                if (typeof getSelectedTable === 'function') table = getSelectedTable();
                if (!table) table = tableAtCaret();
                if (!table) {
                    origToggle();
                    return;
                }
                var hasHead = !!(table.tHead && table.tHead.rows.length);
                setHeaderRow(table, !hasHead);
                if (typeof saveUndoState === 'function') saveUndoState();
            });
        };
        root.toggleHeaderRow._abeneTables = true;
    }

    ['addTableRow', 'addTableCol', 'deleteTableRow', 'deleteTableCol', 'deleteTable',
        'mergeCells', 'splitCell', 'applyTableStyle', 'setTableBorderStyle'].forEach(wrapMerged);

    var Tables = {
        get useEngine() { return useEngine; },
        set useEngine(v) { useEngine = !!v; },
        trySplit: trySplit,
        headerRows: headerRows,
        normalize: normalize,
        setHeaderRow: setHeaderRow,
        withMergedTables: withMergedTables
    };
    root.ABENE.Tables = Tables;

    /* Desenhar tabela: lápis na página (o modal Inserir tabela fica intacto). */
    (function wrapDrawTable() {
        var legacy = root.drawTable;
        var active = false;
        var dragging = false;
        var startX = 0;
        var startY = 0;
        var startCell = null;
        var guide = null;

        function toast(msg) {
            if (typeof root.showToast === 'function') root.showToast(msg);
        }

        function ensureCss() {
            if (document.getElementById('abene-draw-table-css')) return;
            var s = document.createElement('style');
            s.id = 'abene-draw-table-css';
            s.textContent =
                'body.abene-draw-table #editor,body.abene-draw-table #editorArea,body.abene-draw-table #pageContainer{cursor:crosshair;}' +
                '#abeneDrawGuide{position:fixed;z-index:100000;pointer-events:none;box-sizing:border-box;}' +
                '#abeneDrawGuide.rect{border:1px solid #2b579a;background:rgba(43,87,154,.10);}' +
                '#abeneDrawGuide.hline,#abeneDrawGuide.vline{background:#2b579a;}';
            document.head.appendChild(s);
        }

        function drawBtns() {
            return document.querySelectorAll('[onclick="drawTable()"]');
        }

        function setBtnActive(on) {
            drawBtns().forEach(function (b) {
                if (on) b.classList.add('active');
                else b.classList.remove('active');
            });
        }

        function ensureGuide() {
            if (guide && guide.parentNode) return guide;
            guide = document.createElement('div');
            guide.id = 'abeneDrawGuide';
            guide.setAttribute('aria-hidden', 'true');
            document.body.appendChild(guide);
            return guide;
        }

        function hideGuide() {
            if (guide) guide.style.display = 'none';
        }

        function showGuide(x0, y0, x1, y1, mode) {
            var g = ensureGuide();
            var l = Math.min(x0, x1);
            var t = Math.min(y0, y1);
            var w = Math.abs(x1 - x0);
            var h = Math.abs(y1 - y0);
            g.className = mode || 'rect';
            g.style.display = 'block';
            if (mode === 'hline') {
                g.style.left = l + 'px';
                g.style.top = (y0 - 1) + 'px';
                g.style.width = Math.max(2, w) + 'px';
                g.style.height = '2px';
                return;
            }
            if (mode === 'vline') {
                g.style.left = (x0 - 1) + 'px';
                g.style.top = t + 'px';
                g.style.width = '2px';
                g.style.height = Math.max(2, h) + 'px';
                return;
            }
            g.style.left = l + 'px';
            g.style.top = t + 'px';
            g.style.width = w + 'px';
            g.style.height = h + 'px';
        }

        function cellFromPoint(x, y) {
            if (guide) guide.style.display = 'none';
            var node = document.elementFromPoint(x, y);
            if (guide && dragging) guide.style.display = 'block';
            if (!node || !node.closest) return null;
            return node.closest('td, th');
        }

        function protectedTable(table) {
            if (!table) return false;
            var cn = ' ' + (table.className || '') + ' ';
            if (/\sgr-(signs|letterhead|meta|parties|totals)\s/.test(cn)) return true;
            if (table.closest && (table.closest('.gr-sign-block') || table.closest('.gr-letterhead'))) return true;
            return false;
        }

        function placeCaretAt(x, y) {
            var editor = ed();
            if (!editor) return;
            editor.focus();
            if (guide) guide.style.display = 'none';
            var range = null;
            if (document.caretRangeFromPoint) range = document.caretRangeFromPoint(x, y);
            else if (document.caretPositionFromPoint) {
                var pos = document.caretPositionFromPoint(x, y);
                if (pos) {
                    range = document.createRange();
                    range.setStart(pos.offsetNode, pos.offset);
                    range.collapse(true);
                }
            }
            if (guide && dragging) guide.style.display = 'block';
            var sel = root.getSelection();
            if (range && editor.contains(range.startContainer)) {
                try {
                    sel.removeAllRanges();
                    sel.addRange(range);
                    return;
                } catch (eR) {}
            }
            try {
                var end = document.createRange();
                end.selectNodeContents(editor);
                end.collapse(false);
                sel.removeAllRanges();
                sel.addRange(end);
            } catch (e2) {}
        }

        function selectCell(cell) {
            if (!cell) return;
            var range = document.createRange();
            range.selectNodeContents(cell);
            range.collapse(true);
            var sel = root.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            if (typeof root.getSelectedTable === 'function') root.getSelectedTable();
        }

        function insertHtml(html) {
            if (root.EditorCommands && root.EditorCommands.useEngine && typeof root.EditorCommands.insertHTML === 'function') {
                return root.EditorCommands.insertHTML(html);
            }
            var editor = ed();
            if (editor) editor.focus();
            try { document.execCommand('insertHTML', false, html); } catch (eI) {
                if (editor) editor.insertAdjacentHTML('beforeend', html);
            }
        }

        function cssBox(clientW, clientH) {
            var editor = ed();
            var r = editor ? editor.getBoundingClientRect() : { width: 1, height: 1 };
            var sx = editor && r.width ? editor.clientWidth / r.width : 1;
            var sy = editor && r.height ? editor.clientHeight / r.height : 1;
            return { w: Math.abs(clientW) * sx, h: Math.abs(clientH) * sy };
        }

        function buildDrawnTable(rows, cols, widthPx) {
            var w = Math.max(48, Math.min(900, Math.round(widthPx || 240)));
            var cellCss = 'border:1px solid #333;padding:4px 8px;min-width:24px;height:24px;';
            var html = '<table data-abene-drawn="1" style="border-collapse:collapse;table-layout:fixed;width:' + w + 'px;">';
            var r, c;
            for (r = 0; r < rows; r++) {
                html += '<tr>';
                for (c = 0; c < cols; c++) {
                    html += '<td style="' + cellCss + '"><br></td>';
                }
                html += '</tr>';
            }
            html += '</table><p></p>';
            return html;
        }

        function insertDrawn(rows, cols, widthPx, x, y) {
            placeCaretAt(x, y);
            insertHtml(buildDrawnTable(rows, cols, widthPx));
            var editor = ed();
            var drawn = editor && editor.querySelectorAll('table[data-abene-drawn="1"]');
            var table = drawn && drawn.length ? drawn[drawn.length - 1] : null;
            if (table) normalize(table);
            if (typeof root.saveUndoState === 'function') root.saveUndoState();
            relayout();
        }

        function splitByStroke(cell, dx, dy, vertical) {
            if (!cell) return false;
            var table = cell.closest('table');
            if (!table || protectedTable(table)) return false;
            selectCell(cell);
            if (vertical) {
                if (typeof root.addTableCol === 'function') root.addTableCol('right');
            } else if (typeof root.addTableRow === 'function') {
                root.addTableRow('below');
            }
            relayout();
            return true;
        }

        function finishDrag(ev) {
            var dx = ev.clientX - startX;
            var dy = ev.clientY - startY;
            var adx = Math.abs(dx);
            var ady = Math.abs(dy);
            hideGuide();
            if (adx < 16 && ady < 16) return;
            var cell = startCell || cellFromPoint(startX, startY);
            var table = cell && cell.closest('table');
            var lineLike = (adx >= 20 && ady < 14) || (ady >= 20 && adx < 14) || (adx > ady * 2.2) || (ady > adx * 2.2);
            if (table && lineLike) {
                var vertical = ady >= adx;
                splitByStroke(cell, dx, dy, vertical);
                toast(tt('drawTableHint'));
                return;
            }
            if (table && !protectedTable(table) && adx >= 40 && ady >= 28) {
                var boxIn = cssBox(adx, ady);
                var rowsIn = Math.max(1, Math.min(12, Math.round(boxIn.h / 28)));
                var colsIn = Math.max(1, Math.min(10, Math.round(boxIn.w / 72)));
                placeCaretAt(Math.min(startX, ev.clientX), Math.min(startY, ev.clientY));
                insertHtml(buildDrawnTable(rowsIn, colsIn, boxIn.w));
                if (typeof root.saveUndoState === 'function') root.saveUndoState();
                relayout();
                return;
            }
            if (table) return;
            var box = cssBox(adx, ady);
            var rows = Math.max(1, Math.min(20, Math.round(box.h / 28) || 1));
            var cols = Math.max(1, Math.min(12, Math.round(box.w / 72) || 1));
            if (adx < 28 || ady < 22) {
                rows = 1;
                cols = 1;
            }
            insertDrawn(rows, cols, box.w, Math.min(startX, ev.clientX), Math.min(startY, ev.clientY));
        }

        function inPage(ev) {
            var t = ev.target;
            if (!t || !t.closest) return false;
            if (t.closest('.ribbon, .menu-bar, .title-bar, .modal, #fileMenu, #genericModal, .toast-entry, #abeneDrawGuide')) return false;
            return !!(t.closest('#editor, #editorArea, #pageContainer, #pageChrome, .page'));
        }

        function onDown(ev) {
            if (!active || ev.button !== 0) return;
            if (!inPage(ev)) return;
            var editor = ed();
            if (!editor) return;
            ev.preventDefault();
            dragging = true;
            startX = ev.clientX;
            startY = ev.clientY;
            startCell = cellFromPoint(startX, startY);
            showGuide(startX, startY, startX, startY, 'rect');
        }

        function onMove(ev) {
            if (!active || !dragging) return;
            var dx = ev.clientX - startX;
            var dy = ev.clientY - startY;
            var mode = 'rect';
            if (startCell && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
                mode = Math.abs(dy) >= Math.abs(dx) ? 'vline' : 'hline';
            }
            showGuide(startX, startY, ev.clientX, ev.clientY, mode);
        }

        function onUp(ev) {
            if (!active || !dragging) return;
            dragging = false;
            finishDrag(ev);
        }

        function onKey(ev) {
            if (!active) return;
            if (ev.key === 'Escape') {
                ev.preventDefault();
                stopMode(true);
            }
        }

        function startMode() {
            var editor = ed();
            if (!editor) {
                if (typeof legacy === 'function') return legacy.apply(root, arguments);
                return;
            }
            if (document.body.classList.contains('abene-excel-mode')) {
                toast(tt('drawTableHint'));
                return;
            }
            ensureCss();
            active = true;
            document.body.classList.add('abene-draw-table');
            setBtnActive(true);
            document.addEventListener('mousedown', onDown, true);
            document.addEventListener('mousemove', onMove, true);
            document.addEventListener('mouseup', onUp, true);
            document.addEventListener('keydown', onKey, true);
            toast(tt('drawTableHint'));
        }

        function stopMode(fromEsc) {
            active = false;
            dragging = false;
            startCell = null;
            document.body.classList.remove('abene-draw-table');
            setBtnActive(false);
            hideGuide();
            document.removeEventListener('mousedown', onDown, true);
            document.removeEventListener('mousemove', onMove, true);
            document.removeEventListener('mouseup', onUp, true);
            document.removeEventListener('keydown', onKey, true);
            if (fromEsc) toast(tt('drawTableOff'));
        }

        root.drawTable = function () {
            if (active) {
                stopMode(true);
                return;
            }
            startMode();
        };
        root.abeneStopDrawTable = stopMode;
        Tables.startDraw = startMode;
        Tables.stopDraw = stopMode;
    })();

    /* Tabela → Dividir: janela em vez de prompt. O unir / cabeçalho permanece. */
    (function wrapSplitCell() {
        function tt(key, fb) {
            if (typeof root.t === 'function') {
                var v = root.t(key);
                if (v && v !== key) return String(v);
            }
            return fb || key;
        }
        function esc(s) {
            return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
            });
        }
        function trackCell() {
            var editor = ed();
            if (!editor || editor._abeneSplitTrack) return;
            editor._abeneSplitTrack = true;
            editor.addEventListener('mousedown', function (ev) {
                var c = ev.target && ev.target.closest && ev.target.closest('td, th');
                if (c && editor.contains(c)) root._abeneLastCell = c;
            }, true);
        }
        function cellAt() {
            if (typeof getSelectedTable === 'function') {
                try { getSelectedTable(); } catch (eG) {}
            }
            var sel = root.getSelection && root.getSelection();
            var node = sel && sel.rangeCount ? sel.getRangeAt(0).startContainer : null;
            var el = node && (node.nodeType === 1 ? node : node.parentElement);
            var fromSel = el && el.closest ? el.closest('td, th') : null;
            if (fromSel) return fromSel;
            var last = root._abeneLastCell;
            var editor = ed();
            if (last && editor && editor.contains(last) && (last.tagName === 'TD' || last.tagName === 'TH')) return last;
            return null;
        }
        function doSplit(cell, columns) {
            columns = Math.max(2, Math.min(12, parseInt(columns, 10) || 2));
            withMergedTables(function () {
                cell.colSpan = 1;
                var i, neu;
                for (i = 1; i < columns; i++) {
                    neu = document.createElement(cell.tagName.toLowerCase());
                    neu.innerHTML = '\u00a0';
                    neu.style.cssText = cell.style.cssText;
                    cell.parentElement.insertBefore(neu, cell.nextSibling);
                }
                if (typeof saveUndoState === 'function') saveUndoState();
            });
        }
        trackCell();
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', trackCell);
        else trackCell();

        var orig = root.splitCell;
        if (typeof orig === 'function' && orig._abeneSplitModal) return;
        root.splitCell = function () {
            var cell = cellAt();
            if (!cell || typeof openGenericModal !== 'function') {
                if (typeof orig === 'function') return orig.apply(this, arguments);
                return;
            }
            root._abeneSplitCell = cell;
            openGenericModal(tt('tblSplit', 'Dividir'),
                '<div class="form-group"><label for="abeneSplitN">' + esc(tt('pSplit', 'Número de células:')) + '</label>' +
                    '<input id="abeneSplitN" type="number" min="2" max="12" value="2"></div>',
                '<button type="button" class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel', 'Cancelar')) + '</button>' +
                '<button type="button" class="btn-primary" onclick="abeneApplySplitCell()">' + esc(tt('ok', 'OK')) + '</button>'
            );
            setTimeout(function () {
                var inp = document.getElementById('abeneSplitN');
                if (inp) {
                    inp.focus();
                    inp.select();
                    inp.addEventListener('keydown', function (ev) {
                        if (ev.key === 'Enter') {
                            ev.preventDefault();
                            root.abeneApplySplitCell();
                        }
                    });
                }
            }, 30);
        };
        root.splitCell._abeneSplitModal = true;
        root.abeneApplySplitCell = function () {
            var inp = document.getElementById('abeneSplitN');
            var n = inp ? inp.value : 2;
            var cell = root._abeneSplitCell;
            if (typeof closeModal === 'function') closeModal('genericModal');
            root._abeneSplitCell = null;
            if (cell && cell.parentElement) doSplit(cell, n);
        };

        function toast(msg) {
            if (typeof root.showToast === 'function') root.showToast(msg);
        }
        function doMerge(cell) {
            var target = cell.nextElementSibling;
            if (!target || (target.tagName !== 'TD' && target.tagName !== 'TH')) return false;
            withMergedTables(function () {
                cell.innerHTML += ' ' + target.innerHTML;
                cell.colSpan = (cell.colSpan || 1) + (target.colSpan || 1);
                target.remove();
                if (typeof saveUndoState === 'function') saveUndoState();
            });
            return true;
        }
        var origMerge = root.mergeCells;
        if (!(origMerge && origMerge._abeneMergeToast)) {
            root.mergeCells = function () {
                var cell = cellAt();
                if (!cell) {
                    toast(tt('aSelectCell', 'Selecione uma célula.'));
                    if (typeof origMerge === 'function' && !root.showToast) return origMerge.apply(this, arguments);
                    return;
                }
                var target = cell.nextElementSibling;
                if (!target) {
                    toast(tt('aNoMerge', 'Nenhuma célula vizinha para unir.'));
                    return;
                }
                if (target.tagName !== 'TD' && target.tagName !== 'TH') {
                    toast(tt('aNoRight', 'Nenhuma célula à direita.'));
                    return;
                }
                doMerge(cell);
            };
            root.mergeCells._abeneMergeToast = true;
        }
    })();

    /* Base → Ordenar: listas (já existia), linhas de tabela e parágrafos selecionados. */
    (function wrapOrdenar() {
        function tloc(key, fb) {
            if (typeof root.t === 'function') {
                var v = root.t(key);
                if (v && v !== key) return String(v);
            }
            return fb || key;
        }
        function toast(msg) {
            if (typeof root.showToast === 'function') root.showToast(msg);
        }
        function hideMenu() {
            if (typeof root.hideRibbonFlyout === 'function') root.hideRibbonFlyout();
            else if (typeof root.hideFly === 'function') root.hideFly();
        }
        function lang() {
            return document.documentElement.lang || 'pt-PT';
        }
        function cmp(a, b, dir) {
            var mul = dir === 'desc' ? -1 : 1;
            return mul * String(a || '').localeCompare(String(b || ''), lang(), { sensitivity: 'base', numeric: true });
        }
        function blockOf(n) {
            if (!n) return null;
            if (n.nodeType !== 1) n = n.parentElement;
            if (!n || !n.closest) return null;
            return n.closest('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre') || n.closest('#editor > *');
        }
        function selectedBlocks() {
            var sel = root.getSelection();
            if (!sel || !sel.rangeCount) return [];
            var range = sel.getRangeAt(0);
            var a = blockOf(range.startContainer);
            var b = blockOf(range.endContainer) || a;
            if (!a || range.collapsed || a === b) return [];
            var parent = a.parentNode;
            if (!parent || parent !== b.parentNode) return [a, b];
            var out = [];
            var on = false;
            Array.prototype.forEach.call(parent.children, function (el) {
                if (el === a) on = true;
                if (on) out.push(el);
                if (el === b) on = false;
            });
            return out;
        }
        function reorder(items, dir, textOf) {
            if (!items || items.length < 2) return false;
            var parent = items[0].parentNode;
            if (!parent) return false;
            var marker = items[items.length - 1].nextSibling;
            items.slice().sort(function (x, y) {
                return cmp(textOf(x), textOf(y), dir);
            }).forEach(function (el) {
                parent.insertBefore(el, marker);
            });
            return true;
        }
        function sortTable(tr, dir) {
            var table = tr.closest('table');
            if (!table) return false;
            var body = table.tBodies && table.tBodies[0] ? table.tBodies[0] : table;
            var rows = Array.prototype.slice.call(body.rows || []);
            if (rows[0] && rows[0].querySelector('th') && !rows[0].querySelector('td')) rows = rows.slice(1);
            rows = rows.filter(function (r) { return !r.getAttribute('data-abene-cloned-head'); });
            if (rows.length < 2) return false;
            var n = root.getSelection() && root.getSelection().anchorNode;
            if (n && n.nodeType !== 1) n = n.parentElement;
            var cell = n && n.closest ? n.closest('td, th') : null;
            var col = 0;
            if (cell && cell.parentNode) {
                var i = Array.prototype.indexOf.call(cell.parentNode.children, cell);
                if (i >= 0) col = i;
            }
            return reorder(rows, dir, function (r) {
                var c = r.cells && (r.cells[col] || r.cells[0]);
                return c ? c.textContent : '';
            });
        }
        function boot() {
            var orig = root.applySortList;
            if (typeof orig === 'function' && orig._abeneSortWrap) return;
            function apply(dir) {
                dir = dir === 'desc' ? 'desc' : 'asc';
                hideMenu();
                var sel = root.getSelection();
                var node = sel && sel.anchorNode;
                if (node && node.nodeType !== 1) node = node.parentElement;
                if (node && node.closest && node.closest('ul, ol')) {
                    if (typeof orig === 'function') return orig.call(root, dir);
                }
                var tr = node && node.closest && node.closest('tr');
                if (tr && sortTable(tr, dir)) {
                    if (typeof root.saveUndoState === 'function') root.saveUndoState();
                    return;
                }
                if (reorder(selectedBlocks(), dir, function (el) { return el.textContent; })) {
                    if (typeof root.saveUndoState === 'function') root.saveUndoState();
                    return;
                }
                toast(tloc('sortNeed', 'Coloque o cursor numa lista ou tabela, ou selecione vários parágrafos.'));
            }
            apply._abeneSortWrap = true;
            apply._legacy = orig;
            root.applySortList = apply;
            var origToggle = root.toggleSortList;
            if (typeof origToggle === 'function' && !origToggle._abeneSortWrap) {
                root.toggleSortList = function () { apply('asc'); };
                root.toggleSortList._abeneSortWrap = true;
                root.toggleSortList._legacy = origToggle;
            }
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
        else setTimeout(boot, 0);
        root.addEventListener('load', boot);
    })();
})(window);
