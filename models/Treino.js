const mongoose = require('mongoose');

const ExercicioSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    series: { type: Number, required: true },
    repeticoes: { type: String, required: true },
    carga_estimada: { type: String }
}, { _id: false });

const TreinoSchema = new mongoose.Schema({
    
    criado_por_usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },

    nome: {
        type: String,
        required: true,
        trim: true,
        unique: true 
    },
    objetivo_alvo: {
        type: String,
        enum: ['Hipertrofia', 'Resistência', 'Força', 'Definição'],
        required: true
    },
    
    exercicios: {
        type: [ExercicioSchema], 
        required: true
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('Treino', TreinoSchema);