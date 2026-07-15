import { Request, Response } from 'express';
import pool from '../db';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';

export class MarketController {
  static async getPrices(req: Request, res: Response): Promise<void> {
    try {
      const result = await pool.query(
        `SELECT resource_type, price_per_unit, supply, demand, last_updated
         FROM market_prices
         ORDER BY resource_type`
      );

      res.status(200).json({
        prices: result.rows,
      });
    } catch (error) {
      console.error('Get prices error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const { resource_type, order_type } = req.query;

      let query = `SELECT * FROM market_orders WHERE status = 'active'`;
      const params: any[] = [];

      if (resource_type) {
        query += ` AND resource_type = $${params.length + 1}`;
        params.push(resource_type);
      }

      if (order_type) {
        query += ` AND order_type = $${params.length + 1}`;
        params.push(order_type);
      }

      query += ` ORDER BY created_at DESC LIMIT 100`;

      const result = await pool.query(query, params);
      res.status(200).json({
        orders: result.rows,
      });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { resource_type, quantity, unit_price, order_type } = req.body;

      if (!userId || !resource_type || !quantity || !unit_price || !order_type) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      if (!['buy', 'sell'].includes(order_type)) {
        res.status(400).json({ error: 'Invalid order type' });
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

      // Check resources
      if (order_type === 'sell') {
        const resourceResult = await pool.query(
          'SELECT quantity FROM resource_stocks WHERE country_id = $1 AND resource_type = $2',
          [countryId, resource_type]
        );

        const available = resourceResult.rows[0]?.quantity || 0;
        if (available < quantity) {
          res.status(400).json({ error: 'Insufficient resources' });
          return;
        }
      } else if (order_type === 'buy') {
        const budgetResult = await pool.query(
          'SELECT quantity FROM resource_stocks WHERE country_id = $1 AND resource_type = $2',
          [countryId, 'budget']
        );

        const available = budgetResult.rows[0]?.quantity || 0;
        const totalCost = quantity * unit_price;
        if (available < totalCost) {
          res.status(400).json({ error: 'Insufficient budget' });
          return;
        }
      }

      // Create order
      const orderId = uuidv4();
      const result = await pool.query(
        `INSERT INTO market_orders 
         (id, country_id, resource_type, quantity, unit_price, order_type, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')
         RETURNING *`,
        [orderId, countryId, resource_type, quantity, unit_price, order_type]
      );

      // Update market dynamics
      await MarketController.updateMarketDynamics(resource_type);

      res.status(201).json({
        message: 'Order created successfully',
        order: result.rows[0],
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async buyFromOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { order_id, quantity } = req.body;

      if (!userId || !order_id || !quantity) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Get order
      const orderResult = await pool.query(
        `SELECT * FROM market_orders WHERE id = $1 AND order_type = 'sell' AND status = 'active'`,
        [order_id]
      );

      if (orderResult.rows.length === 0) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      const order = orderResult.rows[0];

      if (quantity > order.quantity) {
        res.status(400).json({ error: 'Quantity exceeds available' });
        return;
      }

      // Get buyer country
      const buyerCountryResult = await pool.query(
        'SELECT id FROM countries WHERE user_id = $1',
        [userId]
      );

      if (buyerCountryResult.rows.length === 0) {
        res.status(403).json({ error: 'You do not have a country' });
        return;
      }

      const buyerCountryId = buyerCountryResult.rows[0].id;
      const totalCost = quantity * order.unit_price;

      // Check budget
      const budgetResult = await pool.query(
        'SELECT quantity FROM resource_stocks WHERE country_id = $1 AND resource_type = $2',
        [buyerCountryId, 'budget']
      );

      const available = budgetResult.rows[0]?.quantity || 0;
      if (available < totalCost) {
        res.status(400).json({ error: 'Insufficient budget' });
        return;
      }

      // Transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Deduct budget from buyer
        await client.query(
          `UPDATE resource_stocks 
           SET quantity = quantity - $1
           WHERE country_id = $2 AND resource_type = 'budget'`,
          [totalCost, buyerCountryId]
        );

        // Add resource to buyer
        await client.query(
          `INSERT INTO resource_stocks (country_id, resource_type, quantity)
           VALUES ($1, $2, $3)
           ON CONFLICT (country_id, resource_type)
           DO UPDATE SET quantity = quantity + $3`,
          [buyerCountryId, order.resource_type, quantity]
        );

        // Add budget to seller
        const sellerCountryId = order.country_id;
        await client.query(
          `INSERT INTO resource_stocks (country_id, resource_type, quantity)
           VALUES ($1, 'budget', $2)
           ON CONFLICT (country_id, resource_type)
           DO UPDATE SET quantity = quantity + $2`,
          [sellerCountryId, totalCost]
        );

        // Update order
        const newQuantity = order.quantity - quantity;
        if (newQuantity === 0) {
          await client.query(
            'UPDATE market_orders SET status = $1 WHERE id = $2',
            ['filled', order_id]
          );
        } else {
          await client.query(
            'UPDATE market_orders SET quantity = $1 WHERE id = $2',
            [newQuantity, order_id]
          );
        }

        await client.query('COMMIT');

        res.status(200).json({
          message: 'Purchase successful',
          transaction: {
            resource: order.resource_type,
            quantity,
            total_cost: totalCost,
          },
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Buy from order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private static async updateMarketDynamics(resourceType: string): Promise<void> {
    try {
      const result = await pool.query(
        `SELECT 
          COALESCE(SUM(CASE WHEN order_type = 'sell' THEN quantity ELSE 0 END), 0) as supply,
          COALESCE(SUM(CASE WHEN order_type = 'buy' THEN quantity ELSE 0 END), 0) as demand
         FROM market_orders
         WHERE resource_type = $1 AND status = 'active'`,
        [resourceType]
      );

      const { supply, demand } = result.rows[0];

      const priceResult = await pool.query(
        'SELECT price_per_unit, volatility FROM market_prices WHERE resource_type = $1',
        [resourceType]
      );

      if (priceResult.rows.length === 0) return;

      const { price_per_unit: basePrice, volatility } = priceResult.rows[0];

      const safeDemand = demand || 1;
      const safeSupply = supply || 1;
      const priceChangeFactor =
        (safeDemand / safeSupply) * volatility - (safeSupply / safeDemand) * volatility;
      const cappedChange = Math.max(-0.15, Math.min(0.15, priceChangeFactor));

      const newPrice = basePrice * (1 + cappedChange);

      await pool.query(
        `UPDATE market_prices 
         SET price_per_unit = $1, supply = $2, demand = $3, last_updated = NOW()
         WHERE resource_type = $4`,
        [newPrice, supply, demand, resourceType]
      );
    } catch (error) {
      console.error('Update market dynamics error:', error);
    }
  }
}
