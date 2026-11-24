import { Router } from 'express';
import { getFeed } from '../controllers/feed.controller.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', optionalAuthenticate, getFeed);

export default router;

