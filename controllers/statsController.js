const Diario = require('../models/Diario');
const Meta = require('../models/Meta'); // <-- [ADICIONADO]

// --- Helpers de Data ---
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
        const registrosDiario = await Diario.find({ 
            usuario: userId,
            pesoKg: { $gt: 0 } 
        }).sort({ data: 1 }); 

        // [MODIFICADO] Busca a meta de peso ativa
        const metaPeso = await Meta.findOne({
            usuario: userId,
            tipo: 'Peso',
            status: 'Em Andamento'
        });

        let weightData = {
            labels: [],
            data: [],
            goalData: [] // [NOVO] Array para a linha da meta
        };
        
        if (registrosDiario.length < 2) {
            weightData = null;
        } else {
            registrosDiario.forEach(d => {
                weightData.labels.push(new Date(d.data).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' }));
                weightData.data.push(d.pesoKg);
                
                // Adiciona o valor da meta (ou null) para cada ponto de dado
                weightData.goalData.push(metaPeso ? metaPeso.valorAlvo : null);
            });
        }

        // --- 2. DADOS DE FREQUÊNCIA DE TREINO ---
        let workoutData = {
            completed: 0,
            total: 0,
            periodo: 'Semana'
        };

        const metaTreino = await Meta.findOne({ 
            usuario: userId, 
            tipo: 'Treino', 
            status: 'Em Andamento' 
        });

        if (!metaTreino) {
            workoutData = null;
        } else {
            workoutData.total = metaTreino.valorAlvo;
            workoutData.periodo = metaTreino.periodo;

            const inicioPeriodo = metaTreino.periodo === 'Mês' ? getInicioMes(hoje) : getInicioSemana(hoje);
            
            const treinosNoPeriodo = await Diario.countDocuments({
                usuario: userId,
                treinoRealizado: { $ne: null, $ne: "" },
                data: { $gte: inicioPeriodo, $lte: hoje }
            });
            
            workoutData.completed = treinosNoPeriodo;
        }

        // --- 3. DADOS DE MACROS (Não implementado) ---
        const macroData = null;


        res.json({ weightData, workoutData, macroData });

    } catch (error) {
        console.error("Erro ao gerar estatísticas:", error.message);
        res.status(500).json({ msg: 'Erro ao carregar o painel de desempenho. Tente novamente mais tarde.' });
    }
};