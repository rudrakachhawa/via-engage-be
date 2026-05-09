import express from 'express';
import { Request, Response } from 'express-serve-static-core';
const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the API' });
});
export default router;
