FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY index.js ./
COPY schedule.json ./
EXPOSE 8080
CMD ["npm", "start"]