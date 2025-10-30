import { API_URL } from './auth.js';

const container = document.getElementById('dieta-container');
let isPlanLoaded = false; 

/**
 * Renderiza um card de refeição individual. (Não muda)
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
 * Renderiza os botões de seleção de plano (quando NÃO há plano). (Não muda)
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

    document.getElementById('btn-gerar-perda').addEventListener('click', () => {
        handleGeneratePlan('perda-peso');
    });
    document.getElementById('btn-gerar-ganho').addEventListener('click', () => {
        handleGeneratePlan('ganho-massa');
    });
}

/**
 * [MODIFICADO] Renderiza os botões para MUDAR de plano (quando JÁ HÁ plano).
 * Agora ele recebe o nome do plano atual.
 */
function renderPlanChanger(nomePlanoAtual) {
    let changerHTML = `
        <div class="change-plan-section">
            <hr>
            <h4>Mudar de Plano?</h4>
            <p>Seu plano atual é: <strong>${nomePlanoAtual}</strong></p>
            <p>Você pode substituí-lo pelo outro plano disponível:</p>
            <div class="plan-selector-buttons">
    `;

    // Lógica para mostrar APENAS o outro botão
    if (nomePlanoAtual === 'Perda de Peso') {
        changerHTML += `
            <button id="btn-mudar-ganho" class="btn btn-secondary" style="margin-top: 10px;">
                Mudar para (Ganho de Massa)
            </button>
        `;
    } else if (nomePlanoAtual === 'Ganho de Massa') {
        changerHTML += `
            <button id="btn-mudar-perda" class="btn btn-secondary">
                Mudar para (Perda de Peso)
            </button>
        `;
    } else {
        // Fallback (caso o nome do plano não seja reconhecido)
        changerHTML += `
            <p>Não foi possível identificar seu plano. Você pode escolher um novo:</p>
            <button id="btn-mudar-perda" class="btn btn-secondary">
                Mudar para (Perda de Peso)
            </button>
            <button id="btn-mudar-ganho" class="btn btn-secondary" style="margin-top: 10px;">
                Mudar para (Ganho de Massa)
            </button>
        `;
    }

    changerHTML += `
            </div>
        </div>
    `;
    
    container.innerHTML += changerHTML;

    // Adiciona os event listeners APENAS para os botões que existem
    const btnMudarPerda = document.getElementById('btn-mudar-perda');
    if (btnMudarPerda) {
        btnMudarPerda.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja substituir seu plano atual pelo de Perda de Peso?')) {
                handleGeneratePlan('perda-peso');
            }
        });
    }
    
    const btnMudarGanho = document.getElementById('btn-mudar-ganho');
    if (btnMudarGanho) {
        btnMudarGanho.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja substituir seu plano atual pelo de Ganho de Massa?')) {
                handleGeneratePlan('ganho-massa');
            }
        });
    }
}


/**
 * Lida com a chamada de API para gerar/mudar um plano. (Não muda)
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

        alert('Plano atualizado com sucesso!');
        isPlanLoaded = false; 
        loadDietPlan(); 

    } catch (error) {
        console.error('Erro ao gerar plano:', error);
        container.innerHTML = `<p class="error-message">Erro ao gerar o plano. Tente novamente.</p>`;
    }
}


/**
 * Função principal (MODIFICADA) para passar o nome do plano.
 */
export async function loadDietPlan() {
    // Resetamos a flag toda vez que a seção é aberta
    // para garantir que os dados sejam recarregados
    isPlanLoaded = false; 
    
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
            if (response.status === 404) {
                renderPlanSelector();
            } else {
                throw new Error('Falha ao buscar o plano');
            }
            return;
        }

        const plan = await response.json();

        // Fluxo 2: Tem plano. Renderiza o plano.
        if (plan && plan.cafeDaManha) { 
            container.innerHTML = ''; 
            container.innerHTML += renderMeal('Café da Manhã', plan.cafeDaManha);
            container.innerHTML += renderMeal('Almoço', plan.almoco);
            container.innerHTML += renderMeal('Jantar', plan.jantar);
            
            if (plan.lanches) {
                container.innerHTML += renderMeal('Lanches', plan.lanches);
            }

            // [MODIFICADO] Passa o nome do plano (plan.nomePlano) para o renderizador
            renderPlanChanger(plan.nomePlano);

            isPlanLoaded = true;
        } else {
            renderPlanSelector();
        }

    } catch (error) {
        console.error('Erro ao carregar plano de dieta:', error);
        container.innerHTML = '<p class="error-message">Erro ao carregar o plano de dieta. Tente novamente mais tarde.</p>';
    }
}