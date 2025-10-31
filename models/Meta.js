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
    
    // [MODIFICADO] ValorInicial não é mais obrigatório
    valorInicial: {
        type: Number, 
        required: false // Só é usado por 'Peso' e 'Água'
    },
    valorAlvo: {
        type: Number, // Ex: 75 (kg) ou 5 (treinos)
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
    
    // [NOVO] Campo específico para Metas de Treino
    periodo: {
        type: String,
        enum: ['Semana', 'Mês'],
        required: false // Só é usado por 'Treino'
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