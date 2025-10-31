const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MetaSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    tipo: {
        type: String,
        required: true,
        enum: ['Peso', 'Água', 'Treino'] // Tipos de meta
    },
    
    // --- CAMPOS ATUALIZADOS ---
    valorInicial: {
        type: Number, // Ex: 82 (kg)
        required: [true, 'O Valor Inicial é obrigatório']
    },
    valorAlvo: {
        type: Number, // Ex: 75 (kg)
        required: [true, 'O Valor Alvo é obrigatório']
    },
    dataInicio: {
        type: Date, // Data que o usuário definiu como início
        required: [true, 'A Data de Início é obrigatória']
    },
    dataFim: { // Renomeado de 'prazo'
        type: Date,
        required: false // Opcional
    },
    // --- FIM DA ATUALIZAÇÃO ---

    status: {
        type: String,
        required: true,
        default: 'Em Andamento',
        enum: ['Em Andamento', 'Concluída']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Meta', MetaSchema);