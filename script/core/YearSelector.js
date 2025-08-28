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
    // Estrutura com URL primária (Google Sheets CSV público) e redundância (Apps Script) para cada ano e tipo de planilha
    const SHEET_URLS = {
        '2025': {
            main: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkrLcVYUAyDdf3XlecZ-qdperC8emYWp_5MCXXBG_SdrF5uGab5ugtebjA9iOWeDIbyC56s9jRGjcP/pub?gid=1123542137&single=true&output=csv',
            mainBackup: 'https://script.google.com/macros/s/AKfycbz4sHQdov5Yc26OIEga8Mg5yThXdm2SF1UMF7cG8rXPW49Z1s-KDoGh8yjCkOVKpFzUAQ/exec',
            acompanhamento: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkrLcVYUAyDdf3XlecZ-qdperC8emYWp_5MCXXBG_SdrF5uGab5ugtebjA9iOWeDIbyC56s9jRGjcP/pub?gid=1961352255&single=true&output=csv',
            acompanhamentoBackup: 'https://script.google.com/macros/s/AKfycbwQpJtT3GBpGdBaNdODF7NQDDb3ZFW8ZEAS9323oPsph8f2eGQgyOWgB0RXUq4eecLh/exec'
        },
        '2026': {
            main: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcOu9JPRm1oGxkBBEgpZ-hOfictNMZblU1qATZqosqAbMc6bbUASRNRyXVe-dWAK9gGJwvg-jduUFv/pub?gid=1123542137&single=true&output=csv',
            mainBackup: 'https://script.google.com/macros/s/AKfycbzQwBm8v7PCrSE6UbqezxD6dLYymPA6dhL64Eoy82FAdoGO26yhh6XlfaC8SlVwtY_uYw/exec',
            acompanhamento: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcOu9JPRm1oGxkBBEgpZ-hOfictNMZblU1qATZqosqAbMc6bbUASRNRyXVe-dWAK9gGJwvg-jduUFv/pubhtml?gid=1961352255&single=true',
            acompanhamentoBackup: 'https://script.google.com/macros/s/AKfycbxEr26CCGxmYXnagBNd5sAlPb4_lIPuBIqwir28N_IZSWyajx8dbmA_sEsqW9zI8VOV/exec'
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
        const cfg = SHEET_URLS[year];
        // URLs principais
        if (window.SHEET_CSV_URL !== undefined) window.SHEET_CSV_URL = cfg.main;
        if (window.SHEET_CSV_URL_GLOBAL !== undefined) window.SHEET_CSV_URL_GLOBAL = cfg.main;
        if (window.ACOMPANHAMENTO_CSV_URL !== undefined) window.ACOMPANHAMENTO_CSV_URL = cfg.acompanhamento;
        // Guardar também backups globais para consumo em outros scripts
        window.SHEET_CSV_URL_BACKUP = cfg.mainBackup;
        window.ACOMPANHAMENTO_CSV_URL_BACKUP = cfg.acompanhamentoBackup;
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
        const y = SHEET_URLS[year];
        return {
            year,
            main: y.main,
            mainBackup: y.mainBackup,
            acompanhamento: y.acompanhamento,
            acompanhamentoBackup: y.acompanhamentoBackup
        };
    };

    // Função utilitária global para baixar CSV com fallback (primário -> backup)
    window.fetchCsvWithFallback = function(primaryUrl, backupUrl, papaOptions = {}) {
        return new Promise((resolve, reject) => {
            function attempt(url, isBackup) {
                Papa.parse(url, {
                    download: true,
                    ...papaOptions,
                    complete: (results) => {
                        const hasData = results && results.data && results.data.length > 0;
                        if (hasData) {
                            resolve({ urlUsed: url, results });
                        } else if (!isBackup && backupUrl) {
                            attempt(backupUrl, true);
                        } else {
                            reject(new Error('CSV vazio após tentar ' + (isBackup ? 'backup' : 'primário')));
                        }
                    },
                    error: (err) => {
                        if (!isBackup && backupUrl) {
                            attempt(backupUrl, true);
                        } else {
                            reject(err);
                        }
                    }
                });
            }
            attempt(primaryUrl, false);
        });
    };
})();
