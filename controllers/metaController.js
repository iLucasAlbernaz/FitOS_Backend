const Meta = require('../models/Meta');
const { sendNotification } = require('./notificacaoController'); 

// 1. VISUALIZAR METAS (GET /api/metas)
exports.getMetas = async (req, res) => {
    try {
        const metas = await Meta.find({ usuario: req.usuario.id }).sort({ dataFim: 1 });
        res.json(metas);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 2. VISUALIZAR UMA META (GET /api/metas/:id)
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

// 3. DEFINIR META (Gatilho de Notificação)
// POST /api/metas
exports.createMeta = async (req, res) => {
    const { tipo, valorAlvo, valorInicial, dataInicio, dataFim, periodo } = req.body;

    if (!tipo || !valorAlvo || !dataInicio) {
        return res.status(400).json({ msg: 'Tipo, Valor Alvo e Data de Início são obrigatórios.' });
    }
    
    const inicio = new Date(dataInicio);
    if (inicio.getTime() < new Date().setHours(0, 0, 0, 0)) {
        return res.status(400).json({ msg: 'A Data de Início não pode ser no passado.' });
    }
    
    if (valorAlvo < 0 || (valorInicial && valorInicial < 0)) {
        return res.status(400).json({ msg: 'Valores Alvo e Inicial não podem ser negativos.' });
    }

    try {
        const novaMeta = new Meta({
            usuario: req.usuario.id,
            tipo,
            valorInicial: valorInicial || 0,
            valorAlvo,
            dataInicio: inicio, 
            dataFim: dataFim ? new Date(dataFim) : null,
            periodo: periodo || null,
            status: 'Em Andamento'
        });

        const meta = await novaMeta.save();

        // [GATILHO DE NOTIFICAÇÃO] Dispara uma notificação de "Meta Criada"
        await sendNotification(
            req.usuario.id, 
            'SISTEMA', 
            `Sua nova meta de ${tipo} (Alvo: ${valorAlvo}) foi criada com sucesso!`
        );

        res.status(201).json(meta);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 4. EDITAR META (PUT /api/metas/:id)
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

// 5. EXCLUIR META (DELETE /api/metas/:id)
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