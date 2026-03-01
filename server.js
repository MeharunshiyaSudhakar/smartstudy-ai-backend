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

// Health check routes (Top priority for environment monitoring)
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.send('SmartStudy AI API is running...');
});

// Security & Optimization Middleware
app.use(helmet());
app.use(compression());
const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

app.options('*', cors()); // handle preflight

// Port configuration
const PORT = process.env.PORT || 5000;

// Trust priority for Render
app.set('trust proxy', 1);

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
