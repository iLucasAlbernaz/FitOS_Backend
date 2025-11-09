const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MetaSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    tipo: {
        type: String,
        required: true,
        enum: ['Peso', 'Água', 'Treino'] // Tipos de meta
    },
    
    // [MODIFICADO] ValorInicial só é obrigatório para 'Peso'
    valorInicial: {
        type: Number, 
        required: function() { return this.tipo === 'Peso'; } 
    },
    valorAlvo: {
        type: Number, // Ex: 75 (kg) ou 3 (Litros) ou 5 (treinos)
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
    
    // [MODIFICADO] Período só é obrigatório para 'Treino' E 'Água'
    periodo: {
        type: String,
        enum: ['Semana', 'Mês'],
        required: function() { return this.tipo === 'Treino' || this.tipo === 'Água'; }
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