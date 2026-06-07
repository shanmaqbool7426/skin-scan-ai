require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function list() {
  try {
    console.log("Listing models...");
    const models = await ai.models.list();
    const list = [];
    for await (const model of models) {
      list.push(model.name);
    }
    console.log("All available model names:", list.filter(name => name.includes("flash")));
  } catch (err) {
    console.error("Error listing models:", err.message || err);
  }
}

list();
