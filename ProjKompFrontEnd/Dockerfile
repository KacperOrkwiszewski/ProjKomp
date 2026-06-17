# node configuration
FROM node:24-alpine3.22 AS node-build
# set dir to app
WORKDIR /app
# copy config files
COPY package*.json .
COPY tsconfig.json .
# install dependencies, ci = dont update package
RUN npm ci
# copy all files to container
COPY . .
# build the app in the container
RUN npm run build

# nginx configuration
FROM nginx:1.31.1-alpine
# copy nginx config and build files from node container
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=node-build /app/dist /usr/share/nginx/html 
# ngix runs on port 80
EXPOSE 80
# start nginx (runtime)
CMD ["nginx", "-g", "daemon off;"]