import express, { Request, Response, NextFunction } from 'express';
import { connectDB } from './mongodb';
import authenticationRoutes from './routes/v1/auth.routes';
import postsRoutes from './routes/v1/post.routes';
import errorHandler from './middlewares/errorHandler';

const app = express();

app.use(express.json());

app.use((request: Request, response: Response, next: NextFunction) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/api/v1', authenticationRoutes);
app.use('/api/v1', postsRoutes);

app.use(errorHandler);

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(8080, async () => {
    console.log("Server running on port 8080");
  });
};

startServer();
