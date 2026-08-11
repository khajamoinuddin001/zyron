FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

# Copy the build output to replace the default nginx contents.
COPY --from=build /app/dist /usr/share/nginx/html

# The custom NGINX configuration will be mounted via docker-compose
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
