/**
 * Bootstrap Modal Adapter
 * Adapta os modais existentes para funcionar com Bootstrap 5
 * Mantém a compatibilidade com o código JavaScript existente
 */

(function() {
    'use strict';

    // Aguarda o DOM carregar
    document.addEventListener('DOMContentLoaded', function() {
          // Função para adaptar modal overlay para Bootstrap
        function adaptModalToBootstrap() {
            const legacyModalOverlay = document.getElementById('processo-modal-overlay');
            const bootstrapModal = document.getElementById('processo-modal');
            const iframe = document.getElementById('processo-iframe');
            const legacyIframe = document.getElementById('processo-iframe-legacy');
            
            if (legacyModalOverlay && bootstrapModal) {
                // Sincroniza os iframes
                const syncIframes = (source, target) => {
                    if (source && target && source.src !== target.src) {
                        target.src = source.src;
                    }
                };
                
                // Observer para mudanças no src do iframe
                let lastSrc = '';
                const checkIframeSrc = () => {
                    if (iframe && iframe.src !== lastSrc) {
                        lastSrc = iframe.src;
                        if (legacyIframe) {
                            legacyIframe.src = iframe.src;
                        }
                    }
                    if (legacyIframe && legacyIframe.src !== lastSrc) {
                        lastSrc = legacyIframe.src;
                        if (iframe) {
                            iframe.src = legacyIframe.src;
                        }
                    }
                };
                setInterval(checkIframeSrc, 100);
                
                // Gerencia exibição do overlay
                const originalStyleDisplay = Object.getOwnPropertyDescriptor(legacyModalOverlay.style, 'display') || 
                    Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'display');
                
                Object.defineProperty(legacyModalOverlay.style, 'display', {
                    set: function(value) {
                        if (value === 'flex' || value === 'block') {
                            legacyModalOverlay.style.setProperty('display', 'flex', 'important');
                            const modalContent = legacyModalOverlay.querySelector('.modal-content');
                            if (modalContent) {
                                setTimeout(() => {
                                    modalContent.classList.add('show');
                                }, 10);
                            }
                            document.body.style.overflow = 'hidden';
                        } else if (value === 'none') {
                            const modalContent = legacyModalOverlay.querySelector('.modal-content');
                            if (modalContent) {
                                modalContent.classList.remove('show');
                                setTimeout(() => {
                                    legacyModalOverlay.style.setProperty('display', 'none');
                                    document.body.style.overflow = '';
                                }, 300);
                            } else {
                                legacyModalOverlay.style.setProperty('display', 'none');
                                document.body.style.overflow = '';
                            }
                        } else {
                            originalStyleDisplay.set.call(this, value);
                        }
                    },
                    get: function() {
                        return legacyModalOverlay.style.getPropertyValue('display') || 'none';
                    }
                });
            }
            
            // Adapta o botão de fechar
            const legacyCloseBtn = document.getElementById('close-modal-btn');
            const legacyCloseBtnLegacy = document.getElementById('close-modal-btn-legacy');
            
            if (legacyCloseBtn && legacyModalOverlay) {
                legacyCloseBtn.addEventListener('click', function() {
                    const modalContent = legacyModalOverlay.querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.classList.remove('show');
                        setTimeout(() => {
                            legacyModalOverlay.style.display = 'none';
                            if (iframe) iframe.src = 'about:blank';
                            if (legacyIframe) legacyIframe.src = 'about:blank';
                        }, 300);
                    }
                });
            }
            
            if (legacyCloseBtnLegacy && legacyModalOverlay) {
                legacyCloseBtnLegacy.addEventListener('click', function() {
                    const modalContent = legacyModalOverlay.querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.classList.remove('show');
                        setTimeout(() => {
                            legacyModalOverlay.style.display = 'none';
                            if (iframe) iframe.src = 'about:blank';
                            if (legacyIframe) legacyIframe.src = 'about:blank';
                        }, 300);
                    }
                });
            }
            
            // Fecha modal ao clicar fora
            if (legacyModalOverlay) {
                legacyModalOverlay.addEventListener('click', function(event) {
                    if (event.target === legacyModalOverlay) {
                        const modalContent = legacyModalOverlay.querySelector('.modal-content');
                        if (modalContent) {
                            modalContent.classList.remove('show');
                            setTimeout(() => {
                                legacyModalOverlay.style.display = 'none';
                                if (iframe) iframe.src = 'about:blank';
                                if (legacyIframe) legacyIframe.src = 'about:blank';
                            }, 300);
                        }
                    }
                });
            }
            
            // Fecha modal com ESC
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape' && legacyModalOverlay && legacyModalOverlay.style.display === 'flex') {
                    const modalContent = legacyModalOverlay.querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.classList.remove('show');
                        setTimeout(() => {
                            legacyModalOverlay.style.display = 'none';
                            if (iframe) iframe.src = 'about:blank';
                            if (legacyIframe) legacyIframe.src = 'about:blank';
                        }, 300);
                    }
                }            });
        }
        
        // Função para adaptar notificações de atualização
        function adaptUpdateNotification() {
            const legacyNotificationOverlay = document.getElementById('update-notification-overlay');
            const bootstrapNotificationModal = document.getElementById('update-notification-modal');
            
            if (!legacyNotificationOverlay && bootstrapNotificationModal) {
                // Cria elemento fictício para compatibilidade
                const mockNotificationOverlay = document.createElement('div');
                mockNotificationOverlay.id = 'update-notification-overlay';
                mockNotificationOverlay.style.display = 'none';
                document.body.appendChild(mockNotificationOverlay);
                
                // Adapta métodos de exibição
                Object.defineProperty(mockNotificationOverlay.style, 'display', {
                    set: function(value) {
                        if (value === 'flex' || value === 'block') {
                            const bsModal = new bootstrap.Modal(bootstrapNotificationModal);
                            bsModal.show();
                        } else if (value === 'none') {
                            const bsModal = bootstrap.Modal.getInstance(bootstrapNotificationModal);
                            if (bsModal) {
                                bsModal.hide();
                            }
                        }
                    },
                    get: function() {
                        const bsModal = bootstrap.Modal.getInstance(bootstrapNotificationModal);
                        return bsModal && bsModal._isShown ? 'flex' : 'none';
                    }
                });
                
                // Adapta elementos internos
                const legacyTitle = document.getElementById('update-notification-title');
                const legacyDetails = document.getElementById('update-notification-details');
                const legacyCloseBtn = document.getElementById('update-notification-close-btn');
                
                if (!legacyTitle) {
                    const mockTitle = document.createElement('h3');
                    mockTitle.id = 'update-notification-title';
                    mockTitle.style.display = 'none';
                    document.body.appendChild(mockTitle);
                    
                    Object.defineProperty(mockTitle, 'textContent', {
                        set: function(value) {
                            const bsTitle = bootstrapNotificationModal.querySelector('#updateNotificationLabel');
                            if (bsTitle) {
                                bsTitle.innerHTML = '<i class="bi bi-bell me-2"></i>' + value;
                            }
                        }
                    });
                }
                
                if (!legacyCloseBtn) {
                    const mockCloseBtn = document.createElement('button');
                    mockCloseBtn.id = 'update-notification-close-btn';
                    mockCloseBtn.style.display = 'none';
                    document.body.appendChild(mockCloseBtn);
                    
                    mockCloseBtn.addEventListener = function(event, handler) {
                        if (event === 'click') {
                            const bsCloseBtn = bootstrapNotificationModal.querySelector('[data-bs-dismiss="modal"]');
                            if (bsCloseBtn) {
                                bsCloseBtn.addEventListener('click', handler);
                            }
                        }
                    };
                }
            }
        }
          // Função para adaptar controles do painel de resumo
        function adaptPainelResumo() {
            const painelContainer = document.getElementById('painel-resumo-container');
            const painelCloseBtn = document.getElementById('painel-close-btn');
            const arrowIcon = painelCloseBtn ? painelCloseBtn.querySelector('.arrow-icon') : null;
            
            if (painelCloseBtn && arrowIcon) {
                painelCloseBtn.addEventListener('click', function() {
                    if (painelContainer) {
                        painelContainer.classList.toggle('collapsed');
                        
                        // Atualiza o ícone da seta usando Bootstrap Icons
                        if (painelContainer.classList.contains('collapsed')) {
                            arrowIcon.className = 'bi bi-chevron-down arrow-icon';
                        } else {
                            arrowIcon.className = 'bi bi-chevron-up arrow-icon';
                        }
                        
                        // Dispatch evento customizado para compatibilidade
                        const event = new CustomEvent('painel-resumo-toggled', {
                            detail: { expanded: !painelContainer.classList.contains('collapsed') }
                        });
                        document.dispatchEvent(event);
                    }
                });
            }
            
            // Adapter para mobile toggle button
            const mobileToggleBtn = document.getElementById('painel-toggle-btn');
            if (mobileToggleBtn) {
                mobileToggleBtn.addEventListener('click', function() {
                    if (painelContainer) {
                        painelContainer.classList.toggle('collapsed');
                        
                        // Sincroniza com o botão de seta
                        if (arrowIcon) {
                            if (painelContainer.classList.contains('collapsed')) {
                                arrowIcon.className = 'bi bi-chevron-down arrow-icon';
                            } else {
                                arrowIcon.className = 'bi bi-chevron-up arrow-icon';
                            }
                        }
                        
                        // Scroll suave para o painel em mobile
                        if (window.innerWidth <= 768 && !painelContainer.classList.contains('collapsed')) {
                            setTimeout(() => {
                                painelContainer.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'start' 
                                });
                            }, 300);
                        }
                    }
                });
            }
        }
        
        // Executa as adaptações
        adaptModalToBootstrap();
        adaptUpdateNotification();
        adaptPainelResumo();
        
        // Observa mudanças no DOM para elementos adicionados dinamicamente
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    adaptModalToBootstrap();
                    adaptUpdateNotification();
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Adiciona estilos de compatibilidade
        const style = document.createElement('style');
        style.textContent = `
            .modal-content.show {
                transform: scale(1);
                opacity: 1;
            }
            
            /* Mantém o comportamento de overflow para compatibilidade */
            body.modal-open {
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
    });
    
})();
