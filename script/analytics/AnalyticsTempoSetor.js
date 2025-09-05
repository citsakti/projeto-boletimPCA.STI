/**
 * AnalyticsTempoSetor.js - Sistema de exibição de tempo no setor para projetos
 * 
 * Este script é responsável por:
 *  - Renderizar tags com o tempo que cada processo está no setor atual
 *  - Calcular dias baseado na data de último encaminhamento da API TCE-CE
 *  - Aplicar estilização apropriada seguindo padrão do AnalyticsDiasAtraso.js
 *  - Integrar com dados da API de processos do AcompanhamentoProcessos.js
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Funções Principais:
 *   - renderTempoSetorTag(): Cria a tag visual com o tempo no setor
 *   - calcularDiasNoSetor(): Calcula dias desde último encaminhamento
 *   - buscarDadosTempoSetor(): Busca dados da API para cálculo de tempo
 * 
 * # Integração:
 *   - Utiliza API https://api-processos.tce.ce.gov.br/processos/porLista
 *   - Reutiliza cache do AcompanhamentoProcessos.js quando possível
 *   - Aplica CSS consistente com AnalyticsDiasAtraso.js
 * 
 * # Dependências:
 *   - AnalyticsProcessosPorSetor.js para integração na seção 3.2
 *   - AcompanhamentoProcessos.js para lógica de API e cache
 *   - AnalyticsDiasAtraso.js para padrão de estilização
 */

// Configurações da API
const API_TEMPO_SETOR_URL = "https://api-processos.tce.ce.gov.br/processos/porLista";
const MAX_PROCESSOS_POR_LOTE = 10;

// Cache local para dados de tempo no setor
const cacheTempoSetor = new Map(); // numero -> { setor, diasNoSetor, dtUltimoEncaminhamento }

/**
 * Hidrata (preenche) o cache de tempo a partir do cache já obtido em AnalyticsProcessosPorSetor.js
 * Evita nova requisição à API e acelera a renderização.
 * @param {Array<string>} [numerosFiltro] - Opcional: lista de números a processar; se ausente, processa todos.
 */
function hidratarTempoSetorDeApiCache(numerosFiltro) {
    const fonte = window.apiCacheSetores;
    if (!fonte || !(fonte instanceof Map) || fonte.size === 0) {
        console.log('[TempoSetor] hidratarTempoSetorDeApiCache: apiCacheSetores indisponível ou vazio');
        return 0;
    }
    const usarFiltro = Array.isArray(numerosFiltro) && numerosFiltro.length > 0;
    let inseridos = 0;
    fonte.forEach((dadosProcesso, numeroChave) => {
        if (usarFiltro && !numerosFiltro.includes(numeroChave)) return; // pular não filtrados
        if (cacheTempoSetor.has(numeroChave)) return; // já existe
        const dtUltimoEnc = dadosProcesso.dtUltimoEncaminhamento || null; // NÃO usar dtAutuacao
        let diasNoSetor = null;
        if (dtUltimoEnc) diasNoSetor = calcularDiasNoSetor(dtUltimoEnc);
        cacheTempoSetor.set(numeroChave, {
            setor: dadosProcesso.setor?.descricao || null,
            diasNoSetor,
            dtUltimoEncaminhamento: dtUltimoEnc,
            dadosCompletos: dadosProcesso
        });
        inseridos++;
    });
    console.log(`[TempoSetor] Hidratação concluída via apiCacheSetores: +${inseridos} itens (total agora ${cacheTempoSetor.size})`);
    return inseridos;
}

/**
 * Renderiza uma tag com o tempo no setor para um processo
 * @param {number} diasNoSetor - Número de dias no setor atual
 * @param {string} setorNome - Nome do setor (opcional para tooltip)
 * @returns {string} - HTML da tag formatada
 */
function renderTempoSetorTag(diasNoSetor, setorNome = '') {
    if (diasNoSetor === null || diasNoSetor === undefined || diasNoSetor < 0) {
        return '';
    }
    
    const isHoje = diasNoSetor === 0;
    const plural = diasNoSetor === 1 ? 'dia' : 'dias';
    const textoTag = isHoje ? 'Hoje' : `${diasNoSetor} ${plural}`;
    const tooltip = setorNome
        ? (isHoje ? `Processo chegou hoje ao setor "${setorNome}"` : `Processo está no setor "${setorNome}" há ${textoTag}`)
        : (isHoje ? 'Hoje no setor atual' : `Há ${textoTag} no setor atual`);
    
    return `<span class="tempo-setor-tag" title="${tooltip}">${textoTag}</span>`;
}

/**
 * Calcula diferença em dias entre hoje e a data de último encaminhamento
 * @param {string} dataStr - Data no formato dd/mm/aaaa
 * @returns {number|null} - Número de dias ou null se inválida
 */
function calcularDiasNoSetor(dataStr) {
    // Somente usar dtUltimoEncaminhamento (não usar dtAutuacao como fallback)
    if (!dataStr) return null;

    let dataEncaminhamento = null;

    // dd/mm/aaaa
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
        const [d, m, a] = dataStr.split('/').map(Number);
        dataEncaminhamento = new Date(a, m - 1, d, 0, 0, 0, 0);
    } else if (/^\d{4}-\d{2}-\d{2}/.test(dataStr)) {
        // formato ISO (defensivo)
        dataEncaminhamento = new Date(dataStr.substring(0,10) + 'T00:00:00');
    } else {
        return null; // formato não suportado
    }

    if (isNaN(dataEncaminhamento.getTime())) return null;

    const hoje = new Date();
    const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const diferenca = hojeSemHora - dataEncaminhamento;
    return Math.max(0, Math.floor(diferenca / 86400000));
}

/**
 * Normaliza número do processo removendo caracteres especiais
 * @param {string} numeroProcesso - Número bruto do processo
 * @returns {string} - Número normalizado
 */
function normalizarNumeroProcesso(numeroProcesso) {
    if (!numeroProcesso) return '';
    // Padrão unificado: remover tudo exceto dígitos, barra e hífen (SEM ponto) para casar com AnalyticsProcessosPorSetor
    return String(numeroProcesso).replace(/[^0-9/-]/g, '').trim();
}

// Harmoniza chaves já existentes no cache (caso tenham sido salvas com ponto previamente)
function harmonizarCacheTempoSetor() {
    const paraMover = [];
    for (const key of cacheTempoSetor.keys()) {
        const normalizado = normalizarNumeroProcesso(key);
        if (normalizado && normalizado !== key && !cacheTempoSetor.has(normalizado)) {
            paraMover.push([key, normalizado]);
        }
    }
    paraMover.forEach(([antigo, novo]) => {
        cacheTempoSetor.set(novo, cacheTempoSetor.get(antigo));
        cacheTempoSetor.delete(antigo);
    });
    if (paraMover.length) {
        console.log(`[TempoSetor] Harmonizadas ${paraMover.length} chaves do cache (remoção de pontos).`);
    }
}

/**
 * Busca dados de tempo no setor via API para múltiplos processos
 * @param {Array<string>} numerosProcessos - Lista de números de processos
 * @returns {Promise<void>}
 */
async function buscarDadosTempoSetor(numerosProcessos) {
    console.log('[TempoSetor] buscarDadosTempoSetor iniciada');
    console.log(`[TempoSetor] Recebidos ${numerosProcessos?.length || 0} processos:`, numerosProcessos?.slice(0, 5));
    
    if (!numerosProcessos || numerosProcessos.length === 0) {
        console.log('[TempoSetor] Lista de processos vazia');
        return;
    }
    
    // 1) Tentar hidratar via cache existente de processos (mais rápido)
    harmonizarCacheTempoSetor();
    const antes = cacheTempoSetor.size;
    hidratarTempoSetorDeApiCache(numerosProcessos.map(n => normalizarNumeroProcesso(n)));
    const apos = cacheTempoSetor.size;
    const novos = apos - antes;
    console.log(`[TempoSetor] Hidratação inicial reutilizando apiCacheSetores adicionou ${novos} itens`);

    // Filtrar apenas números que ainda não entraram no cache
    const numerosFaltantes = numerosProcessos.filter(numero => !cacheTempoSetor.has(normalizarNumeroProcesso(numero)));
    console.log(`[TempoSetor] Restam ${numerosFaltantes.length} processos sem dados de tempo (origem hidratação vs API)`);

    // 2) Caso ainda faltem e não exista apiCache para eles (edge), fazer fallback para API
    if (numerosFaltantes.length === 0) {
        console.log('[TempoSetor] Nenhuma chamada adicional à API necessária');
        return;
    }

    console.log(`[TempoSetor] Fallback: buscando via API ${numerosFaltantes.length} processos`);
    
    // Processar em lotes de 10 (limite da API)
    const lotes = [];
    for (let i = 0; i < numerosFaltantes.length; i += MAX_PROCESSOS_POR_LOTE) {
        lotes.push(numerosFaltantes.slice(i, i + MAX_PROCESSOS_POR_LOTE));
    }
    
    console.log(`[TempoSetor] Dividido em ${lotes.length} lotes`);
    
    // Processar lotes sequencialmente com delay
    for (let i = 0; i < lotes.length; i++) {
        const lote = lotes[i];
        console.log(`[TempoSetor] Processando lote ${i + 1}/${lotes.length}:`, lote);
        
        try {
            await buscarLoteTempoSetor(lote);
            console.log(`[TempoSetor] Lote ${i + 1} processado com sucesso`);
            
            // Delay entre requisições para não sobrecarregar a API
            if (i < lotes.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        } catch (error) {
            console.error(`[TempoSetor] Erro ao buscar lote ${i + 1}:`, error);
            
            // Marcar processos do lote como erro no cache
            lote.forEach(numero => {
                cacheTempoSetor.set(numero, { erro: true, setor: null, diasNoSetor: null });
            });
        }
    }
    
    console.log(`[TempoSetor] Busca concluída. Cache agora tem ${cacheTempoSetor.size} itens`);
}

/**
 * Busca um lote de processos na API
 * @param {Array<string>} numerosLote - Números do lote
 * @returns {Promise<void>}
 */
async function buscarLoteTempoSetor(numerosLote) {
    const payload = {
        numeros: numerosLote,
        filtros: {},
        pagina: 0,
        qtd: Math.min(numerosLote.length, MAX_PROCESSOS_POR_LOTE)
    };
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
        const response = await fetch(API_TEMPO_SETOR_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`[TempoSetor] Resposta da API recebida:`, data);
        console.log(`[TempoSetor] Tipo da resposta:`, typeof data);
        
        // A API retorna uma estrutura: { data: { lista: [...] } }
        const processos = data?.data?.lista || [];
        console.log(`[TempoSetor] Array de processos extraído:`, processos);
        console.log(`[TempoSetor] É array:`, Array.isArray(processos));
        console.log(`[TempoSetor] Quantidade de processos:`, processos.length);
        
        // Processar resposta e armazenar no cache
        if (Array.isArray(processos) && processos.length > 0) {
            let comDtEnc = 0;
            let semDtEnc = 0;
            processos.forEach((processoData) => {
                const numero = processoData.nrProcesso;
                if (!numero) return;
                const numeroNormalizado = normalizarNumeroProcesso(numero);
                const setorDescricao = processoData.setor?.descricao || null;
                const dtUltimoEncaminhamento = processoData.dtUltimoEncaminhamento || null;
                let diasNoSetor = null;
                if (dtUltimoEncaminhamento) {
                    diasNoSetor = calcularDiasNoSetor(dtUltimoEncaminhamento);
                    if (diasNoSetor !== null) comDtEnc++; else semDtEnc++;
                } else {
                    semDtEnc++;
                }
                cacheTempoSetor.set(numeroNormalizado, {
                    setor: setorDescricao,
                    diasNoSetor,
                    dtUltimoEncaminhamento,
                    dadosCompletos: processoData
                });
            });
            console.log(`[TempoSetor] Estatística deste lote: com dtUltimoEncaminhamento=${comDtEnc}, sem=${semDtEnc}`);
            console.log(`[TempoSetor] Cache após processamento: ${cacheTempoSetor.size} itens`);
        } else {
            console.warn('[TempoSetor] Nenhum processo encontrado na resposta da API. Estrutura esperada: data.data.lista');
        }
        
        console.log(`[TempoSetor] Lote processado com sucesso: ${numerosLote.length} processos`);
        
    } catch (error) {
        console.error('[TempoSetor] Erro na requisição:', error);
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Obtém dados de tempo no setor para um processo específico
 * @param {string} numeroProcesso - Número do processo
 * @returns {Object|null} - Dados do cache ou null se não disponível
 */
function obterDadosTempoSetor(numeroProcesso) {
    const numeroNormalizado = normalizarNumeroProcesso(numeroProcesso);
    return cacheTempoSetor.get(numeroNormalizado) || null;
}

/**
 * Renderiza tag de tempo no setor para um processo específico
 * @param {string} numeroProcesso - Número do processo
 * @returns {string} - HTML da tag ou string vazia
 */
function renderTempoSetorParaProcesso(numeroProcesso) {
    console.log(`[TempoSetor] renderTempoSetorParaProcesso chamada para processo: ${numeroProcesso}`);
    
    if (!numeroProcesso) {
        console.log('[TempoSetor] Número do processo vazio');
        return '';
    }
    
    const dados = obterDadosTempoSetor(numeroProcesso);
    console.log(`[TempoSetor] Dados obtidos para ${numeroProcesso}:`, dados);
    
    if (!dados) {
        console.log(`[TempoSetor] Nenhum dado encontrado para processo ${numeroProcesso}`);
        // Verificar cache completo para debug
        console.log(`[TempoSetor] Cache atual tem ${cacheTempoSetor.size} itens`);
        if (cacheTempoSetor.size > 0) {
            console.log('[TempoSetor] Primeiros 3 itens do cache:');
            let count = 0;
            for (const [key, value] of cacheTempoSetor.entries()) {
                if (count++ >= 3) break;
                console.log(`  ${key}:`, value);
            }
        }
        return '';
    }
    
    if (dados.erro) {
        console.log(`[TempoSetor] Dados com erro para processo ${numeroProcesso}`);
        return '';
    }
    
    const resultado = renderTempoSetorTagComClassificacao(dados.diasNoSetor, dados.setor);
    console.log(`[TempoSetor] Tag renderizada: "${resultado}"`);
    return resultado;
}

/**
 * Aplica estilização CSS para as tags de tempo no setor
 */
function applyTempoSetorStyles() {
    // Verificar se o estilo já existe
    const existingStyle = document.getElementById('tempo-setor-styles');
    if (existingStyle) return;
    
    const style = document.createElement('style');
    style.id = 'tempo-setor-styles';
    style.textContent = `
        .tempo-setor-tag {
            display: inline-block;
            background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 8px;
            border: 1px solid #117a8b;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            text-shadow: 1px 1px 1px rgba(0,0,0,0.3);
            cursor: help;
        }
        
        .tempo-setor-tag:hover {
            background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
            transform: translateY(-1px);
            box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        }
        
        .project-details-table .tempo-setor-tag {
            vertical-align: middle;
        }
        
        .setor-details .tempo-setor-tag {
            vertical-align: middle;
        }
        
        /* Variação de cores baseada no tempo */
        .tempo-setor-tag.tempo-critico {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            border-color: #bd2130;
        }
        
        .tempo-setor-tag.tempo-alerta {
            background: linear-gradient(135deg, #fd7e14 0%, #e8610e 100%);
            border-color: #dc5a00;
        }
        
        .tempo-setor-tag.tempo-atencao {
            background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
            border-color: #d39e00;
            color: #212529;
            text-shadow: none;
        }
        
        @media (max-width: 768px) {
            .tempo-setor-tag {
                font-size: 10px;
                padding: 2px 6px;
                margin-left: 4px;
            }
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Determina a classe CSS baseada no número de dias
 * @param {number} dias - Número de dias no setor
 * @returns {string} - Classe CSS adicional
 */
function getClassePorTempo(dias) {
    if (dias === null || dias === undefined) return '';
    
    if (dias >= 30) return ' tempo-critico';      // Mais de 30 dias - vermelho
    if (dias >= 15) return ' tempo-alerta';       // 15-29 dias - laranja
    if (dias >= 7) return ' tempo-atencao';       // 7-14 dias - amarelo
    return '';                                     // Menos de 7 dias - azul padrão
}

/**
 * Renderiza tag de tempo no setor com classificação por cor
 * @param {number} diasNoSetor - Número de dias no setor atual
 * @param {string} setorNome - Nome do setor (opcional para tooltip)
 * @returns {string} - HTML da tag formatada com classificação
 */
function renderTempoSetorTagComClassificacao(diasNoSetor, setorNome = '') {
    if (diasNoSetor === null || diasNoSetor === undefined || diasNoSetor < 0) {
        return '';
    }
    
    const isHoje = diasNoSetor === 0;
    const plural = diasNoSetor === 1 ? 'dia' : 'dias';
    const textoTag = isHoje ? 'Hoje' : `${diasNoSetor} ${plural}`;
    const tooltip = setorNome
        ? (isHoje ? `Processo chegou hoje ao setor "${setorNome}"` : `Processo está no setor "${setorNome}" há ${textoTag}`)
        : (isHoje ? 'Hoje no setor atual' : `Há ${textoTag} no setor atual`);
    const classeAdicional = getClassePorTempo(diasNoSetor);
    
    return `<span class="tempo-setor-tag${classeAdicional}" title="${tooltip}">${textoTag}</span>`;
}

/**
 * Inicializa estilos quando o DOM estiver carregado
 */
document.addEventListener('DOMContentLoaded', function() {
    applyTempoSetorStyles();
});

// Aplicar também quando a página de analytics for carregada
document.addEventListener('analytics-loaded', function() {
    applyTempoSetorStyles();
});

// Expor funções para uso em outros módulos
window.buscarDadosTempoSetor = buscarDadosTempoSetor;
window.renderTempoSetorParaProcesso = renderTempoSetorParaProcesso;
window.renderTempoSetorTagComClassificacao = renderTempoSetorTagComClassificacao;
window.obterDadosTempoSetor = obterDadosTempoSetor;
window.cacheTempoSetor = cacheTempoSetor;
window.testarCacheTempoSetor = testarCacheTempoSetor;
window.hidratarTempoSetorDeApiCache = hidratarTempoSetorDeApiCache;

// Função de debug para troubleshooting
window.debugTempoSetor = function() {
    console.log('=== DEBUG TEMPO SETOR ===');
    console.log('Cache size:', cacheTempoSetor.size);
    console.log('Funções disponíveis:');
    console.log('  buscarDadosTempoSetor:', typeof window.buscarDadosTempoSetor);
    console.log('  renderTempoSetorParaProcesso:', typeof window.renderTempoSetorParaProcesso);
    console.log('  renderTempoSetorTagComClassificacao:', typeof window.renderTempoSetorTagComClassificacao);
    
    if (cacheTempoSetor.size > 0) {
        console.log('Primeiros 5 itens do cache:');
        let count = 0;
        for (const [numero, dados] of cacheTempoSetor.entries()) {
            if (count++ >= 5) break;
            console.log(`  ${numero}:`, dados);
        }
    }
    
    // Testar renderização
    const primeiroProcesso = cacheTempoSetor.keys().next().value;
    if (primeiroProcesso) {
        console.log('Teste de renderização para:', primeiroProcesso);
        const resultado = window.renderTempoSetorParaProcesso(primeiroProcesso);
        console.log('Resultado:', resultado);
    }
};

// Função para testar manualmente com dados fake
window.testarTempoSetor = function() {
    console.log('🧪 [TempoSetor] Iniciando teste manual...');
    
    // Adicionar dados fake no cache para teste
    cacheTempoSetor.set('12345/2025-0', {
        setor: 'Setor de Teste',
        diasNoSetor: 15,
        dtUltimoEncaminhamento: '01/08/2025',
        dadosCompletos: { teste: true }
    });
    
    console.log('🧪 [TempoSetor] Dados fake adicionados ao cache');
    console.log('🧪 [TempoSetor] Cache size:', cacheTempoSetor.size);
    
    // Testar renderização
    const resultado = window.renderTempoSetorParaProcesso('12345/2025-0');
    console.log('🧪 [TempoSetor] Resultado do teste:', resultado);
    
    if (resultado) {
        console.log('✅ [TempoSetor] Teste bem-sucedido!');
        // Aplicar na página para visualizar
        const container = document.createElement('div');
        container.innerHTML = `<p>Teste: Status do Processo ${resultado}</p>`;
        container.style.cssText = 'position:fixed;top:10px;right:10px;background:white;border:2px solid blue;padding:10px;z-index:9999;';
        document.body.appendChild(container);
        
        setTimeout(() => {
            document.body.removeChild(container);
        }, 5000);
    } else {
        console.log('❌ [TempoSetor] Teste falhou - nenhum resultado');
    }
};

// Função para atualizar todas as tags de tempo nas tabelas existentes
window.atualizarTagsTempoSetor = function() {
    console.log('🔄 [TempoSetor] Atualizando tags de tempo nas tabelas...');
    const linhas = document.querySelectorAll('.setor-details .project-details-table tbody tr');
    console.log(`🔄 [TempoSetor] Encontradas ${linhas.length} linhas para atualizar`);
    
    if (linhas.length === 0) {
        console.log('🔄 [TempoSetor] Nenhuma linha encontrada - tabelas não expandidas ainda');
        return 0;
    }
    
    let atualizadas = 0, hits = 0, misses = 0, jaExistiam = 0;
    linhas.forEach((linha, idx) => {
        const celulaStatus = linha.children[4];
        const celulaProcesso = linha.children[8];
        if (!celulaStatus || !celulaProcesso) { 
            misses++; 
            if (idx < 2) console.log(`🔄 [TempoSetor] Linha ${idx}: células ausentes`);
            return; 
        }
        
        const textoProcesso = celulaProcesso.textContent.replace(/[🔗🛍️]/g, '').trim();
        if (!textoProcesso) { 
            misses++; 
            if (idx < 2) console.log(`🔄 [TempoSetor] Linha ${idx}: texto processo vazio`);
            return; 
        }
        
        const numeroNormalizado = normalizarNumeroProcesso(textoProcesso);
        if (!numeroNormalizado) { 
            misses++; 
            if (idx < 2) console.log(`🔄 [TempoSetor] Linha ${idx}: normalização falhou para "${textoProcesso}"`);
            return; 
        }
        
        const tagExistente = celulaStatus.querySelector('.tempo-setor-tag');
        if (tagExistente) { 
            jaExistiam++; 
            return; 
        }
        
        if (cacheTempoSetor.has(numeroNormalizado)) {
            hits++;
            const tagTempo = renderTempoSetorParaProcesso(numeroNormalizado);
            if (tagTempo) {
                celulaStatus.innerHTML += ' ' + tagTempo;
                atualizadas++;
                if (idx < 2) console.log(`🔄 [TempoSetor] Linha ${idx}: tag inserida para "${numeroNormalizado}"`);
            }
        } else {
            misses++;
            if (idx < 2) console.log(`🔄 [TempoSetor] Linha ${idx}: cache miss para "${numeroNormalizado}"`);
        }
    });
    console.log(`🔄 [TempoSetor] Resultado atualização -> inseridas: ${atualizadas}, hits: ${hits}, misses: ${misses}, já existentes: ${jaExistiam}`);
    return atualizadas;
};

// Expor a função atualizarTagsTempoSetor após sua definição
window.atualizarTagsTempoSetor = window.atualizarTagsTempoSetor;

// Sinalar que o módulo foi completamente carregado
console.log('✅ [TempoSetor] Módulo AnalyticsTempoSetor.js carregado completamente');
console.log('📋 [TempoSetor] Funções disponíveis globalmente:');
console.log('   - window.buscarDadosTempoSetor()');
console.log('   - window.renderTempoSetorParaProcesso()');
console.log('   - window.atualizarTagsTempoSetor()');
console.log('   - window.debugTempoSetor()');
console.log('   - window.testarTempoSetor()');
console.log('   - window.atualizarTagsTempoSetor()');
console.log('🔗 [TempoSetor] Módulo pronto para integração com AnalyticsProcessosPorSetor.js');

// Função de teste do cache especificamente
window.testarCacheTempoSetor = function() {
    console.log('=== TESTE CACHE TEMPO SETOR ===');
    console.log('Cache size:', cacheTempoSetor.size);
    
    // Testar adicionar item manualmente
    console.log('Testando adicionar item no cache...');
    cacheTempoSetor.set('TESTE-123', {
        setor: 'Setor Teste',
        diasNoSetor: 45,
        dtUltimoEncaminhamento: '2025-01-01',
        dadosCompletos: { numero: 'TESTE-123' }
    });
    
    console.log('Cache size após teste:', cacheTempoSetor.size);
    console.log('Item de teste recuperado:', cacheTempoSetor.get('TESTE-123'));
    
    // Limpar teste
    cacheTempoSetor.delete('TESTE-123');
    console.log('Cache size após limpeza:', cacheTempoSetor.size);
    
    // Listar todos os itens do cache
    if (cacheTempoSetor.size > 0) {
        console.log('Itens no cache:');
        for (const [key, value] of cacheTempoSetor.entries()) {
            console.log(`  ${key}:`, value);
        }
    } else {
        console.log('Cache está vazio!');
    }
};
