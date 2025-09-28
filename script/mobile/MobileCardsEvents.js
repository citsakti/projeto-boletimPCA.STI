/**
 * MobileCardsEvents.js - Central de gerenciamento de eventos para o sistema de cards mobile
 * 
 * Este script é responsável por:
 *  - Configurar e coordenar todos os event listeners do sistema mobile
 *  - Gerenciar eventos de redimensionamento de tela (responsive)
 *  - Detectar mudanças entre visualização desktop e mobile
 *  - Coordenar eventos entre diferentes módulos do sistema
 *  - Implementar debounce para otimização de performance
 * 
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Propriedades Principais:
 *   - manager: Referência ao MobileCardsManager principal
 *   - resizeTimeout: Controle de debounce para resize events
 * 
 * # Métodos de Configuração:
 *   - bindEvents(): Configura todos os event listeners
 *   - bindClickEvents(): Eventos de clique (filtros, detalhes, botões)
 *   - bindChangeEvents(): Eventos de mudança (selects de filtro)
 *   - bindResizeEvents(): Eventos de redimensionamento de tela
 *   - bindCustomEvents(): Eventos customizados do sistema
 * 
 * # Eventos Gerenciados:
 *   1. Toggle de filtros mobile (#mobile-filters-toggle)
 *   2. Limpar filtros mobile (#mobile-clear-filters)
 *   3. Botão principal limpar filtros (#btnLimparFiltros)
 *   4. Expansão de detalhes dos cards (.btn-details)
 *   5. Mudanças nos selects de filtro (area, status, tipo, projeto)
 *   6. Redimensionamento da janela (window resize)
 *   7. Eventos customizados de filtros (filterApplied, filtersCleared)
 * 
 * # Fluxo de Eventos:
 *   1. Inicialização: bindEvents() configura todos os listeners
 *   2. Cliques: Identifica elemento clicado e executa ação correspondente
 *   3. Mudanças: Atualiza filtros e re-renderiza cards
 *   4. Resize: Detecta mudança de visualização e ajusta interface
 *   5. Custom: Responde a eventos disparados por outros módulos
 * 
 * # Otimizações:
 *   - Debounce no resize para evitar execução excessiva
 *   - Event delegation para melhor performance
 *   - Verificação de existência de elementos antes de processar
 * 
 * # Integração:
 *   - Instanciado pelo MobileCardsManager como módulo central
 *   - Coordena com MobileCardsFilters para gerenciar filtros
 *   - Aciona MobileCardsDetails para expansão de cards
 *   - Sincroniza com sistema de responsive design
 */

class MobileCardsEvents {
    constructor(manager) {
        this.manager = manager;
        this.resizeTimeout = null;
    }

    /**
     * Configura todos os event listeners
     */
    bindEvents() {
        this.bindClickEvents();
        this.bindChangeEvents();
        this.bindResizeEvents();
        this.bindCustomEvents();
    }

    /**
     * Configura eventos de clique
     */
    bindClickEvents() {
        document.addEventListener('click', (e) => {
            // Toggle de filtros
            if (e.target.closest('#mobile-filters-toggle')) {
                this.manager.filtersManager.toggleFilters();
            }
            
            // Limpar filtros mobile
            if (e.target.closest('#mobile-clear-filters')) {
                this.manager.clearFilters();
            }
            
            // Responder ao botão principal "Limpar Filtros"
            if (e.target.closest('#btnLimparFiltros')) {
                this.manager.clearFilters();
            }
              // Expandir/colapsar detalhes do card
            if (e.target.closest('.btn-details')) {
                const cardId = e.target.closest('.project-card').dataset.projectId;
                window.MobileCardsDetails.toggleDetails(cardId, this.manager.filteredData);
            }
            
            // Clique no ícone de processo nos cards mobile
            if (e.target.classList.contains('mobile-processo-icon')) {
                e.preventDefault();
                e.stopPropagation();
                this.handleMobileProcessoClick(e.target);
            }
            // Clique no ícone Comprasgov nos cards mobile
            if (e.target.classList.contains('mobile-compras-icon')) {
                e.preventDefault();
                e.stopPropagation();
                this.handleMobileComprasgovClick(e.target);
            }
        });
    }

    /**
     * Configura eventos de mudança (filtros)
     */
    bindChangeEvents() {
        document.addEventListener('change', (e) => {
            if (e.target.id.startsWith('mobile-filter-')) {
                const filterType = e.target.id.replace('mobile-filter-', '');
                this.manager.filtersManager.updateFilter(filterType, e.target.value);
                this.manager.applyFilters();
                
                // Se foi o filtro de status, sincroniza com o painel de resumos
                if (filterType === 'status') {
                    this.manager.filtersManager.syncStatusWithPainel(e.target.value);
                }
            }
        });
    }

    /**
     * Configura eventos de resize da janela
     */
    bindResizeEvents() {
        window.addEventListener('resize', () => {
            // Debounce para evitar muitos triggers
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.manager.checkMobileView();
            }, 150);
        });
    }

    /**
     * Configura eventos customizados do sistema
     */
    bindCustomEvents() {
        // Escutar evento de dados carregados
        document.addEventListener('tabela-carregada', () => {
            if (this.manager.isMobileView) {
                this.manager.loadTableData();
            }
        });
        
        // Escutar filtros aplicados pelo painel de resumos
        document.addEventListener('painel-filter-applied', (event) => {
            if (this.manager.isMobileView) {
                this.manager.filtersManager.syncWithPainelFilter(event.detail);
                this.manager.applyFilters();
            }
        });
        
        // Escutar atualizações do sistema de acompanhamento
        document.addEventListener('acompanhamento-updated', () => {
            if (this.manager.isMobileView) {
                console.log('Sistema de acompanhamento atualizado, recarregando dados dos cards...');
                this.manager.loadTableData();
            }
        });

        // Eventos de orientação para dispositivos móveis
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.manager.checkMobileView();
            }, 100);
        });
    }

    /**
     * Remove todos os event listeners
     */
    unbindEvents() {
        // Remover listeners de resize
        clearTimeout(this.resizeTimeout);
        
        // Nota: Para uma implementação completa, seria necessário
        // rastrear todas as funções de callback para removê-las
        // adequadamente. Para simplificar, mantemos os listeners globais.
    }

    /**
     * Simula um evento customizado
     * @param {string} eventName - Nome do evento
     * @param {Object} detail - Dados do evento
     */
    dispatchCustomEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    /**
     * Adiciona listener para evento customizado específico
     * @param {string} eventName - Nome do evento
     * @param {Function} callback - Função de callback
     */
    addCustomEventListener(eventName, callback) {
        document.addEventListener(eventName, callback);
    }

    /**
     * Remove listener para evento customizado específico
     * @param {string} eventName - Nome do evento
     * @param {Function} callback - Função de callback
     */
    removeCustomEventListener(eventName, callback) {
        document.removeEventListener(eventName, callback);
    }

    /**
     * Configura eventos específicos para tooltips
     */
    bindTooltipEvents() {
        // Os eventos de tooltip são gerenciados pelo MobileCardsTooltips
        // Este método serve como hook para configurações adicionais se necessário
        if (this.manager.tooltipsManager) {
            this.manager.tooltipsManager.setupTooltips();
        }
    }

    /**
     * Verifica se o dispositivo suporta eventos de toque
     * @returns {boolean} - True se suporta touch
     */
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }    /**
     * Adiciona event listener com debounce
     * @param {HTMLElement} element - Elemento alvo
     * @param {string} eventType - Tipo do evento
     * @param {Function} callback - Função de callback
     * @param {number} delay - Delay em ms para debounce
     */
    addDebouncedListener(element, eventType, callback, delay = 300) {
        let timeout;
        element.addEventListener(eventType, (event) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => callback(event), delay);
        });
    }

    /**
     * Manipula clique no ícone de processo dos cards mobile
     * @param {HTMLElement} target - Elemento clicado
     */
    handleMobileProcessoClick(target) {
        const processo = (target.dataset.processo || '').replace('🔗','').trim();

        // Extrai informações do card para título (idPca + nome projeto)
        let projectName = '';
        let idPca = '';
        try {
            const card = target.closest('.project-card');
            if (card) {
                const titleEl = card.querySelector('.card-title');
                const idEl = card.querySelector('.card-id');
                if (titleEl) projectName = titleEl.textContent.trim();
                if (idEl) idPca = idEl.textContent.trim();
            }
        } catch(e) { /* ignore */ }
        // Incluir o número do processo no título se disponível
        const processoSuffix = processo ? ` | ${processo}` : '';
        const computedTitle = (idPca ? (idPca + ' - ') : '') + projectName + processoSuffix;

        const openInModal = (url) => {
            if (window.modalManager) {
                window.modalManager.openModal('processo-modal', { url, title: computedTitle });
                if (typeof window.setProcessoModalTitle === 'function') {
                    window.setProcessoModalTitle(computedTitle);
                }
            } else {
                // Fallback: abre em nova aba
                window.open(url, '_blank');
            }
        };

        const defaultUrl = 'https://www.tce.ce.gov.br/contexto-consulta-geral?tipo=processos';
        let finalUrl = defaultUrl;
        if (processo) {
            finalUrl = `https://www.tce.ce.gov.br/contexto-consulta-geral?texto=${encodeURIComponent(processo)}&tipo=processos`;
        }

        // Haptic feedback
        if (window.MobileUtils && window.MobileUtils.hapticFeedback) {
            window.MobileUtils.hapticFeedback('light');
        }

        if (processo && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(processo).then(() => {
                target.title = 'Número do processo copiado! Cole no campo de busca do TCE.';
                target.style.filter = 'grayscale(0.5)';
                setTimeout(() => { target.style.filter = ''; }, 900);
                openInModal(finalUrl);
            }).catch(() => {
                openInModal(finalUrl);
            });
        } else {
            openInModal(finalUrl);
        }
    }

    // Removido openMobileProcessoModal: lógica migrada para ModalManager
    
    /**
     * Manipula clique no ícone Comprasgov (🛍️) nos cards mobile
     */
    handleMobileComprasgovClick(target) {
        const modalidadeX = (target.getAttribute('data-x') || '').trim();
        const numeroY = (target.getAttribute('data-y') || '').trim();
        if (!numeroY || numeroY === '-') return;
        // Extrai contexto para título
        let projectName = '';
        let idPca = '';
        try {
            const card = target.closest('.project-card');
            if (card) {
                const titleEl = card.querySelector('.card-title');
                const idEl = card.querySelector('.card-id');
                if (titleEl) projectName = titleEl.textContent.trim();
                if (idEl) idPca = idEl.textContent.trim();
            }
        } catch(e) {}
        const yy = this.mapYYCompras(modalidadeX);
        const url = `https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/public/compras/acompanhamento-compra/item/1?compra=925467${yy}${numeroY}`;
        const finalTitle = (idPca ? (idPca + ' - ') : '') + projectName;
        if (window.modalManager) {
            window.modalManager.openModal('processo-modal', { url, title: finalTitle });
            if (typeof window.setProcessoModalTitle === 'function') window.setProcessoModalTitle(finalTitle);
        } else {
            window.open(url, '_blank');
        }
    }

    mapYYCompras(modalidadeX='') {
        const normalized = modalidadeX.toUpperCase();
        if (normalized.includes('PREGÃO') || normalized.includes('PREGAO')) return '05';
        if (normalized.includes('DISPENSA')) return '06';
        return '06';
    }
}

// Exportar para uso global
window.MobileCardsEvents = MobileCardsEvents;

console.log('MobileCardsEvents.js carregado');
