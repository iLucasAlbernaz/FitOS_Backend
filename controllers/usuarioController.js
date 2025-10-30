const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs'); 

// Importar os modelos relacionados para exclusão em cascata
const Dieta = require('../models/Dieta');
const Diario = require('../models/Diario');
const Receita = require('../models/Receita');
const Treino = require('../models/Treino');


exports.cadastrarUsuario = async (req, res) => {
    const { senha } = req.body; 

    try {
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const novoUsuario = new Usuario({
            ...req.body,
            senha_hash: senhaHash
        });

        await novoUsuario.save();
        res.status(201).json({
            mensagem: "Usuário cadastrado com sucesso! Segurança aplicada.",
            usuario_id: novoUsuario._id,
            email: novoUsuario.email
        });

    } catch (error) {
        if (error.code === 11000) { 
            return res.status(400).json({ mensagem: "Email já cadastrado." });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ mensagem: "Erro de validação de dados.", erro: error.message });
        }
        console.error(error);
        res.status(500).json({ mensagem: "Erro interno ao cadastrar usuário." });
    }
};

exports.getUsuarioLogado = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id).select('-senha_hash'); 
        
        if (!usuario) {
            return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
        }

        res.json(usuario);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
};

exports.atualizarPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndUpdate(
            req.usuario.id,
            req.body,
            { new: true, runValidators: true }
        ).select('-senha_hash'); 

        if (!usuario) {
            return res.status(404).json({ mensagem: "Usuário não encontrado." });
        }

        res.status(200).json({ mensagem: "Perfil atualizado com sucesso!", usuario });
    } catch (error) {
        // Erro de sintaxe corrigido aqui (removido o '_')
        if (error.name === 'ValidationError') {
            return res.status(400).json({ mensagem: "Erro de validação de dados.", erro: error.message });
        }
        res.status(500).json({ mensagem: "Erro interno ao atualizar perfil." });
    }
};

// --- FUNÇÃO MODIFICADA ---
exports.deletarPerfil = async (req, res) => {
    try {
        // [NOVO] Passo 1: Deletar dados associados
        
        // Deleta o plano de dieta (1-para-1)
        await Dieta.findOneAndDelete({ usuario: req.usuario.id });
        
        // Deleta todos os registros do diário (1-para-Muitos)
        await Diario.deleteMany({ usuario: req.usuario.id });
        
        // Deleta todas as receitas (1-para-Muitos)
        await Receita.deleteMany({ usuario: req.usuario.id });
        
        // Deleta todos os treinos (1-para-Muitos)
        await Treino.deleteMany({ usuario: req.usuario.id });

        // [Antigo] Passo 2: Deletar o próprio usuário
        const usuario = await Usuario.findByIdAndDelete(req.usuario.id);

        if (!usuario) {
            return res.status(404).json({ mensagem: "Usuário não encontrado." });
        }

        // [NOVO] Mensagem de resposta atualizada
        res.status(200).json({ mensagem: "Conta e todos os dados associados foram excluídos permanentemente." });
    
    } catch (error) {
        console.error(error); 
        res.status(500).json({ mensagem: "Erro interno ao deletar conta." });
    }
};