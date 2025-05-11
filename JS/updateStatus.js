/**
 * Atualiza o texto de status do rodapé, definindo-o com a data e hora atual.
 *
 * A função seleciona um elemento de parágrafo dentro do rodapé e formata a data
 * e a hora atual utilizando a localidade 'pt-BR'. A hora é exibida no formato 24 horas com horas,
 * minutos e segundos.
 *
 * @function updateStatus
 */
function updateStatus() {
    const footerParagraph = document.querySelector('footer p');
    const now = new Date();
    const date = now.toLocaleDateString('pt-BR');
    const time = now.toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    footerParagraph.textContent = `Status atualizado em: ${date} ${time}`;
}

document.addEventListener('DOMContentLoaded', updateStatus);