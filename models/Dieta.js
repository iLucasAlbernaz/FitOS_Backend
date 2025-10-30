const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// ... (AlimentoSchema e RefeicaoSchema não mudam) ...
const AlimentoSchema = new Schema({
    nome: { type: String, required: true },
    porcao: { type: String, required: true },
    calorias: { type: Number, required: true },
    proteinas: { type: Number, required: true },
    carboidratos: { type: Number, required: true },
    gorduras: { type: Number, required: true }
});

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
    
    // --- CAMPO ADICIONADO ---
    // Agora salvamos o nome do plano
    nomePlano: { type: String, required: true }, 
    // --- FIM DA ADIÇÃO ---

    // As refeições que o frontend espera
    cafeDaManha: { type: RefeicaoSchema, required: true },
    almoco: { type: RefeicaoSchema, required: true },
    jantar: { type: RefeicaoSchema, required: true },
    lanches: { type: RefeicaoSchema } // Opcional
}, {
    timestamps: true 
});

module.exports = mongoose.model('Dieta', DietaSchema);