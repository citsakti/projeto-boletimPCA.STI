/**
 * AnalyticsRender.js - Funções para renderização das seções analíticas do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Renderizar as diferentes seções da página de análise
 *  - Criar tabelas e visualizações para apresentar os dados
 */

/**
 * Função para renderizar a seção de dados gerais
 */
function renderGeneralSection() {
    // Calcular o total de todos os status
    const totalStatus = Object.values(analyticData.statusCounts).reduce((sum, num) => sum + num, 0);

    // Montar HTML para a seção Geral
    let html = `
        <div class="analytics-section">
            <h2>1. Dados Gerais</h2>
            
            <div class="analytics-subsection">
                <h3>Status dos Processos</h3>
                <div class="status-grid">
                    <div class="status-box">
                        <div class="status-name">TODOS</div>
                        <div class="status-count">${totalStatus}</div>
                    </div>
                    ${Object.entries(analyticData.statusCounts).map(([status, count]) => `
                        <div class="status-box">
                            <div class="status-name">${status}</div>
                            <div class="status-count">${count}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="analytics-subsection">
                <h3>Tipo de Contratação</h3>
                <div class="tipo-grid">
                    <div class="tipo-box">
                        <div class="tipo-name">🛒 Aquisição</div>
                        <div class="tipo-count">${analyticData.tipoCounts["🛒 Aquisição"]}</div>
                    </div>
                    <div class="tipo-box">
                        <div class="tipo-name">🔄 Renovação</div>
                        <div class="tipo-count">${analyticData.tipoCounts["🔄 Renovação"]}</div>
                    </div>
                    <div class="tipo-box">
                        <div class="tipo-name">Total</div>
                        <div class="tipo-count">${analyticData.tipoCounts["🛒 Aquisição"] + analyticData.tipoCounts["🔄 Renovação"]}</div>
                    </div>
                </div>
            </div>
            
            ${renderAreaProjectsSection()}
            
            <div class="analytics-subsection">
                <h3>Valores por Orçamento e Tipo</h3>
                <div class="valor-table">
                    <table class="analytics-table">
                        <thead>
                            <tr>
                                <th>Categoria</th>
                                <th>Valor Total</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="expandable-row" data-category="custeio">
                                <td>Total CUSTEIO 💳</td>
                                <td>R$ ${formatCurrency(analyticData.valorTotal.custeio)}</td>
                                <td><button class="expand-btn" data-category="custeio">Expandir</button></td>
                            </tr>
                            <tr class="details-row" id="details-custeio" style="display:none;">
                                <td colspan="3">
                                    <div class="project-details">
                                        ${renderProjectDetails('custeio')}
                                    </div>
                                </td>
                            </tr>
                            <tr class="expandable-row" data-category="investimento">
                                <td>Total INVESTIMENTO 💵</td>
                                <td>R$ ${formatCurrency(analyticData.valorTotal.investimento)}</td>
                                <td><button class="expand-btn" data-category="investimento">Expandir</button></td>
                            </tr>
                            <tr class="details-row" id="details-investimento" style="display:none;">
                                <td colspan="3">
                                    <div class="project-details">
                                        ${renderProjectDetails('investimento')}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Total GERAL (CUSTEIO + INVESTIMENTO)</strong></td>
                                <td><strong>R$ ${formatCurrency(analyticData.valorTotal.custeio + analyticData.valorTotal.investimento)}</strong></td>
                                <td></td>
                            </tr>
                            <tr class="expandable-row" data-category="custoAquisicao">
                                <td>Total 🛒 Aquisição no CUSTEIO 💳</td>
                                <td>R$ ${formatCurrency(analyticData.valorTotal.custoAquisicao)}</td>
                                <td><button class="expand-btn" data-category="custoAquisicao">Expandir</button></td>
                            </tr>
                            <tr class="details-row" id="details-custoAquisicao" style="display:none;">
                                <td colspan="3">
                                    <div class="project-details">
                                        ${renderProjectDetails('custoAquisicao')}
                                    </div>
                                </td>
                            </tr>
                            <tr class="expandable-row" data-category="custoRenovacao">
                                <td>Total 🔄 Renovação no CUSTEIO 💳</td>
                                <td>R$ ${formatCurrency(analyticData.valorTotal.custoRenovacao)}</td>
                                <td><button class="expand-btn" data-category="custoRenovacao">Expandir</button></td>
                            </tr>
                            <tr class="details-row" id="details-custoRenovacao" style="display:none;">
                                <td colspan="3">
                                    <div class="project-details">
                                        ${renderProjectDetails('custoRenovacao')}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Total GERAL no CUSTEIO (Aquisição + Renovação)</strong></td>
                                <td><strong>R$ ${formatCurrency(analyticData.valorTotal.custoAquisicao + analyticData.valorTotal.custoRenovacao)}</strong></td>
                                <td></td>
                            </tr>
                            <tr class="expandable-row" data-category="investimentoAquisicao">
                                <td>Total 🛒 Aquisição no INVESTIMENTO 💵</td>
                                <td>R$ ${formatCurrency(analyticData.valorTotal.investimentoAquisicao)}</td>
                                <td><button class="expand-btn" data-category="investimentoAquisicao">Expandir</button></td>
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
                                <td><button class="expand-btn" data-category="investimentoRenovacao">Expandir</button></td>
                            </tr>
                            <tr class="details-row" id="details-investimentoRenovacao" style="display:none;">
                                <td colspan="3">
                                    <div class="project-details">
                                        ${renderProjectDetails('investimentoRenovacao')}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Total GERAL no INVESTIMENTO (Aquisição + Renovação)</strong></td>
                                <td><strong>R$ ${formatCurrency(analyticData.valorTotal.investimentoAquisicao + analyticData.valorTotal.investimentoRenovacao)}</strong></td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    const container = document.getElementById('analytics-dashboard');
    if (container) {
        container.innerHTML = html;
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

    let html = `
        <div class="analytics-section">
            <h2>2. Análise Situacional</h2>
            <div class="situacional-table">
                <table class="analytics-table">
                    <thead>
                        <tr>
                            <th>Categoria</th>
                            <th style="white-space:normal; word-break:break-word;">Critério (STATUS DO PROCESSO)</th>
                            <th>Contagem</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="expandable-row" data-category="contratacaoForaSTI">
                            <td>Fase de contratação fora da STI</td>
                            <td style="white-space:normal; word-break:break-word;">EM CONTRATAÇÃO 🤝 ou EM RENOVAÇÃO 🔄<br>(ÁREA ≠ STI)</td>
                            <td>${analyticData.situacional.contratacaoForaSTI}</td>
                            <td><button class="situacional-expand-btn" data-category="contratacaoForaSTI">Expandir</button></td>
                        </tr>
                        <tr class="details-row" id="situacional-details-contratacaoForaSTI" style="display:none;">
                            <td colspan="4">
                                <div class="project-details">
                                    ${renderSituacionalDetails('contratacaoForaSTI')}
                                </div>
                            </td>
                        </tr>
                        <tr class="expandable-row" data-category="autuacaoAtrasada">
                            <td>Autuação atrasada > 90 dias</td>
                            <td style="white-space:normal; word-break:break-word;">AUTUAÇÃO ATRASADA 💣</td>
                            <td>${analyticData.situacional.autuacaoAtrasada}</td>
                            <td><button class="situacional-expand-btn" data-category="autuacaoAtrasada">Expandir</button></td>
                        </tr>
                        <tr class="details-row" id="situacional-details-autuacaoAtrasada" style="display:none;">
                            <td colspan="4">
                                <div class="project-details">
                                    ${renderSituacionalDetails('autuacaoAtrasada')}
                                </div>
                            </td>
                        </tr>
                        <tr class="expandable-row" data-category="elaboracaoInterna">
                            <td>Elaboração interna de artefatos</td>
                            <td style="white-space:normal; word-break:break-word;">
                                AGUARDANDO DFD ⏳<br>
                                AGUARDANDO ETP ⏳<br>
                                ELABORANDO TR📝<br>
                                ANÁLISE DE VIABILIDADE 📝<br>
                                DFD ATRASADO❗<br>
                                ETP ATRASADO❗
                            </td>
                            <td>${analyticData.situacional.elaboracaoInterna}</td>
                            <td><button class="situacional-expand-btn" data-category="elaboracaoInterna">Expandir</button></td>
                        </tr>
                        <tr class="details-row" id="situacional-details-elaboracaoInterna" style="display:none;">
                            <td colspan="4">
                                <div class="project-details">
                                    ${renderSituacionalDetails('elaboracaoInterna')}
                                </div>
                            </td>
                        </tr>
                        <tr class="expandable-row" data-category="contratacaoAtrasadaForaSTI">
                            <td>Contratação atrasada fora da STI</td>
                            <td style="white-space:normal; word-break:break-word;">CONTRATAÇÃO ATRASADA ⚠️<br>(ÁREA ≠ STI)</td>
                            <td>${analyticData.situacional.contratacaoAtrasadaForaSTI}</td>
                            <td><button class="situacional-expand-btn" data-category="contratacaoAtrasadaForaSTI">Expandir</button></td>
                        </tr>
                        <tr class="details-row" id="situacional-details-contratacaoAtrasadaForaSTI" style="display:none;">
                            <td colspan="4">
                                <div class="project-details">
                                    ${renderSituacionalDetails('contratacaoAtrasadaForaSTI')}
                                </div>
                            </td>
                        </tr>
                        <tr class="expandable-row" data-category="processosConcluidos">
                            <td>Processos concluídos</td>
                            <td style="white-space:normal; word-break:break-word;">CONTRATADO ✅ ou RENOVADO ✅</td>
                            <td>${analyticData.situacional.processosConcluidos}</td>
                            <td><button class="situacional-expand-btn" data-category="processosConcluidos">Expandir</button></td>
                        </tr>
                        <tr class="details-row" id="situacional-details-processosConcluidos" style="display:none;">
                            <td colspan="4">
                                <div class="project-details">
                                    ${renderSituacionalDetails('processosConcluidos')}
                                </div>
                            </td>
                        </tr>
                        <tr class="expandable-row" data-category="processosSuspensos">
                            <td>Processos Suspensos</td>
                            <td style="white-space:normal; word-break:break-word;">REVISÃO PCA 🚧</td>
                            <td>${analyticData.situacional.processosSuspensos}</td>
                            <td><button class="situacional-expand-btn" data-category="processosSuspensos">Expandir</button></td>
                        </tr>
                        <tr class="details-row" id="situacional-details-processosSuspensos" style="display:none;">
                            <td colspan="4">
                                <div class="project-details">
                                    ${renderSituacionalDetails('processosSuspensos')}
                                </div>
                            </td>
                        </tr>
                        <tr class="expandable-row" data-category="processosAIniciar">
                            <td>Processos a iniciar</td>
                            <td style="white-space:normal; word-break:break-word;">A INICIAR ⏰</td>
                            <td>${analyticData.situacional.processosAIniciar}</td>
                            <td><button class="situacional-expand-btn" data-category="processosAIniciar">Expandir</button></td>
                        </tr>
                        <tr class="details-row" id="situacional-details-processosAIniciar" style="display:none;">
                            <td colspan="4">
                                <div class="project-details">
                                    ${renderSituacionalDetails('processosAIniciar')}
                                </div>
                            </td>
                        </tr>
                        <tr class="total-row">
                            <td>Total</td>
                            <td></td>
                            <td>${totalSituacional}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        ${renderProdutividadeSection()}
    `;
    
    // Adicionar à página
    const container = document.getElementById('analytics-dashboard');
    if (container) {
        container.innerHTML += html;
    }
}

/**
 * Função para renderizar quadro de projetos por área
 */
function renderAreaProjectsSection() {
    let html = `
        <div class="analytics-subsection">
            <h3>Projetos de Aquisição por Área</h3>
            <div class="area-projects-grid">
    `;
    for (const [area, counts] of Object.entries(analyticData.areaCounts)) {
        html += `
            <div class="area-box">
                <div class="area-name">${area}</div>
                <div class="area-tipo">
                    <span>🛒 Aquisição: <strong>${counts["🛒 Aquisição"]}</strong></span><br>
                    <span>🔄 Renovação: <strong>${counts["🔄 Renovação"]}</strong></span><br>
                    <span>Total: <strong>${counts.total}</strong></span>
                </div>
            </div>
        `;
    }
    html += `
            </div>
        </div>
    `;
    return html;
}

/**
 * Função para renderizar a seção de produtividade
 */
function renderProdutividadeSection() {
    // Aqui chamamos a implementação detalhada que está em AnalyticsDetails.js
    if (typeof renderProdutividadeDetalhada === 'function') {
        return renderProdutividadeDetalhada();
    }
    
    // Fallback caso a função não esteja disponível
    return `
    <div class="analytics-section">
        <h2>3. Produtividade Aquisições T.I.</h2>
        <p>Dados de produtividade não disponíveis.</p>
    </div>
    `;
}