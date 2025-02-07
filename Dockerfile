FROM node:18-alpine  
WORKDIR /app  
COPY package.json package-lock.json ./  
RUN npm install  
COPY . .  
CMD ["node", "server.js"]  
EXPOSE 3000
