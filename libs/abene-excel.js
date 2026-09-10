/* Genius Raros Excel — classeur, grille, formules, CSV/XLSX/ODS, graphiques, métier, interop Word. */
(function () {
    var E = function () { return window.AbeneExcelEngine; };
    function tt(key, fb) {
        if (typeof window.t === 'function') {
            var v = window.t(key);
            if (v && v !== key) return v;
        }
        return fb || key;
    }
    function toast(msg) { if (typeof showToast === 'function') showToast(msg); }
    function xlAfterDlg(fn) {
        requestAnimationFrame(function () { try { fn(); } catch (e) { console.error(e); } });
    }
    function xlDlg(title, body, okId, onOk, extraFooter) {
        if (typeof openGenericModal !== 'function') return;
        var footer = '<button type="button" class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('cancel', 'Cancelar')) + '</button>' +
            (extraFooter || '') +
            '<button type="button" class="btn-primary" id="' + okId + '">' + esc(tt('ok', 'OK')) + '</button>';
        openGenericModal(title, '<div class="xl-task-form">' + body + '</div>', footer);
        xlAfterDlg(function () {
            var btn = document.getElementById(okId);
            if (btn) btn.onclick = function () { onOk(); };
            var first = document.querySelector('#genericModalBody input, #genericModalBody select, #genericModalBody textarea');
            if (first) {
                try { first.focus(); } catch (e) {}
                first.addEventListener('keydown', function (ev) {
                    if (ev.key === 'Enter' && first.tagName !== 'TEXTAREA') {
                        ev.preventDefault();
                        onOk();
                    }
                });
            }
        });
    }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function locale() { return localStorage.getItem('abeneLanguage') || 'pt-PT'; }
    function locI() {
        var loc = locale();
        return /^fr/i.test(loc) ? 1 : /^en/i.test(loc) ? 2 : /^es/i.test(loc) ? 3 : 0;
    }
    function L4(pt, fr, en, es) {
        return [pt, fr, en, es][locI()] || pt;
    }
    function listSep() { return /^en/i.test(locale()) ? ',' : ';'; }
    function decSep() { return /^en/i.test(locale()) ? '.' : ','; }
    function formulaDisplay(raw) {
        if (!raw) return '';
        if (String(raw).charAt(0) !== '=') return String(raw);
        return (E().localizeFormula ? E().localizeFormula(raw, locale()) : raw);
    }
    function locFn(canon) {
        if (E().fnLocalName) return E().fnLocalName(canon, locale());
        return canon;
    }
    function boolText(v) {
        if (E().boolName) return E().boolName(!!v, locale());
        return v ? 'TRUE' : 'FALSE';
    }
    function fnArgsText(id) {
        var raw = FN_ARGS[id];
        if (raw == null) return '';
        var i = locI();
        var sep = i === 2 ? ',' : ';';
        var s = String(raw).replace(/;/g, sep);
        if (i === 0) return s;
        var g = {
            'se_verdadeiro': ['se_verdadeiro', 'si_vrai', 'value_if_true', 'si_verdadero'],
            'se_falso': ['se_falso', 'si_faux', 'value_if_false', 'si_falso'],
            'valor_se_erro': ['valor_se_erro', 'valeur_si_erreur', 'value_if_error', 'valor_si_error'],
            'valor_se_na': ['valor_se_na', 'valeur_si_na', 'value_if_na', 'valor_si_nd'],
            'intervalo_soma': ['intervalo_soma', 'plage_somme', 'sum_range', 'rango_suma'],
            'intervalo_média': ['intervalo_média', 'plage_moyenne', 'average_range', 'rango_promedio'],
            'núm_dígitos': ['núm_dígitos', 'nb_décimales', 'num_digits', 'núm_decimales'],
            'núm_caract': ['núm_caract', 'nb_caract', 'num_chars', 'núm_caract'],
            'núm_escolhido': ['núm_escolhido', 'nb_choisi', 'number_chosen', 'núm_elegido'],
            'núm_linha': ['núm_linha', 'n°_ligne', 'row_num', 'núm_fila'],
            'núm_coluna': ['núm_coluna', 'n°_colonne', 'column_num', 'núm_columna'],
            'índice_col': ['índice_col', 'no_index', 'col_index', 'índice_col'],
            'índice_lin': ['índice_lin', 'no_ligne', 'row_index', 'índice_fil'],
            'texto_proc': ['texto_proc', 'texte_cherché', 'find_text', 'texto_buscado'],
            'data_início': ['data_início', 'date_début', 'start_date', 'fecha_inicio'],
            'data_fim': ['data_fim', 'date_fin', 'end_date', 'fecha_fin'],
            'vetor_proc': ['vetor_proc', 'vecteur_rech', 'lookup_vector', 'vector_busq'],
            'vetor_resultado': ['vetor_resultado', 'vecteur_résultat', 'result_vector', 'vector_resultado'],
            'predefinição': ['predefinição', 'défaut', 'default', 'predeterminado'],
            'estimativa': ['estimativa', 'estimation', 'guess', 'estimación'],
            'ignorar_vazio': ['ignorar_vazio', 'ignorer_vide', 'ignore_empty', 'ignorar_vacío'],
            'delimitador': ['delimitador', 'délimiteur', 'delimiter', 'delimitador'],
            'aproximado': ['aproximado', 'approximatif', 'range_lookup', 'aproximado'],
            'referência': ['referência', 'référence', 'reference', 'referencia'],
            'numerador': ['numerador', 'numérateur', 'numerator', 'numerador'],
            'denominador': ['denominador', 'dénominateur', 'denominator', 'denominador'],
            'múltiplo': ['múltiplo', 'multiple', 'significance', 'múltiplo'],
            'critério': ['critério', 'critère', 'criteria', 'criterio'],
            'intervalo': ['intervalo', 'plage', 'range', 'rango'],
            'potência': ['potência', 'puissance', 'power', 'potencia'],
            'instância': ['instância', 'instance', 'instance_num', 'instancia'],
            'ângulo': ['ângulo', 'angle', 'angle', 'ángulo'],
            'número': ['número', 'nombre', 'number', 'número'],
            'matriz': ['matriz', 'matrice', 'array', 'matriz'],
            'valores': ['valores', 'valeurs', 'values', 'valores'],
            'periodo': ['período', 'période', 'per', 'período'],
            'período': ['período', 'période', 'per', 'período'],
            'unidade': ['unidade', 'unité', 'unit', 'unidad'],
            'feriados': ['feriados', 'jours_fériés', 'holidays', 'festivos'],
            'residual': ['residual', 'résiduelle', 'salvage', 'residual'],
            'custo': ['custo', 'coût', 'cost', 'costo'],
            'vida': ['vida', 'durée', 'life', 'vida'],
            'ordem': ['ordem', 'ordre', 'order', 'orden'],
            'formato': ['formato', 'format', 'format_text', 'formato'],
            'dentro': ['dentro', 'dans_texte', 'within_text', 'dentro_de'],
            'início': ['início', 'début', 'start_num', 'inicio'],
            'meses': ['meses', 'mois', 'months', 'meses'],
            'antigo': ['antigo', 'ancien', 'old_text', 'antiguo'],
            'vezes': ['vezes', 'fois', 'number_times', 'veces'],
            'texto1': ['texto1', 'texte1', 'text1', 'texto1'],
            'texto2': ['texto2', 'texte2', 'text2', 'texto2'],
            'texto': ['texto', 'texte', 'text', 'texto'],
            'valor1': ['valor1', 'valeur1', 'value1', 'valor1'],
            'valor2': ['valor2', 'valeur2', 'value2', 'valor2'],
            'núm1': ['núm1', 'nombre1', 'number1', 'núm1'],
            'núm2': ['núm2', 'nombre2', 'number2', 'núm2'],
            'lógico1': ['lógico1', 'logique1', 'logical1', 'lógico1'],
            'lógico2': ['lógico2', 'logique2', 'logical2', 'lógico2'],
            'lógico': ['lógico', 'logique', 'logical', 'lógico'],
            'teste1': ['teste1', 'test1', 'logical_test1', 'prueba1'],
            'teste': ['teste', 'test', 'logical_test', 'prueba'],
            'índice': ['índice', 'index', 'index_num', 'índice'],
            'divisor': ['divisor', 'diviseur', 'divisor', 'divisor'],
            'nper': ['nper', 'npm', 'nper', 'nper'],
            'pgto': ['pgto', 'vpm', 'pmt', 'pago'],
            'taxa': ['taxa', 'taux', 'rate', 'tasa'],
            'valor': ['valor', 'valeur', 'value', 'valor'],
            'data': ['data', 'date', 'serial_number', 'fecha'],
            'tipo': ['tipo', 'type', 'type', 'tipo'],
            'base': ['base', 'base', 'base', 'base'],
            'núm': ['núm', 'nombre', 'number', 'núm'],
            'ano': ['ano', 'année', 'year', 'año'],
            'mês': ['mês', 'mois', 'month', 'mes'],
            'dia': ['dia', 'jour', 'day', 'día'],
            'hora': ['hora', 'heure', 'hour', 'hora'],
            'minuto': ['minuto', 'minute', 'minute', 'minuto'],
            'segundo': ['segundo', 'seconde', 'second', 'segundo'],
            'inf': ['inf', 'inf', 'bottom', 'inf'],
            'sup': ['sup', 'sup', 'top', 'sup'],
            'expr': ['expr', 'expr', 'expression', 'expr'],
            'fim': ['fim', 'fin', 'end', 'fin'],
            'vp': ['vp', 'va', 'pv', 'va'],
            'vf': ['vf', 'vc', 'fv', 'vf'],
            'resultado1': ['resultado1', 'résultat1', 'result1', 'resultado1'],
            'novo': ['novo', 'nouveau', 'new_text', 'nuevo']
        };
        Object.keys(g).sort(function (a, b) { return b.length - a.length; }).forEach(function (k) {
            if (s.indexOf(k) >= 0) s = s.split(k).join(g[k][i]);
        });
        return s;
    }
    function sumFn() { return locFn('SUM'); }
    function isNumericCell(ce) {
        if (!ce) return false;
        if (typeof ce.value === 'number' && !isNaN(ce.value)) return true;
        if (ce.raw && String(ce.raw).charAt(0) === '=') return typeof ce.value === 'number';
        return false;
    }
    var FN_LIB = {
        financial: ['PMT', 'PV', 'FV', 'NPER', 'RATE', 'NPV', 'IRR', 'IPMT', 'PPMT', 'SLN'],
        logical: ['IF', 'IFS', 'AND', 'OR', 'XOR', 'NOT', 'IFERROR', 'IFNA', 'TRUE', 'FALSE', 'SWITCH'],
        text: ['LEFT', 'RIGHT', 'MID', 'LEN', 'CONCAT', 'TEXTJOIN', 'TRIM', 'UPPER', 'LOWER', 'PROPER', 'SUBSTITUTE', 'REPLACE', 'FIND', 'SEARCH', 'TEXT', 'VALUE', 'REPT', 'EXACT', 'CLEAN', 'CHAR', 'CODE'],
        datetime: ['TODAY', 'NOW', 'DATE', 'TIME', 'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND', 'WEEKDAY', 'DAYS', 'EDATE', 'EOMONTH', 'NETWORKDAYS', 'WEEKNUM', 'DATEDIF'],
        lookup: ['VLOOKUP', 'HLOOKUP', 'INDEX', 'MATCH', 'CHOOSE', 'LOOKUP', 'COLUMN', 'ROW', 'COLUMNS', 'ROWS'],
        math: ['SUM', 'SUMIF', 'SUMIFS', 'SUMPRODUCT', 'SUMSQ', 'ROUND', 'ROUNDUP', 'ROUNDDOWN', 'ABS', 'INT', 'TRUNC', 'MOD', 'SIGN', 'SQRT', 'POWER', 'PRODUCT', 'PI', 'SIN', 'COS', 'TAN', 'ASIN', 'ACOS', 'ATAN', 'ATAN2', 'RADIANS', 'DEGREES', 'LN', 'LOG', 'LOG10', 'EXP', 'FACT', 'RAND', 'RANDBETWEEN', 'CEILING', 'FLOOR', 'EVEN', 'ODD', 'MROUND', 'QUOTIENT', 'GCD', 'LCM', 'COMBIN'],
        stat: ['AVERAGE', 'AVERAGEIF', 'AVERAGEIFS', 'COUNT', 'COUNTA', 'COUNTBLANK', 'COUNTIF', 'COUNTIFS', 'MIN', 'MAX', 'MEDIAN', 'MODE', 'STDEV', 'STDEVP', 'VAR', 'VARP', 'LARGE', 'SMALL', 'RANK'],
        info: ['ISBLANK', 'ISNUMBER', 'ISTEXT', 'ISERROR', 'ISNA', 'ISLOGICAL', 'ISNONTEXT', 'N', 'T', 'TYPE', 'NA']
    };
    var FN_ARGS = {
        SUM: 'núm1; [núm2]; …', AVERAGE: 'núm1; [núm2]; …', COUNT: 'valor1; [valor2]; …', COUNTA: 'valor1; …',
        COUNTBLANK: 'intervalo', MIN: 'núm1; …', MAX: 'núm1; …', IF: 'teste; se_verdadeiro; [se_falso]',
        AND: 'lógico1; [lógico2]; …', OR: 'lógico1; …', NOT: 'lógico', XOR: 'lógico1; …',
        IFS: 'teste1; valor1; …', SWITCH: 'expr; valor1; resultado1; …; [predefinição]',
        IFERROR: 'valor; valor_se_erro', IFNA: 'valor; valor_se_na',
        SUMIF: 'intervalo; critério; [intervalo_soma]', SUMIFS: 'intervalo_soma; intervalo1; critério1; …',
        COUNTIF: 'intervalo; critério', COUNTIFS: 'intervalo1; critério1; …',
        AVERAGEIF: 'intervalo; critério; [intervalo_média]', AVERAGEIFS: 'intervalo_média; intervalo1; critério1; …',
        ROUND: 'núm; núm_dígitos', ROUNDUP: 'núm; núm_dígitos', ROUNDDOWN: 'núm; núm_dígitos',
        ABS: 'núm', INT: 'núm', TRUNC: 'núm; [núm_dígitos]', MOD: 'núm; divisor', SIGN: 'núm',
        SQRT: 'núm', POWER: 'núm; potência', PRODUCT: 'núm1; …', SUMPRODUCT: 'matriz1; [matriz2]; …', SUMSQ: 'núm1; …',
        LEFT: 'texto; [núm_caract]', RIGHT: 'texto; [núm_caract]', MID: 'texto; início; núm_caract', LEN: 'texto',
        CONCAT: 'texto1; …', TEXTJOIN: 'delimitador; ignorar_vazio; texto1; …', TRIM: 'texto',
        UPPER: 'texto', LOWER: 'texto', PROPER: 'texto', SUBSTITUTE: 'texto; antigo; novo; [instância]',
        REPLACE: 'texto; início; núm_caract; novo', FIND: 'texto_proc; dentro; [início]', SEARCH: 'texto_proc; dentro; [início]',
        TEXT: 'valor; formato', VALUE: 'texto', REPT: 'texto; vezes', EXACT: 'texto1; texto2', CLEAN: 'texto',
        CHAR: 'número', CODE: 'texto', TODAY: '', NOW: '', DATE: 'ano; mês; dia', TIME: 'hora; minuto; segundo',
        YEAR: 'data', MONTH: 'data', DAY: 'data', HOUR: 'serial', MINUTE: 'serial', SECOND: 'serial',
        WEEKDAY: 'data; [tipo]', DAYS: 'data_fim; data_início', EDATE: 'data_início; meses', EOMONTH: 'data_início; meses',
        NETWORKDAYS: 'início; fim; [feriados]', WEEKNUM: 'data; [tipo]', DATEDIF: 'início; fim; unidade',
        VLOOKUP: 'valor; matriz; índice_col; [aproximado]', HLOOKUP: 'valor; matriz; índice_lin; [aproximado]',
        INDEX: 'matriz; núm_linha; [núm_coluna]', MATCH: 'valor; intervalo; [tipo]', CHOOSE: 'índice; valor1; …',
        LOOKUP: 'valor; vetor_proc; [vetor_resultado]', COLUMN: '[referência]', ROW: '[referência]',
        COLUMNS: 'matriz', ROWS: 'matriz', PMT: 'taxa; nper; vp; [vf]; [tipo]', PV: 'taxa; nper; pgto; [vf]; [tipo]',
        FV: 'taxa; nper; pgto; [vp]; [tipo]', NPER: 'taxa; pgto; vp; [vf]; [tipo]', RATE: 'nper; pgto; vp; [vf]; [tipo]',
        NPV: 'taxa; valor1; …', IRR: 'valores; [estimativa]', IPMT: 'taxa; período; nper; vp; [vf]; [tipo]',
        PPMT: 'taxa; período; nper; vp; [vf]; [tipo]', SLN: 'custo; residual; vida',
        PI: '', SIN: 'ângulo', COS: 'ângulo', TAN: 'ângulo', ASIN: 'núm', ACOS: 'núm', ATAN: 'núm', ATAN2: 'x; y',
        RADIANS: 'ângulo', DEGREES: 'ângulo', LN: 'núm', LOG: 'núm; [base]', LOG10: 'núm', EXP: 'núm', FACT: 'núm',
        RAND: '', RANDBETWEEN: 'inf; sup', CEILING: 'núm; múltiplo', FLOOR: 'núm; múltiplo', EVEN: 'núm', ODD: 'núm',
        MROUND: 'núm; múltiplo', QUOTIENT: 'numerador; denominador', GCD: 'núm1; …', LCM: 'núm1; …', COMBIN: 'núm; núm_escolhido',
        MEDIAN: 'núm1; …', MODE: 'núm1; …', STDEV: 'núm1; …', STDEVP: 'núm1; …', VAR: 'núm1; …', VARP: 'núm1; …',
        LARGE: 'matriz; k', SMALL: 'matriz; k', RANK: 'núm; ref; [ordem]',
        ISBLANK: 'valor', ISNUMBER: 'valor', ISTEXT: 'valor', ISERROR: 'valor', ISNA: 'valor',
        ISLOGICAL: 'valor', ISNONTEXT: 'valor', N: 'valor', T: 'valor', TYPE: 'valor', NA: '',
        TRUE: '', FALSE: ''
    };
    var FN_HELP = {
        SUM: ['Soma os números.', 'Additionne les nombres.', 'Adds numbers.', 'Suma números.'],
        AVERAGE: ['Calcula a média.', 'Calcule la moyenne.', 'Returns the average.', 'Calcula el promedio.'],
        COUNT: ['Conta números.', 'Compte les nombres.', 'Counts numbers.', 'Cuenta números.'],
        COUNTA: ['Conta células não vazias.', 'Compte les cellules non vides.', 'Counts non-empty cells.', 'Cuenta celdas no vacías.'],
        MIN: ['Valor mínimo.', 'Valeur minimale.', 'Minimum value.', 'Valor mínimo.'],
        MAX: ['Valor máximo.', 'Valeur maximale.', 'Maximum value.', 'Valor máximo.'],
        IF: ['Devolve um valor conforme um teste lógico.', 'Renvoie une valeur selon un test.', 'Returns a value based on a logical test.', 'Devuelve un valor según una prueba.'],
        AND: ['Verdadeiro se todos os argumentos forem verdadeiros.', 'Vrai si tous les arguments sont vrais.', 'True if all arguments are true.', 'Verdadero si todos los argumentos son verdaderos.'],
        OR: ['Verdadeiro se algum argumento for verdadeiro.', 'Vrai si un argument est vrai.', 'True if any argument is true.', 'Verdadero si algún argumento es verdadero.'],
        PMT: ['Prestação de um empréstimo.', 'Mensualité d’un emprunt.', 'Loan payment.', 'Cuota de un préstamo.'],
        PV: ['Valor atual de um investimento.', 'Valeur actuelle.', 'Present value.', 'Valor actual.'],
        FV: ['Valor futuro de um investimento.', 'Valeur future.', 'Future value.', 'Valor futuro.'],
        RATE: ['Taxa de juro por período.', 'Taux d’intérêt par période.', 'Interest rate per period.', 'Tasa de interés por período.'],
        NPV: ['Valor atual líquido.', 'Valeur actuelle nette.', 'Net present value.', 'Valor actual neto.'],
        IRR: ['Taxa interna de rendibilidade.', 'Taux de rentabilité interne.', 'Internal rate of return.', 'Tasa interna de retorno.'],
        VLOOKUP: ['Procura na primeira coluna e devolve uma coluna.', 'Recherche dans la 1re colonne.', 'Looks up in the first column.', 'Busca en la primera columna.'],
        TODAY: ['Data de hoje.', 'Date du jour.', 'Today’s date.', 'Fecha de hoy.'],
        NOW: ['Data e hora atuais.', 'Date et heure actuelles.', 'Current date and time.', 'Fecha y hora actuales.'],
        CONCAT: ['Junta textos.', 'Concatène du texte.', 'Joins text.', 'Une textos.'],
        PI: ['Constante π.', 'Constante π.', 'The constant π.', 'Constante π.'],
        SIN: ['Seno de um ângulo (radianos).', 'Sinus d’un angle (radians).', 'Sine of an angle (radians).', 'Seno de un ángulo (radianes).']
    };
    function fnHelpText(id) {
        var row = FN_HELP[id];
        var i = locI();
        if (row && (row[i] || row[0])) return row[i] || row[0];
        var name = locFn(id);
        return L4(
            'Insere a função ' + name + '.',
            'Insère la fonction ' + name + '.',
            'Inserts the ' + name + ' function.',
            'Inserta la función ' + name + '.'
        );
    }
    function fnCatLabel(cat) {
        var keys = {
            financial: 'xlFnFin', logical: 'xlFnLog', text: 'xlFnText', datetime: 'xlFnDate',
            lookup: 'xlFnLook', math: 'xlFnMath', stat: 'xlFnStat', info: 'xlFnInfo', recent: 'xlFnRecent'
        };
        var fb = {
            financial: 'Financeiras', logical: 'Lógica', text: 'Texto', datetime: 'Data e Hora',
            lookup: 'Consulta e Referência', math: 'Matemática e Trigonometria',
            stat: 'Estatística', info: 'Informação', recent: 'Recentemente utilizados'
        };
        return tt(keys[cat] || cat, fb[cat] || cat);
    }
    function recentFns() {
        try {
            var arr = JSON.parse(localStorage.getItem('abeneExcelRecentFn') || '[]');
            return Array.isArray(arr) ? arr.filter(function (x) { return typeof x === 'string'; }) : [];
        } catch (e) { return []; }
    }
    function rememberFn(canon) {
        var arr = recentFns().filter(function (x) { return x !== canon; });
        arr.unshift(canon);
        try { localStorage.setItem('abeneExcelRecentFn', JSON.stringify(arr.slice(0, 12))); } catch (e) {}
    }
    function showXlFly(ev, html) {
        var f = document.getElementById('ribbonFlyout');
        if (!f) return;
        f.classList.remove('hf-gallery-fly');
        f.classList.add('xl-fn-fly');
        f.innerHTML = html;
        f.classList.add('visible');
        var el = ev && (ev.currentTarget || ev.target);
        var r = (el && el.getBoundingClientRect) ? el.getBoundingClientRect() : { left: 40, bottom: 80 };
        var left = Math.max(8, r.left);
        if (left + 240 > window.innerWidth) left = Math.max(8, window.innerWidth - 248);
        f.style.left = left + 'px';
        f.style.top = (r.bottom || 80) + 'px';
        if (ev && ev.stopPropagation) ev.stopPropagation();
    }
    function fnListHtml(ids, extraTop) {
        var html = extraTop || '';
        (ids || []).forEach(function (id) {
            html += '<button type="button" onclick="abeneExcelPickFn(\'' + id + '\')">' +
                esc(locFn(id)) + '<span class="xl-fn-en">' + esc(id) + '</span></button>';
        });
        if (!(ids || []).length) html += '<div class="fly-item" style="color:#888;">' + esc(tt('xlFnEmpty', 'Nenhuma função recente.')) + '</div>';
        return html;
    }
    function autoAgg(kind) {
        kind = kind || 'SUM';
        rememberFn(kind);
        var rng = selRange(), r, c, sh = sheet(), formula, name = locFn(kind);
        function runAbove(col, row) {
            var r0 = row;
            while (r0 > 0 && isNumericCell(cell(sh, col, r0 - 1))) r0--;
            return r0;
        }
        function runLeft(col, row) {
            var c0 = col;
            while (c0 > 0 && isNumericCell(cell(sh, c0 - 1, row))) c0--;
            return c0;
        }
        if (rng.r1 === rng.r0 && rng.c1 === rng.c0) {
            r = runAbove(sel.c, sel.r);
            if (r < sel.r) {
                formula = '=' + name + '(' + key(sel.c, r) + ':' + key(sel.c, sel.r - 1) + ')';
                setCell(sel.c, sel.r, formula);
                return;
            }
            c = runLeft(sel.c, sel.r);
            if (c < sel.c) {
                formula = '=' + name + '(' + key(c, sel.r) + ':' + key(sel.c - 1, sel.r) + ')';
                setCell(sel.c, sel.r, formula);
                return;
            }
            startFormula('=' + name + '(');
            return;
        }
        pushUndo();
        for (c = rng.c0; c <= rng.c1; c++) {
            formula = '=' + name + '(' + key(c, rng.r0) + ':' + key(c, rng.r1) + ')';
            setCell(c, rng.r1 + 1, formula, true);
        }
        persist(); render();
    }
    function autoSum() { autoAgg('SUM'); }
    function startFormula(raw) {
        var bar = document.getElementById('excelFormula');
        raw = String(raw || '');
        if (raw.charAt(0) !== '=') raw = '=' + raw;
        if (raw.indexOf('(') >= 0 && raw.charAt(raw.length - 1) !== ')') raw += ')';
        if (!bar) { setCell(sel.c, sel.r, raw); return; }
        _fxBackup = bar.value;
        editing = true;
        bar.value = raw;
        bar.focus();
        try {
            var open = bar.value.indexOf('(');
            var close = bar.value.lastIndexOf(')');
            if (open >= 0 && close > open) bar.setSelectionRange(open + 1, close);
            else bar.setSelectionRange(bar.value.length, bar.value.length);
        } catch (e) {}
    }
    function pickFn(canon, commitAgg) {
        if (typeof hideRibbonFlyout === 'function') hideRibbonFlyout();
        else {
            var fly = document.getElementById('ribbonFlyout');
            if (fly) fly.classList.remove('visible');
        }
        rememberFn(canon);
        var noArg = { PI: 1, TODAY: 1, NOW: 1, RAND: 1, NA: 1, TRUE: 1, FALSE: 1 };
        if (commitAgg && { SUM: 1, AVERAGE: 1, COUNT: 1, COUNTA: 1, MAX: 1, MIN: 1 }[canon]) {
            autoAgg(canon);
            return;
        }
        var name = locFn(canon);
        if (noArg[canon]) {
            startFormula('=' + name + '()');
            return;
        }
        var rng = selRange();
        var arg = '';
        if (rng.r0 !== rng.r1 || rng.c0 !== rng.c1) arg = key(rng.c0, rng.r0) + ':' + key(rng.c1, rng.r1);
        startFormula('=' + name + '(' + arg);
    }
    function openFnCat(ev, cat) {
        var ids = cat === 'recent' ? recentFns() : (FN_LIB[cat] || []);
        var more = '';
        if (cat === 'more') {
            more = '<div class="fly-item xl-fn-head">' + esc(fnCatLabel('stat')) + '</div>' +
                fnListHtml(FN_LIB.stat) +
                '<div class="fly-sep"></div>' +
                '<div class="fly-item xl-fn-head">' + esc(fnCatLabel('info')) + '</div>' +
                fnListHtml(FN_LIB.info);
            showXlFly(ev, more);
            return;
        }
        showXlFly(ev, '<div class="fly-item xl-fn-head">' + esc(fnCatLabel(cat)) + '</div>' + fnListHtml(ids));
    }
    function autoSumMenu(ev) {
        var items = [
            ['SUM', tt('xlSum', 'Soma')],
            ['AVERAGE', tt('xlAvg', 'Média')],
            ['COUNT', tt('xlCount', 'Contagem')],
            ['MAX', tt('xlMax', 'Máximo')],
            ['MIN', tt('xlMin', 'Mínimo')]
        ];
        var html = items.map(function (it) {
            return '<button type="button" onclick="abeneExcelAutoAgg(\'' + it[0] + '\')">' + esc(it[1]) + ' (' + esc(locFn(it[0])) + ')</button>';
        }).join('') + '<div class="fly-sep"></div>' +
            '<button type="button" onclick="abeneExcelInsertFnDlg()">' + esc(tt('xlInsertFn', 'Inserir Função…')) + '</button>';
        showXlFly(ev, html);
    }
    var _fnDlgPick = 'SUM';
    function renderFnDlgList(filter, cat) {
        var q = String(filter || '').toLowerCase();
        var ids = [];
        if (cat && cat !== 'all' && FN_LIB[cat]) ids = FN_LIB[cat].slice();
        else {
            Object.keys(FN_LIB).forEach(function (k) {
                FN_LIB[k].forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });
            });
        }
        ids = ids.filter(function (id) {
            if (!q) return true;
            var loc = locFn(id).toLowerCase();
            var help = fnHelpText(id).toLowerCase();
            return loc.indexOf(q) >= 0 || id.toLowerCase().indexOf(q) >= 0 || help.indexOf(q) >= 0;
        }).sort(function (a, b) { return locFn(a).localeCompare(locFn(b), locale()); });
        if (ids.indexOf(_fnDlgPick) < 0) _fnDlgPick = ids[0] || 'SUM';
        return ids.map(function (id) {
            return '<button type="button" class="' + (id === _fnDlgPick ? 'on' : '') + '" data-fn="' + id + '">' +
                esc(locFn(id)) + ' <span class="xl-fn-en">' + esc(id) + '</span></button>';
        }).join('') || ('<div class="fly-item" style="color:#888;padding:8px;">' + esc(tt('xlFnEmpty', 'Nenhuma função.')) + '</div>');
    }
    function updateFnDlgMeta() {
        var syn = document.getElementById('xlFnSyntax');
        var des = document.getElementById('xlFnDesc');
        var args = fnArgsText(_fnDlgPick);
        var name = locFn(_fnDlgPick);
        if (syn) syn.textContent = args != null && args !== '' ? (name + '(' + args + ')') : (name + '()');
        if (des) des.textContent = fnHelpText(_fnDlgPick) || tt('xlFnHint', 'Insere a função na barra de fórmulas, no idioma atual.');
    }
    function openInsertFnDlg(presetCat) {
        _fnDlgPick = recentFns()[0] || 'SUM';
        var cats = [['all', tt('xlAll', 'Tudo')], ['recent', tt('xlFnRecent', 'Recentes')],
            ['financial', fnCatLabel('financial')], ['logical', fnCatLabel('logical')],
            ['text', fnCatLabel('text')], ['datetime', fnCatLabel('datetime')],
            ['lookup', fnCatLabel('lookup')], ['math', fnCatLabel('math')],
            ['stat', fnCatLabel('stat')], ['info', fnCatLabel('info')]];
        var body = '<div class="xl-fn-dlg">' +
            '<div class="form-group"><label>' + esc(tt('xlFnSearch', 'Procurar uma função')) + '</label>' +
            '<input type="text" id="xlFnSearch" autocomplete="off"></div>' +
            '<div class="form-group"><label>' + esc(tt('xlFnCategory', 'Categoria')) + '</label>' +
            '<select id="xlFnCat">' + cats.map(function (c) {
                return '<option value="' + c[0] + '"' + (c[0] === (presetCat || 'all') ? ' selected' : '') + '>' + esc(c[1]) + '</option>';
            }).join('') + '</select></div>' +
            '<div id="xlFnList" class="xl-fn-list">' + renderFnDlgList('', presetCat === 'recent' ? '' : (presetCat || 'all')) + '</div>' +
            '<div class="xl-fn-syntax" id="xlFnSyntax"></div>' +
            '<div class="xl-fn-desc" id="xlFnDesc"></div></div>';
        xlDlg(tt('xlInsertFn', 'Inserir Função'), body, 'xlFnOk', function () {
            if (typeof closeModal === 'function') closeModal('genericModal');
            pickFn(_fnDlgPick, false);
        });
        xlAfterDlg(function () {
            function refresh() {
                var q = (document.getElementById('xlFnSearch') || {}).value || '';
                var cat = (document.getElementById('xlFnCat') || {}).value || 'all';
                var box = document.getElementById('xlFnList');
                var idsCat = cat === 'recent' ? 'recent' : cat;
                if (cat === 'recent') {
                    var rec = recentFns().filter(function (id) {
                        var loc = locFn(id).toLowerCase();
                        return !q || loc.indexOf(q.toLowerCase()) >= 0 || id.toLowerCase().indexOf(q.toLowerCase()) >= 0;
                    });
                    if (rec.indexOf(_fnDlgPick) < 0) _fnDlgPick = rec[0] || 'SUM';
                    box.innerHTML = fnListHtml(rec).replace(/abeneExcelPickFn/g, 'void') || renderFnDlgList(q, 'all');
                    if (!rec.length) box.innerHTML = renderFnDlgList(q, 'all');
                    else {
                        box.innerHTML = rec.map(function (id) {
                            return '<button type="button" class="' + (id === _fnDlgPick ? 'on' : '') + '" data-fn="' + id + '">' +
                                esc(locFn(id)) + ' <span class="xl-fn-en">' + esc(id) + '</span></button>';
                        }).join('');
                    }
                } else if (box) box.innerHTML = renderFnDlgList(q, idsCat);
                bindList();
                updateFnDlgMeta();
            }
            function bindList() {
                var box = document.getElementById('xlFnList');
                if (!box) return;
                box.querySelectorAll('button[data-fn]').forEach(function (btn) {
                    btn.onclick = function () {
                        _fnDlgPick = btn.getAttribute('data-fn');
                        box.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b === btn); });
                        updateFnDlgMeta();
                    };
                    btn.ondblclick = function () {
                        _fnDlgPick = btn.getAttribute('data-fn');
                        if (typeof closeModal === 'function') closeModal('genericModal');
                        pickFn(_fnDlgPick, false);
                    };
                });
            }
            var search = document.getElementById('xlFnSearch');
            var selc = document.getElementById('xlFnCat');
            if (search) search.addEventListener('input', refresh);
            if (selc) selc.addEventListener('change', refresh);
            bindList();
            updateFnDlgMeta();
            if (search) search.focus();
        });
    }

    var ROW_H = 22, COL_W = 84, CORNER_W = 42, BUF = 8;
    var ROWS = 200, COLS = 26;
    var MAX_ROWS = 10000, MAX_COLS = 256;
    var wb = null;
    var sel = { r: 0, c: 0, r2: 0, c2: 0 };
    var editing = false;
    var undoStack = [];
    var redoStack = [];
    var clip = null;
    var clipKind = 'all';
    var clipPack = null;
    var pasteAnchor = null;
    var STYLE_VIS = ['bold', 'italic', 'under', 'wrap', 'fill', 'color', 'align', 'valign', 'size', 'font', 'border'];
    var filterHidden = {};
    var painter = null;
    var fillDrag = null;
    var zoom = 1;
    var virt = { r0: 0, r1: 40, c0: 0, c1: 16 };

    function defaultSheetName(n) {
        return tt('xlSheetPrefix', 'Folha') + String(n == null ? 1 : n);
    }
    function defaultBookName() {
        return tt('xlBookDefault', 'Livro1');
    }
    function blankSheet(name) {
        return {
            name: name || defaultSheetName(1), cells: {}, rows: ROWS, cols: COLS, colW: {}, rowH: {},
            hiddenR: {}, hiddenC: {}, merges: [], freezeR: 0, freezeC: 0,
            charts: [], comments: {}, protect: false, filters: null, table: null,
            cf: [], validation: {}, print: { orient: 'landscape', fit: true, title: '' }
        };
    }
    function newWorkbook() {
        return { sheets: [blankSheet(defaultSheetName(1))], active: 0, name: defaultBookName(), names: {}, versions: [] };
    }
    function sheet() { return wb.sheets[wb.active]; }
    function key(c, r) { return E().a1(c, r); }
    function cell(sh, c, r) {
        sh = sh || sheet();
        return sh.cells[key(c, r)] || null;
    }
    function ensure(sh, c, r) {
        var k = key(c, r);
        if (!sh.cells[k]) sh.cells[k] = { raw: '', value: '', fmt: 'g' };
        return sh.cells[k];
    }
    function snapshot() {
        try { return JSON.parse(JSON.stringify(wb)); } catch (e) { return null; }
    }
    function pushUndo() {
        undoStack.push(snapshot());
        if (undoStack.length > 40) undoStack.shift();
        redoStack = [];
    }
    function persist() {
        try {
            localStorage.setItem('abeneExcelWorkbook', JSON.stringify(wb));
        } catch (e) {
            try {
                var slim = JSON.parse(JSON.stringify(wb));
                slim.versions = [];
                localStorage.setItem('abeneExcelWorkbook', JSON.stringify(slim));
            } catch (e2) {}
        }
        if (typeof window.abeneSheetsOnExcelChange === 'function') window.abeneSheetsOnExcelChange();
    }
    function locked(c, r) {
        var sh = sheet();
        if (!sh.protect) return false;
        var ce = cell(sh, c, r);
        return !ce || ce.locked !== false;
    }

    function parseRaw(raw) {
        var s = String(raw == null ? '' : raw).trim();
        if (s === '') return { type: 'e', value: '' };
        if (/^TRUE|VERDADEIRO|VRAI|VERDADERO$/i.test(s)) return { type: 'b', value: true };
        if (/^FALSE|FALSO|FAUX$/i.test(s)) return { type: 'b', value: false };
        if (/^-?\d+([.,]\d+)?%?$/.test(s.replace(/\s/g, ''))) {
            return { type: 'n', value: E().num(s) };
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(s) || /^\d{1,2}[./]\d{1,2}[./]\d{2,4}$/.test(s)) {
            var d = new Date(s.indexOf('-') >= 0 ? s : s.split(/[./]/).reverse().join('-'));
            if (!isNaN(d.getTime())) return { type: 'd', value: d };
        }
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
            var p = s.split(':');
            var dt = new Date();
            dt.setHours(+p[0], +p[1], +(p[2] || 0), 0);
            return { type: 'd', value: dt };
        }
        return { type: 's', value: s };
    }
    function findSheet(name) {
        var n = String(name || '').replace(/^'|'$/g, '');
        var i;
        for (i = 0; i < wb.sheets.length; i++) {
            if (wb.sheets[i].name.toLowerCase() === n.toLowerCase()) return wb.sheets[i];
        }
        return null;
    }
    function parseRef(ref, baseSheet) {
        var s = String(ref || '').replace(/\$/g, '');
        var sh = baseSheet || sheet();
        var bang = s.lastIndexOf('!');
        if (bang >= 0) {
            sh = findSheet(s.slice(0, bang).replace(/^'|'$/g, ''));
            s = s.slice(bang + 1);
            if (!sh) throw E().err('#REF!');
        }
        var named = wb.names && wb.names[s.toUpperCase()];
        if (named) s = named;
        var a = E().parseA1(s);
        if (!a || a.c < 0 || a.r < 0) throw E().err('#REF!');
        return { sh: sh, c: a.c, r: a.r };
    }
    function cellValue(sh, c, r, visiting) {
        var ce = cell(sh, c, r);
        if (!ce) return '';
        if (ce.raw && String(ce.raw).charAt(0) === '=') {
            if (ce._calc === visiting) return ce.value;
            return evalCell(sh, c, r, visiting);
        }
        return ce.value;
    }
    function evalCell(sh, c, r, visiting) {
        var ce = cell(sh, c, r);
        if (!ce || !ce.raw || String(ce.raw).charAt(0) !== '=') return ce ? ce.value : '';
        var id = sh.name + '!' + key(c, r);
        visiting = visiting || {};
        if (visiting[id]) { ce.value = '#CIRC!'; ce.error = '#CIRC!'; return ce.error; }
        visiting[id] = true;
        try {
            if (E().dangerous(ce.raw)) throw E().err('#N/A');
            var ctx = {
                listSep: ',',
                origin: { c: c, r: r },
                refs: [],
                ref: function (rf) {
                    var p = parseRef(rf, sh);
                    ctx.refs.push(p.sh.name + '!' + key(p.c, p.r));
                    return cellValue(p.sh, p.c, p.r, visiting);
                },
                range: function (a, b) {
                    var pa = parseRef(a, sh), pb = parseRef(b, sh);
                    if (pa.sh !== pb.sh) throw E().err('#VALUE!');
                    var c0 = Math.min(pa.c, pb.c), c1 = Math.max(pa.c, pb.c);
                    var r0 = Math.min(pa.r, pb.r), r1 = Math.max(pa.r, pb.r);
                    var out = [], cc, rr, row;
                    for (rr = r0; rr <= r1; rr++) {
                        row = [];
                        for (cc = c0; cc <= c1; cc++) {
                            ctx.refs.push(pa.sh.name + '!' + key(cc, rr));
                            row.push(cellValue(pa.sh, cc, rr, visiting));
                        }
                        out.push(row);
                    }
                    return out;
                },
                fullRange: function (a, b) {
                    function colPart(s) {
                        var str = String(s || '');
                        var bang = str.lastIndexOf('!');
                        var sheetName = bang >= 0 ? str.slice(0, bang) : '';
                        var col = (bang >= 0 ? str.slice(bang + 1) : str).replace(/\$/g, '').replace(/\d+$/, '');
                        return { sheetName: sheetName, col: col };
                    }
                    var aa = colPart(a), bb = colPart(b);
                    var ssh = aa.sheetName ? findSheet(aa.sheetName.replace(/^'|'$/g, '')) : sh;
                    if (!ssh) throw E().err('#REF!');
                    var c0 = E().colIndex(aa.col), c1 = E().colIndex(bb.col);
                    if (c0 < 0) c0 = 0;
                    if (c1 < 0) c1 = ssh.cols - 1;
                    var pref = aa.sheetName ? aa.sheetName + '!' : '';
                    return ctx.range(pref + E().a1(c0, 0), pref + E().a1(c1, ssh.rows - 1));
                }
            };
            var v = E().evaluate(E().toInvariantFormula ? E().toInvariantFormula(ce.raw) : ce.raw, ctx);
            ce.value = v;
            ce.error = '';
            ce.deps = ctx.refs;
        } catch (ex) {
            ce.error = (ex && ex.excel) || '#VALUE!';
            ce.value = ce.error;
        }
        visiting[id] = false;
        return ce.value;
    }
    function recalc() {
        var i, k, ce, sh;
        for (i = 0; i < wb.sheets.length; i++) {
            sh = wb.sheets[i];
            for (k in sh.cells) {
                if (!Object.prototype.hasOwnProperty.call(sh.cells, k)) continue;
                ce = sh.cells[k];
                if (ce.raw && String(ce.raw).charAt(0) === '=') evalCell(sh, E().parseA1(k).c, E().parseA1(k).r, {});
                else {
                    var p = parseRaw(ce.raw);
                    ce.value = p.value;
                    ce.error = '';
                }
            }
        }
        applyCf();
    }
    function setCell(c, r, raw, noUndo) {
        if (locked(c, r)) { toast(tt('xlLocked', 'Célula bloqueada.')); return; }
        var sh = sheet();
        var val = sheet().validation && sheet().validation[key(c, r)];
        if (val && raw && String(raw).charAt(0) !== '=') {
            if (val.type === 'list') {
                var ok = (val.list || []).some(function (x) { return String(x) === String(raw); });
                if (!ok) { toast(val.msg || tt('xlInvalid', 'Valor inválido.')); return; }
            }
            if (val.type === 'number') {
                try {
                    var n = E().num(raw);
                    if ((val.min != null && n < val.min) || (val.max != null && n > val.max)) {
                        toast(val.msg || tt('xlInvalid', 'Valor inválido.')); return;
                    }
                } catch (e) { toast(val.msg || tt('xlInvalid', 'Valor inválido.')); return; }
            }
        }
        if (!noUndo) pushUndo();
        if (c >= sh.cols) sh.cols = c + 1;
        if (r >= sh.rows) sh.rows = r + 1;
        var ce = ensure(sh, c, r);
        var stored = raw == null ? '' : String(raw);
        if (stored.charAt(0) === '=' && E().toInvariantFormula) stored = E().toInvariantFormula(stored);
        ce.raw = stored;
        if (!ce.raw) delete sh.cells[key(c, r)];
        recalc(); persist(); render();
    }

    function display(ce) {
        if (!ce) return '';
        if (ce.error) return ce.error;
        var v = ce.value;
        if (v instanceof Date) {
            if (ce.fmt === 'time') return v.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
            return v.toLocaleDateString(locale());
        }
        if (typeof v === 'boolean') return boolText(v);
        if (typeof v === 'number') {
            if (ce.fmt === 'pct') return (v * 100).toFixed(2).replace('.', decSep()) + '%';
            if (ce.fmt === 'eur' || ce.fmt === 'cur' || ce.fmt === 'acc') {
                try { return new Intl.NumberFormat(locale(), { style: 'currency', currency: 'EUR' }).format(v); }
                catch (e) { return v.toFixed(2).replace('.', decSep()) + ' €'; }
            }
            if (ce.fmt === 'n' || ce.fmt === 'dec') return Number(v).toFixed(2).replace('.', decSep());
            if (ce.fmt === 'int') return String(Math.round(v));
            if (ce.fmt === 'date') {
                var d = new Date(Math.round((v - 25569) * 86400000));
                if (!isNaN(d.getTime())) return d.toLocaleDateString(locale());
            }
            var s = String(v);
            if (s.indexOf('.') >= 0) s = s.replace('.', decSep());
            return s;
        }
        return v == null ? '' : String(v);
    }
    function applyCf() {
        var sh = sheet();
        if (!sh.cf || !sh.cf.length) return;
        sh.cf.forEach(function (rule) {
            var r, c, ce, ok = false, v;
            for (r = rule.r0; r <= rule.r1; r++) {
                for (c = rule.c0; c <= rule.c1; c++) {
                    ce = cell(sh, c, r);
                    v = ce ? ce.value : '';
                    if (rule.kind === 'gt') ok = typeof v === 'number' && v > rule.n;
                    else if (rule.kind === 'lt') ok = typeof v === 'number' && v < rule.n;
                    else if (rule.kind === 'eq') ok = String(v) === String(rule.n);
                    else if (rule.kind === 'formula') {
                        try {
                            var cfSrc = String(rule.n).charAt(0) === '=' ? rule.n : '=' + rule.n;
                            if (E().toInvariantFormula) cfSrc = E().toInvariantFormula(cfSrc);
                            ok = !!E().evaluate(cfSrc, {
                                listSep: ',', origin: { c: c, r: r },
                                ref: function (rf) { var p = parseRef(rf, sh); return cellValue(p.sh, p.c, p.r, {}); },
                                range: function (a, b) {
                                    var pa = parseRef(a, sh), pb = parseRef(b, sh), out = [], rr, cc, row;
                                    for (rr = Math.min(pa.r, pb.r); rr <= Math.max(pa.r, pb.r); rr++) {
                                        row = [];
                                        for (cc = Math.min(pa.c, pb.c); cc <= Math.max(pa.c, pb.c); cc++) row.push(cellValue(pa.sh, cc, rr, {}));
                                        out.push(row);
                                    }
                                    return out;
                                }
                            });
                        } catch (e) { ok = false; }
                    }
                    if (ok) {
                        ce = ensure(sh, c, r);
                        ce.cfFill = rule.fill || '#fff2cc';
                    } else if (ce) delete ce.cfFill;
                }
            }
        });
    }

    function fmtNum(kind) {
        pushUndo();
        eachSel(function (c, r) { ensure(sheet(), c, r).fmt = kind; });
        persist(); render();
    }
    function styleSel(mut) {
        pushUndo();
        eachSel(function (c, r) { mut(ensure(sheet(), c, r)); });
        persist(); render();
    }
    function eachSel(fn) {
        var rng = selRange(), r, c;
        for (r = rng.r0; r <= rng.r1; r++) for (c = rng.c0; c <= rng.c1; c++) fn(c, r);
    }
    function selRange() {
        return {
            r0: Math.min(sel.r, sel.r2), r1: Math.max(sel.r, sel.r2),
            c0: Math.min(sel.c, sel.c2), c1: Math.max(sel.c, sel.c2)
        };
    }
    function colW(sh, c) { return (sh.colW && sh.colW[c]) || COL_W; }
    function rowH(sh, r) { return (sh.rowH && sh.rowH[r]) || ROW_H; }
    function mergeAt(sh, c, r) {
        var m, i;
        for (i = 0; i < (sh.merges || []).length; i++) {
            m = sh.merges[i];
            if (c >= m.c0 && c <= m.c1 && r >= m.r0 && r <= m.r1) return m;
        }
        return null;
    }
    function isHiddenR(sh, r) { return !!(sh.hiddenR && sh.hiddenR[r]) || !!filterHidden[r]; }

    function renderSheetTabs() {
        var bar = document.getElementById('excelSheetTabs');
        if (!bar) return;
        bar.innerHTML = wb.sheets.map(function (s, i) {
            return '<button type="button" class="excel-sht' + (i === wb.active ? ' on' : '') + '" data-i="' + i + '">' + esc(s.name) + '</button>';
        }).join('') + '<button type="button" class="excel-sht add" id="excelAddSheet">+</button>';
        bar.querySelectorAll('button[data-i]').forEach(function (b) {
            b.onclick = function () { wb.active = Number(b.getAttribute('data-i')); sel = { r: 0, c: 0, r2: 0, c2: 0 }; persist(); render(); };
            b.ondblclick = function () {
                renameSheet(Number(b.getAttribute('data-i')));
            };
            b.oncontextmenu = function (ev) {
                ev.preventDefault();
                showSheetMenu(Number(b.getAttribute('data-i')));
            };
            (function (btn, idx) {
                var tmr;
                btn.addEventListener('touchstart', function (ev) {
                    var t = ev.touches && ev.touches[0];
                    if (!t) return;
                    tmr = setTimeout(function () { showSheetMenu(idx); }, 520);
                }, { passive: true });
                btn.addEventListener('touchend', function () { clearTimeout(tmr); });
                btn.addEventListener('touchmove', function () { clearTimeout(tmr); });
            })(b, Number(b.getAttribute('data-i')));
        });
        var add = document.getElementById('excelAddSheet');
        if (add) add.onclick = function () {
            pushUndo();
            wb.sheets.push(blankSheet(defaultSheetName(wb.sheets.length + 1)));
            wb.active = wb.sheets.length - 1;
            persist(); render();
        };
        var on = bar.querySelector('.excel-sht.on');
        if (on && typeof on.scrollIntoView === 'function') {
            try { on.scrollIntoView({ inline: 'nearest', block: 'nearest' }); } catch (e) {}
        }
    }
    function renameSheet(i) {
        var html = '<div class="form-group"><label>' + esc(tt('xlRename', 'Nome da folha')) + '</label>' +
            '<input id="xlSname" type="text" value="' + esc(wb.sheets[i].name) + '"></div>';
        xlDlg(tt('xlRename', 'Nome da folha'), html, 'xlSnOk', function () {
            var n = ((document.getElementById('xlSname') || {}).value || '').trim();
            if (!n) return;
            pushUndo();
            wb.sheets[i].name = n;
            closeModal('genericModal'); persist(); render();
        });
    }
    function showSheetMenu(i) {
        var html = '<div class="xl-task-list">' +
            '<button type="button" class="btn-secondary" id="xlRen">' + esc(tt('xlRename', 'Nome da folha')) + '</button>' +
            '<button type="button" class="btn-secondary" id="xlDup">' + esc(tt('xlDup', 'Duplicar')) + '</button>' +
            '<button type="button" class="btn-secondary" id="xlDel">' + esc(tt('xlDel', 'Eliminar')) + '</button>' +
            '<button type="button" class="btn-secondary" id="xlLeft">' + esc(tt('xlLeft', 'Mover para a esquerda')) + '</button>' +
            '<button type="button" class="btn-secondary" id="xlRight">' + esc(tt('xlRight', 'Mover para a direita')) + '</button>' +
            '<button type="button" class="btn-secondary" id="xlProt">' + esc(tt('xlProtect', 'Proteger / desproteger')) + '</button></div>';
        if (typeof openGenericModal !== 'function') return;
        openGenericModal(tt('xlSheet', 'Folha') + ' — ' + esc(wb.sheets[i].name), html,
            '<button type="button" class="btn-primary" onclick="closeModal(\'genericModal\')">' + esc(tt('close', 'Fechar')) + '</button>');
        xlAfterDlg(function () {
            var g = function (id) { return document.getElementById(id); };
            if (g('xlRen')) g('xlRen').onclick = function () {
                closeModal('genericModal');
                setTimeout(function () { renameSheet(i); }, 40);
            };
            if (g('xlDup')) g('xlDup').onclick = function () {
                pushUndo();
                var copy = JSON.parse(JSON.stringify(wb.sheets[i]));
                copy.name = copy.name + ' (2)';
                wb.sheets.splice(i + 1, 0, copy);
                wb.active = i + 1;
                closeModal('genericModal'); persist(); render();
            };
            if (g('xlDel')) g('xlDel').onclick = function () {
                if (wb.sheets.length < 2) return;
                pushUndo();
                wb.sheets.splice(i, 1);
                if (wb.active >= wb.sheets.length) wb.active = wb.sheets.length - 1;
                closeModal('genericModal'); persist(); render();
            };
            if (g('xlLeft')) g('xlLeft').onclick = function () {
                if (i <= 0) return;
                pushUndo();
                var t = wb.sheets[i - 1]; wb.sheets[i - 1] = wb.sheets[i]; wb.sheets[i] = t;
                wb.active = i - 1;
                closeModal('genericModal'); persist(); render();
            };
            if (g('xlRight')) g('xlRight').onclick = function () {
                if (i >= wb.sheets.length - 1) return;
                pushUndo();
                var t = wb.sheets[i + 1]; wb.sheets[i + 1] = wb.sheets[i]; wb.sheets[i] = t;
                wb.active = i + 1;
                closeModal('genericModal'); persist(); render();
            };
            if (g('xlProt')) g('xlProt').onclick = function () {
                pushUndo();
                wb.sheets[i].protect = !wb.sheets[i].protect;
                closeModal('genericModal'); persist(); render();
                toast(wb.sheets[i].protect ? tt('xlProtOn', 'Folha protegida.') : tt('xlProtOff', 'Folha desprotegida.'));
            };
        });
    }

    function updateVirt() {
        var host = document.getElementById('excelGrid');
        var sh = sheet();
        if (!host) return;
        var st = host.scrollTop, sl = host.scrollLeft;
        var vh = host.clientHeight || 400, vw = host.clientWidth || 800;
        var r = 0, y = 0, c = 0, x = 0;
        virt.r0 = 0; virt.c0 = 0;
        for (r = 0; r < sh.rows; r++) {
            if (isHiddenR(sh, r)) continue;
            if (y + rowH(sh, r) >= st) { virt.r0 = r; break; }
            y += rowH(sh, r);
        }
        virt.r1 = virt.r0;
        y = 0;
        for (r = virt.r0; r < sh.rows && y < vh + ROW_H * BUF; r++) {
            if (isHiddenR(sh, r)) continue;
            y += rowH(sh, r);
            virt.r1 = r;
        }
        virt.r0 = Math.max(0, virt.r0 - 2);
        virt.r1 = Math.min(sh.rows - 1, virt.r1 + BUF);
        for (c = 0; c < sh.cols; c++) {
            if (sh.hiddenC && sh.hiddenC[c]) continue;
            if (x + colW(sh, c) >= sl) { virt.c0 = c; break; }
            x += colW(sh, c);
        }
        virt.c1 = virt.c0; x = 0;
        for (c = virt.c0; c < sh.cols && x < vw + COL_W * 4; c++) {
            if (sh.hiddenC && sh.hiddenC[c]) continue;
            x += colW(sh, c);
            virt.c1 = c;
        }
        virt.c1 = Math.min(sh.cols - 1, virt.c1 + 2);
    }
    function totalH(sh) {
        var h = 0, r;
        for (r = 0; r < sh.rows; r++) if (!isHiddenR(sh, r)) h += rowH(sh, r);
        return h + ROW_H;
    }
    function totalW(sh) {
        var w = 0, c;
        for (c = 0; c < sh.cols; c++) if (!(sh.hiddenC && sh.hiddenC[c])) w += colW(sh, c);
        return w + CORNER_W;
    }
    function offsetY(sh, r) {
        var y = 0, i;
        for (i = 0; i < r; i++) if (!isHiddenR(sh, i)) y += rowH(sh, i);
        return y;
    }
    function offsetX(sh, c) {
        var x = 0, i;
        for (i = 0; i < c; i++) if (!(sh.hiddenC && sh.hiddenC[i])) x += colW(sh, i);
        return x;
    }

    function renderGrid() {
        var host = document.getElementById('excelGrid');
        if (!host) return;
        var sh = sheet();
        var keepSt = host.scrollTop, keepSl = host.scrollLeft;
        updateVirt();
        var rng = selRange();
        var html = '<div class="excel-scroll" style="width:' + totalW(sh) + 'px;height:' + totalH(sh) + 'px;position:relative;transform:scale(' + zoom + ');transform-origin:0 0;">';
        html += '<div class="excel-corner" style="left:' + keepSl + 'px;top:' + keepSt + 'px;width:' + CORNER_W + 'px;height:' + ROW_H + 'px;"></div>';
        var c, r, k, ce, cls, txt, m, left, top, w, h, style, note;
        for (c = virt.c0; c <= virt.c1; c++) {
            if (sh.hiddenC && sh.hiddenC[c]) continue;
            left = CORNER_W + offsetX(sh, c);
            html += '<div class="xl-colh' + (c >= rng.c0 && c <= rng.c1 ? ' on' : '') + '" data-c="' + c + '" style="left:' + left + 'px;top:' + keepSt + 'px;width:' + colW(sh, c) + 'px;height:' + ROW_H + 'px;">' +
                E().colName(c) + '<i class="xl-resz-c" data-c="' + c + '"></i></div>';
        }
        for (r = virt.r0; r <= virt.r1; r++) {
            if (isHiddenR(sh, r)) continue;
            top = ROW_H + offsetY(sh, r);
            html += '<div class="xl-rowh' + (r >= rng.r0 && r <= rng.r1 ? ' on' : '') + '" data-r="' + r + '" style="top:' + top + 'px;left:' + keepSl + 'px;width:' + CORNER_W + 'px;height:' + rowH(sh, r) + 'px;">' +
                (r + 1) + '<i class="xl-resz-r" data-r="' + r + '"></i></div>';
            for (c = virt.c0; c <= virt.c1; c++) {
                if (sh.hiddenC && sh.hiddenC[c]) continue;
                m = mergeAt(sh, c, r);
                if (m && (c !== m.c0 || r !== m.r0)) continue;
                k = key(c, r);
                ce = sh.cells[k];
                cls = 'xl-cell';
                if (c >= rng.c0 && c <= rng.c1 && r >= rng.r0 && r <= rng.r1) cls += ' on';
                if (c === sel.c && r === sel.r) cls += ' active';
                if (ce && ce.bold) cls += ' b';
                if (ce && ce.italic) cls += ' i';
                if (ce && ce.under) cls += ' u';
                if (ce && ce.wrap) cls += ' wrap';
                txt = display(ce);
                left = CORNER_W + offsetX(sh, c);
                top = ROW_H + offsetY(sh, r);
                w = colW(sh, c);
                h = rowH(sh, r);
                if (m) {
                    var cc, rr;
                    w = 0; h = 0;
                    for (cc = m.c0; cc <= m.c1; cc++) if (!(sh.hiddenC && sh.hiddenC[cc])) w += colW(sh, cc);
                    for (rr = m.r0; rr <= m.r1; rr++) if (!isHiddenR(sh, rr)) h += rowH(sh, rr);
                }
                style = 'left:' + left + 'px;top:' + top + 'px;width:' + w + 'px;height:' + h + 'px;';
                if (ce && (ce.fill || ce.cfFill)) style += 'background:' + (ce.fill || ce.cfFill) + ';';
                if (ce && ce.color) style += 'color:' + ce.color + ';';
                if (ce && ce.align) style += 'text-align:' + ce.align + ';';
                if (ce && ce.valign) style += 'align-items:' + (ce.valign === 'top' ? 'flex-start' : ce.valign === 'bottom' ? 'flex-end' : 'center') + ';';
                if (ce && ce.size) style += 'font-size:' + ce.size + 'px;';
                if (ce && ce.font) style += 'font-family:' + ce.font + ';';
                if (ce && ce.border) style += 'box-shadow:inset 0 0 0 1px ' + ce.border + ';';
                note = sh.comments && sh.comments[k];
                html += '<div class="' + cls + '" data-c="' + c + '" data-r="' + r + '" style="' + style + '" title="' + esc(note || '') + '">' +
                    esc(txt) + (note ? '<span class="xl-note">▾</span>' : '') +
                    (sh.filters && r === (sh.filters.r || 0) ? '<button type="button" class="xl-fbtn" data-fc="' + c + '">▾</button>' : '') +
                    '</div>';
            }
        }
        html += '<div class="xl-handle" id="xlFillHandle"></div>';
        html += renderChartsHtml(sh);
        html += '</div>';
        host.innerHTML = html;
        host.scrollTop = keepSt; host.scrollLeft = keepSl;
        placeHandle();
        bindGrid(host);
        updateFormulaBar();
        updateStatus();
    }
    function placeHandle() {
        var h = document.getElementById('xlFillHandle');
        var sh = sheet();
        if (!h) return;
        var rng = selRange();
        h.style.left = (CORNER_W + offsetX(sh, rng.c1) + colW(sh, rng.c1) - 4) + 'px';
        h.style.top = (ROW_H + offsetY(sh, rng.r1) + rowH(sh, rng.r1) - 4) + 'px';
    }
    function bindGrid(host) {
        if (!host._xlScroll) {
            host._xlScroll = true;
            var t = null;
            host.addEventListener('scroll', function () {
                clearTimeout(t);
                t = setTimeout(renderGrid, 40);
            });
        }
        host.onmousedown = function (ev) {
            var phone = document.body.classList.contains('abene-phone');
            var rs = ev.target.closest && ev.target.closest('.xl-resz-c, .xl-resz-r');
            if (rs) { if (!phone) startResize(rs, ev); return; }
            if (ev.target.id === 'xlFillHandle' || ev.target.classList.contains('xl-handle')) {
                if (!phone) startFill(ev);
                return;
            }
            var fbtn = ev.target.closest && ev.target.closest('.xl-fbtn');
            if (fbtn) { ev.preventDefault(); openFilterMenu(Number(fbtn.getAttribute('data-fc'))); return; }
            var colh = ev.target.closest && ev.target.closest('.xl-colh');
            if (colh) {
                var c = Number(colh.getAttribute('data-c'));
                sel = { r: 0, c: c, r2: sheet().rows - 1, c2: c };
                renderGrid(); return;
            }
            var rowh = ev.target.closest && ev.target.closest('.xl-rowh');
            if (rowh) {
                var rr = Number(rowh.getAttribute('data-r'));
                sel = { r: rr, c: 0, r2: rr, c2: sheet().cols - 1 };
                renderGrid(); return;
            }
            var td = ev.target.closest && ev.target.closest('.xl-cell');
            if (!td || ev.button !== 0) return;
            var cc = Number(td.getAttribute('data-c')), r = Number(td.getAttribute('data-r'));
            if (painter) {
                var src = painter;
                ensure(sheet(), cc, r);
                ['fmt', 'bold', 'italic', 'under', 'fill', 'color', 'align', 'size', 'border', 'wrap'].forEach(function (p) {
                    sheet().cells[key(cc, r)][p] = src[p];
                });
                if (!painter.multi) painter = null;
                persist(); render(); return;
            }
            if (ev.shiftKey) { sel.r2 = r; sel.c2 = cc; }
            else sel = { r: r, c: cc, r2: r, c2: cc };
            function move(e) {
                var t2 = document.elementFromPoint(e.clientX, e.clientY);
                t2 = t2 && t2.closest && t2.closest('.xl-cell');
                if (!t2) return;
                sel.r2 = Number(t2.getAttribute('data-r'));
                sel.c2 = Number(t2.getAttribute('data-c'));
                renderGrid();
            }
            function up() {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
            }
            if (!phone) {
                document.addEventListener('mousemove', move);
                document.addEventListener('mouseup', up);
            }
            renderGrid();
        };
        host.ondblclick = function (ev) {
            var td = ev.target.closest && ev.target.closest('.xl-cell');
            if (!td) return;
            startEdit(Number(td.getAttribute('data-c')), Number(td.getAttribute('data-r')), true);
        };
        host.oncontextmenu = function (ev) {
            var td = ev.target.closest && ev.target.closest('.xl-cell');
            if (!td) return;
            ev.preventDefault();
            sel.c = Number(td.getAttribute('data-c')); sel.r = Number(td.getAttribute('data-r'));
            sel.c2 = sel.c; sel.r2 = sel.r;
            showCellMenu(ev);
        };
    }
    function startResize(el, ev) {
        ev.preventDefault();
        var isC = el.classList.contains('xl-resz-c');
        var idx = Number(el.getAttribute(isC ? 'data-c' : 'data-r'));
        var sh = sheet();
        var start = isC ? ev.clientX : ev.clientY;
        var orig = isC ? colW(sh, idx) : rowH(sh, idx);
        function move(e) {
            var d = (isC ? e.clientX : e.clientY) - start;
            var v = Math.max(isC ? 36 : 16, orig + d);
            if (isC) sh.colW[idx] = v; else sh.rowH[idx] = v;
            renderGrid();
        }
        function up() {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            persist();
        }
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    }
    function startFill(ev) {
        ev.preventDefault();
        fillDrag = selRange();
        function move(e) {
            var t = document.elementFromPoint(e.clientX, e.clientY);
            t = t && t.closest && t.closest('.xl-cell');
            if (!t) return;
            sel.r2 = Number(t.getAttribute('data-r'));
            sel.c2 = Number(t.getAttribute('data-c'));
            renderGrid();
        }
        function up() {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            applyFill(fillDrag, selRange());
            fillDrag = null;
        }
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    }
    function applyFill(from, to) {
        pushUndo();
        var sh = sheet(), r, c, src, dest, dc, dr, raw;
        for (r = to.r0; r <= to.r1; r++) {
            for (c = to.c0; c <= to.c1; c++) {
                if (r >= from.r0 && r <= from.r1 && c >= from.c0 && c <= from.c1) continue;
                dr = r - from.r0; dc = c - from.c0;
                src = cell(sh, from.c0 + (from.c1 > from.c0 ? (c - from.c0) % (from.c1 - from.c0 + 1) : 0),
                    from.r0 + (from.r1 > from.r0 ? (r - from.r0) % (from.r1 - from.r0 + 1) : 0));
                if (!src) continue;
                raw = src.raw || '';
                if (raw.charAt(0) === '=') raw = E().shiftFormula(raw, c - from.c0, r - from.r0);
                else if (/^-?\d+(\.\d+)?$/.test(raw) && from.r1 === from.r0 && r > from.r0) {
                    raw = String(Number(raw) + (r - from.r0));
                }
                dest = ensure(sh, c, r);
                dest.raw = raw;
                dest.fmt = src.fmt; dest.bold = src.bold; dest.fill = src.fill; dest.align = src.align;
            }
        }
        recalc(); persist(); render();
    }
    var xlCtxAt = 0;
    function showCellMenu(ev) {
        var now = Date.now();
        if (now - xlCtxAt < 650) return;
        xlCtxAt = now;
        var old = document.getElementById('xlCtxMenu');
        if (old) old.remove();
        var menu = document.createElement('div');
        menu.id = 'xlCtxMenu';
        menu.className = 'context-menu visible';
        menu.setAttribute('role', 'menu');
        var items = [
            ['abeneExcelCut()', tt('cut', 'Cortar')],
            ['abeneExcelCopy()', tt('copy', 'Copiar')],
            ['abeneExcelPaste("all")', tt('pasteSource', 'Colar origem')],
            ['abeneExcelPaste("val")', tt('xlPasteVal', 'Colar valores')],
            ['abeneExcelPaste("formulas")', tt('xlPasteFml', 'Colar fórmulas')],
            ['abeneExcelPaste("fmt")', tt('xlPasteFmt', 'Colar formatação')],
            ['abeneExcelPaste("link")', tt('pasteLink', 'Colar ligação')],
            ['abeneExcelPaste("trans")', tt('xlPasteTrans', 'Transpor')],
            null,
            ['abeneExcelFmt("bold")', tt('bold', 'Negrito')],
            ['abeneExcelFmt("italic")', tt('italic', 'Itálico')],
            ['abeneExcelFmt("under")', tt('underline', 'Sublinhado')],
            ['abeneExcelFmt("n")', tt('xlDec', '0,00')],
            ['abeneExcelFmt("eur")', tt('xlEur', '€')],
            ['abeneExcelSum()', tt('xlSum', 'Soma')],
            null,
            ['abeneExcelInsRow()', tt('xlInsRow', 'Inserir linha')],
            ['abeneExcelInsCol()', tt('xlInsCol', 'Inserir coluna')],
            ['abeneExcelDelRow()', tt('xlDelRow', 'Eliminar linha')],
            ['abeneExcelDelCol()', tt('xlDelCol', 'Eliminar coluna')],
            ['abeneExcelMerge()', tt('xlMerge', 'Unir células')],
            ['abeneExcelTable()', tt('xlTable', 'Tabela')],
            ['abeneExcelComment()', tt('xlComment', 'Comentário')],
            ['abeneExcelToWord()', tt('xlToWord', 'Excel → Word')]
        ];
        menu.innerHTML = items.map(function (it) {
            if (!it) return '<div class="dropdown-divider"></div>';
            return '<div class="context-menu-item" onclick="' + it[0] + ';var m=document.getElementById(\'xlCtxMenu\');if(m)m.remove();">' + esc(it[1]) + '</div>';
        }).join('');
        document.body.appendChild(menu);
        if (typeof window.abenePlaceSheetMenu === 'function' && window.abenePlaceSheetMenu(menu, ev)) {
            /* bottom sheet on phone */
        } else {
            var x = ev && ev.clientX != null ? ev.clientX : 40;
            var y = ev && ev.clientY != null ? ev.clientY : 40;
            menu.style.top = '0px';
            menu.style.left = '0px';
            menu.style.bottom = '';
            menu.style.right = '';
            var mw = menu.offsetWidth, mh = menu.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
            if (x + mw > vw - 8) x = vw - mw - 8;
            if (y + mh > vh - 8) y = Math.max(8, vh - mh - 8);
            menu.style.top = y + 'px';
            menu.style.left = Math.max(8, x) + 'px';
        }
        setTimeout(function () {
            function hide(e) {
                if (!e.target.closest || !e.target.closest('#xlCtxMenu')) {
                    var m = document.getElementById('xlCtxMenu');
                    if (m) m.remove();
                    document.removeEventListener('mousedown', hide);
                    document.removeEventListener('touchstart', hide);
                }
            }
            document.addEventListener('mousedown', hide);
            document.addEventListener('touchstart', hide, { passive: true });
        }, 0);
    }
    window.abeneExcelOpenCellMenu = function (c, r, ev) {
        sel = { r: r, c: c, r2: r, c2: c };
        renderGrid();
        showCellMenu(ev || { clientX: 40, clientY: 40 });
    };

    var _fxBackup = '';
    function updateFormulaBar(force) {
        var name = document.getElementById('excelNameBox');
        var bar = document.getElementById('excelFormula');
        var ce = cell(sheet(), sel.c, sel.r);
        if (name && (force || document.activeElement !== name)) name.value = key(sel.c, sel.r);
        if (bar) {
            if (force && document.activeElement === bar && bar.value && String(bar.value).charAt(0) === '=' && E().toInvariantFormula) {
                bar.value = formulaDisplay(E().toInvariantFormula(bar.value));
            } else if (force || document.activeElement !== bar) {
                bar.value = ce ? formulaDisplay(ce.raw) : '';
            }
        }
        var sz = document.getElementById('xlFontSize');
        if (sz && document.activeElement !== sz) {
            var n = String((ce && ce.size) || 11);
            if (!sz.querySelector('option[value="' + n + '"]')) {
                var opt = document.createElement('option');
                opt.value = n; opt.textContent = n;
                sz.appendChild(opt);
            }
            sz.value = n;
        }
    }
    function updateStatus() {
        var el = document.getElementById('excelStatusAgg');
        if (!el) return;
        var nums = [];
        eachSel(function (c, r) {
            var ce = cell(sheet(), c, r);
            if (!ce) return;
            var v = ce.value;
            if (typeof v === 'number' && !isNaN(v)) nums.push(v);
        });
        var rng = selRange();
        var extra = key(rng.c0, rng.r0) + (rng.c0 !== rng.c1 || rng.r0 !== rng.r1 ? ':' + key(rng.c1, rng.r1) : '');
        if (!nums.length) { el.textContent = extra; return; }
        var sum = nums.reduce(function (a, b) { return a + b; }, 0);
        el.textContent = extra + '  ' + tt('xlAvg', 'Média') + ' ' + (sum / nums.length).toFixed(2).replace('.', decSep()) +
            '  ' + tt('xlCount', 'Contagem') + ' ' + nums.length +
            '  ' + tt('xlSum', 'Soma') + ' ' + sum.toFixed(2).replace('.', decSep());
    }
    function startEdit(c, r, inCell) {
        editing = true;
        sel = { r: r, c: c, r2: r, c2: c };
        if (!inCell) {
            var bar = document.getElementById('excelFormula');
            if (bar) { bar.focus(); bar.select(); }
            return;
        }
        var host = document.getElementById('excelGrid');
        var sh = sheet();
        var inp = document.createElement('input');
        inp.className = 'xl-inedit';
        inp.value = formulaDisplay((cell(sh, c, r) && cell(sh, c, r).raw) || '');
        inp.style.left = (CORNER_W + offsetX(sh, c)) + 'px';
        inp.style.top = (ROW_H + offsetY(sh, r)) + 'px';
        inp.style.width = colW(sh, c) + 'px';
        inp.style.height = rowH(sh, r) + 'px';
        var sc = host.querySelector('.excel-scroll');
        (sc || host).appendChild(inp);
        inp.focus(); inp.select();
        function done(ok) {
            if (!inp.parentNode) return;
            var v = inp.value;
            inp.remove();
            editing = false;
            if (ok) setCell(c, r, v);
            else renderGrid();
        }
        inp.onkeydown = function (ev) {
            if (ev.key === 'Enter') { ev.preventDefault(); done(true); sel.r = Math.min(sh.rows - 1, r + 1); sel.r2 = sel.r; }
            if (ev.key === 'Escape') { ev.preventDefault(); done(false); }
            if (ev.key === 'Tab') { ev.preventDefault(); done(true); sel.c = Math.min(sh.cols - 1, c + 1); sel.c2 = sel.c; }
        };
        inp.onblur = function () { done(true); };
    }
    function commitFormulaBar() {
        var bar = document.getElementById('excelFormula');
        if (!bar) return;
        setCell(sel.c, sel.r, bar.value);
        editing = false;
        try { bar.blur(); } catch (e) {}
    }
    function cancelFormulaBar() {
        var bar = document.getElementById('excelFormula');
        editing = false;
        if (bar) {
            bar.value = _fxBackup;
            try { bar.blur(); } catch (e) {}
        }
        updateFormulaBar();
    }
    function render() {
        renderSheetTabs();
        renderGrid();
        var title = document.getElementById('excelBookName');
        if (title) title.textContent = (wb.name || defaultBookName()) + (sheet().protect ? ' 🔒' : '');
        var z = document.getElementById('excelZoomLbl');
        if (z) z.textContent = Math.round(zoom * 100) + '%';
    }

    function onKey(ev) {
        if (!document.body.classList.contains('abene-excel-mode')) return;
        if (ev.target && (ev.target.id === 'excelFormula' || ev.target.id === 'excelNameBox' || ev.target.classList.contains('xl-inedit') || ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA' || ev.target.isContentEditable)) {
            if (ev.key === 'Enter' && ev.target.id === 'excelFormula') { ev.preventDefault(); return; }
            if (ev.target.id === 'excelNameBox' && ev.key === 'Enter') { ev.preventDefault(); jumpName(ev.target.value); }
            return;
        }
        var r = sel.r, c = sel.c, sh = sheet();
        if (ev.ctrlKey && ev.key.toLowerCase() === 'z') { ev.preventDefault(); excelUndo(); return; }
        if (ev.ctrlKey && ev.key.toLowerCase() === 'y') { ev.preventDefault(); excelRedo(); return; }
        if (ev.ctrlKey && ev.key.toLowerCase() === 'c') { ev.preventDefault(); copySel(); return; }
        if (ev.ctrlKey && ev.key.toLowerCase() === 'x') { ev.preventDefault(); cutSel(); return; }
        if (ev.ctrlKey && ev.key.toLowerCase() === 'v') { ev.preventDefault(); pasteSel(); return; }
        if (ev.ctrlKey && ev.key.toLowerCase() === 'b') { ev.preventDefault(); applyFmtMenu('bold'); return; }
        if (ev.ctrlKey && ev.key.toLowerCase() === 'i') { ev.preventDefault(); applyFmtMenu('italic'); return; }
        if (ev.ctrlKey && ev.key.toLowerCase() === 'u') { ev.preventDefault(); applyFmtMenu('under'); return; }
        if (ev.ctrlKey && ev.key.toLowerCase() === 'f') { ev.preventDefault(); openFind(false); return; }
        if (ev.ctrlKey && ev.key.toLowerCase() === 'h') { ev.preventDefault(); openFind(true); return; }
        if (ev.ctrlKey && ev.key.toLowerCase() === 'd') { ev.preventDefault(); fillDir(0, 1); return; }
        if (ev.ctrlKey && ev.key.toLowerCase() === 'r') { ev.preventDefault(); fillDir(1, 0); return; }
        if (ev.ctrlKey && ev.key === 'Home') { ev.preventDefault(); sel = { r: 0, c: 0, r2: 0, c2: 0 }; renderGrid(); return; }
        if (ev.ctrlKey && ev.key === 'End') {
            ev.preventDefault();
            sel = { r: sh.rows - 1, c: sh.cols - 1, r2: sh.rows - 1, c2: sh.cols - 1 };
            renderGrid(); return;
        }
        if (ev.key === 'Delete' || (ev.key === 'Backspace' && !editing)) {
            ev.preventDefault();
            pushUndo();
            eachSel(function (cc, rr) { if (!locked(cc, rr)) delete sheet().cells[key(cc, rr)]; });
            recalc(); persist(); render();
            return;
        }
        if (ev.key === 'F2') { ev.preventDefault(); startEdit(c, r, true); return; }
        if (ev.key === 'F3' && ev.shiftKey) { ev.preventDefault(); openInsertFnDlg(); return; }
        if (ev.key === 'Enter') { ev.preventDefault(); sel.r = Math.min(sh.rows - 1, r + 1); sel.r2 = sel.r; sel.c2 = sel.c; renderGrid(); return; }
        if (ev.key === 'Tab') { ev.preventDefault(); sel.c = Math.min(sh.cols - 1, c + (ev.shiftKey ? -1 : 1)); if (sel.c < 0) sel.c = 0; sel.c2 = sel.c; sel.r2 = sel.r; renderGrid(); return; }
        if (ev.key === 'ArrowUp') { ev.preventDefault(); sel.r = Math.max(0, r - 1); if (!ev.shiftKey) { sel.r2 = sel.r; sel.c2 = sel.c; } renderGrid(); return; }
        if (ev.key === 'ArrowDown') { ev.preventDefault(); sel.r = Math.min(sh.rows - 1, r + 1); if (!ev.shiftKey) { sel.r2 = sel.r; sel.c2 = sel.c; } renderGrid(); return; }
        if (ev.key === 'ArrowLeft') { ev.preventDefault(); sel.c = Math.max(0, c - 1); if (!ev.shiftKey) { sel.c2 = sel.c; sel.r2 = sel.r; } renderGrid(); return; }
        if (ev.key === 'ArrowRight') { ev.preventDefault(); sel.c = Math.min(sh.cols - 1, c + 1); if (!ev.shiftKey) { sel.c2 = sel.c; sel.r2 = sel.r; } renderGrid(); return; }
        if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
            startEdit(c, r, true);
            setTimeout(function () {
                var inp = document.querySelector('.xl-inedit');
                if (inp) { inp.value = ev.key; inp.focus(); }
            }, 0);
        }
    }
    function jumpName(v) {
        v = String(v || '').trim();
        if (wb.names[v.toUpperCase()]) v = wb.names[v.toUpperCase()];
        var a = E().parseA1(v);
        if (!a) return;
        sel = { r: a.r, c: a.c, r2: a.r, c2: a.c };
        renderGrid();
    }
    function fillDir(dc, dr) {
        var rng = selRange(), r, c, src, dest, raw;
        pushUndo();
        for (r = rng.r0; r <= rng.r1; r++) {
            for (c = rng.c0; c <= rng.c1; c++) {
                if (dc && c === rng.c0) continue;
                if (dr && r === rng.r0) continue;
                src = cell(sheet(), dc ? rng.c0 : c, dr ? rng.r0 : r);
                if (!src) continue;
                raw = src.raw || '';
                if (raw.charAt(0) === '=') raw = E().shiftFormula(raw, c - rng.c0, r - rng.r0);
                dest = ensure(sheet(), c, r);
                dest.raw = raw; dest.fmt = src.fmt;
            }
        }
        recalc(); persist(); render();
    }
    function excelUndo() {
        if (!undoStack.length) return;
        redoStack.push(snapshot());
        wb = undoStack.pop();
        persist(); render();
    }
    function excelRedo() {
        if (!redoStack.length) return;
        undoStack.push(snapshot());
        wb = redoStack.pop();
        persist(); render();
    }
    function cloneClipCell(ce, note) {
        var o;
        try { o = ce ? JSON.parse(JSON.stringify(ce)) : { raw: '', value: '' }; }
        catch (e) { o = { raw: (ce && ce.raw) || '', value: (ce && ce.value) || '' }; }
        delete o._calc; delete o.deps;
        if (note) o._note = note;
        return o;
    }
    function applyVisual(dest, src) {
        var i, k;
        for (i = 0; i < STYLE_VIS.length; i++) {
            k = STYLE_VIS[i];
            if (src[k] != null && src[k] !== '') dest[k] = src[k];
            else delete dest[k];
        }
        if (src.fmt) dest.fmt = src.fmt;
    }
    function cellValueText(ce) {
        if (!ce) return '';
        if (String(ce.raw || '').charAt(0) === '=') {
            if (ce.error) return String(ce.error);
            if (ce.value instanceof Date) return display(ce);
            return ce.value == null ? '' : String(ce.value);
        }
        return ce.raw == null ? '' : String(ce.raw);
    }
    function sheetRefAbs(name, c, r) {
        var n = String(name || defaultSheetName(1));
        if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(n)) n = "'" + n.replace(/'/g, "''") + "'";
        return n + '!$' + E().colName(c) + '$' + (r + 1);
    }
    function cellsToTsv(rows, asValue) {
        return (rows || []).map(function (row) {
            return row.map(function (ce) {
                var s = asValue ? cellValueText(ce) : ((ce && ce.raw) || '');
                return String(s).replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
            }).join('\t');
        }).join('\n');
    }
    function cellsToHtml(rows, meta) {
        var payload = { cells: rows, meta: meta || {} };
        var html = '<!--abene:' + encodeURIComponent(JSON.stringify(payload)) + '-->';
        html += '<table data-abene-xl="1" style="border-collapse:collapse;font-family:Calibri,sans-serif;font-size:11pt;">';
        (rows || []).forEach(function (row) {
            html += '<tr>';
            row.forEach(function (ce) {
                var st = [];
                if (ce && ce.bold) st.push('font-weight:bold');
                if (ce && ce.italic) st.push('font-style:italic');
                if (ce && ce.under) st.push('text-decoration:underline');
                if (ce && ce.fill) st.push('background:' + ce.fill);
                if (ce && ce.color) st.push('color:' + ce.color);
                if (ce && ce.align) st.push('text-align:' + ce.align);
                if (ce && ce.size) st.push('font-size:' + ce.size + 'px');
                if (ce && ce.font) st.push('font-family:' + ce.font);
                st.push('border:1px solid ' + ((ce && ce.border && ce.border !== true) ? ce.border : '#c8c6c4'));
                st.push('padding:2px 6px');
                html += '<td style="' + st.join(';') + '" data-raw="' + esc(ce && ce.raw != null ? ce.raw : '') + '">' +
                    esc(display(ce) || cellValueText(ce) || '') + '</td>';
            });
            html += '</tr>';
        });
        html += '</table>';
        return html;
    }
    function parseTsvToCells(text) {
        return String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(function (line, i, arr) {
            return line.length || i < arr.length - 1;
        }).map(function (line) {
            return line.split('\t').map(function (v) { return { raw: v, value: v }; });
        }).filter(function (row) { return row.length && (row.length > 1 || (row[0].raw || '') !== ''); });
    }
    function parseHtmlToCells(html) {
        if (!html) return null;
        var m = String(html).match(/<!--abene:([^>]+)-->/);
        if (m) {
            try {
                var pack = JSON.parse(decodeURIComponent(m[1]));
                if (pack && pack.cells) return pack;
            } catch (e) {}
        }
        var doc;
        try { doc = new DOMParser().parseFromString(html, 'text/html'); } catch (e) { return null; }
        var table = doc.querySelector('table');
        if (!table) return null;
        var cells = [];
        table.querySelectorAll('tr').forEach(function (tr) {
            var row = [];
            tr.querySelectorAll('th,td').forEach(function (td) {
                var raw = td.getAttribute('data-raw');
                if (raw == null) raw = (td.innerText || td.textContent || '').replace(/\u00a0/g, ' ').trim();
                var ce = { raw: raw, value: raw };
                var cs = td.style || {};
                if (cs.fontWeight === 'bold' || Number(cs.fontWeight) >= 700 || td.tagName === 'TH') ce.bold = true;
                if (cs.fontStyle === 'italic') ce.italic = true;
                if (String(cs.textDecoration || '').indexOf('underline') >= 0) ce.under = true;
                if (cs.backgroundColor && cs.backgroundColor !== 'transparent') ce.fill = cs.backgroundColor;
                else if (cs.background && cs.background !== 'transparent') ce.fill = cs.background;
                if (cs.color) ce.color = cs.color;
                if (cs.textAlign) ce.align = cs.textAlign;
                if (cs.fontSize) ce.size = parseFloat(cs.fontSize) || ce.size;
                if (cs.fontFamily) ce.font = cs.fontFamily;
                row.push(ce);
            });
            if (row.length) cells.push(row);
        });
        return cells.length ? { cells: cells, meta: { type: 'html-table' } } : null;
    }
    function writeSysClipboard(text, html) {
        try {
            if (navigator.clipboard && window.ClipboardItem) {
                var data = { 'text/plain': new Blob([text || ''], { type: 'text/plain' }) };
                if (html) data['text/html'] = new Blob([html], { type: 'text/html' });
                navigator.clipboard.write([new ClipboardItem(data)]).catch(function () {
                    try { navigator.clipboard.writeText(text || ''); } catch (e2) {}
                });
                return;
            }
        } catch (e) {}
        try { navigator.clipboard.writeText(text || ''); } catch (e2) {}
    }
    function setClipPack(pack) {
        clipPack = pack;
        clip = pack && pack.cells ? pack.cells : null;
        clipKind = 'all';
        try { window.abeneClipPack = pack; } catch (e) {}
        if (pack && pack.cells) writeSysClipboard(pack.text || cellsToTsv(pack.cells, true), pack.html || cellsToHtml(pack.cells, pack.meta));
    }
    function copySel() {
        var rng = selRange(), r, c, row, sh = sheet(), rows = [];
        for (r = rng.r0; r <= rng.r1; r++) {
            row = [];
            for (c = rng.c0; c <= rng.c1; c++) {
                row.push(cloneClipCell(cell(sh, c, r), sh.comments && sh.comments[key(c, r)]));
            }
            rows.push(row);
        }
        var meta = { type: 'excel', sheet: sh.name, c0: rng.c0, r0: rng.r0, c1: rng.c1, r1: rng.r1 };
        setClipPack({ type: 'excel', cells: rows, meta: meta, text: cellsToTsv(rows, true), html: cellsToHtml(rows, meta) });
    }
    function cutSel() {
        copySel();
        pushUndo();
        eachSel(function (c, r) { if (!locked(c, r)) delete sheet().cells[key(c, r)]; });
        recalc(); persist(); render();
    }
    function transposeRows(rows) {
        if (!rows || !rows.length) return rows;
        var max = 0, r, c, out = [];
        for (r = 0; r < rows.length; r++) if (rows[r].length > max) max = rows[r].length;
        for (c = 0; c < max; c++) {
            out[c] = [];
            for (r = 0; r < rows.length; r++) out[c][r] = rows[r][c] || { raw: '' };
        }
        return out;
    }
    function applyPasteRows(kind, rows, meta, fromBar) {
        kind = kind || 'all';
        if (kind === 'source' || kind === 'keep') kind = 'all';
        if (kind === 'values' || kind === 'text') kind = 'val';
        if (kind === 'formats') kind = 'fmt';
        if (!rows || !rows.length) return;
        if (fromBar && pasteAnchor && pasteAnchor.snap) {
            try { wb = JSON.parse(pasteAnchor.snap); } catch (e) {}
            sel.c = pasteAnchor.c; sel.r = pasteAnchor.r; sel.c2 = pasteAnchor.c; sel.r2 = pasteAnchor.r;
        } else {
            pasteAnchor = { c: sel.c, r: sel.r, snap: JSON.stringify(wb) };
            pushUndo();
        }
        var grid = kind === 'trans' ? transposeRows(rows) : rows;
        var pasteKind = kind === 'trans' ? 'all' : kind;
        var r, c, ce, dest, raw, sh = sheet();
        for (r = 0; r < grid.length; r++) {
            for (c = 0; c < grid[r].length; c++) {
                if (locked(sel.c + c, sel.r + r)) continue;
                ce = grid[r][c] || { raw: '' };
                dest = ensure(sh, sel.c + c, sel.r + r);
                if (pasteKind === 'fmt') {
                    applyVisual(dest, ce);
                } else if (pasteKind === 'val') {
                    dest.raw = cellValueText(ce);
                    delete dest.error;
                } else if (pasteKind === 'valfmt') {
                    dest.raw = cellValueText(ce);
                    dest.fmt = ce.fmt || dest.fmt;
                    delete dest.error;
                } else if (pasteKind === 'formulas') {
                    raw = ce.raw || '';
                    if (raw.charAt(0) === '=') raw = E().shiftFormula(raw, c, r);
                    dest.raw = raw;
                    dest.fmt = ce.fmt || dest.fmt;
                } else if (pasteKind === 'link') {
                    if (meta && meta.type === 'excel' && meta.sheet != null && meta.c0 != null) {
                        dest.raw = '=' + sheetRefAbs(meta.sheet, meta.c0 + c, meta.r0 + r);
                    } else dest.raw = cellValueText(ce);
                } else {
                    raw = ce.raw || '';
                    if (raw.charAt(0) === '=') raw = E().shiftFormula(raw, c, r);
                    dest.raw = raw;
                    applyVisual(dest, ce);
                    if (ce._note) {
                        if (!sh.comments) sh.comments = {};
                        sh.comments[key(sel.c + c, sel.r + r)] = ce._note;
                    }
                }
            }
        }
        sel.c2 = sel.c + Math.max(0, (grid[0] && grid[0].length || 1) - 1);
        sel.r2 = sel.r + Math.max(0, grid.length - 1);
        recalc(); persist(); render();
        showPasteBar(kind);
    }
    function hidePasteBar() {
        var bar = document.getElementById('xlPasteBar');
        if (bar) bar.remove();
    }
    function showPasteBar(active) {
        hidePasteBar();
        var host = document.getElementById('excelGrid');
        if (!host) return;
        var bar = document.createElement('div');
        bar.id = 'xlPasteBar';
        bar.className = 'xl-paste-bar';
        var opts = [
            ['all', tt('pasteSource', 'Origem'), '📋'],
            ['val', tt('xlPasteVal', 'Valores'), '123'],
            ['formulas', tt('xlPasteFml', 'Fórmulas'), 'fx'],
            ['fmt', tt('xlPasteFmt', 'Formato'), '🖌'],
            ['link', tt('pasteLink', 'Ligação'), '🔗'],
            ['trans', tt('xlPasteTrans', 'Transpor'), '⇄']
        ];
        bar.innerHTML = opts.map(function (o) {
            return '<button type="button" class="' + (o[0] === active ? 'on' : '') + '" data-k="' + o[0] + '" title="' + esc(o[1]) + '">' + o[2] + '</button>';
        }).join('');
        host.appendChild(bar);
        var h = document.getElementById('xlFillHandle');
        if (h) {
            bar.style.left = Math.min(host.clientWidth - 220, Math.max(8, h.offsetLeft + 12)) + 'px';
            bar.style.top = Math.min(host.clientHeight - 48, Math.max(8, h.offsetTop + 14)) + 'px';
        } else { bar.style.left = '48px'; bar.style.top = '48px'; }
        bar.querySelectorAll('button').forEach(function (btn) {
            btn.onclick = function (ev) {
                ev.preventDefault(); ev.stopPropagation();
                applyPasteRows(btn.getAttribute('data-k'), clip, clipPack && clipPack.meta, true);
            };
        });
        setTimeout(function () {
            function hide(e) {
                if (e.target && e.target.closest && e.target.closest('#xlPasteBar')) return;
                hidePasteBar();
                document.removeEventListener('mousedown', hide);
            }
            document.addEventListener('mousedown', hide);
        }, 0);
    }
    function pasteSel(kind) {
        if (kind && typeof kind === 'object') kind = 'all';
        var fly = document.getElementById('ribbonFlyout');
        if (fly) fly.classList.remove('visible');
        kind = kind || 'all';
        if (clip && clip.length) { applyPasteRows(kind, clip, clipPack && clipPack.meta, false); return; }
        var pack = window.abeneClipPack;
        if (pack && pack.cells && pack.cells.length) { applyPasteRows(kind, pack.cells, pack.meta, false); return; }
        if (!navigator.clipboard) return;
        var done = function (html, text) {
            var parsed = parseHtmlToCells(html) || (text ? { cells: parseTsvToCells(text), meta: { type: 'tsv' } } : null);
            if (!parsed || !parsed.cells || !parsed.cells.length) return;
            clip = parsed.cells;
            clipPack = parsed;
            applyPasteRows(kind, parsed.cells, parsed.meta, false);
        };
        if (navigator.clipboard.read) {
            navigator.clipboard.read().then(function (items) {
                var htmlP = Promise.resolve(''), textP = Promise.resolve('');
                items.forEach(function (it) {
                    if (it.types.indexOf('text/html') >= 0) htmlP = it.getType('text/html').then(function (b) { return b.text(); });
                    if (it.types.indexOf('text/plain') >= 0) textP = it.getType('text/plain').then(function (b) { return b.text(); });
                });
                return Promise.all([htmlP, textP]);
            }).then(function (pair) { done(pair[0], pair[1]); }).catch(function () {
                navigator.clipboard.readText().then(function (t) { done('', t); }).catch(function () {});
            });
        } else if (navigator.clipboard.readText) {
            navigator.clipboard.readText().then(function (t) { done('', t); }).catch(function () {});
        }
    }
    function pasteMenuHtml() {
        return '<button type="button" onclick="abeneExcelPaste(\'all\')">' + esc(tt('pasteSource', 'Manter origem')) + '</button>' +
            '<button type="button" onclick="abeneExcelPaste(\'val\')">' + esc(tt('xlPasteVal', 'Colar valores')) + '</button>' +
            '<button type="button" onclick="abeneExcelPaste(\'formulas\')">' + esc(tt('xlPasteFml', 'Colar fórmulas')) + '</button>' +
            '<button type="button" onclick="abeneExcelPaste(\'fmt\')">' + esc(tt('xlPasteFmt', 'Colar formatação')) + '</button>' +
            '<button type="button" onclick="abeneExcelPaste(\'link\')">' + esc(tt('pasteLink', 'Colar ligação')) + '</button>' +
            '<button type="button" onclick="abeneExcelPaste(\'trans\')">' + esc(tt('xlPasteTrans', 'Transpor')) + '</button>' +
            '<button type="button" onclick="abeneExcelPaste(\'valfmt\')">' + esc(tt('xlPasteValFmt', 'Valores e formatos')) + '</button>';
    }
    window.abeneExcelPasteMenu = function (ev) {
        var f = document.getElementById('ribbonFlyout');
        if (!f) { pasteSel('all'); return; }
        f.classList.remove('hf-gallery-fly');
        f.innerHTML = pasteMenuHtml();
        f.classList.add('visible');
        var r = (ev && (ev.currentTarget || ev.target) && (ev.currentTarget || ev.target).getBoundingClientRect) ?
            (ev.currentTarget || ev.target).getBoundingClientRect() : { left: 40, bottom: 80, right: 120 };
        f.style.left = Math.max(8, r.left) + 'px';
        f.style.top = (r.bottom || 80) + 'px';
        if (ev && ev.stopPropagation) ev.stopPropagation();
    };

    function sortSel(dir, colOff) {
        var rng = selRange();
        if (rng.r1 <= rng.r0) return;
        pushUndo();
        var rows = [], r, c, off = colOff || 0;
        for (r = rng.r0; r <= rng.r1; r++) {
            var row = [];
            for (c = rng.c0; c <= rng.c1; c++) row.push(sheet().cells[key(c, r)] || null);
            rows.push(row);
        }
        rows.sort(function (a, b) {
            var va = a[off] ? a[off].value : '', vb = b[off] ? b[off].value : '';
            if (typeof va === 'number' && typeof vb === 'number') return dir === 'desc' ? vb - va : va - vb;
            va = String(va).toLowerCase(); vb = String(vb).toLowerCase();
            if (va < vb) return dir === 'desc' ? 1 : -1;
            if (va > vb) return dir === 'desc' ? -1 : 1;
            return 0;
        });
        for (r = 0; r < rows.length; r++) {
            for (c = 0; c < rows[r].length; c++) {
                var k = key(rng.c0 + c, rng.r0 + r);
                if (rows[r][c]) sheet().cells[k] = rows[r][c];
                else delete sheet().cells[k];
            }
        }
        persist(); render();
    }
    function filterCol() {
        openFilterMenu(sel.c);
    }
    function openFilterMenu(col) {
        var sh = sheet(), vals = {}, r, ce;
        var header = (sh.filters && sh.filters.r != null) ? sh.filters.r : 0;
        for (r = header + 1; r < sh.rows; r++) {
            ce = cell(sh, col, r);
            vals[String(ce && ce.value != null ? ce.value : '')] = true;
        }
        var keys = Object.keys(vals).sort();
        var html = '<label style="display:flex;align-items:center;gap:8px;min-height:40px;"><input type="checkbox" id="xlFall" checked> ' + esc(tt('xlAll', 'Tudo')) + '</label>' +
            '<div class="xl-filter-list" id="xlFlist">';
        keys.forEach(function (k) {
            html += '<label><input type="checkbox" class="xl-fv" data-v="' + esc(k) + '" checked> ' + esc(k || tt('xlEmpty', '(vazio)')) + '</label>';
        });
        html += '</div><div class="form-group" style="margin-top:10px;"><label>' + esc(tt('xlFind', 'Procurar')) + '</label><input id="xlFtxt" type="text"></div>';
        xlDlg(tt('xlFilter', 'Filtrar') + ' ' + E().colName(col), html, 'xlFok', function () {
            var txt = ((document.getElementById('xlFtxt') || {}).value || '').toLowerCase();
            var allowed = {};
            document.querySelectorAll('.xl-fv:checked').forEach(function (cb) { allowed[cb.getAttribute('data-v')] = true; });
            filterHidden = {};
            for (r = header + 1; r < sh.rows; r++) {
                ce = cell(sh, col, r);
                var sv = String(ce && ce.value != null ? ce.value : '');
                var show = allowed.hasOwnProperty(sv);
                if (txt && sv.toLowerCase().indexOf(txt) < 0) show = false;
                if (!show) filterHidden[r] = true;
            }
            closeModal('genericModal'); render();
        });
        xlAfterDlg(function () {
            var all = document.getElementById('xlFall');
            if (all) all.onchange = function () {
                document.querySelectorAll('.xl-fv').forEach(function (cb) { cb.checked = all.checked; });
            };
        });
    }
    function toggleAutoFilter() {
        var sh = sheet();
        sh.filters = sh.filters ? null : { r: selRange().r0 };
        filterHidden = {};
        persist(); render();
    }

    function insertRows(n) {
        n = n || 1;
        pushUndo();
        var sh = sheet(), at = selRange().r0, map = {}, k, a;
        Object.keys(sh.cells).forEach(function (kk) {
            a = E().parseA1(kk);
            if (a.r >= at) map[key(a.c, a.r + n)] = sh.cells[kk];
            else map[kk] = sh.cells[kk];
        });
        sh.cells = map;
        sh.rows += n;
        persist(); render();
    }
    function insertCols(n) {
        n = n || 1;
        pushUndo();
        var sh = sheet(), at = selRange().c0, map = {}, a;
        Object.keys(sh.cells).forEach(function (kk) {
            a = E().parseA1(kk);
            if (a.c >= at) map[key(a.c + n, a.r)] = sh.cells[kk];
            else map[kk] = sh.cells[kk];
        });
        sh.cells = map;
        sh.cols += n;
        persist(); render();
    }
    function deleteRows() {
        var rng = selRange(), n = rng.r1 - rng.r0 + 1;
        pushUndo();
        var sh = sheet(), map = {}, a;
        Object.keys(sh.cells).forEach(function (kk) {
            a = E().parseA1(kk);
            if (a.r >= rng.r0 && a.r <= rng.r1) return;
            if (a.r > rng.r1) map[key(a.c, a.r - n)] = sh.cells[kk];
            else map[kk] = sh.cells[kk];
        });
        sh.cells = map;
        sh.rows = Math.max(1, sh.rows - n);
        persist(); render();
    }
    function deleteCols() {
        var rng = selRange(), n = rng.c1 - rng.c0 + 1;
        pushUndo();
        var sh = sheet(), map = {}, a;
        Object.keys(sh.cells).forEach(function (kk) {
            a = E().parseA1(kk);
            if (a.c >= rng.c0 && a.c <= rng.c1) return;
            if (a.c > rng.c1) map[key(a.c - n, a.r)] = sh.cells[kk];
            else map[kk] = sh.cells[kk];
        });
        sh.cells = map;
        sh.cols = Math.max(1, sh.cols - n);
        persist(); render();
    }
    function mergeSel() {
        var rng = selRange();
        if (rng.r0 === rng.r1 && rng.c0 === rng.c1) {
            pushUndo();
            sheet().merges = (sheet().merges || []).filter(function (m) {
                return !(sel.c >= m.c0 && sel.c <= m.c1 && sel.r >= m.r0 && sel.r <= m.r1);
            });
            persist(); render(); return;
        }
        pushUndo();
        sheet().merges = sheet().merges || [];
        sheet().merges.push({ r0: rng.r0, r1: rng.r1, c0: rng.c0, c1: rng.c1 });
        persist(); render();
    }
    function hideSel(what) {
        pushUndo();
        var rng = selRange(), sh = sheet(), i;
        if (!sh.hiddenR) sh.hiddenR = {};
        if (!sh.hiddenC) sh.hiddenC = {};
        if (what === 'r') for (i = rng.r0; i <= rng.r1; i++) sh.hiddenR[i] = true;
        else for (i = rng.c0; i <= rng.c1; i++) sh.hiddenC[i] = true;
        persist(); render();
    }
    function unhideAll() {
        pushUndo();
        sheet().hiddenR = {}; sheet().hiddenC = {};
        filterHidden = {};
        persist(); render();
    }
    function freezeHere() {
        pushUndo();
        sheet().freezeR = sel.r; sheet().freezeC = sel.c;
        persist(); render();
        toast(tt('xlFrozen', 'Painéis fixos.'));
    }

    function toCsv() {
        var sh = sheet(), r, c, lines = [], row, ce, v;
        for (r = 0; r < sh.rows; r++) {
            row = [];
            var empty = true;
            for (c = 0; c < sh.cols; c++) {
                ce = cell(sh, c, r);
                v = ce ? (ce.raw || '') : '';
                if (v) empty = false;
                if (/[;"\n]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"';
                row.push(v);
            }
            if (!empty) lines.push(row.join(listSep()));
        }
        return lines.join('\n');
    }
    function fromCsv(text) {
        pushUndo();
        var sep = text.indexOf(';') >= 0 && text.indexOf('\t') < 0 ? ';' : (text.indexOf('\t') >= 0 ? '\t' : ',');
        var lines = String(text).replace(/\r/g, '').split('\n');
        var sh = sheet();
        lines.forEach(function (line, ri) {
            if (!line) return;
            var parts = [];
            if (sep === '\t') parts = line.split('\t');
            else {
                var cur = '', inq = false, i, ch;
                for (i = 0; i < line.length; i++) {
                    ch = line.charAt(i);
                    if (ch === '"') { inq = !inq; continue; }
                    if (ch === sep && !inq) { parts.push(cur); cur = ''; continue; }
                    cur += ch;
                }
                parts.push(cur);
            }
            parts.forEach(function (p, ci) {
                if (!p) return;
                ensure(sh, ci, ri).raw = p;
            });
        });
        recalc(); persist(); render();
    }

    function xmlEsc(s) { return esc(s).replace(/\n/g, '&#10;'); }
    function xmlUnesc(s) {
        return String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#10;/g, '\n').replace(/&#xA;/gi, '\n');
    }
    function parseXml(str) {
        try { return new DOMParser().parseFromString(str || '', 'text/xml'); } catch (e) { return null; }
    }
    function xels(node, name) {
        if (!node) return [];
        return Array.prototype.filter.call(node.getElementsByTagName('*'), function (el) { return el.localName === name; });
    }
    function xel(node, name) { return xels(node, name)[0] || null; }
    function xattr(node, name) {
        if (!node) return '';
        var v = node.getAttribute(name);
        if (v) return v;
        if (node.getAttributeNS) {
            v = node.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', name);
            if (v) return v;
        }
        return '';
    }
    function xlsxRgb(node) {
        if (!node) return '';
        var rgb = node.getAttribute('rgb');
        if (rgb) {
            rgb = rgb.replace(/^#/, '');
            if (rgb.length === 8) rgb = rgb.slice(2);
            if (rgb.length === 6) return '#' + rgb;
        }
        var indexed = node.getAttribute('indexed');
        if (indexed !== null && indexed !== '') {
            var pal = ['#000000','#FFFFFF','#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF','#00FFFF','#000000','#FFFFFF','#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF','#00FFFF','#800000','#008000','#000080','#808000','#800080','#008080','#C0C0C0','#808080','#9999FF','#993366','#FFFFCC','#CCFFFF','#660066','#FF8080','#0066CC','#CCCCFF','#000080','#FF00FF','#FFFF00','#00FFFF','#800080','#800000','#008080','#0000FF','#00CCFF','#CCFFFF','#CCFFCC','#FFFF99','#99CCFF','#FF99CC','#CC99FF','#FFCC99','#3366FF','#33CCCC','#99CC00','#FFCC00','#FF9900','#FF6600','#666699','#969696','#003366','#339966','#003300','#333300','#993300','#993366','#333399','#333333'];
            return pal[Number(indexed)] || '';
        }
        var theme = node.getAttribute('theme');
        if (theme !== null && theme !== '') {
            var themes = ['#FFFFFF','#000000','#E7E6E6','#44546A','#5B9BD5','#ED7D31','#A5A5A5','#FFC000','#4472C4','#70AD47'];
            return themes[Number(theme)] || '';
        }
        return '';
    }
    function parseNumFmtKind(id, code) {
        id = Number(id);
        code = String(code || '');
        if (id === 9 || id === 10 || /%/.test(code)) return 'pct';
        if (id >= 14 && id <= 22) return 'date';
        if (id >= 45 && id <= 47) return 'time';
        if (/€|\$|\[\$/.test(code)) return 'eur';
        if (id === 2 || id === 4 || /0\.00/.test(code)) return 'n';
        if (id === 1 || id === 3) return 'int';
        return 'g';
    }
    function excelColPx(w) {
        var n = Number(w);
        if (!n || n <= 0) return COL_W;
        return Math.max(36, Math.round(n * 7 + 5));
    }
    function excelRowPx(ht) {
        var n = Number(ht);
        if (!n || n <= 0) return ROW_H;
        return Math.max(16, Math.round(n * 96 / 72));
    }
    /* XLSX: valores, fórmulas, folhas, fontes/fundos/alinhamento. Sem gráficos, comentários,
       hiperligações, validações, CF, tabelas dinâmicas, proteção, filtros nem round-trip integral. */
    function exportXlsx() {
        if (!window.JSZip) { toast(tt('aNoZip', 'JSZip indisponível')); return; }
        var zip = new JSZip();
        var fonts = [{ xml: '<font><sz val="11"/><name val="Calibri"/></font>' }];
        var fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'];
        var xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
        var fontMap = { '11||Calibri||': 0 }, fillMap = { '': 0 }, xfMap = { '0|0|g|': 0 };
        function fontId(ce) {
            var k = (ce.size || 11) + '|' + (ce.bold ? 'b' : '') + (ce.italic ? 'i' : '') + (ce.under ? 'u' : '') + '|' + (ce.font || 'Calibri') + '|' + (ce.color || '');
            if (fontMap[k] != null) return fontMap[k];
            var xml = '<font>';
            if (ce.bold) xml += '<b/>';
            if (ce.italic) xml += '<i/>';
            if (ce.under) xml += '<u/>';
            xml += '<sz val="' + (ce.size || 11) + '"/>';
            if (ce.color) xml += '<color rgb="FF' + String(ce.color).replace('#', '') + '"/>';
            xml += '<name val="' + xmlEsc(ce.font || 'Calibri') + '"/></font>';
            fontMap[k] = fonts.length;
            fonts.push({ xml: xml });
            return fontMap[k];
        }
        function fillId(ce) {
            var col = ce.fill || '';
            if (!col) return 0;
            if (fillMap[col] != null) return fillMap[col];
            fillMap[col] = fills.length;
            fills.push('<fill><patternFill patternType="solid"><fgColor rgb="FF' + String(col).replace('#', '') + '"/></patternFill></fill>');
            return fillMap[col];
        }
        function xfId(ce) {
            if (!ce) return 0;
            var fid = fontId(ce), fl = fillId(ce);
            var k = fid + '|' + fl + '|' + (ce.fmt || 'g') + '|' + (ce.align || '') + '|' + (ce.wrap ? '1' : '') + '|' + (ce.valign || '');
            if (xfMap[k] != null) return xfMap[k];
            var num = 0;
            if (ce.fmt === 'n' || ce.fmt === 'dec') num = 2;
            else if (ce.fmt === 'int') num = 1;
            else if (ce.fmt === 'pct') num = 10;
            else if (ce.fmt === 'eur' || ce.fmt === 'cur') num = 4;
            else if (ce.fmt === 'date') num = 14;
            else if (ce.fmt === 'time') num = 45;
            var align = '';
            if (ce.align || ce.wrap || ce.valign) {
                align = '<alignment';
                if (ce.align) align += ' horizontal="' + ce.align + '"';
                if (ce.valign) align += ' vertical="' + (ce.valign === 'middle' ? 'center' : ce.valign) + '"';
                if (ce.wrap) align += ' wrapText="1"';
                align += '/>';
            }
            xfMap[k] = xfs.length;
            xfs.push('<xf numFmtId="' + num + '" fontId="' + fid + '" fillId="' + fl + '" borderId="0" xfId="0"' +
                (fid ? ' applyFont="1"' : '') + (fl ? ' applyFill="1"' : '') + (align ? ' applyAlignment="1"' : '') + '>' + align + '</xf>');
            return xfMap[k];
        }
        zip.file('[Content_Types].xml',
            '<?xml version="1.0" encoding="UTF-8"?>' +
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
            '<Default Extension="xml" ContentType="application/xml"/>' +
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
            '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
            wb.sheets.map(function (s, i) {
                return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
            }).join('') + '</Types>');
        zip.file('_rels/.rels',
            '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
        zip.file('xl/_rels/workbook.xml.rels',
            '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            wb.sheets.map(function (s, i) {
                return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>';
            }).join('') +
            '<Relationship Id="rId' + (wb.sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
            '</Relationships>');
        zip.file('xl/workbook.xml',
            '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
            wb.sheets.map(function (s, i) {
                return '<sheet name="' + xmlEsc(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>';
            }).join('') + '</sheets></workbook>');
        var sheetXml = [];
        wb.sheets.forEach(function (sh, i) {
            var colsXml = '', rowsXml = '', r, c, ce, cells, merges = '', views = '';
            var maxC = 0;
            Object.keys(sh.colW || {}).forEach(function (ci) { maxC = Math.max(maxC, Number(ci)); });
            for (c = 0; c < Math.max(sh.cols, maxC + 1); c++) {
                if (sh.colW && sh.colW[c]) {
                    var w = ((sh.colW[c] - 5) / 7);
                    colsXml += '<col min="' + (c + 1) + '" max="' + (c + 1) + '" width="' + w.toFixed(2) + '" customWidth="1"' +
                        ((sh.hiddenC && sh.hiddenC[c]) ? ' hidden="1"' : '') + '/>';
                } else if (sh.hiddenC && sh.hiddenC[c]) {
                    colsXml += '<col min="' + (c + 1) + '" max="' + (c + 1) + '" hidden="1"/>';
                }
            }
            if (colsXml) colsXml = '<cols>' + colsXml + '</cols>';
            if (sh.freezeR || sh.freezeC) {
                views = '<sheetViews><sheetView workbookViewId="0"><pane xSplit="' + (sh.freezeC || 0) + '" ySplit="' + (sh.freezeR || 0) +
                    '" topLeftCell="' + key(sh.freezeC || 0, sh.freezeR || 0) + '" state="frozen"/></sheetView></sheetViews>';
            }
            for (r = 0; r < sh.rows; r++) {
                cells = '';
                for (c = 0; c < sh.cols; c++) {
                    ce = sh.cells[key(c, r)];
                    if (!ce || ce.raw === '') continue;
                    var ref = key(c, r);
                    var si = xfId(ce);
                    var sAttr = si ? ' s="' + si + '"' : '';
                    var inv = ce.raw.charAt(0) === '=' && E().toInvariantFormula ? E().toInvariantFormula(ce.raw) : ce.raw;
                    if (inv.charAt(0) === '=') {
                        var f = inv.slice(1);
                        var fv = (typeof ce.value === 'number' && !ce.error) ? ce.value : (ce.error || '');
                        cells += '<c r="' + ref + '"' + sAttr + '><f>' + xmlEsc(f) + '</f><v>' + xmlEsc(fv) + '</v></c>';
                    } else if (typeof ce.value === 'number' && !ce.error) {
                        cells += '<c r="' + ref + '"' + sAttr + ' t="n"><v>' + ce.value + '</v></c>';
                    } else {
                        cells += '<c r="' + ref + '"' + sAttr + ' t="inlineStr"><is><t>' + xmlEsc(ce.raw) + '</t></is></c>';
                    }
                }
                if (cells || (sh.rowH && sh.rowH[r]) || (sh.hiddenR && sh.hiddenR[r])) {
                    var ht = sh.rowH && sh.rowH[r] ? ' ht="' + (sh.rowH[r] * 72 / 96).toFixed(1) + '" customHeight="1"' : '';
                    var hid = (sh.hiddenR && sh.hiddenR[r]) ? ' hidden="1"' : '';
                    rowsXml += '<row r="' + (r + 1) + '"' + ht + hid + '>' + cells + '</row>';
                }
            }
            if (sh.merges && sh.merges.length) {
                merges = '<mergeCells count="' + sh.merges.length + '">' + sh.merges.map(function (m) {
                    return '<mergeCell ref="' + key(m.c0, m.r0) + ':' + key(m.c1, m.r1) + '"/>';
                }).join('') + '</mergeCells>';
            }
            sheetXml[i] = '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
                views + colsXml + '<sheetData>' + rowsXml + '</sheetData>' + merges + '</worksheet>';
        });
        zip.file('xl/styles.xml',
            '<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
            '<fonts count="' + fonts.length + '">' + fonts.map(function (f) { return f.xml; }).join('') + '</fonts>' +
            '<fills count="' + fills.length + '">' + fills.join('') + '</fills>' +
            '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
            '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
            '<cellXfs count="' + xfs.length + '">' + xfs.join('') + '</cellXfs></styleSheet>');
        sheetXml.forEach(function (xml, i) {
            zip.file('xl/worksheets/sheet' + (i + 1) + '.xml', xml);
        });
        zip.generateAsync({ type: 'blob' }).then(function (blob) {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = (wb.name || defaultBookName()) + '.xlsx';
            a.click();
            toast(tt('xlExported', 'Livro exportado.'));
        });
    }
    function importXlsx(file) {
        if (!window.JSZip) { toast(tt('aNoZip')); return; }
        JSZip.loadAsync(file).then(function (zip) {
            function read(path) {
                var f = zip.file(path) || zip.file(path.replace(/^\//, ''));
                if (!f) {
                    var alt = Object.keys(zip.files).filter(function (k) { return k.replace(/\\/g, '/').toLowerCase().endsWith(path.toLowerCase()); })[0];
                    f = alt ? zip.file(alt) : null;
                }
                return f ? f.async('string') : Promise.resolve('');
            }
            return Promise.all([
                read('xl/workbook.xml'),
                read('xl/_rels/workbook.xml.rels'),
                read('xl/sharedStrings.xml'),
                read('xl/styles.xml')
            ]).then(function (base) {
                var wbDoc = parseXml(base[0]);
                var relDoc = parseXml(base[1]);
                var ssDoc = parseXml(base[2]);
                var stDoc = parseXml(base[3]);
                var rels = {};
                xels(relDoc, 'Relationship').forEach(function (rel) {
                    rels[xattr(rel, 'Id')] = (xattr(rel, 'Target') || '').replace(/^\//, '');
                });
                var sheetMetas = xels(wbDoc, 'sheet').map(function (shEl) {
                    var rid = xattr(shEl, 'id');
                    var target = rels[rid] || '';
                    if (target && target.indexOf('xl/') !== 0) target = 'xl/' + target.replace(/^\.\//, '');
                    return { name: xmlUnesc(xattr(shEl, 'name') || defaultSheetName(1)), path: target, hidden: /hidden/i.test(xattr(shEl, 'state') || '') };
                });
                var sst = [];
                xels(ssDoc, 'si').forEach(function (si) {
                    var texts = xels(si, 't').map(function (t) { return t.textContent || ''; });
                    sst.push(xmlUnesc(texts.join('')));
                });
                var numFmts = {};
                xels(stDoc, 'numFmt').forEach(function (n) { numFmts[xattr(n, 'numFmtId')] = xattr(n, 'formatCode'); });
                var fonts = xels(stDoc, 'font').map(function (f) {
                    var sz = xel(f, 'sz'), name = xel(f, 'name'), color = xel(f, 'color');
                    return {
                        bold: !!xel(f, 'b'), italic: !!xel(f, 'i'), under: !!xel(f, 'u'),
                        size: sz ? Number(xattr(sz, 'val') || 11) : 11,
                        font: name ? xattr(name, 'val') : '',
                        color: xlsxRgb(color)
                    };
                });
                var fills = xels(stDoc, 'fill').map(function (f) {
                    var pf = xel(f, 'patternFill');
                    var fg = pf ? xel(pf, 'fgColor') : null;
                    var pt = pf ? xattr(pf, 'patternType') : '';
                    return (pt && pt !== 'none' && pt !== 'gray125') ? xlsxRgb(fg) : '';
                });
                var borders = xels(stDoc, 'border').map(function (b) {
                    var left = xel(b, 'left'), color = left ? xel(left, 'color') : xel(b, 'top') && xel(xel(b, 'top'), 'color');
                    var style = left ? xattr(left, 'style') : '';
                    if (!style) {
                        ['right', 'top', 'bottom'].forEach(function (side) {
                            var el = xel(b, side);
                            if (el && xattr(el, 'style')) style = xattr(el, 'style');
                        });
                    }
                    return style && style !== 'none' ? (xlsxRgb(color) || '#616161') : '';
                });
                var xfs = xels(stDoc, 'xf').filter(function (xf) {
                    return xf.parentNode && xf.parentNode.localName === 'cellXfs';
                }).map(function (xf) {
                    var al = xel(xf, 'alignment');
                    var nid = xattr(xf, 'numFmtId') || '0';
                    var font = fonts[Number(xattr(xf, 'fontId') || 0)] || {};
                    var fill = fills[Number(xattr(xf, 'fillId') || 0)] || '';
                    var border = borders[Number(xattr(xf, 'borderId') || 0)] || '';
                    var align = al ? xattr(al, 'horizontal') : '';
                    if (align === 'general') align = '';
                    var valign = al ? xattr(al, 'vertical') : '';
                    if (valign === 'center') valign = 'middle';
                    return {
                        font: font, fill: fill, border: border,
                        align: align, valign: valign,
                        wrap: al ? (xattr(al, 'wrapText') === '1' || xattr(al, 'wrapText') === 'true') : false,
                        fmt: parseNumFmtKind(nid, numFmts[nid] || '')
                    };
                });
                var names = {};
                xels(wbDoc, 'definedName').forEach(function (dn) {
                    names[xattr(dn, 'name')] = (dn.textContent || '').trim();
                });
                var jobs = sheetMetas.map(function (meta) {
                    if (!meta.path) return Promise.resolve({ meta: meta, xml: '', rels: '' });
                    var relPath = meta.path.replace(/worksheets\/[^/]+$/, 'worksheets/_rels/' + meta.path.split('/').pop() + '.rels');
                    return Promise.all([read(meta.path), read(relPath)]).then(function (p) {
                        return { meta: meta, xml: p[0], rels: p[1] };
                    });
                });
                return Promise.all(jobs).then(function (parts) {
                    return { sst: sst, xfs: xfs, names: names, parts: parts, zip: zip };
                });
            });
        }).then(function (pack) {
            pushUndo();
            var next = newWorkbook();
            next.sheets = [];
            next.names = pack.names || {};
            next.name = String(file.name || defaultBookName()).replace(/\.(xlsx|xlsm|xls)$/i, '');
            var formulaCount = 0;
            pack.parts.forEach(function (part) {
                var ns = blankSheet(part.meta.name);
                var doc = parseXml(part.xml);
                var shared = {};
                xels(doc, 'col').forEach(function (col) {
                    var min = Number(xattr(col, 'min') || 1) - 1, max = Number(xattr(col, 'max') || min + 1) - 1, i;
                    for (i = min; i <= max && i < MAX_COLS; i++) {
                        if (xattr(col, 'width')) ns.colW[i] = excelColPx(xattr(col, 'width'));
                        if (xattr(col, 'hidden') === '1' || xattr(col, 'hidden') === 'true') ns.hiddenC[i] = true;
                    }
                    if (max + 1 > ns.cols) ns.cols = Math.min(MAX_COLS, max + 2);
                });
                var pane = xel(doc, 'pane');
                if (pane) {
                    ns.freezeC = Math.round(Number(xattr(pane, 'xSplit') || 0));
                    ns.freezeR = Math.round(Number(xattr(pane, 'ySplit') || 0));
                }
                xels(doc, 'row').forEach(function (rowEl) {
                    var r = Number(xattr(rowEl, 'r') || 0) - 1;
                    if (r < 0) return;
                    if (xattr(rowEl, 'ht')) ns.rowH[r] = excelRowPx(xattr(rowEl, 'ht'));
                    if (xattr(rowEl, 'hidden') === '1' || xattr(rowEl, 'hidden') === 'true') ns.hiddenR[r] = true;
                    if (r + 1 > ns.rows) ns.rows = Math.min(MAX_ROWS, r + 20);
                    Array.prototype.forEach.call(rowEl.childNodes, function (cEl) {
                        if (!cEl.localName || cEl.localName !== 'c') return;
                        var ref = xattr(cEl, 'r') || '';
                        var parsed = E().parseA1(ref);
                        if (!parsed || parsed.c < 0) return;
                        var col = parsed.c, row = parsed.r;
                        var t = xattr(cEl, 't') || '';
                        var sIdx = Number(xattr(cEl, 's') || 0);
                        var xf = pack.xfs[sIdx] || null;
                        var fEl = xel(cEl, 'f');
                        var vEl = xel(cEl, 'v');
                        var isEl = xel(cEl, 'is');
                        var raw = '', val = null;
                        if (fEl) {
                            var fType = xattr(fEl, 't');
                            var si = xattr(fEl, 'si');
                            var fTxt = (fEl.textContent || '').trim();
                            if (fType === 'shared') {
                                if (fTxt) shared[si] = { f: fTxt, c: col, r: row };
                                else if (shared[si]) {
                                    fTxt = E().shiftFormula(shared[si].f, col - shared[si].c, row - shared[si].r);
                                }
                            }
                            if (fTxt) {
                                raw = fTxt.charAt(0) === '=' ? fTxt : '=' + fTxt;
                                if (E().toInvariantFormula) raw = E().toInvariantFormula(raw);
                                if (E().dangerous(raw)) raw = '';
                                if (raw) formulaCount++;
                            }
                        }
                        if (!raw) {
                            if (t === 's' && vEl) raw = pack.sst[Number(vEl.textContent)] || '';
                            else if (t === 'inlineStr' && isEl) raw = xmlUnesc(xels(isEl, 't').map(function (n) { return n.textContent || ''; }).join(''));
                            else if (t === 'b' && vEl) raw = (vEl.textContent === '1' || vEl.textContent === 'true') ? 'TRUE' : 'FALSE';
                            else if (t === 'e' && vEl) { raw = vEl.textContent || ''; val = raw; }
                            else if (t === 'str' && vEl) raw = xmlUnesc(vEl.textContent || '');
                            else if (vEl) {
                                raw = xmlUnesc(vEl.textContent || '');
                                if (raw !== '' && !isNaN(Number(raw))) val = Number(raw);
                            }
                        }
                        if (!raw && !xf) return;
                        var ce = ensure(ns, col, row);
                        ce.raw = raw;
                        if (val != null && raw.charAt(0) !== '=') ce.value = val;
                        if (xf) {
                            if (xf.font.bold) ce.bold = true;
                            if (xf.font.italic) ce.italic = true;
                            if (xf.font.under) ce.under = true;
                            if (xf.font.color) ce.color = xf.font.color;
                            if (xf.font.size && xf.font.size !== 11) ce.size = xf.font.size;
                            if (xf.font.font) ce.font = xf.font.font;
                            if (xf.fill) ce.fill = xf.fill;
                            if (xf.border) ce.border = xf.border;
                            if (xf.align) ce.align = xf.align;
                            if (xf.valign) ce.valign = xf.valign;
                            if (xf.wrap) ce.wrap = true;
                            if (xf.fmt && xf.fmt !== 'g') ce.fmt = xf.fmt;
                        }
                        if (row + 1 > ns.rows) ns.rows = Math.min(MAX_ROWS, row + 20);
                        if (col + 1 > ns.cols) ns.cols = Math.min(MAX_COLS, col + 2);
                    });
                });
                xels(doc, 'mergeCell').forEach(function (m) {
                    var ref = xattr(m, 'ref') || '';
                    var bits = ref.split(':');
                    if (bits.length < 2) return;
                    var a = E().parseA1(bits[0]), b = E().parseA1(bits[1]);
                    if (a && b) ns.merges.push({ c0: Math.min(a.c, b.c), r0: Math.min(a.r, b.r), c1: Math.max(a.c, b.c), r1: Math.max(a.r, b.r) });
                });
                var rels = {};
                xels(parseXml(part.rels), 'Relationship').forEach(function (rel) {
                    rels[xattr(rel, 'Id')] = { type: xattr(rel, 'Type') || '', target: xattr(rel, 'Target') || '' };
                });
                xels(doc, 'hyperlink').forEach(function (h) {
                    var ref = xattr(h, 'ref') || '';
                    var rid = xattr(h, 'id');
                    var loc = xattr(h, 'location');
                    var parsed = E().parseA1(ref.split(':')[0]);
                    var url = loc || '';
                    if (rid && rels[rid]) url = rels[rid].target || url;
                    if (parsed && url) {
                        var ce = ensure(ns, parsed.c, parsed.r);
                        ce.link = url;
                        if (!ns.comments[key(parsed.c, parsed.r)]) ns.comments[key(parsed.c, parsed.r)] = url;
                    }
                });
                Object.keys(rels).forEach(function (rid) {
                    var rel = rels[rid];
                    if (/comments/i.test(rel.type) || /comments\d+\.xml$/i.test(rel.target)) {
                        var cpath = rel.target.replace(/^\.\.\//, 'xl/').replace(/^\//, '');
                        if (cpath.indexOf('xl/') !== 0 && part.meta.path) {
                            var base = part.meta.path.replace(/\/[^/]+$/, '/');
                            cpath = (base + rel.target.replace(/^\.\//, '')).replace(/worksheets\/\.\.\//, '');
                        }
                        var f = pack.zip.file(cpath) || pack.zip.file(cpath.replace(/^xl\/worksheets\//, 'xl/'));
                        if (f) f.async('string').then(function (cxml) {
                            xels(parseXml(cxml), 'comment').forEach(function (cm) {
                                var parsed = E().parseA1(xattr(cm, 'ref') || '');
                                if (!parsed) return;
                                ns.comments[key(parsed.c, parsed.r)] = xmlUnesc(xels(cm, 't').map(function (n) { return n.textContent || ''; }).join('\n'));
                            });
                            persist(); render();
                        }).catch(function () {});
                    }
                });
                xels(doc, 'autoFilter').forEach(function (af) {
                    var ref = xattr(af, 'ref') || '';
                    if (ref) ns.filters = { ref: ref };
                });
                next.sheets.push(ns);
            });
            if (!next.sheets.length) next.sheets.push(blankSheet(defaultSheetName(1)));
            wb = next;
            wb.active = 0;
            recalc(); persist();
            if (typeof window.switchTab === 'function') window.switchTab('excel');
            else enter();
            render();
            toast(tt('xlImportOk', 'Livro Excel aberto com os dados, a formatação e as fórmulas originais.') +
                ' (' + wb.sheets.length + ' ' + tt('xlSheets', 'folhas') + (formulaCount ? ', ' + formulaCount + ' ' + tt('xlFormulas', 'fórmulas') : '') + ')');
            setTimeout(function () { showExcelImportAnalysis(file.name); }, 350);
        }).catch(function (err) {
            console.error('XLSX import:', err);
            toast(tt('xlImportFail', 'Não foi possível importar o ficheiro.'));
        });
    }
    function showExcelImportAnalysis(fileName) {
        var sh = sheet(); if (!sh) return;
        var nums = 0, k, ce;
        for (k in sh.cells) {
            ce = sh.cells[k];
            if (ce && (typeof ce.value === 'number' || (ce.raw && ce.raw.charAt(0) === '='))) nums++;
        }
        var baseName = String(fileName || wb.name || '').replace(/\.[^.]+$/, '');
        var nextNum = (window.abeneComercial && window.abeneComercial.nextNumber)
            ? window.abeneComercial.nextNumber('XL', 'abeneExcelCounter', false)
            : 'XL-' + new Date().getFullYear() + '-0001';
        var body = '<p style="color:#555;margin-bottom:12px;">' + esc(tt('xlImpHint', 'O livro foi importado com a formatação e as fórmulas originais. As fórmulas seguem o idioma da interface.')) + '</p>';
        body += '<div class="form-group"><label>' + esc(tt('impFileNumber', 'Número de registo')) + '</label>';
        body += '<input id="xlImpReg" type="text" value="' + esc(baseName) + '"></div>';
        body += '<button type="button" class="btn-secondary" style="margin-bottom:8px;" onclick="document.getElementById(\'xlImpReg\').value=\'' + nextNum.replace(/'/g, "\\'") + '\'">' + esc(nextNum) + ' ← ' + esc(tt('impUseAuto', 'Utilizar este número')) + '</button>';
        if (nums > 2) {
            body += '<label style="display:flex;align-items:center;gap:8px;margin:10px 0;cursor:pointer;"><input type="checkbox" id="xlImpQuote"> ' +
                esc(tt('impMakeQuote', 'Criar orçamento a partir dos dados (pode editar depois)')) + '</label>';
        }
        body += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" id="xlImpArchive" checked> ' +
            esc(tt('impArchive', 'Guardar uma cópia no Arquivo')) + '</label>';
        var footer = '<button class="btn-secondary" onclick="closeModal(\'genericModal\')">' + esc(tt('impSkip', 'Ignorar')) + '</button>' +
            '<button class="btn-primary" onclick="abeneExcelCommitImport()">' + esc(tt('impConfirm', 'Confirmar')) + '</button>';
        if (typeof openGenericModal === 'function') openGenericModal(tt('impTitle', 'Ficheiro importado'), body, footer);
    }
    window.abeneExcelCommitImport = function () {
        var inp = document.getElementById('xlImpReg');
        var name = inp ? inp.value.trim() : '';
        if (name) { wb.name = name; persist(); render(); }
        if (document.getElementById('xlImpQuote') && document.getElementById('xlImpQuote').checked) {
            try { excelToQuote(); } catch (e) {}
        }
        if (document.getElementById('xlImpArchive') && document.getElementById('xlImpArchive').checked && typeof window.abeneArquivoArchive === 'function') {
            window.abeneArquivoArchive({ silent: true });
        }
        if (typeof closeModal === 'function') closeModal('genericModal');
        toast(tt('impDone', 'Ficheiro registado.'));
    };
    /* ODS: até 500 linhas × 40 colunas; texto/fórmulas simples, sem estilos completos. */
    function exportOds() {
        if (!window.JSZip) { toast(tt('aNoZip')); return; }
        var zip = new JSZip();
        zip.file('mimetype', 'application/vnd.oasis.opendocument.spreadsheet', { compression: 'STORE' });
        zip.file('META-INF/manifest.xml',
            '<?xml version="1.0"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">' +
            '<manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/>' +
            '<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/></manifest:manifest>');
        var body = wb.sheets.map(function (sh) {
            var rows = '', r, c, ce;
            for (r = 0; r < Math.min(sh.rows, 500); r++) {
                rows += '<table:table-row>';
                for (c = 0; c < Math.min(sh.cols, 40); c++) {
                    ce = cell(sh, c, r);
                    rows += '<table:table-cell' + (ce && ce.raw && ce.raw.charAt(0) === '=' ? ' table:formula="of:=' + xmlEsc(ce.raw.slice(1)) + '"' : '') +
                        ' office:value-type="string"><text:p>' + xmlEsc(ce ? display(ce) : '') + '</text:p></table:table-cell>';
                }
                rows += '</table:table-row>';
            }
            return '<table:table table:name="' + xmlEsc(sh.name) + '">' + rows + '</table:table>';
        }).join('');
        zip.file('content.xml',
            '<?xml version="1.0"?><office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:body><office:spreadsheet>' + body + '</office:spreadsheet></office:body></office:document-content>');
        zip.generateAsync({ type: 'blob' }).then(function (blob) {
            var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (wb.name || defaultBookName()) + '.ods'; a.click();
        });
    }
    function importOds(file) {
        if (!window.JSZip) return;
        JSZip.loadAsync(file).then(function (zip) {
            return zip.file('content.xml').async('string');
        }).then(function (xml) {
            pushUndo();
            wb.sheets = [];
            var tRe = /<table:table[^>]*table:name="([^"]+)"[^>]*>([\s\S]*?)<\/table:table>/g, tm;
            while ((tm = tRe.exec(xml))) {
                var ns = blankSheet(tm[1]), rowI = 0;
                var rows = tm[2].split(/<table:table-row[\s>]/);
                rows.forEach(function (rowXml) {
                    var colI = 0, cRe = /<text:p>([\s\S]*?)<\/text:p>/g, cm;
                    while ((cm = cRe.exec(rowXml))) {
                        if (cm[1]) ensure(ns, colI, Math.max(0, rowI - 1)).raw = cm[1];
                        colI++;
                    }
                    rowI++;
                });
                wb.sheets.push(ns);
            }
            if (!wb.sheets.length) wb.sheets.push(blankSheet(defaultSheetName(1)));
            wb.active = 0; recalc(); persist(); render();
            toast(tt('xlImported', 'Ficheiro importado.'));
        }).catch(function () { toast(tt('xlImportFail', 'Não foi possível importar o ficheiro.')); });
    }

    function fillHeaders(sh, headers, startR) {
        headers.forEach(function (h, i) {
            var ce = ensure(sh, i, startR || 0);
            ce.raw = h; ce.bold = true; ce.fill = '#0B1223'; ce.color = '#C9A84C';
        });
    }
    function nifPtOk(nif) {
        var s = String(nif || '').replace(/\D/g, '');
        if (!/^[12356789]\d{8}$/.test(s)) return false;
        var sum = 0, i;
        for (i = 0; i < 8; i++) sum += Number(s.charAt(i)) * (9 - i);
        var check = 11 - (sum % 11);
        if (check >= 10) check = 0;
        return check === Number(s.charAt(8));
    }
    function loadBusiness() {
        pushUndo();
        var co = (window.abene && window.abene.companyData) || {};
        var vat = String(co.vatRate || 23);
        var labour = L4('Mão de obra', 'Main-d’œuvre', 'Labour', 'Mano de obra');
        var draft = L4('rascunho', 'brouillon', 'draft', 'borrador');
        var yes = L4('SIM', 'OUI', 'YES', 'SÍ');
        var check = L4('VERIFICAR', 'VÉRIFIER', 'CHECK', 'VERIFICAR');
        var gap = L4('DESVIO', 'ECART', 'GAP', 'DESVIO');
        var cfg = blankSheet('CONFIG');
        fillHeaders(cfg, [L4('parametro', 'paramètre', 'parameter', 'parámetro'), L4('valor', 'valeur', 'value', 'valor')]);
        [['empresa', co.name || 'Genius Raros'], ['nif', co.nif || ''], ['moeda', co.currency || 'EUR'],
            ['iva', vat], ['serie_orcamento', 'ORC'], ['serie_recibo', 'REC'],
            ['morada', co.address || ''], ['email', co.email || ''], ['prox_orc', '1'], ['prox_rec', '1']].forEach(function (p, i) {
            ensure(cfg, 0, i + 1).raw = p[0];
            ensure(cfg, 1, i + 1).raw = p[1];
        });
        var cli = blankSheet('CLIENTS');
        fillHeaders(cli, ['id', L4('nome', 'nom', 'name', 'nombre'), 'nif', L4('morada', 'adresse', 'address', 'dirección'), L4('telefone', 'téléphone', 'phone', 'teléfono'), 'email', L4('estado', 'état', 'status', 'estado'), 'nif_ok']);
        ensure(cli, 0, 1).raw = 'C001';
        ensure(cli, 1, 1).raw = L4('Cliente exemplo', 'Client exemple', 'Sample client', 'Cliente de ejemplo');
        ensure(cli, 2, 1).raw = co.nif || '';
        ensure(cli, 7, 1).raw = nifPtOk(co.nif) ? 'OK' : check;
        var art = blankSheet('ARTICLES');
        fillHeaders(art, [L4('código', 'code', 'code', 'código'), L4('designação', 'designation', 'designation', 'designación'), L4('unidade', 'unite', 'unit', 'unidad'), L4('preço_unitário', 'prix_unitaire', 'unit_price', 'precio_unitario'), L4('iva', 'tva', 'vat', 'iva'), L4('ativo', 'actif', 'active', 'activo')]);
        ensure(art, 0, 1).raw = 'SRV-001';
        ensure(art, 1, 1).raw = labour;
        ensure(art, 2, 1).raw = 'h';
        ensure(art, 3, 1).raw = '35'; ensure(art, 3, 1).fmt = 'eur';
        ensure(art, 4, 1).raw = vat;
        ensure(art, 5, 1).raw = yes;
        var dv = blankSheet('DEVIS');
        fillHeaders(dv, [L4('referência', 'reference', 'reference', 'referencia'), L4('data', 'date', 'date', 'fecha'), 'client_id', L4('estado', 'statut', 'status', 'estado'), 'total_ht', 'total_tva', 'total_ttc']);
        ensure(dv, 0, 1).raw = 'ORC-0001';
        ensure(dv, 1, 1).raw = new Date().toISOString().slice(0, 10);
        ensure(dv, 2, 1).raw = 'C001';
        ensure(dv, 3, 1).raw = draft;
        ensure(dv, 4, 1).raw = '=SUMIF(DEVIS_LIGNES!A:A;A2;DEVIS_LIGNES!I:I)';
        ensure(dv, 5, 1).raw = '=SUMIF(DEVIS_LIGNES!A:A;A2;DEVIS_LIGNES!J:J)';
        ensure(dv, 6, 1).raw = '=E2+F2';
        var dl = blankSheet('DEVIS_LIGNES');
        fillHeaders(dl, ['devis_reference', 'article_code', L4('descrição', 'description', 'description', 'descripción'), L4('quantidade', 'quantite', 'quantity', 'cantidad'), L4('unidade', 'unite', 'unit', 'unidad'), L4('preço_unitário', 'prix_unitaire', 'unit_price', 'precio_unitario'), L4('desconto', 'remise', 'discount', 'descuento'), L4('iva', 'tva', 'vat', 'iva'), 'total_ht', 'total_tva', 'total_ttc']);
        ensure(dl, 0, 1).raw = 'ORC-0001';
        ensure(dl, 1, 1).raw = 'SRV-001';
        ensure(dl, 2, 1).raw = labour;
        ensure(dl, 3, 1).raw = '2';
        ensure(dl, 4, 1).raw = 'h';
        ensure(dl, 5, 1).raw = '35'; ensure(dl, 5, 1).fmt = 'eur';
        ensure(dl, 6, 1).raw = '0';
        ensure(dl, 7, 1).raw = vat;
        ensure(dl, 8, 1).raw = '=D2*(F2-G2)'; ensure(dl, 8, 1).fmt = 'eur';
        ensure(dl, 9, 1).raw = '=I2*H2/100'; ensure(dl, 9, 1).fmt = 'eur';
        ensure(dl, 10, 1).raw = '=I2+J2'; ensure(dl, 10, 1).fmt = 'eur';
        var rec = blankSheet('RECUS');
        fillHeaders(rec, [L4('referência', 'reference', 'reference', 'referencia'), L4('data', 'date', 'date', 'fecha'), 'client_id', L4('montante_ttc', 'montant_ttc', 'amount_ttc', 'importe_ttc'), L4('iva', 'tva', 'vat', 'iva'), L4('estado', 'statut', 'status', 'estado')]);
        var tva = blankSheet('TVA');
        fillHeaders(tva, [L4('taxa', 'taux', 'rate', 'tasa'), 'base_ht', L4('montante_tva', 'montant_tva', 'vat_amount', 'importe_iva'), 'ttc']);
        ensure(tva, 0, 1).raw = vat;
        ensure(tva, 1, 1).raw = '=SUMIF(DEVIS_LIGNES!H:H;A2;DEVIS_LIGNES!I:I)';
        ensure(tva, 2, 1).raw = '=SUMIF(DEVIS_LIGNES!H:H;A2;DEVIS_LIGNES!J:J)';
        ensure(tva, 3, 1).raw = '=B2+C2';
        var ctl = blankSheet('CONTROLE');
        fillHeaders(ctl, [L4('tipo', 'type', 'type', 'tipo'), L4('referência', 'reference', 'reference', 'referencia'), L4('resultado', 'resultat', 'result', 'resultado'), L4('detalhe', 'détail', 'detail', 'detalle')]);
        ensure(ctl, 0, 1).raw = L4('totais', 'totaux', 'totals', 'totales');
        ensure(ctl, 1, 1).raw = 'ORC-0001';
        ensure(ctl, 2, 1).raw = '=IF(ABS(DEVIS!G2-SUMIF(DEVIS_LIGNES!A:A;B2;DEVIS_LIGNES!K:K))<0.02;"OK";"' + gap + '")';
        ensure(ctl, 3, 1).raw = L4('TTC orçamento vs linhas', 'TTC devis vs lignes', 'TTC quote vs lines', 'TTC presupuesto vs líneas');
        var jour = blankSheet('JOURNAL');
        fillHeaders(jour, [L4('data', 'date', 'date', 'fecha'), L4('evento', 'événement', 'event', 'evento'), L4('detalhe', 'détail', 'detail', 'detalle')]);
        ensure(jour, 0, 1).raw = new Date().toISOString().slice(0, 10);
        ensure(jour, 1, 1).raw = L4('modelo', 'modèle', 'template', 'modelo');
        ensure(jour, 2, 1).raw = L4('Livro métier criado', 'Classeur métier créé', 'Business workbook created', 'Libro de negocio creado');
        var par = blankSheet('PARAMETRES');
        fillHeaders(par, [L4('chave', 'clé', 'key', 'clave'), L4('valor', 'valeur', 'value', 'valor')]);
        ensure(par, 0, 1).raw = L4('lingua', 'langue', 'language', 'idioma');
        ensure(par, 1, 1).raw = locale();
        wb.sheets = [cfg, cli, art, dv, dl, rec, tva, ctl, jour, par];
        wb.active = 0;
        wb.name = ((typeof window.abeneBrandName === 'function') ? window.abeneBrandName() : 'Genius Raros').replace(/\s+/g, '_') + '_Metier';
        recalc(); persist(); render();
        toast(tt('xlBiz', 'Modelo métier carregado.'));
    }
    function importQuoteToExcel() {
        var editor = document.getElementById('editor');
        if (!editor) return;
        var items = [];
        if (window.abeneContabilidade && window.abeneContabilidade.harvestTables) {
            items = window.abeneContabilidade.harvestTables() || [];
        }
        if (!items.length) {
            editor.querySelectorAll('table').forEach(function (table) {
                table.querySelectorAll('tbody tr').forEach(function (tr) {
                    var tds = tr.querySelectorAll('td');
                    if (tds.length < 3) return;
                    items.push({
                        desc: (tds[1] || tds[0]).innerText.trim(),
                        unit: (tds[2] && tds[2].innerText || 'un').trim(),
                        qty: E().num((tds[3] && tds[3].innerText) || '1'),
                        price: E().num((tds[4] && tds[4].innerText) || '0'),
                        vat: E().num((tds[5] && tds[5].innerText) || '23')
                    });
                });
            });
        }
        if (!items.length) { toast(tt('xlNoQuote', 'Nenhuma tabela de orçamento encontrada.')); return; }
        enter();
        var sh = findSheet('DEVIS_LIGNES') || blankSheet('DEVIS_LIGNES');
        if (!findSheet('DEVIS_LIGNES')) {
            fillHeaders(sh, ['devis_reference', 'article_code', L4('descrição', 'description', 'description', 'descripción'), L4('quantidade', 'quantite', 'quantity', 'cantidad'), L4('unidade', 'unite', 'unit', 'unidad'), L4('preço_unitário', 'prix_unitaire', 'unit_price', 'precio_unitario'), L4('desconto', 'remise', 'discount', 'descuento'), L4('iva', 'tva', 'vat', 'iva'), 'total_ht', 'total_tva', 'total_ttc']);
            wb.sheets.push(sh);
        }
        items.forEach(function (it, i) {
            var r = i + 1;
            ensure(sh, 0, r).raw = 'ORC';
            ensure(sh, 2, r).raw = it.desc || it.description || '';
            ensure(sh, 3, r).raw = String(it.qty || 1);
            ensure(sh, 4, r).raw = it.unit || 'un';
            ensure(sh, 5, r).raw = String(it.price || 0); ensure(sh, 5, r).fmt = 'eur';
            ensure(sh, 6, r).raw = '0';
            ensure(sh, 7, r).raw = String(it.vat || 23);
            ensure(sh, 8, r).raw = '=D' + (r + 1) + '*(F' + (r + 1) + '-G' + (r + 1) + ')';
            ensure(sh, 9, r).raw = '=I' + (r + 1) + '*H' + (r + 1) + '/100';
            ensure(sh, 10, r).raw = '=I' + (r + 1) + '+J' + (r + 1);
        });
        wb.active = wb.sheets.indexOf(sh);
        recalc(); persist(); render();
        toast(tt('xlQuoteIn', 'Linhas do orçamento importadas para Excel.'));
    }
    function excelToQuote() {
        var sh = findSheet('DEVIS_LIGNES') || sheet();
        var editor = document.getElementById('editor');
        if (!editor) return;
        var table = editor.querySelector('table');
        if (!table) { toast(tt('xlNoTable', 'Nenhuma tabela no documento.')); return; }
        var r, rows = table.querySelectorAll('tbody tr');
        for (r = 0; r < rows.length; r++) {
            var ce = cell(sh, 3, r + 1);
            var tds = rows[r].querySelectorAll('td');
            if (ce && tds[3]) tds[3].textContent = display(ce);
            var p = cell(sh, 5, r + 1);
            if (p && tds[4]) tds[4].textContent = display(p);
        }
        leave();
        if (typeof switchTab === 'function') switchTab('devis');
        toast(tt('xlQuoteBack', 'Quantidades reenviadas para o orçamento Word.'));
    }
    function excelToWord() {
        var rng = selRange(), r, c, rows = [], sh = sheet();
        for (r = rng.r0; r <= rng.r1; r++) {
            var row = [];
            for (c = rng.c0; c <= rng.c1; c++) row.push(cloneClipCell(cell(sh, c, r)));
            rows.push(row);
        }
        var html = cellsToHtml(rows, { type: 'excel', sheet: sh.name, c0: rng.c0, r0: rng.r0 }) + '<p></p>';
        leave();
        var editor = document.getElementById('editor');
        if (editor) {
            editor.focus();
            document.execCommand('insertHTML', false, html);
            if (typeof saveUndoState === 'function') saveUndoState();
        }
        toast(tt('xlToWordMsg', 'Tabela inserida no documento Word.'));
    }
    function wordTableToExcel() {
        var editor = document.getElementById('editor');
        var table = null;
        var seln = window.getSelection();
        if (seln && seln.anchorNode) table = seln.anchorNode.nodeType === 1 ? seln.anchorNode.closest('table') : seln.anchorNode.parentElement && seln.anchorNode.parentElement.closest('table');
        if (!table && editor) table = editor.querySelector('table');
        if (!table) { toast(tt('xlNoTable', 'Nenhuma tabela no documento.')); return; }
        enter();
        pushUndo();
        var parsed = parseHtmlToCells(table.outerHTML);
        var sh = blankSheet('Word');
        var rows = (parsed && parsed.cells) || [];
        rows.forEach(function (row, r) {
            row.forEach(function (ce, c) {
                var dest = ensure(sh, c, r);
                dest.raw = ce.raw || '';
                applyVisual(dest, ce);
            });
        });
        wb.sheets.push(sh);
        wb.active = wb.sheets.length - 1;
        recalc(); persist(); render();
        toast(tt('xlFromWordMsg', 'Tabela Word copiada para Excel.'));
    }

    function chartData() {
        var rng = selRange(), sh = sheet(), labels = [], series = [], c, r, v;
        for (r = rng.r0; r <= rng.r1; r++) {
            var lab = display(cell(sh, rng.c0, r)) || String(r + 1);
            labels.push(lab);
        }
        for (c = rng.c0 + (rng.c1 > rng.c0 ? 1 : 0); c <= rng.c1; c++) {
            var pts = [];
            for (r = rng.r0; r <= rng.r1; r++) {
                v = cell(sh, c, r) && cell(sh, c, r).value;
                pts.push(typeof v === 'number' ? v : E().num(v || 0));
            }
            series.push({ name: E().colName(c), pts: pts });
        }
        if (!series.length) {
            series = [{ name: 'S1', pts: labels.map(function (_, i) {
                var ce = cell(sh, rng.c0, rng.r0 + i);
                return ce && typeof ce.value === 'number' ? ce.value : 0;
            }) }];
            labels = series[0].pts.map(function (_, i) { return String(i + 1); });
        }
        return { labels: labels, series: series, range: key(rng.c0, rng.r0) + ':' + key(rng.c1, rng.r1) };
    }
    function addChart(type) {
        var d = chartData();
        pushUndo();
        sheet().charts = sheet().charts || [];
        sheet().charts.push({
            type: type, range: d.range, title: type, labels: d.labels, series: d.series,
            x: 120, y: 80, w: 360, h: 220
        });
        persist(); render();
    }
    function renderChartsHtml(sh) {
        if (!sh.charts || !sh.charts.length) return '';
        return sh.charts.map(function (ch, i) {
            return '<div class="xl-chart" data-i="' + i + '" style="left:' + ch.x + 'px;top:' + ch.y + 'px;width:' + ch.w + 'px;height:' + ch.h + 'px">' +
                '<div class="xl-chart-bar"><b>' + esc(ch.title || ch.type) + '</b> <button type="button" data-del="' + i + '">✕</button></div>' +
                chartSvg(ch) + '</div>';
        }).join('');
    }
    function chartSvg(ch) {
        var w = ch.w - 16, h = ch.h - 36, pad = 28;
        var pts = (ch.series[0] && ch.series[0].pts) || [];
        var max = Math.max.apply(null, pts.concat([1]));
        var n = Math.max(pts.length, 1), i, x, y, d;
        if (ch.type === 'pie') {
            var sum = pts.reduce(function (a, b) { return a + Math.abs(b); }, 0) || 1, a0 = -Math.PI / 2, slices = '';
            pts.forEach(function (p) {
                var a1 = a0 + (Math.abs(p) / sum) * Math.PI * 2;
                var x1 = w / 2 + Math.cos(a0) * (h / 2 - 8), y1 = h / 2 + Math.sin(a0) * (h / 2 - 8);
                var x2 = w / 2 + Math.cos(a1) * (h / 2 - 8), y2 = h / 2 + Math.sin(a1) * (h / 2 - 8);
                var large = (a1 - a0) > Math.PI ? 1 : 0;
                slices += '<path d="M' + (w / 2) + ',' + (h / 2) + ' L' + x1 + ',' + y1 + ' A' + (h / 2 - 8) + ',' + (h / 2 - 8) + ' 0 ' + large + ' 1 ' + x2 + ',' + y2 + ' Z" fill="hsl(' + (a0 * 40) + ',60%,55%)"/>';
                a0 = a1;
            });
            return '<svg width="' + w + '" height="' + h + '">' + slices + '</svg>';
        }
        if (ch.type === 'line') {
            d = pts.map(function (p, i) {
                x = pad + i * (w - pad * 2) / Math.max(n - 1, 1);
                y = h - pad - (p / max) * (h - pad * 2);
                return x + ',' + y;
            }).join(' ');
            return '<svg width="' + w + '" height="' + h + '"><polyline fill="none" stroke="#2b579a" stroke-width="2" points="' + d + '"/></svg>';
        }
        var bars = '', bw = Math.max(4, (w - pad * 2) / n - 4);
        var horiz = ch.type === 'bar';
        pts.forEach(function (p, i) {
            var hh = (p / max) * (h - pad * 2);
            if (horiz) {
                bars += '<rect x="' + pad + '" y="' + (pad + i * (h - pad * 2) / n) + '" width="' + hh + '" height="' + Math.max(4, (h - pad * 2) / n - 4) + '" fill="#2b579a"/>';
            } else {
                bars += '<rect x="' + (pad + i * ((w - pad * 2) / n)) + '" y="' + (h - pad - hh) + '" width="' + bw + '" height="' + hh + '" fill="#2b579a"/>';
            }
        });
        return '<svg width="' + w + '" height="' + h + '">' + bars + '</svg>';
    }
    function bindCharts() {
        var host = document.getElementById('excelGrid');
        if (!host) return;
        host.querySelectorAll('.xl-chart [data-del]').forEach(function (b) {
            b.onclick = function (ev) {
                ev.stopPropagation();
                pushUndo();
                sheet().charts.splice(Number(b.getAttribute('data-del')), 1);
                persist(); render();
            };
        });
        host.querySelectorAll('.xl-chart').forEach(function (box) {
            box.onmousedown = function (ev) {
                if (ev.target.tagName === 'BUTTON') return;
                ev.stopPropagation();
                var i = Number(box.getAttribute('data-i'));
                var ch = sheet().charts[i];
                var sx = ev.clientX, sy = ev.clientY, ox = ch.x, oy = ch.y, ow = ch.w, oh = ch.h;
                var resize = ev.offsetX > ch.w - 14 && ev.offsetY > ch.h - 14;
                function move(e) {
                    if (resize) { ch.w = Math.max(160, ow + e.clientX - sx); ch.h = Math.max(120, oh + e.clientY - sy); }
                    else { ch.x = ox + e.clientX - sx; ch.y = oy + e.clientY - sy; }
                    renderGrid();
                }
                function up() {
                    document.removeEventListener('mousemove', move);
                    document.removeEventListener('mouseup', up);
                    persist();
                }
                document.addEventListener('mousemove', move);
                document.addEventListener('mouseup', up);
            };
        });
    }
    var _rg = renderGrid;
    renderGrid = function () { _rg(); bindCharts(); };

    function makePivot() {
        var rng = selRange();
        var html = '<p>' + esc(tt('xlPivotHint', 'A primeira linha são cabeçalhos. Indique a coluna de linhas e a de valores (0 = A).')) + '</p>' +
            '<div class="form-group"><label>' + esc(tt('xlPivotRows', 'Coluna de linhas (0 = A)')) + '</label><input id="pvR" type="number" value="0" min="0"></div>' +
            '<div class="form-group"><label>' + esc(tt('xlPivotVals', 'Coluna de valores (0 = A)')) + '</label><input id="pvV" type="number" value="1" min="0"></div>' +
            '<div class="form-group"><label>' + esc(tt('xlPivotAgg', 'Agregação')) + '</label><select id="pvA">' +
            '<option value="sum">' + esc(locFn('SUM')) + '</option>' +
            '<option value="count">' + esc(locFn('COUNT')) + '</option>' +
            '<option value="avg">' + esc(locFn('AVERAGE')) + '</option></select></div>';
        xlDlg(tt('xlPivot', 'Tabela dinâmica'), html, 'pvOk', function () {
            var rc = Number((document.getElementById('pvR') || {}).value) || 0;
            var vc = Number((document.getElementById('pvV') || {}).value) || 1;
            var agg = (document.getElementById('pvA') || {}).value || 'sum';
            var sh = sheet(), map = {}, r, k, v, n;
            for (r = rng.r0 + 1; r <= rng.r1; r++) {
                k = String((cell(sh, rng.c0 + rc, r) && cell(sh, rng.c0 + rc, r).value) || '');
                v = cell(sh, rng.c0 + vc, r) && cell(sh, rng.c0 + vc, r).value;
                n = typeof v === 'number' ? v : 0;
                if (!map[k]) map[k] = { s: 0, c: 0 };
                map[k].s += n; map[k].c++;
            }
            var out = blankSheet('TCD');
            ensure(out, 0, 0).raw = tt('xlPivotField', 'campo'); ensure(out, 0, 0).bold = true;
            ensure(out, 1, 0).raw = agg; ensure(out, 1, 0).bold = true;
            var i = 1;
            Object.keys(map).forEach(function (kk) {
                ensure(out, 0, i).raw = kk;
                ensure(out, 1, i).raw = String(agg === 'count' ? map[kk].c : agg === 'avg' ? (map[kk].s / map[kk].c) : map[kk].s);
                i++;
            });
            pushUndo();
            wb.sheets.push(out);
            wb.active = wb.sheets.length - 1;
            closeModal('genericModal'); recalc(); persist(); render();
        });
    }
    function printSheet() {
        var sh = sheet(), r, c, html = '<html><head><title>' + esc(wb.name) + '</title><style>table{border-collapse:collapse;font:12px Calibri,sans-serif}td,th{border:1px solid #999;padding:3px 6px}</style></head><body><h3>' + esc(sh.name) + '</h3><table>';
        for (r = 0; r < Math.min(sh.rows, 200); r++) {
            html += '<tr>';
            for (c = 0; c < Math.min(sh.cols, 20); c++) html += '<td>' + esc(display(cell(sh, c, r))) + '</td>';
            html += '</tr>';
        }
        html += '</table></body></html>';
        var w = window.open('', '_blank');
        if (!w) { toast(tt('xlPopup', 'Permita janelas pop-up para imprimir.')); return; }
        w.document.write(html); w.document.close(); w.focus(); w.print();
    }
    function pdfSheet() {
        var sh = sheet(), wrap = document.createElement('div');
        wrap.style.padding = '16px';
        wrap.innerHTML = '<h3>' + esc(sh.name) + '</h3>';
        var tbl = document.createElement('table');
        tbl.style.borderCollapse = 'collapse';
        var r, c, tr, td;
        for (r = 0; r < Math.min(sh.rows, 80); r++) {
            tr = document.createElement('tr');
            for (c = 0; c < Math.min(sh.cols, 12); c++) {
                td = document.createElement('td');
                td.style.border = '1px solid #ccc';
                td.style.padding = '3px 6px';
                td.textContent = display(cell(sh, c, r));
                tr.appendChild(td);
            }
            tbl.appendChild(tr);
        }
        wrap.appendChild(tbl);
        if (window.html2pdf) {
            html2pdf().set({ filename: (wb.name || 'folha') + '.pdf', margin: 10 }).from(wrap).save();
        } else printSheet();
    }
    function openFind(repl) {
        var html = '<div class="form-group"><label>' + esc(tt('xlFind', 'Procurar')) + '</label><input id="xlFindQ" type="text"></div>' +
            (repl ? '<div class="form-group"><label>' + esc(tt('xlReplace', 'Substituir por')) + '</label><input id="xlFindR" type="text"></div>' : '');
        xlDlg(repl ? tt('xlReplace', 'Substituir') : tt('xlFind', 'Procurar'), html, 'xlFindGo', function () {
            var qEl = document.getElementById('xlFindQ');
            var q = qEl ? qEl.value : '';
            if (!q) return;
            var rEl = document.getElementById('xlFindR');
            var rep = repl && rEl ? rEl.value : null;
            var sh = sheet(), k, ce, n = 0;
            if (rep != null) pushUndo();
            for (k in sh.cells) {
                ce = sh.cells[k];
                if (!ce || String(ce.raw).indexOf(q) < 0) continue;
                if (rep != null) { ce.raw = String(ce.raw).split(q).join(rep); n++; }
                else {
                    var a = E().parseA1(k);
                    sel = { r: a.r, c: a.c, r2: a.r, c2: a.c };
                    closeModal('genericModal'); render(); return;
                }
            }
            if (rep != null) { recalc(); persist(); }
            closeModal('genericModal'); render();
            if (rep != null) toast(n + ' ' + tt('xlReplaced', 'substituições'));
        });
    }
    function dedup() {
        var rng = selRange(), seen = {}, r, c, line;
        pushUndo();
        for (r = rng.r0; r <= rng.r1; r++) {
            line = [];
            for (c = rng.c0; c <= rng.c1; c++) line.push((cell(sheet(), c, r) && cell(sheet(), c, r).raw) || '');
            var sig = line.join('\u0001');
            if (seen[sig]) {
                for (c = rng.c0; c <= rng.c1; c++) delete sheet().cells[key(c, r)];
            } else seen[sig] = true;
        }
        persist(); render();
    }
    function addComment() {
        var sh = sheet();
        if (!sh.comments) sh.comments = {};
        var cur = sh.comments[key(sel.c, sel.r)] || '';
        var html = '<div class="form-group"><label>' + esc(tt('xlComment', 'Comentário')) + ' ' + key(sel.c, sel.r) + '</label>' +
            '<textarea id="xlNote" rows="4">' + esc(cur) + '</textarea></div>';
        xlDlg(tt('xlComment', 'Comentário'), html, 'xlNoteOk', function () {
            var note = (document.getElementById('xlNote') || {}).value || '';
            pushUndo();
            if (!sheet().comments) sheet().comments = {};
            if (!note.trim()) delete sheet().comments[key(sel.c, sel.r)];
            else sheet().comments[key(sel.c, sel.r)] = note;
            closeModal('genericModal'); persist(); render();
        });
    }
    function lockToggle() {
        pushUndo();
        eachSel(function (c, r) {
            var ce = ensure(sheet(), c, r);
            ce.locked = ce.locked === false ? true : false;
        });
        persist(); render();
    }
    function openValidation() {
        var html = '<div class="form-group"><label>' + esc(tt('xlValid', 'Validação')) + '</label>' +
            '<select id="xlVt"><option value="list">' + esc(tt('xlList', 'Lista')) + '</option><option value="number">' + esc(tt('xlListNumber', 'Número')) + '</option></select></div>' +
            '<div class="form-group"><label>' + esc(tt('xlValidHint', 'Lista: a;b;c  —  Número: min;máx')) + '</label><input id="xlVv" type="text"></div>' +
            '<div class="form-group"><label>' + esc(tt('xlValidMsg', 'Mensagem')) + '</label><input id="xlVm" type="text"></div>';
        xlDlg(tt('xlValid', 'Validação'), html, 'xlVok', function () {
            var t = (document.getElementById('xlVt') || {}).value;
            var v = (document.getElementById('xlVv') || {}).value || '';
            var m = (document.getElementById('xlVm') || {}).value || '';
            pushUndo();
            if (!sheet().validation) sheet().validation = {};
            eachSel(function (c, r) {
                if (t === 'list') sheet().validation[key(c, r)] = { type: 'list', list: v.split(/[,;]/).map(function (s) { return s.trim(); }).filter(Boolean), msg: m };
                else {
                    var p = v.split(/[;:]/);
                    sheet().validation[key(c, r)] = { type: 'number', min: p[0] ? Number(p[0]) : null, max: p[1] ? Number(p[1]) : null, msg: m };
                }
            });
            closeModal('genericModal'); persist(); render();
        });
    }
    function openCf() {
        var html = '<div class="form-group"><label>' + esc(tt('xlCf', 'Formatação condicional')) + '</label>' +
            '<select id="xlCk"><option value="gt">&gt;</option><option value="lt">&lt;</option><option value="eq">=</option><option value="formula">' + esc(tt('xlCfFormula', 'Fórmula')) + '</option></select></div>' +
            '<div class="form-group"><label>' + esc(tt('xlCfValue', 'Valor / fórmula')) + '</label><input id="xlCn" type="text" value="0"></div>' +
            '<div class="form-group"><label>' + esc(tt('xlFill', 'Cor')) + '</label><input type="color" id="xlCc" value="#fff2cc"></div>';
        xlDlg(tt('xlCf', 'Formatação condicional'), html, 'xlCok', function () {
            var rng = selRange();
            pushUndo();
            sheet().cf = sheet().cf || [];
            sheet().cf.push({
                kind: (document.getElementById('xlCk') || {}).value,
                n: (document.getElementById('xlCn') || {}).value,
                fill: (document.getElementById('xlCc') || {}).value || '#fff2cc',
                r0: rng.r0, r1: rng.r1, c0: rng.c0, c1: rng.c1
            });
            closeModal('genericModal'); recalc(); persist(); render();
        });
    }
    function makeTable() {
        pushUndo();
        var rng = selRange();
        sheet().table = rng;
        sheet().filters = { r: rng.r0 };
        eachSel(function (c, r) {
            if (r === rng.r0) { var ce = ensure(sheet(), c, r); ce.bold = true; ce.fill = '#2b579a'; ce.color = '#fff'; }
        });
        persist(); render();
    }
    function helpExcel() {
        var html = '<div class="xl-task-form" style="max-height:min(60vh,420px);overflow:auto;font-size:13px;line-height:1.5">' +
            '<p>' + esc(tt('xlHelpFx')) + '</p>' +
            '<p>' + esc(tt('xlHelpKeys')) + '</p>' +
            '<p>' + esc(tt('xlHelpSheets')) + '</p>' +
            '<p>' + esc(tt('xlHelpBiz')) + '</p>' +
            '<p>' + esc(tt('xlHelpSec')) + '</p></div>';
        if (typeof openGenericModal !== 'function') return;
        openGenericModal(tt('xlHelp', 'Ajuda Excel'), html,
            '<button type="button" class="btn-primary" onclick="closeModal(\'genericModal\')">' + esc(tt('ok', 'OK')) + '</button>');
    }

    function runTests() {
        var orig = snapshot();
        var tsh = blankSheet('TEST');
        wb.sheets = [tsh]; wb.active = 0;
        ensure(tsh, 0, 0).raw = '10';
        ensure(tsh, 0, 1).raw = '20';
        ensure(tsh, 0, 2).raw = '=SUM(A1:A2)';
        recalc();
        var t01 = Number(tsh.cells.A3 && tsh.cells.A3.value) === 30;
        ensure(tsh, 1, 0).raw = '=1/0';
        recalc();
        var t07 = tsh.cells.B1 && String(tsh.cells.B1.value).indexOf('#DIV') >= 0;
        ensure(tsh, 2, 0).raw = '=SOMA(A1:A2)';
        recalc();
        var tpt = Number(tsh.cells.C1 && tsh.cells.C1.value) === 30;
        ensure(tsh, 3, 0).raw = '="A"&"B"';
        recalc();
        var tand = tsh.cells.D1 && tsh.cells.D1.value === 'AB';
        ensure(tsh, 4, 0).raw = '=PI()';
        recalc();
        var tpi = Math.abs(Number(tsh.cells.E1 && tsh.cells.E1.value) - Math.PI) < 1e-10;
        ensure(tsh, 5, 0).raw = '=SEN(0)';
        recalc();
        var tsin = Number(tsh.cells.F1 && tsh.cells.F1.value) === 0;
        ensure(tsh, 6, 0).raw = '=PGTO(0,05/12;12;-1000)';
        recalc();
        var tpmt = typeof (tsh.cells.G1 && tsh.cells.G1.value) === 'number' && isFinite(tsh.cells.G1.value);
        ensure(tsh, 7, 0).raw = '=SUM(1,2,3)';
        recalc();
        var tsum = Number(tsh.cells.H1 && tsh.cells.H1.value) === 6;
        ensure(tsh, 8, 0).raw = '=IF(1=1,2,3)';
        recalc();
        var tif = Number(tsh.cells.I1 && tsh.cells.I1.value) === 2;
        ensure(tsh, 9, 0).raw = '=ROUND(1.234,2)';
        recalc();
        var trnd = Math.abs(Number(tsh.cells.J1 && tsh.cells.J1.value) - 1.23) < 1e-9;
        ensure(tsh, 10, 0).raw = '=PMT(0.05/12,12,-1000)';
        recalc();
        var tpmtEn = typeof (tsh.cells.K1 && tsh.cells.K1.value) === 'number' && isFinite(tsh.cells.K1.value);
        ensure(tsh, 11, 0).raw = '=VPM(0,05/12;12;-1000)';
        recalc();
        var tvpm = typeof (tsh.cells.L1 && tsh.cells.L1.value) === 'number' && isFinite(tsh.cells.L1.value);
        ensure(tsh, 12, 0).raw = '=PAGO(0,05/12;12;-1000)';
        recalc();
        var tpago = typeof (tsh.cells.M1 && tsh.cells.M1.value) === 'number' && isFinite(tsh.cells.M1.value);
        ensure(tsh, 13, 0).raw = '=SE(1=1;2;3)';
        recalc();
        var tse = Number(tsh.cells.N1 && tsh.cells.N1.value) === 2;
        ensure(tsh, 14, 0).raw = '=SI(1=1;2;3)';
        recalc();
        var tsi = Number(tsh.cells.O1 && tsh.cells.O1.value) === 2;
        ensure(tsh, 15, 0).raw = '=SOMME(A1:A2)';
        recalc();
        var tsomme = Number(tsh.cells.P1 && tsh.cells.P1.value) === 30;
        ensure(tsh, 16, 0).raw = '=SUMA(A1:A2)';
        recalc();
        var tsuma = Number(tsh.cells.Q1 && tsh.cells.Q1.value) === 30;
        var dang = E().dangerous('=cmd|\' /C calc\'!A0');
        var results = [
            { id: 'T01', ok: t01, detail: 'SUM(A1:A2)=30' },
            { id: 'T07', ok: t07, detail: '#DIV/0!' },
            { id: 'TPT', ok: tpt, detail: 'SOMA localizada' },
            { id: 'T08', ok: dang, detail: 'fórmula perigosa rejeitada' },
            { id: 'TAND', ok: tand, detail: 'concat &' },
            { id: 'TPI', ok: tpi, detail: 'PI()' },
            { id: 'TSIN', ok: tsin, detail: 'SEN(0)' },
            { id: 'TPMT', ok: tpmt, detail: 'PGTO financeiro' },
            { id: 'TSUM', ok: tsum, detail: 'SUM(1,2,3)=6' },
            { id: 'TIF', ok: tif, detail: 'IF(1=1,2,3)=2' },
            { id: 'TRND', ok: trnd, detail: 'ROUND(1.234,2)=1.23' },
            { id: 'TPMTE', ok: tpmtEn, detail: 'PMT EN' },
            { id: 'TVPM', ok: tvpm, detail: 'VPM FR' },
            { id: 'TPAGO', ok: tpago, detail: 'PAGO ES' },
            { id: 'TSE', ok: tse, detail: 'SE PT' },
            { id: 'TSI', ok: tsi, detail: 'SI FR' },
            { id: 'TSOMME', ok: tsomme, detail: 'SOMME FR' },
            { id: 'TSUMA', ok: tsuma, detail: 'SUMA ES' }
        ];
        wb = orig || newWorkbook();
        recalc(); persist(); render();
        var fail = results.filter(function (x) { return !x.ok; });
        toast(fail.length ? (tt('xlTestsFail', 'Falhou:') + ' ' + fail.map(function (x) { return x.id; }).join(', ')) : tt('xlTestsOk', 'Testes do motor: OK'));
        return results;
    }

    function isExcelEnabled() {
        try {
            if (window.abene && window.abene.companyData && window.abene.companyData.excelEnabled === false) return false;
            var raw = localStorage.getItem('abeneCompanyData');
            if (raw) {
                var d = JSON.parse(raw);
                if (d && d.excelEnabled === false) return false;
            }
        } catch (e) {}
        return true;
    }
    function applyExcelVisibility() {
        var on = isExcelEnabled();
        document.body.classList.toggle('abene-excel-hidden', !on);
        if (!on) {
            leave();
            var excelTab = document.querySelector('.menu-tabs button[data-tab="excel"]');
            if (excelTab && excelTab.classList.contains('active') && typeof origSwitch === 'function') origSwitch('home');
            else if (excelTab && excelTab.classList.contains('active') && typeof window.switchTab === 'function') window.switchTab('home');
        }
    }
    function enter() {
        if (!isExcelEnabled()) { applyExcelVisibility(); return; }
        document.body.classList.add('abene-excel-mode');
        if (!wb) {
            try { wb = JSON.parse(localStorage.getItem('abeneExcelWorkbook') || 'null'); } catch (e) { wb = null; }
            if (!wb || !wb.sheets || !wb.sheets.length) wb = newWorkbook();
        }
        var ws = document.getElementById('excelWorkspace');
        if (ws) ws.style.display = 'flex';
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                render();
                if (typeof window.abeneLayoutPhoneZoom === 'function') window.abeneLayoutPhoneZoom();
            });
        });
    }
    function leave() {
        document.body.classList.remove('abene-excel-mode');
        var ws = document.getElementById('excelWorkspace');
        if (ws) ws.style.display = 'none';
        persist();
        hidePasteBar();
        if (typeof window.abeneLayoutPhoneZoom === 'function') window.abeneLayoutPhoneZoom();
    }
    function applyFmtMenu(kind) {
        if (kind === 'bold') styleSel(function (ce) { ce.bold = !ce.bold; });
        else if (kind === 'italic') styleSel(function (ce) { ce.italic = !ce.italic; });
        else if (kind === 'under') styleSel(function (ce) { ce.under = !ce.under; });
        else if (kind === 'wrap') styleSel(function (ce) { ce.wrap = !ce.wrap; });
        else if (kind === 'left' || kind === 'center' || kind === 'right') styleSel(function (ce) { ce.align = kind; });
        else if (kind === 'border') styleSel(function (ce) { ce.border = ce.border ? '' : '#616161'; });
        else fmtNum(kind);
    }

    window.abeneExcelEnter = enter;
    window.abeneExcelReloadFromStorage = function () {
        try { wb = JSON.parse(localStorage.getItem('abeneExcelWorkbook') || 'null'); } catch (eR) { wb = null; }
        if (wb && document.body.classList.contains('abene-excel-mode')) render();
    };
    window.abeneExcelLeave = leave;
    window.abeneExcelNew = function () { pushUndo(); wb = newWorkbook(); persist(); render(); };
    window.abeneExcelUndo = excelUndo;
    window.abeneExcelRedo = excelRedo;
    window.abeneExcelFmt = applyFmtMenu;
    window.abeneExcelSort = sortSel;
    window.abeneExcelFilter = filterCol;
    window.abeneExcelAutoFilter = toggleAutoFilter;
    window.abeneExcelCsvOut = function () {
        var csv = toCsv();
        var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (wb.name || defaultBookName()) + '.csv'; a.click();
    };
    window.abeneExcelCsvIn = function () {
        var inp = document.getElementById('excelFileInput');
        if (!inp) return;
        inp.accept = '.csv,.txt';
        inp.onchange = function (e) {
            var f = e.target.files[0]; if (!f) return;
            var reader = new FileReader();
            reader.onload = function () { fromCsv(String(reader.result || '')); };
            reader.readAsText(f);
            e.target.value = '';
        };
        inp.click();
    };
    window.abeneExcelXlsxOut = exportXlsx;
    window.abeneExcelXlsxIn = function () {
        var inp = document.getElementById('excelFileInput');
        if (!inp) return;
        inp.accept = '.xlsx,.xlsm,.ods,.csv';
        inp.onchange = function (e) {
            var f = e.target.files[0]; if (!f) return;
            window.abeneExcelImportFile(f);
            e.target.value = '';
        };
        inp.click();
    };
    window.abeneExcelImportFile = function (file) {
        if (!file) return;
        if (/\.csv$/i.test(file.name) || /\.txt$/i.test(file.name)) {
            var reader = new FileReader();
            reader.onload = function () { fromCsv(String(reader.result || '')); };
            reader.readAsText(file);
            if (typeof window.switchTab === 'function') window.switchTab('excel');
            return;
        }
        if (/\.ods$/i.test(file.name)) importOds(file);
        else importXlsx(file);
    };
    window.abeneExcelOdsOut = exportOds;
    window.abeneExcelBusiness = loadBusiness;
    window.abeneExcelFromQuote = function () {
        if (!isExcelEnabled()) { toast(tt('xlDisabled', 'O módulo Excel está desativado nas definições.')); return; }
        importQuoteToExcel();
    };
    window.abeneExcelToQuote = excelToQuote;
    window.abeneExcelToWord = excelToWord;
    window.abeneWordToExcel = wordTableToExcel;
    window.abeneExcelTests = runTests;
    window.abeneExcelMerge = mergeSel;
    window.abeneExcelFill = function (color) { styleSel(function (ce) { ce.fill = color; }); };
    window.abeneExcelFontColor = function (color) { styleSel(function (ce) { ce.color = color; }); };
    window.abeneExcelFontSize = function (n) { styleSel(function (ce) { ce.size = Number(n) || 11; }); };
    window.abeneExcelCommitFx = commitFormulaBar;
    window.abeneExcelCancelFx = cancelFormulaBar;
    window.abeneExcelInsRow = insertRows;
    window.abeneExcelInsCol = insertCols;
    window.abeneExcelDelRow = deleteRows;
    window.abeneExcelDelCol = deleteCols;
    window.abeneExcelHideR = function () { hideSel('r'); };
    window.abeneExcelHideC = function () { hideSel('c'); };
    window.abeneExcelUnhide = unhideAll;
    window.abeneExcelFreeze = freezeHere;
    window.abeneExcelSum = autoSum;
    window.abeneExcelAutoAgg = function (kind) {
        var fly = document.getElementById('ribbonFlyout');
        if (fly) fly.classList.remove('visible');
        autoAgg(kind);
    };
    window.abeneExcelAutoSumMenu = autoSumMenu;
    window.abeneExcelInsertFnDlg = openInsertFnDlg;
    window.abeneExcelFnCat = openFnCat;
    window.abeneExcelPickFn = function (canon) { pickFn(canon, false); };
    window.abeneExcelRecentFn = function (ev) { openFnCat(ev, 'recent'); };
    window.abeneExcelChart = addChart;
    window.abeneExcelPivot = makePivot;
    window.abeneExcelPrint = printSheet;
    window.abeneExcelPdf = pdfSheet;
    window.abeneExcelFind = function () { openFind(false); };
    window.abeneExcelReplace = function () { openFind(true); };
    window.abeneExcelDedup = dedup;
    window.abeneExcelComment = addComment;
    window.abeneExcelLockToggle = lockToggle;
    window.abeneExcelValid = openValidation;
    window.abeneExcelCf = openCf;
    window.abeneExcelTable = makeTable;
    window.abeneExcelHelp = helpExcel;
    window.abeneExcelCopy = copySel;
    window.abeneExcelCut = cutSel;
    window.abeneExcelPaste = pasteSel;
    window.abeneExcelPasteKind = pasteSel;
    window.abeneSetClipPack = setClipPack;
    window.abeneGetClipPack = function () { return clipPack || window.abeneClipPack || null; };
    window.abeneParseHtmlToCells = parseHtmlToCells;
    window.abeneCellsToHtml = cellsToHtml;
    window.abeneExcelZoom = function (d) { zoom = Math.max(0.5, Math.min(2, zoom + d)); render(); };
    window.abeneExcelMoreRows = function () { sheet().rows = Math.min(10000, sheet().rows + 100); persist(); render(); };
    window.abeneExcelMoreCols = function () { sheet().cols = Math.min(MAX_COLS, sheet().cols + 5); persist(); render(); };
    window.abeneExcelPainter = function () {
        var ce = cell(sheet(), sel.c, sel.r);
        painter = ce ? JSON.parse(JSON.stringify(ce)) : null;
        if (painter) toast(tt('xlPainter', 'Clique nas células a formatar.'));
    };
    window.abeneApplyExcelVisibility = applyExcelVisibility;
    window.abeneExcelIsEnabled = isExcelEnabled;

    var origSwitch = window.switchTab;
    window.switchTab = function (name) {
        if (name === 'excel') {
            if (!isExcelEnabled()) {
                toast(tt('xlDisabled', 'O módulo Excel está desativado nas definições.'));
                applyExcelVisibility();
                if (typeof origSwitch === 'function') origSwitch('home');
                return;
            }
            enter();
        } else leave();
        if (typeof origSwitch === 'function') origSwitch(name);
    };

    document.addEventListener('keydown', onKey, true);

    var origUndo = window.undo;
    window.undo = function () {
        if (document.body.classList.contains('abene-excel-mode')) return excelUndo();
        if (typeof origUndo === 'function') return origUndo.apply(this, arguments);
    };
    var origRedo = window.redo;
    window.redo = function () {
        if (document.body.classList.contains('abene-excel-mode')) return excelRedo();
        if (typeof origRedo === 'function') return origRedo.apply(this, arguments);
    };
    function bootExcelUi() {
        var bar = document.getElementById('excelFormula');
        if (bar) {
            bar.addEventListener('focus', function () {
                _fxBackup = bar.value;
                editing = true;
            });
            bar.addEventListener('keydown', function (ev) {
                if (ev.key === 'Enter') { ev.preventDefault(); commitFormulaBar(); }
                if (ev.key === 'Escape') { ev.preventDefault(); cancelFormulaBar(); }
            });
        }
        var name = document.getElementById('excelNameBox');
        if (name) name.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter') { ev.preventDefault(); jumpName(name.value); }
        });
        var rsT;
        window.addEventListener('resize', function () {
            if (!document.body.classList.contains('abene-excel-mode')) return;
            clearTimeout(rsT);
            rsT = setTimeout(renderGrid, 80);
        });
        try {
            var saved = localStorage.getItem('abeneExcelWorkbook');
            if (saved) wb = JSON.parse(saved);
        } catch (e) {}
        if (!wb) wb = newWorkbook();
        applyExcelVisibility();
        applyExcelLanguage();
        var prevXlI18n = window.abeneAfterI18n;
        window.abeneAfterI18n = function (lang) {
            if (typeof prevXlI18n === 'function') prevXlI18n(lang);
            applyExcelLanguage();
        };
    }
    function applyExcelLanguage() {
        if (!wb) return;
        if (/^(Livro1|Classeur1|Book1|Libro1)$/i.test(String(wb.name || ''))) wb.name = defaultBookName();
        wb.sheets.forEach(function (sh, i) {
            if (/^(Folha|Feuille|Sheet|Hoja)\d+$/i.test(String(sh.name || ''))) {
                var num = parseInt(String(sh.name).replace(/\D/g, ''), 10) || (i + 1);
                sh.name = defaultSheetName(num);
            }
        });
        try { persist(); } catch (e) {}
        var ined = document.querySelector('.xl-inedit');
        if (ined && ined.value && String(ined.value).charAt(0) === '=' && E().toInvariantFormula) {
            ined.value = formulaDisplay(E().toInvariantFormula(ined.value));
        }
        render();
        updateFormulaBar(true);
        updateStatus();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootExcelUi);
    else bootExcelUi();
})();
