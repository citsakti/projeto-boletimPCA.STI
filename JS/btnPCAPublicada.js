/**
 * btnPCAPublicada.js - Gerenciador do modal para visualização do documento PCA 2025 publicado
 * 
 * Este script é responsável por:
 *  - Implementar a funcionalidade do botão "PCA PUBLICADA"
 *  - Exibir um modal com o documento oficial do PCA 2025 em um iframe
 *  - Gerenciar a exibição/ocultação do modal e seus eventos associados
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Elementos de Interface:
 *   - Botão PCA Publicada: Identificado pelo ID 'btnPCAPublicada'
 *   - Modal Overlay: Identificado pelo ID 'processo-modal-overlay'
 *   - Iframe: Identificado pelo ID 'processo-iframe'
 *   - Botão de fechar: Identificado pelo ID 'close-modal-btn'
 * 
 * # Funções Principais:
 *   - openPCAModal(): Abre o modal e carrega o documento PCA no iframe
 *   - closeModal(): Fecha o modal e limpa o iframe
 *   - Listeners para fechar o modal: botão, clique fora, tecla ESC
 * 
 * # Fluxo de Execução:
 *   1. Inicializa com o modal fechado
 *   2. Ao clicar no botão PCA Publicada, abre o modal
 *   3. O documento é carregado no iframe
 *   4. O usuário pode fechar o modal por diversas formas
 * 
 * # Dependências:
 *   - Elementos do modal no HTML da página
 *   - URL do documento PCA 2025 definida no script
 */

document.addEventListener('DOMContentLoaded', function() {
    // Referência ao botão PCA Publicada
    const btnPCAPublicada = document.getElementById('btnPCAPublicada');
    
    // Referências aos elementos do modal
    const modalOverlay = document.getElementById('processo-modal-overlay');
    const iframe = document.getElementById('processo-iframe');
    const closeButton = document.getElementById('close-modal-btn');
    const modalContent = document.querySelector('.modal-content');
    
    // URL do documento PCA 2025
    const pcaUrl = 'https://www.tce.ce.gov.br/component/jdownloads/send/324-plano-de-contratacoes-anual-2025/4539-pca-2025';
    
    // Função para abrir o modal
    function openPCAModal() {
        // Define a URL no iframe
        iframe.src = pcaUrl;
        
        // Exibe o overlay
        modalOverlay.style.display = 'flex';
        
        // Pequeno atraso para aplicar a animação
        setTimeout(() => {
            modalContent.classList.add('show');
        }, 10);
        
        // Previne rolagem da página de fundo
        document.body.style.overflow = 'hidden';
    }
    
    // Função para fechar o modal
    function closePCAModal() {
        // Remove a classe de animação
        modalContent.classList.remove('show');
        
        // Atraso para ocultar o modal após a animação
        setTimeout(() => {
            modalOverlay.style.display = 'none';
            // Limpa o iframe para evitar problemas de desempenho
            iframe.src = 'about:blank';
        }, 400); // Tempo da transição definida no CSS
        
        // Restaura a rolagem da página
        document.body.style.overflow = '';
    }
    
    // Event listener para abrir o modal ao clicar no botão
    btnPCAPublicada.addEventListener('click', openPCAModal);
    
    // Event listeners para fechar o modal
    closeButton.addEventListener('click', closePCAModal);
    
    // Fecha o modal ao clicar fora do conteúdo
    modalOverlay.addEventListener('click', function(event) {
        if (event.target === modalOverlay) {
            closePCAModal();
        }
    });
    
    // Fecha o modal ao pressionar a tecla ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modalOverlay.style.display === 'flex') {
            closePCAModal();
        }
    });
});