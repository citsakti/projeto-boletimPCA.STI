/**
 * MobileCards.js - Gerenciamento de cards móveis para o Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Detectar quando a tela está no tamanho mobile (430px)
 *  - Converter dados da tabela para formato de cards
 *  - Gerenciar filtros móveis
 *  - Mostrar/ocultar detalhes dos projetos
 */

class MobileCardsManager {
    constructor() {
        this.isMobileView = false;
        this.currentData = [];
        this.filteredData = [];
        this.filters = {
            area: '',
            status: '',
            tipo: '',
            projeto: ''
        };
        
        this.init();
    }
    
    init() {
        this.createMobileStructure();
        this.bindEvents();
        this.checkMobileView();
        
        // Escutar evento de dados carregados
        document.addEventListener('tabela-carregada', () => {
            this.loadTableData();
        });
        
        // Escutar redimensionamento da tela
        window.addEventListener('resize', () => {
            this.checkMobileView();
        });
    }
    
    createMobileStructure() {
        const detalhesSection = document.getElementById('detalhes');
        if (!detalhesSection) return;
        
        // Criar container de filtros móveis
        const filtersContainer = document.createElement('div');
        filtersContainer.className = 'mobile-filters-container';
        filtersContainer.innerHTML = `
            <div class="mobile-filters-header" id="mobile-filters-toggle">
                <h6 class="mb-0"><i class="bi bi-funnel me-2"></i>Filtros</h6>
                <i class="bi bi-chevron-down"></i>
            </div>
            <div class="mobile-filters-content" id="mobile-filters-content">
                <div class="mobile-filter-group">
                    <label for="mobile-filter-area">Área:</label>
                    <select id="mobile-filter-area" class="form-select">
                        <option value="">Todas as áreas</option>
                    </select>
                </div>
                <div class="mobile-filter-group">
                    <label for="mobile-filter-status">Status:</label>
                    <select id="mobile-filter-status" class="form-select">
                        <option value="">Todos os status</option>
                    </select>
                </div>
                <div class="mobile-filter-group">
                    <label for="mobile-filter-tipo">Tipo:</label>
                    <select id="mobile-filter-tipo" class="form-select">
                        <option value="">Todos os tipos</option>
                    </select>
                </div>
                <div class="mobile-filter-group">
                    <label for="mobile-filter-projeto">Projeto:</label>
                    <select id="mobile-filter-projeto" class="form-select">
                        <option value="">Todos os projetos</option>
                    </select>
                </div>
                <div class="mt-3">
                    <button class="btn btn-outline-danger btn-sm" id="mobile-clear-filters">
                        <i class="bi bi-trash me-1"></i>Limpar Filtros
                    </button>
                </div>
            </div>
        `;
        
        // Criar container de cards
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'mobile-cards-container';
        cardsContainer.id = 'mobile-cards-container';
        
        // Inserir antes da tabela
        const tableResponsive = detalhesSection.querySelector('.table-responsive');
        if (tableResponsive) {
            detalhesSection.insertBefore(filtersContainer, tableResponsive);
            detalhesSection.insertBefore(cardsContainer, tableResponsive);
        }
        
        // Criar modal de detalhes
        this.createDetailsModal();
    }
    
    createDetailsModal() {
        const modal = document.createElement('div');
        modal.className = 'details-modal';
        modal.id = 'details-modal';
        modal.innerHTML = `
            <div class="details-modal-content">
                <div class="details-modal-header">
                    <h5 class="details-modal-title">Detalhes do Projeto</h5>
                    <button class="details-modal-close" id="details-modal-close">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="details-modal-body" id="details-modal-body">
                    <!-- Conteúdo será inserido dinamicamente -->
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
      bindEvents() {
        // Toggle de filtros
        document.addEventListener('click', (e) => {
            if (e.target.closest('#mobile-filters-toggle')) {
                this.toggleFilters();
            }
            
            if (e.target.closest('#mobile-clear-filters')) {
                this.clearFilters();
            }
            
            // Responder ao botão principal "Limpar Filtros"
            if (e.target.closest('#btnLimparFiltros')) {
                this.clearFilters();
            }
            
            if (e.target.closest('.btn-details')) {
                const cardId = e.target.closest('.project-card').dataset.projectId;
                this.showDetails(cardId);
            }
            
            if (e.target.closest('#details-modal-close') || e.target.classList.contains('details-modal')) {
                this.hideDetails();
            }
        });
        
        // Filtros
        document.addEventListener('change', (e) => {
            if (e.target.id.startsWith('mobile-filter-')) {
                const filterType = e.target.id.replace('mobile-filter-', '');
                this.filters[filterType] = e.target.value;
                this.applyFilters();
            }
        });
    }
      checkMobileView() {
        const wasMobile = this.isMobileView;
        this.isMobileView = MobileUtils ? MobileUtils.isMobileDevice() : window.innerWidth <= 430;
        
        if (wasMobile !== this.isMobileView) {
            if (this.isMobileView) {
                this.showMobileView();
            } else {
                this.hideMobileView();
            }
        }
    }
    
    showMobileView() {
        const filtersContainer = document.querySelector('.mobile-filters-container');
        const cardsContainer = document.querySelector('.mobile-cards-container');
        const tableResponsive = document.querySelector('.table-responsive');
        
        if (filtersContainer) filtersContainer.classList.add('show');
        if (cardsContainer) cardsContainer.classList.add('show');
        if (tableResponsive) tableResponsive.style.display = 'none';
        
        this.loadTableData();
    }
    
    hideMobileView() {
        const filtersContainer = document.querySelector('.mobile-filters-container');
        const cardsContainer = document.querySelector('.mobile-cards-container');
        const tableResponsive = document.querySelector('.table-responsive');
        
        if (filtersContainer) filtersContainer.classList.remove('show');
        if (cardsContainer) cardsContainer.classList.remove('show');
        if (tableResponsive) tableResponsive.style.display = 'block';
    }
    
    loadTableData() {
        if (!this.isMobileView) return;
        
        const table = document.querySelector('table tbody');
        if (!table) return;
        
        const rows = Array.from(table.querySelectorAll('tr'));
        this.currentData = rows.map((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 10) return null;
            // Extrai a data para ordenação
            let contratarAteDate = null;
            const contratarAteText = cells[6]?.textContent?.trim();
            if (contratarAteText) {
                const parts = contratarAteText.split('/');
                if (parts.length === 3) {
                    contratarAteDate = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            }
            return {
                id: index,
                idPca: cells[0]?.textContent?.trim() || '',
                area: cells[1]?.textContent?.trim() || '',
                tipo: cells[2]?.textContent?.trim() || '',
                projeto: cells[3]?.textContent?.trim() || '',
                acompanhamento: cells[4]?.textContent?.trim() || '',
                status: cells[5]?.textContent?.trim() || '',
                contratarAte: contratarAteText || '',
                contratarAteDate: contratarAteDate, // Para ordenação
                valorPca: cells[7]?.getAttribute('data-valor-original') || cells[7]?.textContent?.trim() || '', // Valor total original do CSV
                orcamento: cells[8]?.textContent?.trim() || '',
                processo: cells[9]?.textContent?.trim() || '',
                row: row
            };
        }).filter(item => item !== null && item.status !== 'CANCELADO ❌'); // Remove cancelados
        this.populateFilters();
        this.applyFilters();
    }
    
    populateFilters() {
        const areas = [...new Set(this.currentData.map(item => item.area))].sort();
        const statuses = [...new Set(this.currentData.map(item => item.status))].sort();
        const tipos = [...new Set(this.currentData.map(item => item.tipo))].sort();
        const projetos = [...new Set(this.currentData.map(item => item.projeto))].sort();
        
        this.populateSelect('mobile-filter-area', areas);
        this.populateSelect('mobile-filter-status', statuses);
        this.populateSelect('mobile-filter-tipo', tipos);
        this.populateSelect('mobile-filter-projeto', projetos);
    }
    
    populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // Manter a primeira opção (todas)
        const firstOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (firstOption) select.appendChild(firstOption);
        
        options.forEach(option => {
            if (option && option.trim()) {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                select.appendChild(optionElement);
            }
        });
    }
    
    applyFilters() {
        this.filteredData = this.currentData.filter(item => {
            return (!this.filters.area || item.area.includes(this.filters.area)) &&
                   (!this.filters.status || item.status.includes(this.filters.status)) &&
                   (!this.filters.tipo || item.tipo.includes(this.filters.tipo)) &&
                   (!this.filters.projeto || item.projeto.toLowerCase().includes(this.filters.projeto.toLowerCase()));
        });
        this.sortData();
        this.renderCards();
    }
    sortData() {
        this.filteredData.sort((a, b) => {
            const statusA = a.status.toUpperCase();
            const statusB = b.status.toUpperCase();
            const isAConcluido = statusA.includes('CONTRATADO') || statusA.includes('RENOVADO') || statusA.includes('CONCLUÍDO');
            const isBConcluido = statusB.includes('CONTRATADO') || statusB.includes('RENOVADO') || statusB.includes('CONCLUÍDO');

            if (isAConcluido && !isBConcluido) {
                return 1; // Mover A para o final
            }
            if (!isAConcluido && isBConcluido) {
                return -1; // Mover B para o final
            }

            const dateA = a.contratarAteDate;
            const dateB = b.contratarAteDate;

            if (!dateA && !dateB) return 0;
            if (!dateA) return 1; 
            if (!dateB) return -1;

            // Ordenar por data mais antiga primeiro (ascendente)
            return dateA - dateB;
        });
    }
    
    clearFilters() {
        this.filters = { area: '', status: '', tipo: '', projeto: '' };
        
        document.getElementById('mobile-filter-area').value = '';
        document.getElementById('mobile-filter-status').value = '';
        document.getElementById('mobile-filter-tipo').value = '';
        document.getElementById('mobile-filter-projeto').value = '';
        
        this.filteredData = [...this.currentData];
        this.renderCards();
    }
    
    renderCards() {
        const container = document.getElementById('mobile-cards-container');
        if (!container) return;
        
        if (this.filteredData.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-search fs-1 text-muted"></i>
                    <p class="mt-3 text-muted">Nenhum projeto encontrado com os filtros aplicados.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.filteredData.map(item => this.createCard(item)).join('');
    }
      createCard(item) {
        const statusClass = this.getStatusClass(item.status);
        const statusHighlightClass = `${statusClass}-highlight`;
        const areaClass = this.getAreaClass(item.area);
        const valorFormatado = MobileUtils ? MobileUtils.formatCurrency(item.valorPca) : item.valorPca;
        // Nome completo do projeto, sem truncar
        let statusText = item.status;
        if (item.status.includes('💣')) {
            statusText = statusText.replace('💣', '<span class="emoji-bomba">💣</span>');
        }
        if (item.status.includes('⏳')) {
            statusText = statusText.replace(/⏳/g, '<span class="emoji-hourglass">⏳</span>');
        }
        if (item.status.includes('❗')) {
            statusText = statusText.replace(/❗/g, '<span class="emoji-exclamation">❗</span>');
        }
        return `
            <div class="project-card ${statusClass}" data-project-id="${item.id}">
                <div class="card-header">
                    <span class="card-id">${item.idPca}</span>
                    <h6 class="card-title" title="${item.projeto}">${item.projeto}</h6>
                </div>
                <div class="card-content">
                    <div class="card-row">
                        <span class="card-area ${areaClass}">${item.area}</span>
                        <span class="card-value">${valorFormatado}</span>
                    </div>
                    <div class="card-status-text ${statusHighlightClass}">
                        ${statusText}
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn-details" onclick="MobileUtils && MobileUtils.hapticFeedback('light')">
                        <i class="bi bi-eye me-1"></i>Detalhes
                    </button>
                </div>
            </div>
        `;
    }
    
    getStatusClass(status) {
        // Mapeamento baseado no StatusClasses.js
        // Retorna a classe base, ex: 'status-autuacao-atrasada'
        // A variação '-highlight' será usada para o texto do status
        // e a classe base para o fundo do card.
        const statusMap = {
            'AUTUAÇÃO ATRASADA 💣': 'status-autuacao-atrasada',
            'EM RENOVAÇÃO 🔄': 'status-em-renovacao',
            'CANCELADO ❌': 'status-cancelado',
            'EM CONTRATAÇÃO 🤝': 'status-em-contratacao',
            'AGUARDANDO ETP ⏳': 'status-aguardando-etp',
            'AGUARDANDO DFD ⏳': 'status-aguardando-dfd',
            'A INICIAR ⏰': 'status-a-iniciar',
            'RENOVADO ✅': 'status-renovado',
            'CONTRATADO ✅': 'status-contratado',
            'AGUR. DEFIN. DO GESTOR ⏳': 'status-aguardando-definicao',
            'ETP ATRASADO❗': 'status-etp-atrasado',
            'DFD ATRASADO❗': 'status-dfd-atrasado',
            'CONTRATAÇÃO ATRASADA ⚠️': 'status-contratacao-atrasada',
            'ELABORANDO TR📝': 'status-elaborando-tr',
            'ANÁLISE DE VIABILIDADE 📝': 'status-analise-viabilidade',
            'REVISÃO PCA 🚧': 'status-revisao-pca'
        };
        
        return statusMap[status] || 'status-default';
    }
    
    getAreaClass(area) {
        // Mapeamento de nomes de áreas para classes CSS
        // Mantendo consistência com AreasClasses.js e Areas.css
        const areaMap = {
            'STI 👩‍💼': 'area-sti',
            'OPERAÇÕES 🗄️': 'area-operacoes',
            'DEV 👨‍💻': 'area-dev',
            'ANALYTICS 📊': 'area-analytics',
            'GOVERNANÇA 🌐': 'area-governanca',
        };

        // Procurar por correspondência exata primeiro (incluindo emoji)
        if (areaMap[area]) {
            return areaMap[area];
        }

        // Fallback para correspondência parcial (sem emoji ou variações)
        const areaLower = area.toLowerCase();
        if (areaLower.includes('sti')) return 'area-sti';
        if (areaLower.includes('operações') || areaLower.includes('operacoes')) return 'area-operacoes';
        if (areaLower.includes('dev')) return 'area-dev';
        if (areaLower.includes('analytics')) return 'area-analytics';
        if (areaLower.includes('governança') || areaLower.includes('governanca')) return 'area-governanca';
        
        return 'area-geral'; // Classe padrão caso nenhuma corresponda
    }
    
    toggleFilters() {
        const content = document.getElementById('mobile-filters-content');
        const toggle = document.querySelector('#mobile-filters-toggle i');
        
        if (content.classList.contains('show')) {
            content.classList.remove('show');
            toggle.className = 'bi bi-chevron-down';
        } else {
            content.classList.add('show');
            toggle.className = 'bi bi-chevron-up';
        }
    }
    
    showDetails(projectId) {
        const project = this.filteredData.find(item => item.id == projectId);
        if (!project) return;
        
        const modal = document.getElementById('details-modal');
        const body = document.getElementById('details-modal-body');
        
        body.innerHTML = `
            <div class="detail-item">
                <span class="detail-label">ID PCA:</span>
                <span class="detail-value">${project.idPca}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Área:</span>
                <span class="detail-value">${project.area}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Tipo:</span>
                <span class="detail-value">${project.tipo}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Projeto de Aquisição:</span>
                <span class="detail-value">${project.projeto}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Acompanhamento:</span>
                <span class="detail-value">${project.acompanhamento}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Status do Processo:</span>
                <span class="detail-value">${project.status}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Contratar Até:</span>
                <span class="detail-value">${project.contratarAte}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Valor PCA:</span>
                <span class="detail-value">${project.valorPca}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Orçamento:</span>
                <span class="detail-value">${project.orcamento}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Processo:</span>
                <span class="detail-value">${project.processo}</span>
            </div>
        `;
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    hideDetails() {
        const modal = document.getElementById('details-modal');
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.mobileCardsManager = new MobileCardsManager();
});

console.log('MobileCards.js carregado');
