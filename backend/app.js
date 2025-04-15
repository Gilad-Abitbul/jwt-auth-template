const express = require('express');
const { connectDB } = require('./mongodb.js');
const authenticationRoutes = require('./routes/v1/authentication.js');
const errorHandler = require('./middleware/error.js');
const app = express();
const {sendEmail} = require('./utils/mailer.js')
app.use(express.json());
app.use('/api/v1', authenticationRoutes);
app.use(errorHandler);
const startServer = async () => {
  await connectDB();

  app.listen(8080, () => {
    console.log("Server running on port 8080");
  });
};

startServer();