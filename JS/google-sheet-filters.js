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
    closeAllFilterDropdowns(); // Fecha outros dropdowns abertos

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

// Torna a função disponível globalmente
window.clearAllGoogleSheetFilters = clearAllGoogleSheetFilters;

function masterFilterFunction() {
    const tableRows = document.querySelectorAll('#detalhes table tbody tr');
    const activeFilterButtons = document.querySelectorAll('.google-sheet-filter-btn.filter-active, .google-sheet-filter-btn[data-active-filters]');
    
    console.log('Executando masterFilterFunction, botões ativos:', activeFilterButtons.length);
    
    // Verifica se há filtro ativo do painel de resumos
    const painelFilterAtivo = window.painelFilterStatus && window.painelFilterStatus !== 'TODOS';

    // Atualiza o botão "Limpar Filtros" com base nos filtros ativos
    const limparBtn = document.getElementById("btnLimparFiltros");
    if (limparBtn) {
        if (activeFilterButtons.length > 0 || painelFilterAtivo) {
            limparBtn.classList.add('filters-active');
        } else {
            limparBtn.classList.remove('filters-active');
        }
    }

    // Se não houver filtros ativos de colunas, verifica se há filtro do painel
    if (activeFilterButtons.length === 0 && !painelFilterAtivo) {
        tableRows.forEach(row => {
            row.style.display = '';
        });
        alternaCoresLinhas();
        return;
    }
    
    // Se temos apenas filtro do painel e nenhum filtro de coluna, deixamos o filtro do painel agir sozinho
    if (activeFilterButtons.length === 0 && painelFilterAtivo) {
        // Neste caso, o filtro já foi aplicado pelo filterTableByStatus
        alternaCoresLinhas();
        return;
    }

    tableRows.forEach(row => {
        let showRow = true;
        activeFilterButtons.forEach(button => {
            if (!showRow) return; // Otimização: se a linha já está marcada para não ser exibida, pule outros filtros

            const colIndex = button.dataset.colIndex;
            const activeFiltersData = button.getAttribute('data-active-filters');
            
            if (!activeFiltersData) {
                // Se não há dados de filtro (mas o botão tem a classe), pula este filtro
                return;
            }
            
            const activeFilters = JSON.parse(activeFiltersData);
            const cell = row.querySelectorAll('td')[colIndex];

            // Se não há filtros ativos para esta coluna (nenhuma checkbox marcada), mostra tudo
            if (activeFilters.length === 0) {
                return;
            }

            if (cell) {
                const cellValue = cell.textContent.trim().toLowerCase();
                // Lógica invertida: mostrar apenas os itens que estão selecionados
                if (!activeFilters.includes(cellValue)) {
                    showRow = false;
                }
            } else {
                // Se a célula não existe e um filtro está ativo para esta coluna, considera que não corresponde
                showRow = false;
            }
        });
        row.style.display = showRow ? '' : 'none';
    });
    alternaCoresLinhas(); // Reutiliza a função existente para atualizar as cores
}


function closeAllFilterDropdowns() {
    const dropdowns = document.querySelectorAll('.google-sheet-filter-dropdown');
    dropdowns.forEach(dropdown => dropdown.remove());
    document.removeEventListener('click', handleClickOutsideDropdown, true);
}

function handleClickOutsideDropdown(event) {
    const dropdown = document.querySelector('.google-sheet-filter-dropdown');
    if (dropdown && !dropdown.contains(event.target) && !event.target.classList.contains('google-sheet-filter-btn') && !event.target.closest('.google-sheet-filter-btn')) {
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
