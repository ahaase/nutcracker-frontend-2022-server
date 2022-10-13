#!/bin/bash
psql -U postgres -c "CREATE USER vello WITH ENCRYPTED PASSWORD '$POSTGRES_PASSWORD';"
psql -U postgres -c "CREATE DATABASE vellodb;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE vellodb TO vello;"
psql -U vello vellodb < /src/basic_setup.sql
