const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema para um item alimentar
const AlimentoSchema = new Schema({
    nome: { type: String, required: true },
    porcao: { type: String, required: true },
    calorias: { type: Number, required: true },
    proteinas: { type: Number, required: true },
    carboidratos: { type: Number, required: true },
    gorduras: { type: Number, required: true }
});

// Schema para uma refeição (que contém vários alimentos e os totais da refeição)
const RefeicaoSchema = new Schema({
    alimentos: [AlimentoSchema],
    totais: {
        calorias: { type: Number, required: true },
        proteinas: { type: Number, required: true },
        carboidratos: { type: Number, required: true },
        gorduras: { type: Number, required: true }
    }
});

// Schema principal do Plano de Dieta
const DietaSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario', 
        required: true,
        unique: true 
    },
    nomePlano: { type: String, required: true }, // Ex: "Spoonacular (Perda de Peso)"
    
    // As 4 refeições
    cafeDaManha: { type: RefeicaoSchema, required: true },
    almoco: { type: RefeicaoSchema, required: true },
    jantar: { type: RefeicaoSchema, required: true },
    lanches: { type: RefeicaoSchema }, // Lanches (opcional)
    
    // [NOVO] Campo separado para os totais do dia
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