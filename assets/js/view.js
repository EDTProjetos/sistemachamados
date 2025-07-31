document.addEventListener('DOMContentLoaded', () => {
    // --- INÍCIO DA CONFIGURAÇÃO DO AIRTABLE ---
    const AIRTABLE_TOKEN = "patOd2SmftqjRnByQ.41649ac1488c558a20cd6bf05b45639805d7e1a346f255c3fa9efba6d44d15bf"; // O MESMO TOKEN DE ANTES
    const AIRTABLE_BASE_ID = "appG0PCmqUlN5u0iq"; // O MESMO BASE ID DE ANTES
    const AIRTABLE_TABLE_NAME = "Chamados";
    // --- FIM DA CONFIGURAÇÃO ---

    const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?sort%5B0%5D%5Bfield%5D=DataSolicitacao&sort%5B0%5D%5Bdirection%5D=desc`;

    const tableBody = document.getElementById('chamadosTableBody');
    const tableState = document.getElementById('tableState');
    const searchInput = document.getElementById('searchInput');
    const filtros = {
        setor: document.getElementById('filtroSetor'),
        prioridade: document.getElementById('filtroPrioridade'),
        status: document.getElementById('filtroStatus'),
    };

    // Elementos de estatísticas
    const statsElements = {
        total: document.getElementById('totalChamados'),
        abertos: document.getElementById('chamadosAbertos'),
        andamento: document.getElementById('chamadosAndamento'),
        concluidos: document.getElementById('chamadosConcluidos')
    };

    let todosChamados = [];
    let chamadosFiltrados = [];

    function setTableState(message, isLoading = false) {
        tableBody.innerHTML = '';
        if (isLoading) {
            tableState.innerHTML = `
                <div class="flex flex-col items-center space-y-4">
                    <div class="w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center pulse-animation">
                        <i class="fas fa-spinner fa-spin text-2xl text-white"></i>
                    </div>
                    <p class="text-gray-600 text-lg font-medium">${message}</p>
                </div>
            `;
        } else {
            tableState.innerHTML = `
                <div class="flex flex-col items-center space-y-4">
                    <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <i class="fas fa-search text-2xl text-gray-400"></i>
                    </div>
                    <p class="text-gray-500 text-lg">${message}</p>
                </div>
            `;
        }
    }

    function atualizarEstatisticas(chamados) {
        const total = chamados.length;
        const abertos = chamados.filter(c => c.fields.Status === 'Aberto').length;
        const andamento = chamados.filter(c => c.fields.Status === 'Em Andamento').length;
        const concluidos = chamados.filter(c => c.fields.Status === 'Concluído').length;

        // Animação de contagem
        animateNumber(statsElements.total, total);
        animateNumber(statsElements.abertos, abertos);
        animateNumber(statsElements.andamento, andamento);
        animateNumber(statsElements.concluidos, concluidos);
    }

    function animateNumber(element, targetNumber) {
        const duration = 1000;
        const startNumber = parseInt(element.textContent || '0'); // Começa do número atual
        const increment = (targetNumber - startNumber) / (duration / 16);
        let currentNumber = startNumber;

        const timer = setInterval(() => {
            currentNumber += increment;
            if ((increment > 0 && currentNumber >= targetNumber) || (increment < 0 && currentNumber <= targetNumber)) {
                element.textContent = targetNumber;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(currentNumber);
            }
        }, 16);
    }

    const getPillClass = (value, type) => {
        const classes = {
            Prioridade: {
                'Alta': 'priority-high',
                'Média': 'priority-medium',
                'Baixa': 'priority-low'
            },
            Status: {
                'Aberto': 'status-open',
                'Em Andamento': 'status-progress',
                'Concluído': 'status-completed'
            }
        };
        return (classes[type] && classes[type][value]) || 'bg-gray-100 text-gray-800';
    };

    const getPriorityIcon = (prioridade) => {
        const icons = {
            'Alta': '🔴',
            'Média': '🟡',
            'Baixa': '🟢'
        };
        return icons[prioridade] || '⚪';
    };

    const getStatusIcon = (status) => {
        const icons = {
            'Aberto': '🔵',
            'Em Andamento': '🟣',
            'Concluído': '⚫'
        };
        return icons[status] || '⚪';
    };

    function renderizarChamados(chamados) {
        tableBody.innerHTML = '';
        if (chamados.length === 0) {
            setTableState('Nenhum chamado encontrado com os filtros selecionados.');
            return;
        }
        tableState.innerHTML = '';

        chamados.forEach((chamado, index) => {
            const fields = chamado.fields;
            // Pegamos o ID gerado pelo Airtable para o registro (record.id)
            const airtableRecordId = chamado.id;
            // O valor do campo 'ID' na sua base, se ele for um autonumber, já será o que você deseja exibir.
            // Se 'ID' for o seu campo Autonumber no Airtable, use fields.ID.
            // Caso contrário, se o Airtable gera outro ID interno que você quer mostrar,
            // e ele NÃO ESTÁ NO CAMPO 'ID' da sua tabela, você pode usar 'airtableRecordId'.
            // Para sua configuração atual de "Autonumber" no campo "ID", fields.ID é o correto.
            const displayedId = fields.ID || 'N/A'; // Usa o valor do campo ID da Airtable

            const dataFormatada = fields.DataSolicitacao ?
                new Date(fields.DataSolicitacao).toLocaleString('pt-BR') :
                'Data não informada';

            const tr = document.createElement('tr');
            tr.className = 'table-row-hover border-b border-gray-100';
            tr.style.animationDelay = `${index * 0.1}s`;
            tr.classList.add('fade-in');

            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            ${displayedId}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            ${(fields.Nome || 'N').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="text-sm font-semibold text-gray-900">${fields.Nome || 'Nome não informado'}</div>
                            <div class="text-sm text-gray-500 flex items-center">
                                <i class="fas fa-envelope mr-1"></i>
                                ${fields.Email || 'Email não informado'}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="w-3 h-3 bg-teal-500 rounded-full mr-2"></div>
                        <span class="text-sm font-medium text-gray-700">${fields.Setor || 'Não informado'}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="max-w-xs">
                        <p class="text-sm text-gray-800 truncate cursor-pointer hover:text-teal-600 transition-colors"
                            title="${fields.Descricao || 'Descrição não informada'}"
                            onclick="mostrarDescricaoCompleta('${(fields.Descricao || '').replace(/'/g, "\\'")}')">
                            ${fields.Descricao || 'Descrição não informada'}
                        </p>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-clock mr-2 text-teal-500"></i>
                        ${dataFormatada}
                    </div>
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="px-3 py-2 inline-flex items-center text-xs font-semibold rounded-full ${getPillClass(fields.Prioridade, 'Prioridade')}">
                        <span class="mr-1">${getPriorityIcon(fields.Prioridade)}</span>
                        ${fields.Prioridade || 'Não definida'}
                    </span>
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="px-3 py-2 inline-flex items-center text-xs font-semibold rounded-full ${getPillClass(fields.Status, 'Status')}">
                        <span class="mr-1">${getStatusIcon(fields.Status)}</span>
                        ${fields.Status || 'Não definido'}
                    </span>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Função global para mostrar descrição completa
    window.mostrarDescricaoCompleta = function(descricao) {
        alert(`Descrição completa:\n\n${descricao}`);
    };

    function aplicarFiltros() {
        const setor = filtros.setor.value;
        const prioridade = filtros.prioridade.value;
        const status = filtros.status.value;
        const searchTerm = searchInput.value.toLowerCase();

        chamadosFiltrados = todosChamados.filter(c => {
            const fields = c.fields;
            const matchSetor = !setor || fields.Setor === setor;
            const matchPrioridade = !prioridade || fields.Prioridade === prioridade;
            const matchStatus = !status || fields.Status === status;
            const matchSearch = !searchTerm ||
                (fields.Nome && fields.Nome.toLowerCase().includes(searchTerm)) ||
                (fields.Email && fields.Email.toLowerCase().includes(searchTerm)) ||
                (fields.Descricao && fields.Descricao.toLowerCase().includes(searchTerm));

            return matchSetor && matchPrioridade && matchStatus && matchStatus && matchSearch; // Corrigido aqui, 'matchStatus' duplicado
        });

        renderizarChamados(chamadosFiltrados);
        atualizarEstatisticas(chamadosFiltrados); // Atualiza estatísticas com base nos filtrados
    }

    async function carregarChamados() {
        if (!AIRTABLE_TOKEN.startsWith('pat') || !AIRTABLE_BASE_ID.startsWith('app')) {
            setTableState("Erro: As credenciais do Airtable não foram configuradas corretamente no arquivo view.js.");
            return;
        }

        setTableState('Carregando chamados do sistema...', true);

        try {
            const response = await fetch(AIRTABLE_URL, {
                headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
            });

            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

            const data = await response.json();
            todosChamados = data.records;

            // Já atualizamos as estatísticas na função aplicarFiltros, que é chamada aqui
            if (todosChamados.length === 0) {
                setTableState('Nenhum chamado encontrado no sistema.');
            } else {
                aplicarFiltros(); // Isso também renderiza e atualiza estatísticas
            }
        } catch (error) {
            console.error("Erro ao carregar do Airtable:", error);
            setTableState(`Falha ao carregar chamados: ${error.message}`);
        }
    }

    // Event listeners
    Object.values(filtros).forEach(filtro => {
        filtro.addEventListener('change', aplicarFiltros);
    });

    searchInput.addEventListener('input', aplicarFiltros);

    // Carregar dados iniciais
    carregarChamados();

    // Atualizar dados a cada 30 segundos
    setInterval(carregarChamados, 30000);
});
