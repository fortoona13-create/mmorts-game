import { Request, Response } from 'express';
import pool from '../db';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';

export class ChatController {
  static async getGlobalChat(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await pool.query(
        `SELECT cm.*, u.username FROM chat_messages cm
         JOIN users u ON u.id = cm.user_id
         JOIN chats c ON c.id = cm.chat_id
         WHERE c.chat_type = 'global'
         ORDER BY cm.created_at DESC
         LIMIT $1`,
        [limit]
      );

      res.status(200).json({
        messages: result.rows.reverse(),
      });
    } catch (error) {
      console.error('Get global chat error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { message, chatType } = req.body;

      if (!userId || !message || !chatType) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      if (message.length > 500) {
        res.status(400).json({ error: 'Message too long (max 500 characters)' });
        return;
      }

      // Get or create chat
      let chatResult = await pool.query(
        `SELECT id FROM chats WHERE chat_type = $1 LIMIT 1`,
        [chatType]
      );

      let chatId: string;
      if (chatResult.rows.length === 0) {
        chatId = uuidv4();
        await pool.query(
          `INSERT INTO chats (id, name, chat_type) VALUES ($1, $2, $3)`,
          [chatId, `${chatType} Chat`, chatType]
        );
      } else {
        chatId = chatResult.rows[0].id;
      }

      // Send message
      const messageId = uuidv4();
      const result = await pool.query(
        `INSERT INTO chat_messages (id, chat_id, user_id, message)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [messageId, chatId, userId, message]
      );

      res.status(201).json({
        message: 'Message sent successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createAlliance(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { allianceName } = req.body;

      if (!userId || !allianceName) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Get user's country
      const countryResult = await pool.query(
        'SELECT id FROM countries WHERE user_id = $1',
        [userId]
      );

      if (countryResult.rows.length === 0) {
        res.status(403).json({ error: 'You do not have a country' });
        return;
      }

      const countryId = countryResult.rows[0].id;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Create alliance
        const allianceId = uuidv4();
        await client.query(
          `INSERT INTO alliances (id, name, created_by_user_id) VALUES ($1, $2, $3)`,
          [allianceId, allianceName, userId]
        );

        // Add creator as member
        await client.query(
          `INSERT INTO alliance_members (alliance_id, country_id) VALUES ($1, $2)`,
          [allianceId, countryId]
        );

        // Create alliance chat
        const chatId = uuidv4();
        await client.query(
          `INSERT INTO chats (id, name, chat_type, alliance_id) VALUES ($1, $2, 'alliance', $3)`,
          [chatId, `${allianceName} Chat`, allianceId]
        );

        await client.query('COMMIT');

        res.status(201).json({
          message: 'Alliance created successfully',
          allianceId,
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Create alliance error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAlliances(req: Request, res: Response): Promise<void> {
    try {
      const result = await pool.query(
        `SELECT a.*, COUNT(am.id) as member_count FROM alliances a
         LEFT JOIN alliance_members am ON am.alliance_id = a.id
         GROUP BY a.id
         ORDER BY a.created_at DESC
         LIMIT 50`
      );

      res.status(200).json({
        alliances: result.rows,
      });
    } catch (error) {
      console.error('Get alliances error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async joinAlliance(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { allianceId } = req.body;

      if (!userId || !allianceId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Get user's country
      const countryResult = await pool.query(
        'SELECT id FROM countries WHERE user_id = $1',
        [userId]
      );

      if (countryResult.rows.length === 0) {
        res.status(403).json({ error: 'You do not have a country' });
        return;
      }

      const countryId = countryResult.rows[0].id;

      // Add to alliance
      await pool.query(
        `INSERT INTO alliance_members (alliance_id, country_id) VALUES ($1, $2)
         ON CONFLICT (alliance_id, country_id) DO NOTHING`,
        [allianceId, countryId]
      );

      res.status(200).json({
        message: 'Joined alliance successfully',
      });
    } catch (error) {
      console.error('Join alliance error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
