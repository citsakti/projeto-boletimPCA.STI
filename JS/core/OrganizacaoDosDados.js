/**
 * OrganizacaoDosDados.js - Sistema de ordenação dinâmica do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Permitir a ordenação interativa das colunas da tabela principal
 *  - Exibir indicadores visuais (setas) para a direção de ordenação
 *  - Ordenar automaticamente a tabela por "Contratar Até" ao carregar
 *  - Manter projetos já contratados/renovados sempre no final da tabela
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Componentes de Interface:
 *   - Cabeçalhos de coluna: Recebem eventos de clique para ordenação
 *   - Indicadores de direção: Setas visuais ▲▼ anexadas aos cabeçalhos
 * 
 * # Funções Principais:
 *   - attachSorting(): Adiciona eventos de clique aos cabeçalhos da tabela
 *   - sortTableByColumn(): Realiza a ordenação com base na coluna e direção
 *   - parseDate(): Converte strings de data para objetos Date para comparação
 *   - compareValues(): Função genérica para comparar valores de diferentes tipos
 * 
 * # Fluxo de Execução:
 *   1. Adiciona eventos de clique aos cabeçalhos da tabela
 *   2. Responde aos cliques do usuário alterando a ordenação
 *   3. Realiza ordenação automática inicial por "Contratar Até"
 *   4. Reaplica ordenação após atualizações dinâmicas da tabela
 * 
 * # Lógica de Negócio:
 *   - Tratamento especial para datas, números e strings
 *   - Projetos "CONTRATADO ✅" ou "RENOVADO ✅" são mantidos no final
 *   - Direção de ordenação alternada a cada clique no mesmo cabeçalho
 * 
 * # Dependências:
 *   - Evento customizado 'tabela-carregada' para reinicialização
 *
 * - sortByContratarAteDesc:
 *      Ordena automaticamente a tabela pela coluna "Contratar Até" do mais antigo para o mais novo.
 *
 * Eventos:
 * - DOMContentLoaded: Inicializa a ordenação automática e ativa a ordenação por clique.
 * - tabela-carregada: Reaplica a ordenação automática após atualização dos dados.
 *
 * Observações:
 * - O script assume que a tabela está dentro do elemento #detalhes e possui um <thead> e <tbody>.
 * - O indicador de ordenação é exibido como uma seta (▲ ou ▼) ao lado do cabeçalho ativo.
 * -----------------------------------------------------------------------------
 */

document.addEventListener('DOMContentLoaded', () => {
    attachSorting();
    setTimeout(sortByContratarAteDesc, 0);
});

document.addEventListener('tabela-carregada', () => {
    setTimeout(sortByContratarAteDesc, 0);
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
        // Pega o status (assumindo que está na 6ª coluna, índice 5)
        const aStatus = a.children[5] ? a.children[5].textContent.trim() : '';
        const bStatus = b.children[5] ? b.children[5].textContent.trim() : '';

        // Se ambos são "CONTRATADO ✅" ou "RENOVADO ✅", mantém a ordem original
        const isAContratadoOuRenovado = aStatus === 'CONTRATADO ✅' || aStatus === 'RENOVADO ✅';
        const isBContratadoOuRenovado = bStatus === 'CONTRATADO ✅' || bStatus === 'RENOVADO ✅';

        if (isAContratadoOuRenovado && isBContratadoOuRenovado) return 0;
        // Se só a é "CONTRATADO ✅" ou "RENOVADO ✅", manda para o fim
        if (isAContratadoOuRenovado) return 1;
        // Se só b é "CONTRATADO ✅" ou "RENOVADO ✅", manda para o fim
        if (isBContratadoOuRenovado) return -1;

        // Ordenação normal por data, número ou string
        let aText = a.children[columnIndex] ? a.children[columnIndex].textContent.trim() : '';
        let bText = b.children[columnIndex] ? b.children[columnIndex].textContent.trim() : '';

        // Tenta converter o valor para data
        const aDate = parseDate(aText);
        const bDate = parseDate(bText);
        const aTime = aDate.getTime();
        const bTime = bDate.getTime();

        if (!isNaN(aTime) && !isNaN(bTime)) {
            return direction === 'asc' ? aTime - bTime : bTime - aTime;
        }

        const aNum = parseFloat(aText.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
        const bNum = parseFloat(bText.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));

        if (!isNaN(aNum) && !isNaN(bNum)) {
            return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        return direction === 'asc'
            ? aText.localeCompare(bText, undefined, {numeric: true, sensitivity: 'base'})
            : bText.localeCompare(aText, undefined, {numeric: true, sensitivity: 'base'});
    });

    // Reanexa as linhas ordenadas
    rowsArray.forEach(row => {
        tbody.appendChild(row);
    });
}

// Função para ordenar automaticamente pela coluna "Contratar Até" (do mais antigo ao mais novo)
function sortByContratarAteDesc() {
    const table = document.querySelector('#detalhes table');
    if (!table) return;
    const headers = table.querySelectorAll('thead tr:first-child th');
    let columnIndex = -1;
    headers.forEach((header, idx) => {
        if (header.textContent.trim().toLowerCase() === 'contratar até') {
            columnIndex = idx;
        }
    });
    if (columnIndex !== -1) {
        sortTableByColumn(table, columnIndex, 'asc'); // 'asc' = mais antigo ao mais novo
    }
}
