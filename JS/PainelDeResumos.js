/**
 * PainelDeResumos.js - Gerenciador do painel lateral de resumo do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Contabilizar e exibir quantidades de processos por status
 *  - Gerenciar o painel lateral com estatísticas e links de filtro rápido
 *  - Permitir filtrar a tabela ao clicar em cada status do painel
 *  - Adaptar comportamento para diferentes tamanhos de tela
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Componentes de Interface:
 *   - Painel lateral: Container com classe 'painel-resumo'
 *   - Botões de status: Elementos clicáveis que filtram a tabela
 *   - Contador total: Exibe o número total de processos visíveis
 * 
 * # Funções Principais:
 *   - updatePainelResumo(): Atualiza contadores e eventos do painel
 *   - filtrarTabelaPorStatus(): Aplica filtro na tabela por status específico
 *   - resetPainelFilterStatus(): Remove filtro ativo e restaura visualização
 * 
 * # Fluxo de Execução:
 *   1. Executa ao carregar o DOM e após atualizações da tabela
 *   2. Conta ocorrências de cada status na coluna "Status do Processo"
 *   3. Atualiza contadores no painel lateral e configura eventos de clique
 *   4. Em telas menores, recolhe o painel após seleção para maximizar área útil
 * 
 * # Adaptação Responsiva:
 *   - Em dispositivos móveis/tablets (telas até 1024px), painel é recolhido após seleção
 *   - Estado do filtro é armazenado em window.painelFilterStatus
 * 
 * # Dependências:
 *   - Estrutura esperada da tabela com status na 6ª coluna (índice 5)
 *   - Elemento HTML com classe 'painel-resumo' para conter os contadores
 */

function updatePainelResumo() {
    const resumoContainer = document.querySelector('.painel-resumo');
    if (!resumoContainer) return;
    
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

    // Constrói o HTML do painel com elementos clicáveis
    // Remove o text-decoration: underline dos elementos
    let html = `<div class="status-option" data-status="TODOS" style="cursor:pointer; margin-bottom: 5px;">TODOS: ${rows.length}</div>`;
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
            filterTable();
            // 4) Recolhe o painel de Resumo no mobile após seleção
            const detalhes = document.getElementById('painel-resumo-details');
            // Fecha o painel apenas em telas até 1024px (inclui iPad Pro)
            if (detalhes && window.matchMedia('(max-width: 1024px)').matches) {
                detalhes.removeAttribute('open');
            }
        });
    });
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

// Atualiza o painel quando o DOM carregar e quando a tabela for preenchida
document.addEventListener('DOMContentLoaded', () => {
    // 0) Fecha o painel de resumo por default no mobile
    const detalhes = document.getElementById('painel-resumo-details');
    // Fecha o painel apenas em telas até 1024px (inclui iPad Pro)
    if (detalhes && window.matchMedia('(max-width: 1024px)').matches) {
        detalhes.removeAttribute('open');
    }
    updatePainelResumo();
});

// Mantém este listener para quando a tabela for carregada dinamicamente
document.addEventListener('tabela-carregada', updatePainelResumo);
