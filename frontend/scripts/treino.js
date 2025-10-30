import { API_URL } from './auth.js';

// --- Elementos DOM ---
const listContainer = document.getElementById('treinos-list-container');
const formContainer = document.getElementById('treino-form-container');
const showCreateFormBtn = document.getElementById('btn-show-create-form');

// --- Variáveis de Estado ---
let currentExercicios = []; // Array para guardar exercícios do formulário
let currentEditId = null;  // Guarda o ID do treino sendo editado

// --- FUNÇÃO PRINCIPAL (Chamada pelo index.html) ---
export async function loadTreinos() {
    // Reseta o estado
    formContainer.style.display = 'none';
    listContainer.style.display = 'block';
    showCreateFormBtn.style.display = 'block';
    currentEditId = null;
    currentExercicios = [];
    
    listContainer.innerHTML = '<p class="info-message">Carregando rotinas de treino...</p>';
    const token = localStorage.getItem('jwtToken');

    try {
        const response = await fetch(`${API_URL}/treinos`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Falha ao buscar treinos.');
        
        const treinos = await response.json();
        
        if (treinos.length === 0) {
            // Fluxo: Sem treinos. Mostra o botão "Gerar ABC".
            renderGerarABCButton();
        } else {
            // Fluxo: Tem treinos. Mostra a lista. (VR02)
            renderTreinoList(treinos);
        }
    } catch (error) {
        console.error('Erro ao carregar treinos:', error);
        listContainer.innerHTML = '<p class="error-message">Erro ao carregar rotinas.</p>';
    }
}

// --- RENDERIZAÇÃO DA LISTA ---

function renderGerarABCButton() {
    listContainer.innerHTML = `
        <div class="gerar-abc-container">
            <p>Você ainda não tem nenhuma rotina de treino cadastrada.</p>
            <button id="btn-gerar-abc" class="btn btn-primary">
                Gerar Rotina ABC Padrão
            </button>
        </div>
    `;
    document.getElementById('btn-gerar-abc').addEventListener('click', handleGerarABC);
}

function renderTreinoList(treinos) {
    listContainer.innerHTML = ''; // Limpa a lista
    treinos.forEach(treino => {
        const exerciciosHtml = treino.exercicios.map(ex => 
            `<li>${ex.nome} (${ex.series}x ${ex.repeticoes})</li>`
        ).join('');

        listContainer.innerHTML += `
            <div class="treino-card">
                <h4>${treino.nome}</h4>
                <small>${treino.grupoMuscular}</small>
                <div class="exercicios-list">
                    <ul>${exerciciosHtml}</ul>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-edit" data-id="${treino._id}">Editar</button>
                    <button class="btn btn-danger btn-delete" data-id="${treino._id}">Excluir</button>
                </div>
            </div>
        `;
    });

    // Adiciona event listeners para os botões de editar/excluir
    listContainer.querySelectorAll('.btn-edit').forEach(btn => 
        btn.addEventListener('click', (e) => handleEditClick(e.target.dataset.id))
    );
    listContainer.querySelectorAll('.btn-delete').forEach(btn => 
        btn.addEventListener('click', (e) => handleDeleteClick(e.target.dataset.id))
    );
}

// --- RENDERIZAÇÃO DO FORMULÁRIO (Criar/Editar) ---

// Mostra o formulário de CADASTRAR (RT02)
function showCreateForm() {
    currentEditId = null;
    currentExercicios = [];
    renderForm('Cadastrar Nova Rotina');
}
showCreateFormBtn.addEventListener('click', showCreateForm);

// Mostra o formulário de EDITAR (ER02)
async function handleEditClick(id) {
    try {
        const token = localStorage.getItem('jwtToken');
        const res = await fetch(`${API_URL}/treinos/${id}`, {
            headers: { 'x-auth-token': token }
        });
        if (!res.ok) throw new Error('Falha ao buscar treino');
        
        const treino = await res.json();
        
        currentEditId = id;
        currentExercicios = treino.exercicios;
        
        // Renderiza o formulário com os dados pré-preenchidos
        renderForm('Editar Rotina', treino); 
        
    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível carregar o treino para edição.');
    }
}

// Função central que desenha o formulário
function renderForm(title, data = {}) {
    listContainer.style.display = 'none';
    showCreateFormBtn.style.display = 'none';
    formContainer.style.display = 'block';

    formContainer.innerHTML = `
        <form id="treino-form" class="treino-form">
            <h4>${title}</h4>
            <input type_="text" id="treino-nome" class="input-field" placeholder="Nome da Rotina (Ex: Treino A)" value="${data.nome || ''}" required>
            <input type="text" id="treino-grupo" class="input-field" placeholder="Grupo Muscular (Ex: Peito e Tríceps)" value="${data.grupoMuscular || ''}" required>
            
            <hr class="form-divider">
            <h5>Exercícios</h5>
            
            <div class="exercicio-item">
                <input type="text" id="ex-nome" class="input-field" placeholder="Nome do Exercício">
                <input type="text" id="ex-series" class="input-field" placeholder="Séries (Ex: 3)">
                <input type="text" id="ex-reps" class="input-field" placeholder="Reps (Ex: 8-12)">
                <button type="button" id="btn-add-ex" class="btn btn-secondary">+</button>
            </div>
            
            <div id="exercicios-list-form" class="exercicios-list-form">
                ${renderExerciciosFormList()}
            </div>
            
            <hr class="form-divider">
            <button type="submit" class="btn btn-primary">Salvar Rotina</button>
            <button type="button" id="btn-cancelar" class="btn btn-secondary">Cancelar</button>
        </form>
    `;

    // Event Listeners do Formulário
    document.getElementById('btn-add-ex').addEventListener('click', handleAddExercicio);
    document.getElementById('treino-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('btn-cancelar').addEventListener('click', loadTreinos); // Volta para a lista
    
    // Listeners para os botões de remover exercício (se houver)
    formContainer.querySelectorAll('.btn-remove-ex').forEach(btn => {
        btn.addEventListener('click', (e) => handleRemoveExercicio(e.target.dataset.index));
    });
}

// Desenha a lista de exercícios DENTRO do formulário
function renderExerciciosFormList() {
    if (currentExercicios.length === 0) {
        return '<p>Nenhum exercício adicionado.</p>';
    }
    return `<ul>${currentExercicios.map((ex, index) => `
        <li>
            <span><strong>${ex.nome}</strong> (${ex.series}x ${ex.repeticoes})</span>
            <button type="button" class="btn btn-danger btn-remove-ex" data-index="${index}">&times;</button>
        </li>
    `).join('')}</ul>`;
}

// --- HANDLERS (Ações) ---

// Adiciona um exercício ao array 'currentExercicios' (RT03)
function handleAddExercicio() {
    const nome = document.getElementById('ex-nome').value;
    const series = document.getElementById('ex-series').value;
    const repeticoes = document.getElementById('ex-reps').value;

    if (!nome || !series || !repeticoes) {
        alert('Preencha os três campos do exercício.'); // FE3.1
        return;
    }

    currentExercicios.push({ nome, series, repeticoes });
    
    // Limpa os campos e redesenha a lista
    document.getElementById('ex-nome').value = '';
    document.getElementById('ex-series').value = '';
    document.getElementById('ex-reps').value = '';
    
    // Atualiza a lista no formulário
    document.getElementById('exercicios-list-form').innerHTML = renderExerciciosFormList();
    // Re-adiciona os listeners aos novos botões de remover
    formContainer.querySelectorAll('.btn-remove-ex').forEach(btn => {
        btn.addEventListener('click', (e) => handleRemoveExercicio(e.target.dataset.index));
    });
}

// Remove um exercício do array 'currentExercicios'
function handleRemoveExercicio(index) {
    currentExercicios.splice(index, 1); // Remove o item do array
    
    // Atualiza a lista no formulário
    document.getElementById('exercicios-list-form').innerHTML = renderExerciciosFormList();
    // Re-adiciona os listeners
    formContainer.querySelectorAll('.btn-remove-ex').forEach(btn => {
        btn.addEventListener('click', (e) => handleRemoveExercicio(e.target.dataset.index));
    });
}

// Salva o formulário (Criar ou Editar) (RT04 / ER05)
async function handleFormSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('jwtToken');

    const data = {
        nome: document.getElementById('treino-nome').value,
        grupoMuscular: document.getElementById('treino-grupo').value,
        exercicios: currentExercicios
    };

    if (currentExercicios.length === 0) {
        alert('Adicione ao menos um exercício à rotina.'); // FE3.1
        return;
    }

    try {
        const url = currentEditId ? `${API_URL}/treinos/${currentEditId}` : `${API_URL}/treinos`;
        const method = currentEditId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Falha ao salvar a rotina.');

        alert('Rotina salva com sucesso!');
        loadTreinos(); // Volta para a lista

    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar. Verifique o console.');
    }
}

// Excluir um treino (XR01)
async function handleDeleteClick(id) {
    // XR02: Solicita confirmação
    if (!confirm('Tem certeza que deseja excluir esta rotina de treino?')) {
        return; // FE3.3: Exclusão Cancelada
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`${API_URL}/treinos/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) throw new Error('Falha ao excluir.');
        
        // XR04: Confirmação
        alert('Rotina excluída com sucesso.');
        loadTreinos(); // Recarrega a lista

    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Não foi possível excluir a rotina.');
    }
}

// Gerar os treinos ABC
async function handleGerarABC() {
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`${API_URL}/treinos/gerar-abc`, {
            method: 'POST',
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) throw new Error('Falha ao gerar treinos.');
        
        alert('Rotina ABC gerada com sucesso!');
        loadTreinos(); // Recarrega a lista

    } catch (error) {
        console.error('Erro ao gerar ABC:', error);
        alert('Não foi possível gerar a rotina ABC.');
    }
}