const Dieta = require('../models/Dieta');
const Usuario = require('../models/Usuario');
const axios = require('axios'); 

// --- [ATUALIZADO] TEMPLATES PADRÃO (com Lanches e Totais) ---
const templatePerdaPeso = {
    nome: "Perda de Peso (Padrão)",
    cafeDaManha: {
        alimentos: [{ nome: 'Ovo Cozido', porcao: '2 unidades', calorias: 140, proteinas: 12, carboidratos: 1, gorduras: 10 }],
        totais: { calorias: 140, proteinas: 12, carboidratos: 1, gorduras: 10 }
    },
    almoco: {
        alimentos: [{ nome: 'Filé de Frango', porcao: '120g', calorias: 180, proteinas: 35, carboidratos: 0, gorduras: 3 }],
        totais: { calorias: 180, proteinas: 35, carboidratos: 0, gorduras: 3 }
    },
    jantar: {
        alimentos: [{ nome: 'Salmão Grelhado', porcao: '100g', calorias: 200, proteinas: 22, carboidratos: 0, gorduras: 12 }],
        totais: { calorias: 200, proteinas: 22, carboidratos: 0, gorduras: 12 }
    },
    lanches: {
        alimentos: [{ nome: 'Iogurte Natural', porcao: '1 pote', calorias: 100, proteinas: 10, carboidratos: 15, gorduras: 0 }],
        totais: { calorias: 100, proteinas: 10, carboidratos: 15, gorduras: 0 }
    },
    totais: { calorias: 620, proteinas: 79, carboidratos: 16, gorduras: 25 }
};

const templateGanhoMassa = {
    nome: "Ganho de Massa (Padrão)",
    cafeDaManha: {
        alimentos: [{ nome: 'Ovos Mexidos', porcao: '4 unidades', calorias: 280, proteinas: 24, carboidratos: 2, gorduras: 20 }],
        totais: { calorias: 280, proteinas: 24, carboidratos: 2, gorduras: 20 }
    },
    almoco: {
        alimentos: [{ nome: 'Patinho Moído', porcao: '150g', calorias: 250, proteinas: 38, carboidratos: 0, gorduras: 10 }],
        totais: { calorias: 250, proteinas: 38, carboidratos: 0, gorduras: 10 }
    },
    jantar: {
        alimentos: [{ nome: 'Filé de Tilápia', porcao: '150g', calorias: 200, proteinas: 40, carboidratos: 0, gorduras: 3 }],
        totais: { calorias: 200, proteinas: 40, carboidratos: 0, gorduras: 3 }
    },
    lanches: {
        alimentos: [{ nome: 'Shake de Whey', porcao: '1 scoop', calorias: 120, proteinas: 25, carboidratos: 3, gorduras: 1 }],
        totais: { calorias: 120, proteinas: 25, carboidratos: 3, gorduras: 1 }
    },
    totais: { calorias: 850, proteinas: 127, carboidratos: 5, gorduras: 34 }
};

// --- ROTA: Gerar Plano Padrão (Gemini/Templates) ---
exports.gerarMeuPlano = async (req, res) => {
    const { tipoPlano } = req.body; 
    const usuarioId = req.usuario.id;
    let templateEscolhido;
    if (tipoPlano === 'perda-peso') templateEscolhido = templatePerdaPeso;
    else if (tipoPlano === 'ganho-massa') templateEscolhido = templateGanhoMassa;
    else return res.status(400).json({ msg: 'Tipo de plano inválido.' });
    
    try {
        await Dieta.findOneAndDelete({ usuario: usuarioId });
        
        const novoPlano = new Dieta({
            usuario: usuarioId,
            nomePlano: templateEscolhido.nome,
            cafeDaManha: templateEscolhido.cafeDaManha,
            almoco: templateEscolhido.almoco,
            jantar: templateEscolhido.jantar,
            lanches: templateEscolhido.lanches, // Salva os lanches
            totais: templateEscolhido.totais    // Salva os totais
        });
        
        await novoPlano.save();
        res.status(201).json(novoPlano);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro interno do servidor ao gerar plano.');
    }
};

// --- ROTA: Gerar Plano (IA Profissional Spoonacular) ---
exports.gerarPlanoSpoonacular = async (req, res) => {
    const usuarioId = req.usuario.id;

    try {
        // 1. [Request 1] Buscar o perfil do usuário
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuário não encontrado.' });
        }
        
        const { principal } = usuario.objetivos;
        
        // 2. Definir parâmetros para o Spoonacular
        let targetCalories = 2200; // Padrão
        
        if (principal === 'Perda de Peso') {
            targetCalories = 1800;
        } else if (principal === 'Ganho de Massa') {
            targetCalories = 2800;
        }
        // (Se for 'Manutenção', usa o padrão 2200)

        // 3. Chamar a API do Spoonacular
        const response = await axios.get('https://api.spoonacular.com/mealplanner/generate', {
            params: {
                apiKey: process.env.SPOONACULAR_API_KEY,
                timeFrame: 'day',
                targetCalories: targetCalories
            }
        });

        const mealPlan = response.data;
        
        // 4. Mapear a resposta para o nosso modelo de Dieta
        const [cafe, almoco, jantar] = mealPlan.meals;
        const { calories, protein, fat, carbohydrates } = mealPlan.nutrients;
        
        // Função auxiliar para formatar
        const formatarRefeicao = (meal) => ({
            alimentos: [
                {
                    nome: meal.title,
                    porcao: `Pronto em ${meal.readyInMinutes} min`,
                    calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 
                }
            ],
            // Totais por refeição (Spoonacular não fornece isso no plano diário)
            totais: { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 } 
        });

        // 5. Salvar o novo plano
        await Dieta.findOneAndDelete({ usuario: usuarioId });
        
        const novoPlano = new Dieta({
            usuario: usuarioId,
            nomePlano: `IA Profissional (${principal})`,
            cafeDaManha: formatarRefeicao(cafe),
            almoco: formatarRefeicao(almoco),
            jantar: formatarRefeicao(jantar),
            lanches: null, // A API 'generate' não retorna lanches, então deixamos nulo
            totais: { // Salva os totais do dia no campo 'totais'
                calorias: calories,
                proteinas: protein,
                carboidratos: carbohydrates,
                gorduras: fat
            }
        });

        await novoPlano.save();
        res.status(201).json(novoPlano);

    } catch (error) {
        console.error("Erro na API do Spoonacular:", error.response ? error.response.data : error.message);
        res.status(503).json({ msg: 'O serviço de planos de dieta está indisponível. Tente novamente mais tarde.' });
    }
};

// --- ROTA: Buscar Plano Atual ---
exports.getMeuPlano = async (req, res) => {
    try {
        const dieta = await Dieta.findOne({ usuario: req.usuario.id });
        if (!dieta) {
            return res.status(404).json({ msg: 'Nenhum plano alimentar disponível no momento.' });
        }
        res.json(dieta);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro ao carregar o plano de dieta.');
    }
};