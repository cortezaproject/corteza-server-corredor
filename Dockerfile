FROM node:12.14-alpine

# Create app directory
WORKDIR /corredor

RUN apk add --no-cache \
    git \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

# Install app & support §&files
COPY *.json *.js yarn.lock LICENSE README.adoc ./

RUN yarn install --production --non-interactive --no-progress --emoji false

# Copy the app (so that yarn install can be cached)
COPY src ./src

# GRPC's env-vars
# https://github.com/grpc/grpc/blob/master/doc/environment_variables.md
ENV GRPC_VERBOSITY=ERROR

# Set Corredor's default ENV values
ENV CORREDOR_ENVIRONMENT=prod
ENV CORREDOR_ADDR=0.0.0.0:80
ENV CORREDOR_SERVER_CERTIFICATES_ENABLED=false
ENV CORREDOR_SCRIPTS_AUTO_UPDATE_DEPENDENCIES=false
ENV CORREDOR_LOG_PRETTY=true


# Client & server scripts location
RUN mkdir -p /corredor/usr/src/client /corredor/usr/src/server
VOLUME /corredor/usr

# TLS certificates should be placed here if TSL certs are enabled
VOLUME /corredor/certs

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/yarn"]
CMD [ "serve"]
