import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { createCustomScriptSchema, customScriptSchema } from '../schemas/customScript';

extendZodWithOpenApi(z);

const c = initContract();

export const customScriptContract = c.router({
	set: {
		path: '/api/customScripts',
		method: 'POST',
		summary: 'Set a custom script',
		description:
			'Set a custom scripts, e.g. the CSS or JS (if you have access) for this community',
		body: createCustomScriptSchema,
		responses: {
			200: customScriptSchema,
		},
	},
});
