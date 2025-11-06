const Diario = require('../models/Diario');

function getInicioDoDia(dataString) {
    const [year, month, day] = dataString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

function getFimDoDia(dataString) {
    const [year, month, day] = dataString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
}

exports.createRegistro = async (req, res) => {
    const { data, alimentosConsumidos, treinoRealizado } = req.body;
    
    const pesoKg = parseFloat(req.body.pesoKg);
    const aguaLitros = parseFloat(req.body.aguaLitros);
    
    if (isNaN(pesoKg) || isNaN(aguaLitros)) {
        return res.status(400).json({ msg: 'Campos "Peso" e "Água" devem ser números válidos.' });
    }
    if (!data) {
         return res.status(400).json({ msg: 'O campo "Data" é obrigatório.' });
    }
    if (pesoKg <= 0 || aguaLitros < 0) {
        return res.status(400).json({ msg: 'Valores de peso e água devem ser positivos.' });
    }

    try {
   
        const dataInicio = getInicioDoDia(data);
        const dataFim = getFimDoDia(data);

        let registro = await Diario.findOne({ 
            usuario: req.usuario.id, 
            data: { $gte: dataInicio, $lte: dataFim } 
        });

        if (registro) {
            return res.status(400).json({ msg: `Já existe um registro para este dia. Você pode editá-lo na lista.` });
        }

        registro = new Diario({
            usuario: req.usuario.id,
            data: dataInicio, 
            pesoKg,
            aguaLitros,
            alimentosConsumidos,
            treinoRealizado
        });

        await registro.save();
        res.status(201).json(registro);

    } catch (err) {
        console.error("Erro ao salvar diário:", err.message);
        res.status(500).send('Erro no Servidor ao salvar o diário.');
    }
};

exports.getRegistros = async (req, res) => {
    try {
        const registros = await Diario.find({ usuario: req.usuario.id }).sort({ data: -1 });
        res.json(registros);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

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

exports.updateRegistro = async (req, res) => {
    const { data } = req.body;
    
    const pesoKg = parseFloat(req.body.pesoKg);
    const aguaLitros = parseFloat(req.body.aguaLitros);
    
    if (isNaN(pesoKg) || isNaN(aguaLitros)) {
        return res.status(400).json({ msg: 'Campos "Peso" e "Água" devem ser números válidos.' });
    }
    if (!data) {
         return res.status(400).json({ msg: 'O campo "Data" é obrigatório.' });
    }
    if (pesoKg <= 0 || aguaLitros < 0) {
        return res.status(400).json({ msg: 'Valores de peso e água devem ser positivos.' });
    }
    
    try {
        let registro = await Diario.findById(req.params.id);
        if (!registro) return res.status(404).json({ msg: 'Registro não encontrado' });
        if (registro.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }
        
        const dataFormatada = getInicioDoDia(data);
        
        const dadosAtualizados = {
            ...req.body,
            data: dataFormatada,
            pesoKg: pesoKg,
            aguaLitros: aguaLitros
        };

        registro = await Diario.findByIdAndUpdate(
            req.params.id,
            { $set: dadosAtualizados },
            { new: true }
        );
        res.json(registro);
    } catch (err)
{
        console.error("Erro ao atualizar diário:", err.message);
        res.status(500).send('Erro no Servidor ao atualizar.');
    }
};

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