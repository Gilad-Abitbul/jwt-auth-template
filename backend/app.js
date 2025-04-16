const express = require('express');
const { connectDB } = require('./mongodb.js');
const authenticationRoutes = require('./routes/v1/authentication.js');
const errorHandler = require('./middleware/error.js');
const redisClient = require('./utils/redisClient.js');

const app = express();

app.use(express.json());
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