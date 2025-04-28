/*  JS/emoji animation function.js  */

/* Função para o emoji 💣 */
function createSpan(text) {
    const replaced = text.replace(/💣/g, '<span class="emoji-bomba">💣</span>');
    const wrapper = document.createElement('span');
    wrapper.innerHTML = replaced;
    return wrapper;
}

function aplicarAnimacaoBomba() {
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
