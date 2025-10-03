/**
 * AnalyticsRenderAreaValor.js - Renderização específica para valores por ÁREA e TIPO
 * 
 * Este arquivo contém apenas a renderização de tabelas de valores por área e tipo de orçamento.
 * Separado para evitar conflitos com outras renderizações.
 * 
 * Função principal: renderAreaValorDetailsTable()
 */

/**
 * Renderiza a tabela de detalhes dos projetos por área e tipo de orçamento
 * @param {Array} projetos - Lista de projetos a renderizar
 * @returns {string} - HTML da tabela
 */
function renderAreaValorDetailsTable(projetos) {
    if (projetos.length === 0) {
        return '<p>Nenhum projeto encontrado nesta categoria.</p>';
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
    
    projetos.forEach(projeto => {
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
    window.renderAreaValorDetailsTable = renderAreaValorDetailsTable;
}
