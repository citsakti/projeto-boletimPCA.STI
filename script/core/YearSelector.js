/**
 * YearSelector.js - Gerenciador de seleção de ano para o Boletim PCA
 * 
 * Este script é responsável por:
 *  - Gerenciar a seleção do ano (2025 ou 2026) para carregamento dos dados
 *  - Detectar automaticamente o ano atual e selecionar a planilha correspondente
 *  - Armazenar o ano selecionado no localStorage para persistência
 *  - Atualizar os URLs das planilhas conforme a seleção
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Componentes de Dados:
 *   - URLs das planilhas para cada ano
 *   - Ano selecionado armazenado no localStorage
 * 
 * # Funções Principais:
 *   - initYearSelector(): Inicializa o seletor de ano
 *   - updateYearSelection(): Atualiza os URLs baseado no ano selecionado
 *   - detectCurrentYear(): Detecta o ano atual para seleção automática
 *   - storeYearSelection(): Armazena a seleção para persistência
 * 
 */

(function() {
    // URLs das planilhas para cada ano
    const SHEET_URLS = {
        '2025': {
            // main atualizado para endpoint Apps Script (CSV 2025)
            main: 'https://script.google.com/macros/s/AKfycbxZaj-7gO4Roel995_Wq12-OK2Lu0Zzf-61JBbj9UagpRO6B55Mpa60IEi5aGUSQjCrwg/exec',
            acompanhamento: 'https://script.google.com/macros/s/AKfycbwQpJtT3GBpGdBaNdODF7NQDDb3ZFW8ZEAS9323oPsph8f2eGQgyOWgB0RXUq4eecLh/exec'
        },
        '2026': {
            // Atualizado para endpoint Apps Script (CSV 2026) conforme solicitação
            main: 'https://script.google.com/macros/s/AKfycbxoTk6ia1337zdHr0KfSYB3cdh8vjctwlCIpIYN5EHile0ZYemMASWNbVn5HlfY9hCVRQ/exec',
            acompanhamento: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcOu9JPRm1oGxkBBEgpZ-hOfictNMZblU1qATZqosqAbMc6bbUASRNRyXVe-dWAK9gGJwvg-jduUFv/pub?gid=1961352255&single=true&output=csv'
        }
    };

    // Variáveis para armazenar referências globais
    window.yearSelectorConfig = {
        currentYear: null,
        SHEET_URLS: SHEET_URLS
    };

    /**
     * Detecta o ano atual para selecionar a planilha correta
     * @returns {string} O ano atual ('2025' ou '2026')
     */
    function detectCurrentYear() {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        
        // Se o ano atual for 2025 ou menos, seleciona 2025
        // Se for 2026 ou mais, seleciona 2026
        return currentYear <= 2025 ? '2025' : '2026';
    }

    /**
     * Seleciona o ano inicial com base na seguinte ordem de prioridade:
     * 1. Verificar se há um parâmetro 'ano' na URL
     * 2. Verificar se há uma seleção armazenada no localStorage
     * 3. Usar o ano atual
     * @returns {string} O ano selecionado ('2025' ou '2026')
     */
    function getInitialYear() {
        // 1. Verificar parâmetro de URL
        const urlParams = new URLSearchParams(window.location.search);
        const yearParam = urlParams.get('ano');
        if (yearParam === '2025' || yearParam === '2026') {
            return yearParam;
        }
        
        // 2. Verificar localStorage
        const storedYear = localStorage.getItem('selectedYear');
        if (storedYear === '2025' || storedYear === '2026') {
            return storedYear;
        }
        
        // 3. Usar ano atual
        return detectCurrentYear();
    }

    /**
     * Inicializa o seletor de ano na interface
     */
    function initYearSelector() {
        // Determina o ano inicial com base nas regras de prioridade
        const selectedYear = getInitialYear();
        
        // Armazena o ano selecionado para uso futuro
        localStorage.setItem('selectedYear', selectedYear);
        
        // Armazena o ano atual na configuração global
        window.yearSelectorConfig.currentYear = selectedYear;
        
        // Cria o elemento de seleção na barra de ferramentas
        // Na index.html, o container da toolbar tem o id 'toolbar'
        const toolbar = document.querySelector('#toolbar');
        if (toolbar) {
            const yearSelectorDiv = document.createElement('div');
            yearSelectorDiv.className = 'year-selector';
            
            const label = document.createElement('label');
            label.textContent = 'Ano:';
            label.htmlFor = 'year-select';
            
            const select = document.createElement('select');
            select.id = 'year-select';
            select.name = 'year-select';
            select.className = 'form-select form-select-sm';
            
            const option2025 = document.createElement('option');
            option2025.value = '2025';
            option2025.textContent = '2025';
            
            const option2026 = document.createElement('option');
            option2026.value = '2026';
            option2026.textContent = '2026';
            
            select.appendChild(option2025);
            select.appendChild(option2026);
            
            // Define o valor selecionado
            select.value = selectedYear;
            
            // Adiciona evento de mudança
            select.addEventListener('change', function() {
                const newYear = this.value;
                localStorage.setItem('selectedYear', newYear);
                window.yearSelectorConfig.currentYear = newYear;
                
                // Atualiza os URLs e recarrega os dados
                updateYearSelection(newYear);
                
                // Recarrega a página para aplicar as mudanças
                // Isso é mais simples do que tentar atualizar tudo dinamicamente
                window.location.reload();
            });
            
            yearSelectorDiv.appendChild(label);
            yearSelectorDiv.appendChild(select);
            
            // Cria um wrapper para o seletor para encaixar no estilo da toolbar
            const yearSelectorWrapper = document.createElement('div');
            yearSelectorWrapper.className = 'btn-group-responsive d-flex align-items-center me-2';
            yearSelectorWrapper.appendChild(yearSelectorDiv);
            
            // Adiciona o seletor no início da toolbar
            toolbar.insertBefore(yearSelectorWrapper, toolbar.firstChild);
        } else {
            console.error('Elemento da toolbar não encontrado para adicionar o seletor de ano');
        }
        
        // Atualiza os URLs baseado no ano selecionado
        updateYearSelection(selectedYear);
    }

    /**
     * Atualiza os URLs das planilhas baseado no ano selecionado
     * @param {string} year - O ano selecionado ('2025' ou '2026')
     */
    function updateYearSelection(year) {
        // Atualiza as URLs globais para que outros scripts possam usar
        if (window.SHEET_CSV_URL !== undefined) {
            window.SHEET_CSV_URL = SHEET_URLS[year].main;
        }
        // Mantém sincronizado para scripts de atualização automática
        if (window.SHEET_CSV_URL_GLOBAL !== undefined) {
            window.SHEET_CSV_URL_GLOBAL = SHEET_URLS[year].main;
        }
        
        if (window.ACOMPANHAMENTO_CSV_URL !== undefined) {
            window.ACOMPANHAMENTO_CSV_URL = SHEET_URLS[year].acompanhamento;
        }
        
        // Atualiza o título da página para refletir o ano selecionado
        updatePageTitle(year);
    }
    
    /**
     * Atualiza o título da página para refletir o ano selecionado
     * @param {string} year - O ano selecionado ('2025' ou '2026')
     */
    function updatePageTitle(year) {
        const title = document.querySelector('title');
        if (title) {
            // Atualiza o título substituindo o ano antigo pelo novo
            const currentTitle = title.textContent;
            if (currentTitle.includes('2025')) {
                title.textContent = currentTitle.replace('2025', year);
            } else if (currentTitle.includes('2026')) {
                title.textContent = currentTitle.replace('2026', year);
            } else {
                // Se não encontrar o ano no título, adiciona-o
                title.textContent = `Boletim PCA ${year} - STI`;
            }
        }
        
        // Atualiza também o cabeçalho H1, se existir
        const header = document.querySelector('h1');
        if (header && header.textContent.includes('Boletim PCA')) {
            if (header.textContent.includes('2025')) {
                header.textContent = header.textContent.replace('2025', year);
            } else if (header.textContent.includes('2026')) {
                header.textContent = header.textContent.replace('2026', year);
            } else {
                header.textContent = `Boletim PCA ${year} - STI`;
            }
        }
    }

    // Inicializa o seletor após o carregamento do DOM
    document.addEventListener('DOMContentLoaded', function() {
        initYearSelector();
    });

    // Adiciona uma função para obter o ano atual que pode ser chamada por outros scripts
    window.getSelectedYear = function() {
        // Primeiro verifica a configuração global
        if (window.yearSelectorConfig && window.yearSelectorConfig.currentYear) {
            return window.yearSelectorConfig.currentYear;
        }
        
        // Depois verifica o localStorage
        const storedYear = localStorage.getItem('selectedYear');
        if (storedYear === '2025' || storedYear === '2026') {
            return storedYear;
        }
        
        // Por último, usa o ano atual
        return detectCurrentYear();
    };

    // Adiciona uma função para obter as URLs baseadas no ano selecionado
    window.getYearUrls = function() {
        const year = window.yearSelectorConfig.currentYear || detectCurrentYear();
        return SHEET_URLS[year];
    };
})();
