// server.js

// 1. Import Dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors'); // To allow frontend to access

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // **STRONG SECRET IN PRODUCTION**

// 2. Middleware
app.use(express.json()); // Body parser for JSON
app.use(cors()); // Enable CORS for all origins (for development, restrict in production)

// 3. Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// 4. Mongoose Schema and Model for User (for authentication)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', userSchema);

// 5. Mongoose Schema and Model for Todo
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  completed: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Link todo to a user
}, { timestamps: true }); // Add createdAt and updatedAt

const Todo = mongoose.model('Todo', todoSchema);

// 6. JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // No token

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = user; // Attach user payload to request
    next();
  });
};

// 7. Authentication Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    res.status(201).send('User registered successfully');
  } catch (err) {
    if (err.code === 11000) { // Duplicate key error for unique username
      return res.status(409).send('Username already exists');
    }
    res.status(500).send('Error registering user');
    console.error(err);
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).send('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send('Invalid credentials');
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).send('Error logging in');
    console.error(err);
  }
});

// 8. TODO API Endpoints (Protected by JWT)

// Get all todos for the authenticated user
app.get('/api/todos', authenticateToken, async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.user.id }).sort({ dueDate: 1 });
    res.json(todos);
  } catch (err) {
    res.status(500).send('Error fetching todos');
    console.error(err);
  }
});

// Add a new todo
app.post('/api/todos', authenticateToken, async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    const newTodo = new Todo({
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      user: req.user.id
    });
    const savedTodo = await newTodo.save();
    res.status(201).json(savedTodo);
  } catch (err) {
    res.status(400).send('Error adding todo');
    console.error(err);
  }
});

// Get a single todo by ID (optional, for editing)
app.get('/api/todos/:id', authenticateToken, async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user.id });
    if (!todo) {
      return res.status(404).send('Todo not found or unauthorized');
    }
    res.json(todo);
  } catch (err) {
    res.status(500).send('Error fetching todo');
    console.error(err);
  }
});


// Update a todo
app.put('/api/todos/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, dueDate, completed } = req.body;
    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title, description, dueDate: dueDate ? new Date(dueDate) : null, completed },
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedTodo) {
      return res.status(404).send('Todo not found or unauthorized');
    }
    res.json(updatedTodo);
  } catch (err) {
    res.status(400).send('Error updating todo');
    console.error(err);
  }
});

// Delete a todo
app.delete('/api/todos/:id', authenticateToken, async (req, res) => {
  try {
    const deletedTodo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!deletedTodo) {
      return res.status(404).send('Todo not found or unauthorized');
    }
    res.status(204).send(); // No content for successful deletion
  } catch (err) {
    res.status(500).send('Error deleting todo');
    console.error(err);
  }
});

// 9. Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});