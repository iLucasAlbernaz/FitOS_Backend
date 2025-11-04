import { API_URL } from './auth.js';

// --- Elementos DOM ---
const listContainer = document.getElementById('receitas-list-container');
const formContainer = document.getElementById('receitas-form-container');
const showCreateFormBtn = document.getElementById('btn-show-create-receita-form');

// --- Variáveis de Estado ---
let currentEditId = null;  
let currentIngredientes = []; // Array para guardar ingredientes do formulário

// --- FUNÇÃO PRINCIPAL (Chamada pelo index.html) ---
export async function loadReceitas() {
    formContainer.style.display = 'none';
    listContainer.style.display = 'block';
    showCreateFormBtn.style.display = 'block';
    currentEditId = null;
    currentIngredientes = [];
    
    renderForm('Criar Nova Receita'); // Renderiza o form (oculto)
    loadAndRenderList();
}

// --- RENDERIZAÇÃO DA LISTA ---
async function loadAndRenderList() {
    listContainer.innerHTML = '<p class="info-message">Carregando receitas...</p>';
    const token = localStorage.getItem('jwtToken');

    try {
        const response = await fetch(`${API_URL}/receitas`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Falha ao buscar receitas.');
        
        const receitas = await response.json();
        
        if (receitas.length === 0) {
            listContainer.innerHTML = '<p class="info-message">Nenhuma receita cadastrada ainda.</p>';
        } else {
            renderReceitaList(receitas);
        }
    } catch (error) {
        console.error('Erro ao carregar receitas:', error);
        listContainer.innerHTML = '<p class="error-message">Erro ao carregar receitas.</p>';
    }
}

// Renderiza os cards da lista
function renderReceitaList(receitas) {
    listContainer.innerHTML = '<hr style="border: 1px solid #eee; margin: 2rem 0;"><h4>Minhas Receitas</h4>';
    receitas.forEach(receita => {
        // Formata os macros para exibição
        const macrosHtml = `
            <small>
                Cals: ${receita.macros.calorias} | 
                Prot: ${receita.macros.proteinas}g | 
                Carb: ${receita.macros.carboidratos}g | 
                Gord: ${receita.macros.gorduras}g
            </small>
        `;
        // Formata os ingredientes
        const ingredientesHtml = receita.ingredientes.map(ing => `<li>${ing.nome} (${ing.quantidade})</li>`).join('');

        listContainer.innerHTML += `
            <div class="receita-card">
                <h4>${receita.nome}</h4>
                <p class="receita-descricao">${receita.descricao}</p>
                <div class="receita-macros">${macrosHtml}</div>
                
                <details class="receita-details">
                    <summary>Ver Ingredientes e Preparo</summary>
                    <strong>Ingredientes:</strong>
                    <ul>${ingredientesHtml}</ul>
                    <strong style="margin-top: 10px; display: block;">Modo de Preparo:</strong>
                    <p>${receita.modoPreparo || 'N/A'}</p>
                </details>
                
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-edit-receita" data-id="${receita._id}">Editar</button>
                    <button class="btn btn-danger btn-delete-receita" data-id="${receita._id}">Excluir</button>
                </div>
            </div>
        `;
    });

    listContainer.querySelectorAll('.btn-edit-receita').forEach(btn => 
        btn.addEventListener('click', (e) => handleEditClick(e.target.dataset.id))
    );
    listContainer.querySelectorAll('.btn-delete-receita').forEach(btn => 
        btn.addEventListener('click', (e) => handleDeleteClick(e.target.dataset.id))
    );
}

// --- RENDERIZAÇÃO DO FORMULÁRIO (Criar/Editar) ---
function showCreateForm() {
    currentEditId = null;
    currentIngredientes = []; // Limpa os ingredientes
    renderForm('Criar Nova Receita', {}, true);
}
if(showCreateFormBtn) {
    showCreateFormBtn.addEventListener('click', showCreateForm);
}

async function handleEditClick(id) {
    try {
        const token = localStorage.getItem('jwtToken');
        const res = await fetch(`${API_URL}/receitas/${id}`, {
            headers: { 'x-auth-token': token }
        });
        if (!res.ok) throw new Error('Falha ao buscar receita');
        
        const receita = await res.json();
        currentEditId = id;
        currentIngredientes = receita.ingredientes; // Carrega os ingredientes
        
        renderForm('Editar Receita', receita, true); 
        
    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível carregar a receita para edição.');
    }
}

// Renderiza o formulário (igual ao de Treinos)
function renderForm(title, data = {}, show = false) {
    listContainer.style.display = show ? 'none' : 'block';
    showCreateFormBtn.style.display = show ? 'none' : 'block';
    formContainer.style.display = show ? 'block' : 'none';
    
    // Preenche os valores de macros (se existirem)
    const macros = data.macros || {};

    formContainer.innerHTML = `
        <form id="receita-form" class="receita-form">
            <h4>${title}</h4>
            
            <label class="input-label">Nome da Receita:</label>
            <input type="text" id="receita-nome" class="input-field" placeholder="Ex: Panqueca de Aveia" value="${data.nome || ''}" required>
            
            <label class="input-label">Descrição Curta:</label>
            <input type="text" id="receita-descricao" class="input-field" placeholder="Ex: Rápida, proteica e saborosa" value="${data.descricao || ''}" required>
            
            <label class="input-label">Modo de Preparo:</label>
            <textarea id="receita-preparo" class="input-field" placeholder="1. Misture os ovos...">${data.modoPreparo || ''}</textarea>
            
            <hr class="form-divider">
            <label class="input-label">Macros Estimados:</label>
            <div class="macros-grid">
                <input type="number" id="macro-calorias" class="input-field" placeholder="Calorias" value="${macros.calorias || ''}" required>
                <input type="number" id="macro-proteinas" class="input-field" placeholder="Proteínas (g)" value="${macros.proteinas || ''}" required>
                <input type="number" id="macro-carboidratos" class="input-field" placeholder="Carboidratos (g)" value="${macros.carboidratos || ''}" required>
                <input type="number" id="macro-gorduras" class="input-field" placeholder="Gorduras (g)" value="${macros.gorduras || ''}" required>
            </div>
            
            <hr class="form-divider">
            <label class="input-label">Ingredientes:</label>
            <div class="ingrediente-item">
                <input type="text" id="ing-nome" class="input-field" placeholder="Nome do Ingrediente (Ex: Ovo)">
                <input type="text" id="ing-qtd" class="input-field" placeholder="Quantidade (Ex: 2 unidades)">
                <button type="button" id="btn-add-ingrediente" class="btn btn-secondary">+</button>
            </div>
            
            <div id="ingredientes-list-form" class="exercicios-list-form">
                </div>
            
            <hr class="form-divider">
            <button type="submit" class="btn btn-primary">Salvar Receita</button>
            <button type="button" id="btn-cancelar-receita" class="btn btn-secondary">Cancelar</button>
        </form>
    `;

    // Renderiza a lista de ingredientes no form
    renderIngredientesFormList(); 

    // Event Listeners
    document.getElementById('btn-add-ingrediente').addEventListener('click', handleAddIngrediente);
    document.getElementById('receita-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('btn-cancelar-receita').addEventListener('click', loadReceitas); // Volta para a lista
}

// Desenha a lista de ingredientes DENTRO do formulário
function renderIngredientesFormList() {
    const listEl = document.getElementById('ingredientes-list-form');
    if (!listEl) return;
    
    if (currentIngredientes.length === 0) {
        listEl.innerHTML = '<p>Nenhum ingrediente adicionado.</p>';
        return;
    }
    listEl.innerHTML = `<ul>${currentIngredientes.map((ing, index) => `
        <li>
            <span><strong>${ing.nome}</strong> (${ing.quantidade})</span>
            <button type="button" class="btn btn-danger btn-remove-ex" data-index="${index}">&times;</button>
        </li>
    `).join('')}</ul>`;

    // Re-adiciona os listeners aos botões de remover
    listEl.querySelectorAll('.btn-remove-ex').forEach(btn => {
        btn.addEventListener('click', (e) => handleRemoveIngrediente(e.target.dataset.index));
    });
}

// --- HANDLERS (Ações) ---

function handleAddIngrediente() {
    const nome = document.getElementById('ing-nome').value;
    const quantidade = document.getElementById('ing-qtd').value;

    if (!nome || !quantidade) {
        alert('Preencha o Nome e a Quantidade do ingrediente.');
        return;
    }

    currentIngredientes.push({ nome, quantidade });
    
    document.getElementById('ing-nome').value = '';
    document.getElementById('ing-qtd').value = '';
    
    renderIngredientesFormList();
}

function handleRemoveIngrediente(index) {
    currentIngredientes.splice(index, 1); // Remove o item do array
    renderIngredientesFormList();
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('jwtToken');

    // Coleta os dados do formulário
    const data = {
        nome: document.getElementById('receita-nome').value,
        descricao: document.getElementById('receita-descricao').value,
        modoPreparo: document.getElementById('receita-preparo').value,
        macros: {
            calorias: parseFloat(document.getElementById('macro-calorias').value) || 0,
            proteinas: parseFloat(document.getElementById('macro-proteinas').value) || 0,
            carboidratos: parseFloat(document.getElementById('macro-carboidratos').value) || 0,
            gorduras: parseFloat(document.getElementById('macro-gorduras').value) || 0,
        },
        ingredientes: currentIngredientes // O array que já montamos
    };

    if (!data.nome || !data.descricao || currentIngredientes.length === 0) {
        alert('Nome, Descrição e ao menos um Ingrediente são obrigatórios.'); // FE3.1
        return;
    }

    try {
        const url = currentEditId ? `${API_URL}/receitas/${currentEditId}` : `${API_URL}/receitas`;
        const method = currentEditId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Falha ao salvar a receita.');

        alert('Receita salva com sucesso!');
        loadReceitas(); // Volta para a lista

    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar. Verifique o console.');
    }
}

async function handleDeleteClick(id) {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) {
        return; // FE3.3
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`${API_URL}/receitas/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) throw new Error('Falha ao excluir.');
        
        alert('Receita excluída com sucesso.');
        loadReceitas(); // Recarrega a lista

    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Não foi possível excluir a receita.');
    }
}