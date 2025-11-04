const Receita = require('../models/Receita');

// 1. VISUALIZAR RECEITAS (Fluxo RC01)
// GET /api/receitas
exports.getReceitas = async (req, res) => {
    try {
        const receitas = await Receita.find({ usuario: req.usuario.id }).sort({ createdAt: -1 });
        res.json(receitas);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 2. VISUALIZAR UMA (Para Edição)
// GET /api/receitas/:id
exports.getReceitaById = async (req, res) => {
    try {
        const receita = await Receita.findById(req.params.id);
        if (!receita) return res.status(404).json({ msg: 'Receita não encontrada' });

        if (receita.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }
        res.json(receita);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 3. CRIAR RECEITA (Fluxo RC01)
// POST /api/receitas
exports.createReceita = async (req, res) => {
    // Pega os dados estruturados do body
    const { nome, descricao, ingredientes, modoPreparo, macros } = req.body;

    // Validação (FE3.1)
    if (!nome || !descricao || !ingredientes || ingredientes.length === 0 || !macros) {
        return res.status(400).json({ msg: 'Nome, Descrição, Macros e ao menos um Ingrediente são obrigatórios.' });
    }
    // Validação (FE3.2)
    if (macros.calorias < 0 || macros.proteinas < 0 || macros.carboidratos < 0 || macros.gorduras < 0) {
         return res.status(400).json({ msg: 'Valores nutricionais não podem ser negativos.' });
    }

    try {
        const novaReceita = new Receita({
            usuario: req.usuario.id,
            nome,
            descricao,
            ingredientes,
            modoPreparo,
            macros
        });

        const receita = await novaReceita.save();
        res.status(201).json(receita);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 4. EDITAR RECEITA (Fluxo ER01)
// PUT /api/receitas/:id
exports.updateReceita = async (req, res) => {
    try {
        let receita = await Receita.findById(req.params.id);
        if (!receita) return res.status(404).json({ msg: 'Receita não encontrada' });

        if (receita.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        receita = await Receita.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, 
            { new: true }       
        );
        res.json(receita);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 5. EXCLUIR RECEITA (Fluxo XR01)
// DELETE /api/receitas/:id
exports.deleteReceita = async (req, res) => {
    try {
        let receita = await Receita.findById(req.params.id);
        if (!receita) return res.status(404).json({ msg: 'Receita não encontrada' });

        if (receita.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        await Receita.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Receita removida com sucesso.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};