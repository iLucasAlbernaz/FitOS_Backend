import { API_URL } from './auth.js';

// --- Elementos DOM ---
const listContainer = document.getElementById('metas-list-container');
const formContainer = document.getElementById('metas-form-container');
const showCreateFormBtn = document.getElementById('btn-show-create-meta-form');

// --- Variável de Estado ---
let currentEditId = null; 

// --- Helpers de Data ---
function formatarDataParaInput(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
}
function getHojeFormatado() {
    return new Date().toISOString().split('T')[0];
}
// Começa no Domingo (dia 0)
function getInicioSemana(d) { 
    d = new Date(d);
    const day = d.getDay(); 
    const diff = d.getDate() - day; 
    return new Date(d.setDate(diff));
}
function getInicioMes(d) { 
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

// --- FUNÇÃO PRINCIPAL (Não muda) ---
export async function loadMetas() {
    formContainer.style.display = 'none';
    listContainer.style.display = 'block';
    showCreateFormBtn.style.display = 'block'; 
    renderMetaForm('Definir Nova Meta', {}, null, false); 
    loadAndRenderList(); 
}

// --- Funções de Formulário ---
function showCreateForm() {
    currentEditId = null;
    renderMetaForm('Definir Nova Meta', {}, null, true); 
}
if (showCreateFormBtn) {
    showCreateFormBtn.addEventListener('click', showCreateForm);
}

// [MODIFICADO] Mostra/esconde campos dinamicamente
function renderMetaForm(title = 'Definir Nova Meta', data = {}, editId = null, show = false) {
    currentEditId = editId; 

    const dataInicio = data.dataInicio ? formatarDataParaInput(data.dataInicio) : (editId ? '' : getHojeFormatado());
    const dataFim = data.dataFim ? formatarDataParaInput(data.dataFim) : '';
    
    // [MODIFICADO] Lógica de visibilidade
    let valorInicialDisplay = (data.tipo === 'Peso') ? 'block' : 'none';
    let periodoDisplay = (data.tipo === 'Treino') ? 'block' : 'none';
    
    let valorAlvoLabel = 'Valor Alvo';
    if (data.tipo === 'Treino') valorAlvoLabel = 'Frequência Alvo (vezes)';
    if (data.tipo === 'Água') valorAlvoLabel = 'Valor Alvo (Litros/dia)';
    if (data.tipo === 'Peso') valorAlvoLabel = 'Valor Alvo (kg)';

    formContainer.innerHTML = `
        <form id="meta-form" class="meta-form">
            <h4>${title}</h4>
            
            <label for="meta-tipo" class="input-label">Tipo da Meta:</label>
            <select id="meta-tipo" class="input-field" required ${editId ? 'disabled' : ''}>
                <option value="" disabled ${!data.tipo ? 'selected' : ''}>Selecione um tipo...</option>
                <option value="Peso" ${data.tipo === 'Peso' ? 'selected' : ''}>Meta de Peso (kg)</option>
                <option value="Água" ${data.tipo === 'Água' ? 'selected' : ''}>Meta de Água (Litros/dia)</option>
                <option value="Treino" ${data.tipo === 'Treino' ? 'selected' : ''}>Meta de Treino (Frequência)</option>
            </select>
            
            <div id="meta-periodo-group" style="display: ${periodoDisplay};">
                <label for="meta-periodo" class="input-label">Período:</label>
                <select id="meta-periodo" class="input-field">
                    <option value="Semana" ${data.periodo === 'Semana' ? 'selected' : ''}>Semanal</option>
                    <option value="Mês" ${data.periodo === 'Mês' ? 'selected' : ''}>Mensal</option>
                </select>
            </div>

            <div id="meta-inicial-group" style="display: ${valorInicialDisplay};">
                <label for="meta-inicial" class="input-label">Valor Inicial:</label>
                <input type="number" step="0.1" id="meta-inicial" class="input-field" placeholder="Ex: 82" value="${data.valorInicial || ''}">
            </div>
            
            <label for="meta-valor" class="input-label" id="label-valor-alvo">${valorAlvoLabel}:</label>
            <input type="number" step="0.1" id="meta-valor" class="input-field" placeholder="Ex: 75 (kg) ou 3 (Litros)" value="${data.valorAlvo || ''}" required>
            
            <label class="input-label" style="margin-top: 10px;">Período da Meta:</label>
            <div class="meta-form-grid">
                <input type="date" id="meta-inicio" class="input-field" value="${dataInicio}" required title="Data de Início">
                <input type="date" id="meta-fim" class="input-field" value="${dataFim}" title="Data Fim (Opcional)">
            </div>
            
            <button type="submit" class="btn btn-primary">${editId ? 'Salvar Alterações' : 'Definir Meta'}</button>
            <button type="button" id="btn-cancelar-meta" class="btn btn-secondary" style="margin-left: 10px; width: auto; display: inline-block;">Cancelar</button>
        </form>
    `;
    
    if (show) {
        formContainer.style.display = 'block';
        listContainer.style.display = 'none';
        showCreateFormBtn.style.display = 'none';
    } else {
        formContainer.style.display = 'none';
    }

    // [MODIFICADO] Event Listener do Tipo
    document.getElementById('meta-tipo').addEventListener('change', async (e) => {
        const tipo = e.target.value;
        const inicialInput = document.getElementById('meta-inicial');
        const valorLabel = document.getElementById('label-valor-alvo');
        const valorInput = document.getElementById('meta-valor');

        // Lógica de visibilidade
        document.getElementById('meta-inicial-group').style.display = (tipo === 'Peso') ? 'block' : 'none';
        document.getElementById('meta-periodo-group').style.display = (tipo === 'Treino') ? 'block' : 'none';
        
        if (tipo === 'Treino') {
            valorLabel.textContent = 'Frequência Alvo (vezes):';
            valorInput.placeholder = 'Ex: 5';
            valorInput.step = "1";
        } else if (tipo === 'Água') {
            valorLabel.textContent = 'Valor Alvo (Litros/dia):';
            valorInput.placeholder = 'Ex: 3';
            valorInput.step = "0.1";
            inicialInput.value = ''; // Água não tem valor inicial
        } else if (tipo === 'Peso') {
            valorLabel.textContent = 'Valor Alvo (kg):';
            valorInput.placeholder = 'Ex: 75';
            valorInput.step = "0.1";
            
            if (!editId) { 
                inicialInput.placeholder = "Carregando...";
                const pesoAtual = await fetchCurrentWeight();
                inicialInput.value = pesoAtual;
                inicialInput.placeholder = "Ex: 82";
            }
        }
    });
    
    document.getElementById('meta-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('btn-cancelar-meta').addEventListener('click', loadMetas);
}

// --- RENDERIZAÇÃO DA LISTA ---
async function loadAndRenderList() {
    listContainer.innerHTML = '<p class="info-message">Carregando metas e progresso...</p>';
    const token = localStorage.getItem('jwtToken');
    
    try {
        const [metasRes, diarioRes] = await Promise.all([
            fetch(`${API_URL}/metas`, { headers: { 'x-auth-token': token } }),
            fetch(`${API_URL}/diarios`, { headers: { 'x-auth-token': token } })
        ]);

        if (!metasRes.ok) throw new Error('Falha ao buscar metas.');
        if (!diarioRes.ok) throw new Error('Falha ao buscar dados do diário.');
        
        const metas = await metasRes.json();
        const diarios = await diarioRes.json();
        
        if (metas.length === 0) {
            listContainer.innerHTML = '<p class="info-message">Nenhuma meta definida ainda.</p>';
            return;
        }
        
        renderMetaList(metas, diarios);
        
    } catch (error) {
        console.error('Erro ao carregar lista de metas:', error);
        listContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
}

// [MODIFICADO] Divide a lógica de renderização em 3 tipos
function renderMetaList(metas, diarios) {
    listContainer.innerHTML = '<hr style="border: 1px solid #eee; margin: 2rem 0;"><h4>Metas Atuais</h4>'; 
    
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    
    // Processa os dados do diário UMA VEZ
    const diasTreinados = new Set();
    let aguaHoje = 0;
    
    diarios.forEach(d => {
        const diaStr = new Date(d.data).toISOString().split('T')[0];
        
        if (d.treinoRealizado && d.treinoRealizado.trim() !== '') {
            diasTreinados.add(diaStr);
        }
        if (diaStr === hojeStr) {
            aguaHoje = d.aguaLitros || 0;
        }
    });

    metas.forEach(meta => {
        
        // --- TIPO 1: PESO (Longo Prazo) ---
        if (meta.tipo === 'Peso') {
            let valorAtual = meta.valorInicial;
            const registrosRelevantes = diarios
                .filter(d => d.pesoKg > 0 && new Date(d.data) >= new Date(meta.dataInicio)) 
                .sort((a, b) => new Date(b.data) - new Date(a.data)); 
            if (registrosRelevantes.length > 0) {
                valorAtual = registrosRelevantes[0].pesoKg;
            }
            listContainer.innerHTML += renderCardValor(meta, calcularProgresso(meta.valorInicial, valorAtual, meta.valorAlvo), valorAtual);
        
        // --- TIPO 2: ÁGUA (Hábito Diário) ---
        } else if (meta.tipo === 'Água') {
            const progressoAgua = calcularProgresso(0, aguaHoje, meta.valorAlvo);
            listContainer.innerHTML += renderCardAgua(meta, progressoAgua, aguaHoje);
            
        // --- TIPO 3: TREINO (Hábito Periódico) ---
        } else if (meta.tipo === 'Treino') {
            const inicioPeriodo = meta.periodo === 'Mês' ? getInicioMes(hoje) : getInicioSemana(hoje);
            const fimPeriodo = meta.periodo === 'Mês' 
                ? new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0) 
                : new Date(inicioPeriodo.getFullYear(), inicioPeriodo.getMonth(), inicioPeriodo.getDate() + 6); 

            let treinosNoPeriodo = 0;
            const diasMarcados = new Set();
            
            diasTreinados.forEach(diaString => {
                const dia = new Date(diaString);
                dia.setUTCHours(4); 
                if (dia >= inicioPeriodo && dia <= fimPeriodo) {
                    treinosNoPeriodo++;
                    diasMarcados.add(dia.getUTCDate()); 
                }
            });
            const calendarioHtml = renderCalendario(meta.periodo, diasMarcados);
            listContainer.innerHTML += renderCardTreino(meta, treinosNoPeriodo, calendarioHtml);
        }
    });

    // Adiciona Listeners
    listContainer.querySelectorAll('.btn-edit-meta').forEach(btn => 
        btn.addEventListener('click', (e) => handleEditClick(e.target.dataset.id))
    );
    listContainer.querySelectorAll('.btn-delete-meta').forEach(btn => 
        btn.addEventListener('click', (e) => handleDeleteClick(e.target.dataset.id))
    );
}

// --- Funções de Renderização dos Cards ---

function calcularProgresso(inicio, atual, alvo) {
    const totalAlcancado = atual - inicio;
    const totalMeta = alvo - inicio;
    if (totalMeta === 0) return (totalAlcancado > 0 ? 100 : 0); 
    let progresso = (totalAlcancado / totalMeta) * 100;
    if (progresso < 0) progresso = 0;
    if (progresso > 100) progresso = 100;
    return progresso;
}

// (Não muda)
function renderCardValor(meta, progresso, valorAtual) {
    const dataInicioFormatada = new Date(meta.dataInicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
    let dataFimFormatada = 'Sem prazo';
    if (meta.dataFim) {
        dataFimFormatada = new Date(meta.dataFim).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
    }

    return `
        <div class="meta-card">
            <div class="meta-card-header">
                <strong>${meta.tipo} (Alvo: ${meta.valorAlvo} kg)</strong>
                <span class="meta-status status-andamento">${progresso.toFixed(0)}%</span>
            </div>
            <div class="meta-card-body">
                <p class="meta-card-progress">Início: ${meta.valorInicial} kg | Atual: ${valorAtual} kg</p>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${progresso}%;"></div>
                </div>
                <p class="meta-card-dates">
                    <small>Início: ${dataInicioFormatada} | Fim: ${dataFimFormatada}</small>
                </p>
            </div>
            <div class="action-buttons">
                <button class="btn btn-secondary btn-edit-meta" data-id="${meta._id}">Editar</button>
                <button class="btn btn-danger btn-delete-meta" data-id="${meta._id}">Excluir</button>
            </div>
        </div>
    `;
}

// [NOVO] Card específico para Água (Progresso Diário)
function renderCardAgua(meta, progresso, valorAtual) {
    return `
        <div class="meta-card meta-card-agua">
            <div class="meta-card-header">
                <strong>${meta.tipo} (Alvo: ${meta.valorAlvo} L)</strong>
                <span class="meta-status status-andamento">${progresso.toFixed(0)}%</span>
            </div>
            <div class="meta-card-body">
                <p class="meta-card-progress">Progresso de Hoje: ${valorAtual} L / ${meta.valorAlvo} L</p>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${progresso}%;"></div>
                </div>
            </div>
            <div class="action-buttons">
                <button class="btn btn-secondary btn-edit-meta" data-id="${meta._id}">Editar</button>
                <button class="btn btn-danger btn-delete-meta" data-id="${meta._id}">Excluir</button>
            </div>
        </div>
    `;
}


// (Não muda)
function renderCardTreino(meta, treinosFeitos, calendarioHtml) {
    const hoje = new Date();
    const mes = hoje.toLocaleDateString('pt-BR', { month: 'long' });
    const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
    
    const tituloCalendario = meta.periodo === 'Mês' 
        ? `${mesCapitalizado} ${hoje.getFullYear()}`
        : 'Esta Semana';
        
    return `
        <div class="meta-card">
            <div class="meta-card-header">
                <strong>Meta de Treino (${meta.periodo})</strong>
                <span class="meta-status status-andamento">
                    ${treinosFeitos} de ${meta.valorAlvo}
                </span>
            </div>
            <div class="meta-card-body">
                <p class="meta-card-progress">${tituloCalendario}</p>
                ${calendarioHtml}
            </div>
            <div class="action-buttons">
                <button class="btn btn-secondary btn-edit-meta" data-id="${meta._id}">Editar</button>
                <button class="btn btn-danger btn-delete-meta" data-id="${meta._id}">Excluir</button>
            </div>
        </div>
    `;
}

// (Não muda)
function renderCalendario(periodo, diasMarcados) {
    const hoje = new Date();
    const diaHoje = hoje.getUTCDate();
    const mesHoje = hoje.getUTCMonth();
    const anoHoje = hoje.getUTCFullYear();
    let html = '<div class="calendario-grid">';
    const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    diasSemana.forEach(dia => {
        html += `<div class="cal-dia cal-header">${dia}</div>`;
    });
    if (periodo === 'Semana') {
        const inicioSemana = getInicioSemana(hoje); 
        for (let i = 0; i < 7; i++) { 
            const diaAtual = new Date(inicioSemana);
            diaAtual.setUTCDate(diaAtual.getUTCDate() + i);
            const diaNum = diaAtual.getUTCDate();
            let classes = 'cal-dia';
            if (diaNum === diaHoje && diaAtual.getUTCMonth() === mesHoje && diaAtual.getUTCFullYear() === anoHoje) {
                classes += ' cal-hoje'; 
            }
            if (diasMarcados.has(diaNum)) { 
                classes += ' cal-treino'; 
            }
            html += `<div class="${classes}">${diaNum}</div>`;
        }
    } else { 
        const primeiroDia = new Date(anoHoje, mesHoje, 1).getUTCDay(); 
        const diasNoMes = new Date(anoHoje, mesHoje + 1, 0).getUTCDate(); 
        for (let i = 0; i < primeiroDia; i++) {
            html += '<div class="cal-dia cal-vazio"></div>';
        }
        for (let dia = 1; dia <= diasNoMes; dia++) {
            let classes = 'cal-dia';
            if (dia === diaHoje && mesHoje === hoje.getUTCMonth() && anoHoje === anoHoje) {
                classes += ' cal-hoje'; 
            }
            if (diasMarcados.has(dia)) { 
                classes += ' cal-treino'; 
            }
            html += `<div class="${classes}">${dia}</div>`;
        }
    }
    html += '</div>';
    return html;
}

// --- HANDLERS (Ações) ---

// [MODIFICADO] Validação atualizada
async function handleFormSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('jwtToken');
    const data = {
        tipo: document.getElementById('meta-tipo').value,
        valorInicial: parseFloat(document.getElementById('meta-inicial').value) || 0,
        valorAlvo: parseFloat(document.getElementById('meta-valor').value),
        dataInicio: document.getElementById('meta-inicio').value,
        dataFim: document.getElementById('meta-fim').value || null,
        periodo: document.getElementById('meta-periodo').value || null
    };
    
    if (!data.tipo || !data.valorAlvo || !data.dataInicio) {
        alert('Tipo, Valor Alvo e Data de Início são obrigatórios.');
        return;
    }
    
    // [NOVA VALIDAÇÃO]
    if (data.tipo === 'Treino') {
        if (!data.periodo) {
             alert('Selecione um Período (Semana/Mês) para a meta de Treino.');
             return;
        }
    }
    if (data.tipo === 'Peso') {
        if (data.valorInicial === 0) {
             alert('O Valor Inicial é obrigatório para metas de Peso.');
             return;
        }
        if (data.valorInicial === data.valorAlvo) {
             alert('O Valor Inicial não pode ser igual ao Valor Alvo.');
             return;
        }
    }

    try {
        const url = currentEditId ? `${API_URL}/metas/${currentEditId}` : `${API_URL}/metas`;
        const method = currentEditId ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Falha ao salvar a meta.');
        } 
        alert('Meta salva com sucesso!');
        loadMetas(); 
        if(window.loadNotificacoes) {
            window.loadNotificacoes();
        }
    } catch (error) {
        console.error('Erro ao salvar meta:', error);
        alert(error.message || 'Erro ao salvar. Verifique o console.');
    }
}

// (Não muda)
async function handleEditClick(id) {
    try {
        const token = localStorage.getItem('jwtToken');
        const res = await fetch(`${API_URL}/metas/${id}`, { 
            headers: { 'x-auth-token': token }
        });
        if (!res.ok) throw new Error('Falha ao buscar meta');
        const meta = await res.json();
        renderMetaForm('Editar Meta', meta, id, true); 
        window.scrollTo(0, 0); 
    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível carregar a meta para edição.');
    }
}

// (Não muda)
async function handleDeleteClick(id) {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) {
        return; 
    }
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`${API_URL}/metas/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Falha ao excluir.');
        alert('Meta excluída com sucesso.');
        loadMetas(); 
    } catch (error) {
        console.error('Erro ao excluir meta:', error);
        alert('Não foi possível excluir a meta.');
    }
}