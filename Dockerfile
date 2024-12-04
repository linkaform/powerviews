# Stage 1: The development stage:

#FROM debian:stretch AS develop
FROM debian:bullseye AS develop


MAINTAINER LinkaForm

RUN apt-get update && \
    apt-get install -y \
      vim \
      curl \
      wget


#RUN  curl -sL https://deb.nodesource.com/setup_16.x |   bash -
#install node

RUN  apt-get install -y ca-certificates curl gnupg
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

ENV NODE_MAJOR=16

RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

RUN apt-get update
RUN apt-get install nodejs -y


#RUN apt-get update && \
#    apt-get install -y \
#    build-essential nodejs

WORKDIR /srv/powerviews

###################################################
#Copys all files to the container
###################################################

FROM develop AS production

COPY --chown=www-data:www-data ./ /srv/powerviews/
RUN rm -f /srv/powerviews/config/config.json
