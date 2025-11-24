import { Router } from 'express';

import { router as pubRouter } from './pub/api';
import { router as threadRouter } from './thread/api';

export const userSubscriptionRouter = Router().use(pubRouter).use(threadRouter);
