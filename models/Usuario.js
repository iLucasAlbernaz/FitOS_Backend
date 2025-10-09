const mongoose = require('mongoose');

const DadosBiometricosSchema = new mongoose.Schema({
    altura_cm: { type: Number, required: true },
    peso_atual_kg: { type: Number, required: true },
    idade: { type: Number, required: true },
    sexo: { type: String, enum: ['M', 'F', 'Outro'], required: true }
});

const ObjetivosSchema = new mongoose.Schema({
    principal: { type: String, required: true },
    meta_peso_kg: { type: Number },
    meta_agua_litros: { type: Number },
    data_limite: { type: Date }
});


const UsuarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true 
    },
    email: {
        type: String,
        required: true,
        unique: true, 
        lowercase: true,
        trim: true
    },
    senha_hash: {
        type: String,
        required: true
    },

    dados_biometricos: {
        type: DadosBiometricosSchema,
        required: true
    },
    objetivos: {
        type: ObjetivosSchema,
        required: true
    },
    

}, {
    timestamps: true
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);

module.exports = Usuario;