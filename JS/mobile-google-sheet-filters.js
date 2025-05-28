/**
 * mobile-google-sheet-filters.js - Sistema de filtros mobile seguindo padrão Google Sheets
 * 
 * Este script redesenha os filtros mobile para seguir exatamente o mesmo padrão
 * dos filtros web Google Sheets, garantindo consistência e funcionalidade.
 * 
 * Características:
 *  - Botões de filtro mobile com dropdowns idênticos ao sistema web
 *  - Mesma funcionalidade de checkbox múltiplo
 *  - Integração completa com masterFilterFunction
 *  - Interface responsiva e otimizada para mobile
 */

document.addEventListener('DOMContentLoaded', () => {
    initializeMobileGoogleSheetFilters();
});

document.addEventListener('tabela-carregada', () => {
    setTimeout(() => {
        initializeMobileGoogleSheetFilters();
    }, 200);
});

// Configuração dos filtros mobile com mapeamento para colunas
const MOBILE_FILTER_CONFIG = {
    'mobile-filter-id': { columnIndex: 0, label: 'ID PCA' },
    'mobile-filter-area': { columnIndex: 1, label: 'Área' },
    'mobile-filter-tipo': { columnIndex: 2, label: 'Tipo' },
    'mobile-filter-projeto': { columnIndex: 3, label: 'Projeto' },
    'mobile-filter-status-inicio': { columnIndex: 4, label: 'Status Início' },
    'mobile-filter-status-processo': { columnIndex: 5, label: 'Status Processo' },
    'mobile-filter-contratar-ate': { columnIndex: 6, label: 'Contratar Até' },
    'mobile-filter-valor': { columnIndex: 7, label: 'Valor PCA' },
    'mobile-filter-orcamento': { columnIndex: 8, label: 'Orçamento' },
    'mobile-filter-processo': { columnIndex: 9, label: 'Processo' }
};

// Inicializa o sistema de filtros mobile estilo Google Sheets
function initializeMobileGoogleSheetFilters() {
    console.log('Inicializando filtros mobile estilo Google Sheets');
    
    // Cria os botões de filtro mobile
    createMobileFilterButtons();
    
    // Inicializa o botão limpar filtros mobile
    initializeMobileActionButtons();
    
    console.log('Filtros mobile inicializados com sucesso');
}

// Cria os botões de filtro mobile seguindo o padrão Google Sheets
function createMobileFilterButtons() {
    const mobileFiltersContainer = document.getElementById('mobile-filters');
    if (!mobileFiltersContainer) return;
    
    // Limpa o conteúdo atual, mantendo apenas o summary
    const summary = mobileFiltersContainer.querySelector('summary');
    mobileFiltersContainer.innerHTML = '';
    if (summary) {
        mobileFiltersContainer.appendChild(summary);
    }
    
    // Cria container para os botões de filtro
    const filtersContainer = document.createElement('div');
    filtersContainer.className = 'mobile-filters-container';
    
    // Cria cada botão de filtro
    Object.entries(MOBILE_FILTER_CONFIG).forEach(([filterId, config]) => {
        const filterButton = createMobileFilterButton(filterId, config);
        filtersContainer.appendChild(filterButton);
    });
    
    // Adiciona botão de limpar filtros
    const clearButton = document.createElement('button');
    clearButton.className = 'btn-limpar-filtros-mobile';
    clearButton.id = 'btnLimparFiltrosMobile';
    clearButton.innerHTML = 'Limpar Filtros <span class="emoji-icon">🚮</span>';
    filtersContainer.appendChild(clearButton);
    
    mobileFiltersContainer.appendChild(filtersContainer);
}

// Cria um botão de filtro mobile individual
function createMobileFilterButton(filterId, config) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'mobile-filter-button-container';
    
    const button = document.createElement('button');
    button.className = 'mobile-google-sheet-filter-btn';
    button.id = filterId;
    button.dataset.colIndex = config.columnIndex;
    button.innerHTML = `${config.label} <span class="filter-icon">▼</span>`;
    
    // Adiciona event listener
    button.addEventListener('click', (event) => {
        openMobileFilterDropdown(event.currentTarget, config.columnIndex);
    });
    
    buttonContainer.appendChild(button);
    return buttonContainer;
}

// Abre o dropdown de filtro mobile (idêntico ao sistema web)
function openMobileFilterDropdown(button, columnIndex) {
    closeMobileFilterDropdowns();
    
    const dropdown = document.createElement('div');
    dropdown.classList.add('mobile-google-sheet-filter-dropdown');
    dropdown.style.position = 'fixed';
    dropdown.style.zIndex = '1000';
    dropdown.dataset.columnIndex = columnIndex;

    // Posicionamento responsivo
    const rect = button.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 400; // altura estimada do dropdown
    
    if (rect.bottom + dropdownHeight > viewportHeight) {
        // Abre para cima se não há espaço embaixo
        dropdown.style.bottom = `${viewportHeight - rect.top + 5}px`;
    } else {
        // Abre para baixo normalmente
        dropdown.style.top = `${rect.bottom + 5}px`;
    }
    
    dropdown.style.left = `${Math.max(10, rect.left)}px`;
    dropdown.style.right = '10px';

    // Container fixo superior com barra de pesquisa e "Selecionar Tudo"
    const fixedTopContainer = document.createElement('div');
    fixedTopContainer.className = 'filter-fixed-top';
    
    // Barra de pesquisa
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Pesquisar...';
    searchInput.addEventListener('keyup', () => filterMobileDropdownOptions(searchInput.value, dropdown));
    fixedTopContainer.appendChild(searchInput);
    
    // Checkbox "Selecionar Tudo"
    const selectAllCheckbox = createMobileCheckbox('Selecionar Tudo', 'mobile-select-all');
    selectAllCheckbox.value = 'Selecionar Tudo';
    selectAllCheckbox.checked = false;
    selectAllCheckbox.addEventListener('change', () => {
        toggleAllMobileOptions(dropdown, selectAllCheckbox.checked);
        applyMobileFilters(columnIndex, dropdown);
    });
    fixedTopContainer.appendChild(createMobileLabel(selectAllCheckbox, 'Selecionar Tudo'));
    
    dropdown.appendChild(fixedTopContainer);

    // Container de opções com scroll
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'filter-options-container';
    
    // Adiciona as opções
    const uniqueValues = getUniqueColumnValues(columnIndex);
    
    // Verifica filtros ativos
    const filterButton = document.querySelector(`.google-sheet-filter-btn[data-col-index="${columnIndex}"]`);
    let activeFilters = [];
    if (filterButton && filterButton.hasAttribute('data-active-filters')) {
        try {
            activeFilters = JSON.parse(filterButton.getAttribute('data-active-filters'));
        } catch (e) {
            activeFilters = [];
        }
    }
    
    uniqueValues.forEach(value => {
        const checkbox = createMobileCheckbox(value, `mobile-filter-opt-${value.replace(/\s+/g, '-')}`);
        checkbox.value = value;
        
        // Marca se está nos filtros ativos
        if (activeFilters.length === 0 || activeFilters.includes(value.toLowerCase())) {
            checkbox.checked = true;
        }
        
        checkbox.addEventListener('change', () => {
            updateMobileSelectAllState(dropdown);
            applyMobileFilters(columnIndex, dropdown);
        });
        
        optionsContainer.appendChild(createMobileLabel(checkbox, value || '(Vazio)'));
    });
    
    dropdown.appendChild(optionsContainer);

    // Atualiza estado do "Selecionar Tudo"
    setTimeout(() => updateMobileSelectAllState(dropdown), 0);    // Container fixo inferior com botões Limpar e OK
    const fixedBottomContainer = document.createElement('div');
    fixedBottomContainer.className = 'filter-fixed-bottom';
    
    // Container para os botões lado a lado
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '10px';
    buttonsContainer.style.width = '100%';
    
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Limpar';
    clearButton.style.flex = '1';
    clearButton.addEventListener('click', (e) => {
        e.stopPropagation();
        clearMobileFilter(columnIndex, dropdown);
    });
    
    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.style.flex = '1';
    okButton.style.backgroundColor = '#1a73e8';
    okButton.style.color = 'white';
    okButton.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMobileFilterDropdowns();
    });
    
    buttonsContainer.appendChild(clearButton);
    buttonsContainer.appendChild(okButton);
    fixedBottomContainer.appendChild(buttonsContainer);
    
    dropdown.appendChild(fixedBottomContainer);

    document.body.appendChild(dropdown);

    // Event listener para fechar ao clicar fora
    document.removeEventListener('click', handleMobileClickOutsideDropdown, true);
    document.addEventListener('click', handleMobileClickOutsideDropdown, true);
}

// Funções auxiliares para criar elementos do dropdown mobile
function createMobileCheckbox(value, id) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.value = value;
    checkbox.classList.add('mobile-filter-option-checkbox');
    return checkbox;
}

function createMobileLabel(checkbox, text) {
    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(text || '(Vazio)'));
    label.style.display = 'block';
    return label;
}

// Filtra as opções do dropdown mobile baseado na pesquisa
function filterMobileDropdownOptions(searchTerm, dropdown) {
    const labels = dropdown.querySelectorAll('label');
    labels.forEach(label => {
        const text = label.textContent.toLowerCase();
        const shouldShow = text.includes(searchTerm.toLowerCase()) || label.querySelector('input').value === 'Selecionar Tudo';
        label.style.display = shouldShow ? 'block' : 'none';
    });
}

// Alterna todas as opções do dropdown mobile
function toggleAllMobileOptions(dropdown, checked) {
    const checkboxes = dropdown.querySelector('.filter-options-container').querySelectorAll('.mobile-filter-option-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = checked;
    });
}

// Aplica os filtros selecionados no dropdown mobile
function applyMobileFilters(columnIndex, dropdown) {
    const selectedValues = [];
    
    const checkboxes = dropdown.querySelectorAll('.mobile-filter-option-checkbox:checked');
    checkboxes.forEach(checkbox => {
        if (checkbox.value !== 'Selecionar Tudo') {
            selectedValues.push(checkbox.value.toLowerCase());
        }
    });
    
    // Encontra o botão de filtro Google Sheets correspondente
    const filterButton = document.querySelector(`.google-sheet-filter-btn[data-col-index="${columnIndex}"]`);
    if (filterButton) {
        if (selectedValues.length === 0) {
            filterButton.removeAttribute('data-active-filters');
            filterButton.classList.remove('filter-active');
        } else {
            filterButton.setAttribute('data-active-filters', JSON.stringify(selectedValues));
            filterButton.classList.add('filter-active');
        }
    }
    
    // Marca o botão mobile como ativo se há filtros
    const mobileButton = dropdown.closest('body').querySelector(`.mobile-google-sheet-filter-btn[data-col-index="${columnIndex}"]`);
    if (mobileButton) {
        if (selectedValues.length === 0) {
            mobileButton.classList.remove('filter-active');
        } else {
            mobileButton.classList.add('filter-active');
        }
    }

    // Aplica o filtro na tabela
    masterFilterFunction();
}

// Limpa o filtro de uma coluna específica no mobile
function clearMobileFilter(columnIndex, dropdown, closeAfter = true) {
    // Desmarca "Selecionar Tudo"
    const selectAllCheckbox = dropdown.querySelector('input[value="Selecionar Tudo"]');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
    }
    
    // Desmarca todas as opções
    toggleAllMobileOptions(dropdown, false);

    // Limpa a pesquisa
    const searchInput = dropdown.querySelector('input[type="text"]');
    if (searchInput) {
        searchInput.value = '';
        filterMobileDropdownOptions('', dropdown);
    }
    
    // Remove filtro do botão Google Sheets
    const filterButton = document.querySelector(`.google-sheet-filter-btn[data-col-index="${columnIndex}"]`);
    if (filterButton) {
        filterButton.removeAttribute('data-active-filters');
        filterButton.classList.remove('filter-active');
    }
    
    // Remove filtro do botão mobile
    const mobileButton = document.querySelector(`.mobile-google-sheet-filter-btn[data-col-index="${columnIndex}"]`);
    if (mobileButton) {
        mobileButton.classList.remove('filter-active');
    }

    // Reaplica os filtros
    masterFilterFunction();
    
    if (closeAfter) {
        closeMobileFilterDropdowns();
    }
}

// Atualiza o estado do checkbox "Selecionar Tudo" no mobile
function updateMobileSelectAllState(dropdown) {
    const totalCheckboxes = dropdown.querySelectorAll('.filter-options-container .mobile-filter-option-checkbox').length;
    const checkedCheckboxes = dropdown.querySelectorAll('.filter-options-container .mobile-filter-option-checkbox:checked').length;
    
    const selectAllCheckbox = dropdown.querySelector('input[value="Selecionar Tudo"]');
    if (selectAllCheckbox) {
        if (checkedCheckboxes === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedCheckboxes === totalCheckboxes) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }
}

// Fecha todos os dropdowns de filtro mobile
function closeMobileFilterDropdowns() {
    const dropdowns = document.querySelectorAll('.mobile-google-sheet-filter-dropdown');
    dropdowns.forEach(dropdown => dropdown.remove());
    document.removeEventListener('click', handleMobileClickOutsideDropdown, true);
}

// Handler para clique fora do dropdown mobile
function handleMobileClickOutsideDropdown(event) {
    const dropdown = document.querySelector('.mobile-google-sheet-filter-dropdown');
    if (dropdown && !dropdown.contains(event.target) && 
        !event.target.classList.contains('mobile-google-sheet-filter-btn') && 
        !event.target.closest('.mobile-google-sheet-filter-btn')) {
        closeMobileFilterDropdowns();
    }
}

// Inicializa os botões de ação mobile (limpar filtros)
function initializeMobileActionButtons() {
    const limparBtn = document.getElementById("btnLimparFiltrosMobile");
    if (limparBtn) {
        limparBtn.removeEventListener('click', clearAllMobileFilters);
        limparBtn.addEventListener('click', clearAllMobileFilters);
    }
}

// Limpa todos os filtros mobile
function clearAllMobileFilters() {
    console.log('Limpando todos os filtros mobile');
    
    // Remove filtros ativos dos botões Google Sheet
    const filterButtons = document.querySelectorAll('.google-sheet-filter-btn');
    filterButtons.forEach(button => {
        button.removeAttribute('data-active-filters');
        button.classList.remove('filter-active');
    });
    
    // Remove filtros ativos dos botões mobile
    const mobileButtons = document.querySelectorAll('.mobile-google-sheet-filter-btn');
    mobileButtons.forEach(button => {
        button.classList.remove('filter-active');
    });
    
    // Fecha dropdowns abertos
    closeMobileFilterDropdowns();
    
    // Limpa filtros do painel de resumos se existir
    if (typeof resetPainelFilterStatus === 'function') {
        resetPainelFilterStatus();
    }
    
    // Remove classe de destaque dos botões limpar filtros
    const limparBtns = document.querySelectorAll('.btn-limpar-filtros, .btn-limpar-filtros-mobile');
    limparBtns.forEach(btn => {
        btn.classList.remove('filters-active');
    });
    
    // Mostra todas as linhas da tabela
    const tableRows = document.querySelectorAll('table tbody tr');
    tableRows.forEach(row => {
        row.style.display = '';
    });
    
    // Atualiza contadores se existir
    if (typeof updateStatusCounts === 'function') {
        updateStatusCounts();
    }
    
    // Fecha o painel mobile após limpar
    setTimeout(() => {
        const mobileFilters = document.getElementById('mobile-filters');
        if (mobileFilters && window.matchMedia('(max-width: 768px)').matches) {
            mobileFilters.removeAttribute('open');
        }
    }, 200);
    
    console.log('Todos os filtros mobile foram limpos');
}

// Sincronização com o sistema principal
document.addEventListener('DOMContentLoaded', () => {
    // Sincroniza estado dos botões limpar filtros
    document.addEventListener('google-sheet-filter-applied', () => {
        const mainLimparBtn = document.getElementById('btnLimparFiltros');
        const mobileLimparBtn = document.getElementById('btnLimparFiltrosMobile');
        
        if (mainLimparBtn && mobileLimparBtn) {
            if (mainLimparBtn.classList.contains('filters-active')) {
                mobileLimparBtn.classList.add('filters-active');
            } else {
                mobileLimparBtn.classList.remove('filters-active');
            }
        }
    });
});
