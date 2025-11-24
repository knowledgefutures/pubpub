import type { AppRouter } from '@ts-rest/core';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { exportFormatsArray } from 'utils/export/formats';

import { createImportTaskSchema } from '../schemas/import';

extendZodWithOpenApi(z);

export const workerTaskRouter = {
	/**
	 * `GET /api/workerTasks`
	 *
	 * Get the status of a worker task. This is used to poll for the status of a worker task, such
	 * as an import or export.
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-workerTasks/get}
	 */
	get: {
		path: '/api/workerTasks',
		method: 'GET',
		summary: 'Get a worker task',
		description:
			'Get the status of a worker task. This is used to poll for the status of a worker task, such as an import or export.',
		query: z.object({
			workerTaskId: z.string().uuid(),
		}),
		responses: {
			201: z.object({
				id: z.string().uuid(),
				isProcessing: z.boolean().nullable(),
				error: z.any().nullable(),
				output: z.any().nullable(),
			}),
			404: z.object({
				error: z.literal('WorkerTask not found'),
			}),
		},
		metadata: {},
	},
	/**
	 * `POST /api/import`
	 *
	 * Import files to a pub.
	 *
	 * This requires you to first upload the files using `/api/upload`, create a Pub using `POST
	 * /api/pubs`, then create an import task using this endpoint, and then ping
	 * `/api/workerTasks?workerTaskId={UUID}` to check the status of the import.
	 *
	 * It's much easier to use `/api/pubs/text/import` or `/api/pubs/{pubId}/text/import` instead to
	 * import and create a Pub or just import to a Pub respectively. You can directly upload files
	 * to these endpoints, do not need to poll the status of the import, and, if you are importing
	 * to a Pub, you can determine whether the imported files should be added to the existing Pub or
	 * replace the existing Pub's content.
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-import/post}
	 */
	createImport: {
		path: '/api/import',
		method: 'POST',
		summary: 'Import files to a pub',
		description: `Import files to a pub.

	This requires you to first upload the files using \`/api/upload\`, create a Pub using \`POST /api/pubs\`, then create an import task using this endpoint, and then ping \`/api/workerTasks?workerTaskId={UUID}\` to check the status of the import.

	It's much easier to use \`/api/pubs/text/import\` or \`/api/pubs/{pubId}/text/import\` instead to import and create a Pub or just import to a Pub respectively. 
	You can directly upload files to these endpoints, do not need to poll the status of the import, and, if you are importing to a Pub, you can determine whether the imported files should be added to the existing Pub or replace the existing Pub's content.`,
		body: createImportTaskSchema,
		responses: {
			201: z.string().uuid().openapi({
				description:
					"The UUID of the workerTask. You can ping '/api/workerTasks?workerTaskId={UUID}' to check the status of the import.",
			}),
			500: z.string(),
		},
	},

	/**
	 * `POST /api/export`
	 *
	 * Export a pub to a file. Returns the export task's status.
	 *
	 * Requires authentication for unreleased pubs.
	 *
	 * This returns an id of an export task. You will have to poll the status of the task to see if
	 * it is complete.
	 *
	 * Alternatively, the SDK has a helper function that will poll the status for you, see the
	 * `exportPub` in `@pubpub/sdk`.
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-export/post}
	 */
	createExport: {
		path: '/api/export',
		method: 'POST',
		summary: 'Export a pub',
		description: `Export a pub to a file. Returns the export task's status. 
		
		Requires authentication for unreleased pubs.
		
		This returns an id of an export task. You will have to poll the status of the task to see if it is complete.
		
		Alternatively, the SDK has a helper function that will poll the status for you, see the \`exportPub\` in \`@pubpub/sdk\`.`,
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
						description:
							'The id of the export task, if no existing export already exists.',
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
	},
} as const satisfies AppRouter;

type WorkerTaskRouterType = typeof workerTaskRouter;

export interface WorkerTaskRouter extends WorkerTaskRouterType {}
