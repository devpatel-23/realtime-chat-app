import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateLoginBody } from '../middleware/validation.middleware.js';

const router = Router();

router.post('/login', validateLoginBody, AuthController.login);

export default router;
