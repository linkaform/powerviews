FROM node:8 AS node8
ARG POWERVIEWSDIR=/srv/powerviews
ARG POWERVIEWSUSER=www-data
# copy from arg to env
ENV POWERVIEWSDIR=${POWERVIEWSDIR}

LABEL org.opencontainers.image.authors="Linkaform"
#RUN export DEBIAN_FRONTEND=noninteractive; \
#    apt-get update && \
#    apt-get install -y vim \
#    && rm -fr /var/lib/apt/lists/*

USER ${POWERVIEWSUSER}
WORKDIR /srv/powerviews

#####################
# XXX node-26 fails with: MongoParseError: URI malformed, cannot be parsed
FROM node:24-trixie AS node24
ARG POWERVIEWSDIR=/srv/powerviews
ARG POWERVIEWSUSER=www-data
# copy from arg to env
ENV POWERVIEWSDIR=${POWERVIEWSDIR}

LABEL org.opencontainers.image.authors="Linkaform"
RUN export DEBIAN_FRONTEND=noninteractive; \
    apt update && \
    apt install -y time \
    && rm -fr /var/lib/apt/lists/*

USER ${POWERVIEWSUSER}
WORKDIR /srv/powerviews

#####################
# XXX api is stuck at node-8 due to the next error:
# {"message":"request should have required property 'headers'","errors":[{"path":".headers","message":"should have required property 'headers'","errorCode":"required.openapi.validation"}]}
FROM node8 AS api

ARG POWERVIEWSCONFIGSECRET=/run/secrets/config.json
ARG POWERVIEWSCONFIG=${POWERVIEWSDIR}/config/config.json
COPY --chown=$POWERVIEWSUSER:$POWERVIEWSUSER ./ ${POWERVIEWSDIR}
WORKDIR ${POWERVIEWSDIR}
ENV HOME=${POWERVIEWSDIR}
ENV POWERVIEWSCONFIG=${POWERVIEWSCONFIG}
RUN npm install
ENTRYPOINT [ "/srv/powerviews/docker/entrypoint.sh" ]
CMD [ "powerviews" ]

#####################
# engine requires that modules in api dir are installed
FROM node24 AS engine

ARG POWERVIEWSCONFIGSECRET=/run/secrets/config.json
ARG POWERVIEWSCONFIG=${POWERVIEWSDIR}/config/config.json
WORKDIR ${POWERVIEWSDIR}
RUN mkdir engine
# special dance to speedup: only do again npm install if package*.json files changed
COPY --chown=$POWERVIEWSUSER:$POWERVIEWSUSER ./package*.json ./
COPY --chown=$POWERVIEWSUSER:$POWERVIEWSUSER ./engine/package*.json ./engine
ENV HOME=${POWERVIEWSDIR}
ENV POWERVIEWSCONFIG=${POWERVIEWSCONFIG}
RUN npm install

WORKDIR ${POWERVIEWSDIR}/engine
ENV HOME=${POWERVIEWSDIR}/engine
RUN (cd .. && npm install) && npm install

COPY --chown=$POWERVIEWSUSER:$POWERVIEWSUSER --exclude=package*.json ./ ${POWERVIEWSDIR}
ENTRYPOINT [ "/srv/powerviews/docker/entrypoint.sh" ]
CMD [ "powerengine" ]
