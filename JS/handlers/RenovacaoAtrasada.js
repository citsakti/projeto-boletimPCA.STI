/**
 * RenovacaoAtrasada.js - Sistema de alerta visual para renovações de contratos do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Destacar visualmente linhas de renovação conforme a proximidade do vencimento
 *  - Aplicar códigos de cores para diferentes níveis de urgência
 *  - Monitorar alterações na tabela para manter alertas visuais atualizados
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Componentes Visuais:
 *   - Coloração laranja: Para contratos com até 30 dias para vencimento
 *   - Coloração vermelha: Para contratos com 20 dias ou menos, ou já vencidos
 * 
 * # Funções Principais:
 *   - verificarRenovacoesProximas(): Função principal que analisa e aplica estilos
 * 
 * # Fluxo de Execução:
 *   1. Aguarda o evento 'tabela-carregada' para iniciar verificação
 *   2. Percorre todas as linhas da tabela após pequeno atraso
 *   3. Identifica linhas com status "EM RENOVAÇÃO"
 *   4. Analisa a data da coluna "Contratar Até"
 *   5. Calcula a diferença entre data de vencimento e data atual
 *   6. Aplica coloração conforme proximidade do vencimento
 * 
 * # Lógica de Negócio:
 *   - Colunas acessadas: status (5) e data de contratação (6)
 *   - Formato de data esperado: DD/MM/AAAA
 *   - Só altera linhas com status "EM RENOVAÇÃO"
 * 
 * # Dependências:
 *   - Evento customizado 'tabela-carregada'
 *   - Estrutura da tabela com colunas específicas
 */

// Aguarda o evento personalizado 'tabela-carregada' para iniciar a verificação das renovações.
document.addEventListener('tabela-carregada', () => {
    // Pequeno atraso para garantir que outras manipulações do DOM sejam concluídas antes.
    setTimeout(verificarRenovacoesProximas, 150);
});

/**
 * Função principal que percorre as linhas da tabela e aplica a coloração conforme as regras de vencimento.
 */
function verificarRenovacoesProximas() {
    // Obtém a data atual e normaliza para o início do dia.
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Define os intervalos de 30 e 20 dias em milissegundos.
    const trintaDiasEmMs = 30 * 24 * 60 * 60 * 1000;
    const vinteDiasEmMs = 20 * 24 * 60 * 60 * 1000;

    // Seleciona todas as linhas do corpo da tabela.
    const linhasTabela = document.querySelectorAll('table tbody tr');

    // Percorre cada linha da tabela.
    linhasTabela.forEach(linha => {
        // Obtém as células de status e de data de contratação.
        const celulaStatus = linha.cells[5]; // Coluna "Status do Processo"
        const celulaContratarAte = linha.cells[6]; // Coluna "Contratar Até"

        // Reseta a cor de cada célula da linha para o padrão.
        Array.from(linha.cells).forEach(cell => {
            cell.style.removeProperty('color');
        });

        // Verifica se ambas as células existem.
        if (celulaStatus && celulaContratarAte) {
            const statusTextoVisivel = celulaStatus.textContent.trim();
            const contratarAteTexto = celulaContratarAte.textContent.trim();

            // Só aplica a lógica se o status for "EM RENOVAÇÃO".
            if (statusTextoVisivel.includes('EM RENOVAÇÃO 🔄')) {
                // Divide a data no formato DD/MM/AAAA.
                const partesData = contratarAteTexto.split('/');
                if (partesData.length === 3) {
                    const dia = parseInt(partesData[0], 10);
                    const mes = parseInt(partesData[1], 10) - 1; // Meses em JS começam do zero.
                    const ano = parseInt(partesData[2], 10);
                    const dataContratarAte = new Date(ano, mes, dia);
                    dataContratarAte.setHours(0, 0, 0, 0);

                    // Verifica se a data é válida.
                    if (!isNaN(dataContratarAte.getTime())) {
                        // Calcula a diferença em milissegundos entre a data de contratação e hoje.
                        const diffTempo = dataContratarAte.getTime() - hoje.getTime();

                        // Se faltar até 30 dias, pinta cada célula de laranja escuro.
                        if (diffTempo >= 0 && diffTempo <= trintaDiasEmMs) {
                            Array.from(linha.cells).forEach(cell => {
                                cell.style.setProperty('color', 'darkorange', 'important');
                            });
                        }

                        // Se faltar 20 dias ou menos, ou já venceu, pinta cada célula de vermelho.
                        if (diffTempo <= vinteDiasEmMs) {
                            Array.from(linha.cells).forEach(cell => {
                                cell.style.setProperty('color', 'red', 'important');
                            });
                        }
                    }
                }
            }
        }
    });
}