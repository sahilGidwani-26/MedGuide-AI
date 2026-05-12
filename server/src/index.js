const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

require('dotenv').config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const initSocket = require('./sockets/socketHandler');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const symptomRoutes = require('./routes/symptom');
const hospitalRoutes = require('./routes/hospital');
const reportRoutes = require('./routes/report');
const chatRoutes = require('./routes/chat');
const doctorRoutes = require('./routes/doctor');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notification');
const medicineRoutes = require('./routes/medicine');
const firstAidRoutes = require('./routes/firstaid');

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
initSocket(io);

// Make io accessible in routes
app.set('io', io);

// Connect Database
connectDB();

// Security Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'AI rate limit exceeded. Please wait a moment.' }
});

// Body Parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MedGuide AI API is running 🏥',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/symptoms', aiLimiter, symptomRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', aiLimiter, chatRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/medicine', aiLimiter, medicineRoutes);
app.use('/api/first-aid', firstAidRoutes);
// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 MedGuide AI Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Origin: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

module.exports = { app, server };
