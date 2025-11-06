// Define a URL base da API
export const API_URL = 'https://fitos-backend-o8up.onrender.com/api';

const messageElement = document.getElementById('message');

export function displayMessage(message, type) {
    messageElement.textContent = message;
    messageElement.className = `message ${type}-message`;
}

export async function handleRegister(userData) {
    try {
        displayMessage('Cadastrando...', 'default');

        const response = await fetch(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.status === 201) { 
            displayMessage(data.mensagem + ' Faça login agora.', 'success');
            return { success: true };
        } else {
            displayMessage(data.mensagem || 'Erro desconhecido no cadastro.', 'error');
            return { success: false };
        }

    } catch (error) {
        displayMessage('Erro de rede. Verifique se o servidor está ativo.', 'error');
        console.error('Erro de rede:', error);
        return { success: false };
    }
}

export async function handleLogin(loginData) {
    try {
        displayMessage('Verificando credenciais...', 'default');

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();
        
        if (response.ok) { 

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

export function handleLogout() {
    localStorage.removeItem('jwtToken');
}