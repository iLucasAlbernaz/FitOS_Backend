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

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/diarios', diarioRoutes);
app.use('/api/receitas', receitaRoutes);
app.use('/api/treinos', treinoRoutes); 
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/chat', chatRoutes);

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