import { API_URL } from './auth.js';

// --- Elementos DOM ---
const listContainer = document.getElementById('metas-list-container');
const formContainer = document.getElementById('metas-form-container');

// --- Variável de Estado ---
let currentEditId = null; 

/**
 * Helper: Converte data do banco para 'YYYY-MM-DD' (para o input)
 */
function formatarDataParaInput(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
}

// --- FUNÇÃO PRINCIPAL (Chamada pelo index.html) ---
export async function loadMetas() {
    renderMetaForm(); // Desenha o formulário (sempre visível)
    loadAndRenderList(); // Carrega e desenha a lista de metas
}

// --- RENDERIZAÇÃO DO FORMULÁRIO (Criar/Editar) ---
// (MODIFICADO para incluir os novos campos)
function renderMetaForm(title = 'Definir Nova Meta', data = {}, editId = null) {
    currentEditId = editId; 

    const dataInicio = data.dataInicio ? formatarDataParaInput(data.dataInicio) : '';
    const dataFim = data.dataFim ? formatarDataParaInput(data.dataFim) : '';

    formContainer.innerHTML = `
        <form id="meta-form" class="meta-form">
            <h4>${title}</h4>
            
            <label for="meta-tipo" class="input-label">Tipo da Meta:</label>
            <select id="meta-tipo" class="input-field" required ${editId ? 'disabled' : ''}>
                <option value="" disabled ${!data.tipo ? 'selected' : ''}>Selecione um tipo...</option>
                <option value="Peso" ${data.tipo === 'Peso' ? 'selected' : ''}>Peso (kg)</option>
                <option value="Água" ${data.tipo === 'Água' ? 'selected' : ''}>Água (Litros/dia)</option>
            </select>
            
            <div class="meta-form-grid">
                <input type="number" step="0.1" id="meta-inicial" class="input-field" placeholder="Valor Inicial (Ex: 82)" value="${data.valorInicial || ''}" required>
                <input type="number" step="0.1" id="meta-valor" class="input-field" placeholder="Valor Alvo (Ex: 75)" value="${data.valorAlvo || ''}" required>
            </div>
            
            <div class="meta-form-grid">
                <input type="date" id="meta-inicio" class="input-field" value="${dataInicio}" required>
                <input type="date" id="meta-fim" class="input-field" value="${dataFim}">
            </div>
            
            <button type="submit" class="btn btn-primary">${editId ? 'Salvar Alterações' : 'Definir Meta'}</button>
            <button type="button" id="btn-cancelar-meta" class="btn-cancel" style="display: ${editId ? 'inline-block' : 'none'};">Cancelar</button>
        </form>
    `;

    // Event Listeners
    document.getElementById('meta-form').addEventListener('submit', handleFormSubmit);
    
    const cancelBtn = document.getElementById('btn-cancelar-meta');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            currentEditId = null;
            renderForm(); 
        });
    }
}

// --- RENDERIZAÇÃO DA LISTA (O CÉREBRO DA INTEGRAÇÃO) ---
async function loadAndRenderList() {
    listContainer.innerHTML = '<p class="info-message">Carregando metas e progresso...</p>';
    const token = localStorage.getItem('jwtToken');
    
    try {
        // [PASSO 1] Buscar as METAS
        const metasResponse = await fetch(`${API_URL}/metas`, {
            headers: { 'x-auth-token': token }
        });
        if (!metasResponse.ok) throw new Error('Falha ao buscar metas.');
        const metas = await metasResponse.json();

        // [PASSO 2] Buscar os REGISTROS DO DIÁRIO
        const diarioResponse = await fetch(`${API_URL}/diarios`, {
            headers: { 'x-auth-token': token }
        });
        if (!diarioResponse.ok) throw new Error('Falha ao buscar dados do diário.');
        const diarios = await diarioResponse.json();
        
        if (metas.length === 0) {
            listContainer.innerHTML = '<p class="info-message">Nenhuma meta definida ainda.</p>';
            return;
        }
        
        // [PASSO 3] Combinar os dados e renderizar
        renderMetaList(metas, diarios);
        
    } catch (error) {
        console.error('Erro ao carregar lista de metas:', error);
        listContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
}

// (MODIFICADO para calcular o progresso)
function renderMetaList(metas, diarios) {
    listContainer.innerHTML = '<hr><h4>Metas Atuais</h4>'; 
    
    metas.forEach(meta => {
        // Ignora metas de treino por enquanto
        if (meta.tipo === 'Treino') return; 

        // [LÓGICA DE PROGRESSO]
        let valorAtual = meta.valorInicial;
        let progresso = 0;
        let metaPerdaPeso = meta.valorAlvo < meta.valorInicial;

        // Encontra o registro mais recente do diário (para 'Peso' ou 'Água')
        const tipoDiario = meta.tipo === 'Peso' ? 'pesoKg' : 'aguaLitros';
        const registroRecente = diarios
            .filter(d => d[tipoDiario] > 0) // Pega apenas registros relevantes
            .sort((a, b) => new Date(b.data) - new Date(a.data)) // Ordena por data (mais novo primeiro)
            [0]; // Pega o primeiro
            
        if (registroRecente) {
            valorAtual = registroRecente[tipoDiario];
        }

        // Calcula a porcentagem do progresso
        const totalAlcancado = valorAtual - meta.valorInicial;
        const totalMeta = meta.valorAlvo - meta.valorInicial;

        if (totalMeta !== 0) { // Evita divisão por zero
            progresso = (totalAlcancado / totalMeta) * 100;
        }

        // Ajuste para metas de perda de peso (progresso deve ser positivo)
        if (metaPerdaPeso && progresso < 0) progresso = 0;
        if (!metaPerdaPeso && progresso < 0) progresso = 0;
        if (progresso > 100) progresso = 100;

        // Formata data fim (prazo)
        let prazoFormatado = 'Sem prazo';
        if (meta.dataFim) {
            prazoFormatado = new Date(meta.dataFim).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        }

        listContainer.innerHTML += `
            <div class="meta-card">
                <div class="meta-card-header">
                    <strong>${meta.tipo} (Alvo: ${meta.valorAlvo})</strong>
                    <span class="meta-status status-andamento">${progresso.toFixed(0)}%</span>
                </div>
                <div class="meta-card-body">
                    <p>Início: ${meta.valorInicial} | Atual: ${valorAtual}</p>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${progresso}%;"></div>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-edit-meta" data-id="${meta._id}">Editar</button>
                    <button class="btn btn-danger btn-delete-meta" data-id="${meta._id}">Excluir</button>
                </div>
            </div>
        `;
    });

    listContainer.querySelectorAll('.btn-edit-meta').forEach(btn => 
        btn.addEventListener('click', (e) => handleEditClick(e.target.dataset.id))
    );
    listContainer.querySelectorAll('.btn-delete-meta').forEach(btn => 
        btn.addEventListener('click', (e) => handleDeleteClick(e.target.dataset.id))
    );
}

// --- HANDLERS (Ações) ---

// (MODIFICADO para enviar os novos campos)
async function handleFormSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('jwtToken');

    const data = {
        tipo: document.getElementById('meta-tipo').value,
        valorInicial: parseFloat(document.getElementById('meta-inicial').value),
        valorAlvo: parseFloat(document.getElementById('meta-valor').value),
        dataInicio: document.getElementById('meta-inicio').value,
        dataFim: document.getElementById('meta-fim').value || null
    };
    
    if (!data.tipo || !data.valorInicial || !data.valorAlvo || !data.dataInicio) {
        alert('Tipo, Valor Inicial, Valor Alvo e Data de Início são obrigatórios.');
        return;
    }
    
    // Validação de lógica
    if (data.tipo === 'Peso' && data.valorInicial === data.valorAlvo) {
        alert('O Valor Inicial não pode ser igual ao Valor Alvo.');
        return;
    }

    try {
        const url = currentEditId ? `${API_URL}/metas/${currentEditId}` : `${API_URL}/metas`;
        const method = currentEditId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Falha ao salvar a meta.');
        } 
        
        alert('Meta salva com sucesso!');
        loadMetas(); // Reseta o form e recarrega a lista

    } catch (error) {
        console.error('Erro ao salvar meta:', error);
        alert(error.message || 'Erro ao salvar. Verifique o console.');
    }
}

// (MODIFICADO para buscar o ID da meta, não do diário)
async function handleEditClick(id) {
    try {
        const token = localStorage.getItem('jwtToken');
        // Busca a META, não o diário
        const res = await fetch(`${API_URL}/metas/${id}`, { 
            headers: { 'x-auth-token': token }
        });
        if (!res.ok) throw new Error('Falha ao buscar meta');
        
        const meta = await res.json();
        
        renderForm('Editar Meta', meta, id); 
        window.scrollTo(0, 0); 

    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível carregar a meta para edição.');
    }
}

// (Não muda)
async function handleDeleteClick(id) {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) {
        return; 
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`${API_URL}/metas/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) throw new Error('Falha ao excluir.');
        
        alert('Meta excluída com sucesso.');
        loadMetas(); 

    } catch (error) {
        console.error('Erro ao excluir meta:', error);
        alert('Não foi possível excluir a meta.');
    }
}