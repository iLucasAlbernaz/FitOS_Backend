import { API_URL } from './auth.js';

const listContainer = document.getElementById('treinos-list-container');
const formContainer = document.getElementById('treino-form-container');
const showCreateFormBtn = document.getElementById('btn-show-create-form');

// --- Variáveis de Estado ---
let currentExercicios = []; 
let currentEditId = null;  
let treinoSugerido = null; 

// --- EVENT LISTENER PRINCIPAL (DELEGAÇÃO DE EVENTOS) ---
document.getElementById('section-treinos').addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    if (target.classList.contains('btn-edit')) {
        handleEditClick(target.dataset.id);
        return;
    }
    if (target.classList.contains('btn-delete')) {
        handleDeleteClick(target.dataset.id);
        return;
    }
    
    switch (target.id) {
        case 'btn-show-create-form':
            showCreateForm();
            break;
        case 'btn-gerar-abc':
            handleGerarABC();
            break;
        case 'btn-gerar-sugestao':
            handleGerarSugestao();
            break;
        case 'btn-salvar-sugestao':
            handleSalvarSugestao();
            break;
        case 'btn-cancelar-sugestao':
            treinoSugerido = null;
            loadTreinos();
            break;
        case 'btn-add-ex':
            handleAddExercicio();
            break;
        case 'btn-cancelar':
            loadTreinos();
            break;
    }

    if (target.classList.contains('btn-remove-ex')) {
        handleRemoveExercicio(e.target.dataset.index);
    }
});

formContainer.addEventListener('submit', (e) => {
    if (e.target.id === 'treino-form') {
        handleFormSubmit(e);
    }
});


// --- FUNÇÃO PRINCIPAL ---
export async function loadTreinos() {
    formContainer.style.display = 'none';
    listContainer.style.display = 'block';
    showCreateFormBtn.style.display = 'block';
    currentEditId = null;
    currentExercicios = [];
    treinoSugerido = null;
    
    listContainer.innerHTML = renderSugestaoUI();
    
    listContainer.innerHTML += '<div id="treinos-atuais-container"><p class="info-message">Carregando rotinas de treino...</p></div>';
    const treinosAtuaisContainer = document.getElementById('treinos-atuais-container');

    const token = localStorage.getItem('jwtToken');

    try {
        const response = await fetch(`${API_URL}/treinos`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Falha ao buscar treinos.');
        
        const treinos = await response.json();
        
        if (treinos.length === 0) {
            renderGerarABCButton(treinosAtuaisContainer);
        } else {
            renderTreinoList(treinos, treinosAtuaisContainer);
        }
    } catch (error) {
        console.error('Erro ao carregar treinos:', error);
        treinosAtuaisContainer.innerHTML = '<p class="error-message">Erro ao carregar rotinas.</p>';
    }
}

// --- RENDERIZAÇÃO DA UI ---

// [MODIFICADO] Renderiza a seção de "Sugerir Treino" com o campo Nível
function renderSugestaoUI() {
    return `
    <br/>
        <div id="treino-sugestao-container" class="sugestao-container">
            <h4><i class="fas fa-magic"></i> Sugestão de Treino</h4>
            <p>Selecione seu nível e o grupo muscular para gerar uma sugestão com base no seu perfil.</p>
            <div class="sugestao-form">
                <select id="sugestao-nivel-treino" class="input-field">
                    <option value="" disabled selected>Nível de Treino</option>
                    <option value="Iniciante">Iniciante (0-6 meses)</option>
                    <option value="Intermediário">Intermediário (6 meses - 2 anos)</option>
                    <option value="Avançado">Avançado (+2 anos)</option>
                </select>

                <select id="sugestao-grupo-muscular" class="input-field">
                    <option value="Peito">Peito</option>
                    <option value="Costas">Costas</option>
                    <option value="Pernas">Pernas (Completo)</option>
                    <option value="Ombros">Ombros</option>
                    <option value="Bíceps">Bíceps</option>
                    <option value="Tríceps">Tríceps</option>
                </select>
                <button id="btn-gerar-sugestao" class="btn btn-primary">Gerar</button>
            </div>
            <div id="treino-preview-container"></div>
        </div>
        <hr class="section-divider">
    `;
}

function renderTreinoPreview(treino) {
    const previewContainer = document.getElementById('treino-preview-container');
    if (!previewContainer) return;

    const exerciciosHtml = treino.exercicios.map(ex => 
        `<li>
            <strong>${ex.nome}</strong> (${ex.series}x ${ex.repeticoes})
            ${ex.orientacao ? `<br><small class="orientacao-texto">${ex.orientacao}</small>` : ''}
        </li>`
    ).join('');

    previewContainer.innerHTML = `
        <div class="treino-card sugestao-card">
            <h4>${treino.nome}</h4>
            <small>${treino.grupoMuscular}</small>
            <div class="exercicios-list">
                <ul>${exerciciosHtml}</ul>
            </div>
            <div class="action-buttons">
                <button id="btn-salvar-sugestao" class="btn btn-primary">Salvar Rotina</button>
                <button id="btn-cancelar-sugestao" class="btn btn-secondary">Cancelar</button>
            </div>
        </div>
    `;
}

function renderGerarABCButton(container) {
    container.innerHTML = `
        <div class="gerar-abc-container">
            <p>Você ainda não tem nenhuma rotina de treino cadastrada.</p>
            <button id="btn-gerar-abc" class="btn btn-primary">
                Gerar Rotina ABC Padrão
            </button>
        </div>
    `;
}

function renderTreinoList(treinos, container) {
    container.innerHTML = ''; 
    treinos.forEach(treino => {
        const exerciciosHtml = treino.exercicios.map(ex => 
            `<li>
                <strong>${ex.nome}</strong> (${ex.series}x ${ex.repeticoes})
                ${ex.orientacao ? `<br><small class="orientacao-texto">${ex.orientacao}</small>` : ''}
            </li>`
        ).join('');

        container.innerHTML += `
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
}

function renderForm(title, data = {}) {
    listContainer.style.display = 'none';
    showCreateFormBtn.style.display = 'none';
    formContainer.style.display = 'block';

    formContainer.innerHTML = `
        <form id="treino-form" class="treino-form">
            <h4>${title}</h4>
            <input type="text" id="treino-nome" class="input-field" placeholder="Nome da Rotina (Ex: Treino A)" value="${data.nome || ''}" required>
            <input type="text" id="treino-grupo" class="input-field" placeholder="Grupo Muscular (Ex: Peito e Tríceps)" value="${data.grupoMuscular || ''}" required>
            
            <hr class="form-divider">
            <h5>Exercícios</h5>
            
            <div class="exercicio-item-grid">
                <input type="text" id="ex-nome" class="input-field" placeholder="Nome do Exercício">
                <input type="text" id="ex-series" class="input-field" placeholder="Séries">
                <input type="text" id="ex-reps" class="input-field" placeholder="Reps">
                <input type="text" id="ex-orientacao" class="input-field" placeholder="Orientação (opcional)">
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
}

function renderExerciciosFormList() {
    if (currentExercicios.length === 0) {
        return '<p>Nenhum exercício adicionado.</p>';
    }
    return `<ul>${currentExercicios.map((ex, index) => `
        <li>
            <span>
                <strong>${ex.nome}</strong> (${ex.series}x ${ex.repeticoes})
                ${ex.orientacao ? `<br><small class="orientacao-texto">${ex.orientacao}</small>` : ''}
            </span>
            <button type="button" class="btn btn-danger btn-remove-ex" data-index="${index}">&times;</button>
        </li>
    `).join('')}</ul>`;
}

// --- HANDLERS (Ações) ---

// [MODIFICADO] Chama a IA para sugerir um treino
async function handleGerarSugestao() {
    const grupoMuscular = document.getElementById('sugestao-grupo-muscular').value;
    const nivelTreino = document.getElementById('sugestao-nivel-treino').value; // [NOVO]

    if (!nivelTreino) {
        alert('Por favor, selecione seu nível de treino.');
        return;
    }

    const previewContainer = document.getElementById('treino-preview-container');
    previewContainer.innerHTML = '<p class="info-message">Aguarde... Consultando IA...</p>';

    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`${API_URL}/treinos/sugerir`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': token 
            },
            // [MODIFICADO] Envia nivelTreino e grupoMuscular
            body: JSON.stringify({ grupoMuscular, nivelTreino }) 
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Falha ao gerar sugestão.');
        }

        treinoSugerido = await response.json();
        renderTreinoPreview(treinoSugerido);

    } catch (error) {
        console.error('Erro ao gerar sugestão:', error);
        alert('Erro ao gerar sugestão. Verifique o console.');
        previewContainer.innerHTML = `<p class="error-message">Erro: ${error.message}</p>`;
    }
}

async function handleSalvarSugestao() {
    if (!treinoSugerido) return;

    const token = localStorage.getItem('jwtToken');
    const previewContainer = document.getElementById('treino-preview-container');
    previewContainer.innerHTML = '<p class="info-message">Salvando rotina...</p>';

    try {
        const response = await fetch(`${API_URL}/treinos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(treinoSugerido)
        });

        if (!response.ok) throw new Error('Falha ao salvar a rotina.');

        alert('Rotina salva com sucesso!');
        loadTreinos();

    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar. Verifique o console.');
    }
}

function handleAddExercicio() {
    const nome = document.getElementById('ex-nome').value;
    const series = document.getElementById('ex-series').value;
    const repeticoes = document.getElementById('ex-reps').value;
    const orientacao = document.getElementById('ex-orientacao').value;

    if (!nome || !series || !repeticoes) {
        alert('Preencha pelo menos Nome, Séries e Repetições.');
        return;
    }

    currentExercicios.push({ nome, series, repeticoes, orientacao });
    
    document.getElementById('ex-nome').value = '';
    document.getElementById('ex-series').value = '';
    document.getElementById('ex-reps').value = '';
    document.getElementById('ex-orientacao').value = '';
    
    document.getElementById('exercicios-list-form').innerHTML = renderExerciciosFormList();
}

function handleRemoveExercicio(index) {
    currentExercicios.splice(index, 1);
    document.getElementById('exercicios-list-form').innerHTML = renderExerciciosFormList();
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('jwtToken');

    const data = {
        nome: document.getElementById('treino-nome').value,
        grupoMuscular: document.getElementById('treino-grupo').value,
        exercicios: currentExercicios
    };

    if (currentExercicios.length === 0) {
        alert('Adicione ao menos um exercício à rotina.');
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
        loadTreinos();

    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar. Verifique o console.');
    }
}

function showCreateForm() {
    currentEditId = null;
    currentExercicios = [];
    renderForm('Cadastrar Nova Rotina');
    showCreateFormBtn.style.display = 'none';
}

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
        
        renderForm('Editar Rotina', treino); 
        
    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível carregar o treino para edição.');
    }
}

async function handleDeleteClick(id) {
    if (!confirm('Tem certeza que deseja excluir esta rotina de treino?')) {
        return;
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`${API_URL}/treinos/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) throw new Error('Falha ao excluir.');
        
        alert('Rotina excluída com sucesso!');
        loadTreinos(); 

    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Não foi possível excluir a rotina.');
    }
}

async function handleGerarABC() {
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`${API_URL}/treinos/gerar-abc`, {
            method: 'POST',
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) throw new Error('Falha ao gerar treinos.');
        
        alert('Rotina ABC gerada com sucesso!');
        loadTreinos(); 

    } catch (error) {
        console.error('Erro ao gerar ABC:', error);
        alert('Não foi possível gerar a rotina ABC.');
    }
}