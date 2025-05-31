/**
 * AnalyticsRender.js - Funções para renderização das seções analíticas do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Renderizar as diferentes seções da página de análise
 *  - Criar tabelas e visualizações para apresentar os dados
 *  - Formatar valores e aplicar estilos visuais para destacar informações importantes
 *  - Integrar funcionalidades de expansão/contração de detalhes
 * 
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Funções de Renderização de Seções:
 *   - renderGeneralSection(): Renderiza a seção 1 com dados gerais (status, tipos, áreas, valores)
 *   - renderSituacionalSection(): Renderiza a seção 2 com análise situacional dos processos
 *   - renderProdutividadeSection(): Renderiza a seção 3 com métricas de produtividade
 *   - renderValoresPorAreaETipo(): Renderiza tabela de valores por área e tipo de orçamento
 *   - renderAreaProjectsHtml(): Gera HTML para os boxes de área na seção geral
 * 
 * # Funções de Renderização de Detalhes:
 *   - renderAreaValorDetails(): Gera tabelas detalhadas para valores por área/tipo
 *   - renderProjectDetails(): Gera tabelas de projetos por categoria (de AnalyticsDetails.js)
 *   - renderSituacionalDetails(): Gera tabelas de projetos por situação (de AnalyticsDetails.js)
 *   - renderAreaDetails(): Gera tabelas de projetos por área (de AnalyticsDetails.js)
 * 
 * # Funções de Formatação:
 *   - formatAreaWithClasses(): Aplica estilos CSS específicos por área
 *   - formatStatusWithClasses(): Aplica estilos CSS específicos por status
 *   - formatCurrency(): Formata valores numéricos para moeda (definido em outro arquivo)
 * 
 * # Funções de Event Listeners:
 *   - addAreaValorExpandListeners(): Configura eventos para botões de expandir/contrair na tabela de valores
 * 
 * # Fluxo de Execução:
 *   1. As funções de renderização principais são chamadas por Analytics.js
 *   2. Tabelas e visualizações são geradas com HTML estruturado
 *   3. Funções de formatação aplicam estilos específicos aos elementos
 *   4. Event listeners são configurados para tornar os elementos interativos
 * 
 * # Dependências:
 *   - analyticData: Objeto global com dados processados (de Analytics.js)
 *   - renderProjectDetails, renderSituacionalDetails, renderAreaDetails: De AnalyticsDetails.js
 *   - renderProdutividadeDetalhada: De AnalyticsDetails.js (função opcional)
 *   - formatCurrency: Função global para formatação de valores monetários
 */

/**
 * Função para renderizar a seção de dados gerais
 */
function renderGeneralSection() {
    // Calcular o total de todos os status
    const totalStatus = Object.values(analyticData.statusCounts).reduce((sum, num) => sum + num, 0);

    // Montar HTML para a seção Geral usando padrão Bootstrap
    let html = `
        <div class="analytics-section">
            <div class="card">
                <div class="card-header">
                    <h2>1. Dados Gerais</h2>
                </div>
                <div class="card-body">                    <div class="analytics-subsection">
                        <h3>1.1 Status dos Processos</h3>
                        <div class="status-grid">
                            <div class="status-box">
                                <div class="status-name">TODOS</div>
                                <div class="status-count">${totalStatus}</div>
                            </div>
                            ${Object.entries(analyticData.statusCounts).map(([status, count]) => `
                                <div class="status-box expandable-status-box" data-status="${status}">
                                    <div class="status-name">${status}</div>
                                    <div class="status-count">${count}</div>
                                    <button class="btn btn-outline-primary btn-sm status-expand-btn" data-status="${status}">Detalhar</button>
                                </div>
                            `).join('')}
                        </div>
                        ${Object.entries(analyticData.statusCounts).map(([status, count]) => `
                            <div class="status-details-row" id="status-details-${status.replace(/\s+/g, '-').toLowerCase()}" style="display:none;">
                                <div class="card">
                                    <div class="card-body">
                                        <div class="project-details">
                                            ${renderStatusDetails(status)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>                    <div class="analytics-subsection">
                        <h3>1.2 Tipo de Contratação</h3>
                        <div class="tipo-grid">
                            <div class="tipo-box expandable-tipo-box" data-tipo="🛒 Aquisição">
                                <div class="tipo-name">🛒 Aquisição</div>
                                <div class="tipo-count">${analyticData.tipoCounts["🛒 Aquisição"]}</div>
                                <button class="btn btn-outline-primary btn-sm tipo-expand-btn" data-tipo="🛒 Aquisição">Detalhar</button>
                            </div>
                            <div class="tipo-box expandable-tipo-box" data-tipo="🔄 Renovação">
                                <div class="tipo-name">🔄 Renovação</div>
                                <div class="tipo-count">${analyticData.tipoCounts["🔄 Renovação"]}</div>
                                <button class="btn btn-outline-primary btn-sm tipo-expand-btn" data-tipo="🔄 Renovação">Detalhar</button>
                            </div>
                        </div>
                        <div class="tipo-details-row" id="tipo-details-aquisicao" style="display:none;">
                            <div class="card">
                                <div class="card-body">
                                    <div class="project-details">
                                        ${renderTipoDetails("🛒 Aquisição")}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="tipo-details-row" id="tipo-details-renovacao" style="display:none;">
                            <div class="card">
                                <div class="card-body">
                                    <div class="project-details">
                                        ${renderTipoDetails("🔄 Renovação")}
                                    </div>
                                </div>
                            </div>                        </div>
                    </div>
                      <div class="analytics-subsection">
                        <h3>1.3 Projetos por Área</h3>
                        <div class="area-projects-grid">
                            ${renderAreaProjectsHtml()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;    const container = document.getElementById('analytics-dashboard');
    if (container) {
        container.innerHTML = html;
    }
}

/**
 * Função para renderizar a seção de orçamento
 */
function renderOrcamentoSection() {
    let html = `
        <div class="analytics-section">
            <div class="card">
                <div class="card-header">
                    <h2>2. Orçamento</h2>
                </div>
                <div class="card-body">
                    <div class="analytics-subsection">
                        <h3>2.1 Valores por Orçamento e Tipo</h3>
                        <div class="valor-table">
                            <div class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>Categoria</th>
                                            <th>Valor Total</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr class="expandable-row" data-category="custeio">
                                            <td>Total CUSTEIO 💳</td>
                                            <td>R$ ${formatCurrency(analyticData.valorTotal.custeio)}</td>
                                            <td><button class="btn btn-outline-primary btn-sm expand-btn" data-category="custeio">Detalhar</button></td>
                                        </tr>
                                        <tr class="details-row" id="details-custeio" style="display:none;">
                                            <td colspan="3">
                                                <div class="card">
                                                    <div class="card-body">
                                                        <div class="project-details">
                                                            ${renderProjectDetails('custeio')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr class="expandable-row" data-category="investimento">
                                            <td>Total INVESTIMENTO 💵</td>
                                            <td>R$ ${formatCurrency(analyticData.valorTotal.investimento)}</td>
                                            <td><button class="btn btn-outline-primary btn-sm expand-btn" data-category="investimento">Detalhar</button></td>
                                        </tr>
                                        <tr class="details-row" id="details-investimento" style="display:none;">
                                            <td colspan="3">
                                                <div class="card">
                                                    <div class="card-body">
                                                        <div class="project-details">
                                                            ${renderProjectDetails('investimento')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr class="table-warning">
                                            <td><strong>Total GERAL (CUSTEIO + INVESTIMENTO)</strong></td>
                                            <td><strong>R$ ${formatCurrency(analyticData.valorTotal.custeio + analyticData.valorTotal.investimento)}</strong></td>
                                            <td></td>
                                        </tr>
                                        <tr class="expandable-row" data-category="custoAquisicao">
                                            <td>Total 🛒 Aquisição no CUSTEIO 💳</td>
                                            <td>R$ ${formatCurrency(analyticData.valorTotal.custoAquisicao)}</td>
                                            <td><button class="btn btn-outline-primary btn-sm expand-btn" data-category="custoAquisicao">Detalhar</button></td>
                                        </tr>
                                        <tr class="details-row" id="details-custoAquisicao" style="display:none;">
                                            <td colspan="3">
                                                <div class="card">
                                                    <div class="card-body">
                                                        <div class="project-details">
                                                            ${renderProjectDetails('custoAquisicao')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr class="expandable-row" data-category="custoRenovacao">
                                            <td>Total 🔄 Renovação no CUSTEIO 💳</td>
                                            <td>R$ ${formatCurrency(analyticData.valorTotal.custoRenovacao)}</td>
                                            <td><button class="btn btn-outline-primary btn-sm expand-btn" data-category="custoRenovacao">Detalhar</button></td>
                                        </tr>
                                        <tr class="details-row" id="details-custoRenovacao" style="display:none;">
                                            <td colspan="3">
                                                <div class="card">
                                                    <div class="card-body">
                                                        <div class="project-details">
                                                            ${renderProjectDetails('custoRenovacao')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>                                        </tr>
                                        <tr class="table-warning">
                                            <td><strong>Total GERAL no CUSTEIO (Aquisição + Renovação)</strong></td>
                                            <td><strong>R$ ${formatCurrency(analyticData.valorTotal.custoAquisicao + analyticData.valorTotal.custoRenovacao)}</strong></td>
                                            <td></td>
                                        </tr>
                                        <tr class="expandable-row" data-category="investimentoAquisicao">
                                            <td>Total 🛒 Aquisição no INVESTIMENTO 💵</td>
                                            <td>R$ ${formatCurrency(analyticData.valorTotal.investimentoAquisicao)}</td>
                                            <td><button class="btn btn-outline-primary btn-sm expand-btn" data-category="investimentoAquisicao">Detalhar</button></td>
                                        </tr>
                                        <tr class="details-row" id="details-investimentoAquisicao" style="display:none;">
                                            <td colspan="3">
                                                <div class="project-details">
                                                    ${renderProjectDetails('investimentoAquisicao')}
                                                </div>
                                            </td>
                                        </tr>
                                        <tr class="expandable-row" data-category="investimentoRenovacao">
                                            <td>Total 🔄 Renovação no INVESTIMENTO 💵</td>
                                            <td>R$ ${formatCurrency(analyticData.valorTotal.investimentoRenovacao)}</td>
                                            <td><button class="btn btn-outline-primary btn-sm expand-btn" data-category="investimentoRenovacao">Detalhar</button></td>
                                        </tr>
                                        <tr class="details-row" id="details-investimentoRenovacao" style="display:none;">
                                            <td colspan="3">
                                                <div class="project-details">
                                                    ${renderProjectDetails('investimentoRenovacao')}
                                                </div>
                                            </td>                                        </tr>
                                        <tr class="table-warning">
                                            <td><strong>Total GERAL no INVESTIMENTO (Aquisição + Renovação)</strong></td>
                                            <td><strong>R$ ${formatCurrency(analyticData.valorTotal.investimentoAquisicao + analyticData.valorTotal.investimentoRenovacao)}</strong></td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analytics-subsection">
                        <h3>2.2 Valores por Área e Tipo</h3>
                        <div class="valor-area-table">
                            ${renderValoresPorAreaETipo()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const container = document.getElementById('analytics-dashboard');
    if (container) {
        container.innerHTML += html;
    }
}

/**
 * Função para renderizar a seção situacional
 */
function renderSituacionalSection() {
    // Calcular o total como a soma das contagens das linhas exibidas na tabela
    const totalSituacional =
        analyticData.situacional.contratacaoForaSTI +
        analyticData.situacional.autuacaoAtrasada +
        analyticData.situacional.elaboracaoInterna +
        analyticData.situacional.contratacaoAtrasadaForaSTI +
        analyticData.situacional.processosConcluidos +
        analyticData.situacional.processosSuspensos +
        analyticData.situacional.processosAIniciar;

    let html = `        <div class="analytics-section">
            <div class="card">
                <div class="card-header">
                    <h2>3. Análise Situacional</h2>
                </div>
                <div class="card-body">
                    <div class="analytics-subsection">
                        <h3>3.1 Análise Interna</h3>
                        <div class="situacional-table">
                            <div class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>Categoria</th>
                                            <th style="white-space:normal; word-break:break-word;">Critério (STATUS DO PROCESSO)</th>
                                <th>Contagem</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="expandable-row" data-category="contratacaoForaSTI">
                                <td style="font-weight: bold;">Fase de Contratação Fora da STI</td>
                                <td style="white-space:normal; word-break:break-word;">
                                    ${formatStatusWithClasses('EM CONTRATAÇÃO 🤝')} ou ${formatStatusWithClasses('EM RENOVAÇÃO 🔄')}<br>(ÁREA ≠ STI)
                                </td>
                                <td>${analyticData.situacional.contratacaoForaSTI}</td>                                <td><button class="btn btn-outline-primary btn-sm situacional-expand-btn" data-category="contratacaoForaSTI">Detalhar</button></td>
                            </tr>
                            <tr class="details-row" id="situacional-details-contratacaoForaSTI" style="display:none;">
                                <td colspan="4">
                                    <div class="project-details">
                                        ${renderSituacionalDetails('contratacaoForaSTI')}
                                    </div>
                                </td>
                            </tr>
                            <tr class="expandable-row" data-category="autuacaoAtrasada">
                                <td style="font-weight: bold;">Autuação Atrasada > 90 dias</td>
                                <td style="white-space:normal; word-break:break-word;">
                                    ${formatStatusWithClasses('AUTUAÇÃO ATRASADA 💣')}
                                </td>
                                <td>${analyticData.situacional.autuacaoAtrasada}</td>
                                <td><button class="btn btn-outline-primary btn-sm situacional-expand-btn" data-category="autuacaoAtrasada">Detalhar</button></td>
                            </tr>
                            <tr class="details-row" id="situacional-details-autuacaoAtrasada" style="display:none;">
                                <td colspan="4">
                                    <div class="project-details">
                                        ${renderSituacionalDetails('autuacaoAtrasada')}
                                    </div>
                                </td>
                            </tr>
                            <tr class="expandable-row" data-category="elaboracaoInterna">
                                <td style="font-weight: bold;">Elaboração Interna de Artefatos</td>
                                <td style="white-space:normal; word-break:break-word;">
                                    <div style="margin-bottom: 4px;">${formatStatusWithClasses('AGUARDANDO DFD ⏳')}</div>
                                    <div style="margin-bottom: 4px;">${formatStatusWithClasses('AGUARDANDO ETP ⏳')}</div>
                                    <div style="margin-bottom: 4px;">${formatStatusWithClasses('ELABORANDO TR📝')}</div>
                                    <div style="margin-bottom: 4px;">${formatStatusWithClasses('ANÁLISE DE VIABILIDADE 📝')}</div>
                                    <div style="margin-bottom: 4px;">${formatStatusWithClasses('DFD ATRASADO❗')}</div>
                                    <div>${formatStatusWithClasses('ETP ATRASADO❗')}</div>
                                </td>                                <td>${analyticData.situacional.elaboracaoInterna}</td>
                                <td><button class="btn btn-outline-primary btn-sm situacional-expand-btn" data-category="elaboracaoInterna">Detalhar</button></td>
                            </tr>
                            <tr class="details-row" id="situacional-details-elaboracaoInterna" style="display:none;">
                                <td colspan="4">
                                    <div class="project-details">
                                        ${renderSituacionalDetails('elaboracaoInterna')}
                                    </div>
                                </td>
                            </tr>
                            <tr class="expandable-row" data-category="contratacaoAtrasadaForaSTI">
                                <td style="font-weight: bold;">Contratação Atrasada Fora da STI</td>
                                <td style="white-space:normal; word-break:break-word;">
                                    ${formatStatusWithClasses('CONTRATAÇÃO ATRASADA ⚠️')}<br>(ÁREA ≠ STI)
                                </td>
                                <td>${analyticData.situacional.contratacaoAtrasadaForaSTI}</td>
                                <td><button class="btn btn-outline-primary btn-sm situacional-expand-btn" data-category="contratacaoAtrasadaForaSTI">Detalhar</button></td>
                            </tr>
                            <tr class="details-row" id="situacional-details-contratacaoAtrasadaForaSTI" style="display:none;">
                                <td colspan="4">
                                    <div class="project-details">
                                        ${renderSituacionalDetails('contratacaoAtrasadaForaSTI')}
                                    </div>
                                </td>
                            </tr>
                            <tr class="expandable-row" data-category="processosConcluidos">
                                <td style="font-weight: bold;">Processos Concluídos</td>
                                <td style="white-space:normal; word-break:break-word;">
                                    ${formatStatusWithClasses('CONTRATADO ✅')} ou ${formatStatusWithClasses('RENOVADO ✅')}
                                </td>                                <td>${analyticData.situacional.processosConcluidos}</td>
                                <td><button class="btn btn-outline-primary btn-sm situacional-expand-btn" data-category="processosConcluidos">Detalhar</button></td>
                            </tr>
                            <tr class="details-row" id="situacional-details-processosConcluidos" style="display:none;">
                                <td colspan="4">
                                    <div class="project-details">
                                        ${renderSituacionalDetails('processosConcluidos')}
                                    </div>
                                </td>
                            </tr>
                            <tr class="expandable-row" data-category="processosSuspensos">
                                <td style="font-weight: bold;">Processos Suspensos</td>
                                <td style="white-space:normal; word-break:break-word;">${formatStatusWithClasses('REVISÃO PCA 🚧')}</td>
                                <td>${analyticData.situacional.processosSuspensos}</td>
                                <td><button class="btn btn-outline-primary btn-sm situacional-expand-btn" data-category="processosSuspensos">Detalhar</button></td>
                            </tr>
                            <tr class="details-row" id="situacional-details-processosSuspensos" style="display:none;">
                                <td colspan="4">
                                    <div class="project-details">
                                        ${renderSituacionalDetails('processosSuspensos')}
                                    </div>
                                </td>
                            </tr>
                            <tr class="expandable-row" data-category="processosAIniciar">
                                <td style="font-weight: bold;">Processos a Iniciar</td>
                                <td style="white-space:normal; word-break:break-word;">${formatStatusWithClasses('A INICIAR ⏰')}</td>
                                <td>${analyticData.situacional.processosAIniciar}</td>
                                <td><button class="btn btn-outline-primary btn-sm situacional-expand-btn" data-category="processosAIniciar">Detalhar</button></td>
                            </tr>
                            <tr class="details-row" id="situacional-details-processosAIniciar" style="display:none;">
                                <td colspan="4">
                                    <div class="project-details">
                                        ${renderSituacionalDetails('processosAIniciar')}
                                    </div>
                                </td>
                            </tr>
                            <tr class="total-row">
                                <td style="font-weight: bold;">TOTAL</td>
                                <td></td>
                                <td>${totalSituacional}</td>
                                <td></td>
                            </tr>                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar à página
    const container = document.getElementById('analytics-dashboard');
    if (container) {
        container.innerHTML += html;
    }
}

/**
 * Função para renderizar a seção de produtividade
 * @returns {string} HTML da seção de produtividade
 */
function renderProdutividadeSection() {
    // Aqui chamamos a implementação detalhada que está em AnalyticsDetails.js
    if (typeof renderProdutividadeDetalhada === 'function') {
        return renderProdutividadeDetalhada();
    }
    
    // Fallback caso a função não esteja disponível
    return `
    <div class="analytics-section">
        <h2>4. Produtividade Aquisições T.I.</h2>
        <p>Dados de produtividade não disponíveis.</p>
    </div>
    `;
}

/**
 * Função para renderizar a seção de valores por área e tipo
 * @returns {string} HTML da seção
 */
function renderValoresPorAreaETipo() {
    // Estrutura para armazenar valores por área e orçamento
    const valoresPorArea = {};
    
    // Inicializar a estrutura para cada área
    const areas = Object.keys(analyticData.areaCounts).sort();
    areas.forEach(area => {
        valoresPorArea[area] = {
            custeio: {
                total: 0,
                projetos: []
            },
            investimento: {
                total: 0,
                projetos: []
            },
            total: 0 // Adicionando campo para o total geral da área
        };
    });
    
    // Processar projetos de CUSTEIO por área
    analyticData.projetosPorCategoria.custeio.forEach(projeto => {
        if (valoresPorArea[projeto.area]) {
            valoresPorArea[projeto.area].custeio.total += projeto.valor;
            valoresPorArea[projeto.area].custeio.projetos.push(projeto);
            valoresPorArea[projeto.area].total += projeto.valor; // Incrementa o total da área
        }
    });
    
    // Processar projetos de INVESTIMENTO por área
    analyticData.projetosPorCategoria.investimento.forEach(projeto => {
        if (valoresPorArea[projeto.area]) {
            valoresPorArea[projeto.area].investimento.total += projeto.valor;
            valoresPorArea[projeto.area].investimento.projetos.push(projeto);
            valoresPorArea[projeto.area].total += projeto.valor; // Incrementa o total da área
        }
    });
    
    // Gerar HTML da tabela
    let html = `
        <table class="analytics-table">
            <thead>
                <tr>
                    <th>Área</th>
                    <th>CUSTEIO 💳</th>
                    <th></th>
                    <th>INVESTIMENTO 💵</th>
                    <th></th>
                    <th>TOTAL</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Gerar linhas da tabela para cada área
    areas.forEach(area => {
        const areaData = valoresPorArea[area];
        const areaId = area.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        
        // Combinando todos os projetos da área para o total
        const todosProjetos = [...areaData.custeio.projetos, ...areaData.investimento.projetos];
        
        html += `
            <tr>
                <td>${formatAreaWithClasses(area)}</td>                <td>R$ ${formatCurrency(areaData.custeio.total)}</td>
                <td><button class="btn btn-outline-primary btn-sm area-valor-expand-btn" data-area="${areaId}" data-tipo="custeio">Detalhar</button></td>
                <td>R$ ${formatCurrency(areaData.investimento.total)}</td>
                <td><button class="btn btn-outline-primary btn-sm area-valor-expand-btn" data-area="${areaId}" data-tipo="investimento">Detalhar</button></td>
                <td><strong>R$ ${formatCurrency(areaData.total)}</strong></td>
                <td><button class="btn btn-outline-primary btn-sm area-valor-expand-btn" data-area="${areaId}" data-tipo="total">Detalhar</button></td>
            </tr>
            <tr class="details-row" id="details-area-custeio-${areaId}" style="display:none;">
                <td colspan="7">
                    <div class="project-details">
                        ${renderAreaValorDetails(areaData.custeio.projetos)}
                    </div>
                </td>
            </tr>
            <tr class="details-row" id="details-area-investimento-${areaId}" style="display:none;">
                <td colspan="7">
                    <div class="project-details">
                        ${renderAreaValorDetails(areaData.investimento.projetos)}
                    </div>
                </td>
            </tr>
            <tr class="details-row" id="details-area-total-${areaId}" style="display:none;">
                <td colspan="7">
                    <div class="project-details">
                        ${renderAreaValorDetails(todosProjetos)}
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
    `;
    
    return html;
}

/**
 * Função para renderizar os detalhes dos projetos por área e tipo de orçamento
 * @param {Array} projetos Lista de projetos a renderizar
 * @returns {string} HTML dos detalhes
 */
function renderAreaValorDetails(projetos) {
    if (projetos.length === 0) {
        return '<p>Nenhum projeto encontrado nesta categoria.</p>';
    }
    
    let html = `
        <table class="project-details-table">
            <thead>
                <tr>
                    <th>ID PCA</th>
                    <th>Tipo</th>
                    <th>Projeto</th>
                    <th>Status</th>
                    <th>Contratar Até</th>
                    <th>Valor (R$)</th>
                    <th>Processo</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    projetos.forEach(projeto => {
        let contratoAttrs = '';
        if (projeto.numeroContrato && String(projeto.numeroContrato).trim() !== '') {
            contratoAttrs += ` data-contrato="${String(projeto.numeroContrato).trim()}"`;
        }
        if (projeto.numeroRegistro && String(projeto.numeroRegistro).trim() !== '') {
            contratoAttrs += ` data-registro="${String(projeto.numeroRegistro).trim()}"`;
        }

        html += `
            <tr>
                <td>${projeto.idPca}</td>
                <td>${projeto.tipo}</td>
                <td${contratoAttrs}>${projeto.projeto}</td>
                <td>${formatStatusWithClasses(projeto.status)}</td>
                <td>${projeto.dataProcesso || '-'}</td>
                <td>R$ ${formatCurrency(projeto.valor)}</td>
                <td>${projeto.numProcesso}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

/**
 * Função para adicionar listeners nos botões de Detalhar/contrair valores por área
 */
function addAreaValorExpandListeners() {
    const areaValorExpandButtons = document.querySelectorAll('.area-valor-expand-btn');
    
    areaValorExpandButtons.forEach(button => {
        // Remover qualquer ícone existente primeiro para evitar duplicação
        const existingIcon = button.querySelector('.expand-icon');
        if (existingIcon) {
            existingIcon.remove();
        }
        
        // Guardar o texto original e adicionar ícone de seta
        const originalText = button.textContent;
        button.innerHTML = originalText + '<span class="expand-icon">▼</span>';
        
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Evitar que o clique propague para a linha
            
            const area = this.getAttribute('data-area');
            const tipo = this.getAttribute('data-tipo');
            const detailsRow = document.getElementById(`details-area-${tipo}-${area}`);
            
            if (!detailsRow) {
                console.error(`Elemento #details-area-${tipo}-${area} não encontrado!`);
                return;
            }
            
            // Verificar se já está expandido por display ou classe
            const isExpanded = detailsRow.style.display !== 'none' && 
                              detailsRow.style.display !== '';
            
            if (!isExpanded) {
                // Primeiro garantir que está visível, depois animar
                detailsRow.style.display = 'table-row';
                
                // Usar setTimeout para garantir que o browser renderize o display antes de adicionar a classe
                setTimeout(() => {
                    detailsRow.classList.add('expanded');
                }, 10);
                
                // Atualizar texto e ícone do botão
                this.innerHTML = 'Recolher <span class="expand-icon rotate">▼</span>';
                this.classList.add('active');
                
                // Destacar a linha pai
                const parentRow = this.closest('tr');
                if (parentRow) parentRow.classList.add('active');
            } else {
                // Remover a classe para iniciar a animação de saída
                detailsRow.classList.remove('expanded');
                
                // Aguardar a animação terminar antes de esconder
                setTimeout(() => {
                    detailsRow.style.display = 'none';
                }, 300);
                
                // Restaurar o botão
                this.innerHTML = 'Detalhar <span class="expand-icon">▼</span>';
                this.classList.remove('active');
                
                // Remover destaque da linha pai
                const parentRow = this.closest('tr');
                if (parentRow) parentRow.classList.remove('active');
            }
        });
    });
}

/**
 * Função para gerar apenas o HTML para os projetos por área
 * @returns {string} HTML para os boxes de área
 */
function renderAreaProjectsHtml() {
    const areas = Object.keys(analyticData.areaCounts).sort();
    
    let boxesHtml = '';
    areas.forEach(area => {
        const areaCount = analyticData.areaCounts[area];
        boxesHtml += `
            <div class="area-box">
                <div class="area-name">${formatAreaWithClasses(area)}</div>
                <div class="area-tipo">
                    <span>🛒 Aquisição: ${areaCount['🛒 Aquisição']}</span>
                    <span>🔄 Renovação: ${areaCount['🔄 Renovação']}</span>
                    <span><strong>Total: ${areaCount.total}</strong></span>
                </div>                <div class="area-actions">
                    <button class="btn btn-outline-primary btn-sm area-expand-btn" data-area="${area}">Detalhar <span class="expand-icon">▼</span></button>
                </div>
                <div class="area-details" id="area-details-${area.replace(/\s+/g, '-')}" style="display:none;">
                    <div class="project-details">
                        ${renderAreaDetails(area)}
                    </div>
                </div>
            </div>
        `;
    });
    
    return boxesHtml;
}

/**
 * Função para aplicar estilo de área
 * @param {string} area Nome da área
 * @returns {string} HTML com a área formatada
 */
function formatAreaWithClasses(area) {
    // Mapeamento de áreas para classes CSS (igual ao usado em areas-classes.js)
    const areaMapping = {
        'STI 👩‍💼': 'area-sti',
        'OPERAÇÕES 🗄️': 'area-operacoes',
        'DEV 👨‍💻': 'area-dev',
        'ANALYTICS 📊': 'area-analytics',
        'GOVERNANÇA 🌐': 'area-governanca',
    };
    
    // Verificar se a área está no mapeamento
    if (areaMapping[area]) {
        return `<span class="${areaMapping[area]}-highlight">${area}</span>`;
    }
    
    // Sem formatação especial
    return area;
}

/**
 * Função para formatar o texto de status com as classes corretas
 * Duplicamos aqui para manter a coesão do módulo
 * @param {string} statusText - O texto do status a ser formatado
 * @returns {string} - O HTML com o status formatado
 */
function formatStatusWithClasses(statusText) {
    // Mapeamento de status para classes CSS
    const statusMapping = {
        'AUTUAÇÃO ATRASADA 💣': 'status-autuacao-atrasada-highlight',
        'CONTRATAÇÃO ATRASADA ⚠️': 'status-contratacao-atrasada-highlight',
        'AGUARDANDO DFD ⏳': 'status-aguardando-dfd-highlight',
        'AGUARDANDO ETP ⏳': 'status-aguardando-etp-highlight',
        'ETP ATRASADO❗': 'status-etp-atrasado-highlight',
        'DFD ATRASADO❗': 'status-dfd-atrasado-highlight',
        'ELABORANDO TR📝': 'status-elaborando-tr-highlight',
        'AGUARDANDO DEFINIÇÃO': 'status-aguardando-definicao-highlight',
        'ANÁLISE DE VIABILIDADE 📝': 'status-analise-viabilidade-highlight',
        'EM CONTRATAÇÃO 🤝': 'status-em-contratacao-highlight',
        'EM RENOVAÇÃO 🔄': 'status-em-renovacao-highlight',
        'RENOVADO ✅': 'status-renovado-highlight',
        'CONTRATADO ✅': 'status-contratado-highlight',
        'REVISÃO PCA 🚧': 'status-revisao-pca-highlight',
        'A INICIAR ⏰': 'status-a-iniciar-highlight',

    };

    // Procurar correspondência exata
    if (statusMapping[statusText]) {
        return `<span class="${statusMapping[statusText]}" >${statusText}</span>`;
    }
    
    // Procurar correspondência parcial
    for (const [key, className] of Object.entries(statusMapping)) {
        if (statusText.includes(key)) {
            return `<span class="${className}" >${statusText}</span>`;
        }
    }
    
    // Sem formatação especial para status desconhecidos
    return statusText;
}

/**
 * Função para renderizar detalhes dos projetos por status
 * @param {string} status - O status dos projetos a serem exibidos
 * @returns {string} - HTML da tabela com os projetos do status
 */
function renderStatusDetails(status) {
    const projetos = analyticData.projetosPorStatus[status] || [];
    
    if (projetos.length === 0) {
        return '<p>Nenhum projeto encontrado neste status.</p>';
    }
    
    let html = `
        <table class="project-details-table">
            <thead>
                <tr>
                    <th>ID PCA</th>
                    <th>Área</th>
                    <th>Projeto</th>
                    <th>Contratar Até</th>
                    <th>Valor (R$)</th>
                    <th>Processo</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    projetos.forEach(projeto => {
        let contratoAttrs = '';
        if (projeto.numeroContrato && String(projeto.numeroContrato).trim() !== '') {
            contratoAttrs += ` data-contrato="${String(projeto.numeroContrato).trim()}"`;
        }
        
        html += `
            <tr${contratoAttrs}>
                <td>${projeto.id || 'N/A'}</td>
                <td>${formatAreaWithClasses(projeto.area || 'N/A')}</td>
                <td>${projeto.objeto || 'N/A'}</td>
                <td>${projeto.contratar_ate || 'N/A'}</td>
                <td>R$ ${formatCurrency(projeto.valor || 0)}</td>
                <td>${projeto.numeroProcesso || 'N/A'}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

/**
 * Função para renderizar detalhes dos projetos por tipo de contratação
 * @param {string} tipo - O tipo de contratação dos projetos a serem exibidos
 * @returns {string} - HTML da tabela com os projetos do tipo
 */
function renderTipoDetails(tipo) {
    const projetos = analyticData.projetosPorTipo[tipo] || [];
    
    if (projetos.length === 0) {
        return '<p>Nenhum projeto encontrado neste tipo de contratação.</p>';
    }
    
    let html = `
        <table class="project-details-table">
            <thead>
                <tr>
                    <th>ID PCA</th>
                    <th>Área</th>
                    <th>Projeto</th>
                    <th>Contratar Até</th>
                    <th>Valor (R$)</th>
                    <th>Processo</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    projetos.forEach(projeto => {
        let contratoAttrs = '';
        if (projeto.numeroContrato && String(projeto.numeroContrato).trim() !== '') {
            contratoAttrs += ` data-contrato="${String(projeto.numeroContrato).trim()}"`;
        }
        
        html += `
            <tr${contratoAttrs}>
                <td>${projeto.id || 'N/A'}</td>
                <td>${formatAreaWithClasses(projeto.area || 'N/A')}</td>
                <td>${projeto.objeto || 'N/A'}</td>
                <td>${projeto.contratar_ate || 'N/A'}</td>
                <td>R$ ${formatCurrency(projeto.valor || 0)}</td>
                <td>${projeto.numeroProcesso || 'N/A'}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}