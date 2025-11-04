import { API_URL } from './auth.js'; 

const notificacaoMenu = document.getElementById('notificacao-menu');
const notificacaoTrigger = document.getElementById('notificacao-menu-trigger');
const notificacaoDropdown = document.getElementById('notificacao-dropdown');
const notificacaoCountEl = document.getElementById('notificacao-count');
const notificacaoListContainer = document.getElementById('notificacao-list');
const markAllReadBtn = document.getElementById('mark-all-read-btn');

/**
 * Retorna o token de autenticação.
 */
function getToken() {
    return localStorage.getItem('jwtToken');
}

/**
 * Carrega as notificações do backend e atualiza a UI.
 */
export async function loadNotificacoes() {
    const token = getToken();
    if (!token) return;

    // 1. Mostra o ícone de notificação
    if (notificacaoMenu) notificacaoMenu.style.display = 'flex';

    try {
        const response = await fetch(`${API_URL}/notificacoes`, {
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) throw new Error('Falha ao buscar notificações.');
        
        // [CORREÇÃO 1] Captura o objeto completo do backend
        const data = await response.json();

        const notificacoes = data.notificacoes || []; // Garante que é um array, mesmo se for undefined
        const naoLidasCount = data.naoLidasCount || 0; // Garante que é um número
        
        // 2. Atualiza o contador
        updateNotificationCount(naoLidasCount);

        // 3. Renderiza a lista
        renderNotificationDropdown(notificacoes, naoLidasCount);

    } catch (error) {
        console.error("Erro no loadNotificacoes:", error);
        updateNotificationCount(0);
        if (notificacaoListContainer) {
            notificacaoListContainer.innerHTML = '<p class="error-message" style="padding: 10px;">Falha ao carregar alertas.</p>';
        }
    }
}

/**
 * Atualiza o badge numérico no ícone do sino.
 */
function updateNotificationCount(count) {
    if (notificacaoCountEl) {
        if (count > 0) {
            notificacaoCountEl.textContent = count > 99 ? '99+' : count;
            notificacaoCountEl.style.display = 'flex';
            if (notificacaoMenu) notificacaoMenu.classList.add('has-unread');
        } else {
            notificacaoCountEl.style.display = 'none';
            if (notificacaoMenu) notificacaoMenu.classList.remove('has-unread');
        }
    }
}

/**
 * Renderiza o conteúdo dentro do dropdown.
 */
function renderNotificationDropdown(notificacoes, naoLidasCount) {
    if (!notificacaoListContainer) return;

    // [CORREÇÃO 2] Não precisa de '.length', pois garantimos que 'notificacoes' é um array na loadNotificacoes
    if (notificacoes.length === 0) {
        notificacaoListContainer.innerHTML = '<p class="no-notifications-message">Nenhum alerta recente.</p>';
    } else {
        notificacaoListContainer.innerHTML = notificacoes.map(n => {
            const classes = n.lida ? 'notificacao-item read' : 'notificacao-item unread';
            const timeAgo = getTimeDifference(new Date(n.createdAt));
            const icon = getIconForType(n.tipo);
            
            return `
                <div class="${classes}" data-id="${n._id}" data-lida="${n.lida}">
                    <div class="notification-icon-type">${icon}</div>
                    <div class="notificacao-content">
                        <p class="notificacao-message">${n.mensagem}</p>
                        <span class="notificacao-time">${timeAgo}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // 4. Controla o botão "Marcar todas como lidas"
    if (markAllReadBtn) {
        markAllReadBtn.style.display = naoLidasCount > 0 ? 'block' : 'none';
    }

    // 5. Adiciona o listener para marcar uma como lida
    notificacaoListContainer.querySelectorAll('.unread').forEach(item => {
        item.addEventListener('click', (e) => {
            const targetItem = e.currentTarget; 
            if (targetItem.dataset.lida === 'false' || targetItem.dataset.lida === undefined) {
                 handleMarkAsRead(targetItem.dataset.id);
            }
        });
    });
}

/**
 * Envia requisição para marcar uma notificação como lida.
 */
async function handleMarkAsRead(id) {
    const token = getToken();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/notificacoes/marcar-lida/${id}`, {
            method: 'PUT',
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) throw new Error('Falha ao marcar como lida.');
        
        // [CORREÇÃO 3] Captura o objeto e a nova contagem do PUT
        const data = await response.json(); 
        const naoLidasCount = data.naoLidasCount; 
        
        updateNotificationCount(naoLidasCount);
        
        const item = document.querySelector(`.notificacao-item[data-id="${id}"]`);
        if (item) {
            item.classList.remove('unread');
            item.classList.add('read');
            item.dataset.lida = 'true';
            // Clonamos e substituímos o nó para desativar o listener de clique
            const newItem = item.cloneNode(true); 
            item.parentNode.replaceChild(newItem, item);
        }

    } catch (error) {
        console.error('Erro ao marcar como lida:', error);
    }
}

// --- Funções Utilitárias (Não mudam) ---
function getTimeDifference(past) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} segundos atrás`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} horas atrás`;
    
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return past.toLocaleDateString('pt-BR', options);
}

function getIconForType(type) {
    switch(type) {
        case 'META_CONCLUIDA':
            return '<i class="fas fa-trophy success"></i>';
        case 'LEMBRETE':
            return '<i class="fas fa-clock primary"></i>';
        case 'SISTEMA':
        default:
            return '<i class="fas fa-bell system"></i>';
    }
}

// --- EVENT LISTENERS DA UI (Dropdown) ---
document.addEventListener('DOMContentLoaded', () => {
    const notificacaoTrigger = document.getElementById('notificacao-menu-trigger');
    const notificacaoDropdown = document.getElementById('notificacao-dropdown');

    if (notificacaoTrigger && notificacaoDropdown) {
        notificacaoTrigger.addEventListener('click', (event) => {
            event.stopPropagation();
            notificacaoDropdown.style.display = notificacaoDropdown.style.display === 'block' ? 'none' : 'block';
            if (notificacaoDropdown.style.display === 'block') {
                 loadNotificacoes(); // Recarrega sempre que abrir
            }
        });
    }

    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async () => {
            alert("A rota para 'Marcar todas como lidas' não implementada, mas o menu será atualizado.");
            loadNotificacoes(); 
        });
    }

    // Fechar o dropdown se clicar fora
    document.addEventListener('click', (event) => {
        if (notificacaoDropdown && notificacaoTrigger && 
            !notificacaoDropdown.contains(event.target) && 
            !notificacaoTrigger.contains(event.target) && 
            !event.target.closest('#notificacao-dropdown')) {
            
            notificacaoDropdown.style.display = 'none';
        }
    });
});