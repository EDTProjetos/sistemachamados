document.addEventListener('DOMContentLoaded', () => {
    // --- INÍCIO DA CONFIGURAÇÃO DO AIRTABLE ---
    const AIRTABLE_TOKEN = "patOd2SmftqjRnByQ.41649ac1488c558a20cd6bf05b45639805d7e1a346f255c3fa9efba6d44d15bf"; // Começa com 'pat...'
    const AIRTABLE_BASE_ID = "appG0PCmqUlN5u0iq"; // Começa com 'app...'
    const AIRTABLE_TABLE_NAME = "Chamados";
    // --- FIM DA CONFIGURAÇÃO ---

    const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;

    const form = document.getElementById('chamadoForm' );
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const statusMessage = document.getElementById('statusMessage');

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'p-4 rounded-md text-sm';
        const styles = {
            success: ['bg-green-100', 'text-green-800'],
            error: ['bg-red-100', 'text-red-800'],
            info: ['bg-blue-100', 'text-blue-800']
        };
        statusMessage.classList.add(...(styles[type] || styles.info));
        statusMessage.classList.remove('hidden');
    }

    function setSubmitButtonState(isSubmitting) {
        submitBtn.disabled = isSubmitting;
        btnText.textContent = isSubmitting ? 'Enviando...' : 'Enviar Chamado';
        btnSpinner.classList.toggle('hidden', !isSubmitting);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!AIRTABLE_TOKEN.startsWith('pat') || !AIRTABLE_BASE_ID.startsWith('app')) {
            showStatus("Erro: As credenciais do Airtable não foram configuradas corretamente no arquivo form.js.", "error");
            return;
        }

        setSubmitButtonState(true);
        showStatus("Enviando seu chamado...", "info");

        const payload = {
            fields: {
                "Nome": document.getElementById('nome').value,
                "Email": document.getElementById('email').value,
                "Setor": document.getElementById('setor').value,
                "Prioridade": document.getElementById('prioridade').value,
                "Descricao": document.getElementById('descricao').value,
                "Status": "Aberto" // Define o status inicial
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

            showStatus("Chamado enviado com sucesso!", "success");
            form.reset();
        } catch (error) {
            console.error("Erro ao enviar para o Airtable:", error);
            showStatus(`Falha ao enviar: ${error.message}`, "error");
        } finally {
            setSubmitButtonState(false);
        }
    });

    form.addEventListener('reset', () => statusMessage.classList.add('hidden'));
});