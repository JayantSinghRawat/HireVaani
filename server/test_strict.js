const axios = require('axios');

async function test() {
  const payloadBad = {
    sessionId: 'test-bad-123',
    name: 'Bad Candidate',
    role: 'software_engineer',
    language: 'en',
    email: 'bad@example.com',
    answers: [{
      questionText: "Explain the CAP theorem. Give an example of a system that prioritizes Availability over Consistency.",
      transcript: "Uh, CAP theorem is about capitals. I think availability is good because the system is online. I don't know an example."
    }],
    faceAlerts: 0,
    trustScore: 100
  };

  const payloadGood = {
    sessionId: 'test-good-456',
    name: 'Good Candidate',
    role: 'software_engineer',
    language: 'en',
    email: 'good@example.com',
    answers: [{
      questionText: "Explain the CAP theorem. Give an example of a system that prioritizes Availability over Consistency.",
      transcript: "The CAP theorem states that a distributed data store can only guarantee two out of three features: Consistency, Availability, and Partition tolerance. Since network partitions are inevitable, we must choose between Consistency and Availability. An example of prioritizing Availability is Cassandra, which uses eventual consistency to ensure reads and writes always succeed even during a partition."
    }],
    faceAlerts: 0,
    trustScore: 100
  };

  try {
    console.log("Testing BAD answer...");
    const resBad = await axios.post('http://localhost:8000/api/evaluate', payloadBad);
    console.log("BAD RESULT:", JSON.stringify(resBad.data.answers[0].geminiScores, null, 2));

    console.log("\nTesting GOOD answer...");
    const resGood = await axios.post('http://localhost:8000/api/evaluate', payloadGood);
    console.log("GOOD RESULT:", JSON.stringify(resGood.data.answers[0].geminiScores, null, 2));

  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

test();
