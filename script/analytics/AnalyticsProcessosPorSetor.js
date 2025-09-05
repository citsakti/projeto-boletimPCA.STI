/**
 * AnalyticsProcessosPorSetor.js - Funcionalidade de Processos por Setor para Analytics
 * 
 * Este script é responsável por:
 *  - Buscar dados de setor dos processos via API
 *  - Agrupar processos por setor
 *  - Renderizar a seção 3.2 Processos por Setor
 *  - Integrar com a lógica algorítmica da API de Acompanhamento de Processos
 * 
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Objetos de Dados:
 *   - processosPorSetor: Map que armazena processos agrupados por setor
 *   - setoresCounts: Contador de processos por setor
 *   - apiCache: Cache para dados da API de processos
 * 
 * # Funções Principais:
 *   - initProcessosPorSetor(): Inicia o processamento
 *   - buscarDadosSetorAPI(): Busca informações de setor via API
 *   - processarProcessosPorSetor(): Agrupa processos por setor

console.log('🔄 [ProcessosPorSetor] Carregando AnalyticsProcessosPorSetor.js...');
console.log('🔍 [ProcessosPorSetor] Verificando dependências de AnalyticsTempoSetor...');
console.log('   - window.buscarDadosTempoSetor:', typeof window.buscarDadosTempoSetor);
console.log('   - window.renderTempoSetorParaProcesso:', typeof window.renderTempoSetorParaProcesso);
 *   - renderProcessosPorSetorSection(): Renderiza a seção HTML
 *   - addProcessosPorSetorExpandListeners(): Configura event listeners
 * 
 * # Integração com API:
 *   - Utiliza a mesma lógica do AcompanhamentoProcessos.js
 *   - Faz requisições em lote para a API do TCE
 *   - Extrai informação de setor dos dados retornados
 * 
 * # Dependências:
 *   - analyticData: Objeto global com dados processados
 *   - Funções utilitárias de AcompanhamentoProcessos.js
 */

// Cache para dados da API de processos
const apiCacheSetores = new Map();
// Expor globalmente para reutilização por AnalyticsTempoSetor.js (hidratação sem nova chamada)
window.apiCacheSetores = apiCacheSetores;
const processosPorSetor = new Map();
const setoresCounts = new Map();

// Configurações de filtros para a seção 3.2
const FILTROS_SECAO_32 = {
    statusIgnorados: ['CONTRATADO ✅', 'RENOVADO ✅'],
    setoresIgnorados: ['Arquivo Virtual']
};

/**
 * Função principal para inicializar o processamento de processos por setor
 */
async function initProcessosPorSetor() {
    console.log('🚀 [ProcessosPorSetor] Iniciando processamento...');
    console.log('🚀 [ProcessosPorSetor] analyticData disponível:', typeof analyticData, analyticData);
    
    try {
        // Verificar se analyticData está disponível
        if (typeof analyticData === 'undefined' || !analyticData) {
            console.error('❌ [ProcessosPorSetor] analyticData não está disponível');
            return;
        }
        
        // Coletar números de processo do analyticData
        const numerosProcesso = coletarNumerosProcessoAnalytics();
        console.log('📊 [ProcessosPorSetor] Números coletados:', numerosProcesso.length);
        
        if (numerosProcesso.length === 0) {
            console.warn('⚠️ [ProcessosPorSetor] Nenhum número de processo encontrado - renderizando seção vazia');
            renderProcessosPorSetorSection(); // Renderizar mesmo sem dados
            return;
        }
        
        // Buscar dados de setor via API
        await buscarDadosSetorAPI(numerosProcesso);
        
        // Processar e agrupar dados por setor
        processarProcessosPorSetor();
        
        // Renderizar seção antes de inserir tags
        console.log('⏱️ [ProcessosPorSetor] Renderizando seção (antes de tempo no setor)...');
        
        // Hidratação rápida via cache já obtido (sem nova requisição)
        if (typeof window.hidratarTempoSetorDeApiCache === 'function') {
            console.log('⏱️ [ProcessosPorSetor] Hidratação inicial das tags de tempo via apiCacheSetores...');
            window.hidratarTempoSetorDeApiCache(numerosProcesso);
        }
        
        // Renderizar seção COM dados de tempo já disponíveis
        renderProcessosPorSetorSection();
        
        console.log('✅ [ProcessosPorSetor] Processamento concluído');
        
    } catch (error) {
        console.error('❌ [ProcessosPorSetor] Erro durante processamento:', error);
        console.error('❌ [ProcessosPorSetor] Stack trace:', error.stack);
        // Renderizar seção mesmo com erro
        renderProcessosPorSetorSection();
    }
}

/**
 * Coleta números de processo do analyticData
 */
function coletarNumerosProcessoAnalytics() {
    console.log('📊 [ProcessosPorSetor] Coletando números de processo...');
    console.log('📊 [ProcessosPorSetor] analyticData.projetosPorStatus:', analyticData.projetosPorStatus);
    
    const numeros = new Set();
    
    // Percorrer todos os projetos por status
    Object.entries(analyticData.projetosPorStatus || {}).forEach(([status, projetos]) => {
        // Ignorar status concluídos
        if (FILTROS_SECAO_32.statusIgnorados.includes(status)) {
            console.log(`📊 [ProcessosPorSetor] Ignorando status: ${status} (${projetos.length} projetos)`);
            return;
        }
        
        console.log(`📊 [ProcessosPorSetor] Processando status ${status}: ${projetos.length} projetos`);
        
        projetos.forEach((projeto, index) => {
            if (index < 3) { // Log apenas os primeiros 3 para debug
                console.log(`📊 [ProcessosPorSetor] Projeto ${index + 1}:`, projeto);
            }
            
            if (projeto.numeroProcesso && projeto.numeroProcesso.trim()) {
                const numeroLimpo = projeto.numeroProcesso.replace(/[^\d/-]/g, '').trim();
                if (numeroLimpo) {
                    numeros.add(numeroLimpo);
                }
            }
        });
    });
    
    const numerosArray = Array.from(numeros);
    console.log(`📊 [ProcessosPorSetor] Coletados ${numerosArray.length} números únicos de processo (excluindo processos concluídos)`);
    console.log('📊 [ProcessosPorSetor] Primeiros 5 números:', numerosArray.slice(0, 5));
    
    return numerosArray;
}

/**
 * Busca dados de setor via API utilizando a mesma lógica do AcompanhamentoProcessos.js
 */
async function buscarDadosSetorAPI(numerosProcesso) {
    const API_URL = "https://api-processos.tce.ce.gov.br/processos/porLista";
    const MAX_POR_LOTE = 10;
    
    // Dividir em lotes
    const lotes = [];
    for (let i = 0; i < numerosProcesso.length; i += MAX_POR_LOTE) {
        lotes.push(numerosProcesso.slice(i, i + MAX_POR_LOTE));
    }
    
    console.log(`[ProcessosPorSetor] Processando ${lotes.length} lotes de até ${MAX_POR_LOTE} processos`);
    
    for (let i = 0; i < lotes.length; i++) {
        const lote = lotes[i];
        
        try {
            const payload = {
                numeros: lote,
                filtros: {},
                pagina: 0,
                qtd: Math.min(lote.length, 10)
            };
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            
            clearTimeout(timeout);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }
            
            const dados = await response.json();
            
            // Processar resposta da API (mesma lógica do AcompanhamentoProcessos.js)
            let lista = [];
            if (Array.isArray(dados)) {
                lista = dados;
            } else if (dados && typeof dados === 'object') {
                if (dados.data) {
                    if (Array.isArray(dados.data)) {
                        lista = dados.data;
                    } else if (typeof dados.data === 'object') {
                        const subChaves = ['lista', 'content', 'items', 'result', 'processos', 'registros'];
                        for (const k of subChaves) {
                            if (Array.isArray(dados.data[k])) {
                                lista = dados.data[k];
                                break;
                            }
                        }
                        if (!lista.length) {
                            Object.values(dados.data).forEach(v => {
                                if (v && typeof v === 'object' && (v.nrProcesso || v.numero)) {
                                    lista.push(v);
                                }
                            });
                        }
                    }
                } else {
                    const chavesPossiveis = ['conteudo', 'content', 'items', 'result', 'processos', 'lista', 'registros'];
                    for (const k of chavesPossiveis) {
                        if (Array.isArray(dados[k])) {
                            lista = dados[k];
                            break;
                        }
                    }
                    if (!lista.length) {
                        Object.values(dados).forEach(v => {
                            if (v && typeof v === 'object' && (v.nrProcesso || v.numero)) {
                                lista.push(v);
                            }
                        });
                    }
                }
            }
            
            // Armazenar dados no cache
            lista.forEach(item => {
                const numeroProcesso = item.nrProcesso || item.numero;
                if (item && numeroProcesso) {
                    const numeroNormalizado = normalizarNumeroProcesso(numeroProcesso);
                    apiCacheSetores.set(numeroNormalizado, item);
                }
            });
            
            console.log(`[ProcessosPorSetor] Lote ${i + 1}/${lotes.length} processado: ${lista.length} processos encontrados`);
            
            // Delay entre requisições
            if (i < lotes.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
        } catch (error) {
            console.error(`[ProcessosPorSetor] Erro no lote ${i + 1}/${lotes.length}:`, error);
        }
    }
    
    console.log(`[ProcessosPorSetor] Cache preenchido com ${apiCacheSetores.size} processos`);
}

/**
 * Normaliza número de processo para busca no cache
 */
function normalizarNumeroProcesso(numeroRaw) {
    return String(numeroRaw || '')
        .replace(/[^\d/-]/g, '')
        .trim();
}

/**
 * Processa e agrupa projetos por setor
 */
function processarProcessosPorSetor() {
    console.log('[ProcessosPorSetor] Agrupando projetos por setor...');
    
    // Limpar dados anteriores
    processosPorSetor.clear();
    setoresCounts.clear();
    
    // Percorrer todos os projetos e associar com dados da API
    Object.entries(analyticData.projetosPorStatus || {}).forEach(([status, projetos]) => {
        // Ignorar status concluídos
        if (FILTROS_SECAO_32.statusIgnorados.includes(status)) {
            console.log(`[ProcessosPorSetor] Ignorando status: ${status}`);
            return;
        }
        
        projetos.forEach(projeto => {
            if (projeto.numeroProcesso && projeto.numeroProcesso.trim()) {
                const numeroNormalizado = normalizarNumeroProcesso(projeto.numeroProcesso);
                const dadosAPI = apiCacheSetores.get(numeroNormalizado);
                
                const setorDescricao = dadosAPI?.setor?.descricao || 'Setor não identificado';
                
                // Ignorar setores específicos
                if (FILTROS_SECAO_32.setoresIgnorados.includes(setorDescricao)) {
                    console.log(`[ProcessosPorSetor] Ignorando setor: ${setorDescricao}`);
                    return;
                }
                
                // Inicializar setor se não existir
                if (!processosPorSetor.has(setorDescricao)) {
                    processosPorSetor.set(setorDescricao, []);
                    setoresCounts.set(setorDescricao, 0);
                }
                
                // Enriquecer dados do projeto com informações adicionais
                const projetoEnriquecido = {
                    ...projeto,
                    status: status,
                    setorInfo: dadosAPI?.setor || null,
                    // Tentar inferir tipo se não disponível
                    tipo: inferirTipoProjeto(projeto, status),
                    // Tentar inferir orçamento
                    orcamento: inferirOrcamentoProjeto(projeto, status)
                };
                
                // Adicionar projeto ao setor
                processosPorSetor.get(setorDescricao).push(projetoEnriquecido);
                
                // Incrementar contador
                setoresCounts.set(setorDescricao, setoresCounts.get(setorDescricao) + 1);
            }
        });
    });
    
    console.log(`[ProcessosPorSetor] Agrupamento concluído: ${setoresCounts.size} setores identificados (excluindo setores irrelevantes)`);
    
    // Log dos filtros aplicados
    console.log(`[ProcessosPorSetor] Filtros aplicados - Status ignorados: ${FILTROS_SECAO_32.statusIgnorados.join(', ')}`);
    console.log(`[ProcessosPorSetor] Filtros aplicados - Setores ignorados: ${FILTROS_SECAO_32.setoresIgnorados.join(', ')}`);
    
    // Ordenar setores por quantidade de processos (decrescente)
    const setoresOrdenados = Array.from(setoresCounts.entries())
        .sort((a, b) => b[1] - a[1]);
    
    console.log('[ProcessosPorSetor] Top 5 setores:', setoresOrdenados.slice(0, 5));
}

/**
 * Infere o tipo do projeto baseado em dados disponíveis
 */
function inferirTipoProjeto(projeto, status) {
    // Se já tem tipo definido, usar ele
    if (projeto.tipo) return projeto.tipo;
    
    // Inferir do status
    if (status && status.includes('RENOVAÇÃO') || status.includes('RENOVADO')) return '🔄 Renovação';
    if (status && (status.includes('CONTRATAÇÃO') || status.includes('CONTRATADO'))) return '🛒 Aquisição';
    
    // Inferir do nome do projeto ou objeto
    const objeto = (projeto.objeto || '').toLowerCase();
    if (objeto.includes('renovação') || objeto.includes('renovar')) return '🔄 Renovação';
    
    // Default para aquisição
    return '🛒 Aquisição';
}

/**
 * Infere o orçamento do projeto baseado em dados disponíveis
 */
function inferirOrcamentoProjeto(projeto, status) {
    // Tentar buscar em dados categorizados do analytics
    for (const [categoria, projetos] of Object.entries(analyticData.projetosPorCategoria || {})) {
        if (projetos.some(p => p.idPca === projeto.id || p.numProcesso === projeto.numeroProcesso)) {
            if (categoria.includes('custeio') || categoria === 'custeio') return 'CUSTEIO 💳';
            if (categoria.includes('investimento') || categoria === 'investimento') return 'INVESTIMENTO 💵';
        }
    }
    
    // Inferir do valor (valores maiores tendem a ser investimento)
    const valor = parseFloat(projeto.valor || 0);
    if (valor > 100000) return 'INVESTIMENTO 💵';
    
    // Default para custeio
    return 'CUSTEIO 💳';
}

/**
 * Renderiza a seção 3.2 Processos por Setor
 */
function renderProcessosPorSetorSection() {
    console.log('[ProcessosPorSetor] Renderizando seção...');
    
    // Buscar o container que já foi criado pelo AnalyticsRender.js
    const setoresContainer = document.getElementById('setores-container');
    if (!setoresContainer) {
        console.error('[ProcessosPorSetor] Container setores-container não encontrado');
        return;
    }
    
    // Limpar o container e adicionar o novo conteúdo
    setoresContainer.innerHTML = renderSetoresHtml();
    
    // Configurar event listeners
    addProcessosPorSetorExpandListeners();
    
    // Habilitar TableSorter para as tabelas de detalhes
    if (typeof window.enableTableSorting === 'function') {
        window.enableTableSorting(setoresContainer);
    }
    
    console.log('[ProcessosPorSetor] Seção renderizada com sucesso');
}

/**
 * Gera HTML para os setores
 */
function renderSetoresHtml() {
    if (setoresCounts.size === 0) {
        return `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                Nenhum dado de setor disponível no momento. Os dados serão carregados da API do TCE-CE.
            </div>
        `;
    }
    
    // Ordenar setores por quantidade (decrescente)
    const setoresOrdenados = Array.from(setoresCounts.entries())
        .sort((a, b) => b[1] - a[1]);
    
    return setoresOrdenados.map(([setor, quantidade], index) => {
        const setorId = `setor-${index}`;
        const setorSafe = setor.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        
        return `
            <div class="setor-box" data-setor="${setorSafe}">
                <div class="setor-header">
                    <div class="setor-info">
                        <div class="setor-nome">${setor}</div>
                        <div class="setor-count">${quantidade} Processo${quantidade !== 1 ? 's' : ''}</div>
                    </div>
                    <button class="btn btn-outline-primary btn-sm setor-expand-btn" 
                            data-setor="${setorSafe}" 
                            data-setor-nome="${setor}">
                        <i class="bi bi-chevron-down"></i> Expandir
                    </button>
                </div>
                <div class="setor-details" id="setor-details-${setorSafe}" style="display: none;">
                    <div class="card mt-2">
                        <div class="card-body">
                            <div class="table-responsive">
                                ${renderSetorProcessosTable(setor)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Gera tabela de processos para um setor específico
 */
function renderSetorProcessosTable(setor) {
    const projetos = processosPorSetor.get(setor) || [];
    
    if (projetos.length === 0) {
        return '<div class="alert alert-warning">Nenhum processo encontrado para este setor.</div>';
    }
    
    return `
        <table class="table table-striped table-hover project-details-table">
            <thead class="table-dark">
                <tr>
                    <th>ID PCA</th>
                    <th>Área</th>
                    <th>Tipo</th>
                    <th>Projeto</th>
                    <th>Status do Processo</th>
                    <th>Contratar Até</th>
                    <th>Valor PCA</th>
                    <th>Orçamento</th>
                    <th>Número do Processo</th>
                </tr>
            </thead>
            <tbody>
                ${projetos.map(projeto => renderSetorProcessoRow(projeto)).join('')}
            </tbody>
        </table>
    `;
}

/**
 * Renderiza uma linha da tabela de processos do setor
 */
function renderSetorProcessoRow(projeto) {
    return `
        <tr>
            <td><span class="badge bg-primary">${projeto.id || ''}</span></td>
            <td>${formatAreaWithClasses(projeto.area || '')}</td>
            <td><span class="tipo-badge">${getTipoFromProject(projeto) || ''}</span></td>
            <td class="projeto-cell" style="font-weight: bold;">${projeto.objeto || ''}</td>
            <td>${formatStatusComTempoSetor(projeto.status || '', projeto.numeroProcesso || '')}</td>
            <td>${formatDateCell(projeto.contratar_ate) || ''}</td>
            <td class="text-end"><strong>${formatCurrencyValue(projeto.valor || 0)}</strong></td>
            <td>${formatOrcamentoWithClasses(getOrcamentoFromProject(projeto) || '')}</td>
            <td>${renderProcessoCell(projeto)}</td>
        </tr>
    `;
}

/**
 * Função para aplicar estilo de área seguindo padrão das outras seções
 */
function formatAreaWithClasses(area) {
    const areaClass = getAreaClass(area);
    if (areaClass && areaClass !== 'area-geral') {
        return `<span class="${areaClass}-highlight">${area}</span>`;
    }
    return area;
}

/**
 * Função para aplicar estilo de status seguindo padrão das outras seções
 */
function formatStatusWithClasses(status) {
    const statusClass = getStatusClass(status);
    if (statusClass && statusClass !== 'status-secondary') {
        return `<span class="${statusClass}-highlight">${status}</span>`;
    }
    return status;
}

/**
 * Função para renderizar status com tag de tempo no setor
 */
function formatStatusComTempoSetor(status, numeroProcesso) {
    console.log(`[ProcessosPorSetor] formatStatusComTempoSetor chamada - Status: ${status}, Processo: ${numeroProcesso}`);
    
    const statusFormatado = formatStatusWithClasses(status);
    console.log(`[ProcessosPorSetor] Status formatado: ${statusFormatado}`);
    
    // Renderizar tag de tempo diretamente durante criação da linha
    if (typeof window.renderTempoSetorParaProcesso === 'function' && numeroProcesso) {
        const tagTempo = window.renderTempoSetorParaProcesso(numeroProcesso);
        console.log(`[ProcessosPorSetor] Tag tempo retornada: "${tagTempo}"`);
        if (tagTempo) {
            const resultado = `${statusFormatado} ${tagTempo}`;
            console.log(`[ProcessosPorSetor] Resultado final: ${resultado}`);
            return resultado;
        }
    } else {
        console.warn('[ProcessosPorSetor] window.renderTempoSetorParaProcesso não está disponível ou processo vazio');
    }
    
    return statusFormatado;
}

/**
 * Função para aplicar estilo de orçamento seguindo padrão das outras seções
 */
function formatOrcamentoWithClasses(orcamento) {
    const orcamentoLower = (orcamento || '').toLowerCase();
    if (orcamentoLower.includes('investimento')) {
        return `<span class="orcamento-investimento-highlight">${orcamento}</span>`;
    }
    if (orcamentoLower.includes('custeio')) {
        return `<span class="orcamento-custeio-highlight">${orcamento}</span>`;
    }
    return orcamento;
}

/**
 * Renderiza célula de processo com funcionalidades de link (🔗 e 🛍️)
 */
function renderProcessoCell(projeto) {
    const numeroProcesso = projeto.numeroProcesso;
    
    if (!numeroProcesso || numeroProcesso.trim() === '' || numeroProcesso === '-') {
        return '<span class="text-muted">-</span>';
    }
    
    // Buscar dados da API para informações do Comprasgov
    const numeroNormalizado = normalizarNumeroProcesso(numeroProcesso);
    const dadosAPI = apiCacheSetores.get(numeroNormalizado);
    
    // Tentar obter modalidade e número do Comprasgov de diferentes fontes
    const modalidadeX = dadosAPI?.modalidade || projeto.modalidade || projeto.tipo || '';
    const numeroY = dadosAPI?.numeroComprasgov || projeto.numeroY || projeto.numeroComprasgov || '';
    
    // Montar célula base com ícone 🔗
    let html = `${numeroProcesso} <span class="processo-link-icon" title="Abrir processo">🔗</span>`;
    
    // Adicionar ícone 🛍️ se houver número do Comprasgov
    if (numeroY && numeroY.trim() !== '' && numeroY.trim() !== '-') {
        const x = modalidadeX.toString().trim();
        const y = numeroY.toString().trim();
        html += ` <span class="comprasgov-link-icon" title="Abrir acompanhamento no Comprasnet" data-x="${x}" data-y="${y}">🛍️</span>`;
    }
    
    return html;
}

/**
 * Formata valor monetário seguindo padrão do projeto
 */
function formatCurrencyValue(valor) {
    if (!valor || valor === 0) return 'R$ 0,00';
    
    const number = parseFloat(valor);
    if (isNaN(number)) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(number);
}

/**
 * Funções auxiliares para formatação
 */
function getTipoFromProject(projeto) {
    return projeto.tipo || 'Não identificado';
}

function getOrcamentoFromProject(projeto) {
    return projeto.orcamento || 'A definir';
}

function getAreaClass(area) {
    // Seguir o mesmo padrão das outras seções (MobileCardsStyles.js)
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
    const areaLower = (area || '').toLowerCase();
    if (areaLower.includes('sti')) return 'area-sti';
    if (areaLower.includes('operações') || areaLower.includes('operacoes')) return 'area-operacoes';
    if (areaLower.includes('dev')) return 'area-dev';
    if (areaLower.includes('analytics')) return 'area-analytics';
    if (areaLower.includes('governança') || areaLower.includes('governanca')) return 'area-governanca';
    
    return 'area-geral'; // Classe padrão caso nenhuma corresponda
}

function getStatusClass(status) {
    // Seguir o mesmo padrão das outras seções (MobileCardsStyles.js)
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

    // Procurar por correspondência exata primeiro
    if (statusMap[status]) {
        return statusMap[status];
    }
    
    // Fallback para correspondência parcial
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('atrasad')) return 'status-danger';
    if (statusLower.includes('contratado') || statusLower.includes('renovado')) return 'status-success';
    if (statusLower.includes('aguardando')) return 'status-warning';
    if (statusLower.includes('em ')) return 'status-info';
    
    return 'status-secondary';
}

function getOrcamentoClass(projeto) {
    const orcamento = (projeto.orcamento || '').toLowerCase();
    
    // Mapear baseado no padrão do Orcamento.css
    if (orcamento.includes('investimento')) return 'orcamento-investimento';
    if (orcamento.includes('custeio')) return 'orcamento-custeio';
    
    return 'orcamento-default';
}

function formatDateCell(date) {
    if (!date) return '';
    try {
        // Tentar diferentes formatos de data
        const dataObj = new Date(date);
        if (!isNaN(dataObj.getTime())) {
            return dataObj.toLocaleDateString('pt-BR');
        }
        
        // Se não conseguir parsear, retornar como string
        return String(date);
    } catch {
        return String(date);
    }
}

/**
 * Configura event listeners para expansão/contração dos setores
 */
function addProcessosPorSetorExpandListeners() {
    document.querySelectorAll('.setor-expand-btn').forEach(button => {
        button.addEventListener('click', function() {
            const setorSafe = this.dataset.setor;
            const setorNome = this.dataset.setorNome;
            const detailsDiv = document.getElementById(`setor-details-${setorSafe}`);
            const icon = this.querySelector('i');
            
            if (detailsDiv.style.display === 'none') {
                detailsDiv.style.display = 'block';
                icon.className = 'bi bi-chevron-up';
                this.innerHTML = '<i class="bi bi-chevron-up"></i> Recolher';
                
                // Habilitar TableSorter para a tabela recém-expandida
                if (typeof window.enableTableSorting === 'function') {
                    window.enableTableSorting(detailsDiv);
                }
                
                console.log(`[ProcessosPorSetor] Expandindo setor: ${setorNome}`);
            } else {
                detailsDiv.style.display = 'none';
                icon.className = 'bi bi-chevron-down';
                this.innerHTML = '<i class="bi bi-chevron-down"></i> Expandir';
                console.log(`[ProcessosPorSetor] Recolhendo setor: ${setorNome}`);
            }
        });
    });
}

// Exportar funções para uso global
window.initProcessosPorSetor = initProcessosPorSetor;
window.renderProcessosPorSetorSection = renderProcessosPorSetorSection;

console.log('✅ [ProcessosPorSetor] Módulo AnalyticsProcessosPorSetor.js carregado completamente');
console.log('🔗 [ProcessosPorSetor] Função initProcessosPorSetor() disponível globalmente');
console.log('🔄 [ProcessosPorSetor] Pronto para integração com AnalyticsTempoSetor.js');
