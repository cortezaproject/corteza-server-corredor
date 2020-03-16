FROM node:12.14-alpine AS build

# Create app directory
WORKDIR /corredor

RUN apk add --no-cache \
    git \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    curl

# Install app & support §&files
COPY *.json *.js yarn.lock LICENSE README.adoc /corredor/

RUN cd /corredor && yarn install --production --non-interactive --no-progress --emoji false

# Copy the app (so that yarn install can be cached)
COPY ./src /corredor/src/
COPY ./scripts /corredor/scripts/

# Get ready
RUN mkdir -p /corredor/usr /corredor/corteza-ext /corredor/usr \
 && ls /corredor/scripts \
 && BRANCH=develop sh /corredor/scripts/extensions.sh \
 && yarn build

FROM node:12.14-alpine

COPY --from=build /corredor /

WORKDIR /corredor

########################################################################################################################

# GRPC's env-vars
# https://github.com/grpc/grpc/blob/master/doc/environment_variables.md
ENV GRPC_VERBOSITY=ERROR

# Set Corredor's default ENV values
ENV CORREDOR_ENVIRONMENT=prod
ENV CORREDOR_LOG_PRETTY=false
ENV CORREDOR_LOG_LEVEL=info
ENV CORREDOR_LOG_ENABLED=true

ENV CORREDOR_ADDR=0.0.0.0:80

ENV CORREDOR_SERVER_CERTIFICATES_ENABLED=false

ENV CORREDOR_SCRIPTS_AUTO_UPDATE_DEPENDENCIES=false
ENV CORREDOR_EXT_SERVER_SCRIPTS_WATCH=false
ENV CORREDOR_EXT_CLIENT_SCRIPTS_WATCH=false

ENV CORREDOR_EXT_SEARCH_PATHS=/corredor/corteza-ext/*:/corredor/usr/*:/corredor/usr

########################################################################################################################

# Client & server scripts location for user scripts & extensions
VOLUME /corredor/usr

# TLS certificates should be placed here if CORREDOR_SERVER_CERTIFICATES_ENABLED
VOLUME /corredor/certs

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/yarn"]
CMD ["serve"]
