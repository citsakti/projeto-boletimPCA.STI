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
    resumoContainer.innerHTML = html;

    // Adiciona o evento de clique para cada status
    const statusElements = resumoContainer.querySelectorAll('.status-option');
    statusElements.forEach(el => {
        el.addEventListener('click', () => {
            const statusSelecionado = el.getAttribute('data-status');
            window.painelFilterStatus = statusSelecionado;
            
            // Remove o destaque de todos os elementos
            statusElements.forEach(item => {
                item.style.backgroundColor = '';
                item.style.fontWeight = '';
            });
            
            // Adiciona destaque ao elemento selecionado, exceto se for "TODOS" e não houver filtro
            if (statusSelecionado !== 'TODOS') {
                el.style.backgroundColor = '#fa8c16';
                el.style.fontWeight = 'bold';
                
                // Destaca o botão "Limpar Filtros"
                const limparBtn = document.getElementById("btnLimparFiltros");
                if (limparBtn) limparBtn.classList.add('filters-active');
            } else {
                // Se for "TODOS", remove o destaque do botão "Limpar Filtros"
                const limparBtn = document.getElementById("btnLimparFiltros");
                if (limparBtn) limparBtn.classList.remove('filters-active');            }
              filterTable();
            // Recolhe o painel de Resumo no mobile após seleção
            if (window.matchMedia('(max-width: 1199px)').matches) {
                // Usa o novo sistema de painel recolhível
                if (window.painelResumoCollapsible) {
                    window.painelResumoCollapsible.collapse();
                }
            }
        });
    });
    
    // Restaura o destaque para o filtro ativo atual
    if (window.painelFilterStatus && window.painelFilterStatus !== 'TODOS') {
        const activeFilter = resumoContainer.querySelector(`.status-option[data-status="${window.painelFilterStatus}"]`);
        if (activeFilter) {
            activeFilter.style.backgroundColor = '#fa8c16';
            activeFilter.style.fontWeight = 'bold';
            
            // Destaca o botão "Limpar Filtros"
            const limparBtn = document.getElementById("btnLimparFiltros");
            if (limparBtn) limparBtn.classList.add('filters-active');        }
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

// Função para resetar o filtro do painel de resumos
function resetPainelFilterStatus() {
    window.painelFilterStatus = 'TODOS';
    
    // Remove o destaque de todos os elementos de status
    const statusElements = document.querySelectorAll('.status-option');
    statusElements.forEach(item => {
        item.style.backgroundColor = '';
        item.style.fontWeight = '';
    });
    
    // Remove o destaque do botão "Limpar Filtros"
    const limparBtn = document.getElementById("btnLimparFiltros");
    if (limparBtn) limparBtn.classList.remove('filters-active');
    
    // Aplica o filtro "TODOS"
    filterTableByStatus('TODOS');
    
    // Dispara um evento personalizado para notificar que o filtro do painel foi resetado
    document.dispatchEvent(new CustomEvent('painel-filter-applied'));
}

// Função para resetar as contagens originais (chamada quando a tabela é recarregada)
function resetOriginalCounts() {
    originalStatusCounts = null;
    originalTotalRows = 0;
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
