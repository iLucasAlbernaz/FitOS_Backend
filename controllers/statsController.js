const Diario = require('../models/Diario');
const Meta = require('../models/Meta');

// --- Helpers de Data (copiados de meta.js) ---
function getInicioSemana(d) { 
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}
function getInicioMes(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
// --- Fim dos Helpers ---


/**
 * @route   GET /api/stats/dashboard
 * @desc    Busca dados agregados para os gráficos do painel
 * @access  Private
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.usuario.id;
        const hoje = new Date();
        
        // --- 1. DADOS DE EVOLUÇÃO DO PESO ---
        // Busca os últimos 12 meses de registros do diário (ou todos, se forem poucos)
        const registrosDiario = await Diario.find({ 
            usuario: userId,
            pesoKg: { $gt: 0 } // Apenas registros que contenham peso
        }).sort({ data: 1 }); // Ordena do mais antigo para o mais novo

        let weightData = {
            labels: [],
            data: []
        };
        
        if (registrosDiario.length < 2) {
            // (FE3.1) Dados insuficientes
            weightData = null;
        } else {
            registrosDiario.forEach(d => {
                weightData.labels.push(new Date(d.data).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' }));
                weightData.data.push(d.pesoKg);
            });
        }

        // --- 2. DADOS DE FREQUÊNCIA DE TREINO ---
        let workoutData = {
            completed: 0,
            total: 0,
            periodo: 'Semana'
        };

        // Busca a meta de treino ativa do usuário
        const metaTreino = await Meta.findOne({ 
            usuario: userId, 
            tipo: 'Treino', 
            status: 'Em Andamento' 
        });

        if (!metaTreino) {
            // (FE3.1) Sem meta, não há dados
            workoutData = null;
        } else {
            workoutData.total = metaTreino.valorAlvo;
            workoutData.periodo = metaTreino.periodo;

            // Define o início do período (Semana ou Mês)
            const inicioPeriodo = metaTreino.periodo === 'Mês' ? getInicioMes(hoje) : getInicioSemana(hoje);
            
            // Conta quantos dias o usuário registrou treino no diário DENTRO do período
            const treinosNoPeriodo = await Diario.countDocuments({
                usuario: userId,
                treinoRealizado: { $ne: null, $ne: "" },
                data: { $gte: inicioPeriodo, $lte: hoje }
            });
            
            workoutData.completed = treinosNoPeriodo;
        }

        // --- 3. DADOS DE MACROS (Não implementado) ---
        // (Seria implementado aqui quando o Diário for atualizado)
        const macroData = null;


        res.json({ weightData, workoutData, macroData });

    } catch (error) {
        console.error("Erro ao gerar estatísticas:", error.message);
        // (FE3.2) Erro de Carregamento
        res.status(500).json({ msg: 'Erro ao carregar o painel de desempenho. Tente novamente mais tarde.' });
    }
};