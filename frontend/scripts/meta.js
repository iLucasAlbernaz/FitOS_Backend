import { API_URL } from './auth.js';

// --- Elementos DOM ---
const listContainer = document.getElementById('metas-list-container');
const formContainer = document.getElementById('metas-form-container');
const showCreateFormBtn = document.getElementById('btn-show-create-meta-form');

// --- Variável de Estado ---
let currentEditId = null; 

/**
 * Helper: Converte data do banco para 'YYYY-MM-DD' (para o input)
 */
function formatarDataParaInput(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
}
function getHojeFormatado() {
    return new Date().toISOString().split('T')[0];
}
// [MODIFICADO] getInicioSemana agora começa no DOMINGO (dia 0)
function getInicioSemana(d) { 
    d = new Date(d);
    const day = d.getDay(); // 0 = Domingo, 1 = Segunda...
    const diff = d.getDate() - day; // Volta para o Domingo
    return new Date(d.setDate(diff));
}
function getInicioMes(d) { // d = new Date()
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
// (Não muda)
function showCreateForm() {
    currentEditId = null;
    renderMetaForm('Definir Nova Meta', {}, null, true); 
}
if (showCreateFormBtn) {
    showCreateFormBtn.addEventListener('click', showCreateForm);
}

// (Não muda)
function renderMetaForm(title = 'Definir Nova Meta', data = {}, editId = null, show = false) {
    currentEditId = editId; 

    const dataInicio = data.dataInicio ? formatarDataParaInput(data.dataInicio) : (editId ? '' : getHojeFormatado());
    const dataFim = data.dataFim ? formatarDataParaInput(data.dataFim) : '';
    
    let valorInicialDisplay = (data.tipo === 'Peso' || data.tipo === 'Água') ? 'block' : 'none';
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
            
            <label for="meta-valor" class="input-label">${valorAlvoLabel}:</label>
            <input type="number" step="1" id="meta-valor" class="input-field" placeholder="Ex: 75 (kg) ou 5 (treinos)" value="${data.valorAlvo || ''}" required>
            
            <label class="input-label" style="margin-top: 10px;">Período da Meta:</label>
            <div class="meta-form-grid">
                <input type="date" id="meta-inicio" class="input-field" value="${dataInicio}" required title="Data de Início">
                <input type="date" id="meta-fim" class="input-field" value="${dataFim}" title="Data Fim (Opcional)">
            </div>
            
            <button type="submit" class="btn btn-primary">${editId ? 'Salvar Alterações' : 'Definir Meta'}</button>
            <button type="button" id="btn-cancelar-meta" class="btn btn-secondary">Cancelar</button>
        </form>
    `;
    
    if (show) {
        formContainer.style.display = 'block';
        listContainer.style.display = 'none';
        showCreateFormBtn.style.display = 'none';
    } else {
        formContainer.style.display = 'none';
    }

    // Event Listeners
    document.getElementById('meta-tipo').addEventListener('change', (e) => {
        const tipo = e.target.value;
        document.getElementById('meta-inicial-group').style.display = (tipo === 'Peso' || tipo === 'Água') ? 'block' : 'none';
        document.getElementById('meta-periodo-group').style.display = (tipo === 'Treino') ? 'block' : 'none';
        
        const labelValor = document.querySelector('label[for="meta-valor"]');
        if (tipo === 'Treino') labelValor.textContent = 'Frequência Alvo (vezes):';
        else if (tipo === 'Água') labelValor.textContent = 'Valor Alvo (Litros/dia):';
        else if (tipo === 'Peso') labelValor.textContent = 'Valor Alvo (kg):';
    });
    
    document.getElementById('meta-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('btn-cancelar-meta').addEventListener('click', loadMetas);
}

// --- RENDERIZAÇÃO DA LISTA ---
// (Não muda)
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

// (Não muda)
function renderMetaList(metas, diarios) {
    listContainer.innerHTML = '<h4>Metas Atuais</h4>'; 
    
    const hoje = new Date();
    
    const diasTreinados = new Set(diarios
        .filter(d => d.treinoRealizado && d.treinoRealizado.trim() !== '')
        .map(d => new Date(d.data).toISOString().split('T')[0])
    );
    
    metas.forEach(meta => {
        
        if (meta.tipo === 'Peso' || meta.tipo === 'Água') {
            let valorAtual = meta.valorInicial;
            let progresso = 0;
            const tipoDiario = meta.tipo === 'Peso' ? 'pesoKg' : 'aguaLitros';
            
            const registrosRelevantes = diarios
                .filter(d => d[tipoDiario] > 0 && new Date(d.data) >= new Date(meta.dataInicio)) 
                .sort((a, b) => new Date(b.data) - new Date(a.data)); 
                
            if (registrosRelevantes.length > 0) {
                valorAtual = registrosRelevantes[0][tipoDiario];
            }

            const totalAlcancado = valorAtual - meta.valorInicial;
            const totalMeta = meta.valorAlvo - meta.valorInicial;

            if (totalMeta !== 0) { 
                progresso = (totalAlcancado / totalMeta) * 100;
            }
            if (progresso < 0) progresso = 0;
            if (progresso > 100) progresso = 100;
            
            listContainer.innerHTML += renderCardValor(meta, progresso, valorAtual);

        } else if (meta.tipo === 'Treino') {
            
            const inicioPeriodo = meta.periodo === 'Mês' ? getInicioMes(hoje) : getInicioSemana(hoje);
            const fimPeriodo = meta.periodo === 'Mês' 
                ? new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0) 
                : new Date(inicioPeriodo.getFullYear(), inicioPeriodo.getMonth(), inicioPeriodo.getDate() + 6); 

            let treinosNoPeriodo = 0;
            const diasTreinadosNoPeriodo = new Set();
            
            diasTreinados.forEach(diaString => {
                const dia = new Date(diaString);
                dia.setUTCHours(4); 
                
                if (dia >= inicioPeriodo && dia <= fimPeriodo) {
                    treinosNoPeriodo++;
                    diasTreinadosNoPeriodo.add(dia.getUTCDate()); 
                }
            });
            
            const calendarioHtml = renderCalendario(meta.periodo, diasTreinadosNoPeriodo);
            
            listContainer.innerHTML += renderCardTreino(meta, treinosNoPeriodo, calendarioHtml);
        }
    });

    listContainer.querySelectorAll('.btn-edit-meta').forEach(btn => 
        btn.addEventListener('click', (e) => handleEditClick(e.target.dataset.id))
    );
    listContainer.querySelectorAll('.btn-delete-meta').forEach(btn => 
        btn.addEventListener('click', (e) => handleDeleteClick(e.target.dataset.id))
    );
}

// --- Funções de Renderização dos Cards ---
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
                <strong>${meta.tipo} (Alvo: ${meta.valorAlvo})</strong>
                <span class="meta-status status-andamento">${progresso.toFixed(0)}%</span>
            </div>
            <div class="meta-card-body">
                <p class="meta-card-progress">Início: ${meta.valorInicial} | Atual: ${valorAtual}</p>
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
function renderCalendario(periodo, diasTreinados) {
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
        const inicioSemana = getInicioSemana(hoje); // Começa no Domingo
        
        for (let i = 0; i < 7; i++) { 
            const diaAtual = new Date(inicioSemana);
            diaAtual.setUTCDate(diaAtual.getUTCDate() + i);
            
            const diaNum = diaAtual.getUTCDate();
            
            let classes = 'cal-dia';
            if (diaNum === diaHoje && diaAtual.getUTCMonth() === mesHoje && diaAtual.getUTCFullYear() === anoHoje) {
                classes += ' cal-hoje'; 
            }
            if (diasTreinados.has(diaNum)) {
                classes += ' cal-treino'; 
            }
            
            html += `<div class="${classes}">${diaNum}</div>`;
        }
        
    } else { 
        const primeiroDia = new Date(anoHoje, mesHoje, 1).getUTCDay(); // 0=Domingo
        const diasNoMes = new Date(anoHoje, mesHoje + 1, 0).getUTCDate(); 
        
        for (let i = 0; i < primeiroDia; i++) {
            html += '<div class="cal-dia cal-vazio"></div>';
        }
        
        for (let dia = 1; dia <= diasNoMes; dia++) {
            let classes = 'cal-dia';
            if (dia === diaHoje && mesHoje === hoje.getUTCMonth() && anoHoje === hoje.getUTCFullYear()) {
                classes += ' cal-hoje'; 
            }
            if (diasTreinados.has(dia)) {
                classes += ' cal-treino'; 
            }
            
            html += `<div class="${classes}">${dia}</div>`;
        }
    }
    
    html += '</div>';
    return html;
}


// --- HANDLERS (Ações) ---

// (Não muda)
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
    
    if (data.tipo === 'Treino' && !data.periodo) {
         alert('Selecione um Período (Semana/Mês) para a meta de Treino.');
         return;
    }
    if ((data.tipo === 'Peso' || data.tipo === 'Água') && data.valorInicial === 0) {
         alert('O Valor Inicial é obrigatório para metas de Peso e Água.');
         return;
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
        loadMetas(); // Reseta o form e recarrega a lista

    } catch (error) {
        console.error('Erro ao salvar meta:', error);
        alert(error.message || 'Erro ao salvar. Verifique o console.');
    }
}

// [MODIFICADO] A linha com o erro de digitação foi corrigida
async function handleEditClick(id) {
    try {
        const token = localStorage.getItem('jwtToken');
        const res = await fetch(`${API_URL}/metas/${id}`, { 
            headers: { 'x-auth-token': token }
        });
        if (!res.ok) throw new Error('Falha ao buscar meta');
        
        const meta = await res.json();
        
        // [CORREÇÃO] Chamando renderMetaForm (com "Meta")
        renderMetaForm('Editar Meta', meta, id, true); // true = mostrar
        window.scrollTo(0, 0); 

    } catch (error) {
        console.error('Erro:', error); // Linha 436 do erro original
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