#!/bin/bash
echo "Starting Postgres"
docker run --name postgresqlVello -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD --memory="128m" -p 5432:5432 -d postgres
echo "Sleeping 1 second"
sleep 1
echo "Copying setup file"
docker exec -it postgresqlVello bash -c 'mkdir src'
docker cp psql_setup.sh postgresqlVello:/src/psql_setup.sh
docker cp basic_setup.sql postgresqlVello:/src/basic_setup.sql
echo "Executing setup file"
docker exec -it postgresqlVello bash -c 'sh /src/psql_setup.sh'
echo "Done."
