#!/bin/sh

# this file may be sourced, prevent environment from propagating
(
err(){ echo "$0: $@" >&2; exit 1; }

set -x
# creates main powerviews_admin user, then creates main powerviews database with
# that user as owner
SUPERUSER=${POSTGRES_USER:-postgres}
db=${POWERVIEWS_DATABASE:-powerviews}
adminuser=${POWERVIEWS_ADMINUSER:-powerviews_admin}
adminuserpassword=${POWERVIEWS_ADMINUSER_PASSWORD:-}
_adminuserpasswordsql=
if test "$adminuserpassword"; then
	# password must not contain single quotes
	expr "$adminuserpassword" : "[^']\{1,\}\$" >/dev/null || err invalid password for ${adminuser}
	_adminuserpasswordsql="ALTER ROLE $adminuser WITH PASSWORD '${adminuserpassword}'"
fi

createuser -U $SUPERUSER -r $adminuser
createdb -U $SUPERUSER -O $adminuser $db
psql -f/dev/stdin -U $SUPERUSER $db <<SQL
	-- prevent users from creating public objects
	REVOKE CREATE ON SCHEMA public FROM PUBLIC;
	-- create exclusive schema for adminuser
	CREATE SCHEMA IF NOT EXISTS $adminuser AUTHORIZATION $adminuser;
	-- prevent adminuser for creating public objects
	ALTER ROLE $adminuser IN DATABASE $db SET search_path = '\$user';
	-- sets password in case theres one set up
	${_adminuserpasswordsql}
	-- we don't use privilege inheritance, but we require a method to group
	-- powerviews postgresql users
	CREATE ROLE powerviews_users NOINHERIT;
	-- create objects as powerviews_admin user
	SET ROLE powerviews_admin;
	-- install powerviews functions
	-- this command must run in this context
	\i ${POWERVIEWS_INIT_SQLDIR:-../sql}/createpview.sql
SQL
)
