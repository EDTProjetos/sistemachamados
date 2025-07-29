document.addEventListener('DOMContentLoaded', () => {
    // --- INÍCIO DA CONFIGURAÇÃO DO AIRTABLE ---
    const AIRTABLE_TOKEN = "patOd2SmftqjRnByQ.41649ac1488c558a20cd6bf05b45639805d7e1a346f255c3fa9efba6d44d15bf"; // O MESMO TOKEN DE ANTES
    const AIRTABLE_BASE_ID = "appG0PCmqUlN5u0iq"; // O MESMO BASE ID DE ANTES
    const AIRTABLE_TABLE_NAME = "Chamados";
    // --- FIM DA CONFIGURAÇÃO ---

    const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?sort%5B0%5D%5Bfield%5D=DataSolicitacao&sort%5B0%5D%5Bdirection%5D=desc`;

    const tableBody = document.getElementById('chamadosTableBody' );
    const tableState = document.getElementById('tableState');
    const filtros = {
        setor: document.getElementById('filtroSetor'),
        prioridade: document.getElementById('filtroPrioridade'),
        status: document.getElementById('filtroStatus'),
    };

    let todosChamados = [];

    function setTableState(message) {
        tableBody.innerHTML = '';
        tableState.innerHTML = `<p class="text-gray-500">${message}</p>`;
    }

    const getPillClass = (value, type) => {
        const classes = {
            Prioridade: { 'Alta': 'bg-red-100 text-red-800', 'Média': 'bg-yellow-100 text-yellow-800', 'Baixa': 'bg-green-100 text-green-800' },
            Status: { 'Aberto': 'bg-blue-100 text-blue-800', 'Em Andamento': 'bg-purple-100 text-purple-800', 'Concluído': 'bg-gray-300 text-gray-900' }
        };
        return (classes[type] && classes[type][value]) || 'bg-gray-100 text-gray-800';
    };

    function renderizarChamados(chamados) {
        tableBody.innerHTML = '';
        if (chamados.length === 0) {
            setTableState('Nenhum chamado encontrado com os filtros selecionados.');
            return;
        }
        tableState.innerHTML = '';

        chamados.forEach(chamado => {
            const fields = chamado.fields;
            const dataFormatada = new Date(fields.DataSolicitacao).toLocaleString('pt-BR');
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4"><div class="text-sm font-medium text-gray-900">${fields.Nome}</div><div class="text-sm text-gray-500">${fields.Email}</div></td>
                <td class="px-6 py-4 text-sm text-gray-600">${fields.Setor}</td>
                <td class="px-6 py-4"><p class="text-sm text-gray-800 truncate" title="${fields.Descricao}">${fields.Descricao}</p></td>
                <td class="px-6 py-4 text-sm text-gray-600">${dataFormatada}</td>
                <td class="px-6 py-4 text-center"><span class="px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getPillClass(fields.Prioridade, 'Prioridade')}">${fields.Prioridade}</span></td>
                <td class="px-6 py-4 text-center"><span class="px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getPillClass(fields.Status, 'Status')}">${fields.Status}</span></td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function aplicarFiltros() {
        const setor = filtros.setor.value;
        const prioridade = filtros.prioridade.value;
        const status = filtros.status.value;

        const chamadosFiltrados = todosChamados.filter(c => {
            const fields = c.fields;
            return (!setor || fields.Setor === setor) &&
                   (!prioridade || fields.Prioridade === prioridade) &&
                   (!status || fields.Status === status);
        });
        renderizarChamados(chamadosFiltrados);
    }

    async function carregarChamados() {
        if (!AIRTABLE_TOKEN.startsWith('pat') || !AIRTABLE_BASE_ID.startsWith('app')) {
            setTableState("Erro: As credenciais do Airtable não foram configuradas corretamente no arquivo view.js.");
            return;
        }
        setTableState('<i class="fas fa-spinner text-2xl text-teal-600"></i> Carregando chamados...');

        try {
            const response = await fetch(AIRTABLE_URL, {
                headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
            });
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            
            const data = await response.json();
            todosChamados = data.records;

            if (todosChamados.length === 0) {
                setTableState('Nenhum chamado aberto no momento.');
            } else {
                aplicarFiltros();
            }
        } catch (error) {
            console.error("Erro ao carregar do Airtable:", error);
            setTableState(`Falha ao carregar chamados: ${error.message}.`);
        }
    }

    Object.values(filtros).forEach(filtro => filtro.addEventListener('change', aplicarFiltros));
    carregarChamados();
});