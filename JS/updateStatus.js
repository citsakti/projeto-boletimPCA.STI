function updateStatus() {
    const footerParagraph = document.querySelector('footer p');
    const now = new Date();
    const date = now.toLocaleDateString('pt-BR');
    const time = now.toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    footerParagraph.textContent = `Status atualizado em: ${date} ${time}`;
}

updateStatus();