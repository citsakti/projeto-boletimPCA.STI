const orcamentoMapping = {
    'CUSTEIO 💳': 'orcamento-custeio',
    'INVESTIMENTO 💵': 'orcamento-investimento',
};

function assignOrcamentoClasses() {
    document.querySelectorAll('table tbody tr').forEach(row => {
        const cell = row.querySelector('td:nth-child(9)'); // 9ª coluna = Orçamento
        if (!cell) return;

        const txt = cell.textContent.trim();
        const base = orcamentoMapping[txt];
        if (!base) return;

        cell.innerHTML = `<span class="${base}-highlight">${txt}</span>`;
    });
}

// chama ao carregar o DOM e também após popular a tabela
document.addEventListener('DOMContentLoaded', assignOrcamentoClasses);
document.addEventListener('tabela-carregada', assignOrcamentoClasses);

// expõe para chamadas manuais se necessário
window.assignOrcamentoClasses = assignOrcamentoClasses;