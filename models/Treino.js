const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Um sub-documento para cada exercício
const ExercicioSchema = new Schema({
    nome: { type: String, required: true },
    series: { type: String, required: true },      // Ex: "3" ou "4"
    repeticoes: { type: String, required: true } // Ex: "8-12" ou "15"
});

const TreinoSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    nome: { // Ex: "Treino A"
        type: String,
        required: true
    },
    grupoMuscular: { // Ex: "Peito e Tríceps"
        type: String,
        required: true
    },
    exercicios: [ExercicioSchema] // Uma lista de exercícios
}, {
    timestamps: true
});

module.exports = mongoose.model('Treino', TreinoSchema);