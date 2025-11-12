import { API_URL } from './auth.js';

// --- Elementos DOM ---
const listContainer = document.getElementById('receitas-list-container');
const formContainer = document.getElementById('receitas-form-container');
const showCreateFormBtn = document.getElementById('btn-show-create-receita-form');
const sugerirReceitasBtn = document.getElementById('btn-sugerir-receitas');
const sugeridasContainer = document.getElementById('receitas-sugeridas-container');

// --- Variáveis de Estado ---
let currentEditId = null;  
let currentIngredientes = []; 
let cacheReceitasSugeridas = []; 

// --- FUNÇÃO PRINCIPAL ---
export async function loadReceitas() {
    formContainer.style.display = 'none';
    listContainer.style.display = 'block';
    showCreateFormBtn.style.display = 'block';
    
    sugerirReceitasBtn.style.display = 'block';
    sugeridasContainer.style.display = 'none';
    sugeridasContainer.innerHTML = '';
    
    currentEditId = null;
    currentIngredientes = [];
    cacheReceitasSugeridas = []; 
    
    renderForm('Criar Nova Receita'); 
    loadAndRenderList();
}

// --- RENDERIZAÇÃO DA LISTA (Suas Receitas) ---
async function loadAndRenderList() {
    listContainer.innerHTML = '<p class="info-message">Carregando suas receitas...</p>';
    const token = localStorage.getItem('jwtToken');

    try {
        const response = await fetch(`${API_URL}/receitas`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Falha ao buscar receitas.');
        
        const receitas = await response.json();
        
        if (receitas.length === 0) {
            listContainer.innerHTML = '<hr style="border: 1px solid #eee; margin: 2rem 0;"><h4>Minhas Receitas</h4><p class="info-message">Nenhuma receita cadastrada ainda.</p>';
        } else {
            renderReceitaList(receitas);
        }
    } catch (error) {
        console.error('Erro ao carregar receitas:', error);
        listContainer.innerHTML = '<p class="error-message">Erro ao carregar suas receitas.</p>';
    }
}

function renderReceitaList(receitas) {
    listContainer.innerHTML = '<hr style="border: 1px solid #eee; margin: 2rem 0;"><h4>Minhas Receitas</h4>';
    receitas.forEach(receita => {
        listContainer.innerHTML += renderReceitaCard(receita, false); // false = Não é sugestão
    });

    listContainer.querySelectorAll('.btn-edit-receita').forEach(btn => 
        btn.addEventListener('click', (e) => handleEditClick(e.target.dataset.id))
    );
    listContainer.querySelectorAll('.btn-delete-receita').forEach(btn => 
        btn.addEventListener('click', (e) => handleDeleteClick(e.target.dataset.id))
    );
}

// --- LÓGICA DE SUGESTÕES DA IA (Gemini - Preservado) ---
if (sugerirReceitasBtn) {
    sugerirReceitasBtn.addEventListener('click', handleSugerirReceitas);
}
async function handleSugerirReceitas() {
    const token = localStorage.getItem('jwtToken');
    sugeridasContainer.style.display = 'block';
    sugeridasContainer.innerHTML = '<p class="info-message">Isso pode levar alguns segundos.</p>';
    sugerirReceitasBtn.style.display = 'none'; 

    try {
        const response = await fetch(`${API_URL}/receitas/sugeridas`, {
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Falha ao buscar sugestões.');
        }
        
        const data = await response.json();
        
        cacheReceitasSugeridas = data.receitas; 
        renderSugeridas(data.perfilUsado, data.receitas);

    } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
        sugeridasContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
}

function renderSugeridas(perfilUsado, receitas) {
    sugeridasContainer.innerHTML = `
        <h4>Sugestões</h4>
        <p class="sugestao-subtitulo">${perfilUsado}</p>
    `; 
    receitas.forEach((receita, index) => {
        sugeridasContainer.innerHTML += renderReceitaCard(receita, true, index); 
    });
    
    sugeridasContainer.querySelectorAll('.btn-save-sugestao').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.dataset.id;
            handleSaveSuggestion(cacheReceitasSugeridas[index]);
        });
    });
}

// --- Helper de Card (para Lista e Sugestões) ---
function renderReceitaCard(receita, isSugestao, index = 0) {
    const macrosHtml = `
        <small>
            Cals: ${receita.macros.calorias} | 
            Prot: ${receita.macros.proteinas}g | 
            Carb: ${receita.macros.carboidratos}g | 
            Gord: ${receita.macros.gorduras}g
        </small>
    `;
    // [MODIFICADO] Lê a nova estrutura de ingredientes
    const ingredientesHtml = receita.ingredientes.map(ing => `<li>${ing.quantidade} ${ing.unidade} ${ing.nome}</li>`).join('');

    let actionButtons = '';
    if (isSugestao) {
        actionButtons = `
            <div class="action-buttons">
                <button class="btn btn-primary btn-save-sugestao" data-id="${index}">
                    <i class="fas fa-plus"></i> Salvar nos Meus
                </button>
            </div>
        `;
    } else {
        actionButtons = `
            <div class="action-buttons">
                <button class="btn btn-secondary btn-edit-receita" data-id="${receita._id}">Editar</button>
                <button class="btn btn-danger btn-delete-receita" data-id="${receita._id}">Excluir</button>
            </div>
        `;
    }
    
    const cardClass = isSugestao ? 'receita-card sugestao-card' : 'receita-card';

    return `
        <div class="${cardClass}">
            <h4>${receita.nome}</h4>
            <p class="receita-descricao">${receita.descricao || 'Descrição não fornecida.'}</p>
            <div class="receita-macros">${macrosHtml}</div>
            
            <details class="receita-details">
                <summary>Ver Ingredientes e Preparo</summary>
                <strong>Ingredientes:</strong>
                <ul>${ingredientesHtml}</ul>
                <strong style="margin-top: 10px; display: block;">Modo de Preparo:</strong>
                <p>${receita.modoPreparo || 'Modo de Preparo não fornecido.'}</p>
            </details>
            
            ${actionButtons}
        </div>
    `;
}

// --- Lógica de Salvar Sugestão (Gemini -> Meus) ---
async function handleSaveSuggestion(receitaData) {
    const token = localStorage.getItem('jwtToken');
    try {
        const response = await fetch(`${API_URL}/receitas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(receitaData) 
        });
        if (!response.ok) {
            if(response.status === 400) {
                alert('Erro ao salvar: Verifique se uma receita com este nome já existe.');
            }
            throw new Error('Falha ao salvar a receita.');
        }
        alert(`A receita "${receitaData.nome}" foi salva em "Minhas Receitas"!`);
        loadAndRenderList(); 
    } catch (error) {
        console.error('Erro ao salvar sugestão:', error);
        alert('Erro ao salvar a sugestão.');
    }
}

// --- RENDERIZAÇÃO DO FORMULÁRIO (Criar/Editar) ---
function showCreateForm() {
    currentEditId = null;
    currentIngredientes = []; 
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
        currentIngredientes = receita.ingredientes; 
        renderForm('Editar Receita', receita, true); 
    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível carregar a receita para edição.');
    }
}

// [MODIFICADO] Adiciona o botão "Calcular Macros (Edamam)"
function renderForm(title, data = {}, show = false) {
    listContainer.style.display = show ? 'none' : 'block';
    showCreateFormBtn.style.display = show ? 'none' : 'block';
    formContainer.style.display = show ? 'block' : 'none';
    sugerirReceitasBtn.style.display = show ? 'none' : 'block';
    sugeridasContainer.style.display = 'none'; 
    
    const macros = data.macros || {};

    formContainer.innerHTML = `
        <form id="receita-form" class="receita-form">
            <h4>${title}</h4>
            
            <label class="input-label">Nome da Receita:</label>
            <input type="text" id="receita-nome" class="input-field" placeholder="Ex: Panqueca de Aveia" value="${data.nome || ''}" required>
            
            <label class="input-label">Descrição Curta (Opcional):</label>
            <input type="text" id="receita-descricao" class="input-field" placeholder="Ex: Rápida, proteica e saborosa" value="${data.descricao || ''}">
            
            <label class="input-label">Modo de Preparo (Opcional):</label>
            <textarea id="receita-preparo" class="input-field" placeholder="1. Misture os ovos...">${data.modoPreparo || ''}</textarea>
            
            <hr class="form-divider">
            <label class="input-label">Ingredientes:</label>
            
            <div class="ingrediente-item-grid">
                <input type="number" id="ing-qtd" class="input-field" placeholder="Qtd" step="0.1">
                <select id="ing-unidade" class="input-field">
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="unidade(s)">unidade(s)</option>
                    <option value="xícara(s)">xícara(s)</option>
                    <option value="colher(es) de sopa">colher(es) de sopa</option>
                </select>
                <input type="text" id="ing-nome" class="input-field" placeholder="Nome do Ingrediente (Ex: Peito de frango)">
                <button type="button" id="btn-add-ingrediente" class="btn btn-secondary">+</button>
            </div>
            
            <div id="ingredientes-list-form" class="exercicios-list-form">
                </div>
            
            <hr class="form-divider">
            <label class="input-label">Macros Estimados:</label>
            <button type="button" id="btn-calcular-macros" class="btn btn-secondary" style="margin-bottom: 10px;">
                <i class="fas fa-calculator"></i> Calcular Macros (IA)
            </button>
            <div class="macros-grid">
                <input type="number" step="0.1" id="macro-calorias" class="input-field" placeholder="Calorias" value="${macros.calorias || ''}" required>
                <input type="number" step="0.1" id="macro-proteinas" class="input-field" placeholder="Proteínas (g)" value="${macros.proteinas || ''}" required>
                <input type="number" step="0.1" id="macro-carboidratos" class="input-field" placeholder="Carboidratos (g)" value="${macros.carboidratos || ''}" required>
                <input type="number" step="0.1" id="macro-gorduras" class="input-field" placeholder="Gorduras (g)" value="${macros.gorduras || ''}" required>
            </div>
            
            <hr class="form-divider">
            <button type="submit" class="btn btn-primary">Salvar Receita</button>
            <button type="button" id="btn-cancelar-receita" class="btn btn-secondary" style="margin-left: 10px; width: auto; display: inline-block;">Cancelar</button>
        </form>
    `;

    renderIngredientesFormList(); 

    document.getElementById('btn-calcular-macros').addEventListener('click', handleCalcularMacros);
    document.getElementById('btn-add-ingrediente').addEventListener('click', handleAddIngrediente);
    document.getElementById('receita-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('btn-cancelar-receita').addEventListener('click', loadReceitas);
}

// [MODIFICADO] Renderiza a lista com a nova estrutura de 3 colunas
function renderIngredientesFormList() {
    const listEl = document.getElementById('ingredientes-list-form');
    if (!listEl) return;
    
    if (currentIngredientes.length === 0) {
        listEl.innerHTML = '<p>Nenhum ingrediente adicionado.</p>';
        return;
    }
    listEl.innerHTML = `<ul>${currentIngredientes.map((ing, index) => `
        <li>
            <span><strong>${ing.quantidade} ${ing.unidade}</strong> - ${ing.nome}</span>
            <button type="button" class="btn btn-danger btn-remove-ex" data-index="${index}">&times;</button>
        </li>
    `).join('')}</ul>`;

    listEl.querySelectorAll('.btn-remove-ex').forEach(btn => {
        btn.addEventListener('click', (e) => handleRemoveIngrediente(e.target.dataset.index));
    });
}

// --- HANDLERS (Ações) ---

// [MODIFICADO] Coleta os 3 campos
function handleAddIngrediente() {
    const nome = document.getElementById('ing-nome').value;
    const quantidade = parseFloat(document.getElementById('ing-qtd').value);
    const unidade = document.getElementById('ing-unidade').value;

    if (!nome || !quantidade || !unidade) {
        alert('Preencha a Quantidade, a Unidade e o Nome do ingrediente.');
        return;
    }
    if (quantidade <= 0) {
        alert('A quantidade deve ser um número positivo.');
        return;
    }

    currentIngredientes.push({ nome, quantidade, unidade });
    
    document.getElementById('ing-nome').value = '';
    document.getElementById('ing-qtd').value = '';
    
    renderIngredientesFormList();
}

function handleRemoveIngrediente(index) {
    currentIngredientes.splice(index, 1); 
    renderIngredientesFormList();
}

// [MODIFICADO] Envia os 3 campos para o Edamam
async function handleCalcularMacros() {
    if (currentIngredientes.length === 0) {
        alert('Adicione pelo menos um ingrediente para calcular os macros.');
        return;
    }
    
    // [MODIFICADO] Envia o array de OBJETOS, não a string
    const btn = document.getElementById('btn-calcular-macros');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculando...';

    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`${API_URL}/receitas/calcular-macros`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ ingredientes: currentIngredientes }) // Envia o array de objetos
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Falha ao calcular macros.');
        }
        
        const macros = await response.json();
        
        document.getElementById('macro-calorias').value = macros.calorias;
        document.getElementById('macro-proteinas').value = macros.proteinas;
        document.getElementById('macro-carboidratos').value = macros.carboidratos;
        document.getElementById('macro-gorduras').value = macros.gorduras;

    } catch (error) {
        console.error('Erro ao calcular macros:', error);
        alert(error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-calculator"></i> Calcular Macros (IA)';
    }
}


async function handleFormSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('jwtToken');
    const data = {
        nome: document.getElementById('receita-nome').value,
        descricao: document.getElementById('receita-descricao').value || null,
        modoPreparo: document.getElementById('receita-preparo').value || null,
        macros: {
            calorias: parseFloat(document.getElementById('macro-calorias').value) || 0,
            proteinas: parseFloat(document.getElementById('macro-proteinas').value) || 0,
            carboidratos: parseFloat(document.getElementById('macro-carboidratos').value) || 0,
            gorduras: parseFloat(document.getElementById('macro-gorduras').value) || 0,
        },
        ingredientes: currentIngredientes // [MODIFICADO] Envia o array de objetos
    };

    if (!data.nome || currentIngredientes.length === 0) {
        alert('Nome e ao menos um Ingrediente são obrigatórios.'); 
        return;
    }
    const m = data.macros;
    if (m.calorias < 0 || m.proteinas < 0 || m.carboidratos < 0 || m.gorduras < 0) {
        alert('Valores nutricionais não podem ser negativos.');
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
        loadReceitas(); 
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar. Verifique o console.');
    }
}

async function handleDeleteClick(id) {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) {
        return; 
    }
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`${API_URL}/receitas/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Falha ao excluir.');
        alert('Receita excluída com sucesso.');
        loadReceitas(); 
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Não foi possível excluir a receita.');
    }
}