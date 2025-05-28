/**
 * updateStatus.js - Atualizador de timestamp do rodapé do Boletim PCA 2025
 * 
 * Este script é responsável por:
 *  - Atualizar o texto de status no rodapé da página
 *  - Exibir a data e hora atual no formato brasileiro
 *  - Fornecer feedback visual sobre quando a página foi carregada/atualizada
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Elementos de Interface:
 *   - Parágrafo do rodapé: Contém o texto de status com timestamp
 * 
 * # Funções Principais:
 *   - updateStatus(): Define o texto do rodapé com data e hora atuais
 * 
 * # Fluxo de Execução:.
 *   1. Script é executado quando o DOM é completamente carregado
 *   2. Localiza o elemento de parágrafo dentro do rodapé
 *   3. Formata a data e hora atual no padrão brasileiro
 *   4. Atualiza o texto do rodapé com o timestamp formatado
 * 
 * # Formatação:
 *   - Data: Formato brasileiro (DD/MM/AAAA)
 *   - Hora: Formato 24h com horas, minutos e segundos (HH:MM:SS)
 *   - Localidade: pt-BR para formatação adequada
 */

function updateStatus() {
    const footerParagraph = document.querySelector('footer p');
    const now = new Date();
    const date = now.toLocaleDateString('pt-BR');
    const time = now.toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    footerParagraph.textContent = `Status atualizado em: ${date} ${time}`;
}

document.addEventListener('DOMContentLoaded', updateStatus);