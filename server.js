require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importação de Rotas
const usuarioRoutes = require('./routes/usuarioRoutes');
const authRoutes = require('./routes/authRoutes');
const diarioRoutes = require('./routes/diarioRoutes');
const receitaRoutes = require('./routes/receitaRoutes');
const treinoRoutes = require('./routes/treinoRoutes');
const notificacaoRoutes = require('./routes/notificacaoRoutes');
const chatRoutes = require('./routes/chatRoutes');
const metaRoutes = require('./routes/metaRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

// Middlewares

// [CORREÇÃO] Configurar o CORS para aceitar seu header 'x-auth-token'
app.use(cors({
    origin: '*', // (Idealmente, troque '*' pelo seu domínio do frontend no futuro)
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: ['Content-Type', 'x-auth-token'] // <-- ESSA É A LINHA IMPORTANTE
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/diarios', diarioRoutes);
app.use('/api/receitas', receitaRoutes);
app.use('/api/treinos', treinoRoutes); 
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dieta', require('./routes/dietaRoutes'));
app.use('/api/metas', metaRoutes);
app.use('/api/stats', statsRoutes);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('MongoDB (Atlas) conectado com sucesso!');
        
        app.listen(PORT, () => {
            console.log(`Servidor FitOS rodando na porta ${PORT}`);
        });

    } catch (error) {
        console.error('Falha na conexão com o MongoDB:', error.message);
        process.exit(1); 
    }
};

connectDB();