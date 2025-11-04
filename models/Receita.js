const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Sub-documento para Macros
const MacrosSchema = new Schema({
    calorias: { type: Number, required: true, default: 0 },
    proteinas: { type: Number, required: true, default: 0 },
    carboidratos: { type: Number, required: true, default: 0 },
    gorduras: { type: Number, required: true, default: 0 }
}, { _id: false });

// Sub-documento para Ingredientes
const IngredienteSchema = new Schema({
    nome: { type: String, required: true },
    quantidade: { type: String, required: true } // Ex: "1 xícara" ou "100g"
}, { _id: false });

const ReceitaSchema = new Schema({
    // [PADRONIZADO] para 'usuario'
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
    // [NOVO] Campo 'descricao' do seu modelo
    descricao: {
        type: String,
        required: [true, 'A Descrição é obrigatória']
    },
    // [PADRONIZADO] para 'modoPreparo'
    modoPreparo: {
        type: String
    },
    // [PADRONIZADO] para 'macros'
    macros: {
        type: MacrosSchema,
        required: true
    },
    ingredientes: {
        type: [IngredienteSchema],
        required: true
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('Receita', ReceitaSchema);