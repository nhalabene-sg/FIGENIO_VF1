/* Genius Raros — nomes completos + infobulha (o que faz cada ícone / tarefa). */
(function () {
    var TIPS = {
        'pt-PT': {
            paste: 'Cola o conteúdo copiado. Clique para escolher manter a formatação, fundir ou só texto.',
            cut: 'Corta a seleção para a área de transferência.',
            copy: 'Copia a seleção para a área de transferência.',
            painter: 'Copia a formatação de um texto e aplica-a a outro. Duplo-clique para várias vezes.',
            growFont: 'Aumenta o tamanho da letra do texto selecionado.',
            shrinkFont: 'Diminui o tamanho da letra do texto selecionado.',
            changeCase: 'Passa o texto a maiúsculas, minúsculas ou iniciais grandes.',
            clearFmt: 'Remove negrito, cor e outros formatos e volta ao estilo Normal.',
            bold: 'Põe o texto a negrito.',
            italic: 'Põe o texto a itálico.',
            underline: 'Sublinha o texto. Clique para escolher o estilo de traço.',
            strike: 'Risca o texto ao meio (rasurado).',
            sub: 'Coloca o texto em índice (mais baixo e pequeno), como em H₂O.',
            super: 'Coloca o texto em expoente, como em m².',
            textFx: 'Aplica efeitos visuais ao texto (sombra, contorno).',
            fontColor: 'Altera a cor das letras.',
            highlight: 'Marca o texto com uma cor de realce, como um marcador.',
            fontDlg: 'Abre a janela completa de tipo de letra, tamanho e efeitos.',
            bullets: 'Cria uma lista com marcas (pontos, setas, etc.).',
            numbering: 'Cria uma lista numerada (1, 2, 3…).',
            multilevel: 'Lista com vários níveis (1. / 1.1 / 1.1.1).',
            outdent: 'Diminui o avanço (aproxima o parágrafo da margem).',
            indent: 'Aumenta o avanço (afasta o parágrafo da margem).',
            sort: 'Ordena os parágrafos ou linhas selecionados de A a Z.',
            showMarks: 'Mostra ou oculta as marcas de parágrafo (¶) e tabulações.',
            lineSpacing: 'Define o espaço entre as linhas do parágrafo.',
            alignLeft: 'Alinha o parágrafo à margem esquerda.',
            alignCenter: 'Centra o parágrafo na página.',
            alignRight: 'Alinha o parágrafo à margem direita.',
            alignJustify: 'Justifica o texto (margens esquerda e direita alinhadas).',
            shading: 'Pinta o fundo do parágrafo.',
            borders: 'Adiciona ou remove limites em volta do parágrafo ou da tabela.',
            typoTitle: 'Abre estilos, interlinha e avanços do parágrafo.',
            stylesPane: 'Abre o painel para gerir os estilos do documento.',
            find: 'Procura uma palavra ou frase no documento.',
            replace: 'Procura um texto e substitui-o por outro.',
            select: 'Seleciona tudo, texto semelhante ou objetos.',
            pageBreak: 'Insere uma quebra para começar uma nova página.',
            table: 'Insere uma tabela (linhas e colunas) no documento.',
            insertTable: 'Abre a janela para escolher o número de linhas e colunas.',
            image: 'Insere uma imagem a partir de um ficheiro do computador.',
            imageUrl: 'Insere uma imagem a partir de um endereço na Internet.',
            imgInsert: 'Abre a janela de inserção de imagem (ficheiro ou URL).',
            shapes: 'Insere uma forma (retângulo, círculo, seta…).',
            textToTable: 'Converte o texto selecionado (separado por tabulações) numa tabela.',
            drawTable: 'Permite desenhar as células da tabela à mão.',
            icon: 'Insere um pequeno ícone decorativo.',
            capture: 'Captura uma zona do ecrã e cola-a no documento.',
            link: 'Cria uma hiperligação (site, e-mail ou âncora).',
            comment: 'Adiciona um comentário ao texto selecionado.',
            header: 'Edita o cabeçalho (logo, título, número) no topo de cada página.',
            footer: 'Edita o rodapé (número de página, empresa) no fundo de cada página.',
            pageNum: 'Insere o número de página automático.',
            textBox: 'Insere uma caixa de texto móvel na página.',
            date: 'Insere a data de hoje (atualizável).',
            line: 'Insere uma linha horizontal de separação.',
            symbol: 'Insere um símbolo (€, Ω, setas, etc.).',
            signature: 'Insere um bloco de assinatura.',
            wordArt: 'Insere texto decorativo (WordArt).',
            dropCap: 'Transforma a primeira letra do parágrafo numa letra capitular grande.',
            section: 'Começa uma nova secção (útil para mudar margens a meio do documento).',
            colBreak: 'Passa o texto para a coluna seguinte.',
            equation: 'Insere uma equação ou fórmula.',
            mailMerge: 'Insere um campo de mailing (nome, morada…) para cartas em série.',
            watermark: 'Coloca um texto em fundo (ex.: CONFIDENCIAL) em todas as páginas.',
            pageBorder: 'Desenha um limite à volta da página.',
            pageColorTitle: 'Altera a cor de fundo da folha.',
            dlgPageSetup: 'Define formato do papel (A4, Letter…), orientação e margens.',
            toc: 'Gera o índice a partir dos títulos (Título 1, 2, 3).',
            footnote: 'Adiciona uma nota no rodapé da página.',
            endnote: 'Adiciona uma nota no fim do documento.',
            caption: 'Numera uma figura ou tabela (Figura 1, Tabela 2…).',
            illIndex: 'Cria a lista de ilustrações a partir das legendas.',
            xref: 'Insere uma referência cruzada para um título ou figura.',
            citation: 'Insere uma citação bibliográfica no texto.',
            bibliography: 'Gera a lista de fontes citadas.',
            index: 'Cria um índice remissivo de palavras.',
            tof: 'Cria o índice de figuras.',
            citeStyle: 'Escolhe o estilo de citação (APA, MLA, Chicago).',
            stats: 'Mostra o número de palavras, caracteres e páginas.',
            track: 'Regista as alterações (inserções e apagamentos) para rever mais tarde.',
            commentList: 'Abre a lista de todos os comentários do documento.',
            accept: 'Aceita todas as alterações registadas.',
            reject: 'Rejeita todas as alterações registadas.',
            ruler: 'Mostra ou oculta a régua de margens e avanços.',
            navigation: 'Abre o painel de títulos para saltar no documento.',
            grid: 'Mostra a grelha de alinhamento na página.',
            viewPrint: 'Vista de impressão: folhas A4 com sombras e margens.',
            viewWeb: 'Vista contínua, como uma página web, sem folhas separadas.',
            viewRead: 'Vista de leitura, com menos ferramentas.',
            viewOutline: 'Vista de estrutura pelos títulos.',
            viewEdit: 'Volta ao modo de edição normal.',
            zoomIn: 'Aproxima (aumenta o zoom).',
            zoomOut: 'Afasta (diminui o zoom).',
            zoomReset: 'Repõe o zoom a 100 %.',
            groupZoom: 'Arraste para aumentar ou reduzir a página.',
            dark: 'Ativa o tema escuro tipo Microsoft 365 (barras e menus escuros; a folha A4 permanece branca).',
            focus: 'Esconde o friso para escrever com menos distração. Esc para sair.',
            window: 'Põe a janela em ecrã inteiro.',
            updateFields: 'Atualiza números de página, índice e outros campos.',
            pagination: 'Liga ou desliga a divisão visual em páginas.',
            versions: 'Mostra versões anteriores guardadas neste computador.',
            protect: 'Bloqueia a edição com palavra-passe nesta sessão.',
            mdlApply: 'Aplica capa, folha de rosto, cabeçalho e logo ao relatório.',
            mdlMeta: 'Preenche cliente, obra, técnico e data da folha de rosto.',
            mdlPresetLetter: 'Aplica o modelo de carta da empresa.',
            mdlPresetMinutes: 'Aplica o modelo de ata de reunião.',
            mdlRemove: 'Retira capa e folha de rosto sem apagar o resto do texto.',
            mdlStyleGr: 'Estilo visual Genius Raros (azul-marinho e dourado).',
            mdlStyleTec: 'Estilo técnico, mais sóbrio.',
            mdlStyleInsp: 'Estilo inspeção / obra.',
            mdlStyleCarta: 'Estilo de correspondência.',
            mdlStyleSimple: 'Estilo simples, pouco ornamentado.',
            createQuote: 'Abre o formulário para criar um orçamento.',
            createReceipt: 'Abre o formulário para criar um recibo comercial.',
            previewQuote: 'Pré-visualiza o orçamento como vai sair no papel.',
            previewReceipt: 'Pré-visualiza o recibo como vai sair no papel.',
            viewQuoteCreated: 'Pré-visualiza o orçamento já inserido no documento.',
            viewReceiptCreated: 'Pré-visualiza o recibo já inserido no documento.',
            previewBeforeQuote: 'Mostra o orçamento em rascunho, antes de confirmar.',
            previewBeforeReceipt: 'Mostra o recibo em rascunho, antes de confirmar.',
            insertQuoteTbl: 'Insere a tabela de artigos do orçamento no relatório.',
            insertWorksTbl: 'Insere a tabela de trabalhos / constatações.',
            toQuote: 'Copia linhas do relatório para o orçamento.',
            toReceipt: 'Preenche o recibo a partir do orçamento ou do relatório.',
            company: 'Abre os dados da empresa (NIF, IBAN, Google Drive…).',
            print: 'Imprime o documento.',
            docx: 'Guarda o documento em formato Microsoft Word (.docx).',
            pdf: 'Exporta o documento em PDF.',
            fileArquivo: 'Abre as pastas e documentos concluídos (Arquivo).',
            fileArquivoTitle: 'Organiza clientes, obras e versões finais (PDF).',
            qatSave: 'Guarda o documento neste computador (e sincroniza se o Google estiver ligado).',
            undo: 'Anula a última ação.',
            redo: 'Refaz a ação anulada.',
            companySettings: 'Definições da empresa, papel e ligação Google.',
            sheetsRefresh: 'Lê as linhas novas que escreveu no Google Sheets (clientes, artigos, pastas).',
            sheetsRefreshTitle: 'Depois de acrescentar dados na folha Google, clique aqui. O documento Word não é apagado.',
            docName: 'Nome do ficheiro. Prima Enter para confirmar.',
            minimize: 'Minimiza a janela da aplicação.',
            maximize: 'Maximiza ou restaura a janela.',
            closeApp: 'Fecha a aplicação. Os dados locais ficam guardados.',
            ribbonCollapse: 'Mostra ou esconde o friso de ferramentas.',
            tabFile: 'Novo, abrir, guardar, exportar e Arquivo.',
            tabHome: 'Letra, parágrafo, estilos, localizar.',
            tabInsert: 'Página, tabela, imagem, cabeçalho, símbolos.',
            tabDesign: 'Espaçamento, cores de tema, marca de água.',
            tabLayout: 'Margens, orientação, tamanho do papel, colunas.',
            tabReferences: 'Índice, notas, legendas, bibliografia.',
            tabReview: 'Estatísticas, comentários, controlo de alterações.',
            tabView: 'Régua, zoom, modos de vista.',
            tabModelo: 'Capa e identidade do relatório.',
            tabDevis: 'Orçamento, recibo e tabelas do relatório.',
            tabExcel: 'Folha de cálculo ligada ao documento.',
            xlNew: 'Cria um livro Excel em branco.',
            xlOpen: 'Abre um ficheiro .xlsx do computador.',
            xlSaveXlsx: 'Guarda o livro em formato Excel (.xlsx).',
            xlCsvIn: 'Importa dados de um ficheiro CSV.',
            xlCsvOut: 'Exporta a folha ativa para CSV.',
            xlOds: 'Exporta o livro para OpenDocument (LibreOffice Calc).',
            xlPdf: 'Exporta a folha para PDF.',
            xlPrint: 'Imprime a folha de cálculo.',
            xlWrap: 'Quebra o texto dentro da célula.',
            xlBorder: 'Aplica limites às células selecionadas.',
            xlMerge: 'Une as células selecionadas numa só.',
            xlInsRow: 'Insere uma linha acima da seleção.',
            xlInsCol: 'Insere uma coluna à esquerda da seleção.',
            xlDelRow: 'Elimina as linhas selecionadas.',
            xlDelCol: 'Elimina as colunas selecionadas.',
            xlHideR: 'Oculta as linhas selecionadas.',
            xlUnhide: 'Volta a mostrar linhas ou colunas ocultas.',
            xlFreeze: 'Fixa linhas/colunas para permanecerem visíveis ao deslocar.',
            xlMoreRows: 'Adiciona 100 linhas no fim da folha.',
            xlSortAz: 'Ordena a seleção de A a Z / menor para maior.',
            xlSortZa: 'Ordena a seleção de Z a A / maior para menor.',
            xlFilter: 'Ativa o filtro automático nos cabeçalhos.',
            xlDedup: 'Remove linhas duplicadas.',
            xlFind: 'Procura um valor nas células.',
            xlValid: 'Restringe o que se pode escrever na célula (lista, número…).',
            xlCf: 'Pinta células automaticamente segundo o valor (ex.: totais altos).',
            xlTable: 'Converte o intervalo numa tabela com cabeçalhos.',
            xlPivot: 'Cria uma tabela dinâmica (TCD) para resumir os dados.',
            xlChartCol: 'Gráfico de colunas a partir da seleção.',
            xlChartBar: 'Gráfico de barras a partir da seleção.',
            xlChartLine: 'Gráfico de linhas a partir da seleção.',
            xlChartPie: 'Gráfico de setores (queijo) a partir da seleção.',
            xlComment: 'Adiciona um comentário à célula.',
            xlBizTpl: 'Cria o livro métier (clientes, artigos, orçamentos, IVA).',
            xlFromQuote: 'Copia as linhas do orçamento Word para o Excel.',
            xlToQuote: 'Envia quantidades do Excel de volta para o orçamento Word.',
            xlToWord: 'Insere a seleção Excel como tabela no documento Word.',
            xlFromWord: 'Copia uma tabela do Word para o Excel.',
            xlTests: 'Corre testes do motor de fórmulas.',
            xlHelp: 'Mostra a ajuda das funções Excel disponíveis.',
            xlSum: 'Insere a fórmula SOMA para as células acima ou ao lado.',
            xlFill: 'Altera a cor de fundo das células selecionadas.',
            fontFamilyTitle: 'Escolhe o tipo de letra (Calibri, Arial, Times…).',
            fontSizeTitle: 'Tamanho da letra em pontos. Pode escrever um valor livre.',
            gotoPage: 'Clique para ir para um número de página.',
            langTitle: 'Muda o idioma dos menus (o papel comercial fica em português).',
            fileClose: 'Fecha o menu Ficheiro.'
        },
        'fr-FR': {
            paste: 'Colle le contenu copié. Cliquez pour garder la mise en forme, fusionner ou ne garder que le texte.',
            cut: 'Coupe la sélection vers le Presse-papiers.',
            copy: 'Copie la sélection vers le Presse-papiers.',
            painter: 'Copie la mise en forme d’un texte vers un autre. Double-clic pour plusieurs applications.',
            table: 'Insère un tableau (lignes et colonnes) dans le document.',
            xlPivot: 'Crée un tableau croisé dynamique pour résumer les données.',
            tabDevis: 'Rapport, devis et tableaux du document.',
            dlgPageSetup: 'Format du papier (A4, Letter…), orientation et marges.',
            header: 'Modifie l’en-tête (logo, titre, numéro) en haut de chaque page.',
            footer: 'Modifie le pied de page (numéro, entreprise) en bas de chaque page.',
            createQuote: 'Ouvre le formulaire pour créer un devis.',
            createReceipt: 'Ouvre le formulaire pour créer un reçu commercial.',
            previewQuote: 'Prévisualise le devis tel qu’il sortira sur papier.',
            previewReceipt: 'Prévisualise le reçu tel qu’il sortira sur papier.',
            viewQuoteCreated: 'Prévisualise le devis déjà inséré dans le document.',
            viewReceiptCreated: 'Prévisualise le reçu déjà inséré dans le document.',
            previewBeforeQuote: 'Montre le devis en brouillon, avant confirmation.',
            previewBeforeReceipt: 'Montre le reçu en brouillon, avant confirmation.',
            insertQuoteTbl: 'Insère le tableau d’articles du devis dans le rapport.',
            toQuote: 'Copie des lignes du rapport vers le devis.',
            toReceipt: 'Remplit le reçu à partir du devis ou du rapport.',
            xlBizTpl: 'Crée le classeur métier (clients, articles, devis, TVA).',
            xlFromQuote: 'Copie les lignes du devis Word vers Excel.',
            xlToQuote: 'Renvoie les quantités d’Excel vers le devis Word.'
        },
        'en-US': {
            paste: 'Pastes copied content. Click to keep formatting, merge, or paste text only.',
            table: 'Inserts a table (rows and columns) into the document.',
            xlPivot: 'Creates a pivot table to summarise the data.',
            tabDevis: 'Report, quote and tables in the document.',
            dlgPageSetup: 'Paper size (A4, Letter…), orientation and margins.',
            createQuote: 'Opens the form to create a quote.',
            createReceipt: 'Opens the form to create a commercial receipt.',
            previewQuote: 'Previews the quote as it will look on paper.',
            previewReceipt: 'Previews the receipt as it will look on paper.',
            viewQuoteCreated: 'Previews the quote already inserted in the document.',
            viewReceiptCreated: 'Previews the receipt already inserted in the document.',
            previewBeforeQuote: 'Shows the quote as a draft, before confirming.',
            previewBeforeReceipt: 'Shows the receipt as a draft, before confirming.',
            insertQuoteTbl: 'Inserts the quote items table into the report.',
            toQuote: 'Copies report lines into the quote.',
            toReceipt: 'Fills the receipt from the quote or the report.',
            xlBizTpl: 'Creates the business workbook (clients, items, quotes, VAT).',
            xlFromQuote: 'Copies Word quote lines into Excel.',
            xlToQuote: 'Sends Excel quantities back to the Word quote.'
        },
        'es-ES': {
            paste: 'Pega el contenido copiado. Pulse para mantener el formato, combinar o solo texto.',
            table: 'Inserta una tabla (filas y columnas) en el documento.',
            xlPivot: 'Crea una tabla dinámica para resumir los datos.',
            tabDevis: 'Informe, presupuesto y tablas del documento.',
            dlgPageSetup: 'Tamaño de papel (A4, Letter…), orientación y márgenes.',
            createQuote: 'Abre el formulario para crear un presupuesto.',
            createReceipt: 'Abre el formulario para crear un recibo comercial.',
            previewQuote: 'Previsualiza el presupuesto tal como saldrá en papel.',
            previewReceipt: 'Previsualiza el recibo tal como saldrá en papel.',
            viewQuoteCreated: 'Previsualiza el presupuesto ya insertado en el documento.',
            viewReceiptCreated: 'Previsualiza el recibo ya insertado en el documento.',
            previewBeforeQuote: 'Muestra el presupuesto en borrador, antes de confirmar.',
            previewBeforeReceipt: 'Muestra el recibo en borrador, antes de confirmar.',
            insertQuoteTbl: 'Inserta la tabla de artículos del presupuesto en el informe.',
            toQuote: 'Copia líneas del informe al presupuesto.',
            toReceipt: 'Rellena el recibo a partir del presupuesto o del informe.',
            xlBizTpl: 'Crea el libro de negocio (clientes, artículos, presupuestos, IVA).',
            xlFromQuote: 'Copia las líneas del presupuesto Word a Excel.',
            xlToQuote: 'Envía cantidades de Excel de vuelta al presupuesto Word.'
        }
    };

    function tt(key) {
        if (typeof window.t !== 'function') return '';
        var v = window.t(key);
        if (!v || v === key) return '';
        return String(v);
    }

    function mergeTips() {
        var dict = window.abeneI18n;
        if (!dict) return;
        Object.keys(TIPS).forEach(function (lang) {
            if (!dict[lang]) dict[lang] = {};
            Object.keys(TIPS[lang]).forEach(function (k) {
                dict[lang][k + 'Tip'] = TIPS[lang][k];
            });
        });
        var pt = TIPS['pt-PT'] || {};
        ['fr-FR', 'en-US', 'es-ES'].forEach(function (lang) {
            Object.keys(pt).forEach(function (k) {
                if (!dict[lang][k + 'Tip']) dict[lang][k + 'Tip'] = TIPS[lang][k] || pt[k];
            });
        });
    }

    function visibleName(el) {
        var k = el.getAttribute('data-i18n');
        if (k) {
            var n = tt(k);
            if (n) return n.replace(/\s*▾\s*$/, '').trim();
        }
        var span = el.querySelector('span:not(.icon)');
        if (span) return String(span.textContent || '').replace(/\s+/g, ' ').replace(/▾/g, '').trim();
        return '';
    }

    function meaning(el) {
        var keys = [el.getAttribute('data-i18n'), el.getAttribute('data-i18n-title')].filter(Boolean);
        var i, d;
        for (i = 0; i < keys.length; i++) {
            d = tt(keys[i] + 'Tip');
            if (d) return d;
        }
        var titleKey = el.getAttribute('data-i18n-title');
        if (titleKey) {
            d = tt(titleKey);
            if (d) return d;
        }
        return String(el.getAttribute('data-tip-src') || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
    }

    function prepare(el) {
        if (el.getAttribute('data-abene-tip') === '1') return;
        el.setAttribute('data-abene-tip', '1');
        if (!el.getAttribute('data-i18n')) {
            var inner = el.querySelector('[data-i18n]');
            if (inner) el.setAttribute('data-i18n', inner.getAttribute('data-i18n'));
        }
        if (!el.getAttribute('data-i18n-title')) {
            var k = el.getAttribute('data-i18n');
            if (k) el.setAttribute('data-i18n-title', k);
        }
        var name = visibleName(el);
        var desc = meaning(el);
        var full = desc && name && desc.indexOf(name) === 0 ? desc : (name && desc && name !== desc ? name + ' — ' + desc : (desc || name));
        if (full) {
            el.setAttribute('aria-label', full);
            el.setAttribute('data-tip-src', full);
            el.title = full;
        }
    }

    var SELECTOR = [
        '.ribbon-btn', '.ribbon-btn-sm', '.dlg-launcher', '.orient-btn',
        '.title-bar .quick-access button', '.title-bar .window-controls button',
        '.menu-bar button', '.status-bar button', '.view-buttons button',
        '.zoom-control button', '.zoom-control input', '.modelo-style-card',
        '.theme-swatch', '.color-input', 'select.ribbon-select',
        '[role="tab"]', '.ribbon-collapse-btn'
    ].join(',');

    function refreshAll() {
        mergeTips();
        document.querySelectorAll(SELECTOR).forEach(prepare);
    }

    var box = null;
    var hideTimer = 0;
    var showTimer = 0;
    var current = null;

    function ensureBox() {
        if (box) return box;
        box = document.createElement('div');
        box.className = 'abene-ui-tip';
        box.setAttribute('role', 'tooltip');
        document.body.appendChild(box);
        return box;
    }

    function hide() {
        clearTimeout(showTimer);
        if (box) box.style.display = 'none';
        if (current) {
            var src = current.getAttribute('data-tip-src');
            if (src) current.title = src;
            current = null;
        }
    }

    function place(el) {
        var r = el.getBoundingClientRect();
        var b = ensureBox();
        var pad = 8;
        var x = r.left;
        var y = r.bottom + 8;
        b.style.display = 'block';
        b.style.left = '0px';
        b.style.top = '0px';
        var w = b.offsetWidth;
        var h = b.offsetHeight;
        if (x + w > window.innerWidth - pad) x = window.innerWidth - w - pad;
        if (x < pad) x = pad;
        if (y + h > window.innerHeight - pad) y = r.top - h - 8;
        if (y < pad) y = pad;
        b.style.left = Math.round(x) + 'px';
        b.style.top = Math.round(y) + 'px';
    }

    function show(el) {
        var name = visibleName(el);
        var desc = meaning(el);
        if (!name && desc) {
            var split = desc.split(' — ');
            name = split[0];
            desc = split.slice(1).join(' — ');
        }
        if (!name && !desc) return;
        if (name && desc && (desc === name || desc.indexOf(name + ' — ') === 0 || desc.indexOf(name + ' —') === 0)) {
            name = desc.split(' — ')[0];
            desc = desc.indexOf(' — ') >= 0 ? desc.slice(desc.indexOf(' — ') + 3) : '';
        }
        var b = ensureBox();
        b.innerHTML = (name ? '<div class="n"></div>' : '') + (desc && desc !== name ? '<div class="d"></div>' : '');
        var nEl = b.querySelector('.n');
        var dEl = b.querySelector('.d');
        if (nEl) nEl.textContent = name;
        if (dEl) dEl.textContent = desc;
        if (!nEl && !dEl) {
            b.textContent = desc || name;
        }
        el.title = '';
        current = el;
        place(el);
    }

    function onOver(ev) {
        var el = ev.target && ev.target.closest(SELECTOR);
        if (!el || el.disabled) return;
        prepare(el);
        clearTimeout(hideTimer);
        clearTimeout(showTimer);
        showTimer = setTimeout(function () { show(el); }, 280);
    }

    function onOut(ev) {
        var el = ev.target && ev.target.closest(SELECTOR);
        if (!el) return;
        clearTimeout(showTimer);
        hideTimer = setTimeout(hide, 80);
    }

    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('mouseout', onOut, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); }, true);
    document.addEventListener('scroll', hide, true);

    var prev = window.abeneAfterI18n;
    window.abeneAfterI18n = function (lang) {
        if (typeof prev === 'function') prev(lang);
        refreshAll();
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refreshAll);
    else setTimeout(refreshAll, 0);
})();
