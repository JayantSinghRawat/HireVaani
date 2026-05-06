require('dotenv').config();
const { evaluateAnswer } = require('./src/services/gemini');

async function test() {
  const bad = await evaluateAnswer({
    question: "Explain the CAP theorem.",
    transcript: "Uh, CAP theorem is about capitals. I think availability is good because the system is online.",
    role: "software_engineer",
    language: "en"
  });
  console.log("BAD:", bad);

  const good = await evaluateAnswer({
    question: "Explain the CAP theorem.",
    transcript: "The CAP theorem states that a distributed data store can only guarantee two out of three features: Consistency, Availability, and Partition tolerance.",
    role: "software_engineer",
    language: "en"
  });
  console.log("GOOD:", good);
}
test().catch(console.error);
