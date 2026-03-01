require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Connect Database
connectDB();

const app = express();

// Security & Optimization Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: (process.env.CLIENT_URL || '').split(',').map(u => u.trim()).filter(Boolean).concat(['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178']),
    credentials: true,
}));

// Port configuration
const PORT = process.env.PORT || 5000;

// Trust priority for Render
app.set('trust proxy', 1);

// Health check route for Render
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// App Middleware
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/scheduler', require('./routes/schedulerRoutes'));

app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/qa', require('./routes/qaRoutes'));
app.use('/api/interview', require('./routes/interviewRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));

// Basic Route for health check
app.get('/', (req, res) => {
    res.send('SmartStudy AI API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
