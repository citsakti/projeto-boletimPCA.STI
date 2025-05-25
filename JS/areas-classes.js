/**
 * areas-classes.js - Utilitário para formatação visual de áreas no Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Definir o mapeamento entre nomes de áreas e classes CSS
 *  - Aplicar formatação visual específica às células de áreas nas tabelas
 *  - Disponibilizar funções globais para (re)aplicar formatação quando necessário
 *  - Garantir consistência visual entre os diversos componentes do sistema
 * 
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Mapeamento de Áreas:
 *   - Define uma relação entre nomes de áreas (com emojis) e classes CSS
 *   - Permite estilização consistente em todo o sistema
 *   - Centraliza o controle de aparência visual por área
 * 
 * # Funções Principais:
 *   - assignAreaClasses(): Aplica classes CSS às células de área nas tabelas
 *   - Usa seletores DOM para encontrar células de área
 *   - Substitui o texto da célula por um <span> estilizado
 * 
 * # Fluxo de Execução:
 *   1. O script define o mapeamento de áreas para classes CSS
 *   2. A função assignAreaClasses é declarada
 *   3. Listeners são configurados para aplicar a formatação em momentos-chave:
 *      - Após o carregamento do DOM
 *      - Após o carregamento da tabela (evento personalizado 'tabela-carregada')
 *   4. A função é exposta globalmente para ser chamada de outros scripts
 * 
 * # Integração:
 *   - As classes CSS específicas (como 'area-sti-highlight') estão definidas no CSS
 *   - O script responde ao evento personalizado 'tabela-carregada'
 *   - A função é exposta no objeto window para uso por outros scripts
 * 
 * # Padrão Visual:
 *   - Cada área tem uma cor e estilo específicos
 *   - A formatação é aplicada via span com classes CSS apropriadas
 *   - Os emojis são mantidos intactos para identificação visual rápida
 */

/**
 * Mapeamento de nomes de áreas para classes CSS base
 * Cada área tem um prefixo de classe CSS que será usado para estilização
 */
const areaMapping = {
    'STI 👩‍💼': 'area-sti',
    'OPERAÇÕES 🗄️': 'area-operacoes',
    'DEV 👨‍💻': 'area-dev',
    'ANALYTICS 📊': 'area-analytics',
    'GOVERNANÇA 🌐': 'area-governanca',
};

/**
 * Aplica classes CSS às células de área nas tabelas
 * Procura por células na segunda coluna (índice 1) de todas as tabelas
 * e adiciona spans com classes específicas para cada área
 */
function assignAreaClasses() {
    document.querySelectorAll('table tbody tr').forEach(row => {
        const cell = row.querySelectorAll('td')[1]; // coluna Área
        if (!cell) return;

        const txt = cell.textContent.trim();
        const base = areaMapping[txt];
        if (!base) return;

        cell.innerHTML = `<span class="${base}-highlight">${txt}</span>`;
    });
}

// Aplica a formatação de áreas em momentos-chave:

// 1. Após o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', () => {
    assignAreaClasses();
});

// 2. Após o carregamento/atualização da tabela (evento personalizado)
document.addEventListener('tabela-carregada', assignAreaClasses);

// Expõe a função globalmente para que possa ser chamada por outros scripts
window.assignAreaClasses = assignAreaClasses;

// NOTA: Este bloco de debug pode ser removido em produção
// Verifica a correspondência de texto para células de área
document.querySelectorAll('table tbody tr').forEach(row => {
    const cell = row.querySelector('td:nth-child(2)');
    console.log(`[${cell.textContent}] =>`, cell.textContent.trim() === 'ANALYTICS 📊');
});