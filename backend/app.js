const express = require('express');
const { connectDB } = require('./mongodb.js');

const app = express();

app.use(express.json());

const startServer = async () => {
  await connectDB();

  app.listen(8080, () => {
    console.log("Server running on port 8080");
  });
};

startServer();