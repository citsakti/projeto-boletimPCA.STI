/**
 * Script para destacar visualmente linhas de uma tabela conforme a proximidade do vencimento do contrato.
 * 
 * Funcionalidade:
 * - Colore as linhas de laranja escuro quando faltam até 30 dias para o vencimento.
 * - Colore as linhas de vermelho quando faltam 20 dias ou menos, ou se o contrato já está vencido.
 * 
 * Como funciona:
 * - Aguarda o evento personalizado 'tabela-carregada' para iniciar a verificação.
 * - Após um pequeno atraso, percorre todas as linhas da tabela.
 * - Para cada linha, verifica se o status é "EM RENOVAÇÃO".
 * - Se for, analisa a data da coluna "Contratar Até".
 * - Calcula a diferença entre a data de vencimento e a data atual.
 * - Aplica a cor conforme a proximidade do vencimento.
 * 
 * Observações:
 * - As colunas são acessadas pelos índices: status (5) e data de contratação (6).
 * - O formato de data esperado é DD/MM/AAAA.
 * - O script não altera linhas cujo status não seja "EM RENOVAÇÃO".
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

        // Reseta a cor da linha para o padrão.
        linha.style.color = '';

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

                        // Se faltar até 30 dias, pinta de laranja escuro.
                        if (diffTempo >= 0 && diffTempo <= trintaDiasEmMs) {
                            linha.style.color = 'darkorange';
                        }

                        // Se faltar 20 dias ou menos, ou já venceu, pinta de vermelho.
                        if (diffTempo <= vinteDiasEmMs) {
                            linha.style.color = 'red';
                        }
                    }
                }
            }
        }
    });
}