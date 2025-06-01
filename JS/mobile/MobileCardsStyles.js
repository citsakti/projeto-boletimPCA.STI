/**
 * MobileCardsStyles.js - Mapeamento de classes CSS para os cards mobile
 * 
 * Este módulo centraliza o mapeamento de estilos para:
 * - Status dos projetos
 * - Áreas dos projetos  
 * - Tipos de orçamento
 */

class MobileCardsStyles {
    /**
     * Retorna a classe CSS para um status específico
     * @param {string} status - Status do projeto
     * @returns {string} - Classe CSS correspondente
     */
    static getStatusClass(status) {
        // Mapeamento baseado no StatusClasses.js
        // Retorna a classe base, ex: 'status-autuacao-atrasada'
        // A variação '-highlight' será usada para o texto do status
        // e a classe base para o fundo do card.
        const statusMap = {
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
            'REVISÃO PCA 🚧': 'status-revisao-pca'
        };
        
        return statusMap[status] || 'status-default';
    }
    
    /**
     * Retorna a classe CSS para uma área específica
     * @param {string} area - Área do projeto
     * @returns {string} - Classe CSS correspondente
     */
    static getAreaClass(area) {
        // Mapeamento de nomes de áreas para classes CSS
        // Mantendo consistência com AreasClasses.js e Areas.css
        const areaMap = {
            'STI 👩‍💼': 'area-sti',
            'OPERAÇÕES 🗄️': 'area-operacoes',
            'DEV 👨‍💻': 'area-dev',
            'ANALYTICS 📊': 'area-analytics',
            'GOVERNANÇA 🌐': 'area-governanca',
        };

        // Procurar por correspondência exata primeiro (incluindo emoji)
        if (areaMap[area]) {
            return areaMap[area];
        }

        // Fallback para correspondência parcial (sem emoji ou variações)
        const areaLower = area.toLowerCase();
        if (areaLower.includes('sti')) return 'area-sti';
        if (areaLower.includes('operações') || areaLower.includes('operacoes')) return 'area-operacoes';
        if (areaLower.includes('dev')) return 'area-dev';
        if (areaLower.includes('analytics')) return 'area-analytics';
        if (areaLower.includes('governança') || areaLower.includes('governanca')) return 'area-governanca';
        
        return 'area-geral'; // Classe padrão caso nenhuma corresponda
    }

    /**
     * Retorna a classe CSS para um tipo de orçamento específico
     * @param {string} orcamento - Tipo de orçamento
     * @returns {string} - Classe CSS correspondente
     */
    static getOrcamentoClass(orcamento) {
        // Mapeamento de tipos de orçamento para classes CSS
        // Mantendo consistência com OrcamentoClasses.js e Orcamento.css
        const orcamentoMap = {
            'CUSTEIO 💳': 'orcamento-custeio-highlight',
            'INVESTIMENTO 💵': 'orcamento-investimento-highlight',
        };

        // Procurar por correspondência exata primeiro (incluindo emoji)
        if (orcamentoMap[orcamento]) {
            return orcamentoMap[orcamento];
        }

        // Fallback para correspondência parcial (sem emoji ou variações)
        const orcamentoLower = orcamento.toLowerCase();
        if (orcamentoLower.includes('custeio')) return 'orcamento-custeio-highlight';
        if (orcamentoLower.includes('investimento')) return 'orcamento-investimento-highlight';
        
        return ''; // Sem classe especial se não corresponder
    }

    /**
     * Processa o texto do status aplicando formatação de emojis
     * @param {string} statusText - Texto do status
     * @returns {string} - Texto formatado com spans para emojis
     */
    static formatStatusText(statusText) {
        let formattedText = statusText;
        
        if (statusText.includes('💣')) {
            formattedText = formattedText.replace('💣', '<span class="emoji-bomba">💣</span>');
        }
        if (statusText.includes('⏳')) {
            formattedText = formattedText.replace(/⏳/g, '<span class="emoji-hourglass">⏳</span>');
        }
        if (statusText.includes('❗')) {
            formattedText = formattedText.replace(/❗/g, '<span class="emoji-exclamation">❗</span>');
        }
        
        return formattedText;
    }
}

// Exportar para uso global
window.MobileCardsStyles = MobileCardsStyles;

console.log('MobileCardsStyles.js carregado');
