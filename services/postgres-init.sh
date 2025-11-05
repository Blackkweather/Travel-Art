#!/bin/bash
set -e

echo "Creating databases for microservices..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create databases for each microservice
    CREATE DATABASE auth_db;
    CREATE DATABASE artist_db;
    CREATE DATABASE hotel_db;
    CREATE DATABASE booking_db;
    CREATE DATABASE payment_db;
    CREATE DATABASE notification_db;
    CREATE DATABASE admin_db;
    
    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE auth_db TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE artist_db TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE hotel_db TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE booking_db TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE payment_db TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE notification_db TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE admin_db TO postgres;
EOSQL

echo "All databases created successfully!"
