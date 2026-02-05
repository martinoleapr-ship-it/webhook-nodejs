app.post("/webhook", async (req, res) => {
  try {
    if (!isWithinWorkingHours()) {
      console.log("Fuera de horario.");
      return res.status(200).send("Fuera de horario");
    }

    const messageData = req.body.messages
      ? req.body.messages[0]
      : req.body;

    if (messageData.from_me) {
      console.log("Mensaje del bot ignorado.");
      return res.status(200).send("OK");
    }

    const chatId =
      messageData.chat_id ||
      req.body.chatId ||
      req.body.from;

    // === FILTRO PARA IGNORAR MENSAJES DE GRUPO ===
    if (chatId && chatId.endsWith('@g.us')) {
      console.log('Mensaje de grupo ignorado:', chatId);
      return res.status(200).send("Mensaje de grupo ignorado");
    }

    const userMessage =
      messageData.text?.body ||
      req.body.body ||
      req.body.message ||
      "hola";

    const sessionPath = sessionClient.projectAgentSessionPath(
      PROJECT_ID,
      chatId || "global-session"
    );




