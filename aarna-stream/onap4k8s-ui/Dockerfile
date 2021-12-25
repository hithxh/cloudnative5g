# => Build container
FROM node:alpine as builder
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY src ./src
COPY public ./public
# => Pass the reuired version
RUN REACT_APP_VERSION=v2.2 REACT_APP_PRODUCT=AMCOP npm run build

# => Run container
FROM nginx:1.15.2-alpine

# Nginx config
COPY default.conf /etc/nginx/conf.d/

# Static build
COPY --from=builder /app/build /usr/share/nginx/html/

# Default port exposure
EXPOSE 80
