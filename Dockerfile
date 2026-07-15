FROM debian:trixie AS base
ARG POWERVIEWSDIR=/srv/powerviews
ARG POWERVIEWSUSER=www-data
# copy from arg to env
ENV POWERVIEWSDIR=${POWERVIEWSDIR}

LABEL org.opencontainers.image.authors="Linkaform"
RUN export DEBIAN_FRONTEND=noninteractive; \
    apt-get update && \
    apt-get install -y \
      curl \
      nodejs \
      npm \
      vim \
      wget \
    && rm -fr /var/lib/apt/lists/*

USER ${POWERVIEWSUSER}
WORKDIR /srv/powerviews

#####################
FROM base AS api

COPY --chown=$POWERVIEWSUSER:$POWERVIEWSUSER ./ ${POWERVIEWSDIR}
WORKDIR ${POWERVIEWSDIR}
ENV HOME=${POWERVIEWSDIR}
RUN npm install
CMD [ "/srv/powerviews/docker/entrypoint.sh", "powerviews" ]

# engine requires that modules in api dir are installed
FROM api AS engine

WORKDIR ${POWERVIEWSDIR}/engine
ENV HOME=${POWERVIEWSDIR}/engine
RUN npm install
CMD [ "/srv/powerviews/docker/entrypoint.sh", "powerengine" ]
