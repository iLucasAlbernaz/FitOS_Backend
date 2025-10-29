import { API_URL } from './auth.js';

const userInfoElement = document.getElementById('user-info');
const dashboardTitle = document.querySelector('.dashboard-title');
const chatRespostaElement = document.getElementById('chat-resposta');

// --- CARREGAR DADOS PROTEGIDOS (GET /api/usuarios/perfil) ---
export async function loadDashboardData(token) {
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/usuarios/perfil`, {
            method: 'GET',
            headers: {
                'x-auth-token': token // Chave de segurança!
            }
        });
        
        const perfil = await response.json();
        
        if (response.ok) {
            // Renderiza as informações do usuário
            userInfoElement.innerHTML = `
                <p><strong>Usuário:</strong> ${perfil.nome}</p>
                <p><strong>Objetivo:</strong> ${perfil.objetivos.principal}</p>
                <p><strong>Peso Atual:</strong> ${perfil.dados_biometricos.peso_atual_kg} kg</p>
                <p><strong>Meta de Água:</strong> ${perfil.objetivos.meta_agua_litros} L</p>
            `;
            dashboardTitle.textContent = `Bem-vindo(a), ${perfil.nome.split(' ')[0]}!`;
            return perfil;

        } else {
             // Retorna nulo se o token expirou (a função main irá deslogar)
             return null;
        }

    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        return null;
    }
}

// --- CHATBOT IA (POST /api/chat) ---
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

// --- FUNÇÃO BASE PARA TELAS DE CRUD (Para ser implementado depois) ---
export function renderCrudForms(userProfile) {
    // Esta função será o próximo passo para criar o CRUD de Diário, Receitas e Metas
    document.getElementById('perfil-form-container').innerHTML = `
        <h4 style="color: var(--primary-color);">Perfil Carregado com Sucesso!</h4>
        <p>Você pode implementar os formulários de PUT e DELETE aqui.</p>
`;
    
    // Adicione os formulários de Diário e Receitas aqui
}