const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DiarioSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    // Data do registro (vamos garantir uma entrada por dia)
    data: {
        type: Date,
        required: true
    },
    // Campos do UC004
    pesoKg: {
        type: Number,
        required: [true, 'O campo Peso é obrigatório.'] // FE3.1
    },
    aguaLitros: {
        type: Number,
        required: [true, 'O campo Água é obrigatório.'] // FE3.1
    },
    alimentosConsumidos: { // Campo de texto simples
        type: String,
        trim: true
    },
    treinoRealizado: { // Campo de texto simples
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Garante que um usuário só pode ter um registro por dia
DiarioSchema.index({ usuario: 1, data: 1 }, { unique: true });

module.exports = mongoose.model('Diario', DiarioSchema);