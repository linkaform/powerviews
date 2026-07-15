#!/bin/bash

echo "command" $1
if [[ $(hostname) == "powerviews" || $1 == "powerviews" ]]; then
    echo "hostname: " $(hostname)
    echo "starting PowerViews API ...."
    cd  /srv/powerviews/
elif [[ $(hostname) == "powerengine" || $1 == "powerengine" ]]; then
    echo "hostname: " $(hostname)
    echo "starting PowerViews Engine ...."
    cd  /srv/powerviews/utils
    #node sync_db.js
    cd  /srv/powerviews/engine

fi
echo "Current Directory is" $(pwd)
echo "Checking for config file..."
echo "whoami" $(whoami)
CONFFILE=/srv/powerviews/config/config.json
SECRETCONF=/run/secrets/config.json
STAROK=false
if [ -f "$SECRETCONF" ]; then
    cp   $SECRETCONF /srv/powerviews/config/config.json
fi
if [ -f "$CONFFILE" ]; then
    echo "$CONFFILE exists."
    STARTOK=true
else
    echo "$CONFFILE NOT found exists."
    echo "searching file as a docker swarm secret."
    if [ -f "$SECRETCONF" ]; then
        cp  $SECRETCONF /srv/powerviews/config/config.json
        STARTOK=true
    else
        echo $SECRETCONF "file not found, please check the config files exists."
    fi
fi


if [ $STARTOK ]; then
    echo "===== starting...."
    npm start
else
    echo "App will not start... :("
fi
