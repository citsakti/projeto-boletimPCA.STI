/**
 * AnalyticsRenderTipo.js - Renderização específica para detalhes por TIPO DE CONTRATAÇÃO
 * 
 * Este arquivo contém apenas a renderização de tabelas de detalhes por TIPO (Aquisição/Renovação).
 * Separado para evitar conflitos com outras renderizações.
 * 
 * Função principal: renderTipoDetailsTable()
 */

/**
 * Renderiza a tabela de detalhes dos projetos filtrados por TIPO DE CONTRATAÇÃO
 * @param {string} tipo - O tipo de contratação dos projetos a serem exibidos
 * @returns {string} - HTML da tabela com os projetos do tipo
 */
function renderTipoDetailsTable(tipo) {
    const projetos = analyticData.projetosPorTipo[tipo] || [];
    
    if (projetos.length === 0) {
        return '<p>Nenhum projeto encontrado neste tipo de contratação.</p>';
    }
    
    let html = `
        <table class="project-details-table">
            <thead>
                <tr>
                    <th>ID PCA</th>
                    <th>Área</th>
                    <th>Projeto</th>
                    <th>Contratar Até</th>
                    <th>Valor (R$)</th>
                    <th>Processo</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    projetos.forEach(projeto => {
        // Atributos de contrato/registro na célula do Projeto
        let contratoAttrs = '';
        if (projeto.numeroContrato && String(projeto.numeroContrato).trim() !== '') {
            contratoAttrs += ` data-contrato="${String(projeto.numeroContrato).trim()}"`;
        }
        if (projeto.numeroRegistro && String(projeto.numeroRegistro).trim() !== '') {
            contratoAttrs += ` data-registro="${String(projeto.numeroRegistro).trim()}"`;
        }
        
        html += `
            <tr>
                <td>${projeto.id || 'N/A'}</td>
                <td>${formatAreaWithClasses(projeto.area || 'N/A')}</td>
                <td${contratoAttrs}>${renderProjectCellWithCompras(projeto.objeto || 'N/A', projeto.modalidadeX, projeto.numeroY)}</td>
                <td>${projeto.contratar_ate || 'N/A'}</td>
                <td>R$ ${formatCurrency(projeto.valor || 0)}</td>
                <td>${renderProcessCell(projeto.numeroProcesso || 'N/A', projeto.modalidadeX, projeto.numeroY)}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

// Expor função globalmente
if (typeof window !== 'undefined') {
    window.renderTipoDetailsTable = renderTipoDetailsTable;
}
