# The first stage will
# build the app into /app
FROM node:14.16.0-alpine3.10
WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . ./
RUN npm run build

CMD ["npm", "start"]

# Create a second image
# to force-squash the history
# and prevent any tokens
# from leaking out
FROM node:14.16.0-alpine3.10
WORKDIR /app

COPY --from=0 /app /app
