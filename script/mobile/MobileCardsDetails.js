/**
 * MobileCardsDetails.js - Gerenciamento de expansão e colapso de detalhes dos cards mobile
 * 
 * Este script é responsável por:
 *  - Expandir e colapsar detalhes adicionais dos cards de projeto
 *  - Gerenciar estado de expansão/colapso entre diferentes cards
 *  - Implementar animações suaves de transição
 *  - Renderizar informações detalhadas dos projetos
 *  - Controlar comportamento de um card expandido por vez
 * 
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Elementos de Interface:
 *   - Cards de projeto: Elementos com classe 'project-card'
 *   - Botão de detalhes: Identificado pela classe 'btn-details'
 *   - Container de detalhes: Criado dinamicamente com classe 'card-details-expanded'
 * 
 * # Métodos Principais:
 *   - toggleDetails(): Alterna estado de expansão de um card específico
 *   - expandDetails(): Expande detalhes de um card com animação
 *   - collapseDetails(): Colapsa detalhes de um card específico
 *   - collapseAllDetails(): Colapsa todos os cards expandidos
 *   - createDetailsContent(): Cria o HTML com informações detalhadas
 * 
 * # Fluxo de Execução:
 *   1. Detecta clique no botão de detalhes de um card
 *   2. Verifica se o card já está expandido
 *   3. Colapsa outros cards expandidos (comportamento exclusivo)
 *   4. Expande o card selecionado com animação
 *   5. Renderiza informações detalhadas do projeto
 *   6. Atualiza texto do botão para "Recolher"
 * 
 * # Comportamento de Expansão:
 *   - Apenas um card pode estar expandido por vez
 *   - Animações CSS para transições suaves
 *   - Informações detalhadas incluem todos os campos do projeto
 *   - Botão muda de estado entre "Ver Detalhes" e "Recolher"
 * 
 * # Integração:
 *   - Chamado pelo MobileCardsEvents ao detectar clique em botão de detalhes
 *   - Utiliza dados filtrados fornecidos pelo MobileCardsManager
 *   - Aplica estilos CSS definidos em MobileCards.css
 *   - Coordena com sistema de animação geral dos cards
 */

class MobileCardsDetails {
    /**
     * Alterna os detalhes de um projeto específico
     * @param {string} projectId - ID do projeto
     * @param {Array} filteredData - Dados filtrados dos projetos
     */
    static toggleDetails(projectId, filteredData) {
        const projectCard = document.querySelector(`.project-card[data-project-id="${projectId}"]`);
        if (!projectCard) return;
        
        const existingDetails = projectCard.querySelector('.card-details-expanded');
        
        // Se os detalhes já estão expandidos, recolher
        if (existingDetails) {
            this.collapseDetails(projectCard);
            return;
        }
        
        // Recolher qualquer outro card expandido
        this.collapseAllDetails();
        
        // Expandir este card
        this.expandDetails(projectCard, projectId, filteredData);
    }

    /**
     * Expande os detalhes de um card
     * @param {HTMLElement} projectCard - Elemento do card
     * @param {string} projectId - ID do projeto
     * @param {Array} filteredData - Dados filtrados dos projetos
     */
    static expandDetails(projectCard, projectId, filteredData) {
        const project = filteredData.find(item => item.id == projectId);
        if (!project) return;
        
        const detailsButton = projectCard.querySelector('.btn-details');
        
        // Criar o container de detalhes
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'card-details-expanded';
        
        // Usar o renderer para criar o HTML dos detalhes
        detailsContainer.innerHTML = window.MobileCardsRenderer.createDetailsHTML(project);
        
        // Adicionar o container ao card
        projectCard.appendChild(detailsContainer);
        
        // Adicionar classe para indicar que está expandido
        projectCard.classList.add('expanded');
        
        // Atualizar o texto do botão
        detailsButton.innerHTML = '<i class="fas fa-chevron-up"></i> Recolher';
        
        // Trigger da animação
        requestAnimationFrame(() => {
            detailsContainer.classList.add('show');
        });
    }
    
    /**
     * Colapsa os detalhes de um card
     * @param {HTMLElement} projectCard - Elemento do card
     */
    static collapseDetails(projectCard) {
        const detailsContainer = projectCard.querySelector('.card-details-expanded');
        const detailsButton = projectCard.querySelector('.btn-details');
        
        if (!detailsContainer) return;
        
        // Remover classe de expansão
        projectCard.classList.remove('expanded');
        
        // Animar saída
        detailsContainer.classList.remove('show');
        
        // Atualizar o texto do botão
        detailsButton.innerHTML = '<i class="fas fa-chevron-down"></i> Detalhar';
        
        // Remover o elemento após a animação
        setTimeout(() => {
            if (detailsContainer.parentNode) {
                detailsContainer.parentNode.removeChild(detailsContainer);
            }
        }, 300);
    }
    
    /**
     * Colapsa todos os cards expandidos
     */
    static collapseAllDetails() {
        const expandedCards = document.querySelectorAll('.project-card.expanded');
        expandedCards.forEach(card => {
            this.collapseDetails(card);
        });
    }

    /**
     * Verifica se um card está expandido
     * @param {string} projectId - ID do projeto
     * @returns {boolean} - True se o card está expandido
     */
    static isExpanded(projectId) {
        const projectCard = document.querySelector(`.project-card[data-project-id="${projectId}"]`);
        return projectCard ? projectCard.classList.contains('expanded') : false;
    }

    /**
     * Retorna todos os cards expandidos
     * @returns {NodeList} - Lista de cards expandidos
     */
    static getExpandedCards() {
        return document.querySelectorAll('.project-card.expanded');
    }

    /**
     * Força o colapso de um card específico
     * @param {string} projectId - ID do projeto
     */
    static forceCollapse(projectId) {
        const projectCard = document.querySelector(`.project-card[data-project-id="${projectId}"]`);
        if (projectCard && this.isExpanded(projectId)) {
            this.collapseDetails(projectCard);
        }
    }

    /**
     * Obtém informações sobre o estado dos detalhes
     * @returns {Object} - Objeto com informações dos cards expandidos
     */
    static getDetailsState() {
        const expandedCards = this.getExpandedCards();
        const expandedIds = Array.from(expandedCards).map(card => 
            card.getAttribute('data-project-id')
        );
        
        return {
            hasExpanded: expandedIds.length > 0,
            expandedCount: expandedIds.length,
            expandedIds: expandedIds
        };
    }
}

// Exportar para uso global
window.MobileCardsDetails = MobileCardsDetails;

console.log('MobileCardsDetails.js carregado');
