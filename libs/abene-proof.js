/* Genius Raros — ortografia, mailing, equações (envolve os botões já existentes). */
(function (root) {
    function tt(key, fb) {
        if (typeof root.t === 'function') {
            var v = root.t(key);
            if (v && v !== key) return v;
        }
        return fb || key;
    }
    function toast(msg) {
        if (typeof root.showToast === 'function') root.showToast(msg);
    }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function editorEl() { return document.getElementById('editor'); }
    function lang() {
        try { return localStorage.getItem('abeneLanguage') || document.documentElement.lang || 'pt-PT'; } catch (e) {
            return 'pt-PT';
        }
    }
    function save() {
        if (typeof root.saveUndoState === 'function') root.saveUndoState();
    }
    var savedRange = null;
    function saveCaret() {
        var sel = root.getSelection && root.getSelection();
        if (sel && sel.rangeCount) {
            try { savedRange = sel.getRangeAt(0).cloneRange(); } catch (e) {}
        }
    }
    function restoreCaret() {
        var ed = editorEl();
        if (!ed) return;
        ed.focus();
        if (!savedRange) return;
        try {
            var sel = root.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange);
        } catch (e) {}
    }

    var PT = (
        'a ao aos as à às até aqui ali agora ainda algo alguém algum alguma alguns algumas antes após assim embora então também já mais menos muito muita muitos muitas não sim ou e mas porém porque pois que qual quais quando onde como quem cujo cuja ' +
        'o os um uma uns umas de do da dos das em no na nos nas por para com sem sob sobre entre desde contra durante através ' +
        'eu tu ele ela nós vós eles elas me te se nos vos lhe lhes meu minha meus minhas teu tua seus suas nosso nossa seus ' +
        'ser é são era era foram foi seja sendo sido ter tem têm tinha tiveram teve tenha havendo haver há ' +
        'fazer faz fez feito ir vai foi ir vir vem veio poder pode pôde poder dever deve devido querer quer quis ' +
        'ficar fica ficou estar está estão esteve estava ficar dar dá deu dado ver vê viu visto saber sabe soube ' +
        'dizer diz disse dito partir parte chegou chegar passar passou passar começar começou começar acabar acabou ' +
        'trabalho obra local cliente técnico responsável relatório documento referência data versão página índice ' +
        'anexo anexos capa folha rosto introdução objeto âmbito metodologia observações conclusões recomendações ' +
        'tabela figura fotografia imagem legenda conforme conformidade inspeção canalização construção pesquisa ' +
        'empresa morada telefone email correio nif iva orçamento recibo fatura pagamento serviço serviços ' +
        'portugal lisboa porto rua avenida praça código postal localidade cidade país ' +
        'janeiro fevereiro março abril maio junho julho agosto setembro outubro novembro dezembro ' +
        'segunda terça quarta quinta sexta sábado domingo ' +
        'primeiro primeira segundo segunda terceiro terceira último última novo nova novos novas ' +
        'grande pequeno pequeno boa bom melhor pior alto baixo dentro fora cima baixo ' +
        'número números valor valores total totais quantidade preço unitário montante ' +
        'norma normas equipamento equipamentos segurança acesso projeto caderno encargos acabamentos ' +
        'pendente pendentes resultado resultados nota notas item itens lista verificação histórico revisão revisões ' +
        'assinatura assinaturas qualidade espaço manuscrito confidencial interno uso ' +
        'genius raros calibri cambria times geórgia'
    ).split(/\s+/).filter(Boolean);

    var FR = 'le la les un une des de du et ou mais donc car que qui dont où comment quand je tu il elle nous vous ils elles être avoir faire aller venir voir savoir pouvoir devoir vouloir ce cette ces mon ma mes son sa ses notre nos votre vos leur leurs ne pas plus moins très bien bon aujourd hui après avant avec sans pour par sur sous dans entre'.split(/\s+/);
    var EN = 'the a an and or but if as at by for from in of on to with not no yes is are was were be been being have has had do does did this that these those i you he she we they it my your his her our their'.split(/\s+/);
    var ES = 'el la los las un una unos unas de del y o pero que quien cual cuando donde como no sí más menos muy bien mal ser es son era fue estar está están tener tiene hay por para con sin sobre entre'.split(/\s+/);

    function baseDict() {
        var l = lang();
        if (l.indexOf('fr') === 0) return FR;
        if (l.indexOf('en') === 0) return EN;
        if (l.indexOf('es') === 0) return ES;
        return PT;
    }
    function userDict() {
        try {
            var arr = JSON.parse(localStorage.getItem('abeneUserDict') || '[]');
            return Array.isArray(arr) ? arr : [];
        } catch (e) { return []; }
    }
    function saveUserDict(arr) {
        try { localStorage.setItem('abeneUserDict', JSON.stringify(arr.slice(0, 800))); } catch (e) {}
    }
    function dictSet() {
        var set = {};
        baseDict().concat(userDict()).forEach(function (w) {
            if (w) set[String(w).toLowerCase()] = 1;
        });
        return set;
    }
    function dist(a, b) {
        if (a === b) return 0;
        var m = a.length, n = b.length, i, j, prev, cur, tmp;
        if (Math.abs(m - n) > 2) return 9;
        var row = [];
        for (j = 0; j <= n; j++) row[j] = j;
        for (i = 1; i <= m; i++) {
            prev = i;
            for (j = 1; j <= n; j++) {
                cur = a.charAt(i - 1) === b.charAt(j - 1) ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
                row[j - 1] = prev;
                prev = cur;
            }
            row[n] = prev;
        }
        return row[n];
    }
    function suggestions(word, set) {
        var w = String(word || '').toLowerCase();
        var out = [];
        Object.keys(set).forEach(function (d) {
            var k = dist(w, d);
            if (k && k <= 2) out.push({ w: d, k: k });
        });
        out.sort(function (a, b) { return a.k - b.k || a.w.localeCompare(b.w); });
        return out.slice(0, 6).map(function (x) { return x.w; });
    }
    function collectIssues(editor) {
        var text = String(editor.innerText || '').replace(/\u200b/g, ' ');
        var set = dictSet();
        var issues = [];
        var seen = {};
        var reRep = /([A-Za-zÀ-ÿ]{2,})\s+\1\b/gi;
        var m;
        while ((m = reRep.exec(text))) {
            var key = 'r:' + m[1].toLowerCase();
            if (seen[key]) continue;
            seen[key] = 1;
            issues.push({ kind: 'repeat', word: m[1], raw: m[0] });
        }
        var reW = /[A-Za-zÀ-ÿ]{3,}/g;
        while ((m = reW.exec(text))) {
            var word = m[0];
            if (/^[A-ZÀ-Ý]{2,}$/.test(word)) continue;
            if (set[word.toLowerCase()]) continue;
            key = 'u:' + word.toLowerCase();
            if (seen[key]) continue;
            seen[key] = 1;
            issues.push({ kind: 'unknown', word: word, raw: word });
        }
        return issues;
    }
    function replaceWord(editor, from, to) {
        if (!from || !to || from === to) return false;
        var walk = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null);
        var node, changed = false;
        var re = new RegExp('(^|[^A-Za-zÀ-ÿ])' + from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-zÀ-ÿ])', 'g');
        while ((node = walk.nextNode())) {
            if (!node.parentElement || node.parentElement.closest('.abene-cover, .abene-titlepage, [data-merge-field]')) continue;
            if (!re.test(node.nodeValue)) continue;
            re.lastIndex = 0;
            node.nodeValue = node.nodeValue.replace(re, function (_, pre) { return pre + to; });
            changed = true;
        }
        return changed;
    }

    var proofState = { issues: [], i: 0 };
    function proofBody() {
        var it = proofState.issues[proofState.i];
        if (!it) {
            return '<p>' + esc(tt('spellNone', 'Nenhum problema encontrado. A ortografia do browser continua ativa.')) + '</p>';
        }
        var sug = it.kind === 'unknown' ? suggestions(it.word, dictSet()) : [];
        return '<p class="abene-proof-count">' + esc(tt('spellOf', '{n} de {total}')
            .replace('{n}', String(proofState.i + 1)).replace('{total}', String(proofState.issues.length))) + '</p>' +
            '<p><strong>' + esc(it.kind === 'repeat' ? tt('spellRepeat', 'Palavra repetida') : tt('spellUnknown', 'Palavra desconhecida')) +
            ':</strong> <span class="abene-proof-word">' + esc(it.word) + '</span></p>' +
            '<div class="form-group"><label>' + esc(tt('spellReplaceWith', 'Substituir por')) + '</label>' +
            '<input id="abeneProofTo" type="text" value="' + esc(sug[0] || it.word) + '"></div>' +
            (sug.length ? '<div class="abene-proof-sugs">' + sug.map(function (s) {
                return '<button type="button" class="btn-secondary" data-sug="' + esc(s) + '">' + esc(s) + '</button>';
            }).join('') + '</div>' : '') +
            '<p class="abene-proof-hint">' + esc(tt('spellOn')) + '</p>';
    }
    function bindProofSugs() {
        document.querySelectorAll('.abene-proof-sugs [data-sug]').forEach(function (b) {
            b.onclick = function () {
                var inp = document.getElementById('abeneProofTo');
                if (inp) inp.value = b.getAttribute('data-sug') || '';
            };
        });
    }
    function openProof() {
        var editor = editorEl();
        if (!editor) return;
        saveCaret();
        editor.spellcheck = true;
        editor.setAttribute('spellcheck', 'true');
        editor.setAttribute('lang', lang());
        editor.focus();
        proofState.issues = collectIssues(editor);
        proofState.i = 0;
        if (typeof root.openGenericModal !== 'function') {
            toast(tt('spellOn'));
            return;
        }
        root.openGenericModal(tt('spelling', 'Ortografia'), proofBody(),
            '<button type="button" class="btn-secondary" onclick="abeneProofIgnore()">' + esc(tt('spellIgnore', 'Ignorar')) + '</button>' +
            '<button type="button" class="btn-secondary" onclick="abeneProofAdd()">' + esc(tt('spellAdd', 'Adicionar')) + '</button>' +
            '<button type="button" class="btn-primary" onclick="abeneProofReplace()">' + esc(tt('spellReplace', 'Substituir')) + '</button>'
        );
        bindProofSugs();
    }
    function refreshProof() {
        var body = document.getElementById('genericModalBody');
        if (body) body.innerHTML = proofBody();
        bindProofSugs();
        if (!proofState.issues[proofState.i] && typeof root.closeModal === 'function') {
            toast(tt('spellDone', 'Verificação concluída.'));
        }
    }
    function nextIssue() {
        proofState.i += 1;
        if (proofState.i >= proofState.issues.length) {
            if (typeof root.closeModal === 'function') root.closeModal('genericModal');
            toast(tt('spellDone', 'Verificação concluída.'));
            return;
        }
        refreshProof();
    }
    root.abeneProofReplace = function () {
        var it = proofState.issues[proofState.i];
        var to = (document.getElementById('abeneProofTo') || {}).value;
        if (it && to) {
            replaceWord(editorEl(), it.word, String(to).trim());
            save();
        }
        nextIssue();
    };
    root.abeneProofIgnore = function () { nextIssue(); };
    root.abeneProofAdd = function () {
        var it = proofState.issues[proofState.i];
        if (it && it.kind === 'unknown') {
            var d = userDict();
            var w = it.word.toLowerCase();
            if (d.indexOf(w) < 0) d.push(w);
            saveUserDict(d);
            toast(tt('spellAdded', 'Palavra adicionada ao dicionário.'));
        }
        nextIssue();
    };

    function latexLite(s) {
        var t = String(s == null ? '' : s);
        var map = {
            '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\epsilon': 'ε', '\\pi': 'π',
            '\\Sigma': 'Σ', '\\Omega': 'Ω', '\\sum': '∑', '\\int': '∫', '\\infty': '∞',
            '\\times': '×', '\\cdot': '·', '\\pm': '±', '\\leq': '≤', '\\geq': '≥', '\\neq': '≠', '\\approx': '≈',
            '\\sqrt': '√', '\\frac': '', '\\left': '', '\\right': '', '\\,': ' ', '\\ ': ' '
        };
        Object.keys(map).forEach(function (k) { t = t.split(k).join(map[k]); });
        t = t.replace(/\^([0-9])/g, function (_, d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'.charAt(Number(d)); });
        t = t.replace(/_([0-9])/g, function (_, d) { return '₀₁₂₃₄₅₆₇₈₉'.charAt(Number(d)); });
        t = t.replace(/\{([^}]+)\}/g, '$1');
        return t;
    }
    function eqHtml(src) {
        return '<span class="abene-equation" data-equation="true" data-equation-src="' + esc(src) +
            '" contenteditable="false">' + esc(latexLite(src)) + '</span>';
    }
    function openEquation(preset, targetEl) {
        saveCaret();
        var cur = '';
        var sel = root.getSelection && root.getSelection();
        var node = sel && sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
        var existing = targetEl || (node && node.closest && node.closest('#editor [data-equation]'));
        if (existing) cur = existing.getAttribute('data-equation-src') || existing.textContent || '';
        if (preset) cur = preset;
        if (!cur) cur = tt('equationDefault', 'E = mc^2');
        var pal = [
            ['x^2', 'x²'], ['x_2', 'x₂'], ['\\sqrt{x}', '√x'], ['\\frac{a}{b}', 'a/b'],
            ['\\sum', '∑'], ['\\int', '∫'], ['\\pi', 'π'], ['\\times', '×'],
            ['\\leq', '≤'], ['\\geq', '≥'], ['\\neq', '≠'], ['\\infty', '∞']
        ];
        var body = '<div class="form-group"><label>' + esc(tt('pEquation')) + '</label>' +
            '<input id="abeneEqSrc" type="text" value="' + esc(cur) + '"></div>' +
            '<div class="abene-eq-pal">' + pal.map(function (p) {
                return '<button type="button" data-eq="' + esc(p[0]) + '">' + esc(p[1]) + '</button>';
            }).join('') + '</div>' +
            '<div class="abene-eq-preview" id="abeneEqPrev">' + esc(latexLite(cur)) + '</div>';
        if (typeof root.openGenericModal !== 'function') return;
        root.openGenericModal(tt('equation', 'Equação'), body,
            '<button type="button" class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel')) + '</button>' +
            '<button type="button" class="btn-primary" onclick="abeneEqInsert()">' + esc(tt('ok')) + '</button>'
        );
        setTimeout(function () {
            var inp = document.getElementById('abeneEqSrc');
            var prev = document.getElementById('abeneEqPrev');
            function sync() { if (prev && inp) prev.textContent = latexLite(inp.value); }
            if (inp) inp.oninput = sync;
            document.querySelectorAll('.abene-eq-pal button').forEach(function (b) {
                b.onclick = function () {
                    if (!inp) return;
                    inp.value = (inp.value || '') + b.getAttribute('data-eq');
                    sync();
                    inp.focus();
                };
            });
            root._abeneEqTarget = existing || null;
        }, 30);
    }
    root.abeneEqInsert = function () {
        var inp = document.getElementById('abeneEqSrc');
        var src = inp ? String(inp.value || '').trim() : '';
        if (!src) return;
        var target = root._abeneEqTarget;
        if (target && target.parentNode) {
            var wrap = document.createElement('span');
            wrap.innerHTML = eqHtml(src);
            target.parentNode.replaceChild(wrap.firstChild, target);
        } else {
            restoreCaret();
            insertHtmlHelper(eqHtml(src));
        }
        save();
        if (typeof root.closeModal === 'function') root.closeModal('genericModal');
    };

    function fieldKeys() {
        return [
            { id: 'NomeCliente', label: tt('mdlFieldClient', 'Cliente'), keys: ['nom', 'nome', 'name'] },
            { id: 'NIF', label: tt('taxId', 'NIF'), keys: ['nif'] },
            { id: 'Morada', label: tt('address', 'Morada') || 'Morada', keys: ['morada'] },
            { id: 'Email', label: 'E-mail', keys: ['email'] },
            { id: 'Telefone', label: tt('phone', 'Telefone') || 'Telefone', keys: ['telefone'] },
            { id: 'Localidade', label: tt('clientLocalidade', 'Localidade'), keys: ['localidade'] },
            { id: 'Postal', label: tt('clientPostal', 'Código postal'), keys: ['postal'] }
        ];
    }
    function mergeChipHtml(id) {
        return '<span class="abene-merge-field" data-merge-field="' + esc(id) + '">{' + esc(id) + '}</span>';
    }
    function insertMergeField(id) {
        var field = String(id || '').replace(/[{}]/g, '').trim();
        if (!field) return;
        restoreCaret();
        insertHtmlHelper(mergeChipHtml(field));
        saveCaret();
    }
    function valueFor(client, fieldId) {
        var spec = fieldKeys().filter(function (f) { return f.id.toLowerCase() === String(fieldId).toLowerCase(); })[0];
        if (spec) {
            var i;
            for (i = 0; i < spec.keys.length; i++) {
                if (client[spec.keys[i]]) return client[spec.keys[i]];
            }
        }
        var k = String(fieldId || '').toLowerCase();
        if (client[k]) return client[k];
        if (k.indexOf('nome') >= 0 || k.indexOf('name') >= 0 || k.indexOf('client') >= 0) return client.nom || '';
        if (k.indexOf('nif') >= 0) return client.nif || '';
        if (k.indexOf('mail') >= 0) return client.email || '';
        if (k.indexOf('tel') >= 0 || k.indexOf('phone') >= 0) return client.telefone || '';
        if (k.indexOf('morada') >= 0 || k.indexOf('addr') >= 0) return client.morada || '';
        if (k.indexOf('local') >= 0 || k.indexOf('city') >= 0) return client.localidade || '';
        if (k.indexOf('postal') >= 0 || k === 'cp') return client.postal || '';
        return '';
    }
    function applyClientToDoc(client) {
        var editor = editorEl();
        if (!editor || !client) return 0;
        var n = 0;
        editor.querySelectorAll('[data-merge-field]').forEach(function (el) {
            var id = el.getAttribute('data-merge-field') || '';
            var v = valueFor(client, id);
            if (!v) return;
            el.textContent = v;
            el.setAttribute('data-merge-done', '1');
            n++;
        });
        save();
        return n;
    }
    function openMerge() {
        saveCaret();
        var clients = typeof root.abeneCollectClients === 'function' ? root.abeneCollectClients() : [];
        var fields = fieldKeys();
        var editor = editorEl();
        var used = editor ? editor.querySelectorAll('[data-merge-field]').length : 0;
        var body = '<p>' + esc(tt('mergeHint', 'Insira campos no texto e preencha-os com um cliente guardado (Sheets, Excel ou Arquivo).')) + '</p>' +
            '<div class="abene-merge-chips">' + fields.map(function (f) {
                return '<button type="button" class="btn-secondary" data-mf="' + esc(f.id) + '">{' + esc(f.id) + '} · ' + esc(f.label) + '</button>';
            }).join('') + '</div>' +
            '<div class="form-group"><label>' + esc(tt('mergeField')) + '</label>' +
            '<input id="abeneMergeCustom" type="text" value="' + esc(tt('mergeFieldDefault', 'NomeCliente')) + '"></div>' +
            '<p>' + esc(tt('mergeInDoc', 'Campos no documento')) + ': <strong>' + used + '</strong></p>' +
            (clients.length
                ? '<div class="form-group"><label>' + esc(tt('mergePickClient', 'Preencher com o cliente')) + '</label>' +
                    '<select id="abeneMergeClient">' + clients.map(function (c, i) {
                        return '<option value="' + i + '">' + esc(c.nom) + (c.nif ? ' · ' + esc(c.nif) : '') + '</option>';
                    }).join('') + '</select></div>'
                : '<p class="abene-proof-hint">' + esc(tt('pickClientEmpty')) + '</p>');
        if (typeof root.openGenericModal !== 'function') return;
        root.openGenericModal(tt('mailMerge', 'Mailing'), body,
            '<button type="button" class="btn-secondary" onclick="abeneMergeInsert()">' + esc(tt('mergeInsert', 'Inserir campo')) + '</button>' +
            '<button type="button" class="btn-primary" onclick="abeneMergeApply()">' + esc(tt('mergeFinish', 'Concluir mailing')) + '</button>'
        );
        setTimeout(function () {
            document.querySelectorAll('.abene-merge-chips [data-mf]').forEach(function (b) {
                b.onclick = function () { insertMergeField(b.getAttribute('data-mf')); };
            });
        }, 30);
    }
    root.abeneMergeInsert = function () {
        var el = document.getElementById('abeneMergeCustom');
        insertMergeField(el ? el.value : '');
        toast(tt('mergeInserted', 'Campo inserido.'));
    };
    root.abeneMergeApply = function () {
        var clients = typeof root.abeneCollectClients === 'function' ? root.abeneCollectClients() : [];
        var sel = document.getElementById('abeneMergeClient');
        var c = sel ? clients[Number(sel.value)] : clients[0];
        if (!c) { toast(tt('pickClientEmpty')); return; }
        var n = applyClientToDoc(c);
        toast(tt('mergeDone', '{n} campo(s) preenchidos.').replace('{n}', String(n)));
        if (typeof root.closeModal === 'function') root.closeModal('genericModal');
    };

    function openCollabAuthor() {
        var cur = '';
        try { cur = localStorage.getItem('abeneAuthor') || ''; } catch (e) {}
        var body = '<p>' + esc(tt('collabNeedExec')) + '</p>' +
            '<div class="form-group"><label>' + esc(tt('collabAuthorPrompt')) + '</label>' +
            '<input id="abeneCollabAuthor" type="text" value="' + esc(cur) + '"></div>';
        if (typeof root.openGenericModal !== 'function') return;
        root.openGenericModal(tt('groupCollab', 'Colaboração'), body,
            '<button type="button" class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel')) + '</button>' +
            '<button type="button" class="btn-secondary" onclick="abeneCollabOpenSettings()">' + esc(tt('companySettings', 'Definições')) + '</button>' +
            '<button type="button" class="btn-primary" onclick="abeneCollabSaveAuthor()">' + esc(tt('ok')) + '</button>'
        );
    }
    root.abeneCollabSaveAuthor = function () {
        var el = document.getElementById('abeneCollabAuthor');
        var name = el ? String(el.value || '').trim().slice(0, 80) : '';
        if (name) {
            try { localStorage.setItem('abeneAuthor', name); } catch (e) {}
            toast(tt('collabAuthorSaved', 'Nome visível guardado.'));
        }
        if (typeof root.closeModal === 'function') root.closeModal('genericModal');
        if (typeof root.openCompanySettings === 'function') root.openCompanySettings();
    };
    root.abeneCollabOpenSettings = function () {
        if (typeof root.closeModal === 'function') root.closeModal('genericModal');
        if (typeof root.openCompanySettings === 'function') root.openCompanySettings();
    };
    root.abeneOpenCollabAuthor = openCollabAuthor;

    function insertHtmlHelper(html) {
        var ed = editorEl();
        if (!ed) return;
        restoreCaret();
        if (root.EditorCommands && root.EditorCommands.useEngine && typeof root.EditorCommands.insertHTML === 'function') {
            root.EditorCommands.insertHTML(html);
        } else {
            try { document.execCommand('insertHTML', false, html); } catch (e) {
                ed.insertAdjacentHTML('beforeend', html);
            }
        }
        save();
        saveCaret();
    }
    if (typeof root.abeneInsertHtml !== 'function') root.abeneInsertHtml = insertHtmlHelper;

    var origSpell = root.spellCheck;
    root.spellCheck = function () { openProof(); };
    root.spellCheck._abeneProof = true;
    root.spellCheck._legacy = origSpell;

    var origEq = root.insertEquation;
    root.insertEquation = function () {
        if (typeof root.openGenericModal !== 'function' && typeof origEq === 'function') {
            return origEq.apply(this, arguments);
        }
        openEquation();
    };
    root.insertEquation._abeneProof = true;
    root.insertEquation._legacy = origEq;

    var origMerge = root.insertMailMergeField;
    root.insertMailMergeField = function () {
        if (typeof root.openGenericModal !== 'function' && typeof origMerge === 'function') {
            return origMerge.apply(this, arguments);
        }
        openMerge();
    };
    root.insertMailMergeField._abeneProof = true;
    root.insertMailMergeField._legacy = origMerge;

    document.addEventListener('dblclick', function (ev) {
        var eq = ev.target && ev.target.closest && ev.target.closest('#editor [data-equation]');
        if (!eq) return;
        ev.preventDefault();
        openEquation(eq.getAttribute('data-equation-src') || eq.textContent || '', eq);
    });
})(window);
