const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Lógica para autenticar um usuário (POST /api/auth/login)
exports.loginUsuario = async (req, res) => {
    const { email, senha } = req.body;

    try {
        const usuario = await Usuario.findOne({ email });

        if (!usuario) {
            return res.status(401).json({ mensagem: "Credenciais inválidas." });
        }

        const isMatch = await bcrypt.compare(senha, usuario.senha_hash);

        if (!isMatch) {
            return res.status(401).json({ mensagem: "Credenciais inválidas." });
        }

        // 1. O Payload (dados que identificam o usuário no token)
        const payload = {
            usuario: {
                id: usuario.id // Usamos o ID do MongoDB para identificar
            }
        };

        // 2. Assina o token com a chave secreta e define o tempo de expiração
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET, // Chave secreta do .env
            { expiresIn: '5h' }     // Token expira em 5 horas
        );

        // Se chegou aqui, o login foi um sucesso!
        res.status(200).json({
            mensagem: "Login realizado com sucesso!",
            token: token,
            usuario: {
                nome: usuario.nome,
                email: usuario.email
            }
        });

    } catch (error) {
        console.error("Erro no processo de login:", error);
        res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
};