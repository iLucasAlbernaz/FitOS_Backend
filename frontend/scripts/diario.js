import { API_URL } from './auth.js';

const formContainer = document.getElementById('diario-form-container');
const listContainer = document.getElementById('diario-list-container');
const showCreateFormBtn = document.getElementById('btn-show-create-diario-form');

let currentEditId = null; 


function getHojeFormatado() {
    return new Date().toISOString().split('T')[0];
}


function formatarDataParaInput(dateString) {
    if (!dateString) return getHojeFormatado();
    return new Date(dateString).toISOString().split('T')[0];
}

export async function loadDiario() {
    
    formContainer.style.display = 'none';
    listContainer.style.display = 'block';
    showCreateFormBtn.style.display = 'block';
    
    renderForm('Novo Registro Diário', {}, null, false);
    
    loadAndRenderList();
}

function showCreateForm() {
    currentEditId = null;
    renderForm('Novo Registro Diário', {}, null, true); 
}

if (showCreateFormBtn) {
    showCreateFormBtn.addEventListener('click', showCreateForm);
}


function renderForm(title = 'Novo Registro Diário', data = {}, editId = null, show = false) {
    currentEditId = editId; 

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
            <button type="button" id="btn-cancelar-diario" class="btn btn-secondary">Cancelar</button>
        </form>
    `;

    if (show) {
        formContainer.style.display = 'block';
        listContainer.style.display = 'none';
        showCreateFormBtn.style.display = 'none';
    } else {
        formContainer.style.display = 'none';
    }

    document.getElementById('diario-form').addEventListener('submit', handleFormSubmit);
    
    const cancelBtn = document.getElementById('btn-cancelar-diario');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            loadDiario(); 
        });
    }
}

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
            listContainer.innerHTML = '<hr style="border: 1px solid #eee; margin: 2rem 0;"><p class="info-message">Nenhum registro no diário ainda.</p>';
            return;
        }

        renderDiarioList(registros);
        
    } catch (error) {
        console.error('Erro ao carregar lista:', error);
        listContainer.innerHTML = '<p class="error-message">Erro ao carregar histórico.</p>';
    }
}

function renderDiarioList(registros) {
    listContainer.innerHTML = '<h4>Histórico de Registros</h4>'; 
    
    registros.forEach(reg => {
        const dataFormatada = new Date(reg.data).toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC' 
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


async function handleFormSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('jwtToken');

    const data = {
        data: document.getElementById('diario-data').value,
        pesoKg: parseFloat(document.getElementById('diario-peso').value),
        aguaLitros: parseFloat(document.getElementById('diario-agua').value),
        alimentosConsumidos: document.getElementById('diario-alimentos').value,
        treinoRealizado: document.getElementById('diario-treino').value,
    };
    
    if (!data.data || !data.pesoKg || !data.aguaLitros || data.pesoKg <= 0 || data.aguaLitros < 0) {
        alert('Por favor, insira valores válidos para Data, Peso (kg) e Água (Litros).');
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

async function handleEditClick(id) {
    try {
        const token = localStorage.getItem('jwtToken');
        const res = await fetch(`${API_URL}/diarios/${id}`, {
            headers: { 'x-auth-token': token }
        });
        if (!res.ok) throw new Error('Falha ao buscar registro');
        
        const registro = await res.json();
        
        const dataFormatada = new Date(registro.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        
        renderForm(`Editar Registro de ${dataFormatada}`, registro, id, true); 
        
        window.scrollTo(0, 0); 

    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível carregar o registro para edição.');
    }
}

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