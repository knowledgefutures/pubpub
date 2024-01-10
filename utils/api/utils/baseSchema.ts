import { z } from 'zod';

export const baseSchema = z.object({
	// optional, because otherwise this becomes too complicated to use
	createdAt: z.string().datetime().optional(),
	updatedAt: z.string().datetime().optional(),
	id: z.string().uuid(),
});
