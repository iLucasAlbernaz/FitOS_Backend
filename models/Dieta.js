const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

const DietaSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario', 
        required: true,
        unique: true 
    },
    
    nomePlano: { type: String, required: true }, 

    cafeDaManha: { type: RefeicaoSchema, required: true },
    almoco: { type: RefeicaoSchema, required: true },
    jantar: { type: RefeicaoSchema, required: true },
    lanches: { type: RefeicaoSchema } 
}, {
    timestamps: true 
});

module.exports = mongoose.model('Dieta', DietaSchema);