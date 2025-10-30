import { API_URL } from './auth.js';

// --- Elementos DOM ---
const formContainer = document.getElementById('diario-form-container');
const listContainer = document.getElementById('diario-list-container');

// --- Variável de Estado ---
let currentEditId = null; // Guarda o ID do registro sendo editado

/**
 * Helper: Converte a data de 'hoje' para o formato 'YYYY-MM-DD'
 */
function getHojeFormatado() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Helper: Converte um objeto Date (do banco) para 'YYYY-MM-DD'
 */
function formatarDataParaInput(dateString) {
    if (!dateString) return getHojeFormatado();
    return new Date(dateString).toISOString().split('T')[0];
}

// --- FUNÇÃO PRINCIPAL (Chamada pelo index.html) ---
export async function loadDiario() {
    renderForm();
    loadAndRenderList();
}

// --- RENDERIZAÇÃO DO FORMULÁRIO (Criar/Editar) ---
// MODIFICADO: Adiciona o campo de data
function renderForm(title = 'Novo Registro Diário', data = {}, editId = null) {
    currentEditId = editId; 

    // Define a data para o input: ou a do registro (para edição) ou a de hoje (para novo)
    const inputDate = data.data ? formatarDataParaInput(data.data) : getHojeFormatado();

    formContainer.innerHTML = `
        <form id="diario-form" class="diario-form">
            <h4>${title}</h4>
            
            <label for="diario-data" class="input-label">Data do Registro:</label>
            <input type="date" id="diario-data" class="input-field" value="${inputDate}" required>
            
            <div class="diario-form-grid">
                <input type="number" step="0.1" id="diario-peso" class="input-field" placeholder="Peso (kg)" value="${data.pesoKg || ''}" required>
                <input type="number" step="0.1" id="diario-agua" class="input-field" placeholder="Água (Litros)" value="${data.aguaLitros || ''}" required>
            </div>
            <textarea id="diario-alimentos" class="input-field" placeholder="Alimentos consumidos...">${data.alimentosConsumidos || ''}</textarea>
            <textarea id="diario-treino" class="input-field" placeholder="Treino realizado...">${data.treinoRealizado || ''}</textarea>
            
            <button type="submit" class="btn btn-primary">${editId ? 'Salvar Alterações' : 'Salvar Registro'}</button>
            <button type="button" id="btn-cancelar-diario" class="btn-cancel" style="display: ${editId ? 'inline-block' : 'none'};">Cancelar Edição</button>
        </form>
    `;

    // Event Listeners do Formulário
    document.getElementById('diario-form').addEventListener('submit', handleFormSubmit);
    
    const cancelBtn = document.getElementById('btn-cancelar-diario');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            renderForm(); // Reseta o formulário para "Criar"
        });
    }
}

// --- RENDERIZAÇÃO DA LISTA ---
async function loadAndRenderList() {
    listContainer.innerHTML = '<p class="info-message">Carregando histórico...</p>';
    const token = localStorage.getItem('jwtToken');
    
    try {
        const response = await fetch(`${API_URL}/diarios`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Falha ao buscar histórico.');
        
        const registros = await response.json();
        
        if (registros.length === 0) {
            listContainer.innerHTML = '<p class="info-message">Nenhum registro no diário ainda.</p>';
            return;
        }

        renderDiarioList(registros);
        
    } catch (error) {
        console.error('Erro ao carregar lista:', error);
        listContainer.innerHTML = '<p class="error-message">Erro ao carregar histórico.</p>';
    }
}

// MODIFICADO: Formata a data como você pediu
function renderDiarioList(registros) {
    listContainer.innerHTML = '<hr><h4>Histórico de Registros</h4>'; 
    
    registros.forEach(reg => {
        // [NOVA FORMATAÇÃO] Ex: "quarta-feira, 30 de outubro de 2025"
        const dataFormatada = new Date(reg.data).toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC' // Importante para consistência
        });

        listContainer.innerHTML += `
            <div class="diario-card">
                <div class="diario-card-header">
                    <strong>${dataFormatada}</strong>
                    <span>Peso: ${reg.pesoKg}kg | Água: ${reg.aguaLitros}L</span>
                </div>
                <div class="diario-card-body">
                    <p><strong>Comida:</strong> ${reg.alimentosConsumidos || 'N/A'}</p>
                    <p><strong>Treino:</strong> ${reg.treinoRealizado || 'N/A'}</p>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-edit-diario" data-id="${reg._id}">Editar</button>
                    <button class="btn btn-danger btn-delete-diario" data-id="${reg._id}">Excluir</button>
                </div>
            </div>
        `;
    });

    listContainer.querySelectorAll('.btn-edit-diario').forEach(btn => 
        btn.addEventListener('click', (e) => handleEditClick(e.target.dataset.id))
    );
    listContainer.querySelectorAll('.btn-delete-diario').forEach(btn => 
        btn.addEventListener('click', (e) => handleDeleteClick(e.target.dataset.id))
    );
}

// --- HANDLERS (Ações) ---

// MODIFICADO: Envia a data para o backend
async function handleFormSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('jwtToken');

    const data = {
        data: document.getElementById('diario-data').value, // <-- CAMPO ADICIONADO
        pesoKg: parseFloat(document.getElementById('diario-peso').value),
        aguaLitros: parseFloat(document.getElementById('diario-agua').value),
        alimentosConsumidos: document.getElementById('diario-alimentos').value,
        treinoRealizado: document.getElementById('diario-treino').value,
    };
    
    if (!data.pesoKg || !data.aguaLitros || data.pesoKg <= 0 || data.aguaLitros < 0) {
        alert('Por favor, insira valores válidos para Peso (kg) e Água (Litros).');
        return;
    }

    try {
        const url = currentEditId ? `${API_URL}/diarios/${currentEditId}` : `${API_URL}/diarios`;
        const method = currentEditId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(data)
        });

        const resData = await response.json();

        if (!response.ok) {
            if (response.status === 400 && resData.msg) {
                alert(resData.msg); 
            } else {
                throw new Error('Falha ao salvar o registro.');
            }
        } else {
            alert('Registro salvo com sucesso!');
            loadDiario(); 
        }

    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar. Verifique o console.');
    }
}

// MODIFICADO: Título do formulário de edição
async function handleEditClick(id) {
    try {
        const token = localStorage.getItem('jwtToken');
        const res = await fetch(`${API_URL}/diarios/${id}`, {
            headers: { 'x-auth-token': token }
        });
        if (!res.ok) throw new Error('Falha ao buscar registro');
        
        const registro = await res.json();
        
        const dataFormatada = new Date(registro.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        
        renderForm(`Editar Registro de ${dataFormatada}`, registro, id); 
        
        window.scrollTo(0, 0); 

    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível carregar o registro para edição.');
    }
}

// (Não muda)
async function handleDeleteClick(id) {
    if (!confirm('Tem certeza que deseja excluir este registro do diário?')) {
        return;
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`${API_URL}/diarios/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) throw new Error('Falha ao excluir.');
        
        alert('Registro excluído com sucesso.');
        loadAndRenderList(); 

    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Não foi possível excluir o registro.');
    }
}