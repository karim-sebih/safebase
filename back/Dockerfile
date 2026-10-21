FROM node:22-alpine

# Installe mysqldump dans le conteneur du backend
RUN apk add --no-cache mariadb-client

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]