# The first stage will
# build the app into /app
FROM node:14.16.0-alpine3.10
WORKDIR /app

ARG NPM_TOKEN
COPY package*.json ./

RUN npm config set @svt:registry https://svtrepo.jfrog.io/svtrepo/api/npm/svt-npm-virtual \
 && npm config set //svtrepo.jfrog.io/svtrepo/api/npm/:_authToken ${NPM_TOKEN}

RUN npm ci

COPY . ./
RUN npm run build

# Create a second image
# to force-squash the history
# and prevent any tokens
# from leaking out
FROM node:14.16.0-alpine3.10
WORKDIR /app

COPY --from=0 /app /app
CMD ["npm", "start"]
