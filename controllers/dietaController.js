const Dieta = require('../models/Dieta');
const Usuario = require('../models/Usuario');

// --- (Os templates 'templatePerdaPeso' e 'templateGanhoMassa' continuam os mesmos) ---
const templatePerdaPeso = {
    cafeDaManha: {
        alimentos: [
            { nome: 'Ovo Cozido', porcao: '2 unidades', calorias: 140, proteinas: 12, carboidratos: 1, gorduras: 10 },
            { nome: 'Mamão Papaia', porcao: '1/2 unidade', calorias: 60, proteinas: 1, carboidratos: 15, gorduras: 0 }
        ],
        totais: { calorias: 200, proteinas: 13, carboidratos: 16, gorduras: 10 }
    },
    almoco: {
        alimentos: [
            { nome: 'Filé de Frango Grelhado', porcao: '120g', calorias: 180, proteinas: 35, carboidratos: 0, gorduras: 3 },
            { nome: 'Arroz Integral', porcao: '1 xícara', calorias: 215, proteinas: 5, carboidratos: 45, gorduras: 2 },
            { nome: 'Salada de Folhas Verdes', porcao: 'à vontade', calorias: 30, proteinas: 2, carboidratos: 5, gorduras: 0 }
        ],
        totais: { calorias: 425, proteinas: 42, carboidratos: 50, gorduras: 5 }
    },
    jantar: {
        alimentos: [
            { nome: 'Posta de Salmão', porcao: '100g', calorias: 200, proteinas: 22, carboidratos: 0, gorduras: 12 },
            { nome: 'Brócolis no Vapor', porcao: '1 xícara', calorias: 55, proteinas: 4, carboidratos: 11, gorduras: 1 }
        ],
        totais: { calorias: 255, proteinas: 26, carboidratos: 11, gorduras: 13 }
    }
};

const templateGanhoMassa = {
    cafeDaManha: {
        alimentos: [
            { nome: 'Ovos Mexidos', porcao: '4 unidades', calorias: 280, proteinas: 24, carboidratos: 2, gorduras: 20 },
            { nome: 'Batata Doce Cozida', porcao: '150g', calorias: 130, proteinas: 2, carboidratos: 30, gorduras: 0 },
            { nome: 'Banana', porcao: '1 unidade', calorias: 105, proteinas: 1, carboidratos: 27, gorduras: 0 }
        ],
        totais: { calorias: 515, proteinas: 27, carboidratos: 59, gorduras: 20 }
    },
    almoco: {
        alimentos: [
            { nome: 'Patinho Moído', porcao: '150g', calorias: 250, proteinas: 38, carboidratos: 0, gorduras: 10 },
            { nome: 'Arroz Branco', porcao: '1.5 xícara', calorias: 300, proteinas: 6, carboidratos: 65, gorduras: 1 },
            { nome: 'Feijão Carioca', porcao: '1 concha', calorias: 130, proteinas: 8, carboidratos: 23, gorduras: 1 }
        ],
        totais: { calorias: 680, proteinas: 52, carboidratos: 88, gorduras: 12 }
    },
    jantar: {
        alimentos: [
            { nome: 'Filé de Tilápia', porcao: '150g', calorias: 200, proteinas: 40, carboidratos: 0, gorduras: 3 },
            { nome: 'Macarrão Integral', porcao: '1 prato', calorias: 350, proteinas: 14, carboidratos: 70, gorduras: 2 }
        ],
        totais: { calorias: 550, proteinas: 54, carboidratos: 70, gorduras: 5 }
    }
};

// --- (getMeuPlano não muda) ---
exports.getMeuPlano = async (req, res) => {
    try {
        const dieta = await Dieta.findOne({ usuario: req.usuario.id });

        if (!dieta) {
            return res.status(404).json({ msg: 'Nenhum plano alimentar disponível no momento.' });
        }
        res.json(dieta);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro ao carregar o plano de dieta. Tente novamente mais tarde.');
    }
};


// @route   POST /api/dieta/gerar
// @desc    Gera (cria) um novo plano de dieta para o usuário
// @access  Privado
exports.gerarMeuPlano = async (req, res) => {
    const { tipoPlano } = req.body; 
    const usuarioId = req.usuario.id;

    let templateEscolhido;
    let nomePlanoParaSalvar; // <-- Variável adicionada

    if (tipoPlano === 'perda-peso') {
        templateEscolhido = templatePerdaPeso;
        nomePlanoParaSalvar = 'Perda de Peso'; // <-- Nome salvo
    } else if (tipoPlano === 'ganho-massa') {
        templateEscolhido = templateGanhoMassa;
        nomePlanoParaSalvar = 'Ganho de Massa'; // <-- Nome salvo
    } else {
        return res.status(400).json({ msg: 'Tipo de plano inválido.' });
    }

    try {
        await Dieta.findOneAndDelete({ usuario: usuarioId });

        const novoPlano = new Dieta({
            usuario: usuarioId,
            nomePlano: nomePlanoParaSalvar, // <-- CAMPO NOVO SENDO SALVO
            cafeDaManha: templateEscolhido.cafeDaManha,
            almoco: templateEscolhido.almoco,
            jantar: templateEscolhido.jantar,
            lanches: templateEscolhido.lanches 
        });

        await novoPlano.save();
        res.status(201).json(novoPlano);

    } catch (err) {
        console.error('Erro ao salvar no banco:', err.message);
        res.status(500).send('Erro interno do servidor ao gerar plano.');
    }
};