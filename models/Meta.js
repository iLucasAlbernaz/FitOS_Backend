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
        enum: ['Peso', 'Água', 'Treino'] 
    },
    
    valorInicial: {
        type: Number, 
        required: false 
    },
    valorAlvo: {
        type: Number, 
        required: [true, 'O Valor Alvo é obrigatório']
    },
    dataInicio: {
        type: Date, 
        required: [true, 'A Data de Início é obrigatória']
    },
    dataFim: {
        type: Date,
        required: false 
    },
    
    periodo: {
        type: String,
        enum: ['Semana', 'Mês'],
        required: false 
    },

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