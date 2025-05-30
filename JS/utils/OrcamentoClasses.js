/**
 * orcamento-classes.js - Gerenciador de formatação visual para tipos de orçamento no Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Definir o mapeamento entre tipos de orçamento e classes CSS correspondentes
 *  - Aplicar formatação visual diferenciada para valores de custeio e investimento
 *  - Manter consistência visual em todos os componentes do sistema
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Mapeamento de Orçamento:
 *   - Relaciona textos de tipo de orçamento (com emojis) às classes CSS
 *   - Diferencia visualmente 'CUSTEIO 💳' e 'INVESTIMENTO 💵'
 * 
 * # Funções Principais:
 *   - assignOrcamentoClasses(): Aplica classes CSS às células de orçamento
 *   - Seleciona células da tabela na coluna de orçamento (9ª coluna)
 *   - Substitui o texto por spans estilizados conforme o tipo
 * 
 * # Fluxo de Execução:
 *   1. Script é executado ao carregar o DOM
 *   2. Também é executado após o evento 'tabela-carregada'
 *   3. Percorre todas as linhas da tabela e formata as células de orçamento
 * 
 * # Dependências:
 *   - Requer estilos CSS correspondentes definidos na folha de estilos
 *   - Responde ao evento customizado 'tabela-carregada'
 */

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