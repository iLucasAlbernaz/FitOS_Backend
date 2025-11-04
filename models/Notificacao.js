const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificacaoSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
    },
    tipo: {
        type: String,
        enum: ['SISTEMA', 'META_CONCLUIDA', 'LEMBRETE'],
        required: true
    },
    mensagem: {
        type: String,
        required: true,
        trim: true
    },
    lida: {
        type: Boolean,
        default: false
    },
    dataEnvio: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Notificacao', NotificacaoSchema);