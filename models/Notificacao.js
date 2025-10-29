const mongoose = require('mongoose');

const NotificacaoSchema = new mongoose.Schema({
    // Liga a notificação ao destinatário
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario', 
        required: true
    },
    
    // Dados da notificação (Tipo, Mensagem e Status)
    tipo: {
        type: String,       
        enum: ['Meta Alcançada', 'Lembrete', 'Sistema'], 
        required: true
    },
    mensagem: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Não Lida', 'Lida'],
        default: 'Não Lida'
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('Notificacao', NotificacaoSchema);