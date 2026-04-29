# be warned this was made using gemini by BestSpark687090. I have docker experience and I was lazy, so i just got an ai to make it tbh. This looks good to me tho!
# Use the official Node.js Alpine image for a smaller footprint
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first 
# (This allows Docker to cache your dependencies)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the port your app runs on (change 8080 if necessary)
EXPOSE 8080

# Start the application
CMD ["node", "src/index.js"]
