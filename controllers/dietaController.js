const Dieta = require('../models/Dieta');
const Usuario = require('../models/Usuario');
const { GoogleGenAI } = require('@google/genai'); // Usa a biblioteca correta

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

/**
 * [MODIFICADO] ROTA: Gerar SUGESTÃO de Plano (IA Profissional Gemini)
 * Esta rota NÃO salva no banco. Ela apenas retorna o JSON da IA.
 */
exports.gerarPlanoDietaIA = async (req, res) => {
    const usuarioId = req.usuario.id;

    try {
        // 1. Buscar o perfil do usuário (necessário para o prompt)
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuário não encontrado.' });
        }
        
        const { principal } = usuario.objetivos;
        const { idade, sexo, altura_cm, peso_atual_kg } = usuario.dados_biometricos;
        const sexoTexto = sexo === 'M' ? 'Masculino' : 'Feminino';

        // 2. Criar o prompt para a IA (Mantido)
        const prompt = `
            Por favor, aja como um nutricionista sênior do app FitOS.
            Eu preciso que você gere um plano alimentar completo EM PORTUGUÊS para um usuário com o seguinte perfil:
            - Objetivo Principal: ${principal}
            - Idade: ${idade}
            - Sexo: ${sexoTexto}
            - Altura: ${altura_cm} m
            - Peso Atual: ${peso_atual_kg} kg

            Sua resposta deve ser APENAS um objeto JSON, sem nenhum outro texto, markdown ou formatação.
            O JSON deve seguir EXATAMENTE esta estrutura:
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
        
        // 3. Chamar a API do Gemini
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        // 4. Ler a resposta
        const text = response.text;
        const cleanedText = text.replace(/```json\n|```/g, '').trim();
        const planoJSON = JSON.parse(cleanedText);

        // 5. [MODIFICADO] Apenas retornar o JSON para o frontend.
        // Nenhuma lógica de banco de dados aqui.
        res.status(200).json(planoJSON);

    } catch (error) {
        console.error("Erro na API do Gemini (Gerar Plano):", error);
        res.status(503).json({ msg: 'O serviço de planos de dieta (IA) está indisponível.' });
    }
};

/**
 * [NOVO] ROTA: Salvar um plano gerado e defini-lo como ativo
 * O frontend envia o JSON (que a IA gerou) no body desta requisição.
 */
exports.salvarPlanoGerado = async (req, res) => {
    const usuarioId = req.usuario.id;
    // Pega o plano completo que o frontend enviou no body
    const { nomePlano, explicacao, cafeDaManha, almoco, lanche, jantar, totais } = req.body;

    // Validação simples
    if (!nomePlano || !cafeDaManha || !totais) {
        return res.status(400).json({ msg: "Dados do plano inválidos ou incompletos." });
    }

    try {
        // 1. Desativa TODOS os planos existentes deste usuário
        await Dieta.updateMany(
            { usuario: usuarioId },
            { $set: { isAtivo: false } }
        );

        // 2. Cria o novo plano com os dados do body
        const novoPlano = new Dieta({
            usuario: usuarioId,
            isAtivo: true, // Define este como o novo plano ativo
            nomePlano,
            explicacao,
            cafeDaManha,
            almoco,
            lanche,
            jantar,
            totais
        });

        // 3. Salva no banco
        await novoPlano.save();
        
        // Retorna o plano completo salvo (com _id, createdAt, etc.)
        res.status(201).json(novoPlano); 

    } catch (error) {
        console.error("Erro ao salvar plano de dieta:", error.message);
        res.status(500).send('Erro no servidor ao salvar o plano.');
    }
};


// --- ROTAS EXISTENTES (Sem mudanças) ---

// ROTA: Buscar Plano ATIVO
exports.getPlanoAtivo = async (req, res) => {
    try {
        const dieta = await Dieta.findOne({ usuario: req.usuario.id, isAtivo: true });
        if (!dieta) {
            // Isso é normal se o usuário nunca salvou um plano
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
        // Desativa todos os outros planos
        await Dieta.updateMany(
            { usuario: usuarioId },
            { $set: { isAtivo: false } }
        );
        
        // Ativa o plano escolhido
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
};