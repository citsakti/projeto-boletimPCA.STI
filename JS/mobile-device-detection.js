/**
 * mobile-device-detection.js - Detecção de dispositivos móveis para o Boletim PCA 2025
 *
 * Este script detecta se o dispositivo é móvel e aplica configurações adequadas.
 * Atualizado para tratar todos os dispositivos exceto desktop como versão mobile.
 */

// Define uma variável global para indicar se é um dispositivo móvel
window.isMobileDevice = window.matchMedia('(max-width: 1199px)').matches;

// Adiciona classe ao body para controle CSS
document.addEventListener('DOMContentLoaded', () => {
    if (window.isMobileDevice) {
        document.body.classList.add('mobile-device');
    } else {
        document.body.classList.add('desktop-device');
    }
});

// Função para verificar se o dispositivo está em modo mobile
function isMobile() {
    return window.isMobileDevice;
}

// Função para verificar se estamos em um layout desktop
function isDesktop() {
    return !window.isMobileDevice;
}