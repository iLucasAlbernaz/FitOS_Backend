import { API_URL } from './auth.js'; 

// Variáveis para guardar as instâncias dos gráficos
let weightChartInstance = null;
let workoutChartInstance = null;

/**
 * Função principal (Chamada pelo index.html)
 */
export async function loadPainel() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const pesoContainer = document.getElementById('painel-peso-container');
    const treinoContainer = document.getElementById('painel-treino-container');
    
    pesoContainer.innerHTML = '<p class="info-message">Carregando dados de peso...</p>';
    treinoContainer.innerHTML = '<p class="info-message">Carregando dados de treino...</p>';
    
    try {
        const response = await fetch(`${API_URL}/stats/dashboard`, {
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Falha ao carregar dados do painel.');
        }

        const stats = await response.json();

        // 1. Renderiza o Gráfico de Peso
        if (stats.weightData) {
            renderWeightChart(pesoContainer, stats.weightData);
        } else {
            pesoContainer.innerHTML = '<p class="info-message">Adicione pelo menos 2 registros de peso no Diário para ver sua evolução.</p>';
        }

        // 2. Renderiza o Gráfico de Treino
        if (stats.workoutData) {
            renderWorkoutChart(treinoContainer, stats.workoutData);
        } else {
            treinoContainer.innerHTML = '<p class="info-message">Defina uma Meta de Treino para ver seu progresso.</p>';
        }

    } catch (error) {
        console.error('Erro ao carregar painel:', error);
        pesoContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
        treinoContainer.innerHTML = `<p class="error-message">Erro ao carregar dados. Tente novamente mais tarde.</p>`;
    }
}


/**
 * [MODIFICADO] Renderiza o gráfico de linha com a LINHA DA META
 */
function renderWeightChart(container, stats) {
    container.innerHTML = '<canvas id="weightChart"></canvas>';
    const ctx = container.querySelector('#weightChart').getContext('2d');

    if (weightChartInstance) {
        weightChartInstance.destroy();
    }
    
    weightChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: stats.labels, // Datas
            datasets: [
                {
                    label: 'Seu Peso (kg)',
                    data: stats.data, // Pesos
                    borderColor: 'rgb(38, 166, 154)', // Verde FitOS
                    backgroundColor: 'rgba(38, 166, 154, 0.1)',
                    fill: true,
                    tension: 0.1 
                },
                // [NOVO] A Linha da Meta
                {
                    label: 'Sua Meta',
                    data: stats.goalData, // Array com o valor da meta (ex: [75, 75, 75])
                    borderColor: 'rgb(239, 83, 80)', // Vermelho (cor de perigo)
                    fill: false,
                    borderDash: [5, 5], // Linha pontilhada
                    pointRadius: 0, // Sem bolinhas
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

/**
 * [MODIFICADO] Renderiza o gráfico de "Medidor" (Gauge)
 */
function renderWorkoutChart(container, stats) {
    // Limpa o canvas, mas preserva o div do texto
    const canvas = container.querySelector('#workoutChart');
    if (!canvas) {
         container.innerHTML = '<canvas id="workoutChart"></canvas><div id="workout-gauge-text" class="gauge-text"></div>';
    }
    const ctx = container.querySelector('#workoutChart').getContext('2d');
    
    // Atualiza o texto (ex: 2/5)
    const gaugeTextEl = document.getElementById('workout-gauge-text');
    if (gaugeTextEl) {
        gaugeTextEl.innerHTML = `
            <span class="gauge-value">${stats.completed}</span>
            <span class="gauge-total">/ ${stats.total}</span>
            <span class="gauge-label">${stats.periodo}</span>
        `;
    }

    if (workoutChartInstance) {
        workoutChartInstance.destroy();
    }
    
    const treinosFaltantes = Math.max(0, stats.total - stats.completed);
    
    workoutChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Treinos Concluídos', 'Treinos Faltantes'],
            datasets: [{
                data: [stats.completed, treinosFaltantes],
                backgroundColor: [
                    'rgb(38, 166, 154)',  // Verde FitOS
                    '#e0e0e0'              // Cinza claro
                ],
                borderWidth: 0, // Sem bordas
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true, // Mantém o aspecto
            cutout: '75%', // O "buraco" do meio
            // [NOVO] Faz o gráfico ser um Semicírculo (Gauge)
            rotation: -90, 
            circumference: 180, 
            plugins: {
                legend: {
                    display: false // Esconde a legenda
                },
                tooltip: {
                    enabled: false // Desativa o tooltip
                }
            }
        }
    });
}