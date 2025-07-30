document.addEventListener('DOMContentLoaded', () => {
    // --- INÍCIO DA CONFIGURAÇÃO DO AIRTABLE ---
    const AIRTABLE_TOKEN = "patOd2SmftqjRnByQ.41649ac1488c558a20cd6bf05b45639805d7e1a346f255c3fa9efba6d44d15bf"; // O MESMO TOKEN DE ANTES
    const AIRTABLE_BASE_ID = "appG0PCmqUlN5u0iq"; // O MESMO BASE ID DE ANTES
    const AIRTABLE_TABLE_NAME = "Chamados";
    // --- FIM DA CONFIGURAÇÃO ---

    const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?sort%5B0%5D%5Bfield%5D=DataSolicitacao&sort%5B0%5D%5Bdirection%5D=desc`;

    const tableBody = document.getElementById('chamadosTableBody');
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

    // Função para obter as classes de estilo para os "pills" de prioridade e status
    const getPillClass = (value, type) => {
        const classes = {
            Prioridade: {
                'Alta': 'pill pill-danger',
                'Média': 'pill pill-warning',
                'Baixa': 'pill pill-success'
            },
            Status: {
                'Aberto': 'pill pill-info',
                'Em Andamento': 'pill pill-purple',
                'Concluído': 'pill pill-gray'
            }
        };
        return (classes[type] && classes[type][value]) || 'pill bg-gray-200 text-gray-800';
    };

    // Função para renderizar os chamados na tabela
    function renderizarChamados(chamados) {
        tableBody.innerHTML = '';
        if (chamados.length === 0) {
            setTableState('Nenhum chamado encontrado com os filtros selecionados.');
            return;
        }

        chamados.forEach(chamado => {
            const fields = chamado.fields;
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50'; // Adiciona um leve hover para as linhas

            // Formata a data para exibição
            const dataSolicitacao = fields.DataSolicitacao ? new Date(fields.DataSolicitacao).toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short'
            }) : 'N/A';

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${fields.Nome || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${fields.Setor || 'N/A'}</td>
                <td class="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">${fields.Descricao || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dataSolicitacao}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span class="${getPillClass(fields.Prioridade, 'Prioridade')}">
                        ${fields.Prioridade || 'N/A'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span class="${getPillClass(fields.Status, 'Status')}">
                        ${fields.Status || 'N/A'}
                    </span>
                </td>
            `;
            tableBody.appendChild(row);
        });
        tableState.innerHTML = ''; // Limpa a mensagem de estado se houver chamados
    }

    // Função para aplicar os filtros selecionados
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

    // Função para carregar os chamados do Airtable
    async function carregarChamados() {
        if (!AIRTABLE_TOKEN.startsWith('pat') || !AIRTABLE_BASE_ID.startsWith('app')) {
            setTableState("Erro: As credenciais do Airtable não foram configuradas corretamente no arquivo view.js.");
            return;
        }
        setTableState('<i class="fas fa-spinner text-2xl text-teal-600 animate-spin"></i> Carregando chamados...');

        try {
            const response = await fetch(AIRTABLE_URL, {
                headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || `Erro HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            todosChamados = data.records;

            if (todosChamados.length === 0) {
                setTableState('Nenhum chamado aberto no momento.');
            } else {
                aplicarFiltros(); // Aplica os filtros iniciais (todos)
            }
        } catch (error) {
            console.error("Erro ao carregar do Airtable:", error);
            setTableState(`Falha ao carregar chamados: ${error.message}.`);
        }
    }

    // Adiciona event listeners para os filtros
    Object.values(filtros).forEach(filtro => filtro.addEventListener('change', aplicarFiltros));

    // Carrega os chamados ao iniciar a página
    carregarChamados();
});
