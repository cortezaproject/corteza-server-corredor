FROM node:12.7-alpine

# Create app directory
WORKDIR /corredor

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN yarn --production --emoji false

# Copy application source files
COPY src ./src

# GRPC's env-vars
# https://github.com/grpc/grpc/blob/master/doc/environment_variables.md
ENV GRPC_VERBOSITY=ERROR

# Set Corredor's default ENV values
ENV ENVIRONMENT=prod
ENV ADDR=0.0.0.0:80

EXPOSE 80
CMD [ "node", "-r", "esm", "src/main.js"]
