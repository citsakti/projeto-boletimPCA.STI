/**
 * table-formatters.js - Utilitários de formatação para tabelas do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Formatar dados específicos para exibição adequada na tabela principal
 *  - Aplicar estilos visuais a linhas da tabela com base em critérios específicos
 *  - Fornecer funções utilitárias para manipulação de textos e datas
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Funções de Formatação:
 *   - formatContratarAte(): Processa datas para exibição na coluna "Contratar Até"
 *   - formatStatusInicio(): Formata texto "Faltam X dias" para status de início
 *   - strikeCancelledRows(): Aplica estilo riscado a linhas com status "CANCELADO"
 * 
 * # Manipulação Visual:
 *   - Linhas canceladas recebem estilo de texto riscado
 *   - Valores numéricos em status são exibidos com mensagem "Faltam X dias"
 * 
 * # Fluxo de Execução:
 *   1. Funções são chamadas durante a renderização da tabela
 *   2. A função strikeCancelledRows é executada após o carregamento do DOM
 *   3. Também é executada novamente após o evento "tabela-carregada"
 * 
 * # Dependências:
 *   - Estrutura esperada da tabela com status na 5ª coluna
 *   - Evento customizado "tabela-carregada" para reaplicação após atualizações
 */

function formatContratarAte(dateInput) {
    // Simplesmente retorna o valor original sem aplicar formatação
    return dateInput; 
}

/**
 * Formata o valor do status de início.
 *
 * Se o valor for numérico, retorna a string "Faltam X dias".
 * Caso contrário, retorna o valor original.
 *
 * @param {string|number} statusValue - Valor do status.
 * @returns {string} Status formatado.
 */
function formatStatusInicio(statusValue) {
    // Se o valor for numérico, formata a string conforme o exemplo
    if (!isNaN(statusValue)) {
        return "Faltam " + statusValue + " dias";
    }
    return statusValue;
}

/**
 * Aplica o estilo de texto riscado às linhas da tabela cujo status contenha "CANCELADO".
 *
 * Percorre todas as linhas do corpo da tabela e verifica se a quinta célula (índice 4)
 * contém a palavra "CANCELADO". Se sim, aplica o estilo riscado à linha.
 */
function strikeCancelledRows() {
    const tableRows = document.querySelectorAll('table tbody tr');
    tableRows.forEach(row => {
        // Considerando que "Status do Processo" é a 5ª coluna (índice 4)
        const statusCell = row.cells[4];
        if (statusCell && statusCell.textContent.trim().toUpperCase().includes('CANCELADO')) {
            row.style.textDecoration = 'line-through';
        }
    });
}

// Dispara a função strikeCancelledRows após o evento customizado "tabela-carregada"
document.addEventListener('tabela-carregada', strikeCancelledRows);

// Também executa strikeCancelledRows ao carregar completamente o DOM,
// caso as linhas da tabela já estejam prontas nesse momento.
document.addEventListener('DOMContentLoaded', () => { 
    strikeCancelledRows();
});