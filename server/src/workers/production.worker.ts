import pool from '../db';

export class ProductionWorker {
  static async calculateProduction(): Promise<void> {
    console.log('[ProductionWorker] Starting production calculation...');

    try {
      // Get all buildings
      const buildingsResult = await pool.query(
        `SELECT b.*, r.country_id FROM buildings b
         JOIN regions r ON r.id = b.region_id
         WHERE b.last_production < NOW() - INTERVAL '5 minutes'`
      );

      for (const building of buildingsResult.rows) {
        await this.produceResource(building);
      }

      console.log('[ProductionWorker] Production calculation completed');
    } catch (error) {
      console.error('[ProductionWorker] Error:', error);
    }
  }

  private static async produceResource(building: any): Promise<void> {
    try {
      const { id, region_id, type, level, health, production_rate, country_id } = building;

      const baseRates: any = {
        oil_rig: 20,
        factory: 15,
        farm: 25,
        commerce: 10,
      };

      const baseRate = baseRates[type] || 0;
      const healthMultiplier = Math.max(0.3, health / 100);
      const production = Math.floor(level * baseRate * production_rate * healthMultiplier);

      if (production <= 0) return;

      // Determine resource type by building type
      const resourceMap: any = {
        oil_rig: 'fuel',
        factory: 'metal',
        farm: 'food',
        commerce: 'budget',
      };

      const resourceType = resourceMap[type];

      // Update resource stock
      await pool.query(
        `INSERT INTO resource_stocks (country_id, resource_type, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (country_id, resource_type)
         DO UPDATE SET quantity = quantity + $3`,
        [country_id, resourceType, production]
      );

      // Update last production time
      await pool.query(
        `UPDATE buildings SET last_production = NOW() WHERE id = $1`,
        [id]
      );

      console.log(
        `[ProductionWorker] Building ${id} (${type}) produced ${production} ${resourceType}`
      );
    } catch (error) {
      console.error('[ProductionWorker] Error producing resource:', error);
    }
  }
}
