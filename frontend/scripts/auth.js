// Define a URL base da API
export const API_URL = 'https://fitos-backend-o8up.onrender.com/api';

// Elementos essenciais para feedback
const messageElement = document.getElementById('message');

// Função utilitária para exibir mensagens
export function displayMessage(message, type) {
    messageElement.textContent = message;
    messageElement.className = `message ${type}-message`;
}

// --- LÓGICA DE CADASTRO (POST /api/usuarios) ---
export async function handleRegister(userData) {
    try {
        displayMessage('Cadastrando...', 'default');

        const response = await fetch(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        // 1. CORREÇÃO CRÍTICA: Verifica explicitamente o Status 201 (Created)
        if (response.status === 201) { 
            displayMessage(data.mensagem + ' Faça login agora.', 'success');
            return { success: true };
        } else {
            // Trata erros como 400 Bad Request (Validação, Email Duplicado)
            displayMessage(data.mensagem || 'Erro desconhecido no cadastro.', 'error');
            return { success: false };
        }

    } catch (error) {
        // Erro de rede (servidor offline)
        displayMessage('Erro de rede. Verifique se o servidor está ativo.', 'error');
        console.error('Erro de rede:', error);
        return { success: false };
    }
}

// --- LÓGICA DE LOGIN (POST /api/auth/login) ---
export async function handleLogin(loginData) {
    try {
        displayMessage('Verificando credenciais...', 'default');

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();
        
        if (response.ok) { // Status 200 OK
            // Salva o Token JWT e retorna sucesso
            localStorage.setItem('jwtToken', data.token);
            return { success: true, token: data.token, user: data.usuario };
        } else {
            displayMessage(data.mensagem || 'Login falhou. Verifique email e senha.', 'error');
            return { success: false };
        }

    } catch (error) {
        displayMessage('Erro de conexão com a API.', 'error');
        console.error('Erro de rede durante o login:', error);
        return { success: false };
    }
}

// --- LÓGICA DE LOGOUT ---
export function handleLogout() {
    localStorage.removeItem('jwtToken');
}