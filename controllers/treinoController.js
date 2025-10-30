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

// --- FUNÇÕES CRUD ---

// 1. GERAR TREINOS ABC (Fluxo Novo)
// POST /api/treinos/gerar-abc
exports.gerarTreinosABC = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;

        // Limpa treinos antigos antes de gerar novos (opcional)
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

// 2. VISUALIZAR TODOS (Fluxo VR02)
// GET /api/treinos
exports.getTreinos = async (req, res) => {
    try {
        const treinos = await Treino.find({ usuario: req.usuario.id }).sort({ nome: 1 });
        res.json(treinos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 3. VISUALIZAR UM (Necessário para Edição)
// GET /api/treinos/:id
exports.getTreinoById = async (req, res) => {
    try {
        const treino = await Treino.findById(req.params.id);
        if (!treino) return res.status(404).json({ msg: 'Treino não encontrado' });

        // Validação de segurança (o treino é mesmo do usuário logado?)
        if (treino.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }
        res.json(treino);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 4. CADASTRAR TREINO (Fluxo RT01)
// POST /api/treinos
exports.createTreino = async (req, res) => {
    const { nome, grupoMuscular, exercicios } = req.body;

    // Validação (FE3.1)
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

// 5. EDITAR TREINO (Fluxo ER01)
// PUT /api/treinos/:id
exports.updateTreino = async (req, res) => {
    try {
        let treino = await Treino.findById(req.params.id);
        if (!treino) return res.status(404).json({ msg: 'Treino não encontrado' });

        if (treino.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        treino = await Treino.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, // Atualiza os campos enviados
            { new: true }       // Retorna o documento atualizado
        );
        res.json(treino);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 6. EXCLUIR TREINO (Fluxo XR01)
// DELETE /api/treinos/:id
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