require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ── DB Initialization (JSON File based) ──────────────────────────────────────
const DB_PATH = path.join(__dirname, 'users.json');
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify([]));
}

function getUsers() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveUsers(users) {
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_glowai_key_2026';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Helper: Extract JSON ─────────────────────────────────────────────────────
function extractJSON(text) {
  let cleaned = text.trim()
    .replace(/^```json\s*/i, '').replace(/```\s*$/i, '')
    .replace(/^```\s*/, '').replace(/```\s*$/, '')
    .trim();
  try { return JSON.parse(cleaned); } catch (_) {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error('Could not parse JSON from AI response');
}

// ── STEP 1: Validation Prompt ────────────────────────────────────────────────
const VALIDATION_PROMPT = `You are a facial scan quality controller for a medical-grade skin analysis app.
Examine this image and determine if it is suitable for a dermatological skin scan.

Check ALL of the following:
1. Is there a human face visible?
2. Is the face sufficiently close (can you see skin pores/texture)?
3. Is the face centered and not heavily cut off?
4. Is the lighting adequate (not too dark, not washed out by flash)?
5. Is the image blurry or corrupted?

Return ONLY a raw JSON object (no markdown, no explanation):
{
  "validScan": <true or false>,
  "hasFace": <true or false>,
  "faceClose": <true or false — can pores/texture be seen?>,
  "faceCentered": <true or false>,
  "lightingGood": <true or false>,
  "imageSharp": <true or false>,
  "failureCode": <null, or ONE of: "NO_FACE" | "TOO_FAR" | "FACE_CUT_OFF" | "DARK_LIGHTING" | "BRIGHT_OVEREXPOSED" | "BLURRY">,
  "failureReason": <null, or a short plain-English sentence why scan is rejected>
}`;

// ── STEP 2: Deep Skin Analysis Prompt ───────────────────────────────────────
const SCAN_PROMPT = `You are an elite board-certified dermatologist AI performing a clinical-grade facial skin analysis.
Examine the provided image at a micro-level. Analyze each skin pore, texture irregularity, and surface characteristic.

Analyze ALL of the following dimensions:
1. Acne & Congestion  — micro-comedones, cystic acne, pustules, blackheads, active inflammation
2. Pigmentation       — hyperpigmentation, sun spots, post-inflammatory marks, melasma, uneven tone
3. Pores & Texture    — enlarged pores, rough texture, uneven micro-relief
4. Hydration Barrier  — oiliness, dullness, dehydration lines, flakiness, barrier signs
5. Aging & Elasticity — fine lines, wrinkles, sagging, loss of firmness

Return ONLY a valid raw JSON object — no markdown, no extra text:
{
  "glowScore": <integer 0-100>,
  "skinType": "<Oily | Combination | Normal | Dry | Dehydrated | Extremely Oily | Very Dry>",
  "hydration": <integer 0-100>,
  "clarity": <integer 0-100>,
  "smoothness": <integer 0-100>,
  "glow": <integer 0-100>,
  "clinicalSummary": "<2-sentence professional dermatologist-level clinical summary of findings>",
  "recommendations": [
    "<specific actionable recommendation — ingredient, lifestyle, or protection tip>"
  ],
  "issues": [
    {
      "type": "<e.g. Cystic Acne | Hyperpigmentation | Enlarged Pores | Redness | Fine Lines>",
      "severity": "<Low | Mild | Moderate | High | Severe>",
      "count": <integer — estimated count or area percentage>,
      "color": "<hex e.g. #FF3B5C for acne, #FFB800 for pigmentation, #5A7A9F for pores>"
    }
  ]
}

Be hyper-realistic. Only report what you can actually see in this image.`;

// ── Shared helper: call Gemini with image & fallback ─────────────────────────
async function callGemini(prompt, imageBase64, mimeType, isRetry = false) {
  const modelName = isRetry ? 'gemini-1.5-flash' : 'gemini-2.5-flash';
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      }],
    });
    return response?.candidates?.[0]?.content?.parts?.[0]?.text || response?.text || '';
  } catch (error) {
    if (!isRetry) {
      console.warn(`⚠️ Model ${modelName} failed (${error.message}). Retrying with gemini-1.5-flash...`);
      return callGemini(prompt, imageBase64, mimeType, true);
    }
    throw error;
  }
}

// ── Auth Middleware ──────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// ── Auth Endpoints ───────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now(),
      name,
      email,
      password: hashedPassword,
      skinType: 'Combination',
      age: 25,
      isPremium: false,
      created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    const token = jwt.sign({ id: newUser.id, email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: newUser.id, name, email, skinType: newUser.skinType, age: newUser.age, isPremium: newUser.isPremium } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/me', authenticateToken, (req, res) => {
  try {
    const users = getUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/scan ───────────────────────────────────────────────────────────
app.post('/api/scan', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });

    // ── STEP 1: Validate image quality & face presence ───────────────────────
    console.log('🔍 Step 1: Validating image for face & quality...');
    const validationRaw = await callGemini(VALIDATION_PROMPT, imageBase64, mimeType);
    console.log('Validation raw:', validationRaw.substring(0, 300));

    let validation;
    try {
      validation = extractJSON(validationRaw);
    } catch (_) {
      // If validation parse fails, be safe and reject
      return res.status(422).json({
        validationFailed: true,
        failureCode: 'PARSE_ERROR',
        failureReason: 'Could not assess image quality. Please retake the scan.',
      });
    }

    // If validation failed, return structured rejection — NO skin analysis
    if (!validation.validScan) {
      console.log('❌ Validation failed:', validation.failureCode, '-', validation.failureReason);
      return res.status(422).json({
        validationFailed: true,
        failureCode: validation.failureCode || 'UNKNOWN',
        failureReason: validation.failureReason || 'Image not suitable for skin analysis.',
      });
    }

    console.log('✅ Validation passed. Proceeding to deep skin analysis...');

    // ── STEP 2: Full Clinical Skin Analysis ──────────────────────────────────
    console.log('📡 Step 2: Running dermatological AI analysis...');
    const analysisRaw = await callGemini(SCAN_PROMPT, imageBase64, mimeType);
    console.log('Analysis raw (preview):', analysisRaw.substring(0, 400));

    const result = extractJSON(analysisRaw);

    // ── Attach metadata ───────────────────────────────────────────────────────
    result.id = 'scan_' + Date.now();
    result.date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // ── Sanitize numbers ──────────────────────────────────────────────────────
    result.glowScore  = Math.round(Number(result.glowScore)  || 0);
    result.hydration  = Math.round(Number(result.hydration)  || 0);
    result.clarity    = Math.round(Number(result.clarity)    || 0);
    result.smoothness = Math.round(Number(result.smoothness) || 0);
    result.glow       = Math.round(Number(result.glow)       || 0);

    // ── Sanitize text ─────────────────────────────────────────────────────────
    result.clinicalSummary = String(result.clinicalSummary || 'Analysis shows overall healthy skin with minor variations.');
    result.recommendations = Array.isArray(result.recommendations)
      ? result.recommendations.map(String).slice(0, 4)
      : ['Maintain a consistent SPF 30+ daily routine.', 'Use a gentle cleanser twice daily.', 'Stay hydrated and maintain a balanced diet.'];

    if (!Array.isArray(result.issues)) result.issues = [];
    result.issues = result.issues.map((issue) => ({
      type:     String(issue.type     || 'Unknown'),
      severity: String(issue.severity || 'Mild'),
      count:    Math.round(Number(issue.count) || 1),
      color:    String(issue.color    || '#888888'),
    }));

    console.log('🎯 Final scan result ready. Issues found:', result.issues.length);
    res.json(result);

  } catch (error) {
    console.error('❌ Scan Error:', error.message || error);
    res.status(500).json({ error: 'AI analysis failed: ' + (error.message || 'Unknown error') });
  }
});

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', model: 'gemini-2.5-flash', pipeline: '2-step' }));

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 GlowAI Backend running → http://0.0.0.0:${PORT}`);
  console.log(`🔑 Gemini API Key: ${process.env.GEMINI_API_KEY ? '✅ Loaded' : '❌ MISSING!'}`);
  console.log(`📍 Health check  → http://localhost:${PORT}/health\n`);
  console.log(`🔬 Pipeline: Step 1 (Face Validation) → Step 2 (Skin Analysis)\n`);
});
