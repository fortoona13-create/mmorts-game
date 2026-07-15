import { Request, Response } from 'express';
import pool from '../db';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';

export class MilitaryController {
  static async getRegionDefense(req: Request, res: Response): Promise<void> {
    try {
      const { regionId } = req.params;

      const result = await pool.query(
        `SELECT air_defense_level, air_defense_ammo, military_units, morale_level 
         FROM regions WHERE id = $1`,
        [regionId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Region not found' });
        return;
      }

      res.status(200).json({ defense: result.rows[0] });
    } catch (error) {
      console.error('Get region defense error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async launchDroneStrike(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { targetRegionId, targetType } = req.body;

      if (!userId || !targetRegionId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Get attacker country
      const attackerResult = await pool.query(
        'SELECT id FROM countries WHERE user_id = $1',
        [userId]
      );

      if (attackerResult.rows.length === 0) {
        res.status(403).json({ error: 'You do not have a country' });
        return;
      }

      const attackerCountryId = attackerResult.rows[0].id;

      // Get target region
      const targetResult = await pool.query(
        `SELECT country_id, air_defense_level, air_defense_ammo FROM regions WHERE id = $1`,
        [targetRegionId]
      );

      if (targetResult.rows.length === 0) {
        res.status(404).json({ error: 'Target region not found' });
        return;
      }

      const targetRegion = targetResult.rows[0];
      const defenderCountryId = targetRegion.country_id;

      if (defenderCountryId === attackerCountryId) {
        res.status(400).json({ error: 'Cannot attack your own region' });
        return;
      }

      // Calculate interception
      const interceptProb =
        (targetRegion.air_defense_level * 0.15) *
        (targetRegion.air_defense_ammo / 100);
      const isIntercepted = Math.random() < interceptProb;

      // Create drone
      const droneId = uuidv4();
      const damage = isIntercepted ? 0 : 50;

      await pool.query(
        `INSERT INTO drones (id, country_id, status, target_region_id, target_type, damage, launched_at, hit_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
        [droneId, attackerCountryId, isIntercepted ? 'intercepted' : 'hit', targetRegionId, targetType, damage, isIntercepted ? null : new Date()]
      );

      // If hit, damage buildings
      if (!isIntercepted && damage > 0) {
        // Get buildings in target region
        const buildingsResult = await pool.query(
          `SELECT id FROM buildings WHERE region_id = $1 LIMIT 1`,
          [targetRegionId]
        );

        if (buildingsResult.rows.length > 0) {
          const building = buildingsResult.rows[0];
          await pool.query(
            `UPDATE buildings SET health = MAX(0, health - $1) WHERE id = $2`,
            [damage, building.id]
          );
        }

        // Reduce happiness in target country
        await pool.query(
          `UPDATE countries SET happiness_level = MAX(0, happiness_level - 5) WHERE id = $1`,
          [defenderCountryId]
        );
      }

      // Reduce PVO ammo
      if (targetRegion.air_defense_ammo > 0) {
        await pool.query(
          `UPDATE regions SET air_defense_ammo = air_defense_ammo - 1 WHERE id = $1`,
          [targetRegionId]
        );
      }

      // Log battle
      await pool.query(
        `INSERT INTO battle_log (attacker_country_id, defender_country_id, attacked_region_id, battle_type, outcome)
         VALUES ($1, $2, $3, 'drone_strike', $4)`,
        [attackerCountryId, defenderCountryId, targetRegionId, isIntercepted ? 'defender_win' : 'attacker_win']
      );

      res.status(200).json({
        message: isIntercepted ? 'Drone intercepted!' : 'Drone strike successful!',
        droneId,
        intercepted: isIntercepted,
        damage: damage,
      });
    } catch (error) {
      console.error('Launch drone strike error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async attackRegion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { fromRegionId, toRegionId, troopsCount } = req.body;

      if (!userId || !fromRegionId || !toRegionId || !troopsCount) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Get attacker country
      const attackerResult = await pool.query(
        'SELECT id FROM countries WHERE user_id = $1',
        [userId]
      );

      if (attackerResult.rows.length === 0) {
        res.status(403).json({ error: 'You do not have a country' });
        return;
      }

      const attackerCountryId = attackerResult.rows[0].id;

      // Verify attacker owns from region
      const fromRegionResult = await pool.query(
        `SELECT country_id, military_units, morale_level FROM regions WHERE id = $1`,
        [fromRegionId]
      );

      if (fromRegionResult.rows.length === 0 ||
          fromRegionResult.rows[0].country_id !== attackerCountryId) {
        res.status(400).json({ error: 'You do not own this region' });
        return;
      }

      if (fromRegionResult.rows[0].military_units < troopsCount) {
        res.status(400).json({ error: 'Insufficient troops' });
        return;
      }

      // Get target region
      const toRegionResult = await pool.query(
        `SELECT country_id, military_units, morale_level FROM regions WHERE id = $1`,
        [toRegionId]
      );

      if (toRegionResult.rows.length === 0) {
        res.status(404).json({ error: 'Target region not found' });
        return;
      }

      const targetRegion = toRegionResult.rows[0];
      const defenderCountryId = targetRegion.country_id;

      if (defenderCountryId === attackerCountryId) {
        res.status(400).json({ error: 'Cannot attack your own region' });
        return;
      }

      // Calculate battle outcome
      const attackerMorale = fromRegionResult.rows[0].morale_level / 100;
      const defenderMorale = targetRegion.morale_level / 100;
      const terrainBonus = Math.random() * 0.1 - 0.05; // ±5%

      const winProbability = Math.min(
        0.95,
        Math.max(
          0.05,
          0.5 +
            ((troopsCount * attackerMorale) / (targetRegion.military_units * defenderMorale)) *
              0.25 +
            terrainBonus
        )
      );

      const attacker_wins = Math.random() < winProbability;

      // Calculate losses
      const attacker_losses = Math.floor(
        troopsCount * (1 - winProbability) * 0.3 + Math.random() * 10
      );
      const defender_losses = Math.floor(
        targetRegion.military_units * winProbability * 0.25 + Math.random() * 10
      );

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        if (attacker_wins) {
          // Transfer region ownership
          await client.query(
            `UPDATE regions SET country_id = $1, military_units = $2, morale_level = 50 WHERE id = $3`,
            [attackerCountryId, troopsCount - attacker_losses, toRegionId]
          );

          // Update attacker region
          await client.query(
            `UPDATE regions SET military_units = military_units - $1, morale_level = 50 WHERE id = $2`,
            [troopsCount, fromRegionId]
          );

          // Reduce defender happiness
          await client.query(
            `UPDATE countries SET happiness_level = MAX(0, happiness_level - 15) WHERE id = $1`,
            [defenderCountryId]
          );
        } else {
          // Update attacker region
          await client.query(
            `UPDATE regions SET military_units = military_units - $1, morale_level = 50 WHERE id = $2`,
            [attacker_losses, fromRegionId]
          );

          // Update defender region
          await client.query(
            `UPDATE regions SET military_units = military_units - $1, morale_level = 60 WHERE id = $2`,
            [defender_losses, toRegionId]
          );
        }

        // Log battle
        await client.query(
          `INSERT INTO battle_log (attacker_country_id, defender_country_id, attacked_region_id, battle_type, attacker_losses, defender_losses, outcome)
           VALUES ($1, $2, $3, 'ground_invasion', $4, $5, $6)`,
          [
            attackerCountryId,
            defenderCountryId,
            toRegionId,
            attacker_losses,
            defender_losses,
            attacker_wins ? 'attacker_win' : 'defender_win',
          ]
        );

        await client.query('COMMIT');

        res.status(200).json({
          message: attacker_wins ? 'Attack successful!' : 'Attack repelled!',
          attacker_wins,
          attacker_losses,
          defender_losses,
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Attack region error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getBattleHistory(req: Request, res: Response): Promise<void> {
    try {
      const { countryId } = req.query;
      let query = `SELECT * FROM battle_log`;
      const params: any[] = [];

      if (countryId) {
        query += ` WHERE attacker_country_id = $1 OR defender_country_id = $1`;
        params.push(countryId);
      }

      query += ` ORDER BY created_at DESC LIMIT 50`;

      const result = await pool.query(query, params);
      res.status(200).json({ battles: result.rows });
    } catch (error) {
      console.error('Get battle history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async upgradePVO(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { regionId } = req.body;

      if (!userId || !regionId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Get region and verify ownership
      const regionResult = await pool.query(
        `SELECT r.id, r.country_id, r.air_defense_level FROM regions r
         JOIN countries c ON c.id = r.country_id
         WHERE r.id = $1 AND c.user_id = $2`,
        [regionId, userId]
      );

      if (regionResult.rows.length === 0) {
        res.status(403).json({ error: 'You do not own this region' });
        return;
      }

      const region = regionResult.rows[0];

      if (region.air_defense_level >= 5) {
        res.status(400).json({ error: 'PVO already at max level' });
        return;
      }

      const cost = (region.air_defense_level + 1) * 1000;

      // Check budget
      const budgetResult = await pool.query(
        `SELECT quantity FROM resource_stocks WHERE country_id = $1 AND resource_type = 'budget'`,
        [region.country_id]
      );

      const available = budgetResult.rows[0]?.quantity || 0;
      if (available < cost) {
        res.status(400).json({ error: 'Insufficient budget' });
        return;
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Deduct budget
        await client.query(
          `UPDATE resource_stocks SET quantity = quantity - $1 WHERE country_id = $2 AND resource_type = 'budget'`,
          [cost, region.country_id]
        );

        // Upgrade PVO
        await client.query(
          `UPDATE regions SET air_defense_level = air_defense_level + 1, air_defense_ammo = air_defense_ammo + 20 WHERE id = $1`,
          [regionId]
        );

        await client.query('COMMIT');

        res.status(200).json({
          message: 'PVO upgraded successfully',
          new_level: region.air_defense_level + 1,
          cost,
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Upgrade PVO error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
