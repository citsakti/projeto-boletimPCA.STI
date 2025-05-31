/**
 * Melhorias na responsividade e interatividade da toolbar
 * Projeto: Boletim PCA STI 2025
 */

class ToolbarResponsive {
    constructor() {
        this.toolbar = null;
        this.buttons = [];
        this.currentBreakpoint = 'desktop';
        this.resizeTimeout = null;
        this.touchStartTime = 0;
        
        this.init();
    }
    
    init() {
        // Aguarda o DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.toolbar = document.getElementById('toolbar');
        if (!this.toolbar) {
            console.warn('Toolbar não encontrada');
            return;
        }
        
        this.buttons = Array.from(this.toolbar.querySelectorAll('.btn-toolbar'));
        
        // Configurações iniciais
        this.detectBreakpoint();
        this.addEventListeners();
        this.enhanceButtons();
        this.optimizeForTouch();
        
        console.log('Toolbar responsiva inicializada com sucesso');
    }
    
    /**
     * Detecta o breakpoint atual
     */
    detectBreakpoint() {
        const width = window.innerWidth;
        
        if (width < 576) {
            this.currentBreakpoint = 'mobile-small';
        } else if (width < 768) {
            this.currentBreakpoint = 'mobile';
        } else if (width < 992) {
            this.currentBreakpoint = 'tablet';
        } else if (width < 1200) {
            this.currentBreakpoint = 'laptop';
        } else {
            this.currentBreakpoint = 'desktop';
        }
        
        // Adiciona classe CSS para o breakpoint atual
        this.toolbar.setAttribute('data-breakpoint', this.currentBreakpoint);
    }
    
    /**
     * Adiciona event listeners
     */
    addEventListeners() {
        // Listener para redimensionamento com debounce
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.detectBreakpoint();
                this.adjustButtonsForBreakpoint();
            }, 150);
        });
        
        // Listeners para botões
        this.buttons.forEach(button => {
            this.addButtonListeners(button);
        });
        
        // Listener para orientação do dispositivo
        if ('onorientationchange' in window) {
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.detectBreakpoint();
                    this.adjustButtonsForBreakpoint();
                }, 100);
            });
        }
    }
    
    /**
     * Adiciona listeners específicos para cada botão
     */
    addButtonListeners(button) {
        // Efeito de loading
        button.addEventListener('click', (e) => {
            this.addLoadingEffect(button);
        });
        
        // Suporte a toque melhorado
        button.addEventListener('touchstart', (e) => {
            this.touchStartTime = Date.now();
            button.classList.add('touch-active');
        }, { passive: true });
        
        button.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - this.touchStartTime;
            
            // Remove classe touch-active após um delay
            setTimeout(() => {
                button.classList.remove('touch-active');
            }, Math.max(150 - touchDuration, 0));
        }, { passive: true });
        
        // Efeito hover melhorado para desktop
        if (window.matchMedia('(hover: hover)').matches) {
            button.addEventListener('mouseenter', () => {
                this.addHoverEffect(button);
            });
            
            button.addEventListener('mouseleave', () => {
                this.removeHoverEffect(button);
            });
        }
    }
    
    /**
     * Aplica efeito de loading no botão
     */
    addLoadingEffect(button) {
        if (button.classList.contains('loading')) return;
        
        button.classList.add('loading');
        button.setAttribute('disabled', 'true');
        
        // Remove loading após 2 segundos (tempo máximo)
        setTimeout(() => {
            this.removeLoadingEffect(button);
        }, 2000);
    }
    
    /**
     * Remove efeito de loading
     */
    removeLoadingEffect(button) {
        button.classList.remove('loading');
        button.removeAttribute('disabled');
    }
    
    /**
     * Adiciona efeito hover
     */
    addHoverEffect(button) {
        button.style.setProperty('--hover-scale', '1.05');
    }
    
    /**
     * Remove efeito hover
     */
    removeHoverEffect(button) {
        button.style.removeProperty('--hover-scale');
    }
    
    /**
     * Melhora os botões para diferentes breakpoints
     */
    adjustButtonsForBreakpoint() {
        this.buttons.forEach(button => {
            const textElements = button.querySelectorAll('.btn-text');
            const icon = button.querySelector('i');
            
            switch (this.currentBreakpoint) {
                case 'mobile-small':
                    this.optimizeForMobileSmall(button, textElements, icon);
                    break;
                case 'mobile':
                    this.optimizeForMobile(button, textElements, icon);
                    break;
                case 'tablet':
                    this.optimizeForTablet(button, textElements, icon);
                    break;
                default:
                    this.optimizeForDesktop(button, textElements, icon);
                    break;
            }
        });
    }
    
    /**
     * Otimização para mobile pequeno
     */
    optimizeForMobileSmall(button, textElements, icon) {
        // Texto ultra-compacto
        textElements.forEach(text => {
            text.style.fontSize = '0.65rem';
            text.style.lineHeight = '1.1';
        });
        
        // Ícone menor
        if (icon) {
            icon.style.fontSize = '0.85rem';
            icon.style.marginRight = '0.125rem';
        }
        
        // Padding compacto
        button.style.padding = '0.5rem 0.375rem';
    }
    
    /**
     * Otimização para mobile
     */
    optimizeForMobile(button, textElements, icon) {
        textElements.forEach(text => {
            text.style.fontSize = '0.7rem';
            text.style.lineHeight = '1.2';
        });
        
        if (icon) {
            icon.style.fontSize = '0.9rem';
            icon.style.marginRight = '0.25rem';
        }
        
        button.style.padding = '0.5rem 0.5rem';
    }
    
    /**
     * Otimização para tablet
     */
    optimizeForTablet(button, textElements, icon) {
        textElements.forEach(text => {
            text.style.fontSize = '0.8rem';
            text.style.lineHeight = '1.3';
        });
        
        if (icon) {
            icon.style.fontSize = '0.95rem';
            icon.style.marginRight = '0.375rem';
        }
        
        button.style.padding = '0.625rem 1rem';
    }
    
    /**
     * Otimização para desktop
     */
    optimizeForDesktop(button, textElements, icon) {
        // Remove estilos inline para usar CSS padrão
        textElements.forEach(text => {
            text.style.removeProperty('font-size');
            text.style.removeProperty('line-height');
        });
        
        if (icon) {
            icon.style.removeProperty('font-size');
            icon.style.removeProperty('margin-right');
        }
        
        button.style.removeProperty('padding');
    }
    
    /**
     * Melhora a interação por toque
     */
    optimizeForTouch() {
        // Detecta se é um dispositivo de toque
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            this.toolbar.classList.add('touch-device');
            
            // Aumenta a área de toque para botões pequenos
            this.buttons.forEach(button => {
                const rect = button.getBoundingClientRect();
                if (rect.height < 44) { // 44px é o mínimo recomendado para toque
                    button.style.minHeight = '44px';
                }
            });
        }
    }
    
    /**
     * Melhora os botões com funcionalidades extras
     */
    enhanceButtons() {
        this.buttons.forEach(button => {
            // Adiciona atributos de acessibilidade
            if (!button.getAttribute('aria-label')) {
                const text = button.textContent.trim();
                button.setAttribute('aria-label', text);
            }
            
            // Adiciona role se necessário
            if (!button.getAttribute('role')) {
                button.setAttribute('role', 'button');
            }
            
            // Melhora a navegação por teclado
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });
        });
    }
    
    /**
     * Verifica se há overflow na toolbar
     */
    checkOverflow() {
        const toolbarRect = this.toolbar.getBoundingClientRect();
        let hasOverflow = false;
        
        this.buttons.forEach(button => {
            const buttonRect = button.getBoundingClientRect();
            if (buttonRect.right > toolbarRect.right || buttonRect.bottom > toolbarRect.bottom) {
                hasOverflow = true;
            }
        });
        
        if (hasOverflow) {
            this.toolbar.classList.add('has-overflow');
        } else {
            this.toolbar.classList.remove('has-overflow');
        }
        
        return hasOverflow;
    }
    
    /**
     * Força um reflow da toolbar
     */
    reflow() {
        this.detectBreakpoint();
        this.adjustButtonsForBreakpoint();
        this.checkOverflow();
    }
    
    /**
     * Método público para atualizar a toolbar
     */
    update() {
        this.reflow();
    }
    
    /**
     * Método para obter informações do estado atual
     */
    getState() {
        return {
            breakpoint: this.currentBreakpoint,
            buttonCount: this.buttons.length,
            hasOverflow: this.toolbar.classList.contains('has-overflow'),
            isTouchDevice: this.toolbar.classList.contains('touch-device')
        };
    }
}

// Inicializa automaticamente quando o script é carregado
let toolbarResponsive;

// Aguarda o DOM estar pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        toolbarResponsive = new ToolbarResponsive();
    });
} else {
    toolbarResponsive = new ToolbarResponsive();
}

// Torna disponível globalmente para debug
window.ToolbarResponsive = ToolbarResponsive;
window.toolbarResponsive = toolbarResponsive;

// Export para módulos se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToolbarResponsive;
}
