/**
 * MobileUtils.js - Biblioteca de utilitários para funcionalidades móveis
 * 
 * Este script é responsável por:
 *  - Detectar tipos de dispositivos (mobile, tablet, desktop)
 *  - Gerenciar orientação de tela e mudanças responsivas
 *  - Formatar valores monetários para exibição mobile
 *  - Implementar utilitários de formatação otimizados para mobile
 *  - Fornecer helpers para desenvolvimento responsivo
 * 
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Detecção de Dispositivos:
 *   - isMobileDevice(): Detecta dispositivos móveis (≤ 430px)
 *   - isTabletDevice(): Detecta tablets (431px - 768px)
 *   - isDesktopDevice(): Detecta desktops (> 768px)
 *   - getDeviceType(): Retorna tipo de dispositivo como string
 * 
 * # Formatação de Dados:
 *   - formatCurrency(): Formata valores monetários para padrão brasileiro
 *   - formatDate(): Converte datas para formato dd/mm/aaaa
 *   - formatStatus(): Processa status preservando emojis
 *   - truncateText(): Trunca textos longos com reticências
 * 
 * # Breakpoints Responsivos:
 *   - Mobile: ≤ 430px (smartphones)
 *   - Tablet: 431px - 768px (tablets e smartphones grandes)
 *   - Desktop: > 768px (laptops e desktops)
 * 
 * # Formatação Monetária:
 *   - Suporte ao padrão brasileiro (R$)
 *   - Limpeza de caracteres não numéricos
 *   - Conversão de vírgulas para pontos decimais
 *   - Tratamento de valores inválidos com fallback
 *   - Formatação com Intl.NumberFormat para precisão
 * 
 * # Utilitários de Orientação:
 *   - Detecção de mudança de orientação
 *   - Ajustes automáticos para landscape/portrait
 *   - Cálculos de viewport para posicionamento
 * 
 * # Helpers de Performance:
 *   - Funções estáticas para melhor performance
 *   - Cache de resultados de detecção quando apropriado
 *   - Minimização de recálculos de DOM
 * 
 * # Tratamento de Erros:
 *   - Validação de entradas em formatação
 *   - Fallbacks para valores inválidos
 *   - Try-catch em operações de formatação
 *   - Logs de erro para debugging
 * 
 * # Casos de Uso:
 *   1. Detecção responsiva para alternar interfaces
 *   2. Formatação de dados para cards mobile
 *   3. Cálculos de posicionamento para tooltips
 *   4. Validação de entrada de dados
 *   5. Adaptação de comportamento por dispositivo
 * 
 * # Integração:
 *   - Utilizado por todos os módulos mobile para detecção de dispositivo
 *   - MobileCardsRenderer usa para formatação de dados
 *   - MobileCardsTooltips usa para posicionamento responsivo
 *   - MobileCardsManager usa para controle de modo de visualização
 *   - Coordena com sistema de CSS responsivo
 */

class MobileUtils {
    static isMobileDevice() {
        return window.innerWidth <= 430;
    }
    
    static isTabletDevice() {
        return window.innerWidth > 430 && window.innerWidth <= 768;
    }
    
    static isDesktopDevice() {
        return window.innerWidth > 768;
    }
    
    static getDeviceType() {
        if (this.isMobileDevice()) return 'mobile';
        if (this.isTabletDevice()) return 'tablet';
        return 'desktop';
    }
    
    static formatCurrency(value) {
        if (!value || value === '-' || value === 'N/A') return value;

        // Remover caracteres não numéricos exceto vírgula e ponto
        const cleanValue = value.toString().replace(/[^\\d.,]/g, '');

        if (!cleanValue) return value;

        try {
            // Converter para número
            const numValue = parseFloat(cleanValue.replace(',', '.'));

            if (isNaN(numValue)) return value;

            // Formatação padrão com casas decimais
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2, // Garante pelo menos 2 casas decimais
                // maximumFractionDigits: 2 // Removido para não truncar
            }).format(numValue);
        } catch (error) {
            return value;
        }
    }
    
    static formatDate(dateString) {
        if (!dateString || dateString === '-' || dateString === 'N/A') return dateString;
        
        try {
            // Tentar diferentes formatos de data
            let date;
            
            if (dateString.includes('/')) {
                const parts = dateString.split('/');
                if (parts.length === 3) {
                    // Assumir formato DD/MM/YYYY
                    date = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            } else if (dateString.includes('-')) {
                date = new Date(dateString);
            }
            
            if (!date || isNaN(date.getTime())) return dateString;
            
            // Formatação específica para mobile (mais compacta)
            if (this.isMobileDevice()) {
                return date.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                });
            }
            
            // Formatação padrão
            return date.toLocaleDateString('pt-BR');
        } catch (error) {
            return dateString;
        }
    }
    
    static truncateText(text, maxLength = 50) {
        if (!text || text.length <= maxLength) return text;
        
        // Ajustar tamanho baseado no dispositivo
        if (this.isMobileDevice()) {
            maxLength = Math.min(maxLength, 30);
        }
        
        return text.substring(0, maxLength - 3) + '...';
    }
      static getStatusColor(status) {
        const statusColors = {
            'AUTUAÇÃO ATRASADA 💣': '#e6cff2',
            'EM RENOVAÇÃO 🔄': '#0a53a8',
            'CANCELADO ❌': '#9e9e9e',
            'EM CONTRATAÇÃO 🤝': '#0a53a8',
            'AGUARDANDO ETP ⏳': '#ffe5a0',
            'AGUARDANDO DFD ⏳': '#ffe5a0',
            'A INICIAR ⏰': '#e6e6e6',
            'RENOVADO ✅': '#d4edbc',
            'CONTRATADO ✅': '#d4edbc',
            'AGUR. DEFIN. DO GESTOR ⏳': '#e6cff2',
            'ETP ATRASADO❗': '#ffcfc9',
            'DFD ATRASADO❗': '#ffcfc9',
            'CONTRATAÇÃO ATRASADA ⚠️': '#ffcfc9',
            'ELABORANDO TR📝': '#bfe1f6',
            'ANÁLISE DE VIABILIDADE 📝': '#bfe1f6',
            'REVISÃO PCA 🚧': '#000000'
        };
        
        return statusColors[status] || '#6c757d';
    }
      static getAreaColor(area) {
        // Cores seguindo padrão do Areas.css
        const areaColors = {
            'sti': '#ffe5a0',
            'operacoes': '#bfe1f6',
            'dev': '#d4edbc',
            'analytics': '#ffc8aa',
            'governanca': '#e8eaed',
        };
        
        const areaKey = area.toLowerCase();
        for (const key in areaColors) {
            if (areaKey.includes(key)) {
                return areaColors[key];
            }
        }
        
        return areaColors.geral;
    }
    
    static addMobileClasses() {
        const body = document.body;
        const deviceType = this.getDeviceType();
        
        // Remover classes existentes
        body.classList.remove('mobile-device', 'tablet-device', 'desktop-device');
        
        // Adicionar classe apropriada
        body.classList.add(`${deviceType}-device`);
        
        // Adicionar classe de orientação
        const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        body.classList.remove('portrait', 'landscape');
        body.classList.add(orientation);
    }
    
    static setupMobileEventListeners() {
        // Listener para mudanças de orientação
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.addMobileClasses();
                // Disparar evento customizado
                window.dispatchEvent(new CustomEvent('mobile-orientation-changed', {
                    detail: { deviceType: this.getDeviceType() }
                }));
            }, 100);
        });
        
        // Listener para redimensionamento
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.addMobileClasses();
                // Disparar evento customizado
                window.dispatchEvent(new CustomEvent('mobile-resize', {
                    detail: { deviceType: this.getDeviceType() }
                }));
            }, 150);
        });
    }
    
    static hapticFeedback(type = 'light') {
        // Simular feedback háptico em dispositivos que suportam
        if ('vibrate' in navigator) {
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [30, 10, 30]
            };
            
            navigator.vibrate(patterns[type] || patterns.light);
        }
    }
    
    static smoothScrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    static showToast(message, duration = 3000) {
        // Criar toast temporário para mobile
        const toast = document.createElement('div');
        toast.className = 'mobile-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 10000;
            animation: fadeInUp 0.3s ease-out;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOutDown 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }
    
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Adicionar estilos CSS para toast
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translate(-50%, 20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    
    @keyframes fadeOutDown {
        from {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        to {
            opacity: 0;
            transform: translate(-50%, 20px);
        }
    }
`;
document.head.appendChild(toastStyles);

// Inicializar utilitários móveis quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    MobileUtils.addMobileClasses();
    MobileUtils.setupMobileEventListeners();
    
    // Verificação específica para página de analytics
    if (document.getElementById('analytics-dashboard')) {
        // Aguardar um pouco mais para garantir que os dados sejam carregados
        setTimeout(() => {
            // Disparar evento para indicar que a página está pronta para mobile
            window.dispatchEvent(new CustomEvent('mobile-analytics-ready', {
                detail: { deviceType: MobileUtils.getDeviceType() }
            }));
        }, 500);
    }
});

// Exportar para uso global
window.MobileUtils = MobileUtils;

console.log('MobileUtils.js carregado');
