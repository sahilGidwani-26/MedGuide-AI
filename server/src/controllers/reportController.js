const Report = require('../models/Report');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { callGemini } = require('../ai/gemini');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only images and PDFs are allowed'), false);
  }
});

exports.uploadMiddleware = upload.single('report');

// ── AI analyze ───────────────────────────────────────────────────────────────
const analyzeReportWithAI = async (reportData) => {
  try {
    const { title, type, doctorName, hospitalName, notes } = reportData;

    // Shorter, tighter prompt → fewer tokens → no truncation
    const prompt = `You are a medical report analyzer. Analyze this report and respond ONLY with valid compact JSON (no markdown, no extra spaces).

Report: Title="${title}", Type="${type}", Doctor="${doctorName||'N/A'}", Hospital="${hospitalName||'N/A'}", Notes="${notes||'N/A'}"

JSON format (keep each string under 80 chars):
{"summary":{"en":"summary in english","hi":"hindi summary"},"findings":[{"p":"param","v":"value","s":"normal|high|low|abnormal","en":"meaning","hi":"hindi meaning"}],"diet":{"en":["food1","food2"],"hi":["khana1","khana2"]},"avoid":{"en":["avoid1","avoid2"],"hi":["parhej1","parhej2"]},"lifestyle":{"en":["tip1","tip2"],"hi":["sujhav1","sujhav2"]},"doctorWhen":{"en":"when to see doctor","hi":"doctor kab milein"},"severity":"normal|mild|moderate|severe","urgency":"routine|soon|urgent|emergency"}`;

    const result = await callGemini(prompt);
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Find first { and last } to extract JSON safely
    const start = cleaned.indexOf('{');
    const end   = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON found');

    const jsonStr = cleaned.slice(start, end + 1);
    const parsed  = JSON.parse(jsonStr);

    // Normalize short keys to full keys for frontend compatibility
    return {
      summary:         { english: parsed.summary?.en, hindi: parsed.summary?.hi },
      findings:        (parsed.findings || []).map(f => ({
        parameter: f.p, value: f.v, status: f.s,
        english: f.en, hindi: f.hi,
      })),
      diet:            { english: parsed.diet?.en || [], hindi: parsed.diet?.hi || [] },
      avoid:           { english: parsed.avoid?.en || [], hindi: parsed.avoid?.hi || [] },
      lifestyle:       { english: parsed.lifestyle?.en || [], hindi: parsed.lifestyle?.hi || [] },
      whenToSeeDoctor: { english: parsed.doctorWhen?.en, hindi: parsed.doctorWhen?.hi },
      overallSeverity: parsed.severity || 'normal',
      urgency:         parsed.urgency  || 'routine',
      disclaimer: {
        english: 'Always consult a qualified doctor for medical decisions.',
        hindi:   'कृपया किसी योग्य डॉक्टर से परामर्श लें।',
      },
    };
  } catch (err) {
    console.error('[AI Analysis] Error:', err.message);
    return null;
  }
};

// ── POST /api/reports/upload ──────────────────────────────────────────────────
exports.uploadReport = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please provide a file' });

    const { title, type, notes, doctorName, hospitalName, reportDate } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Report title is required' });

    const isPDF    = req.file.mimetype === 'application/pdf';
    const dataUri  = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder:          `medguide/reports/${req.user.id}`,
      resource_type:   isPDF ? 'raw' : 'image',
      use_filename:    true,
      unique_filename: true,
      timeout:         60000,
    });

    // AI analysis (parallel, non-blocking)
    const aiPromise = analyzeReportWithAI({ title, type, doctorName, hospitalName, notes });

    const report = await Report.create({
      user: req.user.id, title,
      type: type || 'other',
      fileUrl:      uploadResult.secure_url,
      publicId:     uploadResult.public_id,
      fileType:     isPDF ? 'pdf' : 'image',
      notes, doctorName, hospitalName,
      reportDate:   reportDate || Date.now(),
      aiAnalysis:   null,
    });

    // Wait up to 35s for AI
    const aiAnalysis = await Promise.race([
      aiPromise,
      new Promise(r => setTimeout(() => r(null), 35000))
    ]);

    if (aiAnalysis) {
      report.aiAnalysis = aiAnalysis;
      await report.save();
    }

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    console.error('[Report Upload] Error:', error.message, error.http_code);
    if (error.http_code === 403) {
      return res.status(500).json({ success: false, message: 'Cloudinary auth failed — check .env credentials' });
    }
    next(error);
  }
};

// ── POST /api/reports/:id/analyze ─────────────────────────────────────────────
exports.analyzeReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user: req.user.id });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const aiAnalysis = await analyzeReportWithAI({
      title: report.title, type: report.type,
      doctorName: report.doctorName, hospitalName: report.hospitalName,
      notes: report.notes,
    });

    if (aiAnalysis) { report.aiAnalysis = aiAnalysis; await report.save(); }
    res.json({ success: true, data: report });
  } catch (error) { next(error); }
};

exports.getReports = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip  = (page - 1) * limit;
    const type  = req.query.type;
    const query = { user: req.user.id };
    if (type && type !== 'all') query.type = type;
    const reports = await Report.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total   = await Report.countDocuments(query);
    res.json({ success: true, data: reports, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

exports.getReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user: req.user.id });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: report });
  } catch (error) { next(error); }
};

exports.deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user: req.user.id });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    await cloudinary.uploader.destroy(report.publicId, {
      resource_type: report.fileType === 'pdf' ? 'raw' : 'image',
    });
    await report.deleteOne();
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) { next(error); }
};