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
    selectAllCheckbox.checked = true;
    selectAllCheckbox.addEventListener('change', () => toggleAllOptions(dropdown, selectAllCheckbox.checked));
    fixedTopContainer.appendChild(createLabel(selectAllCheckbox, 'Selecionar Tudo'));
    
    dropdown.appendChild(fixedTopContainer);

    // Contêiner para os checkboxes com scroll
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'filter-options-container';
    
    // Adicionar as opções ao contêiner com scroll
    const uniqueValues = getUniqueColumnValues(columnIndex);
    uniqueValues.forEach(value => {
        const checkbox = createCheckbox(value, value);
        checkbox.checked = true; // Por padrão, todos selecionados
        optionsContainer.appendChild(createLabel(checkbox, value));
    });
    
    dropdown.appendChild(optionsContainer);

    // Criar contêiner fixo para os botões no fundo
    const fixedBottomContainer = document.createElement('div');
    fixedBottomContainer.className = 'filter-fixed-bottom';
    
    // Botão Aplicar
    const applyButton = document.createElement('button');
    applyButton.textContent = 'Aplicar';
    applyButton.addEventListener('click', () => applyFilters(columnIndex, dropdown));
    fixedBottomContainer.appendChild(applyButton);

    // Botão Limpar
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Limpar';
    clearButton.addEventListener('click', () => clearFilter(columnIndex, dropdown));
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
        // Se "Selecionar Tudo" está marcado E todos os valores estão selecionados, remove o filtro
        const selectAllCheckbox = dropdown.querySelector('input[value="Selecionar Tudo"]');
        const selectAllIsChecked = selectAllCheckbox ? selectAllCheckbox.checked : false;
        const totalUniqueValues = getUniqueColumnValues(columnIndex).length;
        
        if (selectAllIsChecked && selectedValues.length === totalUniqueValues) {
            // Remove o filtro se tudo estiver selecionado
            filterButton.removeAttribute('data-active-filters');
            filterButton.classList.remove('filter-active');
            console.log(`Removendo filtro da coluna ${columnIndex}`);
        } else {
            // Aplica o filtro
            filterButton.setAttribute('data-active-filters', JSON.stringify(selectedValues));
            filterButton.classList.add('filter-active');
            console.log(`Aplicando filtro na coluna ${columnIndex} com valores:`, selectedValues);
        }
    }

    // Chama uma função de filtro global que considera todos os filtros ativos
    masterFilterFunction();
    closeAllFilterDropdowns();
}

function clearFilter(columnIndex, dropdown) {
    // Marca "Selecionar Tudo"
    const selectAllCheckbox = dropdown.querySelector('input[value="Selecionar Tudo"]');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = true;
    }
    
    // Marca todas as opções individuais
    toggleAllOptions(dropdown, true);

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
    closeAllFilterDropdowns();
}

// Função global para limpar todos os filtros (pode ser chamada pelo botão "Limpar Filtros")
function clearAllGoogleSheetFilters() {
    console.log('Limpando todos os filtros');
    
    // Seleciona todos os botões de filtro ativos
    const activeFilterButtons = document.querySelectorAll('.google-sheet-filter-btn.filter-active, .google-sheet-filter-btn[data-active-filters]');
    
    console.log('Botões de filtro ativos encontrados:', activeFilterButtons.length);
    
    // Remove os atributos e classes de filtro ativo
    activeFilterButtons.forEach(button => {
        delete button.dataset.activeFilters;
        button.classList.remove('filter-active');
    });
    
    // Fecha qualquer dropdown aberto
    closeAllFilterDropdowns();
    
    // Mostra todas as linhas da tabela
    const tableRows = document.querySelectorAll('#detalhes table tbody tr');
    tableRows.forEach(row => {
        row.style.display = '';
    });
    
    // Reaplica as cores alternadas
    alternaCoresLinhas();
    
    console.log('Filtros limpos com sucesso');
}

// Torna a função disponível globalmente
window.clearAllGoogleSheetFilters = clearAllGoogleSheetFilters;

function masterFilterFunction() {
    const tableRows = document.querySelectorAll('#detalhes table tbody tr');
    const activeFilterButtons = document.querySelectorAll('.google-sheet-filter-btn.filter-active, .google-sheet-filter-btn[data-active-filters]');
    
    console.log('Executando masterFilterFunction, botões ativos:', activeFilterButtons.length);

    // Se não houver filtros ativos, mostra todas as linhas
    if (activeFilterButtons.length === 0) {
        tableRows.forEach(row => {
            row.style.display = '';
        });
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

            if (cell) {
                const cellValue = cell.textContent.trim().toLowerCase();
                // Se o filtro para esta coluna está ativo (ou seja, activeFilters foi definido):
                // 1. Se activeFilters está vazio, significa que nada foi selecionado, então a linha não corresponde.
                // 2. Se activeFilters não está vazio, mas o valor da célula não está incluído, a linha não corresponde.
                if (activeFilters.length === 0) {
                    showRow = false;
                } else if (!activeFilters.includes(cellValue)) {
                    showRow = false;
                }
            } else {
                // Se a célula não existe e um filtro está ativo para esta coluna, considera que não corresponde.
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
