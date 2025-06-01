/**
 * MobileCardsEvents.js - Gerenciamento de eventos para os cards mobile
 * 
 * Este módulo é responsável por:
 * - Configurar event listeners
 * - Gerenciar eventos de resize
 * - Coordenar eventos entre módulos
 * - Detectar mudança de visualização mobile
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
        const processo = target.dataset.processo;
        
        if (processo && processo.trim() !== '' && processo !== 'N/A') {
            // Adiciona feedback tátil se disponível
            if (window.MobileUtils && window.MobileUtils.hapticFeedback) {
                window.MobileUtils.hapticFeedback('light');
            }
            
            // Tenta copiar o número do processo para área de transferência
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(processo)
                    .then(() => {
                        this.openMobileProcessoModal(processo);
                        // Atualiza o tooltip para indicar que foi copiado
                        target.title = 'Número do processo copiado! Cole no campo de busca do TCE.';
                        
                        // Feedback visual temporário
                        target.style.filter = 'grayscale(0.5)';
                        setTimeout(() => {
                            target.style.filter = '';
                        }, 1000);
                    })
                    .catch(err => {
                        console.error('Falha ao copiar para a área de transferência:', err);
                        // Mesmo se falhar ao copiar, abre a modal
                        this.openMobileProcessoModal(processo);
                    });
            } else {
                // Fallback se clipboard API não estiver disponível
                this.openMobileProcessoModal(processo);
            }
        } else {
            // Se não houver número de processo válido, abre a página padrão
            this.openMobileProcessoModal('');
        }
    }

    /**
     * Abre o modal de processo usando a instância global do ProcessoModal
     * @param {string} processo - Número do processo
     */
    openMobileProcessoModal(processo = '') {
        // Usa a instância global do ProcessoModal se estiver disponível
        if (window.processoModalInstance) {
            window.processoModalInstance.openModal(processo);
        } else if (window.ProcessoModal) {
            // Fallback: cria nova instância se a global não estiver disponível
            const modalInstance = new window.ProcessoModal();
            modalInstance.openModal(processo);
        } else {
            console.error('ProcessoModal não está disponível. Certifique-se de que o script está carregado.');
            // Fallback: abre diretamente no TCE em nova janela
            const url = processo 
                ? `https://www.tce.ce.gov.br/contexto-consulta-geral?texto=${encodeURIComponent(processo)}&tipo=processos`
                : 'https://www.tce.ce.gov.br/contexto-consulta-geral?tipo=processos';
            window.open(url, '_blank');
        }
    }
}

// Exportar para uso global
window.MobileCardsEvents = MobileCardsEvents;

console.log('MobileCardsEvents.js carregado');
