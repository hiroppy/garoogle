FROM node:10.2.1

WORKDIR /app
COPY . .

RUN npx npm install

# EXPOSE 5000

ENV HOST=0.0.0.0

COPY . /app

ENTRYPOINT ["npx", "npm", "run"]
CMD ["start"]