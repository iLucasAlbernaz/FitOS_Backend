 const Dieta = require('../models/Dieta');
const Usuario = require('../models/Usuario');
const axios = require('axios'); 

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

// --- Helper: Busca os macros de UM prato (1 chamada de API) ---
async function getRecipeMacros(recipeId) {
    try {
        const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/nutritionWidget.json`, {
            params: { apiKey: SPOONACULAR_API_KEY }
        });
        const data = response.data;
        return {
            calorias: parseFloat(data.calories) || 0,
            proteinas: parseFloat(data.protein.replace('g', '')) || 0,
            carboidratos: parseFloat(data.carbs.replace('g', '')) || 0,
            gorduras: parseFloat(data.fat.replace('g', '')) || 0,
        };
    } catch (error) {
        console.error(`Erro ao buscar macros para ID ${recipeId}:`, error.message);
        return { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 };
    }
}

// --- Helper: Formata a refeição para o nosso Modelo ---
function formatarRefeicao(meal, macros) {
    return {
        alimentos: [
            {
                nome: meal.title,
                porcao: `Pronto em ${meal.readyInMinutes} min`
            }
        ],
        totais: macros // Agora temos os macros corretos!
    };
}


// --- ROTA: Gerar Plano (IA Profissional Spoonacular) ---
exports.gerarPlanoSpoonacular = async (req, res) => {
    const usuarioId = req.usuario.id;

    try {
        // 1. Buscar o perfil do usuário para ler o objetivo
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuário não encontrado.' });
        }
        
        const { principal } = usuario.objetivos;
        
        // 2. Definir calorias com base no objetivo
        let targetCalories = 2200; // Padrão (Manutenção)
        
        if (principal === 'Perda de Peso') {
            targetCalories = 1800;
        } else if (principal === 'Ganho de Massa') {
            targetCalories = 2800;
        }

        // 3. Chamar a API (1ª chamada)
        const planResponse = await axios.get('https://api.spoonacular.com/mealplanner/generate', {
            params: {
                apiKey: SPOONACULAR_API_KEY,
                timeFrame: 'day',
                targetCalories: targetCalories
            }
        });

        const mealPlan = planResponse.data;
        const [cafe, almoco, jantar] = mealPlan.meals;
        const { calories, protein, fat, carbohydrates } = mealPlan.nutrients; // Totais do Dia

        // 4. [A MÁGICA] Chamar a API +3 vezes para buscar os macros de CADA refeição
        const [macrosCafe, macrosAlmoco, macrosJantar] = await Promise.all([
            getRecipeMacros(cafe.id),
            getRecipeMacros(almoco.id),
            getRecipeMacros(jantar.id)
        ]);
        
        // 5. Salvar o novo plano
        await Dieta.findOneAndDelete({ usuario: usuarioId });
        
        const novoPlano = new Dieta({
            usuario: usuarioId,
            nomePlano: `IA Profissional (${principal})`, 
            cafeDaManha: formatarRefeicao(cafe, macrosCafe),
            almoco: formatarRefeicao(almoco, macrosAlmoco),
            jantar: formatarRefeicao(jantar, macrosJantar),
            // 'lanche' não é retornado por esta API
            totais: { 
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
        res.status(503).json({ msg: 'O serviço de planos de dieta (Spoonacular) está indisponível. Tente novamente mais tarde.' });
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

    // ROTA: Buscar Plano Atual
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