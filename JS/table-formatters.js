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

function formatStatusInicio(statusValue) {
    // Se o valor for numérico, formata a string conforme o exemplo
    if (!isNaN(statusValue)) {
        return "Faltam " + statusValue + " dias";
    }
    return statusValue;
}

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

// Se você disparar um evento customizado "tabela-carregada" após popular a tabela:
document.addEventListener('tabela-carregada', strikeCancelledRows);

// Caso contrário, se as linhas da tabela já estiverem prontas no momento do carregamento completo:
document.addEventListener('DOMContentLoaded', () => { 
    strikeCancelledRows();
});