/**
 * MobileUtils.js - Utilitários para funcionalidades móveis
 * 
 * Este script fornece funções utilitárias para:
 *  - Detecção de dispositivos móveis
 *  - Gerenciamento de orientação
 *  - Utilitários de formatação para mobile
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
        const cleanValue = value.toString().replace(/[^\d.,]/g, '');
        
        if (!cleanValue) return value;
        
        try {
            // Converter para número
            const numValue = parseFloat(cleanValue.replace(',', '.'));
            
            if (isNaN(numValue)) return value;
            
            // Formatação específica para mobile (mais compacta)
            if (this.isMobileDevice()) {
                if (numValue >= 1000000) {
                    return `R$ ${(numValue / 1000000).toFixed(1)}M`;
                } else if (numValue >= 1000) {
                    return `R$ ${(numValue / 1000).toFixed(1)}K`;
                }
            }
            
            // Formatação padrão
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
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
            'AUTUAÇÃO ATRASADA 💣': '#f44336',
            'EM RENOVAÇÃO 🔄': '#2196f3',
            'CANCELADO ❌': '#9e9e9e',
            'EM CONTRATAÇÃO 🤝': '#4caf50',
            'AGUARDANDO ETP ⏳': '#ff9800',
            'AGUARDANDO DFD ⏳': '#ff9800',
            'A INICIAR ⏰': '#9c27b0',
            'RENOVADO ✅': '#4caf50',
            'CONTRATADO ✅': '#4caf50',
            'AGUR. DEFIN. DO GESTOR ⏳': '#ff9800',
            'ETP ATRASADO❗': '#f44336',
            'DFD ATRASADO❗': '#f44336',
            'CONTRATAÇÃO ATRASADA ⚠️': '#ffc107',
            'ELABORANDO TR📝': '#2196f3',
            'ANÁLISE DE VIABILIDADE 📝': '#2196f3',
            'REVISÃO PCA 🚧': '#ff9800'
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
            // Cores antigas mantidas para compatibilidade
            'administrativa': '#28a745',
            'judiciaria': '#dc3545',
            'geral': '#6c757d'
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
});

// Exportar para uso global
window.MobileUtils = MobileUtils;

console.log('MobileUtils.js carregado');
