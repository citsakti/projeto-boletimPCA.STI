/**
 * AnalyticsDetails.js - Funções para gerenciar a exibição de detalhes dos projetos na análise
 * 
 * Este script contém funções complementares para o Analytics.js,
 * focando na exibição detalhada de projetos por categoria.
 */

/**
 * Função para renderizar detalhes dos projetos por categoria
 * @param {string} categoria Nome da categoria 
 */
function renderProjectDetails(categoria) {
    const projetos = analyticData.projetosPorCategoria[categoria] || [];
    
    if (projetos.length === 0) {
        return '<p>Nenhum projeto encontrado nesta categoria.</p>';
    }
    
    let html = `
        <table class="project-details-table">
            <thead>
                <tr>
                    <th>ID PCA</th>
                    <th>Área</th>
                    <th>Projeto</th>
                    <th>Valor (R$)</th>
                    <th>Número do Processo</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    projetos.forEach(projeto => {
        html += `
            <tr>
                <td>${projeto.idPca}</td>
                <td>${projeto.area}</td>
                <td>${projeto.projeto}</td>
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
 * Função para renderizar detalhes dos projetos por categoria situacional
 * @param {string} categoria Nome da categoria situacional
 */
function renderSituacionalDetails(categoria) {
    const projetos = analyticData.projetosPorSituacao[categoria] || [];
    
    if (projetos.length === 0) {
        return '<p>Nenhum projeto encontrado nesta categoria.</p>';
    }
    
    let html = `
        <table class="project-details-table">
            <thead>
                <tr>
                    <th>ID PCA</th>
                    <th>Área</th>
                    <th>Projeto</th>
                    <th>Valor (R$)</th>
                    <th>Número do Processo</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    projetos.forEach(projeto => {
        html += `
            <tr>
                <td>${projeto.idPca}</td>
                <td>${projeto.area}</td>
                <td>${projeto.projeto}</td>
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
 * Função para adicionar listeners nos botões de expandir/contrair
 */
function addExpandListeners() {
    const expandButtons = document.querySelectorAll('.expand-btn');
    
    expandButtons.forEach(button => {
        button.addEventListener('click', function() {
            const categoria = this.getAttribute('data-category');
            const detailsRow = document.getElementById(`details-${categoria}`);
            
            if (detailsRow.style.display === 'none') {
                detailsRow.style.display = 'table-row';
                this.textContent = 'Recolher';
            } else {
                detailsRow.style.display = 'none';
                this.textContent = 'Expandir';
            }
        });
    });
}

/**
 * Função para adicionar listeners nos botões de expandir/contrair da seção situacional
 */
function addSituacionalExpandListeners() {
    const situacionalExpandButtons = document.querySelectorAll('.situacional-expand-btn');
    
    situacionalExpandButtons.forEach(button => {
        button.addEventListener('click', function() {
            const categoria = this.getAttribute('data-category');
            const detailsRow = document.getElementById(`situacional-details-${categoria}`);
            
            if (detailsRow.style.display === 'none') {
                detailsRow.style.display = 'table-row';
                this.textContent = 'Recolher';
            } else {
                detailsRow.style.display = 'none';
                this.textContent = 'Expandir';
            }
        });
    });
}

/**
 * Função para calcular as métricas de produtividade para um período específico
 * @param {Date} dataInicio Data de início do período
 * @param {Date} dataFim Data de fim do período
 * @returns {Object} Objeto com as métricas de produtividade
 */
function calcularProdutividade(dataInicio, dataFim) {
    // Array de status que indicam processos autuados, conforme especificado.
    const statusProcessado = ['CONTRATADO ✅', 'RENOVADO ✅', 'EM CONTRATAÇÃO 🤝', 'EM RENOVAÇÃO 🔄'];
    
    const todosProjetos = [];
    for (const categoria in analyticData.projetosPorSituacao) {
        if (analyticData.projetosPorSituacao[categoria] && Array.isArray(analyticData.projetosPorSituacao[categoria])) {
            todosProjetos.push(...analyticData.projetosPorSituacao[categoria]);
        }
    }
    
    // Filtra os projetos para considerar apenas aqueles dentro do período especificado (dataInicio a dataFim).
    const projetosNoPeriodo = todosProjetos.filter(projeto => {
        // Verificar se projeto.j existe e não está vazio
        if (!projeto.j) return false;
        
        // Converter a data do formato brasileiro (DD/MM/YYYY) para objeto Date
        const dataParts = projeto.j.split('/');
        if (dataParts.length !== 3) return false;
        
        // No formato brasileiro: dataParts[0] = dia, dataParts[1] = mês, dataParts[2] = ano
        // Mês em JavaScript é base 0 (janeiro = 0), então subtraímos 1 do mês
        const dia = parseInt(dataParts[0], 10);
        const mes = parseInt(dataParts[1], 10) - 1;
        const ano = parseInt(dataParts[2], 10);
        
        // Criar objeto Date com os componentes da data
        const dataProjeto = new Date(ano, mes, dia);
        
        // Verificar se a data é válida
        if (isNaN(dataProjeto.getTime())) return false;
        
        // Retornar apenas projetos dentro do período
        return dataProjeto >= dataInicio && dataProjeto <= dataFim;
    });
    
    // Contagem separada de projetos '🛒 Aquisição' e '🔄 Renovação' dentro do período.
    let aquisicao = 0;
    let renovacao = 0;
    projetosNoPeriodo.forEach(projeto => {
        if (projeto.tipo === '🛒 Aquisição') {
            aquisicao++;
        } else if (projeto.tipo === '🔄 Renovação') {
            renovacao++;
        }
    });
    
    // Calcula o "total de processos a serem autuados" no período,
    // que é a soma de aquisições e renovações nesse período.
    const totalProjetos = aquisicao + renovacao;
    
    // Calcula o "Total de Processos Autuados" no período,
    // contando os projetos (já filtrados pelo período) que possuem um dos status especificados.
    const projetosAutuados = projetosNoPeriodo.filter(projeto => 
        statusProcessado.includes(projeto.status)
    ).length;
    
    // Calcula a "Porcentagem de Conclusão", que é (Processos Autuados / Total de processos a serem autuados) * 100.
    const percentualConclusao = totalProjetos > 0 
        ? Math.round((projetosAutuados / totalProjetos) * 100) 
        : 0;
    
    return {
        aquisicao, // Contagem de aquisições no período
        renovacao, // Contagem de renovações no período
        total: totalProjetos, // Total de processos a serem autuados no período
        projetosAutuados, // Total de processos efetivamente autuados no período
        percentualConclusao // Percentual de conclusão
    };
}

/**
 * Função para renderizar a seção de produtividade
 * Renomeada para evitar conflito com a função em AnalyticsRender.js
 */
function renderProdutividadeDetalhada() {
    // Calcular produtividade para 2025.1 (Janeiro a Junho)
    const produtividade2025_1 = calcularProdutividade(
        new Date(2025, 0, 1), // 01/01/2025 (mês é base 0: janeiro = 0)
        new Date(2025, 5, 30)  // 30/06/2025
    );
    
    // Calcular produtividade para 2025.2 (Julho a Dezembro)
    const produtividade2025_2 = calcularProdutividade(
        new Date(2025, 6, 1),  // 01/07/2025
        new Date(2025, 11, 31) // 31/12/2025
    );
    
    let html = `
    <div class="analytics-section">
        <h2>3. Produtividade Aquisições T.I.</h2>
        
        <div class="tipo-grid">
            <!-- Quadro 1: Produtividade 2025.1 -->
            <div class="produtividade-box">
                <h3>Produtividade 2025.1</h3>
                <div class="produtividade-content">
                    <div class="produtividade-tipos">
                        <div class="tipo-item">
                            <span class="tipo-label">🛒 Aquisição</span>
                            <span class="tipo-value">${produtividade2025_1.aquisicao}</span>
                        </div>
                        <div class="tipo-item">
                            <span class="tipo-label">🔄 Renovação</span>
                            <span class="tipo-value">${produtividade2025_1.renovacao}</span>
                        </div>
                        <div class="tipo-item total">
                            <span class="tipo-label">Total</span>
                            <span class="tipo-value">${produtividade2025_1.total}</span>
                        </div>
                    </div>
                    
                    <div class="produtividade-percentual">
                        <h4>Produtividade em %</h4>
                        <div class="percentual-item">
                            <span class="percentual-label">Total de Processos Autuados</span>
                            <span class="percentual-value">${produtividade2025_1.projetosAutuados}</span>
                        </div>
                        <div class="percentual-item">
                            <span class="percentual-label">Porcentagem de Conclusão para 2025.1 até Agora</span>
                            <span class="percentual-value percentual-progress">
                                <div class="progress-bar" style="width: ${produtividade2025_1.percentualConclusao}%"></div>
                                <span>${produtividade2025_1.percentualConclusao}%</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Quadro 2: Produtividade 2025.2 -->
            <div class="produtividade-box">
                <h3>Produtividade 2025.2</h3>
                <div class="produtividade-content">
                    <div class="produtividade-tipos">
                        <div class="tipo-item">
                            <span class="tipo-label">🛒 Aquisição</span>
                            <span class="tipo-value">${produtividade2025_2.aquisicao}</span>
                        </div>
                        <div class="tipo-item">
                            <span class="tipo-label">🔄 Renovação</span>
                            <span class="tipo-value">${produtividade2025_2.renovacao}</span>
                        </div>
                        <div class="tipo-item total">
                            <span class="tipo-label">Total</span>
                            <span class="tipo-value">${produtividade2025_2.total}</span>
                        </div>
                    </div>
                    
                    <div class="produtividade-percentual">
                        <h4>Produtividade em %</h4>
                        <div class="percentual-item">
                            <span class="percentual-label">Total de Processos Autuados</span>
                            <span class="percentual-value">${produtividade2025_2.projetosAutuados}</span>
                        </div>
                        <div class="percentual-item">
                            <span class="percentual-label">Porcentagem de Conclusão para 2025.2 até Agora</span>
                            <span class="percentual-value percentual-progress">
                                <div class="progress-bar" style="width: ${produtividade2025_2.percentualConclusao}%"></div>
                                <span>${produtividade2025_2.percentualConclusao}%</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
    
    return html;
}