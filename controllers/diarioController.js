const Diario = require('../models/Diario');

exports.criarDiario = async (req, res) => {
    try {
        const usuarioId = req.usuario.id; 

        const novoDiario = new Diario({
            ...req.body, 
            usuario_id: usuarioId 
        });

        await novoDiario.save();

        res.status(201).json({
            mensagem: "Diário de atividades registrado com sucesso!",
            diario: novoDiario
        });

    } catch (error) {
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ mensagem: "Erro de validação de dados.", erro: error.message });
        }
        
        console.error("Erro ao criar diário:", error);
        res.status(500).json({ mensagem: "Erro interno ao criar registro diário." });
    }
};
exports.buscarDiariosUsuario = async (req, res) => {
    try {
        const diarios = await Diario.find({ usuario_id: req.usuario.id }).sort({ data_registro: -1 });

        res.status(200).json(diarios);

    } catch (error) {
        console.error("Erro ao buscar diários:", error);
        res.status(500).json({ mensagem: "Erro interno ao buscar registros diários." });
    }
};
exports.atualizarDiario = async (req, res) => {
    try {
        const { id } = req.params; 

        const diario = await Diario.findOneAndUpdate(
            { _id: id, usuario_id: req.usuario.id }, 
            req.body, 
            { new: true, runValidators: true } 
        );

        if (!diario) {
            return res.status(404).json({ mensagem: "Diário não encontrado ou você não tem permissão." });
        }

        res.status(200).json({ mensagem: "Diário atualizado com sucesso!", diario });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ mensagem: "Erro de validação ao atualizar.", erro: error.message });
        }
        res.status(500).json({ mensagem: "Erro interno ao atualizar diário." });
    }
};

exports.deletarDiario = async (req, res) => {
    try {
        const { id } = req.params; 

        const diario = await Diario.findOneAndDelete({ _id: id, usuario_id: req.usuario.id });

        if (!diario) {
            return res.status(404).json({ mensagem: "Diário não encontrado ou você não tem permissão." });
        }

        res.status(200).json({ mensagem: "Diário excluído com sucesso!" });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro interno ao deletar diário." });
    }
};