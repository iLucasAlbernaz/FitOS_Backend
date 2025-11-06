import { API_URL } from './auth.js'; 

// Variáveis para guardar as instâncias dos gráficos (para podermos destruí-los)
let weightChartInstance = null;
let workoutChartInstance = null;

/**
 * Função principal (Chamada pelo index.html)
 */
export async function loadPainel() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    // Elementos dos containers
    const pesoContainer = document.getElementById('painel-peso-container');
    const treinoContainer = document.getElementById('painel-treino-container');
    
    // Reseta os containers
    pesoContainer.innerHTML = '<p class="info-message">Carregando dados de peso...</p>';
    treinoContainer.innerHTML = '<p class="info-message">Carregando dados de treino...</p>';
    
    try {
        const response = await fetch(`${API_URL}/stats/dashboard`, {
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) {
            // (FE3.1) Lida com "Dados insuficientes" (404)
            if (response.status === 404) {
                const err = await response.json();
                pesoContainer.innerHTML = `<p class="info-message">${err.msg || 'Dados insuficientes.'}</p>`;
                treinoContainer.innerHTML = `<p class="info-message">${err.msg || 'Dados insuficientes.'}</p>`;
            } else {
                throw new Error('Falha ao carregar dados do painel.');
            }
            return;
        }

        const stats = await response.json();

        // 1. Renderiza o Gráfico de Peso
        if (stats.weightData) {
            renderWeightChart(pesoContainer, stats.weightData);
        } else {
            // (FE3.1)
            pesoContainer.innerHTML = '<p class="info-message">Ainda não há dados suficientes para exibir a evolução do peso. Adicione pelo menos 2 registros no Diário.</p>';
        }

        // 2. Renderiza o Gráfico de Treino
        if (stats.workoutData) {
            renderWorkoutChart(treinoContainer, stats.workoutData);
        } else {
            // (FE3.1)
            treinoContainer.innerHTML = '<p class="info-message">Nenhuma meta de treino ativa encontrada. Defina uma meta de treino para ver seu progresso.</p>';
        }

    } catch (error) {
        console.error('Erro ao carregar painel:', error);
        // (FE3.2) Erro de carregamento
        pesoContainer.innerHTML = '<p class="error-message">Erro ao carregar o painel. Tente novamente mais tarde.</p>';
        treinoContainer.innerHTML = '';
    }
}


/**
 * Renderiza o gráfico de linha para Evolução do Peso
 */
function renderWeightChart(container, stats) {
    // Limpa o container e recria o canvas
    container.innerHTML = '<canvas id="weightChart"></canvas>';
    const ctx = container.querySelector('#weightChart').getContext('2d');

    // Destrói o gráfico antigo, se ele existir
    if (weightChartInstance) {
        weightChartInstance.destroy();
    }
    
    // Cria o novo gráfico
    weightChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: stats.labels, // Datas (ex: "30/10", "31/10")
            datasets: [{
                label: 'Peso (kg)',
                data: stats.data, // Pesos (ex: 82, 81.8)
                borderColor: 'rgb(38, 166, 154)', // Verde FitOS
                backgroundColor: 'rgba(38, 166, 154, 0.1)',
                fill: true,
                tension: 0.1 // Linha levemente curvada
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

/**
 * Renderiza o gráfico de rosca (Doughnut) para Frequência de Treino
 */
function renderWorkoutChart(container, stats) {
    container.innerHTML = '<canvas id="workoutChart"></canvas>';
    const ctx = container.querySelector('#workoutChart').getContext('2d');

    if (workoutChartInstance) {
        workoutChartInstance.destroy();
    }
    
    const treinosFaltantes = Math.max(0, stats.total - stats.completed);
    
    workoutChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Treinos Concluídos', 'Treinos Faltantes'],
            datasets: [{
                label: `Progresso da ${stats.periodo}`,
                data: [stats.completed, treinosFaltantes],
                backgroundColor: [
                    'rgb(38, 166, 154)',  // Verde FitOS
                    '#e0e0e0'              // Cinza claro
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw} treinos`;
                        }
                    }
                }
            }
        }
    });
}