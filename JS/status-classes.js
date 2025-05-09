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
    'ELABORANDO TR📝': 'status-elaborando-tr',
    'ANÁLISE DE VIABILIDADE 📝': 'status-analise-viabilidade',

};

function assignStatusClasses() {
    const rows = document.querySelectorAll('table tbody tr');
    rows.forEach(row => {
        const cell = row.querySelectorAll('td')[5]; // Certifique-se que este é o índice correto da coluna de status
        if (!cell) return;

        const txt = cell.textContent.trim();
        // Adicione este log para verificar o texto exato:
        if (txt.includes('ELABORANDO TR') || txt.includes('ANÁLISE DE VIABILIDADE')) {
            console.log('Texto da célula para mapeamento:', `"${txt}"`);
        }

        const base = statusMapping[txt];
        if (!base) {
            if (txt.includes('ELABORANDO TR') || txt.includes('ANÁLISE DE VIABILIDADE')) {
                console.log('Nenhuma classe base encontrada para:', `"${txt}"`);
            }
            return;
        }

        const content = txt
            .replace(/💣/g, '<span class="emoji-bomba">💣</span>')
            .replace(/⏳/g, '<span class="emoji-hourglass">⏳</span>')
            .replace(/❗/g, '<span class="emoji-exclamation">❗</span>');

        cell.innerHTML = `<span class="${base}-highlight">${content}</span>`;
    });
}

// Chama a função após o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    assignStatusClasses();
});
