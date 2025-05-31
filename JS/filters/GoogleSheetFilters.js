document.addEventListener('DOMContentLoaded', () => {
    initializeGoogleSheetFilters();
    initializeClearFiltersButton();
});

document.addEventListener('tabela-carregada', () => {
    // Adicionado setTimeout para garantir que o DOM esteja totalmente pronto
    setTimeout(() => {
        initializeGoogleSheetFilters();
        initializeClearFiltersButton();
    }, 100); 
});

function initializeGoogleSheetFilters() {
    const filterButtons = document.querySelectorAll('.google-sheet-filter-btn');
    filterButtons.forEach(button => {
        button.removeEventListener('click', handleFilterButtonClick); // Evita duplicidade
        button.addEventListener('click', handleFilterButtonClick);
    });
}

// Função para inicializar os filtros mobile (aplicado para todos não-desktop)
function initializeMobileFilters() {
    console.log('Inicializando filtros mobile');
    
    // Mapeia os campos de filtro mobile para as colunas correspondentes
    const mobileFilters = {
        'filtroIdPcaMobile': 0,
        'filter-area-mobile': 1,
        'filter-tipo-mobile': 2,
        'filtroProjeto': 3,
        'filtroStatusInicioMobile': 4,
        'filter-status-processo-mobile': 5,
        'filtroContratarAteMobile': 6,
        'filtroValorPcaMobile': 7,
        'filter-orcamento-mobile': 8,
        'filtroProcessoMobile': 9
    };
    
    // Preenche os selects com opções
    populateMobileSelectOptions();
    
    // Adiciona event listeners aos filtros mobile
    Object.keys(mobileFilters).forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            // Remove listener existente para evitar duplicação
            element.removeEventListener('input', handleMobileFilterChange);
            element.removeEventListener('change', handleMobileFilterChange);
            
            // Adiciona os novos listeners
            if (element.tagName === 'SELECT') {
                element.addEventListener('change', handleMobileFilterChange);
            } else {
                element.addEventListener('input', handleMobileFilterChange);
            }
            
            // Armazena o índice da coluna como atributo do elemento
            element.dataset.colIndex = mobileFilters[filterId];
        }
    });
}

// Preenche os selects mobile com opções da tabela
function populateMobileSelectOptions() {
    // Preenche o select de Área
    populateMobileSelect('filter-area-mobile', 1);
    
    // Preenche o select de Tipo
    populateMobileSelect('filter-tipo-mobile', 2);
    
    // Preenche o select de Status do Processo
    populateMobileSelect('filter-status-processo-mobile', 5);
    
    // Preenche o select de Orçamento
    populateMobileSelect('filter-orcamento-mobile', 8);
}

// Função auxiliar para preencher um select mobile com valores únicos de uma coluna
function populateMobileSelect(selectId, columnIndex) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const uniqueValues = getUniqueColumnValues(columnIndex);
    
    // Limpa as opções atuais, mantendo a primeira opção (vazia)
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Adiciona as novas opções
    uniqueValues.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}

// Handler para eventos de filtros mobile
function handleMobileFilterChange(event) {
    const element = event.target;
    const columnIndex = parseInt(element.dataset.colIndex);
    const value = element.value.trim().toLowerCase();
    
    // Se o filtro não tem valor, remova qualquer filtro ativo para esta coluna
    if (!value) {
        const filterButton = document.querySelector(`.google-sheet-filter-btn[data-col-index="${columnIndex}"]`);
        if (filterButton) {
            filterButton.removeAttribute('data-active-filters');
            filterButton.classList.remove('filter-active');
        }
    } else {
        // Aplica o filtro para esta coluna
        applyMobileFilter(columnIndex, value);
    }
    
    // Atualiza a visualização da tabela
    masterFilterFunction();
}

// Aplica um filtro a partir de um controle mobile
function applyMobileFilter(columnIndex, filterValue) {
    const filterButton = document.querySelector(`.google-sheet-filter-btn[data-col-index="${columnIndex}"]`);
    if (!filterButton) return;
    
    // Busca todos os valores da coluna
    const allValues = getUniqueColumnValues(columnIndex);
    
    // Filtra os valores que correspondem ao critério
    const matchingValues = allValues.filter(value => 
        value.toLowerCase().includes(filterValue)
    ).map(value => value.toLowerCase());
    
    // Aplica o filtro (se não houver correspondências, mantém tudo visível)
    if (matchingValues.length > 0) {
        filterButton.setAttribute('data-active-filters', JSON.stringify(matchingValues));
        filterButton.classList.add('filter-active');
    } else {
        filterButton.removeAttribute('data-active-filters');
        filterButton.classList.remove('filter-active');
    }
}

// Função para inicializar o botão de limpar filtros
function initializeClearFiltersButton() {
    const limparBtn = document.getElementById("btnLimparFiltros");
    if (limparBtn) {
        console.log('Botão Limpar Filtros encontrado, adicionando event listener');
        
        // Remove qualquer listener anterior para evitar duplicação
        limparBtn.removeEventListener('click', clearAllGoogleSheetFilters);
        
        // Adiciona o listener diretamente à função global
        limparBtn.addEventListener('click', function(event) {
            console.log('Botão Limpar Filtros clicado');
            clearAllGoogleSheetFilters();
        });
    } else {
        console.warn('Botão Limpar Filtros não encontrado no DOM');
    }
}

// Função nomeada para o handler para poder removê-la corretamente.
function handleFilterButtonClick(event) {
    const columnIndex = event.currentTarget.dataset.colIndex;
    openFilterDropdown(event.currentTarget, columnIndex);
}

function openFilterDropdown(button, columnIndex) {
    // Fecha outros dropdowns abertos ANTES de criar o novo
    closeAllFilterDropdowns();
    
    // Fecha também dropdowns mobile se abertos
    if (typeof closeMobileFilterDropdowns === 'function') {
        closeMobileFilterDropdowns();
    }

    const dropdown = document.createElement('div');
    dropdown.classList.add('google-sheet-filter-dropdown');
    dropdown.style.position = 'absolute';
    dropdown.style.zIndex = '1000';
    // Armazenar o índice da coluna como atributo do dropdown
    dropdown.dataset.columnIndex = columnIndex;

    const rect = button.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + window.scrollY}px`;
    dropdown.style.left = `${rect.left + window.scrollX}px`;

    // Criar um contêiner fixo para a barra de pesquisa e botão "Selecionar Tudo"
    const fixedTopContainer = document.createElement('div');
    fixedTopContainer.className = 'filter-fixed-top';
    
    // Barra de pesquisa
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Pesquisar...';
    searchInput.addEventListener('keyup', () => filterDropdownOptions(searchInput.value, dropdown));
    fixedTopContainer.appendChild(searchInput);
      // Checkbox "Selecionar Tudo"
    const selectAllCheckbox = createCheckbox('Selecionar Tudo', 'select-all');
    selectAllCheckbox.value = 'Selecionar Tudo';
    selectAllCheckbox.checked = false; // Inicialmente desmarcado, será atualizado depois
    selectAllCheckbox.addEventListener('change', () => {
        toggleAllOptions(dropdown, selectAllCheckbox.checked);
        // Aplicar filtros imediatamente quando o "Selecionar Tudo" for alterado
        applyFilters(columnIndex, dropdown);
    });
    fixedTopContainer.appendChild(createLabel(selectAllCheckbox, 'Selecionar Tudo'));
    
    dropdown.appendChild(fixedTopContainer);

    // Contêiner para os checkboxes com scroll
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'filter-options-container';
      // Adicionar as opções ao contêiner com scroll
    const uniqueValues = getUniqueColumnValues(columnIndex);
    
    // Verificar se existem filtros ativos para esta coluna
    const filterButton = document.querySelector(`.google-sheet-filter-btn[data-col-index="${columnIndex}"]`);
    let activeFilters = [];
    if (filterButton && filterButton.hasAttribute('data-active-filters')) {
        try {
            activeFilters = JSON.parse(filterButton.getAttribute('data-active-filters')) || [];
        } catch (e) {
            console.error('Erro ao analisar filtros ativos:', e);
            activeFilters = [];
        }
    }
    
    uniqueValues.forEach(value => {
        const checkbox = createCheckbox(value, value);
        // Verificar se este valor está nos filtros ativos
        checkbox.checked = activeFilters.includes(value.toLowerCase());
        
        // Adicionar evento para aplicar filtros imediatamente quando a checkbox for alterada
        checkbox.addEventListener('change', () => {
            // Se todas as checkboxes forem marcadas, marcar também "Selecionar Tudo"
            updateSelectAllState(dropdown);
            // Aplicar filtros imediatamente
            applyFilters(columnIndex, dropdown);
        });
        optionsContainer.appendChild(createLabel(checkbox, value));    });
    
    dropdown.appendChild(optionsContainer);

    // Atualizar o estado do checkbox "Selecionar Tudo" com base nas opções marcadas
    setTimeout(() => updateSelectAllState(dropdown), 0);

    // Criar contêiner fixo para o botão Limpar no fundo
    const fixedBottomContainer = document.createElement('div');
    fixedBottomContainer.className = 'filter-fixed-bottom';
    
    // Apenas o botão Limpar
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Limpar';
    clearButton.style.width = '100%'; // Ocupar todo o espaço disponível
    clearButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Impedir que o dropdown feche
        clearFilter(columnIndex, dropdown, false); // Não fechar dropdown
    });
    fixedBottomContainer.appendChild(clearButton);
    
    dropdown.appendChild(fixedBottomContainer);

    document.body.appendChild(dropdown);

    // Adiciona um event listener para fechar o dropdown se clicar fora dele
    document.removeEventListener('click', handleClickOutsideDropdown, true);
    document.addEventListener('click', handleClickOutsideDropdown, true);
}

function createCheckbox(value, id) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `filter-opt-${id.replace(/\\s+/g, '-')}`; // Garante IDs únicos
    checkbox.value = value;
    checkbox.classList.add('filter-option-checkbox');
    return checkbox;
}

function createLabel(checkbox, text) {
    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(text || '(Vazio)')); // Mostra (Vazio) para valores nulos ou vazios
    label.style.display = 'block'; // Garante que cada opção fique em uma nova linha
    return label;
}


function getUniqueColumnValues(columnIndex) {
    const tableRows = document.querySelectorAll('#detalhes table tbody tr');
    const values = new Set();
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td'); // Mais seguro para pegar a célula
        if (cells && cells[columnIndex]) {
            values.add(cells[columnIndex].textContent.trim());
        }
    });
    return Array.from(values).sort();
}

function filterDropdownOptions(searchTerm, dropdown) {
    const labels = dropdown.querySelectorAll('label');
    labels.forEach(label => {
        const text = label.textContent.toLowerCase();
        const checkbox = label.querySelector('input[type="checkbox"]');
        // Não oculta o "Selecionar Tudo"
        if (checkbox && checkbox.value === 'Selecionar Tudo') {
            label.style.display = 'block';
            return;
        }
        if (text.includes(searchTerm.toLowerCase())) {
            label.style.display = 'block';
        } else {
            label.style.display = 'none';
        }
    });
}

function toggleAllOptions(dropdown, checked) {
    // Seleciona apenas os checkboxes dentro do contêiner de opções
    const checkboxes = dropdown.querySelector('.filter-options-container').querySelectorAll('.filter-option-checkbox');
    checkboxes.forEach(checkbox => {
        // Só altera checkboxes visíveis (após pesquisa)
        const label = checkbox.closest('label');
        if (label.style.display !== 'none') {
            checkbox.checked = checked;
        }
    });
}

function applyFilters(columnIndex, dropdown) {
    const selectedValues = [];
    
    // Coletamos todos os checkboxes marcados, exceto o "Selecionar Tudo"
    const checkboxes = dropdown.querySelectorAll('.filter-option-checkbox:checked');
    checkboxes.forEach(checkbox => {
        if (checkbox.value !== 'Selecionar Tudo') {
            selectedValues.push(checkbox.value.toLowerCase());
        }
    });
    
    // Armazena o estado do filtro globalmente ou em um atributo no botão
    const filterButton = document.querySelector(`.google-sheet-filter-btn[data-col-index="${columnIndex}"]`);
    if (filterButton) {
        // Se não há valores selecionados, remove o filtro
        if (selectedValues.length === 0) {
            filterButton.removeAttribute('data-active-filters');
            filterButton.classList.remove('filter-active');
            console.log(`Removendo filtro da coluna ${columnIndex} - nenhum valor selecionado, mostrando todos`);
        } else {
            // Aplica o filtro
            filterButton.setAttribute('data-active-filters', JSON.stringify(selectedValues));
            filterButton.classList.add('filter-active');
            console.log(`Aplicando filtro na coluna ${columnIndex} com valores:`, selectedValues);
        }
    }

    // Chama uma função de filtro global que considera todos os filtros ativos
    masterFilterFunction();
}

function clearFilter(columnIndex, dropdown, closeAfter = true) {
    // Desmarca "Selecionar Tudo"
    const selectAllCheckbox = dropdown.querySelector('input[value="Selecionar Tudo"]');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
    }
    
    // Desmarca todas as opções individuais
    toggleAllOptions(dropdown, false);

    // Limpa a pesquisa
    const searchInput = dropdown.querySelector('input[type="text"]');
    if (searchInput) {
        searchInput.value = '';
        filterDropdownOptions('', dropdown); // Mostra todas as opções
    }
    
    // Remove o estado do filtro do botão
    const filterButton = document.querySelector(`.google-sheet-filter-btn[data-col-index="${columnIndex}"]`);
    if (filterButton) {
        filterButton.removeAttribute('data-active-filters');
        filterButton.classList.remove('filter-active');
    }

    // Reaplica os filtros (que agora mostrará tudo para esta coluna)
    masterFilterFunction();
    
    // Fecha o dropdown se solicitado
    if (closeAfter) {
        closeAllFilterDropdowns();
    }
}

// Nova função para atualizar o estado do checkbox "Selecionar Tudo"
function updateSelectAllState(dropdown) {
    const totalCheckboxes = dropdown.querySelectorAll('.filter-options-container .filter-option-checkbox').length;
    const checkedCheckboxes = dropdown.querySelectorAll('.filter-options-container .filter-option-checkbox:checked').length;
    
    const selectAllCheckbox = dropdown.querySelector('input[value="Selecionar Tudo"]');
    if (selectAllCheckbox) {
        // Marca "Selecionar Tudo" se todas as opções estiverem marcadas, desmarca caso contrário
        selectAllCheckbox.checked = (checkedCheckboxes === totalCheckboxes);
    }
}

// Função para limpar todos os filtros das colunas
function clearAllGoogleSheetFilters() {
    console.log('Limpando todos os filtros');
    
    // Remove filtros ativos do Google Sheet
    const filterButtons = document.querySelectorAll('.google-sheet-filter-btn');
    filterButtons.forEach(button => {
        button.classList.remove('filter-active');
        delete button.dataset.activeFilters;
    });
    
    // Remove classe de destaque do botão Limpar Filtros
    const limparBtn = document.getElementById("btnLimparFiltros");
    if (limparBtn) {
        limparBtn.classList.remove('filters-active');
    }
    
    // Limpa filtros do painel de resumos
    if (typeof resetPainelFilterStatus === 'function') {
        resetPainelFilterStatus();
    }
    
    // Limpa os filtros mobile
    clearMobileFilters();
    
    // Mostra todas as linhas da tabela
    const tableRows = document.querySelectorAll('table tbody tr');
    tableRows.forEach(row => {
        row.style.display = '';
    });
    
    // Atualiza contadores e visuais
    if (typeof updateStatusCounts === 'function') {
        updateStatusCounts();
    }
    
    console.log('Todos os filtros foram limpos');
}

// Função para limpar todos os filtros mobile
function clearMobileFilters() {
    // IDs dos filtros mobile a serem limpos
    const mobileFilterIds = [
        'filtroIdPcaMobile',
        'filter-area-mobile',
        'filter-tipo-mobile',
        'filtroProjeto',
        'filtroStatusInicioMobile',
        'filter-status-processo-mobile',
        'filtroContratarAteMobile',
        'filtroValorPcaMobile',
        'filter-orcamento-mobile',
        'filtroProcessoMobile'
    ];
    
    // Limpa o valor de cada filtro
    mobileFilterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });
}

// Torna a função disponível globalmente
window.clearAllGoogleSheetFilters = clearAllGoogleSheetFilters;

function masterFilterFunction() {
    const tableRows = document.querySelectorAll('#detalhes table tbody tr');
    // Renomeado para clareza e consistência na nomenclatura
    const activeColumnFilterButtons = document.querySelectorAll('.google-sheet-filter-btn.filter-active, .google-sheet-filter-btn[data-active-filters]');

    const painelFilterAtivo = window.painelFilterStatus && window.painelFilterStatus !== 'TODOS';

    // Atualiza o botão "Limpar Filtros" com base nos filtros ativos
    const limparBtn = document.getElementById("btnLimparFiltros");
    if (limparBtn) {
        if (activeColumnFilterButtons.length > 0 || painelFilterAtivo) {
            limparBtn.classList.add('filters-active');
        } else {
            limparBtn.classList.remove('filters-active');
        }
    }

    // 1. Determinar visibilidade inicial baseada no filtro do painel (se ativo)
    if (painelFilterAtivo) {
        // Presume-se que filterTableByStatus modifica row.style.display diretamente
        filterTableByStatus(window.painelFilterStatus);
    } else {
        // Se o filtro do painel não está ativo, todas as linhas devem começar visíveis
        // antes de aplicar os filtros de coluna.
        tableRows.forEach(row => {
            row.style.display = '';
        });
    }

    // 2. Se não há filtros de coluna, o trabalho está feito.
    // A visibilidade já foi definida pelo filtro do painel ou resetada para todas as linhas visíveis.
    if (activeColumnFilterButtons.length === 0) {
        alternaCoresLinhas();
        if (typeof updateStatusCounts === 'function') {
            updateStatusCounts();
        }
        return;
    }

    // 3. Aplicar filtros de coluna nas linhas que estão atualmente visíveis
    tableRows.forEach(row => {
        // Se a linha já está escondida (pelo filtro do painel), não a processe mais.
        if (row.style.display === 'none') {
            return;
        }

        let rowPassesAllColumnFilters = true;
        activeColumnFilterButtons.forEach(button => {
            if (!rowPassesAllColumnFilters) return; // Otimização: se já falhou em um filtro, pule os outros

            const colIndex = button.dataset.colIndex;
            const activeFiltersData = button.getAttribute('data-active-filters');

            if (!activeFiltersData) { // Pular se o botão está marcado como ativo mas não tem dados de filtro
                return;
            }

            const activeFilters = JSON.parse(activeFiltersData);
            // Se não há valores selecionados para esta coluna específica (ex: dropdown limpo),
            // a linha passa neste filtro de coluna.
            if (activeFilters.length === 0) {
                return;
            }

            const cell = row.querySelectorAll('td')[colIndex];
            if (cell) {
                const cellValue = cell.textContent.trim().toLowerCase();
                if (!activeFilters.includes(cellValue)) {
                    rowPassesAllColumnFilters = false; // Não corresponde ao filtro desta coluna
                }
            } else {
                // Se a célula não existe e um filtro está ativo para esta coluna, considera que não corresponde
                rowPassesAllColumnFilters = false;
            }
        });

        // Se a linha não passou em algum dos filtros de coluna, esconda-a.
        // Caso contrário, ela permanece visível (estado definido no passo 1 ou pelo reset).
        if (!rowPassesAllColumnFilters) {
            row.style.display = 'none';
        }
    });

    alternaCoresLinhas(); // Reutiliza a função existente para atualizar as cores
    // Atualiza contadores e visuais, se existirem
    if (typeof updateStatusCounts === 'function') {
        updateStatusCounts();
    }
}


function closeAllFilterDropdowns() {
    // Remove todos os dropdowns existentes
    const dropdowns = document.querySelectorAll('.google-sheet-filter-dropdown');
    dropdowns.forEach(dropdown => dropdown.remove());
    
    // Remove event listener de clique externo
    document.removeEventListener('click', handleClickOutsideDropdown, true);
}

function handleClickOutsideDropdown(event) {
    const dropdown = document.querySelector('.google-sheet-filter-dropdown');
    if (dropdown && !dropdown.contains(event.target) && 
        !event.target.classList.contains('google-sheet-filter-btn') && 
        !event.target.closest('.google-sheet-filter-btn')) {
        closeAllFilterDropdowns();
    }
}

// Função para alternar cores das linhas (pode ser movida ou importada se já existir em outro lugar)
function alternaCoresLinhas() {
    const tabela = document.querySelector("#detalhes table");
    if (!tabela) return;
    const linhasVisiveis = Array.from(tabela.querySelectorAll('tbody tr'))
        .filter(tr => tr.style.display !== 'none');
    linhasVisiveis.forEach((tr, idx) => {
        tr.classList.remove('linha-par', 'linha-impar');
        if (idx % 2 === 0) {
            tr.classList.add('linha-par');
        } else {
            tr.classList.add('linha-impar');
        }
    });
}
