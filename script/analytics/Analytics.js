/**
 * Analytics.js - Script principal para processamento de dados analíticos do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Carregar os dados do CSV da planilha do PCA 2025
 *  - Processar os dados para gerar métricas e estatísticas
 *  - Coordenar a exibição das seções da página de Dados Analíticos
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Objeto de Dados: analyticData
 * Armazena todos os dados processados, incluindo:
 *   - statusCounts: Contador de projetos por status
 *   - tipoCounts: Contador por tipo de projeto (Aquisição/Renovação)
 *   - valorTotal: Somas por categoria orçamentária
 *   - situacional: Contadores para situações específicas
 *   - areaCounts: Contador de projetos por área
 *   - projetosPorArea: Projetos organizados por área
 *   - projetosPorCategoria: Listas por tipo de orçamento
 *   - projetosPorSituacao: Listas por situação processual
 * 
 * # Funções Principais:
 *   - initAnalytics(): Inicia o processamento, coordena o fluxo
 *   - fetchCSVData(): Busca e processa dados CSV
 *   - processData(): Transforma dados brutos em métricas
 *   - resetAnalyticData(): Limpa contadores para novo processamento
 *   - processProjectCounters(): Classifica e conta projetos
 *   - classifyProjectBySituation(): Categoriza projetos por situação
 *   - formatCurrency(): Formata valores monetários
 * 
 * # Fluxo de Execução:
 *   1. O script inicia quando o DOM carrega
 *   2. Dados CSV são baixados e processados
 *   3. Métricas são calculadas e classificadas
 *   4. Interface é renderizada com os dados
 *   5. Event listeners são configurados
 * 
 * # Lógica de Negócio:
 *   - Projetos cancelados são excluídos da análise
 *   - Dados são segregados por tipo (aquisição/renovação)
 *   - Valores são separados por orçamento (custeio/investimento)
 *   - Situações específicas são identificadas e contabilizadas
 *   - Áreas organizacionais têm suas contratações mapeadas
 * 
 * # Dependências:
 *   - Papa Parse: Para processamento de CSV
 *   - Funções de renderização (em outros arquivos)
 *   - Funções de tooltip para detalhes de contratos
 *   - Event listeners para interatividade
 */

// URL da planilha CSV (mesma do main.js) - inicial 2025 apontando para Apps Script atualizado
// Ajuste: se o ano 2026 já estiver selecionado antes do YearSelector inicializar,
// usamos diretamente a nova fonte (Apps Script 2026) solicitada pelo usuário.
// URLs primárias e redundantes (backup) para analytics
const ANALYTICS_URLS = {
    '2025': {
        main: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkrLcVYUAyDdf3XlecZ-qdperC8emYWp_5MCXXBG_SdrF5uGab5ugtebjA9iOWeDIbyC56s9jRGjcP/pub?gid=1123542137&single=true&output=csv',
        backup: 'https://script.google.com/macros/s/AKfycbz4sHQdov5Yc26OIEga8Mg5yThXdm2SF1UMF7cG8rXPW49Z1s-KDoGh8yjCkOVKpFzUAQ/exec'
    },
    '2026': {
        main: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcOu9JPRm1oGxkBBEgpZ-hOfictNMZblU1qATZqosqAbMc6bbUASRNRyXVe-dWAK9gGJwvg-jduUFv/pub?gid=1123542137&single=true&output=csv',
        backup: 'https://script.google.com/macros/s/AKfycbzQwBm8v7PCrSE6UbqezxD6dLYymPA6dhL64Eoy82FAdoGO26yhh6XlfaC8SlVwtY_uYw/exec'
    }
};
let SHEET_CSV_URL = (function(){
    try { const storedYear = localStorage.getItem('selectedYear'); if (storedYear && ANALYTICS_URLS[storedYear]) return ANALYTICS_URLS[storedYear].main; } catch(e) {}
    return ANALYTICS_URLS['2025'].main;
})();

// Objeto para armazenar os dados processados
const analyticData = {
    statusCounts: {},
    tipoCounts: {
        "🛒 Aquisição": 0,
        "🔄 Renovação": 0
    },
    valorTotal: {
        custeio: 0,
        investimento: 0,
        custoAquisicao: 0, 
        custoRenovacao: 0,
        investimentoAquisicao: 0,
        investimentoRenovacao: 0
    },
    situacional: {
        contratacaoForaSTI: 0,
        autuacaoAtrasada: 0,
        elaboracaoInterna: 0,
        contratacaoAtrasadaForaSTI: 0,
        processosConcluidos: 0,
        processosSuspensos: 0,
        processosAIniciar: 0,
        total: 0
    },    areaCounts: {},
    projetosPorArea: {}, // Adicionar esta linha
    // Armazenar detalhes de projetos por categoria
    projetosPorCategoria: {
        custeio: [],
        investimento: [],
        custoAquisicao: [],
        custoRenovacao: [],
        investimentoAquisicao: [],
        investimentoRenovacao: []
    },
    // Armazenar detalhes de projetos por status
    projetosPorStatus: {},
    // Armazenar detalhes de projetos por tipo
    projetosPorTipo: {
        "🛒 Aquisição": [],
        "🔄 Renovação": []
    },
    // Armazenar detalhes de projetos por categoria situacional
    projetosPorSituacao: {
        contratacaoForaSTI: [],
        autuacaoAtrasada: [],
        elaboracaoInterna: [],
        contratacaoAtrasadaForaSTI: [],
        processosConcluidos: [],
        processosSuspensos: [],
        processosAIniciar: []
    },
    // Lista completa de projetos (não cancelados) para uso em análises específicas (ex.: pareceres jurídicos)
    todosProjetos: []
};

/**
 * Função para inicializar o processamento dos dados analíticos
 */
function initAnalytics() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('d-none');
        overlay.classList.add('d-flex');
    }
    
    fetchCSVData()
        .then(processData)        .then(() => {            renderGeneralSection();
            renderOrcamentoSection();
            renderSituacionalSection();
            
            // Renderizar seção de produtividade
            const container = document.getElementById('analytics-dashboard');
            if (container && typeof renderProdutividadeDetalhada === 'function') {
                container.innerHTML += renderProdutividadeDetalhada();
            }
            
            // REMOVIDO: Inicialização automática da seção 3.2 Processos por Setor
            // Agora é carregada sob demanda via botão "Gerar Informação"
            console.log('[Analytics] Seção 3.2 (Processos por Setor) configurada para carregamento sob demanda');
            
            // Atualizar a data de atualização
            document.getElementById('data-atualizacao').textContent = new Date().toLocaleDateString('pt-BR');
            
            // Ocultar overlay de carregamento
            if (overlay) {
                setTimeout(() => {
                    overlay.classList.remove('d-flex');
                    overlay.classList.add('d-none');
                }, 500);
            }
              // Adicionar os event listeners para expandir/contrair detalhes
            addExpandListeners();
            // Adicionar os event listeners para a seção situacional
            addSituacionalExpandListeners();
            // Adicionar os event listeners para os botões de área
            addAreaExpandListeners();
            // Adicionar os event listeners para os botões de área e valor
            addAreaValorExpandListeners();
            // Adicionar os event listeners para status e tipos
            addStatusExpandListeners();
            addTipoExpandListeners();
            // Adicionar os event listeners para os botões de produtividade
            if (typeof addProdutividadeExpandListeners === 'function') {
                addProdutividadeExpandListeners();
            }            // Chamar setup de tooltips de contrato após renderização inicial e configuração de listeners
            console.log('🔍 Analytics.js: Tentando chamar setupAnalyticsTooltips...');
            if (typeof window.setupAnalyticsTooltips === 'function') {
                console.log('🔍 Analytics.js: setupAnalyticsTooltips existe, chamando agora...');
                window.setupAnalyticsTooltips();
            } else {
                console.error('🔍 Analytics.js: setupAnalyticsTooltips não está disponível!');
            }
        })        .catch(err => {
            console.error('Erro ao processar dados analíticos:', err);
            if (overlay) {
                overlay.classList.remove('d-flex');
                overlay.classList.add('d-none');
            }
            alert('Erro ao carregar dados analíticos. Por favor, tente novamente mais tarde.');
        });
}

/**
 * Função para buscar os dados do CSV
 * @returns {Promise} Promise contendo os dados brutos do CSV
 */
function fetchCSVData() {
    return new Promise((resolve, reject) => {
        let year = '2025';
        if (window.getSelectedYear) year = window.getSelectedYear();
        const urlPack = ANALYTICS_URLS[year] || ANALYTICS_URLS['2025'];
        SHEET_CSV_URL = urlPack.main;
        const papaBase = { header: false, skipEmptyLines: true };
        const exec = window.fetchCsvWithFallback ?
            window.fetchCsvWithFallback(urlPack.main, urlPack.backup, papaBase) :
            new Promise((res, rej) => {
                Papa.parse(urlPack.main, { download: true, ...papaBase, complete: r=>res({urlUsed:urlPack.main, results:r}), error:rej });
            });
        exec.then(({ results, urlUsed }) => {
            const allRows = results.data || [];
            const headerRowIndex = allRows.findIndex(row => row && row.length > 2 && row[2] && String(row[2]).trim() === 'ID PCA');
            if (headerRowIndex < 0) return reject('Cabeçalho "ID PCA" não encontrado no CSV');
            const headerRow = allRows[headerRowIndex];
            const dataRows = allRows.slice(headerRowIndex + 1);
            let lastValidIndex = -1;
            dataRows.forEach((row,i)=>{ if(row && row.length>5 && row[5] && String(row[5]).trim()!=='') lastValidIndex = i; });
            const validDataRows = dataRows.slice(0, lastValidIndex + 1);
            console.info('Analytics CSV carregado via', urlUsed.includes('script.google') ? 'backup' : 'primário');
            resolve({ headers: headerRow, data: validDataRows });
        }).catch(err => reject('Erro ao baixar/processar o CSV (fallback): '+ err));
    });
}

/**
 * Função para processar os dados brutos do CSV
 * @param {Object} rawData Objeto contendo headers e data
 */
function processData(rawData) {    // Mapear índices das colunas necessárias
    const columnIndices = {
        idPca: 2,        // Coluna C - ID PCA
        area: 3,         // Coluna D - Área
        tipo: 4,         // Coluna E - Tipo (🛒 Aquisição / 🔄 Renovação)
        projeto: 5,      // Coluna F - Projeto de Aquisição
        statusProcesso: 6, // Coluna G - Status do Processo
        numProcesso: 13, // Coluna M - Número do Processo
        orcamento: 14,   // Coluna O - Orçamento
        valorPca: 15,    // Coluna P - Valor PCA
        dataProcesso: 9,  // Coluna J - Data do processo
        dataInicio: 8,    // Coluna I - Data de início (AUTUAR EM:)
        diasAtraso: 11,  // Coluna L - Dias de atraso para autuação
    numeroContrato: 21, // Coluna V - Número do Contrato
    numeroRegistro: 22,  // Coluna W - Número de Registro do Contrato
    modalidadeX: 23,   // Coluna X - Modalidade (para Comprasgov)
    numeroY: 24        // Coluna Y - Número/Identificador (para Comprasgov)
    };
    
    // Resetar contadores e arrays
    resetAnalyticData();
    
    // Processar cada linha de dados
    rawData.data.forEach(row => {
        if (!row || row.length < 16) return; // Pular linhas muito curtas
        
        const idPca = row[columnIndices.idPca] || '';
        const area = row[columnIndices.area] || '';
        const tipo = row[columnIndices.tipo] || '';
        const projeto = row[columnIndices.projeto] || '';
        const statusProcesso = row[columnIndices.statusProcesso] || '';
        const numProcesso = row[columnIndices.numProcesso] || '';
        const orcamento = row[columnIndices.orcamento] || '';
        const valorStr = String(row[columnIndices.valorPca] || '0')
            .replace('R$', '')
            .replace(/\./g, '')
            .replace(/,/g, '.')
            .trim();
        const valor = parseFloat(valorStr) || 0;
        const dataProcesso = row[columnIndices.dataProcesso] || '';        const dataInicio = row[columnIndices.dataInicio] || ''; // Capturando a data de início
        const diasAtraso = row[columnIndices.diasAtraso] || ''; // Capturando os dias de atraso (coluna L)
    const numeroContrato = String(row[columnIndices.numeroContrato] || '').trim();
    const numeroRegistro = String(row[columnIndices.numeroRegistro] || '').trim();
    const modalidadeX = String(row[columnIndices.modalidadeX] || '').trim();
    const numeroY = String(row[columnIndices.numeroY] || '').trim();
        
        // Criar objeto de projeto para uso em detalhamentos
        const projetoObj = {
            idPca,
            area,
            projeto,
            valor,
            numProcesso,
            tipo,      // Adicionando o tipo ao objeto
            status: statusProcesso, // Adicionando o status ao objeto
            i: dataInicio,   // Apenas armazenando a data de início (coluna I - AUTUAR EM)
            dataProcesso, // Adicionar esta linha para incluir a data de "Contratar Até"
            diasAtraso,   // Adicionar os dias de atraso para status "AUTUAÇÃO ATRASADA 💣"
            numeroContrato, // Adicionar número do contrato
            numeroRegistro,  // Adicionar número de registro
            modalidadeX,    // Modalidade (X) para Comprasgov
            numeroY         // Número (Y) para Comprasgov
        };
        
        // Processar contadores e categorias
        processProjectCounters(projetoObj, statusProcesso, tipo, orcamento, area);
        
        // Classificar projetos por situação
        classifyProjectBySituation(projetoObj, statusProcesso, area);
    });
    
    return Promise.resolve();
}

/**
 * Função para resetar todos os contadores e arrays de dados
 */
function resetAnalyticData() {
    analyticData.statusCounts = {};
    analyticData.tipoCounts = {
        "🛒 Aquisição": 0,
        "🔄 Renovação": 0
    };
    analyticData.valorTotal = {
        custeio: 0,
        investimento: 0,
        custoAquisicao: 0, 
        custoRenovacao: 0,
        investimentoAquisicao: 0,
        investimentoRenovacao: 0
    };
    analyticData.situacional = {
        contratacaoForaSTI: 0,
        autuacaoAtrasada: 0,
        elaboracaoInterna: 0,
        contratacaoAtrasadaForaSTI: 0,
        processosConcluidos: 0,
        processosSuspensos: 0,
        processosAIniciar: 0,
        total: 0
    };
    analyticData.areaCounts = {};
    analyticData.projetosPorArea = {}; // Adicionar esta linha
      // Limpar arrays de projetos por categoria
    analyticData.projetosPorCategoria = {
        custeio: [],
        investimento: [],
        custoAquisicao: [],
        custoRenovacao: [],
        investimentoAquisicao: [],
        investimentoRenovacao: []
    };
    
    // Limpar arrays de projetos por status
    analyticData.projetosPorStatus = {};
    
    // Limpar arrays de projetos por tipo
    analyticData.projetosPorTipo = {
        "🛒 Aquisição": [],
        "🔄 Renovação": []
    };
    
    // Limpar arrays de projetos por categoria situacional
    analyticData.projetosPorSituacao = {
        contratacaoForaSTI: [],
        autuacaoAtrasada: [],
        elaboracaoInterna: [],
        contratacaoAtrasadaForaSTI: [],
        processosConcluidos: [],
        processosSuspensos: [],
        processosAIniciar: []
    };
    analyticData.todosProjetos = [];
}

/**
 * Função para processar contadores e categorizar projetos
 */
function processProjectCounters(projetoObj, statusProcesso, tipo, orcamento, area) {
    // Não processar projetos cancelados ou sem tipo válido
    if (statusProcesso === 'CANCELADO ❌' || (tipo !== '🛒 Aquisição' && tipo !== '🔄 Renovação')) {
        return; // Pular este projeto completamente
    }
    // Registrar projeto na lista completa (para análises que precisam de todos os projetos elegíveis independentemente de ter status contabilizado)
    analyticData.todosProjetos.push(projetoObj);
      // Contar status
    if (statusProcesso) {
        analyticData.statusCounts[statusProcesso] = (analyticData.statusCounts[statusProcesso] || 0) + 1;
        
        // Adicionar projeto ao array de projetos por status
        if (!analyticData.projetosPorStatus[statusProcesso]) {
            analyticData.projetosPorStatus[statusProcesso] = [];
        }
        analyticData.projetosPorStatus[statusProcesso].push({
            id: projetoObj.idPca,
            area: projetoObj.area,
            objeto: projetoObj.projeto,
            contratar_ate: projetoObj.dataProcesso,
            valor: projetoObj.valor,
            numeroProcesso: projetoObj.numProcesso,
            numeroContrato: projetoObj.numeroContrato,
            numeroRegistro: projetoObj.numeroRegistro,
            modalidadeX: projetoObj.modalidadeX,
            numeroY: projetoObj.numeroY
        });
        
        analyticData.situacional.total++;
    }
    
    // Contar tipos (Aquisição/Renovação)
    if (tipo === '🛒 Aquisição') {
        analyticData.tipoCounts["🛒 Aquisição"]++;
        analyticData.projetosPorTipo["🛒 Aquisição"].push({
            id: projetoObj.idPca,
            area: projetoObj.area,
            objeto: projetoObj.projeto,
            contratar_ate: projetoObj.dataProcesso,
            valor: projetoObj.valor,
            numeroProcesso: projetoObj.numProcesso,
            numeroContrato: projetoObj.numeroContrato,
            numeroRegistro: projetoObj.numeroRegistro,
            modalidadeX: projetoObj.modalidadeX,
            numeroY: projetoObj.numeroY
        });
    } else if (tipo === '🔄 Renovação') {
        analyticData.tipoCounts["🔄 Renovação"]++;
        analyticData.projetosPorTipo["🔄 Renovação"].push({
            id: projetoObj.idPca,
            area: projetoObj.area,
            objeto: projetoObj.projeto,
            contratar_ate: projetoObj.dataProcesso,
            valor: projetoObj.valor,
            numeroProcesso: projetoObj.numProcesso,
            numeroContrato: projetoObj.numeroContrato,
            numeroRegistro: projetoObj.numeroRegistro,
            modalidadeX: projetoObj.modalidadeX,
            numeroY: projetoObj.numeroY
        });
    }
    
    // Calcular valores totais por orçamento e tipo
    if (orcamento.includes('CUSTEIO')) {
        analyticData.valorTotal.custeio += projetoObj.valor;
        analyticData.projetosPorCategoria.custeio.push(projetoObj);
        
        if (tipo === '🛒 Aquisição') {
            analyticData.valorTotal.custoAquisicao += projetoObj.valor;
            analyticData.projetosPorCategoria.custoAquisicao.push(projetoObj);
        } else if (tipo === '🔄 Renovação') {
            analyticData.valorTotal.custoRenovacao += projetoObj.valor;
            analyticData.projetosPorCategoria.custoRenovacao.push(projetoObj);
        }
    } else if (orcamento.includes('INVESTIMENTO')) {
        analyticData.valorTotal.investimento += projetoObj.valor;
        analyticData.projetosPorCategoria.investimento.push(projetoObj);
        
        if (tipo === '🛒 Aquisição') {
            analyticData.valorTotal.investimentoAquisicao += projetoObj.valor;
            analyticData.projetosPorCategoria.investimentoAquisicao.push(projetoObj);
        } else if (tipo === '🔄 Renovação') {
            analyticData.valorTotal.investimentoRenovacao += projetoObj.valor;
            analyticData.projetosPorCategoria.investimentoRenovacao.push(projetoObj);
        }
    }
    
    // Contagem por área e adição à lista de projetos da área
    if (area) {
        if (!analyticData.areaCounts[area]) {
            analyticData.areaCounts[area] = {
                "🛒 Aquisição": 0,
                "🔄 Renovação": 0,
                total: 0
            };
        }
        if (!analyticData.projetosPorArea[area]) {
            analyticData.projetosPorArea[area] = [];
        }

        if (projetoObj.tipo === '🛒 Aquisição') {
            analyticData.areaCounts[area]["🛒 Aquisição"]++;
            analyticData.projetosPorArea[area].push(projetoObj);
        } else if (projetoObj.tipo === '🔄 Renovação') {
            analyticData.areaCounts[area]["🔄 Renovação"]++;
            analyticData.projetosPorArea[area].push(projetoObj);
        }
        analyticData.areaCounts[area].total++;
    }
}

/**
 * Função para classificar projetos por situação
 */
function classifyProjectBySituation(projetoObj, statusProcesso, area) {
    // Não processar projetos cancelados ou sem tipo válido
    if (statusProcesso === 'CANCELADO ❌' || (projetoObj.tipo !== '🛒 Aquisição' && projetoObj.tipo !== '🔄 Renovação')) {
        return; // Pular este projeto completamente
    }
    
    // Contratação fora da STI
    if (statusProcesso === 'EM CONTRATAÇÃO 🤝' || statusProcesso === 'EM RENOVAÇÃO 🔄') {
        analyticData.situacional.contratacaoForaSTI++;
        analyticData.projetosPorSituacao.contratacaoForaSTI.push(projetoObj);
    }
    
    // Autuação atrasada
    if (statusProcesso.includes('AUTUAÇÃO ATRASADA')) {
        analyticData.situacional.autuacaoAtrasada++;
        analyticData.projetosPorSituacao.autuacaoAtrasada.push(projetoObj);
    }
    
    // Elaboração interna de artefatos
    if (
        statusProcesso.includes('DFD ATRASADO') ||
        statusProcesso.includes('ETP ATRASADO') ||
        statusProcesso.includes('AGUARDANDO ETP') ||
        statusProcesso.includes('ELABORANDO TR') ||
        statusProcesso.includes('ANÁLISE DE VIABILIDADE') ||
        statusProcesso.includes('AGUARDANDO DFD')
    ) {
        analyticData.situacional.elaboracaoInterna++;
        analyticData.projetosPorSituacao.elaboracaoInterna.push(projetoObj);
    }
      // Contratação atrasada fora da STI
    if (statusProcesso.includes('CONTRATAÇÃO ATRASADA')) {
        analyticData.situacional.contratacaoAtrasadaForaSTI++;
        analyticData.projetosPorSituacao.contratacaoAtrasadaForaSTI.push(projetoObj);
    }
    
    // Processos concluídos
    if (statusProcesso.includes('CONTRATADO') || statusProcesso.includes('RENOVADO')) {
        analyticData.situacional.processosConcluidos++;
        analyticData.projetosPorSituacao.processosConcluidos.push(projetoObj);
    }
    
    // Processos suspensos
    if (statusProcesso.includes('REVISÃO PCA')) {
        analyticData.situacional.processosSuspensos++;
        analyticData.projetosPorSituacao.processosSuspensos.push(projetoObj);
    }
    
    // Processos a iniciar
    if (statusProcesso.includes('A INICIAR')) {
        analyticData.situacional.processosAIniciar++;
        analyticData.projetosPorSituacao.processosAIniciar.push(projetoObj);
    }
}

/**
 * Função auxiliar para formatar valores monetários
 * @param {number} value Valor a ser formatado
 * @returns {string} Valor formatado como moeda
 */
function formatCurrency(value) {
    // Verifica se o valor é um número antes de formatar
    if (typeof value !== 'number') {
        return value; // Retorna o valor original se não for um número
    }
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2, // Mantém no mínimo 2 casas decimais
        // Removido maximumFractionDigits para permitir mais casas decimais se necessário
    });
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initAnalytics);

// Função para recarregar dados analíticos dinamicamente ao mudar de ano
window.reloadAnalyticsForYear = function(newYear) {
    try {
        // Atualiza armazenamento e config global se existir
        localStorage.setItem('selectedYear', newYear);
        if (window.yearSelectorConfig) {
            window.yearSelectorConfig.currentYear = newYear;
        }
        // Atualizar título e header da página analítica
        const title = document.querySelector('title');
        if (title) {
            title.textContent = title.textContent.replace(/(2025|2026)/, newYear);
        }
        const header = document.querySelector('h1');
        if (header && header.textContent.includes('Relatório Analítico')) {
            header.textContent = header.textContent.replace(/(2025|2026)/, newYear);
        }
        // Limpa o dashboard antes de recarregar
        const container = document.getElementById('analytics-dashboard');
        if (container) container.innerHTML = '';
        // Reexecuta pipeline
        initAnalytics();
    } catch (e) {
        console.error('Erro ao recarregar analytics para ano', newYear, e);
    }
};