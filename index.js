const express = require("express");
const bodyParser = require("body-parser");
const dialogflow = require("@google-cloud/dialogflow");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// ✅ Dialogflow usando variables de entorno (Render)
const sessionClient = new dialogflow.SessionsClient({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
});

const PROJECT_ID = "newagent-kcma";
const LANGUAGE_CODE = "es";

// ✅ Token de Whapi desde variables de entorno
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;

function isWithinWorkingHours() {
  const now = new Date();
  const argentinaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
  );

  const day = argentinaTime.getDay();
  const hour = argentinaTime.getHours();

  if (day === 0) return true; // Domingo
  if (day >= 1 && day <= 5) return hour < 9 || hour >= 18; // Lun–Vie
  if (day === 6) return hour < 9 || hour >= 14; // Sábado

  return false;
}

// 🔔 Webhook para Whapi
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

    const userMessage =
      messageData.text?.body ||
      req.body.body ||
      req.body.message ||
      "hola";

    const chatId =
      messageData.chat_id ||
      req.body.chatId ||
      req.body.from;

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

    if (result.intent.displayName !== "Default Fallback Intent") {
      if (chatId && WHAPI_TOKEN) {
        await axios.post(
          "https://gate.whapi.cloud/messages/text",
          {
            to: chatId,
            body: result.fulfillmentText,
          },
          {
            headers: {
              Authorization: `Bearer ${WHAPI_TOKEN}`,
            },
          }
        );
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error Dialogflow");
  }
});

// ✅ Health check
app.get("/", (req, res) => {
  res.send("Servidor activo 🚀");
});

// ✅ Render-friendly
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});




