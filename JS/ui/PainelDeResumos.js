/**
 * PainelDeResumos.js - Gerenciador do painel lateral de resumo do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Contabilizar e exibir quantidades de processos por status
 *  - Gerenciar o painel lateral com estatísticas e links de filtro rápido
 *  - Permitir filtrar a tabela ao clicar em cada status do painel
 *  - Adaptar comportamento para diferentes tamanhos de tela
 *  - Manter contagens originais fixas independente dos filtros aplicados
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Componentes de Interface:
 *   - Painel lateral: Container com classe 'painel-resumo'
 *   - Botões de status: Elementos clicáveis que filtram a tabela
 *   - Contador total: Exibe o número total de processos (sempre fixo)
 * 
 * # Funções Principais:
 *   - updatePainelResumo(): Atualiza contadores e eventos do painel
 *   - calcularContagensOriginais(): Calcula e armazena as contagens iniciais
 *   - filtrarTabelaPorStatus(): Aplica filtro na tabela por status específico
 *   - resetPainelFilterStatus(): Remove filtro ativo e restaura visualização
 * 
 * # Fluxo de Execução:
 *   1. Executa ao carregar o DOM e após atualizações da tabela
 *   2. Conta ocorrências de cada status na coluna "Status do Processo" APENAS na primeira vez
 *   3. Mantém contagens fixas mesmo quando filtros são aplicados
 *   4. Atualiza contadores no painel lateral e configura eventos de clique
 *   5. Em telas menores, recolhe o painel após seleção para maximizar área útil
 * 
 * # Adaptação Responsiva:
 *   - Em dispositivos móveis/tablets (telas até 1024px), painel é recolhido após seleção
 *   - Estado do filtro é armazenado em window.painelFilterStatus
 * 
 * # Dependências:
 *   - Estrutura esperada da tabela com status na 6ª coluna (índice 5)
 *   - Elemento HTML com classe 'painel-resumo' para conter os contadores
 */

// Variáveis globais para armazenar as contagens originais
let originalStatusCounts = null;
let originalTotalRows = 0;

function calcularContagensOriginais() {
    // Seleciona todas as linhas da tabela (tbody)
    const rows = document.querySelectorAll('table tbody tr');
    const statusCounts = {};

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        // Considerando que "Status do Processo" é a 6ª coluna (índice 5)
        const status = cells[5] ? cells[5].textContent.trim() : '';
        if (status !== '') {
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        }
    });

    // Armazena as contagens originais para uso posterior
    originalStatusCounts = statusCounts;
    originalTotalRows = rows.length;
    
    return { statusCounts, totalRows: rows.length };
}

function updatePainelResumo() {
    const resumoContainer = document.querySelector('.painel-resumo');
    if (!resumoContainer) return;
    
    // Se ainda não temos as contagens originais, calcula pela primeira vez
    // ou se a tabela foi recarregada (número de linhas mudou significativamente)
    let statusCounts, totalRows;
    if (!originalStatusCounts) {
        const dados = calcularContagensOriginais();
        statusCounts = dados.statusCounts;
        totalRows = dados.totalRows;
    } else {
        // Usa as contagens originais armazenadas (mantém os números fixos)
        statusCounts = originalStatusCounts;
        totalRows = originalTotalRows;
    }    // Constrói o HTML do painel com elementos clicáveis
    // Remove o text-decoration: underline dos elementos
    let html = `<div class="status-option" data-status="TODOS" style="cursor:pointer; margin-bottom: 5px;">TODOS: ${totalRows}</div>`;
    for (const status in statusCounts) {
        html += `<div class="status-option" data-status="${status}" style="cursor:pointer; margin-bottom: 5px;">${status}: ${statusCounts[status]}</div>`;
    }
    resumoContainer.innerHTML = html;    // Adiciona o evento de clique para cada status
    const statusElements = resumoContainer.querySelectorAll('.status-option');
    statusElements.forEach(el => {
        el.addEventListener('click', () => {
            const statusSelecionado = el.getAttribute('data-status');
            
            // Remove o destaque de todos os elementos
            statusElements.forEach(item => {
                item.style.backgroundColor = '';
                item.style.fontWeight = '';
            });
            
            // Aplica o filtro através do sistema GoogleSheetFilters
            aplicarFiltroStatusProcesso(statusSelecionado);
            
            // Adiciona destaque ao elemento selecionado, exceto se for "TODOS"
            if (statusSelecionado !== 'TODOS') {
                el.style.backgroundColor = '#fa8c16';
                el.style.fontWeight = 'bold';
            }
            // Recolhe o painel de Resumo no mobile após seleção
            if (window.matchMedia('(max-width: 1199px)').matches) {
                // Usa o novo sistema de painel recolhível
                if (window.painelResumoCollapsible) {
                    window.painelResumoCollapsible.collapse();
                }
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
                            activeFilter.style.fontWeight = 'bold';
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
            const status = cells[5] ? cells[5].textContent.trim() : '';
            row.style.display = (status === statusSelecionado) ? '' : 'none';
        }
    });
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
    // Acessa o MobileCardsManager global se disponível
    if (window.mobileCardsManager) {
        if (statusSelecionado === 'TODOS') {
            // Limpa o filtro de status mobile
            window.mobileCardsManager.filters.status = '';
            const mobileSelect = document.getElementById('mobile-filter-status');
            if (mobileSelect) {
                mobileSelect.value = '';
            }
        } else {
            // Aplica o filtro de status mobile
            window.mobileCardsManager.filters.status = statusSelecionado;
            const mobileSelect = document.getElementById('mobile-filter-status');
            if (mobileSelect) {
                mobileSelect.value = statusSelecionado;
            }
        }
        // Reaplica os filtros mobile
        window.mobileCardsManager.applyFilters();
    }
    
    // Dispara evento personalizado para notificar sobre mudança de filtro do painel
    document.dispatchEvent(new CustomEvent('painel-filter-applied', {
        detail: { status: statusSelecionado }
    }));
}

// Função para resetar o filtro do painel de resumos
function resetPainelFilterStatus() {
    // Remove o destaque de todos os elementos de status
    const statusElements = document.querySelectorAll('.status-option');
    statusElements.forEach(item => {
        item.style.backgroundColor = '';
        item.style.fontWeight = '';
    });
    
    // Remove o filtro ativo da coluna Status do Processo via GoogleSheetFilters
    const filterButton = document.querySelector('.google-sheet-filter-btn[data-col-index="5"]');
    if (filterButton) {
        filterButton.removeAttribute('data-active-filters');
        filterButton.classList.remove('filter-active');
    }
    
    // Sincroniza com os filtros mobile - limpa o filtro de status
    syncMobileFilters('TODOS');
    
    // Chama a função master de filtragem para atualizar a tabela
    if (typeof masterFilterFunction === 'function') {
        masterFilterFunction();
    }
    
    // Dispara um evento personalizado para notificar que o filtro do painel foi resetado
    document.dispatchEvent(new CustomEvent('painel-filter-applied'));
}

// Função para resetar as contagens originais (chamada quando a tabela é recarregada)
function resetOriginalCounts() {
    originalStatusCounts = null;
    originalTotalRows = 0;
}

// Função para aplicar filtro de status através do sistema GoogleSheetFilters
function aplicarFiltroStatusProcesso(statusSelecionado) {
    // Encontra o botão de filtro da coluna "Status do Processo" (índice 5)
    const filterButton = document.querySelector('.google-sheet-filter-btn[data-col-index="5"]');
    
    if (!filterButton) {
        console.warn('Botão de filtro da coluna Status do Processo não encontrado');
        return;
    }
      // Encontra também o filtro mobile correspondente
    const mobileFilterButton = document.getElementById('mobile-filter-status-processo');
    
    if (statusSelecionado === 'TODOS') {
        // Remove o filtro ativo da coluna Status do Processo
        filterButton.removeAttribute('data-active-filters');
        filterButton.classList.remove('filter-active');
        
        // Remove também do filtro mobile
        if (mobileFilterButton) {
            mobileFilterButton.classList.remove('filter-active');
        }
        
        // Sincroniza com os filtros mobile do MobileCardsManager
        syncMobileFilters('TODOS');
        
        console.log('Removendo filtro da coluna Status do Processo - mostrando todos');
    } else {
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
        
        console.log(`Aplicando filtro na coluna Status do Processo: ${statusSelecionado}`);
    }
    
    // Chama a função master de filtragem do GoogleSheetFilters
    if (typeof masterFilterFunction === 'function') {
        masterFilterFunction();
    } else {
        console.warn('masterFilterFunction não encontrada');
    }
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
