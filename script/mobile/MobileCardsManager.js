/**
 * MobileCardsManager.js - Orquestrador principal do sistema de cards mobile
 * 
 * Este script é responsável por:
 *  - Coordenar e gerenciar todos os módulos do sistema de cards mobile
 *  - Detectar automaticamente modo de visualização (mobile/desktop)
 *  - Inicializar e integrar módulos especializados
 *  - Gerenciar fluxo de dados entre componentes
 *  - Controlar ciclo de vida da interface mobile
 * 
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Módulos Gerenciados:
 *   - MobileCardsData: Processamento e manipulação de dados
 *   - MobileCardsFilters: Sistema de filtros mobile
 *   - MobileCardsRenderer: Renderização de cards e estruturas HTML
 *   - MobileCardsTooltips: Sistema de tooltips interativos
 *   - MobileCardsDetails: Expansão e colapso de detalhes
 *   - MobileCardsEvents: Central de gerenciamento de eventos
 *   - MobileCardsStyles: Mapeamento de classes CSS
 * 
 * # Propriedades Principais:
 *   - isMobileView: Estado atual da visualização (mobile/desktop)
 *   - currentData: Dados originais carregados da tabela
 *   - filteredData: Dados filtrados para exibição
 *   - Instâncias de todos os módulos especializados
 * 
 * # Métodos Principais:
 *   - init(): Inicialização completa do sistema
 *   - createMobileStructure(): Cria estrutura HTML para cards mobile
 *   - checkMobileView(): Detecta e ajusta para visualização mobile
 *   - loadAndRenderCards(): Carrega dados e renderiza cards
 *   - applyFilters(): Aplica filtros aos dados e re-renderiza
 *   - clearFilters(): Limpa todos os filtros aplicados
 *   - refreshData(): Atualiza dados da tabela principal
 * 
 * # Fluxo de Inicialização:
 *   1. Instancia todos os módulos especializados
 *   2. Cria estrutura HTML necessária para mobile
 *   3. Configura event listeners através do MobileCardsEvents
 *   4. Detecta modo de visualização atual
 *   5. Carrega dados iniciais e renderiza interface
 *   6. Configura sistema de tooltips e filtros
 * 
 * # Detecção Responsiva:
 *   - Monitora redimensionamento da janela
 *   - Alterna automaticamente entre modos desktop/mobile
 *   - Preserva estado dos filtros entre mudanças de modo
 *   - Ajusta comportamento de tooltips conforme dispositivo
 * 
 * # Integração:
 *   - Atua como ponto central de comunicação entre módulos
 *   - Integra com sistema principal de filtros (GoogleSheetFilters.js)
 *   - Coordena com painel de resumos (PainelResumoUpdates.js)
 *   - Utiliza estilos e classes do sistema principal
 *   - Mantém sincronização com tabela principal do dashboard
 */

class MobileCardsManager {
    constructor() {
        this.isMobileView = false;
        this.currentData = [];
        this.filteredData = [];
        
        // Inicializar módulos especializados
        this.dataManager = new window.MobileCardsData();
        this.filtersManager = new window.MobileCardsFilters();
        this.tooltipsManager = new window.MobileCardsTooltips();
        this.eventsManager = new window.MobileCardsEvents(this);
        
        this.init();
    }

    /**
     * Inicializa o sistema de cards mobile
     */
    init() {
        this.createMobileStructure();
        this.eventsManager.bindEvents();
        this.checkMobileView();
        
        // Configurar tooltips
        this.tooltipsManager.setMobileView(this.isMobileView);
    }

    /**
     * Cria a estrutura HTML para os cards mobile
     */
    createMobileStructure() {
        const detalhesSection = document.getElementById('detalhes');
        if (!detalhesSection) return;
        
        // Criar container de filtros móveis
        const filtersContainer = document.createElement('div');
        filtersContainer.className = 'mobile-filters-container card shadow-sm mb-3';
        filtersContainer.innerHTML = window.MobileCardsRenderer.createFiltersStructure();
        
        // Criar container de cards
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'mobile-cards-container';
        cardsContainer.id = 'mobile-cards-container';
        
        // Inserir antes da tabela
        const tableResponsive = detalhesSection.querySelector('.table-responsive');
        if (tableResponsive) {
            detalhesSection.insertBefore(filtersContainer, tableResponsive);
            detalhesSection.insertBefore(cardsContainer, tableResponsive);
        }
    }

    /**
     * Verifica se deve usar visualização mobile
     */
    checkMobileView() {
        const wasMobile = this.isMobileView;
        this.isMobileView = window.MobileUtils ? window.MobileUtils.isMobileDevice() : window.innerWidth <= 430;
        
        // Atualizar tooltips com novo estado
        this.tooltipsManager.setMobileView(this.isMobileView);
        
        if (wasMobile !== this.isMobileView) {
            if (this.isMobileView) {
                this.showMobileView();
            } else {
                this.hideMobileView();
            }
        }
    }

    /**
     * Mostra a visualização mobile
     */
    showMobileView() {
        const filtersContainer = document.querySelector('.mobile-filters-container');
        const cardsContainer = document.querySelector('.mobile-cards-container');
        const tableResponsive = document.querySelector('.table-responsive');
        
        if (filtersContainer) filtersContainer.classList.add('show');
        if (cardsContainer) cardsContainer.classList.add('show');
        if (tableResponsive) tableResponsive.style.display = 'none';
        
        this.loadTableData();
    }

    /**
     * Esconde a visualização mobile
     */
    hideMobileView() {
        const filtersContainer = document.querySelector('.mobile-filters-container');
        const cardsContainer = document.querySelector('.mobile-cards-container');
        const tableResponsive = document.querySelector('.table-responsive');
        
        if (filtersContainer) filtersContainer.classList.remove('show');
        if (cardsContainer) cardsContainer.classList.remove('show');
        if (tableResponsive) tableResponsive.style.display = 'block';
    }

    /**
     * Carrega dados da tabela e processa para cards
     */
    loadTableData() {
        if (!this.isMobileView) return;
        
        this.currentData = this.dataManager.loadTableData();
        this.populateFilters();
        this.applyFilters();
    }

    /**
     * Popula os filtros com opções disponíveis
     */
    populateFilters() {
        const options = this.dataManager.extractFilterOptions(this.currentData);
        this.filtersManager.populateFilters(options);
    }

    /**
     * Aplica filtros aos dados e atualiza visualização
     */
    applyFilters() {
        const filters = this.filtersManager.getFilters();
        this.filteredData = this.dataManager.applyFilters(this.currentData, filters);
        this.filteredData = this.dataManager.sortData(this.filteredData);
        
        this.filtersManager.updateActiveFiltersCount();
        this.renderCards();
    }

    /**
     * Renderiza os cards na tela
     */
    renderCards() {
        window.MobileCardsRenderer.renderCards(this.filteredData);
        
        // Configurar event listeners para tooltips de status após renderização
        this.tooltipsManager.setupStatusCardListeners(this.filteredData);
    }

    /**
     * Limpa todos os filtros
     */
    clearFilters() {
        this.filtersManager.clearFilters();
        this.filteredData = [...this.currentData];
        this.filteredData = this.dataManager.sortData(this.filteredData);
        this.filtersManager.updateActiveFiltersCount();
        this.renderCards();
    }

    /**
     * Obtém dados filtrados atuais
     * @returns {Array} - Array com dados filtrados
     */
    getFilteredData() {
        return [...this.filteredData];
    }

    /**
     * Obtém dados originais
     * @returns {Array} - Array com dados originais
     */
    getCurrentData() {
        return [...this.currentData];
    }

    /**
     * Verifica se está na visualização mobile
     * @returns {boolean} - True se está em modo mobile
     */
    isMobile() {
        return this.isMobileView;
    }

    /**
     * Força atualização dos dados
     */
    refresh() {
        if (this.isMobileView) {
            this.loadTableData();
        }
    }

    /**
     * Atualiza um projeto específico nos dados
     * @param {string} projectId - ID do projeto
     * @param {Object} newData - Novos dados do projeto
     */
    updateProject(projectId, newData) {
        const index = this.currentData.findIndex(item => item.id == projectId);
        if (index !== -1) {
            this.currentData[index] = { ...this.currentData[index], ...newData };
            this.applyFilters();
        }
    }

    /**
     * Obtém informações sobre o estado atual
     * @returns {Object} - Objeto com informações do estado
     */
    getState() {
        return {
            isMobileView: this.isMobileView,
            totalProjects: this.currentData.length,
            filteredProjects: this.filteredData.length,
            activeFilters: this.filtersManager.hasActiveFilters(),
            filters: this.filtersManager.getFilters(),
            detailsState: window.MobileCardsDetails.getDetailsState()
        };
    }

    /**
     * Aplica um conjunto específico de filtros
     * @param {Object} filters - Objeto com filtros a aplicar
     */
    applySpecificFilters(filters) {
        this.filtersManager.setFilters(filters);
        this.applyFilters();
    }

    /**
     * Busca projetos por termo de pesquisa
     * @param {string} searchTerm - Termo para buscar
     * @returns {Array} - Array com projetos encontrados
     */
    searchProjects(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            return this.filteredData;
        }
        
        const term = searchTerm.toLowerCase();
        return this.filteredData.filter(project => 
            project.projeto.toLowerCase().includes(term) ||
            project.area.toLowerCase().includes(term) ||
            project.status.toLowerCase().includes(term) ||
            project.tipo.toLowerCase().includes(term)
        );
    }

    /**
     * Método para debug - imprime estado atual no console
     */
    debug() {
        console.group('MobileCardsManager Debug');
        console.log('Estado:', this.getState());
        console.log('Dados atuais:', this.currentData);
        console.log('Dados filtrados:', this.filteredData);
        console.log('Filtros:', this.filtersManager.getFilters());
        console.groupEnd();
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se todos os módulos necessários estão carregados
    const requiredModules = [
        'MobileCardsData',
        'MobileCardsFilters', 
        'MobileCardsRenderer',
        'MobileCardsTooltips',
        'MobileCardsDetails',
        'MobileCardsEvents',
        'MobileCardsStyles'
    ];
    
    const missingModules = requiredModules.filter(module => !window[module]);
    
    if (missingModules.length > 0) {
        console.error('Módulos não carregados:', missingModules);
        return;
    }
    
    window.mobileCardsManager = new MobileCardsManager();
    console.log('MobileCardsManager inicializado com todos os módulos');
});

console.log('MobileCardsManager.js (refatorado) carregado');
