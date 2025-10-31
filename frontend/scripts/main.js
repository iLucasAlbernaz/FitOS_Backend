import { handleRegister, handleLogin, handleLogout, displayMessage } from './auth.js';
// [ATUALIZADO] Importa as novas funções do dashboard
import { loadDashboardData, handleChatSubmit, renderCrudForms, setupChatListeners, loadChatHistory } from './dashboard.js'; 
import { loadDietPlan } from './dieta.js';
import { loadTreinos } from './treino.js';
import { loadDiario } from './diario.js';
import { loadMetas } from './meta.js';

// --- ELEMENTOS DA DOM ---
const dashboardElement = document.getElementById('app-dashboard');
const authContainer = document.getElementById('auth-container');
const loginSection = document.getElementById('login-section'); 
const registerSection = document.getElementById('register-section');
const authGrid = document.querySelector('.auth-grid'); 
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

// --- LÓGICA DO MODAL (Cadastro) ---
function openModal(message) {
    const modalMessage = document.getElementById('modal-message');
    const modalTitle = document.querySelector('#success-modal .modal-title');
    const successModal = document.getElementById('success-modal');
    if (modalMessage && successModal && modalTitle) {
        // Reseta o modal para o padrão de cadastro
        modalTitle.textContent = 'Ação Concluída!';
        modalMessage.textContent = message;
        successModal.style.display = 'block';

        setTimeout(() => {
            closeModal();
            showLogin(); // Volta para o login após cadastro
        }, 4000);
    }
}

// --- FUNÇÃO DE NOTIFICAÇÃO DE BOAS-VINDAS ---
function showWelcomeNotification(userName) {
    const modalTitle = document.querySelector('#success-modal .modal-title');
    const modalMessage = document.getElementById('modal-message');
    const successModal = document.getElementById('success-modal');
    
    if (modalTitle && modalMessage && successModal) {
        // Personaliza o modal para a notificação
        modalTitle.textContent = `Olá, ${userName.split(' ')[0]}!`;
        modalMessage.textContent = 'Que bom te ver por aqui. Bom treino!';
        successModal.style.display = 'block';

        // Fecha o modal automaticamente após 4 segundos
        setTimeout(() => {
            closeModal(); // Reusa a sua função global
        }, 4000); // 4 segundos
    }
}

// (Função original do seu main.js)
function closeModal() {
    const successModal = document.getElementById('success-modal');
    if (successModal) {
        successModal.style.display = 'none';
    }
}
window.closeModal = closeModal; // (Exportação original mantida)


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
                    // Chama a notificação de boas-vindas
                    showWelcomeNotification(profile.nome); 
                    
                    renderCrudForms(profile);
                    // Mostra a seção de perfil por padrão
                    // (A função global showDashboardSection é definida no index.html)
                    if (window.showDashboardSection) {
                        window.showDashboardSection('perfil');
                    }
                }
            });
        }
    });

    // --- 3. EVENTO DE CHATBOT (Formulário) ---
    document.getElementById('chat-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const perguntaInput = document.getElementById('chat-pergunta');
        const pergunta = perguntaInput.value;
        if (pergunta) {
            handleChatSubmit(pergunta);
            perguntaInput.value = ''; // Limpa o campo após o envio
        }
    });

    // --- [NOVO] Adiciona os listeners dos botões rápidos do chat ---
    setupChatListeners(); 

    // --- 4. VERIFICAR SESSÃO AO CARREGAR ---
    const storedToken = localStorage.getItem('jwtToken');
    if (storedToken) {
        showDashboard();
        loadDashboardData(storedToken).then(profile => {
            if (profile) {
                renderCrudForms(profile);
                // Mostra o perfil por padrão ao recarregar a página
                if (window.showDashboardSection) {
                    window.showDashboardSection('perfil');
                }
            }
        });
    } else {
        showLogin(); // Começa na tela de login se não houver token
    }
});

// --- FUNÇÕES GLOBAIS PARA NAVEGAÇÃO DO DASHBOARD ---
// (Exporta as funções para o script do index.html)

window.loadDietPlan = loadDietPlan;
window.loadTreinos = loadTreinos;
window.loadDiario = loadDiario;
window.loadChatHistory = loadChatHistory; // <-- [ADICIONADO]
window.loadMetas = loadMetas;