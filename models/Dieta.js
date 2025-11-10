const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema para um item alimentar (simplificado para a IA)
const AlimentoSchema = new Schema({
    nome: { type: String, required: true },
    porcao: { type: String, required: true },
    calorias: { type: Number, default: 0 },
    proteinas: { type: Number, default: 0 },
    carboidratos: { type: Number, default: 0 },
    gorduras: { type: Number, default: 0 }
}, { _id: false });

// Schema para uma refeição
const RefeicaoSchema = new Schema({
    alimentos: [AlimentoSchema],
    totais: { // Totais da REFEIÇÃO
        calorias: { type: Number, required: true },
        proteinas: { type: Number, required: true },
        carboidratos: { type: Number, required: true },
        gorduras: { type: Number, required: true }
    }
}, { _id: false });

// Schema principal do Plano de Dieta
const DietaSchema = new Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario', 
        required: true,
        unique: true 
    },
    nomePlano: { type: String, required: true }, // Ex: "IA: Ganho de Massa"
    
    // As 4 refeições
    cafeDaManha: { type: RefeicaoSchema, required: true },
    almoco: { type: RefeicaoSchema, required: true },
    lanche: { type: RefeicaoSchema }, // Renomeado de 'lanches'
    jantar: { type: RefeicaoSchema, required: true },
    
    // Totais do DIA
    totais: {
        calorias: { type: Number, required: true },
        proteinas: { type: Number, required: true },
        carboidratos: { type: Number, required: true },
        gorduras: { type: Number, required: true }
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('Dieta', DietaSchema);