# Stage 1: The development stage:

FROM debian:stretch AS develop

MAINTAINER LinkaForm

RUN apt-get update && \
    apt-get install -y \
      vim \
      curl \
      wget

RUN  curl -sL https://deb.nodesource.com/setup_8.x |   bash -

RUN apt-get update && \
    apt-get install -y \
     build-essential nodejs

WORKDIR /srv/powerviews

###################################################
#Copys all files to the container
###################################################

FROM develop AS production

COPY --chown=www-data:www-data ./ /srv/powerviews/
RUN rm -f /srv/powerviews/config/config.json
