/* 
 * MobileAnalytics.js - Funcionalidades específicas para modo mobile da página de Dados Analíticos
 * 
 * Este arquivo implementa:
 * - Controle de expansão/recolhimento de seções
 * - Conversão de tabelas em cards responsivos
 * - Detecção de dispositivo móvel
 */

// Classe principal para controle mobile dos analytics
class MobileAnalytics {
    constructor() {
        this.isMobile = window.innerWidth <= 1199;
        this.sectionsCollapsed = false;
        this.init();
    }    init() {
        // Aguardar o carregamento do conteúdo antes de aplicar mobile features
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeMobileFeatures();
                this.waitForAnalyticsContent();
            });
        } else {
            this.initializeMobileFeatures();
            this.waitForAnalyticsContent();
        }
        
        // Re-inicializar quando a janela for redimensionada
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Observar mudanças no DOM para detectar quando as seções são carregadas
        this.observeDOMChanges();
    }
      observeDOMChanges() {
        if (this.isMobile) {
            const observer = new MutationObserver((mutations) => {
                let shouldReInit = false;
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        // Verificar se novas seções foram adicionadas
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1 && (
                                node.classList?.contains('analytics-section') ||
                                node.querySelector?.('.analytics-section') ||
                                node.querySelector?.('h2, h3') ||
                                node.tagName === 'SECTION'
                            )) {
                                shouldReInit = true;
                            }
                        });
                    }
                });
                
                if (shouldReInit) {
                    console.log('MobileAnalytics: DOM mudou, re-inicializando...');
                    setTimeout(() => {
                        this.makeSectionsCollapsible();
                        this.convertTablesToCards();
                    }, 100);
                }
            });
            
            // Observar mudanças em todo o documento
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // Também observar especificamente o container dos analytics
            const analyticsContainer = document.getElementById('analytics-dashboard');
            if (analyticsContainer) {
                observer.observe(analyticsContainer, {
                    childList: true,
                    subtree: true
                });
            }
        }
    }initializeMobileFeatures() {
        if (this.isMobile) {
            // Configurar controles imediatamente
            this.setupMobileControls();
            this.adjustToolbar();
            
            // Primeira tentativa - imediata
            setTimeout(() => {
                this.makeSectionsCollapsible();
                this.convertTablesToCards();
            }, 100);
            
            // Segunda tentativa - após carregamento inicial
            setTimeout(() => {
                this.makeSectionsCollapsible();
                this.convertTablesToCards();
            }, 500);
            
            // Terceira tentativa - aguardar dados
            setTimeout(() => {
                this.makeSectionsCollapsible();
                this.convertTablesToCards();
            }, 2000);
            
            // Última tentativa - carregamento completo
            setTimeout(() => {
                this.makeSectionsCollapsible();
                console.log('MobileAnalytics: Última tentativa de inicialização');
            }, 5000);
        }
    }    setupMobileControls() {
        // Configurar botão de toggle das seções
        const toggleBtn = document.getElementById('analytics-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleAllSections();
            });
        }
        
        // Adicionar função global para debug/re-inicialização
        window.mobileAnalyticsDebug = {
            reinit: () => {
                console.log('MobileAnalytics: Re-inicialização forçada...');
                this.makeSectionsCollapsible();
                this.convertTablesToCards();
            },
            getSections: () => {
                return {
                    analytics: document.querySelectorAll('.analytics-section'),
                    headers: document.querySelectorAll('h2, h3'),
                    allSections: document.querySelectorAll('section, div[class*="section"]')
                };
            }
        };
    }// Torna as seções de analytics expansíveis/recolhíveis em mobile
    makeSectionsCollapsible() {
        // Procurar por seções de analytics de diferentes formas
        let sections = document.querySelectorAll('.analytics-section');
        
        // Se não encontrou com a classe padrão, procurar por outras possibilidades
        if (sections.length === 0) {
            sections = document.querySelectorAll('section[id*="analytics"], div[class*="analytics"], div[id*="section"]');
        }
        
        // Se ainda não encontrou, procurar por qualquer seção com h2/h3
        if (sections.length === 0) {
            const sectionsWithHeaders = [];
            document.querySelectorAll('h2, h3').forEach(header => {
                const parent = header.parentElement;
                if (parent && !sectionsWithHeaders.includes(parent)) {
                    sectionsWithHeaders.push(parent);
                }
            });
            sections = sectionsWithHeaders;
        }
        
        console.log(`MobileAnalytics: Encontradas ${sections.length} seções para tornar expansíveis`);
        
        sections.forEach((section, index) => {
            const header = section.querySelector('h2, h3');
            if (!header) {
                console.log('MobileAnalytics: Seção sem header encontrada, pulando...');
                return;
            }

            // Remover listeners anteriores para evitar duplicação
            const existingListener = header.getAttribute('data-mobile-listener');
            if (existingListener) {
                return; // Já foi processado
            }
            
            // Marcar como processado
            header.setAttribute('data-mobile-listener', 'true');

            // Criar container para o conteúdo da seção se não existir
            let content = section.querySelector('.analytics-section-content');
            if (!content) {
                content = this.wrapSectionContent(section, header);
            }

            // Adicionar funcionalidade de clique no header
            header.style.cursor = 'pointer';
            header.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('MobileAnalytics: Header clicado', header.textContent);
                this.toggleSection(section);
            });

            // Adicionar indicador visual se não existir
            if (!header.querySelector('.expand-indicator')) {
                const indicator = document.createElement('span');
                indicator.className = 'expand-indicator';
                indicator.innerHTML = '▼';
                indicator.style.float = 'right';
                indicator.style.transition = 'transform 0.3s ease';
                indicator.style.pointerEvents = 'none'; // Evitar interferência com clique
                header.appendChild(indicator);
            }

            // Por padrão, manter primeira seção expandida e outras recolhidas
            if (index > 0) {
                section.classList.add('collapsed');
                this.updateIndicator(section);
            }
        });
    }

    // Envolve o conteúdo da seção em um container
    wrapSectionContent(section, header) {
        const content = document.createElement('div');
        content.className = 'analytics-section-content';

        // Mover todo o conteúdo (exceto o header) para dentro do container
        const children = Array.from(section.children);
        children.forEach(child => {
            if (child !== header) {
                content.appendChild(child);
            }
        });

        section.appendChild(content);
        return content;
    }

    // Alterna a expansão de uma seção
    toggleSection(section) {
        section.classList.toggle('collapsed');
        this.updateIndicator(section);
    }

    // Atualiza o indicador visual da seção
    updateIndicator(section) {
        const indicator = section.querySelector('.expand-indicator');
        if (indicator) {
            indicator.style.transform = section.classList.contains('collapsed') 
                ? 'rotate(-90deg)' 
                : 'rotate(0deg)';
        }
    }

    // Expande ou recolhe todas as seções
    toggleAllSections() {
        const sections = document.querySelectorAll('.analytics-section');
        this.sectionsCollapsed = !this.sectionsCollapsed;

        sections.forEach(section => {
            if (this.sectionsCollapsed) {
                section.classList.add('collapsed');
            } else {
                section.classList.remove('collapsed');
            }
            this.updateIndicator(section);
        });

        // Atualiza o texto do botão
        const toggleBtn = document.getElementById('analytics-toggle-btn');
        if (toggleBtn) {
            const toggleText = toggleBtn.querySelector('.toggle-text');
            if (toggleText) {
                toggleText.textContent = this.sectionsCollapsed ? 'Expandir' : 'Recolher';
            }
        }
    }

    // Converte tabelas em cards para mobile
    convertTablesToCards() {
        if (!this.isMobile) return;

        const tables = document.querySelectorAll('.analytics-section table');
        
        tables.forEach(table => {
            this.convertTableToCards(table);
        });
    }

    convertTableToCards(table) {
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
        const rows = table.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            
            cells.forEach((cell, index) => {
                if (headers[index]) {
                    cell.setAttribute('data-label', headers[index]);
                }
            });
        });
    }

    // Ajusta a toolbar para mobile
    adjustToolbar() {
        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            toolbar.classList.add('mobile-toolbar');
        }
    }

    // Gerencia redimensionamento da janela
    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 1199;

        // Se mudou de mobile para desktop ou vice-versa
        if (wasMobile !== this.isMobile) {
            if (this.isMobile) {
                this.initializeMobileFeatures();
            } else {
                this.resetToDesktop();
            }
        }
    }

    // Reseta elementos para modo desktop
    resetToDesktop() {
        // Remove classes de mobile
        const sections = document.querySelectorAll('.analytics-section');
        sections.forEach(section => {
            section.classList.remove('collapsed');
            
            // Remove indicadores
            const indicator = section.querySelector('.expand-indicator');
            if (indicator) {
                indicator.remove();
            }
        });
    }

    // Método público para re-inicializar (pode ser chamado externamente)
    forceReinit() {
        console.log('MobileAnalytics: Re-inicialização forçada externamente');
        if (this.isMobile) {
            this.makeSectionsCollapsible();
            this.convertTablesToCards();
            this.adjustToolbar();
        }
    }

    // Método para detectar quando o analytics é carregado
    waitForAnalyticsContent() {
        const checkContent = () => {
            const analyticsContainer = document.getElementById('analytics-dashboard');
            if (analyticsContainer && analyticsContainer.children.length > 0) {
                console.log('MobileAnalytics: Conteúdo analytics detectado');
                this.forceReinit();
                return true;
            }
            return false;
        };

        // Verificar imediatamente
        if (checkContent()) return;

        // Verificar periodicamente até encontrar conteúdo
        let attempts = 0;
        const maxAttempts = 20; // 10 segundos máximo
        const interval = setInterval(() => {
            attempts++;
            if (checkContent() || attempts >= maxAttempts) {
                clearInterval(interval);
                if (attempts >= maxAttempts) {
                    console.warn('MobileAnalytics: Timeout aguardando conteúdo analytics');
                }
            }
        }, 500);
    }
}

// Inicializa quando o script for carregado
if (typeof window !== 'undefined') {
    window.mobileAnalytics = new MobileAnalytics();
    
    // Adicionar método global para re-inicialização
    window.reinitMobileAnalytics = () => {
        if (window.mobileAnalytics) {
            window.mobileAnalytics.forceReinit();
        }
    };
    
    // Debug global
    window.debugMobileAnalytics = () => {
        console.log('=== MobileAnalytics Debug ===');
        console.log('isMobile:', window.mobileAnalytics?.isMobile);
        console.log('Analytics sections:', document.querySelectorAll('.analytics-section'));
        console.log('H2/H3 headers:', document.querySelectorAll('h2, h3'));
        console.log('Analytics container:', document.getElementById('analytics-dashboard'));
        console.log('Analytics container children:', document.getElementById('analytics-dashboard')?.children);
    };
}

// Exporta para uso em outros scripts se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileAnalytics;
}
