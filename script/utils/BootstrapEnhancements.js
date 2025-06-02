/**
 * Bootstrap Enhancements
 * Adiciona funcionalidades específicas do Bootstrap para melhorar a UX
 */

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        
        // Inicializa tooltips do Bootstrap
        function initializeTooltips() {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
        
        // Adiciona tooltips aos botões
        function addTooltipsToButtons() {
            const buttons = document.querySelectorAll('.btn[title]');
            buttons.forEach(button => {
                if (!button.hasAttribute('data-bs-toggle')) {
                    button.setAttribute('data-bs-toggle', 'tooltip');
                    button.setAttribute('data-bs-placement', 'top');
                    button.setAttribute('data-bs-title', button.getAttribute('title'));
                }
            });
        }
        
        // Melhora a responsividade da tabela em telas muito pequenas
        function enhanceTableResponsiveness() {
            const tableResponsive = document.querySelector('.table-responsive');
            const table = tableResponsive?.querySelector('.table');
            
            if (tableResponsive && table) {
                function checkMobileCards() {
                    if (window.innerWidth <= 576) {
                        tableResponsive.classList.add('mobile-cards');
                        
                        // Adiciona data-labels para o layout de cards
                        const headers = table.querySelectorAll('thead th');
                        const rows = table.querySelectorAll('tbody tr');
                        
                        rows.forEach(row => {
                            const cells = row.querySelectorAll('td');
                            cells.forEach((cell, index) => {
                                if (headers[index]) {
                                    cell.setAttribute('data-label', headers[index].textContent.trim());
                                }
                            });
                        });
                    } else {
                        tableResponsive.classList.remove('mobile-cards');
                    }
                }
                
                checkMobileCards();
                window.addEventListener('resize', checkMobileCards);
            }
        }
        
        // Adiciona loading states aos botões
        function addLoadingStates() {
            const actionButtons = document.querySelectorAll('.btn[id^="btn"]');
            
            actionButtons.forEach(button => {
                const originalClickHandler = button.onclick;
                
                button.addEventListener('click', function(e) {
                    if (!this.disabled) {
                        // Adiciona estado de loading
                        this.disabled = true;
                        const originalText = this.innerHTML;
                        const loadingSpinner = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>';
                        
                        this.innerHTML = loadingSpinner + 'Carregando...';
                        
                        // Remove loading após 3 segundos ou quando a ação terminar
                        setTimeout(() => {
                            this.disabled = false;
                            this.innerHTML = originalText;
                        }, 3000);
                    }
                });
            });
        }
        
        // Melhora o feedback visual dos filtros
        function enhanceFilterFeedback() {
            const filterButtons = document.querySelectorAll('.google-sheet-filter-btn');
            
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Adiciona feedback visual temporário
                    this.classList.add('active');
                    
                    setTimeout(() => {
                        this.classList.remove('active');
                    }, 1000);
                });
            });
        }
        
        // Adiciona smooth scroll para âncoras
        function addSmoothScroll() {
            const links = document.querySelectorAll('a[href^="#"]');
            
            links.forEach(link => {
                link.addEventListener('click', function(e) {
                    const target = document.querySelector(this.getAttribute('href'));
                    
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        }
        
        // Melhora a acessibilidade
        function improveAccessibility() {
            // Adiciona ARIA labels onde necessário
            const buttons = document.querySelectorAll('.btn:not([aria-label])');
            buttons.forEach(button => {
                if (button.textContent.trim()) {
                    button.setAttribute('aria-label', button.textContent.trim());
                }
            });
            
            // Adiciona roles adequados
            const tables = document.querySelectorAll('.table');
            tables.forEach(table => {
                if (!table.hasAttribute('role')) {
                    table.setAttribute('role', 'table');
                }
            });
            
            // Melhora navegação por teclado
            const focusableElements = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            focusableElements.forEach((element, index) => {
                element.addEventListener('keydown', function(e) {
                    if (e.key === 'Tab') {
                        // Lógica adicional de navegação se necessário
                    }
                });
            });
        }
        
        // Adiciona indicadores de estado para elementos interativos
        function addStateIndicators() {
            const interactiveElements = document.querySelectorAll('.btn, .card, .table tr');
            
            interactiveElements.forEach(element => {
                element.addEventListener('mouseenter', function() {
                    if (!this.disabled) {
                        this.style.transform = 'translateY(-1px)';
                        this.style.transition = 'transform 0.2s ease';
                    }
                });
                
                element.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                });
            });
        }
        
        // Inicializa todas as melhorias
        function initializeEnhancements() {
            addTooltipsToButtons();
            initializeTooltips();
            enhanceTableResponsiveness();
            addLoadingStates();
            enhanceFilterFeedback();
            addSmoothScroll();
            improveAccessibility();
            addStateIndicators();
        }
        
        // Executa as inicializações
        initializeEnhancements();
        
        // Reinicializa quando há mudanças dinâmicas no DOM
        const observer = new MutationObserver(function(mutations) {
            let shouldReinitialize = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && (
                            node.classList?.contains('btn') ||
                            node.classList?.contains('table') ||
                            node.querySelector?.('.btn, .table')
                        )) {
                            shouldReinitialize = true;
                        }
                    });
                }
            });
            
            if (shouldReinitialize) {
                setTimeout(initializeEnhancements, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Event listeners para eventos customizados
        document.addEventListener('painel-resumo-updated', function() {
            // Reinicializa tooltips quando o painel é atualizado
            setTimeout(() => {
                addTooltipsToButtons();
                initializeTooltips();
            }, 100);
        });
        
        document.addEventListener('table-updated', function() {
            // Reinicializa funcionalidades da tabela
            setTimeout(() => {
                enhanceTableResponsiveness();
                enhanceFilterFeedback();
            }, 100);
        });
        
        // Adiciona classes CSS úteis dinamicamente
        const style = document.createElement('style');
        style.textContent = `
            /* Estados de loading para botões */
            .btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }
            
            /* Feedback visual para filtros ativos */
            .google-sheet-filter-btn.active {
                background-color: rgba(255, 255, 255, 0.2) !important;
                transform: scale(0.95);
            }
            
            /* Melhorias de foco para acessibilidade */
            .btn:focus,
            .table tr:focus {
                outline: 2px solid var(--brand-secondary);
                outline-offset: 2px;
            }
            
            /* Transições suaves */
            .btn,
            .card,
            .table tr {
                transition: all 0.2s ease-in-out;
            }
        `;
        document.head.appendChild(style);
    });
    
})();
