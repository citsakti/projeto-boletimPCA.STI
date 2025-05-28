/**
 * PainelResumoCollapsible.js - Controla o comportamento do painel de resumos recolhível
 * 
 * Este script é responsável por:
 *  - Gerenciar o estado expandido/recolhido do painel de resumos
 *  - Controlar as animações de abertura e fechamento
 *  - Manter preferência do usuário no localStorage
 *  - Adaptar comportamento para diferentes tamanhos de tela
 *  - Integrar com o sistema existente de PainelDeResumos.js
 */

class PainelResumoCollapsible {
    constructor() {
        this.container = document.getElementById('painel-resumo-container');
        this.toggleBtn = document.getElementById('painel-toggle-btn');
        this.closeBtn = document.getElementById('painel-close-btn');
        this.isExpanded = true;
        this.storageKey = 'painel-resumo-state';
        
        this.init();
    }
    
    init() {
        // Carrega o estado salvo
        this.loadState();
        
        // Configura event listeners
        this.setupEventListeners();
        
        // Aplica estado inicial
        this.applyState(false); // false = sem animação na inicialização
        
        // Listener para mudanças de tamanho de tela
        window.addEventListener('resize', () => this.handleResize());
        
        // Listener para quando o painel de resumos é atualizado
        document.addEventListener('painel-resumo-updated', () => this.handlePainelUpdate());
    }
    
    setupEventListeners() {
        // Botão de toggle principal
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggle());
        }
        
        // Botão de fechar no header do painel
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.collapse());
        }
        
        // ESC para fechar o painel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isExpanded) {
                this.collapse();
            }
        });
    }
    
    toggle() {
        if (this.isExpanded) {
            this.collapse();
        } else {
            this.expand();
        }
    }
    
    expand() {
        if (this.isExpanded) return;
        
        this.isExpanded = true;
        this.applyState(true);
        this.saveState();
        
        // Dispara evento personalizado
        document.dispatchEvent(new CustomEvent('painel-resumo-expanded'));
    }
    
    collapse() {
        if (!this.isExpanded) return;
        
        this.isExpanded = false;
        this.applyState(true);
        this.saveState();
        
        // Dispara evento personalizado
        document.dispatchEvent(new CustomEvent('painel-resumo-collapsed'));
    }
    
    applyState(animate = true) {
        if (!this.container || !this.toggleBtn) return;
        
        if (animate) {
            // Adiciona classe de transição
            this.container.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
            // Remove transição para aplicação inicial
            this.container.style.transition = 'none';
            // Reaplica transição após um frame
            requestAnimationFrame(() => {
                if (this.container) {
                    this.container.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                }
            });
        }
        
        if (this.isExpanded) {
            // Estado expandido
            this.container.classList.remove('collapsed');
            this.container.classList.add('expanded');
            this.toggleBtn.classList.remove('collapsed');
            this.toggleBtn.title = 'Ocultar Painel de Resumos';
            
            // Atualiza texto do botão se visível
            const toggleText = this.toggleBtn.querySelector('.toggle-text');
            if (toggleText) {
                toggleText.textContent = 'Ocultar';
            }
        } else {
            // Estado recolhido
            this.container.classList.remove('expanded');
            this.container.classList.add('collapsed');
            this.toggleBtn.classList.add('collapsed');
            this.toggleBtn.title = 'Mostrar Painel de Resumos';
            
            // Atualiza texto do botão se visível
            const toggleText = this.toggleBtn.querySelector('.toggle-text');
            if (toggleText) {
                toggleText.textContent = 'Resumos';
            }
        }
    }
    
    saveState() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify({
                isExpanded: this.isExpanded,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Não foi possível salvar o estado do painel de resumos:', e);
        }
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const state = JSON.parse(saved);
                
                // Verifica se o estado não é muito antigo (7 dias)
                const isOld = Date.now() - (state.timestamp || 0) > 7 * 24 * 60 * 60 * 1000;
                
                if (!isOld && typeof state.isExpanded === 'boolean') {
                    this.isExpanded = state.isExpanded;
                } else {
                    // Estado padrão baseado no tamanho da tela
                    this.isExpanded = this.getDefaultState();
                }
            } else {
                this.isExpanded = this.getDefaultState();
            }
        } catch (e) {
            console.warn('Erro ao carregar estado do painel de resumos:', e);
            this.isExpanded = this.getDefaultState();
        }
    }
    
    getDefaultState() {
        // No mobile/tablet, começa recolhido. No desktop, começa expandido.
        return window.innerWidth >= 1200;
    }
    
    handleResize() {
        // Reaplica o estado sem animação durante redimensionamento
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.applyState(false);
        }, 100);
    }
    
    handlePainelUpdate() {
        // Se o painel está expandido e foi atualizado, adiciona uma indicação visual sutil
        if (this.isExpanded && this.container) {
            this.container.classList.add('loading');
            
            setTimeout(() => {
                if (this.container) {
                    this.container.classList.remove('loading');
                }
            }, 300);
        }
    }
    
    // Método público para forçar um estado
    setState(expanded, save = true) {
        this.isExpanded = expanded;
        this.applyState(true);
        if (save) {
            this.saveState();
        }
    }
    
    // Método público para obter o estado atual
    getState() {
        return {
            isExpanded: this.isExpanded,
            container: this.container,
            toggleBtn: this.toggleBtn
        };
    }
}

// Inicializa quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Aguarda um pouco para garantir que outros scripts foram carregados
    setTimeout(() => {
        window.painelResumoCollapsible = new PainelResumoCollapsible();
    }, 100);
});

// Exporta para uso global se necessário
window.PainelResumoCollapsible = PainelResumoCollapsible;
