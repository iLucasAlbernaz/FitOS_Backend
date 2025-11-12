// models/Treino.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// [ATUALIZADO] Adicionado o campo 'orientacao'
const ExercicioSchema = new Schema({
    nome: { type: String, required: true },
    series: { type: String, required: true },      
    repeticoes: { type: String, required: true },
    orientacao: { type: String } // Novo campo para dicas
});

const TreinoSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    nome: { 
        type: String,
        required: true
    },
    grupoMuscular: { 
        type: String,
        required: true
    },
    exercicios: [ExercicioSchema] 
}, {
    timestamps: true
});

module.exports = mongoose.model('Treino', TreinoSchema);