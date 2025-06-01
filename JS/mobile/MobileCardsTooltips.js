/**
 * MobileCardsTooltips.js - Sistema de tooltips para os cards mobile
 * 
 * Este módulo é responsável por:
 * - Gerenciar tooltips de acompanhamento
 * - Gerenciar tooltips de status
 * - Posicionamento responsivo
 * - Event listeners para dispositivos móveis
 */

class MobileCardsTooltips {
    constructor() {
        this.statusTooltip = null;
        this.statusTooltipTimeout = null;
        this.isMobileView = false;
        
        this.setupTooltips();
    }

    /**
     * Configura todos os sistemas de tooltip
     */
    setupTooltips() {
        this.setupAcompanhamentoTooltips();
        this.setupStatusTooltips();
    }

    /**
     * Define se está na visualização mobile
     * @param {boolean} isMobile - Se está em modo mobile
     */
    setMobileView(isMobile) {
        this.isMobileView = isMobile;
    }

    /**
     * Configura os tooltips de acompanhamento para os cards mobile
     */
    setupAcompanhamentoTooltips() {
        // Criar elemento de tooltip se não existir
        if (!document.querySelector('.mobile-acompanhamento-tooltip')) {
            const tooltip = document.createElement('div');
            tooltip.className = 'mobile-acompanhamento-tooltip';
            document.body.appendChild(tooltip);
        }
        
        // Remover event listeners antigos
        document.removeEventListener('click', this.handleTooltipClick);
        document.removeEventListener('touchstart', this.handleTooltipTouch);
        
        // Adicionar event listeners para cards com acompanhamento
        this.handleTooltipClick = this.handleTooltipClick.bind(this);
        this.handleTooltipTouch = this.handleTooltipTouch.bind(this);
        
        document.addEventListener('click', this.handleTooltipClick);
        document.addEventListener('touchstart', this.handleTooltipTouch);
    }
    
    /**
     * Manipula cliques nos cards para mostrar tooltips de acompanhamento
     */
    handleTooltipClick(event) {
        const card = event.target.closest('.project-card[data-acompanhamento-tooltip]');
        const emojiElement = event.target.closest('.acompanhamento-emoji');
        
        if (emojiElement && card) {
            event.preventDefault();
            event.stopPropagation();
            this.showAcompanhamentoTooltip(card, event);
        } else {
            this.hideAcompanhamentoTooltip();
        }
    }
    
    /**
     * Manipula toques nos dispositivos móveis
     */
    handleTooltipTouch(event) {
        const card = event.target.closest('.project-card[data-acompanhamento-tooltip]');
        const emojiElement = event.target.closest('.acompanhamento-emoji');
        
        if (emojiElement && card) {
            event.preventDefault();
            this.showAcompanhamentoTooltip(card, event);
        } else {
            this.hideAcompanhamentoTooltip();
        }
    }
    
    /**
     * Mostra o tooltip de acompanhamento para um card
     */
    showAcompanhamentoTooltip(card, event) {
        const tooltipText = card.getAttribute('data-acompanhamento-tooltip');
        if (!tooltipText) return;
        
        const tooltip = document.querySelector('.mobile-acompanhamento-tooltip');
        if (!tooltip) return;
        
        tooltip.textContent = tooltipText;
        tooltip.classList.add('show');
        
        // Posicionar o tooltip
        const rect = card.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
        
        // Calcular posição central do card
        const cardCenterX = rect.left + (rect.width / 2);
        const cardTop = rect.top;
        
        // Posicionar tooltip acima do card
        tooltip.style.left = (cardCenterX + scrollLeft - (tooltip.offsetWidth / 2)) + 'px';
        tooltip.style.top = (cardTop + scrollTop - tooltip.offsetHeight - 15) + 'px';
        
        // Verificar se o tooltip está fora da tela e ajustar
        const tooltipRect = tooltip.getBoundingClientRect();
        if (tooltipRect.left < 10) {
            tooltip.style.left = (scrollLeft + 10) + 'px';
        } else if (tooltipRect.right > window.innerWidth - 10) {
            tooltip.style.left = (scrollLeft + window.innerWidth - tooltip.offsetWidth - 10) + 'px';
        }
          // Auto-hide após 2 segundos
        setTimeout(() => {
            this.hideAcompanhamentoTooltip();
        }, 2000);
    }
    
    /**
     * Esconde o tooltip de acompanhamento
     */
    hideAcompanhamentoTooltip() {
        const tooltip = document.querySelector('.mobile-acompanhamento-tooltip');
        if (tooltip) {
            tooltip.classList.remove('show');
        }
    }

    /**
     * Configura os tooltips de status para os cards mobile
     */
    setupStatusTooltips() {
        // Criar elemento de tooltip se não existir
        if (!this.statusTooltip) {
            this.statusTooltip = document.createElement('div');
            this.statusTooltip.className = 'mobile-status-tooltip';
            this.statusTooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 14px;
                line-height: 1.4;
                max-width: 280px;
                z-index: 1000;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.2s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                word-wrap: break-word;
            `;
            document.body.appendChild(this.statusTooltip);
        }
        
        // Adicionar listener global para esconder tooltip ao tocar fora
        document.addEventListener('touchstart', (e) => {
            if (!e.target.closest('.has-status-tooltip') && !e.target.closest('.mobile-status-tooltip')) {
                this.hideStatusTooltip();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.has-status-tooltip') && !e.target.closest('.mobile-status-tooltip')) {
                this.hideStatusTooltip();
            }
        });
    }
    
    /**
     * Mostra o tooltip de status para um card
     */
    showStatusTooltip(card, tooltipText, event) {
        if (!tooltipText || !this.statusTooltip) return;
        
        this.statusTooltip.textContent = tooltipText;
        this.statusTooltip.style.opacity = '1';
        
        // Posicionamento responsivo
        const rect = card.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calcular posição inicial
        let top = rect.top + scrollTop - this.statusTooltip.offsetHeight - 10;
        let left = rect.left + scrollLeft + (rect.width / 2) - (this.statusTooltip.offsetWidth / 2);
        
        // Ajustar se estiver fora da viewport
        if (top < scrollTop + 10) {
            // Se não cabe acima, mostrar abaixo
            top = rect.bottom + scrollTop + 10;
        }
        
        if (left < scrollLeft + 10) {
            left = scrollLeft + 10;
        } else if (left + this.statusTooltip.offsetWidth > scrollLeft + viewportWidth - 10) {
            left = scrollLeft + viewportWidth - this.statusTooltip.offsetWidth - 10;
        }
        
        this.statusTooltip.style.top = top + 'px';
        this.statusTooltip.style.left = left + 'px';
          // Auto-hide após 2,5 segundos
        clearTimeout(this.statusTooltipTimeout);
        this.statusTooltipTimeout = setTimeout(() => {
            this.hideStatusTooltip();
        }, 2500);
    }
    
    /**
     * Esconde o tooltip de status
     */
    hideStatusTooltip() {
        if (this.statusTooltip) {
            this.statusTooltip.style.opacity = '0';
        }
        clearTimeout(this.statusTooltipTimeout);
    }
    
    /**
     * Configura event listeners para tooltips de status nos cards
     * @param {Array} filteredData - Dados filtrados dos projetos
     */
    setupStatusCardListeners(filteredData) {
        if (!this.isMobileView) return;
        
        const statusElements = document.querySelectorAll('.project-card .card-status-text.has-status-tooltip');
        
        statusElements.forEach(element => {
            const card = element.closest('.project-card');
            const projectId = card.getAttribute('data-project-id');
            const item = filteredData.find(i => i.id == projectId);
            
            if (item && item.hasStatusTooltip) {
                // Remover event listeners antigos
                element.removeEventListener('touchstart', this.handleStatusTooltipTouch);
                element.removeEventListener('click', this.handleStatusTooltipClick);
                
                // Adicionar novos event listeners
                element.addEventListener('touchstart', (e) => this.handleStatusTooltipTouch(e, item), { passive: false });
                element.addEventListener('click', (e) => this.handleStatusTooltipClick(e, item));
                
                // Adicionar indicador visual de que é tocável
                element.style.cursor = 'pointer';
                element.setAttribute('title', 'Toque para ver detalhes do status');
            }
        });
    }
    
    /**
     * Manipula toques nos elementos de status
     */
    handleStatusTooltipTouch(event, item) {
        if (!this.isMobileView || !item.hasStatusTooltip) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        // Haptic feedback se disponível
        if (window.MobileUtils && window.MobileUtils.hapticFeedback) {
            window.MobileUtils.hapticFeedback('light');
        }
        
        this.showStatusTooltip(event.currentTarget, item.statusTooltipText, event);
    }
    
    /**
     * Manipula cliques nos elementos de status
     */
    handleStatusTooltipClick(event, item) {
        if (!this.isMobileView || !item.hasStatusTooltip) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        this.showStatusTooltip(event.currentTarget, item.statusTooltipText, event);
    }

    /**
     * Manipula toques/cliques nos cards para mostrar tooltips de status
     */
    handleStatusTooltip(event, item) {
        if (!this.isMobileView || !item.hasStatusTooltip) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        this.showStatusTooltip(event.currentTarget, item.statusTooltipText, event);
    }
}

// Exportar para uso global
window.MobileCardsTooltips = MobileCardsTooltips;

console.log('MobileCardsTooltips.js carregado');
