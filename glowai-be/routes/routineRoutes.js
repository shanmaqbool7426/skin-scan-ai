const express = require('express');
const Routine = require('../models/Routine');
const RoutineLog = require('../models/RoutineLog');
const Scan = require('../models/Scan');
const { GoogleGenAI } = require('@google/genai');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper to get today's date string in YYYY-MM-DD
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function extractJSON(text) {
  let cleaned = text.trim()
    .replace(/^```json\s*/i, '').replace(/```\s*$/i, '')
    .replace(/^```\s*/, '').replace(/```\s*$/, '')
    .trim();
  try { return JSON.parse(cleaned); } catch (_) {}
  const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (match) return JSON.parse(match[0]);
  throw new Error('Could not parse JSON from AI response');
}

// Default routines based on skin type
const getDefaultSteps = (timeOfDay, skinType) => {
  const isMorning = timeOfDay === 'Morning';
  
  if (isMorning) {
    const baseMorning = [
      { order: 1, product: 'Gentle Cleanser', brand: 'CeraVe', description: 'Cleanse face with lukewarm water.', icon: 'water-outline', color: '#00E5FF' },
      { order: 2, product: 'Hydrating Toner', brand: 'Anua', description: 'Apply with hands to damp skin.', icon: 'leaf-outline', color: '#00D4FF' }
    ];

    if (skinType === 'Oily' || skinType === 'Extremely Oily') {
      return [
        ...baseMorning,
        { order: 3, product: 'Niacinamide Serum', brand: 'The Ordinary', description: 'Regulates sebum and refines pores.', icon: 'flask-outline', color: '#9D4EDD' },
        { order: 4, product: 'Lightweight Gel Moisturizer', brand: 'Neutrogena', description: 'Oil-free hydration.', icon: 'sparkles-outline', color: '#2400FF' },
        { order: 5, product: 'Matte Sunscreen SPF 50', brand: 'La Roche-Posay', description: 'Apply 15 mins before sun exposure.', icon: 'sunny-outline', color: '#FFB800' }
      ];
    } else if (skinType === 'Dry' || skinType === 'Very Dry' || skinType === 'Dehydrated') {
      return [
        ...baseMorning,
        { order: 3, product: 'Hyaluronic Acid Serum', brand: 'The Ordinary', description: 'Intense hydration boost.', icon: 'flask-outline', color: '#9D4EDD' },
        { order: 4, product: 'Rich Moisturizing Cream', brand: 'CeraVe', description: 'Locks in moisture & restores barrier.', icon: 'sparkles-outline', color: '#2400FF' },
        { order: 5, product: 'Hydrating Sunscreen SPF 50', brand: 'Beauty of Joseon', description: 'Apply 15 mins before sun exposure.', icon: 'sunny-outline', color: '#FFB800' }
      ];
    } else {
      return [
        ...baseMorning,
        { order: 3, product: 'Vitamin C Serum', brand: 'La Roche-Posay', description: 'Brightens skin and provides antioxidant protection.', icon: 'flask-outline', color: '#9D4EDD' },
        { order: 4, product: 'Daily Moisturizing Lotion', brand: 'CeraVe', description: 'Balanced lightweight hydration.', icon: 'sparkles-outline', color: '#2400FF' },
        { order: 5, product: 'Daily Sunscreen SPF 50', brand: 'Supergoop', description: 'Apply 15 mins before sun exposure.', icon: 'sunny-outline', color: '#FFB800' }
      ];
    }
  } else {
    const baseNight = [
      { order: 1, product: 'Cleansing Balm / Oil', brand: 'Banila Co', description: 'First cleanse to remove sunscreen & oil-based impurities.', icon: 'water-outline', color: '#FF5C8A' },
      { order: 2, product: 'Foaming Cleanser', brand: 'CeraVe', description: 'Second cleanse to clean skin.', icon: 'water-outline', color: '#00E5FF' },
      { order: 3, product: 'Hydrating Toner', brand: 'Anua', description: 'Prep skin for treatments.', icon: 'leaf-outline', color: '#00D4FF' }
    ];

    if (skinType === 'Oily' || skinType === 'Extremely Oily') {
      return [
        ...baseNight,
        { order: 4, product: 'Salicylic Acid (BHA 2%)', brand: "Paula's Choice", description: 'Exfoliates inside pores, reduces blackheads.', icon: 'flask-outline', color: '#9D4EDD' },
        { order: 5, product: 'Soothing Gel Cream', brand: 'Iunik', description: 'Soothing lightweight moisturization.', icon: 'moon-outline', color: '#2400FF' }
      ];
    } else if (skinType === 'Dry' || skinType === 'Very Dry' || skinType === 'Dehydrated') {
      return [
        ...baseNight,
        { order: 4, product: 'Ceramide Barrier Serum', brand: 'Glow Recipe', description: 'Strengthens compromised skin barrier.', icon: 'flask-outline', color: '#9D4EDD' },
        { order: 5, product: 'Night Cream & Sleeping Mask', brand: 'Laneige', description: 'Deep nourishing overnight treatment.', icon: 'moon-outline', color: '#2400FF' },
        { order: 6, product: 'Nourishing Eye Cream', brand: "Kiehl's", description: 'Gently dab around orbital bone.', icon: 'eye-outline', color: '#FF5C8A' }
      ];
    } else {
      return [
        ...baseNight,
        { order: 4, product: 'Retinol 0.2% Serum', brand: 'The Ordinary', description: 'Supports cell turnover, improves texture & fine lines.', icon: 'flask-outline', color: '#9D4EDD' },
        { order: 5, product: 'PM Moisturizing Lotion', brand: 'CeraVe', description: 'Nourishing lightweight night hydration.', icon: 'moon-outline', color: '#2400FF' },
        { order: 6, product: 'Hydrating Eye Cream', brand: 'CeraVe', description: 'Gently dab around orbital bone.', icon: 'eye-outline', color: '#FF5C8A' }
      ];
    }
  }
};

/**
 * @route   GET /api/routines
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const skinType = req.user.skinType || 'Combination';
    const date = req.query.date || getTodayDateString();

    let morningRoutine = await Routine.findOne({ userId: req.userId, timeOfDay: 'Morning' });
    let nightRoutine = await Routine.findOne({ userId: req.userId, timeOfDay: 'Night' });

    if (!morningRoutine) {
      morningRoutine = new Routine({ userId: req.userId, timeOfDay: 'Morning', steps: getDefaultSteps('Morning', skinType) });
      await morningRoutine.save();
    }
    if (!nightRoutine) {
      nightRoutine = new Routine({ userId: req.userId, timeOfDay: 'Night', steps: getDefaultSteps('Night', skinType) });
      await nightRoutine.save();
    }

    const morningLog = await RoutineLog.findOne({ userId: req.userId, routineId: morningRoutine._id, date });
    const nightLog = await RoutineLog.findOne({ userId: req.userId, routineId: nightRoutine._id, date });

    const morningJson = morningRoutine.toJSON();
    morningJson.completedSteps = morningLog ? morningLog.completedSteps.map(id => id.toString()) : [];

    const nightJson = nightRoutine.toJSON();
    nightJson.completedSteps = nightLog ? nightLog.completedSteps.map(id => id.toString()) : [];

    res.json({ morning: morningJson, night: nightJson });
  } catch (error) {
    console.error('Fetch routines error:', error.message);
    res.status(500).json({ error: 'Server error fetching routines' });
  }
});

/**
 * @route   POST /api/routines
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { timeOfDay, steps, isAIGenerated, lastUpdatedBy } = req.body;
    if (!timeOfDay || !['Morning', 'Night'].includes(timeOfDay)) {
      return res.status(400).json({ error: 'Valid timeOfDay is required (Morning or Night)' });
    }
    if (!Array.isArray(steps)) {
      return res.status(400).json({ error: 'Steps must be an array' });
    }
    const formattedSteps = steps.map((step, idx) => ({
      product: step.product,
      brand: step.brand || '',
      description: step.description || '',
      icon: step.icon || (timeOfDay === 'Morning' ? 'sunny-outline' : 'moon-outline'),
      color: step.color || (timeOfDay === 'Morning' ? '#00D4FF' : '#2400FF'),
      order: idx + 1,
    }));

    let routine = await Routine.findOne({ userId: req.userId, timeOfDay });
    if (routine) {
      routine.steps = formattedSteps;
      if (isAIGenerated !== undefined) routine.isAIGenerated = isAIGenerated;
      if (lastUpdatedBy) routine.lastUpdatedBy = lastUpdatedBy;
    } else {
      routine = new Routine({ userId: req.userId, timeOfDay, steps: formattedSteps, isAIGenerated: isAIGenerated || false, lastUpdatedBy: lastUpdatedBy || 'user' });
    }
    await routine.save();
    res.json(routine);
  } catch (error) {
    console.error('Update routine error:', error.message);
    res.status(500).json({ error: 'Server error saving routine' });
  }
});

/**
 * @route   POST /api/routines/regenerate
 * @desc    Use AI to regenerate routines based on latest scan results & user profile
 */
router.post('/regenerate', authenticateToken, async (req, res) => {
  try {
    const skinType = req.user.skinType || 'Combination';
    
    // Fetch latest scan for personalized issues
    const latestScan = await Scan.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    
    const scanContext = latestScan ? `
Latest Skin Scan Results:
- Glow Score: ${latestScan.glowScore}/100
- Skin Type: ${latestScan.skinType}
- Hydration: ${latestScan.hydration}%
- Clarity: ${latestScan.clarity}%
- Smoothness: ${latestScan.smoothness}%
- Key Issues Detected: ${latestScan.issues?.map(i => `${i.type} (${i.severity})`).join(', ') || 'None'}
- Clinical Summary: ${latestScan.clinicalSummary || 'N/A'}
- Prior Recommendations: ${latestScan.recommendations?.join(', ') || 'None'}
    `.trim() : `No recent scan. Skin Type: ${skinType}`;

    const prompt = `You are a board-certified dermatologist creating a personalized skincare routine.

${scanContext}

Create a PERSONALIZED Morning and Night skincare routine for this user.
Return ONLY a raw JSON array (no markdown) in this exact format:
[
  {
    "timeOfDay": "Morning",
    "steps": [
      {
        "order": 1,
        "product": "Product Name",
        "brand": "Brand Name",
        "description": "How to apply and why it helps their specific skin concern.",
        "icon": "water-outline",
        "color": "#00E5FF"
      }
    ]
  },
  {
    "timeOfDay": "Night",
    "steps": [...]
  }
]

Icons must be valid Ionicons names (e.g. water-outline, flask-outline, leaf-outline, sparkles-outline, moon-outline, sunny-outline, eye-outline, shield-outline, heart-outline).
Colors should be hex colors matching product type (cleanser: #00E5FF, toner: #00D4FF, serum: #9D4EDD, moisturizer: #2400FF, sunscreen: #FFB800, treatment: #FF3B5C, eye cream: #FF5C8A).
Provide exactly 5-6 morning steps and 5-7 night steps.
Be highly specific to the detected skin concerns. Each description should explain WHY this product helps their specific issue.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    const rawText = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const routinesData = extractJSON(rawText);

    const saved = [];
    for (const routineData of routinesData) {
      const { timeOfDay, steps } = routineData;
      if (!['Morning', 'Night'].includes(timeOfDay)) continue;
      
      const formattedSteps = steps.map((step, idx) => ({
        product: String(step.product || ''),
        brand: String(step.brand || ''),
        description: String(step.description || ''),
        icon: String(step.icon || 'flask-outline'),
        color: String(step.color || '#00D4FF'),
        order: idx + 1,
      }));

      let routine = await Routine.findOne({ userId: req.userId, timeOfDay });
      if (routine) {
        routine.steps = formattedSteps;
        routine.isAIGenerated = true;
        routine.lastUpdatedBy = 'AI';
      } else {
        routine = new Routine({ userId: req.userId, timeOfDay, steps: formattedSteps, isAIGenerated: true, lastUpdatedBy: 'AI' });
      }
      await routine.save();
      saved.push(routine);
    }

    res.json({ message: 'Routines regenerated by AI successfully', routines: saved });
  } catch (error) {
    console.error('AI regenerate error:', error.message);
    res.status(500).json({ error: 'AI routine generation failed: ' + error.message });
  }
});

/**
 * @route   PUT /api/routines/:id/steps
 * @desc    Add a custom step to a routine
 */
router.put('/:id/steps', authenticateToken, async (req, res) => {
  try {
    const { product, brand, description, icon, color } = req.body;
    if (!product) return res.status(400).json({ error: 'Product name is required' });

    const routine = await Routine.findOne({ _id: req.params.id, userId: req.userId });
    if (!routine) return res.status(404).json({ error: 'Routine not found' });

    const newStep = {
      product,
      brand: brand || '',
      description: description || '',
      icon: icon || 'flask-outline',
      color: color || '#00D4FF',
      order: routine.steps.length + 1,
    };
    routine.steps.push(newStep);
    routine.lastUpdatedBy = 'user';
    await routine.save();

    res.json(routine);
  } catch (error) {
    console.error('Add step error:', error.message);
    res.status(500).json({ error: 'Server error adding step' });
  }
});

/**
 * @route   DELETE /api/routines/:id/steps/:stepId
 * @desc    Remove a step from a routine
 */
router.delete('/:id/steps/:stepId', authenticateToken, async (req, res) => {
  try {
    const routine = await Routine.findOne({ _id: req.params.id, userId: req.userId });
    if (!routine) return res.status(404).json({ error: 'Routine not found' });

    routine.steps = routine.steps.filter(s => s._id.toString() !== req.params.stepId);
    // Re-order
    routine.steps.forEach((s, i) => { s.order = i + 1; });
    routine.lastUpdatedBy = 'user';
    await routine.save();

    res.json(routine);
  } catch (error) {
    console.error('Delete step error:', error.message);
    res.status(500).json({ error: 'Server error deleting step' });
  }
});

/**
 * @route   POST /api/routines/:id/complete
 */
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { date = getTodayDateString(), completedSteps } = req.body;
    const routineId = req.params.id;

    if (!Array.isArray(completedSteps)) {
      return res.status(400).json({ error: 'completedSteps must be an array' });
    }

    const routine = await Routine.findOne({ _id: routineId, userId: req.userId });
    if (!routine) return res.status(404).json({ error: 'Routine not found' });

    const log = await RoutineLog.findOneAndUpdate(
      { userId: req.userId, routineId, date },
      { completedSteps, totalSteps: routine.steps.length },
      { upsert: true, new: true }
    );

    res.json({ message: 'Routine status updated successfully', log });
  } catch (error) {
    console.error('Complete step error:', error.message);
    res.status(500).json({ error: 'Server error updating routine completion' });
  }
});

/**
 * @route   GET /api/routines/streak
 */
router.get('/streak', authenticateToken, async (req, res) => {
  try {
    const logs = await RoutineLog.find({
      userId: req.userId,
      'completedSteps.0': { $exists: true }
    }).sort({ date: -1 });

    if (logs.length === 0) return res.json({ currentStreak: 0, longestStreak: 0 });

    const uniqueDates = [...new Set(logs.map(log => log.date))].sort().reverse();
    let currentStreak = 0;
    const todayStr = getTodayDateString();
    const msInDay = 24 * 60 * 60 * 1000;
    const newestDate = uniqueDates[0];
    const diffDays = Math.floor((new Date(todayStr) - new Date(newestDate)) / msInDay);

    if (diffDays <= 1) {
      currentStreak = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const curr = new Date(uniqueDates[i]);
        const next = new Date(uniqueDates[i + 1]);
        const diff = Math.floor((curr - next) / msInDay);
        if (diff === 1) { currentStreak++; } else if (diff > 1) { break; }
      }
    }

    let longestStreak = 0;
    if (uniqueDates.length > 0) {
      let tempStreak = 1;
      longestStreak = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const curr = new Date(uniqueDates[i]);
        const next = new Date(uniqueDates[i + 1]);
        const diff = Math.floor((curr - next) / msInDay);
        if (diff === 1) { tempStreak++; if (tempStreak > longestStreak) longestStreak = tempStreak; }
        else if (diff > 1) { tempStreak = 1; }
      }
    }

    res.json({ currentStreak, longestStreak: Math.max(currentStreak, longestStreak) });
  } catch (error) {
    console.error('Streak calculation error:', error.message);
    res.status(500).json({ error: 'Server error calculating streak' });
  }
});

/**
 * @route   GET /api/routines/analytics
 * @desc    Get 7-day daily completion percentages for the weekly chart
 */
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const result = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
      
      const logs = await RoutineLog.find({ userId: req.userId, date: dateStr });
      
      let totalCompleted = 0;
      let totalSteps = 0;
      for (const log of logs) {
        totalCompleted += log.completedSteps.length;
        totalSteps += log.totalSteps;
      }
      
      result.push({
        date: dateStr,
        day: dayName,
        completionPct: totalSteps > 0 ? Math.round((totalCompleted / totalSteps) * 100) : 0,
        completedSteps: totalCompleted,
        totalSteps,
      });
    }
    
    // Also compute average
    const avgCompletion = result.length > 0
      ? Math.round(result.reduce((sum, d) => sum + d.completionPct, 0) / result.length)
      : 0;

    res.json({ days: result, avgCompletion });
  } catch (error) {
    console.error('Analytics fetch error:', error.message);
    res.status(500).json({ error: 'Server error fetching analytics' });
  }
});

/**
 * @route   GET /api/routines/history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    const logs = await RoutineLog.find({ userId: req.userId, createdAt: { $gte: dateLimit } }).sort({ date: 1 });
    res.json(logs);
  } catch (error) {
    console.error('History fetch error:', error.message);
    res.status(500).json({ error: 'Server error fetching history' });
  }
});

module.exports = router;
