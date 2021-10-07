FROM node:12.14-alpine

ENV PATH /corredor/node_modules/.bin:$PATH

# GRPC's env-vars
# https://github.com/grpc/grpc/blob/master/doc/environment_variables.md
ENV GRPC_VERBOSITY=ERROR

ENV CORREDOR_ADDR=0.0.0.0:80
ENV CORREDOR_ENVIRONMENT=prod
ENV CORREDOR_LOG_PRETTY=false
ENV CORREDOR_LOG_LEVEL=info
ENV CORREDOR_LOG_ENABLED=true
ENV CORREDOR_SERVER_CERTIFICATES_ENABLED=false
ENV CORREDOR_SCRIPTS_AUTO_UPDATE_DEPENDENCIES=false
ENV CORREDOR_EXT_SERVER_SCRIPTS_WATCH=false
ENV CORREDOR_EXT_CLIENT_SCRIPTS_WATCH=false
ENV CORREDOR_EXT_SEARCH_PATHS=/corredor/usr/*:/corredor/usr
# This assumes that container will be part of the docker-compose setup were corteza is
# ran under "server" service and can be directly accessed via internal docker network
ENV CORREDOR_EXEC_CSERVERS_API_BASEURL_TEMPLATE "http://server/api/{service}"

WORKDIR /corredor

RUN apk update && apk add --no-cache git

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY . ./

# Client & server scripts location for user scripts & extensions
VOLUME /corredor/usr

# TLS certificates should be placed here if CORREDOR_SERVER_CERTIFICATES_ENABLED
VOLUME /corredor/certs

HEALTHCHECK --interval=30s --start-period=1m --timeout=30s --retries=3 CMD nc -z -v localhost 80

CMD ["ts-node", "src/server.ts"]
