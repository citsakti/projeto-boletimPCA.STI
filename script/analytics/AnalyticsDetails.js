/**
 * AnalyticsDetails.js - Funções para gerenciar a exibição de detalhes dos projetos na análise
 * 
 * Este script é responsável por:
 *  - Renderizar tabelas detalhadas de projetos para diferentes categorias
 *  - Formatar dados para exibição (status, áreas, valores monetários)
 *  - Implementar funcionalidades de expansão/contração de seções
 *  - Calcular métricas de produtividade para períodos específicos
 *  - Gerenciar interações do usuário com elementos expansíveis
 * 
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Funções de Renderização:
 *   - renderProjectDetails(): Gera tabelas para detalhes por categoria orçamentária
 *   - renderSituacionalDetails(): Gera tabelas para detalhes por situação
 *   - renderAreaDetails(): Gera tabelas para detalhes por área organizacional
 *   - renderProdutividadeDetalhada(): Gera seção completa de produtividade
 *   - renderProdutividadeProjetosTable(): Gera tabelas para projetos da produtividade
 * 
 * # Funções de Formatação:
 *   - formatAreaWithClasses(): Aplica estilos CSS específicos por área
 *   - formatStatusWithClasses(): Aplica estilos CSS específicos por status
 *   - formatCurrency(): Formata valores numéricos para moeda (definido em outro arquivo)
 * 
 * # Funções de Event Listeners:
 *   - addExpandListeners(): Configura eventos para botões de expandir/contrair gerais
 *   - addSituacionalExpandListeners(): Configura eventos para seção situacional
 *   - addAreaExpandListeners(): Configura eventos para detalhes de áreas
 *   - addProdutividadeExpandListeners(): Configura eventos para seção de produtividade
 *   - addStatusExpandListeners(): Configura eventos para botões de status
 *   - addTipoExpandListeners(): Configura eventos para botões de tipo de contratação
 * 
 * # Funções de Cálculo:
 *   - calcularProdutividade(): Calcula métricas de acompanhamento para períodos
 *   - toggleAreaDetails(): Controla a exibição de detalhes de áreas
 * 
 * # Fluxo de Execução:
 *   1. Funções de renderização são chamadas por Analytics.js
 *   2. Tabelas e seções detalhadas são geradas com HTML estruturado
 *   3. Event listeners são configurados para elementos expansíveis
 *   4. Usuário interage com os elementos para mostrar/ocultar detalhes
 *   5. Dados são formatados adequadamente durante a exibição
 * 
 * # Dependências:
 *   - analyticData: Objeto global com dados processados (de Analytics.js)
 *   - setupAnalyticsTooltips: Função global para tooltips de contratos
 *   - Funções de formatação auxiliares (formatCurrency, etc.)
 */

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

// Usa helper global se disponível para célula de processo
function _renderProcessCell(value, modalidadeX = '', numeroY = ''){
    if (typeof renderProcessCell === 'function') return renderProcessCell(value, modalidadeX, numeroY);
    const val = (value || '').toString().trim();
    if (!val || val === 'N/A' || val === '-') return val || '-';
    let html = `${val} <span class="processo-link-icon" title="Abrir processo">🔗</span>`;
    const hasNumeroY = typeof numeroY === 'string' ? numeroY.trim() !== '' && numeroY.trim() !== '-' : !!numeroY;
    if (hasNumeroY) {
        const x = (modalidadeX || '').toString().trim();
        const y = (numeroY || '').toString().trim();
        html += ` <span class="comprasgov-link-icon" title="Abrir acompanhamento no Comprasnet" data-x="${x}" data-y="${y}">🛍️</span>`;
    }
    return html;
}

// Usa helper global se disponível para célula de projeto
function _renderProjectCell(projectText, modalidadeX = '', numeroY = ''){
    if (typeof window.renderProjectCellWithCompras === 'function') {
        return window.renderProjectCellWithCompras(projectText, modalidadeX, numeroY);
    }
    // Fallback: renderizar sem formatação especial
    const text = projectText == null ? '' : String(projectText);
    const y = numeroY == null ? '' : String(numeroY).trim();
    const hasCompras = y !== '' && y !== '-';
    if (!hasCompras) return text;
    const x = modalidadeX == null ? '' : String(modalidadeX).trim();
    const comprasAttrs = ` class="comprasgov-link-icon" title="Abrir acompanhamento no Comprasnet" data-x="${x}" data-y="${y}"`;
    return `${text} <span${comprasAttrs}>🛍️</span>`;
}

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
                <td>${formatAreaWithClasses(projeto.area)}</td>
                <td${contratoAttrs}>${_renderProjectCell(projeto.projeto, projeto.modalidadeX, projeto.numeroY)}</td>
                <td>${projeto.dataProcesso || '-'}</td>
                <td>R$ ${formatCurrency(projeto.valor)}</td>
                <td>${_renderProcessCell(projeto.numProcesso, projeto.modalidadeX, projeto.numeroY)}</td>
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
        }        // Renderizar tag de dias de atraso para categoria autuacaoAtrasada
        let statusComDiasAtraso = formatStatusWithClasses(projeto.status);
        if (categoria === 'autuacaoAtrasada' && projeto.diasAtraso && typeof renderDiasAtrasoTag === 'function') {
            statusComDiasAtraso += renderDiasAtrasoTag(projeto.diasAtraso);
        }

        html += `
            <tr>
                <td>${projeto.idPca}</td>
                <td>${formatAreaWithClasses(projeto.area)}</td>
                <td${contratoAttrs}>${_renderProjectCell(projeto.projeto, projeto.modalidadeX, projeto.numeroY)}</td>
                <td>${statusComDiasAtraso}</td>
                <td>${projeto.dataProcesso || '-'}</td>
                <td>R$ ${formatCurrency(projeto.valor)}</td>
                <td>${_renderProcessCell(projeto.numProcesso, projeto.modalidadeX, projeto.numeroY)}</td>
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
                    <th>Processo</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Iterar sobre os projetos da área (que já são os corretos)
    projetosDaArea.forEach(projeto => {
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
                <td${contratoAttrs}>${_renderProjectCell(projeto.projeto, projeto.modalidadeX, projeto.numeroY)}</td>
                <td>${formatStatusWithClasses(projeto.status)}</td>
                <td>${projeto.dataProcesso || '-'}</td>
                <td>R$ ${formatCurrency(projeto.valor)}</td>
                <td>${_renderProcessCell(projeto.numProcesso, projeto.modalidadeX, projeto.numeroY)}</td>
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
 * Função helper para notificar módulos de tags após expansão de tabelas
 */
function notifyTagModulesAfterExpansion() {
    // Notificar módulo de Comprasgov para reinicializar listeners
    if (window.comprasgovInstance && typeof window.comprasgovInstance.reinitialize === 'function') {
        window.comprasgovInstance.reinitialize();
    }
    
    // Notificar módulo de EspecieProcesso para processar novas linhas
    if (window.debugEspecieProcesso && typeof window.debugEspecieProcesso.scheduleUpdate === 'function') {
        window.debugEspecieProcesso.scheduleUpdate(200);
    }
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
                    // Chamar setup de tooltips de contrato
                    if (typeof window.setupAnalyticsTooltips === 'function') {
                        window.setupAnalyticsTooltips();
                    }
                    // Notificar módulos de tags
                    notifyTagModulesAfterExpansion();
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
                    // Chamar setup de tooltips de contrato
                    if (typeof window.setupAnalyticsTooltips === 'function') {
                        window.setupAnalyticsTooltips();
                    }
                    // Notificar módulos de tags
                    notifyTagModulesAfterExpansion();
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
                    // Chamar setup de tooltips de contrato
                    if (typeof window.setupAnalyticsTooltips === 'function') {
                        window.setupAnalyticsTooltips();
                    }
                    
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
    
    // Filtra os projetos para considerar apenas aqueles:
    // 1. Dentro do período especificado (dataInicio a dataFim)
    // 2. Que não estejam com status CANCELADO
    // 3. Que sejam tipo Aquisição ou Renovação
    const projetosNoPeriodo = todosProjetos.filter(projeto => {
        // Verificar se projeto.i existe e não está vazio
        if (!projeto.i) return false;
        
        // Excluir projetos cancelados
        if (projeto.status === 'CANCELADO ❌') return false;
        
        // Verificar se o tipo é válido
        if (projeto.tipo !== '🛒 Aquisição' && projeto.tipo !== '🔄 Renovação') return false;
        
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
    
    // Calcula quantos processos faltam para atingir a meta de 80%
    const metaProcessos = Math.ceil(totalProjetos * 0.8); // Arredonda para cima
    const processosFaltamMeta = Math.max(0, metaProcessos - projetosAutuados);
    
    return {
        aquisicao, // Contagem de aquisições no período
        renovacao, // Contagem de renovações no período
        total: totalProjetos, // Total de processos a serem autuados no período
        projetosAutuados, // Total de processos efetivamente autuados no período
        percentualConclusao, // Percentual de conclusão
        projetosAutuadosArray, // Array com projetos autuados
        projetosNaoAutuadosArray, // Array com projetos não autuados
        metaProcessos, // Quantos processos precisam estar autuados para atingir 80%
        processosFaltamMeta // Quantos processos faltam para atingir a meta de 80%
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
    
    // Ordenar projetos para que os concluídos e renovados apareçam no final
    const projetosOrdenados = [...projetos].sort((a, b) => {
        const statusA = a.status || '';
        const statusB = b.status || '';
        
        // Verificar se são status concluídos/renovados
        const isAConcluido = statusA.includes('CONTRATADO ✅') || statusA.includes('RENOVADO ✅');
        const isBConcluido = statusB.includes('CONTRATADO ✅') || statusB.includes('RENOVADO ✅');
        
        // Se ambos são concluídos ou ambos não são, manter ordem original
        if (isAConcluido === isBConcluido) {
            return 0;
        }
        
        // Se apenas A é concluído, vai para o final (retorna 1)
        if (isAConcluido && !isBConcluido) {
            return 1;
        }
        
        // Se apenas B é concluído, A vem primeiro (retorna -1)
        if (!isAConcluido && isBConcluido) {
            return -1;
        }
        
        return 0;
    });
    
    let html = `
        <table class="project-details-table">
            <thead>
                <tr>
                    <th>ID PCA</th>
                    <th>Área</th>
                    <th>Tipo</th>
                    <th>Projeto</th>
                    <th>Status</th>
                    <th>Data PCA</th>
                    <th>Valor (R$)</th>
                    <th>Processo</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    projetosOrdenados.forEach(projeto => {
        let tipoCellContent = projeto.tipo;
        let tdTipoClass = '';

        if (tipoCellContent && (tipoCellContent.includes('🔄 Renovação') || tipoCellContent.includes('🛒 Aquisição'))) {
            tdTipoClass = 'no-wrap-cell';
        }

        let contratoAttrs = '';
        if (projeto.numeroContrato && String(projeto.numeroContrato).trim() !== '') {
            contratoAttrs += ` data-contrato="${String(projeto.numeroContrato).trim()}"`;
        }
        if (projeto.numeroRegistro && String(projeto.numeroRegistro).trim() !== '') {
            contratoAttrs += ` data-registro="${String(projeto.numeroRegistro).trim()}"`;
        }        html += `
            <tr>
                <td>${projeto.idPca}</td>
                <td>${formatAreaWithClasses(projeto.area)}</td>
                <td class="${tdTipoClass}">${tipoCellContent}</td>
                <td${contratoAttrs}>${projeto.projeto}</td>
                <td>${formatStatusWithClasses(projeto.status)}</td>
                <td>${projeto.dataProcesso || '-'}</td>
                <td>R$ ${formatCurrency(projeto.valor)}</td>
                <td class="no-wrap-cell">${_renderProcessCell(projeto.numProcesso, projeto.modalidadeX, projeto.numeroY)}</td>
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
    // Obter o ano selecionado pelo usuário
    const selectedYear = window.getSelectedYear ? window.getSelectedYear() : '2025';
    const year = parseInt(selectedYear, 10);
    const prevYear = year - 1;
    
    // Calcular produtividade para o primeiro semestre (Janeiro a Junho)
    const produtividade_1 = calcularProdutividade(
        new Date(prevYear, 9, 1), // 01/11/ano anterior (mês é base 0: novembro = 10)
        new Date(year, 5, 30)      // 30/06/ano atual
    );
    
    // Calcular produtividade para o segundo semestre (Julho a Dezembro)
    const produtividade_2 = calcularProdutividade(
        new Date(year, 6, 1),    // 01/07/ano atual
        new Date(year, 11, 31)   // 31/12/ano atual
    );

    // Função para determinar classe de performance baseada no percentual
    function getPerformanceClass(percentual) {
        if (percentual >= 80) return 'alto-desempenho';
        if (percentual >= 60) return 'medio-desempenho';
        return 'baixo-desempenho';
    }

    // Função para obter status textual
    function getStatusText(percentual) {
        if (percentual >= 80) return { text: 'Meta Atingida', icon: '✅', class: 'alto' };
        if (percentual >= 60) return { text: 'Próximo da Meta', icon: '⚠️', class: 'medio' };
        return { text: 'Abaixo da Meta', icon: '🔴', class: 'baixo' };
    }

    const status_1 = getStatusText(produtividade_1.percentualConclusao);
    const status_2 = getStatusText(produtividade_2.percentualConclusao);
    
    let html = `
    <div class="analytics-section">
        <h2>4. Produtividade Aquisições T.I.</h2>
        
        <div class="analytics-subsection">
            <h3>4.1 Índice de Produtividade ${year} | Meta 80%</h3>
        
            <div class="tipo-grid">
                <!-- Quadro 1: Produtividade do primeiro semestre -->
                <div class="produtividade-box">
                    <h3 data-period="${year}.1">Produtividade ${year}.1</h3>
                    <div class="produtividade-content">
                        <div class="produtividade-tipos">
                            <div class="tipo-item">
                                <span class="tipo-label">🛒 Aquisição</span>
                                <span class="tipo-value">${produtividade_1.aquisicao}</span>
                            </div>
                            <div class="tipo-item">
                                <span class="tipo-label">🔄 Renovação</span>
                                <span class="tipo-value">${produtividade_1.renovacao}</span>
                            </div>
                            <div class="tipo-item total">
                                <span class="tipo-label">Total</span>
                                <span class="tipo-value">${produtividade_1.total}</span>
                            </div>
                        </div>
                        
                        <div class="produtividade-percentual">
                            <h4>📊 Produtividade em %</h4>
                            <div class="percentual-item">
                                <span class="percentual-label">✅ Total de Processos Autuados</span>
                                <span class="percentual-value">${produtividade_1.projetosAutuados}</span>
                            </div>                            <div class="percentual-item">
                                <span class="percentual-label">⏳ Total de Processos Não Autuados</span>
                                <span class="percentual-value">${produtividade_1.projetosNaoAutuadosArray.length}</span>
                            </div>                            <div class="percentual-item">
                                <span class="percentual-label">🎯 Processos para Meta de 80%</span>
                                <span class="percentual-value meta-info">
                                    ${produtividade_1.processosFaltamMeta === 0 
                                        ? '<span class="meta-atingida">✅ Meta atingida, Parabéns!</span>' 
                                        : `<span class="processos-faltam">${produtividade_1.processosFaltamMeta === 1 ? 'Falta' : 'Faltam'} ${produtividade_1.processosFaltamMeta} processo${produtividade_1.processosFaltamMeta > 1 ? 's' : ''}</span>`
                                    }
                                </span>
                            </div>
                            <div class="percentual-item">
                                <span class="percentual-label">🎯 Porcentagem de Conclusão para ${year}.1</span>
                                <div class="percentual-value percentual-progress">
                                    <div class="progress-container">
                                        <div class="progress-bar ${getPerformanceClass(produtividade_1.percentualConclusao)}" 
                                             style="--progress-width: ${produtividade_1.percentualConclusao}%; width: ${produtividade_1.percentualConclusao}%">
                                        </div>
                                    </div>
                                    <div class="progress-text">
                                        <span class="progress-percentage">${produtividade_1.percentualConclusao}%</span>
                                        <span class="progress-status ${status_1.class}">
                                            ${status_1.icon} ${status_1.text}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>                        
                        <div class="produtividade-botoes">
                            <button class="btn prod-expand-btn" data-period="${year}_1" data-type="autuados">
                                📋 Ver Processos Autuados
                                <span class="expand-icon">▼</span>
                            </button>
                            <button class="btn prod-expand-btn" data-period="${year}_1" data-type="nao-autuados">
                                ⏸️ Ver Processos Não Autuados
                                <span class="expand-icon">▼</span>
                            </button>
                        </div>
                        
                        <!-- Container para detalhes dos processos autuados -->
                        <div id="detalhes-${year}_1-autuados" class="detalhes-produtividade" style="display:none;">
                            <h4>📋 Processos Autuados ${year}.1</h4>
                            <div class="project-details">
                                ${renderProdutividadeProjetosTable(produtividade_1.projetosAutuadosArray)}
                            </div>
                        </div>
                        
                        <!-- Container para detalhes dos processos não autuados -->
                        <div id="detalhes-${year}_1-nao-autuados" class="detalhes-produtividade" style="display:none;">
                            <h4>⏸️ Processos Não Autuados ${year}.1</h4>
                            <div class="project-details">
                                ${renderProdutividadeProjetosTable(produtividade_1.projetosNaoAutuadosArray)}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Quadro 2: Produtividade do segundo semestre -->
                <div class="produtividade-box">
                    <h3 data-period="${year}.2">Produtividade ${year}.2</h3>
                    <div class="produtividade-content">
                        <div class="produtividade-tipos">
                            <div class="tipo-item">
                                <span class="tipo-label">🛒 Aquisição</span>
                                <span class="tipo-value">${produtividade_2.aquisicao}</span>
                            </div>
                            <div class="tipo-item">
                                <span class="tipo-label">🔄 Renovação</span>
                                <span class="tipo-value">${produtividade_2.renovacao}</span>
                            </div>
                            <div class="tipo-item total">
                                <span class="tipo-label">Total</span>
                                <span class="tipo-value">${produtividade_2.total}</span>
                            </div>
                        </div>
                        
                        <div class="produtividade-percentual">
                            <h4>📊 Produtividade em %</h4>
                            <div class="percentual-item">
                                <span class="percentual-label">✅ Total de Processos Autuados</span>
                                <span class="percentual-value">${produtividade_2.projetosAutuados}</span>
                            </div>                            <div class="percentual-item">
                                <span class="percentual-label">⏳ Total de Processos Não Autuados</span>
                                <span class="percentual-value">${produtividade_2.projetosNaoAutuadosArray.length}</span>
                            </div>                            <div class="percentual-item">
                                <span class="percentual-label">🎯 Processos para Meta de 80%</span>
                                <span class="percentual-value meta-info">
                                    ${produtividade_2.processosFaltamMeta === 0 
                                        ? '<span class="meta-atingida">✅ Meta atingida, Parabéns!</span>' 
                                        : `<span class="processos-faltam">${produtividade_2.processosFaltamMeta === 1 ? 'Falta' : 'Faltam'} ${produtividade_2.processosFaltamMeta} processo${produtividade_2.processosFaltamMeta > 1 ? 's' : ''}</span>`
                                    }
                                </span>
                            </div>
                            <div class="percentual-item">
                                <span class="percentual-label">🎯 Porcentagem de Conclusão para ${year}.2</span>
                                <div class="percentual-value percentual-progress">
                                    <div class="progress-container">
                                        <div class="progress-bar ${getPerformanceClass(produtividade_2.percentualConclusao)}" 
                                             style="--progress-width: ${produtividade_2.percentualConclusao}%; width: ${produtividade_2.percentualConclusao}%">
                                        </div>
                                    </div>
                                    <div class="progress-text">
                                        <span class="progress-percentage">${produtividade_2.percentualConclusao}%</span>
                                        <span class="progress-status ${status_2.class}">
                                            ${status_2.icon} ${status_2.text}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="produtividade-botoes">
                            <button class="btn prod-expand-btn" data-period="${year}_2" data-type="autuados">
                                📋 Ver Processos Autuados
                                <span class="expand-icon">▼</span>
                            </button>
                            <button class="btn prod-expand-btn" data-period="${year}_2" data-type="nao-autuados">
                                ⏸️ Ver Processos Não Autuados
                                <span class="expand-icon">▼</span>
                            </button>
                        </div>
                        
                        <!-- Container para detalhes dos processos autuados -->
                        <div id="detalhes-${year}_2-autuados" class="detalhes-produtividade" style="display:none;">
                            <h4>📋 Processos Autuados ${year}.2</h4>
                            <div class="project-details">
                                ${renderProdutividadeProjetosTable(produtividade_2.projetosAutuadosArray)}
                            </div>
                        </div>
                        
                        <!-- Container para detalhes dos processos não autuados -->
                        <div id="detalhes-${year}_2-nao-autuados" class="detalhes-produtividade" style="display:none;">
                            <h4>⏸️ Processos Não Autuados ${year}.2</h4>
                            <div class="project-details">
                                ${renderProdutividadeProjetosTable(produtividade_2.projetosNaoAutuadosArray)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>    </div>
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
        const originalText = button.textContent.replace('▼', '').trim();
        button.setAttribute('data-original-text', originalText);
        
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
                    
                    // Chamar setup de tooltips de contrato
                    if (typeof window.setupAnalyticsTooltips === 'function') {
                        window.setupAnalyticsTooltips();
                    }

                    // Rolar até o conteúdo expandido após um breve atraso
                    // para que a animação de expansão tenha começado
                    setTimeout(() => {
                        detailsDiv.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start'
                        });
                    }, 150);
                }, 50);
                
                // Atualizar o botão para mostrar que está expandido
                this.classList.add('active');
                if (expandIcon) {
                    expandIcon.style.transform = 'rotate(180deg)';
                }
                
                // Marcar o box como expandido
                produtividadeBox.classList.add('expanded');
            } else {
                // Esconder os detalhes com animação
                detailsDiv.classList.remove('expanded');
                
                // Usar setTimeout para aguardar a animação completar
                setTimeout(() => {
                    detailsDiv.style.display = 'none';
                }, 300);
                
                // Atualizar o botão para mostrar que está recolhido
                this.classList.remove('active');
                if (expandIcon) {
                    expandIcon.style.transform = 'rotate(0deg)';
                }
                
                // Remover a classe expandida se nenhum detalhe estiver visível
                const allDetails = produtividadeBox.querySelectorAll('.detalhes-produtividade.expanded');
                if (allDetails.length === 0) {
                    produtividadeBox.classList.remove('expanded');
                }
                
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

/**
 * Função para adicionar listeners nos botões de expandir/contrair status
 */
function addStatusExpandListeners() {
    const statusExpandButtons = document.querySelectorAll('.status-expand-btn');
    
    statusExpandButtons.forEach(button => {
        // Remover qualquer ícone existente primeiro para evitar duplicação
        const existingIcon = button.querySelector('.expand-icon');
        if (existingIcon) {
            existingIcon.remove();
        }
        
        // Guardar o texto original e adicionar ícone de seta
        const originalText = button.textContent;
        button.innerHTML = originalText + '<span class="expand-icon">▼</span>';
        
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Evitar que o clique propague
            
            const status = this.getAttribute('data-status');
            const statusId = status.replace(/\s+/g, '-').toLowerCase();
            const detailsRow = document.getElementById(`status-details-${statusId}`);
            
            if (!detailsRow) {
                console.error(`Elemento #status-details-${statusId} não encontrado!`);
                return;
            }
            
            // Verificar se já está expandido
            const isExpanded = detailsRow.style.display !== 'none' && 
                              detailsRow.style.display !== '';
            
            if (!isExpanded) {
                // Primeiro garantir que está visível, depois animar
                detailsRow.style.display = 'block';
                
                // Usar setTimeout para garantir que o browser renderize o display antes de adicionar a classe
                setTimeout(() => {
                    detailsRow.classList.add('expanded');
                    // Chamar setup de tooltips de contrato
                    if (typeof window.setupAnalyticsTooltips === 'function') {
                        window.setupAnalyticsTooltips();
                    }
                }, 10);
                
                // Atualizar texto e ícone do botão
                this.innerHTML = 'Recolher <span class="expand-icon rotate">▼</span>';
                this.classList.add('active');
                
                // Destacar o box pai
                const parentBox = this.closest('.status-box');
                if (parentBox) parentBox.classList.add('active');
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
                
                // Remover destaque do box pai
                const parentBox = this.closest('.status-box');
                if (parentBox) parentBox.classList.remove('active');
            }
        });
    });
}

/**
 * Função para adicionar listeners nos botões de expandir/contrair tipos
 */
function addTipoExpandListeners() {
    const tipoExpandButtons = document.querySelectorAll('.tipo-expand-btn');
    
    tipoExpandButtons.forEach(button => {
        // Remover qualquer ícone existente primeiro para evitar duplicação
        const existingIcon = button.querySelector('.expand-icon');
        if (existingIcon) {
            existingIcon.remove();
        }
        
        // Guardar o texto original e adicionar ícone de seta
        const originalText = button.textContent;
        button.innerHTML = originalText + '<span class="expand-icon">▼</span>';
        
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Evitar que o clique propague
            
            const tipo = this.getAttribute('data-tipo');
            const tipoId = tipo === "🛒 Aquisição" ? "aquisicao" : "renovacao";
            const detailsRow = document.getElementById(`tipo-details-${tipoId}`);
            
            if (!detailsRow) {
                console.error(`Elemento #tipo-details-${tipoId} não encontrado!`);
                return;
            }
            
            // Verificar se já está expandido
            const isExpanded = detailsRow.style.display !== 'none' && 
                              detailsRow.style.display !== '';
            
            if (!isExpanded) {
                // Primeiro garantir que está visível, depois animar
                detailsRow.style.display = 'block';
                
                // Usar setTimeout para garantir que o browser renderize o display antes de adicionar a classe
                setTimeout(() => {
                    detailsRow.classList.add('expanded');
                    // Chamar setup de tooltips de contrato
                    if (typeof window.setupAnalyticsTooltips === 'function') {
                        window.setupAnalyticsTooltips();
                    }
                }, 10);
                
                // Atualizar texto e ícone do botão
                this.innerHTML = 'Recolher <span class="expand-icon rotate">▼</span>';
                this.classList.add('active');
                
                // Destacar o box pai
                const parentBox = this.closest('.tipo-box');
                if (parentBox) parentBox.classList.add('active');
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
                
                // Remover destaque do box pai
                const parentBox = this.closest('.tipo-box');
                if (parentBox) parentBox.classList.remove('active');
            }
        });
    });
}