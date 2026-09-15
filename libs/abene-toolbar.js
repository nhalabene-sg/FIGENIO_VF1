/* Genius Raros — friso / barra de estado: cada controlo visível aplica uma acção real */
(function () {
    function tt(key, vars) { return typeof window.t === 'function' ? window.t(key, vars) : key; }
    function editorEl() { return document.getElementById('editor'); }
    function wrap(mutator) {
        if (typeof window.abeneWrapInline === 'function') return window.abeneWrapInline(mutator);
        var editor = editorEl();
        if (!editor) return;
        editor.focus();
        var sel = window.getSelection();
        if (!sel.rangeCount) return;
        var range = sel.getRangeAt(0);
        var span = document.createElement('span');
        mutator(span);
        if (range.collapsed) span.appendChild(document.createTextNode('\u200b'));
        else span.appendChild(range.extractContents());
        range.insertNode(span);
        if (typeof saveUndoState === 'function') saveUndoState();
    }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function insertHTML(html) {
        var editor = editorEl();
        if (!editor) return;
        restoreCaret();
        if (window.EditorCommands && window.EditorCommands.useEngine && typeof window.EditorCommands.insertHTML === 'function') {
            return window.EditorCommands.insertHTML(html);
        }
        editor.focus();
        document.execCommand('insertHTML', false, html);
        if (typeof saveUndoState === 'function') saveUndoState();
        if (typeof window.abeneSchedulePageFlow === 'function') {
            window.abeneSchedulePageFlow(/page-break-marker|abene-section-break|<table/i.test(String(html || '')));
        }
    }
    function toast(msg) {
        if (typeof showToast === 'function') showToast(msg);
        else if (msg) alert(msg);
    }
    function safeUrl(url) {
        var u = String(url || '').trim();
        if (/^https?:\/\//i.test(u) || /^data:image\//i.test(u)) return u;
        return '';
    }
    var prevHideRibbonFlyout = window.hideRibbonFlyout;
    function hideFly() {
        if (typeof prevHideRibbonFlyout === 'function' && prevHideRibbonFlyout !== hideFly) {
            try { prevHideRibbonFlyout(); } catch (e) {}
        }
        var f = document.getElementById('ribbonFlyout');
        if (f) {
            f.classList.remove('visible');
            f.classList.remove('hf-gallery-fly');
        }
    }
    function showFly(ev, html) {
        saveCaret();
        var f = document.getElementById('ribbonFlyout');
        if (!f || !ev) return;
        f.classList.remove('hf-gallery-fly');
        f.innerHTML = html;
        f.classList.add('visible');
        var r = (ev.currentTarget || ev.target).getBoundingClientRect();
        f.style.left = r.left + 'px';
        f.style.top = r.bottom + 'px';
        if (ev.stopPropagation) ev.stopPropagation();
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
    function formDialog(title, fields, onOk) {
        if (typeof openGenericModal !== 'function') return;
        saveCaret();
        var body = (fields || []).map(function (f) {
            var id = 'abeneDlg_' + f.id;
            if (f.type === 'select') {
                var opts = (f.options || []).map(function (o) {
                    var v = o.value != null ? o.value : o;
                    var lab = o.label != null ? o.label : o;
                    return '<option value="' + esc(v) + '"' + (String(v) === String(f.value) ? ' selected' : '') + '>' + esc(lab) + '</option>';
                }).join('');
                return '<div class="form-group"><label for="' + id + '">' + esc(f.label) + '</label><select id="' + id + '">' + opts + '</select></div>';
            }
            if (f.type === 'textarea') {
                return '<div class="form-group"><label for="' + id + '">' + esc(f.label) + '</label><textarea id="' + id + '" rows="3">' + esc(f.value || '') + '</textarea></div>';
            }
            return '<div class="form-group"><label for="' + id + '">' + esc(f.label) + '</label><input id="' + id + '" type="' + (f.type || 'text') + '" value="' + esc(f.value || '') + '"></div>';
        }).join('');
        window._abeneFormOnOk = onOk;
        openGenericModal(title, body,
            '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + tt('cancel') + '</button>' +
            '<button class="btn-primary" onclick="abeneSubmitFormDialog()">' + tt('ok') + '</button>'
        );
        setTimeout(function () {
            var first = document.querySelector('#genericModalBody input, #genericModalBody textarea, #genericModalBody select');
            if (first) first.focus();
        }, 30);
    }
    window.abeneSubmitFormDialog = function () {
        var onOk = window._abeneFormOnOk;
        var data = {};
        document.querySelectorAll('#genericModalBody [id^="abeneDlg_"]').forEach(function (el) {
            data[el.id.replace('abeneDlg_', '')] = el.value;
        });
        if (typeof closeModal === 'function') closeModal('genericModal');
        if (onOk) onOk(data);
    };

    window.changeFontFamily = function (val) {
        if (!val) return;
        wrap(function (span) { span.style.fontFamily = val; });
        var sel = document.getElementById('fontFamily');
        if (sel) sel.value = val;
    };
    window.changeFontColor = function (val) {
        wrap(function (span) { span.style.color = val; });
        var inp = document.getElementById('fontColor');
        if (inp) inp.value = val;
    };
    window.changeHiliteColor = function (val) {
        wrap(function (span) { span.style.backgroundColor = val || 'transparent'; });
        var inp = document.getElementById('hiliteColor');
        if (inp && val) inp.value = val;
    };

    window.setViewMode = function (mode) {
        var editor = editorEl();
        var area = document.getElementById('editorArea');
        if (!editor || !area) return;
        editor.classList.remove('view-web', 'view-read', 'view-outline', 'view-draft');
        document.body.classList.remove('abene-web-layout', 'abene-read-layout', 'abene-print-layout');
        var reading = mode === 'read';
        editor.contentEditable = reading ? 'false' : 'true';
        editor.style.cursor = reading ? 'default' : 'text';
        area.style.background = '#808080';
        editor.style.background = '#fff';
        editor.style.boxShadow = '0 1px 3px rgba(0,0,0,.2), 0 6px 18px rgba(0,0,0,.14)';
        if (mode === 'web') {
            editor.classList.add('view-web');
            document.body.classList.add('abene-web-layout');
            editor.style.minHeight = 'auto';
            area.style.background = '#f1f3f4';
        } else if (mode === 'read') {
            editor.classList.add('view-read');
            document.body.classList.add('abene-read-layout');
            area.style.background = '#e8dfd0';
            editor.style.background = '#fffaef';
        } else if (mode === 'outline') {
            editor.classList.add('view-outline');
            document.body.classList.add('abene-web-layout');
            area.style.background = '#fff';
        } else if (mode === 'draft') {
            editor.classList.add('view-draft');
            document.body.classList.add('abene-print-layout');
            editor.style.boxShadow = 'none';
        } else {
            document.body.classList.add('abene-print-layout');
            if (typeof applyPageGeometry === 'function') applyPageGeometry();
            else editor.style.minHeight = (typeof getPageHeight === 'function' ? getPageHeight() : (window.PageGeometry && window.PageGeometry.height) || 1123) + 'px';
        }
        document.querySelectorAll('.view-buttons button').forEach(function (b) { b.classList.remove('active'); });
        var id = mode === 'read' ? 'btnViewRead' : mode === 'web' ? 'btnViewWeb' : 'btnViewEdit';
        var btn = document.getElementById(id);
        if (btn) btn.classList.add('active');
        if (typeof refreshPagination === 'function') refreshPagination();
    };
    window.toggleReadMode = function () {
        var editor = editorEl();
        window.setViewMode(editor && editor.classList.contains('view-read') ? 'print' : 'read');
    };

    window.toggleSortList = function () {
        var sel = window.getSelection();
        var node = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
        var list = node && node.closest('ul, ol');
        if (!list) { toast(tt('aCursorList')); return; }
        var lang = document.documentElement.lang || 'pt-PT';
        Array.from(list.children).sort(function (a, b) {
            return a.textContent.localeCompare(b.textContent, lang, { sensitivity: 'base' });
        }).forEach(function (item) { list.appendChild(item); });
        if (typeof saveUndoState === 'function') saveUndoState();
    };

    window.insertOnlineImage = function () {
        formDialog(tt('imageUrl'), [{ id: 'url', label: tt('pImageUrl'), value: 'https://' }], function (data) {
            var url = safeUrl(data.url);
            if (!url) { toast(tt('aBadUrl')); return; }
            if (typeof window.abeneInsertPicture === 'function') window.abeneInsertPicture(url);
            else insertHTML('<img data-illustration="true" src="' + esc(url) + '" style="max-width:400px;height:auto;" alt="">');
        });
    };
    window.insertSmartArt = function () {
        formDialog(tt('smartArt'), [{ id: 'steps', label: tt('pSmart'), value: tt('pSmartDef') }], function (data) {
            var items = String(data.steps || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
            if (!items.length) return;
            var colors = ['#2b579a', '#3b82a0', '#4f8f72', '#d28b36', '#a84d65'];
            var html = '<div data-smartart="true" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:16px 0;padding:12px;background:#f4f7fb;border:1px solid #c8d4e5;border-radius:6px;">' +
                items.map(function (item, index) {
                    return '<div style="display:flex;align-items:center;gap:6px;"><div style="background:' + colors[index % colors.length] + ';color:#fff;padding:12px 16px;border-radius:4px;min-width:110px;text-align:center;font-weight:600;">' +
                        esc(item) + '</div>' + (index < items.length - 1 ? '<span style="font-size:20px;color:#6b7280;">→</span>' : '') + '</div>';
                }).join('') + '</div>';
            insertHTML(html);
        });
    };
    var chartEditTarget = null;
    function parseChartPoints(raw) {
        return String(raw || '').split(',').map(function (point) {
            var parts = String(point || '').split(':');
            return { label: (parts[0] || '').trim(), value: Number(parts[1]) || 0 };
        }).filter(function (p) { return p.label; });
    }
    function buildChartHtml(raw) {
        var points = parseChartPoints(raw);
        if (!points.length) return '';
        var max = 1;
        points.forEach(function (p) { if (p.value > max) max = p.value; });
        var bars = points.map(function (point) {
            var h = Math.max(8, point.value / max * 140);
            return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;"><span style="font-size:11px;color:#475569;">' +
                esc(String(point.value)) + '</span><div style="width:70%;max-width:48px;height:' + h + 'px;background:#2b579a;border-radius:3px 3px 0 0;"></div><span style="font-size:11px;margin-top:5px;text-align:center;">' +
                esc(point.label) + '</span></div>';
        }).join('');
        var rawClean = points.map(function (p) { return p.label + ':' + p.value; }).join(', ');
        return '<div data-chart="true" data-chart-raw="' + esc(rawClean) + '" contenteditable="false" title="' +
            esc(tt('chartDbl') || tt('chart')) +
            '" style="border:1px solid #d0d7e2;padding:16px;margin:16px 0;background:#fff;border-radius:4px;cursor:pointer;"><strong>' +
            esc(tt('chartTitle')) + '</strong><div style="display:flex;align-items:flex-end;gap:14px;height:180px;margin-top:14px;padding:0 12px;border-bottom:1px solid #94a3b8;">' +
            bars + '</div></div>';
    }
    function openChartDialog(target) {
        chartEditTarget = target || null;
        var cur = (target && target.getAttribute('data-chart-raw')) || tt('pChartDef');
        formDialog(tt('chart'), [{ id: 'raw', label: tt('pChart'), value: cur }], function (data) {
            var html = buildChartHtml(data.raw);
            if (!html) return;
            var node = chartEditTarget;
            chartEditTarget = null;
            if (node && node.parentNode) {
                var wrap = document.createElement('div');
                wrap.innerHTML = html;
                if (wrap.firstChild) node.parentNode.replaceChild(wrap.firstChild, node);
                if (typeof saveUndoState === 'function') saveUndoState();
                toast(tt('chartUpdated') || tt('chartTitle'));
                return;
            }
            insertHTML(html);
            toast(tt('chartInserted') || tt('chartTitle'));
        });
    }
    window.insertChart = function () {
        openChartDialog(null);
    };
    window.abeneEditChart = openChartDialog;
    window.spellCheck = function () {
        var editor = editorEl();
        if (!editor) return;
        var lang = document.documentElement.lang || 'pt-PT';
        editor.spellcheck = true;
        editor.setAttribute('spellcheck', 'true');
        editor.setAttribute('lang', lang);
        editor.focus();
        var text = String(editor.innerText || '');
        var seen = {};
        var repeats = [];
        var re = /([A-Za-zÀ-ÿ]{2,})\s+\1\b/gi;
        var m;
        while ((m = re.exec(text))) {
            var w = m[0].replace(/\s+/g, ' ');
            if (!seen[w.toLowerCase()]) {
                seen[w.toLowerCase()] = true;
                repeats.push(w);
            }
        }
        toast(tt('spellOn'));
        if (repeats.length) {
            formDialog(tt('spelling'), [{ id: 'list', label: tt('proofIssues'), type: 'textarea', value: repeats.join('\n') }], function () {});
        }
    };
    window.insertLink = function () {
        var sel = window.getSelection();
        var selected = sel && sel.toString() ? sel.toString() : '';
        formDialog(tt('link'), [
            { id: 'url', label: tt('linkUrl'), value: 'https://' },
            { id: 'text', label: tt('linkText'), value: selected }
        ], function (data) {
            var url = safeUrl(data.url);
            if (!url) { toast(tt('aBadUrl')); return; }
            var text = (data.text || url).trim() || url;
            insertHTML('<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" style="color:#2b579a;">' + esc(text) + '</a>');
        });
    };
    window.insertComment = function () {
        saveCaret();
        var sel = window.getSelection();
        if (!sel || !sel.rangeCount || sel.isCollapsed) { toast(tt('commentNeedSel')); return; }
        formDialog(tt('comment'), [{ id: 'text', label: tt('pComment'), type: 'textarea' }], function (data) {
            var comment = (data.text || '').trim();
            if (!comment) return;
            restoreCaret();
            sel = window.getSelection();
            if (!sel.rangeCount || sel.isCollapsed) { toast(tt('commentNeedSel')); return; }
            var range = sel.getRangeAt(0);
            var span = document.createElement('span');
            span.style.background = '#fff3cd';
            span.style.borderBottom = '2px solid #ffc107';
            span.title = tt('commentPrefix') + comment;
            span.setAttribute('data-comment', comment);
            span.setAttribute('data-comment-author', localStorage.getItem('abeneAuthor') || tt('aAuthor'));
            span.setAttribute('data-comment-date', new Date().toLocaleString(localStorage.getItem('abeneLanguage') || 'pt-PT'));
            try { range.surroundContents(span); } catch (e) {
                span.appendChild(range.extractContents());
                range.insertNode(span);
            }
            if (typeof saveUndoState === 'function') saveUndoState();
            if (typeof toggleCommentsPane === 'function') toggleCommentsPane(true);
        });
    };
    window.insertSymbol = function (ev) {
        var symbols = '©®™€£¥§¶†‡°±×÷≈≠≤≥∞µαβγδεπΣΩ√∫←→↑↓↔♠♣♥♦★☆☎✉✓✗✈♪♫'.split('');
        if (ev && ev.currentTarget) {
            showFly(ev, '<div class="abene-picker-grid">' + symbols.map(function (s) {
                return '<button type="button" onclick="abeneInsertPlain(\'' + s + '\')">' + s + '</button>';
            }).join('') + '</div>');
            return;
        }
        formDialog(tt('symbol'), [{ id: 'sym', label: tt('pSymbol'), value: '©' }], function (data) {
            if (data.sym) window.abeneInsertPlain(data.sym.trim());
        });
    };
    window.abeneInsertPlain = function (text) {
        hideFly();
        var editor = editorEl();
        if (!editor) return;
        editor.focus();
        if (window.EditorCommands && window.EditorCommands.useEngine && typeof window.EditorCommands.insertText === 'function') {
            window.EditorCommands.insertText(text);
            return;
        }
        document.execCommand('insertText', false, text);
        if (typeof saveUndoState === 'function') saveUndoState();
    };
    window.insertEquation = function () {
        formDialog(tt('equation'), [{ id: 'formula', label: tt('pEquation'), value: tt('equationDefault') }], function (data) {
            if (!data.formula) return;
            insertHTML('<span data-equation="true" style="font-family:Georgia,serif;font-size:1.15em;padding:3px 8px;background:#f8fafc;border:1px solid #d8dee9;">' + esc(data.formula) + '</span>');
        });
    };
    window.insertMailMergeField = function () {
        formDialog(tt('mailMerge'), [{ id: 'field', label: tt('mergeField'), value: tt('mergeFieldDefault') }], function (data) {
            var field = (data.field || '').trim();
            if (!field) return;
            insertHTML('<span data-merge-field="' + esc(field) + '" style="background:#eef5ff;color:#24538f;padding:1px 3px;">{' + esc(field) + '}</span>');
        });
    };
    window.insertTextBox = function () {
        formDialog(tt('textBox'), [{ id: 'text', label: tt('pTextBox'), type: 'textarea', value: tt('textBoxDefault') }], function (data) {
            if (!data.text) return;
            insertHTML('<div style="border:2px solid #2b579a;padding:15px;margin:10px;display:inline-block;min-width:200px;border-radius:4px;">' + esc(data.text) + '</div>');
        });
    };
    window.insertSignature = function () {
        formDialog(tt('signature'), [{ id: 'label', label: tt('pSign'), value: tt('signatureDefault') }], function (data) {
            if (!data.label) return;
            insertHTML('<div class="document-signature" style="display:inline-block;min-width:220px;margin:24px 12px 12px 0;text-align:center;"><div style="border-bottom:1px solid #333;height:30px;"></div><small>' + esc(data.label) + '</small></div>');
        });
    };
    window.insertWordArt = function () {
        formDialog(tt('wordArt'), [{ id: 'text', label: tt('wordart'), value: tt('wordartDefault') }], function (data) {
            if (!data.text) return;
            insertHTML('<div data-wordart="true" style="display:inline-block;margin:12px 0;font-size:28pt;font-weight:700;color:#2b579a;text-shadow:2px 2px 0 #dbe7f5;letter-spacing:.5px;">' + esc(data.text) + '</div>');
        });
    };
    window.insertSection = function () {
        formDialog(tt('section'), [{ id: 'title', label: tt('sectionTitle'), value: tt('newSection') }], function (data) {
            if (!data.title) return;
            insertHTML('<div data-section="true" style="border-top:2px solid #2b579a;margin:24px 0 12px;padding-top:8px;"><h2>' + esc(data.title) + '</h2></div><p></p>');
        });
    };
    window.insertIcon = function (ev) {
        var symbols = ['⭐', '❤️', '✅', '❌', '⚠️', 'ℹ️', '📌', '💡', '🔧', '⚙️', '🔒', '🎯', '🏆', '📱', '💻', '🌐', '📧', '✏️', '📝', '🔍', '💰', '🧾', '📄'];
        var html = '<div class="abene-picker-grid">' + symbols.map(function (s) {
            return '<button type="button" onclick="abeneInsertIcon(\'' + s + '\')">' + s + '</button>';
        }).join('') + '</div>';
        var btn = (ev && (ev.currentTarget || ev.target)) || document.querySelector('#tab-insert [onclick*="insertIcon"]');
        var fly = document.getElementById('ribbonFlyout');
        if (fly && btn && btn.getBoundingClientRect) {
            showFly({
                currentTarget: btn,
                target: btn,
                stopPropagation: function () {
                    if (ev && ev.stopPropagation) ev.stopPropagation();
                }
            }, html);
            return;
        }
        formDialog(tt('icon'), [{
            id: 'glyph',
            label: tt('pIcon'),
            type: 'select',
            value: symbols[0],
            options: symbols.map(function (s) { return { value: s, label: s }; })
        }], function (data) {
            if (data.glyph) window.abeneInsertIcon(data.glyph);
        });
    };
    window.abeneInsertIcon = function (s) {
        hideFly();
        var glyph = String(s || '').trim() || '⭐';
        insertHTML('<span class="abene-pic abene-icon abene-obj-inline" data-abene-obj="pic" data-wrap="none" contenteditable="false">' +
            '<span data-icon="true" class="abene-icon-glyph" style="font-size:32px;line-height:1;display:block;width:32px;height:32px;">' + glyph + '</span>' +
            '<span class="abene-obj-resize" data-resize="se"></span></span>');
    };
    window.insertShape = function (ev) {
        if (ev && ev.currentTarget) {
            showFly(ev,
                '<button onclick="abeneInsertShape(\'square\')">' + tt('shapeSquareBtn') + '</button>' +
                '<button onclick="abeneInsertShape(\'circle\')">' + tt('shapeCircleBtn') + '</button>' +
                '<button onclick="abeneInsertShape(\'triangle\')">' + tt('shapeTriangleBtn') + '</button>' +
                '<button onclick="abeneInsertShape(\'diamond\')">' + tt('shapeDiamondBtn') + '</button>'
            );
            return;
        }
        window.abeneInsertShape('square');
    };
    window.abeneInsertShape = function (kind) {
        hideFly();
        var htmlByKind = {
            square: '<div data-shape="true" style="width:100px;height:100px;background:#2b579a;display:inline-block;margin:10px;"></div>',
            circle: '<div data-shape="true" style="width:100px;height:100px;background:#e74c3c;border-radius:50%;display:inline-block;margin:10px;"></div>',
            triangle: '<div data-shape="true" style="width:0;height:0;border-left:50px solid transparent;border-right:50px solid transparent;border-bottom:100px solid #27ae60;display:inline-block;margin:10px;"></div>',
            diamond: '<div data-shape="true" style="width:80px;height:80px;background:#f39c12;transform:rotate(45deg);display:inline-block;margin:30px;"></div>'
        };
        if (htmlByKind[kind]) insertHTML(htmlByKind[kind]);
    };
    window.drawTable = function () {
        formDialog(tt('drawTable'), [
            { id: 'rows', label: tt('pRows'), type: 'number', value: '3' },
            { id: 'cols', label: tt('pCols'), type: 'number', value: '3' }
        ], function (data) {
            var rows = parseInt(data.rows, 10);
            var cols = parseInt(data.cols, 10);
            if (rows > 0 && cols > 0 && typeof insertTable === 'function') insertTable(Math.min(50, rows), Math.min(20, cols));
        });
    };
    var legacyConvertTextToTable = window.convertTextToTable;
    window.convertTextToTable = function () {
        var editor = editorEl();
        if (!editor) return;
        editor.focus();
        var sel = window.getSelection();
        if (!sel || !sel.rangeCount || !sel.anchorNode || !editor.contains(sel.anchorNode)) {
            toast(tt('aSelectText'));
            return;
        }
        var text = String(sel.toString() || '').replace(/\u00a0/g, ' ').trim();
        if (!text) {
            toast(tt('aSelectText'));
            return;
        }
        var rows = text.split(/\r\n|\n|\r/).map(function (row) {
            return String(row || '').split(/\t|;/).map(function (cell) { return String(cell || '').trim(); });
        }).filter(function (row) {
            return row.some(function (cell) { return !!cell; });
        });
        if (!rows.length) {
            toast(tt('aSelectText'));
            return;
        }
        var colCount = 1;
        rows.forEach(function (row) { if (row.length > colCount) colCount = row.length; });
        var html = '<table>' + rows.map(function (row, rowIndex) {
            return '<tr>' + Array.from({ length: colCount }, function (_, index) {
                var tag = rowIndex === 0 ? 'th' : 'td';
                return '<' + tag + '>' + esc(row[index] || '') + '</' + tag + '>';
            }).join('') + '</tr>';
        }).join('') + '</table><p><br></p>';
        try {
            var range = sel.getRangeAt(0);
            var startEl = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
            var block = startEl && startEl.closest ? startEl.closest('p,div,li,h1,h2,h3,h4,h5,h6') : null;
            if (block && editor.contains(block) && block !== editor) {
                range.selectNode(block);
            }
            range.deleteContents();
            var marker = document.createElement('span');
            marker.setAttribute('data-abene-ctt', '1');
            range.insertNode(marker);
            range.setStartAfter(marker);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            savedRange = range.cloneRange();
            marker.parentNode.removeChild(marker);
            savedRange = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
        } catch (eDel) {
            if (typeof legacyConvertTextToTable === 'function' && legacyConvertTextToTable !== window.convertTextToTable) {
                return legacyConvertTextToTable.apply(this, arguments);
            }
        }
        insertHTML(html);
        toast(tt('textToTable'));
    };
    window.addWatermark = function () {
        var cur = typeof window.abeneReadWatermarkSpec === 'function' ? window.abeneReadWatermarkSpec() : null;
        formDialog(tt('watermark'), [
            { id: 'text', label: tt('pWatermark'), value: (cur && cur.text) || tt('pWatermarkDef') },
            { id: 'color', label: tt('wmColor') || 'Cor', type: 'color', value: (cur && cur.hex) || '#c8c8c8' },
            { id: 'size', label: tt('wmSize') || 'Tamanho (pt)', type: 'number', value: String((cur && cur.size) || 56) }
        ], function (data) {
            var text = (data.text || '').trim();
            if (typeof window.abeneApplyWatermarkSpec === 'function') {
                window.abeneApplyWatermarkSpec({ text: text, color: data.color, size: data.size }, { toast: true });
                return;
            }
            var editor = editorEl();
            if (!editor) return;
            var existing = editor.querySelector('.watermark');
            if (existing) existing.remove();
            if (!text) return;
            var watermark = document.createElement('div');
            watermark.className = 'watermark';
            watermark.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:56pt;color:rgba(200,200,200,0.3);font-weight:bold;pointer-events:none;white-space:nowrap;z-index:0;';
            watermark.textContent = text;
            watermark.contentEditable = 'false';
            editor.appendChild(watermark);
            if (typeof saveUndoState === 'function') saveUndoState();
        });
    };

    function nextNoteNum(cls) {
        var editor = editorEl();
        return editor ? editor.querySelectorAll(cls).length + 1 : 1;
    }
    function ensureNotes(kind) {
        var editor = editorEl();
        var sel = kind === 'end' ? '.abene-endnotes' : '.abene-footnotes';
        var box = editor.querySelector(sel);
        if (box) return box;
        box = document.createElement('div');
        box.className = 'abene-notes ' + (kind === 'end' ? 'abene-endnotes' : 'abene-footnotes');
        box.setAttribute('data-abene-notes', kind === 'end' ? 'endnotes' : 'footnotes');
        if (kind !== 'end') {
            box.classList.add('abene-notes-source');
            box.setAttribute('aria-hidden', 'true');
        }
        box.innerHTML = '<h3>' + esc(tt(kind === 'end' ? 'endnotesTitle' : 'footnotesTitle')) + '</h3>';
        editor.appendChild(box);
        return box;
    }
    window.insertFootnote = function () {
        formDialog(tt('footnote'), [{ id: 'note', label: tt('pFootnote'), type: 'textarea' }], function (data) {
            var note = (data.note || '').trim();
            if (!note) return;
            var editor = editorEl();
            if (!editor) return;
            restoreCaret();
            editor.focus();
            var n = nextNoteNum('.abene-fn-ref');
            var html = '<sup class="abene-fn-ref" data-fn="' + n + '"><a href="#fn-' + n + '">' + n + '</a></sup>';
            try { document.execCommand('insertHTML', false, html); } catch (e) {}
            var ref = editor.querySelector('.abene-fn-ref[data-fn="' + n + '"]');
            if (!ref) {
                var sel = window.getSelection();
                var range = (sel && sel.rangeCount) ? sel.getRangeAt(0) : null;
                var wrap = document.createElement('sup');
                wrap.className = 'abene-fn-ref';
                wrap.setAttribute('data-fn', String(n));
                wrap.innerHTML = '<a href="#fn-' + n + '">' + n + '</a>';
                try {
                    if (range && editor.contains(range.startContainer)) range.insertNode(wrap);
                    else editor.appendChild(wrap);
                } catch (err2) { editor.appendChild(wrap); }
                ref = wrap;
            }
            if (!editor.contains(ref)) return;
            var box = ensureNotes('foot');
            var p = document.createElement('p');
            p.id = 'fn-' + n;
            p.innerHTML = '<sup>' + n + '</sup> ' + esc(note);
            box.appendChild(p);
            window._abeneFlowForce = true;
            if (typeof saveUndoState === 'function') saveUndoState();
            if (typeof window.abeneSchedulePageFlow === 'function') window.abeneSchedulePageFlow(true);
            if (window.ABENE && window.ABENE.Notes && typeof window.ABENE.Notes.afterLayout === 'function') {
                window.ABENE.Notes.afterLayout();
            }
            if (typeof showToast === 'function') showToast(tt('fnOnPage') || tt('footnote'));
        });
    };
    window.insertEndnote = function () {
        formDialog(tt('endnote'), [{ id: 'note', label: tt('pEndnote'), type: 'textarea' }], function (data) {
            var note = (data.note || '').trim();
            if (!note) return;
            var editor = editorEl();
            if (!editor) return;
            restoreCaret();
            editor.focus();
            var n = nextNoteNum('.abene-en-ref');
            var html = '<sup class="abene-en-ref" data-en="' + n + '"><a href="#en-' + n + '">e' + n + '</a></sup>';
            try { document.execCommand('insertHTML', false, html); } catch (e) {}
            var ref = editor.querySelector('.abene-en-ref[data-en="' + n + '"]');
            if (!ref) {
                var sel = window.getSelection();
                var range = (sel && sel.rangeCount) ? sel.getRangeAt(0) : null;
                var wrap = document.createElement('sup');
                wrap.className = 'abene-en-ref';
                wrap.setAttribute('data-en', String(n));
                wrap.innerHTML = '<a href="#en-' + n + '">e' + n + '</a>';
                try {
                    if (range && editor.contains(range.startContainer)) range.insertNode(wrap);
                    else editor.appendChild(wrap);
                } catch (err2) { editor.appendChild(wrap); }
                ref = wrap;
            }
            if (!editor.contains(ref)) return;
            var box = ensureNotes('end');
            var p = document.createElement('p');
            p.id = 'en-' + n;
            p.innerHTML = '<sup>e' + n + '</sup> ' + esc(note);
            box.appendChild(p);
            if (typeof saveUndoState === 'function') saveUndoState();
            if (typeof window.abeneSchedulePageFlow === 'function') window.abeneSchedulePageFlow(true);
            if (window.ABENE && window.ABENE.Notes && typeof window.ABENE.Notes.afterLayout === 'function') {
                window.ABENE.Notes.afterLayout();
            }
        });
    };
    function currentCaptionImage() {
        var img = window.selectedImage;
        if (img && img.tagName === 'IMG') return img;
        var sel = window.getSelection();
        var node = sel && sel.anchorNode;
        var el = node && (node.nodeType === 1 ? node : node.parentElement);
        if (!el) return null;
        var pic = el.closest && el.closest('.abene-pic');
        if (pic) return pic.querySelector('img');
        if (el.tagName === 'IMG') return el;
        var prev = el.previousElementSibling;
        if (prev && prev.classList && prev.classList.contains('abene-pic')) return prev.querySelector('img');
        if (prev && prev.tagName === 'IMG') return prev;
        return null;
    }
    function currentCaptionTable() {
        if (typeof window.getSelectedTable === 'function') {
            var t = window.getSelectedTable();
            if (t) return t;
        }
        var sel = window.getSelection();
        var node = sel && sel.anchorNode;
        var el = node && (node.nodeType === 1 ? node : node.parentElement);
        return el && el.closest ? el.closest('#editor table') : null;
    }
    function captionHost(el) {
        if (!el) return null;
        if (el.tagName === 'IMG') return el.closest('.abene-pic') || el;
        return el;
    }
    function findCaptionAfter(host) {
        if (!host) return null;
        if (host.classList && host.classList.contains('abene-pic')) {
            var kids = host.children;
            var i;
            for (i = 0; i < kids.length; i++) {
                if (kids[i].classList.contains('abene-caption') || kids[i].getAttribute('data-caption-for')) return kids[i];
            }
        }
        var n = host.nextElementSibling;
        if (n && (n.classList.contains('abene-caption') || n.getAttribute('data-caption-for'))) return n;
        return null;
    }
    function captionKindOf(el) {
        var k = el && el.getAttribute('data-abene-caption');
        if (k === 'table' || k === 'figure') return k;
        if (el && el.getAttribute('data-caption-for') === 'table') return 'table';
        return 'figure';
    }
    function extractCaptionText(el) {
        if (!el) return '';
        var stored = el.getAttribute('data-caption-text');
        if (stored) return stored;
        var span = el.querySelector('.abene-caption-text');
        if (span) return String(span.textContent || '').trim();
        return String(el.textContent || '').trim().replace(/^(Figura|Figure|Tabela|Table|Tableau|Tabla|Ilustração|Illustration|Ilustración)\s*\d+\s*[—–:\-]\s*/i, '');
    }
    function captionLabel(kind) {
        return kind === 'table' ? tt('capTable') : tt('capFigure');
    }
    function fillCaptionNode(el, kind, n, text) {
        el.classList.add('abene-caption');
        el.setAttribute('data-abene-caption', kind);
        el.setAttribute('data-caption-for', kind === 'table' ? 'table' : 'image');
        el.setAttribute('data-caption-text', text || '');
        el.innerHTML = '<span class="abene-caption-label">' + esc(captionLabel(kind)) + ' </span>' +
            '<span class="abene-caption-num">' + n + '</span>' +
            (text ? '<span class="abene-caption-sep"> — </span><span class="abene-caption-text">' + esc(text) + '</span>' : '');
        if (el.closest && el.closest('.abene-pic')) el.setAttribute('contenteditable', 'true');
    }
    function collectCaptions(kind) {
        var editor = editorEl();
        if (!editor) return [];
        return Array.from(editor.querySelectorAll('.abene-caption, [data-caption-for], [data-abene-caption]')).filter(function (el) {
            if (el.closest('[data-figures-index], [data-illustrations-index], [data-tables-index], .field-toc, [data-field-type="toc"]')) return false;
            return !kind || captionKindOf(el) === kind;
        });
    }
    function renumberCaptions() {
        var editor = editorEl();
        if (!editor) return;
        ['figure', 'table'].forEach(function (kind) {
            collectCaptions(kind).forEach(function (el, i) {
                fillCaptionNode(el, kind, i + 1, extractCaptionText(el));
            });
        });
    }
    function attachCaption(kind, text) {
        var editor = editorEl();
        var img = kind === 'figure' ? currentCaptionImage() : null;
        var table = kind === 'table' ? currentCaptionTable() : null;
        if (kind === 'table' && !table) { toast(tt('capNeedTable')); return; }
        if (kind === 'figure' && img && typeof window.abeneWrapImage === 'function') {
            window.abeneWrapImage(img);
        }
        var host = captionHost(table || img);
        var n = collectCaptions(kind).length + 1;
        var prefix = kind === 'table' ? 'tabela-' : 'figura-';
        if (img) {
            img.dataset.caption = text;
            img.alt = text || img.alt || '';
            if (!img.id) img.id = prefix + n;
        }
        if (table && !table.id) table.id = prefix + n;
        if (host) {
            var previous = findCaptionAfter(host);
            var insidePic = host.classList && host.classList.contains('abene-pic');
            var label = previous || document.createElement(insidePic ? 'span' : 'p');
            fillCaptionNode(label, kind, n, text);
            if (insidePic) label.setAttribute('contenteditable', 'true');
            if (!previous) {
                if (insidePic) {
                    var rs = host.querySelector('.abene-obj-resize');
                    if (rs) host.insertBefore(label, rs);
                    else host.appendChild(label);
                } else host.insertAdjacentElement('afterend', label);
            }
        } else {
            var tmp = document.createElement('p');
            fillCaptionNode(tmp, kind, n, text);
            insertHTML(tmp.outerHTML);
        }
        if (host && host.classList && host.classList.contains('abene-pic') && typeof window.abeneStickFigureCaption === 'function') {
            window.abeneStickFigureCaption(host);
        }
        renumberCaptions();
        refreshCaptionIndexes();
        if (typeof saveUndoState === 'function') saveUndoState();
    }
    window.insertCaption = function () {
        var img = currentCaptionImage();
        var table = currentCaptionTable();
        var kind = table && !img ? 'table' : 'figure';
        var existing = findCaptionAfter(captionHost(table || img));
        var preset = existing ? extractCaptionText(existing) : '';
        formDialog(tt('caption'), [
            {
                id: 'kind', label: tt('capKind'), type: 'select', value: kind,
                options: [{ value: 'figure', label: tt('capFigure') }, { value: 'table', label: tt('capTable') }]
            },
            { id: 'text', label: tt('capText'), value: preset }
        ], function (data) {
            var nextKind = data.kind === 'table' ? 'table' : 'figure';
            attachCaption(nextKind, String(data.text || '').trim());
        });
    };
    window.abeneRenumberCaptions = renumberCaptions;

    function indexRowHtml(id, label, page) {
        return '<p class="abene-lof-row" style="cursor:pointer"><a href="#' + esc(id) + '">' + esc(label) + '</a><span class="abene-toc-dots" aria-hidden="true"></span><span class="abene-toc-page">' + esc(String(page || '')) + '</span></p>';
    }
    function captionEntries(kind) {
        return collectCaptions(kind).map(function (cap, index) {
            var pic = cap.closest && cap.closest('.abene-pic');
            var host = pic || cap.previousElementSibling;
            if (kind === 'table') {
                if (!(host && host.tagName === 'TABLE')) {
                    if (cap.nextElementSibling && cap.nextElementSibling.tagName === 'TABLE') host = cap.nextElementSibling;
                    else if (cap.parentElement) {
                        var near = cap.parentElement.querySelector('table');
                        if (near) host = near;
                    }
                }
            }
            var target = host && ((kind === 'table' && host.tagName === 'TABLE') || (kind === 'figure' && (host.tagName === 'IMG' || (host.classList && host.classList.contains('abene-pic')))))
                ? (host.querySelector && host.querySelector('img') || host)
                : cap;
            if (!target.id) target.id = (kind === 'table' ? 'tabela-' : 'figura-') + (index + 1);
            var text = extractCaptionText(cap);
            var label = captionLabel(kind) + ' ' + (index + 1) + (text ? ' — ' + text : '');
            return { id: target.id, label: label, page: pageOfEl(target) };
        });
    }
    function contentTables(editor) {
        if (!editor) return [];
        return Array.from(editor.querySelectorAll('table')).filter(function (table) {
            if (!table || !editor.contains(table)) return false;
            if (table.closest && table.closest('[data-figures-index], [data-illustrations-index], [data-tables-index], .page-chrome, .page-decoration, .abene-page-flow, [data-bibliography], [data-index]')) return false;
            return true;
        });
    }
    function buildListIndexHtml(kind, titleKey, emptyKey) {
        var rows = captionEntries(kind);
        if (!rows.length && kind === 'figure') {
            var editor = editorEl();
            rows = Array.from(editor.querySelectorAll('img')).filter(function (image) {
                if (!image || !editor.contains(image)) return false;
                if (image.closest && image.closest('[data-figures-index], [data-illustrations-index], [data-tables-index], .page-chrome, .page-decoration, .abene-page-flow')) return false;
                return true;
            }).map(function (image, index) {
                if (!image.id) image.id = 'illustration-' + (index + 1);
                var label = image.dataset.caption || image.alt || (tt('illustration') + ' ' + (index + 1));
                return { id: image.id, label: tt('illustration') + ' ' + (index + 1) + ': ' + label, page: pageOfEl(image) };
            });
        }
        if (!rows.length && kind === 'table') {
            rows = contentTables(editorEl()).map(function (table, index) {
                if (!table.id) table.id = 'tabela-' + (index + 1);
                var firstCell = table.querySelector('th, td');
                var snippet = String((firstCell && firstCell.textContent) || '').replace(/\s+/g, ' ').trim().slice(0, 40);
                var label = (tt('capTable') || tt('table') || 'Tabela') + ' ' + (index + 1) + (snippet ? ' — ' + snippet : '');
                return { id: table.id, label: label, page: pageOfEl(table) };
            });
        }
        var body = rows.length
            ? rows.map(function (r) { return indexRowHtml(r.id, r.label, r.page); }).join('')
            : '<p>' + esc(tt(emptyKey)) + '</p>';
        var attrs = kind === 'table'
            ? 'data-tables-index="true"'
            : 'data-figures-index="true" data-illustrations-index="true"';
        return '<div ' + attrs + ' class="abene-lof" style="border:1px solid #d0d0d0;padding:20px;margin:15px 0;background:#fafafa;border-radius:4px;"><h3 style="margin-bottom:10px;color:#2b579a;">' + esc(tt(titleKey)) + '</h3>' + body + '</div>';
    }
    function buildFiguresHtml() {
        return buildListIndexHtml('figure', 'illIndexTitle', 'aNoFiguresCap');
    }
    function buildTablesHtml() {
        return buildListIndexHtml('table', 'totTitle', 'aNoTablesCap');
    }
    function refreshCaptionIndexes() {
        var editor = editorEl();
        if (!editor) return;
        var fig = editor.querySelector('[data-figures-index], [data-illustrations-index]');
        if (fig) fig.outerHTML = buildFiguresHtml();
        var tot = editor.querySelector('[data-tables-index]');
        if (tot) tot.outerHTML = buildTablesHtml();
    }
    function replaceOrInsert(selector, html, atStart) {
        var editor = editorEl();
        var existing = editor.querySelector(selector);
        if (existing) {
            existing.outerHTML = html;
        } else if (atStart) {
            editor.insertAdjacentHTML('afterbegin', html);
        } else {
            insertHTML(html);
        }
        if (typeof saveUndoState === 'function') saveUndoState();
    }
    window.insertIllustrationsIndex = function () {
        var editor = editorEl();
        if (!editor) return;
        var hasCap = collectCaptions('figure').length;
        var hasImg = !!editor.querySelector('img');
        if (!hasCap && !hasImg) { toast(tt('aNoIllustDoc')); return; }
        replaceOrInsert('[data-figures-index], [data-illustrations-index]', buildFiguresHtml(), true);
        toast(tt('illIndexTitle') || tt('illIndex'));
    };
    window.insertTableOfFigures = window.insertIllustrationsIndex;
    window.insertTableOfTables = function () {
        var editor = editorEl();
        if (!editor) return;
        var hasCap = collectCaptions('table').length;
        var hasTable = contentTables(editor).length;
        if (!hasCap && !hasTable) {
            toast(tt('aNoTablesDoc') || tt('aNoTablesCap'));
            return;
        }
        replaceOrInsert('[data-tables-index]', buildTablesHtml(), true);
        toast(tt('totTitle') || tt('tocTables'));
    };

    window.insertCrossReference = function () {
        var editor = editorEl();
        if (!editor) return;
        var targets = [];
        var seen = {};
        function addTarget(el, label, kind) {
            if (!el || !editor.contains(el)) return;
            if (el.closest && el.closest('[data-field-type="toc"], .field-toc, [data-abene-block="toc"], [data-index], [data-bibliography], [data-figures-index], [data-illustrations-index], [data-tables-index]')) return;
            if (!el.id) el.id = 'xref-' + Math.random().toString(36).slice(2, 9);
            if (seen[el.id]) return;
            seen[el.id] = true;
            var lab = String(label || '').trim().replace(/\s+/g, ' ').slice(0, 90);
            if (!lab) return;
            var prefix = '';
            if (kind === 'figure') prefix = (tt('capFigure') || 'Figura') + ' — ';
            else if (kind === 'table') prefix = (tt('capTable') || 'Tabela') + ' — ';
            else if (kind === 'heading') prefix = (tt('xrefHeading') || 'Título') + ' — ';
            targets.push({ value: el.id, label: prefix + lab, display: lab });
        }
        var heads = (typeof headingTargets === 'function') ? headingTargets() : [];
        if (!heads.length) {
            heads = Array.prototype.slice.call(editor.querySelectorAll('h1, h2, h3, h4'));
        }
        heads.forEach(function (h) { addTarget(h, h.textContent, 'heading'); });
        if (typeof collectCaptions === 'function') {
            collectCaptions('figure').forEach(function (c) {
                var num = c.querySelector('.abene-caption-num');
                var tx = typeof extractCaptionText === 'function' ? extractCaptionText(c) : '';
                addTarget(c, ((num ? String(num.textContent || '').trim() : '') + (tx ? ' — ' + tx : '')) || String(c.textContent || ''), 'figure');
            });
            collectCaptions('table').forEach(function (c) {
                var num = c.querySelector('.abene-caption-num');
                var tx = typeof extractCaptionText === 'function' ? extractCaptionText(c) : '';
                addTarget(c, ((num ? String(num.textContent || '').trim() : '') + (tx ? ' — ' + tx : '')) || String(c.textContent || ''), 'table');
            });
        }
        editor.querySelectorAll('img').forEach(function (img) {
            var host = typeof captionHost === 'function' ? captionHost(img) : img;
            if (typeof findCaptionAfter === 'function' && findCaptionAfter(host)) return;
            var lab = img.getAttribute('data-caption') || img.getAttribute('alt') || '';
            if (!String(lab).trim()) return;
            addTarget(img, lab, 'figure');
        });
        if (!targets.length) { toast(tt('aNoHeadingXref')); return; }
        formDialog(tt('xref'), [{ id: 'id', label: tt('xrefTarget'), type: 'select', options: targets, value: targets[0].value }], function (data) {
            var target = null;
            try { target = editor.querySelector('[id="' + String(data.id || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"]'); } catch (eQ) {}
            if (!target) target = document.getElementById(data.id);
            if (!target) return;
            var chosen = targets.filter(function (t) { return t.value === data.id; })[0];
            var display = (chosen && chosen.display) || (target.tagName === 'IMG'
                ? (target.getAttribute('alt') || target.dataset.caption || tt('seeRef'))
                : String(target.textContent || tt('seeRef')).trim().slice(0, 80));
            insertHTML('<a class="abene-xref" href="#' + esc(target.id) + '" data-abene-xref="1" style="color:#2b579a;text-decoration:underline;">' + esc(display) + '</a>');
            toast(tt('xrefInserted') || tt('xref'));
        });
    };

    function citeStyle() { return localStorage.getItem('abeneCitationStyle') || 'APA'; }
    function formatInText(author, year) {
        var s = citeStyle();
        if (s === 'MLA') return '(' + author + ' ' + year + ')';
        if (s === 'Chicago') return '(' + author + ' ' + year + ')';
        return '(' + author + ', ' + year + ')';
    }
    function formatBiblio(author, title, year) {
        var s = citeStyle();
        if (s === 'MLA') return author + '. <i>' + title + '</i>. ' + year + '.';
        if (s === 'Chicago') return author + '. <i>' + title + '</i>. ' + year + '.';
        return author + '. (' + year + '). <i>' + title + '</i>.';
    }
    function refreshInTextCitations() {
        var editor = editorEl();
        if (!editor) return;
        editor.querySelectorAll('[data-citation]').forEach(function (c) {
            var a = c.getAttribute('data-cite-author');
            var y = c.getAttribute('data-cite-year') || '';
            if (!a) return;
            c.textContent = formatInText(a, y);
        });
    }
    window.setCitationStyle = function (ev) {
        if (ev && ev.currentTarget) {
            showFly(ev,
                '<button onclick="abeneApplyCiteStyle(\'APA\')">APA</button>' +
                '<button onclick="abeneApplyCiteStyle(\'MLA\')">MLA</button>' +
                '<button onclick="abeneApplyCiteStyle(\'Chicago\')">Chicago</button>'
            );
            return;
        }
        formDialog(tt('citeStyle'), [{
            id: 'style', label: tt('pCiteStyle'), type: 'select', value: citeStyle(),
            options: [{ value: 'APA', label: 'APA' }, { value: 'MLA', label: 'MLA' }, { value: 'Chicago', label: 'Chicago' }]
        }], function (data) { window.abeneApplyCiteStyle(data.style); });
    };
    window.abeneApplyCiteStyle = function (style) {
        hideFly();
        var normalized = ['APA', 'MLA', 'Chicago'].indexOf(style) >= 0 ? style : 'APA';
        localStorage.setItem('abeneCitationStyle', normalized);
        refreshInTextCitations();
        rebuildBibliography(false);
        toast(tt('aCiteSet', { s: normalized }));
        if (typeof saveUndoState === 'function') saveUndoState();
    };
    window.insertCitation = function () {
        formDialog(tt('citation'), [
            { id: 'author', label: tt('pAuthor'), value: tt('pAuthorDef') },
            { id: 'title', label: tt('pSourceTitle'), value: tt('pSourceDef') },
            { id: 'year', label: tt('pYear'), value: String(new Date().getFullYear()) }
        ], function (data) {
            var author = (data.author || '').trim();
            var title = (data.title || '').trim();
            var year = (data.year || '').trim();
            if (!author || !title) return;
            insertHTML('<span data-citation="true" data-cite-author="' + esc(author) + '" data-cite-title="' + esc(title) + '" data-cite-year="' + esc(year) + '" style="color:#2b579a;">' + esc(formatInText(author, year)) + '</span>');
            rebuildBibliography(true);
            toast(tt('citeInserted') || tt('citation'));
        });
    };
    function rebuildBibliography(createIfMissing) {
        var editor = editorEl();
        var citations = editor.querySelectorAll('[data-citation]');
        var existing = editor.querySelector('[data-bibliography]');
        if (!citations.length && !existing) return;
        if (!citations.length && existing) {
            existing.innerHTML = '<h3>' + esc(tt('bibliography')) + '</h3><p>' + esc(tt('biblioEmpty')) + '</p>';
            return;
        }
        if (!existing && !createIfMissing) return;
        var seen = {};
        var rows = [];
        Array.prototype.forEach.call(citations, function (c) {
            var a = c.getAttribute('data-cite-author');
            var ti = c.getAttribute('data-cite-title');
            var y = c.getAttribute('data-cite-year') || '';
            if (a && ti) {
                var key = (a + '|' + ti + '|' + y).toLocaleLowerCase();
                if (seen[key]) return;
                seen[key] = true;
                rows.push('<p>' + formatBiblio(esc(a), esc(ti), esc(y)) + '</p>');
                return;
            }
            var fallback = String(c.textContent || '').replace(/[()]/g, '').trim();
            if (!fallback) return;
            var fk = fallback.toLocaleLowerCase();
            if (seen[fk]) return;
            seen[fk] = true;
            rows.push('<p>' + esc(fallback) + '</p>');
        });
        var html = '<h3>' + esc(tt('bibliography')) + '</h3>' + (rows.length ? rows.join('') : '<p>' + esc(tt('biblioEmpty')) + '</p>');
        if (existing) existing.innerHTML = html;
        else {
            var box = document.createElement('div');
            box.dataset.bibliography = 'true';
            box.style.cssText = 'border-top:1px solid #d0d0d0;margin-top:25px;padding-top:10px;';
            box.innerHTML = html;
            editor.appendChild(box);
        }
        if (typeof saveUndoState === 'function') saveUndoState();
    }
    window.insertBibliography = function () {
        rebuildBibliography(true);
        var editor = editorEl();
        if (!editor.querySelector('[data-citation]')) toast(tt('biblioEmpty'));
    };

    function pageOfEl(el) {
        var editor = editorEl();
        if (!el || !editor) return 1;
        var y = 0;
        if (typeof window.abeneYInEditor === 'function') y = window.abeneYInEditor(el, editor);
        else {
            try {
                var er = editor.getBoundingClientRect();
                var rr = el.getBoundingClientRect();
                if (er.height) y = (rr.top - er.top) * (editor.offsetHeight / er.height);
            } catch (err) { y = el.offsetTop || 0; }
        }
        var h = (window.PageGeometry && window.PageGeometry.height) || 1123;
        var physical = Math.max(1, Math.floor(y / h) + 1);
        if (window.ABENE && window.ABENE.Sections && typeof window.ABENE.Sections.pageNumberInfo === 'function') {
            var total = window.abeneCountUsedPages ? window.abeneCountUsedPages(editor) : physical;
            var info = window.ABENE.Sections.pageNumberInfo(physical - 1, total);
            if (info && info.hideNumbers) return '';
            if (info && (info.label || info.display)) return info.label || info.display;
        }
        return physical;
    }
    function headingLevel(h) {
        if (!h) return 1;
        if (/^H[1-6]$/.test(h.tagName)) return parseInt(h.tagName[1], 10);
        var st = h.getAttribute('data-abene-style') || '';
        if (st === 'title') return 1;
        if (st === 'subtitle') return 2;
        if (/^h[1-9]$/.test(st)) return parseInt(st.slice(1), 10);
        if (h.classList.contains('abene-title')) return 1;
        if (h.classList.contains('abene-subtitle')) return 2;
        var clsLvl = String(h.className || '').match(/\babene-h([1-9])\b/);
        if (clsLvl) return parseInt(clsLvl[1], 10);
        return 1;
    }
    function headingTargets() {
        var editor = editorEl();
        if (!editor) return [];
        var sel = 'h1, h2, h3, h4, h5, h6, .abene-title, .abene-subtitle, .abene-h1, .abene-h2, .abene-h3, .abene-h4, .abene-h5, .abene-h6, .abene-h7, .abene-h8, .abene-h9, [data-abene-style="title"], [data-abene-style="subtitle"], [data-abene-style="h1"], [data-abene-style="h2"], [data-abene-style="h3"], [data-abene-style="h4"], [data-abene-style="h5"], [data-abene-style="h6"], [data-abene-style="h7"], [data-abene-style="h8"], [data-abene-style="h9"]';
        return Array.from(editor.querySelectorAll(sel)).filter(function (h) {
            if (h.closest('[data-abene-block="cover"], [data-abene-block="titlepage"], [data-abene-block="toc"], .field-toc, [data-field-type="toc"], [data-figures-index], [data-illustrations-index], [data-tables-index], [data-index], [data-bibliography]')) return false;
            return !!String(h.textContent || '').trim();
        });
    }
    function buildTocListHtml() {
        var headings = headingTargets();
        if (!headings.length) return '<p>' + esc(tt('aNoToc')) + '</p>';
        return headings.map(function (h) {
            if (!h.id) h.id = 'h-' + Math.random().toString(36).slice(2, 8);
            var level = headingLevel(h);
            return '<p class="abene-toc-row" data-toc-level="' + level + '" style="padding-left:' + ((Math.max(1, level) - 1) * 16) + 'px;cursor:pointer">' +
                '<a href="#' + esc(h.id) + '">' + esc(h.textContent.trim()) + '</a>' +
                '<span class="abene-toc-dots" aria-hidden="true"></span>' +
                '<span class="abene-toc-page">' + pageOfEl(h) + '</span></p>';
        }).join('');
    }
    function buildTocHtml() {
        return '<div class="field-toc" data-field-type="toc" style="border:1px solid #d0d0d0;padding:20px;margin:15px 0;background:#fafafa;border-radius:4px;"><h3 class="abene-toc-title" style="margin-bottom:10px;color:#2b579a;">' + esc(tt('tocTitle')) + '</h3>' + buildTocListHtml() + '</div>';
    }
    function fillFieldToc(el) {
        if (!el) return;
        if ((el.className || '').indexOf('field-toc') < 0) el.className = (el.className || '') + ' field-toc';
        el.setAttribute('data-field-type', 'toc');
        var title = el.querySelector('h3, h1');
        var titleHtml = title ? title.outerHTML : '<h3 class="abene-toc-title" style="margin-bottom:10px;color:#2b579a;">' + esc(tt('tocTitle')) + '</h3>';
        el.innerHTML = titleHtml + buildTocListHtml();
    }
    window.abeneBuildTocHtml = buildTocHtml;
    window.abeneFillModeloToc = function (block) {
        if (!block) return;
        var h = Array.from(block.children).filter(function (c) { return c.tagName === 'H1'; })[0];
        var title = h ? h.outerHTML : '<h1>' + esc(tt('tocTitle') || 'Índice') + '</h1>';
        block.innerHTML = title + '<div class="abene-toc-body field-toc" data-field-type="toc">' + buildTocListHtml() + '</div>';
    };
    function refreshAllTocs() {
        var editor = editorEl();
        if (!editor) return;
        editor.querySelectorAll('[data-abene-block="toc"]').forEach(function (block) {
            window.abeneFillModeloToc(block);
        });
        editor.querySelectorAll('[data-field-type="toc"], .field-toc').forEach(function (el) {
            if (el.closest('[data-abene-block="toc"]')) return;
            fillFieldToc(el);
        });
    }
    var legacyInsertTOC = window.insertTOC;
    window.insertTOC = function () {
        try {
            if (!headingTargets().length) { toast(tt('aNoToc')); return; }
            var editor = editorEl();
            var modelo = editor && editor.querySelector('[data-abene-block="toc"]');
            if (modelo) {
                window.abeneFillModeloToc(modelo);
                if (typeof saveUndoState === 'function') saveUndoState();
                return;
            }
            replaceOrInsert('[data-field-type="toc"], .field-toc', buildTocHtml(), true);
        } catch (err) {
            if (typeof legacyInsertTOC === 'function' && legacyInsertTOC !== window.insertTOC) {
                return legacyInsertTOC.apply(this, arguments);
            }
            throw err;
        }
    };
    window.abeneUpdateToc = function () {
        var editor = editorEl();
        if (!editor || !editor.querySelector('[data-field-type="toc"], .field-toc, [data-abene-block="toc"]')) {
            toast(tt('tocMissing') || tt('aNoToc'));
            return;
        }
        if (typeof window.updateAllFields === 'function') window.updateAllFields();
    };
    function cssAttrId(id) {
        var s = String(id || '');
        if (window.CSS && typeof CSS.escape === 'function') return CSS.escape(s);
        return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }
    window.abeneJumpToAnchor = function (id) {
        id = String(id || '').replace(/^#/, '');
        if (!id) return false;
        var editor = editorEl();
        var target = null;
        try {
            if (editor) {
                var nodes = editor.querySelectorAll('[id="' + cssAttrId(id) + '"]');
                var i;
                for (i = 0; i < nodes.length; i++) {
                    if (nodes[i].closest && nodes[i].closest('.abene-page-flow, .page-chrome')) continue;
                    target = nodes[i];
                    break;
                }
                if (!target && nodes.length) target = nodes[0];
            }
            if (!target) target = document.getElementById(id);
        } catch (err) {
            target = document.getElementById(id);
        }
        if (!target) return false;
        try { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (eScr) {
            try { target.scrollIntoView(true); } catch (eScr2) {}
        }
        try {
            var sel = window.getSelection();
            var r = document.createRange();
            r.selectNodeContents(target);
            r.collapse(true);
            sel.removeAllRanges();
            sel.addRange(r);
        } catch (eCaret) {}
        return true;
    };
    var legacyInsertIndex = window.insertIndex;
    function collectIndexGroups() {
        var editor = editorEl();
        var map = {};
        if (!editor) return [];
        Array.prototype.forEach.call(editor.querySelectorAll('[data-index-entry]'), function (el) {
            if (!el || (el.closest && el.closest('[data-index="true"], [data-index]'))) return;
            var raw = String(el.textContent || '').trim();
            if (!raw) return;
            var k = raw.toLocaleLowerCase();
            if (!map[k]) map[k] = { label: raw, els: [] };
            if (!el.id) el.id = 'idxe-' + Math.random().toString(36).slice(2, 9);
            map[k].els.push(el);
        });
        var loc = document.documentElement.lang || 'pt-PT';
        return Object.keys(map).sort(function (a, b) { return a.localeCompare(b, loc); }).map(function (k) { return map[k]; });
    }
    function buildIndexListHtml() {
        var groups = collectIndexGroups();
        if (!groups.length) return '<p>' + esc(tt('noIndex')) + '</p>';
        return groups.map(function (g) {
            var seen = {};
            var pages = [];
            g.els.forEach(function (el) {
                var p = String(pageOfEl(el) || '');
                if (!p || seen[p]) return;
                seen[p] = true;
                pages.push({ n: p, id: el.id });
            });
            var firstId = (g.els[0] && g.els[0].id) || '';
            var pageHtml = pages.map(function (p) {
                return '<a class="abene-idx-page" href="#' + esc(p.id) + '">' + esc(p.n) + '</a>';
            }).join(', ');
            return '<p class="abene-idx-row" style="margin:2px 0;cursor:pointer">' +
                '<a href="#' + esc(firstId) + '">' + esc(g.label) + '</a>' +
                '<span class="abene-toc-dots" aria-hidden="true"></span>' +
                '<span class="abene-toc-page">' + (pageHtml || '') + '</span></p>';
        }).join('');
    }
    function buildIndexHtml() {
        return '<div data-index="true" class="abene-index" style="border:1px solid #d0d0d0;padding:20px;margin:15px 0;background:#fafafa;"><h3 style="margin-bottom:10px;color:#2b579a;">' + esc(tt('idxTitle')) + '</h3>' + buildIndexListHtml() + '</div>';
    }
    function refreshIndex() {
        var editor = editorEl();
        var box = editor && editor.querySelector('[data-index="true"]');
        if (!box) return;
        var title = box.querySelector('h3');
        var titleHtml = title ? title.outerHTML : '<h3 style="margin-bottom:10px;color:#2b579a;">' + esc(tt('idxTitle')) + '</h3>';
        box.classList.add('abene-index');
        box.innerHTML = titleHtml + buildIndexListHtml();
    }
    window.insertIndex = function () {
        try {
            var editor = editorEl();
            if (!editor) return;
            var sel = window.getSelection();
            var text = sel && sel.toString().trim();
            if (text && sel.rangeCount && editor.contains(sel.anchorNode)) {
                var span = document.createElement('span');
                span.setAttribute('data-index-entry', 'true');
                span.id = 'idxe-' + Math.random().toString(36).slice(2, 9);
                try { sel.getRangeAt(0).surroundContents(span); } catch (eMark) {
                    span.appendChild(sel.getRangeAt(0).extractContents());
                    sel.getRangeAt(0).insertNode(span);
                }
            }
            var groups = collectIndexGroups();
            if (!groups.length) { toast(tt('idxSelectFirst')); return; }
            replaceOrInsert('[data-index="true"]', buildIndexHtml(), true);
            toast(tt('idxBuilt') || tt('idxTitle'));
        } catch (errIdx) {
            if (typeof legacyInsertIndex === 'function' && legacyInsertIndex !== window.insertIndex) {
                return legacyInsertIndex.apply(this, arguments);
            }
        }
    };

    var fieldsBusy = false;
    window.updateAllFields = function (opts) {
        if (fieldsBusy) return;
        var silent = opts && opts.silent;
        var editor = editorEl();
        if (!editor) return;
        fieldsBusy = true;
        try {
            if (typeof refreshPagination === 'function' && !silent) refreshPagination();
            renumberCaptions();
            if (editor.querySelector('[data-field-type="toc"], .field-toc, [data-abene-block="toc"]')) {
                refreshAllTocs();
            }
            refreshCaptionIndexes();
            refreshIndex();
            refreshInTextCitations();
            rebuildBibliography(false);
            var ph = (window.PageGeometry && window.PageGeometry.height) || 1123;
            var totalPages = window.abeneCountUsedPages ? window.abeneCountUsedPages(editor) : Math.max(1, Math.ceil(editor.scrollHeight / ph));
            editor.querySelectorAll('[data-field-type="page"]').forEach(function (field) {
                var page = Math.max(1, Math.min(totalPages, pageOfEl(field)));
                field.textContent = (tt('statusPage') || 'Página') + ' ' + page + ' / ' + totalPages;
            });
            editor.querySelectorAll('[data-field-type="date"]').forEach(function (field) {
                field.textContent = new Date().toLocaleDateString(document.documentElement.lang || 'pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            });
            if (!silent) toast(tt('updateFields'));
        } finally {
            fieldsBusy = false;
        }
    };

    var THEME_COLORS = ['#000000', '#44546A', '#2b579a', '#5B9BD5', '#ED7D31', '#A5A5A5', '#FFC000', '#4472C4', '#70AD47', '#c9a84c', '#c0392b', '#1e4e79'];
    var HIGHLIGHTS = ['#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ffa500', '#ffff99', '#c6efce', '#ffc7ce'];
    var WORDART_CSS = {
        blue: 'font-size:28pt;font-weight:700;color:#2b579a;text-shadow:2px 2px 0 #dbe7f5;letter-spacing:.5px',
        gold: 'font-size:28pt;font-weight:700;color:#c9a84c;text-shadow:1px 1px 0 #0b1223;letter-spacing:.5px',
        outline: 'font-size:28pt;font-weight:700;-webkit-text-stroke:1px #2b579a;color:#fff;letter-spacing:1px',
        fill: 'font-size:32pt;font-weight:800;background-image:linear-gradient(90deg,#2b579a,#5B9BD5);-webkit-background-clip:text;background-clip:text;color:transparent'
    };
    window._abeneWordArtStyle = 'blue';

    function swatchesHtml(colors, fn) {
        return '<div class="abene-swatch-row">' + colors.map(function (c) {
            return '<button type="button" class="abene-swatch" style="background:' + c + '" onclick="' + fn + '(\'' + c + '\')"></button>';
        }).join('') + '</div>';
    }
    function setFooterText(text) {
        hideFly();
        if (window.abene) window.abene.pageFooterText = text;
        try { localStorage.setItem('abeneFooter', text); } catch (e) {}
        window._abeneChromeSig = '';
        if (typeof renderPageDecorations === 'function') renderPageDecorations();
        if (typeof saveUndoState === 'function') saveUndoState();
        if (text && window.abeneActivateHeaderFooter) window.abeneActivateHeaderFooter('footer');
    }
    function setHeaderText(text) {
        hideFly();
        if (window.abene) {
            window.abene.pageHeaderText = text;
            window.abene.pageHeaderTemplate = text ? 'text' : 'blank';
        }
        try {
            localStorage.setItem('abeneHeader', text);
            localStorage.setItem('abeneHeaderTemplate', text ? 'text' : 'blank');
        } catch (e) {}
        window._abeneChromeSig = '';
        if (typeof renderPageDecorations === 'function') renderPageDecorations();
        if (typeof saveUndoState === 'function') saveUndoState();
        if (text && window.abeneActivateHeaderFooter) window.abeneActivateHeaderFooter('header');
    }

    window.showPagesMenu = function (ev) {
        showFly(ev,
            '<button onclick="insertPageBreak();hideRibbonFlyout()">' + tt('pageBreak') + ' <span class="shortcut">' + tt('scPageBreak') + '</span></button>' +
            '<button onclick="insertBlankPage()">' + tt('blankPage') + '</button>' +
            '<button onclick="insertColumnBreak();hideRibbonFlyout()">' + tt('colBreak') + '</button>' +
            '<button onclick="insertSectionBreak(\'nextPage\');hideRibbonFlyout()">' + tt('secBreakNext') + '</button>' +
            '<button onclick="insertSectionBreak(\'continuous\');hideRibbonFlyout()">' + tt('secBreakCont') + '</button>' +
            '<button onclick="insertSectionBreak(\'evenPage\');hideRibbonFlyout()">' + tt('secBreakEven') + '</button>' +
            '<button onclick="insertSectionBreak(\'oddPage\');hideRibbonFlyout()">' + tt('secBreakOdd') + '</button>'
        );
    };
    window.showSectionMenu = function (ev) {
        showFly(ev,
            '<button onclick="insertSection();hideRibbonFlyout()">' + tt('sectionHeading') + '</button>' +
            '<button onclick="insertSectionBreak(\'nextPage\');hideRibbonFlyout()">' + tt('secBreakNext') + '</button>' +
            '<button onclick="insertSectionBreak(\'continuous\');hideRibbonFlyout()">' + tt('secBreakCont') + '</button>' +
            '<button onclick="insertSectionBreak(\'evenPage\');hideRibbonFlyout()">' + tt('secBreakEven') + '</button>' +
            '<button onclick="insertSectionBreak(\'oddPage\');hideRibbonFlyout()">' + tt('secBreakOdd') + '</button>' +
            '<button onclick="insertSectionRole(\'front\');hideRibbonFlyout()">' + tt('secRoleFront') + '</button>' +
            '<button onclick="insertSectionRole(\'body\');hideRibbonFlyout()">' + tt('secRoleBody') + '</button>' +
            '<button onclick="insertSectionRole(\'annex\');hideRibbonFlyout()">' + tt('secRoleAnnex') + '</button>' +
            '<button onclick="applyReportSections();hideRibbonFlyout()">' + tt('secApplyStructure') + '</button>'
        );
    };
    window.insertBlankPage = function () {
        hideFly();
        if (window.abeneInsertPageBreak) window.abeneInsertPageBreak();
        else insertHTML('<div class="page-break-marker" contenteditable="false" aria-hidden="true"></div><p class="abene-normal"><br></p>');
        if (window.abeneSchedulePageFlow) window.abeneSchedulePageFlow(true);
    };
    window.showImageMenu = function (ev) {
        showFly(ev,
            '<button onclick="hideRibbonFlyout();openInsertImageModal()">' + tt('imgInsert') + '</button>' +
            '<button onclick="hideRibbonFlyout();insertImage()">' + tt('imgFromFile') + '</button>' +
            '<button onclick="hideRibbonFlyout();insertOnlineImage()">' + tt('imgFromUrl') + '</button>' +
            '<button onclick="hideRibbonFlyout();captureScreen()">' + tt('imgCapture') + '</button>'
        );
    };
    window.showFooterMenu = function (ev) {
        var co = (window.abene && window.abene.companyData && window.abene.companyData.name) || 'Genius Raros';
        showFly(ev,
            '<button onclick="applyFooterPreset(\'blank\')">' + tt('ftBlank') + '</button>' +
            '<button onclick="applyFooterPreset(\'page\')">' + tt('ftPage') + '</button>' +
            '<button onclick="applyFooterPreset(\'full\')">' + tt('ftPageFull') + '</button>' +
            '<button onclick="applyFooterPreset(\'company\')">' + tt('ftCompany') + '</button>' +
            (typeof window.abeneHfSectionMenuButtons === 'function' ? window.abeneHfSectionMenuButtons() : '')
        );
        window._abeneFooterCo = co;
    };
    window.applyFooterPreset = function (kind) {
        var co = window._abeneFooterCo || 'Genius Raros';
        if (kind === 'blank') setFooterText('');
        else if (kind === 'page') setFooterText('{PAGE}');
        else if (kind === 'full') setFooterText(tt('statusPage') + ' {PAGE} / {NUMPAGES}');
        else setFooterText(co + '  ·  {PAGE} / {NUMPAGES}');
    };
    window.showPageNumberMenu = function (ev) {
        showFly(ev,
            '<button onclick="applyPageNumber(\'footer-simple\')">' + tt('pnFooter') + ' — ' + tt('pnSimple') + '</button>' +
            '<button onclick="applyPageNumber(\'footer-of\')">' + tt('pnFooter') + ' — ' + tt('pnOf') + '</button>' +
            '<button onclick="applyPageNumber(\'header-simple\')">' + tt('pnHeader') + ' — ' + tt('pnSimple') + '</button>' +
            '<button onclick="applyPageNumber(\'header-of\')">' + tt('pnHeader') + ' — ' + tt('pnOf') + '</button>'
        );
    };
    function applyPageNumberLegacy(kind) {
        if (kind.indexOf('header') === 0) {
            setHeaderText(kind.indexOf('of') >= 0 ? '{PAGE} / {NUMPAGES}' : '{PAGE}');
        } else {
            setFooterText(kind.indexOf('of') >= 0 ? (tt('statusPage') + ' {PAGE} / {NUMPAGES}') : '{PAGE}');
        }
    }
    window.applyPageNumber = function (kind) {
        try {
            var A = window.abene || {};
            var add = kind.indexOf('of') >= 0 ? '{PAGE} / {NUMPAGES}' : '{PAGE}';
            var addFooter = kind.indexOf('of') >= 0 ? (tt('statusPage') + ' {PAGE} / {NUMPAGES}') : '{PAGE}';
            if (kind.indexOf('header') === 0) {
                var tpl = String(A.pageHeaderTemplate || '');
                if (/^(gr-report|gr-letter|triple)$/.test(tpl)) {
                    var ft = String(A.pageFooterText == null ? '' : A.pageFooterText);
                    if (!/\{PAGE\}/i.test(ft)) setFooterText(ft ? (ft + '  ' + addFooter) : addFooter);
                    else if (window.abeneActivateHeaderFooter) window.abeneActivateHeaderFooter('header');
                    return;
                }
                var ht = String(A.pageHeaderText || '');
                if (ht && !/\{PAGE\}/i.test(ht)) {
                    setHeaderText(ht + '  ' + add);
                    return;
                }
            } else {
                var fcur = String(A.pageFooterText == null ? '' : A.pageFooterText);
                if (fcur && !/\{PAGE\}/i.test(fcur)) {
                    setFooterText(fcur + '  ' + addFooter);
                    return;
                }
            }
        } catch (ePn) {}
        applyPageNumberLegacy(kind);
    };
    window.showDateMenu = function (ev) {
        var loc = document.documentElement.lang || 'pt-PT';
        var now = new Date();
        window._abeneDateOpts = [
            now.toLocaleDateString(loc),
            now.toLocaleDateString(loc, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            now.toISOString().slice(0, 10),
            now.toLocaleString(loc)
        ];
        var labels = [tt('dateShort'), tt('dateLong'), tt('dateIso'), tt('dateTime')];
        showFly(ev, labels.map(function (lab, i) {
            return '<button onclick="insertDateValue(' + i + ')">' + lab + ' — ' + esc(window._abeneDateOpts[i]) + '</button>';
        }).join(''));
    };
    window.insertDateValue = function (i) {
        hideFly();
        var str = (window._abeneDateOpts || [])[i];
        if (!str) return;
        insertHTML('<span class="field-date" data-field-type="date">' + esc(str) + '</span>');
    };
    var HR_STYLE_MAP = {
        solid: 'border:0;border-top:1px solid #333',
        thick: 'border:0;border-top:3px solid #2b579a',
        dashed: 'border:0;border-top:1px dashed #333',
        dotted: 'border:0;border-top:1px dotted #333',
        double: 'border:0;border-top:3px double #333'
    };
    function selectedHR() {
        var editor = editorEl();
        if (!editor) return null;
        return editor.querySelector('hr.abene-hr-selected, hr.selected') || null;
    }
    function clearHRSelection() {
        var editor = editorEl();
        if (!editor) return;
        editor.querySelectorAll('hr.abene-hr-selected, hr.selected').forEach(function (hr) {
            hr.classList.remove('abene-hr-selected', 'selected');
        });
    }
    function selectHR(hr) {
        if (!hr) return;
        clearHRSelection();
        hr.classList.add('abene-hr', 'abene-hr-selected');
        if (!hr.getAttribute('data-abene-hr')) hr.setAttribute('data-abene-hr', '1');
    }
    function applyHRLook(hr, kind) {
        if (!hr) return;
        var css = HR_STYLE_MAP[kind] || HR_STYLE_MAP.solid;
        hr.setAttribute('style', css + ';margin:15px 0;');
        hr.setAttribute('data-hr-style', kind || 'solid');
        hr.classList.add('abene-hr');
        hr.setAttribute('data-abene-hr', '1');
        hr.contentEditable = 'false';
    }
    window.showLineMenu = function (ev) {
        var has = !!selectedHR();
        var html =
            '<button onclick="insertHRStyle(\'solid\')">' + tt('lineSolid') + '</button>' +
            '<button onclick="insertHRStyle(\'thick\')">' + tt('lineThick') + '</button>' +
            '<button onclick="insertHRStyle(\'dashed\')">' + tt('lineDashed') + '</button>' +
            '<button onclick="insertHRStyle(\'dotted\')">' + tt('lineDotted') + '</button>' +
            '<button onclick="insertHRStyle(\'double\')">' + tt('lineDouble') + '</button>';
        if (has) {
            html += '<div class="fly-sep"></div>' +
                '<button onclick="removeSelectedHR()">' + esc(tt('lineRemove') !== 'lineRemove' ? tt('lineRemove') : 'Remover linha') + '</button>';
        }
        showFly(ev, html);
    };
    var _legacyInsertHRStyle = window.insertHRStyle;
    window.insertHRStyle = function (kind) {
        hideFly();
        kind = kind || 'solid';
        var existing = selectedHR();
        if (existing) {
            applyHRLook(existing, kind);
            selectHR(existing);
            if (typeof saveUndoState === 'function') saveUndoState();
            return;
        }
        if (!HR_STYLE_MAP[kind] && typeof _legacyInsertHRStyle === 'function') {
            return _legacyInsertHRStyle(kind);
        }
        var css = HR_STYLE_MAP[kind] || HR_STYLE_MAP.solid;
        insertHTML('<hr class="abene-hr" data-abene-hr="1" data-hr-style="' + esc(kind) + '" contenteditable="false" style="' + css + ';margin:15px 0;">');
        var editor = editorEl();
        if (editor) {
            var hrs = editor.querySelectorAll('hr.abene-hr, hr[data-abene-hr]');
            if (hrs.length) selectHR(hrs[hrs.length - 1]);
        }
    };
    window.removeSelectedHR = function () {
        hideFly();
        var hr = selectedHR();
        if (!hr || !hr.parentNode) return;
        hr.parentNode.removeChild(hr);
        clearHRSelection();
        if (typeof saveUndoState === 'function') saveUndoState();
    };
    window.abeneSelectHR = selectHR;
    window.abeneClearHRSelection = clearHRSelection;
    (function bindHROnce() {
        if (window._abeneHRBound) return;
        window._abeneHRBound = true;
        document.addEventListener('click', function (e) {
            var editor = editorEl();
            if (!editor || document.body.classList.contains('abene-excel-mode')) return;
            var hr = e.target && e.target.closest && e.target.closest('hr');
            if (hr && editor.contains(hr)) {
                e.preventDefault();
                selectHR(hr);
                return;
            }
            if (e.target && e.target.closest && e.target.closest('#ribbonFlyout, .ribbon-btn, .find-replace-panel')) return;
            if (editor.contains(e.target)) clearHRSelection();
        }, true);
        document.addEventListener('keydown', function (e) {
            if (document.body.classList.contains('abene-excel-mode')) return;
            if (e.key !== 'Delete' && e.key !== 'Backspace') return;
            var tag = e.target && e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            var hr = selectedHR();
            if (!hr) return;
            e.preventDefault();
            window.removeSelectedHR();
        }, true);
        var legacyHR = window.insertHR;
        if (typeof legacyHR === 'function') {
            window.insertHR = function () {
                return window.insertHRStyle('solid');
            };
        }
    })();
    window.showWordArtMenu = function (ev) {
        showFly(ev,
            '<button onclick="pickWordArt(\'blue\')">' + tt('waBlue') + '</button>' +
            '<button onclick="pickWordArt(\'gold\')">' + tt('waGold') + '</button>' +
            '<button onclick="pickWordArt(\'outline\')">' + tt('waOutline') + '</button>' +
            '<button onclick="pickWordArt(\'fill\')">' + tt('waFill') + '</button>'
        );
    };
    window.pickWordArt = function (style) {
        hideFly();
        window._abeneWordArtStyle = style;
        window.insertWordArt();
    };
    var origInsertWordArt = window.insertWordArt;
    window.insertWordArt = function () {
        formDialog(tt('wordArt'), [{ id: 'text', label: tt('wordart'), value: tt('wordartDefault') }], function (data) {
            if (!data.text) return;
            var css = WORDART_CSS[window._abeneWordArtStyle] || WORDART_CSS.blue;
            insertHTML('<div data-wordart="true" style="display:inline-block;margin:12px 0;' + css + ';">' + esc(data.text) + '</div>');
        });
    };
    window.showDropCapMenu = function (ev) {
        showFly(ev,
            '<button onclick="applyDropCap(\'none\')">' + tt('dropNone') + '</button>' +
            '<button onclick="applyDropCap(\'dropped\')">' + tt('dropDropped') + '</button>' +
            '<button onclick="applyDropCap(\'margin\')">' + tt('dropMargin') + '</button>'
        );
    };
    window.applyDropCap = function (mode) {
        hideFly();
        var editor = editorEl();
        if (!editor) return;
        var sel = window.getSelection();
        var block = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
        block = block && block.closest('p');
        if (!block) { toast(tt('selectParagraph')); return; }
        var existing = block.querySelector('[data-dropcap]');
        if (existing) {
            block.insertBefore(document.createTextNode(existing.textContent), existing);
            existing.remove();
        }
        if (mode === 'none') { if (typeof saveUndoState === 'function') saveUndoState(); return; }
        var first = block.firstChild;
        while (first && first.nodeType === 3 && !first.textContent.trim()) first = first.nextSibling;
        if (!first || first.nodeType !== 3) return;
        var letter = first.textContent.trim().charAt(0);
        first.textContent = first.textContent.replace(/^\s*/, '').slice(1);
        var css = mode === 'margin'
            ? 'float:left;font-size:36pt;line-height:.85;margin:0 12px 0 -8px;padding:0;font-weight:700;color:#2b579a;'
            : 'float:left;font-size:42pt;line-height:.8;padding:4px 7px 0 0;font-weight:700;color:#2b579a;';
        var span = document.createElement('span');
        span.setAttribute('data-dropcap', mode);
        span.style.cssText = css;
        span.textContent = letter;
        block.insertBefore(span, block.firstChild);
        if (typeof saveUndoState === 'function') saveUndoState();
    };
    window.showWatermarkMenu = function (ev) {
        function wmBtn(label, value) {
            return '<button type="button" data-wm="' + esc(value) + '" onclick="applyWatermarkPreset(this.getAttribute(\'data-wm\'))">' + esc(label) + '</button>';
        }
        showFly(ev,
            wmBtn(tt('wmConfidential'), tt('wmConfidential')) +
            wmBtn(tt('wmDraft'), tt('wmDraft')) +
            wmBtn(tt('wmCopy'), tt('wmCopy')) +
            '<button type="button" onclick="hideRibbonFlyout();addWatermark()">' + esc(tt('wmCustom')) + '</button>' +
            '<button type="button" onclick="applyWatermarkPreset(\'\')">' + esc(tt('wmRemove')) + '</button>'
        );
    };
    window.applyWatermarkPreset = function (text) {
        hideFly();
        text = String(text == null ? '' : text).trim();
        var map = {
            CONFIDENCIAL: 'wmConfidential', RASCUNHO: 'wmDraft', 'CÓPIA': 'wmCopy',
            CONFIDENTIEL: 'wmConfidential', BROUILLON: 'wmDraft', COPIE: 'wmCopy',
            CONFIDENTIAL: 'wmConfidential', DRAFT: 'wmDraft', COPY: 'wmCopy',
            BORRADOR: 'wmDraft', COPIA: 'wmCopy'
        };
        if (map[text]) text = tt(map[text]);
        if (typeof window.abeneApplyWatermarkSpec === 'function') {
            window.abeneApplyWatermarkSpec({ text: text }, { toast: true });
            return;
        }
        var editor = editorEl();
        if (!editor) return;
        var existing = editor.querySelector('.watermark');
        if (existing) existing.remove();
        if (!text) { if (typeof saveUndoState === 'function') saveUndoState(); return; }
        var watermark = document.createElement('div');
        watermark.className = 'watermark';
        watermark.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:56pt;color:rgba(200,200,200,0.3);font-weight:bold;pointer-events:none;white-space:nowrap;z-index:0;';
        watermark.textContent = text;
        watermark.contentEditable = 'false';
        editor.appendChild(watermark);
        if (typeof saveUndoState === 'function') saveUndoState();
    };
    window.showPageBorderMenu = function (ev) {
        showFly(ev,
            '<button onclick="applyPageBorderStyle(\'none\')">' + tt('borderNone') + '</button>' +
            '<button onclick="applyPageBorderStyle(\'thin\')">' + tt('borderThin') + '</button>' +
            '<button onclick="applyPageBorderStyle(\'med\')">' + tt('borderMed') + '</button>' +
            '<button onclick="applyPageBorderStyle(\'thick\')">' + tt('borderThick') + '</button>' +
            '<button onclick="applyPageBorderStyle(\'dash\')">' + tt('borderDash') + '</button>' +
            '<button onclick="applyPageBorderStyle(\'double\')">' + tt('borderDouble') + '</button>'
        );
    };
    window.applyPageBorderStyle = function (kind) {
        hideFly();
        kind = String(kind || 'none').trim();
        if (kind !== 'none' && !/^(thin|med|thick|dash|double)$/.test(kind)) kind = 'med';
        var editor = editorEl();
        if (!editor) return;
        editor.style.outline = '';
        editor.style.outlineOffset = '';
        var sh = editor.style.boxShadow || '';
        if (/inset/i.test(sh) && /2b579a/i.test(sh)) {
            editor.style.boxShadow = '0 1px 3px rgba(0,0,0,.2), 0 6px 18px rgba(0,0,0,.14)';
        }
        if (kind === 'none') editor.removeAttribute('data-abene-page-border');
        else editor.setAttribute('data-abene-page-border', kind);
        if (window.abene) window.abene.pageBorder = kind === 'none' ? '' : kind;
        try { localStorage.setItem('abenePageBorder', kind === 'none' ? '' : kind); } catch (ePb) {}
        window._abeneChromeSig = '';
        if (typeof window.renderPageDecorations === 'function') window.renderPageDecorations();
        if (typeof saveUndoState === 'function') saveUndoState();
        if (typeof showToast === 'function') {
            showToast(kind === 'none' ? (tt('pbCleared') || tt('borderNone')) : (tt('pbApplied') || tt('pageBorder')));
        }
    };
    window.showSortMenu = function (ev) {
        showFly(ev,
            '<button onclick="applySortList(\'asc\')">' + tt('sortAz') + '</button>' +
            '<button onclick="applySortList(\'desc\')">' + tt('sortZa') + '</button>'
        );
    };
    window.applySortList = function (dir) {
        hideFly();
        var sel = window.getSelection();
        var node = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
        var list = node && node.closest('ul, ol');
        if (!list) { toast(tt('aCursorList')); return; }
        var lang = document.documentElement.lang || 'pt-PT';
        var mul = dir === 'desc' ? -1 : 1;
        Array.from(list.children).sort(function (a, b) {
            return mul * a.textContent.localeCompare(b.textContent, lang, { sensitivity: 'base' });
        }).forEach(function (item) { list.appendChild(item); });
        if (typeof saveUndoState === 'function') saveUndoState();
    };
    window.showFindMenu = function (ev) {
        showFly(ev,
            '<button onclick="hideRibbonFlyout();openFindReplace(\'find\')">' + tt('find') + '</button>' +
            '<button onclick="hideRibbonFlyout();openFindReplace(\'replace\')">' + tt('replace') + '</button>' +
            '<button onclick="hideRibbonFlyout();openFindReplace(\'goto\')">' + tt('findGoto') + '</button>'
        );
    };
    window.showFontColorMenu = function (ev) {
        showFly(ev, swatchesHtml(THEME_COLORS, 'changeFontColor') +
            '<button onclick="hideRibbonFlyout();document.getElementById(\'fontColor\').click()">' + tt('moreColors') + '</button>');
    };
    window.showHighlightMenu = function (ev) {
        showFly(ev, swatchesHtml(HIGHLIGHTS, 'changeHiliteColor') +
            '<button onclick="changeHiliteColor(\'transparent\')">' + tt('noHighlight') + '</button>' +
            '<button onclick="hideRibbonFlyout();document.getElementById(\'hiliteColor\').click()">' + tt('moreColors') + '</button>');
    };
    window.showTocMenu = function (ev) {
        showFly(ev,
            '<button onclick="hideRibbonFlyout();insertTOC()">' + tt('tocInsert') + '</button>' +
            '<button onclick="hideRibbonFlyout();abeneUpdateToc()">' + tt('tocUpdate') + '</button>' +
            '<button onclick="hideRibbonFlyout();insertTableOfFigures()">' + tt('tof') + '</button>' +
            '<button onclick="hideRibbonFlyout();insertTableOfTables()">' + tt('tocTables') + '</button>'
        );
    };
    window.showMultilevelMenu = function (ev) {
        showFly(ev,
            '<button onclick="applyMultilevel(\'decimal\')">' + tt('mlDecimal') + '</button>' +
            '<button onclick="applyMultilevel(\'outline\')">' + tt('mlOutline') + '</button>'
        );
    };
    window.applyMultilevel = function (kind) {
        hideFly();
        if (typeof insertMultilevelList === 'function') insertMultilevelList();
        var editor = editorEl();
        var block = window.getSelection().anchorNode;
        if (block && block.nodeType !== 1) block = block.parentElement;
        var list = block && block.closest('ol');
        if (list && kind === 'outline') {
            list.style.listStyleType = 'upper-roman';
            list.classList.add('abene-ml');
        }
        if (typeof saveUndoState === 'function') saveUndoState();
    };

    var origChangeFontColor = window.changeFontColor;
    window.changeFontColor = function (val) {
        hideFly();
        if (origChangeFontColor) origChangeFontColor(val);
        else wrap(function (span) { span.style.color = val; });
    };
    var origHilite = window.changeHiliteColor;
    window.changeHiliteColor = function (val) {
        hideFly();
        if (origHilite) origHilite(val === 'transparent' ? 'transparent' : val);
        else wrap(function (span) { span.style.backgroundColor = val === 'transparent' ? 'transparent' : val; });
    };

    document.addEventListener('click', function (e) {
        var editor = editorEl();
        if (!editor || !e.target || !e.target.closest) return;
        var row = e.target.closest('#editor .abene-toc-row, #editor .abene-lof-row, #editor .abene-idx-row');
        var a = e.target.closest('#editor a[href^="#"]') || (row && row.querySelector('a[href^="#"]'));
        if (!a || !editor.contains(a)) return;
        var id = (a.getAttribute('href') || '').replace(/^#/, '');
        if (!id) return;
        e.preventDefault();
        e.stopPropagation();
        window.abeneJumpToAnchor(id);
    }, true);

    document.addEventListener('dblclick', function (e) {
        if (!e.target || !e.target.closest) return;
        var chart = e.target.closest('#editor [data-chart]');
        if (!chart) return;
        e.preventDefault();
        openChartDialog(chart);
    });

    window.hideRibbonFlyout = hideFly;

    document.querySelectorAll('#tab-insert [onclick="insertSymbol()"]').forEach(function (btn) {
        btn.setAttribute('onclick', 'insertSymbol(event)');
    });
    document.querySelectorAll('#tab-insert [onclick="insertIcon()"]').forEach(function (btn) {
        btn.setAttribute('onclick', 'insertIcon(event)');
    });
    document.querySelectorAll('#tab-insert [onclick="insertShape()"]').forEach(function (btn) {
        btn.setAttribute('onclick', 'insertShape(event)');
    });
    document.querySelectorAll('#tab-references [onclick="setCitationStyle()"]').forEach(function (btn) {
        btn.setAttribute('onclick', 'setCitationStyle(event)');
    });

    var fieldTimer = 0;
    function scheduleLiveFields() {
        clearTimeout(fieldTimer);
        fieldTimer = setTimeout(function () {
            var editor = editorEl();
            if (!editor || fieldsBusy) return;
            var sel = window.getSelection();
            var n = sel && sel.anchorNode;
            var el = n && (n.nodeType === 1 ? n : n.parentElement);
            if (el && el.closest && el.closest('[data-field-type="toc"], .field-toc, [data-abene-block="toc"], [data-figures-index], [data-tables-index], .abene-caption')) return;
            if (!editor.querySelector('[data-field-type="toc"], .field-toc, [data-abene-block="toc"], [data-figures-index], [data-tables-index], .abene-caption, [data-caption-for]')) return;
            window.updateAllFields({ silent: true });
        }, 800);
    }
    window.abeneScheduleLiveFields = scheduleLiveFields;
    var editorLive = editorEl();
    if (editorLive) editorLive.addEventListener('input', function (ev) {
        var cap = ev.target && ev.target.closest && ev.target.closest('.abene-caption');
        if (cap) {
            var span = cap.querySelector('.abene-caption-text');
            cap.setAttribute('data-caption-text', span ? String(span.textContent || '').trim() : extractCaptionText(cap));
        }
        scheduleLiveFields();
    });
    var prevApplyStyle = window.applyStyle;
    if (typeof prevApplyStyle === 'function') {
        window.applyStyle = function () {
            var r = prevApplyStyle.apply(this, arguments);
            scheduleLiveFields();
            return r;
        };
        if (window.abeneApplyStyle) window.abeneApplyStyle = window.applyStyle;
    }
    var origDelTable = window.deleteTable;
    if (typeof origDelTable === 'function') {
        window.deleteTable = function () {
            var table = typeof window.getSelectedTable === 'function' ? window.getSelectedTable() : null;
            var cap = findCaptionAfter(table);
            origDelTable.apply(this, arguments);
            if (cap && cap.parentNode) cap.remove();
            renumberCaptions();
            refreshCaptionIndexes();
        };
    }

    (function wrapNavPanel() {
        if (window.toggleNavPanel && window.toggleNavPanel._abeneNavWrap) return;

        function isOpen() {
            var p = document.getElementById('navPanel');
            return !!(p && p.classList.contains('visible'));
        }
        function ribbonBtn() {
            return document.querySelector('#tab-view button[onclick="toggleNavPanel()"]') ||
                document.querySelector('.ribbon-btn[onclick="toggleNavPanel()"]');
        }
        function refreshBtn() {
            var btn = ribbonBtn();
            if (btn) btn.classList.toggle('active', isOpen());
        }
        function jumpEl(el) {
            if (!el) return;
            try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (eJ) {}
            try {
                var sel = window.getSelection();
                var r = document.createRange();
                r.selectNodeContents(el);
                r.collapse(true);
                if (sel) {
                    sel.removeAllRanges();
                    sel.addRange(r);
                }
            } catch (eC) {}
        }
        function jumpPage(n) {
            var inp = document.getElementById('gotoPageInput');
            if (inp) inp.value = String(n);
            if (typeof window.gotoPage === 'function') window.gotoPage();
            else {
                var area = document.getElementById('editorArea');
                var h = (window.PageGeometry && window.PageGeometry.height) || 1123;
                if (area) area.scrollTop = Math.max(0, (n - 1) * h);
            }
        }
        function fillPages() {
            var box = document.getElementById('navPages');
            var editor = editorEl();
            if (!box) return;
            var total = 1;
            try {
                if (typeof window.abeneCountUsedPages === 'function') total = window.abeneCountUsedPages(editor) || 1;
                else {
                    var h = (window.PageGeometry && window.PageGeometry.height) || 1123;
                    total = Math.max(1, Math.ceil((editor && editor.scrollHeight || h) / h));
                }
            } catch (eP) { total = 1; }
            total = Math.max(1, Math.min(200, Number(total) || 1));
            box.innerHTML = '';
            var i;
            for (i = 1; i <= total; i++) {
                (function (n) {
                    var div = document.createElement('div');
                    div.className = 'nav-heading-item';
                    div.textContent = tt('navPageN', { n: n });
                    div.onclick = function () { jumpPage(n); };
                    box.appendChild(div);
                })(i);
            }
        }
        function fillHeadings() {
            var container = document.getElementById('navHeadings');
            var editor = editorEl();
            if (!container || !editor) return;
            var papers = editor.querySelectorAll('[data-abene-block="devis"], [data-abene-block="receipt"]');
            var headings = headingTargets();
            if (!headings.length && !papers.length) {
                container.innerHTML = '<p style="color:#888;font-style:italic;">' + esc(tt('navEmpty')) + '</p>';
                return;
            }
            container.innerHTML = '';
            papers.forEach(function (block) {
                var kind = block.getAttribute('data-abene-block');
                var num = block.getAttribute('data-abene-number') || '';
                var st = block.getAttribute('data-abene-status') || '';
                var div = document.createElement('div');
                div.className = 'nav-heading-item';
                div.style.paddingLeft = '8px';
                div.style.fontWeight = '700';
                var label = kind === 'receipt' ? 'RECIBO' : 'ORÇAMENTO';
                div.textContent = label + (num ? ' ' + num : '') + (st === 'draft' ? ' (rascunho)' : '');
                div.onclick = function () {
                    jumpEl(block);
                    if (typeof previewInsertedPaper === 'function') {
                        previewInsertedPaper(kind === 'receipt' ? 'receipt' : 'devis');
                    }
                };
                container.appendChild(div);
            });
            headings.forEach(function (h, i) {
                if (h.closest('[data-abene-block="devis"], [data-abene-block="receipt"]')) return;
                if (!h.id) h.id = 'nav-h-' + i;
                var level = headingLevel(h);
                var div = document.createElement('div');
                div.className = 'nav-heading-item';
                div.style.paddingLeft = ((Math.max(1, level) - 1) * 15 + 8) + 'px';
                div.style.fontSize = Math.max(10, 14 - Math.min(level, 4)) + 'pt';
                div.style.fontWeight = level <= 2 ? 'bold' : 'normal';
                div.textContent = String(h.textContent || '').trim();
                div.onclick = function () { jumpEl(h); };
                container.appendChild(div);
            });
        }

        var origUpdate = window.updateNavigation;
        window.updateNavigation = function () {
            if (typeof origUpdate === 'function') origUpdate.apply(this, arguments);
            fillHeadings();
            fillPages();
            refreshBtn();
        };
        window.updateNavigation._abeneNavWrap = true;
        window.updateNavigation._legacy = origUpdate;

        var origToggle = window.toggleNavPanel;
        window.toggleNavPanel = function () {
            var wasOpen = isOpen();
            if (typeof origToggle === 'function') origToggle.apply(this, arguments);
            var nowOpen = isOpen();
            fillHeadings();
            fillPages();
            refreshBtn();
            if (wasOpen && !nowOpen) toast(tt('navOff'));
        };
        window.toggleNavPanel._abeneNavWrap = true;
        window.toggleNavPanel._legacy = origToggle;

        var origSwitch = window.switchNavTab;
        window.switchNavTab = function (btn, tab) {
            if (typeof origSwitch === 'function') origSwitch.apply(this, arguments);
            if (tab === 'pages') fillPages();
            if (tab === 'headings') fillHeadings();
        };
        window.switchNavTab._abeneNavWrap = true;

        var origSearch = window.searchInDocument;
        window.searchInDocument = function (query) {
            var results = document.getElementById('navSearchResults');
            var q = String(query || '');
            if (!results) {
                if (typeof origSearch === 'function') return origSearch.apply(this, arguments);
                return;
            }
            if (!q.trim()) { results.innerHTML = ''; return; }
            var editor = editorEl();
            if (!editor) return;
            var needle = q.toLowerCase();
            var walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null);
            var hits = [];
            var node;
            while ((node = walker.nextNode())) {
                if (!node.nodeValue) continue;
                var pe = node.parentElement;
                if (pe && pe.closest('.abene-page-flow, .page-header-zone, .page-footer-zone, .page-decoration, script, style')) continue;
                var idx = node.nodeValue.toLowerCase().indexOf(needle);
                if (idx < 0) continue;
                hits.push({ node: node, idx: idx, text: node.nodeValue });
                if (hits.length >= 40) break;
            }
            results.innerHTML = '';
            if (!hits.length) {
                results.innerHTML = '<p style="color:#888;font-style:italic;">' + esc(tt('findNone')) + '</p>';
                return;
            }
            hits.forEach(function (hit) {
                var div = document.createElement('div');
                div.className = 'nav-heading-item';
                var snippet = String(hit.text || '').replace(/\s+/g, ' ').trim().slice(0, 80);
                div.textContent = snippet + (snippet.length >= 80 ? '…' : '');
                div.onclick = function () {
                    try {
                        var r = document.createRange();
                        var end = Math.min(hit.node.nodeValue.length, hit.idx + q.length);
                        r.setStart(hit.node, hit.idx);
                        r.setEnd(hit.node, end);
                        var sel = window.getSelection();
                        if (sel) {
                            sel.removeAllRanges();
                            sel.addRange(r);
                        }
                        var el = hit.node.parentElement;
                        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } catch (eS) {}
                };
                results.appendChild(div);
            });
        };
        window.searchInDocument._abeneNavWrap = true;
        window.searchInDocument._legacy = origSearch;

        var edNav = editorEl();
        if (edNav && !edNav._abeneNavInput) {
            edNav._abeneNavInput = true;
            edNav.addEventListener('input', function () {
                if (!isOpen()) return;
                clearTimeout(window._abeneNavT);
                window._abeneNavT = setTimeout(function () {
                    if (typeof window.updateNavigation === 'function') window.updateNavigation();
                }, 280);
            });
        }
        function bootNav() { refreshBtn(); }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootNav);
        else bootNav();
        window.addEventListener('load', bootNav);
    })();

    /* Inserir → Imagem da Web: foca o campo URL; rejeita https:// vazio e javascript:. */
    (function wrapImagemWeb() {
        function ttLocal(key, fb) {
            if (typeof window.t === 'function') {
                var v = window.t(key);
                if (v && v !== key) return String(v);
            }
            return fb || key;
        }
        function toastLocal(msg) {
            if (typeof window.showToast === 'function') window.showToast(msg);
        }
        function isOkSrc(s) {
            s = String(s || '').trim();
            if (/^data:image\//i.test(s)) return true;
            if (/^\s*(javascript|vbscript|data:text)/i.test(s)) return false;
            return /^https?:\/\/[a-z0-9.-]+/i.test(s);
        }
        function boot() {
            var origApply = window.abeneApplyInsertImage;
            if (typeof origApply === 'function' && !origApply._abeneWebImg) {
                window.abeneApplyInsertImage = function () {
                    var data = window._abeneImgFileData;
                    var urlEl = document.getElementById('abeneImgUrl');
                    var url = urlEl ? String(urlEl.value || '').trim() : '';
                    if (!data && url && !isOkSrc(url)) {
                        toastLocal(ttLocal('aBadUrl', 'URL inválido (use http:// ou https://).'));
                        if (urlEl) try { urlEl.focus(); } catch (eF) {}
                        return;
                    }
                    return origApply.apply(this, arguments);
                };
                window.abeneApplyInsertImage._abeneWebImg = true;
                window.abeneApplyInsertImage._legacy = origApply;
            }
            var orig = window.insertOnlineImage;
            if (typeof orig !== 'function' || orig._abeneWebImg) return;
            window.insertOnlineImage = function () {
                var r = orig.apply(this, arguments);
                setTimeout(function () {
                    var el = document.getElementById('abeneImgUrl');
                    if (el) {
                        try { el.focus(); el.select(); } catch (e2) {}
                    }
                }, 50);
                return r;
            };
            window.insertOnlineImage._abeneWebImg = true;
            window.insertOnlineImage._legacy = orig;
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
        else setTimeout(boot, 0);
        window.addEventListener('load', boot);
    })();
})();
