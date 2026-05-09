import express from 'express';
const router = express.Router();
import exchangeInstaOauthCode from '../controllers/instaOauth.controller';

// POST /insta-oauth/token
router.post('/token', exchangeInstaOauthCode);

export default router;