const express = require("express");
const bodyParser = require("body-parser");
const dialogflow = require("@google-cloud/dialogflow");
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000; // Asegura que se use el puerto de Replit o 5000 si no está configurado

const sessionClient = new dialogflow.SessionsClient({
  credentials: require("./credentials.json"),
});

const PROJECT_ID = "newagent-kcma";
const LANGUAGE_CODE = "es";

// Token de Whapi desde los secretos de Replit
const WHAPI_TOKEN = process.env.WHAPI_TOKEN; 

function isWithinWorkingHours() {
  const now = new Date();
  // Ajuste a zona horaria de Argentina (UTC-3)
  const argentinaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const day = argentinaTime.getDay(); // 0: Domingo, 1: Lunes, ..., 6: Sábado
  const hour = argentinaTime.getHours();

  // Domingo: Todo el día (00 a 00)
  if (day === 0) return true;

  // Lunes a Viernes: 00-09 y 18-00
  if (day >= 1 && day <= 5) {
    return hour < 9 || hour >= 18;
  }

  // Sábado: 00-09 y 14-00
  if (day === 6) {
    return hour < 9 || hour >= 14;
  }

  return false;
}

// Webhook para recibir mensajes desde WhatsAPI
app.post("/webhook", async (req, res) => {
  try {
    // Si no estamos en horario de atención, ignoramos el mensaje
    if (!isWithinWorkingHours()) {
      console.log("Fuera de horario de atención automática.");
      return res.status(200).send("Fuera de horario");
    }

    // Whapi envía el mensaje en req.body.messages[0]
    const messageData = req.body.messages ? req.body.messages[0] : req.body;

    // FILTRO: Ignorar mensajes enviados por el bot para evitar bucles
    if (messageData.from_me) {
      console.log("Mensaje enviado por el bot ignorado.");
      return res.status(200).send("OK");
    }

    const userMessage = messageData.text?.body || req.body.body || req.body.message || "hola";
    const chatId = messageData.chat_id || req.body.chatId || req.body.from;

    const sessionPath = sessionClient.projectAgentSessionPath(
      PROJECT_ID,
      chatId || "global-session"
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: userMessage,
          languageCode: LANGUAGE_CODE,
        },
      },
    };

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    // Si el intent es Default Fallback Intent, no enviamos mensaje
    if (result.intent.displayName !== "Default Fallback Intent") {
      // Enviar la respuesta de Dialogflow a WhatsApp
      if (chatId && WHAPI_TOKEN) {
        await axios.post('https://gate.whapi.cloud/messages/text', {
          to: chatId,
          body: result.fulfillmentText  // El mensaje de respuesta de Dialogflow
        }, {
          headers: { 'Authorization': `Bearer ${WHAPI_TOKEN}` }
        });
      }
    } else {
      console.log("Fallback intent detected. No response sent.");
    }

    res.status(200).send(); // Responder correctamente a Whapi
  } catch (error) {
    console.error(error);
    res.status(500).send("Error Dialogflow");
  }
});

// Ruta principal para verificar que el servidor está activo
app.get("/", (req, res) => {
  res.send("Servidor activo 🚀");
});

// Asegurarse de que el puerto de Replit sea el correcto para la conexión externa
app.listen(PORT, "0.0.0.0", () => {  // Cambié para asegurar que escuche en 0.0.0.0
  console.log(`Servidor escuchando en puerto ${PORT}`);
});




