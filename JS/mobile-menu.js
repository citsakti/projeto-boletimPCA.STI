/**
 * mobile-menu.js - Controle do menu móvel de botões da toolbar
 * 
 * Este script implementa a funcionalidade de expandir/recolher os botões da toolbar
 * em dispositivos móveis através de um botão de menu.
 */

document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const toolbar = document.getElementById('toolbar');
    
    // Verifica se os elementos existem
    if (!mobileMenuBtn || !toolbar) {
        console.warn('Elementos do menu mobile não encontrados');
        return;
    }
    
    // Estado inicial: toolbar recolhida no mobile
    let isExpanded = false;
    
    // Função para alternar o estado do menu
    function toggleMobileMenu() {
        isExpanded = !isExpanded;
        
        if (isExpanded) {
            // Expande o menu
            toolbar.classList.add('expanded');
            mobileMenuBtn.classList.add('expanded');
            mobileMenuBtn.setAttribute('title', 'Ocultar Menu');
            
            // Adiciona um pequeno delay para a animação
            setTimeout(() => {
                toolbar.style.display = 'flex';
            }, 10);
            
        } else {
            // Recolhe o menu
            toolbar.classList.remove('expanded');
            mobileMenuBtn.classList.remove('expanded');
            mobileMenuBtn.setAttribute('title', 'Mostrar Menu');
            
            // Aguarda a animação antes de ocultar completamente
            setTimeout(() => {
                if (!toolbar.classList.contains('expanded')) {
                    toolbar.style.display = 'none';
                }
            }, 300);
        }
    }
    
    // Event listener para o botão de menu
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    
    // Função para detectar mudanças de tamanho da tela
    function handleResize() {
        const isMobile = window.matchMedia('(max-width: 1199px)').matches;
        
        if (!isMobile) {
            // Em telas desktop, sempre mostra a toolbar e reseta o estado
            toolbar.style.display = 'flex';
            toolbar.classList.remove('expanded');
            mobileMenuBtn.classList.remove('expanded');
            isExpanded = false;
        } else {
            // Em telas mobile, aplica o estado atual
            if (isExpanded) {
                toolbar.style.display = 'flex';
                toolbar.classList.add('expanded');
            } else {
                toolbar.style.display = 'none';
                toolbar.classList.remove('expanded');
            }
        }
    }
    
    // Escuta mudanças no tamanho da tela
    window.addEventListener('resize', handleResize);
    
    // Aplica o estado inicial
    handleResize();
    
    // Função para fechar o menu ao clicar em um botão da toolbar (opcional)
    function closeMenuOnButtonClick() {
        if (window.matchMedia('(max-width: 1199px)').matches && isExpanded) {
            // Pequeno delay para permitir que a ação do botão seja executada primeiro
            setTimeout(() => {
                toggleMobileMenu();
            }, 100);
        }
    }
    
    // Adiciona listeners aos botões da toolbar para fechar o menu após clique
    const toolbarButtons = toolbar.querySelectorAll('button');
    toolbarButtons.forEach(button => {
        button.addEventListener('click', closeMenuOnButtonClick);
    });
    
    // Fecha o menu ao clicar fora dele (opcional)
    document.addEventListener('click', function(event) {
        const isMobile = window.matchMedia('(max-width: 1199px)').matches;
        
        if (isMobile && isExpanded) {
            const isClickInsideMenu = mobileMenuBtn.contains(event.target) || 
                                    toolbar.contains(event.target);
            
            if (!isClickInsideMenu) {
                toggleMobileMenu();
            }
        }
    });
    
    // Função para verificar se há filtros ativos e sincronizar estado visual
    function syncFilterStates() {
        const limparFiltrosBtn = document.getElementById('btnLimparFiltros');
        const limparFiltrosMobileBtn = document.getElementById('btnLimparFiltrosMobile');
        
        if (limparFiltrosBtn && limparFiltrosMobileBtn) {
            // Sincroniza o estado visual entre os botões de limpar filtros
            if (limparFiltrosBtn.classList.contains('filters-active')) {
                limparFiltrosMobileBtn.classList.add('filters-active');
            } else {
                limparFiltrosMobileBtn.classList.remove('filters-active');
            }
        }
    }
    
    // Escuta eventos de aplicação de filtros para sincronizar estados
    document.addEventListener('google-sheet-filter-applied', syncFilterStates);
    document.addEventListener('filters-cleared', syncFilterStates);
    
    // Sincroniza estados iniciais
    syncFilterStates();
});
