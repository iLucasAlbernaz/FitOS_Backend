const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema para um item alimentar (gerado pela IA)
const AlimentoSchema = new Schema({
    nome: { type: String, required: true },
    porcao: { type: String, required: true },
    // Macros por alimento (geralmente a IA nos dá o total da refeição)
    calorias: { type: Number, default: 0 },
    proteinas: { type: Number, default: 0 },
    carboidratos: { type: Number, default: 0 },
    gorduras: { type: Number, default: 0 }
}, { _id: false });

// Schema para uma refeição (que contém vários alimentos e os totais da refeição)
const RefeicaoSchema = new Schema({
    alimentos: [AlimentoSchema],
    modoPreparo: { type: String }, // [NOVO] Adicionado modo de preparo
    totais: {
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
        required: true
        // [MODIFICADO] 'unique: true' foi REMOVIDO
    },
    nomePlano: { type: String, required: true }, // Ex: "IA: Ganho de Massa"
    
    // [NOVO] A explicação da IA
    explicacao: { type: String, required: true }, 

    // [NOVO] Para sabermos qual plano o usuário está usando
    isAtivo: { type: Boolean, default: false }, 
    
    // As 4 refeições
    cafeDaManha: { type: RefeicaoSchema, required: true },
    almoco: { type: RefeicaoSchema, required: true },
    lanche: { type: RefeicaoSchema, required: true },
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