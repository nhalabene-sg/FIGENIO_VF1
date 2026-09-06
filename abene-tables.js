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
})(window);
