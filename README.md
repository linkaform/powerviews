# Powerviews

Repository for powerviews REST API and engine, there are two executables used,
they are in the same repository due to a large code sharing (easier to keep in
sync).

# Architecture overview

## REST API

It duties include bookeeping of accounts, queries and postgresql users.
It generates the list of work that the engine will do, this don't has access
to LKF api nor to LKF mongodb server

## Engine

Polls postgresql database often to get list of work to do and executes it

# To start services

## Start powerviews REST API server

### Setup configuration files

Default configuration files are on docker/envs and docker/secrets, you must
create a copy of this file without .example suffix and replace the placeholders
with valid values:

```
cp docker/envs/powerengine.env.example docker/envs/powerengine.env
cp docker/envs/powerviews_pg.env.example docker/envs/powerviews_pg.env
cp docker/secrets/config.json.example docker/secrets/config.json
cp docker/secrets/linkaform.com.key.example docker/secrets/linkaform.com.key

# edit new files with proper values
```

# Instructions for usage with docker (recommended)

## Start postgres

```
docker compose up postgres
```
## Populate database schema

```
docker compose run --rm --build powerengine node ./utils/sync_db.js
```

## Start remaining services

```
docker compose up
```

## Ready for serving requests

# Instruction for restoring a database backup

## Start postgres for restore
```
env FOR_RESTORE=1 docker compose up postgres
```

## Restore backup

For a backup generated with: `pg_dumpall -U postgres`

Assuming your database backup is located at `~/tmp/powerviews.pgdumpall`
and your postgres container started in previous step is `powerviews-postgres-1`

```
# ignoring the "CREATE ROLE postgres" statements allows us to use ON_ERROR_STOP=1
cat ~/tmp/powerviews.pgdumpall | \
    grep -Ev '^CREATE ROLE postgres' | \
    docker exec -i powerviews-postgres-1 psql -U postgres --set ON_ERROR_STOP=1 -f- || echo ERROR
```
## No need to populate db schema (as its populated from the backup)

## Start remaining services

```
docker compose up
```

# XXX Instructions for usage without docker (not recommended)

### Install node.js dependencies:

```
npm install
```

### Setup powerviews database
To start the powerviews REST API server, you need first to setup postgresql.

#### Create postgresql cluster

In case you need to create a postgresql cluster in localhost by hand you can
make:

```
initdb -U postgres -D pg -E UTF-8
postgres -D pg
```

#### Populate cluster skeleton

To create postgresql database, database user and populate empty schema; there's
a helper for that:

```
(cd pg_utils && sh ./setup_pg.sh)
```

#### Populate database schema

```
node ./utils/sync_db.js
```

Then start api server:
```
npm start
```

## Start powerviews engine
To run the powerviews engine, you need to configure some environment variables (fill them with real values) and run:

```
cd engine && env LKFPOWERVIEWSENGINEMONGOURL="mongodb://user:pass@host:port/admin" LKFPOWERVIEWSENGINECOUCHURL="https://admin:PASSWORD@couchdb.linkaform.com" npm start
```

To view the Swagger UI interface for the REST API:

```
open http://localhost:8080/docs
```
