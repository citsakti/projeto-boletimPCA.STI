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
                    <th>Contratar Até</th>
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
                    <th>Status</th>
                    <th>Contratar Até</th>
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
 * Função para renderizar detalhes dos projetos por área
 * @param {string} area Nome da área 
 */
function renderAreaDetails(area) {
    // Obter projetos diretamente da lista populada em Analytics.js
    // Esta lista agora contém apenas projetos de Aquisição ou Renovação para a área especificada.
    const projetosDaArea = analyticData.projetosPorArea[area] || []; 

    if (projetosDaArea.length === 0) {
        // Mensagem ajustada para refletir que a lista contém projetos de Aquisição/Renovação
        return '<p>Nenhum projeto de Aquisição ou Renovação encontrado nesta área.</p>';
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
                    <th>Número do Processo</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Iterar sobre os projetos da área (que já são os corretos)
    projetosDaArea.forEach(projeto => {
        html += `
            <tr>
                <td>${projeto.idPca}</td>
                <td>${projeto.tipo}</td>
                <td>${projeto.projeto}</td>
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
 * Função para adicionar listeners nos botões de expandir/contrair
 */
function addExpandListeners() {
    const expandButtons = document.querySelectorAll('.expand-btn');
    
    expandButtons.forEach(button => {
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
            
            const categoria = this.getAttribute('data-category');
            const detailsRow = document.getElementById(`details-${categoria}`);
            
            if (!detailsRow) {
                console.error(`Elemento #details-${categoria} não encontrado!`);
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
                this.innerHTML = 'Expandir <span class="expand-icon">▼</span>';
                this.classList.remove('active');
                
                // Remover destaque da linha pai
                const parentRow = this.closest('tr');
                if (parentRow) parentRow.classList.remove('active');
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
            
            const categoria = this.getAttribute('data-category');
            const detailsRow = document.getElementById(`situacional-details-${categoria}`);
            
            if (!detailsRow) {
                console.error(`Elemento #situacional-details-${categoria} não encontrado!`);
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
                this.innerHTML = 'Expandir <span class="expand-icon">▼</span>';
                this.classList.remove('active');
                
                // Remover destaque da linha pai
                const parentRow = this.closest('tr');
                if (parentRow) parentRow.classList.remove('active');
            }
        });
    });
}

/**
 * Função para adicionar listeners nos botões de expandir/contrair áreas
 * com animações suaves para aparecer e desaparecer
 */
function addAreaExpandListeners() {
    const areaExpandButtons = document.querySelectorAll('.area-expand-btn');
    
    areaExpandButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const area = this.getAttribute('data-area');
            const detailsDiv = document.getElementById(`area-details-${area.replace(/\s+/g, '-')}`);
            const areaBox = this.closest('.area-box');
            
            if (!detailsDiv) {
                console.error(`Elemento #area-details-${area.replace(/\s+/g, '-')} não encontrado!`);
                return;
            }
            
            // Verificar se já está expandido
            const isExpanded = detailsDiv.classList.contains('expanded');
            
            if (!isExpanded) {
                // PRIMEIRO: Esconder todos os outros boxes IMEDIATAMENTE
                const allAreaBoxes = document.querySelectorAll('.area-box');
                allAreaBoxes.forEach(box => {
                    if (box !== areaBox) {
                        box.style.display = 'none'; // Esconde imediatamente
                    }
                });
                
                // SEGUNDO: Preparar o box selecionado para expandir
                areaBox.classList.add('area-box-expanded');
                
                // TERCEIRO: Aguardar um pequeno intervalo para garantir que o DOM atualizou
                // antes de iniciar a animação de expansão
                setTimeout(() => {
                    // Mostrar e animar os detalhes
                    detailsDiv.style.display = 'block';
                    
                    // Força reflow para garantir que a transição seja aplicada
                    void detailsDiv.offsetWidth;
                    
                    // Inicia a animação de expansão
                    detailsDiv.classList.add('expanded');
                    
                    // Atualiza o botão
                    this.textContent = 'Recolher';
                    this.classList.add('active');
                }, 50); // Um pequeno delay é suficiente
            } else {
                // Recolher: primeiro remove a classe expanded para iniciar a animação de fechamento
                detailsDiv.classList.remove('expanded');
                areaBox.classList.remove('area-box-expanded');
                
                // Aguardar o término da animação antes de mostrar os outros boxes
                detailsDiv.addEventListener('transitionend', function handler(e) {
                    if (e.propertyName === 'max-height' || e.propertyName === 'opacity') {
                        // Esconder os detalhes
                        detailsDiv.style.display = 'none';
                        
                        // Mostrar todos os boxes novamente com animação
                        const allAreaBoxes = document.querySelectorAll('.area-box');
                        allAreaBoxes.forEach(box => {
                            box.style.display = ''; // Mostra todos os boxes
                            
                            if (box !== areaBox) {
                                box.classList.add('area-box-fade-in'); // Aplica a animação de entrada
                                setTimeout(() => box.classList.remove('area-box-fade-in'), 600);
                            }
                        });
                        
                        // Remover o listener para evitar múltiplas chamadas
                        detailsDiv.removeEventListener('transitionend', handler);
                    }
                });
                
                // Atualizar o botão imediatamente 
                this.textContent = 'Expandir';
                this.classList.remove('active');
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
    // Adicionado "CONTRATAÇÃO ATRASADA ⚠️" à lista de status processados
    const statusProcessado = ['CONTRATADO ✅', 'RENOVADO ✅', 'EM CONTRATAÇÃO 🤝', 'EM RENOVAÇÃO 🔄', 'CONTRATAÇÃO ATRASADA ⚠️'];
    
    const todosProjetos = [];
    for (const categoria in analyticData.projetosPorSituacao) {
        if (analyticData.projetosPorSituacao[categoria] && Array.isArray(analyticData.projetosPorSituacao[categoria])) {
            todosProjetos.push(...analyticData.projetosPorSituacao[categoria]);
        }
    }
    
    // Filtra os projetos para considerar apenas aqueles dentro do período especificado (dataInicio a dataFim).
    const projetosNoPeriodo = todosProjetos.filter(projeto => {
        // Verificar se projeto.i existe e não está vazio
        if (!projeto.i) return false;
        
        // Converter a data do formato brasileiro (DD/MM/YYYY) para objeto Date
        const dataParts = projeto.i.split('/');
        if (dataParts.length !== 3) return false;
        
        // No formato brasileiro: dataParts[0] = dia, dataParts[1] = mês, dataParts[2] = ano
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
    
    // Separa os projetos autuados e não autuados
    const projetosAutuadosArray = projetosNoPeriodo.filter(projeto => 
        statusProcessado.includes(projeto.status)
    );
    
    const projetosNaoAutuadosArray = projetosNoPeriodo.filter(projeto => 
        !statusProcessado.includes(projeto.status)
    );
    
    // Calcula a quantidade de processos autuados
    const projetosAutuados = projetosAutuadosArray.length;
    
    // Calcula a "Porcentagem de Conclusão", que é (Processos Autuados / Total de processos a serem autuados) * 100.
    const percentualConclusao = totalProjetos > 0 
        ? Math.round((projetosAutuados / totalProjetos) * 100) 
        : 0;
    
    return {
        aquisicao, // Contagem de aquisições no período
        renovacao, // Contagem de renovações no período
        total: totalProjetos, // Total de processos a serem autuados no período
        projetosAutuados, // Total de processos efetivamente autuados no período
        percentualConclusao, // Percentual de conclusão
        projetosAutuadosArray, // Array com projetos autuados
        projetosNaoAutuadosArray // Array com projetos não autuados
    };
}

/**
 * Função para renderizar a tabela de detalhes dos projetos
 * @param {Array} projetos Lista de projetos para exibir
 * @returns {string} HTML da tabela de detalhes
 */
function renderProdutividadeProjetosTable(projetos) {
    if (projetos.length === 0) {
        return '<p>Nenhum projeto encontrado nesta categoria.</p>';
    }
    
    let html = `
        <table class="project-details-table">
            <thead>
                <tr>
                    <th>ID PCA</th>
                    <th>Área</th>
                    <th>Tipo</th>
                    <th>Projeto</th>
                    <th>Status</th>
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
                <td>${projeto.tipo}</td>
                <td>${projeto.projeto}</td>
                <td>${formatStatusWithClasses(projeto.status)}</td>
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
 * Função para renderizar a seção de produtividade
 * Renomeada para evitar conflito com a função em AnalyticsRender.js
 */
function renderProdutividadeDetalhada() {
    // Calcular produtividade para 2025.1 (Janeiro a Junho)
    const produtividade2025_1 = calcularProdutividade(
        new Date(2024, 10, 1), // 01/11/2024 (mês é base 0: novembro = 10)
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
        
        <div class="analytics-subsection">
            <h3>Índice de Produtividade | Meta 80%</h3>
        
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
                        
                        <div class="produtividade-botoes">
                            <button class="prod-expand-btn" data-period="2025_1" data-type="autuados">Ver Processos Autuados</button>
                            <button class="prod-expand-btn" data-period="2025_1" data-type="nao-autuados">Ver Processos Não Autuados</button>
                        </div>
                        
                        <!-- Container para detalhes dos processos autuados 2025.1 -->
                        <div id="detalhes-2025_1-autuados" class="detalhes-produtividade" style="display:none;">
                            <h4>Processos Autuados 2025.1</h4>
                            <div class="project-details">
                                ${renderProdutividadeProjetosTable(produtividade2025_1.projetosAutuadosArray)}
                            </div>
                        </div>
                        
                        <!-- Container para detalhes dos processos não autuados 2025.1 -->
                        <div id="detalhes-2025_1-nao-autuados" class="detalhes-produtividade" style="display:none;">
                            <h4>Processos Não Autuados 2025.1</h4>
                            <div class="project-details">
                                ${renderProdutividadeProjetosTable(produtividade2025_1.projetosNaoAutuadosArray)}
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
                        
                        <div class="produtividade-botoes">
                            <button class="prod-expand-btn" data-period="2025_2" data-type="autuados">Ver Processos Autuados</button>
                            <button class="prod-expand-btn" data-period="2025_2" data-type="nao-autuados">Ver Processos Não Autuados</button>
                        </div>
                        
                        <!-- Container para detalhes dos processos autuados 2025.2 -->
                        <div id="detalhes-2025_2-autuados" class="detalhes-produtividade" style="display:none;">
                            <h4>Processos Autuados 2025.2</h4>
                            <div class="project-details">
                                ${renderProdutividadeProjetosTable(produtividade2025_2.projetosAutuadosArray)}
                            </div>
                        </div>
                        
                        <!-- Container para detalhes dos processos não autuados 2025.2 -->
                        <div id="detalhes-2025_2-nao-autuados" class="detalhes-produtividade" style="display:none;">
                            <h4>Processos Não Autuados 2025.2</h4>
                            <div class="project-details">
                                ${renderProdutividadeProjetosTable(produtividade2025_2.projetosNaoAutuadosArray)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
    
    return html;
}

/**
 * Função para adicionar listeners nos botões de expandir/contrair da produtividade
 * com funcionalidade de rolagem automática - permitindo múltiplos itens abertos
 */
function addProdutividadeExpandListeners() {
    const produtividadeExpandButtons = document.querySelectorAll('.prod-expand-btn');
    
    produtividadeExpandButtons.forEach(button => {
        // Armazenar o texto original do botão para restaurar ao esconder
        const originalText = button.textContent;
        button.setAttribute('data-original-text', originalText);
        
        // Adicionar ícone de seta ao botão
        button.innerHTML = originalText + '<span class="expand-icon">▼</span>';
        
        // Construir o ID do alvo a partir dos atributos data-period e data-type
        const period = button.getAttribute('data-period');
        const type = button.getAttribute('data-type');
        const targetId = `detalhes-${period}-${type}`;
        
        button.addEventListener('click', function() {
            const detailsDiv = document.getElementById(targetId);
            const expandIcon = this.querySelector('.expand-icon');
            const produtividadeBox = this.closest('.produtividade-box');
            
            if (!detailsDiv) {
                console.error(`Elemento #${targetId} não encontrado!`);
                return;
            }
            
            // Verificar se está expandido ou não
            const isExpanded = detailsDiv.style.display !== 'none' && detailsDiv.style.display !== '';
            
            if (!isExpanded) {
                // Mostrar os detalhes com animação
                detailsDiv.style.display = 'block';
                
                // Permitir tempo para renderização inicial
                setTimeout(() => {
                    detailsDiv.classList.add('expanded');
                    
                    // Rolar até o conteúdo expandido após um breve atraso
                    // para que a animação de expansão tenha começado
                    setTimeout(() => {
                        detailsDiv.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start'
                        });
                        
                        // Adicionar classe para destacar brevemente o conteúdo
                        detailsDiv.classList.add('scrolled-to');
                        setTimeout(() => {
                            detailsDiv.classList.remove('scrolled-to');
                        }, 1500);
                    }, 300);
                }, 10);
                
                // Atualizar o botão
                this.innerHTML = 'Esconder detalhes' + '<span class="expand-icon rotate">▼</span>';
                this.classList.add('active');
            } else {
                // Esconder os detalhes com animação
                detailsDiv.classList.remove('expanded');
                detailsDiv.classList.remove('scrolled-to');
                
                // Usar setTimeout para aguardar a animação completar
                setTimeout(() => {
                    detailsDiv.style.display = 'none';
                }, 300);
                
                // Restaurar o texto e aparência do botão
                const originalText = this.getAttribute('data-original-text');
                this.innerHTML = originalText + '<span class="expand-icon">▼</span>';
                this.classList.remove('active');
                
                // Rolar de volta para o box pai
                produtividadeBox.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start'
                });
            }
            
            // Adicionar efeito de ondulação ao clicar
            this.classList.add('button-ripple');
            setTimeout(() => {
                this.classList.remove('button-ripple');
            }, 600);
        });
    });
}

/**
 * Função para formatar o texto de status com as classes corretas
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
        return `<span class="${statusMapping[statusText]}" style="display:inline-block; vertical-align:middle;">${statusText}</span>`;
    }
    
    // Procurar correspondência parcial
    for (const [key, className] of Object.entries(statusMapping)) {
        if (statusText.includes(key)) {
            return `<span class="${className}" style="display:inline-block; vertical-align:middle;">${statusText}</span>`;
        }
    }
    
    // Sem formatação especial
    return statusText;
}

/**
 * Função para alternar a exibição de detalhes de uma área
 * @param {HTMLElement} detailsDiv - Elemento de detalhes a ser alternado
 */
function toggleAreaDetails(detailsDiv) {
    if (!detailsDiv.classList.contains('expanded')) {
        detailsDiv.style.display = 'block'; // Mostra antes de animar
        // Força reflow
        void detailsDiv.offsetWidth;
        detailsDiv.classList.add('expanded');
    } else {
        detailsDiv.classList.remove('expanded');
        // Só esconde após a transição
        detailsDiv.addEventListener('transitionend', function handler(e) {
            if (e.propertyName === 'max-height' && !detailsDiv.classList.contains('expanded')) {
                detailsDiv.style.display = 'none';
                detailsDiv.removeEventListener('transitionend', handler);
            }
        });
    }
}