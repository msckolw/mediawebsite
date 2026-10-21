const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookie = require('cookie-parser');

// Version: 1.1.0 - Removed authentication for news sources
const http = require('http'); // Required for socket.io with Express
const socketIo = require('socket.io');
const { initSocket } = require("./socket");

// Load environment variables
dotenv.config();

const app = express();

const server = http.createServer(app);
initSocket(server)

// Middleware
const allowedOrigins = ['https://thenobiasmedia.com','https://www.thenobiasmedia.com','http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(cookie())
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Nobiasmedia API" });
});

app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? "ok" : "unavailable" });
});

// Register ALL routes immediately — not inside mongoose .then()
// This ensures routes are available as soon as the server starts
const newsRoutes = require('./routes/newsRoutes');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const payuMobileHashRoutes = require('./routes/payuMobileHashRoutes');
const donationRoutes = require('./routes/donationRoutes');

app.use('/api', newsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', paymentRoutes);
app.use('/api/payments/payu', payuMobileHashRoutes);
app.use('/api', donationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

const PORT = process.env.PORT || 5002;

async function startServer() {
    // Do not accept traffic until queries can run. On a cold start, listening
    // earlier lets the first news request time out in Mongoose's query buffer.
    // Cloud Run's default TCP startup probe also uses this port for readiness.
    await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    console.log("Connected to Mongo");

    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

startServer().catch(err => {
    console.error("Backend startup failed:", err);
    process.exit(1);
});
