/*  JS/emoji animation function.js  */

/* Função para o emoji 💣 */
function createSpan(text) {
    const replaced = text.replace(/💣/g, '<span class="emoji-bomba">💣</span>');
    const wrapper = document.createElement('span');
    wrapper.innerHTML = replaced;
    return wrapper;
}

function aplicarAnimacaoBomba() {
    // 1. Substitui em todas as células da coluna "Status do Processo"
    document.querySelectorAll('table tbody tr td:nth-child(6)').forEach(cell => {
        if (cell.innerHTML.includes('💣')) {
            cell.innerHTML = cell.innerHTML.replace(/💣/g, '<span class="emoji-bomba">💣</span>');
        }
    });

    // 1b. Substitui também dentro do span de destaque do status atrasado
    document.querySelectorAll('.status-autuacao-atrasada-highlight').forEach(span => {
        if (span.innerHTML.includes('💣')) {
            span.innerHTML = span.innerHTML.replace(/💣/g, '<span class="emoji-bomba">💣</span>');
        }
    });

    // 2. Substitui em qualquer outro texto puro do body (casos fora da tabela)
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const targets = [];
    let node;
    while ((node = walker.nextNode())) {
        if (node.nodeValue.includes('💣')) targets.push(node);
    }
    targets.forEach(txt =>
      txt.parentNode.replaceChild(createSpan(txt.nodeValue), txt)
    );
}

/* Função para o emoji ⏳ */
function createSpanHourglass(text) {
    const replaced = text.replace(/⏳/g, '<span class="emoji-hourglass">⏳</span>');
    const wrapper = document.createElement('span');
    wrapper.innerHTML = replaced;
    return wrapper;
}

function aplicarAnimacaoHourglass() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const targets = [];
    let node;
    while ((node = walker.nextNode())) {
        if (node.nodeValue.includes('⏳')) targets.push(node);
    }
    targets.forEach(txt =>
      txt.parentNode.replaceChild(createSpanHourglass(txt.nodeValue), txt)
    );
}

/* Função para o emoji ❗ */
function createSpanExclamation(text) {
    const replaced = text.replace(/❗/g, '<span class="emoji-exclamation">❗</span>');
    const wrapper = document.createElement('span');
    wrapper.innerHTML = replaced;
    return wrapper;
}

function aplicarAnimacaoExclamation() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const targets = [];
    let node;
    while ((node = walker.nextNode())) {
        if (node.nodeValue.includes('❗')) targets.push(node);
    }
    targets.forEach(txt =>
      txt.parentNode.replaceChild(createSpanExclamation(txt.nodeValue), txt)
    );
}

/* Expondo as funções */
document.addEventListener('DOMContentLoaded', () => {
    aplicarAnimacaoBomba();
    aplicarAnimacaoHourglass();
    aplicarAnimacaoExclamation();
});
window.aplicarAnimacaoBomba = aplicarAnimacaoBomba;
window.aplicarAnimacaoHourglass = aplicarAnimacaoHourglass;
window.aplicarAnimacaoExclamation = aplicarAnimacaoExclamation;
