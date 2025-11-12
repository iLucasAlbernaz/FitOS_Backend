const Treino = require('../models/Treino');
const Usuario = require('../models/Usuario'); // Adicionado para perfil
const { GoogleGenAI } = require('@google/genai'); // Adicionado para IA

// Configuração do Gemini
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

// --- [NOVO] FUNÇÃO DE SUGESTÃO (IA) ---
exports.sugerirTreino = async (req, res) => {
    const { grupoMuscular } = req.body;
    if (!grupoMuscular) {
        return res.status(400).json({ msg: "Grupo muscular é obrigatório." });
    }

    try {
        // 1. Busca o perfil do usuário
        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuário não encontrado.' });
        }

        // 2. Pega os dados para o prompt
        const { principal } = usuario.objetivos;
        const { idade, sexo } = usuario.dados_biometricos;
        const sexoTexto = sexo === 'M' ? 'Masculino' : 'Feminino';

        // 3. Cria o prompt
        const prompt = `
            Aja como um personal trainer profissional do app FitOS.
            O usuário tem o perfil:
            - Objetivo: ${principal}
            - Idade: ${idade}
            - Sexo: ${sexoTexto}

            Gere uma rotina de treino focada em "${grupoMuscular}".
            O treino deve ter entre 4 e 6 exercícios.
            
            Retorne APENAS um objeto JSON, sem markdown ou texto extra, seguindo esta estrutura:
            {
              "nome": "Sugestão: ${grupoMuscular}",
              "grupoMuscular": "${grupoMuscular} (Foco: ${principal})",
              "exercicios": [
                {
                  "nome": "Nome do Exercício 1",
                  "series": "3",
                  "repeticoes": "10-12",
                  "orientacao": "Uma breve dica de execução ou foco. Ex: 'Mantenha os cotovelos estáveis.'"
                },
                {
                  "nome": "Nome do Exercício 2",
                  "series": "4",
                  "repeticoes": "8-10",
                  "orientacao": "Outra dica de execução."
                }
              ]
            }
        `;

        // 4. Chama a IA
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const text = response.text;
        
        // 5. Limpa o JSON (usando a lógica que funcionou no dietaController)
        let cleanedText = text.replace(/```json\n|```/g, '').trim();
        cleanedText = cleanedText.replace(/,\s*([\]}])/g, '$1');

        const treinoJSON = JSON.parse(cleanedText); 
        
        // 6. Retorna o JSON de preview
        res.status(200).json(treinoJSON);

    } catch (error) {
        console.error("Erro na API do Gemini (Sugerir Treino):", error.message);
        res.status(503).json({ msg: 'O assistente de IA está indisponível ou retornou dados inválidos.' });
    }
};


// --- TEMPLATES ABC (Sua Solicitação) ---
const treinoATemplate = {
    nome: 'Treino A',
    grupoMuscular: 'Peito, Tríceps e Ombros',
    exercicios: [
        { nome: 'Supino Reto (Barra)', series: '3', repeticoes: '8-12', orientacao: 'Manter a barra alinhada com os mamilos.' },
        { nome: 'Supino Inclinado (Halteres)', series: '3', repeticoes: '10', orientacao: 'Focar na contração superior do peito.' },
        { nome: 'Crucifixo (Halteres ou Máquina)', series: '3', repeticoes: '12-15', orientacao: 'Alongar bem o músculo.' },
        { nome: 'Tríceps Pulley (Corda)', series: '3', repeticoes: '12-15', orientacao: 'Manter cotovelos parados ao lado do corpo.' },
        { nome: 'Desenvolvimento (Halteres)', series: '3', repeticoes: '10', orientacao: 'Não deixar os halteres se tocarem no topo.' }
    ]
};

const treinoBTemplate = {
    nome: 'Treino B',
    grupoMuscular: 'Costas e Bíceps',
    exercicios: [
        { nome: 'Puxada Frontal (Pulley)', series: '3', repeticoes: '10-12', orientacao: 'Estufar o peito e puxar a barra em direção a ele.' },
        { nome: 'Remada Curvada (Barra)', series: '3', repeticoes: '8-10', orientacao: 'Manter a coluna reta.' },
        { nome: 'Remada Baixa (Triângulo)', series: '3', repeticoes: '10-12', orientacao: 'Esmagar as escápulas no final.' },
        { nome: 'Rosca Direta (Barra)', series: '3', repeticoes: '10', orientacao: 'Não balançar o corpo.' },
        { nome: 'Rosca Alternada (Halteres)', series: '3', repeticoes: '12', orientacao: 'Girar o punho durante a subida.' }
    ]
};

const treinoCTemplate = {
    nome: 'Treino C',
    grupoMuscular: 'Pernas (Completo)',
    exercicios: [
        { nome: 'Agachamento Livre (Barra)', series: '4', repeticoes: '8-10', orientacao: 'Manter a coluna reta e descer abaixo de 90 graus.' },
        { nome: 'Leg Press 45°', series: '3', repeticoes: '10-12', orientacao: 'Não travar os joelhos no final.' },
        { nome: 'Cadeira Extensora', series: '3', repeticoes: '15', orientacao: 'Segurar 1 segundo no pico da contração.' },
        { nome: 'Mesa Flexora', series: '3', repeticoes: '12-15', orientacao: 'Focar na parte posterior da coxa.' },
        { nome: 'Panturrilha (Máquina)', series: '4', repeticoes: '15-20', orientacao: 'Alongar bem embaixo e contrair no topo.' }
    ]
};

// --- FUNÇÕES DE CRUD (Mantidas do seu arquivo original) ---

exports.gerarTreinosABC = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;

        // Limpa treinos antigos se for o caso (ou você pode querer remover esta linha)
        await Treino.deleteMany({ usuario: usuarioId });

        const treinosParaSalvar = [
            { ...treinoATemplate, usuario: usuarioId },
            { ...treinoBTemplate, usuario: usuarioId },
            { ...treinoCTemplate, usuario: usuarioId }
        ];

        await Treino.insertMany(treinosParaSalvar);
        res.status(201).json({ msg: 'Treinos ABC gerados com sucesso!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

exports.getTreinos = async (req, res) => {
    try {
        const treinos = await Treino.find({ usuario: req.usuario.id }).sort({ nome: 1 });
        res.json(treinos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

exports.getTreinoById = async (req, res) => {
    try {
        const treino = await Treino.findById(req.params.id);
        if (!treino) return res.status(404).json({ msg: 'Treino não encontrado' });

        if (treino.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }
        res.json(treino);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

exports.createTreino = async (req, res) => {
    const { nome, grupoMuscular, exercicios } = req.body;

    if (!nome || !grupoMuscular || !exercicios || exercicios.length === 0) {
        return res.status(400).json({ msg: 'Por favor, preencha todos os campos e adicione ao menos um exercício.' });
    }

    try {
        const novoTreino = new Treino({
            usuario: req.usuario.id,
            nome,
            grupoMuscular,
            exercicios // Isto já inclui o campo 'orientacao' vindo do frontend
        });

        const treino = await novoTreino.save();
        res.status(201).json(treino);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

exports.updateTreino = async (req, res) => {
    try {
        let treino = await Treino.findById(req.params.id);
        if (!treino) return res.status(404).json({ msg: 'Treino não encontrado' });

        if (treino.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        // $set: req.body já atualiza os exercícios com o novo campo 'orientacao'
        treino = await Treino.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, 
            { new: true }       
        );
        res.json(treino);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

exports.deleteTreino = async (req, res) => {
    try {
        let treino = await Treino.findById(req.params.id);
        if (!treino) return res.status(404).json({ msg: 'Treino não encontrado' });

        if (treino.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        await Treino.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Treino removido com sucesso.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};