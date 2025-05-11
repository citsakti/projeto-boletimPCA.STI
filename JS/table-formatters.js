/**
 * Script utilitário para formatação de dados e aplicação de estilos em linhas da tabela.
 * 
 * Funcionalidades:
 * - formatContratarAte: Retorna a data de entrada sem aplicar formatação.
 * - formatStatusInicio: Formata o valor do status de início, exibindo "Faltam X dias" se for numérico.
 * - strikeCancelledRows: Aplica o estilo de texto riscado às linhas cujo status contenha "CANCELADO".
 * 
 * Observações:
 * - A função strikeCancelledRows considera que o status está na 5ª coluna (índice 4).
 * - strikeCancelledRows é executada tanto ao carregar o DOM quanto após o evento customizado "tabela-carregada".
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