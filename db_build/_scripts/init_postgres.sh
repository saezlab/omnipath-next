#!/bin/bash
set -e

# This script ensures the omnipath database exists
# It's idempotent - safe to run multiple times

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE omnipath'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'omnipath')\gexec
EOSQL