import express, { Request, Response, NextFunction } from 'express';
import { connectDB } from './mongodb';
import authenticationRoutes from './routes/v1/authentication';
import errorHandler from './middlewares/error';
import redisClient from './utils/redisClient';
import globalRateLimiter from './middlewares/globalRateLimiter';
const app = express();

app.use(globalRateLimiter);

app.use(express.json());

app.use((request: Request, response: Response, next: NextFunction) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/api/v1', authenticationRoutes);

app.use(errorHandler);

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(8080, () => {
    console.log("Server running on port 8080");
    redisClient.showAllKeysAndValues();
  });
};

startServer();
