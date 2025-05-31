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

class PainelResumoCollapsible {    constructor() {
        this.container = document.getElementById('painel-resumo-container');
        this.closeBtn = document.getElementById('painel-close-btn');
        this.isExpanded = false; // Inicia fechado por padrão
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
    }    setupEventListeners() {
        // Botão de fechar/seta no header do painel - agora funciona como toggle
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.toggle());
        }
        
        // Header clicável para expandir/recolher (exceto no botão de seta)
        const header = this.container?.querySelector('.painel-resumo-header');
        if (header) {
            header.addEventListener('click', (e) => {
                // Não ativa se clicou no botão de seta
                if (e.target.closest('.painel-close-btn')) {
                    return;
                }
                this.toggle();
                // Adiciona efeito visual de clique
                this.addClickEffect(header);
            });
            
            // Adiciona cursor pointer para indicar que é clicável
            header.style.cursor = 'pointer';
        }
        
        // ESC para fechar o painel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isExpanded) {
                this.collapse();
            }
        });    }
    
    toggle() {
        // Força uma verificação do estado atual antes do toggle
        this.refreshState();
        
        if (this.isExpanded) {
            this.collapse();
        } else {
            this.expand();
        }
        
        // Salva o novo estado
        this.saveState();
    }
    
    refreshState() {
        // Verifica o estado atual baseado nas classes CSS
        if (this.container) {
            const hasExpandedClass = this.container.classList.contains('expanded');
            const hasCollapsedClass = this.container.classList.contains('collapsed');
            
            // Se há inconsistência, força o estado baseado na classe expanded
            if (hasExpandedClass && !this.isExpanded) {
                this.isExpanded = true;
            } else if (hasCollapsedClass && this.isExpanded) {
                this.isExpanded = false;
            }
        }
    }
      expand() {
        if (this.isExpanded) return;
        
        console.log('Expandindo painel de resumos');
        this.isExpanded = true;
        this.applyState(true);
        this.saveState();
        
        // Dispara evento personalizado
        document.dispatchEvent(new CustomEvent('painel-resumo-expanded'));
    }
    
    collapse() {
        if (!this.isExpanded) return;
        
        console.log('Recolhendo painel de resumos');
        this.isExpanded = false;
        this.applyState(true);
        this.saveState();
        
        // Dispara evento personalizado
        document.dispatchEvent(new CustomEvent('painel-resumo-collapsed'));
    }
    
    addClickEffect(element) {
        // Remove efeito anterior se existir
        element.classList.remove('header-click-effect');
        
        // Força um reflow para garantir que a classe foi removida
        element.offsetHeight;
        
        // Adiciona o efeito
        element.classList.add('header-click-effect');
        
        // Remove o efeito após a animação
        setTimeout(() => {
            element.classList.remove('header-click-effect');
        }, 300);
    }    applyState(animate = true) {
        if (!this.container) return;
        
        // Remove classes conflitantes antes de aplicar o novo estado
        this.container.classList.remove('expanded', 'collapsed');
        
        // Força um reflow para garantir que as classes foram removidas
        this.container.offsetHeight;
        
        if (this.isExpanded) {
            // Estado expandido
            this.container.classList.add('expanded');
            
            // Atualiza seta para apontar para cima
            this.updateArrowIcon('↑');
        } else {
            // Estado recolhido
            this.container.classList.add('collapsed');
            
            // Atualiza seta para apontar para baixo
            this.updateArrowIcon('↓');
        }
    }
    
    updateArrowIcon(direction) {
        const arrowIcon = this.closeBtn?.querySelector('.arrow-icon');
        if (arrowIcon) {
            arrowIcon.textContent = direction;
            // Pequena rotação suave para dar feedback visual
            arrowIcon.style.transform = direction === '↑' ? 'rotate(180deg) scale(1.1)' : 'rotate(0deg) scale(1)';
        }
    }
      addExpandEffect() {
        // Força um reflow para garantir que as classes estão aplicadas
        this.container.offsetHeight;
        
        // Adiciona uma classe temporária para a animação se necessário
        this.container.classList.add('expanding');
        
        // Remove a classe temporária após a animação
        setTimeout(() => {
            this.container.classList.remove('expanding');
        }, 500);
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
        // Sempre começa recolhido (fechado) por padrão
        return false;
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
            closeBtn: this.closeBtn
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
