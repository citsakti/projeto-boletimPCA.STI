/**
 * AnalyticsDiasAtraso.js - Sistema de exibição de dias de atraso para projetos
 * 
 * Este script é responsável por:
 *  - Renderizar tags com o número de dias de atraso para projetos com status "AUTUAÇÃO ATRASADA 💣"
 *  - Aplicar estilização apropriada usando classes CSS existentes
 *  - Integrar com o sistema de analytics existente
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Funções Principais:
 *   - renderDiasAtrasoTag(): Cria a tag visual com os dias de atraso
 *   - formatDiasAtraso(): Formata o texto da tag conforme os dados
 * 
 * # Integração:
 *   - Utiliza dados processados do Analytics.js
 *   - Aplica CSS do StatusAtrasado.css para consistência visual
 *   - Funciona especificamente com a categoria "autuacaoAtrasada"
 * 
 * # Dependências:
 *   - Analytics.js para dados processados
 *   - AnalyticsDetails.js para integração na renderização
 *   - StatusAtrasado.css para estilização
 */

/**
 * Renderiza uma tag com os dias de atraso para um projeto
 * @param {string|number} diasAtraso - Número de dias de atraso ou string com informação
 * @returns {string} - HTML da tag formatada
 */
function renderDiasAtrasoTag(diasAtraso) {
    if (!diasAtraso || diasAtraso === '') {
        return '';
    }
    
    // Verificar se é um número válido
    const diasNumerico = parseInt(diasAtraso, 10);
    let textoTag = '';
    
    if (!isNaN(diasNumerico) && diasNumerico > 0) {
        // Se for um número válido, mostrar como "[X] dias Atrasado"
        textoTag = `[${diasNumerico}] dias Atrasado`;
    } else {
        // Se não for um número, mostrar a informação como está
        textoTag = String(diasAtraso);
    }
    
    return `<span class="dias-atraso-tag">${textoTag}</span>`;
}

/**
 * Formata os dias de atraso para exibição na tabela de detalhes
 * @param {string|number} diasAtraso - Dados dos dias de atraso
 * @returns {string} - Texto formatado para exibição
 */
function formatDiasAtraso(diasAtraso) {
    if (!diasAtraso || diasAtraso === '') {
        return '';
    }
    
    const diasNumerico = parseInt(diasAtraso, 10);
    
    if (!isNaN(diasNumerico) && diasNumerico > 0) {
        return `${diasNumerico} dias`;
    }
    
    return String(diasAtraso);
}

/**
 * Verifica se um projeto tem status de autuação atrasada
 * @param {string} status - Status do projeto
 * @returns {boolean} - True se for autuação atrasada
 */
function isAutuacaoAtrasada(status) {
    return status && status.includes('AUTUAÇÃO ATRASADA');
}

/**
 * Aplica estilização CSS para as tags de dias de atraso
 */
function applyDiasAtrasoStyles() {
    // Adicionar CSS inline se não existir
    const existingStyle = document.getElementById('dias-atraso-styles');
    if (existingStyle) return;
    
    const style = document.createElement('style');
    style.id = 'dias-atraso-styles';
    style.textContent = `
        .dias-atraso-tag {
            display: inline-block;
            background: linear-gradient(135deg, #ff5722 0%, #d32f2f 100%);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 8px;
            border: 1px solid #b71c1c;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            text-shadow: 1px 1px 1px rgba(0,0,0,0.3);
        }
        
        .project-details-table .dias-atraso-tag {
            vertical-align: middle;
        }
        
        @media (max-width: 768px) {
            .dias-atraso-tag {
                font-size: 10px;
                padding: 2px 6px;
                margin-left: 4px;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Aplicar estilos quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    applyDiasAtrasoStyles();
});

// Também aplicar quando a página de analytics for carregada
document.addEventListener('analytics-loaded', function() {
    applyDiasAtrasoStyles();
});
