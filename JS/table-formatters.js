/**
 * Retorna a data de entrada sem aplicar formatação.
 *
 * Esta função simplesmente retorna o dateInput fornecido conforme está. 
 * A lógica para formatação da data (incluindo a conversão de "AAAA-MM-DD" ou "DD/MM/AAAA" 
 * para uma string formatada com nomes dos meses) encontra-se atualmente comentada.
 *
 * @param {string} dateInput - A string de data sem formatação.
 * @returns {string} A data original fornecida.
 */
function formatContratarAte(dateInput) {
    // Simplesmente retorna o valor original sem aplicar formatação
    return dateInput; 

    /* Código de formatação original comentado ou removido
    if (!dateInput || typeof dateInput !== 'string') return '';

    // Tenta converter para formato Date
    const parts = dateInput.split(/[-\/]/); // Aceita formatos com - ou /
    
    let year, month, day;

    if (parts.length === 3) {
        if (parts[0].length === 4) {
            // Formato AAAA-MM-DD
            [year, month, day] = parts;
        } else {
            // Formato DD/MM/AAAA
            [day, month, year] = parts;
        }

        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date)) {
            const mesesPt = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            const dia = ("0" + date.getDate()).slice(-2);
            const nomeMes = mesesPt[date.getMonth()];
            const ano = date.getFullYear().toString().slice(-2);
            return `${dia}/${nomeMes}/${ano}`;
        }
    }

    return dateInput; // Se falhar, retorna o valor original sem formatar
    */
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