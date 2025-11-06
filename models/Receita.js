const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const MacrosSchema = new Schema({
    calorias: { type: Number, required: true, default: 0 },
    proteinas: { type: Number, required: true, default: 0 },
    carboidratos: { type: Number, required: true, default: 0 },
    gorduras: { type: Number, required: true, default: 0 }
}, { _id: false });


const IngredienteSchema = new Schema({
    nome: { type: String, required: true },
    quantidade: { type: String, required: true } 
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
        required: [true, 'A Descrição é obrigatória']
    },
    
    modoPreparo: {
        type: String
    },
    
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