const https = require('https');
const multer = require('multer');

// Multer - memory storage for base64 conversion
const storage = multer.memoryStorage();
exports.uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'), false);
  }
}).single('medicine');

// ── Groq Vision API call ──────────────────────────────────────────────────────
// NOTE: Groq free tier supports llama-3.2-11b-vision-preview for image analysis
const analyzeWithGroqVision = (base64Image, mimeType, apiKey) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` }
            },
            {
              type: 'text',
              text: `You are a medical AI expert. Analyze this medicine image carefully and extract all visible information.

Return ONLY this JSON (no markdown, no backticks):
{
  "medicineName": "exact name from packaging",
  "genericName": "generic/chemical name if visible",
  "manufacturer": "company name if visible",
  "type": "tablet/syrup/capsule/injection/cream/drops/etc",
  "composition": ["ingredient 1", "ingredient 2"],
  "uses": ["what this medicine treats"],
  "dosage": "typical dosage instructions",
  "sideEffects": ["common side effect 1", "side effect 2"],
  "warnings": ["important warning 1", "warning 2"],
  "drugInteractions": ["avoid with drug 1", "avoid with drug 2"],
  "storageInstructions": "how to store",
  "prescription": true or false,
  "expiryVisible": "expiry date if visible, else null",
  "batchNumber": "batch if visible, else null",
  "confidence": "high/medium/low",
  "disclaimer": "Always consult a doctor before taking any medicine.",
  "imageQuality": "good/blurry/partial",
  "additionalInfo": "any other important info visible"
}

If image is not a medicine or too blurry to read, still return JSON with medicineName: "Unable to identify" and confidence: "low".`
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });

    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        console.log('[MedicineScanner] Groq Vision status:', res.statusCode);
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) return reject(new Error(`Groq: ${parsed.error.message}`));
          const text = parsed.choices?.[0]?.message?.content || '';
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          resolve(JSON.parse(cleaned));
        } catch (e) {
          console.log('[MedicineScanner] Parse failed, raw:', body.substring(0, 300));
          reject(new Error('Failed to parse AI response'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(data);
    req.end();
  });
};

// ── Fallback: Text-based medicine analysis (when no image vision) ─────────────
const analyzeWithTextFallback = (medicineName, apiKey) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'user',
        content: `You are a medical AI expert. Provide detailed information about the medicine: "${medicineName}"

Return ONLY this JSON (no markdown, no backticks):
{
  "medicineName": "${medicineName}",
  "genericName": "generic name",
  "manufacturer": "common manufacturers",
  "type": "tablet/syrup/etc",
  "composition": ["ingredient 1"],
  "uses": ["what it treats"],
  "dosage": "typical dosage",
  "sideEffects": ["side effect 1", "side effect 2"],
  "warnings": ["warning 1"],
  "drugInteractions": ["drug to avoid 1"],
  "storageInstructions": "storage info",
  "prescription": true or false,
  "expiryVisible": null,
  "batchNumber": null,
  "confidence": "high",
  "disclaimer": "Always consult a doctor before taking any medicine.",
  "imageQuality": "text-search",
  "additionalInfo": "additional useful information"
}`
      }],
      max_tokens: 800,
      temperature: 0.2
    });

    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) return reject(new Error(parsed.error.message));
          const text = parsed.choices?.[0]?.message?.content || '';
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          resolve(JSON.parse(cleaned));
        } catch { reject(new Error('Parse failed')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(data);
    req.end();
  });
};

// ── POST /api/medicine/scan ───────────────────────────────────────────────────
exports.scanMedicine = async (req, res, next) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ success: false, message: 'GROQ_API_KEY not configured' });

    // Case 1: Image uploaded
    if (req.file) {
      console.log('[MedicineScanner] Image received:', req.file.originalname, req.file.size, 'bytes');
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;

      try {
        const result = await analyzeWithGroqVision(base64, mimeType, apiKey);
        return res.json({ success: true, data: result, method: 'vision' });
      } catch (visionErr) {
        console.log('[MedicineScanner] Vision failed:', visionErr.message);
        // If vision fails, try text fallback with filename as hint
        const nameHint = req.file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        if (nameHint && nameHint.length > 2) {
          try {
            const fallback = await analyzeWithTextFallback(nameHint, apiKey);
            return res.json({ success: true, data: fallback, method: 'text-fallback' });
          } catch {}
        }
        throw visionErr;
      }
    }

    // Case 2: Medicine name typed (text search)
    if (req.body.medicineName && req.body.medicineName.trim().length >= 2) {
      console.log('[MedicineScanner] Text search:', req.body.medicineName);
      const result = await analyzeWithTextFallback(req.body.medicineName.trim(), apiKey);
      return res.json({ success: true, data: result, method: 'text-search' });
    }

    return res.status(400).json({ success: false, message: 'Please upload a medicine image or enter medicine name' });

  } catch (error) {
    console.error('[MedicineScanner] Error:', error.message);
    next(error);
  }
};

// ── POST /api/medicine/interaction ───────────────────────────────────────────
exports.checkInteraction = async (req, res, next) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const { medicines } = req.body; // array of medicine names

    if (!medicines || medicines.length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide at least 2 medicines to check interaction' });
    }

    const data = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'user',
        content: `Check drug interactions between these medicines: ${medicines.join(', ')}

Return ONLY this JSON:
{
  "interactions": [
    {
      "drug1": "medicine name",
      "drug2": "medicine name",
      "severity": "mild/moderate/severe",
      "description": "what happens when combined",
      "recommendation": "what patient should do"
    }
  ],
  "overallRisk": "safe/caution/dangerous",
  "summary": "2-3 sentence summary",
  "disclaimer": "Always consult your doctor or pharmacist before combining medicines."
}`
      }],
      max_tokens: 600,
      temperature: 0.2
    });

    const result = await new Promise((resolve, reject) => {
      const req2 = https.request({
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'Content-Length': Buffer.byteLength(data) }
      }, (r) => {
        let body = '';
        r.on('data', c => body += c);
        r.on('end', () => {
          try {
            const p = JSON.parse(body);
            const text = p.choices?.[0]?.message?.content || '';
            resolve(JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()));
          } catch { reject(new Error('Parse failed')); }
        });
      });
      req2.on('error', reject);
      req2.write(data);
      req2.end();
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/medicine/translate ──────────────────────────────────────────────
exports.translateToHindi = async (req, res, next) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'No text provided' });

    const data = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'user',
        content: `Translate this medicine information JSON to Hindi. Keep medicine names, chemical names, and numbers in English. Only translate the descriptive text.

Input JSON: ${text}

Return ONLY the same JSON structure with Hindi translations. No markdown, no backticks. Keep all keys same, only translate values.`
      }],
      max_tokens: 1000,
      temperature: 0.2
    });

    const result = await new Promise((resolve, reject) => {
      const req2 = https.request({
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(data)
        }
      }, (r) => {
        let body = '';
        r.on('data', c => body += c);
        r.on('end', () => {
          try {
            const p = JSON.parse(body);
            if (p.error) return reject(new Error(p.error.message));
            const t = p.choices?.[0]?.message?.content || '{}';
            const cleaned = t.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            resolve(JSON.parse(cleaned));
          } catch { reject(new Error('Translation parse failed')); }
        });
      });
      req2.on('error', reject);
      req2.setTimeout(20000, () => { req2.destroy(); reject(new Error('Timeout')); });
      req2.write(data);
      req2.end();
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};