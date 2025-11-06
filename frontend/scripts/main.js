import { handleRegister, handleLogin, handleLogout, displayMessage } from './auth.js';
import { loadDashboardData, handleChatSubmit, renderCrudForms, setupChatListeners, loadChatHistory } from './dashboard.js'; 
import { loadDietPlan } from './dieta.js';
import { loadTreinos } from './treino.js';
import { loadDiario } from './diario.js';
import { loadMetas } from './meta.js';
import { loadReceitas } from './receita.js'; 
import { loadNotificacoes } from './notificacao.js';
import { loadPainel } from './painel.js';

// --- ELEMENTOS DA DOM ---
const dashboardElement = document.getElementById('app-dashboard');
const authContainer = document.getElementById('auth-container');
const loginSection = document.getElementById('login-section'); 
const registerSection = document.getElementById('register-section');
const authGrid = document.querySelector('.auth-grid'); 
const messageElement = document.getElementById('message');
const dashboardNav = document.getElementById('dashboard-nav');
const profileMenu = document.getElementById('profile-menu');

// --- FUNÇÕES DE ALTERNÂNCIA DE TELA ---
function showDashboard() {
    authContainer.style.display = 'none';
    dashboardElement.style.display = 'block';
    dashboardNav.style.display = 'grid'; // Mostra a nav
    profileMenu.style.display = 'flex'; // Mostra o ícone de perfil
    document.body.classList.add('dashboard-view');
}

function showLogin() {
    authContainer.style.display = 'block';
    dashboardElement.style.display = 'none';
    dashboardNav.style.display = 'none'; // Esconde a nav
    profileMenu.style.display = 'none'; // Esconde o ícone de perfil
    document.body.classList.remove('dashboard-view');

    authGrid.style.display = 'grid'; 
    registerSection.style.display = 'none'; 

    if (messageElement) messageElement.textContent = '';
}
window.showLogin = showLogin;

function showRegister() {
    authContainer.style.display = 'block';
    dashboardElement.style.display = 'none';
    dashboardNav.style.display = 'none'; // Esconde a nav
    profileMenu.style.display = 'none'; // Esconde o ícone de perfil
    document.body.classList.remove('dashboard-view');

    authGrid.style.display = 'none'; 
    registerSection.style.display = 'block'; 

    if (messageElement) messageElement.textContent = '';
}
window.showRegister = showRegister;

// A função logout é chamada pelo novo botão no dropdown
function logout() {
    handleLogout(); 
    showLogin();
}


// --- Funções de Modal e Notificação ---
function openModal(message) {
    const modalMessage = document.getElementById('modal-message');
    const modalTitle = document.querySelector('#success-modal .modal-title');
    const successModal = document.getElementById('success-modal');
    if (modalMessage && successModal && modalTitle) {
        modalTitle.textContent = 'Ação Concluída!';
        modalMessage.textContent = message;
        successModal.style.display = 'block';
        setTimeout(() => {
            closeModal();
            showLogin(); 
        }, 4000);
    }
}
function showWelcomeNotification(userName) {
    const modalTitle = document.querySelector('#success-modal .modal-title');
    const modalMessage = document.getElementById('modal-message');
    const successModal = document.getElementById('success-modal');
    if (modalTitle && modalMessage && successModal) {
        modalTitle.textContent = `Olá, ${userName.split(' ')[0]}!`;
        modalMessage.textContent = 'Que bom te ver por aqui. Bom treino!';
        successModal.style.display = 'block';
        setTimeout(() => {
            closeModal(); 
        }, 4000); 
    }
}
function closeModal() {
    const successModal = document.getElementById('success-modal');
    if (successModal) {
        successModal.style.display = 'none';
    }
}
window.closeModal = closeModal; 
document.addEventListener('DOMContentLoaded', () => {
    
    // --- LÓGICA DO DROPDOWN DE PERFIL ---
    const profileIcon = document.getElementById('profile-menu-trigger');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    if(profileIcon && profileDropdown) {
        profileIcon.addEventListener('click', (e) => {
            e.stopPropagation(); 
            profileDropdown.style.display = profileDropdown.style.display === 'block' ? 'none' : 'block';
        });
        document.getElementById('dropdown-logout-btn').addEventListener('click', logout);
    }
    
    window.addEventListener('click', (e) => {
        if (profileDropdown && profileDropdown.style.display === 'block') {
            if (!profileIcon.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.style.display = 'none';
            }
        }
    });

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
                    showWelcomeNotification(profile.nome); 
                    renderCrudForms(profile);
                    
                    // [NOVO] Carrega notificações ao fazer login
                    loadNotificacoes(); 
                    
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
            perguntaInput.value = ''; 
        }
    });

    // --- Adiciona os listeners dos botões rápidos do chat ---
    setupChatListeners(); 

    // --- 4. VERIFICAR SESSÃO AO CARREGAR ---
    const storedToken = localStorage.getItem('jwtToken');
    if (storedToken) {
        showDashboard();
        loadDashboardData(storedToken).then(profile => {
            if (profile) {
                renderCrudForms(profile);
                
                // [NOVO] Carrega notificações ao recarregar a sessão
                loadNotificacoes(); 
                
                if (window.showDashboardSection) {
                    window.showDashboardSection('perfil');
                }
            }
        });
    } else {
        showLogin(); 
    }
});

// --- FUNÇÕES GLOBAIS PARA NAVEGAÇÃO DO DASHBOARD ---
window.loadDietPlan = loadDietPlan;
window.loadTreinos = loadTreinos;
window.loadDiario = loadDiario;
window.loadChatHistory = loadChatHistory; 
window.loadMetas = loadMetas;
window.loadReceitas = loadReceitas;
window.loadNotificacoes = loadNotificacoes;
window.loadPainel = loadPainel;