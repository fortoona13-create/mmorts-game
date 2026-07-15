export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  stars: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
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
  gdp_contribution: number;
  population: number;
  food_storage: number;
  fuel_storage: number;
  metal_storage: number;
  commercial_value: number;
  air_defense_level: number;
  air_defense_ammo: number;
  military_units: number;
  morale_level: number;
  created_at: Date;
}

export interface Building {
  id: string;
  region_id: string;
  type: string;
  level: number;
  health: number;
  production_rate: number;
  last_production: Date;
  created_at: Date;
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

export interface ResourceStock {
  id: string;
  country_id: string;
  resource_type: string;
  quantity: number;
  updated_at: Date;
}

export interface MarketPrice {
  id: string;
  resource_type: string;
  price_per_unit: number;
  supply: number;
  demand: number;
  volatility: number;
  last_updated: Date;
}

export interface UserPayload {
  id: string;
  username: string;
}
