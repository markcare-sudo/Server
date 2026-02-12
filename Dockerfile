FROM node:22-alpine

WORKDIR /app

# install deps first (better caching)
COPY package*.json ./
RUN npm install --include=dev && npm install -g nodemon

# copy source
COPY . .

EXPOSE 3000

# for dev inside docker (nodemon)
CMD ["npm", "run", "dev"]
