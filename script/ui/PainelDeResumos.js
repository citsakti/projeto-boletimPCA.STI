/**
 * PainelDeResumos.js - Gerenciador do painel lateral de resumo do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Contabilizar e exibir quantidades de processos por status
 *  - Contabilizar e exibir quantidades de processos por setor atual (coluna Acompanhamento)
 *  - Contabilizar e exibir quantidades de processos por tempo no setor (coluna Acompanhamento)
 *  - Gerenciar o painel lateral com estatísticas e links de filtro rápido
 *  - Permitir filtrar a tabela ao clicar em cada status, setor ou tempo do painel
 *  - Adaptar comportamento para diferentes tamanhos de tela
 *  - Manter contagens originais fixas independente dos filtros aplicados
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Componentes de Interface:
 *   - Painel lateral: Container com classe 'painel-resumo'
 *   - Botões de status: Elementos clicáveis que filtram a tabela por status
 *   - Botões de setor: Elementos clicáveis que filtram a tabela por setor atual
 *   - Botões de tempo: Elementos clicáveis que filtram a tabela por tempo no setor
 *   - Contador total: Exibe o número total de processos (sempre fixo)
 *   - Separadores visuais: Dividem as três seções do painel
 * 
 * # Funções Principais:
 *   - updatePainelResumo(): Atualiza contadores e eventos do painel
 *   - calcularContagensOriginais(): Calcula e armazena as contagens iniciais
 *   - extractStatusText(): Extrai o texto do status da célula
 *   - extractSetorText(): Extrai o setor da tag setor-processo-tag
 *   - extractTempoText(): Extrai o tempo da tag tempo-acompanhamento-tag
 *   - aplicarFiltroStatusProcesso(): Aplica filtro por status
 *   - aplicarFiltroSetor(): Aplica filtro por setor atual
 *   - aplicarFiltroTempo(): Aplica filtro por tempo no setor
 *   - resetPainelFilterStatus(): Remove filtro ativo e restaura visualização
 * 
 * # Fluxo de Execução:
 *   1. Executa ao carregar o DOM e após atualizações da tabela
 *   2. AGUARDA o evento 'acompanhamento-atualizado' do AcompanhamentoProcessos.js
 *   3. Conta ocorrências de cada status, setor e tempo APÓS os dados serem carregados da API
 *   4. Mantém contagens fixas mesmo quando filtros são aplicados
 *   5. Atualiza contadores no painel lateral e configura eventos de clique
 *   6. Em telas menores, recolhe o painel após seleção para maximizar área útil
 * 
 * # Sincronização com AcompanhamentoProcessos.js:
 *   - Escuta 'acompanhamento-atualizado': Atualização completa da tabela
 *   - Escuta 'acompanhamento-atualizado-parcial': Atualização de linha individual
 *   - Recalcula contagens sempre que novos dados são recebidos da API
 * 
 * # Adaptação Responsiva:
 *   - Em dispositivos móveis/tablets (telas até 1199px), painel é recolhido após seleção
 *   - Estado do filtro é armazenado em window.painelFilterStatus
 * 
 * # Dependências:
 *   - Estrutura esperada da tabela com status na 6ª coluna (índice 5)
 *   - Estrutura esperada da tabela com acompanhamento na 5ª coluna (índice 4)
 *   - Tags com classes 'setor-processo-tag' (criadas por AcompanhamentoProcessos.js)
 *   - Tags com classes 'tempo-acompanhamento-tag' (criadas por AcompanhamentoProcessos.js)
 *   - Elemento HTML com classe 'painel-resumo' para conter os contadores
 *   - AcompanhamentoProcessos.js deve ser carregado antes
 * 
 * # Debug:
 *   - Execute window.debugPainelResumo() no console para verificar extração de dados
 */

// Variáveis globais para armazenar as contagens originais
let originalStatusCounts = null;
let originalTotalRows = 0;
let originalSetorCounts = null;
let originalTempoCounts = null;

/**
 * Extrai o texto do setor da célula de acompanhamento
 * @param {HTMLElement} cell - Célula da tabela
 * @returns {string} - Texto do setor limpo
 */
function extractSetorText(cell) {
    if (!cell) return '';
    
    // Procura pela tag setor-processo-tag (pode ter múltiplas classes)
    const setorTag = cell.querySelector('.setor-processo-tag');
    if (setorTag) {
        // Remove espaços extras e normaliza o texto
        return setorTag.textContent.trim();
    }
    
    return '';
}

/**
 * Extrai o texto do tempo de acompanhamento da célula
 * @param {HTMLElement} cell - Célula da tabela
 * @returns {string} - Texto do tempo limpo
 */
function extractTempoText(cell) {
    if (!cell) return '';
    
    // Procura pela tag tempo-acompanhamento-tag (pode ter classe tempo-padrao ou tempo-hoje)
    const tempoTag = cell.querySelector('.tempo-acompanhamento-tag');
    if (tempoTag) {
        return tempoTag.textContent.trim();
    }
    
    return '';
}

/**
 * Extrai o texto do status da célula, ignorando tags adicionais
 * @param {HTMLElement} cell - Célula da tabela
 * @returns {string} - Texto do status limpo
 */
function extractStatusText(cell) {
    if (!cell) return '';
    
    // Primeiro tenta pegar o texto do span com classe que termina em '-highlight'
    const highlightSpan = cell.querySelector('[class$="-highlight"]');
    if (highlightSpan) {
        return highlightSpan.textContent.trim();
    }
    
    // Se não encontrar o span de highlight, pega apenas o texto antes da tag adicional
    // (ignorando elementos com classe 'status-detalhe-container')
    const detalheContainer = cell.querySelector('.status-detalhe-container');
    if (detalheContainer) {
        // Cria um clone da célula e remove o container de detalhes
        const clone = cell.cloneNode(true);
        const detalheClone = clone.querySelector('.status-detalhe-container');
        if (detalheClone) detalheClone.remove();
        return clone.textContent.trim();
    }
    
    // Fallback: retorna o texto completo da célula
    return cell.textContent.trim();
}

function calcularContagensOriginais() {
    // Seleciona todas as linhas da tabela (tbody)
    const rows = document.querySelectorAll('table tbody tr');
    const statusCounts = {};
    const setorCounts = {};
    const tempoCounts = {};

    console.log(`📊 Calculando contagens originais de ${rows.length} linhas`);

    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        
        // Considerando que "Status do Processo" é a 6ª coluna (índice 5)
        const status = extractStatusText(cells[5]);
        if (status !== '') {
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        }
        
        // Considerando que "Acompanhamento" é a 5ª coluna (índice 4)
        const setor = extractSetorText(cells[4]);
        if (setor !== '') {
            setorCounts[setor] = (setorCounts[setor] || 0) + 1;
            if (index < 3) console.log(`   Linha ${index}: Setor = "${setor}"`);
        }
        
        // Exclui processos RENOVADO ou CONTRATADO da contagem de tempo
        const statusUpper = status.toUpperCase().trim();
        // Remove caracteres especiais como ✅ e espaços extras
        const statusClean = statusUpper.replace(/[✅\s]+/g, ' ').trim();
        const isExcluido = statusClean === 'RENOVADO' || statusClean === 'CONTRATADO' || 
                          statusUpper.includes('RENOVADO') || statusUpper.includes('CONTRATADO');
        
        const tempo = extractTempoText(cells[4]);
        if (tempo !== '' && !isExcluido) {
            tempoCounts[tempo] = (tempoCounts[tempo] || 0) + 1;
            if (index < 3) console.log(`   Linha ${index}: Tempo = "${tempo}" (Status: ${status}) ✅ INCLUÍDO`);
        } else if (tempo !== '' && isExcluido) {
            if (index < 3) console.log(`   Linha ${index}: Tempo = "${tempo}" (Status: "${status}") ❌ EXCLUÍDO (RENOVADO/CONTRATADO)`);
        }
    });

    console.log(`✅ Contagens calculadas:`, {
        status: Object.keys(statusCounts).length,
        setores: Object.keys(setorCounts).length,
        tempos: Object.keys(tempoCounts).length
    });
    console.log(`📋 Setores encontrados:`, Object.keys(setorCounts));
    console.log(`⏱️ Tempos encontrados:`, Object.keys(tempoCounts));
    console.log(`⚠️ Status únicos na tabela:`, Object.keys(statusCounts));

    // Armazena as contagens originais para uso posterior
    originalStatusCounts = statusCounts;
    originalSetorCounts = setorCounts;
    originalTempoCounts = tempoCounts;
    originalTotalRows = rows.length;
    
    return { statusCounts, setorCounts, tempoCounts, totalRows: rows.length };
}

function updatePainelResumo() {
    const resumoContainer = document.querySelector('.painel-resumo');
    if (!resumoContainer) return;
    
    // Se ainda não temos as contagens originais, calcula pela primeira vez
    // ou se a tabela foi recarregada (número de linhas mudou significativamente)
    let statusCounts, setorCounts, tempoCounts, totalRows;
    if (!originalStatusCounts) {
        const dados = calcularContagensOriginais();
        statusCounts = dados.statusCounts;
        setorCounts = dados.setorCounts;
        tempoCounts = dados.tempoCounts;
        totalRows = dados.totalRows;
    } else {
        // Usa as contagens originais armazenadas (mantém os números fixos)
        statusCounts = originalStatusCounts;
        setorCounts = originalSetorCounts;
        tempoCounts = originalTempoCounts;
        totalRows = originalTotalRows;
    }    
    
    // Limpa o container
    resumoContainer.innerHTML = '';
    
    // ===== SEÇÃO 1: STATUS DO PROCESSO =====
    const statusSection = document.createElement('div');
    statusSection.className = 'painel-section status-section';
    statusSection.style.cssText = 'margin-bottom: 15px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px; background-color: #fafafa;';
    
    // Adiciona título da seção
    const statusTitle = document.createElement('div');
    statusTitle.style.cssText = 'margin-bottom: 8px; font-weight: bold; color: #fa8c16; font-size: 13px; text-align: center;';
    statusTitle.textContent = 'Por Status:';
    statusSection.appendChild(statusTitle);
    
    // Container flex para os botões de status (centralizado)
    const statusContainer = document.createElement('div');
    statusContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 5px; justify-content: center;';
    
    // Adiciona opção "TODOS"
    const todosOption = document.createElement('div');
    todosOption.className = 'status-option';
    todosOption.setAttribute('data-status', 'TODOS');
    todosOption.style.cssText = 'display: flex; flex-direction: column; align-items: center; text-align: center;';
    todosOption.innerHTML = `<span>TODOS</span><span style="font-weight: bold; margin-top: 2px;">[${totalRows}]</span>`;
    statusContainer.appendChild(todosOption);
    
    // Adiciona cada status
    for (const status in statusCounts) {
        const statusOption = document.createElement('div');
        statusOption.className = 'status-option';
        statusOption.setAttribute('data-status', status);
        statusOption.style.cssText = 'display: flex; flex-direction: column; align-items: center; text-align: center;';
        statusOption.innerHTML = `<span>${status}</span><span style="font-weight: bold; margin-top: 2px;">[${statusCounts[status]}]</span>`;
        statusContainer.appendChild(statusOption);
    }
    
    statusSection.appendChild(statusContainer);
    resumoContainer.appendChild(statusSection);
    
    // ===== SEÇÃO 2: SETORES (ORDENADO POR QUANTIDADE DECRESCENTE) =====
    if (Object.keys(setorCounts).length > 0) {
        const setorSection = document.createElement('div');
        setorSection.className = 'painel-section setor-section';
        setorSection.style.cssText = 'margin-bottom: 15px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px; background-color: #fafafa;';
        
        // Adiciona título da seção
        const setorTitle = document.createElement('div');
        setorTitle.style.cssText = 'margin-bottom: 8px; font-weight: bold; color: #1890ff; font-size: 13px; text-align: center;';
        setorTitle.textContent = 'Por Setor Atual:';
        setorSection.appendChild(setorTitle);
        
        // Container flex para os botões de setor (centralizado)
        const setorContainer = document.createElement('div');
        setorContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 5px; justify-content: center;';
        
        // Ordena setores por quantidade (maior para menor)
        const setoresOrdenados = Object.entries(setorCounts)
            .sort((a, b) => b[1] - a[1]); // Ordena decrescente pela quantidade
        
        // Adiciona cada setor em ordem
        setoresOrdenados.forEach(([setor, count]) => {
            const setorOption = document.createElement('div');
            setorOption.className = 'status-option setor-option';
            setorOption.setAttribute('data-setor', setor);
            setorOption.style.cssText = 'display: flex; flex-direction: column; align-items: center; text-align: center;';
            setorOption.innerHTML = `<span>${setor}</span><span style="font-weight: bold; margin-top: 2px;">[${count}]</span>`;
            setorContainer.appendChild(setorOption);
        });
        
        setorSection.appendChild(setorContainer);
        resumoContainer.appendChild(setorSection);
    }
    
    // ===== SEÇÃO 3: TEMPO NO SETOR (ORDENADO CRESCENTE, "HOJE" AGRUPADO) =====
    // Só mostra a seção se houver tempos de processos que NÃO sejam RENOVADO ou CONTRATADO
    if (Object.keys(tempoCounts).length > 0) {
        const tempoSection = document.createElement('div');
        tempoSection.className = 'painel-section tempo-section';
        tempoSection.style.cssText = 'margin-bottom: 15px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px; background-color: #fafafa;';
        
        // Adiciona título da seção
        const tempoTitle = document.createElement('div');
        tempoTitle.style.cssText = 'margin-bottom: 8px; font-weight: bold; color: #52c41a; font-size: 13px; text-align: center;';
        tempoTitle.textContent = 'Por Tempo no Setor:';
        tempoSection.appendChild(tempoTitle);
        
        // Container flex para os botões de tempo (centralizado)
        const tempoContainer = document.createElement('div');
        tempoContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 5px; justify-content: center;';
        
        // Agrupa todos os "Hoje" (Hoje, Hoje - 2x, Hoje - 3x, etc.) em um único botão
        let hojeCount = 0;
        const temposNaoHoje = {};
        
        Object.entries(tempoCounts).forEach(([tempo, count]) => {
            if (tempo.toLowerCase().startsWith('hoje')) {
                hojeCount += count; // Soma todas as variações de "Hoje"
            } else {
                temposNaoHoje[tempo] = count;
            }
        });
        
        // Ordena os tempos não-Hoje por número de dias (crescente)
        const temposOrdenados = Object.entries(temposNaoHoje)
            .sort((a, b) => {
                const diasA = parseInt(a[0].match(/\d+/)?.[0] || '999');
                const diasB = parseInt(b[0].match(/\d+/)?.[0] || '999');
                return diasA - diasB;
            });
        
        // Adiciona o botão "Hoje" primeiro (se existir)
        if (hojeCount > 0) {
            const hojeOption = document.createElement('div');
            hojeOption.className = 'status-option tempo-option';
            hojeOption.setAttribute('data-tempo', 'Hoje');
            hojeOption.style.cssText = 'display: flex; flex-direction: column; align-items: center; text-align: center;';
            hojeOption.innerHTML = `<span>Hoje</span><span style="font-weight: bold; margin-top: 2px;">[${hojeCount}]</span>`;
            hojeOption.style.background = 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)';
            hojeOption.style.borderColor = '#a5d6a7';
            hojeOption.style.color = '#2e7d32';
            tempoContainer.appendChild(hojeOption);
        }
        
        // Adiciona os demais tempos em ordem crescente
        temposOrdenados.forEach(([tempo, count]) => {
            const tempoOption = document.createElement('div');
            tempoOption.className = 'status-option tempo-option';
            tempoOption.setAttribute('data-tempo', tempo);
            tempoOption.style.cssText = 'display: flex; flex-direction: column; align-items: center; text-align: center;';
            tempoOption.innerHTML = `<span>${tempo}</span><span style="font-weight: bold; margin-top: 2px;">[${count}]</span>`;
            tempoContainer.appendChild(tempoOption);
        });
        
        tempoSection.appendChild(tempoContainer);
        resumoContainer.appendChild(tempoSection);
        
        console.log(`✅ Seção de tempo criada com ${Object.keys(tempoCounts).length} tipos de tempo (excluindo RENOVADO/CONTRATADO)`);
    } else {
        console.log(`ℹ️ Seção de tempo não criada - todos os processos são RENOVADO ou CONTRATADO`);
    }
    
    // ===== EVENTOS DE CLIQUE =====
    
    // Adiciona o evento de clique para cada status
    const statusElements = resumoContainer.querySelectorAll('.status-section .status-option');
    statusElements.forEach(el => {
        el.addEventListener('click', () => {
            const statusSelecionado = el.getAttribute('data-status');
            
            // Remove o destaque de todos os elementos
            resumoContainer.querySelectorAll('.status-option').forEach(item => {
                item.style.backgroundColor = '';
                item.style.color = '';
                item.style.background = '';
                item.style.borderColor = '';
            });
            
            // Reaplica os estilos padrão dos botões "Hoje" na seção de tempo
            resumoContainer.querySelectorAll('.tempo-option').forEach(item => {
                const tempo = item.getAttribute('data-tempo');
                if (tempo && tempo.toLowerCase().startsWith('hoje')) {
                    item.style.background = 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)';
                    item.style.borderColor = '#a5d6a7';
                    item.style.color = '#2e7d32';
                }
            });
            
            // Aplica o filtro através do sistema GoogleSheetFilters
            aplicarFiltroStatusProcesso(statusSelecionado);
            
            // Adiciona destaque ao elemento selecionado
            el.style.backgroundColor = '#fa8c16';
            el.style.color = '#fff';
        });
    });
    
    // Adiciona o evento de clique para cada setor
    const setorElements = resumoContainer.querySelectorAll('.setor-section .setor-option');
    setorElements.forEach(el => {
        el.addEventListener('click', () => {
            const setorSelecionado = el.getAttribute('data-setor');
            
            // Remove o destaque de todos os elementos
            resumoContainer.querySelectorAll('.status-option').forEach(item => {
                item.style.backgroundColor = '';
                item.style.color = '';
                item.style.background = '';
                item.style.borderColor = '';
            });
            
            // Reaplica os estilos padrão dos botões "Hoje" na seção de tempo
            resumoContainer.querySelectorAll('.tempo-option').forEach(item => {
                const tempo = item.getAttribute('data-tempo');
                if (tempo && tempo.toLowerCase().startsWith('hoje')) {
                    item.style.background = 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)';
                    item.style.borderColor = '#a5d6a7';
                    item.style.color = '#2e7d32';
                }
            });
            
            // Aplica o filtro de setor (agora integrado com GoogleSheetFilters)
            aplicarFiltroSetor(setorSelecionado);
            
            // Adiciona destaque ao elemento selecionado
            el.style.backgroundColor = '#1890ff';
            el.style.color = '#fff';
        });
    });
    
    // Adiciona o evento de clique para cada tempo
    const tempoElements = resumoContainer.querySelectorAll('.tempo-section .tempo-option');
    tempoElements.forEach(el => {
        el.addEventListener('click', () => {
            const tempoSelecionado = el.getAttribute('data-tempo');
            
            // Remove o destaque de todos os elementos
            resumoContainer.querySelectorAll('.status-option').forEach(item => {
                item.style.backgroundColor = '';
                item.style.color = '';
                item.style.background = '';
                item.style.borderColor = '';
            });
            
            // Aplica o filtro de tempo (agora integrado com GoogleSheetFilters)
            aplicarFiltroTempo(tempoSelecionado);
            
            // Adiciona destaque ao elemento selecionado
            // Verifica se é "Hoje" para aplicar a cor verde, senão usa a cor padrão
            if (tempoSelecionado.toLowerCase().startsWith('hoje')) {
                el.style.background = 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)'; // Verde mais escuro para hover/ativo
                el.style.borderColor = '#81c784';
                el.style.color = '#1b5e20'; // Verde escuro para contraste
            } else {
                el.style.backgroundColor = '#52c41a';
                el.style.color = '#fff';
            }
        });
    });
      
    // Restaura o destaque para o filtro ativo atual baseado no GoogleSheetFilters
    const filterButton = document.querySelector('.google-sheet-filter-btn[data-col-index="5"]');
    if (filterButton && filterButton.classList.contains('filter-active')) {
        const activeFilters = filterButton.getAttribute('data-active-filters');
        if (activeFilters) {
            try {
                const filters = JSON.parse(activeFilters);
                if (filters.length === 1) {
                    // Encontra o status correspondente no painel (primeiro status que corresponde ao filtro)
                    const statusAtivo = Object.keys(statusCounts).find(status => 
                        status.toLowerCase() === filters[0].toLowerCase()
                    );
                    
                    if (statusAtivo) {
                        const activeFilter = resumoContainer.querySelector(`.status-option[data-status="${statusAtivo}"]`);
                        if (activeFilter) {
                            activeFilter.style.backgroundColor = '#fa8c16';
                            activeFilter.style.color = '#fff';
                        }
                    }
                }
            } catch (e) {
                console.warn('Erro ao processar filtros ativos:', e);
            }
        }
    }
    
    // Dispara evento personalizado para notificar que o painel foi atualizado
    document.dispatchEvent(new CustomEvent('painel-resumo-updated'));
}

// Função para filtrar a tabela conforme o status clicado
function filterTableByStatus(statusSelecionado) {
    // Seleciona todas as linhas da tabela (tbody)
    const rows = document.querySelectorAll('table tbody tr');
    rows.forEach(row => {
        if (statusSelecionado === 'TODOS') {
            row.style.display = '';
        } else {
            const cells = row.querySelectorAll('td');
            const status = extractStatusText(cells[5]);
            row.style.display = (status === statusSelecionado) ? '' : 'none';
        }
    });
    if (typeof alternaCoresLinhas === 'function') alternaCoresLinhas();
}

// Função que serve como intermediária para aplicar o filtro atual
function filterTable() {
    // Primeiro aplicamos o filtro do painel de resumos
    filterTableByStatus(window.painelFilterStatus);
    
    // Chama a função master de filtragem para garantir que todos os filtros sejam aplicados corretamente
    // e que o botão "Limpar Filtros" seja atualizado
    if (typeof masterFilterFunction === 'function') {
        masterFilterFunction();
    } else {
        // Se a função master não existir, pelo menos atualizamos as cores das linhas
        alternaCoresLinhas();
    }
    
    // Dispara um evento personalizado para notificar que um filtro do painel foi aplicado
    document.dispatchEvent(new CustomEvent('painel-filter-applied'));
}

// Função para sincronizar filtros com MobileCardsManager
function syncMobileFilters(statusSelecionado) {
    console.log(`🔄 Sincronizando filtros mobile com status: ${statusSelecionado}`);
    
    // Tenta interagir com a instância global de MobileCardsFilters
    if (window.mobileCardsFiltersInstance && 
        typeof window.mobileCardsFiltersInstance.updateFilter === 'function' &&
        typeof window.mobileCardsFiltersInstance.getFilters === 'function' && 
        typeof window.mobileCardsFiltersInstance.updateActiveFiltersCount === 'function') {
        
        const newStatus = (statusSelecionado === 'TODOS') ? '' : statusSelecionado;

        // Atualiza o filtro de status nos cards mobile
        window.mobileCardsFiltersInstance.updateFilter('status', newStatus); 
        window.mobileCardsFiltersInstance.updateActiveFiltersCount();

        // Atualiza a interface do select mobile
        const mobileStatusSelect = document.getElementById('mobile-filter-status');
        if (mobileStatusSelect) {
            mobileStatusSelect.value = newStatus;
            console.log(`📱 Select mobile atualizado para: ${newStatus || 'Todos os status'}`);
        }

        // Notifica o MobileCardsManager para reaplicar os filtros
        document.dispatchEvent(new CustomEvent('mobile-filters-updated', {
            detail: { 
                source: 'painelResumo', 
                status: statusSelecionado,
                newFilters: window.mobileCardsFiltersInstance.getFilters() 
            }
        }));
        
        // Aplica os filtros diretamente se o manager estiver disponível
        if (window.mobileCardsManager && typeof window.mobileCardsManager.applyFilters === 'function') {
            window.mobileCardsManager.applyFilters();
            console.log(`✅ Filtros aplicados nos cards mobile`);
        }

        // Dispara evento customizado para notificar outras partes do sistema
        document.dispatchEvent(new CustomEvent('painel-filter-applied', {
            detail: { 
                status: statusSelecionado,
                source: 'painelResumo'
            }
        }));

    } else {
        console.warn('⚠️ Instância de MobileCardsFilters não encontrada para sincronização.');
    }
}

// Função para resetar o filtro do painel de resumos
function resetPainelFilterStatus() {
    console.log('🔄 Resetando filtro do painel de resumos');
    
    // Remove o destaque de todos os elementos (status, setor e tempo)
    const allOptions = document.querySelectorAll('.status-option, .setor-option, .tempo-option');
    allOptions.forEach(item => {
        item.style.backgroundColor = '';
        item.style.color = '';
    });
    
    // Remove o filtro ativo da coluna Status do Processo via GoogleSheetFilters
    const filterButton = document.querySelector('.google-sheet-filter-btn[data-col-index="5"]');
    if (filterButton) {
        filterButton.removeAttribute('data-active-filters');
        filterButton.classList.remove('filter-active');
    }
    
    // Remove o filtro ativo da coluna Acompanhamento (usado por setor e tempo)
    const acompanhamentoFilterButton = document.querySelector('.google-sheet-filter-btn[data-col-index="4"]');
    if (acompanhamentoFilterButton) {
        acompanhamentoFilterButton.classList.remove('filter-active');
        console.log('✅ Botão de filtro Acompanhamento desativado');
    }
    
    // Reseta o status global para null (sem filtro)
    window.painelFilterStatus = null;
    
    // Sincroniza com os filtros mobile - limpa o filtro de status
    syncMobileFilters('TODOS');
    
    // Chama a função master de filtragem para atualizar a tabela
    if (typeof masterFilterFunction === 'function') {
        masterFilterFunction();
        console.log('✅ Filtros resetados e função master executada');
    }
    
    // Dispara um evento personalizado para notificar que o filtro do painel foi resetado
    document.dispatchEvent(new CustomEvent('painel-filter-applied', {
        detail: { 
            status: 'TODOS',
            source: 'painelResumoReset'
        }
    }));
    
    console.log('🎉 Reset do painel concluído');
}

// Função para resetar as contagens originais (chamada quando a tabela é recarregada)
function resetOriginalCounts() {
    originalStatusCounts = null;
    originalSetorCounts = null;
    originalTempoCounts = null;
    originalTotalRows = 0;
}

// Função para aplicar filtro de status através do sistema GoogleSheetFilters
function aplicarFiltroStatusProcesso(statusSelecionado) {
    console.log(`🎯 Aplicando filtro de status: ${statusSelecionado}`);
    
    // Encontra o botão de filtro da coluna "Status do Processo" (índice 5)
    const filterButton = document.querySelector('.google-sheet-filter-btn[data-col-index="5"]');
    
    if (!filterButton) {
        console.warn('⚠️ Botão de filtro da coluna Status do Processo não encontrado');
        return;
    }
      
    // Encontra também o filtro mobile correspondente
    const mobileFilterButton = document.getElementById('mobile-filter-status-processo');
    
    // Remove o filtro visual da coluna Acompanhamento quando filtrar por status
    const acompanhamentoFilterButton = document.querySelector('.google-sheet-filter-btn[data-col-index="4"]');
    if (acompanhamentoFilterButton) {
        acompanhamentoFilterButton.classList.remove('filter-active');
    }
    
    if (statusSelecionado === 'TODOS') {
        // Define o status global como null (sem filtro)
        window.painelFilterStatus = null;
        
        // Remove o filtro ativo da coluna Status do Processo
        filterButton.removeAttribute('data-active-filters');
        filterButton.classList.remove('filter-active');
        
        // Remove também do filtro mobile
        if (mobileFilterButton) {
            mobileFilterButton.classList.remove('filter-active');
        }
        
        // Sincroniza com os filtros mobile do MobileCardsManager
        syncMobileFilters('TODOS');
        
        console.log('✅ Removendo filtro da coluna Status do Processo - mostrando todos');
    } else {
        // Define o status global
        window.painelFilterStatus = statusSelecionado;
        
        // Aplica o filtro com o status selecionado
        const filtroValor = [statusSelecionado.toLowerCase()];
        filterButton.setAttribute('data-active-filters', JSON.stringify(filtroValor));
        filterButton.classList.add('filter-active');
        
        // Aplica também no filtro mobile
        if (mobileFilterButton) {
            mobileFilterButton.classList.add('filter-active');
        }
        
        // Sincroniza com os filtros mobile do MobileCardsManager
        syncMobileFilters(statusSelecionado);
        
        console.log(`✅ Aplicando filtro na coluna Status do Processo: ${statusSelecionado}`);
    }
    
    // Chama a função master de filtragem do GoogleSheetFilters
    if (typeof masterFilterFunction === 'function') {
        masterFilterFunction();
        console.log('🔄 Função master de filtragem executada');
    } else {
        console.warn('⚠️ masterFilterFunction não encontrada');
    }
    
    // Pequeno delay para garantir que as mudanças visuais sejam processadas
    setTimeout(() => {
        console.log(`🎉 Sincronização concluída para status: ${statusSelecionado}`);
    }, 100);
}

// Função para aplicar filtro de setor através do painel (armazena no window.painelFilterStatus)
function aplicarFiltroSetor(setorSelecionado) {
    console.log(`🎯 Aplicando filtro de setor: ${setorSelecionado}`);
    
    // Define o status global como um objeto para indicar que é filtro de setor
    window.painelFilterStatus = {
        tipo: 'setor',
        valor: setorSelecionado
    };
    
    // Ativa visualmente o botão de filtro da coluna Acompanhamento (índice 4)
    const acompanhamentoFilterButton = document.querySelector('.google-sheet-filter-btn[data-col-index="4"]');
    if (acompanhamentoFilterButton) {
        acompanhamentoFilterButton.classList.add('filter-active');
        console.log('✅ Botão de filtro Acompanhamento ativado visualmente');
    }
    
    // Filtra a tabela mostrando apenas linhas com o setor selecionado
    const rows = document.querySelectorAll('table tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        // Considerando que "Acompanhamento" é a 5ª coluna (índice 4)
        const setorAtual = extractSetorText(cells[4]);
        
        // Se corresponde ao setor, mostra; caso contrário, esconde
        row.style.display = (setorAtual === setorSelecionado) ? '' : 'none';
    });
    
    // Chama a função master de filtragem para aplicar outros filtros ativos
    if (typeof masterFilterFunction === 'function') {
        masterFilterFunction();
        console.log('🔄 Função master de filtragem executada');
    } else {
        // Se não houver função master, pelo menos alterna as cores
        if (typeof alternaCoresLinhas === 'function') {
            alternaCoresLinhas();
        }
    }
    
    // Dispara evento personalizado
    document.dispatchEvent(new CustomEvent('painel-filter-applied', {
        detail: { 
            setor: setorSelecionado,
            source: 'painelResumoSetor'
        }
    }));
    
    console.log(`🎉 Filtro de setor aplicado: ${setorSelecionado}`);
}

// Função para aplicar filtro de tempo através do painel (armazena no window.painelFilterStatus)
function aplicarFiltroTempo(tempoSelecionado) {
    console.log(`🎯 Aplicando filtro de tempo: ${tempoSelecionado}`);
    
    // Define o status global como um objeto para indicar que é filtro de tempo
    window.painelFilterStatus = {
        tipo: 'tempo',
        valor: tempoSelecionado
    };
    
    // Ativa visualmente o botão de filtro da coluna Acompanhamento (índice 4)
    const acompanhamentoFilterButton = document.querySelector('.google-sheet-filter-btn[data-col-index="4"]');
    if (acompanhamentoFilterButton) {
        acompanhamentoFilterButton.classList.add('filter-active');
        console.log('✅ Botão de filtro Acompanhamento ativado visualmente');
    }
    
    // Filtra a tabela mostrando apenas linhas com o tempo selecionado
    // EXCLUINDO processos RENOVADO e CONTRATADO
    const rows = document.querySelectorAll('table tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        
        // Verifica o status do processo (índice 5)
        const status = extractStatusText(cells[5]);
        const statusUpper = status.toUpperCase().trim();
        // Remove caracteres especiais como ✅ e espaços extras
        const statusClean = statusUpper.replace(/[✅\s]+/g, ' ').trim();
        const isExcluido = statusClean === 'RENOVADO' || statusClean === 'CONTRATADO' || 
                          statusUpper.includes('RENOVADO') || statusUpper.includes('CONTRATADO');
        
        // Se o status for RENOVADO ou CONTRATADO, esconde a linha
        if (isExcluido) {
            row.style.display = 'none';
            return;
        }
        
        // Considerando que "Acompanhamento" é a 5ª coluna (índice 4)
        const tempoAtual = extractTempoText(cells[4]);
        
        // Se o filtro é "Hoje", mostra todas as linhas que começam com "Hoje"
        // Caso contrário, faz comparação exata
        let mostrarLinha = false;
        if (tempoSelecionado.toLowerCase() === 'hoje') {
            mostrarLinha = tempoAtual.toLowerCase().startsWith('hoje');
        } else {
            mostrarLinha = (tempoAtual === tempoSelecionado);
        }
        
        row.style.display = mostrarLinha ? '' : 'none';
    });
    
    // Chama a função master de filtragem para aplicar outros filtros ativos
    if (typeof masterFilterFunction === 'function') {
        masterFilterFunction();
        console.log('🔄 Função master de filtragem executada');
    } else {
        // Se não houver função master, pelo menos alterna as cores
        if (typeof alternaCoresLinhas === 'function') {
            alternaCoresLinhas();
        }
    }
    
    // Dispara evento personalizado
    document.dispatchEvent(new CustomEvent('painel-filter-applied', {
        detail: { 
            tempo: tempoSelecionado,
            source: 'painelResumoTempo'
        }
    }));
    
    console.log(`🎉 Filtro de tempo aplicado: ${tempoSelecionado}`);
}


    
// Atualiza o painel quando o DOM carregar e quando a tabela for preenchida
document.addEventListener('DOMContentLoaded', () => {
    updatePainelResumo();
    
    // Garante que o botão "Limpar Filtros" seja atualizado corretamente no carregamento
    setTimeout(() => {
        if (typeof masterFilterFunction === 'function') {
            masterFilterFunction();
        }
    }, 500);
});

// Mantém este listener para quando a tabela for carregada dinamicamente
document.addEventListener('tabela-carregada', () => {
    // Limpa as contagens originais para recalcular com os novos dados
    resetOriginalCounts();
    updatePainelResumo();
});

// IMPORTANTE: Escuta o evento disparado APÓS o AcompanhamentoProcessos.js terminar de atualizar
// Este evento é disparado quando os dados de setor e tempo são carregados da API
document.addEventListener('acompanhamento-atualizado', () => {
    console.log('🔄 Acompanhamento atualizado - recalculando painel de resumos');
    // Limpa as contagens para forçar recálculo com os novos dados
    resetOriginalCounts();
    updatePainelResumo();
});

// Também escuta atualizações parciais (quando uma linha individual é atualizada)
document.addEventListener('acompanhamento-atualizado-parcial', () => {
    console.log('🔄 Acompanhamento parcial atualizado - recalculando painel de resumos');
    // Limpa as contagens para forçar recálculo com os novos dados
    resetOriginalCounts();
    updatePainelResumo();
});

// Função de debug para verificar se os dados estão sendo extraídos corretamente
window.debugPainelResumo = function() {
    console.log('=== DEBUG PAINEL DE RESUMOS ===');
    
    const tbody = document.querySelector('table tbody');
    if (!tbody) {
        console.error('❌ Tbody não encontrado');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    console.log(`📊 Total de linhas: ${rows.length}`);
    
    if (rows.length > 0) {
        const primeiraLinha = rows[0];
        const cells = primeiraLinha.querySelectorAll('td');
        
        console.log(`📋 Total de colunas na primeira linha: ${cells.length}`);
        
        // Verifica coluna de Acompanhamento (índice 4)
        const acompCell = cells[4];
        console.log('🔍 Célula de Acompanhamento (índice 4):');
        console.log('   HTML:', acompCell?.innerHTML);
        
        // Testa extração de setor
        const setorTag = acompCell?.querySelector('.setor-processo-tag');
        console.log('   Tag de setor encontrada:', !!setorTag);
        if (setorTag) {
            console.log('   Texto do setor:', setorTag.textContent.trim());
        }
        
        // Testa extração de tempo
        const tempoTag = acompCell?.querySelector('.tempo-acompanhamento-tag');
        console.log('   Tag de tempo encontrada:', !!tempoTag);
        if (tempoTag) {
            console.log('   Texto do tempo:', tempoTag.textContent.trim());
            console.log('   Classes da tag:', tempoTag.className);
        }
    }
    
    // Mostra contagens atuais
    console.log('📈 Contagens armazenadas:');
    console.log('   Status:', originalStatusCounts ? Object.keys(originalStatusCounts).length : 0);
    console.log('   Setores:', originalSetorCounts ? Object.keys(originalSetorCounts).length : 0);
    console.log('   Tempos:', originalTempoCounts ? Object.keys(originalTempoCounts).length : 0);
    
    if (originalSetorCounts) {
        console.log('   Setores detalhados:', originalSetorCounts);
    }
    if (originalTempoCounts) {
        console.log('   Tempos detalhados:', originalTempoCounts);
    }
    
    console.log('=== FIM DEBUG ===');
};
