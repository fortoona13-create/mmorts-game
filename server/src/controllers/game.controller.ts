import { Request, Response } from 'express';
import pool from '../db';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';

const INITIAL_REGIONS_COUNT = 3;
const INITIAL_BUILDINGS_PER_REGION = 2;

const PREDEFINED_REGIONS = [
  { name: 'North Territory', x: 100, y: 100 },
  { name: 'Central District', x: 300, y: 200 },
  { name: 'South Harbor', x: 200, y: 400 },
  { name: 'Eastern Province', x: 500, y: 150 },
  { name: 'Western Coast', x: 50, y: 300 },
  { name: 'Desert Region', x: 400, y: 500 },
  { name: 'Mountain Valley', x: 150, y: 450 },
  { name: 'Forest Land', x: 350, y: 100 },
];

export class GameController {
  static async getWorld(req: Request, res: Response): Promise<void> {
    try {
      const result = await pool.query(
        `SELECT c.id, c.name, c.user_id, c.happiness_level, c.tax_rate,
                COUNT(r.id) as region_count
         FROM countries c
         LEFT JOIN regions r ON r.country_id = c.id
         WHERE c.user_id IS NOT NULL
         GROUP BY c.id`
      );

      res.status(200).json({
        countries: result.rows,
      });
    } catch (error) {
      console.error('Get world error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getCountry(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { countryId } = req.params;

      const result = await pool.query(
        `SELECT * FROM countries WHERE id = $1`,
        [countryId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Country not found' });
        return;
      }

      const country = result.rows[0];

      // Get regions
      const regionsResult = await pool.query(
        `SELECT * FROM regions WHERE country_id = $1`,
        [countryId]
      );

      // Get resources
      const resourcesResult = await pool.query(
        `SELECT resource_type, quantity FROM resource_stocks WHERE country_id = $1`,
        [countryId]
      );

      res.status(200).json({
        country,
        regions: regionsResult.rows,
        resources: resourcesResult.rows,
      });
    } catch (error) {
      console.error('Get country error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMyCountry(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await pool.query(
        `SELECT * FROM countries WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'You do not have a country' });
        return;
      }

      const country = result.rows[0];

      // Get regions
      const regionsResult = await pool.query(
        `SELECT * FROM regions WHERE country_id = $1`,
        [country.id]
      );

      // Get buildings for each region
      const buildingsResult = await pool.query(
        `SELECT b.* FROM buildings b
         JOIN regions r ON r.id = b.region_id
         WHERE r.country_id = $1`,
        [country.id]
      );

      // Get resources
      const resourcesResult = await pool.query(
        `SELECT resource_type, quantity FROM resource_stocks WHERE country_id = $1`,
        [country.id]
      );

      res.status(200).json({
        country,
        regions: regionsResult.rows,
        buildings: buildingsResult.rows,
        resources: resourcesResult.rows,
      });
    } catch (error) {
      console.error('Get my country error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createCountry(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { countryName } = req.body;
      if (!countryName) {
        res.status(400).json({ error: 'Country name required' });
        return;
      }

      // Check if user already has a country
      const existingCountry = await pool.query(
        'SELECT id FROM countries WHERE user_id = $1',
        [userId]
      );

      if (existingCountry.rows.length > 0) {
        res.status(400).json({ error: 'You already have a country' });
        return;
      }

      // Check stars
      const userResult = await pool.query(
        'SELECT stars FROM users WHERE id = $1',
        [userId]
      );

      const user = userResult.rows[0];
      if (user.stars < 50) {
        res.status(400).json({ error: 'Insufficient stars (need 50)' });
        return;
      }

      // Start transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Deduct stars
        await client.query(
          'UPDATE users SET stars = stars - 50 WHERE id = $1',
          [userId]
        );

        // Create country
        const countryId = uuidv4();
        await client.query(
          `INSERT INTO countries (id, user_id, name, gdp_budget, happiness_level, tax_rate)
           VALUES ($1, $2, $3, 10000, 70.0, 0.2)`,
          [countryId, userId, countryName]
        );

        // Create initial regions
        for (let i = 0; i < INITIAL_REGIONS_COUNT; i++) {
          const regionData = PREDEFINED_REGIONS[i % PREDEFINED_REGIONS.length];
          const regionId = uuidv4();

          await client.query(
            `INSERT INTO regions (id, country_id, name, x, y, population, food_storage, fuel_storage, metal_storage)
             VALUES ($1, $2, $3, $4, $5, 10000, 5000, 2000, 1500)`,
            [regionId, countryId, regionData.name, regionData.x + i * 50, regionData.y + i * 30]
          );

          // Create initial buildings
          const buildingTypes = ['farm', 'factory', 'oil_rig'];
          for (let j = 0; j < INITIAL_BUILDINGS_PER_REGION; j++) {
            const buildingId = uuidv4();
            const buildingType = buildingTypes[j % buildingTypes.length];

            await client.query(
              `INSERT INTO buildings (id, region_id, type, level, health, production_rate)
               VALUES ($1, $2, $3, 1, 100, 1.0)`,
              [buildingId, regionId, buildingType]
            );
          }
        }

        // Initialize resource stocks
        const resourceTypes = ['budget', 'fuel', 'metal', 'food'];
        for (const resourceType of resourceTypes) {
          await client.query(
            `INSERT INTO resource_stocks (country_id, resource_type, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (country_id, resource_type) DO UPDATE SET quantity = EXCLUDED.quantity`,
            [countryId, resourceType, resourceType === 'budget' ? 10000 : 5000]
          );
        }

        await client.query('COMMIT');

        res.status(201).json({
          message: 'Country created successfully',
          countryId,
          stars_remaining: user.stars - 50,
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Create country error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getRegion(req: Request, res: Response): Promise<void> {
    try {
      const { regionId } = req.params;

      const regionResult = await pool.query(
        `SELECT * FROM regions WHERE id = $1`,
        [regionId]
      );

      if (regionResult.rows.length === 0) {
        res.status(404).json({ error: 'Region not found' });
        return;
      }

      const region = regionResult.rows[0];

      // Get buildings
      const buildingsResult = await pool.query(
        `SELECT * FROM buildings WHERE region_id = $1`,
        [regionId]
      );

      res.status(200).json({
        region,
        buildings: buildingsResult.rows,
      });
    } catch (error) {
      console.error('Get region error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
