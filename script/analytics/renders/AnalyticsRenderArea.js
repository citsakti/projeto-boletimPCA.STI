/**
 * AnalyticsRenderArea.js - Renderização específica para detalhes por ÁREA
 * 
 * Este arquivo contém apenas a renderização de tabelas de detalhes por ÁREA ORGANIZACIONAL.
 * Separado para evitar conflitos com outras renderizações.
 * 
 * Função principal: renderAreaDetailsTable()
 */

/**
 * Renderiza a tabela de detalhes dos projetos filtrados por ÁREA
 * @param {string} area - Nome da área 
 * @returns {string} - HTML da tabela
 */
function renderAreaDetailsTable(area) {
    // Obter projetos diretamente da lista populada em Analytics.js
    const projetosDaArea = analyticData.projetosPorArea[area] || []; 

    if (projetosDaArea.length === 0) {
        return '<p>Nenhum projeto de Aquisição ou Renovação encontrado nesta área.</p>';
    }
    
    let html = `
        <table class="project-details-table">
            <thead>
                <tr>
                    <th>ID PCA</th>
                    <th>Tipo</th>
                    <th>Projeto</th>
                    <th>Status</th>
                    <th>Contratar Até</th>
                    <th>Valor (R$)</th>
                    <th>Processo</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Iterar sobre os projetos da área
    projetosDaArea.forEach(projeto => {
        let contratoAttrs = '';
        if (projeto.numeroContrato && String(projeto.numeroContrato).trim() !== '') {
            contratoAttrs += ` data-contrato="${String(projeto.numeroContrato).trim()}"`;
        }
        if (projeto.numeroRegistro && String(projeto.numeroRegistro).trim() !== '') {
            contratoAttrs += ` data-registro="${String(projeto.numeroRegistro).trim()}"`;
        }

        html += `
            <tr>
                <td>${projeto.idPca}</td>
                <td>${projeto.tipo}</td>
                <td${contratoAttrs}>${renderProjectCellWithCompras(projeto.projeto, projeto.modalidadeX, projeto.numeroY)}</td>
                <td>${formatStatusWithClasses(projeto.status)}</td>
                <td>${projeto.dataProcesso || '-'}</td>
                <td>R$ ${formatCurrency(projeto.valor)}</td>
                <td>${renderProcessCell(projeto.numProcesso, projeto.modalidadeX, projeto.numeroY)}</td>
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
    window.renderAreaDetailsTable = renderAreaDetailsTable;
}
