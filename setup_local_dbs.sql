-- Save this file as setup_local_dbs.sql in your project root
-- Run with: psql -U postgres -f setup_local_dbs.sql

-- Create databases
CREATE DATABASE auth_db;
CREATE DATABASE auction_db;
CREATE DATABASE bidding_db;
CREATE DATABASE admin_db;

-- Keycloak usually needs its own DB if running locally, or it uses the container one.
-- If you plan to run Keycloak locally:
CREATE DATABASE keycloak;

-- Grant privileges (optional if you are superuser, but good practice)
GRANT ALL PRIVILEGES ON DATABASE auth_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE auction_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE bidding_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE admin_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO postgres;
