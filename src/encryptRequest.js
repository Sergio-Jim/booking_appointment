import { encryptRequest } from "./encryption.js";
import { createHmac } from "crypto";
import dotenv from "dotenv";

dotenv.config();

const publicPem = process.env.PUBLIC_KEY;

if (!publicPem) {
    throw new Error("PUBLIC_KEY is missing from the .env file");
}

const { APP_SECRET, FLOW_TOKEN } = process.env;

if (!APP_SECRET) {
    throw new Error("APP_SECRET is missing from the .env file");
}

// Ensure the key is properly formatted
const formattedPublicKey = publicPem.replace(/\\n/g, '\n');

const requestBody = JSON.stringify({
    action: "INIT",
    flow_token: process.env.FLOW_TOKEN,
    version: "3.0",
});

// encrypted data
const encryptedData = encryptRequest(requestBody, formattedPublicKey);

console.log("Encrypted Request Payload:", JSON.stringify(encryptedData, null, 2));

// Compute HMAC SHA-256 signature
const hmac = createHmac("sha256", APP_SECRET);
const signature = hmac.update(requestBody).digest("hex");

console.log(`x-hub-signature-256: sha256=${signature}`);