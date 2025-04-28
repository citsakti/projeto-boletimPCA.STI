document.addEventListener('DOMContentLoaded', () => {
    attachSorting();
});

function attachSorting() {
    const table = document.querySelector('#detalhes table');
    if (!table) return;

    // Seleciona a primeira linha do cabeçalho (com os títulos)
    const headers = table.querySelectorAll('thead tr:first-child th');
    
    headers.forEach((header, index) => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            // Remove os indicadores de ordenação dos demais headers
            headers.forEach(h => {
                if (h !== header) {
                    let span = h.querySelector('.sort-indicator');
                    if (span) span.remove();
                    h.removeAttribute('data-sort-direction');
                }
            });

            // Define e alterna a direção: asc ou desc
            let currentDirection = header.getAttribute('data-sort-direction') || 'asc';
            let newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
            header.setAttribute('data-sort-direction', newDirection);

            // Atualiza o símbolo de ordenação (▲ para ascendente, ▼ para descendente)
            let indicator = header.querySelector('.sort-indicator');
            if (!indicator) {
                indicator = document.createElement('span');
                indicator.classList.add('sort-indicator');
                indicator.style.marginLeft = '5px';
                header.appendChild(indicator);
            }
            indicator.innerHTML = newDirection === 'asc' ? '&#9650;' : '&#9660;';

            // Executa a ordenação
            sortTableByColumn(table, index, newDirection);
        });
    });
}

// Função auxiliar para converter DD/MM/YYYY para objeto Date
function parseDate(dateString) {
    const parts = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (parts) {
        // Atenção: Meses são 0-indexados no objeto Date (0 = Janeiro, 11 = Dezembro)
        // new Date(year, monthIndex, day)
        return new Date(parts[3], parts[2] - 1, parts[1]);
    }
    // Retorna uma data inválida se o formato não corresponder ou a string for vazia
    return new Date('invalid date');
}

function sortTableByColumn(table, columnIndex, direction) {
    const tbody = table.querySelector('tbody');
    const rowsArray = Array.from(tbody.querySelectorAll('tr'));

    rowsArray.sort((a, b) => {
        let aText = a.children[columnIndex] ? a.children[columnIndex].textContent.trim() : '';
        let bText = b.children[columnIndex] ? b.children[columnIndex].textContent.trim() : '';

        // Tenta converter o valor para data
        const aDate = parseDate(aText);
        const bDate = parseDate(bText);
        const aTime = aDate.getTime();
        const bTime = bDate.getTime();

        // Se ambos forem datas válidas, compara-as
        if (!isNaN(aTime) && !isNaN(bTime)) {
            return direction === 'asc' ? aTime - bTime : bTime - aTime;
        }

        // Se não forem datas, tenta comparar como números (tratando vírgulas e pontos)
        const aNum = parseFloat(aText.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
        const bNum = parseFloat(bText.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));

        if (!isNaN(aNum) && !isNaN(bNum)) {
            return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        // Caso contrário, usa comparação de strings considerando valores numéricos
        return direction === 'asc'
            ? aText.localeCompare(bText, undefined, {numeric: true, sensitivity: 'base'})
            : bText.localeCompare(aText, undefined, {numeric: true, sensitivity: 'base'});
    });

    // Reanexa as linhas ordenadas
    rowsArray.forEach(row => {
        tbody.appendChild(row);
    });
}