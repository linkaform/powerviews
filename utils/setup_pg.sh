#!/bin/sh


# creates main powerviews_admin user, then creates main powerviews database with
# that user as owner
SUPERUSER=postgres
db=powerviews
adminuser=powerviews_admin

createuser -U $SUPERUSER -r $adminuser
createdb -U $SUPERUSER -O $adminuser $db
psql -f/dev/stdin -U $SUPERUSER $db <<SQL
	REVOKE CREATE ON SCHEMA public FROM PUBLIC;
	CREATE SCHEMA IF NOT EXISTS $adminuser AUTHORIZATION $adminuser;
	ALTER ROLE $adminuser IN DATABASE $db SET search_path = '\$user';
	-- used only to group users for easy deletion
	CREATE ROLE powerviews_users NOINHERIT;
SQL
node utils/sync_db.js
