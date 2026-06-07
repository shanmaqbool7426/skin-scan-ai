const express = require('express');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const Scan = require('../models/Scan');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();
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

// ── Helper: read file to base64 ───────────────────────────────────────────────
function fileToBase64(filePath) {
  return fs.readFileSync(filePath).toString('base64');
}

// ── Validation Prompt (single image) ─────────────────────────────────────────
const VALIDATION_PROMPT = `You are a facial scan quality controller for a medical-grade skin analysis app.
Examine this image and determine if it is suitable for a dermatological skin scan.

Be LENIENT — this is a selfie taken on a smartphone. The face does NOT need to fill the entire frame.
Only reject if there is a CLEAR, OBVIOUS problem.

Accept the image (validScan: true) if:
- A human face is clearly visible (even at moderate distance)
- The lighting is reasonable (not pitch-black or completely washed out)
- The image is not severely blurry

Only reject (validScan: false) if ONE of these is clearly true:
- NO_FACE: No human face is visible at all, or it's a photo of something else entirely
- TOO_FAR: The face is so far away it's just a tiny dot with no skin detail visible (e.g. full body shot from 3+ meters)
- DARK_LIGHTING: The image is so dark the face is barely visible
- BRIGHT_OVEREXPOSED: The image is completely washed out / all white
- BLURRY: The image is severely motion-blurred or out of focus (not just slightly soft)

Do NOT reject for moderate distance, side angles, or partial face. Be generous.

Return ONLY a raw JSON object (no markdown, no explanation):
{
  "validScan": <true or false>,
  "hasFace": <true or false>,
  "faceClose": <true or false>,
  "lightingGood": <true or false>,
  "imageSharp": <true or false>,
  "failureCode": <null, or ONE of: "NO_FACE" | "TOO_FAR" | "DARK_LIGHTING" | "BRIGHT_OVEREXPOSED" | "BLURRY">,
  "failureReason": <null, or a short plain-English reason>
}`;

// ── Multi-angle Deep Analysis Prompt ─────────────────────────────────────────
const MULTI_ANGLE_PROMPT = `You are an elite board-certified dermatologist AI performing a clinical-grade multi-angle facial skin analysis.

You have been provided with up to 3 images of the same person's face:
- Image 1: Front-facing view
- Image 2: Left side profile (if provided)
- Image 3: Right side profile (if provided)

Cross-reference ALL provided angles to produce a highly accurate, comprehensive dermatological report. Use each angle to detect issues that may not be visible from a single perspective (e.g. jaw acne, temple pigmentation, side cheek texture, uneven oil distribution).

Analyze ALL dimensions at a micro-level:
1. Acne & Congestion — micro-comedones, cystic acne, pustules, blackheads, active inflammation, jawline acne
2. Pigmentation — hyperpigmentation, sun spots, post-inflammatory marks, melasma, uneven tone, temple spots
3. Pores & Texture — enlarged pores, rough texture, uneven micro-relief, cheek texture
4. Hydration Barrier — oiliness, dullness, dehydration lines, flakiness, barrier dysfunction
5. Aging & Elasticity — fine lines, wrinkles, sagging, nasolabial folds, loss of firmness
6. Redness & Sensitivity — rosacea, broken capillaries, reactive zones, inflamed patches

Return ONLY a valid raw JSON object — no markdown, no extra text:
{
  "glowScore": <integer 0-100, reflecting overall skin health across ALL angles>,
  "skinType": "<Oily | Combination | Normal | Dry | Dehydrated | Extremely Oily | Very Dry>",
  "hydration": <integer 0-100>,
  "clarity": <integer 0-100>,
  "smoothness": <integer 0-100>,
  "glow": <integer 0-100>,
  "clinicalSummary": "<2-3 sentence professional dermatologist summary referencing multi-angle findings>",
  "recommendations": [
    "<specific actionable recommendation — ingredient, product type, or lifestyle tip>"
  ],
  "issues": [
    {
      "type": "<e.g. Cystic Acne | Jawline Breakouts | Hyperpigmentation | Enlarged Pores | Redness | Fine Lines | Blackheads>",
      "severity": "<Low | Mild | Moderate | High | Severe>",
      "count": <integer — estimated count or area percentage>,
      "color": "<hex color for this issue type>"
    }
  ]
}

Be realistic but constructive. Analyze whatever skin detail is visible — even moderate-distance selfies contain enough data for useful analysis. If some details are not perfectly clear, make reasonable clinical estimations. Provide at least 4 specific, actionable recommendations tailored to the detected skin type and issues.`;

// ── Gemini call with multiple image parts ─────────────────────────────────────
async function callGeminiMultiImage(prompt, imageParts, isRetry = false) {
  const modelName = isRetry ? 'gemini-2.5-flash-lite' : 'gemini-2.5-flash';
  try {
    const parts = [{ text: prompt }, ...imageParts];
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts }],
    });
    return response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    if (!isRetry) {
      console.warn(`⚠️ ${modelName} failed. Retrying with gemini-2.5-flash-lite...`);
      return callGeminiMultiImage(prompt, imageParts, true);
    }
    throw error;
  }
}

async function callGeminiSingle(prompt, imageBase64, mimeType, isRetry = false) {
  const modelName = isRetry ? 'gemini-2.5-flash-lite' : 'gemini-2.5-flash';
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType, data: imageBase64 } }] }],
    });
    return response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    if (!isRetry) {
      console.warn(`⚠️ ${modelName} failed. Retrying with gemini-2.5-flash-lite...`);
      return callGeminiSingle(prompt, imageBase64, mimeType, true);
    }
    throw error;
  }
}

/**
 * @route   POST /api/scan
 * @desc    Multi-angle skin scan — accepts front + optional left + right images.
 *          Each image validated individually. AI analyses all together for max accuracy.
 * @access  Private
 */
router.post('/', authenticateToken, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'imageLeft', maxCount: 1 },
  { name: 'imageRight', maxCount: 1 },
]), async (req, res) => {
  const uploadedPaths = [];

  try {
    // ── Collect all uploaded images ───────────────────────────────────────────
    const imageSlots = [
      { field: 'image',      label: 'Front' },
      { field: 'imageLeft',  label: 'Left'  },
      { field: 'imageRight', label: 'Right' },
    ];

    const images = []; // { base64, mimeType, imagePath, label }

    for (const slot of imageSlots) {
      const files = req.files?.[slot.field];
      if (files && files.length > 0) {
        const file = files[0];
        uploadedPaths.push(file.path);
        const base64 = fileToBase64(file.path);
        images.push({
          base64,
          mimeType: file.mimetype || 'image/jpeg',
          imagePath: `/uploads/${file.filename}`,
          label: slot.label,
        });
      } else if (req.body?.[`${slot.field}Base64`]) {
        // Base64 fallback (web)
        const base64 = req.body[`${slot.field}Base64`];
        const mimeType = req.body[`${slot.field}MimeType`] || 'image/jpeg';
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        const ext = mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg';
        const filename = `scan-${slot.field}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
        uploadedPaths.push(filePath);
        images.push({ base64, mimeType, imagePath: `/uploads/${filename}`, label: slot.label });
      }
    }

    if (images.length === 0) {
      return res.status(400).json({ error: 'Please upload at least one face image.' });
    }

    // ── STEP 1: Validate each image individually ──────────────────────────────
    console.log(`🔍 Validating ${images.length} image(s)...`);
    for (const img of images) {
      const validationRaw = await callGeminiSingle(VALIDATION_PROMPT, img.base64, img.mimeType);
      let validation;
      try { validation = extractJSON(validationRaw); } catch (_) {
        return res.status(422).json({
          validationFailed: true,
          failureCode: 'PARSE_ERROR',
          failureReason: `Could not assess ${img.label} image quality. Please retake.`,
        });
      }
      if (!validation.validScan) {
        console.log(`❌ ${img.label} validation failed:`, validation.failureCode);
        // cleanup
        for (const p of uploadedPaths) { try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (_) {} }
        return res.status(422).json({
          validationFailed: true,
          failureCode: validation.failureCode || 'UNKNOWN',
          failureReason: `${img.label} view: ${validation.failureReason || 'Image not suitable for analysis.'}`,
          angleLabel: img.label,
        });
      }
      console.log(`✅ ${img.label} image validated.`);
    }

    // ── STEP 2: Multi-angle deep skin analysis ────────────────────────────────
    console.log(`📡 Running multi-angle AI analysis on ${images.length} image(s)...`);
    const imageParts = images.map((img, idx) => ({
      inlineData: { mimeType: img.mimeType, data: img.base64 },
    }));

    // Prefix prompt with angle context
    let angleContext = `\nImages provided: ${images.map(img => img.label).join(', ')} view(s).`;
    const analysisRaw = await callGeminiMultiImage(MULTI_ANGLE_PROMPT + angleContext, imageParts);
    const result = extractJSON(analysisRaw);

    // ── Sanitize numbers ──────────────────────────────────────────────────────
    const glowScore  = Math.max(0, Math.min(100, Math.round(Number(result.glowScore)  || 0)));
    const hydration  = Math.max(0, Math.min(100, Math.round(Number(result.hydration)  || 0)));
    const clarity    = Math.max(0, Math.min(100, Math.round(Number(result.clarity)    || 0)));
    const smoothness = Math.max(0, Math.min(100, Math.round(Number(result.smoothness) || 0)));
    const glow       = Math.max(0, Math.min(100, Math.round(Number(result.glow)       || 0)));

    const clinicalSummary = String(result.clinicalSummary || 'Analysis shows overall healthy skin.');
    const recommendations = Array.isArray(result.recommendations)
      ? result.recommendations.map(String).slice(0, 6)
      : ['Maintain a consistent SPF 30+ daily routine.'];

    let issues = [];
    if (Array.isArray(result.issues)) {
      issues = result.issues.map((issue) => ({
        type:     String(issue.type     || 'Unknown'),
        severity: String(issue.severity || 'Mild'),
        count:    Math.round(Number(issue.count) || 1),
        color:    String(issue.color    || '#888888'),
      }));
    }

    // ── Save to Database ──────────────────────────────────────────────────────
    const newScan = new Scan({
      userId: req.userId,
      glowScore,
      skinType: result.skinType || 'Combination',
      hydration,
      clarity,
      smoothness,
      glow,
      clinicalSummary,
      recommendations,
      issues,
      imagePath: images[0].imagePath, // primary (front) image
      anglesCount: images.length,
    });

    await newScan.save();

    // Update user skin type if changed
    if (result.skinType && req.user.skinType !== result.skinType) {
      req.user.skinType = result.skinType;
      await req.user.save();
    }

    console.log(`🎯 Multi-angle scan saved. Score: ${glowScore}, Type: ${result.skinType}, Angles: ${images.length}`);
    res.status(201).json(newScan);

  } catch (error) {
    console.error('❌ Scan Error:', error.message || error);
    for (const p of uploadedPaths) { try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (_) {} }
    res.status(500).json({ error: 'AI analysis failed: ' + (error.message || 'Unknown error') });
  }
});

/**
 * @route   GET /api/scans
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page  = parseInt(req.query.page)  || 1;
    const skip  = (page - 1) * limit;
    const scans = await Scan.find({ userId: req.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Scan.countDocuments({ userId: req.userId });
    res.json({ scans, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Fetch scans error:', error.message);
    res.status(500).json({ error: 'Server error fetching scan history' });
  }
});

/**
 * @route   GET /api/scans/latest
 */
router.get('/latest', authenticateToken, async (req, res) => {
  try {
    const latestScan = await Scan.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    if (!latestScan) return res.status(404).json({ error: 'No scans found' });
    res.json(latestScan);
  } catch (error) {
    console.error('Fetch latest scan error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/scans/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.id, userId: req.userId });
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json(scan);
  } catch (error) {
    console.error('Fetch scan error:', error.message);
    if (error.kind === 'ObjectId') return res.status(404).json({ error: 'Scan not found' });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
