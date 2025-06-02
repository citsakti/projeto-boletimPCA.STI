/**
 * status-classes.js - Mapeamento de status para classes CSS no Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Definir o mapeamento entre texto de status e classes CSS correspondentes
 *  - Fornecer constantes para aplicação consistente de estilos visuais
 *  - Permitir a identificação visual rápida do status de cada projeto
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Mapeamento de Status:
 *   - Relaciona cada texto de status (com emoji) à sua classe CSS
 *   - Organizado por categorias semânticas (atrasado, em andamento, concluído, etc.)
 *   - Utilizado por várias partes do sistema para formatação visual
 * 
 * # Utilização:
 *   - Importado por outros scripts para acesso ao mapeamento
 *   - Aplicado às células de status nas tabelas
 *   - Mantém consistência visual em toda a aplicação
 * 
 * # Dependências:
 *   - Requer os estilos CSS correspondentes definidos na folha de estilos
 *   - Usado por scripts que manipulam a tabela principal
 */

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
    'REVISÃO PCA 🚧': 'status-revisao-pca',
};

function assignStatusClasses() {
    const rows = document.querySelectorAll('table tbody tr');
    rows.forEach(row => {
        const cell = row.querySelectorAll('td')[5]; // Certifique-se que este é o índice correto da coluna de status
        if (!cell) return;

        const txt = cell.textContent.trim();
        
        // Adicione logs para depuração de status específicos
        if (txt.includes('REVISÃO PCA') || txt.includes('A INICIAR')) {
            console.log('Texto da célula para mapeamento:', `"${txt}"`);
        }

        const base = statusMapping[txt];
        if (!base) {
            if (txt.includes('REVISÃO PCA') || txt.includes('A INICIAR')) {
                console.log('Nenhuma classe base encontrada para:', `"${txt}"`);
            }
            return;
        }

        // Tratamento de emojis especiais
        let content = txt;
        
        // Tratamento específico para os emojis dos status
        if (txt.includes('🚧')) {
            content = content.replace(/🚧/g, '<span class="emoji-construcao">🚧</span>');
        }
        if (txt.includes('⏰')) {
            content = content.replace(/⏰/g, '<span class="emoji-relogio">⏰</span>');
        }
        if (txt.includes('💣')) {
            content = content.replace(/💣/g, '<span class="emoji-bomba">💣</span>');
        }
        if (txt.includes('⏳')) {
            content = content.replace(/⏳/g, '<span class="emoji-hourglass">⏳</span>');
        }
        if (txt.includes('❗')) {
            content = content.replace(/❗/g, '<span class="emoji-exclamation">❗</span>');
        }

        cell.innerHTML = `<span class="${base}-highlight">${content}</span>`;
    });
}

// Chama a função após o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    assignStatusClasses();
});
