/**
 * btnCancelados.js - Gerenciador de visibilidade dos projetos cancelados no Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Controlar a visibilidade das linhas com status "CANCELADO ❌" na tabela principal
 *  - Gerenciar o botão de alternância para mostrar/ocultar projetos cancelados
 *  - Atualizar a interface em tempo real conforme a preferência do usuário
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Elementos de Interface:
 *   - Botão de alternância: Identificado pelo ID 'btnToggleCancelados'
 *   - Linhas da tabela: Selecionadas com base no texto "CANCELADO ❌" na coluna de status
 * 
 * # Funções Principais:
 *   - updateCancelados(): Atualiza a visibilidade das linhas canceladas
 *   - toggleCancelados(): Alterna o estado de exibição e atualiza a interface
 * 
 * # Fluxo de Execução:
 *   1. Inicializa com projetos cancelados ocultos por padrão
 *   2. Configura event listener para o botão de alternância
 *   3. Atualiza a interface quando o usuário interage com o botão
 *   4. Reaplica cores alternadas às linhas visíveis após alteração
 * 
 * # Dependências:
 *   - Função alternaCoresLinhas (definida em outro arquivo)
 *   - Event listeners para interatividade
 */

document.addEventListener('DOMContentLoaded', () => {
    const btnToggle = document.getElementById('btnToggleCancelados');
    window.canceladosOcultos = true;

    /**
     * Atualiza a visibilidade das linhas da tabela que contêm o status de cancelamento "CANCELADO ❌".
     *
     * Esta função seleciona todas as linhas dentro do corpo da tabela e verifica a sexta célula de cada linha 
     * (índice 5) para identificar o texto de cancelamento. Com base na variável booleana global `canceladosOcultos`, 
     * ela oculta ou exibe essas linhas. Também atualiza o conteúdo do botão global `btnToggle` para refletir o 
     * estado atual da visibilidade dos cancelamentos.
     *
     * Após ajustar a exibição das linhas, se a função `alternaCoresLinhas` estiver definida, 
     * ela é chamada para reaplicar as cores alternadas nas linhas visíveis.
     *
     * @function updateCancelados
     */
    function updateCancelados() {
        const rows = document.querySelectorAll('table tbody tr');
        rows.forEach(row => {
            const statusCell = row.querySelectorAll('td')[5];
            if (statusCell && statusCell.textContent.includes('CANCELADO ❌')) {
                row.style.display = window.canceladosOcultos ? 'none' : '';
            }
        });
        btnToggle.textContent = window.canceladosOcultos
            ? 'Revelar Cancelados ❌'
            : 'Ocultar Cancelados ❌';
        // Reaplica alternância de cores após ocultar/exibir linhas
        if (typeof alternaCoresLinhas === 'function') alternaCoresLinhas();
    }

    // Monitora quando a tabela for povoada pelo CSV
    const tbody = document.querySelector('table tbody');
    const observer = new MutationObserver((mutations, obs) => {
        if (tbody.querySelector('tr')) {
            updateCancelados();
            obs.disconnect();
        }
    });
    observer.observe(tbody, { childList: true });

    btnToggle.addEventListener('click', () => {
        window.canceladosOcultos = !window.canceladosOcultos;
        updateCancelados();
    });
});
