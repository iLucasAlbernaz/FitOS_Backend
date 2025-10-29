import { handleRegister, handleLogin, handleLogout, displayMessage } from './auth.js';
import { loadDashboardData, handleChatSubmit, renderCrudForms } from './dashboard.js';

// --- ELEMENTOS DA DOM ---
const dashboardElement = document.getElementById('app-dashboard');
const authContainer = document.getElementById('auth-container');
const loginSection = document.getElementById('login-section'); // Mantido para referência, mas o controle é via grid
const registerSection = document.getElementById('register-section');
const authGrid = document.querySelector('.auth-grid'); // Seleciona o grid
const messageElement = document.getElementById('message');

// --- FUNÇÕES DE ALTERNÂNCIA DE TELA ---
function showDashboard() {
    authContainer.style.display = 'none';
    dashboardElement.style.display = 'block';
}

// Mostra o Login (com grid e imagem)
function showLogin() {
    authContainer.style.display = 'block';
    dashboardElement.style.display = 'none';

    authGrid.style.display = 'grid'; // MOSTRA o grid
    registerSection.style.display = 'none'; // Esconde o cadastro

    if (messageElement) messageElement.textContent = '';
}
window.showLogin = showLogin;

// Mostra o Cadastro (e ESCONDE o grid de login)
function showRegister() {
    authContainer.style.display = 'block';
    dashboardElement.style.display = 'none';

    authGrid.style.display = 'none'; // ESCONDE o grid de login
    registerSection.style.display = 'block'; // Mostra o cadastro

    if (messageElement) messageElement.textContent = '';
}
window.showRegister = showRegister;


function logout() {
    handleLogout(); // Limpa o localStorage
    showLogin();
}
window.logout = logout;

// --- LÓGICA DO MODAL (Mantida) ---
function openModal(message) {
    const modalMessage = document.getElementById('modal-message');
    const successModal = document.getElementById('success-modal');
    if (modalMessage && successModal) {
        modalMessage.textContent = message;
        successModal.style.display = 'block';

        setTimeout(() => {
            closeModal();
            showLogin();
        }, 2000);
    }
}

function closeModal() {
    const successModal = document.getElementById('success-modal');
    if (successModal) {
        successModal.style.display = 'none';
    }
}
window.closeModal = closeModal;


// --- INICIALIZAÇÃO E EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. EVENTO DE CADASTRO ---
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();

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

        if (result.success) {
            openModal('Sua conta foi criada com sucesso! Redirecionando...');
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
            loadDashboardData(result.token).then(profile => {
                if (profile) {
                    renderCrudForms(profile);
                    // Após carregar, mostra a seção de perfil e chat por padrão
                    showDashboardSection('perfil');
                    const chatSection = document.getElementById('section-chat');
                    if (chatSection) chatSection.style.display = 'block';
                }
            });
        }
    });

    // --- 3. EVENTO DE CHATBOT ---
    document.getElementById('chat-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const perguntaInput = document.getElementById('chat-pergunta');
        const pergunta = perguntaInput.value;
        if (pergunta) {
            handleChatSubmit(pergunta);
            perguntaInput.value = ''; // Limpa o campo
        }
    });


    // --- 4. VERIFICAR SESSÃO AO CARREGAR ---
    const storedToken = localStorage.getItem('jwtToken');
    if (storedToken) {
        showDashboard();
        loadDashboardData(storedToken).then(profile => {
            if (profile) {
                renderCrudForms(profile);
                showDashboardSection('perfil');
                const chatSection = document.getElementById('section-chat');
                if (chatSection) chatSection.style.display = 'block';
            }
        });
    } else {
        showLogin(); // Começa na tela de login se não houver token
    }
});

// --- FUNÇÕES GLOBAIS PARA NAVEGAÇÃO DO DASHBOARD (Precisa estar fora do DOMContentLoaded) ---
function showDashboardSection(sectionId) {
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.style.display = 'none';
    });
    const targetSection = document.getElementById('section-' + sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
}
window.showDashboardSection = showDashboardSection; // Torna global