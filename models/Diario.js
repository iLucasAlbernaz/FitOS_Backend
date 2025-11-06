const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DiarioSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    data: {
        type: Date,
        required: true
    },
    pesoKg: {
        type: Number,
        required: [true, 'O campo Peso é obrigatório.']
    },
    aguaLitros: {
        type: Number,
        required: [true, 'O campo Água é obrigatório.']
    },
    alimentosConsumidos: { 
        type: String,
        trim: true
    },
    treinoRealizado: { 
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Diario', DiarioSchema);