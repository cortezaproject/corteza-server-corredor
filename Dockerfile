FROM node:12.14-alpine

# Create app directory
WORKDIR /corredor

RUN apk add --no-cache git

# Install app & support §&files
COPY *.json *.js yarn.lock LICENSE README.md ./

RUN yarn install --production --non-interactive --no-progress --emoji false

# Copy the app (so that yarn install can be cached)
COPY src ./src

# GRPC's env-vars
# https://github.com/grpc/grpc/blob/master/doc/environment_variables.md
ENV GRPC_VERBOSITY=ERROR

# Set Corredor's default ENV values
ENV ENVIRONMENT=prod
ENV ADDR=0.0.0.0:80

# User scripts
VOLUME /corredor/usr
VOLUME /corredor/certs

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/yarn"]
CMD [ "serve"]
