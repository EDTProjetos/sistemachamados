document.addEventListener('DOMContentLoaded', () => {
    // --- INÍCIO DA CONFIGURAÇÃO DO AIRTABLE ---
    const AIRTABLE_TOKEN = "patOd2SmftqjRnByQ.41649ac1488c558a20cd6bf05b45639805d7e1a346f255c3fa9efba6d44d15bf"; // Começa com 'pat...'
    const AIRTABLE_BASE_ID = "appG0PCmqUlN5u0iq"; // Começa com 'app...'
    const AIRTABLE_TABLE_NAME = "Chamados";
    // --- FIM DA CONFIGURAÇÃO ---

    const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;

    const form = document.getElementById('chamadoForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const statusMessage = document.getElementById('statusMessage');

    // Removemos o campo 'chamadoId' do HTML se ele existia para evitar confusão.
    // Se você tem um <input type="text" id="chamadoId">, pode removê-lo ou mantê-lo invisível.
    // A lógica de "atualizarChamadoId" e "obterProximoId" foi removida.
    // O Airtable agora gerencia o ID.

    function showStatus(message, type) {
        statusMessage.innerHTML = message;
        statusMessage.className = 'p-6 rounded-2xl text-sm font-medium';
        const styles = {
            success: ['bg-green-100', 'text-green-800', 'border-2', 'border-green-200'],
            error: ['bg-red-100', 'text-red-800', 'border-2', 'border-red-200'],
            info: ['bg-blue-100', 'text-blue-800', 'border-2', 'border-blue-200']
        };
        statusMessage.classList.add(...(styles[type] || styles.info));
        statusMessage.classList.remove('hidden');

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusMessage.classList.add('hidden');
            }, 5000);
        }
    }

    function setSubmitButtonState(isSubmitting) {
        submitBtn.disabled = isSubmitting;
        if (isSubmitting) {
            btnText.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enviando Chamado...';
            btnSpinner.classList.remove('hidden');
        } else {
            btnText.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Enviar Chamado';
            btnSpinner.classList.add('hidden');
        }
        submitBtn.classList.toggle('opacity-50', isSubmitting);
        submitBtn.classList.toggle('cursor-not-allowed', isSubmitting);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!AIRTABLE_TOKEN.startsWith('pat') || !AIRTABLE_BASE_ID.startsWith('app')) {
            showStatus(`
                <div class="flex items-center">
                    <i class="fas fa-exclamation-triangle mr-3 text-xl"></i>
                    <div>
                        <strong>Erro de Configuração</strong><br>
                        As credenciais do Airtable não foram configuradas corretamente.
                    </div>
                </div>
            `, "error");
            return;
        }

        setSubmitButtonState(true);
        showStatus(`
            <div class="flex items-center">
                <i class="fas fa-paper-plane mr-3 text-xl"></i>
                <div>
                    <strong>Enviando seu chamado...</strong><br>
                    Aguarde enquanto processamos sua solicitação.
                </div>
            </div>
        `, "info");

        // AQUI ESTÁ A MAIOR MUDANÇA: REMOVEMOS O CAMPO "ID" DO PAYLOAD.
        // O Airtable, por ser "Autonumber", irá gerar seu próprio ID.
        const payload = {
            fields: {
                "Nome": document.getElementById('nome').value,
                "Email": document.getElementById('email').value,
                "Setor": document.getElementById('setor').value,
                "Prioridade": document.getElementById('prioridade').value,
                "Descricao": document.getElementById('descricao').value,
                "Status": "Aberto",
                "DataSolicitacao": document.getElementById("datasolicitacao").value
            }
        };

        try {
            const response = await fetch(AIRTABLE_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || `Erro HTTP: ${response.status}`);
            }

            const result = await response.json();

            // O ID agora virá da resposta do Airtable, que é o ID gerado por ele.
            const airtableGeneratedId = result.id; // Airtable retorna o ID do registro em 'result.id'
            
            // Se você quiser exibir o ID gerado pelo Airtable, pode usar 'airtableGeneratedId'.
            // Não há mais necessidade de armazenar 'ultimoChamadoId' no localStorage para esta finalidade,
            // pois o Airtable é a fonte da verdade para o ID agora.

            showStatus(`
                <div class="flex items-center">
                    <i class="fas fa-check-circle mr-3 text-2xl"></i>
                    <div>
                        <strong>Chamado enviado com sucesso!</strong><br>
                        <span class="text-sm">ID do Chamado: <strong class="font-mono bg-white px-2 py-1 rounded">${airtableGeneratedId}</strong></span><br>
                        <span class="text-sm">Você receberá atualizações no e-mail informado.</span>
                    </div>
                </div>
            `, "success");

            // Reset do formulário
            form.reset();
            // Atualiza data/hora após o envio
            const agora = new Date();
            const dataHoraFormatada = agora.toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short'
            });
            document.getElementById("dataHora").value = dataHoraFormatada;
            
        } catch (error) {
            console.error("Erro ao enviar para o Airtable:", error);
            showStatus(`
                <div class="flex items-center">
                    <i class="fas fa-exclamation-circle mr-3 text-xl"></i>
                    <div>
                        <strong>Falha ao enviar chamado</strong><br>
                        <span class="text-sm">${error.message}</span><br>
                        <span class="text-sm">Tente novamente ou entre em contato com o suporte.</span>
                    </div>
                </div>
            `, "error");
        } finally {
            setSubmitButtonState(false);
        }
    });

    // Removido o evento 'reset' que chamava 'atualizarChamadoId',
    // pois o ID não é mais gerado pelo frontend.

    // Inicializa a data/hora quando a página carrega
    const agora = new Date();
    const dataHoraFormatada = agora.toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short'
    });
    document.getElementById("dataHora").value = dataHoraFormatada;
});
