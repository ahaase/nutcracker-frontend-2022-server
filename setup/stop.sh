#!/bin/bash
echo "Stopping Postgres"
if docker stop postgresqlVello > /dev/null; then
    docker rm postgresqlVello > /dev/null
fi
echo "Done."
