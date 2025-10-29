// [POST] Simulação de uma resposta de Chatbot (IA)
exports.responderChat = (req, res) => {
    const { pergunta } = req.body;
    let resposta;
    
    // Simula a lógica de IA
    const q = pergunta ? pergunta.toLowerCase() : "";

    if (q.includes("proteina") || q.includes("massa")) {
        resposta = "Para ganho de massa muscular, mantenha o consumo proteico alto (cerca de 1.6g/kg) e um pequeno excedente calórico.";
    } else if (q.includes("dieta") || q.includes("emagrecer")) {
        resposta = "Para perder peso, o essencial é o déficit calórico. Concentre-se em alimentos integrais e evite açúcares.";
    } else if (q.includes("treino") || q.includes("rotina")) {
        resposta = "Lembre-se de fazer um bom aquecimento. Treine com intensidade e descanse o suficiente para a recuperação.";
    } else {
        resposta = "Olá! Eu sou o assistente de IA do FitOS. Pergunte-me sobre nutrição, treino ou dietas!";
    }

    res.status(200).json({ 
        pergunta: pergunta,
        resposta: resposta,
        status: "Processado por IA (Simulação de Chatbot)"
    });
};