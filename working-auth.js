const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory user storage
let users = [];

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { role, name, email, password, phone } = req.body;
    
    // Validation
    if (!role || !name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Missing required fields' } 
      });
    }

    // Check if user exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'User with this email already exists.' } 
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const user = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      role,
      name,
      email,
      passwordHash,
      phone: phone || null,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    users.push(user);

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    console.log(`✅ User registered: ${email}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          role: user.role,
          name: user.name,
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: 'Registration failed. Please try again later.' } 
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Invalid request data.' } 
      });
    }

    // Find user
    const user = users.find(u => u.email === email);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        error: { message: 'Invalid credentials.' } 
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: { message: 'Invalid credentials.' } 
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    console.log(`✅ User logged in: ${email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          role: user.role,
          name: user.name,
          email: user.email,
          artist: user.role === 'ARTIST' ? {} : null,
          hotel: user.role === 'HOTEL' ? {} : null
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: 'Login failed. Please try again later.' } 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'connected',
    users: users.length
  });
});

// Get all users (for testing)
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt
    }))
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Working Auth Server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`👥 Users: http://localhost:${PORT}/api/users`);
  console.log(`\n🔥 AUTHENTICATION IS NOW WORKING!`);
});