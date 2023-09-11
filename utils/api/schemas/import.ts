import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';

extendZodWithOpenApi(z);

export const documentLabels = [
	'preamble',
	'document',
	'bibliography',
	'supplement',
	'metadata',
] as const;

export const sourceFileSchema = z.object({
	id: z.number().int().nonnegative(),
	state: z.string().default('complete'),
	clientPath: z.string(),
	loaded: z.number(),
	total: z.number(),
	label: z.enum(documentLabels).optional().openapi({
		description: 'What kind of document this is',
	}),
	assetKey: z.string().openapi({
		description: 'The key of the asset in AWS',
	}),
});

export const importerFlagNames = [
	'extractEndnotes',
	'keepStraightQuotes',
	'skipJatsBibExtraction',
] as const;

export const importerFlagsSchema = z.object({
	extractEndnotes: z.boolean()?.optional(),
	keepStraightQuotes: z.boolean().optional(),
	skipJatsBibExtraction: z.boolean().optional(),
});
