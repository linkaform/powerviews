#!/bin/sh


# creates main powerviews_admin user, then creates main powerviews database with
# that user as owner
SUPERUSER=postgres
db=powerviews
adminuser=powerviews_admin

createuser -U $SUPERUSER -r $adminuser
createdb -U $SUPERUSER -O $adminuser $db
psql -f/dev/stdin -U $SUPERUSER $db <<SQL
	-- prevent users from creating public objects
	REVOKE CREATE ON SCHEMA public FROM PUBLIC;
	-- create exclusive schema for adminuser
	CREATE SCHEMA IF NOT EXISTS $adminuser AUTHORIZATION $adminuser;
	-- prevent adminuser for creating public objects
	ALTER ROLE $adminuser IN DATABASE $db SET search_path = '\$user';
	-- we don't use privilege inheritance, but we require a method to group
	-- powerviews postgresql users
	CREATE ROLE powerviews_users NOINHERIT;
	-- create objects as powerviews_admin user
	SET ROLE powerviews_admin;
	-- install powerviews functions
	\i ../sql/createpview.sql
SQL
