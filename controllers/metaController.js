const Meta = require('../models/Meta');

// 1. VISUALIZAR METAS (Não muda)
exports.getMetas = async (req, res) => {
    try {
        const metas = await Meta.find({ usuario: req.usuario.id }).sort({ dataFim: 1 });
        res.json(metas);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 2. DEFINIR META (MODIFICADO)
// POST /api/metas
exports.createMeta = async (req, res) => {
    // Pega os novos campos do body
    const { tipo, valorAlvo, valorInicial, dataInicio, dataFim } = req.body;

    // Validação
    if (!tipo || !valorAlvo || !valorInicial || !dataInicio) {
        return res.status(400).json({ msg: 'Tipo, Valor Inicial, Valor Alvo e Data de Início são obrigatórios.' });
    }
    if (valorAlvo <= 0 || valorInicial <= 0) {
        return res.status(400).json({ msg: 'Valores devem ser positivos.' });
    }

    try {
        const novaMeta = new Meta({
            usuario: req.usuario.id,
            tipo,
            valorInicial,
            valorAlvo,
            dataInicio: new Date(dataInicio), // Converte a string para Data
            dataFim: dataFim ? new Date(dataFim) : null,
            status: 'Em Andamento'
        });

        const meta = await novaMeta.save();
        res.status(201).json(meta);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 3. EDITAR META (MODIFICADO)
// PUT /api/metas/:id
exports.updateMeta = async (req, res) => {
    const { valorAlvo, valorInicial, dataInicio, dataFim } = req.body;

    try {
        let meta = await Meta.findById(req.params.id);
        if (!meta) return res.status(404).json({ msg: 'Meta não encontrada' });

        if (meta.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        // Constrói o objeto de atualização
        const dadosAtualizados = {
            ...req.body,
            dataInicio: new Date(dataInicio),
            dataFim: dataFim ? new Date(dataFim) : null
        };

        meta = await Meta.findByIdAndUpdate(
            req.params.id,
            { $set: dadosAtualizados },
            { new: true }
        );
        res.json(meta);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 4. EXCLUIR META (Não muda)
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