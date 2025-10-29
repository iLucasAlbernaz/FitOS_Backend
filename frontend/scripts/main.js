import { handleRegister, handleLogin, handleLogout } from './auth.js';
import { loadDashboardData, handleChatSubmit, renderCrudForms } from './dashboard.js';

// --- FUNÇÕES DE ALTERNÂNCIA DE TELA ---
const dashboardElement = document.getElementById('app-dashboard');
const authContainer = document.getElementById('auth-container');

function showDashboard() {
    authContainer.style.display = 'none';
    dashboardElement.style.display = 'block';
}

function showAuth() {
    authContainer.style.display = 'block';
    dashboardElement.style.display = 'none';
}

function logout() {
    handleLogout(); // Limpa o localStorage
    showAuth();
}
window.logout = logout; // Torna a função acessível pelo onclick do botão HTML

// --- INICIALIZAÇÃO E EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. EVENTO DE CADASTRO ---
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Coleta todos os dados do formulário...
        const userData = {
            // ... (coleta de dados igual à função anterior, apenas omitida por brevidade)
            nome: document.getElementById('reg-nome').value,
            email: document.getElementById('reg-email').value,
            senha: document.getElementById('reg-senha').value,
            dados_biometricos: {
                altura_cm: parseFloat(document.getElementById('reg-altura').value),
                peso_atual_kg: parseFloat(document.getElementById('reg-peso').value),
                idade: parseInt(document.getElementById('reg-idade').value),
                sexo: document.getElementById('reg-sexo').value
            },
            objetivos: {
                principal: document.getElementById('reg-objetivo').value,
                meta_peso_kg: parseFloat(document.getElementById('reg-peso').value) * 0.95, 
                meta_agua_litros: 3.0 
            }
        };

        const result = await handleRegister(userData);
        if (result.success) {
            // Lógica de sucesso está em auth.js
        }
    });

    // --- 2. EVENTO DE LOGIN ---
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const senha = document.getElementById('login-senha').value;

        const result = await handleLogin({ email, senha });
        
        if (result.success) {
            showDashboard();
            loadDashboardData(result.token); 
        }
    });

    // --- 3. EVENTO DE CHATBOT ---
    document.getElementById('chat-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const pergunta = document.getElementById('chat-pergunta').value;
        handleChatSubmit(pergunta);
    });


    // --- 4. VERIFICAR SESSÃO AO CARREGAR ---
    const storedToken = localStorage.getItem('jwtToken');
    if (storedToken) {
        showDashboard();
        loadDashboardData(storedToken).then(profile => {
             // Renderiza os formulários de CRUD após carregar o perfil
             if (profile) renderCrudForms(profile);
        });
    } else {
        showAuth();
    }
});