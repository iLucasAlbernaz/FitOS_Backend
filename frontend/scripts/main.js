import { handleRegister, handleLogin, handleLogout } from './auth.js';
import { loadDashboardData, handleChatSubmit, renderCrudForms } from './dashboard.js';

// --- FUNÇÕES DE ALTERNÂNCIA DE TELA ---
const dashboardElement = document.getElementById('app-dashboard');
const authContainer = document.getElementById('auth-container');

function showDashboard() {
    authContainer.style.display = 'none';
    dashboardElement.style.display = 'block';
}

function showLogin() { 
    authContainer.style.display = 'block';
    dashboardElement.style.display = 'none';
    
    // Garante que a seção de login esteja visível
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('register-section').style.display = 'none';
}

function logout() {
    handleLogout(); // Limpa o localStorage
    showLogin();
}
// Torna a função acessível pelo onclick do botão Sair no HTML
window.logout = logout; 


// --- LÓGICA DO MODAL DE SUCESSO (NOVIDADE) ---
function openModal(message) {
    document.getElementById('modal-message').textContent = message;
    document.getElementById('success-modal').style.display = 'block';
    
    // Configura o redirecionamento após 2 segundos (tempo para o usuário ler)
    setTimeout(() => {
        closeModal();
        showLogin(); // Redireciona para o login
    }, 2000); 
}

function closeModal() {
    document.getElementById('success-modal').style.display = 'none';
}
// Torna a função acessível pelo onclick do botão fechar no HTML
window.closeModal = closeModal; 


// --- INICIALIZAÇÃO E EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. EVENTO DE CADASTRO (Implementação do Modal) ---
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Coleta de Dados do Formulário (garantindo o cálculo automático das metas)
        const userData = {
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
        
        // AÇÃO: Se for sucesso, abre o modal
        if (result.success) {
            openModal('Sua conta foi criada com sucesso! Redirecionando para o login...'); 
        }
        // Em caso de erro, a mensagem é exibida diretamente na tela de cadastro (pelo auth.js)
    });

    // --- 2. EVENTO DE LOGIN ---
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const senha = document.getElementById('login-senha').value;

        const result = await handleLogin({ email, senha });
        
        if (result.success) {
            showDashboard();
            loadDashboardData(result.token).then(profile => {
                 // Chama a função para renderizar os formulários de CRUD após o login
                 if (profile) renderCrudForms(profile);
            }); 
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
             if (profile) renderCrudForms(profile);
        });
    } else {
        showLogin();
    }
});