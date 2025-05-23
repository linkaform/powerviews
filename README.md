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

### Setup configuration file

Default configuration file is on config/config.default.json, you must create a
copy of this file replacing the placeholders with valid values and set it up to
the proper path config/config.json; config/config.json file is ignored in
repository:

```
cp config/config.default.json config/config.json
vim config/config.json
```

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
