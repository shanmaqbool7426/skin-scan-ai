require('dotenv').config();
require('dns').setDefaultResultOrder('ipv4first');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const scanRoutes = require('./routes/scanRoutes');
const routineRoutes = require('./routes/routineRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Security & Utility Middleware ───────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows mobile apps to load images served statically
}));
app.use(cors());
app.use(express.json({ limit: '15mb' })); // Allow larger body sizes for base64 images if needed
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ── Static Files ─────────────────────────────────────────────────────────────
// Serve uploaded face photos statically
app.use('/uploads', express.static(uploadsDir));

// ── Rate Limiting ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// ── Mount Routes ─────────────────────────────────────────────────────────────
app.use('/api', authRoutes);         // /api/auth/register, /api/auth/login, /api/user/me
app.use('/api/scan', scanRoutes);    // POST /api/scan (photo analysis)
app.use('/api/scans', scanRoutes);   // GET /api/scans (history), GET /api/scans/latest, GET /api/scans/:id
app.use('/api/routines', routineRoutes); // GET /api/routines, POST /api/routines, POST /api/routines/:id/complete, GET /api/routines/streak, GET /api/routines/history

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Avoid crash if mongoose is referenced but not imported for health check
const mongoose = require('mongoose');

// ── 404 Route ────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Exception:', err);
  
  // Clean up uploaded file if request failed after upload
  if (req.file && fs.existsSync(req.file.path)) {
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupErr) {
      console.error('Failed to clean up file:', cleanupErr.message);
    }
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 GlowAI Production Backend running → http://0.0.0.0:${PORT}`);
  console.log(`🔑 Gemini API Key: ${process.env.GEMINI_API_KEY ? '✅ Loaded' : '❌ MISSING!'}`);
  console.log(`📍 Health check  → http://localhost:${PORT}/health\n`);
});
