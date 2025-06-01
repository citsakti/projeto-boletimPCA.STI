/**
 * MobileCardsFilters.js - Gerenciamento de filtros para os cards mobile
 * 
 * Este módulo é responsável por:
 * - Populara filtros com opções disponíveis
 * - Gerenciar estado dos filtros
 * - Sincronizar com painel de resumos
 * - Contar filtros ativos
 */

class MobileCardsFilters {
    constructor() {
        this.filters = {
            area: '',
            status: '',
            tipo: '',
            projeto: ''
        };
    }

    /**
     * Popula os selects de filtro com as opções disponíveis
     * @param {Object} options - Objeto com arrays de opções para cada filtro
     */
    populateFilters(options) {
        this.populateSelect('mobile-filter-area', options.areas);
        this.populateSelect('mobile-filter-status', options.statuses);
        this.populateSelect('mobile-filter-tipo', options.tipos);
        this.populateSelect('mobile-filter-projeto', options.projetos);
    }
    
    /**
     * Popula um select específico com opções
     * @param {string} selectId - ID do select
     * @param {Array} options - Array de opções
     */
    populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // Manter a primeira opção (todas)
        const firstOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (firstOption) select.appendChild(firstOption);
        
        options.forEach(option => {
            if (option && option.trim()) {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                select.appendChild(optionElement);
            }
        });
    }

    /**
     * Sincroniza filtros com seleção do painel de resumos
     * @param {Object} detail - Detalhes do filtro aplicado
     */
    syncWithPainelFilter(detail) {
        if (detail && detail.status) {
            if (detail.status === 'TODOS') {
                this.filters.status = '';
                const mobileSelect = document.getElementById('mobile-filter-status');
                if (mobileSelect) {
                    mobileSelect.value = '';
                }
            } else {
                this.filters.status = detail.status;
                const mobileSelect = document.getElementById('mobile-filter-status');
                if (mobileSelect) {
                    mobileSelect.value = detail.status;
                }
            }
        }
    }    /**
     * Sincroniza status selecionado com o painel de resumos
     * @param {string} statusValue - Valor do status selecionado
     */
    syncStatusWithPainel(statusValue) {
        console.log(`📱 Sincronizando status mobile com painel: ${statusValue || 'TODOS'}`);
        
        // Sincroniza com o painel de resumos atualizando o destaque
        const statusElements = document.querySelectorAll('.status-option');
        statusElements.forEach(item => {
            item.style.backgroundColor = '';
            item.style.fontWeight = '';
        });
        
        if (statusValue) {
            // Encontra e destaca o status selecionado no painel
            const targetStatus = statusValue === '' ? 'TODOS' : statusValue;
            const activeElement = document.querySelector(`.status-option[data-status="${targetStatus}"]`);
            if (activeElement) {
                activeElement.style.backgroundColor = '#fa8c16';
                activeElement.style.fontWeight = 'bold';
                console.log(`✅ Status "${targetStatus}" destacado no painel`);
            }
            
            // Atualiza o status global
            window.painelFilterStatus = targetStatus;
            
            // Sincroniza com os filtros Google Sheets
            if (typeof aplicarFiltroStatusProcesso === 'function') {
                aplicarFiltroStatusProcesso(targetStatus);
                console.log(`🔄 Filtro Google Sheets aplicado para: ${targetStatus}`);
            }
        } else {
            // Se não há filtro, destaca "TODOS"
            const todosElement = document.querySelector('.status-option[data-status="TODOS"]');
            if (todosElement) {
                todosElement.style.backgroundColor = '#fa8c16';
                todosElement.style.fontWeight = 'bold';
                console.log('✅ Status "TODOS" destacado no painel');
            }
            
            // Atualiza o status global
            window.painelFilterStatus = 'TODOS';
            
            // Remove filtros dos Google Sheets
            if (typeof resetPainelFilterStatus === 'function') {
                resetPainelFilterStatus();
                console.log('🔄 Filtros Google Sheets resetados');
            }
        }
        
        // Dispara evento para notificar outras partes do sistema
        document.dispatchEvent(new CustomEvent('mobile-status-sync', {
            detail: { 
                status: statusValue || 'TODOS',
                source: 'mobileCards'
            }
        }));
    }

    /**
     * Limpa todos os filtros
     */
    clearFilters() {
        this.filters = { area: '', status: '', tipo: '', projeto: '' };
        
        document.getElementById('mobile-filter-area').value = '';
        document.getElementById('mobile-filter-status').value = '';
        document.getElementById('mobile-filter-tipo').value = '';
        document.getElementById('mobile-filter-projeto').value = '';
        
        // Sincroniza com o painel de resumos - reseta para "TODOS"
        this.syncStatusWithPainel('');
    }

    /**
     * Atualiza a contagem de filtros ativos
     */
    updateActiveFiltersCount() {
        const activeCount = Object.values(this.filters).filter(value => value !== '').length;
        const badge = document.getElementById('active-filters-count');
        
        if (badge) {
            badge.textContent = activeCount;
            badge.style.display = activeCount > 0 ? 'inline-block' : 'none';
        }
    }

    /**
     * Alterna a visibilidade dos filtros
     */
    toggleFilters() {
        const content = document.getElementById('mobile-filters-content');
        const chevron = document.querySelector('#mobile-filters-toggle .bi-sliders, #mobile-filters-toggle .bi-chevron-up');
        
        if (!content) return;
        
        // Verificar se Bootstrap está disponível
        if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
            // Usar Bootstrap collapse para animação suave
            let bsCollapse = bootstrap.Collapse.getOrCreateInstance(content, {
                toggle: false
            });
            
            if (content.classList.contains('show')) {
                bsCollapse.hide();
                if (chevron) chevron.className = 'bi bi-sliders transition-transform';
            } else {
                bsCollapse.show();
                if (chevron) chevron.className = 'bi bi-chevron-up transition-transform';
            }
        } else {
            // Fallback sem Bootstrap
            if (content.classList.contains('show')) {
                content.classList.remove('show');
                if (chevron) chevron.className = 'bi bi-sliders transition-transform';
            } else {
                content.classList.add('show');
                if (chevron) chevron.className = 'bi bi-chevron-up transition-transform';
            }
        }
    }

    /**
     * Atualiza o valor de um filtro específico
     * @param {string} filterType - Tipo do filtro (area, status, tipo, projeto)
     * @param {string} value - Novo valor do filtro
     */
    updateFilter(filterType, value) {
        if (this.filters.hasOwnProperty(filterType)) {
            this.filters[filterType] = value;
        }
    }

    /**
     * Retorna os filtros atuais
     * @returns {Object} - Objeto com os filtros atuais
     */
    getFilters() {
        return { ...this.filters };
    }

    /**
     * Define os filtros
     * @param {Object} newFilters - Novos filtros
     */
    setFilters(newFilters) {
        this.filters = { ...newFilters };
        
        // Atualizar interface
        Object.keys(this.filters).forEach(key => {
            const element = document.getElementById(`mobile-filter-${key}`);
            if (element) {
                element.value = this.filters[key];
            }
        });
    }

    /**
     * Verifica se algum filtro está ativo
     * @returns {boolean} - True se algum filtro está ativo
     */
    hasActiveFilters() {
        return Object.values(this.filters).some(value => value !== '');
    }
}

// Exportar para uso global e criar instância global
window.MobileCardsFilters = MobileCardsFilters;
if (typeof window.mobileCardsFiltersInstance === 'undefined') {
    window.mobileCardsFiltersInstance = new MobileCardsFilters();
}

console.log('MobileCardsFilters.js carregado e instância criada.');
