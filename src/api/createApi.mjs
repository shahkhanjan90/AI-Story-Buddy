import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createStoryRouter } from './routes/storyRoutes.mjs';

export function createApi() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(createStoryRouter());

  return app;
}
