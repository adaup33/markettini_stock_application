-- dbdiagram.sql
-- SQL DDL for ER diagram: users, watchlists, alerts, alert_triggers, watchlist_snapshots, accounts, sessions

-- Users table (maps to your 'user' collection)
CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,         -- generated or from auth library (string)
  _id CHAR(24),                       -- original ObjectId if desired
  name VARCHAR(200),
  email VARCHAR(200) UNIQUE,
  country VARCHAR(100),
  created_at TIMESTAMP
);

-- Watchlist items
CREATE TABLE watchlists (
  id CHAR(24) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  symbol VARCHAR(16) NOT NULL,
  company VARCHAR(200) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  market_cap_b DOUBLE,
  pe_ratio DOUBLE,
  alert_price DOUBLE,
  UNIQUE(user_id, symbol),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Alerts
CREATE TABLE alerts (
  id CHAR(24) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  symbol VARCHAR(16) NOT NULL,
  operator VARCHAR(4) NOT NULL,
  threshold DOUBLE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_triggered_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Alert triggers / history
CREATE TABLE alert_triggers (
  id CHAR(24) PRIMARY KEY,
  alert_id CHAR(24) NOT NULL,
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  price_at_trigger DOUBLE,
  message TEXT,
  FOREIGN KEY (alert_id) REFERENCES alerts(id)
);

-- Watchlist snapshots (periodic quote captures)
CREATE TABLE watchlist_snapshots (
  id CHAR(24) PRIMARY KEY,
  watchlist_id CHAR(24) NOT NULL,
  captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  price DOUBLE,
  change_amount DOUBLE,
  change_percent DOUBLE,
  FOREIGN KEY (watchlist_id) REFERENCES watchlists(id)
);

-- Accounts (OAuth / provider accounts)
CREATE TABLE accounts (
  id CHAR(24) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  provider_account_id VARCHAR(200) NOT NULL,
  type VARCHAR(50),
  provider_access_token TEXT,
  provider_refresh_token TEXT,
  expires_at TIMESTAMP,
  scope TEXT,
  token_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_account_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sessions (server sessions)
CREATE TABLE sessions (
  id CHAR(24) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

