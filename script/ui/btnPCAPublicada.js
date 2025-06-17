// filepath: c:\Users\citib\OneDrive\Desktop\Reposit�rio GIT\projeto-boletimPCA.STI.2025\JS\ui\btnPCAPublicada.js
/**
 * btnPCAPublicada.js - Gerenciador do modal para visualiza��o do documento PCA 2025 publicado
 * 
 * Este script � respons�vel por:
 *  - Implementar a funcionalidade do bot�o "PCA PUBLICADA"
 *  - Exibir um modal com o documento oficial do PCA 2025 em um iframe
 *  - Gerenciar a exibi��o/oculta��o do modal e seus eventos associados
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Elementos de Interface:
 *   - Bot�o PCA Publicada: Identificado pelo ID 'btnPCAPublicada'
 *   - Modal Overlay: Identificado pelo ID 'processo-modal-overlay'
 *   - Iframe: Identificado pelo ID 'processo-iframe'
 *   - Bot�o de fechar: Identificado pelo ID 'close-modal-btn'
 * 
 * # Fun��es Principais:
 *   - openPCAModal(): Abre o modal e carrega o documento PCA no iframe
 *   - closeModal(): Fecha o modal e limpa o iframe
 *   - Listeners para fechar o modal: bot�o, clique fora, tecla ESC
 * 
 * # Fluxo de Execu��o:
 *   1. Inicializa com o modal fechado
 *   2. Ao clicar no bot�o PCA Publicada, abre o modal
 *   3. O documento � carregado no iframe
 *   4. O usu�rio pode fechar o modal por diversas formas
 * 
 * # Depend�ncias:
 *   - Elementos do modal no HTML da p�gina
 *   - URL do documento PCA 2025 definida no script
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('btnPCAPublicada.js: Script carregado');
    
    // Referência ao botão PCA Publicada
    const btnPCAPublicada = document.getElementById('btnPCAPublicada');
    
    if (!btnPCAPublicada) {
        console.error('btnPCAPublicada.js: Botão PCA Publicada não encontrado!');
        return;
    }
    
    console.log('btnPCAPublicada.js: Botão encontrado');
    
    // Referências aos elementos do modal
    const modalOverlay = document.getElementById('processo-modal-overlay');
    const iframe = document.getElementById('processo-iframe-legacy') || document.getElementById('processo-iframe');
    const closeButton = document.getElementById('close-modal-btn-legacy') || document.getElementById('close-modal-btn');
    const modalContent = document.querySelector('#processo-modal-overlay .modal-content') || document.querySelector('.modal-content');
    
    // Debug dos elementos encontrados
    console.log('btnPCAPublicada.js: Modal Overlay:', modalOverlay);
    console.log('btnPCAPublicada.js: Iframe:', iframe);
    console.log('btnPCAPublicada.js: Close Button:', closeButton);
    console.log('btnPCAPublicada.js: Modal Content:', modalContent);
    
    // URL do documento PCA 2025
    const pcaUrl = 'https://www.tce.ce.gov.br/component/jdownloads/send/324-plano-de-contratacoes-anual-2025/4631-pca-2025-1-revisao';
    
    // URL do PDF.js viewer - usando a versão CDN mais estável
    const pdfJsViewerUrl = 'https://mozilla.github.io/pdf.js/legacy/web/viewer.html';
    
    // Importar função de detecção de dispositivo móvel se disponível
    const isMobileDevice = typeof isMobile === 'function' ? isMobile() : (window.innerWidth <= 1199);
    
    // Verificar se o navegador suporta PDFs incorporados
    const isPdfSupported = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        return !(userAgent.indexOf('chrome') === -1 && userAgent.indexOf('firefox') === -1 && userAgent.indexOf('safari') === -1);
    };
    
    // Fun��o para abrir o modal
    function openPCAModal() {
        console.log('btnPCAPublicada.js: Tentando abrir modal');
        
        if (!modalOverlay) {
            console.error('btnPCAPublicada.js: Modal overlay não encontrado!');
            // Fallback: abrir PDF em nova aba
            window.open(pcaUrl, '_blank');
            return;
        }
        
        // Adiciona um indicador de carregamento antes de carregar o PDF
        const loadingElement = document.createElement('div');
        loadingElement.id = 'pdf-loading';
        loadingElement.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #333; font-weight: bold; z-index: 1001;';
        loadingElement.innerText = 'Carregando PDF...';
        
        if (modalContent) {
            modalContent.appendChild(loadingElement);
        }
        
        // Exibe o overlay
        modalOverlay.style.display = 'flex';
        modalOverlay.classList.remove('d-none');
        
        console.log('btnPCAPublicada.js: Modal aberto');
        
        if (isMobileDevice) {
            // Em dispositivos móveis, mostra apenas o botão de download/abertura em nova aba
            mostrarBotaoDownload();
        } else {
            // Em desktop, usa o PDF.js para exibir o PDF
            exibirPdfComPdfJs();
        }
        
        // Função para exibir o PDF usando PDF.js em desktop
        function exibirPdfComPdfJs() {
            try {
                if (!iframe) {
                    console.error('btnPCAPublicada.js: Iframe não encontrado!');
                    mostrarBotaoDownload();
                    return;
                }
                
                // Usar a visualização do Google Drive como primeira opção
                const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pcaUrl)}&embedded=true`;
                
                // Configurar o iframe
                iframe.style.width = '100%';
                iframe.style.height = '80vh';
                iframe.style.border = 'none';
                iframe.src = googleDocsUrl;
                
                console.log('btnPCAPublicada.js: PDF carregado no iframe');
                
                // Evento para remover o indicador de carregamento
                iframe.onload = function() {
                    const loadingElement = document.getElementById('pdf-loading');
                    if (loadingElement) loadingElement.remove();
                };
                
                // Timeout como fallback caso o Google Docs não consiga carregar
                setTimeout(() => {
                    // Se ainda estiver mostrando o loading, provavelmente falhou
                    if (document.getElementById('pdf-loading')) {
                        console.log("Falha ao carregar o PDF com Google Docs, tentando PDF.js");
                        
                        // Se o Google Docs falhar, tentar o PDF.js
                        const pdfViewerWithDoc = `https://docs.github.com/en/render?url=${encodeURIComponent(pcaUrl)}`;
                        iframe.src = pdfViewerWithDoc;
                        
                        // Timeout para o PDF.js
                        setTimeout(() => {
                            if (document.getElementById('pdf-loading')) {
                                console.log("Todas as alternativas falharam, mostrando botão de download");
                                mostrarBotaoDownload();
                            }
                        }, 5000);
                    }
                }, 3000);
            } catch (error) {
                console.error("Erro ao tentar incorporar o PDF:", error);
                mostrarBotaoDownload();
            }
        }
        
        // Função para mostrar botão de download como fallback
        function mostrarBotaoDownload() {
            // Remover indicador de carregamento
            const loadingElement = document.getElementById('pdf-loading');
            if (loadingElement) loadingElement.remove();
            
            const downloadButton = document.createElement('div');
            downloadButton.style.cssText = 'text-align: center; padding: 20px; background: #f8f9fa; border-radius: 5px; margin: 20px auto; max-width: 80%;';
            
            if (isMobileDevice) {
                downloadButton.innerHTML = `
                    <p style="margin-bottom: 15px; font-size: 16px;">Para dispositivos móveis, você pode:</p>
                    <button id="open-pdf-btn" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; margin-bottom: 10px; width: 100%;">
                        Abrir PDF em Nova Aba
                    </button>
                    <button id="download-pdf-btn" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; width: 100%;">
                        Baixar PDF
                    </button>
                `;
            } else {
                downloadButton.innerHTML = `
                    <p style="margin-bottom: 15px; font-size: 16px;">Não foi possível exibir o PDF automaticamente.</p>
                    <button id="open-pdf-btn" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        Abrir PDF em Nova Aba
                    </button>
                    <p style="margin-top: 15px; font-size: 12px; color: #6c757d;">
                        Se preferir, você também pode <a href="${pcaUrl}" download style="color: #007bff;">baixar o arquivo</a> diretamente.
                    </p>
                `;
            }
            
            // Limpar e adicionar o botão ao modal
            const container = modalContent.querySelector('.iframe-container') || modalContent;
            container.innerHTML = '';
            container.appendChild(downloadButton);
            
            // Adicionar evento para abrir em nova aba
            document.getElementById('open-pdf-btn').addEventListener('click', function() {
                window.open(pcaUrl, '_blank');
            });
            
            // Adicionar evento para download (só existe no mobile)
            const downloadBtn = document.getElementById('download-pdf-btn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', function() {
                    const a = document.createElement('a');
                    a.href = pcaUrl;
                    a.download = 'PCA-2025.pdf';
                    a.target = '_blank';
                    a.click();
                });
            }
        }
        
        // Pequeno atraso para aplicar a animação
        setTimeout(() => {
            modalContent.classList.add('show');
        }, 10);
        
        // Previne rolagem da página de fundo
        document.body.style.overflow = 'hidden';
    }
    
    // Fun��o para fechar o modal
    function closePCAModal() {
        console.log('btnPCAPublicada.js: Fechando modal');
        
        if (!modalOverlay) {
            console.error('btnPCAPublicada.js: Modal overlay não encontrado para fechar!');
            return;
        }
        
        // Remove a classe de anima��o
        if (modalContent) {
            modalContent.classList.remove('show');
        }
        
        // Otimiza��o: esconder o overlay imediatamente para melhor UX
        modalOverlay.style.opacity = '0';
        modalOverlay.style.pointerEvents = 'none';
        
        // Atraso para ocultar o modal ap�s a anima��o
        setTimeout(() => {
            modalOverlay.style.display = 'none';
            modalOverlay.classList.add('d-none');
            // Restaurar propriedades para pr�xima abertura
            modalOverlay.style.opacity = '';
            modalOverlay.style.pointerEvents = '';
            
            // Limpa o conteúdo da área do PDF
            const container = modalContent ? (modalContent.querySelector('.iframe-container') || modalContent) : null;
            
            // Remover qualquer conteúdo dinâmico adicionado
            const pdfLoading = document.getElementById('pdf-loading');
            if (pdfLoading) pdfLoading.remove();
            
            const openPdfBtn = document.getElementById('open-pdf-btn');
            if (openPdfBtn) {
                const parent = openPdfBtn.closest('div');
                if (parent) parent.remove();
            }
            
            // Limpa os iframes
            if (iframe) {
                iframe.src = 'about:blank';
                // Limpa qualquer elemento filho adicionado ao iframe
                try {
                    if (iframe.contentDocument) {
                        iframe.contentDocument.body.innerHTML = '';
                    }
                } catch (e) {
                    // Ignora erros de cross-origin
                }
            }
            
            const bootstrapIframe = document.getElementById('processo-iframe');
            if (bootstrapIframe) {
                bootstrapIframe.src = 'about:blank';
            }
        }, 400); // Tempo da transi��o definida no CSS
        
        // Restaura a rolagem da p�gina
        document.body.style.overflow = '';
    }
    
    // Event listener para abrir o modal ao clicar no bot�o
    if (btnPCAPublicada) {
        btnPCAPublicada.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('btnPCAPublicada.js: Botão clicado');
            openPCAModal();
        });
        console.log('btnPCAPublicada.js: Event listener adicionado ao botão');
    }
    
    // Event listeners para fechar o modal
    if (closeButton) {
        closeButton.addEventListener('click', closePCAModal);
        console.log('btnPCAPublicada.js: Event listener adicionado ao botão de fechar');
    }
    
    // Fecha o modal ao pressionar a tecla ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modalOverlay && modalOverlay.style.display === 'flex') {
            closePCAModal();
        }
    });
    
    console.log('btnPCAPublicada.js: Todos os event listeners configurados');
});
