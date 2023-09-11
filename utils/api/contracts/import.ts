import { AppRoute } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { importerFlagsSchema, sourceFileSchema } from '../schemas/import';

extendZodWithOpenApi(z);

export const importRoute = {
	path: '/api/import',
	method: 'POST',
	summary: 'Import a file to a pub',
	description: 'Import a file to a pub',
	body: z.object({
		sourceFiles: z.array(sourceFileSchema),
		importerFlags: importerFlagsSchema.default({}),
	}),
	responses: {
		201: z.string().uuid().openapi({
			description:
				"The UUID of the workerTask. You can ping '/api/workerTasks?workerTaskId={UUID}' to check the status of the import.",
		}),
		500: z.string(),
	},
} satisfies AppRoute;
