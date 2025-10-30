import { API_URL } from './auth.js';

const container = document.getElementById('dieta-container');
let isPlanLoaded = false; 

/**
 * Renderiza um card de refeição individual. (Função mantida)
 */
function renderMeal(title, meal) {
    if (!meal || !meal.alimentos || meal.alimentos.length === 0) {
        return '';
    }
    const alimentosHTML = meal.alimentos.map(alimento => `
        <li>
            <strong>${alimento.nome}</strong> (${alimento.porcao})
            <br>
            <small>
                ${alimento.calorias} kcal | 
                Proteínas: ${alimento.proteinas}g | 
                Carbs: ${alimento.carboidratos}g | 
                Gorduras: ${alimento.gorduras}g
            </small>
        </li>
    `).join('');

    return `
        <div class="meal-card">
            <h3>${title}</h3>
            <ul>
                ${alimentosHTML}
            </ul>
            <div class="meal-totals">
                <strong>Totais da Refeição:</strong><br>
                <small>
                    ${meal.totais.calorias} kcal | 
                    Proteínas: ${meal.totais.proteinas}g | 
                    Carbs: ${meal.totais.carboidratos}g | 
                    Gorduras: ${meal.totais.gorduras}g
                </small>
            </div>
        </div>
    `;
}

/**
 * [NOVO] Renderiza os botões de seleção de plano.
 */
function renderPlanSelector() {
    container.innerHTML = `
        <p class="info-message">Você ainda não possui um plano de dieta ativo.</p>
        <p>Escolha um dos nossos planos padrão para começar:</p>
        
        <div class="plan-selector-buttons">
            <button id="btn-gerar-perda" class="btn btn-primary">
                Gerar Plano (Perda de Peso)
            </button>
            <button id="btn-gerar-ganho" class="btn btn-primary" style="margin-top: 10px; background-color: #00695c;">
                Gerar Plano (Ganho de Massa)
            </button>
        </div>
    `;

    // Adiciona os event listeners aos botões
    document.getElementById('btn-gerar-perda').addEventListener('click', () => {
        handleGeneratePlan('perda-peso');
    });
    document.getElementById('btn-gerar-ganho').addEventListener('click', () => {
        handleGeneratePlan('ganho-massa');
    });
}

/**
 * [NOVO] Lida com a chamada de API para gerar um plano.
 */
async function handleGeneratePlan(tipoPlano) {
    const token = localStorage.getItem('jwtToken');
    container.innerHTML = `<p class="info-message">Gerando seu novo plano... Aguarde.</p>`;

    try {
        const response = await fetch(`${API_URL}/dieta/gerar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ tipoPlano: tipoPlano })
        });

        if (!response.ok) {
            throw new Error('Falha ao gerar o plano.');
        }

        // Sucesso!
        alert('Plano gerado com sucesso!');
        isPlanLoaded = false; // Força o recarregamento
        loadDietPlan(); // Recarrega a seção para mostrar o novo plano

    } catch (error) {
        console.error('Erro ao gerar plano:', error);
        container.innerHTML = `<p class="error-message">Erro ao gerar o plano. Tente novamente.</p>`;
    }
}


/**
 * Função principal (MODIFICADA) para carregar ou selecionar o plano.
 */
export async function loadDietPlan() {
    if (isPlanLoaded) {
        return;
    }
    
    if (!container) return;

    container.innerHTML = '<p class="info-message">Carregando plano de dieta...</p>';
    const token = localStorage.getItem('jwtToken');

    if (!token) {
        container.innerHTML = '<p class="error-message">Você precisa estar logado para ver o plano.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/dieta/meu-plano`, {
            method: 'GET',
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) {
            // [MODIFICADO] Fluxo FE3.1: Plano não encontrado (404)
            if (response.status === 404) {
                // Em vez de mostrar erro, mostra os botões de seleção
                renderPlanSelector();
            } else {
                throw new Error('Falha ao buscar o plano');
            }
            return;
        }

        const plan = await response.json();

        // Fluxo DP03: Renderiza o plano
        if (plan && plan.cafeDaManha) { 
            container.innerHTML = ''; 
            container.innerHTML += renderMeal('Café da Manhã', plan.cafeDaManha);
            container.innerHTML += renderMeal('Almoço', plan.almoco);
            container.innerHTML += renderMeal('Jantar', plan.jantar);
            
            if (plan.lanches) {
                container.innerHTML += renderMeal('Lanches', plan.lanches);
            }

            isPlanLoaded = true;
        } else {
            // Fluxo FE3.1: Resposta OK, mas sem plano
            renderPlanSelector();
        }

    } catch (error) {
        console.error('Erro ao carregar plano de dieta:', error);
        // Fluxo FE3.2: Erro de conexão
        container.innerHTML = '<p class="error-message">Erro ao carregar o plano de dieta. Tente novamente mais tarde.</p>';
    }
}