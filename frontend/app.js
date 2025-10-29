// A URL base da sua API hospedada no Render
const API_URL = 'https://fitos-backend-o8up.onrender.com/api';

// Elementos da DOM (Document Object Model)
const registerForm = document.getElementById('register-form');
const messageElement = document.getElementById('message');

// Variáveis essenciais para a sessão do usuário
let userToken = null;

// --- 1. FUNÇÃO PRINCIPAL DE CADASTRO ---
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede o recarregamento da página

    // Captura os valores do formulário
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-senha').value;
    const altura_cm = parseFloat(document.getElementById('reg-altura').value);
    const peso_atual_kg = parseFloat(document.getElementById('reg-peso').value);
    const sexo = document.getElementById('reg-sexo').value;
    const objetivoPrincipal = document.getElementById('reg-objetivo').value;

    // Constrói o JSON com a estrutura exata que o seu Back-end espera
    const userData = {
        nome,
        email,
        senha,
        dados_biometricos: {
            altura_cm,
            peso_atual_kg,
            idade: 25, // Idade estática por simplicidade no frontend
            sexo
        },
        objetivos: {
            principal: objetivoPrincipal,
            meta_peso_kg: peso_atual_kg * 0.95, // Exemplo de meta de 5% de perda
            meta_agua_litros: 3.0 
        }
    };

    try {
        messageElement.textContent = 'Cadastrando...';

        // Faz a requisição POST para a sua API no Render
        const response = await fetch(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.status === 201) {
            // Sucesso no Cadastro
            messageElement.textContent = data.mensagem + ' Faça login agora.';
            messageElement.className = 'success';
            showLogin(); // Alterna de volta para a tela de login
        } else {
            // Erro do Servidor (400 Bad Request, Email Duplicado, Validação, etc.)
            messageElement.textContent = data.mensagem || 'Erro desconhecido no cadastro.';
            messageElement.className = 'error';
        }

    } catch (error) {
        // Erro de rede (servidor offline, problema de CORS)
        messageElement.textContent = 'Erro de rede. Verifique se o servidor está ativo.';
        messageElement.className = 'error';
        console.error('Erro de rede:', error);
    }
});


// --- 2. FUNÇÃO BASE DE LOGIN (Será preenchida no próximo passo) ---
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    messageElement.textContent = 'Aguarde o login...';
    // Lógica de login e armazenamento do token virá aqui
    
    // Sucesso temporário para teste
    // showDashboard(); 
    // messageElement.textContent = '';
});


// --- 3. FUNÇÃO BASE DE LOGOUT ---
function logout() {
    userToken = null; // Limpa o token
    showLogin(); // Volta para a tela de login
    localStorage.removeItem('jwtToken'); // Boa prática de segurança
}


// Funções de Alternância (copiadas do HTML, para garantir que funcionem se o HTML for movido)
function showRegister() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'block';
    messageElement.textContent = '';
}
function showLogin() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('register-section').style.display = 'none';
    messageElement.textContent = '';
}
function showDashboard() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-dashboard').style.display = 'block';
}   