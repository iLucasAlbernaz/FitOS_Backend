import { API_URL } from './auth.js';

const container = document.getElementById('dieta-container');

// Variável para guardar o plano sugerido pela IA antes de salvar
let planoSugerido = null;

// --- [NOVO] EVENT LISTENER PRINCIPAL (DELEGAÇÃO DE EVENTOS) ---
// Este único listener gerencia TODOS os cliques dentro do container
if (container) {
    container.addEventListener('click', (e) => {
        // Pega o elemento exato que foi clicado
        const target = e.target.closest('button'); 
        
        // Se o clique não foi em um botão, ignora
        if (!target) return;

        // Gerencia os diferentes botões
        const targetId = target.id;
        
        if (targetId === 'btn-gerar-plano-ia' || targetId === 'btn-gerar-outro-plano') {
            handleGerarPlanoIA();
            return;
        }

        if (targetId === 'btn-salvar-plano') {
            handleSalvarPlanoGerado();
            return;
        }

        if (targetId === 'btn-cancelar-plano') {
            loadDietPlan(); // Volta ao estado anterior
            return;
        }

        if (targetId === 'btn-retry-ia') {
            renderPlanSelector(); // Tenta de novo
            return;
        }

        // Para botões com classe (como "Ativar" e "Excluir")
        if (target.classList.contains('btn-ativar-plano')) {
            const planoId = target.dataset.id;
            if (planoId) {
                handleSetPlanoAtivo(planoId);
            }
            return;
        }

        if (target.classList.contains('btn-delete-plano')) {
            const planoId = target.dataset.id;
            if (planoId) {
                handleDeletePlano(planoId); // Chama a nova função de exclusão
            }
            return;
        }
    });
}
// --- FIM DO NOVO LISTENER ---


// --- 1. RENDERIZAÇÃO PRINCIPAL ---

function renderMeal(title, meal) {
    if (!meal || !meal.alimentos || meal.alimentos.length === 0) {
        return '';
    }
    
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

    const preparoHTML = meal.modoPreparo ? `
        <details class="modo-preparo-details">
            <summary>Modo de Preparo</summary>
            <p>${meal.modoPreparo}</p>
        </details>
    ` : '';

    const totaisRefeicaoHTML = `
        <div class="meal-totals">
            <small>
                Total: ${meal.totais.calorias} kcal | 
                Prot: ${meal.totais.proteinas}g | 
                Carb: ${meal.totais.carboidratos}g | 
                Gord: ${meal.totais.gorduras}g
            </small>
        </div>
    `;

    return `
        <div class="meal-card">
            <h3 class="meal-title">${title}</h3>
            <ul>${alimentosHTML}</ul>
            ${preparoHTML}
            ${totaisRefeicaoHTML}
        </div>
    `;
}

// Renderiza as "Orientações do Plano"
function renderOrientacoes(explicacao) {
    if (!explicacao) return '';
    return `
        <div class="info-card">
            <h4><i class="fas fa-info-circle"></i> Orientações do Plano</h4>
            <p>${explicacao}</p>
        </div>
    `;
}

// Renderiza os "Totais do Dia (Estimativa)"
function renderTotais(totais) {
    if (!totais || totais.calorias === 0) return '';
    return `
        <div class="totals-day-card">
            <h3>Totais do Dia (Estimativa)</h3>
            <div class="total-macros">
                <p><strong>Calorias:</strong> <span>${totais.calorias} kcal</span></p>
                <p><strong>Proteínas:</strong> <span>${totais.proteinas} g</span></p>
                <p><strong>Carboidratos:</strong> <span>${totais.carboidratos} g</span></p>
                <p><strong>Gorduras:</strong> <span>${totais.gorduras} g</span></p>
            </div>
        </div>
    `;
}

// [MODIFICADO] Adiciona o botão de excluir
function renderPlanosSalvos(planos) {
    if (!planos || planos.length === 0) {
        return '<h4 class="section-title"><i class="fas fa-save"></i> Planos Salvos</h4><p class="info-message">Você ainda não tem planos salvos.</p>';
    }

    const planosHTML = planos.map(plano => {
        const data = new Date(plano.createdAt).toLocaleDateString('pt-BR');
        return `
            <li class="plano-salvo-item">
                <span><strong>${plano.nomePlano}</strong> (Salvo em ${data})</span>
                <div class="plano-salvo-actions">
                    <button class="btn btn-secondary btn-ativar-plano" data-id="${plano._id}">Ativar</button>
                    <button class="btn btn-danger btn-delete-plano" data-id="${plano._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </li>
        `;
    }).join('');

    return `
        <h4 class="section-title"><i class="fas fa-save"></i> Planos Salvos</h4>
        <p class="info-message">Gere um novo plano para salvar o plano atual nesta lista.</p>
        <ul class="planos-salvos-list">
            ${planosHTML}
        </ul>
    `;
}

// Renderiza o botão "Gerar Novo Plano"
function renderPlanSelector() {
    container.innerHTML = `
        <div class="plan-info-message">
            <p>Você ainda não possui um plano de dieta ativo.</p>
            <p>Clique abaixo para gerar um plano personalizado baseado no seu perfil (Idade, Sexo e Objetivo).</p>
        </div>
        <div class="plan-selector-buttons">
            <button id="btn-gerar-plano-ia" class="btn btn-primary btn-large">
                <i class="fas fa-magic"></i> Gerar Plano de Dieta
            </button>
        </div>
    `;
}

// Renderiza a tela de PREVIEW (plano gerado mas não salvo)
function renderPlanoPreview(plan) {
    container.innerHTML = ''; 
    container.innerHTML += `<h2 class="main-plan-title">Sugestão de Plano: ${plan.nomePlano}</h2>`;
    container.innerHTML += `<p class="plan-sub-title">Este é um plano sugerido. Revise abaixo e clique em "Salvar" para ativá-lo.</p>`;
    
    container.innerHTML += renderOrientacoes(plan.explicacao);
    container.innerHTML += renderMeal('Café da Manhã', plan.cafeDaManha);
    container.innerHTML += renderMeal('Almoço', plan.almoco);
    if (plan.lanche) { 
        container.innerHTML += renderMeal('Lanche', plan.lanche);
    }
    container.innerHTML += renderMeal('Jantar', plan.jantar);
    container.innerHTML += renderTotais(plan.totais);
    
    container.innerHTML += `
        <div class="preview-actions">
            <hr>
            <button id="btn-salvar-plano" class="btn btn-primary btn-large">Salvar e Ativar Plano</button>
            <button id="btn-cancelar-plano" class="btn btn-secondary">Cancelar</button>
        </div>
    `;
}


// --- 2. LÓGICA DE CARREGAMENTO (EVENT HANDLERS) ---

// Apenas GERA a sugestão, não salva
async function handleGerarPlanoIA() {
    const token = localStorage.getItem('jwtToken');
    container.innerHTML = `
        <div class="loading-message">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Aguarde... Estamos criando um plano de dieta personalizado...</p>
            <small>(Isso pode levar até 30 segundos)</small>
        </div>
    `;
    try {
        const response = await fetch(`${API_URL}/dieta/gerar-plano-ia`, {
            method: 'POST',
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Falha ao gerar o plano.');
        }
        
        const planoJSON = await response.json();
        planoSugerido = planoJSON; 
        renderPlanoPreview(planoJSON); 

    } catch (error) {
        console.error('Erro ao gerar plano IA:', error);
        container.innerHTML = `
            <div class="error-section">
                <p class="error-message">${error.message}</p>
                <button id="btn-retry-ia" class="btn btn-primary" style="margin-top: 10px;">Tentar Novamente</button>
            </div>
        `;
    }
}

// Chama a API para SALVAR o plano
async function handleSalvarPlanoGerado() {
    if (!planoSugerido) {
        alert('Erro: Nenhum plano sugerido para salvar.');
        return;
    }
    
    const token = localStorage.getItem('jwtToken');
    container.innerHTML = '<p class="info-message">Salvando seu novo plano...</p>';

    try {
        const response = await fetch(`${API_URL}/dieta/salvar-plano-gerado`, {
            method: 'POST',
            headers: { 
                'x-auth-token': token,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(planoSugerido)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Falha ao salvar o plano.');
        }

        alert('Novo plano salvo e ativado!');
        planoSugerido = null; 
        loadDietPlan(); 

    } catch (error) {
        console.error('Erro ao salvar plano:', error);
        alert(error.message);
        renderPlanoPreview(planoSugerido); 
    }
}


// Chama a API para ativar um plano salvo (antigo)
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
        loadDietPlan(); 
    } catch (error) {
        console.error('Erro ao ativar plano:', error);
        alert(error.message);
    }
}

// [NOVO] Função para Excluir um plano salvo
async function handleDeletePlano(planoId) {
    // Confirmação de segurança
    if (!confirm('Tem certeza que deseja excluir este plano salvo? Esta ação não pode ser desfeita.')) {
        return;
    }

    const token = localStorage.getItem('jwtToken');
    // Mostra o loading *dentro* da seção de planos salvos, se possível,
    // ou apenas um loading genérico.
    container.innerHTML = `<div class="loading-message"><i class="fas fa-spinner fa-spin"></i><p>Excluindo plano...</p></div>`;
    
    try {
        const response = await fetch(`${API_URL}/dieta/plano/${planoId}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Falha ao excluir o plano.');
        }
        
        alert('Plano salvo excluído com sucesso!');
        loadDietPlan(); // Recarrega a seção de dieta

    } catch (error) {
        console.error('Erro ao excluir plano:', error);
        alert(error.message);
        loadDietPlan(); // Recarrega mesmo se der erro, para mostrar o estado atual
    }
}


// --- 3. FUNÇÃO PRINCIPAL (loadDietPlan) ---
export async function loadDietPlan() {
    if (!container) return;
    container.innerHTML = `
        <div class="loading-message">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Carregando seu plano de dieta...</p>
        </div>
    `;
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        container.innerHTML = '<p class="error-message">Você precisa estar logado para ver o plano.</p>';
        return;
    }
    
    planoSugerido = null; 

    try {
        const [planoAtivoRes, planosSalvosRes] = await Promise.all([
            fetch(`${API_URL}/dieta/meu-plano`, { headers: { 'x-auth-token': token } }),
            fetch(`${API_URL}/dieta/planos-salvos`, { headers: { 'x-auth-token': token } })
        ]);

        // --- Processa o Plano Ativo ---
        if (!planoAtivoRes.ok) {
            if (planoAtivoRes.status === 404) {
                renderPlanSelector(); 
            } else {
                throw new Error('Falha ao buscar o plano');
            }
        } else {
            const plan = await planoAtivoRes.json();
            if (plan && plan.cafeDaManha) { 
                container.innerHTML = ''; 
                container.innerHTML += `<h2 class="main-plan-title">Plano Ativo: ${plan.nomePlano}</h2>`;
                container.innerHTML += renderOrientacoes(plan.explicacao);
                container.innerHTML += renderMeal('Café da Manhã', plan.cafeDaManha);
                container.innerHTML += renderMeal('Almoço', plan.almoco);
                if (plan.lanche) { 
                    container.innerHTML += renderMeal('Lanche', plan.lanche);
                }
                container.innerHTML += renderMeal('Jantar', plan.jantar);
                container.innerHTML += renderTotais(plan.totais);
                
                container.innerHTML += `
                    <div class="change-plan-section">
                        <hr>
                        <h4 class="section-title">Gerar um novo plano?</h4>
                        <p class="info-message">Seu plano atual será salvo e um novo plano será sugerido.</p>
                        <button id="btn-gerar-outro-plano" class="btn btn-primary btn-large">Gerar Novo Plano</button>
                    </div>
                `;
            } else {
                renderPlanSelector();
            }
        }

        // --- Processa os Planos Salvos ---
        if (planosSalvosRes.ok) {
            const planosSalvos = await planosSalvosRes.json();
            container.innerHTML += `<hr class="section-divider">`;
            container.innerHTML += renderPlanosSalvos(planosSalvos);
            
            // Os listeners agora são gerenciados pelo listener principal
        }

    } catch (error) {
        console.error('Erro ao carregar plano de dieta:', error);
        container.innerHTML = `
            <div class="error-section">
                <p class="error-message">Erro ao carregar o plano de dieta. Tente novamente mais tarde.</p>
            </div>
        `;
    }
}