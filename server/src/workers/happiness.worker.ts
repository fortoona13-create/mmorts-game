import pool from '../db';

interface HappinessConfig {
  TAX_WEIGHT: number;
  FOOD_DEFICIT_WEIGHT: number;
  MILITARY_LOSS_WEIGHT: number;
  INFRASTRUCTURE_DAMAGE_WEIGHT: number;
  NATURAL_RECOVERY: number;
  STRIKE_THRESHOLD: number;
  REBELLION_THRESHOLD: number;
}

const config: HappinessConfig = {
  TAX_WEIGHT: 2,
  FOOD_DEFICIT_WEIGHT: 0.5,
  MILITARY_LOSS_WEIGHT: 0.01,
  INFRASTRUCTURE_DAMAGE_WEIGHT: 0.08,
  NATURAL_RECOVERY: 0.5,
  STRIKE_THRESHOLD: 40,
  REBELLION_THRESHOLD: 20,
};

export class HappinessWorker {
  static async calculateAndUpdateHappiness(): Promise<void> {
    console.log('[HappinessWorker] Starting happiness calculation...');

    try {
      const countriesResult = await pool.query(
        `SELECT c.id, c.user_id, c.happiness_level, c.tax_rate, c.rebellion_risk
         FROM countries c
         WHERE c.user_id IS NOT NULL`
      );

      for (const country of countriesResult.rows) {
        await this.updateCountryHappiness(country);
      }

      console.log('[HappinessWorker] Happiness calculation completed');
    } catch (error) {
      console.error('[HappinessWorker] Error:', error);
    }
  }

  private static async updateCountryHappiness(country: any): Promise<void> {
    try {
      const countryId = country.id;

      // Get country data
      const countryDataResult = await pool.query(
        `SELECT gdp_budget, tax_rate, population FROM countries WHERE id = $1`,
        [countryId]
      );

      const countryData = countryDataResult.rows[0];

      // Get food data
      const foodDataResult = await pool.query(
        `SELECT 
          SUM(food_storage) as total_food,
          COUNT(*) as region_count,
          SUM(population) as total_population
         FROM regions
         WHERE country_id = $1`,
        [countryId]
      );

      const foodData = foodDataResult.rows[0];
      const totalPopulation = foodData.total_population || 1;
      const foodPerCapita = (foodData.total_food || 0) / totalPopulation;
      const foodDeficitPercentage = Math.max(0, 1 - foodPerCapita / 100);

      // Get military losses
      const battlesResult = await pool.query(
        `SELECT 
          COALESCE(SUM(defender_losses), 0) as total_losses
         FROM battle_log
         WHERE defender_country_id = $1
           AND created_at > NOW() - INTERVAL '1 hour'`,
        [countryId]
      );

      const militaryLossesPercentage = (battlesResult.rows[0].total_losses || 0) / totalPopulation;

      // Get infrastructure damage
      const damageResult = await pool.query(
        `SELECT 
          COUNT(*) as total_buildings,
          SUM(CASE WHEN health < 100 THEN 1 ELSE 0 END) as damaged_buildings
         FROM buildings
         WHERE region_id IN (SELECT id FROM regions WHERE country_id = $1)`,
        [countryId]
      );

      const infraDamagePercentage =
        damageResult.rows[0].total_buildings > 0
          ? (damageResult.rows[0].damaged_buildings || 0) / damageResult.rows[0].total_buildings
          : 0;

      // Calculate happiness changes
      const taxPenalty = -Math.min(
        10,
        Math.max(0, (countryData.tax_rate - 0.15) * config.TAX_WEIGHT)
      );

      const foodPenalty = -Math.min(
        10,
        foodDeficitPercentage * config.FOOD_DEFICIT_WEIGHT * 100
      );

      const militaryPenalty = -Math.min(
        5,
        militaryLossesPercentage * config.MILITARY_LOSS_WEIGHT * 100
      );

      const infrastructurePenalty = -Math.min(
        8,
        infraDamagePercentage * config.INFRASTRUCTURE_DAMAGE_WEIGHT * 100
      );

      const hasGoodConditions =
        countryData.tax_rate <= 0.15 &&
        foodDeficitPercentage === 0 &&
        militaryLossesPercentage === 0;

      const naturalRecovery = hasGoodConditions ? config.NATURAL_RECOVERY : 0;

      const totalDelta =
        taxPenalty + foodPenalty + militaryPenalty + infrastructurePenalty + naturalRecovery;
      const newHappiness = Math.max(0, Math.min(100, country.happiness_level + totalDelta));

      // Check for rebellion
      let newRebellionRisk = 0;
      if (newHappiness < config.REBELLION_THRESHOLD) {
        newRebellionRisk = 1 + (config.REBELLION_THRESHOLD - newHappiness) * 0.02;

        if (Math.random() < newRebellionRisk / 100) {
          await this.triggerRebellion(countryId, country.user_id);
          return;
        }
      }

      // Update happiness
      await pool.query(
        `UPDATE countries 
         SET happiness_level = $1, rebellion_risk = $2, updated_at = NOW()
         WHERE id = $3`,
        [newHappiness, newRebellionRisk, countryId]
      );

      // Update production rates if strikes
      if (newHappiness < config.STRIKE_THRESHOLD) {
        const strikeEffect = (config.STRIKE_THRESHOLD - newHappiness) / config.STRIKE_THRESHOLD;
        await pool.query(
          `UPDATE buildings 
           SET production_rate = production_rate * $1
           WHERE region_id IN (SELECT id FROM regions WHERE country_id = $2)`,
          [1 - strikeEffect * 0.5, countryId]
        );
      }

      console.log(
        `[HappinessWorker] Country ${countryId}: ${country.happiness_level.toFixed(1)}% -> ${newHappiness.toFixed(1)}%`
      );
    } catch (error) {
      console.error('[HappinessWorker] Error updating country happiness:', error);
    }
  }

  private static async triggerRebellion(countryId: string, userId: string | null): Promise<void> {
    try {
      console.log(`[HappinessWorker] REBELLION TRIGGERED in country ${countryId}!`);

      if (userId) {
        await pool.query(`UPDATE users SET stars = stars + 50 WHERE id = $1`, [userId]);
        console.log(`[HappinessWorker] User ${userId} has been overthrown!`);
      }

      await pool.query(
        `UPDATE countries 
         SET user_id = NULL, happiness_level = 70, tax_rate = 0.2, rebellion_risk = 0
         WHERE id = $1`,
        [countryId]
      );
    } catch (error) {
      console.error('[HappinessWorker] Error triggering rebellion:', error);
    }
  }
}
