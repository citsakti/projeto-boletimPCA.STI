/**
 * MobileCardsRenderer.js - Renderização de cards para visualização mobile
 * 
 * Este módulo é responsável por:
 * - Criar HTML dos cards
 * - Renderizar lista de cards
 * - Formatar dados para exibição
 * - Criar estrutura de filtros mobile
 */

class MobileCardsRenderer {
    /**
     * Renderiza a lista de cards no container
     * @param {Array} data - Dados dos projetos
     * @param {string} containerId - ID do container de cards
     */
    static renderCards(data, containerId = 'mobile-cards-container') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (data.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-search fs-1 text-muted"></i>
                    <p class="mt-3 text-muted">Nenhum projeto encontrado com os filtros aplicados.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = data.map(item => this.createCard(item)).join('');
    }

    /**
     * Cria o HTML de um card individual
     * @param {Object} item - Dados do projeto
     * @returns {string} - HTML do card
     */
    static createCard(item) {
        const statusClass = window.MobileCardsStyles.getStatusClass(item.status);
        const statusHighlightClass = `${statusClass}-highlight`;
        const areaClass = window.MobileCardsStyles.getAreaClass(item.area);
        const valorFormatado = window.MobileUtils ? window.MobileUtils.formatCurrency(item.valorPca) : item.valorPca;
        
        // Processar texto do status com formatação de emojis
        const statusText = window.MobileCardsStyles.formatStatusText(item.status);
        
        // Preparar informações de acompanhamento
        const acompanhamentoInfo = this.prepareAcompanhamentoInfo(item);
        
        // Preparar atributos de tooltip de status
        const statusTooltipInfo = this.prepareStatusTooltipInfo(item);
        
        return `
            <div class="project-card ${statusClass}${statusTooltipInfo.class}" data-project-id="${item.id}" ${acompanhamentoInfo.tooltipData} ${statusTooltipInfo.data}>
                <div class="card-header">
                    <span class="card-id">${item.idPca}</span>
                    <h6 class="card-title" title="${item.projeto}">${item.projeto}${acompanhamentoInfo.emoji}</h6>
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
                    <div class="card-status-text ${statusHighlightClass}${statusTooltipInfo.class}" ${statusTooltipInfo.data}>
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

    /**
     * Prepara informações de acompanhamento para o card
     * @param {Object} item - Dados do projeto
     * @returns {Object} - Objeto com emoji e dados de tooltip
     */
    static prepareAcompanhamentoInfo(item) {
        let emojiHtml = '';
        let tooltipData = '';
        
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
            
            emojiHtml = ' <span class="acompanhamento-emoji" title="Projeto com acompanhamento recente">📩</span>';
            tooltipData = `data-acompanhamento-tooltip="${dataFormatada}: ${item.acompanhamentoData.detalhes.replace(/"/g, '&quot;')}"`;
        }
        
        return {
            emoji: emojiHtml,
            tooltipData: tooltipData
        };
    }

    /**
     * Prepara informações de tooltip de status para o card
     * @param {Object} item - Dados do projeto
     * @returns {Object} - Objeto com classe e dados de tooltip
     */
    static prepareStatusTooltipInfo(item) {
        let tooltipClass = '';
        let tooltipData = '';
        
        if (item.hasStatusTooltip) {
            tooltipClass = ' has-status-tooltip';
            tooltipData = `data-status-tooltip="${item.statusTooltipText.replace(/"/g, '&quot;')}"`;
        }
        
        return {
            class: tooltipClass,
            data: tooltipData
        };
    }

    /**
     * Cria o HTML dos detalhes expandidos do card
     * @param {Object} project - Dados do projeto
     * @returns {string} - HTML dos detalhes
     */
    static createDetailsHTML(project) {
        const orcamentoClass = window.MobileCardsStyles.getOrcamentoClass(project.orcamento);
        
        // Preparar informações de acompanhamento para os detalhes
        const acompanhamentoHtml = this.createAcompanhamentoDetailsHTML(project);
        
        return `
            <div class="detail-item">
                <span class="detail-label">Tipo:</span>
                <span class="detail-value">${project.tipo}</span>
            </div>
            ${acompanhamentoHtml}
            <div class="detail-item">
                <span class="detail-label">Orçamento:</span>
                <span class="detail-value ${orcamentoClass}">${project.orcamento}</span>
            </div>            <div class="detail-item">
                <span class="detail-label">Processo:</span>
                <span class="detail-value">
                    ${project.processo}
                    ${project.processo && project.processo.trim() !== '' && project.processo !== 'N/A' ? 
                        ' <span class="processo-link-icon mobile-processo-icon" title="Clique para consultar processo no TCE e copiar número" data-processo="' + project.processo + '">🔗</span>' : 
                        ''
                    }
                </span>
            </div>
        `;
    }

    /**
     * Cria o HTML específico para acompanhamento nos detalhes
     * @param {Object} project - Dados do projeto
     * @returns {string} - HTML do acompanhamento
     */
    static createAcompanhamentoDetailsHTML(project) {
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
            
            return `
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
            return `
                <div class="detail-item">
                    <span class="detail-label">Acompanhamento:</span>
                    <span class="detail-value">${project.acompanhamento || 'Nenhum acompanhamento recente'}</span>
                </div>
            `;
        }
    }

    /**
     * Cria a estrutura HTML dos filtros mobile
     * @returns {string} - HTML dos filtros
     */
    static createFiltersStructure() {
        return `
            <div class="mobile-filters-header card-header bg-primary text-white d-flex justify-content-between align-items-center py-2" id="mobile-filters-toggle">
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
    }
}

// Exportar para uso global
window.MobileCardsRenderer = MobileCardsRenderer;

console.log('MobileCardsRenderer.js carregado');
