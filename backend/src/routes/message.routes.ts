import { Router } from 'express';
import { MessageController } from '../controllers/message.controller.js';
import { validateMessageBody } from '../middleware/validation.middleware.js';

const router = Router();

router.post('/', validateMessageBody, MessageController.create);
router.get('/', MessageController.list);

export default router;
