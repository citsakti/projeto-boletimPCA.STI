/**
 * MobileCards.js - Gerenciamento de cards        filtersContainer.innerHTML = `
            <div class="mobile-filters-header card-header text-white d-flex justify-content-between align-items-center py-2" id="mobile-filters-toggle">
                <div class="d-flex align-items-center">
                    <i class="bi bi-funnel-fill me-2"></i>
                    <span class="fw-semibold">Filtros</span>
                    <span class="badge bg-light text-primary ms-2" id="active-filters-count">0</span>
                </div>
                <i class="bi bi-chevron-down transition-transform"></i>
            </div>`ara o Boletim PCA 2025
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
    }    init() {
        this.createMobileStructure();
        this.bindEvents();
        this.checkMobileView();
        this.setupAcompanhamentoTooltips();
        
        // Escutar evento de dados carregados
        document.addEventListener('tabela-carregada', () => {
            this.loadTableData();
        });
        
        // Escutar redimensionamento da tela
        window.addEventListener('resize', () => {
            this.checkMobileView();
        });
        
        // Escutar filtros aplicados pelo painel de resumos
        document.addEventListener('painel-filter-applied', (event) => {
            this.syncWithPainelFilter(event.detail);
        });
        
        // Escutar atualizações do sistema de acompanhamento
        document.addEventListener('acompanhamento-updated', () => {
            if (this.isMobileView) {
                console.log('Sistema de acompanhamento atualizado, recarregando dados dos cards...');
                this.loadTableData();
            }
        });
    }
    
    createMobileStructure() {
        const detalhesSection = document.getElementById('detalhes');
        if (!detalhesSection) return;
          // Criar container de filtros móveis
        const filtersContainer = document.createElement('div');
        filtersContainer.className = 'mobile-filters-container card shadow-sm mb-3';
        filtersContainer.innerHTML = `            <div class="mobile-filters-header card-header bg-primary text-white d-flex justify-content-between align-items-center py-2" id="mobile-filters-toggle">
                <div class="d-flex align-items-center">
                    <i class="bi bi-funnel-fill me-2"></i>
                    <span class="fw-semibold">Filtros</span>
                    <span class="badge bg-light text-primary ms-2" id="active-filters-count">0</span>
                </div>
                <i class="bi bi-sliders transition-transform"></i>
            </div>
            <div class="mobile-filters-content card-body collapse" id="mobile-filters-content">
                <div class="row g-3">
                    <div class="col-12">
                        <label for="mobile-filter-area" class="form-label text-muted fw-semibold">
                            <i class="bi bi-building me-1"></i>Área
                        </label>
                        <select id="mobile-filter-area" class="form-select form-select-sm">
                            <option value="">Todas as áreas</option>
                        </select>
                    </div>
                    <div class="col-12">
                        <label for="mobile-filter-status" class="form-label text-muted fw-semibold">
                            <i class="bi bi-clock-history me-1"></i>Status
                        </label>
                        <select id="mobile-filter-status" class="form-select form-select-sm">
                            <option value="">Todos os status</option>
                        </select>
                    </div>
                    <div class="col-12">
                        <label for="mobile-filter-tipo" class="form-label text-muted fw-semibold">
                            <i class="bi bi-tag me-1"></i>Tipo
                        </label>
                        <select id="mobile-filter-tipo" class="form-select form-select-sm">
                            <option value="">Todos os tipos</option>
                        </select>
                    </div>
                    <div class="col-12">
                        <label for="mobile-filter-projeto" class="form-label text-muted fw-semibold">
                            <i class="bi bi-folder me-1"></i>Projeto
                        </label>
                        <select id="mobile-filter-projeto" class="form-select form-select-sm">
                            <option value="">Todos os projetos</option>
                        </select>
                    </div>
                </div>
                <div class="d-grid mt-3">
                    <button class="btn btn-outline-danger btn-sm" id="mobile-clear-filters">
                        <i class="bi bi-x-circle me-1"></i>Limpar Filtros
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
            }            if (e.target.closest('.btn-details')) {
                const cardId = e.target.closest('.project-card').dataset.projectId;
                this.toggleDetails(cardId);
            }
        });
          // Filtros
        document.addEventListener('change', (e) => {
            if (e.target.id.startsWith('mobile-filter-')) {
                const filterType = e.target.id.replace('mobile-filter-', '');
                this.filters[filterType] = e.target.value;
                this.applyFilters();
                
                // Se foi o filtro de status, sincroniza com o painel de resumos
                if (filterType === 'status') {
                    this.syncStatusWithPainel(e.target.value);
                }
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
      /**
     * Adiciona informações de acompanhamento aos dados do projeto
     * @param {Object} item - Item de projeto
     * @returns {Object} - Item com informações de acompanhamento adicionadas
     */
    addAcompanhamentoInfo(item) {
        // Verificar se o sistema de acompanhamento está disponível
        if (!window.AcompanhamentoDeProjetos) {
            return item;
        }
        
        // Verificar se o projeto tem acompanhamento bloqueado por status
        if (window.AcompanhamentoDeProjetos.isAcompanhamentoBloqueadoPorStatus(item.status)) {
            item.hasAcompanhamento = false;
            item.acompanhamentoData = null;
            return item;
        }
        
        // Buscar dados de acompanhamento para o projeto
        const acompanhamento = window.AcompanhamentoDeProjetos.getAcompanhamentoProjeto(item.projeto);
        
        if (acompanhamento) {
            item.hasAcompanhamento = true;
            item.acompanhamentoData = acompanhamento;
        } else {
            item.hasAcompanhamento = false;
            item.acompanhamentoData = null;
        }
        
        return item;
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
            let item = {
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
            
            // Adicionar informações de acompanhamento
            item = this.addAcompanhamentoInfo(item);
            
            return item;
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
        });    }
    
    syncWithPainelFilter(detail) {
        if (!this.isMobileView) return;
        
        if (detail && detail.status) {
            if (detail.status === 'TODOS') {
                this.filters.status = '';
                const mobileSelect = document.getElementById('mobile-filter-status');
                if (mobileSelect) {
                    mobileSelect.value = '';
                }
            } else {
                this.filters.status = detail.status;
                const mobileSelect = document.getElementById('mobile-filter-status');
                if (mobileSelect) {
                    mobileSelect.value = detail.status;
                }
            }
            this.applyFilters();
        }
    }
    
    applyFilters() {
        this.filteredData = this.currentData.filter(item => {
            return (!this.filters.area || item.area.includes(this.filters.area)) &&
                   (!this.filters.status || item.status.includes(this.filters.status)) &&
                   (!this.filters.tipo || item.tipo.includes(this.filters.tipo)) &&
                   (!this.filters.projeto || item.projeto.toLowerCase().includes(this.filters.projeto.toLowerCase()));
        });
        this.sortData();
        this.updateActiveFiltersCount();
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
        });    }
    
    syncStatusWithPainel(statusValue) {
        if (!this.isMobileView) return;
        
        // Sincroniza com o painel de resumos atualizando o destaque
        const statusElements = document.querySelectorAll('.status-option');
        statusElements.forEach(item => {
            item.style.backgroundColor = '';
            item.style.fontWeight = '';
        });
        
        if (statusValue) {
            // Encontra e destaca o status selecionado no painel
            const targetStatus = statusValue === '' ? 'TODOS' : statusValue;
            const activeElement = document.querySelector(`.status-option[data-status="${targetStatus}"]`);
            if (activeElement) {
                activeElement.style.backgroundColor = '#fa8c16';
                activeElement.style.fontWeight = 'bold';
            }
            
            // Sincroniza com os filtros Google Sheets
            if (typeof aplicarFiltroStatusProcesso === 'function') {
                aplicarFiltroStatusProcesso(targetStatus);
            }
        } else {
            // Se não há filtro, destaca "TODOS"
            const todosElement = document.querySelector('.status-option[data-status="TODOS"]');
            if (todosElement) {
                todosElement.style.backgroundColor = '#fa8c16';
                todosElement.style.fontWeight = 'bold';
            }
            
            // Remove filtros dos Google Sheets
            if (typeof resetPainelFilterStatus === 'function') {
                resetPainelFilterStatus();
            }
        }
    }    clearFilters() {
        this.filters = { area: '', status: '', tipo: '', projeto: '' };
        
        document.getElementById('mobile-filter-area').value = '';
        document.getElementById('mobile-filter-status').value = '';
        document.getElementById('mobile-filter-tipo').value = '';
        document.getElementById('mobile-filter-projeto').value = '';
        
        // Sincroniza com o painel de resumos - reseta para "TODOS"
        this.syncStatusWithPainel('');
        
        this.filteredData = [...this.currentData];
        // Importante: chama sortData() para manter a ordenação correta
        this.sortData();
        this.updateActiveFiltersCount();
        this.renderCards();
    }
    
    updateActiveFiltersCount() {
        const activeCount = Object.values(this.filters).filter(value => value !== '').length;
        const badge = document.getElementById('active-filters-count');
        
        if (badge) {
            badge.textContent = activeCount;
            badge.style.display = activeCount > 0 ? 'inline-block' : 'none';
        }
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
    }    createCard(item) {
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
        
        // Preparar informações de acompanhamento
        let acompanhamentoEmojiHtml = '';
        let acompanhamentoTooltipData = '';
        
        if (item.hasAcompanhamento && item.acompanhamentoData) {
            // Formatar a data para exibição
            let dataFormatada = item.acompanhamentoData.data;
            let diaDaSemana = "";
            
            // Usar regex para extrair apenas o formato DD/MM/AAAA
            const regexData = /(\d{2})\/(\d{2})\/(\d{4})/;
            const match = item.acompanhamentoData.data.match(regexData);
            
            if (match && window.AcompanhamentoDeProjetos) {
                try {
                    const dataObj = window.AcompanhamentoDeProjetos.parseDataBrasileira(item.acompanhamentoData.data);
                    if (!isNaN(dataObj.getTime())) {
                        const diasDaSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
                        diaDaSemana = diasDaSemana[dataObj.getDay()];
                        dataFormatada = `${diaDaSemana}, ${match[0]}`;
                    }
                } catch (e) {
                    console.warn("Erro ao formatar data de acompanhamento:", e);
                }
            }
            
            acompanhamentoEmojiHtml = ' <span class="acompanhamento-emoji" title="Projeto com acompanhamento recente">📩</span>';
            acompanhamentoTooltipData = `data-acompanhamento-tooltip="${dataFormatada}: ${item.acompanhamentoData.detalhes.replace(/"/g, '&quot;')}"`;
        }
        
        return `
            <div class="project-card ${statusClass}" data-project-id="${item.id}" ${acompanhamentoTooltipData}>
                <div class="card-header">
                    <span class="card-id">${item.idPca}</span>
                    <h6 class="card-title" title="${item.projeto}">${item.projeto}${acompanhamentoEmojiHtml}</h6>
                </div>
                <div class="card-content">
                    <div class="card-row">
                        <div class="card-left-section">
                            <span class="card-area ${areaClass}">${item.area}</span>
                            <span class="card-value">${valorFormatado}</span>
                        </div>
                        <div class="card-right-section">
                            <span class="card-date">${item.contratarAte || 'Data não informada'}</span>
                        </div>
                    </div>
                    <div class="card-status-text ${statusHighlightClass}">
                        ${statusText}
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn-details" onclick="MobileUtils && MobileUtils.hapticFeedback('light')">
                        <i class="fas fa-chevron-down"></i> Detalhar
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

    getOrcamentoClass(orcamento) {
        // Mapeamento de tipos de orçamento para classes CSS
        // Mantendo consistência com OrcamentoClasses.js e Orcamento.css
        const orcamentoMap = {
            'CUSTEIO 💳': 'orcamento-custeio-highlight',
            'INVESTIMENTO 💵': 'orcamento-investimento-highlight',
        };

        // Procurar por correspondência exata primeiro (incluindo emoji)
        if (orcamentoMap[orcamento]) {
            return orcamentoMap[orcamento];
        }

        // Fallback para correspondência parcial (sem emoji ou variações)
        const orcamentoLower = orcamento.toLowerCase();
        if (orcamentoLower.includes('custeio')) return 'orcamento-custeio-highlight';
        if (orcamentoLower.includes('investimento')) return 'orcamento-investimento-highlight';
        
        return ''; // Sem classe especial se não corresponder
    }

    toggleFilters() {
        const content = document.getElementById('mobile-filters-content');
        const chevron = document.querySelector('#mobile-filters-toggle .bi-sliders, #mobile-filters-toggle .bi-chevron-up');
        
        if (!content) return;
        
        // Verificar se Bootstrap está disponível
        if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
            // Usar Bootstrap collapse para animação suave
            let bsCollapse = bootstrap.Collapse.getOrCreateInstance(content, {
                toggle: false
            });
              if (content.classList.contains('show')) {
                bsCollapse.hide();
                if (chevron) chevron.className = 'bi bi-sliders transition-transform';
            } else {
                bsCollapse.show();
                if (chevron) chevron.className = 'bi bi-chevron-up transition-transform';
            }
        } else {            // Fallback sem Bootstrap
            if (content.classList.contains('show')) {
                content.classList.remove('show');
                if (chevron) chevron.className = 'bi bi-sliders transition-transform';
            } else {
                content.classList.add('show');
                if (chevron) chevron.className = 'bi bi-chevron-up transition-transform';
            }
        }
    }
      toggleDetails(projectId) {
        const projectCard = document.querySelector(`.project-card[data-project-id="${projectId}"]`);
        if (!projectCard) return;
        
        const existingDetails = projectCard.querySelector('.card-details-expanded');
        const detailsButton = projectCard.querySelector('.btn-details');
        
        // Se os detalhes já estão expandidos, recolher
        if (existingDetails) {
            this.collapseDetails(projectCard);
            return;
        }
        
        // Recolher qualquer outro card expandido
        this.collapseAllDetails();
        
        // Expandir este card
        this.expandDetails(projectCard, projectId);
    }    expandDetails(projectCard, projectId) {
        const project = this.filteredData.find(item => item.id == projectId);
        if (!project) return;
        
        const detailsButton = projectCard.querySelector('.btn-details');
        const orcamentoClass = this.getOrcamentoClass(project.orcamento);
        
        // Preparar informações de acompanhamento para os detalhes
        let acompanhamentoHtml = '';
        if (project.hasAcompanhamento && project.acompanhamentoData) {
            // Formatar a data para exibição
            let dataFormatada = project.acompanhamentoData.data;
            let infoAdicional = '';
            
            // Usar regex para extrair apenas o formato DD/MM/AAAA
            const regexData = /(\d{2})\/(\d{2})\/(\d{4})/;
            const match = project.acompanhamentoData.data.match(regexData);
            
            if (match && window.AcompanhamentoDeProjetos) {
                try {
                    const dataObj = window.AcompanhamentoDeProjetos.parseDataBrasileira(project.acompanhamentoData.data);
                    if (!isNaN(dataObj.getTime())) {
                        const diasDaSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
                        const diaDaSemana = diasDaSemana[dataObj.getDay()];
                        dataFormatada = `${diaDaSemana}, ${match[0]}`;
                        
                        // Adicionar informação sobre quantos dias atrás
                        if (project.acompanhamentoData.diasAtras === 0) {
                            infoAdicional = ' (hoje)';
                        } else if (project.acompanhamentoData.diasAtras === 1) {
                            infoAdicional = ' (ontem)';
                        } else {
                            infoAdicional = ` (${project.acompanhamentoData.diasAtras} dias atrás)`;
                        }
                    }
                } catch (e) {
                    console.warn("Erro ao formatar data de acompanhamento:", e);
                }
            }
            
            acompanhamentoHtml = `
                <div class="detail-item acompanhamento-detail">
                    <span class="detail-label">📩 Último Acompanhamento:</span>
                    <div class="detail-value acompanhamento-info">
                        <div class="acompanhamento-data">${dataFormatada}${infoAdicional}</div>
                        <div class="acompanhamento-detalhes">${project.acompanhamentoData.detalhes}</div>
                    </div>
                </div>
            `;
        } else {
            // Mostrar informação básica de acompanhamento da tabela
            acompanhamentoHtml = `
                <div class="detail-item">
                    <span class="detail-label">Acompanhamento:</span>
                    <span class="detail-value">${project.acompanhamento || 'Nenhum acompanhamento recente'}</span>
                </div>
            `;
        }
        
        // Criar o container de detalhes
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'card-details-expanded';
        
        detailsContainer.innerHTML = `
            <div class="detail-item">
                <span class="detail-label">Tipo:</span>
                <span class="detail-value">${project.tipo}</span>
            </div>
            ${acompanhamentoHtml}
            <div class="detail-item">
                <span class="detail-label">Orçamento:</span>
                <span class="detail-value ${orcamentoClass}">${project.orcamento}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Processo:</span>
                <span class="detail-value">${project.processo}</span>
            </div>
        `;
        
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
    
    collapseDetails(projectCard) {
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
    
    collapseAllDetails() {
        const expandedCards = document.querySelectorAll('.project-card.expanded');
        expandedCards.forEach(card => {
            this.collapseDetails(card);
        });
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
        
        // Auto-hide após 5 segundos
        setTimeout(() => {
            this.hideAcompanhamentoTooltip();
        }, 5000);
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
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.mobileCardsManager = new MobileCardsManager();
});

console.log('MobileCards.js carregado');
