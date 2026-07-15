export interface User {
  id: string;
  username: string;
  email: string;
  stars: number;
}

export interface Country {
  id: string;
  user_id: string | null;
  name: string;
  gdp_budget: number;
  happiness_level: number;
  tax_rate: number;
  is_free: boolean;
  rebellion_risk: number;
  created_at: Date;
  updated_at: Date;
}

export interface Region {
  id: string;
  country_id: string;
  name: string;
  x: number;
  y: number;
  population: number;
  food_storage: number;
  fuel_storage: number;
  metal_storage: number;
  air_defense_level: number;
  air_defense_ammo: number;
  military_units: number;
  morale_level: number;
}

export interface Building {
  id: string;
  region_id: string;
  type: string;
  level: number;
  health: number;
  production_rate: number;
}

export interface MarketPrice {
  resource_type: string;
  price_per_unit: number;
  supply: number;
  demand: number;
}

export interface MarketOrder {
  id: string;
  country_id: string;
  resource_type: string;
  quantity: number;
  unit_price: number;
  order_type: string;
  status: string;
  created_at: Date;
}

export interface Battle {
  id: string;
  attacker_country_id: string;
  defender_country_id: string;
  attacked_region_id: string;
  battle_type: string;
  attacker_losses: number;
  defender_losses: number;
  outcome: string;
  created_at: Date;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: Date;
}

export interface Alliance {
  id: string;
  name: string;
  created_by_user_id: string;
  member_count: number;
  created_at: Date;
}
