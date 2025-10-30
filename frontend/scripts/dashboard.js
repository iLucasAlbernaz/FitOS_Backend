import { API_URL, handleLogout } from './auth.js'; 

// --- ELEMENTOS DA DOM ---
const userInfoElement = document.getElementById('user-info');
// [MODIFICADO] O elemento de resposta do chat agora é o container do histórico
const chatHistoryContainer = document.getElementById('chat-history-container'); 

// Containers para Perfil e Metas
const perfilFormContainer = document.getElementById('perfil-form-container');
const metasFormContainer = document.getElementById('metas-form-container');

// --- [NOVO] Helper para rolar o chat para o final ---
function scrollToChatBottom() {
    if (chatHistoryContainer) {
        chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
    }
}

// --- [NOVO] Helper para adicionar uma mensagem ao histórico ---
function appendChatMessage(role, content, isError = false) {
    if (!chatHistoryContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message');
    
    if (role === 'user') {
        messageDiv.classList.add('user-message');
    } else {
        messageDiv.classList.add('model-message');
        if (isError) {
            messageDiv.classList.add('error-message');
        }
    }
    
    messageDiv.textContent = content;
    chatHistoryContainer.appendChild(messageDiv);
    scrollToChatBottom();
}

// --- [NOVO] FUNÇÃO PARA CARREGAR O HISTÓRICO DE CHAT ---
export async function loadChatHistory() {
    if (!chatHistoryContainer) return;

    // Reseta o isLoaded para recarregar o chat toda vez que a aba é aberta
    chatHistoryContainer.innerHTML = '<p class="info-message">Carregando histórico...</p>';
    const token = localStorage.getItem('jwtToken');

    try {
        const response = await fetch(`${API_URL}/chat/historico`, {
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) throw new Error('Falha ao buscar histórico');
        
        const historico = await response.json();

        chatHistoryContainer.innerHTML = ''; // Limpa o "Carregando"
        
        if (historico.length === 0) {
            // Mensagem inicial
            appendChatMessage('model', 'Olá! Como posso te ajudar hoje sobre nutrição ou treino?');
        } else {
            historico.forEach(msg => {
                appendChatMessage(msg.role, msg.content);
            });
        }
        scrollToChatBottom();

    } catch (error) {
        console.error('Erro ao carregar histórico de chat:', error);
        chatHistoryContainer.innerHTML = ''; // Limpa
        appendChatMessage('model', 'Não foi possível carregar o histórico de chat.', true);
    }
}


// --- FUNÇÃO 1: CARREGAR DADOS (Perfil) ---
export async function loadDashboardData(token) {
    if (!token) return null;
    try {
        const response = await fetch(`${API_URL}/usuarios/perfil`, {
            method: 'GET',
            headers: { 'x-auth-token': token }
        });
        const perfil = await response.json();
        if (response.ok) {
            userInfoElement.innerHTML = `
                <p><strong>Usuário:</strong> ${perfil.nome}</p>
                <p><strong>Email:</strong> ${perfil.email}</p>
            `;
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
// (Não muda)
export function renderCrudForms(profile) {
    if (metasFormContainer) {
        metasFormContainer.innerHTML = `
            <p class="info-message">Em breve, você poderá definir e acompanhar novas metas detalhadas aqui.</p>
        `;
    }
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
            </form>
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
        document.getElementById('update-perfil-form').addEventListener('submit', (e) => {
            handleUpdateProfile(e, profile); 
        });
        document.getElementById('delete-account-btn').addEventListener('click', () => {
            handleDeleteProfile();
        });
    }
}

// --- FUNÇÃO 3: LÓGICA DE ATUALIZAÇÃO (Perfil) ---
// (Não muda)
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
            userInfoElement.innerHTML = `
                <p><strong>Usuário:</strong> ${updatedProfile.usuario.nome}</p>
                <p><strong>Email:</strong> ${updatedProfile.usuario.email}</p>
            `;
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


// --- FUNÇÃO 5: CHATBOT IA (MODIFICADA) ---
// (Agora APENAS envia a msg e renderiza a resposta)
export async function handleChatSubmit(pergunta) {
    const perguntaInput = document.getElementById('chat-pergunta');
    perguntaInput.value = pergunta; 
    
    // 1. Renderiza a pergunta do usuário no chat
    appendChatMessage('user', pergunta);
    
    // 2. Mostra "Pensando..." (opcional)
    // appendChatMessage('model', 'Pensando...'); 
    
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
            // 3. Renderiza a resposta da IA
            appendChatMessage('model', data.resposta);
        } else {
            // 3b. Renderiza a mensagem de erro
            if (response.status === 503 || response.status === 400) { 
                appendChatMessage('model', data.mensagem, true); // (FE3.1 / FE3.2)
            }
            else {
                throw new Error('Erro genérico da API');
            }
        }
    } catch (error) {
        // 3c. Renderiza a mensagem de erro de rede
        appendChatMessage('model', 'O chatbot está temporariamente fora do ar. Tente novamente mais tarde.', true);
        console.error('Erro no chat:', error);
    }
}

// --- FUNÇÃO 6: Adiciona listeners para os botões rápidos (FA1) ---
// Esta função é chamada pelo main.js
export function setupChatListeners() {
    document.querySelectorAll('.quick-reply-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const pergunta = e.target.dataset.pergunta;
            handleChatSubmit(pergunta);
        });
    });
}