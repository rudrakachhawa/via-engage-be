import express from 'express';
const router = express.Router();
import exchangeInstaOauthCode from '../controllers/instaOauth.controller';
import verifyFirebaseToken from '../middlewares/user.middleware';

// POST /insta-oauth/token
router.post('/token', verifyFirebaseToken, exchangeInstaOauthCode);

export default router;