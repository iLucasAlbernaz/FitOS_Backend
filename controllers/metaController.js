const Meta = require('../models/Meta');

// 1. VISUALIZAR METAS (Fluxo VM01)
// GET /api/metas
exports.getMetas = async (req, res) => {
    try {
        const metas = await Meta.find({ usuario: req.usuario.id }).sort({ prazo: 1 });
        res.json(metas);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 2. DEFINIR META (Fluxo DM01)
// POST /api/metas
exports.createMeta = async (req, res) => {
    const { tipo, valorAlvo, prazo } = req.body;

    // Validação (FE9.1 / FE9.2)
    if (!tipo || !valorAlvo) {
        return res.status(400).json({ msg: 'Tipo da Meta e Valor Alvo são obrigatórios.' });
    }
    if (valorAlvo <= 0) {
        return res.status(400).json({ msg: 'O Valor Alvo deve ser um número positivo.' });
    }

    try {
        const novaMeta = new Meta({
            usuario: req.usuario.id,
            tipo,
            valorAlvo,
            prazo: prazo ? prazo : null, // Salva nulo se o prazo vier vazio
            status: 'Em Andamento'
        });

        const meta = await novaMeta.save();
        res.status(201).json(meta);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 3. EDITAR META (Fluxo EM01)
// PUT /api/metas/:id
exports.updateMeta = async (req, res) => {
    try {
        let meta = await Meta.findById(req.params.id);
        if (!meta) return res.status(404).json({ msg: 'Meta não encontrada' });

        if (meta.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        // Validação (FE9.1 / FE9.2)
        const { valorAlvo } = req.body;
        if (valorAlvo && valorAlvo <= 0) {
            return res.status(400).json({ msg: 'O Valor Alvo deve ser um número positivo.' });
        }

        meta = await Meta.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.json(meta);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 4. EXCLUIR META (Fluxo XM01)
// DELETE /api/metas/:id
exports.deleteMeta = async (req, res) => {
    try {
        let meta = await Meta.findById(req.params.id);
        if (!meta) return res.status(404).json({ msg: 'Meta não encontrada' });

        if (meta.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        await Meta.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Meta removida com sucesso.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};