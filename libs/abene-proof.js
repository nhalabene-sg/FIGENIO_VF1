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

    /* Termos de relatório Genius Raros (PT-PT). Junta-se ao dicionário-base e ao dicionário pessoal. */
    var TRADE = (
        'ramal ramais caudal caudais pressão pressões manómetro manómetros caudalímetro caudalímetros ' +
        'hidrómetro hidrómetros pressostato pressostatos termóstato termóstatos termómetro ' +
        'sifão sifões sifónico sifónica válvula válvulas torneira torneiras autoclismo autoclismos ' +
        'sanita sanitas lavatório lavatórios bidé bidés banheira banheiras duche duches ralo ralos grelha grelhas ' +
        'tubagem tubagens tubo tubos união uniões curva curvas luva luvas soldadura soldaduras cravação prensagem ' +
        'coluna colunas derivação derivações coletor coletores coletoras traçado traçados cota cotas ' +
        'esgoto esgotos pluvial pluviais residual residuais fossa fossas etar depuradora depuradoras ' +
        'bomba bombas hidropressor hidropressores grupo grupos filtro filtros redutor redutores ' +
        'contador contadores calibre calibres chave chaves corte estanquidade ensaio ensaios prova provas ' +
        'ponta pontas espera predial prediais ligação ligações câmara câmaras visita caixa caixas ' +
        'ventilação primária secundária calorifugação calorifugar infiltração infiltrações fuga fugas ' +
        'humidade humidades entupimento entupimentos desentupir desentupimento ' +
        'acumulador acumuladores esquentador esquentadores caldeira caldeiras rede redes abastecimento ' +
        'águas água polietileno polipropileno multicamada cobre aço inox galvanizado ' +
        'ppr pead pex per pvc cpvc teflon vedante vedantes estopa rosca roscas macho fêmea aperto apertos ' +
        'abraçadeira abraçadeiras suporte suportes binário ' +
        'planta plantas pormenor pormenores caderno encargos especificação especificações ' +
        'medição medições quantitativo quantitativos mapa mapas empreitada empreitadas ' +
        'adjudicação adjudicações receção receções provisória definitiva ' +
        'conformidade conformidades pendência pendências correção correções ' +
        'reparação reparações substituição substituições instalação instalações ' +
        'manutenção preventivo corretivo visita visitas inspeção inspeções ' +
        'inspetor inspetora inspector inspectora técnico técnicos ' +
        'fração frações piso pisos cave caves sótão condomínio condóminos administração ' +
        'autarquia municipal regulamento regulamentos decreto lei portaria ' +
        'norma normas certificado certificados certificação certidão certidões ' +
        'energético energética energia isolamento isolamentos impermeabilização impermeabilizar ' +
        'alvenaria reboco estuque betonilha contrapiso betão armado cofragem ' +
        'telhado telhados cobertura coberturas platibanda platibandas ' +
        'caixilharia caixilhos vidro vidros pavimento pavimentos cerâmico cerâmicos ' +
        'revestimento revestimentos pintura pinturas demolição demolições ' +
        'andaime andaimes epi epis segurança higiene climatização aquecimento ' +
        'radiador radiadores radiante exutor exutores ' +
        'constatar constatou constatado verificado verificada medir mediu medido ' +
        'instalar instalou instalado ensaiar ensaiado recomendar recomendado ' +
        'cumprir cumprido cumprimento aplicar aplicado substituir substituiu substituído ' +
        'epbd avc avac recs reh sce qai nif iva cae iban nipc atcud saft ' +
        'bar kpa mca dhw xps eps ' +
        'canalizador canalizadores canalização construção civil obra obras ' +
        'orçamento orçamentos recibo recibos fatura faturas faturação proposta propostas ' +
        'cliente clientes morada moradas localidade autoridade tributária ' +
        'e-fatura relatórios objeto âmbito metodologia conclusão conclusões ' +
        'fotografia fotografias legenda legendas revisão revisões assinatura ' +
        'não-conforme não-conformidade não-conformidades'
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
        baseDict().concat(TRADE).concat(userDict()).forEach(function (w) {
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
        var reW = /[A-Za-zÀ-ÿ]{3,}(?:-[A-Za-zÀ-ÿ]{2,})*/g;
        while ((m = reW.exec(text))) {
            var word = m[0];
            if (/^[A-ZÀ-Ý]{2,}$/.test(word)) continue;
            if (/^[0-9]+[a-zà-ÿ]*$/i.test(word)) continue;
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

    var SUPER_MAP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ', 'i': 'ⁱ' };
    var SUB_MAP = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎', 'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ' };
    function mapScriptChars(str, table) {
        return String(str || '').split('').map(function (ch) {
            return table[ch] != null ? table[ch] : ch;
        }).join('');
    }
    function latexLiteLegacy(s) {
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
    function latexLite(s) {
        try {
            var t = String(s == null ? '' : s);
            t = t.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, function (_, a, b) {
                a = String(a || '').trim();
                b = String(b || '').trim();
                if (/^[A-Za-z0-9]+$/.test(a) && /^[A-Za-z0-9]+$/.test(b)) return a + '/' + b;
                return '(' + a + ')/(' + b + ')';
            });
            t = t.replace(/\\sqrt\{([^{}]*)\}/g, function (_, x) {
                x = String(x || '').trim();
                return x.length <= 1 ? ('√' + x) : ('√(' + x + ')');
            });
            t = t.replace(/\^\{([^}]+)\}/g, function (_, x) { return mapScriptChars(x, SUPER_MAP); });
            t = t.replace(/_\{([^}]+)\}/g, function (_, x) { return mapScriptChars(x, SUB_MAP); });
            var map = {
                '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\epsilon': 'ε', '\\pi': 'π',
                '\\Sigma': 'Σ', '\\Omega': 'Ω', '\\sum': '∑', '\\int': '∫', '\\infty': '∞',
                '\\times': '×', '\\cdot': '·', '\\pm': '±', '\\leq': '≤', '\\geq': '≥', '\\neq': '≠', '\\approx': '≈',
                '\\sqrt': '√', '\\left': '', '\\right': '', '\\,': ' ', '\\ ': ' '
            };
            Object.keys(map).forEach(function (k) { t = t.split(k).join(map[k]); });
            t = t.replace(/\^([0-9])/g, function (_, d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'.charAt(Number(d)); });
            t = t.replace(/_([0-9])/g, function (_, d) { return '₀₁₂₃₄₅₆₇₈₉'.charAt(Number(d)); });
            t = t.replace(/\{([^}]+)\}/g, '$1');
            return t;
        } catch (err) {
            return latexLiteLegacy(s);
        }
    }
    root.abeneLatexLite = latexLite;
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
                    var token = b.getAttribute('data-eq') || '';
                    var start = inp.selectionStart != null ? inp.selectionStart : String(inp.value || '').length;
                    var end = inp.selectionEnd != null ? inp.selectionEnd : start;
                    var curVal = inp.value || '';
                    inp.value = curVal.slice(0, start) + token + curVal.slice(end);
                    var pos = start + token.length;
                    try { inp.setSelectionRange(pos, pos); } catch (ePos) {}
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
    function refreshMergeUsed() {
        var el = document.getElementById('abeneMergeUsed');
        var editor = editorEl();
        if (el && editor) el.textContent = String(editor.querySelectorAll('[data-merge-field]').length);
    }
    function placeMergeCaret() {
        var editor = editorEl();
        if (!editor) return;
        restoreCaret();
        var sel = root.getSelection && root.getSelection();
        if (sel && sel.rangeCount && editor.contains(sel.anchorNode)) return;
        editor.focus();
        try {
            var r = document.createRange();
            var last = editor.lastChild;
            if (last) {
                r.selectNodeContents(last);
                r.collapse(false);
            } else {
                r.selectNodeContents(editor);
                r.collapse(false);
            }
            sel = root.getSelection();
            sel.removeAllRanges();
            sel.addRange(r);
        } catch (e) {}
    }
    function insertMergeField(id) {
        var field = String(id || '').replace(/[{}]/g, '').trim();
        if (!field) return;
        placeMergeCaret();
        insertHtmlHelper(mergeChipHtml(field));
        saveCaret();
        refreshMergeUsed();
        toast(tt('mergeInserted', 'Campo inserido.'));
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
    function fillFields(root, client) {
        if (!root || !client) return 0;
        var n = 0;
        root.querySelectorAll('[data-merge-field]').forEach(function (el) {
            var id = el.getAttribute('data-merge-field') || '';
            var v = valueFor(client, id);
            if (!v) return;
            el.textContent = v;
            el.setAttribute('data-merge-done', '1');
            n++;
        });
        return n;
    }
    function applyClientToDoc(client) {
        var editor = editorEl();
        if (!editor || !client) return 0;
        var n = fillFields(editor, client);
        save();
        return n;
    }
    function collectMergeClients() {
        return typeof root.abeneCollectClients === 'function' ? root.abeneCollectClients() : [];
    }
    function selectedMergeClients(clients) {
        var boxes = document.querySelectorAll('#abeneMergeList input[type="checkbox"]:checked');
        var out = [];
        boxes.forEach(function (b) {
            var c = clients[Number(b.value)];
            if (c) out.push(c);
        });
        return out;
    }
    function clientFilePart(c) {
        var s = String((c && c.nom) || 'cliente').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
        return (s || 'cliente').slice(0, 40);
    }
    function downloadBlob(blob, name) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            if (a.parentNode) a.parentNode.removeChild(a);
            URL.revokeObjectURL(a.href);
        }, 1500);
    }
    function restoreMergeTemplate(html) {
        var editor = editorEl();
        if (!editor) return;
        editor.innerHTML = html;
        if (typeof root.refreshPagination === 'function') root.refreshPagination();
        if (typeof root.abeneEnhanceCheckTables === 'function') root.abeneEnhanceCheckTables(editor);
    }
    function openMerge() {
        saveCaret();
        var clients = collectMergeClients();
        var fields = fieldKeys();
        var editor = editorEl();
        var used = editor ? editor.querySelectorAll('[data-merge-field]').length : 0;
        var body = '<p>' + esc(tt('mergeHint', 'Insira campos no texto e preencha-os com um ou vários clientes (Sheets, Excel ou Arquivo).')) + '</p>' +
            '<div class="abene-merge-chips">' + fields.map(function (f) {
                return '<button type="button" class="btn-secondary" data-mf="' + esc(f.id) + '">{' + esc(f.id) + '} · ' + esc(f.label) + '</button>';
            }).join('') + '</div>' +
            '<div class="form-group"><label>' + esc(tt('mergeField')) + '</label>' +
            '<input id="abeneMergeCustom" type="text" value="' + esc(tt('mergeFieldDefault', 'NomeCliente')) + '"></div>' +
            '<p>' + esc(tt('mergeInDoc', 'Campos no documento')) + ': <strong id="abeneMergeUsed">' + used + '</strong></p>' +
            (clients.length
                ? '<div class="form-group"><label>' + esc(tt('mergePickClient', 'Clientes da série')) + '</label>' +
                    '<label class="abene-merge-all"><input type="checkbox" id="abeneMergeAll"> ' +
                    esc(tt('mergeSelectAll', 'Selecionar todos')) + '</label>' +
                    '<div class="abene-merge-list" id="abeneMergeList">' + clients.map(function (c, i) {
                        return '<label><input type="checkbox" value="' + i + '"' + (i === 0 ? ' checked' : '') + '> ' +
                            esc(c.nom) + (c.nif ? ' · ' + esc(c.nif) : '') + '</label>';
                    }).join('') + '</div></div>'
                : '<p class="abene-proof-hint">' + esc(tt('pickClientEmpty')) + '</p>');
        if (typeof root.openGenericModal !== 'function') return;
        root.openGenericModal(tt('mailMerge', 'Mailing'), body,
            '<button type="button" class="btn-secondary" onclick="abeneMergeInsert()">' + esc(tt('mergeInsert', 'Inserir campo')) + '</button>' +
            '<button type="button" class="btn-secondary" onclick="abeneMergeZip()">' + esc(tt('mergeZip', 'ZIP da série')) + '</button>' +
            '<button type="button" class="btn-secondary" onclick="abeneMergePdf()">' + esc(tt('mergePdf', 'PDF da série')) + '</button>' +
            '<button type="button" class="btn-primary" onclick="abeneMergeApply()">' + esc(tt('mergeFinish', 'Preencher este documento')) + '</button>'
        );
        setTimeout(function () {
            document.querySelectorAll('.abene-merge-chips [data-mf]').forEach(function (b) {
                b.onclick = function () { insertMergeField(b.getAttribute('data-mf')); };
            });
            var all = document.getElementById('abeneMergeAll');
            if (all) {
                all.onchange = function () {
                    document.querySelectorAll('#abeneMergeList input[type="checkbox"]').forEach(function (cb) {
                        cb.checked = !!all.checked;
                    });
                };
            }
        }, 30);
    }
    root.abeneMergeInsert = function () {
        var el = document.getElementById('abeneMergeCustom');
        insertMergeField(el ? el.value : '');
    };
    root.abeneMergeApply = function () {
        var editor = editorEl();
        if (!editor || editor.querySelectorAll('[data-merge-field]').length < 1) {
            toast(tt('mergeNeedFields', 'Insira pelo menos um campo {NomeCliente} no texto.'));
            return;
        }
        var clients = collectMergeClients();
        if (!clients.length) { toast(tt('pickClientEmpty')); return; }
        var picked = selectedMergeClients(clients);
        var c = picked[0];
        if (!c) { toast(tt('mergeNeedClients', 'Selecione pelo menos um cliente.')); return; }
        var n = applyClientToDoc(c);
        toast(tt('mergeDone', '{n} campo(s) preenchidos.').replace('{n}', String(n)));
        if (typeof root.closeModal === 'function') root.closeModal('genericModal');
    };
    function runMergeSeries(mode) {
        var editor = editorEl();
        if (!editor) return;
        var clients = collectMergeClients();
        var picked = selectedMergeClients(clients);
        if (!picked.length) { toast(tt('mergeNeedClients', 'Selecione pelo menos um cliente.')); return; }
        if (editor.querySelectorAll('[data-merge-field]').length < 1) {
            toast(tt('mergeNeedFields', 'Insira pelo menos um campo {NomeCliente} no texto.'));
            return;
        }
        var max = 30;
        if (picked.length > max) {
            toast(tt('mergeMax', 'A série fica limitada a {n} clientes.').replace('{n}', String(max)));
            picked = picked.slice(0, max);
        }
        var Ex = root.ABENE && root.ABENE.Export;
        if (!Ex || typeof Ex.captureLivePagedImages !== 'function') {
            toast(tt('mergeNoPdf', 'Exportação PDF indisponível.'));
            return;
        }
        var template = editor.innerHTML;
        var wantZip = mode === 'zip';
        if (wantZip && !root.JSZip) {
            toast(tt('mergeNoZip', 'ZIP indisponível — a gerar um PDF único.'));
            wantZip = false;
        }
        var zip = wantZip ? new root.JSZip() : null;
        var allImages = [];
        var geo = null;
        var usedNames = {};
        var ds = (root.abene && root.abene.documentState) || {};
        var base = String(ds.name || 'mailing').replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'mailing';
        toast(tt('mergeBusy', 'A gerar a série…'));
        if (typeof root.closeModal === 'function') root.closeModal('genericModal');
        var seq = Promise.resolve();
        picked.forEach(function (c, idx) {
            seq = seq.then(function () {
                restoreMergeTemplate(template);
                fillFields(editor, c);
                if (typeof root.refreshPagination === 'function') root.refreshPagination();
                return new Promise(function (resolve) {
                    requestAnimationFrame(function () { setTimeout(resolve, 80); });
                }).then(function () {
                    return Ex.captureLivePagedImages();
                });
            }).then(function (pack) {
                geo = pack.g;
                if (zip) {
                    var fname = clientFilePart(c) + (c.nif ? '_' + String(c.nif).replace(/\s+/g, '') : '');
                    if (usedNames[fname]) fname += '_' + (idx + 1);
                    usedNames[fname] = true;
                    return Ex.pageImagesToBlob(pack.images, pack.g).then(function (blob) {
                        zip.file(fname + '.pdf', blob);
                    });
                }
                allImages = allImages.concat(pack.images || []);
            });
        });
        seq.then(function () {
            restoreMergeTemplate(template);
            save();
            if (zip) {
                return zip.generateAsync({ type: 'blob' }).then(function (blob) {
                    downloadBlob(blob, base + '-mailing.zip');
                });
            }
            if (!allImages.length || !geo) throw new Error('empty');
            return Ex.savePageImagesPdf(allImages, geo, base + '-mailing.pdf');
        }).then(function () {
            toast(tt('mergeSeriesOk', '{n} documento(s) gerados.').replace('{n}', String(picked.length)));
        }).catch(function () {
            restoreMergeTemplate(template);
            toast(tt('mergeSeriesFail', 'Não foi possível gerar a série.'));
        });
    }
    root.abeneMergePdf = function () { runMergeSeries('pdf'); };
    root.abeneMergeZip = function () { runMergeSeries('zip'); };

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

    var SMART_COLORS = ['#2b579a', '#3b82a0', '#4f8f72', '#d28b36', '#a84d65'];
    var smartTarget = null;
    function buildSmartArtHtml(items) {
        var html = '<div data-smartart="true" data-smartart-steps="' + esc(items.join(', ')) +
            '" contenteditable="false" title="' + esc(tt('smartArt', 'SmartArt')) +
            '" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:16px 0;padding:12px;background:#f4f7fb;border:1px solid #c8d4e5;border-radius:6px;cursor:pointer;">';
        items.forEach(function (item, index) {
            html += '<div style="display:flex;align-items:center;gap:6px;"><div style="background:' +
                SMART_COLORS[index % SMART_COLORS.length] +
                ';color:#fff;padding:12px 16px;border-radius:4px;min-width:110px;text-align:center;font-weight:600;">' +
                esc(item) + '</div>' +
                (index < items.length - 1 ? '<span style="font-size:20px;color:#6b7280;">→</span>' : '') +
                '</div>';
        });
        html += '</div>';
        return html;
    }
    function openSmartArtDialog(target) {
        if (typeof root.openGenericModal !== 'function') {
            if (typeof origSmartArt === 'function') return origSmartArt.apply(root, arguments);
            return;
        }
        saveCaret();
        smartTarget = target || null;
        var cur = '';
        if (target) cur = target.getAttribute('data-smartart-steps') || '';
        if (!cur) cur = tt('pSmartDef', 'Ideia, Planeamento, Realização, Resultado');
        root.openGenericModal(
            tt('smartArt', 'SmartArt'),
            '<div class="form-group"><label for="abeneSmartSteps">' + esc(tt('pSmart', 'Passos do SmartArt, separados por vírgulas:')) + '</label>' +
            '<input id="abeneSmartSteps" type="text" value="' + esc(cur) + '"></div>',
            '<button type="button" class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel', 'Cancelar')) + '</button>' +
            '<button type="button" class="btn-primary" onclick="abeneSmartArtApply()">' + esc(tt('ok', 'OK')) + '</button>'
        );
        setTimeout(function () {
            var inp = document.getElementById('abeneSmartSteps');
            if (inp) { inp.focus(); inp.select(); }
        }, 30);
    }
    root.abeneSmartArtApply = function () {
        var inp = document.getElementById('abeneSmartSteps');
        var items = String(inp && inp.value || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!items.length) return;
        var html = buildSmartArtHtml(items);
        var target = smartTarget;
        smartTarget = null;
        if (typeof root.closeModal === 'function') root.closeModal('genericModal');
        if (target && target.parentNode) {
            var box = document.createElement('div');
            box.innerHTML = html;
            if (box.firstChild) target.parentNode.replaceChild(box.firstChild, target);
            save();
            return;
        }
        insertHtmlHelper(html);
    };
    var origSmartArt = root.insertSmartArt;
    root.insertSmartArt = function () {
        try {
            if (typeof root.openGenericModal !== 'function') {
                if (typeof origSmartArt === 'function') return origSmartArt.apply(this, arguments);
                return;
            }
            openSmartArtDialog(null);
        } catch (err) {
            if (typeof origSmartArt === 'function') return origSmartArt.apply(this, arguments);
            throw err;
        }
    };
    root.insertSmartArt._abeneProof = true;
    root.insertSmartArt._legacy = origSmartArt;

    document.addEventListener('dblclick', function (ev) {
        var eq = ev.target && ev.target.closest && ev.target.closest('#editor [data-equation]');
        if (eq) {
            ev.preventDefault();
            openEquation(eq.getAttribute('data-equation-src') || eq.textContent || '', eq);
            return;
        }
        var smart = ev.target && ev.target.closest && ev.target.closest('#editor [data-smartart]');
        if (smart) {
            ev.preventDefault();
            openSmartArtDialog(smart);
        }
    });
})(window);
