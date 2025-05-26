/**
 * mobile-google-sheet-filters.js - Integração dos filtros mobile com os filtros estilo Google Sheets
 * 
 * Este script é responsável por:
 *  - Conectar os filtros mobile/tablet com o sistema Google Sheets
 *  - Garantir que alterações em um tipo de filtro sejam refletidas no outro
 *  - Sincronizar o estado dos filtros entre desktop e dispositivos móveis
 */

document.addEventListener('DOMContentLoaded', () => {
    setupMobileFiltersSync();
    addMobileFilterListeners();
});

document.addEventListener('tabela-carregada', () => {
    setTimeout(() => {
        setupMobileFiltersSync();
        addMobileFilterListeners();
    }, 200);
});

// Adiciona event listeners aos filtros mobile
function addMobileFilterListeners() {
    const mobileInputs = document.querySelectorAll('#mobile-filters input');
    const mobileSelects = document.querySelectorAll('#mobile-filters select');
    
    // Para inputs, usamos evento input para filtragem em tempo real
    mobileInputs.forEach(input => {
        input.removeEventListener('input', handleMobileInputFilter);
        input.addEventListener('input', handleMobileInputFilter);
    });
    
    // Para selects, usamos evento change
    mobileSelects.forEach(select => {
        select.removeEventListener('change', handleMobileSelectFilter);
        select.addEventListener('change', handleMobileSelectFilter);
    });
    
    console.log('Listeners de filtro mobile adicionados a', mobileInputs.length, 'inputs e', mobileSelects.length, 'selects');
}

// Handler para filtros de input mobile
function handleMobileInputFilter(event) {
    const input = event.target;
    const colIndex = parseInt(input.dataset.colIndex);
    if (isNaN(colIndex)) return;
    
    const value = input.value.trim().toLowerCase();
    
    // Aplica o filtro
    applyMobileInputFilter(colIndex, value);
    
    // Notifica que um filtro mobile foi aplicado
    document.dispatchEvent(new CustomEvent('mobile-filter-applied', { 
        detail: { columnIndex: colIndex, value: value }
    }));
}

// Handler para filtros de select mobile
function handleMobileSelectFilter(event) {
    const select = event.target;
    const colIndex = parseInt(select.dataset.colIndex);
    if (isNaN(colIndex)) return;
    
    const value = select.value;
    
    // Aplica o filtro
    applyMobileSelectFilter(colIndex, value);
    
    // Notifica que um filtro mobile foi aplicado
    document.dispatchEvent(new CustomEvent('mobile-filter-applied', { 
        detail: { columnIndex: colIndex, value: value }
    }));
}

// Aplica um filtro baseado em input mobile
function applyMobileInputFilter(colIndex, value) {
    // Encontra o botão de filtro Google Sheets correspondente
    const filterButton = document.querySelector(`.google-sheet-filter-btn[data-col-index="${colIndex}"]`);
    if (!filterButton) return;
    
    // Se o filtro está vazio, limpa o filtro
    if (value === '') {
        filterButton.removeAttribute('data-active-filters');
        filterButton.classList.remove('filter-active');
        masterFilterFunction();
        return;
    }
    
    // Obtém valores únicos da coluna
    const uniqueValues = getUniqueColumnValues(colIndex);
    
    // Filtra valores que correspondem à busca
    const matchingValues = uniqueValues
        .filter(val => val.toLowerCase().includes(value))
        .map(val => val.toLowerCase());
    
    // Aplica o filtro apenas se houver correspondências
    if (matchingValues.length > 0) {
        filterButton.setAttribute('data-active-filters', JSON.stringify(matchingValues));
        filterButton.classList.add('filter-active');
    } else {
        // Se não houver correspondências, limpa o filtro
        filterButton.removeAttribute('data-active-filters');
        filterButton.classList.remove('filter-active');
    }
    
    // Aplica o filtro na tabela
    masterFilterFunction();
}

// Aplica um filtro baseado em select mobile
function applyMobileSelectFilter(colIndex, value) {
    // Encontra o botão de filtro Google Sheets correspondente
    const filterButton = document.querySelector(`.google-sheet-filter-btn[data-col-index="${colIndex}"]`);
    if (!filterButton) return;
    
    // Se o select está na opção padrão vazia, limpa o filtro
    if (value === '') {
        filterButton.removeAttribute('data-active-filters');
        filterButton.classList.remove('filter-active');
        masterFilterFunction();
        return;
    }
    
    // Para selects, aplicamos filtro exato (só o valor selecionado)
    const matchingValues = [value.toLowerCase()];
    
    // Aplica o filtro
    filterButton.setAttribute('data-active-filters', JSON.stringify(matchingValues));
    filterButton.classList.add('filter-active');
    
    // Aplica o filtro na tabela
    masterFilterFunction();
}

// Configurar a sincronização entre filtros mobile e Google Sheets
function setupMobileFiltersSync() {
    // Mapeia filtros mobile para índices de coluna
    const mobileFiltersMap = {
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

    // Para cada filtro mobile, adiciona listeners que sincronizam com os filtros Google Sheets
    Object.entries(mobileFiltersMap).forEach(([filterId, colIndex]) => {
        const mobileFilter = document.getElementById(filterId);
        if (!mobileFilter) return;

        // Remove listeners anteriores para evitar duplicação
        mobileFilter.removeEventListener('input', syncMobileToGoogle);
        mobileFilter.removeEventListener('change', syncMobileToGoogle);

        // Adiciona os novos listeners
        if (mobileFilter.tagName === 'SELECT') {
            mobileFilter.addEventListener('change', syncMobileToGoogle);
        } else {
            mobileFilter.addEventListener('input', syncMobileToGoogle);
        }

        // Armazena o índice da coluna como atributo do elemento
        mobileFilter.dataset.colIndex = colIndex;
    });

    // Adiciona um listener para o evento de aplicação de filtro Google Sheets
    document.addEventListener('google-sheet-filter-applied', syncGoogleToMobile);
}

// Sincroniza alterações dos filtros mobile para os filtros Google Sheets
function syncMobileToGoogle(event) {
    const mobileFilter = event.target;
    const colIndex = parseInt(mobileFilter.dataset.colIndex);
    const value = mobileFilter.value.trim();

    // Obtém o botão de filtro Google Sheets correspondente
    const filterButton = document.querySelector(`.google-sheet-filter-btn[data-col-index="${colIndex}"]`);
    if (!filterButton) return;

    if (value === '') {
        // Se o valor está vazio, remove o filtro
        filterButton.removeAttribute('data-active-filters');
        filterButton.classList.remove('filter-active');
    } else {
        // Se há um valor, aplica o filtro
        const allValues = getUniqueColumnValues(colIndex);
        const matchingValues = allValues.filter(val => 
            val.toLowerCase().includes(value.toLowerCase())
        ).map(val => val.toLowerCase());

        if (matchingValues.length > 0) {
            filterButton.setAttribute('data-active-filters', JSON.stringify(matchingValues));
            filterButton.classList.add('filter-active');
        }
    }

    // Aplica o filtro na tabela
    masterFilterFunction();
}

// Sincroniza alterações dos filtros Google Sheets para os filtros mobile
function syncGoogleToMobile() {
    const activeFilterButtons = document.querySelectorAll('.google-sheet-filter-btn.filter-active, .google-sheet-filter-btn[data-active-filters]');
    
    // Para cada botão de filtro ativo, atualiza o filtro mobile correspondente
    activeFilterButtons.forEach(button => {
        const colIndex = parseInt(button.dataset.colIndex);
        const activeFiltersData = button.getAttribute('data-active-filters');
        
        if (!activeFiltersData) return;
        
        // Encontra o input/select mobile correspondente
        let mobileFilter = null;
        document.querySelectorAll('#mobile-filters input, #mobile-filters select').forEach(element => {
            if (parseInt(element.dataset.colIndex) === colIndex) {
                mobileFilter = element;
            }
        });
        
        if (!mobileFilter) return;
        
        // Tenta definir um valor aproximado no filtro mobile
        try {
            const activeFilters = JSON.parse(activeFiltersData);
            if (activeFilters.length > 0) {
                if (mobileFilter.tagName === 'SELECT') {
                    // Para selects, tentamos encontrar uma opção correspondente
                    const options = Array.from(mobileFilter.options).map(opt => opt.value.toLowerCase());
                    const commonValue = activeFilters.find(val => options.includes(val));
                    if (commonValue) {
                        mobileFilter.value = Array.from(mobileFilter.options)
                            .find(opt => opt.value.toLowerCase() === commonValue).value;
                    }
                } else {
                    // Para inputs de texto, usamos o primeiro valor do filtro
                    mobileFilter.value = activeFilters[0];
                }
            }
        } catch (e) {
            console.error('Erro ao sincronizar filtros Google -> Mobile:', e);
        }
    });
}

// Função para respigar os valores únicos de uma coluna da tabela
function getUniqueColumnValuesForMobile(colIndex) {
    const tableRows = document.querySelectorAll('#detalhes table tbody tr');
    const values = new Set();
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells && cells[colIndex]) {
            values.add(cells[colIndex].textContent.trim());
        }
    });
    return Array.from(values).sort();
}

// Dispara um evento quando um filtro Google Sheets é aplicado
function notifyGoogleFilterApplied() {
    document.dispatchEvent(new CustomEvent('google-sheet-filter-applied'));
}

// Adiciona o listener ao evento de aplicação de filtro
document.addEventListener('DOMContentLoaded', () => {
    if (typeof masterFilterFunction === 'function') {
        const originalMasterFilterFunction = masterFilterFunction;
        window.masterFilterFunction = function() {
            originalMasterFilterFunction();
            notifyGoogleFilterApplied();
        };
    }
});

// Funções para melhorar a experiência mobile

// Função para fechar o painel de filtros mobile após aplicar um filtro
function closeFilterPanelAfterFilter() {
    const mobileFilters = document.getElementById('mobile-filters');
    if (mobileFilters && window.matchMedia('(max-width: 768px)').matches) {
        mobileFilters.removeAttribute('open');
    }
}

// Adiciona a função ao filtro mobile
document.addEventListener('google-sheet-filter-applied', () => {
    closeFilterPanelAfterFilter();
});

// Inicializa o botão "Limpar Filtros" mobile
document.addEventListener('DOMContentLoaded', () => {
    const limparFiltrosMobileBtn = document.getElementById('btnLimparFiltrosMobile');
    if (limparFiltrosMobileBtn) {
        limparFiltrosMobileBtn.addEventListener('click', () => {
            // Usa a mesma função de limpar filtros do sistema principal
            if (typeof clearAllGoogleSheetFilters === 'function') {
                clearAllGoogleSheetFilters();
            }
            
            // Atualiza o estado visual do botão
            limparFiltrosMobileBtn.classList.remove('filters-active');
            
            // Fecha o painel de filtros mobile após limpar
            setTimeout(() => {
                closeFilterPanelAfterFilter();
            }, 200);
        });
    }
    
    // Sincroniza o estado de destaque dos botões "Limpar Filtros"
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
