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

// 2. VISUALIZAR UMA META (Não muda)
exports.getMetaById = async (req, res) => {
    try {
        const meta = await Meta.findById(req.params.id);
        if (!meta) return res.status(404).json({ msg: 'Meta não encontrada' });

        if (meta.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }
        res.json(meta);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
             return res.status(404).json({ msg: 'Meta não encontrada (ID mal formatado)' });
        }
        res.status(500).send('Erro no Servidor');
    }
};

// 3. DEFINIR META (MODIFICADO)
// POST /api/metas
exports.createMeta = async (req, res) => {
    const { tipo, valorAlvo, valorInicial, dataInicio, dataFim, periodo } = req.body;

    // Validação (FE9.1 / FE9.2)
    if (!tipo || !valorAlvo || !dataInicio) {
        return res.status(400).json({ msg: 'Tipo, Valor Alvo e Data de Início são obrigatórios.' });
    }
    
    // Validação específica para cada tipo
    if (tipo === 'Peso' || tipo === 'Água') {
        if (!valorInicial) {
            return res.status(400).json({ msg: 'Valor Inicial é obrigatório para metas de Peso ou Água.' });
        }
        if (valorAlvo <= 0 || valorInicial <= 0) {
            return res.status(400).json({ msg: 'Valores devem ser positivos.' });
        }
    } else if (tipo === 'Treino') {
        if (!periodo) {
            return res.status(400).json({ msg: 'Período (Semana/Mês) é obrigatório para metas de Treino.' });
        }
    }

    try {
        const novaMeta = new Meta({
            usuario: req.usuario.id,
            tipo,
            valorInicial: valorInicial || 0, // Salva 0 se for treino
            valorAlvo,
            dataInicio: new Date(dataInicio), 
            dataFim: dataFim ? new Date(dataFim) : null,
            periodo: periodo || null, // Salva nulo se for peso/água
            status: 'Em Andamento'
        });

        const meta = await novaMeta.save();
        res.status(201).json(meta);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 4. EDITAR META (MODIFICADO)
// PUT /api/metas/:id
exports.updateMeta = async (req, res) => {
    const { dataInicio, dataFim } = req.body;

    try {
        let meta = await Meta.findById(req.params.id);
        if (!meta) return res.status(404).json({ msg: 'Meta não encontrada' });
        if (meta.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }
        
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

// 5. EXCLUIR META (Não muda)
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