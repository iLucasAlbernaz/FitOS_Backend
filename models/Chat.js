const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    
    role: {
        type: String,
        enum: ['user', 'model'], 
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('Chat', ChatSchema);