#!/bin/bash
set -e

# This script ensures the omnipath database and user exist
# It's idempotent - safe to run multiple times

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    -- Create omnipathuser if it doesn't exist
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'omnipathuser') THEN
            CREATE USER omnipathuser WITH PASSWORD 'omnipath123';
        END IF;
    END
    \$\$;
    
    -- Create omnipath database if it doesn't exist
    SELECT 'CREATE DATABASE omnipath'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'omnipath')\gexec
    
    -- Grant privileges to omnipathuser
    GRANT ALL PRIVILEGES ON DATABASE omnipath TO omnipathuser;
EOSQL