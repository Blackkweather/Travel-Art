const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Simple file-based user storage
const usersFile = path.join(__dirname, 'users.json');

function getUsers() {
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, '[]');
    return [];
  }
  return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
}

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { role, name, email, password, phone } = req.body;
    
    if (!role || !name || !email || !password) {
      return res.status(400).json({ success: false, error: { message: 'Missing required fields' } });
    }

    const users = getUsers();
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ success: false, error: { message: 'User already exists' } });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = {
      id: Date.now().toString(),
      role,
      name,
      email,
      passwordHash,
      phone: phone || null,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    saveUsers(users);

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, role: user.role, name: user.name, email: user.email },
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Registration failed' } });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { message: 'Email and password required' } });
    }

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: { message: 'Invalid credentials' } });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: { message: 'Invalid credentials' } });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: { id: user.id, role: user.role, name: user.name, email: user.email },
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Login failed' } });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`🚀 Quick Auth Server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
});