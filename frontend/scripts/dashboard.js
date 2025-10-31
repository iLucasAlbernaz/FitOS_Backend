import { API_URL, handleLogout } from './auth.js'; 

// --- ELEMENTOS DA DOM ---
// const userInfoElement = document.getElementById('user-info'); // [REMOVIDO]
const chatHistoryContainer = document.getElementById('chat-history-container'); 
const perfilFormContainer = document.getElementById('perfil-form-container');
const metasFormContainer = document.getElementById('metas-form-container');

// --- (Helpers do Chat e loadChatHistory não mudam) ---
function scrollToChatBottom() {
    if (chatHistoryContainer) {
        chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
    }
}
function appendChatMessage(role, content, isError = false) {
    if (!chatHistoryContainer) return;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message');
    if (role === 'user') {
        messageDiv.classList.add('user-message');
    } else {
        messageDiv.classList.add('model-message');
        if (isError) messageDiv.classList.add('error-message');
    }
    messageDiv.textContent = content;
    chatHistoryContainer.appendChild(messageDiv);
    scrollToChatBottom();
}
export async function loadChatHistory() {
    if (!chatHistoryContainer) return;
    chatHistoryContainer.innerHTML = '<p class="info-message">Carregando histórico...</p>';
    const token = localStorage.getItem('jwtToken');
    try {
        const response = await fetch(`${API_URL}/chat/historico`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Falha ao buscar histórico');
        const historico = await response.json();
        chatHistoryContainer.innerHTML = ''; 
        if (historico.length === 0) {
            appendChatMessage('model', 'Olá! Como posso te ajudar hoje sobre nutrição ou treino?');
        } else {
            historico.forEach(msg => {
                appendChatMessage(msg.role, msg.content);
            });
        }
        scrollToChatBottom();
    } catch (error) {
        console.error('Erro ao carregar histórico de chat:', error);
        chatHistoryContainer.innerHTML = ''; 
        appendChatMessage('model', 'Não foi possível carregar o histórico de chat.', true);
    }
}

// --- FUNÇÃO 1: CARREGAR DADOS (Perfil) ---
// [MODIFICADO] Agora preenche o dropdown do header
export async function loadDashboardData(token) {
    if (!token) return null;
    try {
        const response = await fetch(`${API_URL}/usuarios/perfil`, {
            method: 'GET',
            headers: { 'x-auth-token': token }
        });
        const perfil = await response.json();
        if (response.ok) {
            // [MODIFICADO] Remove a lógica do 'userInfoElement'
            // [ADICIONADO] Preenche o novo dropdown de perfil
            const dropName = document.getElementById('dropdown-user-name');
            const dropEmail = document.getElementById('dropdown-user-email');
            if(dropName) dropName.textContent = perfil.nome;
            if(dropEmail) dropEmail.textContent = perfil.email;
            
            return perfil; 
        } else {
             return null; 
        }
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        return null;
    }
}


// --- FUNÇÃO 2: RENDERIZAR FORMULÁRIOS DE CRUD (Perfil e Metas) ---
// [MODIFICADO] Remove a lógica do 'metasFormContainer'
export function renderCrudForms(profile) {
    
    // (O placeholder de Metas foi removido, pois meta.js já cuida disso)
    
    // Renderiza o MODO DE VISUALIZAÇÃO no Perfil
    if (perfilFormContainer) {
        perfilFormContainer.innerHTML = `
            <div class="profile-view">
                <div class="profile-view-group">
                    <label>Nome Completo:</label>
                    <p>${profile.nome}</p>
                </div>
                <div class="profile-view-group">
                    <label>Email:</label>
                    <p>${profile.email}</p>
                </div>
                <hr>
                <div class="profile-view-group">
                    <label>Altura:</label>
                    <p>${profile.dados_biometricos.altura_cm} m</p>
                </div>
                <div class="profile-view-group">
                    <label>Peso Atual:</label>
                    <p>${profile.dados_biometricos.peso_atual_kg} kg</p>
                </div>
                <div class="profile-view-group">
                    <label>Idade:</label>
                    <p>${profile.dados_biometricos.idade} anos</p>
                </div>
                <div class="profile-view-group">
                    <label>Gênero:</label>
                    <p>${profile.dados_biometricos.sexo === 'M' ? 'Masculino' : 'Feminino'}</p>
                </div>
                <hr>
                <div class="profile-view-group">
                    <label>Objetivo Principal:</label>
                    <p>${profile.objetivos.principal}</p>
                </div>
                
                <button id="btn-edit-profile" class="btn btn-primary" style="margin-top: 20px;">Editar Dados</button>
            </div>
        
            <hr style="margin: 2rem 0; border: 1px solid #eee;">
        
            <details class="danger-zone-details">
                <summary style="color: var(--danger-color); cursor: pointer; font-weight: bold;">
                    Zona de Perigo: Opções da Conta
                </summary>
                <div style="margin-top: 1rem; padding: 1rem; border: 1px solid var(--danger-color); border-radius: 8px;">
                    <h4 style="color: var(--danger-color); margin-top: 0;">Excluir Conta</h4>
                    <p>Esta ação é permanente e não pode ser desfeita.</p>
                    <button id="delete-account-btn" class="btn btn-danger">Excluir Minha Conta</button>
                </div>
            </details>
        `;

        // Adiciona o listener para o novo botão "Editar"
        document.getElementById('btn-edit-profile').addEventListener('click', () => {
            renderProfileForm(profile); // Chama a função que renderiza o formulário
        });
        
        // Adiciona o listener para o botão "Excluir"
        document.getElementById('delete-account-btn').addEventListener('click', () => {
            handleDeleteProfile();
        });
    }
}

// --- [NOVA FUNÇÃO] ---
// Renderiza o MODO DE EDIÇÃO (o formulário)
function renderProfileForm(profile) {
    if (perfilFormContainer) {
        perfilFormContainer.innerHTML = `
            <h4 style="color: var(--primary-color);">Meus Dados Cadastrais</h4>
            <form id="update-perfil-form">

                <label class="input-label">Nome Completo:</label>
                <input type="text" id="update-nome" class="input-field" value="${profile.nome}" required>

                <label class="input-label">Email:</label>
                <input type="email" id="update-email" class="input-field" value="${profile.email}" required>
                
                <hr style="margin: 1.5rem 0; border: 1px solid #eee;">

                <label class="input-label">Altura (m) - Ex: 1.75:</label>
                <input type="number" id="update-altura" class="input-field" value="${profile.dados_biometricos.altura_cm}" step="0.01" required>

                <label class="input-label">Peso Atual (kg):</label>
                <input type="number" id="update-peso" class="input-field" value="${profile.dados_biometricos.peso_atual_kg}" step="0.01" required>

                <label class="input-label">Idade:</label>
                <input type="number" id="update-idade" class="input-field" value="${profile.dados_biometricos.idade}" required>

                <label class="input-label">Gênero:</label>
                <select id="update-sexo" class="input-field" required>
                    <option value="M" ${profile.dados_biometricos.sexo === 'M' ? 'selected' : ''}>Masculino</option>
                    <option value="F" ${profile.dados_biometricos.sexo === 'F' ? 'selected' : ''}>Feminino</option>
                </select>

                <hr style="margin: 1.5rem 0; border: 1px solid #eee;">

                <label class="input-label">Meu Objetivo Principal:</label>
                <select id="update-objetivo" class="input-field" required>
                    <option value="Perda de Peso" ${profile.objetivos.principal === 'Perda de Peso' ? 'selected' : ''}>Perda de Peso</option>
                    <option value="Ganho de Massa" ${profile.objetivos.principal === 'Ganho de Massa' ? 'selected' : ''}>Ganho de Massa</option>
                    <option value="Manutenção" ${profile.objetivos.principal === 'Manutenção' ? 'selected' : ''}>Manutenção</option>
                </select>
                
                <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                <button type="button" id="btn-cancelar-edicao" class="btn btn-secondary" style="margin-top: 10px;">Cancelar</button>
            </form>
        `;

        document.getElementById('update-perfil-form').addEventListener('submit', (e) => {
            handleUpdateProfile(e, profile); 
        });

        document.getElementById('btn-cancelar-edicao').addEventListener('click', () => {
            renderCrudForms(profile); // Volta para o modo de visualização
        });
    }
}


// --- FUNÇÃO 3: LÓGICA DE ATUALIZAÇÃO (Perfil) ---
// [MODIFICADO] Ao salvar, preenche o dropdown do header
async function handleUpdateProfile(e, currentProfile) {
    e.preventDefault();
    const token = localStorage.getItem('jwtToken');
    const updateBody = {
        nome: document.getElementById('update-nome').value,
        email: document.getElementById('update-email').value,
        dados_biometricos: {
            ...currentProfile.dados_biometricos, 
            altura_cm: parseFloat(document.getElementById('update-altura').value),
            peso_atual_kg: parseFloat(document.getElementById('update-peso').value),
            idade: parseInt(document.getElementById('update-idade').value),
            sexo: document.getElementById('update-sexo').value
        },
        objetivos: {
            ...currentProfile.objetivos, 
            principal: document.getElementById('update-objetivo').value
        }
    };
    try {
        const response = await fetch(`${API_URL}/usuarios/perfil`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token 
            },
            body: JSON.stringify(updateBody)
        });
        if (response.ok) {
            alert('Perfil atualizado com sucesso!');
            const updatedProfile = await response.json();
            
            // [MODIFICADO] Atualiza o dropdown do header
            const dropName = document.getElementById('dropdown-user-name');
            const dropEmail = document.getElementById('dropdown-user-email');
            if(dropName) dropName.textContent = updatedProfile.usuario.nome;
            if(dropEmail) dropEmail.textContent = updatedProfile.usuario.email;
            
            renderCrudForms(updatedProfile.usuario);

        } else {
            alert('Falha ao atualizar perfil. Verifique o console.');
        }
    } catch (error) {
        console.error('Erro de rede ao atualizar perfil:', error);
    }
}

// --- FUNÇÃO 4: LÓGICA DE EXCLUSÃO (Perfil) ---
// (Não muda)
async function handleDeleteProfile() {
    if (!confirm("ATENÇÃO: Você tem certeza que deseja excluir sua conta? Esta ação é permanente.")) {
        return; 
    }
    const token = localStorage.getItem('jwtToken');
    try {
        const response = await fetch(`${API_URL}/usuarios/perfil`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.mensagem); 
            handleLogout(); 
            window.location.reload(); 
        } else {
            alert('Falha ao excluir a conta.');
        }
    } catch (error) {
        console.error('Erro de rede ao excluir conta:', error);
    }
}


// --- FUNÇÃO 5: CHATBOT IA (Não muda) ---
export async function handleChatSubmit(pergunta) {
    const perguntaInput = document.getElementById('chat-pergunta');
    perguntaInput.value = pergunta; 
    
    appendChatMessage('user', pergunta);
    
    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('jwtToken') 
            },
            body: JSON.stringify({ pergunta })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            appendChatMessage('model', data.resposta);
        } else {
            if (response.status === 503 || response.status === 400) { 
                appendChatMessage('model', data.mensagem, true); 
            }
            else {
                throw new Error('Erro genérico da API');
            }
        }
    } catch (error) {
        appendChatMessage('model', 'O chatbot está temporariamente fora do ar. Tente novamente mais tarde.', true);
        console.error('Erro no chat:', error);
    }
}

// --- FUNÇÃO 6: Listeners dos Botões Rápidos (Não muda) ---
export function setupChatListeners() {
    document.querySelectorAll('.quick-reply-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const pergunta = e.target.dataset.pergunta;
            handleChatSubmit(pergunta);
        });
    });
}