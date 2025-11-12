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

    // [MODIFICADO] Mostra os totais da REFEIÇÃO (Agora temos esses dados!)
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

// [MODIFICADO] Apenas um botão
function renderPlanSelector() {
    container.innerHTML = `
        <p class="info-message">Você ainda não possui um plano de dieta ativo.</p>
        <p>Clique abaixo para gerar um plano profissional baseado no seu perfil (Idade, Sexo e Objetivo).</p>
        
        <div class="plan-selector-buttons">
            <button id="btn-gerar-plano-ia" class="btn btn-primary">
                <i class="fas fa-magic"></i> Gerar Plano de Dieta (IA Profissional)
            </button>
        </div>
    `;
    
    document.getElementById('btn-gerar-plano-ia').addEventListener('click', handleGerarPlanoIA);
}

// Chama a rota (Spoonacular)
async function handleGerarPlanoIA() {
    const token = localStorage.getItem('jwtToken');
    container.innerHTML = `<p class="info-message">Aguarde... Estamos consultando a IA (Spoonacular) para criar um plano baseado no seu perfil...<br>(Isso pode levar até 30 segundos)</p>`;
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

// [REMOVIDO] handleGeneratePlan (plano estático) não é mais necessário

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
            
            // 'lanche' não é mais usado para totais
            if (plan.lanche) { 
                container.innerHTML += renderMeal('Lanche', plan.lanche);
            }
            
            container.innerHTML += renderMeal('Jantar', plan.jantar);
            container.innerHTML += renderTotais(plan.totais);
            
            container.innerHTML += `
                <div class="change-plan-section">
                    <hr>
                    <h4>Gerar um novo plano?</h4>
                    <p>Ao gerar um novo plano, o plano atual (IA) será substituído.</p>
                    <button id="btn-show-plan-selector" class="btn btn-secondary">Gerar Novo Plano</button>
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