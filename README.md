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

To start the powerviews REST API server, you need first to create postgresql
database, database user and populate empty schema; there's a helper for that:

```
sh ./utils/setup_pg.sh
```

Then start api server:
```
npm start
```

To run the powerviews engine, you need to configure some environment variables (fill them with real values) and run:

```
cd engine && env LKFPOWERVIEWSENGINELOGINUSER="example@info-sync.com" LKFPOWERVIEWSENGINELOGINPASS=yoursecretpass LKFPOWERVIEWSENGINEMONGOURL="mongodb://user:pass@host:port/admin" npm start
```

To view the Swagger UI interface for the REST API:

```
open http://localhost:8080/docs
```
