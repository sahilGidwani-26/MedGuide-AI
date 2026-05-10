const https = require('https');

const callGroq = (prompt, apiKey) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,      // ← Increased from 1024 to avoid JSON truncation
      temperature: 0.3,      // ← Lower temp for more consistent JSON output
      response_format: null,
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`[Groq] Status: ${res.statusCode}`);
        if (!body || body.trim() === '') return reject(new Error('Empty response'));
        let parsed;
        try { parsed = JSON.parse(body); }
        catch (e) { return reject(new Error('JSON parse failed: ' + body.substring(0, 100))); }
        if (parsed.error) return reject(new Error(`Groq Error: ${parsed.error.message}`));
        if (parsed.choices?.[0]?.message?.content) return resolve(parsed.choices[0].message.content);
        return reject(new Error('No content in Groq response'));
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(data);
    req.end();
  });
};

const callGemini = async (prompt) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes('your_') || apiKey.trim() === '') {
    throw new Error('GROQ_API_KEY not set in server/.env');
  }
  try {
    const result = await callGroq(prompt, apiKey);
    console.log('✅ Groq API success');
    return result;
  } catch (err) {
    console.log('❌ Groq failed:', err.message);
    throw err;
  }
};

const analyzeSymptoms = async (symptoms) => {
  const prompt = `You are a medical AI. Analyze symptoms and return ONLY valid JSON (no markdown).

Symptoms: "${symptoms}"

{"possibleConditions":[{"name":"name","probability":"high|medium|low","description":"brief"}],"severityLevel":"low|medium|high|critical","severityScore":5,"precautions":["p1","p2"],"recommendedDoctorType":"type","immediateActions":["a1"],"isEmergency":false,"emergencyWarning":"","homeRemedies":["r1","r2"],"whenToSeekHelp":"when","disclaimer":"Always consult a doctor."}`;

  const response = await callGemini(prompt);
  try {
    const start   = response.indexOf('{');
    const end     = response.lastIndexOf('}');
    const cleaned = response.slice(start, end + 1);
    return JSON.parse(cleaned);
  } catch {
    return {
      possibleConditions: [{ name: "Analysis unavailable", probability: "unknown", description: "Please consult a doctor" }],
      severityLevel: "medium", severityScore: 5,
      precautions: ["Consult a doctor", "Rest and hydrate"],
      recommendedDoctorType: "General Physician",
      immediateActions: ["See a doctor"],
      isEmergency: false, emergencyWarning: "",
      homeRemedies: ["Rest", "Stay hydrated"],
      whenToSeekHelp: "If symptoms persist",
      disclaimer: "Always consult a qualified medical professional."
    };
  }
};

const chatWithAI = async (messages) => {
  const system  = `You are MedGuide AI, a helpful healthcare assistant. Provide health information, symptom explanations, and emergency guidance. Never prescribe medicines. Always recommend consulting real doctors for serious issues. Keep responses concise and helpful.`;
  const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
  return await callGemini(`${system}\n\nConversation:\n${history}\n\nAssistant:`);
};

module.exports = { analyzeSymptoms, chatWithAI, callGemini };