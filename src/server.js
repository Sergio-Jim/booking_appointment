import express from "express";
import { decryptRequest, encryptResponse, FlowEndpointException } from "./encryption.js";
import { getNextScreen } from "./flow.js";
import crypto from "crypto";
import dotenv from 'dotenv';
import cors from "cors";
dotenv.config();

const app = express();

const { APP_SECRET, PRIVATE_KEY, PASSPHRASE, FLOW_TOKEN, TOKEN, PORT = "3000" } = process.env;

console.log("Passphrase: ", process.env.PASSPHRASE);

app.use(cors());

app.use(
  express.json({
    // Store the raw request body to use it for signature verification
    verify: (req, res, buf, encoding) => {
      req.rawBody = buf?.toString(encoding || "utf8");
    },
  }),
);

app.use((req, res, next) => {
  console.log("📥 Incoming request headers:", req.headers);
  console.log("📩 Incoming request body:", JSON.stringify(req.body, null, 2));
  next();
});

app.post("/webhook", async (req, res) => {
  console.log("Received Webhook Event:", JSON.stringify(req.body, null, 2));

  const { action } = req.body;

  if (action === "INIT" || action === "data_exchange") {
    console.log("🚀 Forwarding request to getNextScreen...");
    try {
      const response = await getNextScreen(req.body);
      console.log("Flow Response:", response);
      return res.status(200).json(response);
    } catch (error) {
      console.error("❌ Error handling flow action:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  if (!PRIVATE_KEY) {
    return res.status(500).send('Private key is empty. Please check your env variable "PRIVATE_KEY".');
  }

  if (!isRequestSignatureValid(req)) {
    return res.sendStatus(432);
  }

  // ✅ Updated Check: If the request is missing encryption keys, assume it's a plain request
  if (!req.body.encrypted_aes_key || !req.body.encrypted_flow_data || !req.body.initial_vector) {
    console.warn("No encryption detected, handling as a plain request.");
    const plainRequest = req.body; // Handle as plain request
    console.log("👉 Plain Request Data:", plainRequest);

    // Process plain WhatsApp message
    return res.status(200).json({ message: "Received plain request", data: plainRequest });
  }

  let decryptedRequest;
  try {
    const formattedPrivateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');
    decryptedRequest = decryptRequest(req.body, formattedPrivateKey, PASSPHRASE);
  } catch (err) {
    console.error(err);

    if (err instanceof FlowEndpointException) {
      return res.sendStatus(err.statusCode);
    }

    return res.sendStatus(500);
  }

  console.log("💬 Decrypted Request:", decryptedRequest.decryptedBody);

  const screenResponse = await getNextScreen(decryptedRequest.decryptedBody);
  console.log("👉 Response to Encrypt:", screenResponse);

  try {
    const encryptedResponse = encryptResponse(
      screenResponse,
      decryptedRequest.aesKeyBuffer,
      decryptedRequest.initialVectorBuffer
    );
    return res.send(encryptedResponse);
  } catch (err) {
    console.error("Encryption failed:", err);
    return res.status(500).json({ error: "Failed to encrypt response" });
  }
});

app.get('/webhook', (req, res) => {
  const token = TOKEN; // Must match the token set in the WhatsApp dashboard

  const mode = req.query['hub.mode'];
  const challenge = req.query['hub.challenge'];
  const verify_token = req.query['hub.verify_token'];

  if (mode === "subscribe" && verify_token === token) {
    console.log("Webhook verified successfully!");
    return res.status(200).send(challenge); // WhatsApp expects this exact response
  }

  console.log("Webhook verification failed.");
  res.status(403).send("Verification failed"); // WhatsApp will reject this
});

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});

function isRequestSignatureValid(req) {
  if (!APP_SECRET) {
    console.warn("App Secret is not set up. Please add your app secret in the .env file to validate requests.");
    return true; // Allow requests if signature validation is disabled
  }

  const signatureHeader = req.get("x-hub-signature-256");

  if (!signatureHeader) {
    console.warn("⚠️ Warning: Missing x-hub-signature-256 header. Request may not be authentic.");
    return false; // Reject the request as invalid
  }

  const signatureBuffer = Buffer.from(signatureHeader.replace("sha256=", ""), "utf-8");

  const hmac = crypto.createHmac("sha256", APP_SECRET);
  const digestString = hmac.update(req.rawBody).digest('hex');
  const digestBuffer = Buffer.from(digestString, "utf-8");

  if (!crypto.timingSafeEqual(digestBuffer, signatureBuffer)) {
    console.error("❌ Error: Request signature did not match.");
    return false;
  }

  return true;
}
