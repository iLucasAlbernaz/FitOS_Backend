const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Sub-documento para Macros
const MacrosSchema = new Schema({
    calorias: { type: Number, required: true, default: 0 },
    proteinas: { type: Number, required: true, default: 0 },
    carboidratos: { type: Number, required: true, default: 0 },
    gorduras: { type: Number, required: true, default: 0 }
}, { _id: false });

// [MODIFICADO] Sub-documento para Ingredientes (agora com 3 campos)
const IngredienteSchema = new Schema({
    nome: { type: String, required: true },
    quantidade: { type: Number, required: true },
    unidade: { type: String, required: true } // ex: "g", "ml", "unidade", "xícara"
}, { _id: false });

const ReceitaSchema = new Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    nome: {
        type: String,
        required: [true, 'O Nome é obrigatório'],
        trim: true
    },
    descricao: {
        type: String,
        required: false 
    },
    modoPreparo: {
        type: String,
        required: false 
    },
    macros: {
        type: MacrosSchema,
        required: true
    },
    // Usa o novo IngredienteSchema
    ingredientes: {
        type: [IngredienteSchema],
        required: true
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('Receita', ReceitaSchema);