#!/bin/bash

powerviewsdir=${POWERVIEWSDIR:-/srv/powerviews}
confdest=${POWERVIEWSCONFIG:-$powerviewsdir/config/config.json}
conforig=${POWERVIEWSCONFIGSECRET:-/run/secrets/config.json}
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

command="${1:?$prog: command required}"
echo "$prog: command:" "$command"
case "$command" in
	powerviews) 
		echo $prog: starting $command
		(
			set -x
			cd $powerviewsdir &&
			checkconf &&
			npm start
		)
		;;
	powerengine)
		echo $prog: starting $command
		(cd $powerviewsdir/engine)
		(
			set -x
			cd $powerviewsdir/engine && # powerengine don't requires the conf file, only env variables
			checkconf &&
			npm start
		)
		;;
	*) err unknown command $command;;
esac
