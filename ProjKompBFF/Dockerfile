# node configuration
FROM node:24-alpine3.22 AS node-build
# set dir to app
WORKDIR /app
# copy config files
COPY package*.json .
# install dependencies, ci = dont update package
RUN npm ci
# copy all files to container
COPY . .
# expose port for backend
EXPOSE 3001
# start the app (runtime)
CMD ["npm", "start"]
