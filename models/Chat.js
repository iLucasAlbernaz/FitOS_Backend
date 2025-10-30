const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    // 'role' define quem enviou a mensagem: o usuário ou a IA
    role: {
        type: String,
        enum: ['user', 'model'], // 'user' (usuário) ou 'model' (IA)
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, {
    timestamps: true // Salva a data de criação
});

module.exports = mongoose.model('Chat', ChatSchema);