/**
 * MobileCardsStyles.js - Centralizador de mapeamento de classes CSS para sistema mobile
 * 
 * Este script é responsável por:
 *  - Mapear status de projetos para classes CSS específicas
 *  - Mapear áreas de projetos para classes de cor e estilo
 *  - Mapear tipos de orçamento para classes visuais
 *  - Centralizar lógica de formatação de texto e emojis
 *  - Garantir consistência visual entre todos os cards mobile
 * 
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Sistemas de Mapeamento:
 *   - Status Mapping: statusMap - Mapeia status para classes CSS
 *   - Area Mapping: areaMap - Mapeia áreas para classes de cor
 *   - Orçamento Mapping: orcamentoMap - Mapeia tipos para classes visuais
 * 
 * # Métodos Principais:
 *   - getStatusClass(): Retorna classe CSS para status específico
 *   - getAreaClass(): Retorna classe CSS para área específica
 *   - getOrcamentoClass(): Retorna classe CSS para tipo de orçamento
 *   - formatStatusText(): Formata texto de status com emojis
 *   - getStatusHighlightClass(): Retorna classe de destaque para status
 * 
 * # Padrões de Classes:
 *   - Status: 'status-[nome-normalizado]' (ex: 'status-autuacao-atrasada')
 *   - Status Highlight: '[classe-base]-highlight' para texto destacado
 *   - Áreas: 'area-[nome-normalizado]' (ex: 'area-presidencia')
 *   - Orçamento: 'orcamento-[tipo]' (ex: 'orcamento-obras')
 * 
 * # Status Suportados:
 *   - AUTUAÇÃO ATRASADA 💣 → status-autuacao-atrasada
 *   - EM RENOVAÇÃO 🔄 → status-em-renovacao
 *   - CANCELADO ❌ → status-cancelado
 *   - EM CONTRATAÇÃO 🤝 → status-em-contratacao
 *   - CONTRATADO ✅ → status-contratado
 *   - E muitos outros conforme definido no sistema
 * 
 * # Áreas Suportadas:
 *   - Presidência, Gabinete da Presidência
 *   - STI - Secretaria de Tecnologia da Informação
 *   - Corregedoria, Ouvidoria
 *   - Diversas outras áreas do tribunal
 * 
 * # Formatação de Texto:
 *   - Preservação de emojis em status
 *   - Normalização de nomes para classes CSS
 *   - Tratamento de caracteres especiais
 *   - Fallback para classes padrão quando necessário
 * 
 * # Integração:
 *   - Utilizado pelo MobileCardsRenderer para aplicar estilos
 *   - Baseado em StatusClasses.js e AreasClasses.js do sistema principal
 *   - Coordena com arquivos CSS em css/components/ e css/mobile/
 *   - Mantém consistência com sistema de cores e estilos globais
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
