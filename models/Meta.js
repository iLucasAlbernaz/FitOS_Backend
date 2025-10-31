const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MetaSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    // (DM04) Tipo, Valor, Prazo
    tipo: {
        type: String,
        required: true,
        enum: ['Peso', 'Água', 'Treino'] // Tipos de meta
    },
    valorAlvo: {
        type: Number,
        required: [true, 'O Valor Alvo é obrigatório'] // FE9.1
    },
    prazo: {
        type: Date,
        required: false // Opcional
    },
    // (VM02) Status
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