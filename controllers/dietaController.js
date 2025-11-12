const Dieta = require('../models/Dieta');
const Usuario = require('../models/Usuario');
const { GoogleGenAI } = require('@google/genai'); // Usando o SDK do seu modelo

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY); // Usando a sintaxe do seu modelo

/**
 * ROTA: Gerar SUGESTÃO de Plano (IA Profissional Gemini)
 */
exports.gerarPlanoDietaIA = async (req, res) => {
    const usuarioId = req.usuario.id;

    try {
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(4404).json({ msg: 'Usuário não encontrado.' });
        }
        
        const { principal } = usuario.objetivos;
        const { idade, sexo, altura_cm, peso_atual_kg } = usuario.dados_biometricos;
        const sexoTexto = sexo === 'M' ? 'Masculino' : 'Feminino';

        // Prompt (mantido, pois está bom)
        const prompt = `
            Por favor, aja como um nutricionista sênior do app FitOS.
            Eu preciso que você gere um plano alimentar completo EM PORTUGUÊS para um usuário com o seguinte perfil:
            - Objetivo Principal: ${principal}
            - Idade: ${idade}
            - Sexo: ${sexoTexto}
            - Altura: ${altura_cm} m
            - Peso Atual: ${peso_atual_kg} kg

            Sua resposta deve ser APENAS um objeto JSON, sem nenhum outro texto, markdown ou formatação.
            O JSON deve seguir EXATAMENTE esta estrutura.
            NÃO inclua comentários (//) ou vírgulas extras (trailing commas).

            {
              "nomePlano": "IA: ${principal}",
              "explicacao": "Uma explicação curta (2-3 frases) do motivo pelo qual este plano foi escolhido.",
              "cafeDaManha": {
                "alimentos": [{"nome": "Ovo Cozido", "porcao": "2 unidades", "calorias": 140, "proteinas": 12, "carboidratos": 1, "gorduras": 10}],
                "modoPreparo": "Cozinhe os ovos.",
                "totais": {"calorias": 140, "proteinas": 12, "carboidratos": 1, "gorduras": 10}
              },
              "almoco": { "alimentos": [], "modoPreparo": "...", "totais": {} },
              "lanche": { "alimentos": [], "modoPreparo": "...", "totais": {} },
              "jantar": { "alimentos": [], "modoPreparo": "...", "totais": {} },
              "totais": { "calorias": 0, "proteinas": 0, "carboidratos": 0, "gorduras": 0 }
            }
        `;
        
        // [CORREÇÃO] O generationConfig foi removido
        
        // 3. Usando a sintaxe do seu modelo (como em receitasController.js)
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            // generationConfig removido
        });

        // 4. Usando a sintaxe do seu modelo (como em receitasController.js)
        const text = response.text;
        
        // 5. [CORREÇÃO COMBINADA]
        // Etapa 1: Limpeza do ```json (do seu receitasController.js)
        let cleanedText = text.replace(/```json\n|```/g, '').trim();

        // Etapa 2: Limpeza de vírgulas extras (necessária para este JSON complexo)
        cleanedText = cleanedText.replace(/,\s*([\]}])/g, '$1');

        // Etapa 3: Agora o parse deve ser seguro
        const planoJSON = JSON.parse(cleanedText); 

        // 6. Apenas retornar o JSON para o frontend.
        res.status(200).json(planoJSON);

    } catch (error) {
        console.error("Erro na API do Gemini (Gerar Plano):", error.message);
        res.status(503).json({ msg: 'O serviço de planos de dieta (IA) está indisponível ou retornou dados inválidos.' });
    }
};

/**
 * ROTA: Salvar um plano gerado e defini-lo como ativo
 */
exports.salvarPlanoGerado = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { nomePlano, explicacao, cafeDaManha, almoco, lanche, jantar, totais } = req.body;

    if (!nomePlano || !cafeDaManha || !totais) {
        return res.status(400).json({ msg: "Dados do plano inválidos ou incompletos." });
    }

    try {
        await Dieta.updateMany(
            { usuario: usuarioId },
            { $set: { isAtivo: false } }
        );

        const novoPlano = new Dieta({
            usuario: usuarioId,
            isAtivo: true, 
            nomePlano,
            explicacao,
            cafeDaManha,
            almoco,
            lanche,
            jantar,
            totais
        });

        await novoPlano.save();
        res.status(201).json(novoPlano); 

    } catch (error) {
        console.error("Erro ao salvar plano de dieta:", error.message);
        res.status(500).send('Erro no servidor ao salvar o plano.');
    }
};


// ROTA: Buscar Plano ATIVO
exports.getPlanoAtivo = async (req, res) => {
    try {
        const dieta = await Dieta.findOne({ usuario: req.usuario.id, isAtivo: true });
        if (!dieta) {
            return res.status(404).json({ msg: 'Nenhum plano de dieta ativo no momento.' });
        }
        res.json(dieta);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro ao carregar o plano de dieta.');
    }
};

// ROTA: Buscar Planos SALVOS (inativos)
exports.getPlanosSalvos = async (req, res) => {
    try {
        const planos = await Dieta.find({ usuario: req.usuario.id, isAtivo: false })
                                .sort({ createdAt: -1 })
                                .select('nomePlano createdAt'); 
        res.json(planos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro ao carregar planos salvos.');
    }
};

// ROTA: Definir um plano salvo (antigo) como ATIVO
exports.setPlanoAtivo = async (req, res) => {
    const usuarioId = req.usuario.id;
    const planoId = req.params.id;

    try {
        await Dieta.updateMany(
            { usuario: usuarioId },
            { $set: { isAtivo: false } }
        );
        
        const planoAtivado = await Dieta.findOneAndUpdate(
            { _id: planoId, usuario: usuarioId },
            { $set: { isAtivo: true } },
            { new: true } 
        );

        if (!planoAtivado) {
            return res.status(404).json({ msg: "Plano não encontrado ou não pertence a você." });
        }
        
        res.json(planoAtivado);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro ao ativar o plano.');
    }

    exports.deletePlanoSalvo = async (req, res) => {
    const usuarioId = req.usuario.id;
    const planoId = req.params.id;

    try {
        const plano = await Dieta.findOne({ _id: planoId, usuario: usuarioId });

        if (!plano) {
            return res.status(404).json({ msg: "Plano não encontrado ou não pertence a você." });
        }

        // Regra de segurança: Não permitir excluir o plano que está ativo no momento.
        if (plano.isAtivo) {
            return res.status(400).json({ msg: "Você não pode excluir seu plano ativo. Ative outro plano primeiro." });
        }

        // Se não está ativo e pertence ao usuário, pode excluir.
        await Dieta.findByIdAndDelete(planoId);

        res.json({ msg: 'Plano salvo excluído com sucesso.' });

    } catch (error) {
        console.error("Erro ao excluir plano salvo:", error.message);
        res.status(500).send('Erro no servidor ao excluir o plano.');
    }
};
};