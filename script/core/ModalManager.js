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

        // FIX: garantir que a classe 'd-none' seja removida (problema na DadosAnaliticos.html onde o overlay inicia oculto por 'd-none').
        if (overlay.classList.contains('d-none')) {
            overlay.classList.remove('d-none');
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
            // Restaura conteúdo original se um modal anterior tiver customizado conteúdo
            if (typeof window.restoreCalendarModalContent === 'function') {
                try { window.restoreCalendarModalContent(); } catch (e) {}
            }
            // Define a URL no(s) iframe(s)
            config.iframe.forEach(iframeId => {
                const iframe = document.getElementById(iframeId);
                if (iframe) {
                    iframe.src = options.url;
                }
            });

            // Atualiza/mostra a barra de URL
            this.updateProcessoUrlBoxes(options.url);

            // Observa mudanças futuras (src + navegação interna via 'load')
            this.observeIframeSrcChanges(config.iframe);
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
     * Observa mudanças no atributo src e evento 'load' dos iframes para refletir na caixa de URL
     */
    observeIframeSrcChanges(iframeIds = []) {
        if (!this._iframeObservers) this._iframeObservers = new Map();
        if (!this._iframeLoadHandlers) this._iframeLoadHandlers = new Map();
    if (!this._iframePollIntervals) this._iframePollIntervals = new Map();
    if (!this._iframeLastUrls) this._iframeLastUrls = new Map();

        const callback = (mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                    const el = mutation.target;
                    const url = el.src || el.getAttribute('src');
                    if (url && url !== 'about:blank') {
                        this.updateProcessoUrlBoxes(url);
                    }
                }
            }
        };

        iframeIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            // Observer de atributo 'src'
            let obs = this._iframeObservers.get(id);
            if (!obs) {
                obs = new MutationObserver(callback);
                this._iframeObservers.set(id, obs);
            } else {
                obs.disconnect();
            }
            obs.observe(el, { attributes: true, attributeFilter: ['src'] });

            // Evento 'load' para navegação interna
            const existingHandler = this._iframeLoadHandlers.get(id);
            if (existingHandler) {
                el.removeEventListener('load', existingHandler);
            }
            const onLoad = () => {
                try {
                    const currentUrl = el.src;
                    if (currentUrl && currentUrl !== 'about:blank') {
                        this.updateProcessoUrlBoxes(currentUrl);
                    }
                } catch (e) {
                    // Ignora erros de cross-origin
                }
            };
            this._iframeLoadHandlers.set(id, onLoad);
            el.addEventListener('load', onLoad);

            // Inicia polling para capturar mudanças que não disparam load ou mutation (ex: hashchange, SPAs)
            this.startIframeUrlPolling(id, el);
        });
    }

    /**
     * Inicia polling do URL do iframe para detectar mudanças (hash/pushState) não captadas por eventos normais
     */
    startIframeUrlPolling(id, el) {
        // Evita múltiplos intervals
        if (this._iframePollIntervals.has(id)) {
            clearInterval(this._iframePollIntervals.get(id));
        }
        // Armazena URL inicial
        try {
            this._iframeLastUrls.set(id, el.src);
        } catch(e) {
            this._iframeLastUrls.set(id, '');
        }
        const intervalId = setInterval(() => {
            try {
                const current = el.src;
                const last = this._iframeLastUrls.get(id);
                if (current && current !== 'about:blank' && current !== last) {
                    this._iframeLastUrls.set(id, current);
                    this.updateProcessoUrlBoxes(current);
                }
            } catch(e) {
                // Ignora erros cross-origin
            }
        }, 700); // 0.7s balanceia responsividade e performance
        this._iframePollIntervals.set(id, intervalId);
    }

    /**
     * Atualiza/mostra as caixas de URL sob "Acompanhamento Processual"
     */
    updateProcessoUrlBoxes(url) {
        try {
            // Normaliza para URL absoluta
            const a = document.createElement('a');
            a.href = url;
            const finalUrl = a.href;

            const box = document.getElementById('processo-url-container');
            const link = document.getElementById('processo-url-link');
            const btnCopy = document.getElementById('processo-url-copy');
            const btnOpen = document.getElementById('processo-url-open');
            if (box && link) {
                link.textContent = finalUrl;
                link.href = finalUrl;
                box.style.display = '';
                if (btnOpen) btnOpen.href = finalUrl;
                if (btnCopy) {
                    btnCopy.onclick = async () => {
                        try { await navigator.clipboard.writeText(finalUrl); } catch (e) {}
                    };
                }
            }

            // ====== LEGACY CONTAINER -> transformar em "barra de endereço" tipo Chrome ======
            const boxLegacy = document.getElementById('processo-url-container-legacy');
            if (boxLegacy) {
                this.ensureLegacyAddressBar(boxLegacy);
                boxLegacy.style.display = '';
                const input = boxLegacy.querySelector('#processo-url-input-legacy');
                const openBtn = boxLegacy.querySelector('#processo-url-open-legacy');
                const copyBtn = boxLegacy.querySelector('#processo-url-copy-legacy');
                const securityIcon = boxLegacy.querySelector('.legacy-address-bar-security');
                if (input && !input.matches(':focus')) { // só atualiza se usuário não estiver editando
                    input.value = finalUrl;
                }
                if (openBtn) openBtn.href = finalUrl;
                if (copyBtn) {
                    copyBtn.onclick = async () => {
                        try { await navigator.clipboard.writeText(finalUrl); } catch(e) {}
                    };
                }
                if (securityIcon) {
                    const isHttps = finalUrl.startsWith('https://');
                    securityIcon.textContent = isHttps ? '🔒' : '⚠️';
                    securityIcon.title = isHttps ? 'Conexão segura (HTTPS)' : 'Conexão não segura';
                }
            }
        } catch (e) {
            // Se a URL for inválida, apenas não atualiza
        }
    }

    /**
     * Garante que o container legacy possua a "barra de endereço" estilizada e funcional
     */
    ensureLegacyAddressBar(boxLegacy) {
        if (boxLegacy.dataset.enhanced === 'true') return;

        // Injeta estilos apenas uma vez
        if (!document.getElementById('legacy-address-bar-styles')) {
            const style = document.createElement('style');
            style.id = 'legacy-address-bar-styles';
            style.textContent = `
                /* ====== Barra de Endereço Legacy (estilo semelhante ao Chrome) ====== */
                #processo-url-container-legacy { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen; }
                .legacy-address-wrapper { display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: #f1f3f4; border: 1px solid #d8d9da; border-radius: 8px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.08); max-width: 100%; }
                .legacy-address-bar-security { font-size: 15px; line-height: 1; user-select: none; }
                .legacy-address-input { flex: 1; border: none; background: transparent; padding: 4px 6px; font-size: 13px; outline: none; color: #202124; }
                .legacy-address-input:focus { background: #fff; border-radius: 4px; box-shadow: 0 0 0 2px #1a73e814; }
                .legacy-address-actions { display: flex; align-items: center; gap: 4px; }
                .legacy-address-actions a, .legacy-address-actions button { appearance: none; border: none; background: #e8eaed; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; line-height: 1; color: #3c4043; text-decoration: none; display: inline-flex; align-items: center; gap: 2px; }
                .legacy-address-actions a:hover, .legacy-address-actions button:hover { background: #dadce0; }
                .legacy-address-actions a:active, .legacy-address-actions button:active { background: #c6c9cc; }
                .legacy-address-go { font-weight: 600; }
                @media (max-width: 600px) { .legacy-address-actions a, .legacy-address-actions button { padding: 4px 6px; } .legacy-address-input { font-size: 12px; } }
            `;
            document.head.appendChild(style);
        }

        // Limpa conteúdo anterior caso exista (mantém possibilidade de fallback)
        if (!boxLegacy.querySelector('.legacy-address-wrapper')) {
            boxLegacy.innerHTML = '';
            const wrapper = document.createElement('div');
            wrapper.className = 'legacy-address-wrapper';
            wrapper.innerHTML = `
                <span class="legacy-address-bar-security" title="Status de segurança">🔒</span>
                <input id="processo-url-input-legacy" class="legacy-address-input" type="text" spellcheck="false" autocomplete="off" />
                <div class="legacy-address-actions">
                    <button id="processo-url-go-legacy" class="legacy-address-go" title="Ir (Enter)">↵</button>
                    <button id="processo-url-copy-legacy" title="Copiar URL">📋</button>
                    <a id="processo-url-open-legacy" title="Abrir em nova guia" target="_blank" rel="noopener noreferrer">↗</a>
                </div>
            `;
            boxLegacy.appendChild(wrapper);

            const input = wrapper.querySelector('#processo-url-input-legacy');
            const goBtn = wrapper.querySelector('#processo-url-go-legacy');

            const navigate = () => {
                if (!input || !input.value.trim()) return;
                let targetUrl = input.value.trim();
                // Adiciona https:// se usuário digitou algo sem protocolo e sem espaços
                if (!/^https?:\/\//i.test(targetUrl) && /^[^\s]+\.[^\s]+/.test(targetUrl)) {
                    targetUrl = 'https://' + targetUrl;
                }
                // Atualiza iframes do modal processo
                const config = this.modalRegistry['processo-modal'];
                if (config && config.iframe) {
                    config.iframe.forEach(id => {
                        const iframe = document.getElementById(id);
                        if (iframe) iframe.src = targetUrl;
                    });
                }
                // Atualiza imediatamente barra (normalização)
                this.updateProcessoUrlBoxes(targetUrl);
            };

            if (input) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        navigate();
                    }
                });
            }
            if (goBtn) {
                goBtn.addEventListener('click', (e) => { e.preventDefault(); navigate(); });
            }
        }

        boxLegacy.dataset.enhanced = 'true';
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
        // Adiciona 'd-none' para cobrir caso outro CSS force exibição
        if (!overlay.classList.contains('d-none')) {
            overlay.classList.add('d-none');
        }
        // Limpa iframes se necessário
        if (config.type === 'iframe') {
            config.iframe.forEach(iframeId => {
                const iframe = document.getElementById(iframeId);
                if (iframe) {
                    iframe.src = 'about:blank';
                }
                // Limpa polling / observers
                if (this._iframeObservers && this._iframeObservers.has(iframeId)) {
                    try { this._iframeObservers.get(iframeId).disconnect(); } catch(e) {}
                    this._iframeObservers.delete(iframeId);
                }
                if (this._iframeLoadHandlers && this._iframeLoadHandlers.has(iframeId)) {
                    try { const handler = this._iframeLoadHandlers.get(iframeId); iframe && iframe.removeEventListener('load', handler); } catch(e) {}
                    this._iframeLoadHandlers.delete(iframeId);
                }
                if (this._iframePollIntervals && this._iframePollIntervals.has(iframeId)) {
                    try { clearInterval(this._iframePollIntervals.get(iframeId)); } catch(e) {}
                    this._iframePollIntervals.delete(iframeId);
                }
                if (this._iframeLastUrls && this._iframeLastUrls.has(iframeId)) {
                    this._iframeLastUrls.delete(iframeId);
                }
            });
            // Oculta as barras de URL
            const box = document.getElementById('processo-url-container');
            const link = document.getElementById('processo-url-link');
            const btnCopy = document.getElementById('processo-url-copy');
            const btnOpen = document.getElementById('processo-url-open');
            if (box && link) {
                box.style.display = 'none';
                link.textContent = '';
                link.removeAttribute('href');
                if (btnOpen) btnOpen.removeAttribute('href');
                if (btnCopy) btnCopy.onclick = null;
            }
            const boxLegacy = document.getElementById('processo-url-container-legacy');
            const linkLegacy = document.getElementById('processo-url-link-legacy');
            const btnCopyLegacy = document.getElementById('processo-url-copy-legacy');
            const btnOpenLegacy = document.getElementById('processo-url-open-legacy');
            if (boxLegacy && linkLegacy) {
                boxLegacy.style.display = 'none';
                linkLegacy.textContent = '';
                linkLegacy.removeAttribute('href');
                if (btnOpenLegacy) btnOpenLegacy.removeAttribute('href');
                if (btnCopyLegacy) btnCopyLegacy.onclick = null;
            }
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
                    
                    // Determina o URL com base no ano selecionado
                    let url;
                    const selectedYear = window.getSelectedYear ? window.getSelectedYear() : '2025';
                    
                    if (selectedYear === '2026') {
                        url = 'https://www.tce.ce.gov.br/component/jdownloads/send/334-plano-de-contratacoes-anual-2026/4644-pca-2026';
                    } else {
                        // Padrão para 2025
                        url = 'https://www.tce.ce.gov.br/component/jdownloads/send/324-plano-de-contratacoes-anual-2025/4631-pca-2025-1-revisao';
                    }
                    
                    window.modalManager.openModal('processo-modal', { url });
                });
            }
            
            // Integração com btnFonteDeDados.js
            const btnFonteDeDados = document.getElementById('btnFonteDeDados');
            if (btnFonteDeDados) {
                btnFonteDeDados.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Determina a URL com base no ano selecionado
                    const selectedYear = window.getSelectedYear ? window.getSelectedYear() : '2025';
                    const PLANILHAS_POR_ANO = {
                        '2025': '1ZYquCMfNlBvYYoZ3uxZrW2Vewejcet43FeD3HBh8oLM',
                        '2026': '1xfZL69sWXUCDFz5049jx_y1LpG1r1ufa6V750b0IpFQ'
                    };
                    
                    const planilhaId = PLANILHAS_POR_ANO[selectedYear] || PLANILHAS_POR_ANO['2025'];
                    const url = `https://docs.google.com/spreadsheets/d/${planilhaId}/edit?usp=sharing`;
                    
                    window.modalManager.openModal('processo-modal', { url });
                });
            }

            // Integração com cliques em processos (Main.js)
            document.addEventListener('click', function(event) {
                if (event.target.classList.contains('processo-link-icon')) {
                    event.preventDefault();
                    const td = event.target.closest('td');
                    let processo = td ? td.textContent.replace('🔗', '').trim() : '';
                    // Novo padrão de URL para consulta de processos (hash route + query search)
                    const BASE_PROCESSO_URL = 'https://www.tce.ce.gov.br/contexto/#/processo';
                    const { projectName, idPca } = (function extractProjectInfo(){
                        try {
                            const tr = event.target.closest('tr');
                            if (!tr) return { projectName: '', idPca: '' };
                            const table = tr.closest('table');
                            let indexProjeto = -1;
                            let indexId = -1;
                            if (table) {
                                const ths = Array.from(table.querySelectorAll('thead th'));
                                indexProjeto = ths.findIndex(th => /projeto/i.test(th.textContent));
                                indexId = ths.findIndex(th => /ID\s*PCA/i.test(th.textContent));
                                const nameVal = (indexProjeto >= 0 && tr.children[indexProjeto]) ? tr.children[indexProjeto].textContent.trim() : '';
                                const idVal = (indexId >= 0 && tr.children[indexId]) ? tr.children[indexId].textContent.trim() : '';
                                return { projectName: nameVal, idPca: idVal };
                            }
                            // fallback por data-label
                            const candidato = Array.from(tr.children).find(c => /projeto/i.test(c.dataset.label || ''));
                            const idCand = Array.from(tr.children).find(c => /id\s*pca/i.test(c.dataset.label || ''));
                            return {
                                projectName: candidato ? candidato.textContent.trim() : '',
                                idPca: idCand ? idCand.textContent.trim() : ''
                            };
                        } catch(e){
                            return { projectName: '', idPca: '' };
                        }
                    })();
                    const applyTitle = (titleTxt) => {
                        if (!titleTxt) return;
                        if (typeof window.setProcessoModalTitle === 'function') {
                            window.setProcessoModalTitle(titleTxt);
                        }
                    };
                    const computedTitle = (idPca ? (idPca + ' - ') : '') + projectName;
                    const openWithTitle = (url) => {
                        window.modalManager.openModal('processo-modal', { url, title: computedTitle });
                        applyTitle(computedTitle);
                    };
                    if (processo) {
                        navigator.clipboard.writeText(processo)
                            .then(() => {
                const url = `${BASE_PROCESSO_URL}?search=${encodeURIComponent(processo)}`;
                                openWithTitle(url);
                                if (td) td.title = 'Número do processo copiado! Cole no campo de busca do TCE.';
                            })
                            .catch(err => {
                                console.error('Falha ao copiar para a área de transferência:', err);
                const url = `${BASE_PROCESSO_URL}?search=${encodeURIComponent(processo)}`;
                                openWithTitle(url);
                            });
                    } else if (td) {
            const url = BASE_PROCESSO_URL; // Sem parâmetro quando não há número
                        openWithTitle(url);
                    }
                }
            });

            // Integração com contratos (InformacoesDeContratos.js)
            document.addEventListener('click', function(event) {
                const contractCell = event.target.closest('td[data-registro]');
                if (contractCell && contractCell.dataset.registro) {
                    const numeroRegistro = contractCell.dataset.registro;
                    const url = `https://scc.tce.ce.gov.br/scc/ConsultaContratoDetalheAct.tce?idContrato=${numeroRegistro}&consulta=1`;
                    // Extrair nome do projeto e ID PCA da mesma linha
                    let projectName = '';
                    let idPca = '';
                    try {
                        const tr = contractCell.closest('tr');
                        if (tr) {
                            const table = tr.closest('table');
                            let idxProjeto = -1;
                            let idxId = -1;
                            if (table) {
                                const ths = Array.from(table.querySelectorAll('thead th'));
                                idxProjeto = ths.findIndex(th => /projeto/i.test(th.textContent));
                                idxId = ths.findIndex(th => /ID\s*PCA/i.test(th.textContent));
                                if (idxProjeto >= 0 && tr.children[idxProjeto]) {
                                    projectName = tr.children[idxProjeto].textContent.trim();
                                }
                                if (idxId >= 0 && tr.children[idxId]) {
                                    idPca = tr.children[idxId].textContent.trim();
                                }
                            }
                            if (!projectName) {
                                const candidato = Array.from(tr.children).find(c => /projeto/i.test((c.dataset.label||'')));
                                if (candidato) projectName = candidato.textContent.trim();
                            }
                            if (!idPca) {
                                const idCand = Array.from(tr.children).find(c => /id\s*pca/i.test((c.dataset.label||'')));
                                if (idCand) idPca = idCand.textContent.trim();
                            }
                        }
                    } catch(e) { /* ignore */ }
                    const finalTitle = (idPca ? (idPca + ' - ') : '') + projectName;
                    window.modalManager.openModal('processo-modal', { url, title: finalTitle });
                    if (projectName && typeof window.setProcessoModalTitle === 'function') {
                        window.setProcessoModalTitle(finalTitle);
                    }
                }
            });

            console.log('ModalManager: Integração com sistemas existentes concluída');
        }
    }, 100);
});

// Helper global para ajustar o título do modal de processo
if (!window.setProcessoModalTitle) {
    window.setProcessoModalTitle = function(title) {
        try {
            if (!title || !title.trim()) return;
            const sane = title.trim();
            // Modal Bootstrap (DadosAnaliticos.html)
            let titleEl = document.querySelector('#processo-modal .modal-title');
            if (!titleEl) {
                // Se a modal-header existir mas não tiver título, cria um
                const header = document.querySelector('#processo-modal .modal-header');
                if (header && !header.querySelector('.modal-title')) {
                    titleEl = document.createElement('h5');
                    titleEl.className = 'modal-title';
                    header.prepend(titleEl);
                }
            }
            if (titleEl) {
                titleEl.textContent = sane;
            }
            // Modal Legacy Overlay (index.html & DadosAnaliticos.html)
            const legacyTitle = document.querySelector('#processo-modal-overlay .modal-header h5');
            if (legacyTitle) legacyTitle.textContent = sane;
        } catch(e) {
            console.warn('Falha ao definir título do modal de processo:', e);
        }
    };
}

// Exporta a classe para uso externo se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalManager;
}
