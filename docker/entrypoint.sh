#!/bin/bash

powerviewsdir=/srv/powerviews
confdest=$powerviewsdir/config/config.json
conforig=/run/secrets/config.json
prog=`basename "$0"` || exit 1
err(){
	echo "$prog: $@" >&2
	exit 1
}

checkconf(){
	cp "$conforig" "$confdest" || err cannot cp config file "$conforig" to "$confdest"
}

# send all output to stderr
exec >&2

command="${1:?command required}"
echo "command" "$command" >&2
case "$command" in
	powerviews) 
		echo starting $command
		(
			set -x
			cd $powerviewsdir &&
			checkconf &&
			npm start
		)
		;;
	powerengine)
		echo starting $command
		(cd $powerviewsdir/engine)
		(
			set -x
			cd $powerviewsdir/engine && # powerengine don't requires the conf file, only env variables
			npm start
		)
		;;
	*) err unknown command $command;;
esac
