/* Genius Raros — Sections Word (P4) + cabeçalhos/rodapés por secção (P5).
   Sauts de section réels, en plus de insertSection (titre) et des quebras de página.
   Le chrome existant (renderPageDecorations, galerie, {PAGE}) est conservé. */
(function (root) {
    root.ABENE = root.ABENE || {};
    var TYPES = { nextPage: 1, continuous: 1, evenPage: 1, oddPage: 1 };

    function tt(key, fb) {
        return typeof root.t === 'function' ? root.t(key) : (fb || key);
    }
    function A() { return root.abene || {}; }
    function ed() { return (A().editor) || document.getElementById('editor'); }
    function escAttr(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }
    function hideFly() {
        if (typeof root.hideRibbonFlyout === 'function') root.hideRibbonFlyout();
    }
    function labelFor(type) {
        if (type === 'continuous') return tt('secBreakCont', 'Secção contínua');
        if (type === 'evenPage') return tt('secBreakEven', 'Secção página par');
        if (type === 'oddPage') return tt('secBreakOdd', 'Secção página ímpar');
        return tt('secBreakNext', 'Secção página seguinte');
    }
    function roleLabel(role) {
        if (role === 'front') return tt('secFrontLabel', 'Capa (sem n.º de página)');
        if (role === 'annex') return tt('secAnnexLabel', 'Anexos');
        if (role === 'body') return tt('secBodyLabel', 'Corpo');
        return '';
    }
    function geoProps() {
        var G = root.PageGeometry;
        var a = A();
        var m = a.pageMargins || { top: 96, right: 96, bottom: 96, left: 96 };
        return {
            paperSize: (G && G.paperSize) || a.pageSizeId || 'a4',
            orientation: (G && G.orientation) || a.pageOrientation || 'portrait',
            margins: { top: m.top, right: m.right, bottom: m.bottom, left: m.left },
            columns: String(a.pageColumns || '1'),
            colRule: !!a.pageColRule,
            gutter: Number(a.pageGutter) || 0
        };
    }
    function hfDefaults() {
        return {
            headerLink: true,
            footerLink: true,
            differentFirst: false,
            differentOddEven: false,
            headerText: null,
            footerText: null,
            headerFirst: null,
            footerFirst: null,
            headerEven: null,
            footerEven: null,
            headerTemplate: null,
            headerFields: null,
            headerFirstFields: null,
            headerEvenFields: null,
            headerDistance: null,
            footerDistance: null,
            pageNumberRestart: null,
            pageNumberFormat: null,
            role: null,
            hidePageNumbers: false
        };
    }
    function currentDocProps() {
        return Object.assign({}, geoProps(), hfDefaults());
    }
    function parseProps(el) {
        var base = currentDocProps();
        if (!el) return base;
        try {
            var raw = el.getAttribute('data-abene-section-props');
            if (!raw) return base;
            var o = JSON.parse(raw);
            return o && typeof o === 'object' ? Object.assign(base, o) : base;
        } catch (e) {
            return base;
        }
    }
    function writeProps(el, props) {
        if (!el || !el.setAttribute) return;
        el.setAttribute('data-abene-section-props', JSON.stringify(props || currentDocProps()));
    }
    var rootPropsCache = null;
    function getRootProps() { return Object.assign(currentDocProps(), rootPropsCache || {}); }
    function setRootProps(p) { rootPropsCache = p || currentDocProps(); }

    function breakNodes(editor) {
        editor = editor || ed();
        if (!editor) return [];
        return Array.prototype.slice.call(editor.querySelectorAll('.abene-section-break'));
    }

    function list() {
        var editor = ed();
        var out = [{ index: 0, type: 'root', el: null, props: getRootProps() }];
        breakNodes(editor).forEach(function (el, i) {
            out.push({
                index: i + 1,
                type: el.getAttribute('data-abene-section-type') || 'nextPage',
                el: el,
                props: parseProps(el)
            });
        });
        return out;
    }

    function atCaret() {
        var editor = ed();
        if (!editor) return list()[0];
        var sel = root.getSelection && root.getSelection();
        var node = sel && sel.rangeCount ? sel.getRangeAt(0).startContainer : null;
        var el = node && (node.nodeType === 1 ? node : node.parentElement);
        if (!el || !editor.contains(el)) el = editor;
        var breaks = breakNodes(editor);
        var i, found = null;
        for (i = 0; i < breaks.length; i++) {
            if (breaks[i] === el || (el.closest && el.closest('.abene-section-break') === breaks[i])) {
                found = breaks[i];
                continue;
            }
            if (breaks[i].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) found = breaks[i];
        }
        if (!found) return { index: 0, type: 'root', el: null, props: getRootProps() };
        var idx = breaks.indexOf(found) + 1;
        return { index: idx, type: found.getAttribute('data-abene-section-type') || 'nextPage', el: found, props: parseProps(found) };
    }

    function writeSection(sec, props) {
        if (!sec || !sec.el) setRootProps(props);
        else writeProps(sec.el, props);
    }

    function roleProps(role, base) {
        var props = Object.assign({}, base || currentDocProps());
        props.role = role || props.role || null;
        if (role === 'front') {
            props.hidePageNumbers = true;
            props.differentFirst = true;
            props.headerLink = false;
            props.footerLink = false;
            props.footerText = '';
        } else if (role === 'body' || role === 'annex') {
            props.hidePageNumbers = false;
            props.headerLink = false;
            props.footerLink = false;
            props.pageNumberRestart = 1;
            props.pageNumberFormat = role === 'annex' ? 'annex' : 'decimal';
            var co = A().companyData || {};
            if (props.footerText == null || props.footerText === '') {
                props.footerText = (co.name || 'Genius Raros') + '  ·  {PAGE} / {NUMPAGES}';
            }
        }
        return props;
    }
    function breakHtml(type, extra) {
        extra = extra || {};
        type = String(type || extra.type || 'nextPage');
        if (!TYPES[type]) type = 'nextPage';
        var props = roleProps(extra.role, Object.assign({}, currentDocProps(), geoProps(), extra));
        var forcesPage = type !== 'continuous';
        var cls = 'abene-section-break' + (forcesPage ? ' page-break-marker' : '');
        var lab = extra.role ? roleLabel(extra.role) : labelFor(type);
        var roleAttr = extra.role ? ' data-abene-section-role="' + extra.role + '"' : '';
        return '<div class="' + cls + '" contenteditable="false" data-abene-section-type="' + type +
            '" data-abene-section-props="' + escAttr(JSON.stringify(props)) +
            '" data-abene-section-label="' + escAttr(lab) + '"' + roleAttr +
            ' aria-label="' + escAttr(lab) + '"></div>';
    }
    function insertBreak(type, extra) {
        extra = extra || {};
        type = String(type || extra.type || 'nextPage');
        if (!TYPES[type]) type = 'nextPage';
        var editor = ed();
        if (!editor) return;
        editor.focus();
        var prev = atCaret();
        var props = Object.assign({}, prev && prev.props ? prev.props : currentDocProps(), geoProps(), {
            headerLink: extra.role ? false : true,
            footerLink: extra.role ? false : true
        }, extra);
        props = roleProps(extra.role, props);
        var html = breakHtml(type, Object.assign({}, extra, props, { role: extra.role || props.role })) +
            '<p class="abene-normal"><br></p>';
        if (root.EditorCommands && root.EditorCommands.useEngine && typeof root.EditorCommands.insertHTML === 'function') {
            root.EditorCommands.insertHTML(html);
        } else {
            document.execCommand('insertHTML', false, html);
        }
        if (typeof saveUndoState === 'function') saveUndoState();
        if (root.abeneSchedulePageFlow) root.abeneSchedulePageFlow(true);
        else if (root.PaginationEngine && root.PaginationEngine.render) root.PaginationEngine.render();
    }

    function syncGeoFromDocument() {
        var cur = atCaret();
        var prev = cur && cur.el ? parseProps(cur.el) : getRootProps();
        var merged = Object.assign({}, prev, geoProps());
        writeSection(cur, merged);
    }

    function wrapFn(name) {
        var orig = root[name];
        if (typeof orig !== 'function' || orig._abeneSections) return;
        var wrapped = function () {
            var r = orig.apply(this, arguments);
            try { syncGeoFromDocument(); } catch (e) {}
            return r;
        };
        wrapped._abeneSections = true;
        root[name] = wrapped;
    }

    wrapFn('setOrientation');
    wrapFn('changePaperSize');
    wrapFn('abeneChangePaperSize');
    wrapFn('setPageMargins');
    wrapFn('applyPageColumns');
    wrapFn('applyMarginPreset');
    wrapFn('applyPageSetup');
    wrapFn('applyCustomMargins');

    if (typeof root.projectSettings === 'function' && !root.projectSettings._abeneSections) {
        var origPS = root.projectSettings;
        root.projectSettings = function () {
            var raw = origPS.apply(this, arguments);
            try {
                var obj = JSON.parse(raw);
                obj.section0 = getRootProps();
                return JSON.stringify(obj);
            } catch (e) {
                return raw;
            }
        };
        root.projectSettings._abeneSections = true;
    }
    if (typeof root.restoreProjectSettings === 'function' && !root.restoreProjectSettings._abeneSections) {
        var origRS = root.restoreProjectSettings;
        root.restoreProjectSettings = function (serialized) {
            origRS.apply(this, arguments);
            try {
                var settings = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
                if (settings && settings.section0) setRootProps(settings.section0);
            } catch (e2) {}
        };
        root.restoreProjectSettings._abeneSections = true;
    }

    function pageMaps() {
        var hf = [0];
        var body = [0];
        var editor = ed();
        if (!editor) return { hf: hf, body: body };
        var page = 0;
        var section = 0;
        var headerSection = 0;
        var pendingHf = null;
        var pendingBody = null;
        var secCount = 0;
        var nodes = editor.querySelectorAll('.abene-page-flow, .abene-section-break');
        var i, el, type;
        for (i = 0; i < nodes.length; i++) {
            el = nodes[i];
            if (!el || !el.classList) continue;
            if (el.classList.contains('abene-page-flow')) {
                page++;
                if (pendingBody != null) {
                    section = pendingBody;
                    pendingBody = null;
                }
                body[page] = section;
                if (pendingHf != null) {
                    headerSection = pendingHf;
                    pendingHf = null;
                }
                hf[page] = headerSection;
                continue;
            }
            if (el.classList.contains('abene-section-break')) {
                secCount++;
                section = secCount;
                type = el.getAttribute('data-abene-section-type') || 'nextPage';
                if (type === 'continuous') {
                    body[page] = section;
                    pendingHf = section;
                } else {
                    pendingHf = section;
                    pendingBody = section;
                }
            }
        }
        return { hf: hf, body: body };
    }

    function pageHeightPx() {
        return (root.PageGeometry && root.PageGeometry.height) || 1123;
    }
    function inferRoleForPage(page0, editor) {
        editor = editor || ed();
        if (!editor) return 'body';
        var h = pageHeightPx();
        var y0 = page0 * h;
        var y1 = y0 + h;
        var yFn = root.abeneYInEditor;
        var front = false;
        var annex = false;
        var other = false;
        editor.querySelectorAll('[data-abene-block]').forEach(function (b) {
            var y = yFn ? yFn(b, editor) : (b.offsetTop || 0);
            var bottom = y + Math.max(1, b.offsetHeight || 1);
            if (bottom <= y0 + 4 || y >= y1 - 4) return;
            var k = b.getAttribute('data-abene-block');
            if (k === 'cover' || k === 'titlepage' || k === 'toc') front = true;
            else if (k === 'annex') annex = true;
            else other = true;
        });
        if (annex) return 'annex';
        if (front && !other) return 'front';
        return 'body';
    }
    function classifyPages(total) {
        total = Math.max(1, Number(total) || 1);
        var maps = pageMaps();
        var sections = list();
        var roles = [];
        var p;
        for (p = 0; p < total; p++) {
            var secIdx = maps.body[p] != null ? maps.body[p] : 0;
            var sec = sections[secIdx] || sections[0];
            var role = sec && sec.props ? sec.props.role : null;
            if (role === 'front' || role === 'body' || role === 'annex') roles[p] = role;
            else roles[p] = inferRoleForPage(p);
        }
        var seenBody = false;
        var seenAnnex = false;
        for (p = 0; p < total; p++) {
            if (roles[p] === 'annex') seenAnnex = true;
            if (roles[p] === 'body') seenBody = true;
            if (seenAnnex) roles[p] = 'annex';
            else if (seenBody && roles[p] === 'front') roles[p] = 'body';
        }
        return roles;
    }
    function pageNumberInfo(page0, total) {
        total = Math.max(1, Number(total) || 1);
        page0 = Math.max(0, Math.min(Number(page0) || 0, total - 1));
        var roles = classifyPages(total);
        var role = roles[page0] || 'body';
        var maps = pageMaps();
        var sections = list();
        var secIdx = maps.body[page0] != null ? maps.body[page0] : 0;
        var props = (sections[secIdx] && sections[secIdx].props) || getRootProps();
        var hide = role === 'front' || !!props.hidePageNumbers;
        if (hide) {
            return { page: page0 + 1, display: '', total: total, sectionTotal: 0, role: role, hideNumbers: true, label: '', format: 'none' };
        }
        var start = page0;
        while (start > 0 && roles[start - 1] === role) start--;
        var end = page0;
        while (end + 1 < total && roles[end + 1] === role) end++;
        var restart = Number(props.pageNumberRestart);
        if (!isFinite(restart) || restart < 1) restart = 1;
        var display = page0 - start + restart;
        var sectionTotal = end - start + 1;
        var format = props.pageNumberFormat || (role === 'annex' ? 'annex' : 'decimal');
        var label = String(display);
        if (format === 'annex') label = tt('secAnnexNum', 'Anexo') + ' ' + display;
        return { page: page0 + 1, display: display, total: total, sectionTotal: sectionTotal, role: role, hideNumbers: false, label: label, format: format };
    }
    function stripPageFields(text) {
        return String(text == null ? '' : text)
            .replace(/\{PAGE\}(\s*\/\s*\{NUMPAGES\})?/gi, '')
            .replace(/\{NUMPAGES\}/gi, '')
            .replace(/\s*[·•|]\s*$/g, '')
            .replace(/^\s*[·•|]\s*/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }
    function updateBreakRole(el, role) {
        if (!el) return;
        var props = roleProps(role, parseProps(el));
        writeProps(el, props);
        el.setAttribute('data-abene-section-role', role);
        el.setAttribute('data-abene-section-label', roleLabel(role));
        el.setAttribute('aria-label', roleLabel(role));
    }
    function makeBreakEl(role) {
        var wrap = document.createElement('div');
        wrap.innerHTML = breakHtml('nextPage', { role: role });
        return wrap.firstChild;
    }
    function skipFlow(el, dir) {
        var n = el;
        while (n && n.classList && n.classList.contains('abene-page-flow')) {
            n = dir < 0 ? n.previousElementSibling : n.nextElementSibling;
        }
        return n;
    }
    function placeBreakAfter(node, role) {
        if (!node || !node.parentNode) return;
        var next = skipFlow(node.nextElementSibling, 1);
        if (next && next.classList && next.classList.contains('abene-section-break')) {
            updateBreakRole(next, role);
            return;
        }
        if (next && next.classList && next.classList.contains('page-break-marker') && next.getAttribute('data-abene-break') === 'model') {
            next.parentNode.replaceChild(makeBreakEl(role), next);
            return;
        }
        var br = makeBreakEl(role);
        if (node.nextSibling) node.parentNode.insertBefore(br, node.nextSibling);
        else node.parentNode.appendChild(br);
    }
    function placeBreakBefore(node, role) {
        if (!node || !node.parentNode) return;
        var prev = skipFlow(node.previousElementSibling, -1);
        if (prev && prev.classList && prev.classList.contains('abene-section-break')) {
            updateBreakRole(prev, role);
            return;
        }
        if (prev && prev.classList && prev.classList.contains('page-break-marker') && prev.getAttribute('data-abene-break') === 'model') {
            prev.parentNode.replaceChild(makeBreakEl(role), prev);
            return;
        }
        node.parentNode.insertBefore(makeBreakEl(role), node);
    }
    function applyReportSections(opts) {
        opts = opts || {};
        var editor = ed();
        if (!editor) return;
        var fronts = editor.querySelectorAll('[data-abene-block="cover"], [data-abene-block="titlepage"], [data-abene-block="toc"]');
        var lastFront = fronts.length ? fronts[fronts.length - 1] : null;
        var annex = editor.querySelector('[data-abene-block="annex"]');
        if (lastFront) {
            var rp = roleProps('front', getRootProps());
            setRootProps(rp);
            A().pageHeaderDifferentFirst = true;
            try { localStorage.setItem('abeneHeaderDifferentFirst', '1'); } catch (e) {}
            placeBreakAfter(lastFront, 'body');
        }
        if (annex) placeBreakBefore(annex, 'annex');
        refreshChrome();
        if (root.abeneSchedulePageFlow) root.abeneSchedulePageFlow(true);
        if (!opts.silent && typeof saveUndoState === 'function') saveUndoState();
        if (!opts.silent && typeof showToast === 'function') showToast(tt('secStructureDone', 'Estrutura de secções aplicada.'));
    }

    function isFirstHfPage(page, maps) {
        maps = maps || pageMaps();
        if (page <= 0) return true;
        return maps.hf[page] !== maps.hf[page - 1];
    }

    function resolveLinkTarget(secIdx, kind) {
        var sections = list();
        var i = Math.max(0, Math.min(Number(secIdx) || 0, sections.length - 1));
        var linkKey = kind === 'footer' ? 'footerLink' : 'headerLink';
        while (i > 0) {
            var s = sections[i];
            if (!s || s.props[linkKey] === false) return s;
            i--;
        }
        return sections[0];
    }

    function resolvedHeaderBundle(target) {
        if (!target || target.index === 0) {
            var rp = getRootProps();
            return Object.assign({}, rp, {
                headerText: A().pageHeaderText || '',
                headerTemplate: A().pageHeaderTemplate,
                headerFields: A().pageHeaderFields,
                differentFirst: !!(rp.differentFirst || A().pageHeaderDifferentFirst)
            });
        }
        return Object.assign({}, hfDefaults(), target.props);
    }

    function resolvedFooterBundle(target) {
        if (!target || target.index === 0) {
            var rp = getRootProps();
            var foot = A().pageFooterText;
            if (foot === undefined || foot === null) foot = tt('defaultFooter') || 'Página {PAGE} / {NUMPAGES}';
            return Object.assign({}, rp, {
                footerText: foot,
                differentFirst: !!(rp.differentFirst || A().pageHeaderDifferentFirst)
            });
        }
        return Object.assign({}, hfDefaults(), target.props);
    }

    function hfForPage(page, total) {
        var maps = pageMaps();
        var secIdx = maps.hf[page] != null ? maps.hf[page] : 0;
        var bodyIdx = maps.body[page] != null ? maps.body[page] : secIdx;
        var sections = list();
        var bodySec = sections[bodyIdx] || sections[0];
        var targetH = resolveLinkTarget(secIdx, 'header');
        var targetF = resolveLinkTarget(secIdx, 'footer');
        var h = resolvedHeaderBundle(targetH);
        var f = resolvedFooterBundle(targetF);
        var first = isFirstHfPage(page, maps);
        var even = ((page + 1) % 2) === 0;
        var hideFirst = false;
        var header = h.headerText || '';
        var headerTemplate = h.headerTemplate;
        var headerFields = h.headerFields;
        var info = pageNumberInfo(page, total || 1);
        var hideNumbers = !!info.hideNumbers;
        if (first && h.differentFirst) {
            if (h.headerFirst != null && String(h.headerFirst).trim() !== '') {
                header = h.headerFirst;
                headerFields = h.headerFirstFields || headerFields;
                headerTemplate = h.headerFirstTemplate || headerTemplate;
            } else {
                hideFirst = true;
                header = '';
            }
        } else if (even && h.differentOddEven && h.headerEven != null) {
            header = h.headerEven;
            headerFields = h.headerEvenFields || headerFields;
        }
        var footer = f.footerText;
        if (footer === undefined || footer === null) footer = '';
        if (hideFirst) {
            footer = '';
        } else if (hideNumbers) {
            footer = stripPageFields(footer);
        } else if (first && f.differentFirst && f.footerFirst != null) {
            footer = f.footerFirst;
        } else if (even && f.differentOddEven && f.footerEven != null) {
            footer = f.footerEven;
        }
        var distH = bodySec && bodySec.props ? bodySec.props.headerDistance : null;
        var distF = bodySec && bodySec.props ? bodySec.props.footerDistance : null;
        return {
            header: header,
            footer: footer,
            hideFirst: hideFirst,
            hideNumbers: hideNumbers,
            pageInfo: info,
            template: headerTemplate,
            fields: headerFields,
            headerDistance: distH,
            footerDistance: distF,
            sectionIndex: secIdx,
            headerSource: targetH ? targetH.index : 0,
            footerSource: targetF ? targetF.index : 0,
            linkedHeader: !!(secIdx > 0 && targetH && targetH.index !== secIdx),
            linkedFooter: !!(secIdx > 0 && targetF && targetF.index !== secIdx),
            role: (bodySec && bodySec.props && bodySec.props.role) || (info && info.role) || null
        };
    }

    function chromeSig(pages) {
        var parts = [];
        var n = Math.max(1, Number(pages) || 1);
        var i;
        try {
            parts.push(JSON.stringify(getRootProps()));
            list().forEach(function (s) {
                if (s.el) parts.push(s.el.getAttribute('data-abene-section-props') || '');
            });
            var roles = classifyPages(n);
            parts.push(roles.join(','));
            for (i = 0; i < n; i++) {
                var hf = hfForPage(i, n);
                var inf = hf.pageInfo || {};
                parts.push([hf.header, hf.footer, hf.hideFirst ? '1' : '0', hf.hideNumbers ? '1' : '0', inf.label || '', inf.sectionTotal || '', hf.template || '', hf.headerDistance || '', hf.footerDistance || ''].join('~'));
            }
        } catch (e) {
            parts.push(String(e));
        }
        return parts.join('|');
    }

    function snapshotRootHf() {
        return {
            header: A().pageHeaderText,
            footer: A().pageFooterText,
            tpl: A().pageHeaderTemplate,
            fields: A().pageHeaderFields,
            differentFirst: A().pageHeaderDifferentFirst
        };
    }

    function restoreRootHf(snap) {
        if (!snap) return;
        A().pageHeaderText = snap.header;
        A().pageFooterText = snap.footer;
        if (snap.tpl != null) A().pageHeaderTemplate = snap.tpl;
        if (snap.fields != null) A().pageHeaderFields = snap.fields;
        try {
            localStorage.setItem('abeneHeader', snap.header || '');
            localStorage.setItem('abeneFooter', snap.footer == null ? '' : String(snap.footer));
            if (snap.tpl != null) localStorage.setItem('abeneHeaderTemplate', snap.tpl);
            if (snap.fields != null) localStorage.setItem('abeneHeaderFields', JSON.stringify(snap.fields || {}));
        } catch (e) {}
    }

    function syncRootFromGlobal() {
        var p = Object.assign({}, getRootProps());
        p.headerText = A().pageHeaderText || '';
        p.footerText = A().pageFooterText;
        p.headerTemplate = A().pageHeaderTemplate;
        p.headerFields = A().pageHeaderFields;
        p.differentFirst = !!A().pageHeaderDifferentFirst;
        setRootProps(p);
    }

    function pageFromZone(zone) {
        if (!zone || !zone.getAttribute) return 0;
        var n = parseInt(zone.getAttribute('data-page'), 10);
        return n > 0 ? n - 1 : 0;
    }
    function currentHfSection(kind) {
        var page = null;
        if (root._abeneHf && root._abeneHf.zone) page = pageFromZone(root._abeneHf.zone);
        else if (root._abeneHfLastPage != null) page = Number(root._abeneHfLastPage);
        if (page == null || !isFinite(page) || page < 0) {
            var area = document.getElementById('editorArea');
            var h = pageHeightPx();
            if (area && h) page = Math.max(0, Math.floor((area.scrollTop || 0) / h));
        }
        if (page != null && isFinite(page) && page >= 0) {
            var maps = pageMaps();
            var secIdx = maps.hf[page] != null ? maps.hf[page] : 0;
            return list()[secIdx] || list()[0];
        }
        return atCaret();
    }
    function ensureOwnSection(sec, kind) {
        if (!sec || sec.index === 0) return sec;
        var props = Object.assign({}, sec.props);
        var linkKey = kind === 'footer' ? 'footerLink' : 'headerLink';
        if (props[linkKey] === false && ((kind === 'footer' && props.footerText != null) || (kind !== 'footer' && props.headerText != null))) {
            return Object.assign({}, sec, { props: props });
        }
        var src = kind === 'footer'
            ? resolvedFooterBundle(resolveLinkTarget(sec.index - 1, 'footer'))
            : resolvedHeaderBundle(resolveLinkTarget(sec.index - 1, 'header'));
        if (kind === 'footer') {
            if (props.footerText == null) props.footerText = src.footerText;
            props.footerLink = false;
        } else {
            if (props.headerText == null) props.headerText = src.headerText || '';
            if (props.headerTemplate == null) props.headerTemplate = src.headerTemplate;
            if (props.headerFields == null) props.headerFields = src.headerFields;
            props.headerLink = false;
        }
        writeSection(sec, props);
        return { index: sec.index, type: sec.type, el: sec.el, props: props };
    }
    function ensureOwnFromZone(zone, kind) {
        var page = pageFromZone(zone);
        var maps = pageMaps();
        var secIdx = maps.hf[page] != null ? maps.hf[page] : 0;
        var sec = list()[secIdx] || list()[0];
        return ensureOwnSection(sec, kind === 'footer' ? 'footer' : 'header');
    }
    function afterGlobalHfWrite(kind, snap) {
        kind = kind === 'footer' ? 'footer' : 'header';
        var cur = currentHfSection(kind);
        if (cur && cur.index > 0) cur = ensureOwnSection(cur, kind);
        if (!cur || cur.index === 0) {
            syncRootFromGlobal();
            return;
        }
        var props = Object.assign({}, cur.props);
        if (kind === 'footer') {
            props.footerText = A().pageFooterText;
            props.footerLink = false;
        } else {
            props.headerText = A().pageHeaderText || '';
            props.headerTemplate = A().pageHeaderTemplate;
            props.headerFields = A().pageHeaderFields;
            props.headerLink = false;
        }
        writeSection(cur, props);
        restoreRootHf(snap);
        refreshChrome();
    }

    function wrapHfWriter(name, kind) {
        var orig = root[name];
        if (typeof orig !== 'function' || orig._abeneHf) return;
        var wrapped = function () {
            var snap = snapshotRootHf();
            var r = orig.apply(this, arguments);
            try { afterGlobalHfWrite(kind, snap); } catch (e) {}
            return r;
        };
        wrapped._abeneHf = true;
        root[name] = wrapped;
    }

    wrapHfWriter('applyHeaderTemplate', 'header');

    function wrapApplyPageNumber() {
        var orig = root.applyPageNumber;
        if (typeof orig !== 'function' || orig._abeneHf) return;
        var wrapped = function (kind) {
            var snap = snapshotRootHf();
            var r = orig.apply(this, arguments);
            try {
                afterGlobalHfWrite(kind && String(kind).indexOf('header') === 0 ? 'header' : 'footer', snap);
            } catch (e) {}
            return r;
        };
        wrapped._abeneHf = true;
        root.applyPageNumber = wrapped;
    }

    function wrapHfWritersLater() {
        wrapHfWriter('applyFooterPreset', 'footer');
        wrapApplyPageNumber();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wrapHfWritersLater);
    } else {
        setTimeout(wrapHfWritersLater, 0);
    }

    function commitFromZone(type, payload, zone) {
        payload = payload || {};
        var pageNum = zone && zone.getAttribute ? parseInt(zone.getAttribute('data-page'), 10) : 1;
        var page = (pageNum > 0 ? pageNum : 1) - 1;
        var maps = pageMaps();
        var secIdx = maps.hf[page] != null ? maps.hf[page] : 0;
        var kind = type === 'footer' ? 'footer' : 'header';
        var target = resolveLinkTarget(secIdx, kind);
        var first = isFirstHfPage(page, maps);
        var even = ((page + 1) % 2) === 0;
        var bundle = kind === 'footer' ? resolvedFooterBundle(target) : resolvedHeaderBundle(target);
        var useFirst = first && bundle.differentFirst;
        var useEven = even && bundle.differentOddEven && !useFirst;
        var val = payload.val;
        if (payload.structured && payload.fields) {
            val = payload.fields.title || val || '';
        }

        if (!target || target.index === 0) {
            if (!useFirst && !useEven) return false;
            var rp = Object.assign({}, getRootProps());
            if (kind === 'footer') {
                if (useFirst) rp.footerFirst = val;
                else rp.footerEven = val;
            } else {
                if (useFirst) {
                    rp.headerFirst = val;
                    if (payload.fields) rp.headerFirstFields = payload.fields;
                } else {
                    rp.headerEven = val;
                    if (payload.fields) rp.headerEvenFields = payload.fields;
                }
            }
            setRootProps(rp);
            return true;
        }

        var props = Object.assign({}, target.props);
        if (kind === 'footer') {
            if (useFirst) props.footerFirst = val;
            else if (useEven) props.footerEven = val;
            else props.footerText = val;
        } else {
            if (useFirst) {
                props.headerFirst = val;
                if (payload.fields) props.headerFirstFields = payload.fields;
            } else if (useEven) {
                props.headerEven = val;
                if (payload.fields) props.headerEvenFields = payload.fields;
            } else {
                props.headerText = val;
                if (payload.fields) props.headerFields = payload.fields;
                if (payload.template) props.headerTemplate = payload.template;
            }
        }
        writeSection(target, props);
        return true;
    }

    function refreshChrome() {
        root._abeneChromeSig = '';
        if (typeof root.renderPageDecorations === 'function') root.renderPageDecorations();
    }

    function setLink(kind, linked) {
        var cur = currentHfSection(kind === 'footer' ? 'footer' : 'header');
        if (!cur || cur.index === 0) return;
        var props = Object.assign({}, cur.props);
        var kinds = kind === 'both' ? ['header', 'footer'] : [kind === 'footer' ? 'footer' : 'header'];
        kinds.forEach(function (k) {
            if (k === 'footer') {
                if (!linked) {
                    var src = resolvedFooterBundle(resolveLinkTarget(cur.index - 1, 'footer'));
                    if (props.footerText == null) props.footerText = src.footerText;
                    props.footerLink = false;
                } else {
                    props.footerLink = true;
                }
            } else if (!linked) {
                var srcH = resolvedHeaderBundle(resolveLinkTarget(cur.index - 1, 'header'));
                if (props.headerText == null) props.headerText = srcH.headerText || '';
                if (props.headerTemplate == null) props.headerTemplate = srcH.headerTemplate;
                if (props.headerFields == null) props.headerFields = srcH.headerFields;
                props.headerLink = false;
            } else {
                props.headerLink = true;
            }
        });
        writeSection(cur, props);
        hideFly();
        refreshChrome();
        if (typeof saveUndoState === 'function') saveUndoState();
    }

    function toggleFlag(flag) {
        var cur = atCaret();
        var props = Object.assign({}, cur ? cur.props : getRootProps());
        props[flag] = !props[flag];
        writeSection(cur, props);
        if ((!cur || cur.index === 0) && flag === 'differentFirst') {
            A().pageHeaderDifferentFirst = !!props.differentFirst;
            try { localStorage.setItem('abeneHeaderDifferentFirst', props.differentFirst ? '1' : '0'); } catch (e) {}
        }
        hideFly();
        refreshChrome();
        if (typeof saveUndoState === 'function') saveUndoState();
    }

    function setDistance(kind) {
        hideFly();
        var cur = atCaret();
        var props = Object.assign({}, cur ? cur.props : getRootProps());
        var key = kind === 'footer' ? 'footerDistance' : 'headerDistance';
        var currentPx = props[key];
        var currentCm = currentPx != null && currentPx !== '' ? (Number(currentPx) * 2.54 / 96).toFixed(2) : '';
        var label = tt('pHfDistance', 'Distância da extremidade (cm):');
        function applyCm(s) {
            if (s == null) return;
            s = String(s).trim().replace(',', '.');
            if (!s) props[key] = null;
            else {
                var cm = parseFloat(s);
                if (!isFinite(cm) || cm < 0 || cm > 10) {
                    var bad = tt('hfDistInvalid', 'Indique um valor entre 0 e 10 cm.');
                    if (typeof showToast === 'function') showToast(bad);
                    else if (root.alert) root.alert(bad);
                    return;
                }
                props[key] = Math.round(cm * 96 / 2.54);
            }
            writeSection(cur, props);
            hideFly();
            refreshChrome();
            if (typeof saveUndoState === 'function') saveUndoState();
        }
        function escHtml(s) {
            return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
        var open = root.openGenericModal || (typeof openGenericModal === 'function' ? openGenericModal : null);
        if (typeof open === 'function') {
            var title = kind === 'footer'
                ? tt('hfDistFooter', 'Distância do rodapé…')
                : tt('hfDistHeader', 'Distância do cabeçalho…');
            root._abeneFormOnOk = function (data) { applyCm(data && data.cm); };
            open(title,
                '<div class="form-group"><label for="abeneDlg_cm">' + escHtml(label) + '</label>' +
                '<input id="abeneDlg_cm" type="number" min="0" max="10" step="0.05" inputmode="decimal" value="' + escHtml(currentCm) + '"></div>',
                '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + escHtml(tt('cancel', 'Cancelar')) + '</button>' +
                '<button class="btn-primary" onclick="abeneSubmitFormDialog()">' + escHtml(tt('ok', 'OK')) + '</button>');
            setTimeout(function () {
                var el = document.getElementById('abeneDlg_cm');
                if (el) {
                    el.focus();
                    if (el.select) el.select();
                }
            }, 30);
            return;
        }
        var asked = root.prompt ? root.prompt(label, currentCm) : currentCm;
        if (asked == null) return;
        applyCm(asked);
    }

    function sectionMenuButtons() {
        var cur = currentHfSection('header') || atCaret();
        var can = cur && cur.index > 0;
        var html = '';
        if (can) {
            var hLink = cur.props.headerLink !== false;
            var fLink = cur.props.footerLink !== false;
            html += '<button type="button" onclick="abeneHfSetLink(\'header\',' + (hLink ? 'false' : 'true') + ')">' +
                (hLink ? tt('hfUnlinkHeader', 'Cabeçalho: não ligar ao anterior') : tt('hfLinkHeader', 'Cabeçalho: ligar ao anterior')) + '</button>';
            html += '<button type="button" onclick="abeneHfSetLink(\'footer\',' + (fLink ? 'false' : 'true') + ')">' +
                (fLink ? tt('hfUnlinkFooter', 'Rodapé: não ligar ao anterior') : tt('hfLinkFooter', 'Rodapé: ligar ao anterior')) + '</button>';
        }
        var onFirst = !!(cur && cur.props.differentFirst) || (!cur || cur.index === 0) && !!A().pageHeaderDifferentFirst;
        var onOdd = !!(cur && cur.props.differentOddEven);
        html += '<button type="button" onclick="abeneHfToggleFirst()">' +
            (onFirst ? '✓ ' : '') + tt('hfDiffFirstSec', '1.ª página diferente') + '</button>';
        html += '<button type="button" onclick="abeneHfToggleOddEven()">' +
            (onOdd ? '✓ ' : '') + tt('hfOddEven', 'Páginas pares e ímpares diferentes') + '</button>';
        html += '<button type="button" onclick="abeneHfDistance(\'header\')">' + tt('hfDistHeader', 'Distância do cabeçalho…') + '</button>';
        html += '<button type="button" onclick="abeneHfDistance(\'footer\')">' + tt('hfDistFooter', 'Distância do rodapé…') + '</button>';
        return html;
    }

    var Sections = {
        TYPES: ['nextPage', 'continuous', 'evenPage', 'oddPage'],
        insertBreak: insertBreak,
        list: list,
        atCaret: atCaret,
        getRootProps: getRootProps,
        syncFromDocument: syncGeoFromDocument,
        currentDocProps: currentDocProps,
        pageMaps: pageMaps,
        hfForPage: hfForPage,
        pageNumberInfo: pageNumberInfo,
        classifyPages: classifyPages,
        applyReportStructure: applyReportSections,
        currentHfSection: currentHfSection,
        ensureOwnFromZone: ensureOwnFromZone,
        pageFromZone: pageFromZone,
        roleLabel: roleLabel,
        chromeSig: chromeSig,
        commitFromZone: commitFromZone,
        setLink: setLink,
        syncRootFromGlobal: syncRootFromGlobal
    };
    root.ABENE.Sections = Sections;
    root.insertSectionBreak = function (type, extra) {
        insertBreak(type, extra);
    };
    root.insertSectionRole = function (role) {
        insertBreak('nextPage', { role: role });
    };
    root.applyReportSections = applyReportSections;
    root.abeneSectionBreakHtml = function (role) {
        return breakHtml('nextPage', { role: role });
    };
    root.abeneHfSetLink = function (kind, linked) { setLink(kind, linked); };
    root.abeneHfToggleFirst = function () { toggleFlag('differentFirst'); };
    root.abeneHfToggleOddEven = function () { toggleFlag('differentOddEven'); };
    root.abeneHfDistance = function (kind) { setDistance(kind); };
    root.abeneHfSectionMenuHtml = function () {
        return '<div class="hf-sec-opts">' + sectionMenuButtons() + '</div>';
    };
    root.abeneHfSectionMenuButtons = sectionMenuButtons;

    function wrapInsertSectionHeading() {
        var orig = root.insertSection;
        if (typeof orig === 'function' && orig._abeneSecPage) return;
        function escHtml(s) {
            return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
        function restoreSecRange() {
            var editor = ed();
            var r = root._abeneSecRange;
            if (!editor || !r) return;
            try {
                editor.focus();
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(r);
            } catch (eR) {}
        }
        function go(title) {
            title = String(title || '').trim();
            if (!title) return;
            restoreSecRange();
            insertBreak('nextPage');
            var html = '<div data-section="true" class="abene-section-title" style="border-top:2px solid #2b579a;margin:8px 0 12px;padding-top:8px;"><h2>' + escHtml(title) + '</h2></div><p></p>';
            if (root.EditorCommands && root.EditorCommands.useEngine && typeof root.EditorCommands.insertHTML === 'function') {
                root.EditorCommands.insertHTML(html);
            } else {
                try { document.execCommand('insertHTML', false, html); } catch (eIns) {}
            }
            if (typeof saveUndoState === 'function') saveUndoState();
            if (root.abeneSchedulePageFlow) root.abeneSchedulePageFlow(true);
            if (typeof showToast === 'function') showToast(tt('secTitlePage', title));
        }
        var wrapped = function () {
            var titleLabel = tt('sectionTitle', 'Título da secção:');
            var def = tt('newSection', 'Nova secção');
            try {
                var sel = window.getSelection();
                if (sel && sel.rangeCount) root._abeneSecRange = sel.getRangeAt(0).cloneRange();
            } catch (eSel) {}
            if (typeof root.openGenericModal === 'function' || typeof openGenericModal === 'function') {
                var open = root.openGenericModal || openGenericModal;
                root._abeneFormOnOk = function (data) { go(data && data.title); };
                open(tt('section', 'Secção'),
                    '<div class="form-group"><label for="abeneDlg_title">' + escHtml(titleLabel) + '</label>' +
                    '<input id="abeneDlg_title" type="text" value="' + escHtml(def) + '"></div>',
                    '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + escHtml(tt('cancel', 'Cancelar')) + '</button>' +
                    '<button class="btn-primary" onclick="abeneSubmitFormDialog()">' + escHtml(tt('ok', 'OK')) + '</button>');
                setTimeout(function () {
                    var el = document.getElementById('abeneDlg_title');
                    if (el) el.focus();
                }, 30);
                return;
            }
            var asked = root.prompt ? root.prompt(titleLabel, def) : def;
            if (asked) go(asked);
        };
        wrapped._abeneSecPage = true;
        wrapped._legacy = orig;
        root.insertSection = wrapped;
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wrapInsertSectionHeading);
    } else {
        setTimeout(wrapInsertSectionHeading, 0);
    }
})(window);
