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

// Schema para uma refeição (que contém vários alimentos e os totais)
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
    // Link para o usuário
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario', // Deve corresponder ao nome do seu modelo de usuário
        required: true,
        unique: true // Geralmente um usuário tem apenas um plano de dieta
    },
    // As refeições que o frontend espera
    cafeDaManha: { type: RefeicaoSchema },
    almoco: { type: RefeicaoSchema },
    jantar: { type: RefeicaoSchema },
    lanches: { type: RefeicaoSchema } // Opcional
}, {
    timestamps: true // Salva a data de criação/atualização
});

module.exports = mongoose.model('Dieta', DietaSchema);