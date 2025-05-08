const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");


//let MONGODB_URI=`mongodb+srv://manisankar:77HFY1n0QsN6d76L@cluster0.kkwdaye.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors(
/*{
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}*/
));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Nobiasmedia API" });
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
    
    app.use('/api', newsRoutes);
    app.use('/api/auth', authRoutes);
        
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
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
