# The first stage will
# build the app into /app
FROM node:24-trixie

# RUN apk add --update --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY plugins/* ./plugins/
COPY scripts/* ./scripts/

RUN npm ci

COPY . ./

RUN npm run build

CMD ["npm", "start"]

# Create a second image
# to force-squash the history
# and prevent any tokens
# from leaking out
FROM node:24-trixie
WORKDIR /app

COPY --from=0 /app /app
