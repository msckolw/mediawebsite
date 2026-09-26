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

const server = http.createServer(app); // Create an HTTP server instance
initSocket(server)

// Middleware
app.use(cors(
{
  origin: ['https://thenobiasmedia.com','https://www.thenobiasmedia.com','http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}
));
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

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log("Connected to Mongo");
    // Routes
    const newsRoutes = require('./routes/newsRoutes');
    const authRoutes = require('./routes/authRoutes');
    
    const paymentRoutes = require('./routes/paymentRoutes');
    const donationRoutes = require('./routes/donationRoutes');
    app.use('/api', newsRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api', paymentRoutes);
    app.use('/api', donationRoutes);
        
    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ message: 'Something broke!', error: err.message });
    });
})
.catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5002;

//changed app to server for socket
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
