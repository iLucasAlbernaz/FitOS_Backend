const Treino = require('../models/Treino');

exports.criarRotina = async (req, res) => {
    try {
        const novaRotina = new Treino({
            ...req.body,
            criado_por_usuario_id: req.usuario.id 
        });

        await novaRotina.save();
        res.status(201).json({ mensagem: "Rotina de treino salva com sucesso!", treino: novaRotina });
    } catch (error) {
        if (error.code === 11000) { 
            return res.status(400).json({ mensagem: "Nome da rotina já cadastrado." });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ mensagem: "Erro de validação de dados.", erro: error.message });
        }
        res.status(500).json({ mensagem: "Erro interno ao criar rotina." });
    }
};

exports.buscarRotinasUsuario = async (req, res) => {
    try {
        const rotinas = await Treino.find({ criado_por_usuario_id: req.usuario.id }).sort({ createdAt: -1 });
        res.status(200).json(rotinas);
    } catch (error) {
        res.status(500).json({ mensagem: "Erro interno ao buscar rotinas." });
    }
};

exports.atualizarRotina = async (req, res) => {
    try {
        const { id } = req.params;

        const rotina = await Treino.findOneAndUpdate(
            { _id: id, criado_por_usuario_id: req.usuario.id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!rotina) {
            return res.status(404).json({ mensagem: "Rotina não encontrada ou você não tem permissão." });
        }

        res.status(200).json({ mensagem: "Rotina atualizada com sucesso!", rotina });
    } catch (error) {
        if (error.code === 11000) { 
            return res.status(400).json({ mensagem: "Já existe uma rotina com esse nome." });
        }
        res.status(500).json({ mensagem: "Erro interno ao atualizar rotina." });
    }
};

exports.deletarRotina = async (req, res) => {
    try {
        const { id } = req.params;

        const rotina = await Treino.findOneAndDelete({ _id: id, criado_por_usuario_id: req.usuario.id });

        if (!rotina) {
            return res.status(404).json({ mensagem: "Rotina não encontrada ou você não tem permissão." });
        }

        res.status(200).json({ mensagem: "Rotina excluída com sucesso!" });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro interno ao deletar rotina." });
    }
};