document.addEventListener('tabela-carregada', () => {
    // Adiciona um pequeno atraso para permitir que outras manipulações do DOM,
    // como a formatação de status, sejam concluídas primeiro.
    setTimeout(verificarRenovacoesProximas, 150);
});

function verificarRenovacoesProximas() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Normaliza a data atual para ignorar o horário

    const trintaDiasEmMs = 30 * 24 * 60 * 60 * 1000; // 30 dias em milissegundos
    const vinteDiasEmMs = 20 * 24 * 60 * 60 * 1000; // 20 dias em milissegundos

    const linhasTabela = document.querySelectorAll('table tbody tr');

    linhasTabela.forEach(linha => {
        const celulaStatus = linha.cells[5]; // Coluna "Status do Processo" (índice 5)
        const celulaContratarAte = linha.cells[6]; // Coluna "Contratar Até" (índice 6)

        // Reseta a cor da linha para o padrão
        linha.style.color = ''; // Ou a cor padrão do seu CSS, se houver

        if (celulaStatus && celulaContratarAte) {
            // Limpeza do emoji 🙋‍♂️ e seus espaços (literais ou &nbsp;)
            const emojiPrefixoPattern = /^🙋‍♂️(?:&nbsp;|\s)*/; // Regex para emoji no início seguido por &nbsp; ou espaços
            const emojiGlobalPattern = /🙋‍♂️(?:&nbsp;|\s)*/g;    // Regex para todas as ocorrências de emoji seguido por &nbsp; ou espaços

            const highlightSpan = celulaStatus.querySelector('span[class*="-highlight"]');
            if (highlightSpan) {
                // 1. Limpa o emoji 🙋‍♂️ e espaços do início do conteúdo INTERNO do span
                highlightSpan.innerHTML = highlightSpan.innerHTML.replace(emojiPrefixoPattern, '').trim();
                // 2. Restaura o conteúdo da célula para APENAS o span (já limpo internamente).
                // Isso remove qualquer emoji 🙋‍♂️ que estava FORA do span.
                celulaStatus.innerHTML = highlightSpan.outerHTML;
            } else {
                // Fallback se não houver span de highlight:
                // Remove todos os emojis 🙋‍♂️ e seus espaços do texto da célula.
                // Se o emoji só é esperado no início, emojiPrefixoPattern seria suficiente.
                // emojiGlobalPattern é mais robusto se o emoji puder aparecer em outros lugares por engano.
                celulaStatus.innerHTML = celulaStatus.innerHTML.replace(emojiGlobalPattern, '').trim();
            }

            const statusTextoVisivel = celulaStatus.textContent.trim(); // Recalcula após a limpeza
            const contratarAteTexto = celulaContratarAte.textContent.trim();

            if (statusTextoVisivel.includes('EM RENOVAÇÃO 🔄')) {
                const partesData = contratarAteTexto.split('/'); // Formato esperado: DD/MM/AAAA
                if (partesData.length === 3) {
                    const dia = parseInt(partesData[0], 10);
                    const mes = parseInt(partesData[1], 10) - 1; // Meses em JavaScript são 0-indexados
                    const ano = parseInt(partesData[2], 10);
                    const dataContratarAte = new Date(ano, mes, dia);
                    dataContratarAte.setHours(0, 0, 0, 0); // Normaliza a data do contrato

                    if (!isNaN(dataContratarAte.getTime())) { // Verifica se a data é válida
                        const diffTempo = dataContratarAte.getTime() - hoje.getTime();

                        // Adiciona emoji 🙋‍♂️ se faltar 30 dias ou menos, à ESQUERDA e FORA do span de highlight
                        if (diffTempo >= 0 && diffTempo <= trintaDiasEmMs) {
                            // Para garantir dois espaços visíveis, usamos &nbsp; (non-breaking space).
                            // A limpeza do emoji e espaços antigos já ocorreu nas linhas anteriores.
                            const doisEspacosVisiveis = '&nbsp;&nbsp;';
                            celulaStatus.innerHTML = '🙋‍♂️' + doisEspacosVisiveis + celulaStatus.innerHTML;
                        }

                        // Muda a cor da linha para vermelho se faltar 20 dias ou menos
                        if (diffTempo >= 0 && diffTempo <= vinteDiasEmMs) {
                            linha.style.color = 'red';
                        }
                    }
                }
            }
        }
    });
}
