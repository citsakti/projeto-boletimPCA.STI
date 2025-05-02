console.log('fstatus-classes.js carregado');

const statusMapping = {
    'AUTUAÇÃO ATRASADA 💣': 'status-autuacao-atrasada',
    'EM RENOVAÇÃO 🔄': 'status-em-renovacao',
    'CANCELADO ❌': 'status-cancelado',
    'EM CONTRATAÇÃO 🤝': 'status-em-contratacao',
    'AGUARDANDO ETP ⏳': 'status-aguardando-etp',
    'AGUARDANDO DFD ⏳': 'status-aguardando-dfd',
    'A INICIAR ⏰': 'status-a-iniciar',
    'RENOVADO ✅': 'status-renovado',
    'CONTRATADO ✅': 'status-contratado',
    'AGUR. DEFIN. DO GESTOR ⏳': 'status-aguardando-definicao',
    'ETP ATRASADO❗': 'status-etp-atrasado',
    'DFD ATRASADO❗': 'status-dfd-atrasado',
    'CONTRATAÇÃO ATRASADA ⚠️': 'status-contratacao-atrasada',
};

function assignStatusClasses() {
    const rows = document.querySelectorAll('table tbody tr');
    rows.forEach(row => {
        const cell = row.querySelectorAll('td')[5];
        if (!cell) return;

        const txt = cell.textContent.trim();
        const base = statusMapping[txt];
        if (!base) return;

        // monta conteúdo (já com <span class="emoji-bomba">💣</span> quando houver)
        const content = txt
            .replace(/💣/g, '<span class="emoji-bomba">💣</span>')
            .replace(/⏳/g, '<span class="emoji-hourglass">⏳</span>')
            .replace(/❗/g, '<span class="emoji-exclamation">❗</span>');

        // envolve tudo num highlight específico
        cell.innerHTML = `<span class="${base}-highlight">${content}</span>`;
    });
}

function aplicarEstiloStatus() {
    const rows = document.querySelectorAll('#detalhes table tbody tr');
    rows.forEach(row => {
        if (row.textContent.includes('CONTRATAÇÃO ATRASADA ⚠️')) {
            row.classList.add('contratacao-atrasada');
        }
    });
}

// Chama a função após o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    assignStatusClasses();
});
