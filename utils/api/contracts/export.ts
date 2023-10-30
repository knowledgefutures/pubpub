import { AppRoute } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { exportFormatsArray } from 'utils/export/formats';

extendZodWithOpenApi(z);

export const exportRoute = {
	path: '/api/export',
	method: 'POST',
	summary: 'Export a pub',
	description:
		"Export a pub to a file. Returns the export task's status. \n\nRequires authentication for unreleased pubs.",
	body: z.object({
		accessHash: z.string().nullish(),
		format: z.enum(exportFormatsArray),
		historyKey: z.number().int().min(-1).default(0).openapi({
			description:
				'Which revision of the pub to export. Always tries to find the latest one, no real use for passing a value here unless you know of all the revisions.',
		}),
		pubId: z.string().uuid().openapi({
			description: 'The id of the pub to export.',
		}),
		communityId: z.string().uuid(),
	}),
	responses: {
		201: z
			.object({
				taskId: z.string().uuid().openapi({
					description: 'The id of the export task, if no existing export already exists.',
				}),
			})
			.openapi({
				title: 'Uncached export',
			})
			.or(
				z
					.object({
						url: z.string().url().openapi({
							description: 'The url of the already existing export.',
						}),
					})
					.openapi({
						title: 'Export is cached',
					}),
			),
	},
} satisfies AppRoute;
