import express from 'express';
const router = express.Router();
import exchangeMetaOauthCode from '../controllers/metaOauth.controller';

// POST /meta-oauth/token
router.post('/token', exchangeMetaOauthCode);

export default router;