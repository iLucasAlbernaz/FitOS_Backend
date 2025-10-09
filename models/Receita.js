const mongoose = require('mongoose');

const MacrosSchema = new mongoose.Schema({
    calorias: { type: Number, required: true },
    proteinas_g: { type: Number, required: true },
    carboidratos_g: { type: Number, required: true },
    gorduras_g: { type: Number, required: true }
}, { _id: false });

const IngredientesSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    quantidade: { type: String, required: true }
}, { _id: false });

const ReceitaSchema = new mongoose.Schema({
    
    autor_usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    
    nome: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    descricao: {
        type: String,
        required: true
    },
    modo_preparo: {
        type: String
    },

    macros_estimados: {
        type: MacrosSchema,
        required: true
    },
    
    ingredientes: {
        type: [IngredientesSchema],
        required: true
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('Receita', ReceitaSchema);