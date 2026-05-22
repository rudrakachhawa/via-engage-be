import express from 'express';
import verifyFirebaseToken from "../middlewares/user.middleware";
import { getUserMedia } from "../controllers/media.controller";
import mediaMiddleware from "../middlewares/media.middleware"
const router = express.Router();

router.get('/', verifyFirebaseToken, mediaMiddleware, getUserMedia); // GET /media

export default router;