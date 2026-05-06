require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function list() {
  const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent("hello");
  console.log("Success");
}
list().catch(console.error);
