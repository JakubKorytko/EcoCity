FROM node:22-slim

RUN apt update && apt install -y sqlite3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .
CMD ["node", "pig.mjs"]
EXPOSE 2137
