const express = require('express');
const { connectDB } = require('./mongodb.js');
const authenticationRoutes = require('./routes/v1/authentication.js');
const errorHandler = require('./middlewares/error.js');
const redisClient = require('./utils/redisClient.js');

const app = express();

app.use(express.json());

app.use((request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next()
})

app.use('/api/v1', authenticationRoutes);
app.use(errorHandler);
const startServer = async () => {
  await connectDB();

  app.listen(8080, () => {
    console.log("Server running on port 8080");
    redisClient.showAllKeysAndValues();
  });
};


startServer(); 