import { Router } from 'express';
import { handleChatQuery, chatQuerySchema } from '../controllers/chat.controller';
import { validateRequest } from '../middlewares/validate.middleware';

const router = Router();

router.post('/query', validateRequest(chatQuerySchema), handleChatQuery);

export default router;
