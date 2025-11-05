import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import db from '../database/db.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await db.get(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const result = await db.run(
        'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
        [email, passwordHash, name || null]
      );

      const userId = result.lastID;

      // Initialize default categories and payment methods for new user
      await initializeUserDefaults(userId);

      // Generate token
      const token = generateToken(userId, email);

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: userId,
          email,
          name
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await db.get(
        'SELECT id, email, password_hash, name FROM users WHERE email = ?',
        [email]
      );

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate token
      const token = generateToken(user.id, user.email);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get current user
router.get('/me', async (req, res) => {
  try {
    // This endpoint should be protected by authenticateToken middleware
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await db.get(
      'SELECT id, email, name, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize default categories and payment methods for new user
async function initializeUserDefaults(userId) {
  const defaultCategories = [
    { name: 'Food', color: '#3B82F6' },
    { name: 'Transport', color: '#10B981' },
    { name: 'Shopping', color: '#F59E0B' },
    { name: 'Bills', color: '#EF4444' },
    { name: 'Entertainment', color: '#8B5CF6' },
    { name: 'Healthcare', color: '#EC4899' },
    { name: 'Education', color: '#06B6D4' },
    { name: 'Other', color: '#6B7280' }
  ];

  const defaultPaymentMethods = [
    { name: 'Cash', color: '#10B981' },
    { name: 'Visa Card', color: '#3B82F6' },
    { name: 'E-Wallet', color: '#F59E0B' }
  ];

  // Insert default categories
  for (const категория of defaultCategories) {
    await db.run(
      'INSERT OR IGNORE INTO categories (user_id, name, color) VALUES (?, ?, ?)',
      [userId, категория.name, категория.color]
    );
  }

  // Insert default payment methods
  for (const method of defaultPaymentMethods) {
    await db.run(
      'INSERT OR IGNORE INTO payment_methods (user_id, name, color) VALUES (?, ?, ?)',
      [userId, method.name, method.color]
    );
  }
}

export default router;





