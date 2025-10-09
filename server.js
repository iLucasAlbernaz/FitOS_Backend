require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

const usuarioRoutes = require('./routes/usuarioRoutes');
const authRoutes = require('./routes/authRoutes');
const diarioRoutes = require('./routes/diarioRoutes');
const receitaRoutes = require('./routes/receitaRoutes');
const treinoRoutes = require('./routes/treinoRoutes'); 

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/diarios', diarioRoutes);
app.use('/api/receitas', receitaRoutes);
app.use('/api/treinos', treinoRoutes); 

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('MongoDB (Atlas) conectado com sucesso! 🚀');
        
        app.listen(PORT, () => {
            console.log(`Servidor FitOS rodando na porta ${PORT}`);
        });

    } catch (error) {
        console.error('Falha na conexão com o MongoDB:', error.message);
        process.exit(1); 
    }
};

connectDB();