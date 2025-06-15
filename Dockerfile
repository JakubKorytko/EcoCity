FROM node:22-slim

RUN apt update && apt install -y sqlite3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY piglet ./piglet
COPY pig.mjs ./pig.mjs
COPY Pig.html ./Pig.html
COPY src ./src
COPY server ./server

CMD ["node", "pig.mjs"]
EXPOSE 2137
