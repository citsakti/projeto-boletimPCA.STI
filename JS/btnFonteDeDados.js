/**
 * Script responsável por exibir um modal com a fonte de dados (planilha Google) ao clicar no botão "Fonte de Dados".
 * 
 * Funcionalidades:
 * - Ao clicar no botão com ID 'btnFonteDeDados', abre um modal exibindo a planilha de dados em um iframe.
 * - Reutiliza os elementos do modal já existentes na página (compartilhados com btnPCAPublicada.js).
 * - Aplica animação de entrada ao modal e impede a rolagem da página de fundo enquanto o modal está aberto.
 * 
 * Observações:
 * - Os elementos do modal (overlay, iframe, conteúdo) devem existir no HTML com os IDs corretos.
 * - A lógica de fechamento do modal (botão fechar, clique fora, tecla ESC) é gerenciada pelo script btnPCAPublicada.js.
 * - Caso utilize um modal separado, será necessário replicar os event listeners de fechamento neste script.
 */

document.addEventListener('DOMContentLoaded', function() {
    const btnFonteDeDados = document.getElementById('btnFonteDeDados');

    // Reutiliza os elementos do modal existentes definidos em btnPCAPublicada.js ou no HTML
    const modalOverlay = document.getElementById('processo-modal-overlay');
    const iframe = document.getElementById('processo-iframe');
    const modalContent = document.querySelector('.modal-content'); // Usado para a animação 'show'

    const fonteDeDadosUrl = 'https://docs.google.com/spreadsheets/d/1ZYquCMfNlBvYYoZ3uxZrW2Vewejcet43FeD3HBh8oLM/edit?usp=sharing';

    function openFonteDeDadosModal() {
        if (iframe && modalOverlay && modalContent) {
            iframe.src = fonteDeDadosUrl;
            modalOverlay.style.display = 'flex';
            // Adiciona a classe 'show' para a animação de entrada
            setTimeout(() => {
                modalContent.classList.add('show');
            }, 10); // Pequeno atraso para garantir que a transição CSS seja aplicada
            document.body.style.overflow = 'hidden'; // Previne rolagem da página de fundo
        } else {
            console.error('Elementos do modal não foram encontrados. Verifique os IDs no HTML e no script btnPCAPublicada.js.');
        }
    }

    if (btnFonteDeDados) {
        btnFonteDeDados.addEventListener('click', openFonteDeDadosModal);
    } else {
        console.error('Botão com ID "btnFonteDeDados" não encontrado no HTML.');
    }

    // A lógica para fechar o modal (clique no botão de fechar, clique fora, tecla ESC)
    // é gerenciada pelo script btnPCAPublicada.js, pois os elementos do modal são compartilhados.
    // Se você criar um modal separado para esta funcionalidade, precisará replicar
    // os event listeners de fechamento aqui também.
});