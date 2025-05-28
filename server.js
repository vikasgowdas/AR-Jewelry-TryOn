const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB (make sure MongoDB is running locally)
mongoose.connect('mongodb://localhost:27017/artryon', { useNewUrlParser: true, useUnifiedTopology: true });

// User schema
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  avatar: String
});
const User = mongoose.model('User', UserSchema);

// Accessory schema
const AccessorySchema = new mongoose.Schema({
  name: String,
  type: String, // e.g., 'jewel', 'glasses'
  price: String,
  img: String
});
const Accessory = mongoose.model('Accessory', AccessorySchema);

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { username, password, email } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ error: 'Username already exists' });
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hash, email });
  await user.save();
  res.json({ message: 'User registered' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: 'User not found' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid password' });
  const token = jwt.sign({ id: user._id }, 'SECRET');
  res.json({ token, user: { username: user.username, email: user.email, avatar: user.avatar } });
});

// Get profile endpoint (protected)
app.get('/api/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, 'SECRET');
    const user = await User.findById(decoded.id);
    res.json({ username: user.username, email: user.email, avatar: user.avatar });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get all accessories
app.get('/api/accessories', async (req, res) => {
  const accessories = await Accessory.find();
  res.json(accessories);
});

// Add accessory
app.post('/api/accessories', async (req, res) => {
  const { name, type, price, img } = req.body;
  const accessory = new Accessory({ name, type, price, img });
  await accessory.save();
  res.json({ message: 'Accessory added' });
});

// Delete accessory
app.delete('/api/accessories/:id', async (req, res) => {
  await Accessory.findByIdAndDelete(req.params.id);
  res.json({ message: 'Accessory deleted' });
});

// Get accessory by ID
app.get('/api/accessories/:id', async (req, res) => {
  const accessory = await Accessory.findById(req.params.id);
  if (!accessory) return res.status(404).json({ error: 'Not found' });
  res.json(accessory);
});

// Admin login endpoint
app.post('/api/admin-login', async (req, res) => {
  const { username, password } = req.body;
  // Replace with your actual admin credentials or check from DB
  if (username === 'admin' && password === 'admin123') {
    res.json({ token: 'admin-token' });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials' });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));