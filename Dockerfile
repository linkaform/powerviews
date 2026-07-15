FROM debian:trixie AS develop
LABEL org.opencontainers.image.authors="Linkaform"

RUN apt-get update && \
    apt-get install -y \
      curl \
      nodejs \
      npm \
      vim \
      wget \
    && rm -fr /var/lib/apt/lists/*

WORKDIR /srv/powerviews

###################################################
#Copys all files to the container
###################################################
FROM develop AS production

COPY --chown=www-data:www-data ./ /srv/powerviews/
