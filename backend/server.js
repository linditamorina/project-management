const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Importimi i Rrugëve - Sigurohu që emrat e skedarëve në folderin routes janë fiks këta
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects'); 

// Përdorimi i Rrugëve
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Lidhja me MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/visionDB')
  .then(() => console.log("✅ MongoDB connection established successfully!"))
  .catch(err => console.error("❌ Error connecting to MongoDB:", err));

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});