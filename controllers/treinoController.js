const Treino = require('../models/Treino');

// --- TEMPLATES ABC (Sua Solicitação) ---
const treinoATemplate = {
    nome: 'Treino A',
    grupoMuscular: 'Peito, Tríceps e Ombros',
    exercicios: [
        { nome: 'Supino Reto (Barra)', series: '3', repeticoes: '8-12' },
        { nome: 'Supino Inclinado (Halteres)', series: '3', repeticoes: '10' },
        { nome: 'Crucifixo (Halteres ou Máquina)', series: '3', repeticoes: '12-15' },
        { nome: 'Tríceps Pulley (Corda)', series: '3', repeticoes: '12-15' },
        { nome: 'Desenvolvimento (Halteres)', series: '3', repeticoes: '10' }
    ]
};

const treinoBTemplate = {
    nome: 'Treino B',
    grupoMuscular: 'Costas e Bíceps',
    exercicios: [
        { nome: 'Puxada Frontal (Pulley)', series: '3', repeticoes: '10-12' },
        { nome: 'Remada Curvada (Barra)', series: '3', repeticoes: '8-10' },
        { nome: 'Remada Baixa (Triângulo)', series: '3', repeticoes: '10-12' },
        { nome: 'Rosca Direta (Barra)', series: '3', repeticoes: '10' },
        { nome: 'Rosca Alternada (Halteres)', series: '3', repeticoes: '12' }
    ]
};

const treinoCTemplate = {
    nome: 'Treino C',
    grupoMuscular: 'Pernas (Completo)',
    exercicios: [
        { nome: 'Agachamento Livre (Barra)', series: '4', repeticoes: '8-10' },
        { nome: 'Leg Press 45°', series: '3', repeticoes: '10-12' },
        { nome: 'Cadeira Extensora', series: '3', repeticoes: '15' },
        { nome: 'Mesa Flexora', series: '3', repeticoes: '12-15' },
        { nome: 'Panturrilha (Máquina)', series: '4', repeticoes: '15-20' }
    ]
};

exports.gerarTreinosABC = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;

        await Treino.deleteMany({ usuario: usuarioId });

        const treinosParaSalvar = [
            { ...treinoATemplate, usuario: usuarioId },
            { ...treinoBTemplate, usuario: usuarioId },
            { ...treinoCTemplate, usuario: usuarioId }
        ];

        await Treino.insertMany(treinosParaSalvar);
        res.status(201).json({ msg: 'Treinos ABC gerados com sucesso!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

exports.getTreinos = async (req, res) => {
    try {
        const treinos = await Treino.find({ usuario: req.usuario.id }).sort({ nome: 1 });
        res.json(treinos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

exports.getTreinoById = async (req, res) => {
    try {
        const treino = await Treino.findById(req.params.id);
        if (!treino) return res.status(404).json({ msg: 'Treino não encontrado' });

        if (treino.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }
        res.json(treino);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

exports.createTreino = async (req, res) => {
    const { nome, grupoMuscular, exercicios } = req.body;

    if (!nome || !grupoMuscular || !exercicios || exercicios.length === 0) {
        return res.status(400).json({ msg: 'Por favor, preencha todos os campos e adicione ao menos um exercício.' });
    }

    try {
        const novoTreino = new Treino({
            usuario: req.usuario.id,
            nome,
            grupoMuscular,
            exercicios
        });

        const treino = await novoTreino.save();
        res.status(201).json(treino);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

exports.updateTreino = async (req, res) => {
    try {
        let treino = await Treino.findById(req.params.id);
        if (!treino) return res.status(404).json({ msg: 'Treino não encontrado' });

        if (treino.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        treino = await Treino.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, 
            { new: true }       
        );
        res.json(treino);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

exports.deleteTreino = async (req, res) => {
    try {
        let treino = await Treino.findById(req.params.id);
        if (!treino) return res.status(404).json({ msg: 'Treino não encontrado' });

        if (treino.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        await Treino.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Treino removido com sucesso.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};