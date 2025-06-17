/**
 * ModalManager.js - Sistema Centralizado de Gerenciamento de Modais para o Projeto Boletim PCA
 * 
 * Este sistema é responsável por:
 *  - Centralizar o controle de todos os modais da aplicação
 *  - Evitar sobreposições e conflitos entre modais
 *  - Gerenciar z-index de forma consistente
 *  - Implementar fechamento adequado de modais e overlays
 *  - Coordenar com outros sistemas (filtros, painéis, etc.)
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Componentes Gerenciados:
 *   - Modal de Processos (processo-modal-overlay)
 *   - Modal de Notificações (update-notification-overlay)
 *   - Modal Info Messages (info-message-overlay)
 *   - Loading Overlay (loading-overlay)
 *   - Tooltips e Dropdowns
 * 
 * # Funcionalidades Principais:
 *   - openModal(): Abre um modal fechando todos os outros
 *   - closeModal(): Fecha um modal específico
 *   - closeAllModals(): Fecha todos os modals abertos
 *   - getActiveModal(): Retorna o modal atualmente ativo
 *   - manageZIndex(): Gerencia hierarquia de z-index
 */

class ModalManager {
    constructor() {
        this.activeModals = new Set();
        this.modalStack = [];
        this.zIndexBase = 1000;
        this.zIndexIncrement = 10;
        
        // Mapeamento de modais conhecidos
        this.modalRegistry = {
            'processo-modal': {
                overlay: 'processo-modal-overlay',
                content: '.modal-content',
                iframe: ['processo-iframe-legacy', 'processo-iframe'],
                closeButtons: ['close-modal-btn', 'close-modal-btn-legacy'],
                type: 'iframe'
            },
            'update-notification': {
                overlay: 'update-notification-overlay',
                content: '.update-notification-content',
                closeButtons: ['update-notification-close-btn'],
                type: 'content'
            },
            'info-message': {
                overlay: 'info-message-overlay',
                content: '.info-message-box',
                closeButtons: ['info-message-close-btn'],
                type: 'content'
            },
            'loading': {
                overlay: 'loading-overlay',
                content: '.loader',
                type: 'loading'
            }
        };
        
        this.init();
    }
    
    init() {
        console.log('ModalManager: Inicializando sistema de gerenciamento de modais');
        
        // Configura event listeners globais
        this.setupGlobalEventListeners();
        
        // Configura modais existentes
        this.setupExistingModals();
        
        // Expõe instância globalmente
        window.modalManager = this;
        
        console.log('ModalManager: Sistema de modais inicializado com sucesso');
    }
    
    setupGlobalEventListeners() {
        // Event listener global para ESC
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeTopModal();
            }
        });
        
        // Event listener para clicks em overlays
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal-overlay') || 
                event.target.id.includes('overlay')) {
                this.handleOverlayClick(event);
            }
        });
        
        // Event listener para botões de fechar usando delegação
        document.addEventListener('click', (event) => {
            this.handleCloseButtonClick(event);
        });
    }
    
    setupExistingModals() {
        // Configura cada modal registrado
        Object.entries(this.modalRegistry).forEach(([modalId, config]) => {
            const overlay = document.getElementById(config.overlay);
            if (overlay) {
                // Garante z-index correto
                overlay.style.zIndex = this.calculateZIndex(modalId);
                
                // Adiciona classe para identificação
                overlay.classList.add('managed-modal');
                overlay.setAttribute('data-modal-id', modalId);
                
                console.log(`ModalManager: Modal '${modalId}' configurado`);
            }
        });
    }
    
    /**
     * Abre um modal específico, fechando todos os outros
     * @param {string} modalId - ID do modal a ser aberto
     * @param {Object} options - Opções adicionais (url para iframes, conteúdo, etc.)
     */
    openModal(modalId, options = {}) {
        console.log(`ModalManager: Abrindo modal '${modalId}'`);
        
        // Fecha outros modais primeiro (exceto loading)
        this.closeAllModalsExcept(['loading']);
        
        // Fecha filtros e dropdowns abertos
        this.closeAllDropdowns();
        
        const config = this.modalRegistry[modalId];
        if (!config) {
            console.error(`ModalManager: Modal '${modalId}' não encontrado no registry`);
            return false;
        }
        
        const overlay = document.getElementById(config.overlay);
        if (!overlay) {
            console.error(`ModalManager: Elemento overlay '${config.overlay}' não encontrado`);
            return false;
        }

        // Resetar estilos do overlay ANTES de exibi-lo e antes de configurar o conteúdo
        overlay.style.opacity = ''; // Garante que a opacidade padrão (1) seja aplicada
        overlay.style.pointerEvents = ''; // Garante que o overlay seja clicável se necessário (para fechar ao clicar fora)
        
        // Configura conteúdo específico do modal
        this.configureModalContent(modalId, config, options);
        
        // Aplica z-index apropriado
        overlay.style.zIndex = this.calculateZIndex(modalId);
        
        // Exibe o modal
        overlay.style.display = 'flex'; // Define display para flex para torná-lo visível
        
        // Adiciona à pilha de modais ativos
        this.activeModals.add(modalId);
        this.modalStack.push(modalId);
        
        // Aplica animação se disponível (isso adicionará a classe 'show' ao conteúdo)
        this.applyModalAnimation(modalId, config, 'open');
        
        // Bloqueia scroll da página para modais não-loading
        if (modalId !== 'loading') {
            document.body.style.overflow = 'hidden';
        }
        
        console.log(`ModalManager: Modal '${modalId}' aberto com sucesso`);
        return true;
    }
    
    /**
     * Fecha um modal específico
     * @param {string} modalId - ID do modal a ser fechado
     * @param {boolean} immediate - Se true, fecha imediatamente sem animação
     */
    closeModal(modalId, immediate = false) {
        console.log(`ModalManager: Fechando modal '${modalId}'`);
        
        const config = this.modalRegistry[modalId];
        if (!config) {
            console.error(`ModalManager: Modal '${modalId}' não encontrado no registry`);
            return false;
        }
        
        const overlay = document.getElementById(config.overlay);
        if (!overlay) {
            console.error(`ModalManager: Elemento overlay '${config.overlay}' não encontrado`);
            return false;
        }
        
        // Remove da pilha de modais ativos
        this.activeModals.delete(modalId);
        const stackIndex = this.modalStack.indexOf(modalId);
        if (stackIndex > -1) {
            this.modalStack.splice(stackIndex, 1);
        }
        
        if (immediate) {
            this.finalizeModalClose(modalId, config, overlay);
        } else {
            // Aplica animação de fechamento
            this.applyModalAnimation(modalId, config, 'close').then(() => {
                this.finalizeModalClose(modalId, config, overlay);
            });
        }
        
        // Restaura scroll se não há outros modais ativos (exceto loading)
        const nonLoadingModals = Array.from(this.activeModals).filter(id => id !== 'loading');
        if (nonLoadingModals.length === 0) {
            document.body.style.overflow = '';
        }
        
        console.log(`ModalManager: Modal '${modalId}' fechado`);
        return true;
    }
    
    /**
     * Fecha todos os modais abertos
     * @param {Array} except - Array de IDs de modais que não devem ser fechados
     */
    closeAllModals(except = []) {
        console.log('ModalManager: Fechando todos os modais');
        
        const modalsToClose = Array.from(this.activeModals).filter(id => !except.includes(id));
        
        modalsToClose.forEach(modalId => {
            this.closeModal(modalId, true); // Fecha imediatamente para performance
        });
        
        console.log(`ModalManager: ${modalsToClose.length} modais fechados`);
    }
    
    /**
     * Fecha apenas modais que não estão na lista de exceções
     */
    closeAllModalsExcept(except = []) {
        this.closeAllModals(except);
    }
    
    /**
     * Fecha o modal no topo da pilha
     */
    closeTopModal() {
        if (this.modalStack.length > 0) {
            const topModal = this.modalStack[this.modalStack.length - 1];
            this.closeModal(topModal);
        }
    }
    
    /**
     * Fecha todos os dropdowns e filtros abertos
     */
    closeAllDropdowns() {
        // Fecha filtros desktop
        if (window.googleSheetFilters && typeof window.googleSheetFilters.closeAllFilterDropdowns === 'function') {
            window.googleSheetFilters.closeAllFilterDropdowns();
        }
        
        // Fecha filtros mobile
        if (window.mobileGoogleSheetFilters && typeof window.mobileGoogleSheetFilters.closeMobileFilterDropdowns === 'function') {
            window.mobileGoogleSheetFilters.closeMobileFilterDropdowns();
        }
        
        // Fecha tooltips
        const tooltips = document.querySelectorAll('.status-tooltip');
        tooltips.forEach(tooltip => {
            tooltip.style.opacity = '0';
        });
    }
    
    /**
     * Configura o conteúdo específico do modal
     */
    configureModalContent(modalId, config, options) {
        if (config.type === 'iframe' && options.url) {
            // Configura iframe
            config.iframe.forEach(iframeId => {
                const iframe = document.getElementById(iframeId);
                if (iframe) {
                    iframe.src = options.url;
                }
            });
        } else if (config.type === 'content' && options.content) {
            // Configura conteúdo HTML
            const overlay = document.getElementById(config.overlay);
            const contentElement = overlay.querySelector(config.content);
            if (contentElement && options.content) {
                if (typeof options.content === 'string') {
                    contentElement.innerHTML = options.content;
                } else if (options.content.nodeType) {
                    contentElement.appendChild(options.content);
                }
            }
        }
    }
    
    /**
     * Aplica animações de abertura/fechamento
     */
    applyModalAnimation(modalId, config, action) {
        return new Promise((resolve) => {
            const overlay = document.getElementById(config.overlay);
            if (!overlay) {
                console.error(`ModalManager: Overlay '${config.overlay}' não encontrado para animação.`);
                resolve();
                return;
            }
            const content = overlay.querySelector(config.content);

            if (action === 'open') {
                if (content && content.classList) {
                    content.classList.remove('show'); // Garante que está sem 'show' antes de forçar reflow
                    void content.offsetWidth; // Força reflow
                    setTimeout(() => {
                        content.classList.add('show'); // Adiciona 'show' para animar o conteúdo
                        resolve();
                    }, 10); // Pequeno delay para garantir que a transição CSS seja aplicada
                } else {
                    resolve(); // Resolve mesmo se não houver conteúdo para animar
                }
            } else if (action === 'close') {
                if (content && content.classList) {
                    content.classList.remove('show'); // Anima o conteúdo para fora
                }
                // Anima o overlay para fora (opacidade) e desabilita interações
                // A transição de opacidade deve estar definida no CSS do overlay
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';

                setTimeout(() => {
                    resolve(); // Resolve após a duração da animação CSS do overlay
                }, 400); // Deve corresponder à duração da transição CSS do overlay (geralmente 0.4s)
            } else {
                resolve(); // Ação desconhecida
            }
        });
    }
    
    /**
     * Finaliza o fechamento do modal
     */
    finalizeModalClose(modalId, config, overlay) {
        // Apenas oculta o overlay. Opacidade e pointerEvents já foram tratados
        // pela applyModalAnimation e serão resetados na próxima abertura.
        overlay.style.display = 'none';
        
        // Limpa iframes se necessário
        if (config.type === 'iframe') {
            config.iframe.forEach(iframeId => {
                const iframe = document.getElementById(iframeId);
                if (iframe) {
                    iframe.src = 'about:blank';
                }
            });
        }
    }
    
    /**
     * Calcula o z-index apropriado para um modal
     */
    calculateZIndex(modalId) {
        const priorities = {
            'loading': 1080,
            'update-notification': 1070,
            'info-message': 1060,
            'processo-modal': 1050
        };
        
        return priorities[modalId] || this.zIndexBase;
    }
    
    /**
     * Manipula cliques em overlays
     */
    handleOverlayClick(event) {
        // Chama o fechamento padrão de botões de fechar para garantir consistência
        this.handleCloseButtonClick(event);
        // (mantém a lógica antiga caso precise de fallback ou logging)
        const overlay = event.target;
        const modalId = overlay.getAttribute('data-modal-id');
        if (modalId && modalId !== 'loading') {
            // Só fecha se clicou diretamente no overlay, não no conteúdo
            if (event.target === overlay) {
                // this.closeModal(modalId); // Comentado para evitar duplo fechamento
            }
        }
    }
    
    /**
     * Manipula cliques em botões de fechar
     */
    handleCloseButtonClick(event) {
        const buttonId = event.target.id;
        
        // Procura qual modal este botão fecha
        for (const [modalId, config] of Object.entries(this.modalRegistry)) {
            if (config.closeButtons && config.closeButtons.includes(buttonId)) {
                event.preventDefault();
                event.stopPropagation();
                this.closeModal(modalId);
                return;
            }
        }
        
        // Fallback para classes de botão genéricas
        if (event.target.classList.contains('btn-close') || 
            event.target.classList.contains('close-button')) {
            event.preventDefault();
            event.stopPropagation();
            this.closeTopModal();
        }
    }
    
    /**
     * Retorna o modal atualmente ativo (topo da pilha)
     */
    getActiveModal() {
        return this.modalStack.length > 0 ? this.modalStack[this.modalStack.length - 1] : null;
    }
    
    /**
     * Verifica se um modal específico está aberto
     */
    isModalOpen(modalId) {
        return this.activeModals.has(modalId);
    }
    
    /**
     * Retorna lista de todos os modais ativos
     */
    getActiveModals() {
        return Array.from(this.activeModals);
    }
    
    /**
     * Registra um novo modal no sistema
     */
    registerModal(modalId, config) {
        this.modalRegistry[modalId] = config;
        this.setupExistingModals(); // Re-configura todos os modais
        console.log(`ModalManager: Modal '${modalId}' registrado`);
    }
    
    /**
     * Remove um modal do sistema
     */
    unregisterModal(modalId) {
        if (this.modalRegistry[modalId]) {
            this.closeModal(modalId, true);
            delete this.modalRegistry[modalId];
            console.log(`ModalManager: Modal '${modalId}' removido do registry`);
        }
    }
}

// Inicialização automática quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    new ModalManager();
});

// ============== INTEGRAÇÃO COM SISTEMAS EXISTENTES ==============

// Sobrescreve funções globais existentes para usar o ModalManager
document.addEventListener('DOMContentLoaded', function() {
    // Aguarda inicialização do ModalManager
    setTimeout(() => {
        if (window.modalManager) {
            // Integração com btnPCAPublicada.js
            const btnPCAPublicada = document.getElementById('btnPCAPublicada');
            if (btnPCAPublicada) {
                btnPCAPublicada.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.modalManager.openModal('processo-modal', {
                        url: 'https://www.tce.ce.gov.br/component/jdownloads/send/324-plano-de-contratacoes-anual-2025/4631-pca-2025-1-revisao'
                    });
                });
            }            // Integração com btnFonteDeDados.js - DESABILITADO para evitar conflito
            // O event listener está sendo gerenciado pelo script btnFonteDeDados.js
            /*
            const btnFonteDeDados = document.getElementById('btnFonteDeDados');
            if (btnFonteDeDados) {
                btnFonteDeDados.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.modalManager.openModal('processo-modal', {
                        url: 'https://docs.google.com/spreadsheets/d/1ZYquCMfNlBvYYoZ3uxZrW2Vewejcet43FeD3HBh8oLM/edit?usp=sharing'
                    });
                });
            }
            */

            // Integração com cliques em processos (Main.js)
            document.addEventListener('click', function(event) {
                if (event.target.classList.contains('processo-link-icon')) {
                    event.preventDefault();
                    const td = event.target.closest('td');
                    let processo = td ? td.textContent.replace('🔗', '').trim() : '';
                    if (processo) {
                        navigator.clipboard.writeText(processo)
                            .then(() => {
                                const url = `https://www.tce.ce.gov.br/contexto-consulta-geral?texto=${encodeURIComponent(processo)}&tipo=processos`;
                                window.modalManager.openModal('processo-modal', { url });
                                td.title = 'Número do processo copiado! Cole no campo de busca do TCE.';
                            })
                            .catch(err => {
                                console.error('Falha ao copiar para a área de transferência:', err);
                                const url = `https://www.tce.ce.gov.br/contexto-consulta-geral?texto=${encodeURIComponent(processo)}&tipo=processos`;
                                window.modalManager.openModal('processo-modal', { url });
                            });
                    }
                }
            });

            // Integração com contratos (InformacoesDeContratos.js)
            document.addEventListener('click', function(event) {
                const contractCell = event.target.closest('td[data-registro]');
                if (contractCell && contractCell.dataset.registro) {
                    const numeroRegistro = contractCell.dataset.registro;
                    const url = `https://scc.tce.ce.gov.br/scc/ConsultaContratoDetalheAct.tce?idContrato=${numeroRegistro}&consulta=1`;
                    window.modalManager.openModal('processo-modal', { url });
                }
            });

            console.log('ModalManager: Integração com sistemas existentes concluída');
        }
    }, 100);
});

// Exporta a classe para uso externo se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalManager;
}
