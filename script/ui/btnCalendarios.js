/**
 * btnCalendarios.js - Gerenciador do botão de calendários do Boletim PCA
 * 
 * Este script é responsável por:
 *  - Implementar a funcionalidade do botão "Calendários"
 *  - Exibir um modal com três calendários embeded do Google (Início, Autuação, Contratação)
 *  - Gerenciar a exibição/ocultação do modal através do ModalManager
 *  - Implementar navegação por abas entre os diferentes calendários
 *
 * =============== ESTRUTURA PRINCIPAL ================
 * 
 * # Elementos de Interface:
 *   - Botão Calendários: Identificado pelo ID 'btnCalendarios'
 *   - Modal Overlay: Utiliza o sistema centralizado ModalManager
 *   - Três calendários embeded do Google Calendar
 * 
 * # Calendários Disponíveis:
 *   - Início: Calendário de datas de início dos processos
 *   - Autuação: Calendário de datas de autuação
 *   - Contratação: Calendário de datas de contratação
 * 
 * # Funções Principais:
 *   - openCalendariosModal(): Abre o modal e carrega os calendários
 *   - setupCalendarTabs(): Configura a navegação por abas
 *   - Integração com o ModalManager do projeto
 * 
 * # Fluxo de Execução:
 *   1. Inicializa com o modal fechado
 *   2. Ao clicar no botão Calendários, abre o modal
 *   3. Os calendários são carregados nos iframes
 *   4. O usuário pode navegar entre as abas
 *   5. O modal pode ser fechado através do ModalManager
 * 
 * # Dependências:
 *   - ModalManager.js para controle de modais
 *   - Elementos do modal overlay no HTML da página
 *   - URLs dos calendários embeded do Google
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('btnCalendarios.js: Inicializando script');
    
    const btnCalendarios = document.getElementById('btnCalendarios');
    const modalOverlay = document.getElementById('processo-modal-overlay');
    const modalContent = modalOverlay ? modalOverlay.querySelector('.modal-content') : null;
    
    console.log('btnCalendarios.js: Elementos encontrados:', {
        botao: !!btnCalendarios,
        overlay: !!modalOverlay,
        modalContent: !!modalContent
    });

    // URLs dos calendários embeded
    const CALENDARIOS = {
        'inicio': {
            url: 'https://calendar.google.com/calendar/embed?src=c_1dbc4013ef5011e7115e20190d84b3570e18ae9848aabc0e6dfc58c57830c7eb%40group.calendar.google.com&ctz=America%2FFortaleza',
            titulo: 'Início',
            icone: 'bi-play-circle'
        },
        'autuacao': {
            url: 'https://calendar.google.com/calendar/embed?src=c_3bf24bd582d481b74ba3e64a07456829699b89cfefef883352dd5d6b556c8c16%40group.calendar.google.com&ctz=America%2FFortaleza',
            titulo: 'Autuação', 
            icone: 'bi-file-text'
        },
        'contratacao': {
            url: 'https://calendar.google.com/calendar/embed?src=c_d6ac52c2b56025ff26587ccfaba3fa526c13b38f27e1179bd9783009fce6c6f9%40group.calendar.google.com&ctz=America%2FFortaleza',
            titulo: 'Contratação',
            icone: 'bi-handshake'
        }
    };

    /**
     * Cria o conteúdo HTML do modal de calendários
     */
    function createCalendarContent() {
        return `
            <div class="modal-header" style="padding: 1rem; background: var(--brand-primary); color: white; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center;">
                <h5 style="margin: 0; color: white;">
                    <i class="bi bi-calendar3 me-2"></i>Calendários PCA
                </h5>
                <button id="close-modal-btn" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; padding: 0;">&times;</button>
            </div>
            <div class="modal-body-calendarios" style="flex: 1; padding: 1.5rem; overflow: hidden;">
                <!-- Navegação dos calendários -->
                <ul class="nav nav-tabs mb-3" id="calendarios-tabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active calendar-tab-btn" 
                                id="inicio-tab" 
                                data-calendar="inicio" 
                                type="button">
                            <i class="bi ${CALENDARIOS.inicio.icone} me-1"></i>${CALENDARIOS.inicio.titulo}
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link calendar-tab-btn" 
                                id="autuacao-tab" 
                                data-calendar="autuacao" 
                                type="button">
                            <i class="bi ${CALENDARIOS.autuacao.icone} me-1"></i>${CALENDARIOS.autuacao.titulo}
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link calendar-tab-btn" 
                                id="contratacao-tab" 
                                data-calendar="contratacao" 
                                type="button">
                            <i class="bi ${CALENDARIOS.contratacao.icone} me-1"></i>${CALENDARIOS.contratacao.titulo}
                        </button>
                    </li>
                </ul>
                
                <!-- Container do calendário -->
                <div id="calendar-container" style="height: calc(90vh - 200px); min-height: 500px;">
                    <iframe id="calendar-iframe" 
                            src="${CALENDARIOS.inicio.url}"
                            style="width: 100%; height: 100%; border: none; border-radius: 0.375rem;"
                            frameborder="0" 
                            scrolling="no"
                            title="Calendário de ${CALENDARIOS.inicio.titulo}">
                    </iframe>
                </div>
            </div>
        `;
    }

    /**
     * Configura a navegação por abas dos calendários
     */
    function setupCalendarTabs() {
        const tabButtons = document.querySelectorAll('.calendar-tab-btn');
        const calendarIframe = document.getElementById('calendar-iframe');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const calendarType = this.getAttribute('data-calendar');
                const calendarData = CALENDARIOS[calendarType];
                
                if (calendarData && calendarIframe) {
                    // Remove active de todas as abas
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    
                    // Adiciona active na aba clicada
                    this.classList.add('active');
                    
                    // Atualiza o iframe
                    calendarIframe.src = calendarData.url;
                    calendarIframe.title = `Calendário de ${calendarData.titulo}`;
                    
                    console.log(`btnCalendarios.js: Carregando calendário ${calendarData.titulo}`);
                }
            });
        });
    }

    /**
     * Abre o modal de calendários
     */
    function openCalendariosModal() {
        console.log('btnCalendarios.js: Tentando abrir modal de calendários');
        
        if (!modalOverlay || !modalContent) {
            console.error('btnCalendarios.js: Elementos do modal não encontrados');
            return;
        }

        // Cria o conteúdo do modal
        modalContent.innerHTML = createCalendarContent();
        
        // Configura as abas após criar o conteúdo
        setupCalendarTabs();
        
        // Usa o ModalManager para abrir o modal
        if (window.modalManager) {
            console.log('btnCalendarios.js: Usando ModalManager');
            window.modalManager.openModal('processo-modal');
        } else {
            console.log('btnCalendarios.js: ModalManager não encontrado, usando implementação direta');
            // Fallback para implementação direta
            modalOverlay.classList.remove('d-none');
            modalOverlay.style.display = 'flex';
            
            setTimeout(() => {
                modalContent.classList.add('show');
            }, 10);
            
            document.body.style.overflow = 'hidden';
        }
        
        console.log('btnCalendarios.js: Modal de calendários aberto');
    }

    // Event listener para o botão
    if (btnCalendarios) {
        console.log('btnCalendarios.js: Adicionando event listener ao botão');
        btnCalendarios.addEventListener('click', function(e) {
            console.log('btnCalendarios.js: Botão calendários clicado');
            e.preventDefault();
            openCalendariosModal();
        });
    } else {
        console.error('btnCalendarios.js: Botão com ID "btnCalendarios" não encontrado no HTML.');
    }

    console.log('btnCalendarios.js: Script carregado com sucesso');
});
