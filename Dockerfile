FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY index.js ./
COPY schedule ./
EXPOSE 8080
CMD ["npm", "start"]