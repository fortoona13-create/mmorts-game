-- ============================================================================
-- MMORTS DATABASE SCHEMA
-- ============================================================================

-- 1. USERS AND ACCOUNTS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    stars INT DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. COUNTRIES AND POWER
CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(128) NOT NULL,
    gdp_budget INT DEFAULT 5000,
    happiness_level FLOAT DEFAULT 70.0,
    tax_rate FLOAT DEFAULT 0.2,
    is_free BOOLEAN DEFAULT FALSE,
    rebellion_risk FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. REGIONS (TERRITORIES)
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    x INT NOT NULL,
    y INT NOT NULL,
    gdp_contribution INT DEFAULT 500,
    population INT DEFAULT 10000,
    food_storage INT DEFAULT 5000,
    fuel_storage INT DEFAULT 2000,
    metal_storage INT DEFAULT 1500,
    commercial_value INT DEFAULT 1000,
    air_defense_level INT DEFAULT 0,
    air_defense_ammo INT DEFAULT 0,
    military_units INT DEFAULT 100,
    morale_level FLOAT DEFAULT 70.0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. BUILDINGS (PRODUCTION)
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    level INT DEFAULT 1,
    health INT DEFAULT 100,
    production_rate FLOAT DEFAULT 1.0,
    last_production TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. RESOURCE STOCKS
CREATE TABLE IF NOT EXISTS resource_stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    UNIQUE(country_id, resource_type),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. GLOBAL MARKET PRICES
CREATE TABLE IF NOT EXISTS market_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type VARCHAR(50) NOT NULL UNIQUE,
    price_per_unit FLOAT NOT NULL,
    supply INT DEFAULT 0,
    demand INT DEFAULT 0,
    volatility FLOAT DEFAULT 0.02,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- 7. MARKET ORDERS (PUBLIC)
CREATE TABLE IF NOT EXISTS market_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    unit_price FLOAT NOT NULL,
    order_type VARCHAR(10) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. TRADE CONTRACTS (PRIVATE)
CREATE TABLE IF NOT EXISTS trade_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    buyer_country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    price_per_unit FLOAT NOT NULL,
    total_price INT NOT NULL,
    delivery_region_id UUID REFERENCES regions(id),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    delivery_date TIMESTAMP
);

-- 9. DRONES
CREATE TABLE IF NOT EXISTS drones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'ready',
    target_region_id UUID REFERENCES regions(id),
    target_type VARCHAR(50),
    damage INT DEFAULT 50,
    launched_at TIMESTAMP,
    hit_at TIMESTAMP
);

-- 10. BATTLE LOG
CREATE TABLE IF NOT EXISTS battle_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attacker_country_id UUID NOT NULL REFERENCES countries(id),
    defender_country_id UUID NOT NULL REFERENCES countries(id),
    attacked_region_id UUID NOT NULL REFERENCES regions(id),
    battle_type VARCHAR(50),
    attacker_losses INT DEFAULT 0,
    defender_losses INT DEFAULT 0,
    outcome VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 11. ALLIANCES
CREATE TABLE IF NOT EXISTS alliances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alliance_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alliance_id UUID NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(alliance_id, country_id)
);

-- 12. CHATS
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    chat_type VARCHAR(50) NOT NULL,
    alliance_id UUID REFERENCES alliances(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_regions_country ON regions(country_id);
CREATE INDEX IF NOT EXISTS idx_buildings_region ON buildings(region_id);
CREATE INDEX IF NOT EXISTS idx_drones_country ON drones(country_id);
CREATE INDEX IF NOT EXISTS idx_market_orders_resource ON market_orders(resource_type);
CREATE INDEX IF NOT EXISTS idx_trade_contracts_seller ON trade_contracts(seller_country_id);
CREATE INDEX IF NOT EXISTS idx_battle_log_time ON battle_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON chat_messages(chat_id);

-- Initialize market prices
INSERT INTO market_prices (resource_type, price_per_unit, volatility) VALUES
('fuel', 100.0, 0.02),
('metal', 80.0, 0.025),
('food', 50.0, 0.015),
('budget', 1.0, 0.0)
ON CONFLICT (resource_type) DO NOTHING;

-- Initialize global chat
INSERT INTO chats (name, chat_type) VALUES ('Global Chat', 'global')
ON CONFLICT DO NOTHING;
