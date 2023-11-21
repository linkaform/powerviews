#!/bin/sh


# creates main powerviews_admin user, then creates main powerviews database with
# that user as owner

echo "host    powerviews     +powerviews_users        0.0.0.0/0       md5" >> /var/lib/postgresql/data/pg_hba.conf
echo "host    powerviews      powerviews_admin        172.13.0.0/16   md5" >> /var/lib/postgresql/data/pg_hba.conf
