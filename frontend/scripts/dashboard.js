import { API_URL, handleLogout } from './auth.js'; 

// --- ELEMENTOS DA DOM ---
const userInfoElement = document.getElementById('user-info');
const chatRespostaElement = document.getElementById('chat-resposta');

// Containers para Perfil e Metas
const perfilFormContainer = document.getElementById('perfil-form-container');
const metasFormContainer = document.getElementById('metas-form-container');

// --- FUNÇÃO 1: CARREGAR DADOS (GET /api/usuarios/perfil) ---
export async function loadDashboardData(token) {
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/usuarios/perfil`, {
            method: 'GET',
            headers: { 'x-auth-token': token }
        });
        
        const perfil = await response.json();
        
        if (response.ok) {
            // Renderiza as informações estáticas (nome e email no topo)
            userInfoElement.innerHTML = `
                <p><strong>Usuário:</strong> ${perfil.nome}</p>
                <p><strong>Email:</strong> ${perfil.email}</p>
            `;
            // Linha do 'dashboardTitle.textContent' foi REMOVIDA
            
            return perfil; 
        } else {
             return null; 
        }
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        return null;
    }
}

// --- FUNÇÃO 2: RENDERIZAR FORMULÁRIOS DE CRUD (Lógica Unificada no Perfil) ---
export function renderCrudForms(profile) {
    
    // 1. Container "Metas" (placeholder)
    if (metasFormContainer) {
        metasFormContainer.innerHTML = `
            <p class="info-message">Em breve, você poderá definir e acompanhar novas metas detalhadas aqui.</p>
        `;
    }

    // 2. Renderiza TUDO (Formulário completo de edição + Exclusão velada) em "Perfil"
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

        // Adiciona o Event Listener para o formulário de ATUALIZAÇÃO
        document.getElementById('update-perfil-form').addEventListener('submit', (e) => {
            handleUpdateProfile(e, profile); 
        });

        // Adiciona o Event Listener para o botão DELETAR (agora dentro do <details>)
        document.getElementById('delete-account-btn').addEventListener('click', () => {
            handleDeleteProfile();
        });
    }
}

// --- FUNÇÃO 3: LÓGICA DE ATUALIZAÇÃO (PUT /api/usuarios/perfil) ---
async function handleUpdateProfile(e, currentProfile) {
    e.preventDefault();
    const token = localStorage.getItem('jwtToken');
    
    // Coleta todos os dados do formulário
    const updateBody = {
        nome: document.getElementById('update-nome').value,
        email: document.getElementById('update-email').value,
        dados_biometricos: {
            ...currentProfile.dados_biometricos, // Mantém dados antigos
            altura_cm: parseFloat(document.getElementById('update-altura').value),
            peso_atual_kg: parseFloat(document.getElementById('update-peso').value),
            idade: parseInt(document.getElementById('update-idade').value),
            sexo: document.getElementById('update-sexo').value
        },
        objetivos: {
            ...currentProfile.objetivos, // Mantém metas antigas
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
            // Recarrega os dados do perfil
            const updatedProfile = await response.json();
            
            // Atualiza o info-block superior
            userInfoElement.innerHTML = `
                <p><strong>Usuário:</strong> ${updatedProfile.usuario.nome}</p>
                <p><strong>Email:</strong> ${updatedProfile.usuario.email}</p>
            `;
            // Re-renderiza os formulários com os dados atualizados
            renderCrudForms(updatedProfile.usuario);

        } else {
            alert('Falha ao atualizar perfil. Verifique o console.');
        }
    } catch (error) {
        console.error('Erro de rede ao atualizar perfil:', error);
    }
}

// --- FUNÇÃO 4: LÓGICA DE EXCLUSÃO (DELETE /api/usuarios/perfil) ---
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
            handleLogout(); // Desloga o usuário
            window.location.reload(); // Recarrega a página (vai para o login)
        } else {
            alert('Falha ao excluir a conta.');
        }
    } catch (error) {
        console.error('Erro de rede ao excluir conta:', error);
    }
}


// --- FUNÇÃO 5: CHATBOT IA (Mantida) ---
export async function handleChatSubmit(pergunta) {
    chatRespostaElement.textContent = `Aguardando resposta da IA...`;
    
    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pergunta })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            chatRespostaElement.textContent = `IA: ${data.resposta}`;
        } else {
            chatRespostaElement.textContent = 'Erro ao conectar com o assistente de IA.';
        }
    } catch (error) {
        chatRespostaElement.textContent = 'Erro de rede ao enviar pergunta.';
        console.error('Erro no chat:', error);
    }
}