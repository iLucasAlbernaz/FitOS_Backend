const Diario = require('../models/Diario');

// --- Funções CRUD ---

// 1. CADASTRAR REGISTRO DIÁRIO (Fluxo DA01)
// MODIFICADO: Agora recebe a data do frontend
exports.createRegistro = async (req, res) => {
    // Pega a data do req.body
    const { pesoKg, aguaLitros, alimentosConsumidos, treinoRealizado, data } = req.body;
    
    // Validação (FE3.1 e FE3.2)
    if (!pesoKg || !aguaLitros || !data) {
        return res.status(400).json({ msg: 'Campos "Data", "Peso" e "Água" são obrigatórios.' });
    }
    if (pesoKg <= 0 || aguaLitros < 0) {
        return res.status(400).json({ msg: 'Valores de peso e água devem ser positivos.' });
    }

    // Converte a string "YYYY-MM-DD" para um objeto Date em UTC
    // Isso evita problemas de fuso horário
    const [year, month, day] = data.split('-').map(Number);
    const dataFormatada = new Date(Date.UTC(year, month - 1, day));

    try {
        // Verifica se já existe um registro para este usuário neste dia
        let registro = await Diario.findOne({ usuario: req.usuario.id, data: dataFormatada });

        if (registro) {
            return res.status(400).json({ msg: `Já existe um registro para o dia ${day}/${month}/${year}. Você pode editá-lo na lista.` });
        }

        // Cria o novo registro
        registro = new Diario({
            usuario: req.usuario.id,
            data: dataFormatada, // Salva a data formatada
            pesoKg,
            aguaLitros,
            alimentosConsumidos,
            treinoRealizado
        });

        await registro.save();
        res.status(201).json(registro);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 2. VISUALIZAR REGISTROS (Fluxo VR01)
// (Não precisa de alteração)
exports.getRegistros = async (req, res) => {
    try {
        const registros = await Diario.find({ usuario: req.usuario.id }).sort({ data: -1 });
        res.json(registros);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 3. VISUALIZAR UM (Necessário para Edição)
// (Não precisa de alteração)
exports.getRegistroById = async (req, res) => {
    try {
        const registro = await Diario.findById(req.params.id);
        if (!registro) return res.status(404).json({ msg: 'Registro não encontrado' });

        if (registro.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }
        res.json(registro);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 4. EDITAR REGISTRO (Fluxo ER01)
// MODIFICADO: Agora também atualiza a data
exports.updateRegistro = async (req, res) => {
    const { pesoKg, aguaLitros, data } = req.body;

    try {
        let registro = await Diario.findById(req.params.id);
        if (!registro) return res.status(404).json({ msg: 'Registro não encontrado' });

        if (registro.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }
        
        // Validação (FE3.1 e FE3.2)
        if (!pesoKg || !aguaLitros || !data) {
            return res.status(400).json({ msg: 'Campos "Data", "Peso" e "Água" são obrigatórios.' });
        }
        if (pesoKg <= 0 || aguaLitros < 0) {
            return res.status(400).json({ msg: 'Valores de peso e água devem ser positivos.' });
        }
        
        // Converte a data do input (YYYY-MM-DD) para UTC
        const [year, month, day] = data.split('-').map(Number);
        const dataFormatada = new Date(Date.UTC(year, month - 1, day));
        
        // Cria o objeto de atualização
        const dadosAtualizados = {
            ...req.body,
            data: dataFormatada // Garante que a data seja salva corretamente
        };

        registro = await Diario.findByIdAndUpdate(
            req.params.id,
            { $set: dadosAtualizados },
            { new: true }
        );
        res.json(registro);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 5. EXCLUIR REGISTRO (Fluxo XR01)
// (Não precisa de alteração)
exports.deleteRegistro = async (req, res) => {
    try {
        let registro = await Diario.findById(req.params.id);
        if (!registro) return res.status(404).json({ msg: 'Registro não encontrado' });

        if (registro.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        await Diario.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Registro do diário removido com sucesso.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};