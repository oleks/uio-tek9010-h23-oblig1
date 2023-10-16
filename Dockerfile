FROM node:20-alpine

WORKDIR /app

COPY src/package*.json ./

RUN npm install

# Copy the rest of the application code to the container
#COPY . .

# Build TypeScript code (if needed)
# RUN npm run build

# Expose a port if your application runs a server
# EXPOSE 8080

# Define the command to run your application (e.g., start a development server)
#CMD ["npm", "start"]
