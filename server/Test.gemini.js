// ================================
// GEMINI API TEST SCRIPT
// Run: node test-gemini.js
// ================================

const https = require('https');

// ✅ APNA API KEY YAHAN DALO
const API_KEY = process.env.GEMINI_API_KEY || 'APNA_KEY_YAHAN_LIKHO';

const testModel = (modelUrl) => {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      contents: [{ parts: [{ text: "Say hello in one word" }] }]
    });

    const url = new URL(`${modelUrl}?key=${API_KEY}`);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        const modelName = modelUrl.split('/models/')[1].split(':')[0];
        try {
          const parsed = JSON.parse(body);
          if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.log(`✅ WORKS: ${modelName} → "${parsed.candidates[0].content.parts[0].text.trim()}"`);
            resolve({ ok: true, model: modelName });
          } else if (parsed.error) {
            console.log(`❌ FAIL:  ${modelName} → [${parsed.error.code}] ${parsed.error.message}`);
            resolve({ ok: false, model: modelName, error: parsed.error.message });
          } else {
            console.log(`⚠️  UNKNOWN: ${modelName} → ${JSON.stringify(parsed).substring(0, 100)}`);
            resolve({ ok: false });
          }
        } catch(e) {
          console.log(`❌ PARSE FAIL: ${modelName} → ${body.substring(0, 150)}`);
          resolve({ ok: false });
        }
      });
    });
    req.on('error', (e) => {
      console.log(`❌ NETWORK ERROR: ${e.message}`);
      resolve({ ok: false, error: e.message });
    });
    req.setTimeout(10000, () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
    req.write(data);
    req.end();
  });
};

async function main() {
  console.log('\n🔑 Testing API Key:', API_KEY.substring(0, 12) + '...');
  console.log('━'.repeat(55));

  const models = [
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-001:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro-001:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-001:generateContent',
  ];

  for (const model of models) {
    await testModel(model);
  }

  console.log('━'.repeat(55));
  console.log('✅ Jo model WORKS dikhe, uska naam gemini.js mein daalo\n');
}

main();