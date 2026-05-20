FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
RUN npm run build

EXPOSE 8080

# run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]