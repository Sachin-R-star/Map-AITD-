import { Router } from 'express';
import { handleGetRoute, routeQuerySchema } from '../controllers/navigation.controller';
import { validateRequest } from '../middlewares/validate.middleware';

const router = Router();

router.get('/route', validateRequest(routeQuerySchema), handleGetRoute);

export default router;
