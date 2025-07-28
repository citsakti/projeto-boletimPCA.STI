/**
 * btnFonteDeDados.js - Gerenciador do botão para visualização da planilha de dados do Boletim PCA
 * 
 * Este script é responsável por:
 *  - Implementar a funcionalidade do botão "FONTE DE DADOS"
 *  - Exibir um modal com a planilha Google Sheets fonte dos dados
 *  - Gerenciar a exibição/ocultação do modal e seus eventos associados
 *  - Selecionar automaticamente a planilha correta com base no ano (2025 ou 2026) 
 *    selecionado no YearSelector
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Elementos de Interface:
 *   - Botão Fonte de Dados: Identificado pelo ID 'btnFonteDeDados'
 *   - Modal Overlay: Identificado pelo ID 'processo-modal-overlay'
 *   - Iframe: Identificado pelo ID 'processo-iframe'
 * 
 * # Funções Principais:
 *   - Configuração de event listener para o clique no botão
 *   - Manipulação do modal para exibir a planilha Google Sheets
 * 
 * # Fluxo de Execução:
 *   1. Inicializa com o modal fechado
 *   2. Ao clicar no botão Fonte de Dados, abre o modal
 *   3. A planilha é carregada no iframe
 *   4. O usuário pode fechar o modal através de mecanismos implementados em outro script
 * 
 * # Dependências:
 *   - Elementos do modal no HTML da página
 *   - Lógica de fechamento do modal (implementada em btnPCAPublicada.js)
 *   - URL da planilha Google Sheets definida no script
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('btnFonteDeDados.js: Inicializando script');
    const btnFonteDeDados = document.getElementById('btnFonteDeDados');
    const modalOverlay = document.getElementById('processo-modal-overlay');
    const iframe = document.getElementById('processo-iframe-legacy') || document.getElementById('processo-iframe');
    const modalContent = modalOverlay ? modalOverlay.querySelector('.modal-content') : null; // Busca específica no overlay

    console.log('btnFonteDeDados.js: Elementos encontrados:', {
        botao: !!btnFonteDeDados,
        overlay: !!modalOverlay,
        iframe: !!iframe,
        modalContent: !!modalContent
    });

    // URLs das planilhas para cada ano
    const PLANILHAS_POR_ANO = {
        '2025': '1ZYquCMfNlBvYYoZ3uxZrW2Vewejcet43FeD3HBh8oLM',
        '2026': '1xfZL69sWXUCDFz5049jx_y1LpG1r1ufa6V750b0IpFQ'
    };

    // Função para obter a URL da fonte de dados com base no ano selecionado
    function getFonteDeDadosUrl() {
        // Usa a função global getSelectedYear do YearSelector.js para obter o ano atual
        const selectedYear = window.getSelectedYear ? window.getSelectedYear() : '2025';
        
        // Obtém o ID da planilha para o ano selecionado
        const planilhaId = PLANILHAS_POR_ANO[selectedYear] || PLANILHAS_POR_ANO['2025'];
        
        return `https://docs.google.com/spreadsheets/d/${planilhaId}/edit?usp=sharing`;
    }

    function openFonteDeDadosModal() {
        console.log('btnFonteDeDados.js: Tentando abrir modal');
        
        if (iframe && modalOverlay && modalContent) {
            console.log('btnFonteDeDados.js: Todos os elementos encontrados, abrindo modal');
            
            // Obtém a URL atual com base no ano selecionado
            const fonteDeDadosUrl = getFonteDeDadosUrl();
            console.log(`btnFonteDeDados.js: URL da fonte de dados para o ano ${window.getSelectedYear ? window.getSelectedYear() : '2025'}: ${fonteDeDadosUrl}`);
            
            // Sincronizar com o iframe Bootstrap se existir
            const bootstrapIframe = document.getElementById('processo-iframe');
            if (bootstrapIframe) {
                bootstrapIframe.src = fonteDeDadosUrl;
                console.log('btnFonteDeDados.js: URL definida no iframe Bootstrap');
            }
            
            iframe.src = fonteDeDadosUrl;
            console.log('btnFonteDeDados.js: URL definida no iframe legacy');
            
            // Remove classe d-none se existir e define display flex
            modalOverlay.classList.remove('d-none');
            modalOverlay.style.display = 'flex';
            console.log('btnFonteDeDados.js: Modal overlay exibido');
            
            // Adiciona a classe 'show' para a animação de entrada
            setTimeout(() => {
                modalContent.classList.add('show');
                console.log('btnFonteDeDados.js: Classe show adicionada');
            }, 10); // Pequeno atraso para garantir que a transição CSS seja aplicada
            
            document.body.style.overflow = 'hidden'; // Previne rolagem da página de fundo
        } else {
            console.error('btnFonteDeDados.js: Elementos do modal não foram encontrados:', {
                iframe: !!iframe,
                modalOverlay: !!modalOverlay,
                modalContent: !!modalContent
            });
        }
    }

    // Event listener temporariamente desabilitado - funcionalidade transferida para ModalManager.js
    /*
    if (btnFonteDeDados) {
        console.log('btnFonteDeDados.js: Adicionando event listener ao botão');
        btnFonteDeDados.addEventListener('click', function(e) {
            console.log('btnFonteDeDados.js: Botão clicado');
            e.preventDefault();
            openFonteDeDadosModal();
        });
    } else {
        console.error('btnFonteDeDados.js: Botão com ID "btnFonteDeDados" não encontrado no HTML.');
    }
    */
    
    // Apenas log para verificar que o script está carregando
    if (btnFonteDeDados) {
        console.log('btnFonteDeDados.js: Botão encontrado - funcionalidade gerenciada pelo ModalManager.js');
    } else {
        console.error('btnFonteDeDados.js: Botão com ID "btnFonteDeDados" não encontrado no HTML.');
    }

    // A lógica para fechar o modal (clique no botão de fechar, clique fora, tecla ESC)
    // é gerenciada pelo script btnPCAPublicada.js, pois os elementos do modal são compartilhados.
    // Se você criar um modal separado para esta funcionalidade, precisará replicar
    // os event listeners de fechamento aqui também.
});