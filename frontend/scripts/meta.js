import { API_URL } from './auth.js';

// --- Elementos DOM ---
const section = document.getElementById('section-metas');
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
    // 1. Renderiza o formulário (mas o esconde)
    renderMetaForm();
    // 2. Carrega e renderiza a lista de metas
    loadAndRenderList();
}

// --- RENDERIZAÇÃO DO FORMULÁRIO (Criar/Editar) ---
function renderMetaForm(title = 'Definir Nova Meta', data = {}, editId = null) {
    currentEditId = editId; 

    // Define a data para o input: ou a do registro (para edição) ou vazia (para novo)
    const inputDate = data.prazo ? formatarDataParaInput(data.prazo) : '';

    formContainer.innerHTML = `
        <form id="meta-form" class="meta-form">
            <h4>${title}</h4>
            
            <label for="meta-tipo" class="input-label">Tipo da Meta:</label>
            <select id="meta-tipo" class="input-field" required ${editId ? 'disabled' : ''}>
                <option value="" disabled ${!data.tipo ? 'selected' : ''}>Selecione um tipo...</option>
                <option value="Peso" ${data.tipo === 'Peso' ? 'selected' : ''}>Peso (kg)</option>
                <option value="Água" ${data.tipo === 'Água' ? 'selected' : ''}>Água (Litros/dia)</option>
                <option value="Treino" ${data.tipo === 'Treino' ? 'selected' : ''}>Treino (vezes/semana)</option>
            </select>
            
            <label for="meta-valor" class="input-label">Valor Alvo:</label>
            <input type="number" step="0.1" id="meta-valor" class="input-field" placeholder="Ex: 75.5" value="${data.valorAlvo || ''}" required>

            <label for="meta-prazo" class="input-label">Prazo (Opcional):</label>
            <input type="date" id="meta-prazo" class="input-field" value="${inputDate}">
            
            <button type="submit" class="btn btn-primary">${editId ? 'Salvar Alterações' : 'Definir Meta'}</button>
            <button type="button" id="btn-cancelar-meta" class="btn-cancel" style="display: ${editId ? 'inline-block' : 'none'};">Cancelar Edição</button>
        </form>
    `;

    // Event Listeners
    document.getElementById('meta-form').addEventListener('submit', handleFormSubmit);
    
    const cancelBtn = document.getElementById('btn-cancelar-meta');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            currentEditId = null;
            renderForm(); // Reseta o formulário
        });
    }
}

// --- RENDERIZAÇÃO DA LISTA ---
async function loadAndRenderList() {
    listContainer.innerHTML = '<p class="info-message">Carregando metas...</p>';
    const token = localStorage.getItem('jwtToken');
    
    try {
        const response = await fetch(`${API_URL}/metas`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Falha ao buscar metas.');
        
        const metas = await response.json();
        
        if (metas.length === 0) {
            listContainer.innerHTML = '<p class="info-message">Nenhuma meta definida ainda.</p>';
            return;
        }
        renderMetaList(metas);
        
    } catch (error) {
        console.error('Erro ao carregar lista de metas:', error);
        listContainer.innerHTML = '<p class="error-message">Erro ao carregar metas.</p>';
    }
}

function renderMetaList(metas) {
    listContainer.innerHTML = '<hr><h4>Metas Atuais</h4>'; 
    
    metas.forEach(meta => {
        let prazoFormatado = 'Sem prazo';
        let statusClass = 'status-andamento'; // (VM02)
        let statusTexto = meta.status;

        if (meta.prazo) {
            const prazoData = new Date(meta.prazo);
            prazoFormatado = prazoData.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            
            // Verifica se expirou (VM02)
            if (new Date() > prazoData && meta.status === 'Em Andamento') {
                statusClass = 'status-expirada';
                statusTexto = 'Expirada';
            }
        }
        if (meta.status === 'Concluída') {
            statusClass = 'status-concluida';
        }

        listContainer.innerHTML += `
            <div class="meta-card">
                <div class="meta-card-header">
                    <strong>${meta.tipo} (Alvo: ${meta.valorAlvo})</strong>
                    <span class="meta-status ${statusClass}">${statusTexto}</span>
                </div>
                <div class="meta-card-body">
                    <p>Prazo: ${prazoFormatado}</p>
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

// Salva o formulário (Criar ou Editar) (DM05 / EM04)
async function handleFormSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('jwtToken');

    const data = {
        tipo: document.getElementById('meta-tipo').value,
        valorAlvo: parseFloat(document.getElementById('meta-valor').value),
        prazo: document.getElementById('meta-prazo').value || null
    };
    
    // (FE9.1 / FE9.2)
    if (!data.tipo || !data.valorAlvo || data.valorAlvo <= 0) {
        alert('Selecione um Tipo e insira um Valor Alvo positivo.');
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
        loadDiario(); // Reseta o form e recarrega a lista

    } catch (error) {
        console.error('Erro ao salvar meta:', error);
        alert(error.message || 'Erro ao salvar. Verifique o console.');
    }
}

// Carrega dados para o formulário de EDIÇÃO (EM01)
async function handleEditClick(id) {
    try {
        const token = localStorage.getItem('jwtToken');
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

// Excluir uma meta (XM01)
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
        loadAndRenderList(); 

    } catch (error) {
        console.error('Erro ao excluir meta:', error);
        alert('Não foi possível excluir a meta.');
    }
}