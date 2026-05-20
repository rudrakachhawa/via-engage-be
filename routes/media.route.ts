import express from 'express';
import verifyFirebaseToken from "../middlewares/user.middleware";
import { getUserMedia } from "../controllers/media.controller";
import attachInstaUserOauth from "../middlewares/metatoken.middleware";

const router = express.Router();

router.get('/', verifyFirebaseToken, attachInstaUserOauth, getUserMedia); // GET /media

export default router;