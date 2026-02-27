#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE keycloak;
    CREATE DATABASE auth_db;
    CREATE DATABASE auction_db;
    CREATE DATABASE bidding_db;
    CREATE DATABASE admin_db;
    GRANT ALL PRIVILEGES ON DATABASE keycloak TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE auth_db TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE auction_db TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE bidding_db TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE admin_db TO postgres;
EOSQL
