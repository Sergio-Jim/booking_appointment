import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const payload = {
    "encrypted_flow_data": "b4qLnwVEXkz58+0R8e8LdF+waeRGLK+oj4LrINOEtx7ghG9basEArWQp5DluamCSjO4w3dRbfzqzv9F8v+5NZjWRNHMFOxn+1UFBO6HJHPcaAvclXjJURnNZ6yLumIhx0r5cI8M=",
    "encrypted_aes_key": "dBccL9TdkOQBoiDWWxJF68xtUQkur0WKCE2GaSpnPm6/CMcwF9OGJRWYat4/dckyx+iYvYXoGFl7S04JzuZsuVxIN2Twi16YWOEB6gyzGoodMzFjU9jH4gg+SibQ/LNJmJQdDsqXYLpbvVa+AxEwlCSEt1cpLYIj32jqJ/hMsJY0iBfvBCiz52YRUI2jK6HQIpKxMbTI03oSg9q4kN2giZTzNmJ21lyXvRfvj6ehJDY0zYeQYcNfPtmnHdTKXUfpyzjLXo+rgJE3F1DGdScz0Z5F0fnjXbkGYT1Ab1150QZtTZgJFx/psz4So0uQrTC2ck/liiOBvlbPRCYMsSk39Q==",
    "initial_vector": "nIzRcgY5fSn6V4Ys"
};

const rawBody = JSON.stringify(payload);
const hmac = crypto.createHmac('sha256', process.env.APP_SECRET);
const signature = hmac.update(rawBody).digest('hex');

console.log('Signature:', `sha256=${signature}`);
console.log('\nCurl command:');
console.log(`curl.exe -X POST https://allowed-hornet-famous.ngrok-free.app/webhook \\
-H "Content-Type: application/json" \\
-H "x-hub-signature-256: sha256=${signature}" \\
-d '${rawBody}' \\
-k`);