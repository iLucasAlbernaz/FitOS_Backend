import { API_URL } from './auth.js';

const container = document.getElementById('dieta-container');

// [MODIFICADO] Renderiza os macros de cada alimento
function renderMeal(title, meal) {
    if (!meal || !meal.alimentos || meal.alimentos.length === 0) {
        return '';
    }
    const alimentosHTML = meal.alimentos.map(alimento => `
        <li>
            <strong>${alimento.nome}</strong> (${alimento.porcao})
            <br>
            ${alimento.calorias > 0 ? `
            <small>
                ${alimento.calorias} kcal | 
                Prot: ${alimento.proteinas}g | 
                Carb: ${alimento.carboidratos}g | 
                Gord: ${alimento.gorduras}g
            </small>
            ` : ''}
        </li>
    `).join('');

    // [MODIFICADO] Só mostra totais da REFEIÇÃO se for maior que 0
    const totaisRefeicaoHTML = meal.totais.calorias > 0 ? `
        <div class="meal-totals">
            <strong>Totais da Refeição:</strong><br>
            <small>
                ${meal.totais.calorias} kcal | 
                Prot: ${meal.totais.proteinas}g | 
                Carb: ${meal.totais.carboidratos}g | 
                Gord: ${meal.totais.gorduras}g
            </small>
        </div>
    ` : '';

    return `
        <div class="meal-card">
            <h3>${title}</h3>
            <ul>
                ${alimentosHTML}
            </ul>
            ${totaisRefeicaoHTML}
        </div>
    `;
}

// Card separado para os Totais do Dia
function renderTotais(totais) {
    if (!totais || totais.calorias === 0) return '';
    return `
        <div class="meal-card totais-card">
            <h3>Totais do Dia (Estimado pela IA)</h3>
            <div class="meal-totals" style="text-align: center;">
                <p><strong>Calorias:</strong> ${totais.calorias} kcal</p>
                <p><strong>Proteínas:</strong> ${totais.proteinas} g</p>
                <p><strong>Carboidratos:</strong> ${totais.carboidratos} g</p>
                <p><strong>Gorduras:</strong> ${totais.gorduras} g</p>
            </div>
        </div>
    `;
}

function renderPlanSelector() {
    container.innerHTML = `
        <p class="info-message">Você ainda não possui um plano de dieta ativo.</p>
        <p>Escolha uma das nossas opções para começar:</p>
        
        <div class="plan-selector-buttons">
            <button id="btn-gerar-spoonacular" class="btn btn-primary">
                <i class="fas fa-magic"></i> Gerar Plano (IA Profissional)
            </button>
            <p style="text-align: center; margin-top: 15px; color: #555;">- Ou use nossos modelos padrão -</p>
            <button id="btn-gerar-perda" class="btn btn-secondary">
                Plano Padrão (Perda de Peso)
            </button>
            <button id="btn-gerar-ganho" class="btn btn-secondary" style="margin-top: 10px;">
                Plano Padrão (Ganho de Massa)
            </button>
        </div>
    `;
    document.getElementById('btn-gerar-perda').addEventListener('click', () => {
        handleGeneratePlan('perda-peso');
    });
    document.getElementById('btn-gerar-ganho').addEventListener('click', () => {
        handleGeneratePlan('ganho-massa');
    });
    document.getElementById('btn-gerar-spoonacular').addEventListener('click', handleGerarPlanoIA);
}

// Handler para o Spoonacular
async function handleGerarPlanoIA() {
    const token = localStorage.getItem('jwtToken');
    container.innerHTML = `<p class="info-message">Aguarde... Estamos consultando nosso nutricionista IA (Spoonacular) para criar um plano baseado no seu perfil.</p>`;
    try {
        const response = await fetch(`${API_URL}/dieta/gerar-plano-ia`, {
            method: 'POST',
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Falha ao gerar o plano.');
        }
        alert('Plano da IA gerado com sucesso!');
        loadDietPlan(); 
    } catch (error) {
        console.error('Erro ao gerar plano IA:', error);
        container.innerHTML = `<p class="error-message">${error.message}</p>`;
        container.innerHTML += `<button id="btn-retry-ia" class="btn btn-primary" style="margin-top: 10px;">Tentar Novamente</button>`;
        document.getElementById('btn-retry-ia').addEventListener('click', renderPlanSelector);
    }
}

// Handler antigo (Padrão)
async function handleGeneratePlan(tipoPlano) {
    const token = localStorage.getItem('jwtToken');
    container.innerHTML = `<p class="info-message">Gerando seu plano padrão... Aguarde.</p>`;
    try {
        const response = await fetch(`${API_URL}/dieta/gerar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ tipoPlano: tipoPlano })
        });
        if (!response.ok) throw new Error('Falha ao gerar o plano.');
        alert('Plano padrão gerado com sucesso!');
        loadDietPlan(); 
    } catch (error) {
        console.error('Erro ao gerar plano:', error);
        container.innerHTML = `<p class="error-message">Erro ao gerar o plano. Tente novamente.</p>`;
    }
}

// [MODIFICADO] Função principal de carregamento
export async function loadDietPlan() {
    if (!container) return;
    container.innerHTML = '<p class="info-message">Carregando plano de dieta...</p>';
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        container.innerHTML = '<p class="error-message">Você precisa estar logado para ver o plano.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/dieta/meu-plano`, {
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) {
            if (response.status === 404) {
                renderPlanSelector();
            } else {
                throw new Error('Falha ao buscar o plano');
            }
            return;
        }

        const plan = await response.json();

        if (plan && plan.cafeDaManha) { 
            container.innerHTML = ''; 
            
            container.innerHTML += `<h4 class="plano-dieta-titulo">Plano Ativo: ${plan.nomePlano}</h4>`;
            
            container.innerHTML += renderMeal('Café da Manhã', plan.cafeDaManha);
            container.innerHTML += renderMeal('Almoço', plan.almoco);
            
            if (plan.lanche) { 
                container.innerHTML += renderMeal('Lanche', plan.lanche);
            }
            
            container.innerHTML += renderMeal('Jantar', plan.jantar);
            container.innerHTML += renderTotais(plan.totais);
            
            // [NOVO] Adiciona o botão para gerar outro plano
            container.innerHTML += `
                <div class="change-plan-section">
                    <hr>
                    <h4>Gerar um novo plano?</h4>
                    <p>Ao gerar um novo plano, o plano atual (IA Profissional ou Padrão) será substituído.</p>
                    <button id="btn-show-plan-selector" class="btn btn-secondary">Ver Opções de Plano</button>
                </div>
            `;
            document.getElementById('btn-show-plan-selector').addEventListener('click', renderPlanSelector);

        } else {
            renderPlanSelector();
        }
    } catch (error) {
        console.error('Erro ao carregar plano de dieta:', error);
        container.innerHTML = '<p class="error-message">Erro ao carregar o plano de dieta. Tente novamente mais tarde.</p>';
    }
}