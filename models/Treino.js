const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExercicioSchema = new Schema({
    nome: { type: String, required: true },
    series: { type: String, required: true },      
    repeticoes: { type: String, required: true } 
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