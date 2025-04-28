console.log('fstatus-classes.js carregado');

const statusMapping = {
    'AUTUAÇÃO ATRASADA 💣': 'status-autuacao-atrasada',
    'EM RENOVAÇÃO 🔄': 'status-em-renovacao',
    'CANCELADO ❌': 'status-cancelado',
    'EM CONTRATAÇÃO 🤝': 'status-em-contratacao',
    'AGUARDANDO ETP ⏳': 'status-aguardando-etp',
    'A INICIAR ⏰': 'status-a-iniciar',
    'RENOVADO ✅': 'status-renovado',
    'CONTRATADO ✅': 'status-contratado',
    'AGUR. DEFIN. DO GESTOR ⏳': 'status-aguardando-definicao' ,
    'ETP ATRASADO❗': 'status-etp-atrasado',
    'DFD ATRASADO❗': 'status-dfd-atrasado',
};

function assignStatusClasses() {
    const rows = document.querySelectorAll('table tbody tr');
    rows.forEach(row => {
        // Considerando que os status estão nas colunas 3 e 6
        const cells = row.querySelectorAll('td');
        [4, 7].forEach(index => {
            const cell = cells[index];
            if (cell) {
                const statusText = cell.textContent.trim();
                if (statusMapping[statusText]) {
                    cell.classList.add(statusMapping[statusText]);
                    console.log(`Classe "${statusMapping[statusText]}" aplicada à célula com texto "${statusText}"`);
                }
            }
        });
    });
}

// Chama a função após o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    // a tabela já foi preenchida por funcoes.js, só aplicamos as classes:
    assignStatusClasses();
});