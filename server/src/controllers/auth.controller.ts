import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { v4 as uuidv4 } from 'uuid';
import { User, UserPayload } from '../models/types';
import { AuthRequest } from '../middleware/auth.middleware';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters' });
        return;
      }

      // Check if user exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        res.status(409).json({ error: 'User already exists' });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const userId = uuidv4();

      // Create user with 50 stars
      const result = await pool.query(
        `INSERT INTO users (id, username, email, password_hash, stars)
         VALUES ($1, $2, $3, $4, 50)
         RETURNING id, username, email, stars`,
        [userId, username, email, passwordHash]
      );

      res.status(201).json({
        message: 'User registered successfully',
        user: result.rows[0],
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'Missing username or password' });
        return;
      }

      // Find user
      const userResult = await pool.query(
        'SELECT id, username, password_hash, stars FROM users WHERE username = $1 AND is_active = true',
        [username]
      );

      if (userResult.rows.length === 0) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const user = userResult.rows[0];

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, username: user.username } as UserPayload,
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          stars: user.stars,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
