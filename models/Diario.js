const mongoose = require('mongoose');

const MacrosDiarioSchema = new mongoose.Schema({
    proteinas_g: { type: Number, required: true },
    carboidratos_g: { type: Number, required: true },
    gorduras_g: { type: Number, required: true },
    calorias_total: { type: Number, required: true }
}, { _id: false }); 

const DiarioSchema = new mongoose.Schema({
    
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario', 
        required: true
    },

    data_registro: {
        type: Date,
        default: Date.now,
        required: true,
        unique: true
    },
    peso_kg: {
        type: Number
    },
    agua_ingerida_litros: {
        type: Number,
        default: 0
    },

    macros_totais: {
        type: MacrosDiarioSchema,
        required: true 
    },

    refeicoes: [
        {
            nome: { type: String, required: true },
            macros_reais: MacrosDiarioSchema, 
        }
    ],

    treinos: [
        {
            nome: { type: String, required: true },
            duracao_minutos: { type: Number, required: true },
            membros_treinados: [{ type: String }]
        }
    ]
}, {
    timestamps: true 
});

const Diario = mongoose.model('Diario', DiarioSchema);

module.exports = Diario;