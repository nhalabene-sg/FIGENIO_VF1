/* Genius Raros Excel — moteur de calcul (sans eval / Function / macros). */
(function (root) {
    var FN = {
        SOMA: 'SUM', SOMME: 'SUM', SUMA: 'SUM', SUM: 'SUM',
        MEDIA: 'AVERAGE', 'MÉDIA': 'AVERAGE', MOYENNE: 'AVERAGE', PROMEDIO: 'AVERAGE', AVERAGE: 'AVERAGE',
        MIN: 'MIN', MINIMO: 'MIN', 'MÍNIMO': 'MIN',
        MAX: 'MAX', MAXIMO: 'MAX', 'MÁXIMO': 'MAX',
        CONTAR: 'COUNT', NB: 'COUNT', COUNT: 'COUNT',
        'CONTAR.VAL': 'COUNTA', NBVAL: 'COUNTA', CONTARA: 'COUNTA', COUNTA: 'COUNTA',
        'CONTAR.VAZIO': 'COUNTBLANK', NBVIDE: 'COUNTBLANK', 'CONTAR.BLANCO': 'COUNTBLANK', COUNTBLANK: 'COUNTBLANK',
        SE: 'IF', SI: 'IF', IF: 'IF',
        E: 'AND', ET: 'AND', Y: 'AND', AND: 'AND',
        OU: 'OR', O: 'OR', OR: 'OR',
        NAO: 'NOT', 'NÃO': 'NOT', NON: 'NOT', NO: 'NOT', NOT: 'NOT',
        'SOMA.SE': 'SUMIF', 'SOMME.SI': 'SUMIF', 'SUMAR.SI': 'SUMIF', SUMIF: 'SUMIF',
        'SOMA.SE.S': 'SUMIFS', 'SOMME.SI.ENS': 'SUMIFS', 'SUMAR.SI.CONJUNTO': 'SUMIFS', SUMIFS: 'SUMIFS',
        'CONTAR.SE': 'COUNTIF', 'NB.SI': 'COUNTIF', 'CONTAR.SI': 'COUNTIF', COUNTIF: 'COUNTIF',
        'CONTAR.SE.S': 'COUNTIFS', 'NB.SI.ENS': 'COUNTIFS', 'CONTAR.SI.CONJUNTO': 'COUNTIFS', COUNTIFS: 'COUNTIFS',
        ARRED: 'ROUND', ARRONDI: 'ROUND', REDONDEAR: 'ROUND', ROUND: 'ROUND',
        'ARRED.SUP': 'ROUNDUP', 'ARRONDI.SUP': 'ROUNDUP', 'REDONDEAR.MAS': 'ROUNDUP', ROUNDUP: 'ROUNDUP',
        'ARRED.INF': 'ROUNDDOWN', 'ARRONDI.INF': 'ROUNDDOWN', 'REDONDEAR.MENOS': 'ROUNDDOWN', ROUNDDOWN: 'ROUNDDOWN',
        ABS: 'ABS', INT: 'INT', ENTERO: 'INT', TRUNC: 'TRUNC', TRUNCAR: 'TRUNC', MOD: 'MOD', RESTO: 'MOD', RESIDUO: 'MOD',
        SINAL: 'SIGN', SIGNE: 'SIGN', SIGNO: 'SIGN', SIGN: 'SIGN',
        RAIZQ: 'SQRT', RACINE: 'SQRT', RAIZ: 'SQRT', SQRT: 'SQRT',
        POTENCIA: 'POWER', PUISSANCE: 'POWER', POWER: 'POWER',
        PRODUTO: 'PRODUCT', PRODUIT: 'PRODUCT', PRODUCTO: 'PRODUCT', PRODUCT: 'PRODUCT',
        SOMAPRODUTO: 'SUMPRODUCT', SOMMEPROD: 'SUMPRODUCT', SUMAPRODUCTO: 'SUMPRODUCT', SUMPRODUCT: 'SUMPRODUCT',
        ESQUERDA: 'LEFT', GAUCHE: 'LEFT', IZQUIERDA: 'LEFT', LEFT: 'LEFT',
        DIREITA: 'RIGHT', DROITE: 'RIGHT', DERECHA: 'RIGHT', RIGHT: 'RIGHT',
        'EXT.TEXTO': 'MID', STXT: 'MID', EXTRAE: 'MID', MID: 'MID',
        'NUM.CARAT': 'LEN', 'NÚM.CARACT': 'LEN', NBCAR: 'LEN', LARGO: 'LEN', LEN: 'LEN',
        CONCATENAR: 'CONCAT', CONCAT: 'CONCAT',
        'UNICAR': 'TEXTJOIN', JOINDRETEXTE: 'TEXTJOIN', UNIRCADENAS: 'TEXTJOIN', TEXTJOIN: 'TEXTJOIN',
        ARRUMAR: 'TRIM', SUPPRESPACE: 'TRIM', ESPACIOS: 'TRIM', TRIM: 'TRIM',
        MAIUSCULA: 'UPPER', MAJUSCULE: 'UPPER', MAYUSC: 'UPPER', UPPER: 'UPPER',
        MINUSCULA: 'LOWER', MINUSCULE: 'LOWER', MINUSC: 'LOWER', LOWER: 'LOWER',
        PRI: 'PROPER', NOMPROPRE: 'PROPER', NOMPROPIO: 'PROPER', PROPER: 'PROPER',
        SUBSTITUIR: 'SUBSTITUTE', SUBSTITUE: 'SUBSTITUTE', SUSTITUIR: 'SUBSTITUTE', SUBSTITUTE: 'SUBSTITUTE',
        LOCALIZAR: 'FIND', TROUVE: 'FIND', ENCONTRAR: 'FIND', FIND: 'FIND',
        PROCURAR: 'SEARCH', CHERCHE: 'SEARCH', HALLAR: 'SEARCH', SEARCH: 'SEARCH',
        TEXTO: 'TEXT', TEXTE: 'TEXT', TEXT: 'TEXT',
        VALOR: 'VALUE', CNUM: 'VALUE', VALUE: 'VALUE',
        HOJE: 'TODAY', AUJOURDHUI: 'TODAY', HOY: 'TODAY', TODAY: 'TODAY',
        AGORA: 'NOW', MAINTENANT: 'NOW', AHORA: 'NOW', NOW: 'NOW',
        DATA: 'DATE', DATE: 'DATE', FECHA: 'DATE',
        TEMPO: 'TIME', TEMPS: 'TIME', TIEMPO: 'TIME', TIME: 'TIME',
        ANO: 'YEAR', ANNEE: 'YEAR', 'AÑO': 'YEAR', YEAR: 'YEAR',
        MES: 'MONTH', 'MÊS': 'MONTH', MOIS: 'MONTH', MONTH: 'MONTH',
        DIA: 'DAY', JOUR: 'DAY', DAY: 'DAY',
        HORA: 'HOUR', HEURE: 'HOUR', HOUR: 'HOUR',
        MINUTO: 'MINUTE', MINUTE: 'MINUTE',
        SEGUNDO: 'SECOND', SECONDE: 'SECOND', SECOND: 'SECOND',
        'DIA.SEMANA': 'WEEKDAY', JOURSEM: 'WEEKDAY', DIASEM: 'WEEKDAY', WEEKDAY: 'WEEKDAY',
        SEERRO: 'IFERROR', SIERREUR: 'IFERROR', 'SI.ERROR': 'IFERROR', IFERROR: 'IFERROR',
        SENA: 'IFNA', SINA: 'IFNA', 'SI.ND': 'IFNA', IFNA: 'IFNA',
        ESEVAZIO: 'ISBLANK', ESTVIDE: 'ISBLANK', ESBLANCO: 'ISBLANK', ISBLANK: 'ISBLANK',
        ENUM: 'ISNUMBER', ESTNUM: 'ISNUMBER', ESNUMERO: 'ISNUMBER', ISNUMBER: 'ISNUMBER',
        ETEXTO: 'ISTEXT', ESTTEXTE: 'ISTEXT', ESTEXTO: 'ISTEXT', ISTEXT: 'ISTEXT',
        EERRO: 'ISERROR', ESTERREUR: 'ISERROR', ESERROR: 'ISERROR', ISERROR: 'ISERROR',
        ENA: 'ISNA', ESTNA: 'ISNA', ESNOD: 'ISNA', ISNA: 'ISNA',
        PROCV: 'VLOOKUP', RECHERCHEV: 'VLOOKUP', RECHERCHEX: 'VLOOKUP', BUSCARV: 'VLOOKUP', VLOOKUP: 'VLOOKUP', XLOOKUP: 'VLOOKUP',
        PROCH: 'HLOOKUP', RECHERCHEH: 'HLOOKUP', BUSCARH: 'HLOOKUP', HLOOKUP: 'HLOOKUP',
        INDICE: 'INDEX', INDEX: 'INDEX',
        CORRESP: 'MATCH', EQUIV: 'MATCH', COINCIDIR: 'MATCH', MATCH: 'MATCH',
        ESCOLHER: 'CHOOSE', CHOISIR: 'CHOOSE', ELEGIR: 'CHOOSE', CHOOSE: 'CHOOSE',
        COL: 'COLUMN', COLONNE: 'COLUMN', COLUMNA: 'COLUMN', COLUMN: 'COLUMN',
        LIN: 'ROW', LIGNE: 'ROW', FILA: 'ROW', ROW: 'ROW',
        COLS: 'COLUMNS', COLONNES: 'COLUMNS', COLUMNAS: 'COLUMNS', COLUMNS: 'COLUMNS',
        LINS: 'ROWS', LIGNES: 'ROWS', FILAS: 'ROWS', ROWS: 'ROWS',
        N: 'N', T: 'T',
        'NÃO.DISP': 'NA', ND: 'NA', NA: 'NA',
        PGTO: 'PMT', VPM: 'PMT', PAGO: 'PMT', PMT: 'PMT',
        VP: 'PV', VA: 'PV', PV: 'PV',
        VF: 'FV', VC: 'FV', FV: 'FV',
        NPER: 'NPER', NPM: 'NPER',
        TAXA: 'RATE', TAUX: 'RATE', TASA: 'RATE', RATE: 'RATE',
        VPL: 'NPV', VAN: 'NPV', VNA: 'NPV', NPV: 'NPV',
        TIR: 'IRR', TRI: 'IRR', IRR: 'IRR',
        IPGTO: 'IPMT', INTPER: 'IPMT', PAGOINT: 'IPMT', IPMT: 'IPMT',
        PPGTO: 'PPMT', PRINCPER: 'PPMT', PAGOPRIN: 'PPMT', PPMT: 'PPMT',
        BEZ: 'SLN', AMORLIN: 'SLN', SLN: 'SLN',
        SEN: 'SIN', SENO: 'SIN', SIN: 'SIN',
        COS: 'COS', TAN: 'TAN',
        ASEN: 'ASIN', ASENO: 'ASIN', ASIN: 'ASIN',
        ACOS: 'ACOS', ATAN: 'ATAN', ATAN2: 'ATAN2',
        RADIANOS: 'RADIANS', RADIANES: 'RADIANS', RADIANS: 'RADIANS',
        GRAUS: 'DEGREES', DEGRES: 'DEGREES', GRADOS: 'DEGREES', DEGREES: 'DEGREES',
        LN: 'LN', LOG: 'LOG', LOG10: 'LOG10', EXP: 'EXP', PI: 'PI',
        FATORIAL: 'FACT', FACTORIELLE: 'FACT', FACTORIAL: 'FACT', FACT: 'FACT',
        ALEATORIO: 'RAND', 'ALEATÓRIO': 'RAND', ALEA: 'RAND', RAND: 'RAND',
        'ALEATORIO.ENTRE': 'RANDBETWEEN', 'ALEATÓRIO.ENTRE': 'RANDBETWEEN',
        'ALEA.ENTRE.BORNES': 'RANDBETWEEN', RANDBETWEEN: 'RANDBETWEEN',
        TETO: 'CEILING', PLAFOND: 'CEILING', TECHO: 'CEILING', CEILING: 'CEILING',
        PISO: 'FLOOR', PLANCHER: 'FLOOR', FLOOR: 'FLOOR',
        PAR: 'EVEN', PAIR: 'EVEN', EVEN: 'EVEN',
        IMPAR: 'ODD', 'ÍMPAR': 'ODD', IMPAIR: 'ODD', ODD: 'ODD',
        MULTARRED: 'MROUND', 'ARRONDI.AU.MULTIPLE': 'MROUND', MROUND: 'MROUND',
        QUOCIENTE: 'QUOTIENT', QUOTIENT: 'QUOTIENT',
        MDC: 'GCD', PGCD: 'GCD', MCD: 'GCD', GCD: 'GCD',
        MMC: 'LCM', PPCM: 'LCM', MCM: 'LCM', LCM: 'LCM',
        COMBIN: 'COMBIN',
        SOMAQUAD: 'SUMSQ', 'SOMME.CARRES': 'SUMSQ', 'SUMA.CUADRADOS': 'SUMSQ', SUMSQ: 'SUMSQ',
        MEDIANA: 'MEDIAN', MEDIANE: 'MEDIAN', MEDIAN: 'MEDIAN',
        MODA: 'MODE', MODE: 'MODE',
        DESVPAD: 'STDEV', ECARTYPE: 'STDEV', DESVEST: 'STDEV', STDEV: 'STDEV', 'STDEV.S': 'STDEV',
        DESVPADP: 'STDEVP', ECARTYPEP: 'STDEVP', DESVESTP: 'STDEVP', STDEVP: 'STDEVP', 'STDEV.P': 'STDEVP',
        'VAR.S': 'VAR', VAR: 'VAR', VARP: 'VARP', 'VAR.P': 'VARP',
        MAIOR: 'LARGE', 'GRANDE.VALEUR': 'LARGE', 'K.ESIMO.MAYOR': 'LARGE', LARGE: 'LARGE',
        MENOR: 'SMALL', 'PETITE.VALEUR': 'SMALL', 'K.ESIMO.MENOR': 'SMALL', SMALL: 'SMALL',
        ORDEM: 'RANK', RANG: 'RANK', JERARQUIA: 'RANK', RANK: 'RANK',
        'MEDIA.SE': 'AVERAGEIF', 'MÉDIA.SE': 'AVERAGEIF', 'MOYENNE.SI': 'AVERAGEIF', 'PROMEDIO.SI': 'AVERAGEIF', AVERAGEIF: 'AVERAGEIF',
        'MEDIA.SE.S': 'AVERAGEIFS', 'MÉDIA.SE.S': 'AVERAGEIFS', 'MOYENNE.SI.ENS': 'AVERAGEIFS', AVERAGEIFS: 'AVERAGEIFS',
        XOR: 'XOR', 'O.EXCLUSIVO': 'XOR',
        SES: 'IFS', 'SI.CONDITIONS': 'IFS', 'SI.CONJUNTO': 'IFS', IFS: 'IFS',
        SWITCH: 'SWITCH',
        'SUBSTITUIR.CARACT': 'REPLACE', REMPLACER: 'REPLACE', REEMPLAZAR: 'REPLACE', REPLACE: 'REPLACE',
        REPT: 'REPT', REPETIR: 'REPT',
        EXATO: 'EXACT', IDENTIQUE: 'EXACT', EXACT: 'EXACT',
        LIMPAR: 'CLEAN', EPURAGE: 'CLEAN', LIMPIAR: 'CLEAN', CLEAN: 'CLEAN',
        CARACT: 'CHAR', CAR: 'CHAR', CARACTER: 'CHAR', CHAR: 'CHAR',
        CODIGO: 'CODE', 'CÓDIGO': 'CODE', CODE: 'CODE',
        DIAS: 'DAYS', JOURS: 'DAYS', DAYS: 'DAYS',
        DATAM: 'EDATE', 'MOIS.DECALER': 'EDATE', 'FECHA.MES': 'EDATE', EDATE: 'EDATE',
        'FIMMÊS': 'EOMONTH', FIMMES: 'EOMONTH', 'FIN.MOIS': 'EOMONTH', 'FIN.MES': 'EOMONTH', EOMONTH: 'EOMONTH',
        DIATRABALHO: 'NETWORKDAYS', 'NB.JOURS.OUVRES': 'NETWORKDAYS', 'DIAS.LAB': 'NETWORKDAYS', NETWORKDAYS: 'NETWORKDAYS',
        NUMSEMANA: 'WEEKNUM', 'NÚMSEMANA': 'WEEKNUM', 'NO.SEMAINE': 'WEEKNUM', 'NUM.DE.SEMANA': 'WEEKNUM', WEEKNUM: 'WEEKNUM',
        DATEDIF: 'DATEDIF',
        PROC: 'LOOKUP', RECHERCHE: 'LOOKUP', BUSCAR: 'LOOKUP', LOOKUP: 'LOOKUP',
        TIPO: 'TYPE', TYPE: 'TYPE',
        ELOGICO: 'ISLOGICAL', 'ELÓGICO': 'ISLOGICAL', ESTLOGIQUE: 'ISLOGICAL', ESLOGICO: 'ISLOGICAL', ISLOGICAL: 'ISLOGICAL',
        ENAOTEXTO: 'ISNONTEXT', 'ENAÕTEXTO': 'ISNONTEXT', ESTNONTEXTE: 'ISNONTEXT', ESNOTEXTO: 'ISNONTEXT', ISNONTEXT: 'ISNONTEXT',
        VERDADEIRO: 'TRUE', VRAI: 'TRUE', VERDADERO: 'TRUE', TRUE: 'TRUE',
        FALSO: 'FALSE', FAUX: 'FALSE', FALSE: 'FALSE'
    };

    function colName(i) {
        var s = '', n = i + 1;
        while (n > 0) {
            var m = (n - 1) % 26;
            s = String.fromCharCode(65 + m) + s;
            n = Math.floor((n - 1) / 26);
        }
        return s;
    }
    function colIndex(name) {
        var n = 0, i, ch;
        name = String(name || '').toUpperCase();
        for (i = 0; i < name.length; i++) {
            ch = name.charCodeAt(i);
            if (ch < 65 || ch > 90) return -1;
            n = n * 26 + (ch - 64);
        }
        return n - 1;
    }
    function a1(c, r) { return colName(c) + (r + 1); }
    function parseA1(ref) {
        var m = String(ref || '').toUpperCase().match(/^(\$?)([A-Z]+)(\$?)(\d+)$/);
        if (!m) return null;
        return {
            c: colIndex(m[2]),
            r: Number(m[4]) - 1,
            absC: m[1] === '$',
            absR: m[3] === '$'
        };
    }
    function err(code) {
        var e = new Error(code);
        e.excel = code;
        return e;
    }
    function isErr(v) { return v && typeof v === 'object' && v.excel; }
    function isNA(v) { return isErr(v) && v.excel === '#N/A'; }
    function asDate(v) {
        if (v instanceof Date) return v;
        if (typeof v === 'number') {
            var d = new Date(Math.round((v - 25569) * 86400000));
            if (!isNaN(d.getTime())) return d;
        }
        var d2 = new Date(v);
        if (!isNaN(d2.getTime())) return d2;
        throw err('#VALUE!');
    }
    function num(v) {
        if (v == null || v === '') return 0;
        if (typeof v === 'number') return v;
        if (typeof v === 'boolean') return v ? 1 : 0;
        if (v instanceof Date) return v.getTime() / 86400000 + 25569;
        if (isErr(v)) throw v;
        var s = String(v).trim().replace(/\s/g, '').replace('%', '');
        if (!s) return 0;
        if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) s = s.replace(/\./g, '').replace(',', '.');
        else s = s.replace(',', '.');
        var n = Number(s);
        if (isNaN(n)) throw err('#VALUE!');
        if (String(v).indexOf('%') >= 0) n /= 100;
        return n;
    }
    function asText(v) {
        if (v == null) return '';
        if (isErr(v)) throw v;
        if (v instanceof Date) {
            var y = v.getFullYear(), mo = v.getMonth() + 1, da = v.getDate();
            return (da < 10 ? '0' : '') + da + '/' + (mo < 10 ? '0' : '') + mo + '/' + y;
        }
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        return String(v);
    }
    function flatten(args) {
        var out = [];
        function walk(a) {
            if (Array.isArray(a)) a.forEach(walk);
            else out.push(a);
        }
        (args || []).forEach(walk);
        return out;
    }
    function asMatrix(a) {
        if (Array.isArray(a) && a.length && Array.isArray(a[0])) return a;
        if (Array.isArray(a)) return [a];
        return [[a]];
    }
    function roundN(n, d) {
        var p = Math.pow(10, d == null ? 0 : d);
        return Math.round((n + Number.EPSILON) * p) / p;
    }
    function truthy(v) {
        if (v === 0 || v === '' || v == null || v === false) return false;
        return Boolean(v);
    }
    function factN(n) {
        n = Math.floor(num(n));
        if (n < 0 || n > 170) throw err('#NUM!');
        var f = 1, i;
        for (i = 2; i <= n; i++) f *= i;
        return f;
    }
    function gcd2(a, b) {
        a = Math.abs(Math.floor(a)); b = Math.abs(Math.floor(b));
        while (b) { var t = b; b = a % b; a = t; }
        return a;
    }
    function numsOnly(a) {
        var out = [];
        flatten(a).forEach(function (v) {
            if (v === '' || v == null) return;
            try { out.push(num(v)); } catch (e) {}
        });
        return out;
    }
    function meanOf(vals) {
        if (!vals.length) throw err('#DIV/0!');
        var s = 0, i;
        for (i = 0; i < vals.length; i++) s += vals[i];
        return s / vals.length;
    }
    function varianceOf(vals, pop) {
        if (vals.length < (pop ? 1 : 2)) throw err('#DIV/0!');
        var m = meanOf(vals), s = 0, i;
        for (i = 0; i < vals.length; i++) s += (vals[i] - m) * (vals[i] - m);
        return s / (vals.length - (pop ? 0 : 1));
    }
    function addMonths(d, months) {
        var dt = asDate(d);
        var x = new Date(dt.getFullYear(), dt.getMonth() + months, dt.getDate());
        if (x.getDate() !== dt.getDate()) x = new Date(dt.getFullYear(), dt.getMonth() + months + 1, 0);
        return x;
    }
    function serialDay(d) {
        return Math.floor(num(d instanceof Date ? d : asDate(d)));
    }
    function pmtCore(rate, nper, pv, fv, type) {
        fv = fv || 0; type = type ? 1 : 0;
        if (!nper) throw err('#NUM!');
        if (Math.abs(rate) < 1e-12) return -(pv + fv) / nper;
        var pvif = Math.pow(1 + rate, nper);
        return -(rate * (pv * pvif + fv)) / ((1 + rate * type) * (pvif - 1));
    }
    function pvCore(rate, nper, pmt, fv, type) {
        fv = fv || 0; type = type ? 1 : 0;
        if (Math.abs(rate) < 1e-12) return -pmt * nper - fv;
        var pvif = Math.pow(1 + rate, nper);
        return (-pmt * (1 + rate * type) * (pvif - 1) / rate - fv) / pvif;
    }
    function fvCore(rate, nper, pmt, pv, type) {
        pv = pv || 0; type = type ? 1 : 0;
        if (Math.abs(rate) < 1e-12) return -pv - pmt * nper;
        var pvif = Math.pow(1 + rate, nper);
        return -pv * pvif - pmt * (1 + rate * type) * (pvif - 1) / rate;
    }
    function nperCore(rate, pmt, pv, fv, type) {
        fv = fv || 0; type = type ? 1 : 0;
        if (Math.abs(rate) < 1e-12) {
            if (!pmt) throw err('#NUM!');
            return -(pv + fv) / pmt;
        }
        var a = pmt * (1 + rate * type);
        var nume = a - fv * rate;
        var deno = pv * rate + a;
        if (nume === 0 || deno === 0 || nume / deno <= 0) throw err('#NUM!');
        return Math.log(nume / deno) / Math.log(1 + rate);
    }
    function rateCore(nper, pmt, pv, fv, type) {
        fv = fv || 0; type = type ? 1 : 0;
        var guess = 0.1, i, y, y2, dy, h, g2, f2, f;
        for (i = 0; i < 50; i++) {
            if (Math.abs(guess) < 1e-12) y = pv + pmt * nper + fv;
            else {
                f = Math.pow(1 + guess, nper);
                y = pv * f + pmt * (1 + guess * type) * (f - 1) / guess + fv;
            }
            if (Math.abs(y) < 1e-8) return guess;
            h = (Math.abs(guess) < 1e-8 ? 1e-6 : Math.abs(guess) * 1e-4);
            g2 = guess + h;
            f2 = Math.pow(1 + g2, nper);
            y2 = pv * f2 + pmt * (1 + g2 * type) * (f2 - 1) / g2 + fv;
            dy = (y2 - y) / h;
            if (Math.abs(dy) < 1e-14) break;
            guess -= y / dy;
            if (guess <= -0.999999) guess = -0.99;
        }
        throw err('#NUM!');
    }
    function irrCore(cfs, guess) {
        var r = guess == null ? 0.1 : num(guess), i, t, npv, dnpv, nr;
        for (i = 0; i < 50; i++) {
            if (r <= -0.999999) r = -0.99;
            npv = 0; dnpv = 0;
            for (t = 0; t < cfs.length; t++) {
                npv += cfs[t] / Math.pow(1 + r, t);
                dnpv -= t * cfs[t] / Math.pow(1 + r, t + 1);
            }
            if (Math.abs(npv) < 1e-8) return r;
            if (Math.abs(dnpv) < 1e-14) break;
            nr = r - npv / dnpv;
            if (Math.abs(nr - r) < 1e-10) return nr;
            r = nr;
        }
        throw err('#NUM!');
    }

    var FUNCS = {
        SUM: function (a) {
            var s = 0;
            flatten(a).forEach(function (v) {
                if (v === '' || v == null) return;
                try { s += num(v); } catch (e) {}
            });
            return s;
        },
        AVERAGE: function (a) {
            var s = 0, n = 0;
            flatten(a).forEach(function (v) {
                if (v === '' || v == null) return;
                try { s += num(v); n++; } catch (e) {}
            });
            if (!n) throw err('#DIV/0!');
            return s / n;
        },
        MIN: function (a) {
            var vals = flatten(a).filter(function (v) { return v !== '' && v != null; }).map(num);
            if (!vals.length) throw err('#VALUE!');
            return Math.min.apply(null, vals);
        },
        MAX: function (a) {
            var vals = flatten(a).filter(function (v) { return v !== '' && v != null; }).map(num);
            if (!vals.length) throw err('#VALUE!');
            return Math.max.apply(null, vals);
        },
        COUNT: function (a) {
            var n = 0;
            flatten(a).forEach(function (v) {
                if (v === '' || v == null) return;
                try { num(v); n++; } catch (e) {}
            });
            return n;
        },
        COUNTA: function (a) {
            return flatten(a).filter(function (v) { return v !== '' && v != null; }).length;
        },
        COUNTBLANK: function (a) {
            return flatten(a).filter(function (v) { return v === '' || v == null; }).length;
        },
        IF: function (a) { return truthy(a[0]) ? a[1] : (a.length > 2 ? a[2] : false); },
        AND: function (a) { return flatten(a).every(truthy); },
        OR: function (a) { return flatten(a).some(truthy); },
        NOT: function (a) { return !truthy(a[0]); },
        ROUND: function (a) { return roundN(num(a[0]), num(a[1] || 0)); },
        ROUNDUP: function (a) {
            var n = num(a[0]), d = num(a[1] || 0), p = Math.pow(10, d);
            return (n >= 0 ? Math.ceil(n * p - 1e-12) : Math.floor(n * p + 1e-12)) / p;
        },
        ROUNDDOWN: function (a) {
            var n = num(a[0]), d = num(a[1] || 0), p = Math.pow(10, d);
            return (n >= 0 ? Math.floor(n * p + 1e-12) : Math.ceil(n * p - 1e-12)) / p;
        },
        ABS: function (a) { return Math.abs(num(a[0])); },
        INT: function (a) { return Math.floor(num(a[0])); },
        TRUNC: function (a) {
            var n = num(a[0]), d = num(a[1] || 0), p = Math.pow(10, d);
            return (n < 0 ? Math.ceil : Math.floor)(n * p) / p;
        },
        MOD: function (a) {
            var n = num(a[0]), d = num(a[1]);
            if (!d) throw err('#DIV/0!');
            return n - d * Math.floor(n / d);
        },
        SIGN: function (a) { var n = num(a[0]); return n > 0 ? 1 : n < 0 ? -1 : 0; },
        SQRT: function (a) { var n = num(a[0]); if (n < 0) throw err('#NUM!'); return Math.sqrt(n); },
        POWER: function (a) { return Math.pow(num(a[0]), num(a[1])); },
        PRODUCT: function (a) {
            var p = 1, n = 0;
            flatten(a).forEach(function (v) {
                if (v === '' || v == null) return;
                p *= num(v); n++;
            });
            return n ? p : 0;
        },
        SUMPRODUCT: function (a) {
            if (a.length < 1) return 0;
            var mats = a.map(function (x) { return flatten([x]); });
            var len = mats[0].length, s = 0, i, k, p;
            for (i = 0; i < len; i++) {
                p = 1;
                for (k = 0; k < mats.length; k++) p *= num(mats[k][i] == null ? 0 : mats[k][i]);
                s += p;
            }
            return s;
        },
        LEFT: function (a) { return asText(a[0]).slice(0, num(a[1] || 1)); },
        RIGHT: function (a) { var s = asText(a[0]); var n = num(a[1] || 1); return s.slice(Math.max(0, s.length - n)); },
        MID: function (a) { return asText(a[0]).substr(Math.max(0, num(a[1]) - 1), num(a[2] || 0)); },
        LEN: function (a) { return asText(a[0]).length; },
        CONCAT: function (a) { return flatten(a).map(asText).join(''); },
        TEXTJOIN: function (a) {
            var sep = asText(a[0]), skip = truthy(a[1]);
            var parts = flatten(a.slice(2)).filter(function (v) { return !skip || (v !== '' && v != null); });
            return parts.map(asText).join(sep);
        },
        TRIM: function (a) { return asText(a[0]).replace(/\s+/g, ' ').trim(); },
        UPPER: function (a) { return asText(a[0]).toUpperCase(); },
        LOWER: function (a) { return asText(a[0]).toLowerCase(); },
        PROPER: function (a) {
            return asText(a[0]).toLowerCase().replace(/(^|[^A-Za-zÀ-ÿ])([A-Za-zÀ-ÿ])/g, function (m, a, b) { return a + b.toUpperCase(); });
        },
        SUBSTITUTE: function (a) {
            var s = asText(a[0]), old = asText(a[1]), neu = asText(a[2]);
            if (a[3] != null) {
                var nth = num(a[3]), i = 0, idx = -1, from = 0;
                while (i < nth) {
                    idx = s.indexOf(old, from);
                    if (idx < 0) return s;
                    i++; from = idx + old.length;
                }
                return s.slice(0, idx) + neu + s.slice(idx + old.length);
            }
            return s.split(old).join(neu);
        },
        FIND: function (a) {
            var f = asText(a[0]), s = asText(a[1]), st = Math.max(1, num(a[2] || 1));
            var i = s.indexOf(f, st - 1);
            if (i < 0) throw err('#VALUE!');
            return i + 1;
        },
        SEARCH: function (a) {
            var f = asText(a[0]).toLowerCase(), s = asText(a[1]).toLowerCase(), st = Math.max(1, num(a[2] || 1));
            var i = s.indexOf(f, st - 1);
            if (i < 0) throw err('#VALUE!');
            return i + 1;
        },
        TEXT: function (a) {
            var v = a[0], fmt = asText(a[1] || '0');
            if (v instanceof Date || /[dmyh]/i.test(fmt)) {
                var d = asDate(v);
                var map = {
                    yyyy: d.getFullYear(),
                    yy: String(d.getFullYear()).slice(-2),
                    mm: ('0' + (d.getMonth() + 1)).slice(-2),
                    dd: ('0' + d.getDate()).slice(-2),
                    hh: ('0' + d.getHours()).slice(-2),
                    ss: ('0' + d.getSeconds()).slice(-2)
                };
                map.m = d.getMonth() + 1;
                map.d = d.getDate();
                map.h = d.getHours();
                var out = fmt;
                ['yyyy', 'yy', 'mm', 'dd', 'hh', 'ss'].forEach(function (k) {
                    out = out.replace(new RegExp(k, 'g'), map[k]);
                });
                return out;
            }
            var n = num(v);
            var dec = (fmt.match(/0\.(0+)/) || [])[1];
            if (fmt.indexOf('%') >= 0) return (n * 100).toFixed(dec ? dec.length : 0).replace('.', ',') + '%';
            if (fmt.indexOf('€') >= 0 || /[#0].*[,.]/.test(fmt)) return n.toFixed(dec ? dec.length : 2).replace('.', ',');
            if (dec) return n.toFixed(dec.length);
            return String(Math.round(n));
        },
        VALUE: function (a) { return num(a[0]); },
        TODAY: function () { var d = new Date(); d.setHours(0, 0, 0, 0); return d; },
        NOW: function () { return new Date(); },
        DATE: function (a) { return new Date(num(a[0]), num(a[1]) - 1, num(a[2])); },
        TIME: function (a) {
            var d = new Date(1899, 11, 30);
            d.setHours(num(a[0] || 0), num(a[1] || 0), num(a[2] || 0), 0);
            return d;
        },
        YEAR: function (a) { return asDate(a[0]).getFullYear(); },
        MONTH: function (a) { return asDate(a[0]).getMonth() + 1; },
        DAY: function (a) { return asDate(a[0]).getDate(); },
        HOUR: function (a) { return asDate(a[0]).getHours(); },
        MINUTE: function (a) { return asDate(a[0]).getMinutes(); },
        SECOND: function (a) { return asDate(a[0]).getSeconds(); },
        WEEKDAY: function (a) {
            var d = asDate(a[0]).getDay();
            var typ = num(a[1] || 1);
            if (typ === 1) return d + 1;
            if (typ === 2) return d === 0 ? 7 : d;
            return d;
        },
        IFERROR: function (a) { return isErr(a[0]) ? a[1] : a[0]; },
        IFNA: function (a) { return isNA(a[0]) ? a[1] : a[0]; },
        ISBLANK: function (a) { return a[0] == null || a[0] === ''; },
        ISNUMBER: function (a) { return typeof a[0] === 'number' && !isNaN(a[0]); },
        ISTEXT: function (a) { return typeof a[0] === 'string'; },
        ISERROR: function (a) { return isErr(a[0]); },
        ISNA: function (a) { return isNA(a[0]); },
        NA: function () { throw err('#N/A'); },
        N: function (a) { try { return num(a[0]); } catch (e) { return 0; } },
        T: function (a) { return typeof a[0] === 'string' ? a[0] : ''; },
        SUMIF: function (a) {
            var range = flatten([a[0]]);
            var crit = a[1];
            var sumR = a[2] != null ? flatten([a[2]]) : range;
            var s = 0, i;
            for (i = 0; i < range.length; i++) {
                if (matchCrit(range[i], crit)) s += num(sumR[i] != null ? sumR[i] : 0);
            }
            return s;
        },
        COUNTIF: function (a) {
            var range = flatten([a[0]]);
            var n = 0;
            range.forEach(function (v) { if (matchCrit(v, a[1])) n++; });
            return n;
        },
        SUMIFS: function (a) {
            var sumR = flatten([a[0]]);
            var s = 0, i, ok, k;
            for (i = 0; i < sumR.length; i++) {
                ok = true;
                for (k = 1; k < a.length; k += 2) {
                    var rng = flatten([a[k]]);
                    if (!matchCrit(rng[i], a[k + 1])) { ok = false; break; }
                }
                if (ok) s += num(sumR[i] || 0);
            }
            return s;
        },
        COUNTIFS: function (a) {
            var first = flatten([a[0]]);
            var n = 0, i, ok, k;
            for (i = 0; i < first.length; i++) {
                ok = true;
                for (k = 0; k < a.length; k += 2) {
                    var rng = flatten([a[k]]);
                    if (!matchCrit(rng[i], a[k + 1])) { ok = false; break; }
                }
                if (ok) n++;
            }
            return n;
        },
        VLOOKUP: function (a) {
            var look = a[0];
            var rows = asMatrix(a[1]);
            var col = Math.max(1, num(a[2] || 1));
            var exact = a[3] === false || a[3] === 0;
            var i, r;
            for (i = 0; i < rows.length; i++) {
                r = Array.isArray(rows[i]) ? rows[i] : [rows[i]];
                if (exact ? String(r[0]) === String(look) : String(r[0]).indexOf(String(look)) === 0) {
                    return r[col - 1] != null ? r[col - 1] : '';
                }
            }
            throw err('#N/A');
        },
        HLOOKUP: function (a) {
            var look = a[0];
            var rows = asMatrix(a[1]);
            var row = Math.max(1, num(a[2] || 1));
            var exact = a[3] === false || a[3] === 0;
            var header = rows[0] || [];
            var i;
            for (i = 0; i < header.length; i++) {
                if (exact ? String(header[i]) === String(look) : String(header[i]).indexOf(String(look)) === 0) {
                    return (rows[row - 1] && rows[row - 1][i] != null) ? rows[row - 1][i] : '';
                }
            }
            throw err('#N/A');
        },
        INDEX: function (a) {
            var mat = asMatrix(a[0]);
            var r = Math.max(1, num(a[1] || 1));
            var c = a[2] != null ? Math.max(1, num(a[2])) : 1;
            var row = mat[r - 1];
            if (!row) throw err('#REF!');
            if (a[2] == null && row.length === 1) return row[0];
            if (row[c - 1] == null && row[c - 1] !== 0) throw err('#REF!');
            return row[c - 1];
        },
        MATCH: function (a) {
            var look = a[0];
            var rng = flatten([a[1]]);
            var typ = a[2] == null ? 1 : num(a[2]);
            var i;
            if (typ === 0) {
                for (i = 0; i < rng.length; i++) if (String(rng[i]) === String(look)) return i + 1;
                throw err('#N/A');
            }
            for (i = 0; i < rng.length; i++) if (String(rng[i]) === String(look)) return i + 1;
            throw err('#N/A');
        },
        CHOOSE: function (a) {
            var i = Math.floor(num(a[0]));
            if (i < 1 || i >= a.length) throw err('#VALUE!');
            return a[i];
        },
        COLUMN: function (a, ctx) {
            if (ctx && ctx.origin) return ctx.origin.c + 1;
            return 1;
        },
        ROW: function (a, ctx) {
            if (ctx && ctx.origin) return ctx.origin.r + 1;
            return 1;
        },
        COLUMNS: function (a) { return asMatrix(a[0])[0].length; },
        ROWS: function (a) { return asMatrix(a[0]).length; },
        TRUE: function () { return true; },
        FALSE: function () { return false; },
        XOR: function (a) {
            var n = 0;
            flatten(a).forEach(function (v) { if (truthy(v)) n++; });
            return n % 2 === 1;
        },
        IFS: function (a) {
            var i;
            for (i = 0; i + 1 < a.length; i += 2) {
                if (truthy(a[i])) return a[i + 1];
            }
            throw err('#N/A');
        },
        SWITCH: function (a) {
            var expr = a[0], i;
            for (i = 1; i + 1 < a.length; i += 2) {
                if (String(a[i]) === String(expr)) return a[i + 1];
            }
            if (a.length % 2 === 0) return a[a.length - 1];
            throw err('#N/A');
        },
        PI: function () { return Math.PI; },
        SIN: function (a) { return Math.sin(num(a[0])); },
        COS: function (a) { return Math.cos(num(a[0])); },
        TAN: function (a) { return Math.tan(num(a[0])); },
        ASIN: function (a) {
            var n = num(a[0]);
            if (n < -1 || n > 1) throw err('#NUM!');
            return Math.asin(n);
        },
        ACOS: function (a) {
            var n = num(a[0]);
            if (n < -1 || n > 1) throw err('#NUM!');
            return Math.acos(n);
        },
        ATAN: function (a) { return Math.atan(num(a[0])); },
        ATAN2: function (a) { return Math.atan2(num(a[1]), num(a[0])); },
        RADIANS: function (a) { return num(a[0]) * Math.PI / 180; },
        DEGREES: function (a) { return num(a[0]) * 180 / Math.PI; },
        LN: function (a) {
            var n = num(a[0]);
            if (n <= 0) throw err('#NUM!');
            return Math.log(n);
        },
        LOG: function (a) {
            var n = num(a[0]);
            if (n <= 0) throw err('#NUM!');
            var b = a[1] != null ? num(a[1]) : 10;
            if (b <= 0 || b === 1) throw err('#NUM!');
            return Math.log(n) / Math.log(b);
        },
        LOG10: function (a) {
            var n = num(a[0]);
            if (n <= 0) throw err('#NUM!');
            return Math.log(n) / Math.LN10;
        },
        EXP: function (a) { return Math.exp(num(a[0])); },
        FACT: function (a) { return factN(a[0]); },
        RAND: function () { return Math.random(); },
        RANDBETWEEN: function (a) {
            var lo = Math.ceil(num(a[0])), hi = Math.floor(num(a[1]));
            if (lo > hi) throw err('#NUM!');
            return lo + Math.floor(Math.random() * (hi - lo + 1));
        },
        CEILING: function (a) {
            var n = num(a[0]), s = a[1] != null ? num(a[1]) : 1;
            if (!s) throw err('#DIV/0!');
            return Math.ceil(n / s - 1e-12) * s;
        },
        FLOOR: function (a) {
            var n = num(a[0]), s = a[1] != null ? num(a[1]) : 1;
            if (!s) throw err('#DIV/0!');
            return Math.floor(n / s + 1e-12) * s;
        },
        EVEN: function (a) {
            var n = num(a[0]);
            if (n === 0) return 0;
            var e = n > 0 ? Math.ceil(n) : Math.floor(n);
            if (e % 2 === 0) return e;
            return e + (n > 0 ? 1 : -1);
        },
        ODD: function (a) {
            var n = num(a[0]);
            var e = n >= 0 ? Math.ceil(n) : Math.floor(n);
            if (e % 2 !== 0) return e;
            return e + (n >= 0 ? 1 : -1);
        },
        MROUND: function (a) {
            var n = num(a[0]), s = num(a[1]);
            if (!s) return 0;
            return Math.round(n / s) * s;
        },
        QUOTIENT: function (a) {
            var d = num(a[1]);
            if (!d) throw err('#DIV/0!');
            return (num(a[0]) < 0 ? Math.ceil : Math.floor)(num(a[0]) / d);
        },
        GCD: function (a) {
            var vals = numsOnly(a).map(function (n) { return Math.abs(Math.floor(n)); });
            if (!vals.length) throw err('#VALUE!');
            return vals.reduce(gcd2);
        },
        LCM: function (a) {
            var vals = numsOnly(a).map(function (n) { return Math.abs(Math.floor(n)); });
            if (!vals.length) throw err('#VALUE!');
            return vals.reduce(function (x, y) { return (!x || !y) ? 0 : Math.abs(x / gcd2(x, y) * y); });
        },
        COMBIN: function (a) {
            var n = Math.floor(num(a[0])), k = Math.floor(num(a[1]));
            if (n < 0 || k < 0 || k > n) throw err('#NUM!');
            k = Math.min(k, n - k);
            var c = 1, i;
            for (i = 1; i <= k; i++) c = c * (n - k + i) / i;
            return Math.round(c);
        },
        SUMSQ: function (a) {
            var s = 0;
            numsOnly(a).forEach(function (n) { s += n * n; });
            return s;
        },
        MEDIAN: function (a) {
            var vals = numsOnly(a).sort(function (x, y) { return x - y; });
            if (!vals.length) throw err('#NUM!');
            var m = Math.floor(vals.length / 2);
            return vals.length % 2 ? vals[m] : (vals[m - 1] + vals[m]) / 2;
        },
        MODE: function (a) {
            var vals = numsOnly(a), map = {}, i, best = null, bestN = 0;
            for (i = 0; i < vals.length; i++) {
                map[vals[i]] = (map[vals[i]] || 0) + 1;
                if (map[vals[i]] > bestN) { bestN = map[vals[i]]; best = vals[i]; }
            }
            if (bestN < 2) throw err('#N/A');
            return best;
        },
        STDEV: function (a) { return Math.sqrt(varianceOf(numsOnly(a), false)); },
        STDEVP: function (a) { return Math.sqrt(varianceOf(numsOnly(a), true)); },
        VAR: function (a) { return varianceOf(numsOnly(a), false); },
        VARP: function (a) { return varianceOf(numsOnly(a), true); },
        LARGE: function (a) {
            var vals = numsOnly([a[0]]).sort(function (x, y) { return y - x; });
            var k = Math.floor(num(a[1]));
            if (k < 1 || k > vals.length) throw err('#NUM!');
            return vals[k - 1];
        },
        SMALL: function (a) {
            var vals = numsOnly([a[0]]).sort(function (x, y) { return x - y; });
            var k = Math.floor(num(a[1]));
            if (k < 1 || k > vals.length) throw err('#NUM!');
            return vals[k - 1];
        },
        RANK: function (a) {
            var n = num(a[0]);
            var vals = numsOnly([a[1]]);
            var order = a[2] != null ? num(a[2]) : 0;
            var sorted = vals.slice().sort(function (x, y) { return order ? x - y : y - x; });
            var i;
            for (i = 0; i < sorted.length; i++) if (sorted[i] === n) return i + 1;
            throw err('#N/A');
        },
        AVERAGEIF: function (a) {
            var range = flatten([a[0]]);
            var avgR = a[2] != null ? flatten([a[2]]) : range;
            var s = 0, n = 0, i;
            for (i = 0; i < range.length; i++) {
                if (matchCrit(range[i], a[1])) {
                    try { s += num(avgR[i] != null ? avgR[i] : 0); n++; } catch (e) {}
                }
            }
            if (!n) throw err('#DIV/0!');
            return s / n;
        },
        AVERAGEIFS: function (a) {
            var avgR = flatten([a[0]]);
            var s = 0, n = 0, i, ok, k;
            for (i = 0; i < avgR.length; i++) {
                ok = true;
                for (k = 1; k < a.length; k += 2) {
                    if (!matchCrit(flatten([a[k]])[i], a[k + 1])) { ok = false; break; }
                }
                if (ok) { try { s += num(avgR[i] || 0); n++; } catch (e) {} }
            }
            if (!n) throw err('#DIV/0!');
            return s / n;
        },
        PMT: function (a) { return pmtCore(num(a[0]), num(a[1]), num(a[2]), a[3] != null ? num(a[3]) : 0, a[4] != null ? num(a[4]) : 0); },
        PV: function (a) { return pvCore(num(a[0]), num(a[1]), num(a[2]), a[3] != null ? num(a[3]) : 0, a[4] != null ? num(a[4]) : 0); },
        FV: function (a) { return fvCore(num(a[0]), num(a[1]), num(a[2]), a[3] != null ? num(a[3]) : 0, a[4] != null ? num(a[4]) : 0); },
        NPER: function (a) { return nperCore(num(a[0]), num(a[1]), num(a[2]), a[3] != null ? num(a[3]) : 0, a[4] != null ? num(a[4]) : 0); },
        RATE: function (a) { return rateCore(num(a[0]), num(a[1]), num(a[2]), a[3] != null ? num(a[3]) : 0, a[4] != null ? num(a[4]) : 0); },
        NPV: function (a) {
            var rate = num(a[0]), s = 0, i, vals = flatten(a.slice(1));
            for (i = 0; i < vals.length; i++) s += num(vals[i] || 0) / Math.pow(1 + rate, i + 1);
            return s;
        },
        IRR: function (a) { return irrCore(numsOnly([a[0]]), a[1]); },
        IPMT: function (a) {
            var rate = num(a[0]), per = num(a[1]), nper = num(a[2]), pv = num(a[3]);
            var fv = a[4] != null ? num(a[4]) : 0, type = a[5] != null ? num(a[5]) : 0;
            var pmt = pmtCore(rate, nper, pv, fv, type);
            var ip = fvCore(rate, per - 1, pmt, pv, type) * rate;
            return type && per === 1 ? 0 : ip;
        },
        PPMT: function (a) {
            var pmt = pmtCore(num(a[0]), num(a[2]), num(a[3]), a[4] != null ? num(a[4]) : 0, a[5] != null ? num(a[5]) : 0);
            return pmt - FUNCS.IPMT(a);
        },
        SLN: function (a) {
            var life = num(a[2]);
            if (!life) throw err('#DIV/0!');
            return (num(a[0]) - num(a[1])) / life;
        },
        REPLACE: function (a) {
            var s = asText(a[0]), start = Math.max(1, Math.floor(num(a[1]))), n = Math.max(0, Math.floor(num(a[2])));
            return s.slice(0, start - 1) + asText(a[3]) + s.slice(start - 1 + n);
        },
        REPT: function (a) {
            var n = Math.floor(num(a[1]));
            if (n < 0) throw err('#VALUE!');
            if (n > 10000) n = 10000;
            return asText(a[0]).repeat ? asText(a[0]).repeat(n) : new Array(n + 1).join(asText(a[0]));
        },
        EXACT: function (a) { return asText(a[0]) === asText(a[1]); },
        CLEAN: function (a) { return asText(a[0]).replace(/[\x00-\x1F]/g, ''); },
        CHAR: function (a) {
            var n = Math.floor(num(a[0]));
            if (n < 1 || n > 255) throw err('#VALUE!');
            return String.fromCharCode(n);
        },
        CODE: function (a) {
            var s = asText(a[0]);
            if (!s) throw err('#VALUE!');
            return s.charCodeAt(0);
        },
        DAYS: function (a) { return serialDay(a[0]) - serialDay(a[1]); },
        EDATE: function (a) { return addMonths(a[0], Math.floor(num(a[1]))); },
        EOMONTH: function (a) {
            var d = addMonths(a[0], Math.floor(num(a[1])));
            return new Date(d.getFullYear(), d.getMonth() + 1, 0);
        },
        NETWORKDAYS: function (a) {
            var d0 = asDate(a[0]), d1 = asDate(a[1]);
            if (d0 > d1) { var tmp = d0; d0 = d1; d1 = tmp; }
            var n = 0, hol = {};
            flatten(a.slice(2)).forEach(function (h) {
                try { hol[serialDay(h)] = true; } catch (e) {}
            });
            var cur = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate());
            var end = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
            while (cur <= end) {
                var wd = cur.getDay();
                if (wd !== 0 && wd !== 6 && !hol[serialDay(cur)]) n++;
                cur.setDate(cur.getDate() + 1);
            }
            return n;
        },
        WEEKNUM: function (a) {
            var d = asDate(a[0]);
            var typ = a[1] != null ? num(a[1]) : 1;
            var jan1 = new Date(d.getFullYear(), 0, 1);
            var day = Math.floor((d - jan1) / 86400000);
            var start = typ === 2 ? (jan1.getDay() === 0 ? 6 : jan1.getDay() - 1) : jan1.getDay();
            return Math.floor((day + start) / 7) + 1;
        },
        DATEDIF: function (a) {
            var s = asDate(a[0]), e = asDate(a[1]);
            if (e < s) throw err('#NUM!');
            var u = asText(a[2] || 'd').toLowerCase();
            var y = e.getFullYear() - s.getFullYear();
            var m = e.getMonth() - s.getMonth();
            var d = e.getDate() - s.getDate();
            if (u === 'y') { if (m < 0 || (m === 0 && d < 0)) y--; return y; }
            if (u === 'm') { var mm = y * 12 + m; if (d < 0) mm--; return mm; }
            if (u === 'd') return Math.round((e - s) / 86400000);
            if (u === 'ym') { if (d < 0) m--; m = (m + 12) % 12; return m; }
            if (u === 'yd') {
                var mid = new Date(s.getFullYear(), e.getMonth(), e.getDate());
                if (mid < s) mid.setFullYear(mid.getFullYear() + 1);
                return Math.round((mid - s) / 86400000);
            }
            if (u === 'md') {
                if (d >= 0) return d;
                var prev = new Date(e.getFullYear(), e.getMonth(), 0).getDate();
                return prev + d;
            }
            throw err('#VALUE!');
        },
        LOOKUP: function (a) {
            var look = a[0];
            var vec = flatten([a[1]]);
            var res = a[2] != null ? flatten([a[2]]) : vec;
            var i, last = -1;
            for (i = 0; i < vec.length; i++) {
                try {
                    if (num(vec[i]) <= num(look)) last = i;
                    else break;
                } catch (e) {
                    if (String(vec[i]) <= String(look)) last = i;
                    else break;
                }
            }
            if (last < 0) throw err('#N/A');
            return res[last] != null ? res[last] : '';
        },
        TYPE: function (a) {
            var v = a[0];
            if (v == null || v === '') return 1;
            if (typeof v === 'number') return 1;
            if (typeof v === 'string') return 2;
            if (typeof v === 'boolean') return 4;
            if (isErr(v)) return 16;
            if (Array.isArray(v)) return 64;
            if (v instanceof Date) return 1;
            return 2;
        },
        ISLOGICAL: function (a) { return typeof a[0] === 'boolean'; },
        ISNONTEXT: function (a) { return typeof a[0] !== 'string'; }
    };

    function matchCrit(val, crit) {
        if (crit == null) return val == null || val === '';
        var c = String(crit);
        var m = c.match(/^(<=|>=|<>|<|>|=)(.*)$/);
        var op = m ? m[1] : '=';
        var rhs = m ? m[2] : c;
        if (rhs.indexOf('*') >= 0 || rhs.indexOf('?') >= 0) {
            var re = new RegExp('^' + rhs.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
            return re.test(asText(val));
        }
        var lv, rv;
        try { lv = num(val); rv = num(rhs); } catch (e) {
            lv = asText(val).toLowerCase(); rv = String(rhs).toLowerCase();
        }
        if (op === '=') return lv == rv; // eslint-disable-line eqeqeq
        if (op === '<>') return lv != rv; // eslint-disable-line eqeqeq
        if (op === '>') return lv > rv;
        if (op === '<') return lv < rv;
        if (op === '>=') return lv >= rv;
        if (op === '<=') return lv <= rv;
        return false;
    }

    function tokenize(src, listSep) {
        var s = String(src || '').replace(/^\s*=\s*/, '');
        var out = [], i = 0, sep = listSep || ';';
        function push(t, v) { out.push({ t: t, v: v }); }
        while (i < s.length) {
            var ch = s.charAt(i);
            if (/\s/.test(ch)) { i++; continue; }
            if (ch === '"' || ch === "'") {
                var q = ch, j = i + 1, buf = '';
                while (j < s.length) {
                    if (s.charAt(j) === q && s.charAt(j + 1) === q) { buf += q; j += 2; continue; }
                    if (s.charAt(j) === q) { j++; break; }
                    buf += s.charAt(j++);
                }
                push('str', buf); i = j; continue;
            }
            if (ch === sep) { push('sep', ch); i++; continue; }
            if ('+-*/^%<>=&():'.indexOf(ch) >= 0) {
                if ((ch === '<' || ch === '>' || ch === '=') && i + 1 < s.length) {
                    var two = ch + s.charAt(i + 1);
                    if (two === '<=' || two === '>=' || two === '<>' || two === '==') { push('op', two); i += 2; continue; }
                }
                push(ch === '(' ? 'lp' : ch === ')' ? 'rp' : 'op', ch);
                i++; continue;
            }
            if (/[0-9]/.test(ch) || ch === '.' || (ch === ',' && sep !== ',')) {
                var nbuf = '', k = i, dots = 0, commas = 0;
                while (k < s.length) {
                    var ck = s.charAt(k);
                    if (/[0-9]/.test(ck)) { nbuf += ck; k++; continue; }
                    if (ck === '.') { dots++; nbuf += ck; k++; continue; }
                    if (ck === ',' && sep !== ',') { commas++; nbuf += ck; k++; continue; }
                    break;
                }
                if (commas && !dots) nbuf = nbuf.replace(/,/g, '.');
                else if (commas && dots) nbuf = nbuf.replace(/\./g, '').replace(',', '.');
                if (nbuf === '.' || nbuf === ',') { push('op', ch); i++; continue; }
                var nval = Number(nbuf);
                if (!isFinite(nval)) { push('op', ch); i++; continue; }
                push('num', nval);
                i = k; continue;
            }
            if (/[A-Za-zÀ-ÿ_]/.test(ch) || ch === '$' || ch === '!') {
                var id = '', p = i;
                while (p < s.length && /[A-Za-zÀ-ÿ0-9_$.'!]/.test(s.charAt(p))) id += s.charAt(p++);
                var afterBang = id.indexOf('!') >= 0 ? id.slice(id.lastIndexOf('!') + 1) : id;
                if (/^'?[^']+'?!\$?[A-Za-z]+\$?\d+$/.test(id) || /^(\$?[A-Za-z]+\$?\d+)$/.test(afterBang)) push('ref', id);
                else push('id', id);
                i = p; continue;
            }
            throw err('#NAME?');
        }
        return out;
    }

    function Parser(tokens, ctx) {
        this.ts = tokens;
        this.i = 0;
        this.ctx = ctx;
        this.refs = ctx.refs;
    }
    Parser.prototype.peek = function () { return this.ts[this.i] || { t: 'eof' }; };
    Parser.prototype.eat = function (t) {
        var n = this.peek();
        if (t && n.t !== t) throw err('#NAME?');
        this.i++;
        return n;
    };
    Parser.prototype.parse = function () { return this.cmp(); };
    Parser.prototype.cmp = function () {
        var l = this.concat();
        var n = this.peek();
        if (n.t === 'op' && /^(<=|>=|<>|<|>|=)$/.test(n.v)) {
            this.eat();
            var r = this.concat();
            if (n.v === '=') return l == r; // eslint-disable-line eqeqeq
            if (n.v === '<>') return l != r; // eslint-disable-line eqeqeq
            if (n.v === '>') return num(l) > num(r);
            if (n.v === '<') return num(l) < num(r);
            if (n.v === '>=') return num(l) >= num(r);
            if (n.v === '<=') return num(l) <= num(r);
        }
        return l;
    };
    Parser.prototype.concat = function () {
        var l = this.add();
        while (this.peek().t === 'op' && this.peek().v === '&') {
            this.eat();
            l = asText(l) + asText(this.add());
        }
        return l;
    };
    Parser.prototype.add = function () {
        var l = this.mul();
        while (this.peek().t === 'op' && (this.peek().v === '+' || this.peek().v === '-')) {
            var op = this.eat().v;
            var r = this.mul();
            l = op === '+' ? num(l) + num(r) : num(l) - num(r);
        }
        return l;
    };
    Parser.prototype.mul = function () {
        var l = this.pow();
        while (this.peek().t === 'op' && (this.peek().v === '*' || this.peek().v === '/')) {
            var op = this.eat().v;
            var r = this.pow();
            if (op === '/') {
                var d = num(r);
                if (!d) throw err('#DIV/0!');
                l = num(l) / d;
            } else l = num(l) * num(r);
        }
        return l;
    };
    Parser.prototype.pow = function () {
        var l = this.unary();
        if (this.peek().t === 'op' && this.peek().v === '^') {
            this.eat();
            l = Math.pow(num(l), num(this.pow()));
        }
        if (this.peek().t === 'op' && this.peek().v === '%') {
            this.eat();
            l = num(l) / 100;
        }
        return l;
    };
    Parser.prototype.unary = function () {
        if (this.peek().t === 'op' && (this.peek().v === '+' || this.peek().v === '-')) {
            var op = this.eat().v;
            var v = this.unary();
            return op === '-' ? -num(v) : v;
        }
        return this.prim();
    };
    Parser.prototype.skipArg = function () {
        var d = 0;
        while (this.peek().t !== 'eof') {
            var t = this.peek().t;
            if (t === 'lp') d++;
            else if (t === 'rp') {
                if (d === 0) return;
                d--;
            } else if (d === 0 && (t === 'sep' || (t === 'op' && this.peek().v === ','))) return;
            this.eat();
        }
    };
    Parser.prototype.callFn = function (canon) {
        var args = [];
        if (this.peek().t !== 'rp') {
            args.push(this.parse());
            while (this.peek().t === 'sep' || (this.peek().t === 'op' && this.peek().v === ',')) {
                this.eat();
                args.push(this.parse());
            }
        }
        this.eat('rp');
        var fn = FUNCS[canon];
        if (!fn) throw err('#NAME?');
        return fn(args, this.ctx);
    };
    Parser.prototype.prim = function () {
        var n = this.peek();
        if (n.t === 'num') { this.eat(); return n.v; }
        if (n.t === 'str') { this.eat(); return n.v; }
        if (n.t === 'lp') {
            this.eat();
            var e = this.parse();
            this.eat('rp');
            return e;
        }
        if (n.t === 'ref') {
            this.eat();
            if (this.peek().t === 'op' && this.peek().v === ':') {
                this.eat();
                var b = this.eat('ref');
                return this.ctx.range(n.v, b.v);
            }
            return this.ctx.ref(n.v);
        }
        if (n.t === 'id') {
            this.eat();
            var name = String(n.v).toUpperCase();
            if (name === 'TRUE' || name === 'VERDADEIRO' || name === 'VRAI' || name === 'VERDADERO') {
                if (this.peek().t !== 'lp') return true;
            }
            if (name === 'FALSE' || name === 'FALSO' || name === 'FAUX') {
                if (this.peek().t !== 'lp') return false;
            }
            if (this.peek().t === 'op' && this.peek().v === ':') {
                this.eat();
                var nxt = this.peek();
                if (nxt.t === 'id' || nxt.t === 'ref') {
                    this.eat();
                    if (this.ctx.fullRange) return this.ctx.fullRange(n.v, nxt.v);
                    return this.ctx.range(n.v + '1', String(nxt.v).replace(/\d+$/, '') + '10000');
                }
            }
            if (this.peek().t === 'lp') {
                var canon = FN[name] || FN[name.replace(/_/g, '.')] || name;
                this.eat();
                if (canon === 'IFERROR' || canon === 'IFNA') {
                    var a0, a1;
                    try { a0 = this.parse(); } catch (ex0) {
                        this.skipArg();
                        if (this.peek().t === 'sep' || (this.peek().t === 'op' && this.peek().v === ',')) this.eat();
                        a1 = this.peek().t === 'rp' ? '' : this.parse();
                        this.eat('rp');
                        return a1;
                    }
                    if (this.peek().t === 'sep' || (this.peek().t === 'op' && this.peek().v === ',')) this.eat();
                    a1 = this.peek().t === 'rp' ? '' : this.parse();
                    this.eat('rp');
                    if (canon === 'IFNA') return isNA(a0) ? a1 : a0;
                    return isErr(a0) ? a1 : a0;
                }
                if (canon === 'IF') {
                    var cond = this.parse();
                    if (this.peek().t === 'sep' || (this.peek().t === 'op' && this.peek().v === ',')) this.eat();
                    if (truthy(cond)) {
                        var yes = this.peek().t === 'rp' ? true : this.parse();
                        if (this.peek().t === 'sep' || (this.peek().t === 'op' && this.peek().v === ',')) {
                            this.eat();
                            this.skipArg();
                        }
                        this.eat('rp');
                        return yes;
                    }
                    this.skipArg();
                    var no = false;
                    if (this.peek().t === 'sep' || (this.peek().t === 'op' && this.peek().v === ',')) {
                        this.eat();
                        no = this.peek().t === 'rp' ? false : this.parse();
                    }
                    this.eat('rp');
                    return no;
                }
                return this.callFn(canon);
            }
            throw err('#NAME?');
        }
        throw err('#NAME?');
    };

    function dangerous(formula) {
        var s = String(formula || '').toLowerCase();
        if (/cmd\||powershell|javascript:|vbscript:|dde\(|exec\(|macro|attribut|hyperlink\s*\(/i.test(s)) return true;
        if (/=.*\+cmd/i.test(s)) return true;
        return false;
    }

    function evaluate(formula, ctx) {
        if (dangerous(formula)) throw err('#N/A');
        var tokens = tokenize(formula, ctx.listSep || ';');
        var p = new Parser(tokens, ctx);
        var v = p.parse();
        if (p.peek().t !== 'eof') throw err('#NAME?');
        return v;
    }

    function shiftFormula(formula, dc, dr) {
        return String(formula || '').replace(/(^|[^A-Za-z0-9_$.'])(\$?)([A-Za-z]+)(\$?)(\d+)/g, function (m, pre, a, col, b, row) {
            var c = colIndex(col);
            var r = Number(row) - 1;
            if (c < 0) return m;
            if (!a) c += dc;
            if (!b) r += dr;
            if (c < 0 || r < 0) return pre + '#REF!';
            return pre + a + colName(c) + b + (r + 1);
        });
    }

    var FN_LOC = {
        'en-US': {},
        'pt-PT': {
            SUM: 'SOMA', AVERAGE: 'MÉDIA', COUNT: 'CONTAR', COUNTA: 'CONTAR.VAL', COUNTBLANK: 'CONTAR.VAZIO',
            IF: 'SE', AND: 'E', OR: 'OU', NOT: 'NÃO', SUMIF: 'SOMA.SE', SUMIFS: 'SOMA.SE.S',
            COUNTIF: 'CONTAR.SE', COUNTIFS: 'CONTAR.SE.S', ROUND: 'ARRED', ROUNDUP: 'ARRED.SUP', ROUNDDOWN: 'ARRED.INF',
            MOD: 'RESTO', SIGN: 'SINAL', SQRT: 'RAIZQ', POWER: 'POTENCIA', PRODUCT: 'PRODUTO', SUMPRODUCT: 'SOMAPRODUTO',
            LEFT: 'ESQUERDA', RIGHT: 'DIREITA', MID: 'EXT.TEXTO', LEN: 'NÚM.CARACT', CONCAT: 'CONCATENAR',
            TEXTJOIN: 'UNICAR', TRIM: 'ARRUMAR', UPPER: 'MAIUSCULA', LOWER: 'MINUSCULA', PROPER: 'PRI',
            SUBSTITUTE: 'SUBSTITUIR', FIND: 'LOCALIZAR', SEARCH: 'PROCURAR', TEXT: 'TEXTO', VALUE: 'VALOR',
            TODAY: 'HOJE', NOW: 'AGORA', DATE: 'DATA', TIME: 'TEMPO', YEAR: 'ANO', MONTH: 'MÊS', DAY: 'DIA',
            HOUR: 'HORA', MINUTE: 'MINUTO', SECOND: 'SEGUNDO', WEEKDAY: 'DIA.SEMANA', IFERROR: 'SEERRO', IFNA: 'SENA',
            ISBLANK: 'ESEVAZIO', ISNUMBER: 'ENUM', ISTEXT: 'ETEXTO', ISERROR: 'EERRO', ISNA: 'ENA',
            VLOOKUP: 'PROCV', HLOOKUP: 'PROCH', INDEX: 'INDICE', MATCH: 'CORRESP', CHOOSE: 'ESCOLHER',
            COLUMN: 'COL', ROW: 'LIN', COLUMNS: 'COLS', ROWS: 'LINS', NA: 'NÃO.DISP',
            PMT: 'PGTO', PV: 'VP', FV: 'VF', NPER: 'NPER', RATE: 'TAXA', NPV: 'VPL', IRR: 'TIR',
            IPMT: 'IPGTO', PPMT: 'PPGTO', SLN: 'BEZ',
            SIN: 'SEN', COS: 'COS', TAN: 'TAN', ASIN: 'ASEN', ACOS: 'ACOS', ATAN: 'ATAN', ATAN2: 'ATAN2',
            RADIANS: 'RADIANOS', DEGREES: 'GRAUS', LN: 'LN', LOG: 'LOG', LOG10: 'LOG10', EXP: 'EXP', PI: 'PI',
            FACT: 'FATORIAL', RAND: 'ALEATÓRIO', RANDBETWEEN: 'ALEATÓRIO.ENTRE',
            CEILING: 'TETO', FLOOR: 'PISO', EVEN: 'PAR', ODD: 'ÍMPAR', MROUND: 'MULTARRED', QUOTIENT: 'QUOCIENTE',
            GCD: 'MDC', LCM: 'MMC', COMBIN: 'COMBIN', SUMSQ: 'SOMAQUAD',
            MEDIAN: 'MEDIANA', MODE: 'MODA', STDEV: 'DESVPAD', STDEVP: 'DESVPADP', VAR: 'VAR', VARP: 'VARP',
            LARGE: 'MAIOR', SMALL: 'MENOR', RANK: 'ORDEM', AVERAGEIF: 'MÉDIA.SE', AVERAGEIFS: 'MÉDIA.SE.S',
            XOR: 'XOR', IFS: 'SES', SWITCH: 'SWITCH',
            REPLACE: 'SUBSTITUIR.CARACT', REPT: 'REPT', EXACT: 'EXATO', CLEAN: 'LIMPAR', CHAR: 'CARACT', CODE: 'CÓDIGO',
            DAYS: 'DIAS', EDATE: 'DATAM', EOMONTH: 'FIMMÊS', NETWORKDAYS: 'DIATRABALHO', WEEKNUM: 'NÚMSEMANA', DATEDIF: 'DATEDIF',
            LOOKUP: 'PROC', TYPE: 'TIPO', ISLOGICAL: 'ELÓGICO', ISNONTEXT: 'ENAÕTEXTO', TRUE: 'VERDADEIRO', FALSE: 'FALSO'
        },
        'fr-FR': {
            SUM: 'SOMME', AVERAGE: 'MOYENNE', COUNT: 'NB', COUNTA: 'NBVAL', COUNTBLANK: 'NBVIDE',
            IF: 'SI', AND: 'ET', OR: 'OU', NOT: 'NON', SUMIF: 'SOMME.SI', SUMIFS: 'SOMME.SI.ENS',
            COUNTIF: 'NB.SI', COUNTIFS: 'NB.SI.ENS', ROUND: 'ARRONDI', ROUNDUP: 'ARRONDI.SUP', ROUNDDOWN: 'ARRONDI.INF',
            SIGN: 'SIGNE', SQRT: 'RACINE', POWER: 'PUISSANCE', PRODUCT: 'PRODUIT', SUMPRODUCT: 'SOMMEPROD',
            LEFT: 'GAUCHE', RIGHT: 'DROITE', MID: 'STXT', LEN: 'NBCAR', CONCAT: 'CONCAT',
            TEXTJOIN: 'JOINDRETEXTE', TRIM: 'SUPPRESPACE', UPPER: 'MAJUSCULE', LOWER: 'MINUSCULE', PROPER: 'NOMPROPRE',
            SUBSTITUTE: 'SUBSTITUE', FIND: 'TROUVE', SEARCH: 'CHERCHE', TEXT: 'TEXTE', VALUE: 'CNUM',
            TODAY: 'AUJOURDHUI', NOW: 'MAINTENANT', DATE: 'DATE', TIME: 'TEMPS', YEAR: 'ANNEE', MONTH: 'MOIS', DAY: 'JOUR',
            HOUR: 'HEURE', MINUTE: 'MINUTE', SECOND: 'SECONDE', WEEKDAY: 'JOURSEM', IFERROR: 'SIERREUR', IFNA: 'SINA',
            ISBLANK: 'ESTVIDE', ISNUMBER: 'ESTNUM', ISTEXT: 'ESTTEXTE', ISERROR: 'ESTERREUR', ISNA: 'ESTNA',
            VLOOKUP: 'RECHERCHEV', HLOOKUP: 'RECHERCHEH', INDEX: 'INDEX', MATCH: 'EQUIV', CHOOSE: 'CHOISIR',
            COLUMN: 'COLONNE', ROW: 'LIGNE', COLUMNS: 'COLONNES', ROWS: 'LIGNES', NA: 'NA',
            PMT: 'VPM', PV: 'VA', FV: 'VC', NPER: 'NPM', RATE: 'TAUX', NPV: 'VAN', IRR: 'TRI',
            IPMT: 'INTPER', PPMT: 'PRINCPER', SLN: 'AMORLIN',
            SIN: 'SIN', COS: 'COS', TAN: 'TAN', ASIN: 'ASIN', ACOS: 'ACOS', ATAN: 'ATAN', ATAN2: 'ATAN2',
            RADIANS: 'RADIANS', DEGREES: 'DEGRES', LN: 'LN', LOG: 'LOG', LOG10: 'LOG10', EXP: 'EXP', PI: 'PI',
            FACT: 'FACT', RAND: 'ALEA', RANDBETWEEN: 'ALEA.ENTRE.BORNES',
            CEILING: 'PLAFOND', FLOOR: 'PLANCHER', EVEN: 'PAIR', ODD: 'IMPAIR', MROUND: 'ARRONDI.AU.MULTIPLE', QUOTIENT: 'QUOTIENT',
            GCD: 'PGCD', LCM: 'PPCM', COMBIN: 'COMBIN', SUMSQ: 'SOMME.CARRES',
            MEDIAN: 'MEDIANE', MODE: 'MODE', STDEV: 'ECARTYPE', STDEVP: 'ECARTYPEP', VAR: 'VAR', VARP: 'VAR.P',
            LARGE: 'GRANDE.VALEUR', SMALL: 'PETITE.VALEUR', RANK: 'RANG', AVERAGEIF: 'MOYENNE.SI', AVERAGEIFS: 'MOYENNE.SI.ENS',
            XOR: 'XOR', IFS: 'SI.CONDITIONS', SWITCH: 'SWITCH',
            REPLACE: 'REMPLACER', REPT: 'REPT', EXACT: 'EXACT', CLEAN: 'EPURAGE', CHAR: 'CAR', CODE: 'CODE',
            DAYS: 'JOURS', EDATE: 'MOIS.DECALER', EOMONTH: 'FIN.MOIS', NETWORKDAYS: 'NB.JOURS.OUVRES', WEEKNUM: 'NO.SEMAINE', DATEDIF: 'DATEDIF',
            LOOKUP: 'RECHERCHE', TYPE: 'TYPE', ISLOGICAL: 'ESTLOGIQUE', ISNONTEXT: 'ESTNONTEXTE', TRUE: 'VRAI', FALSE: 'FAUX'
        },
        'es-ES': {
            SUM: 'SUMA', AVERAGE: 'PROMEDIO', COUNT: 'CONTAR', COUNTA: 'CONTARA', COUNTBLANK: 'CONTAR.BLANCO',
            IF: 'SI', AND: 'Y', OR: 'O', NOT: 'NO', SUMIF: 'SUMAR.SI', SUMIFS: 'SUMAR.SI.CONJUNTO',
            COUNTIF: 'CONTAR.SI', COUNTIFS: 'CONTAR.SI.CONJUNTO', ROUND: 'REDONDEAR', ROUNDUP: 'REDONDEAR.MAS', ROUNDDOWN: 'REDONDEAR.MENOS',
            INT: 'ENTERO', TRUNC: 'TRUNCAR', MOD: 'RESIDUO', SIGN: 'SIGNO', SQRT: 'RAIZ', POWER: 'POTENCIA', PRODUCT: 'PRODUCTO', SUMPRODUCT: 'SUMAPRODUCTO',
            LEFT: 'IZQUIERDA', RIGHT: 'DERECHA', MID: 'EXTRAE', LEN: 'LARGO', CONCAT: 'CONCATENAR',
            TEXTJOIN: 'UNIRCADENAS', TRIM: 'ESPACIOS', UPPER: 'MAYUSC', LOWER: 'MINUSC', PROPER: 'NOMPROPIO',
            SUBSTITUTE: 'SUSTITUIR', FIND: 'ENCONTRAR', SEARCH: 'HALLAR', TEXT: 'TEXTO', VALUE: 'VALOR',
            TODAY: 'HOY', NOW: 'AHORA', DATE: 'FECHA', TIME: 'TIEMPO', YEAR: 'AÑO', MONTH: 'MES', DAY: 'DIA',
            HOUR: 'HORA', MINUTE: 'MINUTO', SECOND: 'SEGUNDO', WEEKDAY: 'DIASEM', IFERROR: 'SI.ERROR', IFNA: 'SI.ND',
            ISBLANK: 'ESBLANCO', ISNUMBER: 'ESNUMERO', ISTEXT: 'ESTEXTO', ISERROR: 'ESERROR', ISNA: 'ESNOD',
            VLOOKUP: 'BUSCARV', HLOOKUP: 'BUSCARH', INDEX: 'INDICE', MATCH: 'COINCIDIR', CHOOSE: 'ELEGIR',
            COLUMN: 'COLUMNA', ROW: 'FILA', COLUMNS: 'COLUMNAS', ROWS: 'FILAS', NA: 'ND',
            PMT: 'PAGO', PV: 'VA', FV: 'VF', NPER: 'NPER', RATE: 'TASA', NPV: 'VNA', IRR: 'TIR',
            IPMT: 'PAGOINT', PPMT: 'PAGOPRIN', SLN: 'SLN',
            SIN: 'SENO', COS: 'COS', TAN: 'TAN', ASIN: 'ASENO', ACOS: 'ACOS', ATAN: 'ATAN', ATAN2: 'ATAN2',
            RADIANS: 'RADIANES', DEGREES: 'GRADOS', LN: 'LN', LOG: 'LOG', LOG10: 'LOG10', EXP: 'EXP', PI: 'PI',
            FACT: 'FACT', RAND: 'ALEATORIO', RANDBETWEEN: 'ALEATORIO.ENTRE',
            CEILING: 'TECHO', FLOOR: 'FLOOR', EVEN: 'PAR', ODD: 'IMPAR', MROUND: 'MULTIPLO.REDONDEAR', QUOTIENT: 'COCIENTE',
            GCD: 'MCD', LCM: 'MCM', COMBIN: 'COMBINAT', SUMSQ: 'SUMA.CUADRADOS',
            MEDIAN: 'MEDIANA', MODE: 'MODA', STDEV: 'DESVEST', STDEVP: 'DESVESTP', VAR: 'VAR', VARP: 'VAR.P',
            LARGE: 'K.ESIMO.MAYOR', SMALL: 'K.ESIMO.MENOR', RANK: 'JERARQUIA', AVERAGEIF: 'PROMEDIO.SI', AVERAGEIFS: 'PROMEDIO.SI.CONJUNTO',
            XOR: 'XOR', IFS: 'SI.CONJUNTO', SWITCH: 'SWITCH',
            REPLACE: 'REEMPLAZAR', REPT: 'REPETIR', EXACT: 'EXACTO', CLEAN: 'LIMPIAR', CHAR: 'CARACTER', CODE: 'CODIGO',
            DAYS: 'DIAS', EDATE: 'FECHA.MES', EOMONTH: 'FIN.MES', NETWORKDAYS: 'DIAS.LAB', WEEKNUM: 'NUM.DE.SEMANA', DATEDIF: 'DATEDIF',
            LOOKUP: 'BUSCAR', TYPE: 'TIPO', ISLOGICAL: 'ESLOGICO', ISNONTEXT: 'ESNOTEXTO', TRUE: 'VERDADERO', FALSE: 'FALSO'
        }
    };

    function detectListSep(formula) {
        var s = String(formula || ''), inStr = false, i;
        for (i = 0; i < s.length; i++) {
            if (s.charAt(i) === '"') { inStr = !inStr; continue; }
            if (!inStr && s.charAt(i) === ';') return ';';
        }
        return ',';
    }

    function canonName(name) {
        var u = String(name || '').toUpperCase();
        return FN[u] || FN[u.replace(/_/g, '.')] || u;
    }

    function printTokens(tokens, listSep, toEn, lang) {
        var loc = FN_LOC[lang] || {};
        var out = '', i, t, n, u, canon;
        for (i = 0; i < tokens.length; i++) {
            t = tokens[i];
            n = tokens[i + 1];
            if (t.t === 'num') {
                var s = String(t.v);
                if (listSep === ';' && s.indexOf('.') >= 0) s = s.replace('.', ',');
                out += s;
            } else if (t.t === 'str') {
                out += '"' + String(t.v).replace(/"/g, '""') + '"';
            } else if (t.t === 'sep') {
                out += listSep;
            } else if (t.t === 'lp') out += '(';
            else if (t.t === 'rp') out += ')';
            else if (t.t === 'op') out += t.v === ',' ? listSep : t.v;
            else if (t.t === 'ref') out += t.v;
            else if (t.t === 'id') {
                u = String(t.v).toUpperCase();
                canon = canonName(u);
                if (n && n.t === 'lp') out += toEn ? canon : (loc[canon] || canon);
                else out += t.v;
            }
        }
        return out;
    }

    function toInvariantFormula(formula) {
        var src = String(formula || '');
        if (!src || src.charAt(0) !== '=') return src;
        try {
            var sep = detectListSep(src);
            var tokens = tokenize(src, sep);
            return '=' + printTokens(tokens, ',', true, 'en-US');
        } catch (e) {
            return src;
        }
    }

    function localizeFormula(formula, lang) {
        var inv = toInvariantFormula(formula);
        if (!inv || inv.charAt(0) !== '=') return formula;
        lang = lang || 'pt-PT';
        if (/^en/i.test(lang)) return inv;
        try {
            var tokens = tokenize(inv, ',');
            var sep = ';';
            return '=' + printTokens(tokens, sep, false, lang);
        } catch (e) {
            return inv;
        }
    }

    var api = {
        colName: colName,
        colIndex: colIndex,
        a1: a1,
        parseA1: parseA1,
        evaluate: evaluate,
        shiftFormula: shiftFormula,
        toInvariantFormula: toInvariantFormula,
        localizeFormula: localizeFormula,
        detectListSep: detectListSep,
        dangerous: dangerous,
        aliases: FN,
        err: err,
        isErr: isErr,
        num: num,
        roundN: roundN,
        flatten: flatten,
        asText: asText,
        fnCanon: canonName,
        fnList: function () { return Object.keys(FUNCS); },
        fnLocalName: function (canon, lang) {
            lang = lang || 'en-US';
            if (/^en/i.test(lang)) return canon;
            var loc = FN_LOC[lang] || {};
            return loc[canon] || canon;
        }
    };
    root.AbeneExcelEngine = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
