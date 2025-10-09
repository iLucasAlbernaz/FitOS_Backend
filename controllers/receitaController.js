const Receita = require('../models/Receita');

exports.criarReceita = async (req, res) => {
    try {
        const novaReceita = new Receita({
            ...req.body,
            autor_usuario_id: req.usuario.id 
        });

        await novaReceita.save();
        res.status(201).json({ mensagem: "Receita salva com sucesso!", receita: novaReceita });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ mensagem: "Erro de validação de dados.", erro: error.message });
        }
        res.status(500).json({ mensagem: "Erro interno ao criar receita." });
    }
};

exports.buscarReceitasUsuario = async (req, res) => {
    try {
        const receitas = await Receita.find({ autor_usuario_id: req.usuario.id }).sort({ createdAt: -1 });

        res.status(200).json(receitas);
    } catch (error) {
        res.status(500).json({ mensagem: "Erro interno ao buscar receitas." });
    }
};
exports.atualizarReceita = async (req, res) => {
    try {
        const { id } = req.params;

        const receita = await Receita.findOneAndUpdate(
            { _id: id, autor_usuario_id: req.usuario.id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!receita) {
            return res.status(404).json({ mensagem: "Receita não encontrada ou você não tem permissão." });
        }

        res.status(200).json({ mensagem: "Receita atualizada com sucesso!", receita });
    } catch (error) {
        if (error.code === 11000) { 
            return res.status(400).json({ mensagem: "Já existe uma receita com esse nome." });
        }
        res.status(500).json({ mensagem: "Erro interno ao atualizar receita." });
    }
};

exports.deletarReceita = async (req, res) => {
    try {
        const { id } = req.params;

        const receita = await Receita.findOneAndDelete({ _id: id, autor_usuario_id: req.usuario.id });

        if (!receita) {
            return res.status(404).json({ mensagem: "Receita não encontrada ou você não tem permissão." });
        }

        res.status(200).json({ mensagem: "Receita excluída com sucesso!" });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro interno ao deletar receita." });
    }
};