import { Router, type Router as ExpressRouter } from 'express';

import { getHealth } from '../controllers/healthController.js';

const router: ExpressRouter = Router();

router.get('/', getHealth);

export default router;
