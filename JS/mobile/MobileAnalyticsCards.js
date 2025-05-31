/**
 * MobileAnalyticsCards.js - Gerenciamento de cards móveis para a página de Analytics
 * 
 * Este script é responsável por:
 *  - Adaptar os dados analíticos para visualização em cards móveis
 *  - Gerenciar a exibição de gráficos e estatísticas em formato mobile-friendly
 */

class MobileAnalyticsManager {
    constructor() {
        this.isMobileView = false;
        this.init();
    }
    
    init() {
        this.createMobileStructure();
        this.bindEvents();
        this.checkMobileView();
        
        // Escutar redimensionamento da tela
        window.addEventListener('resize', () => {
            this.checkMobileView();
        });
        
        // Escutar quando os dados analíticos são carregados
        document.addEventListener('analytics-loaded', () => {
            this.adaptAnalyticsForMobile();
        });
    }
    
    createMobileStructure() {
        const dashboard = document.getElementById('analytics-dashboard');
        if (!dashboard) return;
        
        // Criar container mobile para analytics
        const mobileContainer = document.createElement('div');
        mobileContainer.className = 'mobile-analytics-container';
        mobileContainer.id = 'mobile-analytics-container';
        mobileContainer.style.display = 'none';
        
        dashboard.parentNode.insertBefore(mobileContainer, dashboard);
    }
    
    bindEvents() {
        // Eventos específicos para analytics mobile podem ser adicionados aqui
    }
    
    checkMobileView() {
        const wasMobile = this.isMobileView;
        this.isMobileView = window.innerWidth <= 430;
        
        if (wasMobile !== this.isMobileView) {
            if (this.isMobileView) {
                this.showMobileView();
            } else {
                this.hideMobileView();
            }
        }
    }
    
    showMobileView() {
        const mobileContainer = document.getElementById('mobile-analytics-container');
        const dashboard = document.getElementById('analytics-dashboard');
        
        if (mobileContainer) mobileContainer.style.display = 'block';
        if (dashboard) dashboard.style.display = 'none';
        
        this.adaptAnalyticsForMobile();
    }
    
    hideMobileView() {
        const mobileContainer = document.getElementById('mobile-analytics-container');
        const dashboard = document.getElementById('analytics-dashboard');
        
        if (mobileContainer) mobileContainer.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
    }
    
    adaptAnalyticsForMobile() {
        if (!this.isMobileView) return;
        
        const mobileContainer = document.getElementById('mobile-analytics-container');
        const dashboard = document.getElementById('analytics-dashboard');
        
        if (!mobileContainer || !dashboard) return;
        
        // Encontrar todas as seções de analytics
        const sections = dashboard.querySelectorAll('.analytics-section, .chart-container, .stats-container');
        
        let mobileContent = '';
        
        sections.forEach((section, index) => {
            const title = section.querySelector('h2, h3, .section-title')?.textContent || `Seção ${index + 1}`;
            const content = section.innerHTML;
            
            mobileContent += `
                <div class="mobile-analytics-card">
                    <div class="mobile-analytics-header" onclick="this.parentNode.querySelector('.mobile-analytics-content').classList.toggle('collapsed')">
                        <h6 class="mb-0">${title}</h6>
                        <i class="bi bi-chevron-down"></i>
                    </div>
                    <div class="mobile-analytics-content">
                        ${this.adaptContentForMobile(content)}
                    </div>
                </div>
            `;
        });
        
        if (mobileContent) {
            mobileContainer.innerHTML = mobileContent;
        } else {
            // Fallback se não houver conteúdo específico
            mobileContainer.innerHTML = `
                <div class="mobile-analytics-card">
                    <div class="mobile-analytics-header">
                        <h6 class="mb-0">Dados Analíticos</h6>
                    </div>
                    <div class="mobile-analytics-content">
                        <p class="text-muted">Os dados analíticos estão sendo carregados...</p>
                    </div>
                </div>
            `;
        }
    }
    
    adaptContentForMobile(content) {
        // Adaptar tabelas para cards
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        const tables = tempDiv.querySelectorAll('table');
        tables.forEach(table => {
            const cards = this.convertTableToCards(table);
            table.parentNode.replaceChild(cards, table);
        });
        
        // Adaptar gráficos para mobile
        const charts = tempDiv.querySelectorAll('canvas, .chart');
        charts.forEach(chart => {
            chart.style.maxWidth = '100%';
            chart.style.height = 'auto';
        });
        
        return tempDiv.innerHTML;
    }
    
    convertTableToCards(table) {
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'analytics-cards-grid';
        
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        
        rows.forEach((row, index) => {
            const cells = Array.from(row.querySelectorAll('td'));
            if (cells.length === 0) return;
            
            const card = document.createElement('div');
            card.className = 'analytics-data-card';
            
            let cardContent = '';
            cells.forEach((cell, cellIndex) => {
                const header = headers[cellIndex] || `Coluna ${cellIndex + 1}`;
                const value = cell.textContent.trim();
                
                cardContent += `
                    <div class="analytics-data-item">
                        <span class="analytics-data-label">${header}:</span>
                        <span class="analytics-data-value">${value}</span>
                    </div>
                `;
            });
            
            card.innerHTML = cardContent;
            cardsContainer.appendChild(card);
        });
        
        return cardsContainer;
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Só inicializar se estivermos na página de analytics
    if (document.getElementById('analytics-dashboard')) {
        new MobileAnalyticsManager();
    }
});

console.log('MobileAnalyticsCards.js carregado');
