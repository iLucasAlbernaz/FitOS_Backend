import { API_URL } from './auth.js';

const container = document.getElementById('dieta-container');

// --- 1. RENDERIZAÇÃO PRINCIPAL ---

// Renderiza a refeição (Café, Almoço, etc.)
function renderMeal(title, meal) {
    if (!meal || !meal.alimentos || meal.alimentos.length === 0) {
        return '';
    }
    
    // Lista de Alimentos
    const alimentosHTML = meal.alimentos.map(alimento => `
        <li>
            <strong>${alimento.nome}</strong> (${alimento.porcao})
            ${alimento.calorias > 0 ? `
            <br><small>
                ${alimento.calorias} kcal | 
                Prot: ${alimento.proteinas}g | 
                Carb: ${alimento.carboidratos}g | 
                Gord: ${alimento.gorduras}g
            </small>` : ''}
        </li>
    `).join('');

    // Modo de Preparo (se existir)
    const preparoHTML = meal.modoPreparo ? `
        <details class="modo-preparo-details">
            <summary>Modo de Preparo</summary>
            <p>${meal.modoPreparo}</p>
        </details>
    ` : '';

    // Totais da Refeição
    const totaisRefeicaoHTML = `
        <div class="meal-totals">
            <strong>Totais da Refeição:</strong><br>
            <small>
                ${meal.totais.calorias} kcal | 
                Prot: ${meal.totais.proteinas}g | 
                Carb: ${meal.totais.carboidratos}g | 
                Gord: ${meal.totais.gorduras}g
            </small>
        </div>
    `;

    return `
        <div class="meal-card">
            <h3>${title}</h3>
            <ul>${alimentosHTML}</ul>
            ${preparoHTML}
            ${totaisRefeicaoHTML}
        </div>
    `;
}

// Renderiza a "Explicação da IA" (Request 2)
function renderExplicacao(explicacao) {
    if (!explicacao) return '';
    return `
        <div class="explicacao-ia-card">
            <h4><i class="fas fa-brain"></i> Explicação da IA</h4>
            <p>${explicacao}</p>
        </div>
    `;
}

// Renderiza os "Totais do Dia"
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

// Renderiza a lista de "Planos Salvos" (Request 4)
function renderPlanosSalvos(planos) {
    if (!planos || planos.length === 0) {
        return '<h4><i class="fas fa-save"></i> Planos Salvos</h4><p class="info-message">Você ainda não tem planos salvos.</p>';
    }

    const planosHTML = planos.map(plano => {
        const data = new Date(plano.createdAt).toLocaleDateString('pt-BR');
        return `
            <li class="plano-salvo-item">
                <span><strong>${plano.nomePlano}</strong> (Salvo em ${data})</span>
                <button class="btn btn-secondary btn-ativar-plano" data-id="${plano._id}">Ativar</button>
            </li>
        `;
    }).join('');

    return `
        <h4><i class="fas fa-save"></i> Planos Salvos</h4>
        <p>Gere um novo plano para salvar o plano atual nesta lista.</p>
        <ul class="planos-salvos-list">
            ${planosHTML}
        </ul>
    `;
}

// Renderiza o botão "Gerar Novo Plano"
function renderPlanSelector() {
    container.innerHTML = `
        <p class="info-message">Você ainda não possui um plano de dieta ativo.</p>
        <p>Clique abaixo para gerar um plano personalizado baseado no seu perfil (Idade, Sexo e Objetivo).</p>
        
        <div class="plan-selector-buttons">
            <button id="btn-gerar-plano-ia" class="btn btn-primary">
                <i class="fas fa-magic"></i> Gerar Plano de Dieta (IA)
            </button>
        </div>
    `;
    document.getElementById('btn-gerar-plano-ia').addEventListener('click', handleGerarPlanoIA);
}

// --- 2. LÓGICA DE CARREGAMENTO (EVENT HANDLERS) ---

// Chama a API para gerar um novo plano
async function handleGerarPlanoIA() {
    const token = localStorage.getItem('jwtToken');
    container.innerHTML = `<p class="info-message">Aguarde... Estamos consultando o Gemini para criar um plano de dieta personalizado baseado no seu perfil...<br>(Isso pode levar até 30 segundos)</p>`;
    try {
        const response = await fetch(`${API_URL}/dieta/gerar-plano-ia`, {
            method: 'POST',
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Falha ao gerar o plano.');
        }
        alert('Novo plano da IA gerado e ativado!');
        loadDietPlan(); // Recarrega tudo
    } catch (error) {
        console.error('Erro ao gerar plano IA:', error);
        container.innerHTML = `<p class="error-message">${error.message}</p>`;
        container.innerHTML += `<button id="btn-retry-ia" class="btn btn-primary" style="margin-top: 10px;">Tentar Novamente</button>`;
        document.getElementById('btn-retry-ia').addEventListener('click', renderPlanSelector);
    }
}

// [NOVO] Chama a API para ativar um plano salvo (Request 4)
async function handleSetPlanoAtivo(planoId) {
    const token = localStorage.getItem('jwtToken');
    container.innerHTML = '<p class="info-message">Ativando plano...</p>';
    
    try {
        const response = await fetch(`${API_URL}/dieta/set-ativo/${planoId}`, {
            method: 'PUT',
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) {
            throw new Error('Falha ao ativar o plano.');
        }
        alert('Plano reativado com sucesso!');
        loadDietPlan(); // Recarrega tudo
    } catch (error) {
        console.error('Erro ao ativar plano:', error);
        alert(error.message);
    }
}


// --- 3. FUNÇÃO PRINCIPAL (loadDietPlan) ---
export async function loadDietPlan() {
    if (!container) return;
    container.innerHTML = '<p class="info-message">Carregando seu plano de dieta...</p>';
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        container.innerHTML = '<p class="error-message">Você precisa estar logado para ver o plano.</p>';
        return;
    }

    try {
        // [MODIFICADO] Busca o plano ATIVO e os SALVOS em paralelo
        const [planoAtivoRes, planosSalvosRes] = await Promise.all([
            fetch(`${API_URL}/dieta/meu-plano`, { headers: { 'x-auth-token': token } }),
            fetch(`${API_URL}/dieta/planos-salvos`, { headers: { 'x-auth-token': token } })
        ]);

        // --- Processa o Plano Ativo ---
        if (!planoAtivoRes.ok) {
            if (planoAtivoRes.status === 404) {
                renderPlanSelector(); // Mostra o botão "Gerar Plano"
            } else {
                throw new Error('Falha ao buscar o plano');
            }
        } else {
            const plan = await planoAtivoRes.json();
            if (plan && plan.cafeDaManha) { 
                container.innerHTML = ''; 
                
                container.innerHTML += `<h4 class="plano-dieta-titulo">Plano Ativo: ${plan.nomePlano}</h4>`;
                
                // [NOVO] Renderiza a Explicação (Request 3)
                container.innerHTML += renderExplicacao(plan.explicacao);
                
                container.innerHTML += renderMeal('Café da Manhã', plan.cafeDaManha);
                container.innerHTML += renderMeal('Almoço', plan.almoco);
                if (plan.lanche) { 
                    container.innerHTML += renderMeal('Lanche', plan.lanche);
                }
                container.innerHTML += renderMeal('Jantar', plan.jantar);
                container.innerHTML += renderTotais(plan.totais);
                
                // Botão para gerar um novo (e salvar o atual)
                container.innerHTML += `
                    <div class="change-plan-section">
                        <hr>
                        <h4>Gerar um novo plano?</h4>
                        <p>Seu plano atual será salvo e um novo plano será gerado pela IA.</p>
                        <button id="btn-gerar-outro-plano" class="btn btn-primary">Gerar Novo Plano (IA)</button>
                    </div>
                `;
                document.getElementById('btn-gerar-outro-plano').addEventListener('click', handleGerarPlanoIA);
            } else {
                renderPlanSelector();
            }
        }

        // --- Processa os Planos Salvos (Request 4) ---
        if (planosSalvosRes.ok) {
            const planosSalvos = await planosSalvosRes.json();
            container.innerHTML += `<hr class="section-divider">`;
            container.innerHTML += renderPlanosSalvos(planosSalvos);
            
            // Adiciona listeners aos botões "Ativar"
            container.querySelectorAll('.btn-ativar-plano').forEach(btn => {
                btn.addEventListener('click', (e) => handleSetPlanoAtivo(e.target.dataset.id));
            });
        }

    } catch (error) {
        console.error('Erro ao carregar plano de dieta:', error);
        container.innerHTML = '<p class="error-message">Erro ao carregar o plano de dieta. Tente novamente mais tarde.</p>';
    }
}