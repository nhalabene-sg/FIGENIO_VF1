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
    window.insertChart = function () {
        formDialog(tt('chart'), [{ id: 'raw', label: tt('pChart'), value: tt('pChartDef') }], function (data) {
            var points = String(data.raw || '').split(',').map(function (point) {
                var parts = point.split(':');
                return { label: (parts[0] || '').trim(), value: Number(parts[1]) || 0 };
            }).filter(function (p) { return p.label; });
            if (!points.length) return;
            var max = 1;
            points.forEach(function (p) { if (p.value > max) max = p.value; });
            var bars = points.map(function (point) {
                var h = Math.max(8, point.value / max * 140);
                return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;"><span style="font-size:11px;color:#475569;">' +
                    esc(String(point.value)) + '</span><div style="width:70%;max-width:48px;height:' + h + 'px;background:#2b579a;border-radius:3px 3px 0 0;"></div><span style="font-size:11px;margin-top:5px;text-align:center;">' +
                    esc(point.label) + '</span></div>';
            }).join('');
            insertHTML('<div data-chart="true" style="border:1px solid #d0d7e2;padding:16px;margin:16px 0;background:#fff;border-radius:4px;"><strong>' +
                esc(tt('chartTitle')) + '</strong><div style="display:flex;align-items:flex-end;gap:14px;height:180px;margin-top:14px;padding:0 12px;border-bottom:1px solid #94a3b8;">' +
                bars + '</div></div>');
        });
    };
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
        if (ev && ev.currentTarget) {
            showFly(ev, '<div class="abene-picker-grid">' + symbols.map(function (s) {
                return '<button type="button" onclick="abeneInsertIcon(\'' + s + '\')">' + s + '</button>';
            }).join('') + '</div>');
            return;
        }
        window.abeneInsertIcon(symbols[0]);
    };
    window.abeneInsertIcon = function (s) {
        hideFly();
        insertHTML('<span data-icon="true" style="font-size:32px;">' + s + '</span>');
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
    window.addWatermark = function () {
        formDialog(tt('watermark'), [{ id: 'text', label: tt('pWatermark'), value: tt('pWatermarkDef') }], function (data) {
            var editor = editorEl();
            if (!editor) return;
            var existing = editor.querySelector('.watermark');
            if (existing) existing.remove();
            var text = (data.text || '').trim();
            if (!text) return;
            var watermark = document.createElement('div');
            watermark.className = 'watermark';
            watermark.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:72pt;color:rgba(200,200,200,0.3);font-weight:bold;pointer-events:none;white-space:nowrap;z-index:0;';
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
            if (typeof saveUndoState === 'function') saveUndoState();
            if (typeof window.abeneSchedulePageFlow === 'function') window.abeneSchedulePageFlow(true);
            if (window.ABENE && window.ABENE.Notes && typeof window.ABENE.Notes.afterLayout === 'function') {
                window.ABENE.Notes.afterLayout();
            }
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
    window.insertCaption = function () {
        var editor = editorEl();
        var n = editor.querySelectorAll('[data-caption-for], img[data-caption]').length + 1;
        formDialog(tt('caption'), [{ id: 'text', label: tt('pCaption'), value: tt('figCaption', { n: n }) }], function (data) {
            var caption = (data.text || '').trim();
            if (!caption) return;
            var img = window.selectedImage || null;
            if (img) {
                img.dataset.caption = caption;
                img.alt = caption;
                if (!img.id) img.id = 'figure-' + n;
                var previous = img.nextElementSibling;
                if (previous && previous.dataset.captionFor === 'image') previous.remove();
                var label = document.createElement('p');
                label.dataset.captionFor = 'image';
                label.style.cssText = 'font-style:italic;font-size:10pt;color:#666;text-align:center;margin:5px 0;';
                label.textContent = caption;
                img.insertAdjacentElement('afterend', label);
                if (typeof saveUndoState === 'function') saveUndoState();
                return;
            }
            insertHTML('<p data-caption-for="text" style="font-style:italic;font-size:10pt;color:#666;text-align:center;margin:5px 0;">' + esc(caption) + '</p>');
        });
    };

    function buildFiguresHtml() {
        var editor = editorEl();
        var images = editor.querySelectorAll('img');
        var rows = Array.from(images).map(function (image, index) {
            if (!image.id) image.id = 'illustration-' + (index + 1);
            var label = image.dataset.caption || image.alt || (tt('illustration') + ' ' + (index + 1));
            return '<p style="margin:5px 0;"><a href="#' + esc(image.id) + '">' + esc(tt('illustration')) + ' ' + (index + 1) + ': ' + esc(label) + '</a></p>';
        }).join('');
        return '<div data-figures-index="true" data-illustrations-index="true" style="border:1px solid #d0d0d0;padding:20px;margin:15px 0;background:#fafafa;border-radius:4px;"><h3 style="margin-bottom:10px;color:#2b579a;">' + esc(tt('illIndexTitle')) + '</h3>' + rows + '</div>';
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
        if (!editor.querySelector('img')) { toast(tt('aNoIllustDoc')); return; }
        replaceOrInsert('[data-figures-index], [data-illustrations-index]', buildFiguresHtml(), true);
    };
    window.insertTableOfFigures = window.insertIllustrationsIndex;

    window.insertCrossReference = function () {
        var editor = editorEl();
        var targets = [];
        editor.querySelectorAll('h1, h2, h3, h4, img').forEach(function (el, i) {
            if (!el.id) el.id = 'reference-' + (i + 1);
            var label = el.tagName === 'IMG' ? (el.dataset.caption || el.alt || el.id) : el.textContent;
            targets.push({ value: el.id, label: String(label || el.id).trim().slice(0, 80) });
        });
        if (!targets.length) { toast(tt('aNoHeadingXref')); return; }
        formDialog(tt('xref'), [{ id: 'id', label: tt('xrefTarget'), type: 'select', options: targets, value: targets[0].value }], function (data) {
            var target = document.getElementById(data.id);
            if (!target) return;
            var label = target.tagName === 'IMG' ? (target.dataset.caption || target.alt || tt('seeRef')) : target.textContent;
            insertHTML('<a href="#' + esc(target.id) + '" style="color:#2b579a;text-decoration:underline;">' + esc(label) + '</a>');
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
        toast(tt('aCiteSet', { s: normalized }));
        rebuildBibliography(false);
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
        var html = '<h3>' + esc(tt('bibliography')) + '</h3>' + Array.from(citations).map(function (c) {
            var a = c.getAttribute('data-cite-author');
            var ti = c.getAttribute('data-cite-title');
            var y = c.getAttribute('data-cite-year') || '';
            if (a && ti) return '<p>' + formatBiblio(esc(a), esc(ti), esc(y)) + '</p>';
            return '<p>' + esc(c.textContent.replace(/[()]/g, '')) + '</p>';
        }).join('');
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

    function headingTargets() {
        var editor = editorEl();
        if (!editor) return [];
        return Array.from(editor.querySelectorAll('h1, h2, h3, h4')).filter(function (h) {
            return !h.closest('[data-abene-block="cover"], [data-abene-block="titlepage"], [data-abene-block="toc"], .field-toc, [data-field-type="toc"]');
        });
    }
    function buildTocHtml() {
        var headings = headingTargets();
        var list = headings.map(function (h) {
            if (!h.id) h.id = 'h-' + Math.random().toString(36).slice(2, 8);
            var level = parseInt(h.tagName[1], 10) || 1;
            return '<p data-toc-level="' + level + '" style="margin:3px 0;padding-left:' + ((level - 1) * 20) + 'px;font-size:10pt;"><a href="#' + esc(h.id) + '">' + esc(h.textContent) + '</a></p>';
        }).join('');
        return '<div class="field-toc" data-field-type="toc" style="border:1px solid #d0d0d0;padding:20px;margin:15px 0;background:#fafafa;border-radius:4px;"><h3 style="margin-bottom:10px;color:#2b579a;">' + esc(tt('tocTitle')) + '</h3>' + (list || '<p>' + esc(tt('aNoToc')) + '</p>') + '</div>';
    }
    window.abeneBuildTocHtml = buildTocHtml;
    window.abeneFillModeloToc = function (block) {
        if (!block) return;
        if (!headingTargets().length) return;
        block.innerHTML = buildTocHtml();
    };
    window.insertTOC = function () {
        if (!headingTargets().length) { toast(tt('aNoToc')); return; }
        replaceOrInsert('[data-field-type="toc"], .field-toc', buildTocHtml(), true);
    };
    window.insertIndex = function () {
        var editor = editorEl();
        var sel = window.getSelection();
        var text = sel && sel.toString().trim();
        if (text) {
            var span = document.createElement('span');
            span.setAttribute('data-index-entry', 'true');
            try { sel.getRangeAt(0).surroundContents(span); } catch (e) {
                span.appendChild(sel.getRangeAt(0).extractContents());
                sel.getRangeAt(0).insertNode(span);
            }
        }
        var entries = Array.from(editor.querySelectorAll('[data-index-entry]')).map(function (el) {
            return el.textContent.trim();
        }).filter(Boolean);
        var unique = [];
        entries.forEach(function (w) {
            var k = w.toLocaleLowerCase();
            if (unique.indexOf(k) < 0) unique.push(k);
        });
        unique.sort(function (a, b) { return a.localeCompare(b, document.documentElement.lang || 'pt-PT'); });
        if (!unique.length && !text) { toast(tt('idxSelectFirst')); return; }
        var body = unique.length ? unique.map(function (w) { return '<p style="margin:2px 0;">' + esc(w) + '</p>'; }).join('') : '<p>' + esc(tt('noIndex')) + '</p>';
        replaceOrInsert('[data-index="true"]', '<div data-index="true" style="border:1px solid #d0d0d0;padding:20px;margin:15px 0;background:#fafafa;"><h3>' + esc(tt('idxTitle')) + '</h3>' + body + '</div>', true);
    };

    window.updateAllFields = function () {
        var editor = editorEl();
        if (!editor) return;
        if (headingTargets().length && editor.querySelector('[data-field-type="toc"], .field-toc, [data-abene-block="toc"]')) {
            var toc = editor.querySelector('[data-field-type="toc"], .field-toc');
            if (toc) toc.outerHTML = buildTocHtml();
            var modeloToc = editor.querySelector('[data-abene-block="toc"]');
            if (modeloToc) window.abeneFillModeloToc(modeloToc);
        }
        if (editor.querySelector('img') && editor.querySelector('[data-figures-index], [data-illustrations-index]')) {
            var fig = editor.querySelector('[data-figures-index], [data-illustrations-index]');
            fig.outerHTML = buildFiguresHtml();
        }
        rebuildBibliography(false);
        editor.querySelectorAll('[data-field-type="date"]').forEach(function (field) {
            field.textContent = new Date().toLocaleDateString(document.documentElement.lang || 'pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        });
        if (typeof refreshPagination === 'function') refreshPagination();
        toast(tt('updateFields'));
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
            '<button onclick="insertSectionBreak(\'oddPage\');hideRibbonFlyout()">' + tt('secBreakOdd') + '</button>'
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
    window.applyPageNumber = function (kind) {
        if (kind.indexOf('header') === 0) {
            setHeaderText(kind.indexOf('of') >= 0 ? '{PAGE} / {NUMPAGES}' : '{PAGE}');
        } else {
            setFooterText(kind.indexOf('of') >= 0 ? (tt('statusPage') + ' {PAGE} / {NUMPAGES}') : '{PAGE}');
        }
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
    window.showLineMenu = function (ev) {
        showFly(ev,
            '<button onclick="insertHRStyle(\'solid\')">' + tt('lineSolid') + '</button>' +
            '<button onclick="insertHRStyle(\'thick\')">' + tt('lineThick') + '</button>' +
            '<button onclick="insertHRStyle(\'dashed\')">' + tt('lineDashed') + '</button>' +
            '<button onclick="insertHRStyle(\'dotted\')">' + tt('lineDotted') + '</button>' +
            '<button onclick="insertHRStyle(\'double\')">' + tt('lineDouble') + '</button>'
        );
    };
    window.insertHRStyle = function (kind) {
        hideFly();
        var map = {
            solid: 'border:0;border-top:1px solid #333',
            thick: 'border:0;border-top:3px solid #2b579a',
            dashed: 'border:0;border-top:1px dashed #333',
            dotted: 'border:0;border-top:1px dotted #333',
            double: 'border:0;border-top:3px double #333'
        };
        insertHTML('<hr style="' + (map[kind] || map.solid) + ';margin:15px 0;">');
    };
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
        showFly(ev,
            '<button onclick="applyWatermarkPreset(\'CONFIDENCIAL\')">' + tt('wmConfidential') + '</button>' +
            '<button onclick="applyWatermarkPreset(\'RASCUNHO\')">' + tt('wmDraft') + '</button>' +
            '<button onclick="applyWatermarkPreset(\'CÓPIA\')">' + tt('wmCopy') + '</button>' +
            '<button onclick="hideRibbonFlyout();addWatermark()">' + tt('wmCustom') + '</button>' +
            '<button onclick="applyWatermarkPreset(\'\')">' + tt('wmRemove') + '</button>'
        );
    };
    window.applyWatermarkPreset = function (text) {
        hideFly();
        var editor = editorEl();
        if (!editor) return;
        var existing = editor.querySelector('.watermark');
        if (existing) existing.remove();
        if (!text) { if (typeof saveUndoState === 'function') saveUndoState(); return; }
        var watermark = document.createElement('div');
        watermark.className = 'watermark';
        watermark.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:72pt;color:rgba(200,200,200,0.3);font-weight:bold;pointer-events:none;white-space:nowrap;z-index:0;';
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
        var editor = editorEl();
        if (!editor) return;
        var paper = '0 1px 3px rgba(0,0,0,.2), 0 6px 18px rgba(0,0,0,.14)';
        editor.style.outline = '';
        editor.style.boxShadow = paper;
        if (kind === 'none') return;
        var map = {
            thin: '1px solid #2b579a',
            med: '3px solid #2b579a',
            thick: '6px solid #2b579a',
            dash: '2px dashed #2b579a',
            double: '4px double #2b579a'
        };
        editor.style.outline = map[kind] || map.med;
        editor.style.outlineOffset = '-8px';
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
            '<button onclick="hideRibbonFlyout();updateAllFields()">' + tt('tocUpdate') + '</button>'
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
        var a = e.target.closest && e.target.closest('#editor a[href^="#"]');
        if (!a) return;
        var id = (a.getAttribute('href') || '').slice(1);
        if (!id) return;
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, true);

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
})();
